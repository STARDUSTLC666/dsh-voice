/**
 * 零外部依赖的宿主 Config Schema 与 liveConfig 活引用适配层（兼容 @deepseek-ai/schemastery 3.18+ 与 @deepseek-ai/cosmokit Volatile 协议）。
 *
 * 作用：
 *   1. 让 DSH 原生「设置 → 插件 → 语音」自动渲染可视化表单，对 asrApiKey / proxyUrl 启用凭据脱敏（role('secret')）；
 *   2. 字段标记 volatile()，用户在设置面板保存音色、ASR 密钥或代理后立即生效，无需重启 DSH；
 *   3. 不向 package.json 引入额外 npm 依赖，离线构建 100% 自包含。
 *
 * @module dsh-voice/host-config
 */
import type { AsrEngine, CustomVoiceAlias, PronunciationRule, TtsEngine, VoiceConfig } from './config.js'

const kSchema = Symbol.for('schemastery')
const kValidationError = Symbol.for('ValidationError')
const kVolatileWrite = Symbol.for('cosmokit.volatile.write')
const kCheckedVolatile = Symbol('checked-volatile-schema')

const globalState = globalThis as {
  __schemastery_index__?: number
  __schemastery_refs__?: Record<number, unknown>
}

export interface HostSchemaMeta {
  default?: unknown
  required?: boolean
  volatile?: boolean
  disabled?: boolean
  collapse?: boolean
  hidden?: boolean
  loose?: boolean
  role?: string
  extra?: unknown
  link?: string
  description?: string | Record<string, string>
  comment?: string
  pattern?: { source: string; flags?: string }
  max?: number
  min?: number
  step?: number
}

export interface HostSchemaOptions {
  autofix?: boolean
  ignore?: (data: unknown, schema: HostSchemaNode) => boolean
  path?: Array<string | number | symbol>
  [kCheckedVolatile]?: boolean
}

export interface VolatileRef<T = unknown> {
  get(): T
}

export interface HostSchemaNode<T = unknown> {
  (data?: unknown, options?: HostSchemaOptions): T
  readonly uid: number
  type: string
  meta: HostSchemaMeta
  dict?: Record<string, HostSchemaNode>
  inner?: HostSchemaNode
  list?: HostSchemaNode[]
  value?: unknown
  readonly '~standard': {
    version: 1
    vendor: 'schemastery'
    validate: (value: unknown) => { value: unknown } | { issues: Array<{ message: string; path?: Array<string | number | symbol> }> }
  }
  toJSON(): unknown
  toString(inline?: boolean): string
  simplify(value?: unknown): unknown
  i18n(messages: Record<string, unknown>): HostSchemaNode<T>
  extra(key: keyof HostSchemaMeta, value: unknown): HostSchemaNode<T>
  role(role: string, extra?: unknown): HostSchemaNode<T>
  description(text: string | Record<string, string>): HostSchemaNode<T>
  comment(text: string): HostSchemaNode<T>
  link(url: string): HostSchemaNode<T>
  default(value: unknown): HostSchemaNode<T>
  min(value: number): HostSchemaNode<T>
  max(value: number): HostSchemaNode<T>
  step(value: number): HostSchemaNode<T>
  pattern(regexp: RegExp): HostSchemaNode<T>
  volatile(): HostSchemaNode<VolatileRef<T>>
  required(value?: boolean): HostSchemaNode<T>
  hidden(value?: boolean): HostSchemaNode<T>
  disabled(value?: boolean): HostSchemaNode<T>
  collapse(value?: boolean): HostSchemaNode<T>
  loose(value?: boolean): HostSchemaNode<T>
  set(key: string, value: HostSchemaNode): HostSchemaNode<T>
  push(value: HostSchemaNode): HostSchemaNode<T>
}

export class HostValidationError extends TypeError {
  readonly options: HostSchemaOptions
  override name = 'ValidationError'
  constructor(message: string, options: HostSchemaOptions = {}) {
    let prefix = '$'
    for (const segment of options.path ?? []) {
      if (typeof segment === 'string') prefix += '.' + segment
      else if (typeof segment === 'number') prefix += '[' + segment + ']'
      else prefix += `[Symbol(${segment.toString()})]`
    }
    if (prefix.startsWith('.')) prefix = prefix.slice(1)
    super((prefix === '$' ? '' : `${prefix} `) + message)
    this.options = options
  }
  static is(error: unknown): error is HostValidationError {
    return typeof error === 'object' && error !== null && Boolean((error as Record<symbol, unknown>)[kValidationError])
  }
}
Object.defineProperty(HostValidationError.prototype, kValidationError, { value: true })

