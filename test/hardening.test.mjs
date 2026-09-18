import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildVoiceTools, resolveConfig, synthesizeSpeech, transcribe } from '../lib/index.js'

/** 让出一轮事件循环。 */
const tick = () => new Promise((resolvePromise) => setTimeout(resolvePromise, 0))
const here = dirname(fileURLToPath(import.meta.url))

/** 只会记录 close 次数的假 WebSocket。 */
function makeIdleSocket() {
  const record = { closed: 0 }
  const socket = {
    addEventListener() {},
    send() {},
    close() { record.closed += 1 },
  }
  return { record, factory: () => socket }
}

const EIGHT_VOICES = [
  'zh-CN-XiaoxiaoNeural', 'zh-CN-XiaoyiNeural', 'zh-CN-YunxiNeural', 'zh-CN-YunyangNeural',
  'en-US-AriaNeural', 'en-US-JennyNeural', 'ja-JP-NanamiNeural', 'ko-KR-SunHiNeural',
]

// ---------- 1) exec.signal 透传与 preview 有界并发 ----------

test('voice_tts：已取消的 exec.signal 必须立即按取消原因 reject', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'dsh-voice-abort-tts-'))
  const controller = new AbortController()
  controller.abort(new Error('用户取消了本次合成'))
  let called = false
  const tts = buildVoiceTools(resolveConfig({}), { tts: async () => { called = true; return Buffer.from('x') } }).find((t) => t.name === 'voice_tts')
  const startedAt = Date.now()
  await assert.rejects(
    () => tts.execute({ text: '你好', output: join(dir, 'x.mp3') }, { signal: controller.signal }),
    (error) => {
      assert.ok(error instanceof Error && error.message.includes('用户取消了本次合成'), '应抛出取消原因，实际：' + String(error))
      return true
    },
  )
  assert.ok(Date.now() - startedAt < 100, '已取消的 signal 应在 100ms 内 reject')
  assert.equal(called, false, '已取消时不应调用 TTS')
  rmSync(dir, { recursive: true, force: true })
})

test('voice_stt：已取消的 exec.signal 必须立即按取消原因 reject', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'dsh-voice-abort-stt-'))
  const audio = join(dir, 'clip.mp3')
  writeFileSync(audio, Buffer.from([1, 2, 3]))
  const controller = new AbortController()
  controller.abort(new Error('用户取消了本次转写'))
  let called = false
  const stt = buildVoiceTools(resolveConfig({ asrApiKey: 'k' }), { stt: async () => { called = true; return { text: 'x', model: 'm' } } }).find((t) => t.name === 'voice_stt')
  const startedAt = Date.now()
  await assert.rejects(
    () => stt.execute({ audio }, { signal: controller.signal }),
    (error) => {
      assert.ok(error instanceof Error && error.message.includes('用户取消了本次转写'), '应抛出取消原因，实际：' + String(error))
      return true
    },
  )
  assert.ok(Date.now() - startedAt < 100, '已取消的 signal 应在 100ms 内 reject')
  assert.equal(called, false, '已取消时不应调用 ASR')
  rmSync(dir, { recursive: true, force: true })
})

test('synthesizeSpeech：abort 时关闭 socket 并按取消原因 reject', { timeout: 8000 }, async () => {
  const ws = makeIdleSocket()
  const controller = new AbortController()
  const promise = synthesizeSpeech(
    { text: '你好', voice: 'zh-CN-XiaoxiaoNeural', rate: '+0%', pitch: '+0Hz' },
    { webSocketFactory: ws.factory },
    1500,
    controller.signal,
  )
  await tick()
  controller.abort(new Error('取消合成'))
  await assert.rejects(() => promise, /取消合成/)
  assert.equal(ws.record.closed, 1, 'abort 必须关闭 WebSocket')
})

test('transcribe：abort 传播到 fetch 并按取消原因 reject', { timeout: 8000 }, async () => {
  const controller = new AbortController()
  let seenSignal
  const fetchImpl = async (_url, init) => {
    seenSignal = init.signal
    return await new Promise((_resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('fetch 未在期限内取消')), 3000)
      init.signal.addEventListener('abort', () => { clearTimeout(timer); reject(init.signal.reason) }, { once: true })
    })
  }
  const promise = transcribe(
    'https://asr.example.com/v1', 'key',
    { audio: Buffer.from([1]), filename: 'a.mp3', model: 'm' },
    fetchImpl, 1500, controller.signal,
  )
  await tick()
  assert.ok(seenSignal, 'fetch 必须收到 signal')
  controller.abort(new Error('取消转写'))
  await assert.rejects(() => promise, /取消转写/)
})

