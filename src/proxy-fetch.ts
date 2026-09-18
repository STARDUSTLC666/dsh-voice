/**
 * 插件级 HTTP 代理：给 TTS 令牌与 ASR 请求一个走指定代理的 fetch，不影响同进程其他插件。
 */
import { FormData as UndiciFormData, ProxyAgent, fetch as undiciFetch } from 'undici'

/**
 * 代理 fetch 一并带出 undici 自己的 FormData 构造器。
 *
 * undici 的 fetch/Response 只认自己那份 FormData（brand symbol 属于该模块），而 Node 的
 * 全局 FormData 是另一份实现：喂错会被当成普通对象序列化成 "[object FormData]"
 * （content-type: text/plain），ASR 接口必回 400 —— 实测见 README 的代理场景。
 */
export type ProxyFetch = typeof globalThis.fetch & { FormData: typeof globalThis.FormData }

export function createProxyFetch(proxyUrl: string): ProxyFetch {
  const agent = new ProxyAgent(proxyUrl)
  const impl = ((input: Parameters<typeof fetch>[0], init?: Parameters<typeof fetch>[1]) =>
    undiciFetch(input as any, { ...(init as any), dispatcher: agent })) as unknown as ProxyFetch
  impl.FormData = UndiciFormData as unknown as typeof globalThis.FormData
  return impl
}
