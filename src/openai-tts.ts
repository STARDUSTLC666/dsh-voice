/**
 * OpenAI 兼容 TTS 客户端：支持 OpenAI / SiliconFlow / 本地 Kokoro 等 /audio/speech 端点。
 *
 * @module dsh-voice/openai-tts
 */

/** 零样本克隆参考音频样本。 */
export interface ReferenceVoiceSample {
  audioDataUri: string
  text?: string
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
  fetchImpl: typeof fetch = globalThis.fetch,
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

  const payload: Record<string, unknown> = {
    model: effectiveModel,
    input,
    voice: options.voice,
    response_format: 'mp3',
    ...(options.speed !== undefined && options.speed !== 1 ? { speed: options.speed } : {}),
    ...(instr !== '' && !isCosyVoice ? { instructions: instr } : {}),
    ...(hasReferences
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
