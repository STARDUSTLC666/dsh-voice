import { test } from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  apply,
  applyPronunciationsPlain,
  buildSsml,
  buildVoiceTools,
  Config,
  createSilenceMp3,
  createVoiceStudioBackend,
  inspectMp3Buffer,
  installVoiceStudioWeb,
  liveConfig,
  parseSubtitleFile,
  resetUploadedVoiceCacheForTest,
  resolveConfig,
  scaleRatePercent,
  synthesizeOpenAiSpeech,
  uploadSiliconFlowVoice,
  VOICE_STUDIO_API_ROUTE,
} from '../lib/index.js'

const here = dirname(fileURLToPath(import.meta.url))
const repoRoot = join(here, '..')

function makeWorkspace(t, prefix = 'dsh-voice-pro-') {
  const parent = mkdtempSync(join(tmpdir(), prefix))
  const root = join(parent, 'workspace')
  const outside = join(parent, 'outside')
  mkdirSync(root)
  mkdirSync(outside)
  t.after(() => rmSync(parent, { recursive: true, force: true }))
  return { root, outside, exec: { agent: { session: { header: { cwd: root } } } } }
}

function makeXingFrame44100Stereo(totalFrames) {
  // MPEG-1 Layer III, 128 kbps (index 9), 44100 Hz (index 0), stereo (mode 0):
  // Frame size = Math.floor(144 * 128000 / 44100) = 417 bytes; side info = 32 bytes -> Xing at +36
  const frame = Buffer.alloc(417, 0)
  frame[0] = 0xff
  frame[1] = 0xfb
  frame[2] = 0x90
  frame[3] = 0x00
  frame.write('Xing', 36, 'ascii')
  frame.writeUInt32BE(0x00000001, 40) // frames flag
  frame.writeUInt32BE(totalFrames, 44)
  return frame
}

// ---------- 1. Exact MP3 Frame / Xing VBR Inspector & Matched-Sample-Rate Silence ----------

test('Pro 1: inspectMp3Buffer 解析 MPEG-2 24kHz / MPEG-1 44.1kHz CBR 与 Xing VBR 帧头', () => {
  const mpeg2 = createSilenceMp3(480, 24000)
  const info24 = inspectMp3Buffer(mpeg2)
  assert.equal(info24.sampleRate, 24000)
  assert.equal(info24.bitrateKbps, 48)
  assert.equal(info24.frameCount, 20)
  assert.equal(info24.durationMs, 480)
  assert.equal(info24.isVbr, false)

  const mpeg1 = createSilenceMp3(500, 44100)
  const info44 = inspectMp3Buffer(mpeg1)
  assert.equal(info44.sampleRate, 44100)
  assert.equal(info44.bitrateKbps, 64)
  assert.ok(info44.frameCount >= 18 && info44.frameCount <= 21)
  assert.equal(info44.isVbr, false)
  const expected44Ms = Math.round((info44.frameCount * 1152 * 1000) / 44100)
  assert.ok(Math.abs(info44.durationMs - expected44Ms) <= 2)

  const xing = makeXingFrame44100Stereo(100)
  const infoXing = inspectMp3Buffer(xing)
  assert.equal(infoXing.sampleRate, 44100)
  assert.equal(infoXing.isVbr, true)
  assert.equal(infoXing.frameCount, 100)
  assert.equal(infoXing.durationMs, Math.round((100 * 1152 * 1000) / 44100))

  // 非 MP3 合成缓冲区向后兼容回退到 48kbps 估算（6000 字节 -> 1000ms）
  const fallback = inspectMp3Buffer(Buffer.alloc(6000, 1))
  assert.equal(fallback.frameCount, 0)
  assert.equal(fallback.durationMs, 1000)
})

test('Pro 1: voice_tts 返回数值型 durationMs / durationSec 并在输出文本中展示时长', async (t) => {
  const { root, exec } = makeWorkspace(t)
  const cfg = resolveConfig({})
  const fakeAudio = createSilenceMp3(1200, 24000)
  const tts = buildVoiceTools(cfg, { tts: async () => fakeAudio }).find((tool) => tool.name === 'voice_tts')
  const res = await tts.execute({ text: '精准时长测试', output: join(root, 'dur.mp3') }, exec)
  assert.equal(typeof res.durationMs, 'number')
  assert.equal(typeof res.durationSec, 'number')
  assert.equal(res.durationMs, 1200)
  assert.equal(res.durationSec, 1.2)
  const rendered = tts.output.render({}, res)[0].text
  assert.ok(rendered.startsWith('语音合成完成：'))
  assert.match(rendered, /1\.2\s*秒/)
})

