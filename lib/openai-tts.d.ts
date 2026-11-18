/**
 * OpenAI 兼容 TTS 客户端：支持 OpenAI / SiliconFlow / 本地 Kokoro 等 /audio/speech 端点。
 *
 * @module dsh-voice/openai-tts
 */
/** OpenAI 兼容 TTS 合成选项。 */
export interface OpenAiTtsOptions {
    text: string;
    voice: string;
    model: string;
    speed?: number;
    signal?: AbortSignal;
}
/**
 * 将 edge-tts 百分比语速（如 `+20%`、`-15%`、`+0%`）换算为 OpenAI speed 倍率（钳制在 `[0.25, 4.0]`）。
 */
export declare function rateToSpeed(rate: string): number;
/**
 * 调用 OpenAI 兼容 `/audio/speech` 接口合成 MP3 音频。
 * 本地回环地址（localhost / 127.0.0.1 / ::1）允许空密钥直连。
 */
export declare function synthesizeOpenAiSpeech(baseUrl: string, apiKey: string, options: OpenAiTtsOptions, fetchImpl?: typeof fetch, timeoutMs?: number, signal?: AbortSignal): Promise<Buffer>;
