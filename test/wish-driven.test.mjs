import { test } from 'node:test'
import assert from 'node:assert/strict'
import vm from 'node:vm'
import {
  curatePreviewVoicesForScene,
  DEFAULT_TECH_PRONUNCIATIONS,
  mergePronunciations,
  renderInteractivePlayerHtml,
  resolveScenePreset,
  resolveVoiceWish,
  VOICE_SCENES,
} from '../lib/wish.js'
import { VOICE_PERSONAS, VOICES } from '../lib/voices.js'
import { applyPronunciationsPlain } from '../lib/tts-text.js'

const ALL_VERIFIED_IDS = new Set([
  ...VOICES.map((v) => v.id),
  ...VOICE_PERSONAS.map((p) => p.id),
])
const PERSONA_IDS = new Set(VOICE_PERSONAS.map((p) => p.id))

// ---------- 1. VOICE_SCENES & resolveScenePreset ----------

test('VOICE_SCENES 包含 6 大高频场景且全部预览目标与默认人设均已实时验证', () => {
  const expectedIds = ['podcast', 'short-video', 'audiobook', 'briefing', 'story', 'dubbing']
  assert.deepEqual(Object.keys(VOICE_SCENES).sort(), [...expectedIds].sort())

  for (const id of expectedIds) {
    const preset = VOICE_SCENES[id]
    assert.equal(preset.id, id)
    assert.equal(preset.defaultOutputBase, id)
    assert.ok(PERSONA_IDS.has(preset.defaultPersona), `${id}.defaultPersona 必须是内置人设`)
    assert.ok(preset.previewTargets.length >= 3 && preset.previewTargets.length <= 4)
    for (const target of preset.previewTargets) {
      assert.ok(ALL_VERIFIED_IDS.has(target), `${id}.previewTargets 包含未验证 ID: ${target}`)
    }
  }

  // 关键场景专属默认值核对
  assert.equal(VOICE_SCENES.podcast.defaultPersona, 'podcast-host-female')
  assert.equal(VOICE_SCENES.podcast.defaultNormalizeLoudness, true)
  assert.equal(VOICE_SCENES.podcast.defaultBgmDucking, true)
  assert.deepEqual(VOICE_SCENES.podcast.previewTargets, [
    'podcast-host-female',
    'podcast-host-male',
    'bilingual-tech-female',
    'bilingual-tech-male',
  ])

  assert.equal(VOICE_SCENES['short-video'].defaultPersona, 'energetic-anchor')
  assert.equal(VOICE_SCENES['short-video'].defaultSubtitleGranularity, 'clause')
  assert.equal(VOICE_SCENES['short-video'].defaultMaxCharsPerCue, 14)
  assert.deepEqual(VOICE_SCENES['short-video'].previewTargets, [
    'energetic-anchor',
    'anime-boy',
    'podcast-host-female',
    'zh-CN-XiaoyiNeural',
  ])

  assert.equal(VOICE_SCENES.audiobook.defaultPersona, 'documentary-narrator')
  assert.equal(VOICE_SCENES.audiobook.defaultCleanMarkdown, true)
  assert.deepEqual(VOICE_SCENES.audiobook.previewTargets, [
    'documentary-narrator',
    'late-night-radio',
    'bedtime-story',
    'zh-CN-YunjianNeural',
  ])

  assert.equal(VOICE_SCENES.briefing.defaultPersona, 'news-briefing')
  assert.deepEqual(VOICE_SCENES.briefing.previewTargets, [
    'news-briefing',
    'bilingual-tech-female',
    'bilingual-tech-male',
    'zh-CN-YunyangNeural',
  ])

  assert.equal(VOICE_SCENES.story.defaultPersona, 'bedtime-story')
  assert.deepEqual(VOICE_SCENES.story.previewTargets, [
    'bedtime-story',
    'late-night-radio',
    'anime-boy',
    'zh-CN-XiaoyiNeural',
  ])

  assert.equal(VOICE_SCENES.dubbing.defaultPersona, 'bilingual-tech-male')
  assert.deepEqual(VOICE_SCENES.dubbing.previewTargets, [
    'bilingual-tech-male',
    'documentary-narrator',
    'podcast-host-female',
    'energetic-anchor',
  ])
})

