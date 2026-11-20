import test from 'node:test'
import assert from 'node:assert/strict'
import { resetUploadedVoiceCacheForTest, synthesizeOpenAiSpeech, uploadSiliconFlowVoice } from '../lib/index.js'

const base = 'https://api.siliconflow.cn/v1'
const sample = { audio: Buffer.from('reference audio'), filename: 'reference.mp3', model: 'CosyVoice', text: 'reference words' }

test('switching TTS credentials never reuses a previous account voice URI', async t => {
  resetUploadedVoiceCacheForTest()
  t.after(resetUploadedVoiceCacheForTest)
  const uploads = []
  const transport = async (url, init) => {
    const account = init.headers.authorization
    if (url.endsWith('/uploads/audio/voice')) {
      uploads.push(account)
      return Response.json({ uri: 'speech:' + account })
    }
    assert.equal(url, base + '/audio/speech')
    if (JSON.parse(init.body).voice !== 'speech:' + account) return new Response('voice belongs to a different account', { status: 403 })
    return new Response(Buffer.from('mp3-audio'))
  }
  const options = { text: 'hello', model: sample.model, voice: '', references: [{ rawAudio: sample.audio, filename: sample.filename, audioDataUri: 'data:audio/mpeg;base64,eA==', text: sample.text }] }
  for (const key of ['account-a', 'account-b', 'account-a']) {
    assert.equal((await synthesizeOpenAiSpeech(base, key, options, transport, 5000)).toString(), 'mp3-audio')
  }
  assert.deepEqual(uploads, ['Bearer account-a', 'Bearer account-b'])
})

test('concurrent upload deduplication is scoped to credentials', async t => {
  resetUploadedVoiceCacheForTest()
  t.after(resetUploadedVoiceCacheForTest)
  let release
  const gate = new Promise(resolve => { release = resolve })
  const uploads = []
  const transport = async (_url, init) => {
    uploads.push(init.headers.authorization)
    await gate
    return Response.json({ uri: 'speech:' + init.headers.authorization })
  }
  const first = uploadSiliconFlowVoice(base, 'account-a', sample, transport, 5000)
  const same = uploadSiliconFlowVoice(base, 'account-a', sample, transport, 5000)
  const other = uploadSiliconFlowVoice(base, 'account-b', sample, transport, 5000)
  release()
  assert.deepEqual(await Promise.all([first, same, other]), ['speech:Bearer account-a', 'speech:Bearer account-a', 'speech:Bearer account-b'])
  assert.deepEqual(uploads, ['Bearer account-a', 'Bearer account-b'])
})
