import test from 'node:test'
import assert from 'node:assert/strict'
import { synthesizeOpenAiSpeech } from '../lib/openai-tts.js'

const AUDIO_LIMIT = 25 * 1024 * 1024
const base = 'http://127.0.0.1:8000/v1'
const options = { text: 'hello', voice: 'alloy' }
const synthesize = fetchImpl => synthesizeOpenAiSpeech(base, '', options, fetchImpl, 5000)

test('OpenAI-compatible TTS reads a normal audio response stream', async () => {
  const response = new Response(new ReadableStream({
    start(controller) {
      controller.enqueue(Buffer.from('audio-'))
      controller.enqueue(Buffer.from('bytes'))
      controller.close()
    },
  }))
  const result = await synthesize(async () => response)
  assert.equal(result.toString(), 'audio-bytes')
  assert.equal(response.body.locked, false)
})

test('TTS rejects oversized Content-Length early and cancels the response body', async () => {
  let cancelled = false
  const response = new Response(new ReadableStream({
    cancel() { cancelled = true },
  }), { headers: { 'content-length': String(AUDIO_LIMIT + 1) } })

  await assert.rejects(synthesize(async () => response), /25 MiB 上限/)
  assert.equal(cancelled, true)
  assert.equal(response.body.locked, false)
})

test('TTS preserves cancellation while releasing a pending audio reader', async () => {
  let cancelled = false
  let started
  const ready = new Promise(resolve => { started = resolve })
  const controller = new AbortController()
  const reason = new Error('caller cancelled TTS')
  const response = new Response(new ReadableStream({
    pull() { started() },
    cancel() { cancelled = true },
  }))
  const pending = synthesizeOpenAiSpeech(base, '', options, async () => response, 5000, controller.signal)
  await ready
  controller.abort(reason)
  await assert.rejects(pending, error => error === reason)
  assert.equal(cancelled, true)
  assert.equal(response.body.locked, false)
})

test('TTS releases its audio reader when the stream fails', async () => {
  const failure = new Error('response body failed')
  const response = new Response(new ReadableStream({
    pull(controller) { controller.error(failure) },
  }))
  await assert.rejects(synthesize(async () => response), error => error === failure)
  assert.equal(response.body.locked, false)
})

test('TTS enforces the byte limit while streaming when Content-Length is absent', async () => {
  let cancelled = false
  let chunks = 0
  const response = new Response(new ReadableStream({
    pull(controller) {
      chunks++
      controller.enqueue(new Uint8Array(chunks === 3 ? 5 * 1024 * 1024 + 1 : 10 * 1024 * 1024))
    },
    cancel() { cancelled = true },
  }))

  await assert.rejects(synthesize(async () => response), /25 MiB 上限/)
  assert.ok(chunks >= 3)
  assert.equal(cancelled, true)
  assert.equal(response.body.locked, false)
})

test('TTS error diagnostics read a bounded prefix and cancel the remaining stream', async () => {
  let cancelled = false
  const response = new Response(new ReadableStream({
    start(controller) {
      controller.enqueue(Buffer.from('x'.repeat(16 * 1024)))
    },
    cancel() { cancelled = true },
  }), { status: 502 })

  await assert.rejects(synthesize(async () => response), error => {
    assert.match(error.message, /HTTP 502/)
    assert.ok(error.message.length < 400)
    return true
  })
  assert.equal(cancelled, true)
  assert.equal(response.body.locked, false)
})
