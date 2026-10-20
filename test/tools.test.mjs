import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, writeFileSync, existsSync, readFileSync, rmSync, truncateSync, statSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { buildVoiceTools, resolveConfig } from '../lib/index.js'

const dir = mkdtempSync(join(tmpdir(), 'dsh-voice-tools-'))
const audioFile = join(dir, 'clip.mp3')
writeFileSync(audioFile, Buffer.from([1, 2, 3]))
/** 会话工作区 = dir：音频、输出都落在工作区内。 */
const exec = { agent: { session: { header: { cwd: dir } } } }

const cfg = resolveConfig({ asrApiKey: 'test-key', timeoutMs: 5000 })

test('构建 5 个工具且名字正确', () => {
  const names = buildVoiceTools(cfg).map((t) => t.name).sort()
  assert.deepEqual(names, ['voice_health', 'voice_list', 'voice_preview', 'voice_stt', 'voice_tts'])
})

test('每个工具 schema 是 object JSON Schema，输出含 render', () => {
  for (const tool of buildVoiceTools(cfg)) {
    assert.equal(tool.parameters.type, 'object')
    assert.equal(typeof tool.parameters.properties, 'object')
    assert.equal(tool.output.schema.type, 'object')
    assert.equal(typeof tool.output.render, 'function')
    assert.equal(typeof tool.execute, 'function')
  }
})

test('voice_list 返回清单', async () => {
  const list = buildVoiceTools(cfg).find((t) => t.name === 'voice_list')
  const value = await list.execute({})
  assert.equal(value.count, value.voices.length)
  assert.ok(value.count >= 20)
  const blocks = list.output.render({}, value)
  assert.ok(blocks[0].text.includes('zh-CN-XiaoxiaoNeural'))
})

test('voice_tts：注入假 tts，校验输出与命名', async () => {
  let captured
  const fakeTts = async (options) => { captured = options; return Buffer.from('MP3DATA') }
  const tts = buildVoiceTools(cfg, { tts: fakeTts }).find((t) => t.name === 'voice_tts')
  const value = await tts.execute({ text: '你好世界', voice: 'zh-CN-YunxiNeural', rate: '+10%', output: join(dir, 'out.mp3') }, exec)
  assert.equal(captured.voice, 'zh-CN-YunxiNeural')
  assert.equal(captured.rate, '+10%')
  assert.equal(captured.text, '你好世界')
  assert.equal(value.bytes, 7)
  assert.ok(existsSync(join(dir, 'out.mp3')))
  await assert.rejects(() => tts.execute({ text: '', }, exec), /为必填/)
  await assert.rejects(() => tts.execute({ text: 'x', voice: 'bad-voice' }, exec), /音色 id 不合法/)
})

test('voice_stt：注入假 stt，校验参数与转写文件', async () => {
  let capturedArgs
  const fakeStt = async (baseUrl, apiKey, options) => { capturedArgs = { baseUrl, apiKey, options }; return { text: '转写结果', model: options.model } }
  const stt = buildVoiceTools(cfg, { stt: fakeStt }).find((t) => t.name === 'voice_stt')
  const value = await stt.execute({ audio: audioFile, language: 'zh', output: join(dir, 'transcript.txt') }, exec)
  assert.equal(capturedArgs.baseUrl, 'https://api.groq.com/openai/v1')
  assert.equal(capturedArgs.apiKey, 'test-key')
  assert.equal(capturedArgs.options.model, 'whisper-large-v3-turbo')
  assert.equal(capturedArgs.options.language, 'zh')
  assert.equal(value.text, '转写结果')
  assert.equal(readFileSync(join(dir, 'transcript.txt'), 'utf8'), '转写结果')
  await assert.rejects(() => stt.execute({ audio: join(dir, 'nope.mp3') }, exec), /音频文件不存在/)
  await assert.rejects(() => stt.execute({ audio: audioFile, engine: 'bing' }, exec), /engine 必须是/)
})

test('execute 返回值可 JSON 序列化', async () => {
  const list = buildVoiceTools(cfg).find((t) => t.name === 'voice_list')
  const value = await list.execute({})
  assert.deepEqual(JSON.parse(JSON.stringify(value)), value)
})

test('voice_stt：超过 25MB 的稀疏文件在读入前快速失败', async () => {
  const bigDir = mkdtempSync(join(tmpdir(), 'dsh-voice-big-'))
  const bigAudio = join(bigDir, 'big.mp3')
  writeFileSync(bigAudio, '')
  truncateSync(bigAudio, 25 * 1024 * 1024 + 1) // 稀疏文件：不占磁盘，但 size 超限
  let called = false
  const stt = buildVoiceTools(cfg, { stt: async () => { called = true; return { text: '不应到达', model: 'm' } } }).find((t) => t.name === 'voice_stt')
  const startedAt = Date.now()
  await assert.rejects(() => stt.execute({ audio: bigAudio }, { agent: { session: { header: { cwd: bigDir } } } }), /音频超过 25MB/)
  assert.equal(called, false, '超限文件不应进入转写，更不应被整文件读入内存')
  assert.ok(Date.now() - startedAt < 2000, '应在 statSync 后立即失败')
  rmSync(bigDir, { recursive: true, force: true })
})

test('voice_tts：output 指向不存在的新目录时自动建目录', async () => {
  const tts = buildVoiceTools(cfg, { tts: async () => Buffer.from('MP3DATA') }).find((t) => t.name === 'voice_tts')
  const output = join(dir, 'brand-new', 'nested', 'voice.mp3')
  const value = await tts.execute({ text: '你好', output }, exec)
  assert.equal(value.output, output)
  assert.ok(existsSync(output), '应写入并创建缺失目录')
  assert.equal(readFileSync(output, 'utf8'), 'MP3DATA')
})

