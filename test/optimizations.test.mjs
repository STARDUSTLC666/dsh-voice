import { test } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, truncateSync, writeFileSync } from 'node:fs'
import http from 'node:http'
import net from 'node:net'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  apply,
  buildSsml,
  buildVoiceTools,
  cleanMarkdownForSpeech,
  concatMp3Buffers,
  Config,
  createProxyFetch,
  createSilenceMp3,
  filterVoices,
  formatSttSubtitles,
  formatSubtitles,
  generateSecMsGec,
  getClockSkewSeconds,
  isValidVoiceId,
  rateToSpeed,
  resetClockSkewForTest,
  resolveConfig,
  splitTextIntoChunks,
  stripId3v2,
  synthesizeOpenAiSpeech,
  synthesizeSpeech,
  synthesizeSpeechWithMetadata,
  transcribe,
} from '../lib/index.js'

const here = dirname(fileURLToPath(import.meta.url))
const repoRoot = join(here, '..')
const tick = () => new Promise((resolvePromise) => setTimeout(resolvePromise, 0))

function makeWorkspace(t, prefix = 'dsh-voice-opt-') {
  const parent = mkdtempSync(join(tmpdir(), prefix))
  const root = join(parent, 'workspace')
  const outside = join(parent, 'outside')
  mkdirSync(root)
  mkdirSync(outside)
  t.after(() => rmSync(parent, { recursive: true, force: true }))
  return { root, outside, exec: { agent: { session: { header: { cwd: root } } } } }
}

function makeFakeSocket() {
  const connections = []
  const factory = (url, options) => {
    const record = { url, headers: options?.headers ?? {}, sent: [], listeners: {}, closed: 0 }
    const socket = {
      addEventListener(type, listener) {
        (record.listeners[type] ??= []).push(listener)
      },
      on(type, listener) {
        (record.listeners[type] ??= []).push(listener)
      },
      send(data) {
        record.sent.push(data)
      },
      close() {
        record.closed += 1
      },
    }
    const fire = (type, ...args) => {
      for (const listener of record.listeners[type] ?? []) listener(...args)
    }
    connections.push({ record, socket, fire })
    return socket
  }
  return { connections, factory }
}

function binaryFrame(headerText, payload) {
  const header = Buffer.from(headerText, 'utf8')
  const headerLength = Buffer.alloc(2)
  headerLength.writeUInt16BE(header.length)
  return Buffer.concat([headerLength, header, Buffer.from(payload)])
}

async function listenServer(t, server) {
  const sockets = new Set()
  server.on('connection', (socket) => {
    sockets.add(socket)
    socket.on('close', () => sockets.delete(socket))
  })
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  t.after(async () => {
    for (const socket of sockets) socket.destroy()
    if (typeof server.closeAllConnections === 'function') server.closeAllConnections()
    await new Promise((resolve) => server.close(resolve))
  })
  return server.address().port
}

// ---------- P0: Edge TTS hardening ----------

test('P0 Edge TTS：忽略非 Path:audio 二进制帧且不破坏音频拼接', async () => {
  const ws = makeFakeSocket()
  const promise = synthesizeSpeech(
    { text: '测试音频', voice: 'zh-CN-XiaoxiaoNeural', rate: '+0%', pitch: '+0Hz' },
    { webSocketFactory: ws.factory, nowSeconds: () => 1700000000 },
    5000,
  )
  await tick()
  const conn = ws.connections[0]
  conn.fire('open')
  conn.fire('message', { data: binaryFrame('Path:audio', [1, 2, 3]) })
  conn.fire('message', { data: binaryFrame('Path:audio.metadata\r\nContent-Type:application/json', [99, 98, 97]) })
  conn.fire('message', { data: binaryFrame('Path:other', [88, 87]) })
  conn.fire('message', { data: Buffer.from([0x00, 0x20, 0x41]) }) // truncated header frame
  conn.fire('message', { data: binaryFrame('Path:audio', [4, 5]) })
  conn.fire('message', { data: 'X-Timestamp:2026\r\nPath:turn.end\r\n' })
  const audio = await promise
  assert.deepEqual([...audio], [1, 2, 3, 4, 5])
})

