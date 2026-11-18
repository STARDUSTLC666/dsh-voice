/**
 * dsh-voice 配置解析：TTS 引擎与默认音色语速、ASR 引擎与密钥、代理。
 *
 * @module dsh-voice/config
 */

/** TTS 引擎类型。 */
export type TtsEngine = 'edge' | 'openai' | 'siliconflow' | 'custom'

/** ASR 引擎类型。 */
export type AsrEngine = 'groq' | 'openai' | 'siliconflow' | 'custom'

/** 发音替读规则（字幕保留原词，朗读按 alias 发音）。 */
export interface PronunciationRule {
  word: string
  alias: string
}

/** 自定义音色与零样本克隆别名。 */
export interface CustomVoiceAlias {
  name: string
  voice?: string
  persona?: string
  rate?: string
  pitch?: string
  instructions?: string
  referenceAudio?: string
  referenceText?: string
}

/** 插件行配置（cordis.patch.yml 里的 config 段，可缺省）。 */
export interface VoiceConfig {
  ttsEngine?: TtsEngine
  ttsBaseUrl?: string
  ttsApiKey?: string
  ttsModel?: string
  ttsVoice?: string
  ttsRate?: string
  ttsPitch?: string
  asrEngine?: AsrEngine
  asrBaseUrl?: string
  asrApiKey?: string
  asrModel?: string
  proxyUrl?: string
  timeoutMs?: number
  overwrite?: boolean
  customVoices?: CustomVoiceAlias[]
  pronunciations?: PronunciationRule[]
}

/** 解析后的配置。 */
export interface ResolvedVoiceConfig {
  ttsEngine: TtsEngine
  ttsBaseUrl: string
  ttsApiKey: string
  ttsModel: string
  ttsVoice: string
  ttsRate: string
  ttsPitch: string
  asrEngine: AsrEngine
  asrBaseUrl: string
  asrApiKey: string
  asrModel: string
  proxyUrl: string
  timeoutMs: number
  overwrite: boolean
  customVoices: CustomVoiceAlias[]
  pronunciations: PronunciationRule[]
}

export const ASR_PRESETS: Record<'groq' | 'openai' | 'siliconflow', { baseUrl: string; model: string }> = {
  groq: { baseUrl: 'https://api.groq.com/openai/v1', model: 'whisper-large-v3-turbo' },
  openai: { baseUrl: 'https://api.openai.com/v1', model: 'whisper-1' },
  siliconflow: { baseUrl: 'https://api.siliconflow.cn/v1', model: 'FunAudioLLM/SenseVoiceSmall' },
}

export const TTS_PRESETS: Record<'openai' | 'siliconflow', { baseUrl: string; model: string }> = {
  openai: { baseUrl: 'https://api.openai.com/v1', model: 'gpt-4o-mini-tts' },
  siliconflow: { baseUrl: 'https://api.siliconflow.cn/v1', model: 'FunAudioLLM/CosyVoice2-0.5B' },
}

/** 校验 SSML prosody 参数（语速 / 音调），如 +0%、-15%、+2Hz、-1st。 */
export function isValidProsody(value: string): boolean {
  return /^[+-]?\d+(\.\d+)?(%|Hz|st)$/.test(value)
}

/** 判断 baseUrl 是否指向本机回环地址（用于允许本地无密钥服务）。 */
export function isLoopbackBaseUrl(url: string): boolean {
  const trimmed = url.trim()
  if (trimmed === '') return false
  try {
    const hostname = new URL(trimmed).hostname.toLowerCase()
    return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1' || hostname === '[::1]'
  } catch {
    return false
  }
}

/** ASR 密钥：配置优先，其次环境变量 DSH_VOICE_ASR_KEY。 */
export function resolveAsrApiKey(config: VoiceConfig | undefined, env: NodeJS.ProcessEnv = process.env): string {
  const cfg = config ?? {}
  if (typeof cfg.asrApiKey === 'string' && cfg.asrApiKey.trim() !== '') return cfg.asrApiKey.trim()
  return env.DSH_VOICE_ASR_KEY?.trim() ?? ''
}

