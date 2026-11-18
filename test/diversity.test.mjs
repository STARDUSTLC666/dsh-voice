import { test } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  apply,
  buildVoiceTools,
  Config,
  fetchEdgeVoices,
  filterVoices,
  generateSecMsGec,
  isValidVoiceId,
  liveConfig,
  resetEdgeVoicesCacheForTest,
  resolveConfig,
  resolveCustomVoice,
  resolvePersona,
  synthesizeOpenAiSpeech,
  VOICE_PERSONAS,
  VOICES,
} from '../lib/index.js'

function makeWorkspace(t, prefix = 'dsh-voice-diversity-') {
  const parent = mkdtempSync(join(tmpdir(), prefix))
  const root = join(parent, 'workspace')
  const outside = join(parent, 'outside')
  mkdirSync(root)
  mkdirSync(outside)
  t.after(() => rmSync(parent, { recursive: true, force: true }))
  return { root, outside, exec: { agent: { session: { header: { cwd: root } } } } }
}

// ---------- Layer 1: Expanded VOICES & VOICE_PERSONAS ----------

test('Layer 1: Expanded VOICES covers child, teen, documentary, elder, and dialects', () => {
  assert.equal(VOICES[0].id, 'zh-CN-XiaoxiaoNeural')
  assert.ok(VOICES.length >= 40, `Expected >= 40 built-in voices, got ${VOICES.length}`)

  const ids = new Set(VOICES.map((v) => v.id))
  for (const requiredId of [
    'zh-CN-XiaoshuangNeural', // child
    'zh-CN-YunxiaNeural',     // teen / anime
    'zh-CN-YunzeNeural',      // mature / documentary
    'zh-CN-XiaoruiNeural',    // elder
    'zh-HK-WanLungNeural',    // Cantonese male
    'zh-TW-YunJheNeural',     // Taiwanese male
    'zh-CN-henan-YundengNeural', // Henan dialect
  ]) {
    assert.ok(ids.has(requiredId), `Missing required voice in VOICES: ${requiredId}`)
    assert.equal(isValidVoiceId(requiredId), true, `isValidVoiceId failed for ${requiredId}`)
  }

  const childVoices = filterVoices({ tag: 'child' })
  assert.ok(childVoices.some((v) => v.id === 'zh-CN-XiaoshuangNeural'))

  const dialectVoices = filterVoices({ tag: 'dialect' })
  assert.ok(dialectVoices.some((v) => v.id === 'zh-CN-henan-YundengNeural'))
  assert.ok(dialectVoices.some((v) => v.id === 'zh-HK-WanLungNeural'))
})

test('Layer 1: VOICE_PERSONAS (>= 10) and resolvePersona by ID and Chinese label', () => {
  assert.ok(Array.isArray(VOICE_PERSONAS))
  assert.ok(VOICE_PERSONAS.length >= 10, `Expected >= 10 personas, got ${VOICE_PERSONAS.length}`)

  for (const persona of VOICE_PERSONAS) {
    assert.ok(persona.id && typeof persona.id === 'string')
    assert.ok(persona.label && typeof persona.label === 'string')
    assert.equal(isValidVoiceId(persona.voice), true, `Invalid persona voice: ${persona.voice}`)
    assert.equal(typeof persona.rate, 'string')
    assert.equal(typeof persona.pitch, 'string')
    assert.equal(typeof persona.pauseMs, 'number')
  }

  const radio = resolvePersona('late-night-radio')
  assert.ok(radio)
  assert.equal(radio.id, 'late-night-radio')

  // Case-insensitive and whitespace-trimmed ID match
  const radioUpper = resolvePersona('  LATE-NIGHT-RADIO  ')
  assert.deepEqual(radioUpper, radio)

  // Chinese label match
  const byLabel = resolvePersona(radio.label)
  assert.deepEqual(byLabel, radio)

  const doc = resolvePersona('documentary-narrator')
  assert.ok(doc)
  assert.deepEqual(resolvePersona(doc.label), doc)

  assert.equal(resolvePersona('non-existent-persona'), undefined)
})

