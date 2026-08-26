import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, writeFileSync, existsSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { buildVoiceTools, resolveConfig } from '../lib/index.js'

const dir = mkdtempSync(join(tmpdir(), 'dsh-voice-tools-'))
const audioFile = join(dir, 'clip.mp3')
writeFileSync(audioFile, Buffer.from([1, 2, 3]))

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
  const value = await tts.execute({ text: '你好世界', voice: 'zh-CN-YunxiNeural', rate: '+10%', output: join(dir, 'out.mp3') })
  assert.equal(captured.voice, 'zh-CN-YunxiNeural')
  assert.equal(captured.rate, '+10%')
  assert.equal(captured.text, '你好世界')
  assert.equal(value.bytes, 7)
  assert.ok(existsSync(join(dir, 'out.mp3')))
  await assert.rejects(() => tts.execute({ text: '', }), /为必填/)
  await assert.rejects(() => tts.execute({ text: 'x', voice: 'bad-voice' }), /音色 id 不合法/)
})

test('voice_stt：注入假 stt，校验参数与转写文件', async () => {
  let capturedArgs
  const fakeStt = async (baseUrl, apiKey, options) => { capturedArgs = { baseUrl, apiKey, options }; return { text: '转写结果', model: options.model } }
  const stt = buildVoiceTools(cfg, { stt: fakeStt }).find((t) => t.name === 'voice_stt')
  const value = await stt.execute({ audio: audioFile, language: 'zh', output: join(dir, 'transcript.txt') })
  assert.equal(capturedArgs.baseUrl, 'https://api.groq.com/openai/v1')
  assert.equal(capturedArgs.apiKey, 'test-key')
  assert.equal(capturedArgs.options.model, 'whisper-large-v3-turbo')
  assert.equal(capturedArgs.options.language, 'zh')
  assert.equal(value.text, '转写结果')
  assert.equal(readFileSync(join(dir, 'transcript.txt'), 'utf8'), '转写结果')
  await assert.rejects(() => stt.execute({ audio: join(dir, 'nope.mp3') }), /音频文件不存在/)
  await assert.rejects(() => stt.execute({ audio: audioFile, engine: 'bing' }), /engine 必须是/)
})

test('execute 返回值可 JSON 序列化', async () => {
  const list = buildVoiceTools(cfg).find((t) => t.name === 'voice_list')
  const value = await list.execute({})
  assert.deepEqual(JSON.parse(JSON.stringify(value)), value)
})

test('cleanup', () => { rmSync(dir, { recursive: true, force: true }) })