// ---------- 2. Pronunciation Lexicon (pronunciations) ----------

test('Pro 2: buildSsml 发音词典采用 Edge 兼容纯文本替读且不破坏 XML 转义，省略时字节级一致', () => {
  const baseOpts = { text: 'Nginx & 重构 <test>', voice: 'zh-CN-XiaoxiaoNeural', rate: '+0%', pitch: '+0Hz' }
  const plainSsml = buildSsml(baseOpts)
  assert.equal(buildSsml({ ...baseOpts, pronunciations: [] }), plainSsml)
  assert.ok(plainSsml.includes('Nginx &amp; 重构 &lt;test&gt;'))

  const lexSsml = buildSsml({
    ...baseOpts,
    pronunciations: [
      { word: 'Nginx', alias: 'Engine X' },
      { word: '重构', alias: '虫构' },
    ],
  })
  // 微软免费 Edge ReadAloud 端点会以 WS 1007 拒绝 <sub alias>，因此必须输出纯文本替读且保留 XML 转义
  assert.ok(!lexSsml.includes('<sub '))
  assert.ok(lexSsml.includes('Engine X &amp; 虫构 &lt;test&gt;'))
})

test('Pro 2: applyPronunciationsPlain 避免链式递归替换，Config 支持 pronunciations 校验与热更新', () => {
  const out = applyPronunciationsPlain('A and B and AB', [
    { word: 'A', alias: 'B' },
    { word: 'B', alias: 'C' },
    { word: 'AB', alias: 'AlphaBeta' },
  ])
  assert.equal(out, 'B and C and AlphaBeta')

  const warnings = []
  const resolved = resolveConfig({ pronunciations: [{ word: 'SQL', alias: 'S Q L' }, { word: ' ', alias: 'x' }] }, (w) => warnings.push(w))
  assert.deepEqual(resolved.pronunciations, [{ word: 'SQL', alias: 'S Q L' }])
  assert.equal(warnings.length, 0)

  const badWarnings = []
  const badResolved = resolveConfig({ pronunciations: 'not-array' }, (w) => badWarnings.push(w))
  assert.deepEqual(badResolved.pronunciations, [])
  assert.ok(badWarnings.some((w) => w.includes('pronunciations')))

  // Volatile liveConfig 支持热更新
  assert.ok(Config.dict.pronunciations)
  const live = liveConfig({ pronunciations: [{ word: 'SQL', alias: 'S Q L' }] })
  assert.deepEqual(resolveConfig(live).pronunciations, [{ word: 'SQL', alias: 'S Q L' }])
  live.pronunciations = [{ word: 'Nginx', alias: 'Engine X' }]
  assert.deepEqual(resolveConfig(live).pronunciations, [{ word: 'Nginx', alias: 'Engine X' }])
})

// ---------- 3. SiliconFlow Reference Voice Upload Cache (uploadSiliconFlowVoice) ----------

