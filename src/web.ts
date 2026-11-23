/**
 * 本地受鉴权 Voice Studio 后端路由：复用宿主 connection/webServer 载体，提供音色列表、即时试听、
 * 8 秒录音直出克隆角色、多角色对话合成、工作区成品库、麦克风转写与安全配置更新。
 * 绝不向前端返回 asrApiKey / ttsApiKey / proxyUrl 等敏感凭据原文。
 *
 * @module dsh-voice/web
 */
import type { IncomingMessage, ServerResponse } from 'node:http'
import { EventEmitter } from 'node:events'
import { lstatSync, readdirSync, readFileSync, realpathSync, statSync } from 'node:fs'
import { basename, dirname, extname, isAbsolute, join, relative, resolve, sep } from 'node:path'
import { Readable } from 'node:stream'
import {
  isLoopbackBaseUrl,
  isValidProsody,
  resolveCustomVoice,
  type AsrEngine,
  type CustomVoiceAlias,
  type ResolvedVoiceConfig,
  type TtsEngine,
} from './config.js'
import {
  fetchEdgeVoices,
  synthesizeSpeech,
  synthesizeSpeechWithMetadata,
  type SubtitleCue,
} from './edge-tts.js'
import { rateToSpeed, synthesizeOpenAiSpeech, type ReferenceVoiceSample } from './openai-tts.js'
import {
  assertAudioFile,
  ensureWorkspaceDirectory,
  resolveOutputPath,
  writeWorkspaceFile,
} from './paths.js'
import { createProxyFetch } from './proxy-fetch.js'
import { hasFfmpeg, transcribe } from './stt.js'
import { DEFAULT_PREVIEW_TEXT } from './tools.js'
import {
  applyPronunciationsPlain,
  concatMp3Buffers,
  createSilenceMp3,
  formatSubtitles,
  inspectMp3Buffer,
  mixAudioWithBgm,
  normalizeAudioLoudness,
  offsetCues,
  parseSubtitleFile,
  splitInlinePauses,
  stripInlinePauses,
} from './tts-text.js'
import { filterVoices, isValidVoiceId, resolvePersona, VOICE_PERSONAS, VOICES } from './voices.js'
import { resolveVoiceWish } from './wish.js'

export const VOICE_STUDIO_SETTINGS_ROUTE = '/_dsh/dsh-voice/studio'
export const VOICE_STUDIO_API_ROUTE = '/api/dsh-voice/studio'

const AUTHENTICATED_CARRIER = Symbol('DSH authenticated Voice Studio connection')
const MAX_AUDIO_BYTES = 10 * 1024 * 1024
const MAX_MEDIA_BYTES = 15 * 1024 * 1024
const MAX_BODY = 16 * 1024 * 1024
const MAX_PREVIEW_CHARS = 300
const MAX_DIALOGUE_SEGMENTS = 20
const MAX_DIALOGUE_CHARS = 6000
const MAX_LIBRARY_ITEMS = 40

const ALLOWED_CLONE_EXTS = new Set(['.wav', '.mp3', '.webm', '.ogg', '.m4a'])
const LIBRARY_AUDIO_EXTS = new Set(['.mp3', '.wav', '.m4a', '.ogg', '.webm', '.flac'])
const LIBRARY_SUBDIRS = ['', 'voice_outputs', 'voice_previews', 'voice_clones'] as const

const loopback = (host: string) =>
  ['127.0.0.1', 'localhost', '::1', '[::1]', '::ffff:127.0.0.1'].includes(host.toLowerCase())

const record = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {}

const text = (args: Record<string, unknown>, key: string) =>
  typeof args[key] === 'string' ? args[key].trim() : ''

export class VoiceStudioError extends Error {
  constructor(
    message: string,
    readonly status = 400,
    readonly code = 'invalid',
  ) {
    super(message)
  }
}

export interface StudioPronunciationRule {
  word: string
  alias: string
}

export interface VoiceStudioBackendOptions {
  updateSettings?: (patch: Record<string, unknown>) => Promise<void>
  writable?: () => boolean
  workspaceDir?: string | (() => string)
  tts?: typeof synthesizeSpeech
  ttsWithMeta?: typeof synthesizeSpeechWithMetadata
  openaiTts?: typeof synthesizeOpenAiSpeech
  fetchVoices?: typeof fetchEdgeVoices
  stt?: typeof transcribe
}

function resolveWorkspaceRoot(cwd: string): string {
  const absolute = resolve(cwd)
  try {
    return realpathSync(absolute)
  } catch {
    return absolute
  }
}

function isInsideRoot(root: string, candidate: string): boolean {
  const rel = relative(root, candidate)
  return rel === '' || (!isAbsolute(rel) && rel !== '..' && !rel.startsWith('..' + sep))
}

function toWorkspaceRelativePath(filePath: string, cwd: string): string {
  const root = resolveWorkspaceRoot(cwd)
  let realTarget = resolve(root, filePath)
  try {
    realTarget = realpathSync(realTarget)
  } catch {
    // 保留基于 root 解析的目标路径
  }
  return relative(root, realTarget).replace(/\\/g, '/')
}

function audioMimeFromExt(ext: string): string {
  switch (ext.toLowerCase()) {
    case '.mp3':
      return 'audio/mpeg'
    case '.wav':
      return 'audio/wav'
    case '.m4a':
      return 'audio/mp4'
    case '.ogg':
      return 'audio/ogg'
    case '.webm':
      return 'audio/webm'
    case '.flac':
      return 'audio/flac'
    default:
      return 'application/octet-stream'
  }
}

function decodeAudioBase64(raw: unknown, label = '录音音频'): Buffer {
  const rawB64 = typeof raw === 'string' ? raw.trim() : ''
  const cleanedB64 = rawB64.replace(/^data:[^;]+;base64,/i, '')
  if (!cleanedB64) {
    throw new VoiceStudioError(`请提供${label}数据（audioBase64）。`, 400)
  }
  const audioBuf = Buffer.from(cleanedB64, 'base64')
  if (audioBuf.length === 0) {
    throw new VoiceStudioError(`${label}数据为空或格式无效。`, 400)
  }
  if (audioBuf.length > MAX_AUDIO_BYTES) {
    throw new VoiceStudioError(`${label}超过 10 MiB 上限。`, 413, 'bodyLarge')
  }
  return audioBuf
}

function requestGuard(req: IncomingMessage): void {
  const host = req.headers.host
  if (!host || !loopback(req.socket.remoteAddress ?? '')) {
    throw new VoiceStudioError('Voice Studio 面板仅允许本机访问。', 403, 'local_only')
  }
  let target: URL
  try {
    target = new URL('http://' + host)
  } catch {
    throw new VoiceStudioError('无效的请求地址。', 403)
  }
  if (!loopback(target.hostname) || target.username || target.password || target.pathname !== '/' || target.search || target.hash) {
    throw new VoiceStudioError('Voice Studio 面板仅允许本机访问。', 403, 'local_only')
  }
  const protocol = (req.socket as typeof req.socket & { encrypted?: boolean }).encrypted ? 'https:' : 'http:'
  target.protocol = protocol
  const origin = req.headers.origin
  const desktop = origin === 'dsh-app://app' && req.headers['x-dsh-voice'] === '1'
  if (!desktop && ((req.method === 'POST' && !origin) || (origin !== undefined && origin !== target.origin))) {
    throw new VoiceStudioError('请从当前 DSH 设置页面操作。', 403, 'origin')
  }
  if (req.method === 'POST' && !/^application\/json(?:\s*;|$)/i.test(req.headers['content-type'] ?? '')) {
    throw new VoiceStudioError('请求必须使用 JSON。', 415)
  }
}

