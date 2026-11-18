/**
 * OpenAI 兼容 TTS 客户端：支持 OpenAI / SiliconFlow / 本地 Kokoro 等 /audio/speech 端点。
 *
 * @module dsh-voice/openai-tts
 */
import { createHash } from 'node:crypto'
import { extname } from 'node:path'

/** 零样本克隆参考音频样本。 */
export interface ReferenceVoiceSample {
  audioDataUri: string
  text?: string
  rawAudio?: Buffer
  filename?: string
}

/** 传给 TTS / 上传接口的 fetch：支持像代理那样附带自己的 FormData 构造器。 */
export type OpenAiTtsFetch = typeof fetch & { FormData?: typeof FormData }

const uploadedVoiceUriCache = new Map<string, string>()
const inFlightVoiceUploads = new Map<string, Promise<string>>()

/** 重置 SiliconFlow 参考音频 URI 内存缓存（测试专用）。 */
export function resetUploadedVoiceCacheForTest(): void {
  uploadedVoiceUriCache.clear()
  inFlightVoiceUploads.clear()
}

function mimeOfAudio(filename: string): string {
  const ext = extname(filename).toLowerCase()
  const table: Record<string, string> = {
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.m4a': 'audio/mp4',
    '.mp4': 'audio/mp4',
    '.ogg': 'audio/ogg',
    '.opus': 'audio/ogg',
    '.flac': 'audio/flac',
    '.webm': 'audio/webm',
  }
  return table[ext] ?? 'application/octet-stream'
}

/**
 * 上传参考音频到 SiliconFlow `/uploads/audio/voice` 并返回可复用的 `speech:...` URI；
 * 相同 `baseUrl + model + text + audio SHA-256` 命中内存缓存直接返回，避免分段重复上传。
 */
export async function uploadSiliconFlowVoice(
  baseUrl: string,
  apiKey: string,
  sample: { audio: Buffer; filename: string; model: string; text: string },
  fetchImpl: OpenAiTtsFetch = globalThis.fetch,
  timeoutMs = 30000,
  signal?: AbortSignal,
): Promise<string> {
  throwIfAborted(signal)
  const trimmedBaseUrl = baseUrl.trim().replace(/\/+$/, '')
  if (trimmedBaseUrl === '') {
    throw new Error('未配置 TTS 接口地址，无法上传参考音频。')
  }
  const key = apiKey.trim()
  if (key === '' && !isLoopbackUrl(trimmedBaseUrl)) {
    throw new Error('未配置 TTS 密钥，无法上传参考音频。')
  }
  if (!Buffer.isBuffer(sample.audio) || sample.audio.length === 0) {
    throw new Error('参考音频为空，无法上传。')
  }
  if (typeof sample.text !== 'string' || sample.text.trim() === '') {
    throw new Error('参考音频文本为空，无法上传 SiliconFlow 音色。')
  }

  const audioHash = createHash('sha256').update(sample.audio).digest('hex')
  const cacheKey = createHash('sha256')
    .update(trimmedBaseUrl + '|' + sample.model + '|' + sample.text + '|' + audioHash)
    .digest('hex')

  const cached = uploadedVoiceUriCache.get(cacheKey)
  if (cached !== undefined) {
    return cached
  }

  const existing = inFlightVoiceUploads.get(cacheKey)
  if (existing !== undefined) {
    return await raceAbort(existing, signal)
  }

  const uploadPromise = (async (): Promise<string> => {
    const FormDataImpl = (fetchImpl as { FormData?: typeof FormData }).FormData ?? FormData
    const form = new FormDataImpl()
    const filename = sample.filename.trim() !== '' ? sample.filename.trim() : 'reference.mp3'
    const mime = mimeOfAudio(filename)
    form.append('model', sample.model)
    form.append('customName', 'dsh_' + cacheKey.slice(0, 10))
    form.append('text', sample.text)
    form.append('file', new Blob([sample.audio], { type: mime }), filename)

    const headers: Record<string, string> = key !== '' ? { authorization: 'Bearer ' + key } : {}
    const timeoutSignal = AbortSignal.timeout(timeoutMs)
    const requestSignal = signal === undefined ? timeoutSignal : AbortSignal.any([timeoutSignal, signal])

    let response: Response
    try {
      response = await raceAbort(
        fetchImpl(trimmedBaseUrl + '/uploads/audio/voice', {
          method: 'POST',
          redirect: 'manual',
          headers,
          body: form,
          signal: requestSignal,
        }),
        requestSignal,
      )
    } catch (error) {
      throwIfAborted(signal)
      if (timeoutSignal.aborted) throw new Error('SiliconFlow 参考音频上传超时。')
      throw new Error('SiliconFlow 参考音频上传失败：' + (error instanceof Error ? error.message : String(error)))
    }

    if (response.status >= 300 && response.status < 400) {
      try { await raceAbort(response.body?.cancel(), requestSignal) } catch { /* 忽略 */ }
      throwIfAborted(signal)
      throw new Error('SiliconFlow 音色上传返回重定向（HTTP ' + response.status + '），已阻止跳转。')
    }

    if (!response.ok) {
      let body = ''
      try {
        body = (await raceAbort(response.text(), requestSignal)).slice(0, 300)
      } catch (error) {
        throwIfAborted(signal)
        if (timeoutSignal.aborted) throw new Error('SiliconFlow 音色上传响应读取超时。')
        throw error
      }
      throw new Error('SiliconFlow 音色上传失败：HTTP ' + response.status + '。' + body)
    }

    let json: unknown
    try {
      json = await raceAbort(response.json(), requestSignal)
    } catch (error) {
      throwIfAborted(signal)
      if (timeoutSignal.aborted) throw new Error('SiliconFlow 音色上传响应读取超时。')
      throw new Error('SiliconFlow 音色上传响应不是合法 JSON：' + (error instanceof Error ? error.message : String(error)))
    }

    const uri = typeof json === 'object' && json !== null && typeof (json as Record<string, unknown>).uri === 'string'
      ? ((json as Record<string, unknown>).uri as string).trim()
      : ''
    if (uri === '') {
      throw new Error('SiliconFlow 音色上传响应缺少 uri 字段。')
    }

    uploadedVoiceUriCache.set(cacheKey, uri)
    return uri
  })()

  uploadPromise.catch(() => {})
  inFlightVoiceUploads.set(cacheKey, uploadPromise)
  try {
    return await raceAbort(uploadPromise, signal)
  } finally {
    inFlightVoiceUploads.delete(cacheKey)
  }
}

