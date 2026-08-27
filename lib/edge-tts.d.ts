/** 合成选项。 */
export interface TtsOptions {
    text: string;
    voice: string;
    rate: string;
    pitch: string;
}
/** 可注入依赖（测试用假实现）。 */
export interface TtsDeps {
    webSocketFactory?: WebSocketFactory;
    nowSeconds?: () => number;
    proxyUrl?: string;
}
/** 最小的 WebSocket 面。 */
export interface WebSocketLike {
    addEventListener(type: 'message', listener: (event: {
        data: unknown;
    }) => void): void;
    addEventListener(type: 'open' | 'close' | 'error', listener: (event?: unknown) => void): void;
    send(data: string): void;
    close(): void;
}
export type WebSocketFactory = (url: string, options: {
    headers: Record<string, string>;
}) => WebSocketLike;
/**
 * 本地生成 Sec-MS-GEC 令牌（对齐 edge-tts DRM 算法）。
 */
export declare function generateSecMsGec(nowSeconds?: number): string;
/** 生成 SSML。 */
export declare function buildSsml(options: TtsOptions): string;
/**
 * 合成语音，返回 MP3 字节。
 * @throws 文本为空/超长 / 连接失败 / 超时 / 无音频数据时抛中文错误。
 */
export declare function synthesizeSpeech(options: TtsOptions, deps?: TtsDeps, timeoutMs?: number): Promise<Buffer>;
