import { test } from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, isAbsolute, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  applyPronunciationsPlain,
  buildPronunciationPattern,
  buildSsml,
  buildVoiceTools,
  closeEdgeConnectionPool,
  concatMp3Buffers,
  createSilenceMp3,
  createVoiceStudioBackend,
  embedMp3Chapters,
  extractMarkdownSections,
  formatAssSubtitles,
  formatChaptersMarkdown,
  groupWordCues,
  inspectMp3Buffer,
  isVideoContainerFile,
  resolveConfig,
  resolveEdgeVoiceId,
  splitInlinePauses,
  stripInlinePauses,
  stripMp3MetadataFrame,
  synthesizeSpeech,
  synthesizeSpeechWithMetadata,
  VOICE_STUDIO_API_ROUTE,
} from '../lib/index.js'

const here = dirname(fileURLToPath(import.meta.url))
const repoRoot = join(here, '..')

function makeWorkspace(t, prefix = 'dsh-voice-v010-') {
  const parent = mkdtempSync(join(tmpdir(), prefix))
  const root = join(parent, 'workspace')
  const outside = join(parent, 'outside')
  mkdirSync(root)
  mkdirSync(outside)
  t.after(() => rmSync(parent, { recursive: true, force: true }))
  return { root, outside, exec: { agent: { session: { header: { cwd: root } } } } }
}

/**
 * Construct an MPEG-1 Layer III 128 kbps 44.1 kHz stereo frame (417 bytes, sideInfo = 32 bytes).
 * When tag is 'Xing' or 'Info', writes VBR/CBR metadata header at offset 36 claiming totalFrames.
 */
function makeMpeg1Frame44100(tag = '', totalFrames = 0) {
  const frame = Buffer.alloc(417, 0)
  frame[0] = 0xff
  frame[1] = 0xfb
  frame[2] = 0x90
  frame[3] = 0x00
  if (tag) {
    frame.write(tag, 36, 'ascii')
    frame.writeUInt32BE(0x00000001, 40) // frames flag
    frame.writeUInt32BE(totalFrames, 44)
  }
  return frame
}

function makeEdgeAudioFrame(payload) {
  const header = Buffer.from('Path:audio', 'utf8')
  const headerLength = Buffer.alloc(2)
  headerLength.writeUInt16BE(header.length)
  return Buffer.concat([headerLength, header, Buffer.from(payload)])
}

// ---------- 1. VBR Xing/Info Multi-Segment Concatenation Fix ----------

test('v0.10 Upgrade 1: stripMp3MetadataFrame 与 concatMp3Buffers 剥离过期 Xing/Info 帧头，拼接时长翻倍不卡死', () => {
  const makeTenFrameXingSegment = () => {
    const xingHeaderFrame = makeMpeg1Frame44100('Xing', 10)
    const audioFrames = Array.from({ length: 10 }, () => makeMpeg1Frame44100())
    return Buffer.concat([xingHeaderFrame, ...audioFrames])
  }

  const seg1 = makeTenFrameXingSegment()
  const seg2 = makeTenFrameXingSegment()

  // 单段包含 Xing 头，声明 10 帧（10 * 1152 / 44100 ≈ 261ms）
  const info1 = inspectMp3Buffer(seg1)
  assert.equal(info1.isVbr, true)
  assert.equal(info1.frameCount, 10)
  assert.equal(info1.durationMs, 261)

  // 单元素 concat 保持原样
  assert.equal(inspectMp3Buffer(concatMp3Buffers([seg1])).frameCount, 10)

  // stripMp3MetadataFrame 移除首帧 Xing/Info 元数据帧，仅保留 10 个真实音频帧
  const stripped = stripMp3MetadataFrame(seg1)
  assert.equal(stripped.length, 10 * 417)
  assert.equal(inspectMp3Buffer(stripped).isVbr, false)
  assert.equal(inspectMp3Buffer(stripped).frameCount, 10)

  const infoFrame = Buffer.concat([makeMpeg1Frame44100('Info', 10), makeMpeg1Frame44100()])
  assert.equal(stripMp3MetadataFrame(infoFrame).length, 417)

  // 双段拼接自动剥离各自的过期 Xing 头，总帧数为 20（~522ms），不再被首段锁死在 ~261ms
  const combined = concatMp3Buffers([seg1, seg2])
  const combinedInfo = inspectMp3Buffer(combined)
  assert.equal(combinedInfo.isVbr, false)
  assert.equal(combinedInfo.frameCount, 20)
  assert.equal(combinedInfo.durationMs, 522)
})

// ---------- 2. Edge Keep-Alive WebSocket Pool & Transient Retry ----------

test('v0.10 Upgrade 2a: Edge WebSocket 连接池复用已打开连接并在 closeEdgeConnectionPool 时干净释放', async (t) => {
  closeEdgeConnectionPool()
  t.after(() => closeEdgeConnectionPool())

  let connectCount = 0
  let closedCount = 0
  let turnIndex = 0

  const webSocketFactory = () => {
    connectCount += 1
    const listeners = {}
    const fire = (type, event = {}) => {
      for (const fn of [...(listeners[type] ?? [])]) fn(event)
    }
    const socket = {
      readyState: 0,
      addEventListener(type, fn) {
        ;(listeners[type] ??= new Set()).add(fn)
      },
      removeEventListener(type, fn) {
        listeners[type]?.delete(fn)
      },
      on(type, fn) {
        ;(listeners[type] ??= new Set()).add(fn)
      },
      off(type, fn) {
        listeners[type]?.delete(fn)
      },
      removeListener(type, fn) {
        listeners[type]?.delete(fn)
      },
      send(data) {
        if (String(data).includes('Path:ssml')) {
          turnIndex += 1
          const currentTurn = turnIndex
          setTimeout(() => {
            fire('message', { data: makeEdgeAudioFrame([currentTurn, 0xaa, 0xbb]) })
            fire('message', { data: 'X-Timestamp:2026\r\nPath:turn.end\r\n' })
          }, 0)
        }
      },
      close() {
        socket.readyState = 3
        closedCount += 1
      },
    }
    setTimeout(() => {
      if (socket.readyState === 0) {
        socket.readyState = 1
        fire('open')
      }
    }, 0)
    return socket
  }

  const opts = { voice: 'zh-CN-XiaoxiaoNeural', rate: '+0%', pitch: '+0Hz' }
  const firstAudio = await synthesizeSpeech({ ...opts, text: '第一句复用连接测试' }, { webSocketFactory, usePool: true }, 5000)
  const secondAudio = await synthesizeSpeech({ ...opts, text: '第二句直走热连接' }, { webSocketFactory, usePool: true }, 5000)

  assert.equal(connectCount, 1, '第 2 次调用应直接复用池内连接而非重连')
  assert.deepEqual([...firstAudio], [1, 0xaa, 0xbb])
  assert.deepEqual([...secondAudio], [2, 0xaa, 0xbb])

  closeEdgeConnectionPool()
  assert.equal(closedCount, 1, 'closeEdgeConnectionPool 应关闭空闲连接')
})

