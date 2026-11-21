/**
 * Wish-Driven（“许愿式”）核心纯函数库：
 * - 场景配方（VOICE_SCENES / resolveScenePreset）
 * - 场景/风格试听推荐（curatePreviewVoicesForScene）
 * - 自然语言模糊音色与人设解析（resolveVoiceWish）
 * - 保守的词边界安全默认技术发音词典（DEFAULT_TECH_PRONUNCIATIONS / mergePronunciations）
 * - 零依赖自包含 HTML5 交互播放器渲染（renderInteractivePlayerHtml，严格 XSS 转义）
 *
 * @module dsh-voice/wish
 */
import {
  resolveCustomVoice,
  type CustomVoiceAlias,
  type PronunciationRule,
} from './config.js'
import type { SubtitleCue } from './edge-tts.js'
import type { AudioChapter, SubtitleGranularity } from './tts-text.js'
import {
  isValidVoiceId,
  resolvePersona,
  VOICE_PERSONAS,
  VOICES,
  type VoicePersona,
} from './voices.js'

/** 支持的 6 大高频语音创作场景 ID。 */
export type VoiceSceneId =
  | 'podcast'
  | 'short-video'
  | 'audiobook'
  | 'briefing'
  | 'story'
  | 'dubbing'

/** 单个语音创作场景的默认配方。 */
export interface VoiceScenePreset {
  readonly id: VoiceSceneId
  readonly label: string
  readonly description: string
  readonly defaultPersona: string
  readonly defaultSubtitleGranularity?: SubtitleGranularity
  readonly defaultMaxCharsPerCue?: number
  readonly defaultNormalizeLoudness?: boolean
  readonly defaultBgmDucking?: boolean
  readonly defaultCleanMarkdown?: boolean
  readonly defaultOutputBase: string
  readonly previewTargets: readonly string[]
  readonly aliases: readonly string[]
}

/** 6 大高频创作场景预设（所有 previewTargets 均指向内置已验证音色或角色人设）。 */
export const VOICE_SCENES: Readonly<Record<VoiceSceneId, VoiceScenePreset>> = Object.freeze({
  podcast: Object.freeze({
    id: 'podcast',
    label: '播客节目',
    description: '适合单人或双人播客对谈，默认开启播客级响度均衡与 BGM 自动闪避',
    defaultPersona: 'podcast-host-female',
    defaultNormalizeLoudness: true,
    defaultBgmDucking: true,
    defaultOutputBase: 'podcast',
    previewTargets: Object.freeze([
      'podcast-host-female',
      'podcast-host-male',
      'bilingual-tech-female',
      'bilingual-tech-male',
    ]),
    aliases: Object.freeze(['podcast', '播客', '对谈', '访谈', '电台节目']),
  }),
  'short-video': Object.freeze({
    id: 'short-video',
    label: '短视频口播',
    description: '适合抖音/小红书/B站短视频配音，默认激情解说声线与 14 字紧凑短句字幕',
    defaultPersona: 'energetic-anchor',
    defaultSubtitleGranularity: 'clause',
    defaultMaxCharsPerCue: 14,
    defaultOutputBase: 'short-video',
    previewTargets: Object.freeze([
      'energetic-anchor',
      'anime-boy',
      'podcast-host-female',
      'zh-CN-XiaoyiNeural',
    ]),
    aliases: Object.freeze([
      'short-video',
      'shortvideo',
      'short_video',
      'short video',
      'shorts',
      'douyin',
      'tiktok',
      '短视频',
      '口播',
      '抖音',
      '小红书',
    ]),
  }),
  audiobook: Object.freeze({
    id: 'audiobook',
    label: '有声书朗读',
    description: '适合长文章与 Markdown 书籍有声化，默认沉稳纪录片旁白并自动清洗 Markdown',
    defaultPersona: 'documentary-narrator',
    defaultCleanMarkdown: true,
    defaultOutputBase: 'audiobook',
    previewTargets: Object.freeze([
      'documentary-narrator',
      'late-night-radio',
      'bedtime-story',
      'zh-CN-YunjianNeural',
    ]),
    aliases: Object.freeze(['audiobook', 'audio-book', 'audio book', '有声书', '朗读', '听书', '长文']),
  }),
  briefing: Object.freeze({
    id: 'briefing',
    label: '每日简报',
    description: '适合每日新闻、早报与资讯摘要，默认专业干练的新闻播报声线',
    defaultPersona: 'news-briefing',
    defaultOutputBase: 'briefing',
    previewTargets: Object.freeze([
      'news-briefing',
      'bilingual-tech-female',
      'bilingual-tech-male',
      'zh-CN-YunyangNeural',
    ]),
    aliases: Object.freeze(['briefing', 'news', 'daily-briefing', '简报', '早报', '新闻', '资讯', '日报', '播报']),
  }),
  story: Object.freeze({
    id: 'story',
    label: '睡前故事',
    description: '适合儿童绘本、睡前伴读与治愈系故事，默认灵动温柔的睡前故事声线',
    defaultPersona: 'bedtime-story',
    defaultOutputBase: 'story',
    previewTargets: Object.freeze([
      'bedtime-story',
      'late-night-radio',
      'anime-boy',
      'zh-CN-XiaoyiNeural',
    ]),
    aliases: Object.freeze(['story', 'bedtime', 'fairy-tale', '故事', '睡前', '绘本', '童话']),
  }),
  dubbing: Object.freeze({
    id: 'dubbing',
    label: '视频配音',
    description: '适合外语视频翻配、双语演示与教程配音，默认流畅中英混读男声',
    defaultPersona: 'bilingual-tech-male',
    defaultOutputBase: 'dubbing',
    previewTargets: Object.freeze([
      'bilingual-tech-male',
      'documentary-narrator',
      'podcast-host-female',
      'energetic-anchor',
    ]),
    aliases: Object.freeze(['dubbing', 'voiceover', 'voice-over', '配音', '翻配']),
  }),
})

