/**
 * 常用音色清单（内置 51 个经实时 Edge ReadAloud 验证可用的全年龄段/多风格/方言音色与 10 个开箱即用角色人设配方）。
 *
 * @module dsh-voice/voices
 */

/** 音色信息。 */
export interface VoiceInfo {
  id: string
  gender: 'Female' | 'Male'
  locale: string
  tags?: string[]
}

/** 角色人设配方（绑定音色、语速、音调与默认段间停顿）。 */
export interface VoicePersona {
  id: string
  label: string
  voice: string
  rate: string
  pitch: string
  pauseMs: number
  description: string
  tags: string[]
}

/** 常用音色（全部经 Edge 线上目录实时核验可用）。 */
export const VOICES: VoiceInfo[] = [
  { id: 'zh-CN-XiaoxiaoNeural', gender: 'Female', locale: '普通话（晓晓，温柔女声）', tags: ['warm', 'podcast', 'mature'] },
  { id: 'zh-CN-XiaoyiNeural', gender: 'Female', locale: '普通话（晓伊，活泼少女/绘本女声）', tags: ['lively', 'assistant', 'child', 'story'] },
  { id: 'zh-CN-YunxiNeural', gender: 'Male', locale: '普通话（云希，青年播客男声）', tags: ['youth', 'audiobook', 'podcast'] },
  { id: 'zh-CN-YunyangNeural', gender: 'Male', locale: '普通话（云扬，专业新闻/电台男声）', tags: ['news', 'professional', 'mature'] },
  { id: 'zh-CN-YunjianNeural', gender: 'Male', locale: '普通话（云健，浑厚纪录片/解说男声）', tags: ['audiobook', 'documentary', 'mature', 'sports', 'passion'] },
  { id: 'zh-CN-YunxiaNeural', gender: 'Male', locale: '普通话（云夏，灵动少年/童声动漫）', tags: ['child', 'teen', 'anime', 'cartoon', 'story'] },
  { id: 'zh-CN-liaoning-XiaobeiNeural', gender: 'Female', locale: '东北话（晓北，幽默风趣）', tags: ['dialect', 'humorous'] },
  { id: 'zh-CN-shaanxi-XiaoniNeural', gender: 'Female', locale: '陕西话（晓妮，质朴亲切）', tags: ['dialect'] },
  { id: 'zh-TW-HsiaoChenNeural', gender: 'Female', locale: '台湾腔（晓臻，温柔女声）', tags: ['dialect', 'warm'] },
  { id: 'zh-TW-HsiaoYuNeural', gender: 'Female', locale: '台湾腔（晓雨，知性女声）', tags: ['dialect', 'warm', 'audiobook'] },
  { id: 'zh-TW-YunJheNeural', gender: 'Male', locale: '台湾腔（允哲，温和男声）', tags: ['dialect', 'podcast'] },
  { id: 'zh-HK-HiuMaanNeural', gender: 'Female', locale: '粤语（曉曼，自然女声）', tags: ['dialect'] },
  { id: 'zh-HK-HiuGaaiNeural', gender: 'Female', locale: '粤语（曉佳，清亮女声）', tags: ['dialect', 'assistant'] },
  { id: 'zh-HK-WanLungNeural', gender: 'Male', locale: '粤语（雲龍，沉稳男声）', tags: ['dialect', 'podcast'] },
  { id: 'en-US-AvaMultilingualNeural', gender: 'Female', locale: '多语种（Ava，自然中英混读女声）', tags: ['multilingual', 'podcast', 'warm'] },
  { id: 'en-US-AndrewMultilingualNeural', gender: 'Male', locale: '多语种（Andrew，温暖中英播客男声）', tags: ['multilingual', 'podcast', 'warm'] },
  { id: 'en-US-EmmaMultilingualNeural', gender: 'Female', locale: '多语种（Emma，亲和双语解说女声）', tags: ['multilingual', 'warm', 'story'] },
  { id: 'en-US-BrianMultilingualNeural', gender: 'Male', locale: '多语种（Brian，沉稳双语播客男声）', tags: ['multilingual', 'podcast', 'documentary'] },
  { id: 'en-US-AriaNeural', gender: 'Female', locale: '美式英语（Aria，女声）', tags: ['podcast', 'news'] },
  { id: 'en-US-JennyNeural', gender: 'Female', locale: '美式英语（Jenny，亲和助手）', tags: ['warm', 'assistant'] },
  { id: 'en-US-GuyNeural', gender: 'Male', locale: '美式英语（Guy，新闻男声）', tags: ['news'] },
  { id: 'en-US-ChristopherNeural', gender: 'Male', locale: '美式英语（Christopher，沉稳男声）', tags: ['podcast', 'documentary', 'mature'] },
  { id: 'en-US-AnaNeural', gender: 'Female', locale: '美式英语（Ana，活泼童声）', tags: ['child', 'cute', 'story'] },
  { id: 'en-US-RogerNeural', gender: 'Male', locale: '美式英语（Roger，沉稳长者男声）', tags: ['elder', 'mature', 'documentary'] },
  { id: 'en-US-MichelleNeural', gender: 'Female', locale: '美式英语（Michelle，清晰女声）', tags: ['warm', 'assistant'] },
  { id: 'en-US-SteffanNeural', gender: 'Male', locale: '美式英语（Steffan，成熟男声）', tags: ['mature', 'news'] },
  { id: 'en-US-EricNeural', gender: 'Male', locale: '美式英语（Eric，自然男声）', tags: ['podcast'] },
  { id: 'en-GB-SoniaNeural', gender: 'Female', locale: '英式英语（Sonia）', tags: ['news'] },
  { id: 'en-GB-RyanNeural', gender: 'Male', locale: '英式英语（Ryan）', tags: ['podcast'] },
  { id: 'en-GB-LibbyNeural', gender: 'Female', locale: '英式英语（Libby）', tags: ['assistant'] },
  { id: 'en-GB-MaisieNeural', gender: 'Female', locale: '英式英语（Maisie，英式童声）', tags: ['child', 'story'] },
  { id: 'en-GB-ThomasNeural', gender: 'Male', locale: '英式英语（Thomas）', tags: ['audiobook'] },
  { id: 'en-AU-NatashaNeural', gender: 'Female', locale: '澳式英语（Natasha）', tags: ['assistant'] },
  { id: 'en-AU-WilliamMultilingualNeural', gender: 'Male', locale: '多语种（William，澳式多语男声）', tags: ['multilingual', 'podcast'] },
  { id: 'ja-JP-NanamiNeural', gender: 'Female', locale: '日语（Nanami，女声）', tags: ['assistant'] },
  { id: 'ja-JP-KeitaNeural', gender: 'Male', locale: '日语（Keita，男声）', tags: ['podcast'] },
  { id: 'ko-KR-SunHiNeural', gender: 'Female', locale: '韩语（SunHi）', tags: ['assistant'] },
  { id: 'ko-KR-InJoonNeural', gender: 'Male', locale: '韩语（InJoon）', tags: ['podcast'] },
  { id: 'ko-KR-HyunsuMultilingualNeural', gender: 'Male', locale: '多语种（Hyunsu，韩语多语男声）', tags: ['multilingual', 'podcast'] },
  { id: 'fr-FR-DeniseNeural', gender: 'Female', locale: '法语（Denise）', tags: ['podcast'] },
  { id: 'fr-FR-HenriNeural', gender: 'Male', locale: '法语（Henri）', tags: ['audiobook'] },
  { id: 'fr-FR-VivienneMultilingualNeural', gender: 'Female', locale: '多语种（Vivienne，法语多语女声）', tags: ['multilingual', 'warm'] },
  { id: 'fr-FR-RemyMultilingualNeural', gender: 'Male', locale: '多语种（Remy，法语多语男声）', tags: ['multilingual', 'podcast'] },
  { id: 'de-DE-TanjaNeural', gender: 'Female', locale: '德语（Tanja）', tags: ['assistant'] },
  { id: 'de-DE-ChristophNeural', gender: 'Male', locale: '德语（Christoph）', tags: ['news'] },
  { id: 'es-ES-ElviraNeural', gender: 'Female', locale: '西班牙语（Elvira）', tags: ['assistant'] },
  { id: 'es-ES-AlvaroNeural', gender: 'Male', locale: '西班牙语（Alvaro）', tags: ['podcast'] },
  { id: 'ru-RU-SvetlanaNeural', gender: 'Female', locale: '俄语（Svetlana）', tags: ['assistant'] },
  { id: 'ru-RU-DmitryNeural', gender: 'Male', locale: '俄语（Dmitry）', tags: ['news'] },
  { id: 'it-IT-GiuseppeMultilingualNeural', gender: 'Male', locale: '多语种（Giuseppe，意语多语男声）', tags: ['multilingual', 'podcast'] },
  { id: 'pt-BR-ThalitaMultilingualNeural', gender: 'Female', locale: '多语种（Thalita，葡语多语女声）', tags: ['multilingual', 'warm'] },
]