test('v0.10 Upgrade 2b: Edge WebSocket 瞬时断连在 maxRetries: 1 下自动重试一次并成功返回音频', async (t) => {
  closeEdgeConnectionPool()
  t.after(() => closeEdgeConnectionPool())

  let connectCount = 0
  const webSocketFactory = () => {
    connectCount += 1
    const attempt = connectCount
    const listeners = {}
    const fire = (type, event = {}) => {
      for (const fn of [...(listeners[type] ?? [])]) fn(event)
    }
    const socket = {
      readyState: 0,
      addEventListener(type, fn) {
        ;(listeners[type] ??= new Set()).add(fn)
      },
      removeEventListener(type, fn) {
        listeners[type]?.delete(fn)
      },
      send(data) {
        if (String(data).includes('Path:ssml')) {
          setTimeout(() => {
            fire('message', { data: makeEdgeAudioFrame([9, 8, 7, 6]) })
            fire('message', { data: 'X-Timestamp:2026\r\nPath:turn.end\r\n' })
          }, 0)
        }
      },
      close() {
        socket.readyState = 3
      },
    }
    setTimeout(() => {
      if (attempt === 1) {
        socket.readyState = 3
        fire('error', new Error('transient network reset'))
      } else {
        socket.readyState = 1
        fire('open')
      }
    }, 0)
    return socket
  }

  const audio = await synthesizeSpeech(
    { text: '瞬时网络抖动重试', voice: 'zh-CN-XiaoxiaoNeural', rate: '+0%', pitch: '+0Hz' },
    { webSocketFactory, maxRetries: 1, usePool: false },
    5000,
  )
  assert.equal(connectCount, 2)
  assert.deepEqual([...audio], [9, 8, 7, 6])
})

// ---------- 3. Word-Boundary Pronunciations & Inline [pause:500ms] ----------

test('v0.10 Upgrade 3: 英文词边界保护不误伤 POST 子串，Edge 与非 Edge 均安全处理词典与行内 [pause] 静音帧拼接', async (t) => {
  t.after(() => closeEdgeConnectionPool())
  assert.equal(buildPronunciationPattern([]), null)
  const plain = applyPronunciationsPlain('POST request on Mac OS系统', [{ word: 'OS', alias: 'Operating System' }])
  assert.equal(plain, 'POST request on Mac Operating System系统')

  // Edge 免费 ReadAloud 端点拒绝 <sub alias> 与 <break> 标签，buildSsml 必须输出 Edge 兼容纯文本替读且映射旧版 Azure 音色
  const ssml = buildSsml({
    text: 'POST on OS [pause:600ms] 重构',
    voice: 'zh-CN-YunzeNeural',
    rate: '+0%',
    pitch: '+0Hz',
    pronunciations: [
      { word: 'OS', alias: 'O S' },
      { word: '重构', alias: '虫构' },
    ],
  })
  assert.equal(resolveEdgeVoiceId('zh-CN-YunzeNeural'), 'zh-CN-YunjianNeural')
  assert.ok(ssml.includes("voice name='zh-CN-YunjianNeural'"))
  assert.ok(!ssml.includes('<sub '), 'Edge SSML 不应包含会被 1007 拒绝的 <sub> 标签')
  assert.ok(!ssml.includes('<break '), 'Edge SSML 不应包含会被 1007 拒绝的 <break> 标签')
  assert.ok(ssml.includes('POST on O S 虫构'), `应保留 POST 并替读 OS 与重构，实际 SSML：${ssml}`)

  // Edge synthesizeSpeechWithMetadata 遇到 [pause:480ms] 自动分段合成并插入同采样率静音帧（复用保活连接池）
  let edgeTurns = 0
  let edgeConnects = 0
  const edgeSentSsml = []
  const reusableFactory = () => {
    edgeConnects += 1
    const listeners = {}
    const fire = (type, ev) => { for (const fn of listeners[type] ?? []) fn(ev) }
    const socket = {
      readyState: 0,
      addEventListener(type, fn) { (listeners[type] ??= []).push(fn) },
      send(data) {
        if (typeof data === 'string' && data.includes('Path:ssml')) {
          edgeTurns += 1
          edgeSentSsml.push(data)
          const pieceAudio = createSilenceMp3(240, 24000)
          setTimeout(() => {
            fire('message', { data: makeEdgeAudioFrame(pieceAudio) })
            fire('message', { data: 'X-Timestamp:2026\r\nPath:turn.end\r\n' })
          }, 0)
        }
      },
      close() { socket.readyState = 3 },
    }
    setTimeout(() => { socket.readyState = 1; fire('open') }, 0)
    return socket
  }
  const edgePaused = await synthesizeSpeechWithMetadata(
    { text: '第一句 [pause:480ms] 第二句', voice: 'zh-CN-XiaoxiaoNeural', rate: '+0%', pitch: '+0Hz' },
    { webSocketFactory: reusableFactory, usePool: true },
    5000,
  )
  assert.equal(edgeConnects, 1, '两段应复用同一条保活连接')
  assert.equal(edgeTurns, 2)
  assert.ok(!edgeSentSsml[0].includes('pause') && !edgeSentSsml[1].includes('pause'))
  const edgePausedMs = inspectMp3Buffer(edgePaused.audio).durationMs
  assert.ok(edgePausedMs >= 936 && edgePausedMs <= 984, `Edge 240+480+240ms 期望约 960ms，实际 ${edgePausedMs}ms`)
  closeEdgeConnectionPool()

  // WS 1007 协议拒绝应立即透传原因且不做无效重试
  let ws1007Connects = 0
  const ws1007Factory = () => {
    ws1007Connects += 1
    const listeners = {}
    const fire = (type, ev) => { for (const fn of listeners[type] ?? []) fn(ev) }
    const socket = {
      readyState: 0,
      addEventListener(type, fn) { (listeners[type] ??= []).push(fn) },
      send(data) {
        if (typeof data === 'string' && data.includes('Path:ssml')) {
          setTimeout(() => {
            socket.readyState = 3
            fire('close', { code: 1007, reason: 'SSML is invalid' })
          }, 0)
        }
      },
      close() { socket.readyState = 3 },
    }
    setTimeout(() => { socket.readyState = 1; fire('open') }, 0)
    return socket
  }
  await assert.rejects(
    () => synthesizeSpeech(
      { text: 'test 1007', voice: 'zh-CN-XiaoxiaoNeural', rate: '+0%', pitch: '+0Hz' },
      { webSocketFactory: ws1007Factory, usePool: false, maxRetries: 2 },
      5000,
    ),
    /WS 1007: SSML is invalid/,
  )
  assert.equal(ws1007Connects, 1, '永久性 WS 1007 不应浪费重试')

  const pieces = splitInlinePauses('第一句 [pause:480ms] 第二句')
  assert.deepEqual(pieces, [
    { kind: 'text', text: '第一句' },
    { kind: 'pause', durationMs: 480 },
    { kind: 'text', text: '第二句' },
  ])
  assert.equal(stripInlinePauses('第一句 [pause:480ms] 第二句'), '第一句 第二句')

  const { root, exec } = makeWorkspace(t)
  const openaiTexts = []
  const cfg = resolveConfig({ ttsEngine: 'openai', ttsApiKey: 'sk-test' })
  const tts = buildVoiceTools(cfg, {
    openaiTts: async (_baseUrl, _apiKey, options) => {
      openaiTexts.push(options.text)
      return createSilenceMp3(240, 24000)
    },
  }).find((tool) => tool.name === 'voice_tts')

  const outMp3 = join(root, 'inline-pause.mp3')
  const outSrt = join(root, 'inline-pause.srt')
  const res = await tts.execute(
    { text: '第一句 [pause:480ms] 第二句', output: outMp3, subtitleOutput: outSrt },
    exec,
  )

  assert.equal(openaiTexts.length, 2)
  assert.equal(openaiTexts[0].trim(), '第一句')
  assert.equal(openaiTexts[1].trim(), '第二句')
  // 240ms + 480ms + 240ms = 960ms
  assert.ok(res.durationMs >= 936 && res.durationMs <= 984, `期望约 960ms，实际 ${res.durationMs}ms`)

  const srtContent = readFileSync(outSrt, 'utf8')
  assert.ok(!srtContent.includes('pause:480ms'))
  assert.ok(srtContent.includes('第一句'))
  assert.ok(srtContent.includes('第二句'))
})