test('P0 Edge TTS：未收到 turn.end 前提前 close（即使已有分片）必须报错而非静默截断', async () => {
  const ws = makeFakeSocket()
  const promise = synthesizeSpeech(
    { text: '半截音频', voice: 'zh-CN-XiaoxiaoNeural', rate: '+0%', pitch: '+0Hz' },
    { webSocketFactory: ws.factory },
    5000,
  )
  await tick()
  const conn = ws.connections[0]
  conn.fire('open')
  conn.fire('message', { data: binaryFrame('Path:audio', [1, 2, 3, 4]) })
  conn.fire('close', { code: 1006 })
  await assert.rejects(() => promise, /turn\.end|关闭/)
})

test('P0 Edge TTS：HTTP 403 Date 自动校准时钟偏移并重试成功', async (t) => {
  resetClockSkewForTest()
  t.after(() => resetClockSkewForTest())
  assert.equal(getClockSkewSeconds(), 0)

  const ws = makeFakeSocket()
  const serverTimeMs = Date.now() + 3600_000
  const promise = synthesizeSpeech(
    { text: '校准测试', voice: 'zh-CN-XiaoxiaoNeural', rate: '+0%', pitch: '+0Hz' },
    { webSocketFactory: ws.factory },
    5000,
  )
  await tick()
  assert.equal(ws.connections.length, 1)
  let resumed = false
  ws.connections[0].fire('unexpected-response', {}, {
    statusCode: 403,
    headers: { date: new Date(serverTimeMs).toUTCString() },
    resume() { resumed = true },
  })
  assert.equal(resumed, true)
  assert.ok(Math.abs(getClockSkewSeconds() - 3600) < 15, 'clockSkewSeconds 应被校准到约 +3600s')

  await tick()
  assert.equal(ws.connections.length, 2, '应自动发起第 2 次重试连接')
  const second = ws.connections[1]
  const expectedToken = generateSecMsGec(Date.now() / 1000 + getClockSkewSeconds())
  assert.ok(second.record.url.includes('Sec-MS-GEC=' + expectedToken))
  second.fire('open')
  second.fire('message', { data: binaryFrame('Path:audio', [7, 8, 9]) })
  second.fire('message', { data: 'X-Timestamp:2026\r\nPath:turn.end\r\n' })
  const audio = await promise
  assert.deepEqual([...audio], [7, 8, 9])

  resetClockSkewForTest()
  assert.equal(getClockSkewSeconds(), 0)
})

test('P0 buildSsml：剔除 XML 1.0 非法控制字符、转义属性引号并支持多段语言标签', () => {
  const ssml = buildSsml({
    text: 'hello\x00\x0B\x1F "world" & <tag>',
    voice: 'sr-Latn-RS-NicholasNeural',
    rate: "+10%'\"",
    pitch: '+0Hz<',
  })
  assert.equal(/[\x00-\x08\x0B\x0C\x0E-\x1F]/.test(ssml), false)
  assert.ok(ssml.includes("xml:lang='sr-Latn-RS'"), '多段语言标签应提取 sr-Latn-RS，实际：' + ssml)
  assert.ok(ssml.includes('hello "world" &amp; &lt;tag&gt;'))
  assert.ok(ssml.includes("rate='+10%&apos;&quot;'"))
  assert.ok(ssml.includes("pitch='+0Hz&lt;'"))
})

test('P0 voices：isValidVoiceId 与 filterVoices 支持 Multilingual、方言、脚本子标签与 HD 音色', () => {
  for (const valid of [
    'zh-CN-XiaoxiaoMultilingualNeural',
    'zh-CN-henan-YundengNeural',
    'sr-Latn-RS-NicholasNeural',
    'en-US-Steffan:DragonHDLatestNeural',
    'en-US-AnythingNeural',
  ]) {
    assert.equal(isValidVoiceId(valid), true, valid + ' 应合法')
  }
  for (const invalid of ['not-a-voice', 'bad-voice', 'zh-CN-Xiaoxiao', 'not_a_voice!']) {
    assert.equal(isValidVoiceId(invalid), false, invalid + ' 应非法')
  }

  const zh = filterVoices({ locale: 'zh-CN' })
  assert.ok(zh.length > 0 && zh.every((v) => v.locale.toLowerCase().includes('zh-cn') || v.id.toLowerCase().includes('zh-cn')))
  const males = filterVoices({ gender: 'male' })
  assert.ok(males.length > 0 && males.every((v) => v.gender === 'Male'))
  const multi = filterVoices({ tag: 'multilingual' })
  assert.ok(multi.some((v) => v.id === 'en-US-AvaMultilingualNeural'))
  assert.ok(multi.some((v) => v.id === 'en-US-AndrewMultilingualNeural'))
})

