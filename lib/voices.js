/**
 * 常用音色清单（内置 45 个全年龄段/多风格/方言常用音色与 10 个开箱即用角色人设配方）。
 *
 * @module dsh-voice/voices
 */
/** 常用音色。 */
export const VOICES = [
    { id: 'zh-CN-XiaoxiaoNeural', gender: 'Female', locale: '普通话（晓晓，温柔女声）', tags: ['warm', 'podcast'] },
    { id: 'zh-CN-XiaoyiNeural', gender: 'Female', locale: '普通话（晓伊，活泼女声）', tags: ['lively', 'assistant'] },
    { id: 'zh-CN-YunxiNeural', gender: 'Male', locale: '普通话（云希，青年男声）', tags: ['youth', 'audiobook'] },
    { id: 'zh-CN-YunyangNeural', gender: 'Male', locale: '普通话（云扬，新闻男声）', tags: ['news'] },
    { id: 'zh-CN-YunjianNeural', gender: 'Male', locale: '普通话（云健，浑厚男声）', tags: ['audiobook', 'sports'] },
    { id: 'zh-CN-XiaoxiaoMultilingualNeural', gender: 'Female', locale: '普通话（晓晓多语，自然中英混读）', tags: ['multilingual', 'podcast', 'warm'] },
    { id: 'zh-CN-YunyiMultilingualNeural', gender: 'Male', locale: '普通话（云逸多语，自然中英混读）', tags: ['multilingual', 'podcast'] },
    { id: 'zh-CN-YunfanMultilingualNeural', gender: 'Male', locale: '普通话（云帆多语，播客男声）', tags: ['multilingual', 'podcast'] },
    { id: 'zh-CN-XiaoshuangNeural', gender: 'Female', locale: '普通话（晓双，灵动女童/绘本）', tags: ['child', 'cute', 'story'] },
    { id: 'zh-CN-XiaoyouNeural', gender: 'Female', locale: '普通话（晓悠，童真幼童）', tags: ['child', 'cute', 'story'] },
    { id: 'zh-CN-YunxiaNeural', gender: 'Male', locale: '普通话（云夏，热血少年/动漫旁白）', tags: ['teen', 'anime', 'story'] },
    { id: 'zh-CN-YunzeNeural', gender: 'Male', locale: '普通话（云泽，沉稳大叔/纪录片）', tags: ['mature', 'documentary', 'audiobook'] },
    { id: 'zh-CN-XiaoqiuNeural', gender: 'Female', locale: '普通话（晓秋，知性成熟女声）', tags: ['mature', 'audiobook', 'warm'] },
    { id: 'zh-CN-XiaoruiNeural', gender: 'Female', locale: '普通话（晓睿，慈祥老年女声）', tags: ['elder', 'story'] },
    { id: 'zh-CN-YunhaoNeural', gender: 'Male', locale: '普通话（云皓，激昂广告/赛事解说）', tags: ['passion', 'sports', 'commercial'] },
    { id: 'zh-CN-YunfengNeural', gender: 'Male', locale: '普通话（云枫，磁性质感男声）', tags: ['audiobook', 'drama'] },
    { id: 'zh-CN-XiaohanNeural', gender: 'Female', locale: '普通话（晓涵，温婉情感女声）', tags: ['warm', 'drama'] },
    { id: 'zh-CN-XiaomoNeural', gender: 'Female', locale: '普通话（晓墨，故事演绎女声）', tags: ['audiobook', 'drama'] },
    { id: 'zh-CN-XiaoxuanNeural', gender: 'Female', locale: '普通话（晓萱，清冷御姐女声）', tags: ['cool', 'drama'] },
    { id: 'zh-CN-liaoning-XiaobeiNeural', gender: 'Female', locale: '东北话（晓北）', tags: ['dialect'] },
    { id: 'zh-CN-shaanxi-XiaoniNeural', gender: 'Female', locale: '陕西话（晓妮）', tags: ['dialect'] },
    { id: 'zh-CN-sichuan-YunxiNeural', gender: 'Male', locale: '四川话（云希）', tags: ['dialect'] },
    { id: 'zh-CN-henan-YundengNeural', gender: 'Male', locale: '河南话（云登，幽默男声）', tags: ['dialect', 'humorous'] },
    { id: 'zh-CN-shandong-YunxiangNeural', gender: 'Male', locale: '山东话（云翔，豪爽男声）', tags: ['dialect'] },
    { id: 'zh-TW-HsiaoChenNeural', gender: 'Female', locale: '台湾腔（晓臻）', tags: ['dialect', 'warm'] },
    { id: 'zh-TW-HsiaoYuNeural', gender: 'Female', locale: '台湾腔（晓雨，女声）', tags: ['dialect', 'warm'] },
    { id: 'zh-TW-YunJheNeural', gender: 'Male', locale: '台湾腔（允哲，男声）', tags: ['dialect', 'podcast'] },
    { id: 'zh-HK-HiuMaanNeural', gender: 'Female', locale: '粤语（曉曼）', tags: ['dialect'] },
    { id: 'zh-HK-WanLungNeural', gender: 'Male', locale: '粤语（雲龍，男声）', tags: ['dialect', 'podcast'] },
    { id: 'en-US-AriaNeural', gender: 'Female', locale: '美式英语（Aria，女声）', tags: ['podcast', 'news'] },
    { id: 'en-US-JennyNeural', gender: 'Female', locale: '美式英语（Jenny，女声）', tags: ['warm', 'assistant'] },
    { id: 'en-US-GuyNeural', gender: 'Male', locale: '美式英语（Guy，男声）', tags: ['news'] },
    { id: 'en-US-DavisNeural', gender: 'Male', locale: '美式英语（Davis，男声）', tags: ['podcast', 'warm'] },
    { id: 'en-US-AndrewMultilingualNeural', gender: 'Male', locale: '美式英语（Andrew 多语，温暖播客）', tags: ['multilingual', 'podcast', 'warm'] },
    { id: 'en-US-AvaMultilingualNeural', gender: 'Female', locale: '美式英语（Ava 多语，自然清晰）', tags: ['multilingual', 'podcast'] },
    { id: 'en-US-EmmaMultilingualNeural', gender: 'Female', locale: '美式英语（Emma 多语，亲和解说）', tags: ['multilingual', 'warm'] },
    { id: 'en-GB-SoniaNeural', gender: 'Female', locale: '英式英语（Sonia）', tags: ['news'] },
    { id: 'en-GB-RyanNeural', gender: 'Male', locale: '英式英语（Ryan）', tags: ['podcast'] },
    { id: 'ja-JP-NanamiNeural', gender: 'Female', locale: '日语（Nanami，女声）', tags: ['assistant'] },
    { id: 'ja-JP-KeitaNeural', gender: 'Male', locale: '日语（Keita，男声）', tags: ['podcast'] },
    { id: 'ko-KR-SunHiNeural', gender: 'Female', locale: '韩语（SunHi）', tags: ['assistant'] },
    { id: 'fr-FR-DeniseNeural', gender: 'Female', locale: '法语（Denise）', tags: ['podcast'] },
    { id: 'de-DE-KatjaNeural', gender: 'Female', locale: '德语（Katja）', tags: ['assistant'] },
    { id: 'ru-RU-SvetlanaNeural', gender: 'Female', locale: '俄语（Svetlana）', tags: ['assistant'] },
    { id: 'es-ES-ElviraNeural', gender: 'Female', locale: '西班牙语（Elvira）', tags: ['assistant'] },
];
/** 开箱即用角色人设配方（可直接传给 voice_tts / voice_preview 的 persona 参数）。 */
export const VOICE_PERSONAS = [
    {
        id: 'late-night-radio',
        label: '深夜电台',
        voice: 'zh-CN-YunfengNeural',
        rate: '-10%',
        pitch: '-3Hz',
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
        voice: 'zh-CN-YunyiMultilingualNeural',
        rate: '+4%',
        pitch: '+0Hz',
        pauseMs: 280,
        description: '松弛自然、支持中英混读的男声播客主持',
        tags: ['podcast', 'multilingual', 'host'],
    },
    {
        id: 'documentary-narrator',
        label: '纪录片旁白',
        voice: 'zh-CN-YunzeNeural',
        rate: '-8%',
        pitch: '-2Hz',
        pauseMs: 450,
        description: '沉稳厚重、富有画面感与纵深感的纪录片大叔旁白',
        tags: ['documentary', 'mature', 'audiobook'],
    },
    {
        id: 'bedtime-story',
        label: '睡前故事',
        voice: 'zh-CN-XiaoshuangNeural',
        rate: '-10%',
        pitch: '+2Hz',
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
        voice: 'zh-CN-YunhaoNeural',
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
        voice: 'zh-CN-XiaoxiaoMultilingualNeural',
        rate: '+6%',
        pitch: '+0Hz',
        pauseMs: 260,
        description: '流畅中英混读、清晰知性的技术分享与教程女声',
        tags: ['multilingual', 'tech', 'podcast'],
    },
    {
        id: 'bilingual-tech-male',
        label: '双语科技男声',
        voice: 'en-US-AndrewMultilingualNeural',
        rate: '+5%',
        pitch: '+0Hz',
        pauseMs: 260,
        description: '自然双语切换、适合硬核科技播客与开发解读的男声',
        tags: ['multilingual', 'tech', 'podcast'],
    },
];
const EDGE_VOICE_ID_PATTERN = /^[a-z]{2,3}(?:-[A-Za-z]{2,12}){1,2}-[A-Z][A-Za-z0-9]+(?:-[A-Za-z0-9]+)?(?::[A-Za-z0-9]+)?Neural$/;
/** 校验音色 id：常用清单内或符合 edge-tts 命名规则（含方言/文字子标签/多语/HD 变体）。 */
export function isValidVoiceId(id) {
    if (VOICES.some((voice) => voice.id === id))
        return true;
    return EDGE_VOICE_ID_PATTERN.test(id);
}
/** 按人设 ID 或中文名称匹配内置角色人设配方（大小写不敏感）。 */
export function resolvePersona(idOrLabel) {
    const needle = idOrLabel.trim().toLowerCase();
    if (needle === '')
        return undefined;
    return VOICE_PERSONAS.find((persona) => persona.id.toLowerCase() === needle || persona.label.toLowerCase() === needle);
}
/** 按地区/语言、性别或标签筛选音色列表（默认筛选内置常用音色）。 */
export function filterVoices(filter, sourceVoices = VOICES) {
    const locale = filter?.locale?.trim().toLowerCase() ?? '';
    const gender = filter?.gender?.trim().toLowerCase() ?? '';
    const tag = filter?.tag?.trim().toLowerCase() ?? '';
    if (locale === '' && gender === '' && tag === '')
        return sourceVoices;
    return sourceVoices.filter((voice) => {
        if (locale !== '' && !voice.id.toLowerCase().includes(locale) && !voice.locale.toLowerCase().includes(locale)) {
            return false;
        }
        if (gender !== '' && voice.gender.toLowerCase() !== gender) {
            return false;
        }
        if (tag !== '' && !(voice.tags?.some((item) => item.toLowerCase().includes(tag)) ?? false)) {
            return false;
        }
        return true;
    });
}