/** OpenAI 兼容 TTS 合成选项。 */
export interface OpenAiTtsOptions {
  text: string
  voice: string
  model: string
  speed?: number
  instructions?: string
  references?: ReferenceVoiceSample[]
  signal?: AbortSignal
}

function isLoopbackUrl(rawUrl: string): boolean {
  try {
    const host = new URL(rawUrl).hostname.toLowerCase()
    return host === 'localhost' || host === '127.0.0.1' || host === '::1' || host === '[::1]'
  } catch {
    return false
  }
}

function throwIfAborted(signal: AbortSignal | undefined): void {
  if (signal?.aborted === true) throw signal.reason
}

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

/**
 * 将 edge-tts 百分比语速（如 `+20%`、`-15%`、`+0%`）换算为 OpenAI speed 倍率（钳制在 `[0.25, 4.0]`）。
 */
export function rateToSpeed(rate: string): number {
  const match = /^([+-]?\d+(?:\.\d+)?)%$/.exec(rate.trim())
  if (!match) return 1.0
  const percent = Number(match[1])
  if (!Number.isFinite(percent)) return 1.0
  const raw = Math.round((1 + percent / 100) * 10000) / 10000
  return Math.min(4.0, Math.max(0.25, raw))
}

/**
 * 调用 OpenAI 兼容 `/audio/speech` 接口合成 MP3 音频。
 * 本地回环地址（localhost / 127.0.0.1 / ::1）允许空密钥直连。
 */