// ---------- P0: Config, Health & Live Timeout ----------

test('P0 动态 timeoutMs getter 与 isConcurrencySafe 随 Volatile 配置热更新', () => {
  const parsed = Config({ timeoutMs: 5000, overwrite: false })
  const registered = []
  apply({ tools: { register(def) { registered.push(def); return () => {} } }, logger: { warn() {} } }, parsed)

  const tts = registered.find((t) => t.name === 'voice_tts')
  const stt = registered.find((t) => t.name === 'voice_stt')
  const preview = registered.find((t) => t.name === 'voice_preview')

  assert.equal(tts.timeoutMs, 15000)
  assert.equal(stt.timeoutMs, 15000)
  assert.equal(preview.timeoutMs, 30000)
  assert.equal(tts.isConcurrencySafe(), true)
  assert.equal(stt.isConcurrencySafe(), true)
  assert.equal(preview.isConcurrencySafe(), true)

  const writeSym = Symbol.for('cosmokit.volatile.write')
  const updated = Config({ timeoutMs: 20000, overwrite: true })
  parsed.timeoutMs[writeSym](updated.timeoutMs.get())
  parsed.overwrite[writeSym](updated.overwrite.get())

  assert.equal(tts.timeoutMs, 30000)
  assert.equal(stt.timeoutMs, 30000)
  assert.equal(preview.timeoutMs, 75000)
  assert.equal(tts.isConcurrencySafe(), false)
  assert.equal(stt.isConcurrencySafe(), false)
  assert.equal(preview.isConcurrencySafe(), false)
})

test('P0 voice_health：ttsReady/sttReady 拆分、scope 过滤、语速/音调校验、空白密钥裁剪与本地无密钥 custom ASR', async (t) => {
  const prevEnv = process.env.DSH_VOICE_ASR_KEY
  t.after(() => {
    if (prevEnv === undefined) delete process.env.DSH_VOICE_ASR_KEY
    else process.env.DSH_VOICE_ASR_KEY = prevEnv
  })

  process.env.DSH_VOICE_ASR_KEY = '   \t\n  '
  const healthMissing = buildVoiceTools(resolveConfig({})).find((t) => t.name === 'voice_health')
  const allRes = await healthMissing.execute({ scope: 'all' })
  assert.equal(allRes.ttsReady, true)
  assert.equal(allRes.sttReady, false)
  assert.equal(allRes.ok, false)

  const ttsOnly = await healthMissing.execute({ scope: 'tts' })
  assert.equal(ttsOnly.ttsReady, true)
  assert.equal(ttsOnly.sttReady, false)
  assert.equal(ttsOnly.ok, true)

  const sttOnly = await healthMissing.execute({ scope: 'stt' })
  assert.equal(sttOnly.ok, false)

  delete process.env.DSH_VOICE_ASR_KEY
  const badProsodyCfg = resolveConfig({ ttsRate: '1.2x', ttsPitch: 'high', asrApiKey: 'gsk_x' }, () => {})
  const badProsodyHealth = buildVoiceTools(badProsodyCfg).find((t) => t.name === 'voice_health')
  const prosodyRes = await badProsodyHealth.execute({})
  assert.equal(prosodyRes.ttsReady, false)
  assert.equal(prosodyRes.sttReady, true)
  assert.equal(prosodyRes.ok, false)

  const loopbackCfg = resolveConfig({ asrEngine: 'custom', asrBaseUrl: 'http://127.0.0.1:8000/v1' })
  const loopbackRes = await buildVoiceTools(loopbackCfg).find((t) => t.name === 'voice_health').execute({})
  assert.equal(loopbackRes.ttsReady, true)
  assert.equal(loopbackRes.sttReady, true)
  assert.equal(loopbackRes.ok, true)
})

// ---------- P1: Long-text, inputFile, Markdown, Segments, Subtitles, Oversize Audio ----------

test('长文硬切分保留完整的补充平面汉字和 emoji', () => {
  const text = '字'.repeat(2799) + '𠮷😀' + '文'.repeat(2800)
  const chunks = splitTextIntoChunks(text)
  assert.ok(chunks.every(chunk => chunk.length <= 2800 && chunk.isWellFormed()))
  assert.equal(chunks.join(''), text)
  assert.deepEqual(splitTextIntoChunks('A𠮷B', 1), ['A', '𠮷', 'B'])
  assert.deepEqual(splitTextIntoChunks(text, NaN), chunks)
})