// ---------- Layer 2: Live Online Edge Voice Discovery ----------

test('Layer 2: fetchEdgeVoices sends Sec-MS-GEC, maps tags, and caches for 24h', async (t) => {
  resetEdgeVoicesCacheForTest()
  t.after(() => resetEdgeVoicesCacheForTest())

  let fetchCount = 0
  const seenRequests = []
  const samplePayload = [
    {
      ShortName: 'zh-CN-XiaoxiaoNeural',
      Gender: 'Female',
      Locale: 'zh-CN',
      FriendlyName: 'Microsoft Xiaoxiao Online (Natural) - Chinese (Mainland)',
      VoiceTag: {
        ContentCategories: ['News', 'Novel'],
        VoicePersonalities: ['Warm'],
      },
    },
    {
      ShortName: 'en-US-CartoonBuddyNeural',
      Gender: 'Male',
      Locale: 'en-US',
      FriendlyName: 'Microsoft Cartoon Buddy Online',
      VoiceTag: {
        ContentCategories: ['Cartoon', 'Conversation'],
        VoicePersonalities: ['Cheerful'],
      },
    },
  ]

  const fetchImpl = async (url, init) => {
    fetchCount += 1
    seenRequests.push({ url: String(url), init })
    return {
      ok: true,
      status: 200,
      json: async () => samplePayload,
    }
  }

  const t0 = 1_700_000_000
  const first = await fetchEdgeVoices({ fetchImpl, nowSeconds: () => t0 }, 5000)
  assert.equal(fetchCount, 1)
  assert.equal(first.length, 2)

  // Verify Sec-MS-GEC query parameter & headers
  const reqUrl = new URL(seenRequests[0].url)
  const gecQuery = reqUrl.searchParams.get('Sec-MS-GEC')
  assert.equal(gecQuery, generateSecMsGec(t0))
  assert.ok(reqUrl.searchParams.get('Sec-MS-GEC-Version'))
  assert.equal(seenRequests[0].init.headers['Sec-MS-GEC'], gecQuery)
  assert.ok(seenRequests[0].init.headers['Sec-MS-GEC-Version'])

  // Built-in match preserves Chinese friendly locale while merging tags
  const xiaoxiao = first.find((v) => v.id === 'zh-CN-XiaoxiaoNeural')
  assert.ok(xiaoxiao)
  assert.ok(xiaoxiao.tags?.includes('news'))
  assert.ok(xiaoxiao.tags?.includes('novel'))
  assert.ok(xiaoxiao.tags?.includes('warm'))

  const cartoon = first.find((v) => v.id === 'en-US-CartoonBuddyNeural')
  assert.ok(cartoon)
  assert.equal(cartoon.gender, 'Male')
  assert.ok(cartoon.tags?.includes('cartoon'))
  assert.ok(cartoon.tags?.includes('cheerful'))

  // Second call within 24h returns cached voices without re-fetching
  const second = await fetchEdgeVoices({ fetchImpl, nowSeconds: () => t0 + 60 }, 5000)
  assert.equal(fetchCount, 1)
  assert.equal(second.length, 2)

  // forceRefresh bypasses cache
  await fetchEdgeVoices({ fetchImpl, nowSeconds: () => t0 + 60, forceRefresh: true }, 5000)
  assert.equal(fetchCount, 2)

  // resetEdgeVoicesCacheForTest clears cache
  resetEdgeVoicesCacheForTest()
  await fetchEdgeVoices({ fetchImpl, nowSeconds: () => t0 + 60 }, 5000)
  assert.equal(fetchCount, 3)
})

