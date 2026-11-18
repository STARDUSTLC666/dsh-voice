/**
 * 五个面向模型的语音工具：voice_tts / voice_stt / voice_list / voice_preview / voice_health。
 *
 * @module dsh-voice/tools
 */
import { openAsBlob, readFileSync, statSync } from 'node:fs'
import { basename, extname, join } from 'node:path'
import { isLoopbackBaseUrl, isValidProsody, type ResolvedVoiceConfig } from './config.js'
import { synthesizeSpeech, synthesizeSpeechWithMetadata, type SubtitleCue } from './edge-tts.js'
import { rateToSpeed, synthesizeOpenAiSpeech } from './openai-tts.js'
import { assertAudioFile, assertWorkspaceFile, ensureWorkspaceDirectory, resolveOutputPath, writeWorkspaceFile } from './paths.js'
import { createProxyFetch } from './proxy-fetch.js'
import { assertAudioSize, formatSttSubtitles, hasFfmpeg, prepareAudioForAsr, transcribe, type SttSegment } from './stt.js'
import {
  cleanMarkdownForSpeech,
  concatMp3Buffers,
  createSilenceMp3,
  estimateMp3DurationMs,
  formatSubtitles,
  offsetCues,
  renderPreviewHtml,
  splitTextIntoChunks,
} from './tts-text.js'
import { filterVoices, isValidVoiceId, VOICES } from './voices.js'

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
    if (typeof prop?.minimum === 'number') node.minimum = prop.minimum
    if (typeof prop?.maximum === 'number') node.maximum = prop.maximum
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

function subtitleFormatOf(filePath: string): 'srt' | 'vtt' {
  return extname(filePath).toLowerCase() === '.vtt' ? 'vtt' : 'srt'
}

const voiceItemSchema = {
  type: 'object',
  properties: { id: { type: 'string' }, gender: { type: 'string' }, locale: { type: 'string' } },
  additionalProperties: true,
}

const listSchema = {
  type: 'object',
  properties: { count: { type: 'integer' }, voices: { type: 'array', items: voiceItemSchema } },
  additionalProperties: true,
}