test('P1 tts-text：cleanMarkdownForSpeech / splitTextIntoChunks / stripId3v2 / concatMp3Buffers / createSilenceMp3', () => {
  const cleaned = cleanMarkdownForSpeech('# 标题\n\n**加粗** [链接](https://example.com) ![配图](a.png) `code` https://bare.url\n```ts\nconst x = 1\n```\n> 引用')
  assert.ok(cleaned.includes('标题'))
  assert.ok(cleaned.includes('加粗'))
  assert.ok(cleaned.includes('链接'))
  assert.ok(cleaned.includes('配图'))
  assert.ok(cleaned.includes('code'))
  assert.ok(cleaned.includes('引用'))
  assert.equal(cleaned.includes('https://'), false)
  assert.equal(cleaned.includes('const x = 1'), false)
  assert.equal(cleaned.includes('**'), false)

  const longInput = '这是测试句子。'.repeat(1000)
  const chunks = splitTextIntoChunks(longInput, 2800)
  assert.ok(chunks.length > 1)
  for (const chunk of chunks) {
    assert.ok(chunk.length > 0 && chunk.length <= 2800)
  }
  assert.equal(chunks.join(''), longInput)

  const makeId3 = (payload) => {
    const body = Buffer.from(payload)
    // synchsafe size = 4 bytes payload tag body
    const tagBody = Buffer.alloc(4)
    const header = Buffer.from([0x49, 0x44, 0x33, 0x03, 0x00, 0x00, 0x00, 0x00, 0x00, 0x04])
    return Buffer.concat([header, tagBody, body])
  }
  const stripped = stripId3v2(makeId3('AUDIO'))
  assert.equal(stripped.toString('utf8'), 'AUDIO')

  const merged = concatMp3Buffers([makeId3('PART1-'), makeId3('PART2')])
  assert.ok(merged.subarray(0, 3).toString('utf8') === 'ID3')
  assert.ok(merged.toString('utf8').endsWith('PART1-PART2'))
  assert.equal(merged.toString('utf8').indexOf('ID3', 3), -1, '第二段 ID3 头应被剥离')

  const silence = createSilenceMp3(120)
  assert.ok(silence.length > 0)
  assert.equal(silence[0], 0xff)
  assert.equal(silence[1], 0xf3)
  assert.equal(createSilenceMp3(0).length, 0)
})

test('P1 voice_tts：超过 5000 字自动分段合成并拼接成单个 MP3', async (t) => {
  const { root, exec } = makeWorkspace(t)
  const longText = '第一句测试内容。'.repeat(700) // 5600 chars
  const seenChunks = []
  const tts = buildVoiceTools(resolveConfig({}), {
    tts: async ({ text }) => {
      seenChunks.push(text)
      return Buffer.from('[' + text.length + ']')
    },
  }).find((tool) => tool.name === 'voice_tts')

  const res = await tts.execute({ text: longText, output: 'long.mp3' }, exec)
  assert.ok(seenChunks.length >= 2)
  assert.equal(res.chunks, seenChunks.length)
  assert.ok(seenChunks.every((c) => c.length <= 2800))
  assert.ok(existsSync(join(root, 'long.mp3')))
  assert.equal(readFileSync(join(root, 'long.mp3'), 'utf8'), seenChunks.map((c) => '[' + c.length + ']').join(''))
})

test('P1 voice_tts：inputFile 读取工作区内 .md 自动清理 Markdown；工作区外拒绝', async (t) => {
  const { root, outside, exec } = makeWorkspace(t)
  writeFileSync(join(root, 'notes.md'), '# 周报\n\n完成 [任务](https://example.com) 与 `构建`。\n```sh\nrm -rf /\n```', 'utf8')
  const outsideMd = join(outside, 'secret.md')
  writeFileSync(outsideMd, '# Secret', 'utf8')

  let spoken = ''
  const tts = buildVoiceTools(resolveConfig({}), {
    tts: async ({ text }) => {
      spoken = text
      return Buffer.from('MP3')
    },
  }).find((tool) => tool.name === 'voice_tts')

  const res = await tts.execute({ inputFile: 'notes.md', output: 'notes.mp3' }, exec)
  assert.ok(existsSync(res.output))
  assert.ok(spoken.includes('周报') && spoken.includes('任务') && spoken.includes('构建'))
  assert.equal(spoken.includes('https://'), false)
  assert.equal(spoken.includes('rm -rf'), false)

  await assert.rejects(() => tts.execute({ inputFile: outsideMd }, exec), /工作区/)
})

