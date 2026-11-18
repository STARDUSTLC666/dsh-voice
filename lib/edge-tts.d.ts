import { type VoiceInfo } from './voices.js';
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
    pronunciations?: ReadonlyArray<{
        word: string;
        alias: string;
    }>;
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
    /** 是否显式启用 Keep-Alive WebSocket 连接池（未注入 webSocketFactory 时默认开启）。 */
    usePool?: boolean;
    /** 瞬态网络断连重试次数（未注入 webSocketFactory 时默认为 1，测试注入时默认为 0）。 */
    maxRetries?: number;
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
    removeEventListener?(type: 'message' | 'open' | 'close' | 'error', listener: (...args: any[]) => void): void;
    readyState?: number;
    on?(event: 'unexpected-response', listener: (req: unknown, res: UnexpectedResponseInfo) => void): void;
    send(data: string): void;
    close(): void;
}
export type WebSocketFactory = (url: string, options: {
    headers: Record<string, string>;
}) => WebSocketLike;
/** 关闭并清空所有 Edge TTS 空闲保活 WebSocket 连接池。 */
export declare function closeEdgeConnectionPool(): void;
/**
 * 本地生成 Sec-MS-GEC v2 令牌（对齐 edge-tts 7.3.1）。
 */
export declare function generateSecMsGec(nowSeconds?: number): string;
/** 生成 SSML。 */
export declare function buildSsml(options: TtsOptions): string;
export type EdgeBoundaryMode = 'sentence' | 'word' | 'all' | false;
/**
 * 合成语音并可选返回句/词级边界字幕时间轴。
 * 支持 Keep-Alive WebSocket 连接池复用、HTTP 403 时钟自动校准与瞬态断连自动重试。
 * @throws 文本为空/超长 / 连接失败 / 超时 / 无音频数据时抛中文错误。
 */
export declare function synthesizeSpeechWithMetadata(options: TtsOptions & {
    boundary?: EdgeBoundaryMode;
}, deps?: TtsDeps, timeoutMs?: number, signal?: AbortSignal): Promise<{
    audio: Buffer;
    cues: SubtitleCue[];
}>;
/**
 * 合成语音，返回 MP3 字节。
 * @throws 文本为空/超长 / 连接失败 / 超时 / 无音频数据时抛中文错误。
 */
export declare function synthesizeSpeech(options: TtsOptions, deps?: TtsDeps, timeoutMs?: number, signal?: AbortSignal): Promise<Buffer>;
/** 在线音色列表拉取的可注入依赖。 */
export interface FetchEdgeVoicesDeps {
    fetchImpl?: typeof fetch;
    nowSeconds?: () => number;
    signal?: AbortSignal;
    forceRefresh?: boolean;
}
/** 重置 Edge 在线音色内存缓存（测试专用）。 */
export declare function resetEdgeVoicesCacheForTest(): void;
/**
 * 动态拉取微软 Edge 在线全量（300+）音色目录并缓存 24 小时。
 * @throws 请求失败 / 重定向 / 响应异常 / 超时时抛中文错误。
 */
export declare function fetchEdgeVoices(deps?: FetchEdgeVoicesDeps, timeoutMs?: number): Promise<VoiceInfo[]>;
