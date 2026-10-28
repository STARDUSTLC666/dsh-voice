import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import http from 'node:http'
import net from 'node:net'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { buildVoiceTools, resolveConfig, transcribe, createProxyFetch } from '../lib/index.js'

function project(t) {
  const parent = fs.mkdtempSync(join(tmpdir(), 'dsh-voice-boundaries-'))
  const root = join(parent, 'workspace'), outside = join(parent, 'outside')
  fs.mkdirSync(root); fs.mkdirSync(outside)
  t.after(() => fs.rmSync(parent, { recursive: true, force: true }))
  return { root, outside, exec: { agent: { session: { header: { cwd: root } } } } }
}
const tool = (name, config, deps) => buildVoiceTools(resolveConfig(config), deps).find(t => t.name === name)
async function listen(t, server) {
  const sockets = new Set()
  server.on('connection', socket => { sockets.add(socket); socket.on('close', () => sockets.delete(socket)) })
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  t.after(async () => {
    for (const socket of sockets) socket.destroy()
    server.closeAllConnections()
    await new Promise(resolve => server.close(resolve))
  })
  return 'http://127.0.0.1:' + server.address().port
}

test('ASR 不把音频随 301/302/303/307/308 转发到另一地址，直连和真实 HTTP 代理均生效', async t => {
  let unexpected = 0, direct = 0, proxyRequests = 0
  const sink = await listen(t, http.createServer((req, res) => { unexpected++; req.resume(); res.end('{}') }))
  const source = await listen(t, http.createServer((req, res) => {
    req.resume()
    const code = Number(req.url.split('/')[1])
    if (code === 200) { direct++; res.setHeader('content-type', 'application/json'); res.end('{"text":"direct fixture"}'); return }
    res.writeHead(code, { location: sink + '/unconfigured' }); res.end()
  }))
  const tunnels = new Set()
  const proxy = http.createServer((req, res) => {
    proxyRequests++
    const target = new URL(req.url)
    if (target.origin !== source) { req.resume(); res.writeHead(502); res.end(); return }
    const upstream = http.request(target, { method: req.method, headers: req.headers }, response => {
      res.writeHead(response.statusCode, response.headers); response.pipe(res)
    })
    upstream.on('error', () => { res.writeHead(502); res.end() })
    req.pipe(upstream)
  })
  proxy.on('connect', (req, socket, head) => {
    proxyRequests++
    const target = new URL('http://' + req.url)
    const upstream = net.connect(Number(target.port), target.hostname, () => {
      socket.write('HTTP/1.1 200 Connection Established\r\n\r\n')
      if (head.length) upstream.write(head)
      socket.pipe(upstream); upstream.pipe(socket)
    })
    tunnels.add(upstream); upstream.on('close', () => tunnels.delete(upstream))
    upstream.on('error', () => socket.destroy()); socket.on('error', () => upstream.destroy())
    socket.on('close', () => upstream.destroy())
  })
  const proxyUrl = await listen(t, proxy)
  t.after(() => { for (const socket of tunnels) socket.destroy() })
  const options = { audio: Buffer.from('PRIVATE_AUDIO_FIXTURE'), filename: 'a.wav', model: 'fixture' }
  for (const fetchImpl of [globalThis.fetch, createProxyFetch(proxyUrl)]) {
    for (const code of [301, 302, 303, 307, 308]) {
      await assert.rejects(transcribe(source + '/' + code, 'synthetic-key-only', options, fetchImpl, 5000), /重定向.*未向跳转地址发送音频/)
    }
    assert.equal((await transcribe(source + '/200', 'synthetic-key-only', options, fetchImpl, 5000)).text, 'direct fixture')
  }
  assert.equal(unexpected, 0)
  assert.equal(direct, 2)
  assert.ok(proxyRequests > 0, 'the proxy branch must pass through the real HTTP proxy')
})

test('并发合成同名音频各自保留内容，返回实际文件名', async t => {
  const { root, exec } = project(t), ready = Promise.withResolvers()
  let entered = 0
  const tts = tool('voice_tts', { overwrite: false }, { tts: async ({ text }) => {
    if (++entered === 2) ready.resolve()
    await ready.promise; return Buffer.from(text)
  } })
  const results = await Promise.all(['first', 'second'].map(text => tts.execute({ text, output: 'same.mp3' }, exec)))
  assert.equal(new Set(results.map(r => r.output)).size, 2)
  assert.deepEqual(results.map(r => fs.readFileSync(r.output, 'utf8')), ['first', 'second'])
  assert.equal(fs.readdirSync(root).length, 2)
})