// ---------- 4. Short-Video Clause/Word Subtitles & .ass Karaoke Export ----------

test('v0.10 Upgrade 4: groupWordCues 短句切分与 voice_tts .ass 卡拉 OK (\\kf) 导出', async (t) => {
  const rawWords = [
    { index: 1, startMs: 0, endMs: 200, text: '今天' },
    { index: 2, startMs: 200, endMs: 420, text: '聊聊' },
    { index: 3, startMs: 420, endMs: 780, text: '短视频字幕，' },
    { index: 4, startMs: 820, endMs: 1100, text: '支持' },
    { index: 5, startMs: 1100, endMs: 1400, text: '逐词高亮' },
    { index: 6, startMs: 1900, endMs: 2300, text: '非常丝滑' }, // 500ms >= 350ms 静音断句
  ]

  const clauses = groupWordCues(rawWords, 'clause', 10)
  assert.equal(clauses.length, 3)
  assert.equal(clauses[0].text, '今天聊聊短视频字幕，')
  assert.equal(clauses[1].text, '支持逐词高亮')
  assert.equal(clauses[2].text, '非常丝滑')

  // 超出 maxCharsPerCue 自动切屏
  const tight = groupWordCues(
    [
      { index: 1, startMs: 0, endMs: 200, text: '人工智能' },
      { index: 2, startMs: 200, endMs: 400, text: '语音合成' },
      { index: 3, startMs: 400, endMs: 600, text: '工作台' },
    ],
    'clause',
    6,
  )
  assert.ok(tight.length >= 2)
  assert.ok(formatAssSubtitles(clauses, rawWords).includes('{\\kf'))

  const { root, exec } = makeWorkspace(t)
  const seenBoundaries = []
  const cfg = resolveConfig({})
  const tts = buildVoiceTools(cfg, {
    ttsWithMeta: async (opts) => {
      seenBoundaries.push(opts?.boundary)
      return {
        audio: createSilenceMp3(2304, 24000),
        cues: rawWords,
      }
    },
  }).find((tool) => tool.name === 'voice_tts')

  const res = await tts.execute(
    {
      text: '今天聊聊短视频字幕，支持逐词高亮 非常丝滑',
      output: join(root, 'short.mp3'),
      subtitleOutput: 'short.ass',
      subtitleGranularity: 'clause',
      maxCharsPerCue: 10,
    },
    exec,
  )

  assert.deepEqual(seenBoundaries, ['word'])
  const assText = readFileSync(res.subtitleFile, 'utf8')
  assert.ok(assText.includes('[Script Info]'))
  assert.ok(assText.includes('[V4+ Styles]'))
  assert.ok(assText.includes('[Events]'))
  assert.ok(assText.includes('Dialogue:'))
  assert.ok(assText.includes('{\\kf'), '导出的 .ass 文件必须包含 {\\kf 逐词卡拉 OK 标签')
})

// ---------- 5. .srt Dubbing atempo Zero-Drift Fallback (deps.fitWindow) ----------

test('v0.10 Upgrade 5: subtitleInput 在加速重合成仍超窗时调用 deps.fitWindow 零漂移对齐下一句时间轴', async (t) => {
  const { root, exec } = makeWorkspace(t)
  const denseSrt = join(root, 'dense.srt')
  writeFileSync(
    denseSrt,
    [
      '1',
      '00:00:00,000 --> 00:00:01,000',
      '第一句密集超长台词即使加速也达到一秒五',
      '',
      '2',
      '00:00:01,200 --> 00:00:02,200',
      '第二句准点开始不漂移',
      '',
    ].join('\n'),
    'utf8',
  )

  const fitCalls = []
  const cfg = resolveConfig({})
  const tts = buildVoiceTools(cfg, {
    tts: async (opts) => {
      if (opts.text.includes('第一句')) {
        // 无论原速还是 scaleRatePercent 加速后均返回 ~1512ms（超出 1000ms 时间窗）
        return createSilenceMp3(1512, 24000)
      }
      return createSilenceMp3(720, 24000)
    },
    fitWindow: async (mp3, targetMaxMs) => {
      fitCalls.push({ inputMs: inspectMp3Buffer(mp3).durationMs, targetMaxMs })
      // 压回 <= 1000ms（960ms = 40 个 24ms 帧，随后补 240ms = 10 帧静音精确落在 1200ms）
      return createSilenceMp3(960, 24000)
    },
  }).find((tool) => tool.name === 'voice_tts')

  const syncedSrt = join(root, 'dub-synced.srt')
  const res = await tts.execute(
    { subtitleInput: 'dense.srt', output: join(root, 'dub.mp3'), subtitleOutput: syncedSrt },
    exec,
  )

  assert.equal(fitCalls.length, 1)
  assert.equal(fitCalls[0].targetMaxMs, 1000)
  // 960ms (第1句压缩后) + 240ms (间隙静音) + 720ms (第2句) = 1920ms
  assert.equal(res.durationMs, 1920)

  const syncedCuesOut = readFileSync(syncedSrt, 'utf8')
  assert.match(syncedCuesOut, /00:00:01,200\s*-->/, '第 2 句起点必须精确对齐 00:00:01,200 无累积漂移')
})

// ---------- 6. Markdown Auto-Chapters & ID3v2.3 CHAP/CTOC Embedding ----------

test('v0.10 Upgrade 6: Markdown 标题自动分章、chaptersOutput 导出及 MP3 ID3v2.3 CTOC/CHAP 书签嵌入', async (t) => {
  const sectionsWithCode = extractMarkdownSections(
    ['# 第一章 架构', '```bash', '# 代码注释不是章节', '```', '内容一。', '', '## 第二章 性能', '内容二。'].join('\n'),
  )
  assert.equal(sectionsWithCode.length, 2)
  assert.equal(sectionsWithCode[0].title, '第一章 架构')
  assert.equal(sectionsWithCode[1].title, '第二章 性能')

  const sampleTagged = embedMp3Chapters(createSilenceMp3(480, 24000), [
    { title: '开场', startMs: 0, endMs: 480 },
  ])
  assert.equal(sampleTagged.subarray(0, 5).toString('binary'), 'ID3\x03\x00')
  assert.equal(inspectMp3Buffer(sampleTagged).durationMs, 480)
  assert.match(formatChaptersMarkdown([{ title: '开场', startMs: 0, endMs: 480 }]), /^00:00\s+开场/m)

  const { root, exec } = makeWorkspace(t)
  const bookMd = join(root, 'book.md')
  writeFileSync(bookMd, '# 第一章 架构\n内容一。\n\n# 第二章 性能\n内容二。\n', 'utf8')

  const cfg = resolveConfig({})
  const tts = buildVoiceTools(cfg, {
    tts: async () => createSilenceMp3(1000, 24000),
  }).find((tool) => tool.name === 'voice_tts')

  const res = await tts.execute(
    { inputFile: 'book.md', output: 'book.mp3', chaptersOutput: 'chapters.md' },
    exec,
  )

  assert.ok(Array.isArray(res.chapters))
  assert.equal(res.chapters.length, 2)
  assert.equal(res.chapters[0].title, '第一章 架构')
  assert.equal(res.chapters[0].startMs, 0)
  assert.equal(res.chapters[1].title, '第二章 性能')
  assert.ok(res.chapters[1].startMs >= 1000)

  const chaptersMdPath = res.chaptersFile || join(root, 'chapters.md')
  const chaptersMd = readFileSync(chaptersMdPath, 'utf8')
  assert.ok(chaptersMd.includes('00:00') && chaptersMd.includes('第一章 架构'))
  assert.match(chaptersMd, /00:01\s+第二章 性能/)

  const mp3Buf = readFileSync(res.output)
  assert.deepEqual([...mp3Buf.subarray(0, 5)], [0x49, 0x44, 0x33, 0x03, 0x00])
  assert.ok(mp3Buf.includes(Buffer.from('CTOC', 'ascii')))
  assert.ok(mp3Buf.includes(Buffer.from('CHAP', 'ascii')))

  const inspected = inspectMp3Buffer(mp3Buf)
  assert.equal(inspected.durationMs, res.durationMs)
  assert.ok(inspected.durationMs >= 2000, `期望包含两章音频帧时长 >= 2000ms，实际 ${inspected.durationMs}ms`)
})