function isNullable(value: unknown): value is null | undefined {
  return value === null || value === undefined
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false
  const proto = Object.getPrototypeOf(value)
  return proto === Object.prototype || proto === null
}

function isVolatile(value: unknown): value is VolatileRef<unknown> {
  return typeof value === 'object' && value !== null && kVolatileWrite in value
}

function cloneValue<T>(value: T): T {
  if (value === null || typeof value !== 'object') return value
  if (Array.isArray(value)) return value.map((item) => cloneValue(item)) as unknown as T
  if (isPlainObject(value)) {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, cloneValue(v)])) as unknown as T
  }
  return value
}

function deepEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true
  if (typeof a !== 'object' || a === null || typeof b !== 'object' || b === null) return false
  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false
    return a.every((item, idx) => deepEqual(item, b[idx]))
  }
  if (!isPlainObject(a) || !isPlainObject(b)) return false
  const keysA = Object.keys(a)
  const keysB = Object.keys(b)
  if (keysA.length !== keysB.length) return false
  return keysA.every((key) => Object.prototype.hasOwnProperty.call(b, key) && deepEqual(a[key], b[key]))
}

function snapshotValue(value: unknown, ancestors = new Set<object>()): unknown {
  if (typeof value === 'function') throw new TypeError('volatile config cannot contain functions')
  if (value === null || typeof value !== 'object') return value
  if (ancestors.has(value)) throw new TypeError('volatile config cannot contain cycles')
  ancestors.add(value)
  try {
    if (Array.isArray(value)) return Object.freeze(value.map((item) => snapshotValue(item, ancestors)))
    if (!isPlainObject(value)) throw new TypeError('volatile config objects must be plain objects or arrays')
    return Object.freeze(Object.fromEntries(Object.entries(value).map(([key, item]) => [key, snapshotValue(item, ancestors)])))
  } finally {
    ancestors.delete(value)
  }
}

export function createVolatile<T>(value: T): VolatileRef<T> {
  let current = snapshotValue(value) as T
  return Object.freeze({
    get: () => current,
    [kVolatileWrite]: (next: unknown) => { current = snapshotValue(next) as T },
  }) as VolatileRef<T>
}

function validateVolatileTree(schema: HostSchemaNode, path: Array<string | number | symbol> = [], blocked = false, seen = new Map<HostSchemaNode, Set<boolean>>()): void {
  const states = seen.get(schema) ?? new Set<boolean>()
  if (states.has(blocked)) return
  states.add(blocked)
  seen.set(schema, states)
  if (schema.meta?.volatile && blocked) {
    throw new HostValidationError('volatile fields require a fixed object path without an enclosing volatile field', { path })
  }
  const nested = blocked || Boolean(schema.meta?.volatile)
  if (schema.dict) {
    for (const [key, child] of Object.entries(schema.dict)) validateVolatileTree(child, [...path, key], nested, seen)
  }
  if (schema.inner) validateVolatileTree(schema.inner, [...path, '*'], true, seen)
  if (schema.list) {
    schema.list.forEach((child, idx) => validateVolatileTree(child, [...path, String(idx)], true, seen))
  }
}

function checkRange(value: number, meta: HostSchemaMeta, label: string, options: HostSchemaOptions, skipMin = false): void {
  const max = meta.max ?? Infinity
  const min = meta.min ?? -Infinity
  if (value > max) throw new HostValidationError(`expected ${label} <= ${max} but got ${value}`, options)
  if (value < min && !skipMin) throw new HostValidationError(`expected ${label} >= ${min} but got ${value}`, options)
}

function resolveProperty(data: Record<string, unknown> | unknown[], key: string | number, schema: HostSchemaNode, options: HostSchemaOptions): unknown {
  const container = data as Record<string | number, unknown>
  try {
    const [value, adapted] = resolveSchema(container[key], schema, {
      ...options,
      path: [...(options.path ?? []), key],
    })
    if (adapted !== undefined) container[key] = adapted
    return value
  } catch (error) {
    if (!options.autofix) throw error
    delete container[key]
    return schema.meta.volatile ? createVolatile(schema.meta.default) : cloneValue(schema.meta.default)
  }
}

