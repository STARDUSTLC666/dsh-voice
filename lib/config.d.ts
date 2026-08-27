/**
 * dsh-voice 配置解析：TTS 默认音色与语速、ASR 引擎与密钥、代理。
 *
 * @module dsh-voice/config
 */
/** 插件行配置（cordis.patch.yml 里的 config 段，可缺省）。 */
export interface VoiceConfig {
    ttsVoice?: string;
    ttsRate?: string;
    ttsPitch?: string;
    asrEngine?: 'groq' | 'openai' | 'custom';
    asrBaseUrl?: string;
    asrApiKey?: string;
    asrModel?: string;
    proxyUrl?: string;
    timeoutMs?: number;
    overwrite?: boolean;
}
/** 解析后的配置。 */
export interface ResolvedVoiceConfig {
    ttsVoice: string;
    ttsRate: string;
    ttsPitch: string;
    asrEngine: 'groq' | 'openai' | 'custom';
    asrBaseUrl: string;
    asrApiKey: string;
    asrModel: string;
    proxyUrl: string;
    timeoutMs: number;
    overwrite: boolean;
}
/** ASR 密钥：配置优先，其次环境变量 DSH_VOICE_ASR_KEY。 */
export declare function resolveAsrApiKey(config: VoiceConfig | undefined, env?: NodeJS.ProcessEnv): string;
/**
 * 解析并校验配置。
 */
export declare function resolveConfig(config: VoiceConfig | undefined | null): ResolvedVoiceConfig;
