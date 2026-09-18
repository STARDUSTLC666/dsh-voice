/**
 * ASR 客户端：OpenAI 兼容 /audio/transcriptions multipart 上传。
 *
 * @module dsh-voice/stt
 */
import { extname } from 'node:path'

/** 转写选项。 */
export interface SttOptions {
  audio: Buffer
  filename: string
  model: string
  language?: string
  prompt?: string
  /** 取消信号（可选）；也可通过 transcribe 第 6 个参数传入。 */
  signal?: AbortSignal
}

const MAX_AUDIO_BYTES = 25 * 1024 * 1024

/** 字节数超过 25MB 时抛错：调用方可在读文件前先按 statSync 大小快速拒绝，避免白读整文件。 */
export function assertAudioSize(bytes: number): void {
  if (bytes > MAX_AUDIO_BYTES) throw new Error('音频超过 25MB 上限（ASR 接口限制），请先用 ffmpeg 压缩。')
}

/**
 * 调用 OpenAI 兼容 ASR 接口转写音频。
 * @throws 缺密钥 / 文件过大 / HTTP 错误 / 无文本时抛中文错误。
 */
/** 传给 transcribe 的 fetch：可以像代理那样一并带上自己的 FormData/Blob 构造器。 */
export type SttFetch = typeof fetch & { FormData?: typeof FormData }

/** 已取消则抛出取消原因；作为 await 前后的统一取消检查。 */
function throwIfAborted(signal: AbortSignal | undefined): void {
  if (signal?.aborted === true) throw signal.reason
}

/** 让不认 signal 的 fetch 实现也能在外部取消时立即 reject。 */
function raceAbort<T>(value: T | PromiseLike<T>, signal: AbortSignal | undefined): Promise<T> {
  const promise = Promise.resolve(value)
  if (signal === undefined || typeof signal.addEventListener !== 'function') return promise
  if (signal.aborted === true) return Promise.reject(signal.reason)
  return new Promise<T>((resolvePromise, rejectPromise) => {
    const onAbort = () => rejectPromise(signal.reason)
    signal.addEventListener('abort', onAbort, { once: true })
    promise.then(
      (settled) => { signal.removeEventListener('abort', onAbort); resolvePromise(settled) },
      (error) => { signal.removeEventListener('abort', onAbort); rejectPromise(error) },
    )
  })
}

export async function transcribe(baseUrl: string, apiKey: string, options: SttOptions, fetchImpl: SttFetch = globalThis.fetch, timeoutMs = 120000, signal?: AbortSignal): Promise<{ text: string; model: string }> {
  const abortSignal = signal ?? options.signal
  throwIfAborted(abortSignal)
  if (apiKey === '') throw new Error('未配置 ASR 密钥：请设置环境变量 DSH_VOICE_ASR_KEY，或在 cordis.patch.yml 的 asrApiKey 配置后重启。')
  if (baseUrl === '') throw new Error('未配置 ASR 接口地址（asrEngine=custom 时必须提供 asrBaseUrl）。')
  if (options.audio.length === 0) throw new Error('音频文件为空。')
  assertAudioSize(options.audio.length)

  // 代理 fetch（undici）只认它自己那份 FormData：喂 Node 全局 FormData 会被当成普通
  // 对象序列化成 "[object FormData]"（content-type: text/plain），所以优先用调用方 fetch
  // 附带的构造器。文件部分继续用全局 Blob —— 实测 undici 的 FormData 收它并输出真 multipart。
  const FormDataImpl = fetchImpl.FormData ?? FormData
  const form = new FormDataImpl()
  const mime = mimeOf(options.filename)
  form.append('file', new Blob([options.audio], { type: mime }), options.filename)
  form.append('model', options.model)
  if (options.language !== undefined && options.language !== '') form.append('language', options.language)
  if (options.prompt !== undefined && options.prompt !== '') form.append('prompt', options.prompt)

  const timeoutSignal = AbortSignal.timeout(timeoutMs)
  const requestSignal = abortSignal === undefined ? timeoutSignal : AbortSignal.any([timeoutSignal, abortSignal])
  let response: Response
  try {
    response = await raceAbort(fetchImpl(baseUrl + '/audio/transcriptions', {
      method: 'POST',
      headers: { authorization: 'Bearer ' + apiKey },
      body: form,
      signal: requestSignal,
    }), abortSignal)
  } catch (error) {
    throwIfAborted(abortSignal)
    throw new Error('ASR 请求失败：' + (error instanceof Error ? error.message : String(error)) + '。若接口需要特殊代理（梯子），请在 cordis.patch.yml 配置 proxyUrl 后重启。')
  }
  if (!response.ok) {
    const body = (await response.text()).slice(0, 300)
    throw new Error('ASR 失败：HTTP ' + response.status + '。' + body)
  }
  let json: unknown
  try {
    json = await response.json()
  } catch {
    throw new Error('ASR 响应不是合法 JSON。')
  }
  const text = typeof json === 'object' && json !== null && typeof (json as Record<string, unknown>).text === 'string' ? (json as Record<string, unknown>).text as string : ''
  return { text, model: options.model }
}

/** 常见音频扩展名 → MIME。 */
function mimeOf(filename: string): string {
  const ext = extname(filename).toLowerCase()
  const table: Record<string, string> = {
    '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.m4a': 'audio/mp4', '.mp4': 'audio/mp4',
    '.ogg': 'audio/ogg', '.opus': 'audio/ogg', '.flac': 'audio/flac', '.webm': 'audio/webm',
  }
  return table[ext] ?? 'application/octet-stream'
}