// ---------- 7. Direct Video Container Transcription in voice_stt ----------

test('v0.10 Upgrade 7: isVideoContainerFile 识别视频容器且 voice_stt 对 <25MB 视频自动调用 prepareAudio 抽轨', async (t) => {
  assert.equal(isVideoContainerFile('lecture.mp4'), true)
  assert.equal(isVideoContainerFile('clip.mkv'), true)
  assert.equal(isVideoContainerFile('mic.webm'), false)

  const { root, exec } = makeWorkspace(t)
  const smallVideo = join(root, 'lecture.mp4')
  writeFileSync(smallVideo, Buffer.alloc(512, 0x11))

  const prepareCalls = []
  let cleaned = false
  const sttFilenames = []

  const cfg = resolveConfig({ asrApiKey: 'test-asr-key' })
  const stt = buildVoiceTools(cfg, {
    prepareAudio: async (filePath) => {
      prepareCalls.push(filePath)
      return {
        chunks: [{ audio: Buffer.from('EXTRACTED_AUDIO_TRACK'), filename: 'lecture_16k.mp3', offsetSeconds: 0 }],
        cleanup: () => {
          cleaned = true
        },
      }
    },
    stt: async (_baseUrl, _apiKey, opts) => {
      sttFilenames.push(opts.filename)
      return { text: '课程视频抽轨转写结果', model: opts.model }
    },
  }).find((tool) => tool.name === 'voice_stt')

  const res = await stt.execute({ audio: 'lecture.mp4' }, exec)
  assert.equal(prepareCalls.length, 1, '小于 25MB 的 .mp4 也必须自动调用 prepareAudio 剥离视频流')
  assert.equal(cleaned, true)
  assert.deepEqual(sttFilenames, ['lecture_16k.mp3'])
  assert.equal(res.text, '课程视频抽轨转写结果')
})

// ---------- 8. Voice Studio Creative Loop Backend & Built Client Bundle ----------

