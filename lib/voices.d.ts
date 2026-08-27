/**
 * 常用音色清单（edge-tts 全量约 500 个，这里收录常用中/英/日/韩/法/德/俄/西音色）。
 *
 * @module dsh-voice/voices
 */
/** 音色信息。 */
export interface VoiceInfo {
    id: string;
    gender: 'Female' | 'Male';
    locale: string;
}
/** 常用音色。 */
export declare const VOICES: VoiceInfo[];
/** 校验音色 id：常用清单内或符合 edge-tts 命名规则。 */
export declare function isValidVoiceId(id: string): boolean;
