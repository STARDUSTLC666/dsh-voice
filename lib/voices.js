/**
 * 常用音色清单（edge-tts 全量约 500 个，这里收录常用中/英/日/韩/法/德/俄/西与旗舰多语/方言音色）。
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
    { id: 'zh-CN-liaoning-XiaobeiNeural', gender: 'Female', locale: '东北话（晓北）', tags: ['dialect'] },
    { id: 'zh-CN-shaanxi-XiaoniNeural', gender: 'Female', locale: '陕西话（晓妮）', tags: ['dialect'] },
    { id: 'zh-CN-sichuan-YunxiNeural', gender: 'Male', locale: '四川话（云希）', tags: ['dialect'] },
    { id: 'zh-TW-HsiaoChenNeural', gender: 'Female', locale: '台湾腔（晓臻）', tags: ['dialect', 'warm'] },
    { id: 'zh-HK-HiuMaanNeural', gender: 'Female', locale: '粤语（曉曼）', tags: ['dialect'] },
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
const EDGE_VOICE_ID_PATTERN = /^[a-z]{2,3}(?:-[A-Za-z]{2,12}){1,2}-[A-Z][A-Za-z0-9]+(?:-[A-Za-z0-9]+)?(?::[A-Za-z0-9]+)?Neural$/;
/** 校验音色 id：常用清单内或符合 edge-tts 命名规则（含方言/文字子标签/多语/HD 变体）。 */
export function isValidVoiceId(id) {
    if (VOICES.some((voice) => voice.id === id))
        return true;
    return EDGE_VOICE_ID_PATTERN.test(id);
}
/** 按地区/语言、性别或标签筛选内置常用音色。 */
export function filterVoices(filter) {
    const locale = filter?.locale?.trim().toLowerCase() ?? '';
    const gender = filter?.gender?.trim().toLowerCase() ?? '';
    const tag = filter?.tag?.trim().toLowerCase() ?? '';
    if (locale === '' && gender === '' && tag === '')
        return VOICES;
    return VOICES.filter((voice) => {
        if (locale !== '' && !voice.id.toLowerCase().includes(locale) && !voice.locale.toLowerCase().includes(locale)) {
            return false;
        }
        if (gender !== '' && voice.gender.toLowerCase() !== gender) {
            return false;
        }
        if (tag !== '' && !(voice.tags?.some((item) => item.toLowerCase() === tag) ?? false)) {
            return false;
        }
        return true;
    });
}
