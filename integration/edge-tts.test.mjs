/**
 * 显式联网测试：只由 pnpm test:integration 运行，不包含在默认离线测试中。
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { synthesizeSpeech } from '../lib/index.js'

test('真实 edge-tts：合成一段中文语音', async () => {
  const audio = await synthesizeSpeech({ text: '你好，这是语音双件套的集成测试。', voice: 'zh-CN-XiaoxiaoNeural', rate: '+0%', pitch: '+0Hz' }, {}, 30000)
  assert.ok(audio.length > 1000, '音频字节数 ' + audio.length)
})
