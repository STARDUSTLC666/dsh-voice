/**
 * 构造一个把所有请求路由到 proxyUrl 的 fetch。
 */
export declare function createProxyFetch(proxyUrl: string): typeof globalThis.fetch;
