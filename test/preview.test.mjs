import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { buildVoiceTools, resolveConfig, DEFAULT_PREVIEW_TEXT, VOICES } from '../lib/index.js'

const dir = mkdtempSync(join(tmpdir(), 'dsh-voice-preview-'))
const cfg = resolveConfig({ timeoutMs: 5000 })

/** 假 TTS：返回音色名的伪音频字节，可注入失败。 */
function fakeTts(failVoices = []) {
  const calls = []
  const fn = async ({ text, voice }) => {
    calls.push({ text, voice })
    if (failVoices.includes(voice)) throw new Error('boom-' + voice)
    return Buffer.from('audio:' + voice)
  }
  fn.calls = calls
  return fn
}

test('voice_preview 缺省用 voice_list 前 4 个音色并落盘', async () => {
  const tts = fakeTts()
  const preview = buildVoiceTools(cfg, { tts }).find((t) => t.name === 'voice_preview')
  const outDir = join(dir, 'default')
  const value = await preview.execute({ outputDir: outDir })
  assert.equal(value.count, 4)
  assert.equal(value.failed.length, 0)
  assert.equal(value.text, DEFAULT_PREVIEW_TEXT)
  for (const sample of value.samples) {
    assert.ok(existsSync(sample.output))
    assert.ok(sample.output.endsWith('.mp3'))
  }
  assert.equal(tts.calls.length, 4)
  assert.equal(tts.calls[0].voice, VOICES[0].id)
})

test('voice_preview 非法音色进 failed 不阻断', async () => {
  const tts = fakeTts(['zh-CN-YunxiNeural'])
  const preview = buildVoiceTools(cfg, { tts }).find((t) => t.name === 'voice_preview')
  const value = await preview.execute({ voices: ['zh-CN-XiaoxiaoNeural', 'not_a_voice!', 'zh-CN-YunxiNeural'], outputDir: join(dir, 'mixed') })
  assert.equal(value.count, 1)
  assert.equal(value.failed.length, 2)
  assert.match(String(value.failed[0].error), /不合法/)
  assert.match(String(value.failed[1].error), /boom/)
})

test('voice_preview 钳制：超 8 个音色与超长文本抛错', async () => {
  const preview = buildVoiceTools(cfg, { tts: fakeTts() }).find((t) => t.name === 'voice_preview')
  await assert.rejects(() => preview.execute({ voices: new Array(9).fill('zh-CN-XiaoxiaoNeural') }), /最多 8 个/)
  await assert.rejects(() => preview.execute({ text: 'x'.repeat(201) }), /200 字以内/)
})

test('voice_preview 渲染含样例路径与失败原因', async () => {
  const preview = buildVoiceTools(cfg, { tts: fakeTts(['a']) }).find((t) => t.name === 'voice_preview')
  const value = { count: 1, samples: [{ voice: 'zh-CN-XiaoxiaoNeural', output: '/tmp/x.mp3', bytes: 10 }], failed: [{ voice: 'bad', error: 'nope' }], text: 'hi' }
  const blocks = preview.output.render({}, value)
  assert.match(blocks[0].text, /试听样例已生成 1 个/)
  assert.match(blocks[0].text, /bad 失败：nope/)
})

test('清理', () => { rmSync(dir, { recursive: true, force: true }) })
