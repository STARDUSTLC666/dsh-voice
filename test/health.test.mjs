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

test('voice_health 失败项带可执行建议，渲染里出现「建议」段', async () => {
  delete process.env.DSH_VOICE_ASR_KEY
  const cfg = resolveConfig({})
  const health = buildVoiceTools(cfg).find((t) => t.name === 'voice_health')
  const value = await health.execute({})
  const bad = value.checks.find((c) => c.name === 'ASR 密钥')
  assert.match(String(bad.hint), /DSH_VOICE_ASR_KEY/, '失败项必须给出下一步，而不是只报缺什么')
  assert.ok(Array.isArray(value.hints) && value.hints.length > 0, '顶层 hints 供渲染与模型直接消费')
  const text = health.output.render({}, value)[0].text
  assert.match(text, /建议：/, '渲染必须显式给出建议段')
  assert.match(text, /缺 ASR 密钥/, '建议要说明影响面：只有 voice_stt 受影响')
})

test('voice_health 全绿时不输出建议噪音', async () => {
  delete process.env.DSH_VOICE_ASR_KEY
  const cfg = resolveConfig({ asrApiKey: 'gsk_test' })
  const health = buildVoiceTools(cfg).find((t) => t.name === 'voice_health')
  const value = await health.execute({})
  assert.equal(value.ok, true)
  assert.equal(value.hints, undefined)
  assert.doesNotMatch(health.output.render({}, value)[0].text, /建议：/)
})
