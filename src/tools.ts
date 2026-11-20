/**
 * 五个面向模型的语音工具：voice_tts / voice_stt / voice_list / voice_preview / voice_health。
 *
 * @module dsh-voice/tools
 */
import { openAsBlob, readFileSync, statSync } from 'node:fs'
import { basename, extname, join } from 'node:path'
import { isLoopbackBaseUrl, isValidProsody, resolveCustomVoice, type CustomVoiceAlias, type PronunciationRule, type ResolvedVoiceConfig } from './config.js'
import { fetchEdgeVoices, synthesizeSpeech, synthesizeSpeechWithMetadata, type SubtitleCue } from './edge-tts.js'
import { rateToSpeed, synthesizeOpenAiSpeech, type ReferenceVoiceSample } from './openai-tts.js'
import { assertAudioFile, assertWorkspaceFile, ensureWorkspaceDirectory, resolveOutputPath, writeWorkspaceFile } from './paths.js'
import { createProxyFetch } from './proxy-fetch.js'
import { assertAudioSize, formatDiarizedTranscript, formatSttSubtitles, hasFfmpeg, isVideoContainerFile, prepareAudioForAsr, splitStereoChannelsForDiarization, transcribe, type SttSegment } from './stt.js'
import {
  applyPronunciationsPlain,
  cleanMarkdownForSpeech,
  concatMp3Buffers,
  createSilenceMp3,
  embedMp3Chapters,
  extractMarkdownSections,
  fitAudioToWindow,
  formatChaptersMarkdown,
  formatSubtitles,
  groupWordCues,
  inspectMp3Buffer,
  mixAudioWithBgm,
  normalizeAudioLoudness,
  offsetCues,
  parseSubtitleFile,
  renderPreviewHtml,
  scaleRatePercent,
  splitInlinePauses,
  splitTextIntoChunks,
  stripInlinePauses,
  type AudioChapter,
  type SubtitleGranularity,
} from './tts-text.js'
import { filterVoices, isValidVoiceId, resolvePersona, VOICE_PERSONAS, VOICES } from './voices.js'

/** 模型可见的内容块。 */
export interface ContentBlock {
  type: 'text'
  text: string
}

/** 注册给 ctx.tools.register 的原始工具定义。 */
export interface VoiceToolDefinition {
  name: string
  description: string
  parameters: { type: 'object'; properties: Record<string, unknown>; required?: string[] }
  output: {
    schema: Record<string, unknown>
    render(args: unknown, value: unknown): ContentBlock[]
  }
  isConcurrencySafe?(args?: unknown): boolean
  execute(args: unknown, exec: unknown): Promise<unknown>
  timeoutMs?: number
}

function compileParameters(spec: Record<string, any>): { type: 'object'; properties: Record<string, unknown>; required?: string[] } {
  const properties: Record<string, unknown> = {}
  const required: string[] = []
  for (const [key, prop] of Object.entries(spec)) {
    if (prop?.required === true) required.push(key)
    const node: Record<string, unknown> = {}
    if (typeof prop?.type === 'string') node.type = prop.type
    if (typeof prop?.description === 'string') node.description = prop.description
    if (prop?.enum !== undefined) node.enum = prop.enum
    if (prop?.items !== undefined) node.items = prop.items
    if (prop?.properties !== undefined) node.properties = prop.properties
    if (Array.isArray(prop?.required)) node.required = prop.required
    if (prop?.default !== undefined) node.default = prop.default
    properties[key] = node
  }
  return { type: 'object', properties, ...(required.length > 0 ? { required } : {}) }
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null ? value as Record<string, unknown> : {}
}

function optionalString(args: Record<string, unknown>, key: string): string | undefined {
  const value = args[key]
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : undefined
}

function requiredString(args: Record<string, unknown>, key: string, label: string): string {
  const value = optionalString(args, key)
  if (value === undefined) throw new Error(label + '（参数 ' + key + '）为必填，请提供非空字符串。')
  return value
}

/** Harness 执行上下文里本插件关心的字段：取消信号与会话工作区。 */
interface ToolExecutionContext {
  /** 本次调用的取消信号：harness 超时/用户取消时触发。 */
  signal?: AbortSignal
  agent?: { session?: { header?: { cwd?: string } } }
}

/** 取本次调用的取消信号；取不到就当未提供。 */
function execSignal(exec: unknown): AbortSignal | undefined {
  const signal = (exec as ToolExecutionContext | null | undefined)?.signal
  return signal !== null && typeof signal === 'object' && typeof signal.aborted === 'boolean' ? signal : undefined
}

/** 已取消则抛出取消原因；作为 await 前后的统一取消检查。 */
function throwIfAborted(signal: AbortSignal | undefined): void {
  if (signal?.aborted === true) throw signal.reason
}

/** 让不认 signal 的实现也能在取消时立即 reject；signal 缺 addEventListener 时只能原样等待。 */
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

/** 有界并发：同一时刻最多跑 limit 个任务；取消时停止派发并抛出取消原因。 */
async function mapLimit<T, R>(items: T[], limit: number, signal: AbortSignal | undefined, worker: (item: T) => Promise<R>): Promise<R[]> {
  const results = new Array<R>(items.length)
  let next = 0
  const run = async (): Promise<void> => {
    for (;;) {
      throwIfAborted(signal)
      const index = next
      next += 1
      if (index >= items.length) return
      results[index] = await worker(items[index])
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => run()))
  return results
}

/** 取本次调用的会话工作区；harness 从不 chdir，取不到时才回退宿主进程 cwd。 */
function sessionCwd(exec: unknown): string {
  const cwd = (exec as ToolExecutionContext | null | undefined)?.agent?.session?.header?.cwd
  return typeof cwd === 'string' && cwd.trim() !== '' ? cwd : process.cwd()
}