const ttsSchema = {
  type: 'object',
  properties: {
    output: { type: 'string' },
    bytes: { type: 'integer' },
    voice: { type: 'string' },
    rate: { type: 'string' },
    pitch: { type: 'string' },
    textLength: { type: 'integer' },
    chunks: { type: 'integer' },
    subtitleFile: { type: 'string' },
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

/** OpenAI 兼容 TTS 默认模型。 */
const FALLBACK_TTS_MODEL = 'gpt-4o-mini-tts'

/** ASR 直传上限（25MB）。 */
const MAX_ASR_BYTES = 25 * 1024 * 1024

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

interface ParsedSegment {
  chunks: string[]
  voice: string
  rate: string
  pitch: string
  pauseMs: number
}

interface ChunkSynthesisResult {
  audio: Buffer
  cues: SubtitleCue[]
}

/** 可注入依赖（测试用假实现）。 */
export interface VoiceToolDeps {
  tts?: typeof synthesizeSpeech
  ttsWithMeta?: typeof synthesizeSpeechWithMetadata
  openaiTts?: typeof synthesizeOpenAiSpeech
  stt?: typeof transcribe
  prepareAudio?: typeof prepareAudioForAsr
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

  const assertTtsVoice = (voice: string, useEdge: boolean) => {
    if (useEdge) {
      if (!isValidVoiceId(voice)) {
        throw new Error('音色 id 不合法：' + voice + '。请用 voice_list 查看常用音色，或在 DSH「设置 → 插件 → 语音」修改 ttsVoice（合法格式如 zh-CN-XiaoxiaoNeural）。')
      }
      return
    }
    if (voice.trim() === '') throw new Error('音色 id 不合法：不能为空。')
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
  ): Promise<ChunkSynthesisResult> => {
    if (useEdge) {
      if (!needSubtitles) {
        const ttsFn = deps.tts ?? (deps.ttsWithMeta !== undefined
          ? async (opts: Parameters<typeof synthesizeSpeech>[0], ttsDeps: Parameters<typeof synthesizeSpeech>[1], timeoutMs?: number, abortSig?: AbortSignal) =>
            (await deps.ttsWithMeta!(opts, ttsDeps, timeoutMs, abortSig)).audio
          : synthesizeSpeech)
        const audio = await raceAbort(ttsFn({ text: chunkText, voice, rate, pitch }, { proxyUrl: cfg.proxyUrl }, cfg.timeoutMs, signal), signal)
        return { audio, cues: [] }
      }
      if (deps.ttsWithMeta !== undefined || deps.tts === undefined) {
        const withMetaFn = deps.ttsWithMeta ?? synthesizeSpeechWithMetadata
        const res = await raceAbort(
          withMetaFn({ text: chunkText, voice, rate, pitch, boundary: 'sentence' }, { proxyUrl: cfg.proxyUrl }, cfg.timeoutMs, signal),
          signal,
        )
        const cues = res.cues.length > 0
          ? res.cues
          : [{ index: 1, startMs: 0, endMs: Math.max(1, estimateMp3DurationMs(res.audio)), text: chunkText }]
        return { audio: res.audio, cues }
      }
      const audio = await raceAbort(deps.tts({ text: chunkText, voice, rate, pitch }, { proxyUrl: cfg.proxyUrl }, cfg.timeoutMs, signal), signal)
      return {
        audio,
        cues: [{ index: 1, startMs: 0, endMs: Math.max(1, estimateMp3DurationMs(audio)), text: chunkText }],
      }
    }

    const openaiFn = deps.openaiTts ?? synthesizeOpenAiSpeech
    const audio = await raceAbort(
      openaiFn(
        cfg.ttsBaseUrl,
        cfg.ttsApiKey,
        {
          text: chunkText,
          voice,
          model: cfg.ttsModel !== '' ? cfg.ttsModel : FALLBACK_TTS_MODEL,
          speed: rateToSpeed(rate),
          signal,
        },
        getProxyFetch(cfg.proxyUrl) ?? globalThis.fetch,
        cfg.timeoutMs,
        signal,
      ),
      signal,
    )
    return {
      audio,
      cues: needSubtitles
        ? [{ index: 1, startMs: 0, endMs: Math.max(1, estimateMp3DurationMs(audio)), text: chunkText }]
        : [],
    }
  }

  const voiceList: VoiceToolDefinition = {
    name: 'voice_list',
    isConcurrencySafe: () => true,
    description: '列出常用语音合成音色（edge-tts 微软神经语音，免费）。含普通话/方言/粤语/英/日/韩/法/德/俄/西及多语种音色，支持按 locale/gender/tag 筛选。voice_tts 的 voice 参数也接受清单外的合法 edge 音色 id。',
    parameters: compileParameters({
      locale: { type: 'string', description: '按语言/地区或名称关键字筛选（可选，如 zh-CN、en-US、粤语）。' },
      gender: { type: 'string', enum: ['Female', 'Male'], description: '按性别筛选（可选：Female 或 Male）。' },
      tag: { type: 'string', description: '按场景标签筛选（可选，如 podcast、multilingual、news、dialect）。' },
    }),
    output: {
      schema: listSchema,
      render: (_args, value) => {
        const rec = asRecord(value)
        const voices = Array.isArray(rec.voices) ? rec.voices : []
        const lines = ['共 ' + voices.length + ' 个常用音色：']
        for (const voice of voices) {
          const v = asRecord(voice)
          const tags = Array.isArray(v.tags) && v.tags.length > 0 ? ' [' + v.tags.join(', ') + ']' : ''
          lines.push('- ' + v.id + '（' + v.locale + '）' + tags)
        }
        return [{ type: 'text', text: lines.join('\n') }]
      },
    },
    async execute(rawArgs: unknown) {
      const args = asRecord(rawArgs)
      const locale = optionalString(args, 'locale')
      const gender = optionalString(args, 'gender')
      const tag = optionalString(args, 'tag')
      const hasFilter = locale !== undefined || gender !== undefined || tag !== undefined
      const voices = hasFilter ? filterVoices({ locale, gender, tag }) : VOICES
      return { count: voices.length, voices }
    },
  }

  const voiceTts: VoiceToolDefinition = {
    name: 'voice_tts',
    isConcurrencySafe: () => !getCfg().overwrite,
    description: '文字转语音：默认调用 edge-tts（微软 Edge 朗读服务，免费）合成 MP3，也可在设置中切换 OpenAI/SiliconFlow/自定义 TTS 引擎。支持直接传 text（自动分段支持至 100000 字符）、读取工作区 inputFile（自动清理 Markdown）、多角色播客 segments 及导出 .srt/.vtt 字幕；输出默认 voice_output.mp3（同名自动加序号）。',
    parameters: compileParameters({
      text: { type: 'string', description: '要合成的文本（若提供 inputFile 或 segments 则可选；支持长文本自动分段，≤100000 字符）。' },
      inputFile: { type: 'string', description: '工作区内文稿文件路径（可选，如 article.md；指定时直接从文件读取）。' },
      cleanMarkdown: { type: 'boolean', description: '是否清理 Markdown 语法以便朗读（可选；inputFile 为 .md/.markdown 时默认 true）。' },
      segments: {
        type: 'array',
        description: '多角色对话/播客分段（可选，最多 50 段）：每段可独立指定 voice/text/rate/pitch/pauseMs。',
        items: {
          type: 'object',
          properties: {
            voice: { type: 'string' },
            text: { type: 'string' },
            rate: { type: 'string' },
            pitch: { type: 'string' },
            pauseMs: { type: 'number' },
          },
          required: ['text'],
        },
      },
      voice: { type: 'string', description: '音色 id（可选，默认配置的 ttsVoice）。' },
      rate: { type: 'string', description: '语速，如 +20% 或 -10%（可选）。' },
      pitch: { type: 'string', description: '音调，如 +2Hz 或 -1Hz（可选）。' },
      output: { type: 'string', description: '输出 MP3 路径（可选，相对路径按会话工作目录解析）。' },
      subtitleOutput: { type: 'string', description: '导出同步字幕文件路径（可选，.srt 或 .vtt，相对路径按会话工作目录解析）。' },
    }),
    output: {
      schema: ttsSchema,
      render: (_args, value) => {
        const rec = asRecord(value)
        const chunksInfo = typeof rec.chunks === 'number' && rec.chunks > 1 ? '，共 ' + rec.chunks + ' 段' : ''
        const lines = ['语音合成完成：' + rec.output + '（' + rec.bytes + ' 字节，音色 ' + rec.voice + chunksInfo + '）']
        const subtitleFile = typeof rec.subtitleFile === 'string' ? rec.subtitleFile : ''
        if (subtitleFile !== '') lines.push('字幕文件已写入：' + subtitleFile)
        return [{ type: 'text', text: lines.join('\n') }]
      },
    },
    async execute(rawArgs: unknown, exec: unknown) {
      const cfg = getCfg()
      const signal = execSignal(exec)
      throwIfAborted(signal)
      const args = asRecord(rawArgs)
      const cwd = sessionCwd(exec)
      const useEdge = cfg.ttsEngine === 'edge' || deps.tts !== undefined || deps.ttsWithMeta !== undefined
      const defaultVoice = optionalString(args, 'voice') ?? cfg.ttsVoice
      const defaultRate = optionalString(args, 'rate') ?? cfg.ttsRate
      const defaultPitch = optionalString(args, 'pitch') ?? cfg.ttsPitch
      const requested = optionalString(args, 'output')
      const subtitleOutput = optionalString(args, 'subtitleOutput')
      const needSubtitles = subtitleOutput !== undefined

      const rawSegments = Array.isArray(args.segments) && args.segments.length > 0 ? args.segments : undefined
      if (rawSegments !== undefined) {
        if (rawSegments.length > MAX_TTS_SEGMENTS) {
          throw new Error('segments 最多 ' + MAX_TTS_SEGMENTS + ' 段（当前 ' + rawSegments.length + ' 段）。')
        }
        assertTtsEngineReady(cfg, useEdge)
        const parsedSegments: ParsedSegment[] = []
        let totalChars = 0
        for (let i = 0; i < rawSegments.length; i++) {
          const seg = asRecord(rawSegments[i])
          const rawSegText = optionalString(seg, 'text')
          if (rawSegText === undefined) throw new Error('第 ' + (i + 1) + ' 段 text 不能为空。')
          const segText = args.cleanMarkdown === true ? cleanMarkdownForSpeech(rawSegText).trim() : rawSegText
          if (segText === '') throw new Error('第 ' + (i + 1) + ' 段清理 Markdown 后文本为空。')
          totalChars += segText.length
          const segVoice = optionalString(seg, 'voice') ?? defaultVoice
          const segRate = optionalString(seg, 'rate') ?? defaultRate
          const segPitch = optionalString(seg, 'pitch') ?? defaultPitch
          assertTtsVoice(segVoice, useEdge)
          assertProsody(segRate, segPitch)
          const pauseMs = typeof seg.pauseMs === 'number' && Number.isFinite(seg.pauseMs) && seg.pauseMs >= 0
            ? Math.min(10000, Math.round(seg.pauseMs))
            : 300
          const chunks = segText.length > 4000 ? splitTextIntoChunks(segText, 2800) : [segText]
          parsedSegments.push({ chunks, voice: segVoice, rate: segRate, pitch: segPitch, pauseMs })
        }
        if (totalChars > MAX_TTS_CHARS) {
          throw new Error('segments 总文本超过 ' + MAX_TTS_CHARS + ' 字符上限（当前 ' + totalChars + ' 字符）。')
        }
        resolveOutputPath(requested, 'voice_output.mp3', cfg.overwrite, cwd)
        if (subtitleOutput !== undefined) resolveOutputPath(subtitleOutput, '', cfg.overwrite, cwd)

        const tasks: Array<{ segIndex: number; text: string; voice: string; rate: string; pitch: string }> = []
        for (let s = 0; s < parsedSegments.length; s++) {
          const seg = parsedSegments[s]
          for (const chunkText of seg.chunks) {
            tasks.push({ segIndex: s, text: chunkText, voice: seg.voice, rate: seg.rate, pitch: seg.pitch })
          }
        }
        const chunkResults = await mapLimit(tasks, TTS_CHUNK_CONCURRENCY, signal, (task) =>
          synthesizeChunk(cfg, useEdge, task.text, task.voice, task.rate, task.pitch, needSubtitles, signal),
        )
        throwIfAborted(signal)

        const buffers: Buffer[] = []
        const allCues: SubtitleCue[] = []
        let offsetMs = 0
        let cueIndex = 1
        let resultIdx = 0
        for (let s = 0; s < parsedSegments.length; s++) {
          const seg = parsedSegments[s]
          for (let c = 0; c < seg.chunks.length; c++) {
            const res = chunkResults[resultIdx++]
            buffers.push(res.audio)
            const chunkDurationMs = estimateMp3DurationMs(res.audio)
            if (needSubtitles) {
              const shifted = offsetCues(res.cues, offsetMs, cueIndex)
              allCues.push(...shifted)
              cueIndex += shifted.length
              const cueSpan = shifted.length > 0 ? Math.max(0, shifted[shifted.length - 1].endMs - offsetMs) : 0
              offsetMs += Math.max(chunkDurationMs, cueSpan)
            }
          }
          if (s < parsedSegments.length - 1 && seg.pauseMs > 0) {
            const silence = createSilenceMp3(seg.pauseMs)
            if (silence.length > 0) {
              buffers.push(silence)
              offsetMs += estimateMp3DurationMs(silence)
            }
          }
        }

        const audio = buffers.length === 1 ? buffers[0] : concatMp3Buffers(buffers)
        const output = writeWorkspaceFile(resolveOutputPath(requested, 'voice_output.mp3', cfg.overwrite, cwd), audio, cwd, undefined, cfg.overwrite)
        let subtitleFile = ''
        if (subtitleOutput !== undefined) {
          const formatted = formatSubtitles(allCues, subtitleFormatOf(subtitleOutput))
          subtitleFile = writeWorkspaceFile(resolveOutputPath(subtitleOutput, '', cfg.overwrite, cwd), formatted, cwd, undefined, cfg.overwrite)
        }
        return { output, bytes: audio.length, voice: defaultVoice, rate: defaultRate, pitch: defaultPitch, textLength: totalChars, chunks: tasks.length, subtitleFile }
      }

      const inputFile = optionalString(args, 'inputFile')
      let finalText: string
      if (inputFile !== undefined) {
        const resolvedInput = assertWorkspaceFile(inputFile, cwd, '文稿文件')
        const rawText = readFileSync(resolvedInput, 'utf8')
        const shouldClean = typeof args.cleanMarkdown === 'boolean'
          ? args.cleanMarkdown
          : /\.(md|markdown)$/i.test(resolvedInput)
        finalText = (shouldClean ? cleanMarkdownForSpeech(rawText) : rawText).trim()
        if (finalText === '') {
          throw new Error(shouldClean ? '文稿文件在清理 Markdown 后内容为空。' : '文稿文件内容为空。')
        }
      } else {
        const rawText = requiredString(args, 'text', '要合成的文本')
        finalText = args.cleanMarkdown === true ? cleanMarkdownForSpeech(rawText).trim() : rawText
        if (finalText === '') throw new Error('要合成的文本在清理 Markdown 后为空。')
      }

      if (finalText.length > MAX_TTS_CHARS) {
        throw new Error('文本超过 ' + MAX_TTS_CHARS + ' 字符上限（当前 ' + finalText.length + ' 字符），请拆分处理。')
      }

      assertTtsEngineReady(cfg, useEdge)
      assertTtsVoice(defaultVoice, useEdge)
      assertProsody(defaultRate, defaultPitch)
      resolveOutputPath(requested, 'voice_output.mp3', cfg.overwrite, cwd)
      if (subtitleOutput !== undefined) resolveOutputPath(subtitleOutput, '', cfg.overwrite, cwd)

      let audio: Buffer
      let chunkCount = 1
      let subtitleFile = ''

      if (finalText.length <= 5000 && !needSubtitles && useEdge) {
        const res = await synthesizeChunk(cfg, true, finalText, defaultVoice, defaultRate, defaultPitch, false, signal)
        audio = res.audio
      } else {
        const chunks = splitTextIntoChunks(finalText, 2800)
        chunkCount = chunks.length
        const results = await mapLimit(chunks, TTS_CHUNK_CONCURRENCY, signal, (chunk) =>
          synthesizeChunk(cfg, useEdge, chunk, defaultVoice, defaultRate, defaultPitch, needSubtitles, signal),
        )
        throwIfAborted(signal)
        audio = results.length === 1 ? results[0].audio : concatMp3Buffers(results.map((r) => r.audio))
        if (subtitleOutput !== undefined) {
          const allCues: SubtitleCue[] = []
          let offsetMs = 0
          let cueIndex = 1
          for (const res of results) {
            const shifted = offsetCues(res.cues, offsetMs, cueIndex)
            allCues.push(...shifted)
            cueIndex += shifted.length
            const chunkDurationMs = estimateMp3DurationMs(res.audio)
            const cueSpan = shifted.length > 0 ? Math.max(0, shifted[shifted.length - 1].endMs - offsetMs) : 0
            offsetMs += Math.max(chunkDurationMs, cueSpan)
          }
          const formatted = formatSubtitles(allCues, subtitleFormatOf(subtitleOutput))
          subtitleFile = writeWorkspaceFile(resolveOutputPath(subtitleOutput, '', cfg.overwrite, cwd), formatted, cwd, undefined, cfg.overwrite)
        }
      }

      throwIfAborted(signal)
      const output = writeWorkspaceFile(resolveOutputPath(requested, 'voice_output.mp3', cfg.overwrite, cwd), audio, cwd, undefined, cfg.overwrite)
      return { output, bytes: audio.length, voice: defaultVoice, rate: defaultRate, pitch: defaultPitch, textLength: finalText.length, chunks: chunkCount, subtitleFile }
    },
    get timeoutMs() { return getCfg().timeoutMs + 10000 },
  }

  const voiceStt: VoiceToolDefinition = {
    name: 'voice_stt',
    isConcurrencySafe: () => !getCfg().overwrite,
    description: '语音转文字：调用 OpenAI 兼容 ASR 接口（默认 Groq whisper-large-v3-turbo；可切 openai/siliconflow/custom）。audio 为音频文件路径（mp3/wav/m4a/ogg/flac，≤25MB；超过 25MB 可设 autoCompress=true 用 ffmpeg 自动压缩分段）；language/prompt 可选；output 可写 .txt，subtitleOutput 可写 .srt/.vtt 字幕。',
    parameters: compileParameters({
      audio: { type: 'string', required: true, description: '音频文件路径（必填）。' },
      engine: { type: 'string', enum: ['groq', 'openai', 'custom'], description: '引擎（可选）：只接受与配置 asrEngine 相同的值，用于显式确认；接口地址与密钥始终取配置。' },
      model: { type: 'string', description: '模型名（可选，覆盖配置）。' },
      language: { type: 'string', description: '语言提示，如 zh（可选）。' },
      prompt: { type: 'string', description: '提示词（专有名词/术语纠偏，可选）。' },
      output: { type: 'string', description: '把转写文本写成 .txt 的路径（可选，相对路径按会话工作目录解析）。' },
      subtitleOutput: { type: 'string', description: '导出字幕路径（可选，.srt 或 .vtt，相对路径按会话工作目录解析；指定时自动开启时间戳）。' },
      timestamps: { type: 'boolean', description: '是否请求分段时间戳（可选，默认 false）。' },
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
        throw new Error('engine 必须是 groq / openai / custom 之一（当前：' + requestedEngine + '）。')
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
      const needTimestamps = args.timestamps === true || subtitleOutput !== undefined
      const allowEmptyApiKey = cfg.asrEngine === 'custom' && isLoopbackBaseUrl(baseUrl)
      const fetchImpl = getProxyFetch(cfg.proxyUrl) ?? globalThis.fetch
      const sttFn = deps.stt ?? transcribe

      const fileSize = statSync(audioPath).size
      let text = ''
      let detectedLanguage = ''
      let duration: number | undefined
      let segments: SttSegment[] | undefined

      if (fileSize > MAX_ASR_BYTES) {
        if (args.autoCompress !== true) assertAudioSize(fileSize)
        if (deps.prepareAudio === undefined && !hasFfmpeg()) {
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
              allowEmptyApiKey,
            }, fetchImpl, cfg.timeoutMs, signal), signal)
            return { chunk, res }
          })
          throwIfAborted(signal)
          text = chunkResults.map((item) => item.res.text.trim()).filter(Boolean).join('\n')
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
                })
              }
            }
          }
          if (hasDuration) duration = totalDuration
          if (mergedSegments.length > 0) segments = mergedSegments
        } finally {
          prep.cleanup()
        }
      } else {
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
          allowEmptyApiKey,
        }, fetchImpl, cfg.timeoutMs, signal), signal)
        throwIfAborted(signal)
        text = res.text
        detectedLanguage = res.language ?? ''
        duration = res.duration
        segments = res.segments
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
        const subText = formatSttSubtitles(cueSegments, subtitleFormatOf(subtitleOutput))
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
      }
    },
    get timeoutMs() { return getCfg().timeoutMs + 10000 },
  }

  const voicePreview: VoiceToolDefinition = {
    name: 'voice_preview',
    isConcurrencySafe: () => !getCfg().overwrite,
    description: '音色试听：用一段固定试听文本批量生成短样例 MP3，并默认生成可直接在浏览器试听对比的 index.html。voices 为音色 id 数组（可选，缺省 voice_list 前 4 个，最多 8 个）；text 可自定义（≤200 字符）；样例文件写入输出目录（默认会话工作目录 voice_previews）。单个音色失败不阻断其他。',
    parameters: compileParameters({
      voices: { type: 'array', items: { type: 'string' }, description: '音色 id 数组（可选，缺省 voice_list 前 4 个，最多 8 个）。' },
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
      const useEdge = cfg.ttsEngine === 'edge' || deps.tts !== undefined
      assertTtsEngineReady(cfg, useEdge)
      const cwd = sessionCwd(exec)
      const outDir = ensureWorkspaceDirectory(optionalString(args, 'outputDir') ?? 'voice_previews', cwd)
      const outcomes = await mapLimit<string, PreviewOutcome>(targets, PREVIEW_CONCURRENCY, signal, async (voice) => {
        throwIfAborted(signal)
        if (useEdge && !isValidVoiceId(voice)) {
          return { voice, error: '音色 id 不合法（应为 zh-CN-XXXNeural 形式的 edge 音色）' }
        }
        if (!useEdge && voice.trim() === '') {
          return { voice, error: '音色 id 不合法：不能为空' }
        }
        try {
          const { audio } = await synthesizeChunk(cfg, useEdge, text, voice, cfg.ttsRate, cfg.ttsPitch, false, signal)
          throwIfAborted(signal)
          const name = 'voice-preview-' + voice.replace(/[^a-zA-Z0-9-]/g, '_') + '.mp3'
          // 复用 resolveOutputPath：overwrite=false 时改名加序号，不再直接覆盖同名样例。
          const file = resolveOutputPath(join(outDir, name), '', cfg.overwrite, cwd)
          const output = writeWorkspaceFile(file, audio, cwd, undefined, cfg.overwrite)
          return { voice, output, bytes: audio.length }
        } catch (error) {
          throwIfAborted(signal)
          return { voice, error: error instanceof Error ? error.message : String(error) }
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
          return {
            voice: id,
            fileName: basename(String(s.output)),
            locale: meta?.locale,
            gender: meta?.gender,
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
      const voiceOk = cfg.ttsEngine === 'edge' ? isValidVoiceId(cfg.ttsVoice) : cfg.ttsVoice.trim() !== ''
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