test('合成等待期间出现用户同名文件，也不能在 overwrite=false 时覆盖', async t => {
  const { root, exec } = project(t)
  const target = join(root, 'same.mp3')
  const tts = tool('voice_tts', {}, { tts: async () => { fs.writeFileSync(target, 'user file'); return Buffer.from('audio') } })
  const result = await tts.execute({ text: 'fixture', output: 'same.mp3' }, exec)
  assert.equal(fs.readFileSync(target, 'utf8'), 'user file')
  assert.notEqual(result.output, target)
  assert.equal(fs.readFileSync(result.output, 'utf8'), 'audio')
})

test('显式覆盖普通文件仍然可用', async t => {
  const { root, exec } = project(t), target = join(root, 'same.mp3')
  fs.writeFileSync(target, 'long original data')
  const result = await tool('voice_tts', { overwrite: true }, { tts: async () => Buffer.from('new') }).execute({ text: 'fixture', output: 'same.mp3' }, exec)
  assert.equal(result.output, target)
  assert.equal(fs.readFileSync(target, 'utf8'), 'new')
})

test('硬链接覆盖在合成前和等待后均被拒绝，工作区外的原文件保持不变', async t => {
  for (const late of [false, true]) {
    const { root, outside, exec } = project(t), source = join(outside, 'keep.txt'), target = join(root, 'linked.mp3')
    fs.writeFileSync(source, 'KEEP')
    if (!late) fs.linkSync(source, target)
    let calls = 0
    const tts = tool('voice_tts', { overwrite: true }, { tts: async () => { calls++; if (late) fs.linkSync(source, target); return Buffer.from('audio') } })
    await assert.rejects(tts.execute({ text: 'fixture', output: 'linked.mp3' }, exec), /硬链接/)
    assert.equal(calls, late ? 1 : 0)
    assert.equal(fs.readFileSync(source, 'utf8'), 'KEEP')
    assert.equal(fs.readFileSync(target, 'utf8'), 'KEEP')
  }
})

test('Windows 目录 junction 不能把音频读取或写入带到工作区外', async t => {
  const { root, outside, exec } = project(t)
  fs.writeFileSync(join(outside, 'secret.wav'), 'private fixture')
  const link = join(root, 'linked')
  fs.symlinkSync(outside, link, process.platform === 'win32' ? 'junction' : 'dir')
  let calls = 0
  const deps = { tts: async () => { calls++; return Buffer.from('audio') }, stt: async () => { calls++; return { text: 'fixture', model: 'fixture' } } }
  await assert.rejects(tool('voice_tts', {}, deps).execute({ text: 'fixture', output: 'linked/out.mp3' }, exec), /工作区/)
  await assert.rejects(tool('voice_stt', {}, deps).execute({ audio: 'linked/secret.wav' }, exec), /工作区/)
  assert.equal(calls, 0)
  assert.equal(fs.existsSync(join(outside, 'out.mp3')), false)
  // 删除链接本身，避免测试清理依赖目录遍历器对 junction 的处理。
  fs.unlinkSync(link)
})

test('并发转写和重复音色试听也返回各自的新文件', async t => {
  const { root, exec } = project(t)
  fs.writeFileSync(join(root, 'clip.wav'), 'audio fixture')
  let count = 0
  const stt = tool('voice_stt', {}, { stt: async () => ({ text: 'text-' + ++count, model: 'fixture' }) })
  const transcripts = await Promise.all([1, 2].map(() => stt.execute({ audio: 'clip.wav', output: 'same.txt' }, exec)))
  assert.equal(new Set(transcripts.map(r => r.transcriptFile)).size, 2)
  for (const item of transcripts) assert.equal(fs.readFileSync(item.transcriptFile, 'utf8'), item.text)
  const previews = await tool('voice_preview', {}, { tts: async ({ voice }) => Buffer.from(voice) }).execute({ voices: ['zh-CN-XiaoxiaoNeural', 'zh-CN-XiaoxiaoNeural'] }, exec)
  assert.equal(previews.count, 2)
  assert.equal(new Set(previews.samples.map(r => r.output)).size, 2)
})
