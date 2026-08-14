/**
 * 三个面向模型的语音工具：voice_tts / voice_stt / voice_list。
 *
 * @module dsh-voice/tools
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { basename, extname, resolve } from 'node:path'
import { type ResolvedVoiceConfig } from './config.js'
import { synthesizeSpeech } from './edge-tts.js'
import { assertAudioFile, resolveOutputPath } from './paths.js'
import { createProxyFetch } from './proxy-fetch.js'
import { transcribe } from './stt.js'
import { isValidVoiceId, VOICES } from './voices.js'

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
  },
  additionalProperties: true,
}

/** 可注入依赖（测试用假实现）。 */
export interface VoiceToolDeps {
  tts?: typeof synthesizeSpeech
  stt?: typeof transcribe
}

/**
 * 构建三个工具定义。
 */
export function buildVoiceTools(config: ResolvedVoiceConfig, deps: VoiceToolDeps = {}): VoiceToolDefinition[] {
  const cfg = config
  const fetchImpl = cfg.proxyUrl !== '' ? createProxyFetch(cfg.proxyUrl) : undefined
  const timeout = cfg.timeoutMs

  const voiceList: VoiceToolDefinition = {
    name: 'voice_list',
    description: '列出常用语音合成音色（edge-tts 微软神经语音，免费）。含普通话/方言/粤语/英/日/韩/法/德/俄/西。voice_tts 的 voice 参数也接受清单外的合法 edge 音色 id（如 zh-CN-XXXNeural）。',
    parameters: compileParameters({}),
    output: {
      schema: listSchema,
      render: (_args, value) => {
        const rec = asRecord(value)
        const voices = Array.isArray(rec.voices) ? rec.voices : []
        const lines = ['共 ' + voices.length + ' 个常用音色：']
        for (const voice of voices) {
          const v = asRecord(voice)
          lines.push('- ' + v.id + '（' + v.locale + '）')
        }
        return [{ type: 'text', text: lines.join('\n') }]
      },
    },
    async execute() {
      return { count: VOICES.length, voices: VOICES }
    },
  }

  const voiceTts: VoiceToolDefinition = {
    name: 'voice_tts',
    description: '文字转语音：调用 edge-tts（微软 Edge 朗读服务，免费）合成 MP3。text 必填（≤5000 字符，更长请分段）；voice 可选（默认 zh-CN-XiaoxiaoNeural，清单见 voice_list）；rate/pitch 如 +10%、-2Hz；输出默认 voice_output.mp3（同名自动加序号）。',
    parameters: compileParameters({
      text: { type: 'string', required: true, description: '要合成的文本（必填，≤5000 字符）。' },
      voice: { type: 'string', description: '音色 id（可选，默认配置的 ttsVoice）。' },
      rate: { type: 'string', description: '语速，如 +20% 或 -10%（可选）。' },
      pitch: { type: 'string', description: '音调，如 +2Hz 或 -1Hz（可选）。' },
      output: { type: 'string', description: '输出 MP3 路径（可选）。' },
    }),
    output: {
      schema: ttsSchema,
      render: (_args, value) => {
        const rec = asRecord(value)
        return [{ type: 'text', text: '语音合成完成：' + rec.output + '（' + rec.bytes + ' 字节，音色 ' + rec.voice + '）' }]
      },
    },
    async execute(rawArgs: unknown) {
      const args = asRecord(rawArgs)
      const text = requiredString(args, 'text', '要合成的文本')
      if (text.length > 5000) throw new Error('文本超过 5000 字符，请分段合成。')
      const voice = optionalString(args, 'voice') ?? cfg.ttsVoice
      if (!isValidVoiceId(voice)) throw new Error('音色 id 不合法：' + voice + '。请用 voice_list 查看常用音色，或使用 zh-CN-XXXNeural 形式的 edge 音色。')
      const rate = optionalString(args, 'rate') ?? cfg.ttsRate
      const pitch = optionalString(args, 'pitch') ?? cfg.ttsPitch
      const output = resolveOutputPath(optionalString(args, 'output'), 'voice_output.mp3', cfg.overwrite)
      const audio = await (deps.tts ?? synthesizeSpeech)({ text, voice, rate, pitch }, { proxyUrl: cfg.proxyUrl }, timeout)
      writeFileSync(output, audio)
      return { output, bytes: audio.length, voice, rate, pitch, textLength: text.length }
    },
    timeoutMs: timeout + 10000,
  }

  const voiceStt: VoiceToolDefinition = {
    name: 'voice_stt',
    description: '语音转文字：调用 OpenAI 兼容 ASR 接口（默认 Groq whisper-large-v3-turbo；可切 openai/custom）。audio 为音频文件路径（mp3/wav/m4a/ogg/flac，≤25MB）；language/prompt 可选；output 可把转写文本写成 .txt。密钥用环境变量 DSH_VOICE_ASR_KEY 或配置 asrApiKey。',
    parameters: compileParameters({
      audio: { type: 'string', required: true, description: '音频文件路径（必填）。' },
      engine: { type: 'string', description: '引擎：groq / openai / custom（可选，默认配置值）。' },
      model: { type: 'string', description: '模型名（可选，覆盖配置）。' },
      language: { type: 'string', description: '语言提示，如 zh（可选）。' },
      prompt: { type: 'string', description: '提示词（专有名词/术语纠偏，可选）。' },
      output: { type: 'string', description: '把转写文本写成 .txt 的路径（可选）。' },
    }),
    output: {
      schema: sttSchema,
      render: (_args, value) => {
        const rec = asRecord(value)
        return [{ type: 'text', text: '转写完成（模型 ' + rec.model + '）：' + rec.text }]
      },
    },
    async execute(rawArgs: unknown) {
      const args = asRecord(rawArgs)
      const audioPath = assertAudioFile(requiredString(args, 'audio', '音频文件'))
      const engine = optionalString(args, 'engine') ?? cfg.asrEngine
      let baseUrl: string
      let model: string
      if (engine === 'openai') { baseUrl = 'https://api.openai.com/v1'; model = optionalString(args, 'model') ?? 'whisper-1' }
      else if (engine === 'custom') { baseUrl = cfg.asrBaseUrl; model = optionalString(args, 'model') ?? cfg.asrModel }
      else if (engine === 'groq') { baseUrl = 'https://api.groq.com/openai/v1'; model = optionalString(args, 'model') ?? (cfg.asrModel !== '' && cfg.asrEngine === 'groq' ? cfg.asrModel : 'whisper-large-v3-turbo') }
      else throw new Error('engine 必须是 groq / openai / custom 之一（当前：' + engine + '）。')
      const { text } = await (deps.stt ?? transcribe)(baseUrl, cfg.asrApiKey, {
        audio: readFileSync(audioPath),
        filename: basename(audioPath),
        model,
        language: optionalString(args, 'language'),
        prompt: optionalString(args, 'prompt'),
      }, fetchImpl ?? globalThis.fetch, timeout)
      let transcriptFile: string | null = null
      const output = optionalString(args, 'output')
      if (output !== undefined) {
        const target = resolveOutputPath(output, '', cfg.overwrite)
        writeFileSync(target, text, 'utf8')
        transcriptFile = target
      }
      return { text, model, language: optionalString(args, 'language') ?? null, audio: audioPath, transcriptFile }
    },
    timeoutMs: timeout + 10000,
  }

  return [voiceList, voiceTts, voiceStt]
}