test('resolveScenePreset 支持英文 ID、格式变体与中文别名，并拒绝未知输入', () => {
  const cases = [
    ['podcast', 'podcast'],
    ['PODCAST', 'podcast'],
    ['播客', 'podcast'],
    ['short-video', 'short-video'],
    ['short_video', 'short-video'],
    [' short video ', 'short-video'],
    ['短视频', 'short-video'],
    ['口播', 'short-video'],
    ['短视频配音', 'short-video'],
    ['audiobook', 'audiobook'],
    ['有声书', 'audiobook'],
    ['朗读', 'audiobook'],
    ['briefing', 'briefing'],
    ['简报', 'briefing'],
    ['早报', 'briefing'],
    ['新闻', 'briefing'],
    ['story', 'story'],
    ['故事', 'story'],
    ['睡前', 'story'],
    ['dubbing', 'dubbing'],
    ['配音', 'dubbing'],
  ]
  for (const [input, expectedId] of cases) {
    const resolved = resolveScenePreset(input)
    assert.equal(resolved?.id, expectedId, `输入 "${input}" 应解析为 "${expectedId}"`)
  }

  assert.equal(resolveScenePreset(undefined), undefined)
  assert.equal(resolveScenePreset(''), undefined)
  assert.equal(resolveScenePreset('   '), undefined)
  assert.equal(resolveScenePreset('non-existent-scene'), undefined)
  assert.equal(resolveScenePreset('history'), undefined)
  assert.equal(resolveScenePreset('double'), undefined)
})

// ---------- 2. curatePreviewVoicesForScene ----------

test('curatePreviewVoicesForScene 为所有场景与风格返回 3-4 个去重且实时验证的 ID', () => {
  const queries = [
    undefined,
    '',
    'podcast',
    '播客',
    'short-video',
    '短视频',
    'audiobook',
    '有声书',
    'briefing',
    '早报',
    'story',
    '睡前故事',
    'dubbing',
    '配音',
    'dialect',
    '方言',
    'bilingual',
    '双语',
    '粤语',
    '台湾',
    '深夜电台',
    '二次元',
    'english',
    'japanese',
    'korean',
    'unknown-style-fallback',
  ]

  for (const q of queries) {
    const picked = curatePreviewVoicesForScene(q)
    assert.ok(
      picked.length >= 3 && picked.length <= 4,
      `查询 "${String(q)}" 应返回 3-4 个候选，实际为 ${picked.length}`,
    )
    assert.equal(new Set(picked).size, picked.length, `查询 "${String(q)}" 不应包含重复 ID`)
    for (const id of picked) {
      assert.ok(ALL_VERIFIED_IDS.has(id), `查询 "${String(q)}" 返回未验证 ID: ${id}`)
    }
  }

  // 方言专项包含粤语/台湾/东北/陕西实时音色
  const dialect = curatePreviewVoicesForScene('方言')
  assert.deepEqual(dialect, curatePreviewVoicesForScene('dialect'))
  assert.ok(dialect.includes('zh-HK-HiuMaanNeural'))
  assert.ok(dialect.includes('zh-TW-HsiaoChenNeural'))
  assert.ok(dialect.includes('zh-CN-liaoning-XiaobeiNeural'))
  assert.ok(dialect.includes('zh-CN-shaanxi-XiaoniNeural'))

  // 双语专项包含双语人设 + Ava / Emma
  const bilingual = curatePreviewVoicesForScene('双语')
  assert.deepEqual(bilingual, curatePreviewVoicesForScene('bilingual'))
  assert.ok(bilingual.includes('bilingual-tech-female'))
  assert.ok(bilingual.includes('bilingual-tech-male'))
  assert.ok(bilingual.includes('en-US-AvaMultilingualNeural'))
  assert.ok(bilingual.includes('en-US-EmmaMultilingualNeural'))

  // 修改返回数组不得污染内部预设
  const copy = curatePreviewVoicesForScene('podcast')
  copy.push('mutated')
  assert.equal(VOICE_SCENES.podcast.previewTargets.length, 4)
})