/** 开箱即用角色人设配方（可直接传给 voice_tts / voice_preview 的 persona 参数，全部绑定真实 Edge 可用音色）。 */
export const VOICE_PERSONAS: VoicePersona[] = [
  {
    id: 'late-night-radio',
    label: '深夜电台',
    voice: 'zh-CN-YunyangNeural',
    rate: '-10%',
    pitch: '-4Hz',
    pauseMs: 420,
    description: '磁性低沉、舒缓放松的深夜情感电台声线',
    tags: ['radio', 'warm', 'night', 'audiobook'],
  },
  {
    id: 'podcast-host-female',
    label: '播客女主持',
    voice: 'zh-CN-XiaoxiaoNeural',
    rate: '+5%',
    pitch: '+0Hz',
    pauseMs: 280,
    description: '亲和自然、节奏明快的女声对谈播客主持',
    tags: ['podcast', 'warm', 'host'],
  },
  {
    id: 'podcast-host-male',
    label: '播客男主持',
    voice: 'zh-CN-YunxiNeural',
    rate: '+4%',
    pitch: '+0Hz',
    pauseMs: 280,
    description: '松弛自然、节奏流畅的男声播客主持',
    tags: ['podcast', 'youth', 'host'],
  },
  {
    id: 'documentary-narrator',
    label: '纪录片旁白',
    voice: 'zh-CN-YunjianNeural',
    rate: '-8%',
    pitch: '-3Hz',
    pauseMs: 450,
    description: '沉稳厚重、富有画面感与纵深感的纪录片旁白',
    tags: ['documentary', 'mature', 'audiobook'],
  },
  {
    id: 'bedtime-story',
    label: '睡前故事',
    voice: 'zh-CN-XiaoyiNeural',
    rate: '-10%',
    pitch: '+1Hz',
    pauseMs: 400,
    description: '灵动温柔、适合儿童绘本与睡前伴读的亲切声线',
    tags: ['child', 'story', 'warm'],
  },
  {
    id: 'anime-boy',
    label: '热血少年',
    voice: 'zh-CN-YunxiaNeural',
    rate: '+10%',
    pitch: '+4Hz',
    pauseMs: 220,
    description: '元气满满、充满少年感与戏剧张力的二次元/动漫声线',
    tags: ['teen', 'anime', 'story'],
  },
  {
    id: 'energetic-anchor',
    label: '激情解说',
    voice: 'zh-CN-YunjianNeural',
    rate: '+14%',
    pitch: '+3Hz',
    pauseMs: 180,
    description: '高亢激昂、感染力极强的广告宣传与赛事解说声线',
    tags: ['passion', 'sports', 'commercial'],
  },
  {
    id: 'news-briefing',
    label: '新闻简报',
    voice: 'zh-CN-YunyangNeural',
    rate: '+6%',
    pitch: '+0Hz',
    pauseMs: 260,
    description: '字正腔圆、专业干练的每日资讯与早报播报员',
    tags: ['news', 'professional'],
  },
  {
    id: 'bilingual-tech-female',
    label: '双语科技女声',
    voice: 'en-US-AvaMultilingualNeural',
    rate: '+5%',
    pitch: '+0Hz',
    pauseMs: 260,
    description: '流畅中英混读、清晰知性的技术分享与教程女声',
    tags: ['multilingual', 'tech', 'podcast'],
  },
  {
    id: 'bilingual-tech-male',
    label: '双语科技男声',
    voice: 'en-US-BrianMultilingualNeural',
    rate: '+5%',
    pitch: '+0Hz',
    pauseMs: 260,
    description: '自然双语切换、适合硬核科技播客与开发解读的男声',
    tags: ['multilingual', 'tech', 'podcast'],
  },
]