test('Layer 2: voice_list({ online: true }) supports tag filter and falls back gracefully on error', async () => {
  const cfg = resolveConfig({ timeoutMs: 5000 })
  const onlineList = buildVoiceTools(cfg, {
    fetchVoices: async () => [
      { id: 'en-US-CartoonBuddyNeural', gender: 'Male', locale: 'en-US (Cartoon)', tags: ['cartoon', 'cheerful'] },
      { id: 'zh-CN-XiaoxiaoNeural', gender: 'Female', locale: '普通话（晓晓）', tags: ['warm'] },
    ],
  }).find((t) => t.name === 'voice_list')

  const onlineRes = await onlineList.execute({ online: true, tag: 'cartoon' })
  assert.equal(onlineRes.source, 'edge-online')
  assert.equal(onlineRes.count, 1)
  assert.equal(onlineRes.voices[0].id, 'en-US-CartoonBuddyNeural')
  assert.ok(Array.isArray(onlineRes.personas) && onlineRes.personas.length >= 10)

  const fallbackList = buildVoiceTools(cfg, {
    fetchVoices: async () => {
      throw new Error('network unreachable')
    },
  }).find((t) => t.name === 'voice_list')

  const fallbackRes = await fallbackList.execute({ online: true, includePersonas: false })
  assert.equal(fallbackRes.source, 'builtin-fallback')
  assert.match(fallbackRes.fallbackReason, /network unreachable/)
  assert.equal(fallbackRes.count, VOICES.length)
  assert.deepEqual(fallbackRes.personas, [])
})

// ---------- Layer 3: Emotion instructions, CosyVoice2 <|endofprompt|>, & Zero-Shot Cloning ----------

test('Layer 3: synthesizeOpenAiSpeech handles CosyVoice2 <|endofprompt|>, gpt-4o-mini-tts instructions, and references', async () => {
  const requests = []
  const fakeFetch = async (url, init) => {
    requests.push({ url: String(url), body: JSON.parse(init.body) })
    return { ok: true, status: 200, arrayBuffer: async () => Buffer.from('FAKE_MP3') }
  }

  // CosyVoice2 prepends instructions + <|endofprompt|> without top-level instructions field
  await synthesizeOpenAiSpeech(
    'https://api.siliconflow.cn/v1',
    'sf-key',
    {
      text: '今天真是太棒了！',
      voice: 'FunAudioLLM/CosyVoice2-0.5B:alex',
      model: 'FunAudioLLM/CosyVoice2-0.5B',
      instructions: '用开心的语气说',
    },
    fakeFetch,
    5000,
  )
  assert.equal(requests[0].body.input, '用开心的语气说<|endofprompt|>今天真是太棒了！')
  assert.equal(requests[0].body.instructions, undefined)

  // gpt-4o-mini-tts sends top-level payload.instructions and keeps input raw
  await synthesizeOpenAiSpeech(
    'https://api.openai.com/v1',
    'oai-key',
    {
      text: 'Welcome to the show.',
      voice: 'alloy',
      model: 'gpt-4o-mini-tts',
      instructions: 'Speak like a calm late-night DJ',
    },
    fakeFetch,
    5000,
  )
  assert.equal(requests[1].body.input, 'Welcome to the show.')
  assert.equal(requests[1].body.instructions, 'Speak like a calm late-night DJ')

  // Zero-shot references allow voice: '' and send payload.references
  await synthesizeOpenAiSpeech(
    'https://api.siliconflow.cn/v1',
    'sf-key',
    {
      text: '克隆一段台词',
      voice: '',
      model: 'FunAudioLLM/CosyVoice2-0.5B',
      references: [{ audioDataUri: 'data:audio/wav;base64,AAAA', text: '参考原声台词' }],
    },
    fakeFetch,
    5000,
  )
  assert.equal(requests[2].body.voice, '')
  assert.deepEqual(requests[2].body.references, [{ audio: 'data:audio/wav;base64,AAAA', text: '参考原声台词' }])
})

