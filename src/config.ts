/**
 * dsh-voice 配置解析：TTS 默认音色与语速、ASR 引擎与密钥、代理。
 *
 * @module dsh-voice/config
 */

/** 插件行配置（cordis.patch.yml 里的 config 段，可缺省）。 */
export interface VoiceConfig {
  ttsVoice?: string
  ttsRate?: string
  ttsPitch?: string
  asrEngine?: 'groq' | 'openai' | 'custom'
  asrBaseUrl?: string
  asrApiKey?: string
  asrModel?: string
  proxyUrl?: string
  timeoutMs?: number
  overwrite?: boolean
}

/** 解析后的配置。 */
export interface ResolvedVoiceConfig {
  ttsVoice: string
  ttsRate: string
  ttsPitch: string
  asrEngine: 'groq' | 'openai' | 'custom'
  asrBaseUrl: string
  asrApiKey: string
  asrModel: string
  proxyUrl: string
  timeoutMs: number
  overwrite: boolean
}

const ENGINE_PRESETS: Record<'groq' | 'openai', { baseUrl: string; model: string }> = {
  groq: { baseUrl: 'https://api.groq.com/openai/v1', model: 'whisper-large-v3-turbo' },
  openai: { baseUrl: 'https://api.openai.com/v1', model: 'whisper-1' },
}

/** ASR 密钥：配置优先，其次环境变量 DSH_VOICE_ASR_KEY。 */
export function resolveAsrApiKey(config: VoiceConfig | undefined, env: NodeJS.ProcessEnv = process.env): string {
  const cfg = config ?? {}
  if (typeof cfg.asrApiKey === 'string' && cfg.asrApiKey.trim() !== '') return cfg.asrApiKey.trim()
  return env.DSH_VOICE_ASR_KEY?.trim() ?? ''
}

/**
 * 解析并校验配置。
 */
export function resolveConfig(config: VoiceConfig | undefined | null): ResolvedVoiceConfig {
  const cfg = config ?? {}
  const ttsVoice = typeof cfg.ttsVoice === 'string' && cfg.ttsVoice.trim() !== '' ? cfg.ttsVoice.trim() : 'zh-CN-XiaoxiaoNeural'
  const ttsRate = typeof cfg.ttsRate === 'string' && cfg.ttsRate.trim() !== '' ? cfg.ttsRate.trim() : '+0%'
  const ttsPitch = typeof cfg.ttsPitch === 'string' && cfg.ttsPitch.trim() !== '' ? cfg.ttsPitch.trim() : '+0Hz'
  const asrEngine = cfg.asrEngine === 'openai' ? 'openai' : cfg.asrEngine === 'custom' ? 'custom' : 'groq'
  const preset = asrEngine === 'custom' ? undefined : ENGINE_PRESETS[asrEngine]
  const asrBaseUrl = (typeof cfg.asrBaseUrl === 'string' && cfg.asrBaseUrl.trim() !== '' ? cfg.asrBaseUrl.trim() : preset?.baseUrl ?? '').replace(/\/$/, '')
  const asrModel = typeof cfg.asrModel === 'string' && cfg.asrModel.trim() !== '' ? cfg.asrModel.trim() : preset?.model ?? ''
  const asrApiKey = resolveAsrApiKey(cfg)
  const proxyUrl = (typeof cfg.proxyUrl === 'string' && cfg.proxyUrl.trim() !== '' ? cfg.proxyUrl.trim() : '')
  if (proxyUrl !== '' && !/^https?:\/\//i.test(proxyUrl)) throw new Error('proxyUrl 必须是 http(s):// 开头的地址，例如 http://127.0.0.1:7890。')
  let timeoutMs = 60000
  if (cfg.timeoutMs !== undefined) {
    if (typeof cfg.timeoutMs !== 'number' || !Number.isFinite(cfg.timeoutMs) || cfg.timeoutMs <= 0) throw new Error('timeoutMs 必须是大于 0 的数字（毫秒）。')
    timeoutMs = Math.min(10 * 60 * 1000, Math.max(5000, Math.round(cfg.timeoutMs)))
  }
  const overwrite = cfg.overwrite === true
  return { ttsVoice, ttsRate, ttsPitch, asrEngine, asrBaseUrl, asrApiKey, asrModel, proxyUrl, timeoutMs, overwrite }
}
