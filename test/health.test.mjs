import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildVoiceTools, resolveConfig } from '../lib/index.js'

test('voice_health 配置齐全时 ok=true', async () => {
  delete process.env.DSH_VOICE_ASR_KEY
  const cfg = resolveConfig({ asrApiKey: 'gsk_test' })
  const health = buildVoiceTools(cfg).find((t) => t.name === 'voice_health')
  const value = await health.execute({})
  assert.equal(value.ok, true)
  const blocks = health.output.render({}, value)
  assert.match(blocks[0].text, /自检：正常/)
})

test('voice_health 缺 ASR 密钥时 ok=false 且给出指引', async () => {
  delete process.env.DSH_VOICE_ASR_KEY
  const cfg = resolveConfig({})
  const health = buildVoiceTools(cfg).find((t) => t.name === 'voice_health')
  const value = await health.execute({})
  assert.equal(value.ok, false)
  const bad = value.checks.find((c) => c.name === 'ASR 密钥')
  assert.match(String(bad.detail), /DSH_VOICE_ASR_KEY/)
})