test('voice_preview：同时在跑的 TTS 不超过 3 路', { timeout: 8000 }, async () => {
  const sessionDir = mkdtempSync(join(tmpdir(), 'dsh-voice-preview-limit-'))
  let started = 0
  let active = 0
  let maxActive = 0
  const gates = []
  const tts = async () => {
    started += 1
    active += 1
    maxActive = Math.max(maxActive, active)
    await new Promise((resolvePromise) => gates.push(resolvePromise))
    active -= 1
    return Buffer.from('audio')
  }
  const preview = buildVoiceTools(resolveConfig({ timeoutMs: 5000 }), { tts }).find((t) => t.name === 'voice_preview')
  const promise = preview.execute({ voices: EIGHT_VOICES, outputDir: join(sessionDir, 'out') })
  for (let i = 0; i < 50 && started < 3; i++) await tick()
  assert.equal(started, 3, '有界并发首批只应启动 3 路，实际 ' + started)
  assert.equal(maxActive, 3, '恰好 3 路在跑，实际 ' + maxActive)
  gates.shift()()
  for (let i = 0; i < 50 && started < 4; i++) await tick()
  assert.equal(started, 4, '完成一路后应补位第 4 路')
  assert.ok(maxActive <= 3, '同时在跑的 TTS 不应超过 3，实际 ' + maxActive)
  let settled = false
  promise.then(() => { settled = true }, () => { settled = true })
  while (!settled) {
    if (gates.length > 0) gates.shift()()
    else await tick()
  }
  const value = await promise
  assert.equal(value.count, 8)
  assert.equal(value.failed.length, 0)
  rmSync(sessionDir, { recursive: true, force: true })
})

test('voice_preview：abort 立即中断进行中的合成并以取消原因 reject', { timeout: 8000 }, async () => {
  const sessionDir = mkdtempSync(join(tmpdir(), 'dsh-voice-preview-abort-'))
  const controller = new AbortController()
  const tts = async () => { // 故意忽略 signal：execute 也必须能中断
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 20))
    return Buffer.from('audio')
  }
  const preview = buildVoiceTools(resolveConfig({ timeoutMs: 5000 }), { tts }).find((t) => t.name === 'voice_preview')
  const promise = preview.execute({ voices: EIGHT_VOICES, outputDir: join(sessionDir, 'out') }, { signal: controller.signal })
  await tick()
  controller.abort(new Error('取消试听'))
  await assert.rejects(() => promise, /取消试听/)
  rmSync(sessionDir, { recursive: true, force: true })
})

// ---------- 2) 非法字段逐项回退 ----------

test('resolveConfig：proxyUrl 非法只回退该字段，其余生效且告警点名 proxyUrl', () => {
  const warnings = []
  const originalWarn = console.warn
  console.warn = (...args) => { warnings.push(args.map((a) => String(a)).join(' ')) }
  let cfg
  try {
    cfg = resolveConfig({ proxyUrl: '127.0.0.1:7890', asrApiKey: 'gsk_x', ttsVoice: 'zh-CN-YunxiNeural', timeoutMs: 45000 })
  } finally {
    console.warn = originalWarn
  }
  assert.equal(cfg.proxyUrl, '', '非法 proxyUrl 应回退为未配置')
  assert.equal(cfg.asrApiKey, 'gsk_x', '合法 asrApiKey 必须保留')
  assert.equal(cfg.ttsVoice, 'zh-CN-YunxiNeural', '合法 ttsVoice 必须保留')
  assert.equal(cfg.timeoutMs, 45000, '合法 timeoutMs 必须保留')
  assert.ok(warnings.some((line) => line.includes('proxyUrl')), '告警必须点名 proxyUrl，实际：' + JSON.stringify(warnings))
})