// ---------- 3. resolveVoiceWish ----------

test('resolveVoiceWish 严格遵循优先级：自定义别名 > 精确人设 > 合法 Edge 音色 > 模糊人设 > 方言语种', () => {
  const customVoices = [
    { name: '品牌女声', voice: 'zh-CN-XiaoxiaoNeural', rate: '+5%' },
    { name: 'late-night-radio', voice: 'zh-CN-YunxiNeural' },
    { name: '播客', voice: 'zh-TW-HsiaoChenNeural' },
  ]

  // (a) 自定义音色别名最高优先级（即使与人设 ID 或模糊词重名）
  const c1 = resolveVoiceWish('品牌女声', customVoices)
  assert.equal(c1?.kind, 'custom')
  assert.equal(c1?.id, '品牌女声')
  assert.equal(c1?.voice, 'zh-CN-XiaoxiaoNeural')
  assert.equal(c1?.custom?.rate, '+5%')

  const c2 = resolveVoiceWish('LATE-NIGHT-RADIO', customVoices)
  assert.equal(c2?.kind, 'custom')
  assert.equal(c2?.voice, 'zh-CN-YunxiNeural')

  const c3 = resolveVoiceWish('播客', customVoices)
  assert.equal(c3?.kind, 'custom')
  assert.equal(c3?.voice, 'zh-TW-HsiaoChenNeural')

  // (b) 精确内置人设（ID 与中文标签）
  const p1 = resolveVoiceWish('documentary-narrator')
  assert.equal(p1?.kind, 'persona')
  assert.equal(p1?.id, 'documentary-narrator')
  assert.equal(p1?.persona?.voice, 'zh-CN-YunjianNeural')
  assert.equal(p1?.voice, 'zh-CN-YunjianNeural')

  const p2 = resolveVoiceWish('深夜电台')
  assert.equal(p2?.kind, 'persona')
  assert.equal(p2?.id, 'late-night-radio')
  assert.equal(p2?.matchedBy, 'persona')

  // (c) 合法 Edge 音色 ID（含大小写归一化）
  const v1 = resolveVoiceWish('zh-CN-XiaoxiaoNeural')
  assert.equal(v1?.kind, 'voice')
  assert.equal(v1?.id, 'zh-CN-XiaoxiaoNeural')
  assert.equal(v1?.voice, 'zh-CN-XiaoxiaoNeural')

  const v2 = resolveVoiceWish('zh-cn-xiaoxiaoneural')
  assert.equal(v2?.kind, 'voice')
  assert.equal(v2?.id, 'zh-CN-XiaoxiaoNeural')

  const v3 = resolveVoiceWish('en-US-FutureTestNeural')
  assert.equal(v3?.kind, 'voice')
  assert.equal(v3?.id, 'en-US-FutureTestNeural')
})