const SCENE_LIST: readonly VoiceScenePreset[] = Object.freeze([
  VOICE_SCENES['short-video'],
  VOICE_SCENES.podcast,
  VOICE_SCENES.audiobook,
  VOICE_SCENES.briefing,
  VOICE_SCENES.story,
  VOICE_SCENES.dubbing,
])

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function matchesKeyword(haystack: string, keyword: string): boolean {
  if (/^[a-z0-9][a-z0-9 _-]*$/i.test(keyword)) {
    const pattern = new RegExp(`(?<![a-z0-9])${escapeRegex(keyword)}(?![a-z0-9])`, 'i')
    return pattern.test(haystack)
  }
  return haystack.includes(keyword)
}

/**
 * 解析场景预设（支持英文场景 ID 与常见中英文别名，如 `'播客'`、`'短视频'`、`'口播'`、`'有声书'`、`'早报'`、`'故事'`、`'配音'`）。
 * 无法识别时返回 `undefined`。
 */
export function resolveScenePreset(scene: string | undefined): VoiceScenePreset | undefined {
  if (typeof scene !== 'string') return undefined
  const raw = scene.trim().toLowerCase()
  if (raw === '') return undefined

  const normalizedSlug = raw.replace(/[\s_]+/g, '-')
  if (normalizedSlug in VOICE_SCENES) {
    return VOICE_SCENES[normalizedSlug as VoiceSceneId]
  }

  for (const preset of SCENE_LIST) {
    if (preset.aliases.some((alias) => alias.toLowerCase() === raw || alias.toLowerCase() === normalizedSlug)) {
      return preset
    }
  }

  // 次级模糊包含匹配：按特定度顺序检查，避免如“短视频配音”误落入通用“配音”。
  for (const preset of SCENE_LIST) {
    if (preset.aliases.some((alias) => matchesKeyword(raw, alias))) {
      return preset
    }
  }

  return undefined
}

const VALID_PREVIEW_TARGET_IDS: ReadonlySet<string> = new Set([
  ...VOICES.map((v) => v.id),
  ...VOICE_PERSONAS.map((p) => p.id),
])

const DEFAULT_PREVIEW_TARGETS: readonly string[] = Object.freeze([
  'podcast-host-female',
  'podcast-host-male',
  'documentary-narrator',
  'bilingual-tech-female',
])

const STYLE_PREVIEW_RULES: ReadonlyArray<{ keywords: readonly string[]; targets: readonly string[] }> = Object.freeze([
  {
    keywords: ['dialect', '方言', '地方话'],
    targets: [
      'zh-HK-HiuMaanNeural',
      'zh-TW-HsiaoChenNeural',
      'zh-CN-liaoning-XiaobeiNeural',
      'zh-CN-shaanxi-XiaoniNeural',
    ],
  },
  {
    keywords: ['cantonese', '粤语', '广东话'],
    targets: [
      'zh-HK-HiuMaanNeural',
      'zh-HK-WanLungNeural',
      'zh-HK-HiuGaaiNeural',
    ],
  },
  {
    keywords: ['taiwan', 'taiwanese', '台湾', '台腔'],
    targets: [
      'zh-TW-HsiaoChenNeural',
      'zh-TW-HsiaoYuNeural',
      'zh-TW-YunJheNeural',
    ],
  },
  {
    keywords: ['bilingual', 'multilingual', '双语', '中英'],
    targets: [
      'bilingual-tech-female',
      'bilingual-tech-male',
      'en-US-AvaMultilingualNeural',
      'en-US-EmmaMultilingualNeural',
    ],
  },
  {
    keywords: ['radio', 'late-night', 'late night', '深夜', '电台', '情感', '治愈'],
    targets: [
      'late-night-radio',
      'bedtime-story',
      'documentary-narrator',
      'zh-CN-XiaoxiaoNeural',
    ],
  },
  {
    keywords: ['anime', 'cartoon', '少年', '动漫', '二次元', '热血'],
    targets: [
      'anime-boy',
      'energetic-anchor',
      'bedtime-story',
      'zh-CN-XiaoyiNeural',
    ],
  },
  {
    keywords: ['tech', '科技', '技术', '教程', '开发'],
    targets: [
      'bilingual-tech-female',
      'bilingual-tech-male',
      'podcast-host-male',
      'news-briefing',
    ],
  },
  {
    keywords: ['english', '英语', '英文'],
    targets: [
      'en-US-AvaMultilingualNeural',
      'en-US-BrianMultilingualNeural',
      'en-US-JennyNeural',
      'en-GB-RyanNeural',
    ],
  },
  {
    keywords: ['japanese', '日语', '日文'],
    targets: [
      'ja-JP-NanamiNeural',
      'ja-JP-KeitaNeural',
      'en-US-AvaMultilingualNeural',
    ],
  },
  {
    keywords: ['korean', '韩语', '韩文'],
    targets: [
      'ko-KR-SunHiNeural',
      'ko-KR-InJoonNeural',
      'ko-KR-HyunsuMultilingualNeural',
    ],
  },
  {
    keywords: ['female', '女声', '女生'],
    targets: [
      'podcast-host-female',
      'bedtime-story',
      'bilingual-tech-female',
      'zh-TW-HsiaoChenNeural',
    ],
  },
  {
    keywords: ['male', '男声', '男生'],
    targets: [
      'podcast-host-male',
      'documentary-narrator',
      'late-night-radio',
      'bilingual-tech-male',
    ],
  },
])