export async function synthesizeOpenAiSpeech(
  baseUrl: string,
  apiKey: string,
  options: OpenAiTtsOptions,
  fetchImpl: OpenAiTtsFetch = globalThis.fetch,
  timeoutMs = 60000,
  signal?: AbortSignal,
): Promise<Buffer> {
  const abortSignal = signal ?? options.signal
  throwIfAborted(abortSignal)

  const trimmedBaseUrl = baseUrl.trim().replace(/\/+$/, '')
  if (trimmedBaseUrl === '') {
    throw new Error('未配置 TTS 接口地址：请在 DSH「设置 → 插件 → 语音」填写 ttsBaseUrl。')
  }
  if (options.text.trim() === '') {
    throw new Error('要合成的文本为空。')
  }
  const key = apiKey.trim()
  if (key === '' && !isLoopbackUrl(trimmedBaseUrl)) {
    throw new Error('未配置 TTS 密钥：请在 DSH「设置 → 插件 → 语音」填写 ttsApiKey 或设置环境变量 DSH_VOICE_TTS_KEY。')
  }

  const hasReferences = Array.isArray(options.references) && options.references.length > 0
  if (options.voice.trim() === '' && !hasReferences) {
    throw new Error('未指定音色：请填写 voice 或提供参考音频 references。')
  }

  const headers: Record<string, string> = {
    'content-type': 'application/json',
  }
  if (key !== '') {
    headers.authorization = 'Bearer ' + key
  }

  const effectiveModel = options.model || 'gpt-4o-mini-tts'
  const isCosyVoice = effectiveModel.toLowerCase().includes('cosyvoice')
  const instr = options.instructions?.trim() ?? ''
  let input = options.text
  if (instr !== '' && isCosyVoice && !options.text.includes('<|endofprompt|>')) {
    input = instr + '<|endofprompt|>' + options.text
  }

  let effectiveVoice = options.voice
  let sendInlineReferences = hasReferences
  if (
    options.voice === ''
    && hasReferences
    && options.references!.length === 1
    && Buffer.isBuffer(options.references![0].rawAudio)
    && options.references![0].rawAudio.length > 0
    && typeof options.references![0].text === 'string'
    && options.references![0].text.trim() !== ''
    && trimmedBaseUrl.toLowerCase().includes('siliconflow.')
    && key !== ''
  ) {
    const ref = options.references![0]
    try {
      const uri = await uploadSiliconFlowVoice(
        trimmedBaseUrl,
        key,
        {
          audio: ref.rawAudio!,
          filename: ref.filename && ref.filename.trim() !== '' ? ref.filename.trim() : 'reference.mp3',
          model: effectiveModel,
          text: ref.text!.trim(),
        },
        fetchImpl,
        timeoutMs,
        abortSignal,
      )
      if (uri.trim() !== '') {
        effectiveVoice = uri.trim()
        sendInlineReferences = false
      }
    } catch {
      throwIfAborted(abortSignal)
      // 若上传端点不可用（如仅 mock /audio/speech 的单测），静默回退为内联 references
    }
  }

  const payload: Record<string, unknown> = {
    model: effectiveModel,
    input,
    voice: effectiveVoice,
    response_format: 'mp3',
    ...(options.speed !== undefined && options.speed !== 1 ? { speed: options.speed } : {}),
    ...(instr !== '' && !isCosyVoice ? { instructions: instr } : {}),
    ...(sendInlineReferences
      ? {
          references: options.references!.map((ref) => ({
            audio: ref.audioDataUri,
            text: ref.text ?? '',
          })),
        }
      : {}),
  }

  const timeoutSignal = AbortSignal.timeout(timeoutMs)
  const requestSignal = abortSignal === undefined ? timeoutSignal : AbortSignal.any([timeoutSignal, abortSignal])

  let response: Response
  try {
    response = await raceAbort(fetchImpl(trimmedBaseUrl + '/audio/speech', {
      method: 'POST',
      redirect: 'manual',
      headers,
      body: JSON.stringify(payload),
      signal: requestSignal,
    }), requestSignal)
  } catch (error) {
    throwIfAborted(abortSignal)
    if (timeoutSignal.aborted) throw new Error('TTS 请求超时，请重试或检查网络。')
    throw new Error('TTS 请求失败：' + (error instanceof Error ? error.message : String(error)) + '。若接口需要特殊代理（梯子），请在 DSH「设置 → 插件 → 语音」配置 proxyUrl（保存即生效）。')
  }

  if (response.status >= 300 && response.status < 400) {
    try { await raceAbort(response.body?.cancel(), requestSignal) } catch { /* 忽略 */ }
    throwIfAborted(abortSignal)
    throw new Error('TTS 接口返回重定向（HTTP ' + response.status + '），已阻止跳转。请确认 ttsBaseUrl 为可信的最终接口地址。')
  }

  if (!response.ok) {
    let body = ''
    try {
      body = (await raceAbort(response.text(), requestSignal)).slice(0, 300)
    } catch (error) {
      throwIfAborted(abortSignal)
      if (timeoutSignal.aborted) throw new Error('TTS 响应读取超时，请重试。')
      throw error
    }
    throw new Error('TTS 失败：HTTP ' + response.status + '。' + body)
  }

  let arrayBuffer: ArrayBuffer
  try {
    arrayBuffer = await raceAbort(response.arrayBuffer(), requestSignal)
  } catch (error) {
    throwIfAborted(abortSignal)
    if (timeoutSignal.aborted) throw new Error('TTS 响应读取超时，请重试。')
    throw error
  }

  const audio = Buffer.from(arrayBuffer)
  if (audio.length === 0) {
    throw new Error('TTS 合成结果为空。')
  }
  return audio
}