function mimeFromPath(filePath: string): string {
  const ext = extname(filePath).toLowerCase()
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

function subtitleFormatOf(filePath: string): 'srt' | 'vtt' | 'ass' {
  const ext = extname(filePath).toLowerCase()
  if (ext === '.vtt') return 'vtt'
  if (ext === '.ass') return 'ass'
  return 'srt'
}

const voiceItemSchema = {
  type: 'object',
  properties: { id: { type: 'string' }, gender: { type: 'string' }, locale: { type: 'string' } },
  additionalProperties: true,
}

const listSchema = {
  type: 'object',
  properties: {
    count: { type: 'integer' },
    voices: { type: 'array', items: voiceItemSchema },
    source: { type: 'string' },
    personas: { type: 'array', items: { type: 'object', additionalProperties: true } },
    customVoices: { type: 'array', items: { type: 'object', additionalProperties: true } },
    fallbackReason: { type: 'string' },
  },
  additionalProperties: true,
}

function parseCallPronunciations(raw: unknown): PronunciationRule[] {
  if (Array.isArray(raw)) {
    const out: PronunciationRule[] = []
    for (const item of raw) {
      if (typeof item !== 'object' || item === null || Array.isArray(item)) continue
      const rec = item as Record<string, unknown>
      const word = typeof rec.word === 'string' ? rec.word.trim() : ''
      const alias = typeof rec.alias === 'string' ? rec.alias.trim() : ''
      if (word !== '' && alias !== '') out.push({ word, alias })
    }
    return out
  }
  if (typeof raw === 'object' && raw !== null) {
    const out: PronunciationRule[] = []
    for (const [key, val] of Object.entries(raw as Record<string, unknown>)) {
      if (typeof val !== 'string') continue
      const word = key.trim()
      const alias = val.trim()
      if (word !== '' && alias !== '') out.push({ word, alias })
    }
    return out
  }
  return []
}

function mergePronunciations(
  base: readonly PronunciationRule[] | undefined,
  overrides: readonly PronunciationRule[],
): PronunciationRule[] {
  const merged = new Map<string, PronunciationRule>()
  for (const rule of base ?? []) {
    const word = rule.word.trim()
    const alias = rule.alias.trim()
    if (word !== '' && alias !== '') merged.set(word, { word, alias })
  }
  for (const rule of overrides) {
    const word = rule.word.trim()
    const alias = rule.alias.trim()
    if (word !== '' && alias !== '') merged.set(word, { word, alias })
  }
  return Array.from(merged.values())
}

const ttsSchema = {
  type: 'object',
  properties: {
    output: { type: 'string' },
    bytes: { type: 'integer' },
    durationMs: { type: 'integer' },
    durationSec: { type: 'number' },
    voice: { type: 'string' },
    rate: { type: 'string' },
    pitch: { type: 'string' },
    textLength: { type: 'integer' },
    chunks: { type: 'integer' },
    subtitleFile: { type: 'string' },
    chapters: { type: 'array', items: { type: 'object', additionalProperties: true } },
    chaptersFile: { type: 'string' },
  },
  additionalProperties: true,
}

const sttSchema = {
  type: 'object',
  properties: {
    text: { type: 'string' },
    model: { type: 'string' },
    language: { type: 'string' },
    audio: { type: 'string' },
    transcriptFile: { type: 'string' },
    subtitleFile: { type: 'string' },
    speakers: { type: 'array', items: { type: 'string' } },
  },
  additionalProperties: true,
}

const previewSchema = {
  type: 'object',
  properties: {
    count: { type: 'integer' },
    samples: { type: 'array', items: { type: 'object', additionalProperties: true } },
    failed: { type: 'array', items: { type: 'object', additionalProperties: true } },
    text: { type: 'string' },
    indexHtml: { type: 'string' },
  },
  additionalProperties: true,
}

/** 自定义端点没配 asrModel 时的兜底模型名。 */
const FALLBACK_ASR_MODEL = 'whisper-1'

/** 单次 TTS 最大字符上限（长文自动分段合成）。 */
const MAX_TTS_CHARS = 100000

/** 多角色对话/播客分段数上限。 */
const MAX_TTS_SEGMENTS = 50

/** 反向字幕卡点配音条目上限。 */
const MAX_SUBTITLE_INPUT_CUES = 200

/** OpenAI 兼容 TTS 默认模型。 */
const FALLBACK_TTS_MODEL = 'gpt-4o-mini-tts'

/** ASR 直传上限（25MB）。 */
const MAX_ASR_BYTES = 25 * 1024 * 1024

/** 零样本克隆参考音频上限（10MB）。 */
const MAX_REFERENCE_AUDIO_BYTES = 10 * 1024 * 1024

/** 默认试听文本（中英混合，便于感知发音差异）。 */
export const DEFAULT_PREVIEW_TEXT = '你好，这是音色试听。Hello, this is a voice preview.'

/** voice_preview 同时合成的音色数上限：有界并发，避免 8 个音色串行把最坏等待拖成 8 倍超时。 */
const PREVIEW_CONCURRENCY = 3

/** voice_tts 分段合成的并发上限。 */
const TTS_CHUNK_CONCURRENCY = 2

/** voice_preview 单个音色的结果：成功带 output/bytes，失败带 error。 */
interface PreviewOutcome {
  voice: string
  output?: string
  bytes?: number
  error?: string
}

type VoiceReference = ReferenceVoiceSample

interface EffectiveVoiceInput {
  voice?: string
  persona?: string
  rate?: string
  pitch?: string
  pauseMs?: number
  instructions?: string
  referenceAudio?: string
  referenceText?: string
}

interface EffectiveVoiceSpec {
  voice: string
  rate: string
  pitch: string
  pauseMs: number
  instructions?: string
  references?: VoiceReference[]
  hasReferenceAudio: boolean
}

interface ParsedSegment {
  title?: string
  chunks: string[]
  voice: string
  rate: string
  pitch: string
  pauseMs: number
  useEdge: boolean
  instructions?: string
  references?: VoiceReference[]
}

interface ChunkSynthesisResult {
  audio: Buffer
  cues: SubtitleCue[]
  wordCues?: SubtitleCue[]
}

interface SubtitleSynthesisOptions {
  granularity: SubtitleGranularity
  maxCharsPerCue: number
  isAss: boolean
}

/** 可注入依赖（测试用假实现）。 */
export interface VoiceToolDeps {
  tts?: typeof synthesizeSpeech
  ttsWithMeta?: typeof synthesizeSpeechWithMetadata
  openaiTts?: typeof synthesizeOpenAiSpeech
  stt?: typeof transcribe
  prepareAudio?: typeof prepareAudioForAsr
  fetchVoices?: typeof fetchEdgeVoices
  normalizeAudio?: typeof normalizeAudioLoudness
  mixBgm?: typeof mixAudioWithBgm
  splitStereo?: typeof splitStereoChannelsForDiarization
  fitWindow?: typeof fitAudioToWindow
}

/**
 * 构建五个语音工具定义（支持静态配置对象或活引用配置 getter）。
 */
export function buildVoiceTools(
  config: ResolvedVoiceConfig | (() => ResolvedVoiceConfig),
  deps: VoiceToolDeps = {},
): VoiceToolDefinition[] {
  const getCfg = typeof config === 'function' ? config : () => config
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

  const assertProsody = (rate: string, pitch: string) => {
    if (!isValidProsody(rate)) throw new Error('语速 rate 不合法：' + rate + '。合法格式如 +10%、-2Hz、+1st。')
    if (!isValidProsody(pitch)) throw new Error('音调 pitch 不合法：' + pitch + '。合法格式如 +10%、-2Hz、+1st。')
  }

  const assertTtsEngineReady = (cfg: ResolvedVoiceConfig, useEdge: boolean) => {
    if (useEdge) return
    if (cfg.ttsBaseUrl === '') {
      throw new Error('未配置 TTS 接口地址：ttsEngine=' + cfg.ttsEngine + ' 时必须在 DSH「设置 → 插件 → 语音」配置 ttsBaseUrl（保存即生效）。')
    }
    if (cfg.ttsApiKey === '' && !isLoopbackBaseUrl(cfg.ttsBaseUrl)) {
      throw new Error('未配置 TTS 密钥：请在 DSH「设置 → 插件 → 语音」配置 ttsApiKey，或设置环境变量 DSH_VOICE_TTS_KEY。')
    }
  }

  const assertTtsVoice = (voice: string, useEdge: boolean, hasReferences = false) => {
    if (useEdge) {
      if (!isValidVoiceId(voice)) {
        throw new Error('音色 id 不合法：' + voice + '。请用 voice_list 查看常用音色，或在 DSH「设置 → 插件 → 语音」修改 ttsVoice（合法格式如 zh-CN-XiaoxiaoNeural）。')
      }
      return
    }
    if (voice.trim() === '' && !hasReferences) throw new Error('音色 id 不合法：不能为空。')
  }

  const resolveUseEdge = (cfg: ResolvedVoiceConfig, hasReferenceAudio: boolean): boolean => {
    if (deps.tts !== undefined || deps.ttsWithMeta !== undefined) return true
    if (deps.openaiTts !== undefined && (cfg.ttsEngine !== 'edge' || hasReferenceAudio)) return false
    return cfg.ttsEngine === 'edge'
  }

  const resolveEffectiveVoiceSpec = (
    cfg: ResolvedVoiceConfig,
    cwd: string,
    input: EffectiveVoiceInput,
    refAudioCache?: Map<string, Buffer>,
  ): EffectiveVoiceSpec => {
    let customAlias: CustomVoiceAlias | undefined
    let voiceConsumedAsAlias = false
    let personaConsumedAsAlias = false

    if (input.persona !== undefined) {
      customAlias = resolveCustomVoice(cfg.customVoices, input.persona)
      if (customAlias !== undefined) personaConsumedAsAlias = true
    }
    if (customAlias === undefined && input.voice !== undefined) {
      customAlias = resolveCustomVoice(cfg.customVoices, input.voice)
      if (customAlias !== undefined) voiceConsumedAsAlias = true
    }

    let defaultAlias: CustomVoiceAlias | undefined
    if (input.voice === undefined && input.persona === undefined) {
      defaultAlias = resolveCustomVoice(cfg.customVoices, cfg.ttsVoice)
    }
    const activeAlias = customAlias ?? defaultAlias

    let voiceConsumedAsPersona = false
    let personaSpec = !personaConsumedAsAlias && input.persona !== undefined
      ? resolvePersona(input.persona)
      : undefined
    if (personaSpec === undefined && activeAlias?.persona !== undefined) {
      personaSpec = resolvePersona(activeAlias.persona)
    }
    if (personaSpec === undefined && !voiceConsumedAsAlias && input.voice !== undefined && !isValidVoiceId(input.voice)) {
      personaSpec = resolvePersona(input.voice)
      if (personaSpec !== undefined) voiceConsumedAsPersona = true
    }

    let defaultPersona: ReturnType<typeof resolvePersona>
    if (input.voice === undefined && input.persona === undefined && activeAlias === undefined && !isValidVoiceId(cfg.ttsVoice)) {
      defaultPersona = resolvePersona(cfg.ttsVoice)
    }
    const activePersona = personaSpec ?? defaultPersona

    const explicitRawVoice = !voiceConsumedAsAlias && !voiceConsumedAsPersona ? input.voice : undefined
    const effectiveInstructions = input.instructions ?? activeAlias?.instructions
    const effectiveReferenceAudio = input.referenceAudio ?? activeAlias?.referenceAudio
    const effectiveReferenceText = input.referenceText ?? activeAlias?.referenceText

    let references: VoiceReference[] | undefined
    const hasReferenceAudio = effectiveReferenceAudio !== undefined && effectiveReferenceAudio.trim() !== ''
    if (hasReferenceAudio) {
      const refPath = assertAudioFile(effectiveReferenceAudio, cwd)
      let buf = refAudioCache?.get(refPath)
      if (buf === undefined) {
        const size = statSync(refPath).size
        if (size <= 0) {
          throw new Error('参考音频文件为空，无法用于音色克隆：' + effectiveReferenceAudio)
        }
        if (size > MAX_REFERENCE_AUDIO_BYTES) {
          throw new Error('参考音频超过 10MB 上限（当前 ' + size + ' 字节），请裁剪为 5–10 秒人声片段：' + effectiveReferenceAudio)
        }
        buf = readFileSync(refPath)
        if (buf.length === 0 || buf.length > MAX_REFERENCE_AUDIO_BYTES) {
          throw new Error('参考音频大小异常（必须为 1 字节至 10MB）：' + effectiveReferenceAudio)
        }
        refAudioCache?.set(refPath, buf)
      }
      if (resolveUseEdge(cfg, true)) {
        throw new Error('零样本参考音频克隆（referenceAudio）需要兼容克隆的 TTS 引擎：请在 DSH「设置 → 插件 → 语音」将 ttsEngine 切换为 siliconflow（CosyVoice2-0.5B）或 custom（如本地 GPT-SoVITS / IndexTTS）。')
      }
      references = [{
        audioDataUri: 'data:' + mimeFromPath(refPath) + ';base64,' + buf.toString('base64'),
        rawAudio: buf,
        filename: basename(refPath),
        ...(effectiveReferenceText !== undefined && effectiveReferenceText.trim() !== '' ? { text: effectiveReferenceText.trim() } : {}),
      }]
    }

    const effectiveVoice = references !== undefined && explicitRawVoice === undefined
      ? (activeAlias?.voice ?? '')
      : (explicitRawVoice ?? activeAlias?.voice ?? activePersona?.voice ?? cfg.ttsVoice)

    const effectiveRate = input.rate ?? activeAlias?.rate ?? activePersona?.rate ?? cfg.ttsRate
    const effectivePitch = input.pitch ?? activeAlias?.pitch ?? activePersona?.pitch ?? cfg.ttsPitch
    const effectivePauseMs = input.pauseMs ?? activePersona?.pauseMs ?? 300

    return {
      voice: effectiveVoice,
      rate: effectiveRate,
      pitch: effectivePitch,
      pauseMs: effectivePauseMs,
      ...(effectiveInstructions !== undefined ? { instructions: effectiveInstructions } : {}),
      ...(references !== undefined ? { references } : {}),
      hasReferenceAudio,
    }
  }

  const maybeNormalizeAudio = async (
    shouldNormalize: boolean,
    audio: Buffer,
    signal: AbortSignal | undefined,
  ): Promise<Buffer> => {
    if (!shouldNormalize) return audio
    if (deps.normalizeAudio === undefined && !hasFfmpeg()) {
      throw new Error('开启 normalizeLoudness 需要本机安装 ffmpeg（或使用 dsh-ffmpeg）。')
    }
    const normalized = await raceAbort((deps.normalizeAudio ?? normalizeAudioLoudness)(audio, signal), signal)
    throwIfAborted(signal)
    return normalized
  }

  const finalizeVoiceAudio = async (
    rawAudio: Buffer,
    bgmPath: string | undefined,
    bgmVolume: number,
    bgmDucking: boolean,
    shouldNormalize: boolean,
    signal: AbortSignal | undefined,
  ): Promise<Buffer> => {
    throwIfAborted(signal)
    if (bgmPath !== undefined) {
      if (deps.mixBgm === undefined && !hasFfmpeg()) {
        throw new Error('使用 bgmFile 背景音乐自动闪避混音需要本机安装 ffmpeg（或使用 dsh-ffmpeg）。')
      }
      const mixed = await raceAbort(
        (deps.mixBgm ?? mixAudioWithBgm)(
          rawAudio,
          {
            bgmPath,
            bgmVolume,
            ducking: bgmDucking,
            normalizeLoudness: shouldNormalize,
          },
          signal,
        ),
        signal,
      )
      throwIfAborted(signal)
      return mixed
    }
    return await maybeNormalizeAudio(shouldNormalize, rawAudio, signal)
  }

  const synthesizeChunk = async (
    cfg: ResolvedVoiceConfig,
    useEdge: boolean,
    chunkText: string,
    voice: string,
    rate: string,
    pitch: string,
    needSubtitles: boolean,
    signal: AbortSignal | undefined,
    instructions?: string,
    references?: VoiceReference[],
    pronunciations?: readonly PronunciationRule[],
    subtitleOpts?: SubtitleSynthesisOptions,
  ): Promise<ChunkSynthesisResult> => {
    const hasPronunciations = pronunciations !== undefined && pronunciations.length > 0
    if (useEdge) {
      const pronOpt = hasPronunciations ? { pronunciations } : {}
      if (!needSubtitles) {
        const ttsFn = deps.tts ?? (deps.ttsWithMeta !== undefined
          ? async (opts: Parameters<typeof synthesizeSpeech>[0], ttsDeps: Parameters<typeof synthesizeSpeech>[1], timeoutMs?: number, abortSig?: AbortSignal) =>
            (await deps.ttsWithMeta!(opts, ttsDeps, timeoutMs, abortSig)).audio
          : synthesizeSpeech)
        const audio = await raceAbort(ttsFn({ text: chunkText, voice, rate, pitch, ...pronOpt }, { proxyUrl: cfg.proxyUrl }, cfg.timeoutMs, signal), signal)
        return { audio, cues: [] }
      }
      if (deps.ttsWithMeta !== undefined || deps.tts === undefined) {
        const withMetaFn = deps.ttsWithMeta ?? synthesizeSpeechWithMetadata
        const wantWordBoundary = subtitleOpts !== undefined
          && (subtitleOpts.granularity === 'clause' || subtitleOpts.granularity === 'word' || subtitleOpts.isAss)
        if (!wantWordBoundary) {
          const res = await raceAbort(
            withMetaFn({ text: chunkText, voice, rate, pitch, boundary: 'sentence', ...pronOpt }, { proxyUrl: cfg.proxyUrl }, cfg.timeoutMs, signal),
            signal,
          )
          const cues = res.cues.length > 0
            ? res.cues
            : [{ index: 1, startMs: 0, endMs: Math.max(1, inspectMp3Buffer(res.audio).durationMs), text: stripInlinePauses(chunkText) }]
          return { audio: res.audio, cues }
        }
        const res = await raceAbort(
          withMetaFn({ text: chunkText, voice, rate, pitch, boundary: 'word', ...pronOpt }, { proxyUrl: cfg.proxyUrl }, cfg.timeoutMs, signal),
          signal,
        )
        const rawWords = res.cues
        const effectiveGranularity: SubtitleGranularity = subtitleOpts.granularity === 'sentence' && subtitleOpts.isAss
          ? 'clause'
          : subtitleOpts.granularity
        const grouped = rawWords.length > 0
          ? groupWordCues(rawWords, effectiveGranularity, subtitleOpts.maxCharsPerCue)
          : [{ index: 1, startMs: 0, endMs: Math.max(1, inspectMp3Buffer(res.audio).durationMs), text: stripInlinePauses(chunkText) }]
        return { audio: res.audio, cues: grouped, wordCues: rawWords }
      }
      const audio = await raceAbort(deps.tts({ text: chunkText, voice, rate, pitch, ...pronOpt }, { proxyUrl: cfg.proxyUrl }, cfg.timeoutMs, signal), signal)
      return {
        audio,
        cues: [{ index: 1, startMs: 0, endMs: Math.max(1, inspectMp3Buffer(audio).durationMs), text: stripInlinePauses(chunkText) }],
      }
    }

    const openaiFn = deps.openaiTts ?? synthesizeOpenAiSpeech
    const runOpenAiPiece = (rawPieceText: string) => {
      const spokenText = hasPronunciations ? applyPronunciationsPlain(rawPieceText, pronunciations) : rawPieceText
      return raceAbort(
        openaiFn(
          cfg.ttsBaseUrl,
          cfg.ttsApiKey,
          {
            text: spokenText,
            voice,
            model: cfg.ttsModel !== '' ? cfg.ttsModel : FALLBACK_TTS_MODEL,
            speed: rateToSpeed(rate),
            ...(instructions !== undefined ? { instructions } : {}),
            ...(references !== undefined && references.length > 0 ? { references } : {}),
            signal,
          },
          getProxyFetch(cfg.proxyUrl) ?? globalThis.fetch,
          cfg.timeoutMs,
          signal,
        ),
        signal,
      )
    }

    const pieces = splitInlinePauses(chunkText)
    let audio: Buffer
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
          throwIfAborted(signal)
          const partAudio = await runOpenAiPiece(piece.text)
          throwIfAborted(signal)
          const info = inspectMp3Buffer(partAudio)
          if (info.frameCount > 0) detectedSampleRate = info.sampleRate
          synthesizedByIndex.set(i, partAudio)
        }
        const partBuffers: Buffer[] = []
        for (let i = 0; i < pieces.length; i++) {
          const piece = pieces[i]
          if (piece.kind === 'pause') {
            const sil = createSilenceMp3(piece.durationMs, detectedSampleRate)
            if (sil.length > 0) partBuffers.push(sil)
          } else {
            const partAudio = synthesizedByIndex.get(i)
            if (partAudio !== undefined && partAudio.length > 0) partBuffers.push(partAudio)
          }
        }
        audio = partBuffers.length === 1 ? partBuffers[0] : concatMp3Buffers(partBuffers)
      }
    } else {
      audio = await runOpenAiPiece(chunkText)
    }
    return {
      audio,
      cues: needSubtitles
        ? [{ index: 1, startMs: 0, endMs: Math.max(1, inspectMp3Buffer(audio).durationMs), text: stripInlinePauses(chunkText) }]
        : [],
    }
  }

  const voiceList: VoiceToolDefinition = {
    name: 'voice_list',
    isConcurrencySafe: () => true,
    description: '列出语音合成音色与角色人设配方：默认返回内置 45+ 精选音色（涵盖童声、少年、成熟/纪录片、老年、多语种与方言），设 online=true 可实时拉取微软 Edge 全量 300+ 音色目录（失败自动回退）。同时返回内置角色人设配方（personas）与自定义音色别名（customVoices），支持按 locale/gender/tag 筛选。',
    parameters: compileParameters({
      locale: { type: 'string', description: '按语言/地区或名称关键字筛选（可选，如 zh-CN、en-US、粤语）。' },
      gender: { type: 'string', enum: ['Female', 'Male'], description: '按性别筛选（可选：Female 或 Male）。' },
      tag: { type: 'string', description: '按场景标签筛选（可选，如 podcast、multilingual、news、dialect、child、teen、mature、elder、anime、cartoon）。' },
      online: { type: 'boolean', description: '是否联网拉取微软 Edge 全量 300+ 实时音色目录（可选，默认 false 使用内置精选目录；联网失败自动回退内置目录）。' },
      includePersonas: { type: 'boolean', description: '是否同时返回内置角色人设配方（personas）与自定义音色别名（默认 true）。' },
    }),
    output: {
      schema: listSchema,
      render: (_args, value) => {
        const rec = asRecord(value)
        const voices = Array.isArray(rec.voices) ? rec.voices : []
        const source = typeof rec.source === 'string' ? rec.source : 'builtin'
        const fallbackReason = typeof rec.fallbackReason === 'string' ? rec.fallbackReason : ''
        const header = source === 'edge-online'
          ? '共 ' + voices.length + ' 个在线 Edge 音色：'
          : source === 'builtin-fallback'
            ? '在线目录拉取失败（' + fallbackReason + '），已回退内置目录，共 ' + voices.length + ' 个常用音色：'
            : '共 ' + voices.length + ' 个常用音色：'
        const lines = [header]
        for (const voice of voices) {
          const v = asRecord(voice)
          const tags = Array.isArray(v.tags) && v.tags.length > 0 ? ' [' + v.tags.join(', ') + ']' : ''
          lines.push('- ' + v.id + '（' + v.locale + '）' + tags)
        }
        const personas = Array.isArray(rec.personas) ? rec.personas : []
        if (personas.length > 0) {
          const summary = personas.map((p) => {
            const item = asRecord(p)
            return String(item.id ?? '') + '（' + String(item.label ?? '') + '）'
          }).join('、')
          lines.push('', '可用人设配方（persona）：' + summary)
        }
        const customVoices = Array.isArray(rec.customVoices) ? rec.customVoices : []
        if (customVoices.length > 0) {
          const summary = customVoices.map((c) => {
            const item = asRecord(c)
            const extras = [
              typeof item.persona === 'string' && item.persona !== '' ? 'persona=' + item.persona : '',
              typeof item.voice === 'string' && item.voice !== '' ? 'voice=' + item.voice : '',
              item.hasReferenceAudio === true ? '含参考音频' : '',
            ].filter(Boolean).join(', ')
            return String(item.name ?? '') + (extras !== '' ? '（' + extras + '）' : '')
          }).join('、')
          lines.push('自定义音色别名（customVoices）：' + summary)
        }
        return [{ type: 'text', text: lines.join('\n') }]
      },
    },
    async execute(rawArgs: unknown, exec?: unknown) {
      const cfg = getCfg()
      const signal = execSignal(exec)
      throwIfAborted(signal)
      const args = asRecord(rawArgs)
      const locale = optionalString(args, 'locale')
      const gender = optionalString(args, 'gender')
      const tag = optionalString(args, 'tag')
      const hasFilter = locale !== undefined || gender !== undefined || tag !== undefined

      let sourceVoices = VOICES
      let source: 'builtin' | 'edge-online' | 'builtin-fallback' = 'builtin'
      let fallbackReason = ''

      if (args.online === true) {
        try {
          const fetched = await raceAbort(
            (deps.fetchVoices ?? fetchEdgeVoices)({ fetchImpl: getProxyFetch(cfg.proxyUrl) ?? globalThis.fetch, signal }, cfg.timeoutMs),
            signal,
          )
          throwIfAborted(signal)
          if (Array.isArray(fetched) && fetched.length > 0) {
            sourceVoices = fetched
            source = 'edge-online'
          } else {
            source = 'builtin-fallback'
            fallbackReason = '在线音色目录返回为空'
          }
        } catch (error) {
          throwIfAborted(signal)
          source = 'builtin-fallback'
          fallbackReason = error instanceof Error ? error.message : String(error)
        }
      }

      const voices = hasFilter ? filterVoices({ locale, gender, tag }, sourceVoices) : sourceVoices
      const personas = args.includePersonas === false ? [] : VOICE_PERSONAS
      const customVoices = cfg.customVoices.map((c) => ({
        name: c.name,
        voice: c.voice ?? '',
        persona: c.persona ?? '',
        hasReferenceAudio: Boolean(c.referenceAudio),
      }))
      return {
        count: voices.length,
        voices,
        source,
        personas,
        customVoices,
        ...(fallbackReason !== '' ? { fallbackReason } : {}),
      }
    },
  }

  const voiceTts: VoiceToolDefinition = {
    name: 'voice_tts',
    isConcurrencySafe: () => !getCfg().overwrite,
    description: '文字转语音：默认调用 edge-tts（微软 Edge 朗读服务，免费）合成 MP3，也可在设置中切换 OpenAI/SiliconFlow/自定义 TTS 引擎。支持内置角色人设 persona、自然语言情绪指令 instructions、5–10 秒参考音频零样本克隆 referenceAudio、自定义发音词典 pronunciations、行内停顿标签 [pause:500ms]、多角色播客 segments（支持章节书签 title）、读取工作区 inputFile（Markdown 多标题自动生成 MP3 CHAP 章节书签与 chaptersOutput 时间轴）、按 .srt/.vtt 字幕时间轴反向卡点配音 subtitleInput、背景音乐自动闪避混音 bgmFile、长文自动分段（≤100000 字符）、导出 .srt/.vtt/.ass 字幕（支持 subtitleGranularity 短句/逐词与卡拉 OK 高亮）及 -16 LUFS 响度均衡 normalizeLoudness，并返回精确时长 durationMs/durationSec；输出默认 voice_output.mp3。',
    parameters: compileParameters({
      text: { type: 'string', description: '要合成的文本（若提供 inputFile、segments 或 subtitleInput 则可选；支持长文本自动分段与 [pause:500ms] 行内停顿标签，≤100000 字符）。' },
      inputFile: { type: 'string', description: '工作区内文稿文件路径（可选，如 article.md；指定时直接从文件读取，多级标题 Markdown 自动写入 MP3 章节书签）。' },
      subtitleInput: { type: 'string', description: '按现有 .srt/.vtt 字幕时间轴反向卡点配音（可选，工作区内字幕路径；每条字幕超出时间窗时自动微调语速加速，必要时用 ffmpeg atempo 精确贴合时间窗，句间自动补齐精确静音以对齐原视频画面）。' },
      cleanMarkdown: { type: 'boolean', description: '是否清理 Markdown 语法以便朗读（可选；inputFile 为 .md/.markdown 时默认 true）。' },
      segments: {
        type: 'array',
        description: '多角色对话/播客分段（可选，最多 50 段）：每段可独立指定 title/voice/persona/text/rate/pitch/pauseMs/instructions/referenceAudio/referenceText。',
        items: {
          type: 'object',
          properties: {
            title: { type: 'string', description: '本段章节标题（可选，用于写入 MP3 章节书签与章节时间轴）。' },
            voice: { type: 'string' },
            persona: { type: 'string' },
            text: { type: 'string' },
            rate: { type: 'string' },
            pitch: { type: 'string' },
            pauseMs: { type: 'number' },
            instructions: { type: 'string' },
            referenceAudio: { type: 'string' },
            referenceText: { type: 'string' },
          },
          required: ['text'],
        },
      },
      voice: { type: 'string', description: '音色 id 或自定义音色别名（可选，默认配置的 ttsVoice）。' },
      persona: { type: 'string', description: '内置角色人设 ID/标签（如 late-night-radio、anime-boy）或自定义音色别名（可选）。' },
      rate: { type: 'string', description: '语速，如 +20% 或 -10%（可选）。' },
      pitch: { type: 'string', description: '音调，如 +2Hz 或 -1Hz（可选）。' },
      instructions: { type: 'string', description: '自然语言情绪/语气指令（可选，OpenAI gpt-4o-mini-tts 与 SiliconFlow CosyVoice2 可用，如“用开心轻快的语气说”，支持 [laughter] / [breath]）。' },
      referenceAudio: { type: 'string', description: '零样本克隆参考音频路径（可选，会话工作区内 5–10 秒干净人声，≤10MB；需 siliconflow 或 custom 引擎）。' },
      referenceText: { type: 'string', description: '参考音频对应的原始台词文本（可选，零样本克隆推荐填写）。' },
      pronunciations: {
        type: 'array',
        description: '发音替读规则数组（可选，如 [{ word: "Nginx", alias: "Engine X" }]，与设置中的 pronunciations 合并，同名以本次参数优先；字幕保留原词，朗读按 alias 发音）。',
        items: {
          type: 'object',
          properties: {
            word: { type: 'string' },
            alias: { type: 'string' },
          },
          required: ['word', 'alias'],
        },
      },
      bgmFile: { type: 'string', description: '背景音乐文件路径（可选，工作区内音频文件；需本机安装 ffmpeg，将自动循环铺底并在人声出现时自动闪避降音）。' },
      bgmVolume: { type: 'number', default: 0.18, description: '背景音乐相对音量（可选，0.02–1.0，默认 0.18）。' },
      bgmDucking: { type: 'boolean', default: true, description: '人声说话时是否自动压低背景音乐音量（Auto-Ducking，可选，默认 true）。' },
      normalizeLoudness: { type: 'boolean', default: false, description: '是否在合成后通过 ffmpeg 执行 -16 LUFS 播客响度均衡（可选，默认 false）。' },
      output: { type: 'string', description: '输出 MP3 路径（可选，相对路径按会话工作目录解析）。' },
      subtitleOutput: { type: 'string', description: '导出同步字幕文件路径（可选，支持 .srt、.vtt 或带卡拉 OK 高亮的 .ass，相对路径按会话工作目录解析）。' },
      subtitleGranularity: { type: 'string', enum: ['sentence', 'clause', 'word'], description: '字幕粒度（可选：sentence 整句默认、clause 短视频短句切分、word 逐词时间轴；导出 .ass 字幕时自动获取词级时间轴生成卡拉 OK 高亮）。' },
      maxCharsPerCue: { type: 'integer', description: '短句字幕每屏最大字数（可选，4–80，默认 16，配合 subtitleGranularity=clause 或 .ass 字幕生效）。' },
      chaptersOutput: { type: 'string', description: '导出章节时间轴路径（可选，支持 .md/.txt 节目时间轴或 .json；Markdown 多标题文稿或带 title 的 segments 播客同时自动写入 MP3 ID3v2 CHAP 章节书签）。' },
    }),
    output: {
      schema: ttsSchema,
      render: (_args, value) => {
        const rec = asRecord(value)
        const chunksInfo = typeof rec.chunks === 'number' && rec.chunks > 1 ? '，共 ' + rec.chunks + ' 段' : ''
        const chaptersList = Array.isArray(rec.chapters) ? rec.chapters : []
        const chaptersInfo = chaptersList.length > 0 ? '，含 ' + chaptersList.length + ' 个章节' : ''
        const voiceLabel = typeof rec.voice === 'string' && rec.voice !== '' ? rec.voice : '参考音频克隆'
        const durationInfo = typeof rec.durationSec === 'number' ? '，时长 ' + rec.durationSec + ' 秒' : ''
        const lines = ['语音合成完成：' + rec.output + '（' + rec.bytes + ' 字节，音色 ' + voiceLabel + chunksInfo + chaptersInfo + durationInfo + '）']
        const subtitleFile = typeof rec.subtitleFile === 'string' ? rec.subtitleFile : ''
        if (subtitleFile !== '') lines.push('字幕文件已写入：' + subtitleFile)
        const chaptersFile = typeof rec.chaptersFile === 'string' ? rec.chaptersFile : ''
        if (chaptersFile !== '') lines.push('章节文件已写入：' + chaptersFile)
        return [{ type: 'text', text: lines.join('\n') }]
      },
    },
    async execute(rawArgs: unknown, exec: unknown) {
      const cfg = getCfg()
      const signal = execSignal(exec)
      throwIfAborted(signal)
      const args = asRecord(rawArgs)
      const cwd = sessionCwd(exec)
      const topVoice = optionalString(args, 'voice')
      const topPersona = optionalString(args, 'persona')
      const topRate = optionalString(args, 'rate')
      const topPitch = optionalString(args, 'pitch')
      const topInstructions = optionalString(args, 'instructions')
      const topReferenceAudio = optionalString(args, 'referenceAudio')
      const topReferenceText = optionalString(args, 'referenceText')
      const normalizeLoudness = args.normalizeLoudness === true
      const requested = optionalString(args, 'output')
      const subtitleOutput = optionalString(args, 'subtitleOutput')
      const chaptersOutput = optionalString(args, 'chaptersOutput')
      const needSubtitles = subtitleOutput !== undefined
      const rawGranularity = optionalString(args, 'subtitleGranularity')
      if (rawGranularity !== undefined && rawGranularity !== 'sentence' && rawGranularity !== 'clause' && rawGranularity !== 'word') {
        throw new Error('subtitleGranularity 必须是 sentence / clause / word 之一（当前：' + rawGranularity + '）。')
      }
      const subtitleGranularity: SubtitleGranularity = (rawGranularity as SubtitleGranularity | undefined) ?? 'sentence'
      const maxCharsPerCue = typeof args.maxCharsPerCue === 'number' && Number.isFinite(args.maxCharsPerCue)
        ? Math.min(80, Math.max(4, Math.round(args.maxCharsPerCue)))
        : 16
      const subtitleOpts: SubtitleSynthesisOptions | undefined = needSubtitles
        ? {
            granularity: subtitleGranularity,
            maxCharsPerCue,
            isAss: subtitleOutput !== undefined && subtitleFormatOf(subtitleOutput) === 'ass',
          }
        : undefined
      const mergedPronunciations = mergePronunciations(cfg.pronunciations, parseCallPronunciations(args.pronunciations))

      const writeChaptersOutput = (chapters: readonly AudioChapter[]): string => {
        if (chaptersOutput === undefined || chapters.length === 0) return ''
        const content = extname(chaptersOutput).toLowerCase() === '.json'
          ? JSON.stringify(chapters, null, 2) + '\n'
          : formatChaptersMarkdown(chapters)
        return writeWorkspaceFile(resolveOutputPath(chaptersOutput, '', cfg.overwrite, cwd), content, cwd, undefined, cfg.overwrite)
      }

      const bgmFile = optionalString(args, 'bgmFile')
      let bgmPath: string | undefined
      let bgmVolume = 0.18
      if (bgmFile !== undefined) {
        bgmPath = assertAudioFile(bgmFile, cwd)
        if (deps.mixBgm === undefined && !hasFfmpeg()) {
          throw new Error('使用 bgmFile 背景音乐自动闪避混音需要本机安装 ffmpeg（或使用 dsh-ffmpeg）。')
        }
        if (typeof args.bgmVolume === 'number' && Number.isFinite(args.bgmVolume)) {
          bgmVolume = Math.min(1.0, Math.max(0.02, args.bgmVolume))
        }
      }
      const bgmDucking = args.bgmDucking !== false
      const refAudioCache = new Map<string, Buffer>()

      const rawSegments = Array.isArray(args.segments) && args.segments.length > 0 ? args.segments : undefined
      if (rawSegments !== undefined) {
        if (rawSegments.length > MAX_TTS_SEGMENTS) {
          throw new Error('segments 最多 ' + MAX_TTS_SEGMENTS + ' 段（当前 ' + rawSegments.length + ' 段）。')
        }
        const topSpec = resolveEffectiveVoiceSpec(cfg, cwd, {
          voice: topVoice,
          persona: topPersona,
          rate: topRate,
          pitch: topPitch,
          instructions: topInstructions,
          referenceAudio: topReferenceAudio,
          referenceText: topReferenceText,
        }, refAudioCache)
        const parsedSegments: ParsedSegment[] = []
        let totalChars = 0
        for (let i = 0; i < rawSegments.length; i++) {
          const seg = asRecord(rawSegments[i])
          const rawSegText = optionalString(seg, 'text')
          if (rawSegText === undefined) throw new Error('第 ' + (i + 1) + ' 段 text 不能为空。')
          const segText = args.cleanMarkdown === true ? cleanMarkdownForSpeech(rawSegText).trim() : rawSegText
          if (segText === '') throw new Error('第 ' + (i + 1) + ' 段清理 Markdown 后文本为空。')
          totalChars += segText.length

          const segTitle = optionalString(seg, 'title')
          const segVoice = optionalString(seg, 'voice')
          const segPersona = optionalString(seg, 'persona')
          const segRate = optionalString(seg, 'rate')
          const segPitch = optionalString(seg, 'pitch')
          const segPauseMs = typeof seg.pauseMs === 'number' && Number.isFinite(seg.pauseMs) && seg.pauseMs >= 0
            ? Math.min(10000, Math.round(seg.pauseMs))
            : undefined
          const segInstructions = optionalString(seg, 'instructions')
          const segReferenceAudio = optionalString(seg, 'referenceAudio')
          const segReferenceText = optionalString(seg, 'referenceText')

          let segSpec: EffectiveVoiceSpec
          if (segVoice !== undefined || segPersona !== undefined) {
            segSpec = resolveEffectiveVoiceSpec(cfg, cwd, {
              voice: segVoice,
              persona: segPersona,
              rate: segRate ?? topRate,
              pitch: segPitch ?? topPitch,
              pauseMs: segPauseMs,
              instructions: segInstructions ?? topInstructions,
              referenceAudio: segReferenceAudio ?? topReferenceAudio,
              referenceText: segReferenceText ?? topReferenceText,
            }, refAudioCache)
          } else if (segReferenceAudio !== undefined) {
            segSpec = resolveEffectiveVoiceSpec(cfg, cwd, {
              voice: topVoice,
              persona: topPersona,
              rate: segRate ?? topRate,
              pitch: segPitch ?? topPitch,
              pauseMs: segPauseMs,
              instructions: segInstructions ?? topInstructions,
              referenceAudio: segReferenceAudio,
              referenceText: segReferenceText ?? topReferenceText,
            }, refAudioCache)
          } else {
            const reusedRefs = topSpec.references !== undefined && segReferenceText !== undefined
              ? topSpec.references.map((r) => ({ ...r, text: segReferenceText }))
              : topSpec.references
            segSpec = {
              voice: topSpec.voice,
              rate: segRate ?? topSpec.rate,
              pitch: segPitch ?? topSpec.pitch,
              pauseMs: segPauseMs ?? topSpec.pauseMs,
              ...(segInstructions !== undefined || topSpec.instructions !== undefined
                ? { instructions: segInstructions ?? topSpec.instructions }
                : {}),
              ...(reusedRefs !== undefined ? { references: reusedRefs } : {}),
              hasReferenceAudio: topSpec.hasReferenceAudio,
            }
          }

          const segUseEdge = resolveUseEdge(cfg, segSpec.hasReferenceAudio)
          assertTtsEngineReady(cfg, segUseEdge)
          assertTtsVoice(segSpec.voice, segUseEdge, segSpec.references !== undefined)
          assertProsody(segSpec.rate, segSpec.pitch)

          const chunks = segText.length > 4000 ? splitTextIntoChunks(segText, 2800) : [segText]
          parsedSegments.push({
            ...(segTitle !== undefined ? { title: segTitle } : {}),
            chunks,
            voice: segSpec.voice,
            rate: segSpec.rate,
            pitch: segSpec.pitch,
            pauseMs: segSpec.pauseMs,
            useEdge: segUseEdge,
            instructions: segSpec.instructions,
            references: segSpec.references,
          })
        }
        if (totalChars > MAX_TTS_CHARS) {
          throw new Error('segments 总文本超过 ' + MAX_TTS_CHARS + ' 字符上限（当前 ' + totalChars + ' 字符）。')
        }
        resolveOutputPath(requested, 'voice_output.mp3', cfg.overwrite, cwd)
        if (subtitleOutput !== undefined) resolveOutputPath(subtitleOutput, '', cfg.overwrite, cwd)
        if (chaptersOutput !== undefined) resolveOutputPath(chaptersOutput, '', cfg.overwrite, cwd)

        const tasks: Array<{
          segIndex: number
          text: string
          voice: string
          rate: string
          pitch: string
          useEdge: boolean
          instructions?: string
          references?: VoiceReference[]
        }> = []
        for (let s = 0; s < parsedSegments.length; s++) {
          const seg = parsedSegments[s]
          for (const chunkText of seg.chunks) {
            tasks.push({
              segIndex: s,
              text: chunkText,
              voice: seg.voice,
              rate: seg.rate,
              pitch: seg.pitch,
              useEdge: seg.useEdge,
              instructions: seg.instructions,
              references: seg.references,
            })
          }
        }
        const chunkResults = await mapLimit(tasks, TTS_CHUNK_CONCURRENCY, signal, (task) =>
          synthesizeChunk(
            cfg,
            task.useEdge,
            task.text,
            task.voice,
            task.rate,
            task.pitch,
            needSubtitles,
            signal,
            task.instructions,
            task.references,
            mergedPronunciations,
            subtitleOpts,
          ),
        )
        throwIfAborted(signal)

        const buffers: Buffer[] = []
        const allCues: SubtitleCue[] = []
        const allWordCues: SubtitleCue[] = []
        const chapters: AudioChapter[] = []
        const shouldRecordChapters = parsedSegments.some((s) => s.title !== undefined) || chaptersOutput !== undefined
        let offsetMs = 0
        let audioOffsetMs = 0
        let cueIndex = 1
        let wordCueIndex = 1
        let resultIdx = 0
        let detectedSampleRate = 24000
        for (let s = 0; s < parsedSegments.length; s++) {
          const seg = parsedSegments[s]
          const segStartMs = audioOffsetMs
          for (let c = 0; c < seg.chunks.length; c++) {
            const res = chunkResults[resultIdx++]
            buffers.push(res.audio)
            const chunkInfo = inspectMp3Buffer(res.audio)
            if (chunkInfo.frameCount > 0) detectedSampleRate = chunkInfo.sampleRate
            const chunkDurationMs = chunkInfo.durationMs
            audioOffsetMs += chunkDurationMs
            if (needSubtitles) {
              const shifted = offsetCues(res.cues, offsetMs, cueIndex)
              allCues.push(...shifted)
              cueIndex += shifted.length
              if (res.wordCues !== undefined && res.wordCues.length > 0) {
                const shiftedWords = offsetCues(res.wordCues, offsetMs, wordCueIndex)
                allWordCues.push(...shiftedWords)
                wordCueIndex += shiftedWords.length
              }
              const cueSpan = shifted.length > 0 ? Math.max(0, shifted[shifted.length - 1].endMs - offsetMs) : 0
              offsetMs += Math.max(chunkDurationMs, cueSpan)
            }
          }
          const segEndMs = Math.max(segStartMs, audioOffsetMs)
          if (shouldRecordChapters) {
            chapters.push({
              title: seg.title ?? ('第 ' + (s + 1) + ' 段'),
              startMs: segStartMs,
              endMs: segEndMs,
            })
          }
          if (s < parsedSegments.length - 1 && seg.pauseMs > 0) {
            const silence = createSilenceMp3(seg.pauseMs, detectedSampleRate)
            if (silence.length > 0) {
              buffers.push(silence)
              const silenceMs = inspectMp3Buffer(silence).durationMs
              audioOffsetMs += silenceMs
              offsetMs += silenceMs
            }
          }
        }

        let audio = buffers.length === 1 ? buffers[0] : concatMp3Buffers(buffers)
        audio = await finalizeVoiceAudio(audio, bgmPath, bgmVolume, bgmDucking, normalizeLoudness, signal)
        if (chapters.length > 0) {
          audio = embedMp3Chapters(audio, chapters)
        }
        const finalInfo = inspectMp3Buffer(audio)
        const durationMs = finalInfo.durationMs
        const durationSec = Math.round(durationMs / 100) / 10
        const output = writeWorkspaceFile(resolveOutputPath(requested, 'voice_output.mp3', cfg.overwrite, cwd), audio, cwd, undefined, cfg.overwrite)
        let subtitleFile = ''
        if (subtitleOutput !== undefined) {
          const formatted = formatSubtitles(allCues, subtitleFormatOf(subtitleOutput), allWordCues)
          subtitleFile = writeWorkspaceFile(resolveOutputPath(subtitleOutput, '', cfg.overwrite, cwd), formatted, cwd, undefined, cfg.overwrite)
        }
        const chaptersFile = writeChaptersOutput(chapters)
        return {
          output,
          bytes: audio.length,
          durationMs,
          durationSec,
          voice: topSpec.voice,
          rate: topSpec.rate,
          pitch: topSpec.pitch,
          textLength: totalChars,
          chunks: tasks.length,
          subtitleFile,
          ...(chapters.length > 0 ? { chapters } : {}),
          ...(chaptersFile !== '' ? { chaptersFile } : {}),
        }
      }

      const subtitleInput = optionalString(args, 'subtitleInput')
      if (subtitleInput !== undefined) {
        const resolvedSub = assertWorkspaceFile(subtitleInput, cwd, '字幕文件')
        const rawSub = readFileSync(resolvedSub, 'utf8')
        const cues = parseSubtitleFile(rawSub)
        if (cues.length === 0) {
          throw new Error('字幕文件未解析出任何有效字幕条目：' + subtitleInput)
        }
        if (cues.length > MAX_SUBTITLE_INPUT_CUES) {
          throw new Error('subtitleInput 最多支持 ' + MAX_SUBTITLE_INPUT_CUES + ' 条字幕（当前 ' + cues.length + ' 条），请拆分为多段处理。')
        }

        const spec = resolveEffectiveVoiceSpec(cfg, cwd, {
          voice: topVoice,
          persona: topPersona,
          rate: topRate,
          pitch: topPitch,
          instructions: topInstructions,
          referenceAudio: topReferenceAudio,
          referenceText: topReferenceText,
        }, refAudioCache)
        const useEdge = resolveUseEdge(cfg, spec.hasReferenceAudio)
        assertTtsEngineReady(cfg, useEdge)
        assertTtsVoice(spec.voice, useEdge, spec.references !== undefined)
        assertProsody(spec.rate, spec.pitch)
        resolveOutputPath(requested, 'voice_output.mp3', cfg.overwrite, cwd)
        if (subtitleOutput !== undefined) resolveOutputPath(subtitleOutput, '', cfg.overwrite, cwd)
        if (chaptersOutput !== undefined) resolveOutputPath(chaptersOutput, '', cfg.overwrite, cwd)

        const cueResults = await mapLimit(cues, TTS_CHUNK_CONCURRENCY, signal, async (cue) => {
          const cueText = args.cleanMarkdown === true
            ? (cleanMarkdownForSpeech(cue.text).trim() || cue.text.trim())
            : cue.text.trim()
          let res = await synthesizeChunk(
            cfg,
            useEdge,
            cueText,
            spec.voice,
            spec.rate,
            spec.pitch,
            false,
            signal,
            spec.instructions,
            spec.references,
            mergedPronunciations,
          )
          const actualMs = inspectMp3Buffer(res.audio).durationMs
          const windowMs = Math.max(200, cue.endMs - cue.startMs)
          if (actualMs > windowMs * 1.08) {
            const fastRate = scaleRatePercent(spec.rate, actualMs / windowMs)
            if (fastRate !== spec.rate) {
              res = await synthesizeChunk(
                cfg,
                useEdge,
                cueText,
                spec.voice,
                fastRate,
                spec.pitch,
                false,
                signal,
                spec.instructions,
                spec.references,
                mergedPronunciations,
              )
            }
          }
          const postInfo = inspectMp3Buffer(res.audio)
          const postMs = postInfo.durationMs
          if (postMs > windowMs * 1.03 && (deps.fitWindow !== undefined || (postInfo.frameCount > 0 && hasFfmpeg()))) {
            const fitted = await raceAbort((deps.fitWindow ?? fitAudioToWindow)(res.audio, windowMs, signal), signal)
            throwIfAborted(signal)
            res = { ...res, audio: fitted }
          }
          return { audio: res.audio, textLength: cueText.length }
        })
        throwIfAborted(signal)

        const buffers: Buffer[] = []
        const outCues: SubtitleCue[] = []
        let cursorMs = 0
        let detectedSampleRate = 24000
        let totalChars = 0

        for (let i = 0; i < cues.length; i++) {
          const cue = cues[i]
          const cueAudio = cueResults[i].audio
          totalChars += cueResults[i].textLength
          const cueInfo = inspectMp3Buffer(cueAudio)
          if (cueInfo.frameCount > 0) detectedSampleRate = cueInfo.sampleRate

          if (cue.startMs > cursorMs) {
            const pad = createSilenceMp3(cue.startMs - cursorMs, detectedSampleRate)
            if (pad.length > 0) {
              buffers.push(pad)
              cursorMs += inspectMp3Buffer(pad).durationMs
            }
          }
          const cueStartMs = cursorMs
          buffers.push(cueAudio)
          cursorMs += cueInfo.durationMs
          outCues.push({
            index: i + 1,
            startMs: cueStartMs,
            endMs: Math.max(cueStartMs + 1, cursorMs),
            text: stripInlinePauses(cue.text),
          })
        }

        let audio = buffers.length === 1 ? buffers[0] : concatMp3Buffers(buffers)
        audio = await finalizeVoiceAudio(audio, bgmPath, bgmVolume, bgmDucking, normalizeLoudness, signal)
        const finalInfo = inspectMp3Buffer(audio)
        const durationMs = finalInfo.durationMs
        const durationSec = Math.round(durationMs / 100) / 10
        const output = writeWorkspaceFile(resolveOutputPath(requested, 'voice_output.mp3', cfg.overwrite, cwd), audio, cwd, undefined, cfg.overwrite)
        let subtitleFile = ''
        if (subtitleOutput !== undefined) {
          const formatted = formatSubtitles(outCues, subtitleFormatOf(subtitleOutput))
          subtitleFile = writeWorkspaceFile(resolveOutputPath(subtitleOutput, '', cfg.overwrite, cwd), formatted, cwd, undefined, cfg.overwrite)
        }
        return { output, bytes: audio.length, durationMs, durationSec, voice: spec.voice, rate: spec.rate, pitch: spec.pitch, textLength: totalChars, chunks: cues.length, subtitleFile }
      }

      const inputFile = optionalString(args, 'inputFile')
      let rawSourceMarkdown = ''
      let shouldClean = false
      let finalText: string
      if (inputFile !== undefined) {
        const resolvedInput = assertWorkspaceFile(inputFile, cwd, '文稿文件')
        rawSourceMarkdown = readFileSync(resolvedInput, 'utf8')
        shouldClean = typeof args.cleanMarkdown === 'boolean'
          ? args.cleanMarkdown
          : /\.(md|markdown)$/i.test(resolvedInput)
        finalText = (shouldClean ? cleanMarkdownForSpeech(rawSourceMarkdown) : rawSourceMarkdown).trim()
        if (finalText === '') {
          throw new Error(shouldClean ? '文稿文件在清理 Markdown 后内容为空。' : '文稿文件内容为空。')
        }
      } else {
        rawSourceMarkdown = requiredString(args, 'text', '要合成的文本')
        shouldClean = typeof args.cleanMarkdown === 'boolean' ? args.cleanMarkdown : true
        finalText = args.cleanMarkdown === true ? cleanMarkdownForSpeech(rawSourceMarkdown).trim() : rawSourceMarkdown
        if (finalText === '') throw new Error('要合成的文本在清理 Markdown 后为空。')
      }

      if (finalText.length > MAX_TTS_CHARS) {
        throw new Error('文本超过 ' + MAX_TTS_CHARS + ' 字符上限（当前 ' + finalText.length + ' 字符），请拆分处理。')
      }

      const spec = resolveEffectiveVoiceSpec(cfg, cwd, {
        voice: topVoice,
        persona: topPersona,
        rate: topRate,
        pitch: topPitch,
        instructions: topInstructions,
        referenceAudio: topReferenceAudio,
        referenceText: topReferenceText,
      }, refAudioCache)
      const useEdge = resolveUseEdge(cfg, spec.hasReferenceAudio)
      assertTtsEngineReady(cfg, useEdge)
      assertTtsVoice(spec.voice, useEdge, spec.references !== undefined)
      assertProsody(spec.rate, spec.pitch)
      resolveOutputPath(requested, 'voice_output.mp3', cfg.overwrite, cwd)
      if (subtitleOutput !== undefined) resolveOutputPath(subtitleOutput, '', cfg.overwrite, cwd)
      if (chaptersOutput !== undefined) resolveOutputPath(chaptersOutput, '', cfg.overwrite, cwd)

      const checkMarkdownChapters = (inputFile !== undefined && /\.(md|markdown)$/i.test(inputFile)) || chaptersOutput !== undefined
      const mdSections = checkMarkdownChapters ? extractMarkdownSections(rawSourceMarkdown, shouldClean) : []
      if (mdSections.length >= 2 || (mdSections.length >= 1 && chaptersOutput !== undefined)) {
        const activeSections = mdSections
          .map((sec) => ({ title: sec.title, text: sec.text, chunks: splitTextIntoChunks(sec.text, 2800) }))
          .filter((sec) => sec.chunks.length > 0)
        if (activeSections.length > 0) {
          const secTasks: Array<{ secIndex: number; text: string }> = []
          for (let s = 0; s < activeSections.length; s++) {
            for (const chunkText of activeSections[s].chunks) {
              secTasks.push({ secIndex: s, text: chunkText })
            }
          }
          const secResults = await mapLimit(secTasks, TTS_CHUNK_CONCURRENCY, signal, (task) =>
            synthesizeChunk(
              cfg,
              useEdge,
              task.text,
              spec.voice,
              spec.rate,
              spec.pitch,
              needSubtitles,
              signal,
              spec.instructions,
              spec.references,
              mergedPronunciations,
              subtitleOpts,
            ),
          )
          throwIfAborted(signal)

          const sectionBuffers: Buffer[] = []
          const chapters: AudioChapter[] = []
          const allCues: SubtitleCue[] = []
          const allWordCues: SubtitleCue[] = []
          let audioOffsetMs = 0
          let cueOffsetMs = 0
          let cueIndex = 1
          let wordCueIndex = 1
          let taskCursor = 0
          let detectedSampleRate = 24000

          for (let s = 0; s < activeSections.length; s++) {
            const sec = activeSections[s]
            const chunkBuffers: Buffer[] = []
            const secStartMs = audioOffsetMs

            for (let c = 0; c < sec.chunks.length; c++) {
              const res = secResults[taskCursor++]
              chunkBuffers.push(res.audio)
              const chunkInfo = inspectMp3Buffer(res.audio)
              if (chunkInfo.frameCount > 0) detectedSampleRate = chunkInfo.sampleRate
              if (needSubtitles) {
                const shifted = offsetCues(res.cues, cueOffsetMs, cueIndex)
                allCues.push(...shifted)
                cueIndex += shifted.length
                if (res.wordCues !== undefined && res.wordCues.length > 0) {
                  const shiftedWords = offsetCues(res.wordCues, cueOffsetMs, wordCueIndex)
                  allWordCues.push(...shiftedWords)
                  wordCueIndex += shiftedWords.length
                }
                const cueSpan = shifted.length > 0 ? Math.max(0, shifted[shifted.length - 1].endMs - cueOffsetMs) : 0
                cueOffsetMs += Math.max(chunkInfo.durationMs, cueSpan)
              }
            }

            const secAudio = chunkBuffers.length === 1 ? chunkBuffers[0] : concatMp3Buffers(chunkBuffers)
            sectionBuffers.push(secAudio)
            const secDurationMs = inspectMp3Buffer(secAudio).durationMs
            const secEndMs = secStartMs + secDurationMs
            chapters.push({
              title: sec.title,
              startMs: secStartMs,
              endMs: secEndMs,
            })
            audioOffsetMs = secEndMs
            if (needSubtitles) cueOffsetMs = Math.max(cueOffsetMs, audioOffsetMs)

            if (s < activeSections.length - 1) {
              const gap = createSilenceMp3(350, detectedSampleRate)
              if (gap.length > 0) {
                sectionBuffers.push(gap)
                const gapMs = inspectMp3Buffer(gap).durationMs
                audioOffsetMs += gapMs
                cueOffsetMs += gapMs
              }
            }
          }

          let audio = sectionBuffers.length === 1 ? sectionBuffers[0] : concatMp3Buffers(sectionBuffers)
          throwIfAborted(signal)
          audio = await finalizeVoiceAudio(audio, bgmPath, bgmVolume, bgmDucking, normalizeLoudness, signal)
          audio = embedMp3Chapters(audio, chapters, { title: activeSections[0].title })
          const finalInfo = inspectMp3Buffer(audio)
          const durationMs = finalInfo.durationMs
          const durationSec = Math.round(durationMs / 100) / 10
          const output = writeWorkspaceFile(resolveOutputPath(requested, 'voice_output.mp3', cfg.overwrite, cwd), audio, cwd, undefined, cfg.overwrite)
          let subtitleFile = ''
          if (subtitleOutput !== undefined) {
            const formatted = formatSubtitles(allCues, subtitleFormatOf(subtitleOutput), allWordCues)
            subtitleFile = writeWorkspaceFile(resolveOutputPath(subtitleOutput, '', cfg.overwrite, cwd), formatted, cwd, undefined, cfg.overwrite)
          }
          const chaptersFile = writeChaptersOutput(chapters)
          return {
            output,
            bytes: audio.length,
            durationMs,
            durationSec,
            voice: spec.voice,
            rate: spec.rate,
            pitch: spec.pitch,
            textLength: finalText.length,
            chunks: secTasks.length,
            subtitleFile,
            chapters,
            ...(chaptersFile !== '' ? { chaptersFile } : {}),
          }
        }
      }

      let audio: Buffer
      let chunkCount = 1
      let subtitleFile = ''

      if (finalText.length <= 5000 && !needSubtitles && useEdge) {
        const res = await synthesizeChunk(cfg, true, finalText, spec.voice, spec.rate, spec.pitch, false, signal, spec.instructions, spec.references, mergedPronunciations)
        audio = res.audio
      } else {
        const chunks = splitTextIntoChunks(finalText, 2800)
        chunkCount = chunks.length
        const results = await mapLimit(chunks, TTS_CHUNK_CONCURRENCY, signal, (chunk) =>
          synthesizeChunk(cfg, useEdge, chunk, spec.voice, spec.rate, spec.pitch, needSubtitles, signal, spec.instructions, spec.references, mergedPronunciations, subtitleOpts),
        )
        throwIfAborted(signal)
        audio = results.length === 1 ? results[0].audio : concatMp3Buffers(results.map((r) => r.audio))
        if (subtitleOutput !== undefined) {
          const allCues: SubtitleCue[] = []
          const allWordCues: SubtitleCue[] = []
          let offsetMs = 0
          let cueIndex = 1
          let wordCueIndex = 1
          for (const res of results) {
            const shifted = offsetCues(res.cues, offsetMs, cueIndex)
            allCues.push(...shifted)
            cueIndex += shifted.length
            if (res.wordCues !== undefined && res.wordCues.length > 0) {
              const shiftedWords = offsetCues(res.wordCues, offsetMs, wordCueIndex)
              allWordCues.push(...shiftedWords)
              wordCueIndex += shiftedWords.length
            }
            const chunkDurationMs = inspectMp3Buffer(res.audio).durationMs
            const cueSpan = shifted.length > 0 ? Math.max(0, shifted[shifted.length - 1].endMs - offsetMs) : 0
            offsetMs += Math.max(chunkDurationMs, cueSpan)
          }
          const formatted = formatSubtitles(allCues, subtitleFormatOf(subtitleOutput), allWordCues)
          subtitleFile = writeWorkspaceFile(resolveOutputPath(subtitleOutput, '', cfg.overwrite, cwd), formatted, cwd, undefined, cfg.overwrite)
        }
      }

      throwIfAborted(signal)
      audio = await finalizeVoiceAudio(audio, bgmPath, bgmVolume, bgmDucking, normalizeLoudness, signal)
      const finalInfo = inspectMp3Buffer(audio)
      const durationMs = finalInfo.durationMs
      const durationSec = Math.round(durationMs / 100) / 10
      const output = writeWorkspaceFile(resolveOutputPath(requested, 'voice_output.mp3', cfg.overwrite, cwd), audio, cwd, undefined, cfg.overwrite)
      return { output, bytes: audio.length, durationMs, durationSec, voice: spec.voice, rate: spec.rate, pitch: spec.pitch, textLength: finalText.length, chunks: chunkCount, subtitleFile }
    },
    get timeoutMs() { return getCfg().timeoutMs + 10000 },
  }

  const voiceStt: VoiceToolDefinition = {
    name: 'voice_stt',
    isConcurrencySafe: () => !getCfg().overwrite,
    description: '语音转文字：调用 OpenAI 兼容 ASR 接口（默认 Groq whisper-large-v3-turbo；可切 openai/siliconflow/custom）。audio 支持音频文件（mp3/wav/m4a/ogg/flac/webm，≤25MB；超过 25MB 可设 autoCompress=true 用 ffmpeg 自动压缩分段）及视频容器（mp4/mkv/mov/avi，在有 ffmpeg 时自动剥离视频轨提取轻量单声道音频）；支持多人说话人区分 diarize=true（双声道按声道分离或推断说话人切换）；language/prompt 可选；output 可写 .txt，subtitleOutput 可写 .srt/.vtt/.ass 字幕。',
    parameters: compileParameters({
      audio: { type: 'string', required: true, description: '音频或视频文件路径（必填，支持 mp3/wav/m4a/ogg/flac/webm 及 mp4/mkv/mov/avi 视频自动提取音轨）。' },
      engine: { type: 'string', enum: ['groq', 'openai', 'siliconflow', 'custom'], description: '引擎（可选）：只接受与配置 asrEngine 相同的值，用于显式确认；接口地址与密钥始终取配置。' },
      model: { type: 'string', description: '模型名（可选，覆盖配置）。' },
      language: { type: 'string', description: '语言提示，如 zh（可选）。' },
      prompt: { type: 'string', description: '提示词（专有名词/术语纠偏，可选）。' },
      output: { type: 'string', description: '把转写文本写成 .txt 的路径（可选，相对路径按会话工作目录解析）。' },
      subtitleOutput: { type: 'string', description: '导出字幕路径（可选，.srt、.vtt 或 .ass，相对路径按会话工作目录解析；指定时自动开启时间戳）。' },
      timestamps: { type: 'boolean', description: '是否请求分段时间戳（可选，默认 false）。' },
      diarize: { type: 'boolean', description: '是否启用多人说话人区分（可选，默认 false；双声道录音在有 ffmpeg 时可按声道分离，或解析/推断说话人切换并输出 [说话人 A] 标记）。' },
      autoCompress: { type: 'boolean', description: '超过 25MB 时是否自动调用本地 ffmpeg 压缩与分段转写（可选，默认 false）。' },
    }),
    output: {
      schema: sttSchema,
      render: (_args, value) => {
        const rec = asRecord(value)
        const lines = ['转写完成（模型 ' + rec.model + '）：' + rec.text]
        // 用户明确要了 output 就得看到落在哪儿，否则等于没保存。
        const saved = typeof rec.transcriptFile === 'string' ? rec.transcriptFile : ''
        if (saved !== '') lines.push('', '转写文本已写入：' + saved)
        const subSaved = typeof rec.subtitleFile === 'string' ? rec.subtitleFile : ''
        if (subSaved !== '') lines.push('字幕文件已写入：' + subSaved)
        return [{ type: 'text', text: lines.join('\n') }]
      },
    },
    async execute(rawArgs: unknown, exec: unknown) {
      const cfg = getCfg()
      const signal = execSignal(exec)
      throwIfAborted(signal)
      const args = asRecord(rawArgs)
      const cwd = sessionCwd(exec)
      const audioPath = assertAudioFile(requiredString(args, 'audio', '音频文件'), cwd)
      const requestedEngine = optionalString(args, 'engine')
      if (requestedEngine !== undefined && !['groq', 'openai', 'siliconflow', 'custom'].includes(requestedEngine)) {
        throw new Error('engine 必须是 groq / openai / siliconflow / custom 之一（当前：' + requestedEngine + '）。')
      }
      if (requestedEngine !== undefined && requestedEngine !== cfg.asrEngine) {
        throw new Error('voice_stt 不支持用 engine 参数临时换引擎（配置 asrEngine=' + cfg.asrEngine + '，本次传入 ' + requestedEngine + '）。接口地址与密钥是一组配置，混着用会把密钥发到非预期的服务；如需切换请在 DSH「设置 → 插件 → 语音」修改 asrEngine / asrBaseUrl（保存即生效）。')
      }
      // 接口地址一律取配置：openai/groq/siliconflow 预设已由 resolveConfig 回填，自定义端点原样使用。
      const baseUrl = cfg.asrBaseUrl
      if (baseUrl === '') throw new Error('未配置 ASR 接口地址：asrEngine=custom 时必须在 DSH「设置 → 插件 → 语音」或配置里提供 asrBaseUrl（保存即生效）。')

      const output = optionalString(args, 'output')
      const subtitleOutput = optionalString(args, 'subtitleOutput')
      if (output !== undefined) resolveOutputPath(output, '', cfg.overwrite, cwd)
      if (subtitleOutput !== undefined) resolveOutputPath(subtitleOutput, '', cfg.overwrite, cwd)

      const model = optionalString(args, 'model') ?? (cfg.asrModel !== '' ? cfg.asrModel : FALLBACK_ASR_MODEL)
      const language = optionalString(args, 'language')
      const prompt = optionalString(args, 'prompt')
      const diarize = args.diarize === true
      const needTimestamps = args.timestamps === true || subtitleOutput !== undefined || diarize
      const allowEmptyApiKey = cfg.asrEngine === 'custom' && isLoopbackBaseUrl(baseUrl)
      const fetchImpl = getProxyFetch(cfg.proxyUrl) ?? globalThis.fetch
      const sttFn = deps.stt ?? transcribe

      const collectSpeakers = (segs: readonly SttSegment[] | undefined, explicit?: readonly string[]): string[] | undefined => {
        if (Array.isArray(explicit) && explicit.length > 0) return [...explicit]
        if (!Array.isArray(segs)) return undefined
        const uniq = new Set<string>()
        for (const s of segs) {
          if (typeof s.speaker === 'string' && s.speaker.trim() !== '') uniq.add(s.speaker.trim())
        }
        return uniq.size > 0 ? Array.from(uniq) : undefined
      }

      const fileSize = statSync(audioPath).size
      const isVideo = isVideoContainerFile(audioPath)
      let text = ''
      let detectedLanguage = ''
      let duration: number | undefined
      let segments: SttSegment[] | undefined
      let speakers: string[] | undefined

      if (fileSize > MAX_ASR_BYTES || (isVideo && (deps.prepareAudio !== undefined || (deps.stt === undefined && hasFfmpeg())))) {
        if (fileSize > MAX_ASR_BYTES && !isVideo && args.autoCompress !== true) {
          assertAudioSize(fileSize)
        }
        if (deps.prepareAudio === undefined && !hasFfmpeg()) {
          if (isVideo) {
            throw new Error('视频文件超过 25MB 且未检测到本机 ffmpeg；请先安装 ffmpeg（或使用 dsh-ffmpeg 提取音轨）以便自动剥离视频流后转写。')
          }
          throw new Error('音频超过 25MB，且未检测到 ffmpeg；请先安装 ffmpeg（或使用 dsh-ffmpeg 压缩），再启用 autoCompress=true。')
        }
        const prep = await raceAbort((deps.prepareAudio ?? prepareAudioForAsr)(audioPath, signal), signal)
        try {
          const chunkResults = await mapLimit(prep.chunks, 2, signal, async (chunk) => {
            const res = await raceAbort(sttFn(baseUrl, cfg.asrApiKey, {
              audio: chunk.audio,
              filename: chunk.filename,
              model,
              language,
              prompt,
              timestamps: needTimestamps,
              ...(diarize ? { diarize: true } : {}),
              allowEmptyApiKey,
            }, fetchImpl, cfg.timeoutMs, signal), signal)
            return { chunk, res }
          })
          throwIfAborted(signal)
          const rawText = chunkResults.map((item) => item.res.text.trim()).filter(Boolean).join('\n')
          text = rawText
          detectedLanguage = chunkResults.find((item) => typeof item.res.language === 'string' && item.res.language !== '')?.res.language ?? ''
          let totalDuration = 0
          let hasDuration = false
          const mergedSegments: SttSegment[] = []
          let segId = 1
          for (const { chunk, res } of chunkResults) {
            if (typeof res.duration === 'number' && Number.isFinite(res.duration)) {
              totalDuration = Math.max(totalDuration, chunk.offsetSeconds + res.duration)
              hasDuration = true
            }
            if (Array.isArray(res.segments) && res.segments.length > 0) {
              for (const seg of res.segments) {
                mergedSegments.push({
                  id: segId++,
                  start: seg.start + chunk.offsetSeconds,
                  end: seg.end + chunk.offsetSeconds,
                  text: seg.text,
                  ...(seg.speaker !== undefined ? { speaker: seg.speaker } : {}),
                })
              }
            }
          }
          if (hasDuration) duration = totalDuration
          if (mergedSegments.length > 0) segments = mergedSegments
          if (diarize) {
            if (mergedSegments.some((s) => typeof s.speaker === 'string' && s.speaker.trim() !== '')) {
              const diarized = formatDiarizedTranscript(mergedSegments)
              if (diarized !== '') text = diarized
            }
            speakers = collectSpeakers(mergedSegments, chunkResults.flatMap((item) => item.res.speakers ?? []))
          }
        } finally {
          prep.cleanup()
        }
      } else {
        let handledStereo = false
        if (diarize && (deps.splitStereo !== undefined || (deps.stt === undefined && hasFfmpeg()))) {
          const stereo = await raceAbort((deps.splitStereo ?? splitStereoChannelsForDiarization)(audioPath, signal), signal)
          if (stereo !== null && stereo.channels.length > 0) {
            handledStereo = true
            try {
              const channelResults = await mapLimit(stereo.channels, 2, signal, async (ch) => {
                const res = await raceAbort(sttFn(baseUrl, cfg.asrApiKey, {
                  audio: ch.audio,
                  filename: ch.filename,
                  model,
                  language,
                  prompt,
                  timestamps: true,
                  allowEmptyApiKey,
                }, fetchImpl, cfg.timeoutMs, signal), signal)
                return { ch, res }
              })
              throwIfAborted(signal)

              const mergedSegments: SttSegment[] = []
              let totalDuration = 0
              let hasDuration = false
              for (const { ch, res } of channelResults) {
                if (detectedLanguage === '' && typeof res.language === 'string' && res.language !== '') {
                  detectedLanguage = res.language
                }
                if (typeof res.duration === 'number' && Number.isFinite(res.duration)) {
                  totalDuration = Math.max(totalDuration, res.duration)
                  hasDuration = true
                }
                if (Array.isArray(res.segments) && res.segments.length > 0) {
                  for (const seg of res.segments) {
                    mergedSegments.push({
                      id: seg.id,
                      start: seg.start,
                      end: seg.end,
                      text: seg.text,
                      speaker: ch.speaker,
                    })
                  }
                } else if (res.text.trim() !== '') {
                  mergedSegments.push({
                    id: 0,
                    start: 0,
                    end: typeof res.duration === 'number' && Number.isFinite(res.duration) ? res.duration : 0,
                    text: res.text.trim(),
                    speaker: ch.speaker,
                  })
                }
              }
              mergedSegments.sort((a, b) => a.start - b.start)
              for (let i = 0; i < mergedSegments.length; i++) {
                mergedSegments[i] = { ...mergedSegments[i], id: i + 1 }
              }
              if (hasDuration) duration = totalDuration
              if (mergedSegments.length > 0) segments = mergedSegments
              const rawFallback = channelResults.map((item) => item.res.text.trim()).filter(Boolean).join('\n')
              const diarized = formatDiarizedTranscript(mergedSegments)
              text = diarized !== '' ? diarized : rawFallback
              speakers = collectSpeakers(mergedSegments)
            } finally {
              stereo.cleanup()
            }
          }
        }

        if (!handledStereo) {
          let audioInput: Buffer | Blob
          if (deps.stt !== undefined) {
            // 保持单元测试兼容性：注入假 stt 时传 Buffer（部分测试会对 captured.audio 做扩展运算符迭代）。
            const buf = readFileSync(audioPath)
            assertAudioSize(buf.length)
            audioInput = buf
          } else {
            let blob: Buffer | Blob = await openAsBlob(audioPath, { type: mimeFromPath(audioPath) })
            // 伪文件（如 procfs）size 报 0 字节，回退到 readFileSync 再判一次。
            if (blob.size === 0) blob = readFileSync(audioPath)
            assertAudioSize(Buffer.isBuffer(blob) ? blob.length : blob.size)
            audioInput = blob
          }
          const res = await raceAbort(sttFn(baseUrl, cfg.asrApiKey, {
            audio: audioInput,
            filename: basename(audioPath),
            model,
            language,
            prompt,
            timestamps: needTimestamps,
            ...(diarize ? { diarize: true } : {}),
            allowEmptyApiKey,
          }, fetchImpl, cfg.timeoutMs, signal), signal)
          throwIfAborted(signal)
          const rawText = res.text
          text = rawText
          detectedLanguage = res.language ?? ''
          duration = res.duration
          segments = res.segments
          if (diarize) {
            if (Array.isArray(res.segments) && res.segments.some((s) => typeof s.speaker === 'string' && s.speaker.trim() !== '')) {
              const diarized = formatDiarizedTranscript(res.segments)
              if (diarized !== '') text = diarized
            }
            speakers = collectSpeakers(res.segments, res.speakers)
          }
        }
      }

      let transcriptFile = ''
      if (output !== undefined) {
        const target = resolveOutputPath(output, '', cfg.overwrite, cwd)
        // 转写文本可能含隐私内容，只用 0600 写入。
        transcriptFile = writeWorkspaceFile(target, text, cwd, 0o600, cfg.overwrite)
      }

      let subtitleFile = ''
      if (subtitleOutput !== undefined) {
        const cueSegments: SttSegment[] = segments !== undefined && segments.length > 0
          ? segments
          : [{ id: 1, start: 0, end: duration !== undefined && duration > 0 ? duration : 5, text }]
        const sttSubFmt = subtitleFormatOf(subtitleOutput)
        const subText = sttSubFmt === 'ass'
          ? formatSubtitles(
              cueSegments
                .filter((seg) => seg.text.trim() !== '')
                .map((seg, idx) => {
                  const clean = seg.text.trim()
                  const speaker = typeof seg.speaker === 'string' ? seg.speaker.trim() : ''
                  return {
                    index: idx + 1,
                    startMs: Math.max(0, Math.round(seg.start * 1000)),
                    endMs: Math.max(1, Math.round(seg.end * 1000)),
                    text: speaker !== '' ? `[${speaker}] ${clean}` : clean,
                  }
                }),
              'ass',
            )
          : formatSttSubtitles(cueSegments, sttSubFmt)
        subtitleFile = writeWorkspaceFile(resolveOutputPath(subtitleOutput, '', cfg.overwrite, cwd), subText, cwd, 0o600, cfg.overwrite)
      }

      // The output schema declares string fields — never return null, or dsh rejects the whole tool result.
      return {
        text,
        model,
        language: language ?? detectedLanguage,
        audio: audioPath,
        transcriptFile,
        subtitleFile,
        ...(duration !== undefined ? { duration } : {}),
        ...(segments !== undefined ? { segments } : {}),
        ...(speakers !== undefined && speakers.length > 0 ? { speakers } : {}),
      }
    },
    get timeoutMs() { return getCfg().timeoutMs + 10000 },
  }

  const voicePreview: VoiceToolDefinition = {
    name: 'voice_preview',
    isConcurrencySafe: () => !getCfg().overwrite,
    description: '音色试听：用一段固定试听文本批量生成短样例 MP3，并默认生成可直接在浏览器试听对比的 index.html。voices 支持音色 id、内置角色人设（persona）或自定义音色别名（customVoices）数组（可选，缺省 voice_list 前 4 个，最多 8 个）；text 可自定义（≤200 字符）；样例文件写入输出目录（默认会话工作目录 voice_previews）。单个音色失败不阻断其他。',
    parameters: compileParameters({
      voices: { type: 'array', items: { type: 'string' }, description: '音色 id、内置人设 ID/标签（如 late-night-radio、anime-boy）或自定义音色别名数组（可选，缺省 voice_list 前 4 个，最多 8 个）。' },
      text: { type: 'string', description: '试听文本（可选，默认中英混合试听句，≤200 字符）。' },
      outputDir: { type: 'string', description: '输出目录（可选，默认会话工作目录下 voice_previews）。' },
      htmlIndex: { type: 'boolean', default: true, description: '是否在输出目录生成可试听的 index.html 试听页（默认 true）。' },
    }),
    output: {
      schema: previewSchema,
      render: (_args, value) => {
        const rec = asRecord(value)
        const samples = Array.isArray(rec.samples) ? rec.samples : []
        const failed = Array.isArray(rec.failed) ? rec.failed : []
        const lines = ['试听样例已生成 ' + samples.length + ' 个（试听文本：' + rec.text + '）：']
        for (const item of samples) {
          const s = asRecord(item)
          lines.push('- ' + s.voice + ' -> ' + s.output)
        }
        for (const item of failed) {
          const f = asRecord(item)
          lines.push('- ' + f.voice + ' 失败：' + String(f.error ?? ''))
        }
        if (typeof rec.indexHtml === 'string' && rec.indexHtml !== '') {
          lines.push('', '试听对比页：' + rec.indexHtml)
        }
        return [{ type: 'text', text: lines.join('\n') }]
      },
    },
    async execute(rawArgs: unknown, exec: unknown) {
      const cfg = getCfg()
      const signal = execSignal(exec)
      throwIfAborted(signal)
      const args = asRecord(rawArgs)
      const rawVoices = Array.isArray(args.voices)
        ? args.voices.filter((v): v is string => typeof v === 'string' && v.trim() !== '').map((v) => v.trim())
        : []
      const targets = rawVoices.length > 0 ? rawVoices : VOICES.slice(0, 4).map((v) => v.id)
      if (targets.length > 8) throw new Error('voices 最多 8 个（当前 ' + targets.length + ' 个），试听一次别太多，慢且耗资源。')
      const text = optionalString(args, 'text') ?? DEFAULT_PREVIEW_TEXT
      if (text.length > 200) throw new Error('试听文本请控制在 200 字以内（试听要短平快）。')
      assertTtsEngineReady(cfg, resolveUseEdge(cfg, false))
      const cwd = sessionCwd(exec)
      const outDir = ensureWorkspaceDirectory(optionalString(args, 'outputDir') ?? 'voice_previews', cwd)
      const outcomes = await mapLimit<string, PreviewOutcome>(targets, PREVIEW_CONCURRENCY, signal, async (target) => {
        throwIfAborted(signal)
        try {
          const spec = resolveEffectiveVoiceSpec(cfg, cwd, { voice: target })
          const targetUseEdge = resolveUseEdge(cfg, spec.hasReferenceAudio)
          assertTtsEngineReady(cfg, targetUseEdge)
          if (targetUseEdge && !isValidVoiceId(spec.voice)) {
            return { voice: target, error: '音色 id 不合法（应为 zh-CN-XXXNeural 形式的 edge 音色）' }
          }
          if (!targetUseEdge && spec.voice.trim() === '' && (spec.references === undefined || spec.references.length === 0)) {
            return { voice: target, error: '音色 id 不合法：不能为空' }
          }
          assertProsody(spec.rate, spec.pitch)
          const { audio } = await synthesizeChunk(cfg, targetUseEdge, text, spec.voice, spec.rate, spec.pitch, false, signal, spec.instructions, spec.references)
          throwIfAborted(signal)
          const name = 'voice-preview-' + target.replace(/[^a-zA-Z0-9-\u4e00-\u9fa5]/g, '_') + '.mp3'
          // 复用 resolveOutputPath：overwrite=false 时改名加序号，不再直接覆盖同名样例。
          const file = resolveOutputPath(join(outDir, name), '', cfg.overwrite, cwd)
          const output = writeWorkspaceFile(file, audio, cwd, undefined, cfg.overwrite)
          return { voice: target, output, bytes: audio.length }
        } catch (error) {
          throwIfAborted(signal)
          return { voice: target, error: error instanceof Error ? error.message : String(error) }
        }
      })
      const samples: Array<Record<string, unknown>> = []
      const failed: Array<Record<string, unknown>> = []
      for (const outcome of outcomes) {
        if (outcome.error !== undefined) failed.push({ voice: outcome.voice, error: outcome.error })
        else samples.push({ voice: outcome.voice, output: outcome.output, bytes: outcome.bytes })
      }
      let indexHtml = ''
      if (samples.length > 0 && args.htmlIndex !== false) {
        const voiceMap = new Map(VOICES.map((v) => [v.id, v]))
        const htmlSamples = samples.map((s) => {
          const id = String(s.voice)
          const meta = voiceMap.get(id)
          if (meta !== undefined) {
            return {
              voice: id,
              fileName: basename(String(s.output)),
              locale: meta.locale,
              gender: meta.gender,
            }
          }
          const persona = resolvePersona(id)
          if (persona !== undefined) {
            return {
              voice: id,
              fileName: basename(String(s.output)),
              locale: persona.label + '（' + persona.voice + '）',
            }
          }
          const alias = resolveCustomVoice(cfg.customVoices, id)
          if (alias !== undefined) {
            return {
              voice: id,
              fileName: basename(String(s.output)),
              locale: '自定义音色' + (alias.voice ? '（' + alias.voice + '）' : ''),
            }
          }
          return {
            voice: id,
            fileName: basename(String(s.output)),
          }
        })
        const html = renderPreviewHtml(htmlSamples, text)
        try {
          indexHtml = writeWorkspaceFile(resolveOutputPath(join(outDir, 'index.html'), '', true, cwd), html, cwd, undefined, true)
        } catch {
          // 即使 index.html 遇到符号链接/硬链接保护，也不阻断试听样例生成本身。
        }
      }
      return { count: samples.length, samples, failed, text, ...(indexHtml !== '' ? { indexHtml } : {}) }
    },
    get timeoutMs() { return getCfg().timeoutMs * 3 + 15000 },
  }

  const voiceHealth: VoiceToolDefinition = {
    name: 'voice_health',
    isConcurrencySafe: () => true,
    description: 'dsh-voice 自检：检查 TTS 音色/引擎/语速音调、代理配置与 ASR 引擎/接口地址/密钥就绪状态（不发起网络请求）。支持按 scope（all/tts/stt）分别检查。',
    parameters: compileParameters({
      scope: { type: 'string', enum: ['all', 'tts', 'stt'], description: '检查范围（可选：all 全部 / tts 仅语音合成 / stt 仅语音转写，默认 all）。' },
    }),
    output: {
      schema: { type: 'object', additionalProperties: true },
      render: (_args, value) => {
        const rec = asRecord(value)
        const checks = Array.isArray(rec.checks) ? rec.checks : []
        const lines = ['dsh-voice 自检' + (rec.ok === true ? '：正常。' : '：发现问题。')]
        for (const item of checks) {
          const c = asRecord(item)
          lines.push('- ' + c.name + '：' + (c.ok === true ? '✅ ' + String(c.detail ?? '') : '❌ ' + String(c.detail ?? '')))
        }
        // 自检要给出下一步：失败项各自的修复动作，而不是只报红。
        const hints = Array.isArray(rec.hints) ? rec.hints : []
        if (hints.length > 0) {
          lines.push('', '建议：')
          for (const hint of hints) lines.push('- ' + String(hint))
        }
        return [{ type: 'text', text: lines.join('\n') }]
      },
    },
    async execute(rawArgs: unknown) {
      const cfg = getCfg()
      const args = asRecord(rawArgs)
      const scopeArg = optionalString(args, 'scope')
      if (scopeArg !== undefined && !['all', 'tts', 'stt'].includes(scopeArg)) {
        throw new Error('scope 必须是 all / tts / stt 之一（当前：' + scopeArg + '）。')
      }
      const scope = (scopeArg as 'all' | 'tts' | 'stt' | undefined) ?? 'all'

      const checks: Array<Record<string, unknown>> = []
      const ttsHints: string[] = []
      const sttHints: string[] = []

      // 1. TTS 音色（保持 checks[0] 以兼容既有测试对 checks[0].detail 的断言）
      const matchedAlias = resolveCustomVoice(cfg.customVoices, cfg.ttsVoice)
      const matchedPersona = resolvePersona(cfg.ttsVoice)
      const voiceOk = cfg.ttsEngine === 'edge'
        ? (isValidVoiceId(cfg.ttsVoice) || matchedAlias !== undefined || matchedPersona !== undefined)
        : cfg.ttsVoice.trim() !== ''
      checks.push({
        name: 'TTS 音色',
        ok: voiceOk,
        detail: voiceOk ? cfg.ttsVoice : '不合法：' + cfg.ttsVoice + '（用 voice_list 查看）',
        ...(voiceOk ? {} : { hint: '运行 voice_list 挑一个清单内音色，在 DSH「设置 → 插件 → 语音」修改 ttsVoice（保存即生效）；合法 id 形如 zh-CN-XiaoxiaoNeural。' }),
      })
      if (!voiceOk) {
        ttsHints.push('TTS 音色不合法：先用 voice_list 选音色，再在 DSH「设置 → 插件 → 语音」修改 ttsVoice（保存即生效）；在此之前 voice_tts 调用会直接报错。')
      }

      // 2. TTS 引擎
      let ttsEngineOk = true
      let ttsEngineDetail = 'edge（免费零配置）'
      let ttsEngineHint: string | undefined
      if (cfg.ttsEngine !== 'edge') {
        const ttsBaseOk = cfg.ttsBaseUrl !== ''
        const ttsKeyOk = cfg.ttsApiKey !== '' || (ttsBaseOk && isLoopbackBaseUrl(cfg.ttsBaseUrl))
        ttsEngineOk = ttsBaseOk && ttsKeyOk
        if (!ttsBaseOk) {
          ttsEngineDetail = '未配置：ttsEngine=' + cfg.ttsEngine + ' 时必须提供 ttsBaseUrl'
          ttsEngineHint = '在 DSH「设置 → 插件 → 语音」补上 ttsBaseUrl（含 /v1 的 OpenAI 兼容地址），或改回 edge。'
          ttsHints.push('TTS 接口地址缺失：当前 ttsEngine=' + cfg.ttsEngine + '，需配置 ttsBaseUrl 或切回免费 edge 引擎。')
        } else if (!ttsKeyOk) {
          ttsEngineDetail = '未配置 TTS 密钥：需要 DSH_VOICE_TTS_KEY 或配置 ttsApiKey'
          ttsEngineHint = '在 DSH「设置 → 插件 → 语音」填写 ttsApiKey，或设置环境变量 DSH_VOICE_TTS_KEY（或切回免费 edge 引擎）。'
          ttsHints.push('缺 TTS 密钥：当前 ttsEngine=' + cfg.ttsEngine + ' 需要 ttsApiKey / DSH_VOICE_TTS_KEY，或改回零密钥的 edge。')
        } else {
          ttsEngineDetail = cfg.ttsEngine + '（' + cfg.ttsBaseUrl + '）'
        }
      }
      checks.push({
        name: 'TTS 引擎',
        ok: ttsEngineOk,
        detail: ttsEngineDetail,
        ...(ttsEngineHint !== undefined ? { hint: ttsEngineHint } : {}),
      })

      // 3. TTS 语速与音调
      const prosodyOk = isValidProsody(cfg.ttsRate) && isValidProsody(cfg.ttsPitch)
      checks.push({
        name: 'TTS 语速与音调',
        ok: prosodyOk,
        detail: prosodyOk ? 'rate=' + cfg.ttsRate + ', pitch=' + cfg.ttsPitch : '不合法：rate=' + cfg.ttsRate + ', pitch=' + cfg.ttsPitch,
        ...(prosodyOk ? {} : { hint: '语速/音调必须符合 +10%、-20%、+2Hz、-1st 格式，请在 DSH「设置 → 插件 → 语音」修正 ttsRate / ttsPitch。' }),
      })
      if (!prosodyOk) {
        ttsHints.push('TTS 语速或音调格式不合法：请在设置中修正 ttsRate / ttsPitch（如 +0% / +0Hz）。')
      }

      // 4. 特殊代理
      checks.push({ name: '特殊代理', ok: true, detail: cfg.proxyUrl !== '' ? '已配置 ' + cfg.proxyUrl : '未配置' })

      // 5. ASR 引擎
      checks.push({ name: 'ASR 引擎', ok: true, detail: cfg.asrEngine })

      // 6. ASR 接口地址
      const baseUrlOk = cfg.asrBaseUrl !== ''
      checks.push({
        name: 'ASR 接口地址',
        ok: baseUrlOk,
        detail: baseUrlOk ? cfg.asrBaseUrl : '未配置：asrEngine=custom 时必须提供 asrBaseUrl。',
        ...(baseUrlOk ? {} : { hint: '在 DSH「设置 → 插件 → 语音」补上 asrBaseUrl（含 /v1 的 OpenAI 兼容地址，保存即生效），或改回 groq / openai / siliconflow 预设。' }),
      })
      if (!baseUrlOk) {
        sttHints.push('ASR 接口地址缺失：只有 voice_stt 受影响，voice_tts / voice_list / voice_preview 仍可零配置正常使用。')
      }

      // 7. ASR 密钥（cfg.asrApiKey 已通过 resolveAsrApiKey 完成 trim；custom 本地回环端点免密钥）
      const isLocalLoopbackAsr = cfg.asrEngine === 'custom' && cfg.asrBaseUrl !== '' && isLoopbackBaseUrl(cfg.asrBaseUrl)
      const hasKey = cfg.asrApiKey !== '' || isLocalLoopbackAsr
      checks.push({
        name: 'ASR 密钥',
        ok: hasKey,
        detail: cfg.asrApiKey !== ''
          ? '已配置'
          : isLocalLoopbackAsr
            ? '本地回环端点免密钥（' + cfg.asrBaseUrl + '）'
            : '未配置：voice_stt 需要 DSH_VOICE_ASR_KEY 环境变量或在「设置 → 插件 → 语音」配置 asrApiKey',
        ...(hasKey ? {} : { hint: '在 DSH「设置 → 插件 → 语音」填写 asrApiKey（自动脱敏、保存即生效），或设置环境变量 DSH_VOICE_ASR_KEY；密钥缺失只影响 voice_stt。' }),
      })
      if (!hasKey) {
        sttHints.push('缺 ASR 密钥：仅 voice_stt 录音转写需要密钥；文字转语音（voice_tts / voice_list / voice_preview）无需任何密钥，现在即可直接使用。')
      }

      const ttsReady = voiceOk && ttsEngineOk && prosodyOk
      const sttReady = baseUrlOk && hasKey
      const ok = scope === 'tts' ? ttsReady : scope === 'stt' ? sttReady : (ttsReady && sttReady)
      const hints = scope === 'tts' ? ttsHints : scope === 'stt' ? sttHints : [...ttsHints, ...sttHints]
      return { ok, ttsReady, sttReady, plugin: 'dsh-voice', checks, ...(hints.length > 0 ? { hints } : {}) }
    },
    timeoutMs: 5000,
  }

  return [voiceList, voiceTts, voiceStt, voicePreview, voiceHealth]
}
