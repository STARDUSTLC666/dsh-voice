/**
 * 插件级 HTTP 代理：给 TTS 令牌与 ASR 请求一个走指定代理的 fetch，不影响同进程其他插件。
 */
import { FormData as UndiciFormData, ProxyAgent, fetch as undiciFetch } from 'undici';
export function createProxyFetch(proxyUrl) {
    const agent = new ProxyAgent(proxyUrl);
    const impl = ((input, init) => undiciFetch(input, { ...init, dispatcher: agent }));
    impl.FormData = UndiciFormData;
    return impl;
}