function resolveSchema(data: unknown, schema: HostSchemaNode | undefined, options: HostSchemaOptions = {}, strict = false): [unknown, unknown?] {
  if (!schema) return [data]
  if (!options[kCheckedVolatile]) {
    validateVolatileTree(schema, options.path)
    options = { ...options, [kCheckedVolatile]: true }
  }
  if (schema.meta?.volatile) {
    const inner = makeSchema({ ...schema, meta: { ...schema.meta, volatile: false } })
    const [value, adapted] = resolveSchema(data, inner, options, strict)
    try {
      return [createVolatile(value), adapted]
    } catch (error) {
      throw new HostValidationError(error instanceof Error ? error.message : String(error), options)
    }
  }
  if (options.ignore?.(data, schema)) return [data]
  if (isNullable(data)) {
    if (schema.meta.required) throw new HostValidationError('missing required value', options)
    if (isNullable(schema.meta.default)) return [data]
    data = cloneValue(schema.meta.default)
  }
  try {
    switch (schema.type) {
      case 'any':
        return [data]
      case 'const':
        if (deepEqual(data, schema.value)) return [schema.value]
        throw new HostValidationError(`expected ${String(schema.value)} but got ${String(data)}`, options)
      case 'string': {
        if (typeof data !== 'string') throw new HostValidationError(`expected string but got ${String(data)}`, options)
        if (schema.meta.pattern) {
          const re = new RegExp(schema.meta.pattern.source, schema.meta.pattern.flags)
          if (!re.test(data)) throw new HostValidationError(`expect string to match regexp ${String(re)}`, options)
        }
        checkRange(data.length, schema.meta, 'string length', options)
        return [data]
      }
      case 'number': {
        if (typeof data !== 'number' || Number.isNaN(data)) throw new HostValidationError(`expected number but got ${String(data)}`, options)
        checkRange(data, schema.meta, 'number', options)
        return [data]
      }
      case 'boolean':
        if (typeof data === 'boolean') return [data]
        throw new HostValidationError(`expected boolean but got ${String(data)}`, options)
      case 'array': {
        if (!Array.isArray(data) || !schema.inner) throw new HostValidationError(`expected array but got ${String(data)}`, options)
        checkRange(data.length, schema.meta, 'array length', options, !isNullable(schema.inner.meta.default))
        const copy = [...data]
        return [copy.map((_, idx) => resolveProperty(copy, idx, schema.inner!, options))]
      }
      case 'object': {
        if (!isPlainObject(data)) throw new HostValidationError(`expected object but got ${String(data)}`, options)
        const dict = schema.dict ?? {}
        const copy: Record<string, unknown> = { ...data }
        const result: Record<string, unknown> = {}
        for (const key of Object.keys(dict)) {
          const value = resolveProperty(copy, key, dict[key], options)
          if (!isNullable(value) || key in copy) result[key] = value
        }
        if (!strict) {
          for (const key of Object.keys(copy)) {
            if (!(key in result)) result[key] = copy[key]
          }
        }
        return [result]
      }
      case 'union': {
        for (const candidate of schema.list ?? []) {
          try {
            return resolveSchema(data, candidate, options, strict)
          } catch {
            // Try next union branch.
          }
        }
        throw new HostValidationError(`expected ${schema.toString()} but got ${JSON.stringify(data)}`, options)
      }
      default:
        throw new HostValidationError(`unsupported type "${schema.type}"`, options)
    }
  } catch (error) {
    if (!schema.meta.loose) throw error
    return [cloneValue(schema.meta.default)]
  }
}

function mergeDescriptions(original: HostSchemaMeta['description'], messages: Record<string, unknown>): Record<string, string> {
  const result: Record<string, string> = typeof original === 'string' ? { '': original } : { ...(original ?? {}) }
  for (const [locale, entry] of Object.entries(messages)) {
    if (typeof entry === 'string') {
      result[locale] = entry
    } else if (isPlainObject(entry)) {
      const desc = entry.$description ?? entry.$desc
      if (typeof desc === 'string') result[locale] = desc
    }
  }
  return result
}

const schemaProto = Object.create(Function.prototype) as Record<string | symbol, unknown>
schemaProto[kSchema] = true

