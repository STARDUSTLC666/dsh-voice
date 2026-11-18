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
  splitInlinePauses,
  stripInlinePauses,
  stripMp3MetadataFrame,
  synthesizeSpeech,
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

test('v0.10 Upgrade 3: 英文词边界保护不误伤 POST 子串，内联 [pause] 支持 Edge <break/> 与非 Edge 静音帧拼接', async (t) => {
  assert.equal(buildPronunciationPattern([]), null)
  const plain = applyPronunciationsPlain('POST request on Mac OS系统', [{ word: 'OS', alias: 'Operating System' }])
  assert.equal(plain, 'POST request on Mac Operating System系统')

  const ssml = buildSsml({
    text: 'POST on OS [pause:600ms] 重构',
    voice: 'zh-CN-XiaoxiaoNeural',
    rate: '+0%',
    pitch: '+0Hz',
    pronunciations: [
      { word: 'OS', alias: 'O S' },
      { word: '重构', alias: '虫构' },
    ],
  })
  assert.ok(ssml.includes('POST on '), `POST 应保持原样，实际 SSML：${ssml}`)
  assert.ok(!ssml.includes("alias='O S'>OS</sub>T"), '不应误匹配 POST 内部的 OS')
  assert.ok(ssml.includes("<sub alias='O S'>OS</sub>"))
  assert.ok(ssml.includes("<break time='600ms'/>"))
  assert.ok(ssml.includes("<sub alias='虫构'>重构</sub>"))

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
})