test('P1 synthesizeSpeechWithMetadata：解析 Path:audio.metadata SentenceBoundary 字幕时间轴', async () => {
  const ws = makeFakeSocket()
  const promise = synthesizeSpeechWithMetadata(
    { text: '你好世界。再见。', voice: 'zh-CN-XiaoxiaoNeural', rate: '+0%', pitch: '+0Hz', boundary: 'sentence' },
    { webSocketFactory: ws.factory, nowSeconds: () => 1700000000 },
    5000,
  )
  await tick()
  const conn = ws.connections[0]
  conn.fire('open')
  assert.ok(conn.record.sent[0].includes('"sentenceBoundaryEnabled":"true"'))
  conn.fire('message', {
    data: 'X-Timestamp:2026\r\nPath:audio.metadata\r\nContent-Type:application/json\r\n\r\n'
      + JSON.stringify({
        Metadata: [
          { Type: 'SentenceBoundary', Data: { Offset: 1_000_000, Duration: 25_000_000, text: { Text: '你好世界。' } } },
          { Type: 'SentenceBoundary', Data: { Offset: 27_000_000, Duration: 12_000_000, text: { Text: '再见。' } } },
        ],
      }),
  })
  conn.fire('message', { data: binaryFrame('Path:audio', [1, 2, 3]) })
  conn.fire('message', { data: 'X-Timestamp:2026\r\nPath:turn.end\r\n' })
  const { audio, cues } = await promise
  assert.deepEqual([...audio], [1, 2, 3])
  assert.deepEqual(cues, [
    { index: 1, startMs: 100, endMs: 2600, text: '你好世界。' },
    { index: 2, startMs: 2700, endMs: 3900, text: '再见。' },
  ])
  const srt = formatSubtitles(cues, 'srt')
  assert.ok(srt.includes('00:00:00,100 --> 00:00:02,600'))
  const vtt = formatSubtitles(cues, 'vtt')
  assert.ok(vtt.startsWith('WEBVTT') && vtt.includes('00:00:02.700 --> 00:00:03.900'))
})

test('P1 voice_tts：多角色 segments 播客拼接与同步 .srt / .vtt 字幕导出', async (t) => {
  const { root, exec } = makeWorkspace(t)
  const calls = []
  const tts = buildVoiceTools(resolveConfig({}), {
    ttsWithMeta: async ({ voice, text }) => {
      calls.push({ voice, text })
      const audio = Buffer.alloc(6000, calls.length) // ~1000ms at 48kbps
      return {
        audio,
        cues: [{ index: 1, startMs: 0, endMs: 1000, text }],
      }
    },
  }).find((tool) => tool.name === 'voice_tts')

  const res = await tts.execute({
    segments: [
      { voice: 'zh-CN-XiaoxiaoMultilingualNeural', text: '欢迎收听本期播客。', pauseMs: 240 },
      { voice: 'zh-CN-YunyiMultilingualNeural', text: '今天我们来聊聊语音插件。' },
    ],
    output: 'podcast.mp3',
    subtitleOutput: 'podcast.srt',
  }, exec)

  assert.equal(calls.length, 2)
  assert.equal(calls[0].voice, 'zh-CN-XiaoxiaoMultilingualNeural')
  assert.equal(calls[1].voice, 'zh-CN-YunyiMultilingualNeural')
  assert.ok(existsSync(join(root, 'podcast.mp3')))
  assert.equal(res.subtitleFile, join(root, 'podcast.srt'))
  const srt = readFileSync(res.subtitleFile, 'utf8')
  assert.ok(srt.includes('欢迎收听本期播客。'))
  assert.ok(srt.includes('今天我们来聊聊语音插件。'))
  assert.ok(srt.includes('00:00:01,240 --> 00:00:02,240'), '第二段字幕应包含第一段音频 + 240ms 停顿偏移，实际：\n' + srt)

  const vttRes = await tts.execute({
    segments: [{ voice: 'zh-CN-XiaoxiaoNeural', text: '单段 VTT 测试' }],
    output: 'podcast2.mp3',
    subtitleOutput: 'podcast2.vtt',
  }, exec)
  assert.ok(readFileSync(vttRes.subtitleFile, 'utf8').startsWith('WEBVTT'))
})