Object.defineProperty(schemaProto, '~standard', {
  get(this: HostSchemaNode) {
    return {
      version: 1 as const,
      vendor: 'schemastery' as const,
      validate: (value: unknown) => {
        try {
          return { value: resolveSchema(value, this, {})[0] }
        } catch (error) {
          if (HostValidationError.is(error)) {
            return { issues: [{ message: error.message, path: error.options.path }] }
          }
          throw error
        }
      },
    }
  },
})

schemaProto.toJSON = function toJSON(this: HostSchemaNode): unknown {
  if (globalState.__schemastery_refs__) {
    globalState.__schemastery_refs__[this.uid] ??= JSON.parse(JSON.stringify({ ...this }))
    return this.uid
  }
  globalState.__schemastery_refs__ = { [this.uid]: { ...this } }
  globalState.__schemastery_refs__[this.uid] = JSON.parse(JSON.stringify({ ...this }))
  const result = { uid: this.uid, refs: globalState.__schemastery_refs__ }
  globalState.__schemastery_refs__ = undefined
  return result
}

schemaProto.toString = function toString(this: HostSchemaNode, inline = false): string {
  if (this.type === 'const') return typeof this.value === 'string' ? JSON.stringify(this.value) : String(this.value)
  if (this.type === 'array' && this.inner) return `${this.inner.toString(true)}[]`
  if (this.type === 'union' && this.list) {
    const joined = this.list.map((item) => item.toString()).join(' | ')
    return inline ? `(${joined})` : joined
  }
  if (this.type === 'object' && this.dict) {
    const entries = Object.entries(this.dict)
    if (entries.length === 0) return '{}'
    return `{ ${entries.map(([k, v]) => `${k}${v.meta.required ? '' : '?'}: ${v.toString()}`).join(', ')} }`
  }
  return this.type
}

schemaProto.simplify = function simplify(this: HostSchemaNode, raw?: unknown): unknown {
  const value = isVolatile(raw) ? raw.get() : raw
  if (deepEqual(value, this.meta.default)) return null
  if (isNullable(value)) return value
  if (this.type === 'object' && isPlainObject(value)) {
    const out: Record<string, unknown> = {}
    for (const [key, item] of Object.entries(value)) {
      const simplified = this.dict?.[key] ? this.dict[key].simplify(item) : item
      if (!isNullable(simplified)) out[key] = simplified
    }
    return deepEqual(out, this.meta.default) ? null : out
  }
  if (this.type === 'array' && Array.isArray(value)) {
    return value.map((item) => (this.inner ? this.inner.simplify(item) : item))
  }
  return value
}

schemaProto.i18n = function i18n(this: HostSchemaNode, messages: Record<string, unknown>): HostSchemaNode {
  const cloned = makeSchema(this)
  const desc = mergeDescriptions(cloned.meta.description, messages)
  if (Object.keys(desc).length > 0) cloned.meta = { ...cloned.meta, description: desc }
  if (cloned.dict) {
    const nextDict: Record<string, HostSchemaNode> = {}
    for (const [key, child] of Object.entries(cloned.dict)) {
      const childMessages: Record<string, unknown> = {}
      for (const [locale, data] of Object.entries(messages)) {
        if (isPlainObject(data)) {
          const inner = isPlainObject(data.$value) ? data.$value : isPlainObject(data.$inner) ? data.$inner : data
          if (key in inner) childMessages[locale] = inner[key]
        }
      }
      nextDict[key] = child.i18n(childMessages)
    }
    cloned.dict = nextDict
  }
  if (cloned.inner) {
    const innerMessages: Record<string, unknown> = {}
    for (const [locale, data] of Object.entries(messages)) {
      if (isPlainObject(data)) {
        const inner = data.$value ?? data.$inner
        if (inner !== undefined) innerMessages[locale] = inner
      }
    }
    cloned.inner = cloned.inner.i18n(innerMessages)
  }
  return cloned
}

schemaProto.extra = function extra(this: HostSchemaNode, key: keyof HostSchemaMeta, value: unknown): HostSchemaNode {
  const cloned = makeSchema(this)
  cloned.meta = { ...cloned.meta, [key]: value }
  return cloned
}