function filterVerifiedTargets(targets: readonly string[]): string[] {
  const out: string[] = []
  const seen = new Set<string>()
  for (const id of targets) {
    if (VALID_PREVIEW_TARGET_IDS.has(id) && !seen.has(id)) {
      seen.add(id)
      out.push(id)
    }
  }
  return out
}

/**
 * 按场景或风格关键词精选 3–4 个对比鲜明且经 Edge 实时验证可用的试听音色/人设 ID。
 * 所有返回 ID 均保证存在于 `VOICES` 或 `VOICE_PERSONAS`。
 */
export function curatePreviewVoicesForScene(sceneOrStyle?: string): string[] {
  if (typeof sceneOrStyle !== 'string' || sceneOrStyle.trim() === '') {
    return [...DEFAULT_PREVIEW_TARGETS]
  }

  const raw = sceneOrStyle.trim().toLowerCase()
  const normalizedSlug = raw.replace(/[\s_]+/g, '-')

  // 1. 精确命中场景 ID 或别名时，直接返回该场景的试听推荐
  if (normalizedSlug in VOICE_SCENES) {
    return filterVerifiedTargets(VOICE_SCENES[normalizedSlug as VoiceSceneId].previewTargets)
  }
  const exactScene = SCENE_LIST.find((preset) =>
    preset.aliases.some((alias) => alias.toLowerCase() === raw || alias.toLowerCase() === normalizedSlug),
  )
  if (exactScene !== undefined) {
    return filterVerifiedTargets(exactScene.previewTargets)
  }

  // 2. 匹配专项风格（如方言、双语、特定语种、二次元、深夜电台）
  for (const rule of STYLE_PREVIEW_RULES) {
    if (rule.keywords.some((kw) => matchesKeyword(raw, kw))) {
      return filterVerifiedTargets(rule.targets)
    }
  }

  // 3. 模糊场景匹配
  const fuzzyScene = resolveScenePreset(raw)
  if (fuzzyScene !== undefined) {
    return filterVerifiedTargets(fuzzyScene.previewTargets)
  }

  const wish = resolveVoiceWish(raw)
  if (wish !== undefined && VALID_PREVIEW_TARGET_IDS.has(wish.id)) {
    const merged = [wish.id, ...DEFAULT_PREVIEW_TARGETS]
    return filterVerifiedTargets(merged).slice(0, 4)
  }

  return [...DEFAULT_PREVIEW_TARGETS]
}

/** 音色心愿解析命中的目标类别。 */
export type VoiceWishKind = 'custom' | 'persona' | 'voice'

/** 音色心愿解析结果。 */
export interface ResolvedVoiceWish {
  kind: VoiceWishKind
  id: string
  persona?: VoicePersona
  custom?: CustomVoiceAlias
  voice?: string
  matchedBy: string
}

const FUZZY_PERSONA_RULES: ReadonlyArray<{ personaId: string; keywords: readonly string[] }> = Object.freeze([
  {
    personaId: 'late-night-radio',
    keywords: ['深夜', '电台', '情感', 'late-night', 'late night', 'radio', 'emotional'],
  },
  {
    personaId: 'bilingual-tech-female',
    keywords: ['双语女', '科技女', '中英女', 'bilingual female', 'tech female'],
  },
  {
    personaId: 'bilingual-tech-male',
    keywords: ['双语男', '科技男', '双语', '中英', 'bilingual male', 'tech male', 'bilingual', 'multilingual'],
  },
  {
    personaId: 'podcast-host-female',
    keywords: ['播客女', '女主持', '女播客', 'podcast female', 'female host', 'female podcast'],
  },
  {
    personaId: 'podcast-host-male',
    keywords: ['播客男', '男主持', '男播客', '播客', 'podcast male', 'male host', 'male podcast', 'podcast'],
  },
  {
    personaId: 'documentary-narrator',
    keywords: ['纪录片', '旁白', '沉稳', 'documentary', 'narrator'],
  },
  {
    personaId: 'bedtime-story',
    keywords: ['睡前', '故事', '绘本', '童声', '温柔', 'bedtime', 'story', 'storyteller', 'gentle'],
  },
  {
    personaId: 'anime-boy',
    keywords: ['少年', '动漫', '二次元', '热血', 'anime', 'cartoon', 'teen', 'boy'],
  },
  {
    personaId: 'energetic-anchor',
    keywords: ['激情', '解说', '广告', '短视频', '带货', '活力', 'energetic', 'commercial', 'sports', 'anchor', 'short-video', 'short video'],
  },
  {
    personaId: 'news-briefing',
    keywords: ['新闻', '资讯', '早报', '简报', 'news', 'briefing', 'broadcast', 'reporter'],
  },
])