const EDGE_VOICE_ID_PATTERN = /^[a-z]{2,3}(?:-[A-Za-z]{2,12}){1,2}-[A-Z][A-Za-z0-9]+(?:-[A-Za-z0-9]+)?(?::[A-Za-z0-9]+)?Neural$/

/** 校验音色 id：常用清单内或符合 edge-tts 命名规则（含方言/文字子标签/多语/HD 变体）。 */
export function isValidVoiceId(id: string): boolean {
  if (VOICES.some((voice) => voice.id === id)) return true
  return EDGE_VOICE_ID_PATTERN.test(id)
}

/** 按人设 ID 或中文名称匹配内置角色人设配方（大小写不敏感）。 */
export function resolvePersona(idOrLabel: string): VoicePersona | undefined {
  const needle = idOrLabel.trim().toLowerCase()
  if (needle === '') return undefined
  return VOICE_PERSONAS.find(
    (persona) => persona.id.toLowerCase() === needle || persona.label.toLowerCase() === needle,
  )
}

/** 按地区/语言、性别或标签筛选音色列表（默认筛选内置常用音色）。 */
export function filterVoices(
  filter?: { locale?: string; gender?: string; tag?: string },
  sourceVoices: VoiceInfo[] = VOICES,
): VoiceInfo[] {
  const locale = filter?.locale?.trim().toLowerCase() ?? ''
  const gender = filter?.gender?.trim().toLowerCase() ?? ''
  const tag = filter?.tag?.trim().toLowerCase() ?? ''
  if (locale === '' && gender === '' && tag === '') return sourceVoices
  return sourceVoices.filter((voice) => {
    if (locale !== '' && !voice.id.toLowerCase().includes(locale) && !voice.locale.toLowerCase().includes(locale)) {
      return false
    }
    if (gender !== '' && voice.gender.toLowerCase() !== gender) {
      return false
    }
    if (tag !== '' && !(voice.tags?.some((item) => item.toLowerCase().includes(tag)) ?? false)) {
      return false
    }
    return true
  })
}
