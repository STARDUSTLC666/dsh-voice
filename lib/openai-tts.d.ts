/** 零样本克隆参考音频样本。 */
export interface ReferenceVoiceSample {
    audioDataUri: string;
    text?: string;
    rawAudio?: Buffer;
    filename?: string;
}
/** 传给 TTS / 上传接口的 fetch：支持像代理那样附带自己的 FormData 构造器。 */
export type OpenAiTtsFetch = typeof fetch & {
    FormData?: typeof FormData;
};
/** 重置 SiliconFlow 参考音频 URI 内存缓存（测试专用）。 */
export declare function resetUploadedVoiceCacheForTest(): void;
/**
 * 上传参考音频到 SiliconFlow `/uploads/audio/voice` 并返回可复用的 `speech:...` URI；
 * 同一账号的相同 `baseUrl + model + text + audio SHA-256` 命中内存缓存直接返回。
 */
export declare function uploadSiliconFlowVoice(baseUrl: string, apiKey: string, sample: {
    audio: Buffer;
    filename: string;
    model: string;
    text: string;
}, fetchImpl?: OpenAiTtsFetch, timeoutMs?: number, signal?: AbortSignal): Promise<string>;
/** OpenAI 兼容 TTS 合成选项。 */
export interface OpenAiTtsOptions {
    text: string;
    voice: string;
    model: string;
    speed?: number;
    instructions?: string;
    references?: ReferenceVoiceSample[];
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
export declare function synthesizeOpenAiSpeech(baseUrl: string, apiKey: string, options: OpenAiTtsOptions, fetchImpl?: OpenAiTtsFetch, timeoutMs?: number, signal?: AbortSignal): Promise<Buffer>;