/** 宿主载体受鉴权后仍校验来源、方法与请求头标记，防止跨站请求。 */
function carrierGuard(request: Request): void {
  if (!['GET', 'POST'].includes(request.method)) {
    throw new VoiceStudioError('仅支持 GET 和 POST。', 405, 'method')
  }
  if (request.headers.get('x-dsh-voice') !== '1') {
    throw new VoiceStudioError('请从当前 DSH 设置页面操作。', 403, 'origin')
  }
  const origin = request.headers.get('origin')
  const desktop = origin === 'dsh-app://app'
  const site = request.headers.get('sec-fetch-site')
  if (site && !['same-origin', 'none'].includes(site) && !desktop) {
    throw new VoiceStudioError('请从当前 DSH 设置页面操作。', 403, 'origin')
  }
  if (origin && !desktop) {
    try {
      const source = new URL(origin)
      const expectedHost = request.headers.get('host') || new URL(request.url).host
      if (
        !['http:', 'https:'].includes(source.protocol) ||
        source.username ||
        source.password ||
        source.origin !== origin ||
        source.host !== expectedHost
      ) {
        throw new Error('origin mismatch')
      }
    } catch {
      throw new VoiceStudioError('请从当前 DSH 设置页面操作。', 403, 'origin')
    }
  }
  if (
    request.method === 'POST' &&
    request.headers.get('content-type')?.split(';')[0].trim().toLowerCase() !== 'application/json'
  ) {
    throw new VoiceStudioError('请求必须使用 JSON。', 415)
  }
}

function readBody(req: IncomingMessage, signal: AbortSignal): Promise<Record<string, unknown>> {
  return new Promise((resolvePromise, reject) => {
    let length = 0
    const chunks: Buffer[] = []
    const cleanup = () => {
      req.off('data', data)
      req.off('end', end)
      req.off('error', error)
      signal.removeEventListener('abort', abort)
    }
    const fail = (reason: unknown) => {
      cleanup()
      reject(reason)
    }
    const data = (chunk: Buffer) => {
      length += chunk.length
      if (length > MAX_BODY) {
        chunks.length = 0
        fail(new VoiceStudioError('请求体超过 16 MiB 上限。', 413, 'bodyLarge'))
        req.resume()
      } else {
        chunks.push(chunk)
      }
    }
    const error = (reason: Error) => fail(reason)
    const abort = () => fail(signal.reason)
    const end = () => {
      cleanup()
      try {
        const value = JSON.parse(Buffer.concat(chunks).toString('utf8'))
        if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error()
        resolvePromise(value as Record<string, unknown>)
      } catch {
        reject(new VoiceStudioError('请求内容不是有效的 JSON。'))
      }
    }
    if (signal.aborted) {
      abort()
      return
    }
    req.on('data', data)
    req.on('end', end)
    req.on('error', error)
    signal.addEventListener('abort', abort, { once: true })
  })
}

function readPronunciations(cfg: ResolvedVoiceConfig): StudioPronunciationRule[] {
  const raw: unknown = (cfg as { pronunciations?: unknown }).pronunciations
  if (!Array.isArray(raw)) return []
  const out: StudioPronunciationRule[] = []
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue
    const rec = item as Record<string, unknown>
    const word = typeof rec.word === 'string' ? rec.word.trim() : ''
    const alias = typeof rec.alias === 'string' ? rec.alias.trim() : ''
    if (word !== '' && alias !== '') out.push({ word, alias })
  }
  return out
}

function sanitizeCustomVoicesPatch(raw: unknown): CustomVoiceAlias[] {
  if (!Array.isArray(raw)) {
    throw new VoiceStudioError('customVoices 必须是数组。', 400)
  }
  const out: CustomVoiceAlias[] = []
  for (let i = 0; i < raw.length; i++) {
    const item = record(raw[i])
    const name = text(item, 'name')
    if (!name) {
      throw new VoiceStudioError(`customVoices[${i}].name 不能为空。`, 400)
    }
    const entry: CustomVoiceAlias = { name }
    const voice = text(item, 'voice')
    if (voice) entry.voice = voice
    const persona = text(item, 'persona')
    if (persona) entry.persona = persona
    const rate = text(item, 'rate')
    if (rate) {
      if (!isValidProsody(rate)) {
        throw new VoiceStudioError(`customVoices[${i}].rate 格式不合法（如 +0%、+15%、-10%）。`, 400)
      }
      entry.rate = rate
    }
    const pitch = text(item, 'pitch')
    if (pitch) {
      if (!isValidProsody(pitch)) {
        throw new VoiceStudioError(`customVoices[${i}].pitch 格式不合法（如 +0Hz、+2Hz、-1st）。`, 400)
      }
      entry.pitch = pitch
    }
    const instructions = text(item, 'instructions')
    if (instructions) entry.instructions = instructions
    const referenceAudio = text(item, 'referenceAudio')
    if (referenceAudio) entry.referenceAudio = referenceAudio
    const referenceText = text(item, 'referenceText')
    if (referenceText) entry.referenceText = referenceText
    out.push(entry)
  }
  return out
}

function sanitizePronunciationsPatch(raw: unknown): StudioPronunciationRule[] {
  if (!Array.isArray(raw)) {
    throw new VoiceStudioError('pronunciations 必须是数组。', 400)
  }
  const out: StudioPronunciationRule[] = []
  const seen = new Set<string>()
  for (let i = 0; i < raw.length; i++) {
    const item = record(raw[i])
    const word = text(item, 'word')
    const alias = text(item, 'alias')
    if (!word || !alias) {
      throw new VoiceStudioError(`pronunciations[${i}] 的 word 与 alias 均不能为空。`, 400)
    }
    const key = word.toLowerCase()
    if (!seen.has(key)) {
      seen.add(key)
      out.push({ word, alias })
    }
  }
  return out
}

function sanitizeConfigPatch(rawPatch: unknown): Record<string, unknown> {
  const raw = record(rawPatch)
  const sanitized: Record<string, unknown> = {}

  if ('ttsVoice' in raw) {
    const ttsVoice = text(raw, 'ttsVoice')
    if (!ttsVoice) throw new VoiceStudioError('ttsVoice 不能为空。', 400)
    sanitized.ttsVoice = ttsVoice
  }
  if ('ttsRate' in raw) {
    const ttsRate = text(raw, 'ttsRate')
    if (!isValidProsody(ttsRate)) {
      throw new VoiceStudioError('ttsRate 格式不合法（如 +0%、+15%、-10%）。', 400)
    }
    sanitized.ttsRate = ttsRate
  }
  if ('ttsPitch' in raw) {
    const ttsPitch = text(raw, 'ttsPitch')
    if (!isValidProsody(ttsPitch)) {
      throw new VoiceStudioError('ttsPitch 格式不合法（如 +0Hz、+2Hz、-1st）。', 400)
    }
    sanitized.ttsPitch = ttsPitch
  }
  if ('ttsEngine' in raw) {
    const ttsEngine = text(raw, 'ttsEngine') as TtsEngine
    if (!['edge', 'openai', 'siliconflow', 'custom'].includes(ttsEngine)) {
      throw new VoiceStudioError('ttsEngine 不合法。', 400)
    }
    sanitized.ttsEngine = ttsEngine
  }
  if ('asrEngine' in raw) {
    const asrEngine = text(raw, 'asrEngine') as AsrEngine
    if (!['groq', 'openai', 'siliconflow', 'custom'].includes(asrEngine)) {
      throw new VoiceStudioError('asrEngine 不合法。', 400)
    }
    sanitized.asrEngine = asrEngine
  }
  if ('overwrite' in raw) {
    if (typeof raw.overwrite !== 'boolean') {
      throw new VoiceStudioError('overwrite 必须是布尔值。', 400)
    }
    sanitized.overwrite = raw.overwrite
  }
  if ('customVoices' in raw) {
    sanitized.customVoices = sanitizeCustomVoicesPatch(raw.customVoices)
  }
  if ('pronunciations' in raw) {
    sanitized.pronunciations = sanitizePronunciationsPatch(raw.pronunciations)
  }

  if (Object.keys(sanitized).length === 0) {
    throw new VoiceStudioError('未提供可保存的有效配置项。', 400)
  }
  return sanitized
}

