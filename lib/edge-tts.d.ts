/** 重置时钟偏差缓存（测试专用）。 */
export declare function resetClockSkewForTest(): void;
/** 读取当前时钟偏差（秒）。 */
export declare function getClockSkewSeconds(): number;
/** 合成选项。 */
export interface TtsOptions {
    text: string;
    voice: string;
    rate: string;
    pitch: string;
}
/** 字幕时间轴条目（毫秒级）。 */
export interface SubtitleCue {
    index: number;
    startMs: number;
    endMs: number;
    text: string;
}
/** 可注入依赖（测试用假实现）。 */
export interface TtsDeps {
    webSocketFactory?: WebSocketFactory;
    nowSeconds?: () => number;
    proxyUrl?: string;
    /** 取消信号（可选）；也可通过 synthesizeSpeech 第 4 个参数传入。 */
    signal?: AbortSignal;
}
/** unexpected-response 事件中的 HTTP 响应最小面。 */
export interface UnexpectedResponseInfo {
    statusCode?: number;
    headers?: Record<string, string | string[] | undefined>;
    resume?: () => void;
}
/** 最小的 WebSocket 面。 */
export interface WebSocketLike {
    addEventListener(type: 'message', listener: (event: {
        data: unknown;
    }) => void): void;
    addEventListener(type: 'open' | 'close' | 'error', listener: (event?: unknown) => void): void;
    on?(event: 'unexpected-response', listener: (req: unknown, res: UnexpectedResponseInfo) => void): void;
    send(data: string): void;
    close(): void;
}
export type WebSocketFactory = (url: string, options: {
    headers: Record<string, string>;
}) => WebSocketLike;
/**
 * 本地生成 Sec-MS-GEC v2 令牌（对齐 edge-tts 7.3.1）。
 */
export declare function generateSecMsGec(nowSeconds?: number): string;
/** 生成 SSML。 */
export declare function buildSsml(options: TtsOptions): string;
/**
 * 合成语音并可选返回句/词级边界字幕时间轴。
 * 收到 HTTP 403 且响应带有效 Date 头时自动校准时钟偏差并单次重试。
 * @throws 文本为空/超长 / 连接失败 / 超时 / 无音频数据时抛中文错误。
 */
export declare function synthesizeSpeechWithMetadata(options: TtsOptions & {
    boundary?: 'sentence' | 'word' | false;
}, deps?: TtsDeps, timeoutMs?: number, signal?: AbortSignal): Promise<{
    audio: Buffer;
    cues: SubtitleCue[];
}>;
/**
 * 合成语音，返回 MP3 字节。
 * @throws 文本为空/超长 / 连接失败 / 超时 / 无音频数据时抛中文错误。
 */
export declare function synthesizeSpeech(options: TtsOptions, deps?: TtsDeps, timeoutMs?: number, signal?: AbortSignal): Promise<Buffer>;