test('v0.10 Upgrade 8a: createVoiceStudioBackend 支持 saveCloneVoice、synthesizeDialogue、workspaceLibrary 与 loadWorkspaceMedia 闭环并拦截越界', async (t) => {
  const { root, outside } = makeWorkspace(t, 'dsh-voice-studio-loop-')
  const outsideSecret = join(outside, 'secret.mp3')
  writeFileSync(outsideSecret, createSilenceMp3(240, 24000))

  let currentCfg = resolveConfig({ asrApiKey: 'test-asr-key', overwrite: false })
  const savedPatches = []

  const backend = createVoiceStudioBackend(() => currentCfg, {
    workspaceDir: root,
    writable: () => true,
    updateSettings: async (patch) => {
      savedPatches.push(patch)
      currentCfg = resolveConfig({ ...currentCfg, ...patch })
    },
    ttsWithMeta: async (opts) => ({
      audio: createSilenceMp3(480, 24000),
      cues: [{ index: 1, startMs: 0, endMs: 480, text: opts.text }],
    }),
    stt: async () => ({
      text: '这是八秒录音自动识别出的参考文本',
      language: 'zh',
      duration: 3.2,
      model: 'whisper-large-v3-turbo',
    }),
  })

  const post = (body) =>
    backend.fetch(
      new Request('http://127.0.0.1:49000' + VOICE_STUDIO_API_ROUTE, {
        method: 'POST',
        headers: { 'X-DSH-VOICE': '1', 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }),
    )

  // 1) saveCloneVoice：保存至 voice_clones/、自动 ASR 转写并注册进 customVoices，拒绝路径穿越
  const badCloneRes = await post({
    action: 'saveCloneVoice',
    aliasName: '../escape',
    audioBase64: Buffer.from('WEBM').toString('base64'),
  })
  assert.ok(badCloneRes.status >= 400, '包含路径分隔符的 aliasName 必须被拒绝')

  const cloneRes = await post({
    action: 'saveCloneVoice',
    aliasName: '我的专属声线',
    audioBase64: 'data:audio/webm;base64,' + Buffer.from('FAKE_WEBM_CLONE_CLIP').toString('base64'),
    filename: 'clip.webm',
  })
  assert.equal(cloneRes.status, 200)
  const cloneJson = await cloneRes.json()
  assert.equal(cloneJson.clone.name, '我的专属声线')
  assert.match(cloneJson.clone.referenceAudio.replace(/\\/g, '/'), /^voice_clones\//)
  assert.ok(existsSync(join(root, cloneJson.clone.referenceAudio)))
  assert.equal(cloneJson.clone.referenceText, '这是八秒录音自动识别出的参考文本')
  assert.equal(savedPatches.length, 1)
  assert.ok(currentCfg.customVoices.some((v) => v.name === '我的专属声线' && v.referenceText === '这是八秒录音自动识别出的参考文本'))

  // 2) synthesizeDialogue：多角色对话合成，返回 audioBase64 + durationSec + 带角色前缀的 cues，并落盘 voice_outputs/*.mp3 + .srt
  const synthRes = await post({
    action: 'synthesizeDialogue',
    saveToWorkspace: true,
    outputName: 'studio-ep1',
    segments: [
      { speaker: '女主持', voice: 'podcast-host-female', text: '欢迎来到创作闭环测试！', pauseMs: 240 },
      { speaker: '男主持', voice: 'podcast-host-male', text: '字幕跟读和成品库已经就绪。', pauseMs: 240 },
    ],
  })
  assert.equal(synthRes.status, 200)
  const synthJson = await synthRes.json()
  assert.ok(synthJson.synthesis.audioBase64.length > 0)
  assert.ok(synthJson.synthesis.durationSec > 0)
  assert.equal(synthJson.synthesis.cues.length, 2)
  assert.match(synthJson.synthesis.cues[0].text, /^\[女主持\]/)
  assert.match(synthJson.synthesis.cues[1].text, /^\[男主持\]/)
  assert.ok(synthJson.synthesis.savedMp3)
  assert.ok(synthJson.synthesis.savedSubtitle)

  const absSavedMp3 = isAbsolute(synthJson.synthesis.savedMp3)
    ? synthJson.synthesis.savedMp3
    : join(root, synthJson.synthesis.savedMp3)
  const absSavedSrt = isAbsolute(synthJson.synthesis.savedSubtitle)
    ? synthJson.synthesis.savedSubtitle
    : join(root, synthJson.synthesis.savedSubtitle)
  assert.ok(existsSync(absSavedMp3) && absSavedMp3.replace(/\\/g, '/').includes('voice_outputs/'))
  assert.ok(existsSync(absSavedSrt) && absSavedSrt.endsWith('.srt'))

  // 3) workspaceLibrary & loadWorkspaceMedia：列出并配对 .srt，读取媒体与解析 cues，拒绝工作区外文件
  const libRes = await post({ action: 'workspaceLibrary' })
  assert.equal(libRes.status, 200)
  const libJson = await libRes.json()
  assert.ok(Array.isArray(libJson.items))
  const mp3Item = libJson.items.find((it) => it.path.replace(/\\/g, '/').includes('voice_outputs/') && it.path.endsWith('.mp3'))
  assert.ok(mp3Item, 'workspaceLibrary 必须列出刚才保存的 voice_outputs/*.mp3')
  assert.ok(mp3Item.subtitlePath && mp3Item.subtitlePath.endsWith('.srt'), '应自动配对同名 .srt 字幕')

  const mediaRes = await post({ action: 'loadWorkspaceMedia', path: mp3Item.path })
  assert.equal(mediaRes.status, 200)
  const mediaJson = await mediaRes.json()
  assert.ok(mediaJson.media.audioBase64.length > 0)
  assert.equal(mediaJson.media.cues.length, 2)
  assert.match(mediaJson.media.cues[0].text, /\[女主持\]/)

  const outAbsRes = await post({ action: 'loadWorkspaceMedia', path: outsideSecret })
  assert.ok(outAbsRes.status >= 400, '工作区外绝对路径必须被拒绝')
  const outRelRes = await post({ action: 'loadWorkspaceMedia', path: '../outside/secret.mp3' })
  assert.ok(outRelRes.status >= 400, '工作区外相对路径穿越必须被拒绝')
})

test('v0.10 Upgrade 8b: lib/client.js 通过 node --check 且包含创作闭环前端动作标识', () => {
  const clientPath = join(repoRoot, 'lib', 'client.js')
  assert.ok(existsSync(clientPath), 'lib/client.js 必须已构建')
  execFileSync(process.execPath, ['--check', clientPath], { stdio: 'pipe' })
  const code = readFileSync(clientPath, 'utf8')
  assert.ok(code.includes('saveCloneVoice'), 'lib/client.js 应包含 saveCloneVoice')
  assert.ok(code.includes('synthesizeDialogue'), 'lib/client.js 应包含 synthesizeDialogue')
  assert.ok(code.includes('workspaceLibrary'), 'lib/client.js 应包含 workspaceLibrary')
  assert.ok(code.includes('-webkit-search-cancel-button'), 'lib/client.js 应隐藏浏览器原生搜索清除按钮')
  assert.ok(code.includes('.dsh-wb-switch-row'), 'lib/client.js 应包含开关行间距样式')
})

test('v0.10 Upgrade 9: 聊天体验优化 — voice_list 超长折叠与 segments 真实音色/章节时间轴渲染', async (t) => {
  const { root, exec } = makeWorkspace(t)
  const cfg = resolveConfig({})

  // 1) voice_list online 超过 60 个音色时，结构化数据保留全量，聊天渲染折叠并给出地区摘要
  const manyVoices = Array.from({ length: 120 }, (_, i) => ({
    id: `${i < 50 ? 'zh-CN' : 'en-US'}-Voice${i}Neural`,
    gender: i % 2 === 0 ? 'Female' : 'Male',
    locale: i < 50 ? 'zh-CN' : 'en-US',
    tags: ['online'],
  }))
  const listTool = buildVoiceTools(cfg, {
    fetchVoices: async () => manyVoices,
  }).find((tool) => tool.name === 'voice_list')
  const listVal = await listTool.execute({ online: true })
  assert.equal(listVal.count, 120)
  assert.equal(listVal.voices.length, 120)
  const renderedList = listTool.output.render({}, listVal)[0].text
  assert.match(renderedList, /共 120 个在线 Edge 音色/)
  assert.match(renderedList, /其余 80 个音色已折叠/)
  assert.match(renderedList, /en-US\(70\)/)

  // 2) multi-speaker segments 未指定顶层 voice 时，应报告实际使用的分段音色并在 render 展示章节时间轴
  const ttsTool = buildVoiceTools(cfg, {
    tts: async () => createSilenceMp3(1000, 24000),
  }).find((tool) => tool.name === 'voice_tts')
  const segVal = await ttsTool.execute({
    segments: [
      { title: '开场白', persona: 'late-night-radio', text: '晚上好。', pauseMs: 240 },
      { title: '主题拆解', persona: 'documentary-narrator', text: '进入正题。', pauseMs: 0 },
    ],
    output: join(root, 'chat-podcast.mp3'),
  }, exec)
  assert.equal(segVal.voice, 'zh-CN-YunyangNeural / zh-CN-YunjianNeural')
  assert.deepEqual(segVal.voices, ['zh-CN-YunyangNeural', 'zh-CN-YunjianNeural'])
  const renderedTts = ttsTool.output.render({}, segVal)[0].text
  assert.match(renderedTts, /音色 zh-CN-YunyangNeural \/ zh-CN-YunjianNeural/)
  assert.match(renderedTts, /章节时间轴：/)
  assert.match(renderedTts, /00:00 开场白/)
  assert.match(renderedTts, /主题拆解/)
})

// ---------- 10. v0.11 Wish-Driven Tools, Target Duration, Interactive Player, Graceful FFmpeg & voice_prefs ----------

test('v0.11 Wish-Driven 1: voice_tts scene 预设、模糊风格词（深夜/纪录片/粤语男声）与 autoPronunciations', async (t) => {
  const { root, exec } = makeWorkspace(t, 'dsh-voice-v011-scene-')
  const seenCalls = []
  const cfg = resolveConfig({
    pronunciations: [{ word: 'SQL', alias: 'Sequel' }],
  })
  const tts = buildVoiceTools(cfg, {
    ttsWithMeta: async (opts) => {
      seenCalls.push(opts)
      return {
        audio: createSilenceMp3(1200, 24000),
        cues: [
          { index: 1, startMs: 0, endMs: 600, text: 'Nginx' },
          { index: 2, startMs: 600, endMs: 1200, text: '与SQL部署' },
        ],
      }
    },
    tts: async (opts) => {
      seenCalls.push(opts)
      return createSilenceMp3(1200, 24000)
    },
    normalizeAudio: async (buf) => buf,
  }).find((tool) => tool.name === 'voice_tts')

  // 1) scene: '短视频' 自动应用 energetic-anchor、clause 字幕、maxCharsPerCue=14、智能文件名 short-video.mp3 及内置技术词典
  const shortRes = await tts.execute({
    scene: '短视频',
    text: '今天部署 Nginx 和 SQL 以及 K8s。',
    subtitleOutput: 'short.srt',
  }, exec)
  assert.equal(shortRes.scene, 'short-video')
  assert.equal(shortRes.voice, 'zh-CN-YunjianNeural')
  assert.equal(shortRes.rate, '+14%')
  assert.equal(shortRes.output, join(root, 'short-video.mp3'))
  assert.equal(seenCalls[0].boundary, 'word')
  const prons = seenCalls[0].pronunciations ?? []
  assert.equal(prons.find((p) => p.word === 'Nginx')?.alias, 'Engine X', '默认开启 autoPronunciations 应包含 Nginx')
  assert.equal(prons.find((p) => p.word === 'K8s')?.alias, 'K 8 s', '默认开启 autoPronunciations 应包含 K8s')
  assert.equal(prons.find((p) => p.word === 'SQL')?.alias, 'Sequel', '用户设置 pronunciations 应覆盖内置默认 SQL')

  // 2) autoPronunciations: false 仅保留用户配置与调用参数词典
  seenCalls.length = 0
  await tts.execute({
    text: 'Nginx 和 SQL',
    autoPronunciations: false,
    output: 'no-auto.mp3',
  }, exec)
  const noAutoProns = seenCalls[0].pronunciations ?? []
  assert.equal(noAutoProns.some((p) => p.word === 'Nginx'), false)
  assert.equal(noAutoProns.find((p) => p.word === 'SQL')?.alias, 'Sequel')

  // 3) 模糊自然语言风格词与方言：persona="深夜" / voice="纪录片" / persona="粤语男声"
  seenCalls.length = 0
  const nightRes = await tts.execute({ text: '夜深了。', persona: '深夜', output: 'night.mp3' }, exec)
  assert.equal(nightRes.voice, 'zh-CN-YunyangNeural')
  assert.equal(nightRes.rate, '-10%')
  assert.equal(nightRes.pitch, '-4Hz')

  const docRes = await tts.execute({ text: '山河辽阔。', voice: '纪录片', output: 'doc.mp3' }, exec)
  assert.equal(docRes.voice, 'zh-CN-YunjianNeural')
  assert.equal(docRes.rate, '-8%')

  const cantoneseRes = await tts.execute({ text: '早晨。', persona: '粤语男声', output: 'hk.mp3' }, exec)
  assert.equal(cantoneseRes.voice, 'zh-HK-WanLungNeural')

  // 4) scene: 'audiobook' 默认清理 Markdown 文本，显式参数可覆盖 scene 默认值
  seenCalls.length = 0
  const bookRes = await tts.execute({
    scene: 'audiobook',
    text: '# 标题\n\n**加粗内容** [查看](https://example.com)',
  }, exec)
  assert.equal(bookRes.output, join(root, 'audiobook.mp3'))
  assert.equal(bookRes.voice, 'zh-CN-YunjianNeural')
  assert.ok(!seenCalls[0].text.includes('https://') && !seenCalls[0].text.includes('**'))

  // 显式 voice 覆盖 scene 默认人设
  const overrideRes = await tts.execute({
    scene: 'short-video',
    voice: 'zh-CN-XiaoxiaoNeural',
    output: 'custom.mp3',
    text: '显式覆盖测试',
  }, exec)
  assert.equal(overrideRes.voice, 'zh-CN-XiaoxiaoNeural')
  assert.equal(overrideRes.output, join(root, 'custom.mp3'))

  // 未知 scene 给出明确错误
  await assert.rejects(() => tts.execute({ scene: 'non-existent-scene', text: 'x' }, exec), /不支持的 scene/)
})

test('v0.11 Wish-Driven 2: targetDurationSec 在单文本、inputFile 与 segments 下自动加速重合成并触发 fitWindow', async (t) => {
  const { root, exec } = makeWorkspace(t, 'dsh-voice-v011-dur-')
  const seenRates = []
  const fitCalls = []

  const tts = buildVoiceTools(resolveConfig({}), {
    tts: async (opts) => {
      seenRates.push(opts.rate)
      // 首次 +0% 返回 6000ms（超出 4000ms * 1.05），加速重合成返回 4320ms（仍超 4000ms * 1.03）
      return opts.rate === '+0%' ? createSilenceMp3(6000, 24000) : createSilenceMp3(4320, 24000)
    },
    fitWindow: async (mp3, targetMs) => {
      fitCalls.push({ inputMs: inspectMp3Buffer(mp3).durationMs, targetMs })
      return createSilenceMp3(3960, 24000)
    },
  }).find((tool) => tool.name === 'voice_tts')

  // 非法范围拒绝
  await assert.rejects(() => tts.execute({ text: '测试', targetDurationSec: 2 }, exec), /3 到 3600/)
  await assert.rejects(() => tts.execute({ text: '测试', targetDurationSec: 3601 }, exec), /3 到 3600/)

  // 1) 单文本目标 4 秒：触发 1 次加速重合成 + 1 次 fitWindow
  const singleRes = await tts.execute({ text: '超长口播台词', targetDurationSec: 4, output: 'fit-single.mp3' }, exec)
  assert.equal(seenRates.length, 2)
  assert.equal(seenRates[0], '+0%')
  assert.equal(seenRates[1], '+50%')
  assert.equal(fitCalls.length, 1)
  assert.equal(fitCalls[0].targetMs, 4000)
  assert.equal(singleRes.targetDurationSec, 4)
  assert.equal(singleRes.durationAdjusted, true)
  assert.ok(singleRes.durationMs <= 4000)
  assert.match(tts.output.render({}, singleRes)[0].text, /已按目标 4 秒校准时长/)

  // 2) 已满足目标时长（10 秒）时不重合成、不调 fitWindow
  seenRates.length = 0
  fitCalls.length = 0
  const okRes = await tts.execute({ text: '短台词', targetDurationSec: 10, output: 'fit-ok.mp3' }, exec)
  assert.equal(seenRates.length, 1)
  assert.equal(fitCalls.length, 0)
  assert.equal(okRes.targetDurationSec, 10)
  assert.equal(okRes.durationAdjusted, false)

  // 3) 多角色 segments 目标 5 秒：全部段落加速重合成并最终压入 5 秒内
  seenRates.length = 0
  fitCalls.length = 0
  const segTts = buildVoiceTools(resolveConfig({}), {
    tts: async (opts) => {
      seenRates.push(opts.rate)
      return opts.rate === '+0%' ? createSilenceMp3(3600, 24000) : createSilenceMp3(2640, 24000)
    },
    fitWindow: async (_mp3, targetMs) => {
      fitCalls.push(targetMs)
      return createSilenceMp3(4800, 24000)
    },
  }).find((tool) => tool.name === 'voice_tts')

  const segRes = await segTts.execute({
    segments: [
      { title: '开场', voice: 'zh-CN-XiaoxiaoNeural', text: '第一段', pauseMs: 240 },
      { title: '总结', voice: 'zh-CN-YunxiNeural', text: '第二段', pauseMs: 0 },
    ],
    targetDurationSec: 5,
    output: 'fit-seg.mp3',
  }, exec)
  assert.equal(seenRates.length, 4, '2 段初合成 + 2 段加速重合成')
  assert.notEqual(seenRates[2], '+0%')
  assert.equal(fitCalls.length, 1)
  assert.equal(segRes.durationAdjusted, true)
  assert.ok(segRes.durationMs <= 5000)

  // 4) inputFile Markdown 多章节目标时长校准：章节时间戳随 fitWindow 同步缩放
  const mdPath = join(root, 'guide.md')
  writeFileSync(mdPath, '# 第一节\n内容一。\n\n# 第二节\n内容二。\n', 'utf8')
  fitCalls.length = 0
  const mdRes = await segTts.execute({
    inputFile: 'guide.md',
    targetDurationSec: 5,
    output: 'fit-md.mp3',
  }, exec)
  assert.equal(mdRes.durationAdjusted, true)
  assert.equal(mdRes.chapters.length, 2)
  assert.ok(mdRes.chapters[1].endMs <= 5000, '章节结束时间应随压时同步缩放')
})

test('v0.11 Wish-Driven 3: createPlayer / playerOutput 自动采集字幕与章节并守护工作区边界', async (t) => {
  const { root, outside, exec } = makeWorkspace(t, 'dsh-voice-v011-player-')
  let metaCalls = 0
  const tts = buildVoiceTools(resolveConfig({}), {
    ttsWithMeta: async (opts) => {
      metaCalls += 1
      return {
        audio: createSilenceMp3(1200, 24000),
        cues: [{ index: 1, startMs: 0, endMs: 1200, text: opts.text }],
      }
    },
  }).find((tool) => tool.name === 'voice_tts')

  // 越界 playerOutput 在发起 TTS 前即被拒绝
  await assert.rejects(
    () => tts.execute({ text: '越界测试', playerOutput: join(outside, 'evil.html') }, exec),
    /超出会话工作区/,
  )
  await assert.rejects(
    () => tts.execute({ text: '越界测试', playerOutput: '../escape.html' }, exec),
    /超出会话工作区/,
  )
  assert.equal(metaCalls, 0)

  // createPlayer: true（未传 subtitleOutput 时仍自动采集 cues 并生成同目录 <stem>.player.html）
  const res = await tts.execute({
    segments: [
      { title: '开场简介', persona: 'podcast-host-female', text: '欢迎收听许愿式播客。', pauseMs: 240 },
      { title: '核心演示', persona: 'podcast-host-male', text: '点击任意字幕即可跳转。', pauseMs: 0 },
    ],
    output: 'episode1.mp3',
    createPlayer: true,
  }, exec)

  assert.equal(res.playerFile, join(root, 'episode1.player.html'))
  assert.ok(existsSync(res.playerFile))
  assert.equal(res.subtitleFile, '', '未请求 subtitleOutput 时不应额外写字幕文件')
  const html = readFileSync(res.playerFile, 'utf8')
  assert.ok(html.includes('src="./episode1.mp3"'))
  assert.ok(html.includes('欢迎收听许愿式播客。'))
  assert.ok(html.includes('点击任意字幕即可跳转。'))
  assert.ok(html.includes('开场简介') && html.includes('核心演示'))
  assert.match(tts.output.render({}, res)[0].text, /交互播放器已写入：.*episode1\.player\.html/)

  // 显式 playerOutput 落在子目录时自动计算相对音频路径 ../episode2.mp3
  const customRes = await tts.execute({
    text: '单文本交互播放器测试。',
    output: 'episode2.mp3',
    playerOutput: 'players/watch.html',
  }, exec)
  assert.equal(customRes.playerFile, join(root, 'players', 'watch.html'))
  const nestedHtml = readFileSync(customRes.playerFile, 'utf8')
  assert.ok(nestedHtml.includes('src="../episode2.mp3"'))
  assert.ok(nestedHtml.includes('单文本交互播放器测试。'))
})

test('v0.11 Wish-Driven 4: 无 ffmpeg 时 normalizeLoudness 与 scene=podcast 优雅降级不中断并返回 warnings', async (t) => {
  const { root, exec } = makeWorkspace(t, 'dsh-voice-v011-noffmpeg-')
  const tts = buildVoiceTools(resolveConfig({}), {
    tts: async () => createSilenceMp3(960, 24000),
    hasFfmpeg: () => false,
  }).find((tool) => tool.name === 'voice_tts')

  // 显式 normalizeLoudness: true 缺 ffmpeg 时不抛错，返回干净 MP3 与 warnings
  const explicitRes = await tts.execute({
    text: '无 ffmpeg 降级测试',
    normalizeLoudness: true,
    output: join(root, 'graceful.mp3'),
  }, exec)
  assert.ok(existsSync(explicitRes.output))
  assert.ok(Array.isArray(explicitRes.warnings) && explicitRes.warnings.length >= 1)
  assert.match(explicitRes.warnings[0], /ffmpeg/i)
  assert.match(tts.output.render({}, explicitRes)[0].text, /注意：.*ffmpeg/i)

  // scene: 'podcast'（默认 normalizeLoudness: true）同样优雅降级不阻断
  const podcastRes = await tts.execute({
    scene: 'podcast',
    text: '播客场景无 ffmpeg 也能一次完成',
  }, exec)
  assert.equal(podcastRes.output, join(root, 'podcast.mp3'))
  assert.ok(existsSync(podcastRes.output))
  assert.ok(Array.isArray(podcastRes.warnings) && podcastRes.warnings.length >= 1)
})

test('v0.11 Wish-Driven 5: voice_preview 支持 scene 自动精选与模糊风格词 voices[]', async (t) => {
  const { root, exec } = makeWorkspace(t, 'dsh-voice-v011-preview-')
  const calledVoices = []
  const preview = buildVoiceTools(resolveConfig({}), {
    tts: async (opts) => {
      calledVoices.push(opts.voice)
      return createSilenceMp3(480, 24000)
    },
  }).find((tool) => tool.name === 'voice_preview')

  const sceneRes = await preview.execute({ scene: 'podcast', outputDir: 'pod-prev' }, exec)
  assert.equal(sceneRes.scene, 'podcast')
  assert.equal(sceneRes.count, 4)
  assert.equal(sceneRes.failed.length, 0)
  assert.ok(sceneRes.indexHtml && existsSync(sceneRes.indexHtml))
  assert.ok(calledVoices.includes('zh-CN-XiaoxiaoNeural'))
  assert.ok(calledVoices.includes('zh-CN-YunxiNeural'))

  calledVoices.length = 0
  const fuzzyRes = await preview.execute({
    voices: ['深夜', '纪录片', '粤语男声'],
    outputDir: 'fuzzy-prev',
  }, exec)
  assert.equal(fuzzyRes.count, 3)
  assert.equal(fuzzyRes.failed.length, 0)
  assert.deepEqual(
    calledVoices.sort(),
    ['zh-CN-YunjianNeural', 'zh-CN-YunyangNeural', 'zh-HK-WanLungNeural'].sort(),
  )
  const html = readFileSync(fuzzyRes.indexHtml, 'utf8')
  assert.ok(html.includes('深夜电台') && html.includes('纪录片旁白'))
})

test('v0.11 Wish-Driven 6: 第 6 个工具 voice_prefs 全动作闭环、严格安全边界、工作区校验与只读拦截', async (t) => {
  const { root, outside, exec } = makeWorkspace(t, 'dsh-voice-v011-prefs-')
  const refInside = join(root, 'my-voice.wav')
  const refOutside = join(outside, 'secret.wav')
  writeFileSync(refInside, Buffer.from('RIFF_SAFE_SAMPLE'))
  writeFileSync(refOutside, Buffer.from('PRIVATE_SECRET'))

  let currentCfg = resolveConfig({
    ttsApiKey: 'sk-top-secret-tts-key',
    asrApiKey: 'gsk-top-secret-asr-key',
    ttsBaseUrl: 'https://secret-tts.internal/v1',
    asrBaseUrl: 'https://secret-asr.internal/v1',
    proxyUrl: 'http://user:pass@127.0.0.1:7890',
    ttsVoice: 'zh-CN-XiaoxiaoNeural',
  })
  const patches = []
  let writableFlag = true

  const prefsTool = buildVoiceTools(() => currentCfg, {
    isSettingsWritable: () => writableFlag,
    updateSettings: async (patch) => {
      patches.push(patch)
      currentCfg = resolveConfig({ ...currentCfg, ...patch })
    },
  }).find((tool) => tool.name === 'voice_prefs')

  assert.ok(prefsTool)
  assert.equal(prefsTool.isConcurrencySafe({ action: 'get' }), true)
  assert.equal(prefsTool.isConcurrencySafe({ action: 'set_default' }), false)

  // 1) get 绝不泄露任何密钥/URL/代理/引擎敏感字段
  const got = await prefsTool.execute({ action: 'get' }, exec)
  const serializedGot = JSON.stringify(got) + '\n' + prefsTool.output.render({}, got)[0].text
  for (const secret of [
    'sk-top-secret-tts-key',
    'gsk-top-secret-asr-key',
    'secret-tts.internal',
    'secret-asr.internal',
    'user:pass',
    'ttsApiKey',
    'asrApiKey',
    'ttsBaseUrl',
    'asrBaseUrl',
    'proxyUrl',
    'ttsEngine',
    'asrEngine',
  ]) {
    assert.equal(serializedGot.includes(secret), false, `voice_prefs 输出不得包含敏感字段或凭据：${secret}`)
  }
  assert.equal(got.writable, true)
  assert.equal(got.prefs.ttsVoice, 'zh-CN-XiaoxiaoNeural')

  // 2) set_default 支持模糊风格词并严格过滤任何试图偷渡的敏感字段
  const setRes = await prefsTool.execute({
    action: 'set_default',
    persona: '深夜',
    rate: '+5%',
    pitch: '-2Hz',
    ttsApiKey: 'injected-key',
    asrApiKey: 'injected-asr',
    proxyUrl: 'http://evil.proxy:8080',
    ttsEngine: 'custom',
  }, exec)
  assert.equal(setRes.prefs.ttsVoice, 'late-night-radio')
  assert.equal(setRes.prefs.ttsRate, '+5%')
  assert.equal(setRes.prefs.ttsPitch, '-2Hz')
  assert.deepEqual(patches.at(-1), { ttsVoice: 'late-night-radio', ttsRate: '+5%', ttsPitch: '-2Hz' })
  assert.equal(currentCfg.ttsApiKey, 'sk-top-secret-tts-key', '凭据绝不被 voice_prefs 篡改')

  // 校验非法语速/音调/音色
  await assert.rejects(() => prefsTool.execute({ action: 'set_default', rate: 'fast' }, exec), /rate 不合法/)
  await assert.rejects(() => prefsTool.execute({ action: 'set_default', pitch: 'high' }, exec), /pitch 不合法/)
  await assert.rejects(() => prefsTool.execute({ action: 'set_default', voice: 'not-a-real-voice' }, exec), /不合法/)

  // 3) add_pronunciation & remove_pronunciation 闭环
  const addP = await prefsTool.execute({ action: 'add_pronunciation', word: 'Dify', alias: 'Dee-fy' }, exec)
  assert.deepEqual(addP.prefs.pronunciations, [{ word: 'Dify', alias: 'Dee-fy' }])
  const updP = await prefsTool.execute({ action: 'add_pronunciation', word: 'dify', alias: 'Die-fy' }, exec)
  assert.deepEqual(updP.prefs.pronunciations, [{ word: 'dify', alias: 'Die-fy' }])
  const remP = await prefsTool.execute({ action: 'remove_pronunciation', word: 'Dify' }, exec)
  assert.equal(remP.removed, true)
  assert.deepEqual(remP.prefs.pronunciations, [])

  // 4) save_custom_voice：校验工作区内 referenceAudio、拒绝越界与路径穿越，并支持删除
  const prevPatchCount = patches.length
  await assert.rejects(
    () => prefsTool.execute({ action: 'save_custom_voice', name: '盗取', referenceAudio: refOutside }, exec),
    /必须位于会话工作区内/,
  )
  await assert.rejects(
    () => prefsTool.execute({ action: 'save_custom_voice', name: '../evil', voice: '深夜' }, exec),
    /非法路径字符/,
  )
  assert.equal(patches.length, prevPatchCount, '被拒绝的写入不得触发 updateSettings')

  const saveVoiceRes = await prefsTool.execute({
    action: 'save_custom_voice',
    name: '粤语主播',
    voice: '粤语男声',
    rate: '+8%',
    referenceAudio: 'my-voice.wav',
    referenceText: '大家好',
    instructions: '亲切自然',
  }, exec)
  assert.equal(saveVoiceRes.customVoice.voice, 'zh-HK-WanLungNeural')
  assert.equal(saveVoiceRes.customVoice.referenceAudio, 'my-voice.wav')
  assert.equal(currentCfg.customVoices.length, 1)

  const remVoiceRes = await prefsTool.execute({ action: 'remove_custom_voice', name: '粤语主播' }, exec)
  assert.equal(remVoiceRes.removed, true)
  assert.equal(currentCfg.customVoices.length, 0)

  // 5) 只读模式拦截所有写入，但允许 get
  writableFlag = false
  const roGet = await prefsTool.execute({ action: 'get' }, exec)
  assert.equal(roGet.writable, false)
  const beforeRo = patches.length
  await assert.rejects(() => prefsTool.execute({ action: 'set_default', voice: 'zh-CN-YunxiNeural' }, exec), /只读/)
  await assert.rejects(() => prefsTool.execute({ action: 'add_pronunciation', word: 'A', alias: 'B' }, exec), /只读/)
  await assert.rejects(() => prefsTool.execute({ action: 'save_custom_voice', name: 'x', voice: '深夜' }, exec), /只读/)
  assert.equal(patches.length, beforeRo)

  // 未提供 updateSettings 时同样返回只读错误
  const unboundPrefs = buildVoiceTools(resolveConfig({})).find((tool) => tool.name === 'voice_prefs')
  assert.equal((await unboundPrefs.execute({ action: 'get' }, exec)).writable, false)
  await assert.rejects(() => unboundPrefs.execute({ action: 'set_default', rate: '+5%' }, exec), /只读/)
})

test('v0.11 Wish-Driven 7: apply() 可选绑定宿主 settings 服务给 voice_prefs 与 Voice Studio，并支持模糊风格试听', async () => {
  const { apply, inject } = await import('../lib/index.js')
  assert.deepEqual(inject, ['tools'], 'HARD INVARIANT: export const inject 必须保持 [\"tools\"]')

  const registered = []
  const settingsCalls = []
  let hostWritable = true
  const ctx = {
    tools: { register(def) { registered.push(def); return () => {} } },
    inject(services, cb) {
      if (Array.isArray(services) && services.includes('settings')) {
        cb({
          settings: {
            get writable() { return hostWritable },
            async update(id, patch) { settingsCalls.push({ id, patch }) },
          },
        })
      }
    },
  }

  apply(ctx, {})
  assert.equal(registered.length, 6)
  const prefs = registered.find((t) => t.name === 'voice_prefs')
  assert.ok(prefs)

  await prefs.execute({ action: 'set_default', voice: '纪录片', rate: '-5%' })
  assert.equal(settingsCalls.length, 1)
  assert.equal(settingsCalls[0].id, 'voice')
  assert.deepEqual(settingsCalls[0].patch, { ttsVoice: 'documentary-narrator', ttsRate: '-5%' })

  hostWritable = false
  await assert.rejects(() => prefs.execute({ action: 'set_default', rate: '+0%' }), /只读/)
  assert.equal(settingsCalls.length, 1)

  // createVoiceStudioBackend 支持自然语言模糊风格词试听
  const seenVoices = []
  const backend = createVoiceStudioBackend(() => resolveConfig({}), {
    ttsWithMeta: async (opts) => {
      seenVoices.push(opts.voice)
      return { audio: createSilenceMp3(240, 24000), cues: [{ index: 1, startMs: 0, endMs: 240, text: opts.text }] }
    },
  })
  const prevRes = await backend.fetch(new Request('http://127.0.0.1:49000' + VOICE_STUDIO_API_ROUTE, {
    method: 'POST',
    headers: { 'X-DSH-VOICE': '1', 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'preview', text: '粤语试听', voice: '粤语男声' }),
  }))
  assert.equal(prevRes.status, 200)
  assert.deepEqual(seenVoices, ['zh-HK-WanLungNeural'])
})