const FUZZY_DIALECT_VOICE_RULES: ReadonlyArray<{
  voiceId: string
  matchedBy: string
  match: (raw: string) => boolean
}> = Object.freeze([
  {
    voiceId: 'zh-HK-WanLungNeural',
    matchedBy: 'dialect:粤语男',
    match: (raw) =>
      raw.includes('粤语男')
      || raw.includes('广东话男')
      || /(?:粤语|广东话).*男|男.*(?:粤语|广东话)/.test(raw)
      || (matchesKeyword(raw, 'cantonese') && matchesKeyword(raw, 'male')),
  },
  {
    voiceId: 'zh-HK-HiuMaanNeural',
    matchedBy: 'dialect:粤语',
    match: (raw) => raw.includes('粤语') || raw.includes('广东话') || matchesKeyword(raw, 'cantonese'),
  },
  {
    voiceId: 'zh-TW-YunJheNeural',
    matchedBy: 'dialect:台湾男',
    match: (raw) =>
      raw.includes('台湾男')
      || /台湾.*男|男.*台湾/.test(raw)
      || ((matchesKeyword(raw, 'taiwan') || matchesKeyword(raw, 'taiwanese')) && matchesKeyword(raw, 'male')),
  },
  {
    voiceId: 'zh-TW-HsiaoChenNeural',
    matchedBy: 'dialect:台湾',
    match: (raw) => raw.includes('台湾') || matchesKeyword(raw, 'taiwan') || matchesKeyword(raw, 'taiwanese'),
  },
  {
    voiceId: 'zh-CN-liaoning-XiaobeiNeural',
    matchedBy: 'dialect:东北',
    match: (raw) => raw.includes('东北') || matchesKeyword(raw, 'dongbei') || matchesKeyword(raw, 'northeast'),
  },
  {
    voiceId: 'zh-CN-shaanxi-XiaoniNeural',
    matchedBy: 'dialect:陕西',
    match: (raw) => raw.includes('陕西') || matchesKeyword(raw, 'shaanxi'),
  },
  {
    voiceId: 'en-US-AvaMultilingualNeural',
    matchedBy: 'language:英语女',
    match: (raw) =>
      raw.includes('英语女')
      || raw.includes('英文女')
      || /英[语文].*女|女.*英[语文]/.test(raw)
      || (matchesKeyword(raw, 'english') && matchesKeyword(raw, 'female')),
  },
  {
    voiceId: 'en-US-BrianMultilingualNeural',
    matchedBy: 'language:英语男',
    match: (raw) =>
      raw.includes('英语男')
      || raw.includes('英文男')
      || /英[语文].*男|男.*英[语文]/.test(raw)
      || (matchesKeyword(raw, 'english') && matchesKeyword(raw, 'male')),
  },
  {
    voiceId: 'en-US-AvaMultilingualNeural',
    matchedBy: 'language:英语',
    match: (raw) => raw.includes('英语') || raw.includes('英文') || matchesKeyword(raw, 'english'),
  },
  {
    voiceId: 'ja-JP-KeitaNeural',
    matchedBy: 'language:日语男',
    match: (raw) =>
      raw.includes('日语男')
      || raw.includes('日文男')
      || /日[语文].*男|男.*日[语文]/.test(raw)
      || (matchesKeyword(raw, 'japanese') && matchesKeyword(raw, 'male')),
  },
  {
    voiceId: 'ja-JP-NanamiNeural',
    matchedBy: 'language:日语',
    match: (raw) => raw.includes('日语') || raw.includes('日文') || matchesKeyword(raw, 'japanese'),
  },
  {
    voiceId: 'ko-KR-InJoonNeural',
    matchedBy: 'language:韩语男',
    match: (raw) =>
      raw.includes('韩语男')
      || raw.includes('韩文男')
      || /韩[语文].*男|男.*韩[语文]/.test(raw)
      || (matchesKeyword(raw, 'korean') && matchesKeyword(raw, 'male')),
  },
  {
    voiceId: 'ko-KR-SunHiNeural',
    matchedBy: 'language:韩语',
    match: (raw) => raw.includes('韩语') || raw.includes('韩文') || matchesKeyword(raw, 'korean'),
  },
])

/**
 * 解析用户的音色/人设“心愿”表达：
 * 优先级：(a) 自定义音色别名 -> (b) 精确内置人设 -> (c) 合法 Edge 音色 ID -> (d) 模糊中英文风格/人设词 -> (e) 方言/语种回退。
 * 无法识别的无效字符串返回 `undefined`。
 */