test('Pro 3: SiliconFlow 4 段播客克隆仅上传 1 次参考音频并复用 speech:cached:123 URI', async (t) => {
  resetUploadedVoiceCacheForTest()
  t.after(() => resetUploadedVoiceCacheForTest())

  const { root, exec } = makeWorkspace(t)
  const refPath = join(root, 'host-ref.mp3')
  writeFileSync(refPath, createSilenceMp3(240, 24000))

  let uploadCalls = 0
  const speechVoices = []
  const mockFetch = async (url, init) => {
    const target = String(url)
    if (target.endsWith('/uploads/audio/voice')) {
      uploadCalls += 1
      return new Response(JSON.stringify({ uri: 'speech:cached:123' }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    }
    if (target.endsWith('/audio/speech')) {
      const payload = JSON.parse(String(init.body))
      speechVoices.push(payload.voice)
      return new Response(createSilenceMp3(240, 24000), {
        status: 200,
        headers: { 'content-type': 'audio/mpeg' },
      })
    }
    throw new Error(`Unexpected fetch URL: ${target}`)
  }

  // 直接验证 uploadSiliconFlowVoice 本身命中缓存
  const cachedUri = await uploadSiliconFlowVoice(
    'https://api.siliconflow.cn/v1',
    'sf-key',
    { audio: readFileSync(refPath), filename: 'host-ref.mp3', model: 'FunAudioLLM/CosyVoice2-0.5B', text: '参考台词' },
    mockFetch,
    5000,
  )
  assert.equal(cachedUri, 'speech:cached:123')
  assert.equal(uploadCalls, 1)

  // 重置缓存，验证 4 段 voice_tts 仅触发 1 次 /uploads/audio/voice，4 次 /audio/speech 全部复用 URI
  resetUploadedVoiceCacheForTest()
  uploadCalls = 0
  speechVoices.length = 0

  const cfg = resolveConfig({ ttsEngine: 'siliconflow', ttsApiKey: 'sf-key' })
  const tts = buildVoiceTools(cfg, {
    openaiTts: (baseUrl, apiKey, options, _fetchImpl, timeoutMs, signal) =>
      synthesizeOpenAiSpeech(baseUrl, apiKey, options, mockFetch, timeoutMs, signal),
  }).find((tool) => tool.name === 'voice_tts')

  const result = await tts.execute(
    {
      segments: [
        { text: '第一段开场', referenceAudio: 'host-ref.mp3', referenceText: '参考台词' },
        { text: '第二段正文', referenceAudio: 'host-ref.mp3', referenceText: '参考台词' },
        { text: '第三段深入', referenceAudio: 'host-ref.mp3', referenceText: '参考台词' },
        { text: '第四段总结', referenceAudio: 'host-ref.mp3', referenceText: '参考台词' },
      ],
      output: join(root, 'sf-podcast.mp3'),
    },
    exec,
  )

  assert.equal(uploadCalls, 1)
  assert.deepEqual(speechVoices, [
    'speech:cached:123',
    'speech:cached:123',
    'speech:cached:123',
    'speech:cached:123',
  ])
  assert.ok(existsSync(result.output))
})

// ---------- 4. Reverse .srt / .vtt Timeline-Synced Dubbing (subtitleInput) ----------

test('Pro 4: parseSubtitleFile 支持 .srt 与 .vtt 解析，scaleRatePercent 钳制语速倍率', () => {
  const srt = [
    '1',
    '00:00:00,500 --> 00:00:01,500',
    '第一句台词',
    '',
    '2',
    '00:00:02,000 --> 00:00:03,250',
    '<b>第二句</b>台词',
    '',
  ].join('\n')
  const srtCues = parseSubtitleFile(srt)
  assert.equal(srtCues.length, 2)
  assert.equal(srtCues[0].startMs, 500)
  assert.equal(srtCues[0].endMs, 1500)
  assert.equal(srtCues[0].text, '第一句台词')
  assert.equal(srtCues[1].startMs, 2000)
  assert.equal(srtCues[1].endMs, 3250)
  assert.equal(srtCues[1].text, '第二句台词')

  const vtt = [
    'WEBVTT',
    '',
    '00:01.200 --> 00:03.400',
    '<v Host>欢迎收听</v>',
    '',
  ].join('\n')
  const vttCues = parseSubtitleFile(vtt)
  assert.equal(vttCues.length, 1)
  assert.equal(vttCues[0].startMs, 1200)
  assert.equal(vttCues[0].endMs, 3400)
  assert.equal(vttCues[0].text, '欢迎收听')

  assert.equal(scaleRatePercent('+0%', 1.4), '+40%')
  assert.equal(scaleRatePercent('+0%', 3.0), '+85%')
  assert.equal(scaleRatePercent('+0%', 0.2), '-30%')
})

test('Pro 4: subtitleInput 超窗触发自动加速重合成，前导/句间静音精确对齐时间轴，越界路径被拒', async (t) => {
  const { root, outside, exec } = makeWorkspace(t)
  const srtPath = join(root, 'video.srt')
  writeFileSync(
    srtPath,
    [
      '1',
      '00:00:00,500 --> 00:00:01,500',
      '开场太长需要加速',
      '',
      '2',
      '00:00:02,000 --> 00:00:03,000',
      '第二句刚好对齐',
      '',
    ].join('\n'),
    'utf8',
  )

  const outsideSrt = join(outside, 'evil.srt')
  writeFileSync(outsideSrt, '1\n00:00:00,000 --> 00:00:01,000\nhi\n', 'utf8')

  const calls = []
  const fakeTts = async (opts) => {
    calls.push({ text: opts.text, rate: opts.rate })
    // 第一次 +0% 返回 1400ms（超出 1000ms*1.08），触发自动加速；加速后返回 800ms
    if (opts.rate === '+0%') {
      return opts.text.includes('开场') ? createSilenceMp3(1416, 24000) : createSilenceMp3(792, 24000)
    }
    return createSilenceMp3(792, 24000)
  }

  const cfg = resolveConfig({})
  const tts = buildVoiceTools(cfg, { tts: fakeTts }).find((tool) => tool.name === 'voice_tts')

  await assert.rejects(() => tts.execute({ subtitleInput: outsideSrt, output: join(root, 'bad.mp3') }, exec), /工作区|不允许/)

  const res = await tts.execute({ subtitleInput: 'video.srt', output: join(root, 'dub.mp3') }, exec)
  // 第 1 条触发了加速重合成（+0% 1416ms -> 加速重合成 792ms），第 2 条仅合成 1 次
  assert.ok(calls.some((c) => c.text.includes('开场') && c.rate !== '+0%'))
  assert.equal(calls.filter((c) => c.text.includes('第二句')).length, 1)

  // 前导 ~500ms + 第一句 ~792ms + 间隙填充到 2000ms + 第二句 ~792ms ≈ 2792ms（MP3 帧步长 24ms）
  assert.ok(res.durationMs >= 2750 && res.durationMs <= 2850, `Expected ~2792ms, got ${res.durationMs}`)
  assert.equal(inspectMp3Buffer(readFileSync(res.output)).durationMs, res.durationMs)
})

// ---------- 5. BGM Auto-Ducking (bgmFile) & Speaker Diarization (diarize) ----------

test('Pro 5: voice_tts bgmFile 校验工作区边界并调用 deps.mixBgm 自动闪避混音', async (t) => {
  const { root, outside, exec } = makeWorkspace(t)
  const bgmPath = join(root, 'bgm.mp3')
  const outsideBgm = join(outside, 'outside-bgm.mp3')
  writeFileSync(bgmPath, createSilenceMp3(480, 24000))
  writeFileSync(outsideBgm, createSilenceMp3(480, 24000))

  const mixCalls = []
  const cfg = resolveConfig({})
  const tts = buildVoiceTools(cfg, {
    tts: async () => createSilenceMp3(720, 24000),
    mixBgm: async (voiceMp3, opts) => {
      mixCalls.push({ voiceLen: voiceMp3.length, opts })
      return createSilenceMp3(720, 24000)
    },
  }).find((tool) => tool.name === 'voice_tts')

  await assert.rejects(() => tts.execute({ text: '测试', bgmFile: outsideBgm, output: join(root, 'o.mp3') }, exec), /工作区|不允许/)

  const res = await tts.execute(
    { text: '带背景音乐的播客', bgmFile: 'bgm.mp3', bgmVolume: 0.25, output: join(root, 'mixed.mp3') },
    exec,
  )
  assert.equal(mixCalls.length, 1)
  assert.equal(mixCalls[0].opts.bgmPath, bgmPath)
  assert.equal(mixCalls[0].opts.bgmVolume, 0.25)
  assert.equal(mixCalls[0].opts.ducking, true)
  assert.ok(existsSync(res.output))
  for (const [volume, expected] of [[-1, 0.02], [2, 1], [Number.NaN, 0.18]]) {
    await tts.execute({ text: '音量范围保持有效', bgmFile: 'bgm.mp3', bgmVolume: volume, output: join(root, 'clamped-' + expected + '.mp3') }, exec)
    assert.equal(mixCalls.at(-1).opts.bgmVolume, expected)
  }
})

test('Pro 5: voice_stt diarize: true 通过 deps.splitStereo 分离双声道并输出 [说话人 A] 字幕与分段文本', async (t) => {
  const { root, exec } = makeWorkspace(t)
  const stereoAudio = join(root, 'interview.wav')
  writeFileSync(stereoAudio, Buffer.from('RIFF_FAKE_WAV'))

  let cleaned = false
  const cfg = resolveConfig({ asrApiKey: 'test-key' })
  const stt = buildVoiceTools(cfg, {
    splitStereo: async () => ({
      channels: [
        { audio: Buffer.from('CH_A'), filename: 'ch_a.mp3', speaker: '说话人 A' },
        { audio: Buffer.from('CH_B'), filename: 'ch_b.mp3', speaker: '说话人 B' },
      ],
      cleanup: () => {
        cleaned = true
      },
    }),
    stt: async (_baseUrl, _apiKey, opts) => {
      if (opts.filename === 'ch_a.mp3') {
        return {
          text: '你好，欢迎做客',
          model: opts.model,
          segments: [{ start: 0, end: 2.0, text: '你好，欢迎做客' }],
        }
      }
      return {
        text: '谢谢邀请',
        model: opts.model,
        segments: [{ start: 2.5, end: 4.0, text: '谢谢邀请' }],
      }
    },
  }).find((tool) => tool.name === 'voice_stt')

  const res = await stt.execute({ audio: stereoAudio, diarize: true, subtitleOutput: 'd.srt' }, exec)
  assert.equal(cleaned, true)
  assert.match(res.text, /\[说话人 A 00:00\]\s*你好，欢迎做客/)
  assert.match(res.text, /\[说话人 B 00:02\]\s*谢谢邀请/)
  assert.deepEqual(res.speakers, ['说话人 A', '说话人 B'])

  const srtOut = readFileSync(join(root, 'd.srt'), 'utf8')
  assert.match(srtOut, /\[说话人 A\] 你好，欢迎做客/)
  assert.match(srtOut, /\[说话人 B\] 谢谢邀请/)
})

// ---------- 6. Voice Studio Backend (createVoiceStudioBackend) & Built Client Bundle (lib/client.js) ----------

test('Pro 6: createVoiceStudioBackend 安全边界、密钥脱敏快照、preview 与 transcribeMic', async () => {
  const cfg = resolveConfig({
    asrApiKey: 'super-secret-asr-key',
    ttsApiKey: 'super-secret-tts-key',
    proxyUrl: 'http://user:pass@127.0.0.1:7890',
    ttsVoice: 'zh-CN-XiaoxiaoNeural',
  })

  const backend = createVoiceStudioBackend(() => cfg, {
    tts: async (opts) => createSilenceMp3(480, 24000),
    stt: async () => ({ text: '语音速记内容', language: 'zh', duration: 1.5, model: 'whisper-large-v3-turbo' }),
  })

  const makeReq = (body, headers = {}, method = body ? 'POST' : 'GET') =>
    new Request('http://127.0.0.1:49000' + VOICE_STUDIO_API_ROUTE, {
      method,
      headers: {
        'X-DSH-VOICE': '1',
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...headers,
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    })

  // 拒绝缺少 X-DSH-VOICE: 1 或跨站 POST
  assert.equal((await backend.fetch(makeReq({ action: 'preview' }, { 'X-DSH-VOICE': '' }))).status, 403)
  assert.equal((await backend.fetch(makeReq({ action: 'preview' }, { Origin: 'https://evil.example' }))).status, 403)
  assert.equal((await backend.fetch(makeReq({ action: 'preview' }, { 'Sec-Fetch-Site': 'cross-site' }))).status, 403)

  // GET snapshot 不得泄漏明文密钥或代理凭据，仅返回布尔状态
  const snapRes = await backend.fetch(makeReq())
  assert.equal(snapRes.status, 200)
  const snapText = await snapRes.text()
  assert.ok(!snapText.includes('super-secret-asr-key'))
  assert.ok(!snapText.includes('super-secret-tts-key'))
  assert.ok(!snapText.includes('user:pass'))
  const snapJson = JSON.parse(snapText).snapshot
  assert.equal(snapJson.hasAsrKey, true)
  assert.equal(snapJson.hasTtsKey, true)
  assert.equal(snapJson.hasProxy, true)

  // POST preview 返回 audioBase64 与 durationSec
  const prevRes = await backend.fetch(makeReq({ action: 'preview', text: '工作台试听', voice: 'zh-CN-XiaoxiaoNeural' }))
  assert.equal(prevRes.status, 200)
  const prevJson = await prevRes.json()
  assert.equal(typeof prevJson.preview.audioBase64, 'string')
  assert.ok(prevJson.preview.audioBase64.length > 0)
  assert.equal(prevJson.preview.durationSec, 0.5)

  // POST transcribeMic 返回 transcript
  const micRes = await backend.fetch(
    makeReq({ action: 'transcribeMic', audioBase64: Buffer.from('FAKE_MIC_WEBM').toString('base64'), filename: 'mic.webm' }),
  )
  assert.equal(micRes.status, 200)
  const micJson = await micRes.json()
  assert.equal(micJson.transcript.text, '语音速记内容')
  assert.equal(micJson.transcript.language, 'zh')
})

test('Pro 6: lib/client.js 已构建、通过 node --check、注册 dsh-voice.workbench 且含 5 套主题与更新组件', () => {
  const clientPath = join(repoRoot, 'lib', 'client.js')
  assert.ok(existsSync(clientPath), 'lib/client.js must exist after build')
  execFileSync(process.execPath, ['--check', clientPath], { stdio: 'pipe' })

  const code = readFileSync(clientPath, 'utf8')
  assert.ok(code.includes('dsh-voice.workbench'), 'lib/client.js must register dsh-voice.workbench')
  assert.ok(code.includes('dsh-stardust:ui-style') || code.includes('createStyleSwitcher'), 'lib/client.js must include 5-theme style switcher')
  assert.ok(
    code.includes("'harness'") &&
      code.includes("'cream'") &&
      code.includes("'claude'") &&
      code.includes("'pixel8bit'") &&
      code.includes("'mint'"),
    'lib/client.js must bundle 5 themes',
  )
  assert.ok(code.includes('dsh-updates') || code.includes('__stardustUpdatesGuard'), 'lib/client.js must include @stardustlc/dsh-updates footer integration')
})

test('Pro 7: apply 动态注册 voice-workflow 运行时技能且 dispose 卸载干净', () => {
  const registeredSkills = []
  const listeners = {}
  const ctx = {
    tools: { register: () => () => {} },
    on(event, fn) {
      ;(listeners[event] ??= []).push(fn)
      return () => {}
    },
    inject(services, cb) {
      if (Array.isArray(services) && services.includes('skills')) {
        cb({
          skills: {
            register(def) {
              registeredSkills.push(def)
              return () => {
                const idx = registeredSkills.indexOf(def)
                if (idx >= 0) registeredSkills.splice(idx, 1)
              }
            },
          },
        })
      }
    },
  }

  apply(ctx, {})
  assert.equal(registeredSkills.length, 1)
  assert.equal(registeredSkills[0].name, 'voice-workflow')
  assert.equal(registeredSkills[0].source, 'runtime')
  assert.equal(registeredSkills[0].resourceBase.kind, 'directory')
  assert.ok(registeredSkills[0].description.includes('Voice Studio'))
  assert.ok(registeredSkills[0].content.includes('voice_tts'))

  for (const fn of listeners.dispose ?? []) fn()
  assert.equal(registeredSkills.length, 0)
})

test('Pro 7: installVoiceStudioWeb 默认按 voice 条目写设置并遵守 settings.writable', async () => {
  const calls = []
  let hostWritable = true
  const backend = installVoiceStudioWeb(
    {
      inject(services, cb) {
        if (Array.isArray(services) && services.includes('settings')) {
          cb({
            settings: {
              get writable() {
                return hostWritable
              },
              async update(id, patch) {
                calls.push({ id, patch })
              },
            },
          })
        }
      },
    },
    () => resolveConfig({}),
  )

  assert.equal(backend.snapshot().writable, true)
  const makePost = (body) =>
    new Request('http://127.0.0.1:49000' + VOICE_STUDIO_API_ROUTE, {
      method: 'POST',
      headers: { 'X-DSH-VOICE': '1', 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

  const okRes = await backend.fetch(makePost({ action: 'updateConfig', patch: { ttsVoice: 'zh-CN-YunxiNeural' } }))
  assert.equal(okRes.status, 200)
  assert.equal(calls.length, 1)
  assert.equal(calls[0].id, 'voice')
  assert.deepEqual(calls[0].patch, { ttsVoice: 'zh-CN-YunxiNeural' })

  hostWritable = false
  assert.equal(backend.snapshot().writable, false)
  const roRes = await backend.fetch(makePost({ action: 'updateConfig', patch: { ttsVoice: 'zh-CN-XiaoxiaoNeural' } }))
  assert.equal(roRes.status, 403)
  assert.equal(calls.length, 1)
})