test('voice_stt：output 指向不存在的新目录时自动建目录', async () => {
  const stt = buildVoiceTools(cfg, { stt: async (_baseUrl, _apiKey, options) => ({ text: '转写结果', model: options.model }) }).find((t) => t.name === 'voice_stt')
  const output = join(dir, 'stt-new', 'nested', 'transcript.txt')
  const value = await stt.execute({ audio: audioFile, output }, exec)
  assert.equal(value.transcriptFile, output)
  assert.equal(readFileSync(output, 'utf8'), '转写结果')
})

test('voice_tts：默认与相对输出落在 session.header.cwd 而不是宿主 cwd', async () => {
  const sessionDir = mkdtempSync(join(tmpdir(), 'dsh-voice-session-'))
  const sessionExec = { agent: { session: { header: { cwd: sessionDir } } } }
  const tts = buildVoiceTools(cfg, { tts: async () => Buffer.from('MP3DATA') }).find((t) => t.name === 'voice_tts')
  const value = await tts.execute({ text: '你好世界' }, sessionExec)
  assert.equal(value.output, join(sessionDir, 'voice_output.mp3'))
  assert.ok(existsSync(value.output), '默认输出应落在会话工作区')
  const relative = await tts.execute({ text: '相对路径', output: 'nested/relative.mp3' }, sessionExec)
  assert.equal(relative.output, join(sessionDir, 'nested', 'relative.mp3'))
  assert.ok(existsSync(relative.output), '相对 output 应落在会话工作区')
  rmSync(sessionDir, { recursive: true, force: true })
})

// ---------- 工作区边界（issue #2） ----------

test('voice_tts / voice_stt：工作区外的输出路径直接拒绝', async () => {
  const outside = mkdtempSync(join(tmpdir(), 'dsh-voice-outside-'))
  const tts = buildVoiceTools(cfg, { tts: async () => Buffer.from('MP3DATA') }).find((t) => t.name === 'voice_tts')
  const stt = buildVoiceTools(cfg, { stt: async () => ({ text: 'x', model: 'm' }) }).find((t) => t.name === 'voice_stt')
  await assert.rejects(() => tts.execute({ text: '你好', output: join(outside, 'x.mp3') }, exec), /超出会话工作区/)
  await assert.rejects(() => tts.execute({ text: '你好', output: '../escape.mp3' }, exec), /超出会话工作区/)
  await assert.rejects(() => stt.execute({ audio: audioFile, output: join(outside, 'x.txt') }, exec), /超出会话工作区/)
  assert.equal(existsSync(join(outside, 'x.mp3')), false)
  rmSync(outside, { recursive: true, force: true })
})

test('voice_stt：工作区外的音频（例如宿主的私钥）不会被读取或上传', async () => {
  const outside = mkdtempSync(join(tmpdir(), 'dsh-voice-secret-'))
  const secret = join(outside, 'id_ed25519')
  writeFileSync(secret, 'PRIVATE KEY')
  let called = false
  const stt = buildVoiceTools(cfg, { stt: async () => { called = true; return { text: 'x', model: 'm' } } }).find((t) => t.name === 'voice_stt')
  await assert.rejects(() => stt.execute({ audio: secret }, exec), /必须位于会话工作区内/)
  await assert.rejects(() => stt.execute({ audio: '../id_ed25519' }, exec), /音频文件不存在|必须位于会话工作区内/)
  assert.equal(called, false, '越界音频不应进入转写')
  rmSync(outside, { recursive: true, force: true })
})

test('voice_stt：转写文件以 0600 写入（Windows 不检查权限位）', { skip: process.platform === 'win32' }, async () => {
  const stt = buildVoiceTools(cfg, { stt: async () => ({ text: '私密转写', model: 'm' }) }).find((t) => t.name === 'voice_stt')
  const output = join(dir, 'mode-check.txt')
  await stt.execute({ audio: audioFile, output }, exec)
  assert.equal(statSync(output).mode & 0o777, 0o600)
})

test('voice_stt：engine 只允许与配置一致，不会把密钥发到别的主机', async () => {
  let capturedArgs
  const fakeStt = async (baseUrl, apiKey, options) => { capturedArgs = { baseUrl, apiKey, options }; return { text: 'ok', model: options.model } }
  const stt = buildVoiceTools(cfg, { stt: fakeStt }).find((t) => t.name === 'voice_stt')
  await assert.rejects(() => stt.execute({ audio: audioFile, engine: 'openai' }, exec), /不支持用 engine 参数临时换引擎/)
  assert.equal(capturedArgs, undefined, '引擎不一致时不应发起转写')
  const same = await stt.execute({ audio: audioFile, engine: 'groq' }, exec)
  assert.equal(same.text, 'ok')
  assert.equal(capturedArgs.baseUrl, 'https://api.groq.com/openai/v1')
})

test('voice_stt：配置了 asrBaseUrl 时请求发往该地址，即使沿用 groq/openai 预设', async () => {
  const gateway = resolveConfig({ asrEngine: 'groq', asrBaseUrl: 'https://asr.example.com/v1', asrApiKey: 'gateway-key', timeoutMs: 5000 })
  let capturedArgs
  const stt = buildVoiceTools(gateway, { stt: async (baseUrl, apiKey, options) => { capturedArgs = { baseUrl, apiKey, options }; return { text: 'ok', model: options.model } } }).find((t) => t.name === 'voice_stt')
  await stt.execute({ audio: audioFile }, exec)
  assert.equal(capturedArgs.baseUrl, 'https://asr.example.com/v1')
  assert.equal(capturedArgs.apiKey, 'gateway-key')
})

test('cleanup', () => { rmSync(dir, { recursive: true, force: true }) })
