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
/** 传给 transcribe 的 fetch：可以像代理那样一并带上自己的 FormData/Blob 构造器。 */
export type SttFetch = typeof fetch & {
    FormData?: typeof FormData;
};
export declare function transcribe(baseUrl: string, apiKey: string, options: SttOptions, fetchImpl?: SttFetch, timeoutMs?: number): Promise<{
    text: string;
    model: string;
}>;
