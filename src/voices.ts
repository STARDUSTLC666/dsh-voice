/**
 * 常用音色清单（edge-tts 全量约 500 个，这里收录常用中/英/日/韩/法/德/俄/西音色）。
 *
 * @module dsh-voice/voices
 */

/** 音色信息。 */
export interface VoiceInfo {
  id: string
  gender: 'Female' | 'Male'
  locale: string
}

/** 常用音色。 */
export const VOICES: VoiceInfo[] = [
  { id: 'zh-CN-XiaoxiaoNeural', gender: 'Female', locale: '普通话（晓晓，温柔女声）' },
  { id: 'zh-CN-XiaoyiNeural', gender: 'Female', locale: '普通话（晓伊，活泼女声）' },
  { id: 'zh-CN-YunxiNeural', gender: 'Male', locale: '普通话（云希，青年男声）' },
  { id: 'zh-CN-YunyangNeural', gender: 'Male', locale: '普通话（云扬，新闻男声）' },
  { id: 'zh-CN-YunjianNeural', gender: 'Male', locale: '普通话（云健，浑厚男声）' },
  { id: 'zh-CN-liaoning-XiaobeiNeural', gender: 'Female', locale: '东北话（晓北）' },
  { id: 'zh-CN-shaanxi-XiaoniNeural', gender: 'Female', locale: '陕西话（晓妮）' },
  { id: 'zh-TW-HsiaoChenNeural', gender: 'Female', locale: '台湾腔（晓臻）' },
  { id: 'zh-HK-HiuMaanNeural', gender: 'Female', locale: '粤语（曉曼）' },
  { id: 'en-US-AriaNeural', gender: 'Female', locale: '美式英语（Aria，女声）' },
  { id: 'en-US-JennyNeural', gender: 'Female', locale: '美式英语（Jenny，女声）' },
  { id: 'en-US-GuyNeural', gender: 'Male', locale: '美式英语（Guy，男声）' },
  { id: 'en-US-DavisNeural', gender: 'Male', locale: '美式英语（Davis，男声）' },
  { id: 'en-GB-SoniaNeural', gender: 'Female', locale: '英式英语（Sonia）' },
  { id: 'en-GB-RyanNeural', gender: 'Male', locale: '英式英语（Ryan）' },
  { id: 'ja-JP-NanamiNeural', gender: 'Female', locale: '日语（Nanami，女声）' },
  { id: 'ja-JP-KeitaNeural', gender: 'Male', locale: '日语（Keita，男声）' },
  { id: 'ko-KR-SunHiNeural', gender: 'Female', locale: '韩语（SunHi）' },
  { id: 'fr-FR-DeniseNeural', gender: 'Female', locale: '法语（Denise）' },
  { id: 'de-DE-KatjaNeural', gender: 'Female', locale: '德语（Katja）' },
  { id: 'ru-RU-SvetlanaNeural', gender: 'Female', locale: '俄语（Svetlana）' },
  { id: 'es-ES-ElviraNeural', gender: 'Female', locale: '西班牙语（Elvira）' },
]

/** 校验音色 id：常用清单内或符合 edge-tts 命名规则。 */
export function isValidVoiceId(id: string): boolean {
  if (VOICES.some((voice) => voice.id === id)) return true
  return /^[a-z]{2,3}(-[A-Z]{2})?-[A-Z][A-Za-z]+Neural$/.test(id)
}
