/**
 * 插件级 HTTP 代理：给 TTS 令牌与 ASR 请求一个走指定代理的 fetch，不影响同进程其他插件。
 */
import { ProxyAgent, fetch as undiciFetch } from 'undici';
/**
 * 构造一个把所有请求路由到 proxyUrl 的 fetch。
 */
export function createProxyFetch(proxyUrl) {
    const agent = new ProxyAgent(proxyUrl);
    return ((input, init) => undiciFetch(input, { ...init, dispatcher: agent }));
}