test('voice_health：proxyUrl 非法时不再误报其它字段全丢', async () => {
  const originalWarn = console.warn
  console.warn = () => {}
  let cfg
  try {
    cfg = resolveConfig({ proxyUrl: 'bad-proxy', asrApiKey: 'gsk_x', ttsVoice: 'zh-CN-YunxiNeural' })
  } finally {
    console.warn = originalWarn
  }
  const health = buildVoiceTools(cfg).find((t) => t.name === 'voice_health')
  const value = await health.execute({})
  assert.equal(value.ok, true)
  const key = value.checks.find((c) => c.name === 'ASR 密钥')
  assert.equal(key.ok, true, 'asrApiKey 合法时 voice_health 不应报未配置')
  const voice = value.checks.find((c) => c.name === 'TTS 音色')
  assert.equal(voice.ok, true)
})

// ---------- 3) health 补 custom baseUrl + schema 透传 enum/items ----------

test('voice_health：asrEngine=custom 缺 asrBaseUrl 必须不通过且点名 asrBaseUrl', async () => {
  const cfg = resolveConfig({ asrEngine: 'custom', asrApiKey: 'gsk_x' })
  assert.equal(cfg.asrBaseUrl, '')
  const health = buildVoiceTools(cfg).find((t) => t.name === 'voice_health')
  const value = await health.execute({})
  assert.equal(value.ok, false, 'custom 缺 baseUrl 时自检必须不通过')
  const bad = value.checks.find((c) => c.ok === false && String(c.detail).includes('asrBaseUrl'))
  assert.ok(bad, '必须有检查项给出 asrBaseUrl 指引，实际：' + JSON.stringify(value.checks))
})

test('工具参数 schema：engine 有 enum、voices 有 items', () => {
  const tools = buildVoiceTools(resolveConfig({}))
  const stt = tools.find((t) => t.name === 'voice_stt')
  assert.deepEqual(stt.parameters.properties.engine.enum, ['groq', 'openai', 'custom'])
  const preview = tools.find((t) => t.name === 'voice_preview')
  assert.deepEqual(preview.parameters.properties.voices.items, { type: 'string' })
})

// ---------- 4) voice_stt 相对 audio 按会话工作区解析 ----------

test('voice_stt：相对 audio 按 session.header.cwd 解析并读到文件', async () => {
  const sessionDir = mkdtempSync(join(tmpdir(), 'dsh-voice-stt-session-'))
  mkdirSync(join(sessionDir, 'sub'), { recursive: true })
  const relative = 'sub/meeting.mp3'
  writeFileSync(join(sessionDir, 'sub', 'meeting.mp3'), Buffer.from([1, 2, 3]))
  let captured
  const stt = buildVoiceTools(resolveConfig({ asrApiKey: 'k' }), {
    stt: async (_baseUrl, _apiKey, options) => { captured = options; return { text: '转写结果', model: options.model } },
  }).find((t) => t.name === 'voice_stt')
  const value = await stt.execute({ audio: relative }, { agent: { session: { header: { cwd: sessionDir } } } })
  assert.equal(value.audio, join(sessionDir, relative), '相对 audio 应解析到会话工作区')
  assert.ok(captured, '应把会话工作区里的音频交给 ASR')
  assert.deepEqual([...captured.audio], [1, 2, 3])
  rmSync(sessionDir, { recursive: true, force: true })
})

// ---------- 5) 文档与描述覆盖全部 5 个注册工具 ----------

test('README / package.json / 插件入口注释覆盖全部 5 个注册工具', () => {
  const pkg = JSON.parse(readFileSync(join(here, '..', 'package.json'), 'utf8'))
  // 仓库约定：description 是一句话、不罗列工具名（清单在 README）——所以这里反过来断言它不含工具名。
  assert.ok(typeof pkg.description === 'string' && pkg.description.trim() !== '', 'package.json 描述不能为空')
  for (const name of ['voice_tts', 'voice_stt', 'voice_list', 'voice_preview', 'voice_health']) {
    assert.ok(!pkg.description.includes(name), 'package.json 描述不应罗列工具名：' + name)
  }
  for (const file of ['README.md', 'README.en.md']) {
    const text = readFileSync(join(here, '..', file), 'utf8')
    for (const name of ['voice_tts', 'voice_stt', 'voice_list', 'voice_preview', 'voice_health']) {
      assert.ok(text.includes(name), file + ' 缺少 ' + name)
    }
  }
  const entry = readFileSync(join(here, '..', 'src', 'index.ts'), 'utf8')
  assert.ok(entry.includes('voice_preview') && entry.includes('voice_health'), 'src/index.ts 注释未提及 voice_preview / voice_health')
})