/** TTS 密钥：配置优先，其次环境变量 DSH_VOICE_TTS_KEY。 */
export function resolveTtsApiKey(config: VoiceConfig | undefined, env: NodeJS.ProcessEnv = process.env): string {
  const cfg = config ?? {}
  if (typeof cfg.ttsApiKey === 'string' && cfg.ttsApiKey.trim() !== '') return cfg.ttsApiKey.trim()
  return env.DSH_VOICE_TTS_KEY?.trim() ?? ''
}

/** 默认告警出口：非法字段逐项回退时点名，避免一个字段拖垮整份配置。 */
function defaultWarn(message: string): void {
  console.warn('[dsh-voice] ' + message)
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false
  const proto = Object.getPrototypeOf(value)
  return proto === Object.prototype || proto === null
}

function trimOptionalString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed === '' ? undefined : trimmed
}

function parseCustomVoices(raw: unknown, onWarning: (message: string) => void): CustomVoiceAlias[] {
  if (raw === undefined) return []
  if (!Array.isArray(raw)) {
    onWarning('customVoices 配置不合法（必须是数组），已忽略该项。')
    return []
  }
  const result: CustomVoiceAlias[] = []
  for (let i = 0; i < raw.length; i += 1) {
    const item = raw[i]
    if (!isPlainObject(item)) continue
    const name = trimOptionalString(item.name)
    if (name === undefined) continue

    const entry: CustomVoiceAlias = { name }
    const voice = trimOptionalString(item.voice)
    if (voice !== undefined) entry.voice = voice
    const persona = trimOptionalString(item.persona)
    if (persona !== undefined) entry.persona = persona

    const rate = trimOptionalString(item.rate)
    if (rate !== undefined) {
      if (isValidProsody(rate)) entry.rate = rate
      else onWarning(`customVoices[${i}].rate 配置不合法（格式如 +0%、+15%、-10%），已忽略该字段，当前值：${rate}`)
    }

    const pitch = trimOptionalString(item.pitch)
    if (pitch !== undefined) {
      if (isValidProsody(pitch)) entry.pitch = pitch
      else onWarning(`customVoices[${i}].pitch 配置不合法（格式如 +0Hz、+2Hz、-1st），已忽略该字段，当前值：${pitch}`)
    }

    const instructions = trimOptionalString(item.instructions)
    if (instructions !== undefined) entry.instructions = instructions
    const referenceAudio = trimOptionalString(item.referenceAudio)
    if (referenceAudio !== undefined) entry.referenceAudio = referenceAudio
    const referenceText = trimOptionalString(item.referenceText)
    if (referenceText !== undefined) entry.referenceText = referenceText

    result.push(entry)
  }
  return result
}

function parsePronunciations(raw: unknown, onWarning: (message: string) => void): PronunciationRule[] {
  if (raw === undefined) return []
  if (!Array.isArray(raw)) {
    onWarning('pronunciations 配置不合法（必须是数组），已忽略该项。')
    return []
  }
  const result: PronunciationRule[] = []
  for (const item of raw) {
    if (!isPlainObject(item)) continue
    const word = trimOptionalString(item.word)
    const alias = trimOptionalString(item.alias)
    if (word === undefined || alias === undefined) continue
    result.push({ word, alias })
  }
  return result
}

/** 按别名（大小写不敏感）查找自定义音色配置。 */
export function resolveCustomVoice(customVoices: readonly CustomVoiceAlias[], nameOrId: string): CustomVoiceAlias | undefined {
  const target = (typeof nameOrId === 'string' ? nameOrId : '').trim().toLowerCase()
  if (target === '') return undefined
  return customVoices.find((alias) => alias.name.trim().toLowerCase() === target)
}

/**
 * 解析并校验配置：非法字段逐项回退到默认值，其余字段照常生效。
 * @param onWarning 非法字段的告警回调，默认打到 console.warn。
 */
