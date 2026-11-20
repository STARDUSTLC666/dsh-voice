import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { buildVoiceTools, resolveConfig } from '../lib/index.js'

test('ASR worker failure stops queued uploads and drains active work before cleaning temporary audio', async t => {
  const root = mkdtempSync(join(tmpdir(), 'voice-worker-failure-'))
  t.after(() => rmSync(root, { recursive: true, force: true }))
  const video = join(root, 'clip.mp4'); writeFileSync(video, 'video fixture')
  let release, failed, cleaned = false, settled = false
  const gate = new Promise(resolve => { release = resolve }), failure = new Promise(resolve => { failed = resolve })
  const calls = [], activeSawCleanup = [], reason = new Error('provider rejected chunk')
  const stt = buildVoiceTools(resolveConfig({ asrApiKey: 'fixture' }), {
    async prepareAudio() { return { chunks: Array.from({ length: 4 }, (_, i) => ({ audio: Buffer.from('clip'), filename: String(i), offsetSeconds: i })), cleanup() { cleaned = true } } },
    async stt(_base, _key, options) {
      calls.push(options.filename)
      if (options.filename === '1') { failed(); throw reason }
      await gate
      activeSawCleanup.push(cleaned)
      return { text: 'ok', model: options.model }
    },
  }).find(tool => tool.name === 'voice_stt')
  const pending = stt.execute({ audio: video }, { agent: { session: { header: { cwd: root } } } })
  pending.then(() => { settled = true }, () => { settled = true })
  const rejected = assert.rejects(pending, error => error === reason)
  await failure
  await new Promise(resolve => setImmediate(resolve))
  const settledBeforeDrain = settled, cleanedBeforeDrain = cleaned
  release()
  await rejected
  await new Promise(resolve => setImmediate(resolve))
  assert.deepEqual(calls, ['0', '1'], 'failure must not dispatch remaining paid uploads')
  assert.equal(settledBeforeDrain, false, 'do not return while another request still owns temporary audio')
  assert.equal(cleanedBeforeDrain, false)
  assert.deepEqual(activeSawCleanup, [false], 'active request still owns temporary audio')
  assert.equal(cleaned, true)
})