test('Layer 3: voice_tts with referenceAudio validates workspace boundary, encodes base64 data URI, and guards edge engine', async (t) => {
  const { root, outside, exec } = makeWorkspace(t)
  const refInside = join(root, 'sample.wav')
  const refOutside = join(outside, 'secret.wav')
  writeFileSync(refInside, Buffer.from('RIFF_SAMPLE_AUDIO'))
  writeFileSync(refOutside, Buffer.from('OUTSIDE_AUDIO'))

  // 1) Routes to openaiTts on siliconflow with base64 data URI
  let captured
  const sfCfg = resolveConfig({ ttsEngine: 'siliconflow', ttsApiKey: 'sf-key' })
  const sfTts = buildVoiceTools(sfCfg, {
    openaiTts: async (baseUrl, apiKey, opts) => {
      captured = { baseUrl, apiKey, opts }
      return Buffer.from('CLONED_MP3')
    },
  }).find((tool) => tool.name === 'voice_tts')

  const res = await sfTts.execute({
    text: '你好，这是克隆音色测试。',
    referenceAudio: 'sample.wav',
    referenceText: '这是五秒参考录音。',
    instructions: '温柔微笑着说',
    output: 'cloned.mp3',
  }, exec)

  assert.equal(captured.baseUrl, 'https://api.siliconflow.cn/v1')
  assert.equal(captured.opts.voice, '')
  assert.equal(captured.opts.instructions, '温柔微笑着说')
  assert.equal(captured.opts.references.length, 1)
  assert.equal(captured.opts.references[0].text, '这是五秒参考录音。')
  assert.equal(
    captured.opts.references[0].audioDataUri,
    'data:audio/wav;base64,' + Buffer.from('RIFF_SAMPLE_AUDIO').toString('base64'),
  )
  assert.equal(readFileSync(join(root, 'cloned.mp3'), 'utf8'), 'CLONED_MP3')
  assert.ok(res.bytes > 0)

  // 2) Security boundary: rejects referenceAudio outside workspace
  await assert.rejects(
    () => sfTts.execute({ text: '越权测试', referenceAudio: refOutside, output: 'bad.mp3' }, exec),
    /必须位于会话工作区内/,
  )

  // 3) Helpful guidance error when called while ttsEngine === 'edge' (without openaiTts override)
  const edgeCfg = resolveConfig({ ttsEngine: 'edge' })
  const edgeTts = buildVoiceTools(edgeCfg).find((tool) => tool.name === 'voice_tts')
  await assert.rejects(
    () => edgeTts.execute({ text: '测试', referenceAudio: 'sample.wav', output: 'edge-fail.mp3' }, exec),
    /ttsEngine.*siliconflow|referenceAudio/i,
  )
})

// ---------- Layer 4: customVoices Live Config, persona in tools, & normalizeLoudness ----------

test('Layer 4: customVoices Schema serialization, volatile live update, voice_tts, and voice_preview', async (t) => {
  const { root, exec } = makeWorkspace(t)

  // Schema serializes cleanly and has no nested-volatile error
  const serialized = JSON.parse(JSON.stringify(Config))
  assert.equal(typeof serialized.uid, 'number')
  assert.ok(Config.dict.customVoices)
  assert.equal(Config.dict.customVoices.meta.volatile, true)

  const parsed = Config({
    customVoices: [{ name: '老王', persona: 'documentary-narrator', rate: '-5%' }],
  })
  const liveResolved = resolveConfig(liveConfig(parsed))
  assert.equal(liveResolved.customVoices.length, 1)
  assert.equal(resolveCustomVoice(liveResolved.customVoices, '老王')?.persona, 'documentary-narrator')

  // Verify apply() registers tools with live customVoices
  const registered = []
  apply({ tools: { register(def) { registered.push(def); return () => {} } }, logger: { warn() {} } }, parsed)
  const appliedList = registered.find((d) => d.name === 'voice_list')
  assert.equal((await appliedList.execute({})).customVoices.length, 1)

  // Volatile live update
  const updated = Config({
    customVoices: [
      { name: '老王', persona: 'documentary-narrator', rate: '-5%' },
      { name: '电台夜话', persona: 'late-night-radio', pitch: '-3Hz' },
    ],
  })
  const writeSym = Symbol.for('cosmokit.volatile.write')
  parsed.customVoices[writeSym](updated.customVoices.get())
  assert.equal(liveConfig(parsed).customVoices.length, 2)
  assert.equal((await appliedList.execute({})).customVoices.length, 2)

  const appliedTts = registered.find((d) => d.name === 'voice_tts')
  assert.ok(appliedTts)

  // voice_tts using custom alias '老王'
  const ttsCalls = []
  const cfg = resolveConfig({
    customVoices: [{ name: '老王', persona: 'documentary-narrator', rate: '-5%' }],
  })
  const docPersona = resolvePersona('documentary-narrator')
  const tools = buildVoiceTools(cfg, {
    tts: async (opts) => {
      ttsCalls.push(opts)
      return Buffer.from('MP3:' + opts.voice)
    },
  })
  const tts = tools.find((d) => d.name === 'voice_tts')
  const preview = tools.find((d) => d.name === 'voice_preview')

  await tts.execute({ voice: '老王', text: '欢迎收看纪录片。', output: 'laowang.mp3' }, exec)
  assert.equal(ttsCalls[0].voice, docPersona.voice)
  assert.equal(ttsCalls[0].rate, '-5%')
  assert.equal(ttsCalls[0].pitch, docPersona.pitch)

  // voice_preview accepting persona ID and custom alias name
  const previewRes = await preview.execute({
    voices: ['late-night-radio', '老王'],
    outputDir: 'previews',
  }, exec)
  assert.equal(previewRes.count, 2)
  assert.equal(previewRes.failed.length, 0)
  assert.ok(existsSync(join(root, 'previews', 'voice-preview-late-night-radio.mp3')))
  assert.ok(existsSync(join(root, 'previews', 'voice-preview-老王.mp3')))
})

