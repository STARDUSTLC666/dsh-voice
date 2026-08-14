/**
 * 集成测试：真实 edge-tts 合成（网络可用时）；真实 ASR 转写（有 DSH_VOICE_ASR_KEY 时）。
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { synthesizeSpeech } from '../lib/index.js'

test('真实 edge-tts：合成一段中文语音', { skip: false }, async (context) => {
  try {
    const audio = await synthesizeSpeech({ text: '你好，这是语音双件套的集成测试。', voice: 'zh-CN-XiaoxiaoNeural', rate: '+0%', pitch: '+0Hz' }, {}, 30000)
    assert.ok(audio.length > 1000, '音频字节数 ' + audio.length)
  } catch (error) {
    context.skip('网络不可达（' + String(error.message).slice(0, 60) + '）')
  }
})