interface ResolvedStudioVoice {
  voice: string
  displayVoice: string
  rate: string
  pitch: string
  pauseMs: number
  instructions?: string
  references?: ReferenceVoiceSample[]
}

export function createVoiceStudioBackend(
  readCfg: () => ResolvedVoiceConfig,
  options: VoiceStudioBackendOptions = {},
) {
  let cachedProxyUrl = ''
  let cachedFetchImpl: ReturnType<typeof createProxyFetch> | undefined
  const getProxyFetch = (proxyUrl: string) => {
    if (proxyUrl === '') return undefined
    if (cachedFetchImpl === undefined || cachedProxyUrl !== proxyUrl) {
      cachedProxyUrl = proxyUrl
      cachedFetchImpl = createProxyFetch(proxyUrl)
    }
    return cachedFetchImpl
  }

  const getWorkspaceDir = (): string => {
    const raw = typeof options.workspaceDir === 'function' ? options.workspaceDir() : options.workspaceDir
    return typeof raw === 'string' && raw.trim() !== '' ? raw.trim() : process.cwd()
  }

  const writable = () =>
    options.writable !== undefined ? options.writable() !== false : typeof options.updateSettings === 'function'

  const resolveUseEdge = (cfg: ResolvedVoiceConfig): boolean =>
    options.tts !== undefined || options.ttsWithMeta !== undefined
      ? true
      : options.openaiTts !== undefined && cfg.ttsEngine !== 'edge'
        ? false
        : cfg.ttsEngine === 'edge'

  const resolveStudioVoice = (
    cfg: ResolvedVoiceConfig,
    useEdge: boolean,
    cwd: string,
    input: {
      voice?: string
      persona?: string
      speakerAlias?: string
      rate?: string
      pitch?: string
      pauseMs?: number
      instructions?: string
    },
    refAudioCache?: Map<string, Buffer>,
  ): ResolvedStudioVoice => {
    const rawVoice = input.voice
    const rawPersona = input.persona

    let customAlias: CustomVoiceAlias | undefined
    let voiceConsumedAsAlias = false
    let personaConsumedAsAlias = false

    if (rawPersona !== undefined) {
      customAlias = resolveCustomVoice(cfg.customVoices, rawPersona)
      if (customAlias !== undefined) personaConsumedAsAlias = true
    }
    if (customAlias === undefined && rawVoice !== undefined) {
      customAlias = resolveCustomVoice(cfg.customVoices, rawVoice)
      if (customAlias !== undefined) voiceConsumedAsAlias = true
    }
    if (
      customAlias === undefined &&
      rawVoice === undefined &&
      rawPersona === undefined &&
      input.speakerAlias !== undefined
    ) {
      customAlias = resolveCustomVoice(cfg.customVoices, input.speakerAlias)
    }

    let defaultAlias: CustomVoiceAlias | undefined
    if (rawVoice === undefined && rawPersona === undefined && customAlias === undefined) {
      defaultAlias = resolveCustomVoice(cfg.customVoices, cfg.ttsVoice)
    }
    const activeAlias = customAlias ?? defaultAlias

    let voiceConsumedAsPersona = false
    let personaWishVoice: string | undefined
    let voiceWishVoice: string | undefined
    let personaSpec = !personaConsumedAsAlias && rawPersona !== undefined ? resolvePersona(rawPersona) : undefined
    if (personaSpec === undefined && !personaConsumedAsAlias && rawPersona !== undefined) {
      const wish = resolveVoiceWish(rawPersona, cfg.customVoices)
      if (wish?.kind === 'persona' && wish.persona !== undefined) {
        personaSpec = wish.persona
      } else if (wish?.kind === 'voice' && wish.voice !== undefined) {
        personaWishVoice = wish.voice
      }
    }
    if (personaSpec === undefined && activeAlias?.persona !== undefined) {
      personaSpec = resolvePersona(activeAlias.persona)
      if (personaSpec === undefined) {
        const aliasWish = resolveVoiceWish(activeAlias.persona, cfg.customVoices)
        if (aliasWish?.kind === 'persona' && aliasWish.persona !== undefined) {
          personaSpec = aliasWish.persona
        } else if (aliasWish?.kind === 'voice' && aliasWish.voice !== undefined && personaWishVoice === undefined) {
          personaWishVoice = aliasWish.voice
        }
      }
    }
    if (personaSpec === undefined && !voiceConsumedAsAlias && rawVoice !== undefined && !isValidVoiceId(rawVoice)) {
      personaSpec = resolvePersona(rawVoice)
      if (personaSpec !== undefined) {
        voiceConsumedAsPersona = true
      } else {
        const wish = resolveVoiceWish(rawVoice, cfg.customVoices)
        if (wish?.kind === 'persona' && wish.persona !== undefined) {
          personaSpec = wish.persona
          voiceConsumedAsPersona = true
        } else if (wish?.kind === 'voice' && wish.voice !== undefined) {
          voiceWishVoice = wish.voice
        }
      }
    }

    let defaultPersona: ReturnType<typeof resolvePersona>
    let defaultWishVoice: string | undefined
    if (
      rawVoice === undefined &&
      rawPersona === undefined &&
      activeAlias === undefined &&
      !isValidVoiceId(cfg.ttsVoice)
    ) {
      defaultPersona = resolvePersona(cfg.ttsVoice)
      if (defaultPersona === undefined) {
        const cfgWish = resolveVoiceWish(cfg.ttsVoice, cfg.customVoices)
        if (cfgWish?.kind === 'persona' && cfgWish.persona !== undefined) {
          defaultPersona = cfgWish.persona
        } else if (cfgWish?.kind === 'voice' && cfgWish.voice !== undefined) {
          defaultWishVoice = cfgWish.voice
        }
      }
    }
    const activePersona = personaSpec ?? defaultPersona

    let references: ReferenceVoiceSample[] | undefined
    if (!useEdge && activeAlias?.referenceAudio) {
      const refPath = assertAudioFile(activeAlias.referenceAudio, cwd)
      let buf = refAudioCache?.get(refPath)
      if (buf === undefined) {
        const size = statSync(refPath).size
        if (size <= 0 || size > MAX_AUDIO_BYTES) {
          throw new VoiceStudioError('参考音频大小异常（必须为 1B 至 10MiB）：' + activeAlias.referenceAudio, 400)
        }
        buf = readFileSync(refPath)
        refAudioCache?.set(refPath, buf)
      }
      references = [
        {
          audioDataUri: 'data:' + audioMimeFromExt(extname(refPath)) + ';base64,' + buf.toString('base64'),
          rawAudio: buf,
          filename: basename(refPath),
          ...(activeAlias.referenceText ? { text: activeAlias.referenceText } : {}),
        },
      ]
    }

    const explicitRawVoice = !voiceConsumedAsAlias && !voiceConsumedAsPersona ? (voiceWishVoice ?? rawVoice) : undefined
    const resolvedVoice =
      !useEdge && references !== undefined && explicitRawVoice === undefined
        ? (activeAlias?.voice ?? '')
        : (explicitRawVoice ?? activeAlias?.voice ?? personaWishVoice ?? activePersona?.voice ?? defaultWishVoice ?? cfg.ttsVoice)
    const displayVoice = resolvedVoice || activeAlias?.name || cfg.ttsVoice
    const resolvedRate = input.rate ?? activeAlias?.rate ?? activePersona?.rate ?? cfg.ttsRate
    const resolvedPitch = input.pitch ?? activeAlias?.pitch ?? activePersona?.pitch ?? cfg.ttsPitch
    const resolvedInstructions = input.instructions ?? activeAlias?.instructions
    const defaultPause = activePersona?.pauseMs ?? 300
    const rawPause = input.pauseMs !== undefined && Number.isFinite(input.pauseMs) ? input.pauseMs : defaultPause
    const resolvedPauseMs = Math.min(5000, Math.max(0, Math.round(rawPause)))

    if (!isValidProsody(resolvedRate)) {
      throw new VoiceStudioError('语速格式不合法（如 +0%、+15%、-10%）。', 400)
    }
    if (!isValidProsody(resolvedPitch)) {
      throw new VoiceStudioError('音调格式不合法（如 +0Hz、+2Hz、-1st）。', 400)
    }

    return {
      voice: resolvedVoice,
      displayVoice,
      rate: resolvedRate,
      pitch: resolvedPitch,
      pauseMs: resolvedPauseMs,
      ...(resolvedInstructions ? { instructions: resolvedInstructions } : {}),
      ...(references ? { references } : {}),
    }
  }

  const synthesizeSegmentWithCues = async (
    cfg: ResolvedVoiceConfig,
    useEdge: boolean,
    segText: string,
    spec: ResolvedStudioVoice,
    pronunciations: readonly StudioPronunciationRule[],
    signal: AbortSignal,
  ): Promise<{ audio: Buffer; info: ReturnType<typeof inspectMp3Buffer>; cues: SubtitleCue[] }> => {
    const cleanCueText = stripInlinePauses(segText)
    const fallbackCues = (durationMs: number): SubtitleCue[] =>
      cleanCueText !== '' ? [{ index: 1, startMs: 0, endMs: Math.max(1, durationMs), text: cleanCueText }] : []

    if (useEdge) {
      if (!isValidVoiceId(spec.voice)) {
        throw new VoiceStudioError('音色 ID 不合法：' + spec.voice, 400)
      }
      const pronOpt = pronunciations.length > 0 ? { pronunciations } : {}
      if (options.ttsWithMeta !== undefined || options.tts === undefined) {
        const withMeta = options.ttsWithMeta ?? synthesizeSpeechWithMetadata
        const res = await withMeta(
          {
            text: segText,
            voice: spec.voice,
            rate: spec.rate,
            pitch: spec.pitch,
            boundary: 'sentence',
            ...pronOpt,
          },
          { proxyUrl: cfg.proxyUrl },
          cfg.timeoutMs,
          signal,
        )
        const info = inspectMp3Buffer(res.audio)
        const cues: SubtitleCue[] = res.cues.length > 0 ? res.cues : fallbackCues(info.durationMs)
        return { audio: res.audio, info, cues }
      }

      const audio = await options.tts(
        {
          text: segText,
          voice: spec.voice,
          rate: spec.rate,
          pitch: spec.pitch,
          ...pronOpt,
        },
        { proxyUrl: cfg.proxyUrl },
        cfg.timeoutMs,
        signal,
      )
      const info = inspectMp3Buffer(audio)
      return {
        audio,
        info,
        cues: fallbackCues(info.durationMs),
      }
    }

    if (cfg.ttsBaseUrl === '') {
      throw new VoiceStudioError('未配置 TTS 接口地址（ttsBaseUrl）。', 400, 'config')
    }
    if (cfg.ttsApiKey === '' && !isLoopbackBaseUrl(cfg.ttsBaseUrl)) {
      throw new VoiceStudioError('未配置 TTS 密钥（ttsApiKey）。', 400, 'config')
    }
    const hasRefs = Array.isArray(spec.references) && spec.references.length > 0
    if (spec.voice.trim() === '' && !hasRefs) {
      throw new VoiceStudioError('音色 ID 不能为空。', 400)
    }
    const openaiFn = options.openaiTts ?? synthesizeOpenAiSpeech
    const runOpenAiPiece = (rawPieceText: string) => {
      const spokenText = pronunciations.length > 0 ? applyPronunciationsPlain(rawPieceText, pronunciations) : rawPieceText
      return openaiFn(
        cfg.ttsBaseUrl,
        cfg.ttsApiKey,
        {
          text: spokenText,
          voice: spec.voice,
          model: cfg.ttsModel !== '' ? cfg.ttsModel : 'gpt-4o-mini-tts',
          speed: rateToSpeed(spec.rate),
          ...(spec.instructions ? { instructions: spec.instructions } : {}),
          ...(hasRefs ? { references: spec.references } : {}),
          signal,
        },
        getProxyFetch(cfg.proxyUrl) ?? globalThis.fetch,
        cfg.timeoutMs,
        signal,
      )
    }

    const pieces = splitInlinePauses(segText)
    let audio: Buffer
    const pieceCues: SubtitleCue[] = []
    if (pieces.some((p) => p.kind === 'pause')) {
      const textPieces = pieces.filter((p): p is { kind: 'text'; text: string } => p.kind === 'text' && p.text.trim() !== '')
      if (textPieces.length === 0) {
        const totalPauseMs = pieces.reduce((sum, p) => sum + (p.kind === 'pause' ? p.durationMs : 0), 0)
        audio = createSilenceMp3(Math.max(50, totalPauseMs), 24000)
      } else {
        const synthesizedByIndex = new Map<number, Buffer>()
        let detectedSampleRate = 24000
        for (let i = 0; i < pieces.length; i++) {
          const piece = pieces[i]
          if (piece.kind !== 'text' || piece.text.trim() === '') continue
          signal?.throwIfAborted()
          const partAudio = await runOpenAiPiece(piece.text)
          signal?.throwIfAborted()
          const partInfo = inspectMp3Buffer(partAudio)
          if (partInfo.frameCount > 0) detectedSampleRate = partInfo.sampleRate
          synthesizedByIndex.set(i, partAudio)
        }
        const partBuffers: Buffer[] = []
        let offsetMs = 0
        for (let i = 0; i < pieces.length; i++) {
          const piece = pieces[i]
          if (piece.kind === 'pause') {
            const sil = createSilenceMp3(piece.durationMs, detectedSampleRate)
            if (sil.length > 0) {
              partBuffers.push(sil)
              offsetMs += inspectMp3Buffer(sil).durationMs
            }
          } else {
            const partAudio = synthesizedByIndex.get(i)
            if (partAudio !== undefined && partAudio.length > 0) {
              partBuffers.push(partAudio)
              const partDurationMs = Math.max(1, inspectMp3Buffer(partAudio).durationMs)
              pieceCues.push({
                index: pieceCues.length + 1,
                startMs: offsetMs,
                endMs: offsetMs + partDurationMs,
                text: piece.text,
              })
              offsetMs += partDurationMs
            }
          }
        }
        audio = partBuffers.length === 1 ? partBuffers[0] : concatMp3Buffers(partBuffers)
      }
    } else {
      audio = await runOpenAiPiece(segText)
    }
    const info = inspectMp3Buffer(audio)
    return {
      audio,
      info,
      cues: pieceCues.length > 0 ? pieceCues : fallbackCues(info.durationMs),
    }
  }

  const snapshot = () => {
    const cfg = readCfg()
    const pronunciations = readPronunciations(cfg)
    const hasTtsKey = cfg.ttsApiKey !== ''
    const hasAsrKey =
      cfg.asrApiKey !== '' || (cfg.asrEngine === 'custom' && cfg.asrBaseUrl !== '' && isLoopbackBaseUrl(cfg.asrBaseUrl))
    const hasProxy = cfg.proxyUrl !== ''
    const ttsReady =
      cfg.ttsEngine === 'edge' ||
      (cfg.ttsBaseUrl !== '' && (cfg.ttsApiKey !== '' || isLoopbackBaseUrl(cfg.ttsBaseUrl)))
    const sttReady = cfg.asrBaseUrl !== '' && hasAsrKey

    return {
      ttsEngine: cfg.ttsEngine,
      ttsVoice: cfg.ttsVoice,
      ttsRate: cfg.ttsRate,
      ttsPitch: cfg.ttsPitch,
      ttsModel: cfg.ttsModel,
      hasTtsKey,
      asrEngine: cfg.asrEngine,
      asrModel: cfg.asrModel,
      hasAsrKey,
      hasProxy,
      overwrite: cfg.overwrite,
      customVoices: cfg.customVoices,
      pronunciations,
      voices: VOICES,
      personas: VOICE_PERSONAS,
      writable: writable(),
      hasFfmpeg: hasFfmpeg(),
      ttsReady,
      sttReady,
    }
  }

  async function dispatch(args: Record<string, unknown>, signal: AbortSignal): Promise<Record<string, unknown>> {
    const action = text(args, 'action')
    const cfg = readCfg()

    if (action === 'voices') {
      const online = args.online === true
      const locale = text(args, 'locale') || undefined
      const gender = text(args, 'gender') || undefined
      const tag = text(args, 'tag') || undefined

      let sourceVoices = VOICES
      let source: 'builtin' | 'edge-online' | 'builtin-fallback' = 'builtin'
      let fallbackReason = ''

      if (online) {
        try {
          const fetchVoicesFn = options.fetchVoices ?? fetchEdgeVoices
          const fetched = await fetchVoicesFn(
            { fetchImpl: getProxyFetch(cfg.proxyUrl) ?? globalThis.fetch, signal },
            cfg.timeoutMs,
          )
          signal.throwIfAborted()
          if (Array.isArray(fetched) && fetched.length > 0) {
            sourceVoices = fetched
            source = 'edge-online'
          } else {
            source = 'builtin-fallback'
            fallbackReason = '在线音色目录返回为空'
          }
        } catch (error) {
          signal.throwIfAborted()
          source = 'builtin-fallback'
          fallbackReason = error instanceof Error ? error.message : String(error)
        }
      }

      const voices = locale || gender || tag ? filterVoices({ locale, gender, tag }, sourceVoices) : sourceVoices
      return {
        voices,
        source,
        ...(fallbackReason !== '' ? { fallbackReason } : {}),
      }
    }

    if (action === 'preview') {
      const rawText = typeof args.text === 'string' ? args.text.trim() : ''
      const previewText = rawText !== '' ? rawText : DEFAULT_PREVIEW_TEXT
      if (previewText.length > MAX_PREVIEW_CHARS) {
        throw new VoiceStudioError(`试听文本不能超过 ${MAX_PREVIEW_CHARS} 个字符。`, 400, 'textTooLong')
      }

      const cwd = getWorkspaceDir()
      const useEdge = resolveUseEdge(cfg)
      const spec = resolveStudioVoice(cfg, useEdge, cwd, {
        voice: text(args, 'voice') || undefined,
        persona: text(args, 'persona') || undefined,
        rate: text(args, 'rate') || undefined,
        pitch: text(args, 'pitch') || undefined,
        instructions: text(args, 'instructions') || undefined,
      })
      const pronunciations = readPronunciations(cfg)
      const { audio, info, cues } = await synthesizeSegmentWithCues(
        cfg,
        useEdge,
        previewText,
        spec,
        pronunciations,
        signal,
      )

      return {
        preview: {
          audioBase64: audio.toString('base64'),
          mime: 'audio/mpeg',
          bytes: audio.length,
          durationMs: info.durationMs,
          durationSec: Math.round(info.durationMs / 100) / 10,
          voice: spec.displayVoice,
          cues,
        },
      }
    }

    if (action === 'transcribeMic') {
      const audioBuf = decodeAudioBase64(args.audioBase64, '录音音频')

      const rawFilename = text(args, 'filename')
      const filename = (rawFilename || 'mic-recording.webm').replace(/[/\\]/g, '_')
      const language = text(args, 'language') || undefined
      const prompt = text(args, 'prompt') || undefined

      const sttFn = options.stt ?? transcribe
      const res = await sttFn(
        cfg.asrBaseUrl,
        cfg.asrApiKey,
        {
          audio: audioBuf,
          filename,
          model: cfg.asrModel !== '' ? cfg.asrModel : 'whisper-1',
          ...(language ? { language } : {}),
          ...(prompt ? { prompt } : {}),
          allowEmptyApiKey: cfg.asrEngine === 'custom' && isLoopbackBaseUrl(cfg.asrBaseUrl),
          signal,
        },
        getProxyFetch(cfg.proxyUrl) ?? globalThis.fetch,
        cfg.timeoutMs,
        signal,
      )
      return {
        transcript: {
          text: res.text,
          ...(res.language !== undefined ? { language: res.language } : {}),
          ...(res.duration !== undefined ? { duration: res.duration } : {}),
        },
      }
    }

    if (action === 'saveCloneVoice') {
      const aliasName = text(args, 'aliasName')
      if (!aliasName) {
        throw new VoiceStudioError('克隆角色名称（aliasName）不能为空。', 400)
      }
      if (aliasName.length > 64) {
        throw new VoiceStudioError('克隆角色名称不能超过 64 个字符。', 400)
      }
      if (/[/\\:\0]/.test(aliasName) || aliasName === '.' || aliasName === '..' || aliasName.includes('..')) {
        throw new VoiceStudioError('克隆角色名称包含非法路径字符。', 400, 'pathTraversal')
      }

      const rawFilename = text(args, 'filename')
      if (rawFilename && (/[/\\:\0]/.test(rawFilename) || rawFilename.includes('..'))) {
        throw new VoiceStudioError('录音文件名包含非法路径字符。', 400, 'pathTraversal')
      }

      const shouldSaveAlias = args.saveAlias !== false
      if (shouldSaveAlias && (!writable() || typeof options.updateSettings !== 'function')) {
        throw new VoiceStudioError('当前配置是只读的，无法保存克隆角色。', 403, 'readonly')
      }

      const audioBuf = decodeAudioBase64(args.audioBase64, '克隆样本音频')
      const cwd = getWorkspaceDir()
      const cloneDir = ensureWorkspaceDirectory('voice_clones', cwd)

      const rawExt = rawFilename ? extname(rawFilename).toLowerCase() : ''
      const safeExt = ALLOWED_CLONE_EXTS.has(rawExt) ? rawExt : '.webm'
      const safeSlug =
        aliasName
          .normalize('NFKC')
          .replace(/[^\p{L}\p{N}_-]+/gu, '-')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '')
          .toLowerCase()
          .slice(0, 40) || 'voice'
      const baseName = `clone-${safeSlug}${safeExt}`
      const targetPath = resolveOutputPath(join(cloneDir, baseName), '', cfg.overwrite, cwd)
      const writtenPath = writeWorkspaceFile(targetPath, audioBuf, cwd, undefined, cfg.overwrite)
      const relAudioPath = toWorkspaceRelativePath(writtenPath, cwd)

      let refText = text(args, 'referenceText')
      let transcribeWarning = ''
      if (refText === '' && args.autoTranscribe !== false) {
        const asrReady =
          options.stt !== undefined ||
          (cfg.asrBaseUrl !== '' &&
            (cfg.asrApiKey !== '' || (cfg.asrEngine === 'custom' && isLoopbackBaseUrl(cfg.asrBaseUrl))))
        if (asrReady) {
          try {
            const sttFn = options.stt ?? transcribe
            const language = text(args, 'language') || undefined
            const sttRes = await sttFn(
              cfg.asrBaseUrl,
              cfg.asrApiKey,
              {
                audio: audioBuf,
                filename: baseName,
                model: cfg.asrModel !== '' ? cfg.asrModel : 'whisper-1',
                ...(language ? { language } : {}),
                allowEmptyApiKey: cfg.asrEngine === 'custom' && isLoopbackBaseUrl(cfg.asrBaseUrl),
                signal,
              },
              getProxyFetch(cfg.proxyUrl) ?? globalThis.fetch,
              cfg.timeoutMs,
              signal,
            )
            signal.throwIfAborted()
            if (typeof sttRes?.text === 'string' && sttRes.text.trim() !== '') {
              refText = sttRes.text.trim()
            }
          } catch (error) {
            signal.throwIfAborted()
            transcribeWarning = error instanceof Error ? error.message : String(error)
          }
        }
      }

      if (shouldSaveAlias) {
        const voiceOpt = text(args, 'voice')
        const personaOpt = text(args, 'persona')
        const entry: CustomVoiceAlias = {
          name: aliasName,
          referenceAudio: relAudioPath,
          ...(refText ? { referenceText: refText } : {}),
          ...(voiceOpt ? { voice: voiceOpt } : {}),
          ...(personaOpt ? { persona: personaOpt } : {}),
        }
        const existing = Array.isArray(cfg.customVoices) ? cfg.customVoices : []
        const lower = aliasName.toLowerCase()
        const existingIdx = existing.findIndex((item) => item.name.trim().toLowerCase() === lower)
        const next =
          existingIdx >= 0
            ? existing.map((item, idx) => (idx === existingIdx ? entry : item))
            : [...existing, entry]
        await options.updateSettings!({ customVoices: next })
      }

      return {
        clone: {
          name: aliasName,
          referenceAudio: relAudioPath,
          referenceText: refText,
          bytes: audioBuf.length,
          savedAlias: shouldSaveAlias,
          ...(transcribeWarning ? { transcribeWarning } : {}),
        },
      }
    }

    if (action === 'synthesizeDialogue') {
      if (!Array.isArray(args.segments) || args.segments.length === 0) {
        throw new VoiceStudioError('请提供至少 1 段对话台词（segments）。', 400)
      }
      if (args.segments.length > MAX_DIALOGUE_SEGMENTS) {
        throw new VoiceStudioError(`单次对话合成最多支持 ${MAX_DIALOGUE_SEGMENTS} 段台词。`, 400)
      }

      const rawOutputName = text(args, 'outputName')
      if (rawOutputName && (/[/\\:\0]/.test(rawOutputName) || rawOutputName.includes('..'))) {
        throw new VoiceStudioError('输出文件名包含非法路径字符。', 400, 'pathTraversal')
      }

      const cwd = getWorkspaceDir()
      const bgmFile = text(args, 'bgmFile')
      let bgmPath: string | undefined
      if (bgmFile !== '') {
        bgmPath = assertAudioFile(bgmFile, cwd)
        if (!hasFfmpeg()) {
          throw new VoiceStudioError('使用背景音乐混音需要本机安装 ffmpeg。', 400, 'ffmpegRequired')
        }
      }

      interface DialogueSegInput {
        speaker?: string
        voice?: string
        persona?: string
        text: string
        rate?: string
        pitch?: string
        pauseMs?: number
        instructions?: string
      }

      const parsedSegments: DialogueSegInput[] = []
      let totalChars = 0
      for (let i = 0; i < args.segments.length; i++) {
        const seg = record(args.segments[i])
        const segText = text(seg, 'text')
        if (!segText) {
          throw new VoiceStudioError(`segments[${i}].text 不能为空。`, 400)
        }
        totalChars += segText.length
        const rawPause = seg.pauseMs
        const pauseMs =
          typeof rawPause === 'number' && Number.isFinite(rawPause)
            ? Math.min(5000, Math.max(0, Math.round(rawPause)))
            : undefined
        parsedSegments.push({
          speaker: text(seg, 'speaker') || undefined,
          voice: text(seg, 'voice') || undefined,
          persona: text(seg, 'persona') || undefined,
          text: segText,
          rate: text(seg, 'rate') || undefined,
          pitch: text(seg, 'pitch') || undefined,
          pauseMs,
          instructions: text(seg, 'instructions') || undefined,
        })
      }

      if (totalChars > MAX_DIALOGUE_CHARS) {
        throw new VoiceStudioError(`对话总字数不能超过 ${MAX_DIALOGUE_CHARS} 个字符。`, 400, 'textTooLong')
      }

      const useEdge = resolveUseEdge(cfg)
      const pronunciations = readPronunciations(cfg)
      const refAudioCache = new Map<string, Buffer>()
      const buffers: Buffer[] = []
      const allCues: SubtitleCue[] = []
      let offsetMs = 0

      for (let i = 0; i < parsedSegments.length; i++) {
        signal.throwIfAborted()
        const seg = parsedSegments[i]
        const spec = resolveStudioVoice(
          cfg,
          useEdge,
          cwd,
          {
            voice: seg.voice,
            persona: seg.persona,
            speakerAlias: seg.speaker,
            rate: seg.rate,
            pitch: seg.pitch,
            pauseMs: seg.pauseMs,
            instructions: seg.instructions,
          },
          refAudioCache,
        )
        const { audio: segAudio, info: segInfo, cues: segCues } = await synthesizeSegmentWithCues(
          cfg,
          useEdge,
          seg.text,
          spec,
          pronunciations,
          signal,
        )
        signal.throwIfAborted()

        const prefixedCues: SubtitleCue[] = seg.speaker
          ? segCues.map((cue) => ({ ...cue, text: `[${seg.speaker}] ${cue.text}` }))
          : segCues
        allCues.push(...offsetCues(prefixedCues, offsetMs, allCues.length + 1))
        buffers.push(segAudio)
        offsetMs += segInfo.durationMs

        if (i < parsedSegments.length - 1 && spec.pauseMs > 0) {
          const silenceBuf = createSilenceMp3(spec.pauseMs, segInfo.sampleRate || 24000)
          if (silenceBuf.length > 0) {
            buffers.push(silenceBuf)
            offsetMs += inspectMp3Buffer(silenceBuf).durationMs
          }
        }
      }

      let finalAudio = concatMp3Buffers(buffers)
      if (bgmPath !== undefined) {
        const rawVol = typeof args.bgmVolume === 'number' ? args.bgmVolume : Number(args.bgmVolume)
        const bgmVolume = Number.isFinite(rawVol) ? Math.min(1.0, Math.max(0.02, rawVol)) : 0.18
        finalAudio = await mixAudioWithBgm(
          finalAudio,
          {
            bgmPath,
            bgmVolume,
            ducking: true,
            normalizeLoudness: args.normalizeLoudness === true,
          },
          signal,
        )
      } else if (args.normalizeLoudness === true && hasFfmpeg()) {
        finalAudio = await normalizeAudioLoudness(finalAudio, signal)
      }

      let savedMp3 = ''
      let savedSubtitle = ''
      if (args.saveToWorkspace === true) {
        const outDir = ensureWorkspaceDirectory('voice_outputs', cwd)
        const rawStem = rawOutputName ? rawOutputName.replace(/\.(mp3|srt|vtt)$/i, '').trim() : ''
        const safeStem =
          (rawStem || `dialogue-${Date.now()}`)
            .normalize('NFKC')
            .replace(/[^\p{L}\p{N}._-]+/gu, '-')
            .replace(/-+/g, '-')
            .replace(/^[.-]+|[.-]+$/g, '')
            .slice(0, 64) || `dialogue-${Date.now()}`
        const mp3Target = resolveOutputPath(join(outDir, `${safeStem}.mp3`), '', cfg.overwrite, cwd)
        const writtenMp3 = writeWorkspaceFile(mp3Target, finalAudio, cwd, undefined, cfg.overwrite)
        const srtCandidate = join(dirname(writtenMp3), basename(writtenMp3, extname(writtenMp3)) + '.srt')
        const srtTarget = resolveOutputPath(srtCandidate, '', cfg.overwrite, cwd)
        const writtenSrt = writeWorkspaceFile(srtTarget, formatSubtitles(allCues, 'srt'), cwd, undefined, cfg.overwrite)
        savedMp3 = toWorkspaceRelativePath(writtenMp3, cwd)
        savedSubtitle = toWorkspaceRelativePath(writtenSrt, cwd)
      }

      const info = inspectMp3Buffer(finalAudio)
      return {
        synthesis: {
          audioBase64: finalAudio.toString('base64'),
          mime: 'audio/mpeg',
          bytes: finalAudio.length,
          durationMs: info.durationMs,
          durationSec: Math.round(info.durationMs / 100) / 10,
          cues: allCues,
          ...(savedMp3 ? { savedMp3, savedSubtitle } : {}),
        },
      }
    }

    if (action === 'workspaceLibrary') {
      const cwd = getWorkspaceDir()
      const root = resolveWorkspaceRoot(cwd)
      const items: Array<{
        path: string
        name: string
        bytes: number
        mtimeMs: number
        subtitlePath?: string
      }> = []

      for (const relDir of LIBRARY_SUBDIRS) {
        const dirPath = relDir === '' ? root : join(root, relDir)
        let realDir: string
        try {
          const dirStat = lstatSync(dirPath)
          if (dirStat.isSymbolicLink() || !dirStat.isDirectory()) continue
          realDir = realpathSync(dirPath)
          if (!isInsideRoot(root, realDir)) continue
        } catch {
          continue
        }

        let entries
        try {
          entries = readdirSync(realDir, { withFileTypes: true })
        } catch {
          continue
        }

        for (const entry of entries) {
          if (entry.isSymbolicLink() || !entry.isFile()) continue
          const ext = extname(entry.name).toLowerCase()
          if (!LIBRARY_AUDIO_EXTS.has(ext)) continue

          const candidateAudio = join(realDir, entry.name)
          let verifiedAudio: string
          let st
          try {
            verifiedAudio = assertAudioFile(candidateAudio, cwd)
            st = statSync(verifiedAudio)
          } catch {
            continue
          }
          if (!st.isFile() || st.size <= 0) continue

          const relAudio = toWorkspaceRelativePath(verifiedAudio, cwd)
          const stem = basename(entry.name, extname(entry.name))
          let subtitlePath: string | undefined
          for (const subExt of ['.srt', '.vtt']) {
            const subCandidate = join(realDir, stem + subExt)
            try {
              const subStat = lstatSync(subCandidate)
              if (subStat.isSymbolicLink() || !subStat.isFile()) continue
              const realSub = realpathSync(subCandidate)
              if (!isInsideRoot(root, realSub)) continue
              subtitlePath = relative(root, realSub).replace(/\\/g, '/')
              break
            } catch {
              // 无同名陪伴字幕
            }
          }

          items.push({
            path: relAudio,
            name: entry.name,
            bytes: st.size,
            mtimeMs: Math.round(st.mtimeMs),
            ...(subtitlePath ? { subtitlePath } : {}),
          })
        }
      }

      items.sort((a, b) => b.mtimeMs - a.mtimeMs || a.path.localeCompare(b.path))
      return { items: items.slice(0, MAX_LIBRARY_ITEMS) }
    }

    if (action === 'loadWorkspaceMedia') {
      const rawPath = text(args, 'path')
      if (!rawPath) {
        throw new VoiceStudioError('请提供要加载的音频文件路径（path）。', 400)
      }
      const cwd = getWorkspaceDir()
      const root = resolveWorkspaceRoot(cwd)
      const audioPath = assertAudioFile(rawPath, cwd)
      const ext = extname(audioPath).toLowerCase()
      if (!LIBRARY_AUDIO_EXTS.has(ext)) {
        throw new VoiceStudioError('仅支持加载工作区内的音频文件（.mp3/.wav/.m4a/.ogg/.webm/.flac）。', 400)
      }

      const st = statSync(audioPath)
      if (st.size <= 0) {
        throw new VoiceStudioError('音频文件为空。', 400)
      }
      if (st.size > MAX_MEDIA_BYTES) {
        throw new VoiceStudioError('工作区音频文件超过 15 MiB 在线预览上限。', 413, 'bodyLarge')
      }

      const buf = readFileSync(audioPath)
      if (buf.length > MAX_MEDIA_BYTES) {
        throw new VoiceStudioError('工作区音频文件超过 15 MiB 在线预览上限。', 413, 'bodyLarge')
      }

      let cues: SubtitleCue[] = []
      const audioDir = dirname(audioPath)
      const stem = basename(audioPath, extname(audioPath))
      for (const subExt of ['.srt', '.vtt']) {
        const subCandidate = join(audioDir, stem + subExt)
        try {
          const subStat = lstatSync(subCandidate)
          if (subStat.isSymbolicLink() || !subStat.isFile() || subStat.size > 2 * 1024 * 1024) continue
          const realSub = realpathSync(subCandidate)
          if (!isInsideRoot(root, realSub)) continue
          cues = parseSubtitleFile(readFileSync(realSub, 'utf8'))
          break
        } catch {
          // 忽略不存在或不可读的字幕文件
        }
      }

      let durationMs = 0
      if (ext === '.mp3') {
        durationMs = inspectMp3Buffer(buf).durationMs
      } else if (cues.length > 0) {
        durationMs = cues[cues.length - 1].endMs
      }
      const durationSec = Math.round(durationMs / 100) / 10
      const relPath = toWorkspaceRelativePath(audioPath, cwd)

      return {
        media: {
          path: relPath,
          name: basename(audioPath),
          mime: audioMimeFromExt(ext),
          audioBase64: buf.toString('base64'),
          bytes: buf.length,
          durationMs,
          durationSec,
          cues,
        },
      }
    }

    if (action === 'updateConfig') {
      if (!writable() || typeof options.updateSettings !== 'function') {
        throw new VoiceStudioError('当前配置是只读的，无法保存设置。', 403, 'readonly')
      }
      const sanitizedPatch = sanitizeConfigPatch(args.patch)
      await options.updateSettings(sanitizedPatch)
      return { saved: Object.keys(sanitizedPatch) }
    }

    throw new VoiceStudioError('未知的操作。', 400)
  }

  return {
    snapshot,
    /** 仅由宿主已鉴权的 connection.fetch 路由调用。 */
    async fetch(request: Request): Promise<Response> {
      try {
        carrierGuard(request)
      } catch (error) {
        return new Response(
          JSON.stringify({
            error: error instanceof Error ? error.message : String(error),
            code: error instanceof VoiceStudioError ? error.code : 'invalid',
          }),
          {
            status: error instanceof VoiceStudioError ? error.status : 400,
            headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
          },
        )
      }
      request.signal.throwIfAborted()
      const req = (request.body ? Readable.fromWeb(request.body as any) : Readable.from([])) as any
      req.method = request.method
      req.headers = Object.fromEntries(request.headers)
      const headers = new Headers()
      let status = 200
      let bytes = Buffer.alloc(0)
      const res = Object.assign(new EventEmitter(), {
        destroyed: false,
        writableFinished: false,
        setHeader(name: string, value: string) {
          headers.set(name, value)
        },
        writeHead(value: number, entries: Record<string, string>) {
          status = value
          for (const [name, entry] of Object.entries(entries || {})) headers.set(name, entry)
        },
        end(value: string) {
          bytes = Buffer.from(value)
          this.writableFinished = true
        },
      }) as any
      const abort = () => req.emit('aborted')
      request.signal.addEventListener('abort', abort, { once: true })
      try {
        await this.handle(req, res, AUTHENTICATED_CARRIER)
      } finally {
        request.signal.removeEventListener('abort', abort)
        req.destroy()
      }
      request.signal.throwIfAborted()
      return new Response(new Uint8Array(bytes), { status, headers })
    },
    async handle(req: IncomingMessage, res: ServerResponse, transport?: symbol): Promise<void> {
      const controller = new AbortController()
      const abort = () => {
        if (!res.writableFinished) controller.abort(new Error('请求已取消'))
      }
      req.on('aborted', abort)
      res.on('close', abort)
      const send = (status: number, value: unknown) => {
        if (res.destroyed) return
        res.writeHead(status, {
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': 'no-store',
          'X-Content-Type-Options': 'nosniff',
        })
        res.end(JSON.stringify(value))
      }
      try {
        if (transport !== AUTHENTICATED_CARRIER) requestGuard(req)
        if (req.method === 'GET') {
          send(200, { snapshot: snapshot() })
        } else if (req.method === 'POST') {
          const result = await dispatch(await readBody(req, controller.signal), controller.signal)
          send(200, { ...result, snapshot: snapshot() })
        } else {
          res.setHeader('Allow', 'GET, POST')
          send(405, { error: '仅支持 GET 和 POST。', code: 'method' })
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          let state
          try {
            state = snapshot()
          } catch {
            /* 忽略 snapshot 读取异常，避免掩盖原始错误。 */
          }
          send(error instanceof VoiceStudioError ? error.status : 400, {
            error: error instanceof Error ? error.message : String(error),
            code: error instanceof VoiceStudioError ? error.code : 'invalid',
            snapshot: state,
          })
        }
      } finally {
        req.off('aborted', abort)
        res.off('close', abort)
      }
    },
  }
}