export function resolveConfig(config: VoiceConfig | undefined | null, onWarning: (message: string) => void = defaultWarn): ResolvedVoiceConfig {
  const cfg = config ?? {}
  const ttsEngine: TtsEngine =
    cfg.ttsEngine === 'openai' || cfg.ttsEngine === 'siliconflow' || cfg.ttsEngine === 'custom'
      ? cfg.ttsEngine
      : 'edge'
  const ttsPreset = ttsEngine === 'openai' || ttsEngine === 'siliconflow' ? TTS_PRESETS[ttsEngine] : undefined
  const ttsBaseUrl = (typeof cfg.ttsBaseUrl === 'string' && cfg.ttsBaseUrl.trim() !== '' ? cfg.ttsBaseUrl.trim() : ttsPreset?.baseUrl ?? '').replace(/\/$/, '')
  const ttsModel = typeof cfg.ttsModel === 'string' && cfg.ttsModel.trim() !== '' ? cfg.ttsModel.trim() : ttsPreset?.model ?? ''
  const ttsApiKey = resolveTtsApiKey(cfg)

  const ttsVoice = typeof cfg.ttsVoice === 'string' && cfg.ttsVoice.trim() !== '' ? cfg.ttsVoice.trim() : 'zh-CN-XiaoxiaoNeural'
  const ttsRate = typeof cfg.ttsRate === 'string' && cfg.ttsRate.trim() !== '' ? cfg.ttsRate.trim() : '+0%'
  if (typeof cfg.ttsRate === 'string' && cfg.ttsRate.trim() !== '' && !isValidProsody(ttsRate)) {
    onWarning('ttsRate 配置不合法（格式如 +0%、+15%、-10%），当前值：' + ttsRate)
  }
  const ttsPitch = typeof cfg.ttsPitch === 'string' && cfg.ttsPitch.trim() !== '' ? cfg.ttsPitch.trim() : '+0Hz'
  if (typeof cfg.ttsPitch === 'string' && cfg.ttsPitch.trim() !== '' && !isValidProsody(ttsPitch)) {
    onWarning('ttsPitch 配置不合法（格式如 +0Hz、+2Hz、-1st），当前值：' + ttsPitch)
  }

  const asrEngine: AsrEngine =
    cfg.asrEngine === 'openai' || cfg.asrEngine === 'siliconflow' || cfg.asrEngine === 'custom'
      ? cfg.asrEngine
      : 'groq'
  const asrPreset = asrEngine === 'custom' ? undefined : ASR_PRESETS[asrEngine]
  const asrBaseUrl = (typeof cfg.asrBaseUrl === 'string' && cfg.asrBaseUrl.trim() !== '' ? cfg.asrBaseUrl.trim() : asrPreset?.baseUrl ?? '').replace(/\/$/, '')
  const asrModel = typeof cfg.asrModel === 'string' && cfg.asrModel.trim() !== '' ? cfg.asrModel.trim() : asrPreset?.model ?? ''
  const asrApiKey = resolveAsrApiKey(cfg)

  let proxyUrl = typeof cfg.proxyUrl === 'string' && cfg.proxyUrl.trim() !== '' ? cfg.proxyUrl.trim() : ''
  if (proxyUrl !== '' && !/^(https?|socks5h?):\/\//i.test(proxyUrl)) {
    onWarning('proxyUrl 配置不合法（必须以 http(s):// 或 socks5(h):// 开头，例如 http://127.0.0.1:7890 或 socks5://127.0.0.1:7890），已忽略该项，其余配置继续生效：' + proxyUrl)
    proxyUrl = ''
  }

  let timeoutMs = 60000
  if (cfg.timeoutMs !== undefined) {
    if (typeof cfg.timeoutMs !== 'number' || !Number.isFinite(cfg.timeoutMs) || cfg.timeoutMs <= 0) {
      onWarning('timeoutMs 配置不合法（必须是大于 0 的数字，毫秒），已回退默认值 60000。')
    } else {
      timeoutMs = Math.min(10 * 60 * 1000, Math.max(5000, Math.round(cfg.timeoutMs)))
    }
  }
  const overwrite = cfg.overwrite === true
  const customVoices = parseCustomVoices(cfg.customVoices, onWarning)
  const pronunciations = parsePronunciations(cfg.pronunciations, onWarning)
  return {
    ttsEngine,
    ttsBaseUrl,
    ttsApiKey,
    ttsModel,
    ttsVoice,
    ttsRate,
    ttsPitch,
    asrEngine,
    asrBaseUrl,
    asrApiKey,
    asrModel,
    proxyUrl,
    timeoutMs,
    overwrite,
    customVoices,
    pronunciations,
  }
}
