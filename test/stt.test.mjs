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
