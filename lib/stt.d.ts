/** 转写选项。 */
export interface SttOptions {
    audio: Buffer;
    filename: string;
    model: string;
    language?: string;
    prompt?: string;
}
/**
 * 调用 OpenAI 兼容 ASR 接口转写音频。
 * @throws 缺密钥 / 文件过大 / HTTP 错误 / 无文本时抛中文错误。
 */
export declare function transcribe(baseUrl: string, apiKey: string, options: SttOptions, fetchImpl?: typeof fetch, timeoutMs?: number): Promise<{
    text: string;
    model: string;
}>;