schemaProto.role = function role(this: HostSchemaNode, name: string, extraValue?: unknown): HostSchemaNode {
  const cloned = makeSchema(this)
  cloned.meta = { ...cloned.meta, role: name, ...(extraValue !== undefined ? { extra: extraValue } : {}) }
  return cloned
}

for (const key of ['default', 'link', 'comment', 'description', 'max', 'min', 'step'] as const) {
  schemaProto[key] = function (this: HostSchemaNode, value: unknown): HostSchemaNode {
    return this.extra(key, value)
  }
}

for (const key of ['required', 'disabled', 'collapse', 'hidden', 'loose'] as const) {
  schemaProto[key] = function (this: HostSchemaNode, value = true): HostSchemaNode {
    return this.extra(key, value)
  }
}

schemaProto.pattern = function pattern(this: HostSchemaNode, regexp: RegExp): HostSchemaNode {
  return this.extra('pattern', { source: regexp.source, flags: regexp.flags })
}

schemaProto.volatile = function volatile(this: HostSchemaNode): HostSchemaNode {
  if (this.meta.volatile) throw new TypeError('volatile schema is already wrapped')
  return this.extra('volatile', true)
}

schemaProto.set = function set(this: HostSchemaNode, key: string, value: HostSchemaNode): HostSchemaNode {
  this.dict ??= {}
  this.dict[key] = value
  return this
}

schemaProto.push = function push(this: HostSchemaNode, value: HostSchemaNode): HostSchemaNode {
  this.list ??= []
  this.list.push(value)
  return this
}

function makeSchema<T = unknown>(init: Partial<HostSchemaNode<T>> & { type: string }): HostSchemaNode<T> {
  const fn = function (data?: unknown, options: HostSchemaOptions = {}): T {
    return resolveSchema(data, fn as unknown as HostSchemaNode, options)[0] as T
  } as unknown as HostSchemaNode<T>
  Object.assign(fn, {
    type: init.type,
    meta: { ...(init.meta ?? {}) },
    ...(init.dict ? { dict: { ...init.dict } } : {}),
    ...(init.inner ? { inner: init.inner } : {}),
    ...(init.list ? { list: [...init.list] } : {}),
    ...('value' in init ? { value: init.value } : {}),
  })
  globalState.__schemastery_index__ ??= 0
  Object.defineProperty(fn, 'uid', { value: globalState.__schemastery_index__++, enumerable: false })
  Object.setPrototypeOf(fn, schemaProto)
  fn.toString = fn.toString.bind(fn)
  return fn
}

function fromSource(source: unknown): HostSchemaNode {
  if (typeof source === 'function' && Boolean((source as unknown as Record<symbol, unknown>)[kSchema])) {
    return source as unknown as HostSchemaNode
  }
  if (typeof source === 'string' || typeof source === 'number' || typeof source === 'boolean') {
    return makeSchema({ type: 'const', value: source, meta: { required: true } })
  }
  throw new TypeError(`cannot infer schema from ${String(source)}`)
}

export const z = {
  string: () => makeSchema<string>({ type: 'string' }),
  number: () => makeSchema<number>({ type: 'number' }),
  boolean: () => makeSchema<boolean>({ type: 'boolean' }),
  const: <const V extends string | number | boolean>(value: V) => makeSchema<V>({ type: 'const', value }),
  union: <T = unknown>(list: readonly unknown[]) => makeSchema<T>({ type: 'union', list: list.map(fromSource) }),
  array: <T = unknown>(inner: HostSchemaNode<T>) => makeSchema<T[]>({ type: 'array', inner, meta: { default: [] } }),
  object: <T extends object = Record<string, unknown>>(dict: Record<string, HostSchemaNode>) =>
    makeSchema<T>({ type: 'object', dict, meta: { default: {} } }),
  ValidationError: HostValidationError,
}

/**
 * 宿主原生设置表单 Schema。
 * 标量字段不设 default，以便留空时自动回退内置预设与环境变量 DSH_VOICE_ASR_KEY / DSH_VOICE_TTS_KEY。
 */