export function resolveVoiceWish(
  query: string,
  customVoices?: readonly CustomVoiceAlias[],
): ResolvedVoiceWish | undefined {
  if (typeof query !== 'string') return undefined
  const trimmed = query.trim()
  if (trimmed === '') return undefined

  // (a) 精确匹配自定义音色别名
  if (Array.isArray(customVoices) && customVoices.length > 0) {
    const custom = resolveCustomVoice(customVoices, trimmed)
    if (custom !== undefined) {
      return {
        kind: 'custom',
        id: custom.name,
        custom,
        ...(custom.voice !== undefined ? { voice: custom.voice } : {}),
        matchedBy: 'custom',
      }
    }
  }

  // (b) 精确匹配内置角色人设 ID 或中文标签
  const exactPersona = resolvePersona(trimmed)
  if (exactPersona !== undefined) {
    return {
      kind: 'persona',
      id: exactPersona.id,
      persona: exactPersona,
      voice: exactPersona.voice,
      matchedBy: 'persona',
    }
  }

  // (c) 精确匹配合法 Edge 音色 ID（含对内置列表的大小写兼容）
  if (isValidVoiceId(trimmed)) {
    return {
      kind: 'voice',
      id: trimmed,
      voice: trimmed,
      matchedBy: 'voice',
    }
  }
  const lower = trimmed.toLowerCase()
  const caseMatchedVoice = VOICES.find((v) => v.id.toLowerCase() === lower)
  if (caseMatchedVoice !== undefined) {
    return {
      kind: 'voice',
      id: caseMatchedVoice.id,
      voice: caseMatchedVoice.id,
      matchedBy: 'voice',
    }
  }

  // (d) 模糊中英文风格与人设关键词
  for (const rule of FUZZY_PERSONA_RULES) {
    const matchedKeyword = rule.keywords.find((kw) => matchesKeyword(lower, kw))
    if (matchedKeyword !== undefined) {
      const persona = resolvePersona(rule.personaId)
      if (persona !== undefined) {
        return {
          kind: 'persona',
          id: persona.id,
          persona,
          voice: persona.voice,
          matchedBy: `keyword:${matchedKeyword}`,
        }
      }
    }
  }

  // (e) 方言与外语关键词回退
  for (const rule of FUZZY_DIALECT_VOICE_RULES) {
    if (rule.match(lower)) {
      return {
        kind: 'voice',
        id: rule.voiceId,
        voice: rule.voiceId,
        matchedBy: rule.matchedBy,
      }
    }
  }

  return undefined
}

/**
 * 保守、词边界安全的默认技术术语发音词典（用于自动修正科技/开发播客与口播的常见误读）。
 * 全部词条均为纯 ASCII 标识符，在 `buildPronunciationPattern` 下自动包裹词边界，绝不误伤普通英文单词内部子串。
 */
export const DEFAULT_TECH_PRONUNCIATIONS: readonly PronunciationRule[] = Object.freeze([
  Object.freeze({ word: 'Nginx', alias: 'Engine X' }),
  Object.freeze({ word: 'SQL', alias: 'S Q L' }),
  Object.freeze({ word: 'K8s', alias: 'K 8 s' }),
  Object.freeze({ word: 'Kubernetes', alias: 'K 8 s' }),
  Object.freeze({ word: 'CLI', alias: 'C L I' }),
  Object.freeze({ word: 'GUI', alias: 'G U I' }),
  Object.freeze({ word: 'OAuth', alias: 'O Auth' }),
  Object.freeze({ word: 'PostgreSQL', alias: 'Postgres' }),
  Object.freeze({ word: 'kubectl', alias: 'cube control' }),
  Object.freeze({ word: 'GraphQL', alias: 'Graph Q L' }),
  Object.freeze({ word: 'WebSocket', alias: 'Web Socket' }),
])

/**
 * 合并多组发音词典，后传入的规则按 `word`（去空白精确匹配）覆盖先前的同名规则。
 */
export function mergePronunciations(
  ...ruleSets: Array<readonly PronunciationRule[] | undefined>
): PronunciationRule[] {
  const byWord = new Map<string, PronunciationRule>()
  for (const list of ruleSets) {
    if (!Array.isArray(list)) continue
    for (const rule of list) {
      if (!rule || typeof rule.word !== 'string' || typeof rule.alias !== 'string') continue
      const word = rule.word.trim()
      const alias = rule.alias.trim()
      if (word === '' || alias === '') continue
      byWord.set(word, { word, alias })
    }
  }
  return Array.from(byWord.values())
}

/** 交互式 HTML5 音频播放器页面渲染选项。 */
export interface InteractivePlayerOptions {
  title: string
  audioFileName: string
  voice?: string
  durationSec?: number
  cues?: readonly SubtitleCue[]
  chapters?: readonly AudioChapter[]
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/\u2028/g, '&#x2028;')
    .replace(/\u2029/g, '&#x2029;')
}

function escapeJsonForScript(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\//g, '\\/')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029')
}

function toSafeRelativeAudioHref(audioFileName: string): string {
  const normalized = audioFileName.trim().replace(/\\/g, '/')
  if (normalized === '') return './audio.mp3'

  const segments = normalized.split('/').filter((seg) => seg !== '')
  if (segments.length === 0) return './audio.mp3'

  const encodedSegments = segments.map((seg) => {
    if (seg === '.' || seg === '..') return seg
    return encodeURIComponent(seg)
  })

  if (encodedSegments[0] === '.' || encodedSegments[0] === '..') {
    return encodedSegments.join('/')
  }
  return './' + encodedSegments.join('/')
}