test('P1 voice_stt：支持 subtitleOutput、本地无密钥 custom ASR 与 autoCompress 分段合并', async (t) => {
  const { root, exec } = makeWorkspace(t)
  const clip = join(root, 'clip.mp3')
  writeFileSync(clip, Buffer.from([1, 2, 3]))

  // 1) 无密钥本地 loopback custom ASR
  let seenHeaders
  const direct = await transcribe(
    'http://127.0.0.1:8000/v1',
    '',
    { audio: Buffer.from([1, 2]), filename: 'clip.mp3', model: 'whisper-1' },
    async (_url, init) => {
      seenHeaders = init.headers
      return { ok: true, status: 200, json: async () => ({ text: '本地识别', segments: [{ id: 0, start: 0, end: 1.2, text: '本地识别' }] }) }
    },
    5000,
  )
  assert.equal(direct.text, '本地识别')
  assert.equal(seenHeaders.authorization, undefined, '无密钥本地 loopback 不应发送空 Bearer header')
  assert.ok(formatSttSubtitles(direct.segments, 'srt').includes('00:00:00,000 --> 00:00:01,200'))

  // 2) voice_stt subtitleOutput (.srt / .vtt) + loopback custom
  const sttLoopback = buildVoiceTools(
    resolveConfig({ asrEngine: 'custom', asrBaseUrl: 'http://127.0.0.1:8000/v1' }),
    {
      stt: async (_url, apiKey, opts) => {
        assert.equal(apiKey, '')
        assert.equal(opts.allowEmptyApiKey, true)
        assert.equal(opts.timestamps, true)
        return {
          text: '第一句 第二句',
          model: opts.model,
          language: 'zh',
          duration: 3.5,
          segments: [
            { id: 0, start: 0, end: 1.5, text: '第一句' },
            { id: 1, start: 1.5, end: 3.5, text: '第二句' },
          ],
        }
      },
    },
  ).find((tool) => tool.name === 'voice_stt')

  const subRes = await sttLoopback.execute({ audio: 'clip.mp3', subtitleOutput: 'sub.vtt' }, exec)
  assert.equal(subRes.subtitleFile, join(root, 'sub.vtt'))
  const vtt = readFileSync(subRes.subtitleFile, 'utf8')
  assert.ok(vtt.startsWith('WEBVTT'))
  assert.ok(vtt.includes('00:00:01.500 --> 00:00:03.500'))

  // 3) >25MB 文件：默认 autoCompress=false 快速失败；autoCompress=true 调用 prepareAudio 合并分段与清理
  const bigAudio = join(root, 'big.wav')
  writeFileSync(bigAudio, '')
  truncateSync(bigAudio, 25 * 1024 * 1024 + 10)

  let cleaned = false
  let sttCalls = 0
  const sttCompress = buildVoiceTools(resolveConfig({ asrApiKey: 'test-key' }), {
    prepareAudio: async () => ({
      chunks: [
        { audio: Buffer.from('c1'), filename: 'part_000.mp3', offsetSeconds: 0 },
        { audio: Buffer.from('c2'), filename: 'part_001.mp3', offsetSeconds: 1200 },
      ],
      cleanup() { cleaned = true },
    }),
    stt: async () => {
      sttCalls += 1
      return sttCalls === 1
        ? { text: '前半段', model: 'm', segments: [{ id: 0, start: 1, end: 5, text: '前半段' }] }
        : { text: '后半段', model: 'm', segments: [{ id: 0, start: 2, end: 6, text: '后半段' }] }
    },
  }).find((tool) => tool.name === 'voice_stt')

  await assert.rejects(() => sttCompress.execute({ audio: 'big.wav' }, exec), /25MB/)
  assert.equal(sttCalls, 0)

  const compressedRes = await sttCompress.execute({
    audio: 'big.wav',
    autoCompress: true,
    subtitleOutput: 'big.srt',
  }, exec)
  assert.equal(sttCalls, 2)
  assert.equal(cleaned, true)
  assert.equal(compressedRes.text, '前半段\n后半段')
  const bigSrt = readFileSync(join(root, 'big.srt'), 'utf8')
  assert.ok(bigSrt.includes('00:20:02,000 --> 00:20:06,000'), '第二段字幕应加上 1200s 偏移，实际：\n' + bigSrt)
})

// ---------- P2: Multi-engine, SOCKS5 & Preview HTML ----------