export interface HostSettingsBinding {
  isWritable(): boolean
  update(patch: Record<string, unknown>): Promise<void>
}

/**
 * 可选注入宿主 `settings` 服务并按 cordis 条目 ID（默认 `'voice'`）绑定配置持久化写入与只读检查。
 * 不改变插件顶层 `export const inject = ['tools']` 声明；宿主无 settings 服务时优雅回退只读。
 */
export function bindHostSettings(
  ctx: { inject?: Function; fiber?: { entry?: { options?: { id?: string } } } },
): HostSettingsBinding {
  let updateSettings: ((patch: Record<string, unknown>) => Promise<void>) | undefined
  let isHostWritable: (() => boolean) | undefined

  if (typeof ctx.inject === 'function') {
    try {
      ctx.inject(['settings'], (host: any) => {
        const rawId = ctx.fiber?.entry?.options?.id
        const pluginId = typeof rawId === 'string' && rawId.trim() !== '' ? rawId.trim() : 'voice'
        if (typeof host?.settings?.update === 'function') {
          const setFn = (patch: Record<string, unknown>) => host.settings.update(pluginId, patch)
          const checkWritable = () => host.settings?.writable !== false
          updateSettings = setFn
          isHostWritable = checkWritable
          if (typeof host.effect === 'function') {
            host.effect(
              () => () => {
                if (updateSettings === setFn) updateSettings = undefined
                if (isHostWritable === checkWritable) isHostWritable = undefined
              },
              'dsh-voice: settings binding',
            )
          }
        }
      })
    } catch {
      /* 宿主未提供 settings 服务时回退只读状态。 */
    }
  }

  return {
    isWritable: () => typeof updateSettings === 'function' && (isHostWritable ? isHostWritable() : true),
    update: (patch: Record<string, unknown>) => {
      if (typeof updateSettings !== 'function' || (isHostWritable && !isHostWritable())) {
        return Promise.reject(new VoiceStudioError('当前配置是只读的，无法保存设置。', 403, 'readonly'))
      }
      return updateSettings(patch)
    },
  }
}

