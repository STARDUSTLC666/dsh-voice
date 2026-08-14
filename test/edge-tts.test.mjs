import { test } from 'node:test'
import assert from 'node:assert/strict'
import { synthesizeSpeech, buildSsml, generateSecMsGec } from '../lib/index.js'

const tick = () => new Promise((resolvePromise) => setTimeout(resolvePromise, 0))

/** 假 WebSocket：记录构造参数与消息，可手动触发事件。 */
function makeFakeSocket() {
  const record = { url: '', headers: {}, sent: [], listeners: {} }
  const socket = {
    addEventListener(type, listener) {
      (record.listeners[type] ??= []).push(listener)
    },
    send(data) {
      record.sent.push(data)
    },
    close() {},
  }
  const factory = (url, options) => {
    record.url = url
    record.headers = options.headers
    return socket
  }
  const fire = (type, event = {}) => {
    for (const listener of record.listeners[type] ?? []) listener(event)
  }
  return { record, factory, fire }
}

function audioFrame(payload) {
  const header = Buffer.from('Path:audio', 'utf8')
  const headerLength = Buffer.alloc(2)
  headerLength.writeUInt16BE(header.length)
  return Buffer.concat([headerLength, header, Buffer.from(payload)])
}

test('generateSecMsGec：64 位十六进制大写，5 分钟窗口内稳定', () => {
  const base = 1700000000 - (1700000000 % 300) // 窗口对齐
  const token = generateSecMsGec(base)
  assert.match(token, /^[0-9A-F]{64}$/)
  assert.equal(token, generateSecMsGec(base + 299))
  assert.notEqual(token, generateSecMsGec(base + 301))
})

test('synthesizeSpeech：本地令牌 → WS → config+SSML → 音频拼接', async () => {
  const ws = makeFakeSocket()
  const promise = synthesizeSpeech({ text: '你好 <世界>', voice: 'zh-CN-XiaoxiaoNeural', rate: '+0%', pitch: '+0Hz' }, { webSocketFactory: ws.factory, nowSeconds: () => 1700000000 }, 5000)
  await tick()
  ws.fire('open')
  assert.ok(ws.record.url.includes('TrustedClientToken=6A5AA1D4EAFF4E9FB37E23D68491D6F4'))
  assert.ok(ws.record.url.includes('ConnectionId='))
  assert.ok(ws.record.url.includes('Sec-MS-GEC=' + generateSecMsGec(1700000000)))
  assert.ok(ws.record.url.includes('Sec-MS-GEC-Version=1-143.0.3650.75'))
  assert.equal(ws.record.headers['Sec-MS-GEC'], undefined)
  assert.match(ws.record.headers.MUID, /^[0-9A-F]{32}$/)
  assert.equal(ws.record.sent.length, 2)
  assert.ok(ws.record.sent[0].includes('Path:speech.config'))
  assert.ok(ws.record.sent[1].includes('Path:ssml'))
  assert.ok(ws.record.sent[1].includes("voice name='zh-CN-XiaoxiaoNeural'"))
  assert.ok(ws.record.sent[1].includes('你好 &lt;世界&gt;'))
  ws.fire('message', { data: audioFrame([1, 2, 3, 4]) })
  ws.fire('message', { data: audioFrame([5, 6]) })
  ws.fire('message', { data: 'X-Timestamp:2026\r\nPath:turn.end\r\n' })
  const audio = await promise
  assert.deepEqual([...audio], [1, 2, 3, 4, 5, 6])
})

test('turn.end 但没有音频数据 → 抛错', async () => {
  const ws = makeFakeSocket()
  const promise = synthesizeSpeech({ text: 'hi', voice: 'zh-CN-XiaoxiaoNeural', rate: '+0%', pitch: '+0Hz' }, { webSocketFactory: ws.factory }, 5000)
  await tick()
  ws.fire('open')
  ws.fire('message', { data: 'X-Timestamp:2026\r\nPath:turn.end\r\n' })
  await assert.rejects(() => promise, /没有收到音频数据/)
})

test('error 事件抛中文错误（含代理提示）', async () => {
  const ws = makeFakeSocket()
  const promise = synthesizeSpeech({ text: 'hi', voice: 'zh-CN-XiaoxiaoNeural', rate: '+0%', pitch: '+0Hz' }, { webSocketFactory: ws.factory }, 5000)
  await tick()
  ws.fire('open')
  ws.fire('error')
  await assert.rejects(() => promise, /proxyUrl/)
})

test('文本为空 / 超长抛错', async () => {
  await assert.rejects(() => synthesizeSpeech({ text: '  ', voice: 'v', rate: '+0%', pitch: '+0Hz' }, {}, 5000), /文本为空/)
  await assert.rejects(() => synthesizeSpeech({ text: 'x'.repeat(5001), voice: 'v', rate: '+0%', pitch: '+0Hz' }, {}, 5000), /超过 5000/)
})

test('buildSsml：语言前缀与转义', () => {
  const ssml = buildSsml({ text: 'a&b', voice: 'en-US-AriaNeural', rate: '+10%', pitch: '+1Hz' })
  assert.ok(ssml.includes("xml:lang='en-US'"))
  assert.ok(ssml.includes('a&amp;b'))
  assert.ok(ssml.includes("rate='+10%'"))
})