test('resolveVoiceWish 模糊中英文风格/人设关键词与方言语种解析全覆盖', () => {
  const personaCases = [
    ['深夜', 'late-night-radio'],
    ['电台风', 'late-night-radio'],
    ['情感独白', 'late-night-radio'],
    ['播客女', 'podcast-host-female'],
    ['女主持', 'podcast-host-female'],
    ['播客男', 'podcast-host-male'],
    ['男主持', 'podcast-host-male'],
    ['播客', 'podcast-host-male'],
    ['纪录片', 'documentary-narrator'],
    ['旁白', 'documentary-narrator'],
    ['沉稳男声', 'documentary-narrator'],
    ['睡前', 'bedtime-story'],
    ['讲故事', 'bedtime-story'],
    ['绘本', 'bedtime-story'],
    ['童声', 'bedtime-story'],
    ['温柔女声', 'bedtime-story'],
    ['少年', 'anime-boy'],
    ['动漫', 'anime-boy'],
    ['二次元', 'anime-boy'],
    ['热血', 'anime-boy'],
    ['激情', 'energetic-anchor'],
    ['解说', 'energetic-anchor'],
    ['广告', 'energetic-anchor'],
    ['短视频', 'energetic-anchor'],
    ['带货', 'energetic-anchor'],
    ['活力', 'energetic-anchor'],
    ['新闻', 'news-briefing'],
    ['资讯', 'news-briefing'],
    ['早报', 'news-briefing'],
    ['简报', 'news-briefing'],
    ['双语女', 'bilingual-tech-female'],
    ['科技女', 'bilingual-tech-female'],
    ['中英女', 'bilingual-tech-female'],
    ['双语男', 'bilingual-tech-male'],
    ['科技男', 'bilingual-tech-male'],
    ['双语', 'bilingual-tech-male'],
    ['中英混读', 'bilingual-tech-male'],
    ['documentary', 'documentary-narrator'],
    ['late night', 'late-night-radio'],
  ]

  for (const [query, expectedPersonaId] of personaCases) {
    const res = resolveVoiceWish(query)
    assert.equal(res?.kind, 'persona', `"${query}" 应命中 persona`)
    assert.equal(res?.id, expectedPersonaId, `"${query}" 应映射到 ${expectedPersonaId}`)
    assert.ok(res?.persona && res?.voice === res.persona.voice)
  }

  const dialectCases = [
    ['粤语男', 'zh-HK-WanLungNeural'],
    ['粤语男声', 'zh-HK-WanLungNeural'],
    ['粤语', 'zh-HK-HiuMaanNeural'],
    ['广东话', 'zh-HK-HiuMaanNeural'],
    ['台湾男', 'zh-TW-YunJheNeural'],
    ['台湾男声', 'zh-TW-YunJheNeural'],
    ['台湾', 'zh-TW-HsiaoChenNeural'],
    ['台湾腔', 'zh-TW-HsiaoChenNeural'],
    ['东北', 'zh-CN-liaoning-XiaobeiNeural'],
    ['东北话', 'zh-CN-liaoning-XiaobeiNeural'],
    ['陕西', 'zh-CN-shaanxi-XiaoniNeural'],
    ['陕西话', 'zh-CN-shaanxi-XiaoniNeural'],
    ['英语女', 'en-US-AvaMultilingualNeural'],
    ['英文女', 'en-US-AvaMultilingualNeural'],
    ['英语男', 'en-US-BrianMultilingualNeural'],
    ['英文男', 'en-US-BrianMultilingualNeural'],
    ['日语', 'ja-JP-NanamiNeural'],
    ['日文', 'ja-JP-NanamiNeural'],
    ['韩语', 'ko-KR-SunHiNeural'],
    ['韩文', 'ko-KR-SunHiNeural'],
  ]

  for (const [query, expectedVoiceId] of dialectCases) {
    const res = resolveVoiceWish(query)
    assert.equal(res?.kind, 'voice', `"${query}" 应命中 voice`)
    assert.equal(res?.id, expectedVoiceId, `"${query}" 应映射到 ${expectedVoiceId}`)
    assert.equal(res?.voice, expectedVoiceId)
    assert.ok(ALL_VERIFIED_IDS.has(res.id), `${res.id} 必须是内置实时验证音色`)
  }
})

test('resolveVoiceWish 对无效或胡乱输入严格返回 undefined，无英文子串误伤', () => {
  const invalidQueries = [
    '',
    '   ',
    'non-existent-persona',
    'bad voice!!!',
    'unknown-speaker',
    'history',
    'renew',
    'boyfriend',
    'zh-CN-NotARealVoice',
    '123456',
  ]
  for (const q of invalidQueries) {
    assert.equal(resolveVoiceWish(q), undefined, `"${q}" 必须返回 undefined`)
  }
})

// ---------- 4. DEFAULT_TECH_PRONUNCIATIONS & mergePronunciations ----------