test('P2 resolveConfig：支持 siliconflow 预设、openai/custom ttsEngine 与 socks5:// / socks5h:// proxyUrl', () => {
  const sf = resolveConfig({ asrEngine: 'siliconflow', ttsEngine: 'siliconflow' })
  assert.equal(sf.asrBaseUrl, 'https://api.siliconflow.cn/v1')
  assert.equal(sf.asrModel, 'FunAudioLLM/SenseVoiceSmall')
  assert.equal(sf.ttsBaseUrl, 'https://api.siliconflow.cn/v1')
  assert.equal(sf.ttsModel, 'FunAudioLLM/CosyVoice2-0.5B')

  const oai = resolveConfig({ ttsEngine: 'openai' })
  assert.equal(oai.ttsBaseUrl, 'https://api.openai.com/v1')
  assert.equal(oai.ttsModel, 'gpt-4o-mini-tts')

  assert.equal(resolveConfig({ proxyUrl: 'socks5://127.0.0.1:1080' }).proxyUrl, 'socks5://127.0.0.1:1080')
  assert.equal(resolveConfig({ proxyUrl: 'socks5h://127.0.0.1:1080' }).proxyUrl, 'socks5h://127.0.0.1:1080')
})

test('P2 synthesizeOpenAiSpeech 与 voice_tts 非 edge 引擎路由', async (t) => {
  assert.equal(rateToSpeed('+20%'), 1.2)
  assert.equal(rateToSpeed('-15%'), 0.85)
  assert.equal(rateToSpeed('+0%'), 1.0)

  let captured
  const audio = await synthesizeOpenAiSpeech(
    'https://api.openai.com/v1',
    'sk-test',
    { text: 'Hello world', voice: 'alloy', model: 'gpt-4o-mini-tts', speed: 1.2 },
    async (url, init) => {
      captured = { url, init, body: JSON.parse(init.body) }
      return new Response(Buffer.from('OPENAI_MP3'))
    },
    5000,
  )
  assert.equal(captured.url, 'https://api.openai.com/v1/audio/speech')
  assert.equal(captured.init.headers.authorization, 'Bearer sk-test')
  assert.equal(captured.body.voice, 'alloy')
  assert.equal(captured.body.speed, 1.2)
  assert.equal(audio.toString('utf8'), 'OPENAI_MP3')

  const { root, exec } = makeWorkspace(t)
  let routed
  const cfg = resolveConfig({ ttsEngine: 'openai', ttsApiKey: 'sk-test', ttsRate: '+20%' })
  const tts = buildVoiceTools(cfg, {
    openaiTts: async (baseUrl, apiKey, opts) => {
      routed = { baseUrl, apiKey, opts }
      return Buffer.from('ROUTED_AUDIO')
    },
  }).find((tool) => tool.name === 'voice_tts')

  const res = await tts.execute({ text: 'OpenAI 路由', voice: 'alloy', output: 'oai.mp3' }, exec)
  assert.equal(routed.baseUrl, 'https://api.openai.com/v1')
  assert.equal(routed.apiKey, 'sk-test')
  assert.equal(routed.opts.voice, 'alloy')
  assert.equal(routed.opts.speed, 1.2)
  assert.equal(readFileSync(join(root, 'oai.mp3'), 'utf8'), 'ROUTED_AUDIO')
  assert.equal(res.voice, 'alloy')
})

