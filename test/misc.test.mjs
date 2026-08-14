import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { isValidVoiceId, VOICES, assertAudioFile, resolveOutputPath, resolveConfig } from '../lib/index.js'

test('isValidVoiceId：清单内与命名规则', () => {
  assert.equal(isValidVoiceId('zh-CN-XiaoxiaoNeural'), true)
  assert.equal(isValidVoiceId('en-US-AnythingNeural'), true)
  assert.equal(isValidVoiceId('not-a-voice'), false)
  assert.equal(isValidVoiceId('zh-CN-Xiaoxiao'), false)
})

test('VOICES 清单非空且含中文音色', () => {
  assert.ok(VOICES.length >= 20)
  assert.ok(VOICES.some((v) => v.id === 'zh-CN-XiaoxiaoNeural'))
  assert.ok(VOICES.some((v) => v.id === 'en-US-AriaNeural'))
})

const dir = mkdtempSync(join(tmpdir(), 'dsh-voice-paths-'))
const audio = join(dir, 'clip.mp3')
writeFileSync(audio, 'x')

test('assertAudioFile 校验', () => {
  assert.equal(assertAudioFile(audio), audio)
  assert.throws(() => assertAudioFile(join(dir, 'missing.mp3')), /音频文件不存在/)
})

test('resolveOutputPath：缺省命名与防覆写序号', () => {
  const name = 'voice_output_test_' + Date.now() + '.mp3'
  const first = resolveOutputPath(undefined, name, false)
  assert.ok(first.endsWith(name))
  writeFileSync(first, 'x')
  const second = resolveOutputPath(undefined, name, false)
  assert.ok(second !== first)
  assert.ok(second.includes('voice_output_test_') && second.includes('_1.mp3'))
  rmSync(first, { force: true })
})

test('resolveConfig：引擎预设与密钥回退', () => {
  const cfg = resolveConfig({})
  assert.equal(cfg.asrEngine, 'groq')
  assert.equal(cfg.asrBaseUrl, 'https://api.groq.com/openai/v1')
  assert.equal(cfg.asrModel, 'whisper-large-v3-turbo')
  assert.equal(cfg.ttsVoice, 'zh-CN-XiaoxiaoNeural')
  const custom = resolveConfig({ asrEngine: 'custom', asrBaseUrl: 'https://asr.example.com/v1/' })
  assert.equal(custom.asrBaseUrl, 'https://asr.example.com/v1')
})

test('cleanup', () => { rmSync(dir, { recursive: true, force: true }) })
