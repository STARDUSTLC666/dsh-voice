/**
 * 常用音色清单（内置 51 个经实时 Edge ReadAloud 验证可用的全年龄段/多风格/方言音色与 10 个开箱即用角色人设配方）。
 *
 * @module dsh-voice/voices
 */
/** 音色信息。 */
export interface VoiceInfo {
    id: string;
    gender: 'Female' | 'Male';
    locale: string;
    tags?: string[];
}
/** 角色人设配方（绑定音色、语速、音调与默认段间停顿）。 */
export interface VoicePersona {
    id: string;
    label: string;
    voice: string;
    rate: string;
    pitch: string;
    pauseMs: number;
    description: string;
    tags: string[];
}
/** 常用音色（全部经 Edge 线上目录实时核验可用）。 */
export declare const VOICES: VoiceInfo[];
/** 开箱即用角色人设配方（可直接传给 voice_tts / voice_preview 的 persona 参数，全部绑定真实 Edge 可用音色）。 */
export declare const VOICE_PERSONAS: VoicePersona[];
/** 校验音色 id：常用清单内或符合 edge-tts 命名规则（含方言/文字子标签/多语/HD 变体）。 */
export declare function isValidVoiceId(id: string): boolean;
/** 按人设 ID 或中文名称匹配内置角色人设配方（大小写不敏感）。 */
export declare function resolvePersona(idOrLabel: string): VoicePersona | undefined;
/** 按地区/语言、性别或标签筛选音色列表（默认筛选内置常用音色）。 */
export declare function filterVoices(filter?: {
    locale?: string;
    gender?: string;
    tag?: string;
}, sourceVoices?: VoiceInfo[]): VoiceInfo[];