function toDownloadFileName(audioFileName: string): string {
  const normalized = audioFileName.trim().replace(/\\/g, '/')
  const parts = normalized.split('/').filter((seg) => seg !== '' && seg !== '.' && seg !== '..')
  const base = parts.length > 0 ? parts[parts.length - 1] : 'audio.mp3'
  return base.replace(/[\r\n]/g, '') || 'audio.mp3'
}

function formatClockMs(ms: number, forceHours: boolean): string {
  const safeMs = Number.isFinite(ms) ? Math.max(0, Math.round(ms)) : 0
  const totalSec = Math.floor(safeMs / 1000)
  const hours = Math.floor(totalSec / 3600)
  const minutes = Math.floor((totalSec % 3600) / 60)
  const seconds = totalSec % 60
  if (forceHours || hours > 0) {
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  }
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

function formatDurationBadge(durationSec: number | undefined): string {
  if (typeof durationSec !== 'number' || !Number.isFinite(durationSec) || durationSec <= 0) {
    return ''
  }
  const ms = Math.round(durationSec * 1000)
  return formatClockMs(ms, ms >= 3600_000)
}

/**
 * 生成零依赖、自包含、支持明暗主题、倍速播放、下载、章节跳转与跟读同步字幕高亮的 HTML5 交互播放器页面。
 * 严格对所有 HTML 文本/属性与内联 `<script>` JSON 执行 XSS 防护转义。
 */
export function renderInteractivePlayerHtml(opts: InteractivePlayerOptions): string {
  const rawTitle = typeof opts.title === 'string' && opts.title.trim() !== '' ? opts.title.trim() : '语音播放器'
  const rawAudioFileName = typeof opts.audioFileName === 'string' ? opts.audioFileName : 'audio.mp3'
  const rawVoice = typeof opts.voice === 'string' && opts.voice.trim() !== '' ? opts.voice.trim() : undefined
  const durationBadge = formatDurationBadge(opts.durationSec)

  const safeTitle = escapeHtml(rawTitle)
  const safeHref = escapeHtml(toSafeRelativeAudioHref(rawAudioFileName))
  const safeDownload = escapeHtml(toDownloadFileName(rawAudioFileName))

  const sanitizedChapters = Array.isArray(opts.chapters)
    ? opts.chapters
        .filter((ch): ch is AudioChapter => Boolean(ch) && typeof ch.title === 'string' && ch.title.trim() !== '')
        .map((ch) => {
          const startMs = Number.isFinite(ch.startMs) ? Math.max(0, Math.round(ch.startMs)) : 0
          const endMs = Number.isFinite(ch.endMs) ? Math.max(startMs, Math.round(ch.endMs)) : startMs
          return { title: ch.title.trim(), startMs, endMs }
        })
    : []

  const sanitizedCues = Array.isArray(opts.cues)
    ? opts.cues
        .filter((cue): cue is SubtitleCue => Boolean(cue) && typeof cue.text === 'string' && cue.text.trim() !== '')
        .map((cue, idx) => {
          const startMs = Number.isFinite(cue.startMs) ? Math.max(0, Math.round(cue.startMs)) : 0
          const endMs = Number.isFinite(cue.endMs) ? Math.max(startMs, Math.round(cue.endMs)) : startMs
          return { index: idx + 1, startMs, endMs, text: cue.text.trim() }
        })
    : []

  const maxMs = Math.max(
    typeof opts.durationSec === 'number' && Number.isFinite(opts.durationSec) ? Math.round(opts.durationSec * 1000) : 0,
    ...sanitizedChapters.map((c) => c.endMs),
    ...sanitizedCues.map((c) => c.endMs),
  )
  const useHours = maxMs >= 3600_000

  const metaBadges: string[] = []
  if (rawVoice !== undefined) {
    metaBadges.push(`<span class="badge">${escapeHtml(rawVoice)}</span>`)
  }
  if (durationBadge !== '') {
    metaBadges.push(`<span class="badge badge-mono">${escapeHtml(durationBadge)}</span>`)
  }
  const metaHtml = metaBadges.length > 0
    ? `        <div class="meta-row">${metaBadges.join('')}</div>`
    : ''

  const chaptersSectionHtml = sanitizedChapters.length > 0
    ? [
        '    <section class="panel" aria-label="章节导航">',
        '      <div class="section-head">',
        '        <h2>章节导航</h2>',
        `        <span class="count">${sanitizedChapters.length} 节</span>`,
        '      </div>',
        '      <div class="chapter-list" id="chapter-list">',
        ...sanitizedChapters.map(
          (ch, idx) =>
            `        <button type="button" class="chapter-chip" data-chapter-index="${idx}" data-start-ms="${ch.startMs}" data-end-ms="${ch.endMs}">`
            + `<span class="chip-time">${escapeHtml(formatClockMs(ch.startMs, useHours))}</span>`
            + `<span class="chip-title">${escapeHtml(ch.title)}</span>`
            + '</button>',
        ),
        '      </div>',
        '    </section>',
      ].join('\n')
    : ''

  const cuesSectionHtml = sanitizedCues.length > 0
    ? [
        '    <section class="panel" aria-label="同步字幕">',
        '      <div class="section-head">',
        '        <h2>同步字幕</h2>',
        `        <span class="count">${sanitizedCues.length} 条</span>`,
        '      </div>',
        '      <div class="cue-list" id="cue-list">',
        ...sanitizedCues.map(
          (cue, idx) =>
            `        <button type="button" class="cue-item" data-cue-index="${idx}" data-start-ms="${cue.startMs}" data-end-ms="${cue.endMs}">`
            + `<span class="cue-time">${escapeHtml(formatClockMs(cue.startMs, useHours))}</span>`
            + `<span class="cue-text">${escapeHtml(cue.text)}</span>`
            + '</button>',
        ),
        '      </div>',
        '    </section>',
      ].join('\n')
    : ''

  const embeddedDataJson = escapeJsonForScript({
    title: rawTitle,
    audioFileName: rawAudioFileName,
    voice: rawVoice ?? null,
    durationSec: typeof opts.durationSec === 'number' && Number.isFinite(opts.durationSec) ? opts.durationSec : null,
    chapters: sanitizedChapters,
    cues: sanitizedCues,
  })

  return [
    '<!DOCTYPE html>',
    '<html lang="zh-CN">',
    '<head>',
    '  <meta charset="UTF-8">',
    '  <meta name="viewport" content="width=device-width, initial-scale=1.0">',
    `  <title>${safeTitle} — dsh-voice 交互播放器</title>`,
    '  <style>',
    '    :root {',
    '      color-scheme: light dark;',
    '      --bg: #f5f6f8;',
    '      --card: #ffffff;',
    '      --fg: #181a1f;',
    '      --muted: #5f6672;',
    '      --border: #e2e5ea;',
    '      --accent: #2563eb;',
    '      --accent-soft: rgba(37, 99, 235, 0.11);',
    '      --hover: #f1f4f9;',
    '    }',
    '    @media (prefers-color-scheme: dark) {',
    '      :root {',
    '        --bg: #0f1117;',
    '        --card: #171a23;',
    '        --fg: #eef1f6;',
    '        --muted: #9aa3b2;',
    '        --border: #2a3040;',
    '        --accent: #60a5fa;',
    '        --accent-soft: rgba(96, 165, 250, 0.16);',
    '        --hover: #202534;',
    '      }',
    '    }',
    '    * { box-sizing: border-box; }',
    '    body { margin: 0; padding: 24px 16px 40px; font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: var(--bg); color: var(--fg); line-height: 1.55; }',
    '    .wrap { max-width: 820px; margin: 0 auto; display: flex; flex-direction: column; gap: 16px; }',
    '    .panel { background: var(--card); border: 1px solid var(--border); border-radius: 14px; padding: 18px 20px; }',
    '    .hero-head { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: flex-start; gap: 12px; margin-bottom: 14px; }',
    '    h1 { margin: 0; font-size: 1.35rem; line-height: 1.35; word-break: break-word; }',
    '    h2 { margin: 0; font-size: 1rem; font-weight: 600; }',
    '    .meta-row { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px; }',
    '    .badge { display: inline-flex; align-items: center; padding: 2px 9px; border-radius: 999px; font-size: 0.8rem; background: var(--hover); color: var(--muted); border: 1px solid var(--border); }',
    '    .badge-mono { font-variant-numeric: tabular-nums; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }',
    '    .toolbar { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; }',
    '    .speed-label { display: inline-flex; align-items: center; gap: 6px; font-size: 0.88rem; color: var(--muted); }',
    '    select, .download-btn { padding: 6px 11px; border-radius: 8px; border: 1px solid var(--border); background: var(--card); color: var(--fg); font-size: 0.88rem; text-decoration: none; cursor: pointer; }',
    '    .download-btn:hover, select:hover { border-color: var(--accent); color: var(--accent); }',
    '    audio { width: 100%; margin-top: 4px; }',
    '    .section-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }',
    '    .count { font-size: 0.82rem; color: var(--muted); }',
    '    .chapter-list { display: flex; flex-wrap: wrap; gap: 8px; }',
    '    .chapter-chip { display: inline-flex; align-items: center; gap: 7px; padding: 7px 12px; border-radius: 999px; border: 1px solid var(--border); background: var(--card); color: var(--fg); font-size: 0.88rem; cursor: pointer; transition: border-color 0.15s, background 0.15s; }',
    '    .chapter-chip:hover { background: var(--hover); border-color: var(--accent); }',
    '    .chapter-chip.is-active { background: var(--accent-soft); border-color: var(--accent); color: var(--accent); font-weight: 600; }',
    '    .chip-time, .cue-time { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-variant-numeric: tabular-nums; font-size: 0.8rem; color: var(--muted); flex-shrink: 0; }',
    '    .chapter-chip.is-active .chip-time, .cue-item.is-active .cue-time { color: var(--accent); }',
    '    .cue-list { display: flex; flex-direction: column; gap: 6px; max-height: 460px; overflow-y: auto; padding-right: 4px; }',
    '    .cue-item { width: 100%; display: flex; align-items: flex-start; gap: 12px; text-align: left; padding: 9px 12px; border-radius: 10px; border: 1px solid transparent; border-left: 3px solid transparent; background: transparent; color: var(--fg); font-size: 0.94rem; line-height: 1.5; cursor: pointer; transition: background 0.15s, border-color 0.15s; }',
    '    .cue-item:hover { background: var(--hover); }',
    '    .cue-item.is-active { background: var(--accent-soft); border-color: var(--border); border-left-color: var(--accent); font-weight: 500; }',
    '    .cue-text { word-break: break-word; }',
    '  </style>',
    '</head>',
    '<body>',
    '  <main class="wrap">',
    '    <section class="panel">',
    '      <div class="hero-head">',
    '        <div>',
    `          <h1>${safeTitle}</h1>`,
    metaHtml,
    '        </div>',
    '        <div class="toolbar">',
    '          <label class="speed-label" for="speed-select">倍速',
    '            <select id="speed-select" aria-label="播放倍速">',
    '              <option value="0.8">0.8x</option>',
    '              <option value="1" selected>1.0x</option>',
    '              <option value="1.25">1.25x</option>',
    '              <option value="1.5">1.5x</option>',
    '            </select>',
    '          </label>',
    `          <a class="download-btn" href="${safeHref}" download="${safeDownload}">下载音频</a>`,
    '        </div>',
    '      </div>',
    `      <audio id="player" controls preload="metadata" src="${safeHref}"></audio>`,
    '    </section>',
    chaptersSectionHtml,
    cuesSectionHtml,
    '  </main>',
    '  <script>',
    `    const PLAYER_DATA = ${embeddedDataJson};`,
    '    const audio = document.getElementById("player");',
    '    const speedSelect = document.getElementById("speed-select");',
    '    const chapterButtons = Array.from(document.querySelectorAll(".chapter-chip"));',
    '    const cueButtons = Array.from(document.querySelectorAll(".cue-item"));',
    '    let lastActiveCueIndex = -1;',
    '',
    '    if (speedSelect && audio) {',
    '      speedSelect.addEventListener("change", () => {',
    '        const rate = Number(speedSelect.value);',
    '        audio.playbackRate = Number.isFinite(rate) && rate > 0 ? rate : 1;',
    '      });',
    '    }',
    '',
    '    function findActiveIndex(items, nowMs) {',
    '      for (let i = 0; i < items.length; i += 1) {',
    '        const item = items[i];',
    '        const isLast = i === items.length - 1;',
    '        const within = nowMs >= item.startMs && (nowMs < item.endMs || (item.endMs === item.startMs && Math.abs(nowMs - item.startMs) < 50) || (isLast && nowMs <= item.endMs + 250));',
    '        if (within) return i;',
    '      }',
    '      return -1;',
    '    }',
    '',
    '    function syncActive(nowMs, scrollCue) {',
    '      const activeChapter = findActiveIndex(PLAYER_DATA.chapters, nowMs);',
    '      for (let i = 0; i < chapterButtons.length; i += 1) {',
    '        const active = i === activeChapter;',
    '        chapterButtons[i].classList.toggle("is-active", active);',
    '        if (active) chapterButtons[i].setAttribute("aria-current", "true");',
    '        else chapterButtons[i].removeAttribute("aria-current");',
    '      }',
    '      const activeCue = findActiveIndex(PLAYER_DATA.cues, nowMs);',
    '      for (let i = 0; i < cueButtons.length; i += 1) {',
    '        const active = i === activeCue;',
    '        cueButtons[i].classList.toggle("is-active", active);',
    '        if (active) cueButtons[i].setAttribute("aria-current", "true");',
    '        else cueButtons[i].removeAttribute("aria-current");',
    '      }',
    '      if (scrollCue && activeCue !== -1 && activeCue !== lastActiveCueIndex && cueButtons[activeCue]) {',
    '        cueButtons[activeCue].scrollIntoView({ block: "nearest", behavior: "smooth" });',
    '      }',
    '      lastActiveCueIndex = activeCue;',
    '    }',
    '',
    '    function seekToMs(ms) {',
    '      if (!audio) return;',
    '      const sec = Math.max(0, Number(ms) / 1000);',
    '      if (!Number.isFinite(sec)) return;',
    '      if (audio.readyState >= 1) {',
    '        audio.currentTime = sec;',
    '      } else {',
    '        audio.addEventListener("loadedmetadata", () => { audio.currentTime = sec; }, { once: true });',
    '        try { audio.currentTime = sec; } catch {}',
    '      }',
    '      syncActive(ms, false);',
    '      const playPromise = audio.play();',
    '      if (playPromise && typeof playPromise.catch === "function") {',
    '        playPromise.catch(() => {});',
    '      }',
    '    }',
    '',
    '    for (const btn of chapterButtons) {',
    '      btn.addEventListener("click", () => {',
    '        seekToMs(Number(btn.getAttribute("data-start-ms") || "0"));',
    '      });',
    '    }',
    '',
    '    for (const btn of cueButtons) {',
    '      btn.addEventListener("click", () => {',
    '        seekToMs(Number(btn.getAttribute("data-start-ms") || "0"));',
    '      });',
    '    }',
    '',
    '    if (audio) {',
    '      audio.addEventListener("timeupdate", () => syncActive(audio.currentTime * 1000, true));',
    '      audio.addEventListener("seeked", () => syncActive(audio.currentTime * 1000, false));',
    '    }',
    '  </script>',
    '</body>',
    '</html>',
  ].filter((line) => line !== '').join('\n') + '\n'
}