test('DEFAULT_TECH_PRONUNCIATIONS 词边界安全替换技术术语且不误伤英文词内部子串', () => {
  const expectedMap = new Map([
    ['Nginx', 'Engine X'],
    ['SQL', 'S Q L'],
    ['K8s', 'K 8 s'],
    ['Kubernetes', 'K 8 s'],
    ['CLI', 'C L I'],
    ['GUI', 'G U I'],
    ['OAuth', 'O Auth'],
    ['PostgreSQL', 'Postgres'],
    ['kubectl', 'cube control'],
    ['GraphQL', 'Graph Q L'],
    ['WebSocket', 'Web Socket'],
  ])
  assert.equal(DEFAULT_TECH_PRONUNCIATIONS.length, expectedMap.size)
  for (const rule of DEFAULT_TECH_PRONUNCIATIONS) {
    assert.equal(expectedMap.get(rule.word), rule.alias)
  }

  const input = '使用 Nginx、SQL、K8s、Kubernetes、CLI、GUI、OAuth、PostgreSQL、kubectl、GraphQL 与 WebSocket。'
  const spoken = applyPronunciationsPlain(input, DEFAULT_TECH_PRONUNCIATIONS)
  assert.equal(
    spoken,
    '使用 Engine X、S Q L、K 8 s、K 8 s、C L I、G U I、O Auth、Postgres、cube control、Graph Q L 与 Web Socket。',
  )

  // 词边界保护：MySQL / CLIMATE / GUIDE 等包含子串的词必须保持原样
  const boundarySafe = applyPronunciationsPlain('MySQL CLIMATE GUIDE POSTAL', DEFAULT_TECH_PRONUNCIATIONS)
  assert.equal(boundarySafe, 'MySQL CLIMATE GUIDE POSTAL')

  // mergePronunciations 支持用户规则覆盖同名默认词条
  const merged = mergePronunciations(DEFAULT_TECH_PRONUNCIATIONS, [
    { word: 'SQL', alias: 'Sequel' },
    { word: 'Redis', alias: 'Red-iss' },
  ])
  assert.equal(merged.find((r) => r.word === 'SQL')?.alias, 'Sequel')
  assert.equal(merged.find((r) => r.word === 'Nginx')?.alias, 'Engine X')
  assert.equal(merged.find((r) => r.word === 'Redis')?.alias, 'Red-iss')
})

// ---------- 5. renderInteractivePlayerHtml & XSS Security ----------

test('renderInteractivePlayerHtml 生成自包含交互播放器（倍速/下载/章节/同步字幕）', () => {
  const html = renderInteractivePlayerHtml({
    title: '第 1 期：AI 语音工作流',
    audioFileName: 'podcast.mp3',
    voice: 'podcast-host-female (zh-CN-XiaoxiaoNeural)',
    durationSec: 125.4,
    chapters: [
      { title: '开场简介', startMs: 0, endMs: 45_000 },
      { title: '核心实战', startMs: 45_000, endMs: 125_400 },
    ],
    cues: [
      { index: 1, startMs: 0, endMs: 3200, text: '欢迎收听本期播客。' },
      { index: 2, startMs: 3200, endMs: 7800, text: '今天我们来聊聊许愿式语音创作。' },
    ],
  })

  assert.ok(html.startsWith('<!DOCTYPE html>'))
  assert.ok(html.includes('<audio id="player" controls preload="metadata" src="./podcast.mp3"></audio>'))
  assert.ok(html.includes('<option value="0.8">0.8x</option>'))
  assert.ok(html.includes('<option value="1" selected>1.0x</option>'))
  assert.ok(html.includes('<option value="1.25">1.25x</option>'))
  assert.ok(html.includes('<option value="1.5">1.5x</option>'))
  assert.ok(html.includes('href="./podcast.mp3" download="podcast.mp3"'))
  assert.ok(html.includes('02:05'))
  assert.ok(html.includes('class="chapter-chip" data-chapter-index="0" data-start-ms="0" data-end-ms="45000"'))
  assert.ok(html.includes('class="chapter-chip" data-chapter-index="1" data-start-ms="45000" data-end-ms="125400"'))
  assert.ok(html.includes('class="cue-item" data-cue-index="0" data-start-ms="0" data-end-ms="3200"'))
  assert.ok(html.includes('class="cue-item" data-cue-index="1" data-start-ms="3200" data-end-ms="7800"'))
  assert.ok(html.includes('timeupdate'))

  // 无章节、无字幕时优雅省略对应区块
  const minimal = renderInteractivePlayerHtml({
    title: '极简试听',
    audioFileName: 'sub/clip 1.mp3',
  })
  assert.ok(minimal.includes('src="./sub/clip%201.mp3"'))
  assert.ok(minimal.includes('download="clip 1.mp3"'))
  assert.equal(minimal.includes('id="chapter-list"'), false)
  assert.equal(minimal.includes('id="cue-list"'), false)
})