test('Layer 4: voice_tts segments apply per-segment persona/instructions and normalizeLoudness invokes normalizeAudio', async (t) => {
  const { root, exec } = makeWorkspace(t)

  // 1) segments with per-segment persona + instructions routed through openaiTts
  const segCalls = []
  const sfCfg = resolveConfig({ ttsEngine: 'siliconflow', ttsApiKey: 'sf-key' })
  const sfTools = buildVoiceTools(sfCfg, {
    openaiTts: async (_baseUrl, _apiKey, opts) => {
      segCalls.push(opts)
      return Buffer.from('SEG:' + opts.voice)
    },
    normalizeAudio: async (buf) => Buffer.concat([Buffer.from('NORM:'), buf]),
  })
  const sfTts = sfTools.find((d) => d.name === 'voice_tts')

  await sfTts.execute({
    segments: [
      { text: '深夜好。', persona: 'late-night-radio', instructions: '轻声慢速' },
      { text: '太燃了！', persona: 'anime-boy', instructions: '热血激动' },
    ],
    normalizeLoudness: true,
    output: 'podcast.mp3',
  }, exec)

  assert.equal(segCalls.length, 2)
  assert.equal(segCalls[0].voice, resolvePersona('late-night-radio').voice)
  assert.equal(segCalls[0].instructions, '轻声慢速')
  assert.equal(segCalls[1].voice, resolvePersona('anime-boy').voice)
  assert.equal(segCalls[1].instructions, '热血激动')

  const podcastBuf = readFileSync(join(root, 'podcast.mp3'), 'utf8')
  assert.ok(podcastBuf.startsWith('NORM:'), `Expected normalized prefix, got ${podcastBuf}`)

  // 2) Single-text normalizeLoudness on Edge route
  let normCalls = 0
  const edgeTts = buildVoiceTools(resolveConfig({}), {
    tts: async () => Buffer.from('RAW_EDGE'),
    normalizeAudio: async (buf) => {
      normCalls += 1
      return Buffer.from('MASTERED:' + buf.toString('utf8'))
    },
  }).find((d) => d.name === 'voice_tts')

  const singleRes = await edgeTts.execute({
    text: '单段响度均衡测试',
    normalizeLoudness: true,
    output: 'single.mp3',
  }, exec)
  assert.equal(normCalls, 1)
  assert.equal(readFileSync(join(root, 'single.mp3'), 'utf8'), 'MASTERED:RAW_EDGE')
  assert.equal(singleRes.bytes, Buffer.byteLength('MASTERED:RAW_EDGE'))
})