export const Config: HostSchemaNode<VoiceConfig> = z.object<VoiceConfig>({
  ttsEngine: z.union<TtsEngine>(['edge', 'openai', 'siliconflow', 'custom']).volatile()
    .description('语音合成（TTS）引擎预设：edge（默认，零密钥）/ openai / siliconflow / custom'),
  ttsBaseUrl: z.string().volatile()
    .description('TTS 接口基地址（custom 模式必填；openai / siliconflow 留空使用官方预设，edge 模式忽略）'),
  ttsApiKey: z.string().role('secret').volatile()
    .description('TTS API 密钥（自动脱敏；留空时读取环境变量 DSH_VOICE_TTS_KEY，edge 与本机回环服务无需填写）'),
  ttsModel: z.string().volatile()
    .description('TTS 模型名（可选；openai 默认 gpt-4o-mini-tts，siliconflow 默认 FunAudioLLM/CosyVoice2-0.5B）'),
  ttsVoice: z.string().volatile()
    .description('默认朗读音色（默认 zh-CN-XiaoxiaoNeural，edge 模式无需 API 密钥即可合成 MP3）'),
  ttsRate: z.string().volatile()
    .description('默认语速（如 +0%、+15%、-10%）'),
  ttsPitch: z.string().volatile()
    .description('默认音调（如 +0Hz、+2Hz、-1Hz）'),
  asrEngine: z.union<AsrEngine>(['groq', 'openai', 'siliconflow', 'custom']).volatile()
    .description('语音转文字（ASR）服务预设：groq（默认）/ openai / siliconflow / custom'),
  asrBaseUrl: z.string().volatile()
    .description('ASR 接口地址（custom 模式必填，如 https://api.example.com/v1；groq / openai / siliconflow 留空使用官方预设）'),
  asrApiKey: z.string().role('secret').volatile()
    .description('ASR API 密钥（自动脱敏；留空时读取环境变量 DSH_VOICE_ASR_KEY，本机回环服务可留空）'),
  asrModel: z.string().volatile()
    .description('ASR 模型名（可选；groq 默认 whisper-large-v3-turbo，openai 默认 whisper-1，siliconflow 默认 FunAudioLLM/SenseVoiceSmall）'),
  proxyUrl: z.string().role('secret').volatile()
    .description('网络代理地址（可选，支持 http(s):// 或 socks5(h)://，如 http://127.0.0.1:7890）'),
  timeoutMs: z.number().min(5000).max(600000).step(1000).volatile()
    .description('单次合成或转写超时毫秒数（5000–600000，默认 60000）'),
  overwrite: z.boolean().volatile()
    .description('同名输出文件是否直接覆盖（默认关闭，自动加序号防误盖）'),
  customVoices: z.array(z.object<CustomVoiceAlias>({
    name: z.string().required().description('自定义音色别名（如 老王、女主持、悬疑旁白）'),
    voice: z.string().description('底层音色 ID 或混合表达式（可选，如 zh-CN-YunjianNeural、FunAudioLLM/CosyVoice2-0.5B:alex、zf_xiaobei*0.6+zf_xiaoni*0.4）'),
    persona: z.string().description('继承的内置人设 ID（可选，如 late-night-radio）'),
    rate: z.string().description('专属语速（可选，如 -8%、+10%）'),
    pitch: z.string().description('专属音调（可选，如 -2Hz、+2Hz）'),
    instructions: z.string().description('情绪/语气指令（可选，用于 gpt-4o-mini-tts 或 CosyVoice2，如“用低沉神秘的语气轻声讲述”）'),
    referenceAudio: z.string().description('零样本克隆参考音频路径（可选，会话工作区内 5–10 秒干净人声 wav/mp3）'),
    referenceText: z.string().description('参考音频对应的原始台词文本（可选，CosyVoice2 等克隆模型推荐填写）'),
  })).collapse().volatile()
    .description('自定义音色与零样本克隆别名列表（保存后立即生效）'),
  pronunciations: z.array(z.object<PronunciationRule>({
    word: z.string().required().description('原词或缩写（如 Nginx、SQL、重构）'),
    alias: z.string().required().description('替读发音文本（如 Engine X、S Q L、虫构）'),
  })).collapse().volatile()
    .description('自定义发音词典（专有名词、缩写与多音字替读规则，保存后立即生效）'),
}).i18n({
  zh: {
    $description: '零密钥 Edge / OpenAI 兼容语音合成（TTS）与语音转文字（ASR）设置（保存立即生效）',
    ttsEngine: '语音合成引擎预设（edge / openai / siliconflow / custom）',
    ttsBaseUrl: 'TTS 接口基地址（custom 必填，需含 /v1；openai / siliconflow 可留空，edge 不需要）',
    ttsApiKey: 'TTS API 密钥（脱敏保存；留空时读取环境变量 DSH_VOICE_TTS_KEY，edge 与本机服务免填）',
    ttsModel: 'TTS 模型名称（可选；留空按引擎预设自动选择）',
    ttsVoice: '默认朗读音色（如 zh-CN-XiaoxiaoNeural、en-US-AriaNeural；edge 模式无需密钥）',
    ttsRate: '默认语速（如 +0%、+15%、-10%）',
    ttsPitch: '默认音调（如 +0Hz、+2Hz、-1Hz）',
    asrEngine: '语音转文字引擎预设（groq / openai / siliconflow / custom）',
    asrBaseUrl: 'ASR 接口基地址（custom 必填，需含 /v1；groq / openai / siliconflow 可留空）',
    asrApiKey: 'ASR API 密钥（脱敏保存；留空时读取环境变量 DSH_VOICE_ASR_KEY，本机服务可留空）',
    asrModel: 'ASR 模型名称（可选；留空按引擎预设自动选择）',
    proxyUrl: '网络代理地址（可选，支持 http(s):// 或 socks5(h)://，如 http://127.0.0.1:7890）',
    timeoutMs: '请求超时毫秒数（5000–600000，默认 60000）',
    overwrite: '允许覆盖同名音频或转写文本（默认关闭，自动追加序号）',
    customVoices: '自定义音色与零样本克隆别名列表（可为常用音色、人设或参考音频命名，保存后立即生效）',
    pronunciations: '自定义发音词典（专有名词、缩写与多音字替读规则，字幕保留原词，保存后立即生效）',
  },
  en: {
    $description: 'Keyless Edge / OpenAI-compatible TTS read-aloud and ASR transcription settings (live on save)',
    ttsEngine: 'Text-to-speech engine preset (edge / openai / siliconflow / custom)',
    ttsBaseUrl: 'TTS API base URL (required when ttsEngine is custom, e.g. https://api.example.com/v1; unused for edge)',
    ttsApiKey: 'TTS API key (masked; falls back to env var DSH_VOICE_TTS_KEY; not needed for edge or loopback URLs)',
    ttsModel: 'TTS model name (optional; defaults to gpt-4o-mini-tts on openai or FunAudioLLM/CosyVoice2-0.5B on siliconflow)',
    ttsVoice: 'Default TTS voice ID (e.g. zh-CN-XiaoxiaoNeural, en-US-AriaNeural; no API key required for edge)',
    ttsRate: 'Default speech rate (e.g. +0%, +15%, -10%)',
    ttsPitch: 'Default pitch offset (e.g. +0Hz, +2Hz, -1Hz)',
    asrEngine: 'Speech-to-text engine preset (groq / openai / siliconflow / custom)',
    asrBaseUrl: 'ASR API base URL (required when asrEngine is custom, e.g. https://api.example.com/v1)',
    asrApiKey: 'ASR API key (masked; falls back to env var DSH_VOICE_ASR_KEY; optional for loopback URLs)',
    asrModel: 'ASR model name (optional; defaults to whisper-large-v3-turbo on groq, whisper-1 on openai, or FunAudioLLM/SenseVoiceSmall on siliconflow)',
    proxyUrl: 'Optional proxy URL (supports http(s):// or socks5(h)://, e.g. http://127.0.0.1:7890)',
    timeoutMs: 'Per-request timeout in ms (5000–600000, default 60000)',
    overwrite: 'Overwrite existing output files instead of auto-numbering (default off)',
    customVoices: 'Custom voice and zero-shot cloning aliases (name reusable voices, personas, or reference audio clips; live on save)',
    pronunciations: 'Custom pronunciation lexicon (override spoken aliases for acronyms/terms while keeping subtitles intact; live on save)',
  },
})

/** 活引用视图：同时兼容 DSH >=0.1.7 的 { get() } 活引用与旧宿主/测试传入的普通对象。 */
export function liveConfig<T extends object>(config: T): T {
  return new Proxy(config, {
    get(target, key, receiver) {
      const value: unknown = Reflect.get(target as object, key, receiver)
      return value !== null && typeof value === 'object' && typeof (value as { get?: unknown }).get === 'function'
        ? (value as { get(): unknown }).get()
        : value
    },
  }) as T
}
