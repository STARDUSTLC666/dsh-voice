/**
 * 代理 fetch 一并带出 undici 自己的 FormData 构造器。
 *
 * undici 的 fetch/Response 只认自己那份 FormData（brand symbol 属于该模块），而 Node 的
 * 全局 FormData 是另一份实现：喂错会被当成普通对象序列化成 "[object FormData]"
 * （content-type: text/plain），ASR 接口必回 400 —— 实测见 README 的代理场景。
 */
export type ProxyFetch = typeof globalThis.fetch & {
    FormData: typeof globalThis.FormData;
};
export declare function createProxyFetch(proxyUrl: string): ProxyFetch;