test('P2 createProxyFetch：真实本地 TCP SOCKS5 服务器端到端隧道转发 HTTP 请求', async (t) => {
  let targetHits = 0
  const targetServer = http.createServer((req, res) => {
    targetHits += 1
    res.writeHead(200, { 'content-type': 'application/json' })
    res.end(JSON.stringify({ ok: true, path: req.url }))
  })
  const targetPort = await listenServer(t, targetServer)

  let socksTunnels = 0
  const upstreams = new Set()
  const socksServer = net.createServer((client) => {
    let stage = 'greeting'
    let buffer = Buffer.alloc(0)
    let upstream = null
    client.on('data', (chunk) => {
      if (stage === 'tunnel') return
      buffer = Buffer.concat([buffer, chunk])
      if (stage === 'greeting') {
        if (buffer.length < 2) return
        const nmethods = buffer[1]
        if (buffer.length < 2 + nmethods) return
        buffer = buffer.subarray(2 + nmethods)
        client.write(Buffer.from([0x05, 0x00]))
        stage = 'request'
      }
      if (stage === 'request') {
        if (buffer.length < 4) return
        const atyp = buffer[3]
        let host = ''
        let offset = 4
        if (atyp === 0x01) {
          if (buffer.length < offset + 4 + 2) return
          host = `${buffer[offset]}.${buffer[offset + 1]}.${buffer[offset + 2]}.${buffer[offset + 3]}`
          offset += 4
        } else if (atyp === 0x03) {
          if (buffer.length < offset + 1) return
          const len = buffer[offset]
          if (buffer.length < offset + 1 + len + 2) return
          host = buffer.subarray(offset + 1, offset + 1 + len).toString('utf8')
          offset += 1 + len
        } else if (atyp === 0x04) {
          if (buffer.length < offset + 16 + 2) return
          host = '::1'
          offset += 16
        }
        const port = buffer.readUInt16BE(offset)
        const remainder = buffer.subarray(offset + 2)
        stage = 'tunnel'
        socksTunnels += 1
        upstream = net.connect(port, host, () => {
          client.write(Buffer.from([0x05, 0x00, 0x00, 0x01, 0, 0, 0, 0, 0, 0]))
          if (remainder.length > 0) upstream.write(remainder)
          client.pipe(upstream)
          upstream.pipe(client)
        })
        upstreams.add(upstream)
        upstream.on('close', () => upstreams.delete(upstream))
        upstream.on('error', () => client.destroy())
        client.on('error', () => upstream.destroy())
      }
    })
  })
  const socksPort = await listenServer(t, socksServer)
  t.after(() => { for (const u of upstreams) u.destroy() })

  for (const scheme of ['socks5', 'socks5h']) {
    const proxyFetch = createProxyFetch(`${scheme}://127.0.0.1:${socksPort}`)
    const res = await proxyFetch(`http://127.0.0.1:${targetPort}/hello-${scheme}`)
    assert.equal(res.status, 200)
    const body = await res.json()
    assert.deepEqual(body, { ok: true, path: `/hello-${scheme}` })
  }
  assert.equal(targetHits, 2)
  assert.equal(socksTunnels, 2)

  // HTTPS over SOCKS5：目标端口返回非 TLS 数据时，tlsSocket 在 secureConnect 前触发 error 应通过 cb(err, null) 干净拒绝
  const httpsProxyFetch = createProxyFetch(`socks5://127.0.0.1:${socksPort}`)
  await assert.rejects(
    () => httpsProxyFetch(`https://127.0.0.1:${targetPort}/tls-handshake-error`),
    (err) => err instanceof Error,
  )

  // AbortSignal 透传到 SOCKS5 隧道握手
  const silentSocks = net.createServer(() => {})
  const silentPort = await listenServer(t, silentSocks)
  const controller = new AbortController()
  const silentFetch = createProxyFetch(`socks5://127.0.0.1:${silentPort}`)
  const pending = silentFetch(`http://127.0.0.1:${targetPort}/aborted`, { signal: controller.signal })
  setTimeout(() => controller.abort(new Error('socks-aborted')), 25)
  await assert.rejects(() => pending, (err) => err instanceof Error)
})

test('P2 voice_preview 生成 voice_previews/index.html 试听页；skills/voice-workflow/SKILL.md 存在且列入 package.json files', async (t) => {
  const { root, exec } = makeWorkspace(t)
  const preview = buildVoiceTools(resolveConfig({}), {
    tts: async ({ voice }) => Buffer.from('MP3:' + voice),
  }).find((tool) => tool.name === 'voice_preview')

  const res = await preview.execute({ voices: ['zh-CN-XiaoxiaoNeural', 'zh-CN-YunxiNeural'] }, exec)
  assert.equal(res.indexHtml, join(root, 'voice_previews', 'index.html'))
  assert.ok(existsSync(res.indexHtml))
  const html = readFileSync(res.indexHtml, 'utf8')
  assert.ok(html.includes('<audio'))
  assert.ok(html.includes('voice-preview-zh-CN-XiaoxiaoNeural.mp3'))
  assert.ok(html.includes('voice-preview-zh-CN-YunxiNeural.mp3'))

  const skillPath = join(repoRoot, 'skills', 'voice-workflow', 'SKILL.md')
  assert.ok(existsSync(skillPath), 'skills/voice-workflow/SKILL.md 必须存在')
  const skillText = readFileSync(skillPath, 'utf8')
  assert.match(skillText, /^---\s*\r?\n[\s\S]*?name:\s*voice-workflow/m)

  const pkg = JSON.parse(readFileSync(join(repoRoot, 'package.json'), 'utf8'))
  assert.ok(Array.isArray(pkg.files) && pkg.files.includes('skills'), 'package.json files 必须包含 skills')
})