export function installVoiceStudioWeb(
  ctx: { inject?: Function; fiber?: { entry?: { options?: { id?: string } } } },
  readCfg: () => ResolvedVoiceConfig,
  deps: VoiceStudioBackendOptions = {},
): ReturnType<typeof createVoiceStudioBackend> {
  const hostSettings = !deps.updateSettings ? bindHostSettings(ctx) : undefined
  const backend = createVoiceStudioBackend(readCfg, {
    ...deps,
    writable:
      deps.writable ??
      (deps.updateSettings ? () => true : () => hostSettings?.isWritable() === true),
    updateSettings: (patch) => {
      if (deps.updateSettings) {
        if (deps.writable && deps.writable() === false) {
          return Promise.reject(new VoiceStudioError('当前配置是只读的，无法保存设置。', 403, 'readonly'))
        }
        return deps.updateSettings(patch)
      }
      if (!hostSettings || !hostSettings.isWritable()) {
        return Promise.reject(new VoiceStudioError('当前配置是只读的，无法保存设置。', 403, 'readonly'))
      }
      return hostSettings.update(patch)
    },
  })

  if (typeof ctx.inject !== 'function') return backend

  ctx.inject(['connection'], (host: any) => {
    const mount = () =>
      host.connection?.fetch?.register?.({
        path: VOICE_STUDIO_API_ROUTE,
        methods: ['GET', 'POST'],
        requestBody: 'buffered',
        fetch: (request: Request) => backend.fetch(request),
      })
    if (typeof host?.effect === 'function') {
      host.effect(() => {
        const off = mount()
        return typeof off === 'function' ? off : undefined
      }, 'dsh-voice: studio api route')
    } else {
      mount()
    }
  })

  ctx.inject(['webServer'], (webCtx: any) => {
    if (!webCtx?.webServer?.register) return
    const mount = () =>
      webCtx.webServer.register({
        kind: 'exact',
        path: VOICE_STUDIO_SETTINGS_ROUTE,
        handler: (req: IncomingMessage, res: ServerResponse) => backend.handle(req, res),
      })
    if (typeof webCtx.effect === 'function') {
      webCtx.effect(() => mount(), 'dsh-voice: studio settings route')
    } else {
      mount()
    }
  })

  return backend
}
