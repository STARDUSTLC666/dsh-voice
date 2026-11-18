/**
 * dsh-voice 配置解析：TTS 引擎与默认音色语速、ASR 引擎与密钥、代理。
 *
 * @module dsh-voice/config
 */
/** TTS 引擎类型。 */
export type TtsEngine = 'edge' | 'openai' | 'siliconflow' | 'custom';
/** ASR 引擎类型。 */
export type AsrEngine = 'groq' | 'openai' | 'siliconflow' | 'custom';
/** 发音替读规则（字幕保留原词，朗读按 alias 发音）。 */
export interface PronunciationRule {
    word: string;
    alias: string;
}
/** 自定义音色与零样本克隆别名。 */
export interface CustomVoiceAlias {
    name: string;
    voice?: string;
    persona?: string;
    rate?: string;
    pitch?: string;
    instructions?: string;
    referenceAudio?: string;
    referenceText?: string;
}
/** 插件行配置（cordis.patch.yml 里的 config 段，可缺省）。 */
export interface VoiceConfig {
    ttsEngine?: TtsEngine;
    ttsBaseUrl?: string;
    ttsApiKey?: string;
    ttsModel?: string;
    ttsVoice?: string;
    ttsRate?: string;
    ttsPitch?: string;
    asrEngine?: AsrEngine;
    asrBaseUrl?: string;
    asrApiKey?: string;
    asrModel?: string;
    proxyUrl?: string;
    timeoutMs?: number;
    overwrite?: boolean;
    customVoices?: CustomVoiceAlias[];
    pronunciations?: PronunciationRule[];
}
/** 解析后的配置。 */
export interface ResolvedVoiceConfig {
    ttsEngine: TtsEngine;
    ttsBaseUrl: string;
    ttsApiKey: string;
    ttsModel: string;
    ttsVoice: string;
    ttsRate: string;
    ttsPitch: string;
    asrEngine: AsrEngine;
    asrBaseUrl: string;
    asrApiKey: string;
    asrModel: string;
    proxyUrl: string;
    timeoutMs: number;
    overwrite: boolean;
    customVoices: CustomVoiceAlias[];
    pronunciations: PronunciationRule[];
}
export declare const ASR_PRESETS: Record<'groq' | 'openai' | 'siliconflow', {
    baseUrl: string;
    model: string;
}>;
export declare const TTS_PRESETS: Record<'openai' | 'siliconflow', {
    baseUrl: string;
    model: string;
}>;
/** 校验 SSML prosody 参数（语速 / 音调），如 +0%、-15%、+2Hz、-1st。 */
export declare function isValidProsody(value: string): boolean;
/** 判断 baseUrl 是否指向本机回环地址（用于允许本地无密钥服务）。 */
export declare function isLoopbackBaseUrl(url: string): boolean;
/** ASR 密钥：配置优先，其次环境变量 DSH_VOICE_ASR_KEY。 */
export declare function resolveAsrApiKey(config: VoiceConfig | undefined, env?: NodeJS.ProcessEnv): string;
/** TTS 密钥：配置优先，其次环境变量 DSH_VOICE_TTS_KEY。 */
export declare function resolveTtsApiKey(config: VoiceConfig | undefined, env?: NodeJS.ProcessEnv): string;
/** 按别名（大小写不敏感）查找自定义音色配置。 */
export declare function resolveCustomVoice(customVoices: readonly CustomVoiceAlias[], nameOrId: string): CustomVoiceAlias | undefined;
/**
 * 解析并校验配置：非法字段逐项回退到默认值，其余字段照常生效。
 * @param onWarning 非法字段的告警回调，默认打到 console.warn。
 */
export declare function resolveConfig(config: VoiceConfig | undefined | null, onWarning?: (message: string) => void): ResolvedVoiceConfig;