test('renderInteractivePlayerHtml 严格防 XSS：转义所有 HTML/属性/路径及内联脚本 JSON（含 </script> 与 U+2028/U+2029）', () => {
  const hostileTitle = '<img src=x onerror="alert(1)"></title><script>alert(2)</script>'
  const hostileFile = 'evil"><script>alert(3)</script>.mp3'
  const hostileVoice = '" onmouseover="alert(4)<b>bad</b>'
  const hostileCueText = 'Hello </script><script>window.pwned=1</script>\u2028\u2029&"<b>x</b>'
  const hostileChapterTitle = 'Sec 1 </script><svg onload=alert(5)>'

  const html = renderInteractivePlayerHtml({
    title: hostileTitle,
    audioFileName: hostileFile,
    voice: hostileVoice,
    durationSec: 12,
    chapters: [{ title: hostileChapterTitle, startMs: 0, endMs: 12_000 }],
    cues: [{ index: 1, startMs: 0, endMs: 12_000, text: hostileCueText }],
  })

  // 整个文档仅允许出现恰好一对内联 <script>...</script>
  const openScripts = html.match(/<script\b/gi) ?? []
  const closeScripts = html.match(/<\/script>/gi) ?? []
  assert.equal(openScripts.length, 1, '不能被注入额外的 <script> 标签')
  assert.equal(closeScripts.length, 1, '不能被提前闭合 </script> 标签')

  // 不允许残留任何未转义的危险标签或行分隔符
  assert.equal(html.includes('<img src=x'), false)
  assert.equal(html.includes('<svg onload='), false)
  assert.equal(html.includes('onmouseover="alert(4)'), false)
  assert.equal(html.includes('\u2028'), false)
  assert.equal(html.includes('\u2029'), false)

  // javascript: 伪协议文件名必须被安全限定为相对路径
  const jsProtoHtml = renderInteractivePlayerHtml({
    title: 'Proto test',
    audioFileName: 'javascript:alert(9)',
  })
  assert.equal(jsProtoHtml.includes('href="javascript:'), false)
  assert.equal(jsProtoHtml.includes('src="javascript:'), false)
  assert.ok(jsProtoHtml.includes('src="./javascript%3Aalert(9)"'))

  // 提取内联 <script> 并在沙盒中验证整段 JS 语法完全合法且 PLAYER_DATA 完整保真
  const scriptMatch = /<script>([\s\S]*?)<\/script>/.exec(html)
  assert.ok(scriptMatch, '应包含单个内联 script 块')
  const scriptBody = scriptMatch[1]
  assert.equal(scriptBody.includes('</'), false, 'script 内部不可出现未转义 </')
  assert.equal(scriptBody.includes('\u2028'), false)
  assert.equal(scriptBody.includes('\u2029'), false)
  assert.doesNotThrow(() => new vm.Script(scriptBody), '整段内联 script 必须是合法 JavaScript')

  const dataMatch = /const PLAYER_DATA = ([\s\S]*?);/.exec(scriptBody)
  assert.ok(dataMatch, '应包含 PLAYER_DATA 声明')
  const parsed = vm.runInNewContext(`(${dataMatch[1]})`)
  assert.equal(parsed.title, hostileTitle)
  assert.equal(parsed.audioFileName, hostileFile)
  assert.equal(parsed.voice, hostileVoice)
  assert.equal(parsed.chapters[0].title, hostileChapterTitle)
  assert.equal(parsed.cues[0].text, hostileCueText)
})
