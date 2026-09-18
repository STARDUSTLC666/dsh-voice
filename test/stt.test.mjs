import { test } from 'node:test'
import assert from 'node:assert/strict'
import { transcribe } from '../lib/index.js'

test('transcribe：multipart 上传并解析 text', async () => {
  const captured = {}
  const fetchImpl = async (url, init) => {
    captured.url = url
    captured.headers = init.headers
    captured.body = init.body
    return { ok: true, status: 200, json: async () => ({ text: '你好世界' }) }
  }
  const result = await transcribe('https://api.example.com/v1', 'key123', { audio: Buffer.from([1, 2]), filename: 'a.mp3', model: 'whisper-1' }, fetchImpl, 5000)
  assert.equal(captured.url, 'https://api.example.com/v1/audio/transcriptions')
  assert.equal(captured.headers.authorization, 'Bearer key123')
  assert.ok(captured.body instanceof FormData)
  assert.equal(result.text, '你好世界')
  assert.equal(result.model, 'whisper-1')
})

test('缺密钥抛中文错误', async () => {
  await assert.rejects(() => transcribe('https://x', '', { audio: Buffer.from([1]), filename: 'a.mp3', model: 'm' }, globalThis.fetch, 5000), /未配置 ASR 密钥.*DSH_VOICE_ASR_KEY/)
})

test('音频超 25MB 抛错', async () => {
  await assert.rejects(() => transcribe('https://x', 'k', { audio: Buffer.alloc(25 * 1024 * 1024 + 1), filename: 'a.mp3', model: 'm' }, globalThis.fetch, 5000), /25MB/)
})

test('HTTP 非 200 抛中文错误（附响应体）', async () => {
  const fetchImpl = async () => ({ ok: false, status: 401, text: async () => 'bad key' })
  await assert.rejects(() => transcribe('https://x', 'k', { audio: Buffer.from([1]), filename: 'a.mp3', model: 'm' }, fetchImpl, 5000), /HTTP 401.*bad key/)
})

test('网络失败抛错（含代理提示）', async () => {
  const fetchImpl = async () => { throw new Error('connect ECONNREFUSED') }
  await assert.rejects(() => transcribe('https://x', 'k', { audio: Buffer.from([1]), filename: 'a.mp3', model: 'm' }, fetchImpl, 5000), /proxyUrl/)
})

test('配代理时上传的必须是 undici 认得的 multipart，而不是 "[object FormData]"', async () => {
  // 人真的会这么配：国内用 Groq/OpenAI 时按 README 配 proxyUrl → 走 undici 的 fetch。
  // 而 undici 只认自己那套 FormData/Blob：喂它 Node 全局 FormData 会被当普通对象
  // 序列化成 "[object FormData]"（content-type: text/plain），线上表现就是 400。
  class UndiciFormData {
    constructor() { this.parts = [] }
    append(name, value, filename) { this.parts.push({ name, filename, size: value.size ?? 0 }) }
  }
  let seen = null
  const fetchImpl = Object.assign(async (url, init) => {
    if (init.body instanceof UndiciFormData) {
      seen = { contentType: 'multipart/form-data', fields: init.body.parts.map((p) => p.name), filename: init.body.parts[0].filename }
      return { ok: true, status: 200, json: async () => ({ text: '识别成功' }) }
    }
    seen = { contentType: 'text/plain', body: String(init.body) }
    return { ok: false, status: 400, text: async () => 'expected multipart/form-data' }
  }, { FormData: UndiciFormData })

  const result = await transcribe('https://api.groq.com/openai/v1', 'k', { audio: Buffer.from([1, 2, 3]), filename: 'a.mp3', model: 'whisper-large-v3-turbo' }, fetchImpl, 5000)
  assert.equal(seen.contentType, 'multipart/form-data', '代理路径必须上传 multipart')
  assert.deepEqual(seen.fields, ['file', 'model'])
  assert.equal(seen.filename, 'a.mp3')
  assert.equal(result.text, '识别成功')
})
