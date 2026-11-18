/**
 * edge-tts 协议客户端：原生 WebSocket 直连微软 Edge 朗读服务，零 API 成本。
 * 协议对齐开源 edge-tts 当前版本：Sec-MS-GEC 令牌由本地 DRM 算法生成
 * （SHA256(Windows 文件时间 + TrustedClientToken)，5 分钟窗口），不再请求令牌端点。
 *
 * @module dsh-voice/edge-tts
 */
import { randomBytes, randomUUID } from 'node:crypto'
import WebSocket from 'ws'
import { edgeTokenV2 } from './edge-drm-v2.js'
import { getProxyWsAgent } from './proxy-fetch.js'
import { buildPronunciationPattern, splitInlinePauses } from './tts-text.js'
import { VOICES, type VoiceInfo } from './voices.js'

const TRUSTED_CLIENT_TOKEN = '6A5AA1D4EAFF4E9FB37E23D68491D6F4'
const WS_BASE = 'wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1'
const VOICES_LIST_URL = 'https://speech.platform.bing.com/consumer/speech/synthesize/readaloud/voices/list'
const EDGE_VOICES_CACHE_TTL_MS = 24 * 60 * 60 * 1000
const OUTPUT_FORMAT = 'audio-24khz-48kbitrate-mono-mp3'
const SEC_MS_GEC_VERSION = '2-143.0.3650.75'
const WIN_EPOCH_SECONDS = 11644473600
const WSS_HEADERS: Record<string, string> = {
  Pragma: 'no-cache',
  'Cache-Control': 'no-cache',
  Origin: 'chrome-extension://jdiccldimpdaibmpdkjnbmckianbfold',
  'Accept-Encoding': 'gzip, deflate, br, zstd',
  'Accept-Language': 'en-US,en;q=0.9',
  'Sec-WebSocket-Version': '13',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0',
}

/** 403 响应校准出的服务端时钟偏差（秒）：serverSeconds - Date.now() / 1000。 */
let clockSkewSeconds = 0

/** 重置时钟偏差缓存（测试专用）。 */
export function resetClockSkewForTest(): void {
  clockSkewSeconds = 0
}

/** 读取当前时钟偏差（秒）。 */
export function getClockSkewSeconds(): number {
  return clockSkewSeconds
}

/** 合成选项。 */
export interface TtsOptions {
  text: string
  voice: string
  rate: string
  pitch: string
  pronunciations?: ReadonlyArray<{ word: string; alias: string }>
}

/** 字幕时间轴条目（毫秒级）。 */
export interface SubtitleCue {
  index: number
  startMs: number
  endMs: number
  text: string
}

/** 可注入依赖（测试用假实现）。 */
export interface TtsDeps {
  webSocketFactory?: WebSocketFactory
  nowSeconds?: () => number
  proxyUrl?: string
  /** 取消信号（可选）；也可通过 synthesizeSpeech 第 4 个参数传入。 */
  signal?: AbortSignal
  /** 是否显式启用 Keep-Alive WebSocket 连接池（未注入 webSocketFactory 时默认开启）。 */
  usePool?: boolean
  /** 瞬态网络断连重试次数（未注入 webSocketFactory 时默认为 1，测试注入时默认为 0）。 */
  maxRetries?: number
}

/** unexpected-response 事件中的 HTTP 响应最小面。 */
export interface UnexpectedResponseInfo {
  statusCode?: number
  headers?: Record<string, string | string[] | undefined>
  resume?: () => void
}

/** 最小的 WebSocket 面。 */
export interface WebSocketLike {
  addEventListener(type: 'message', listener: (event: { data: unknown }) => void): void
  addEventListener(type: 'open' | 'close' | 'error', listener: (event?: unknown) => void): void
  removeEventListener?(type: 'message' | 'open' | 'close' | 'error', listener: (...args: any[]) => void): void
  readyState?: number
  on?(event: 'unexpected-response', listener: (req: unknown, res: UnexpectedResponseInfo) => void): void
  send(data: string): void
  close(): void
}

export type WebSocketFactory = (url: string, options: { headers: Record<string, string> }) => WebSocketLike

/** 内部哨兵错误：收到 403 且已根据服务端 Date 头校准时钟后触发单次重试。 */
class ClockSkewRetrySignal extends Error {
  constructor() {
    super('clock-skew-retry')
  }
}

/** 内部哨兵错误：池中复用的空闲连接在收到任何音频帧前已失效，立即换全新连接重试。 */
class StalePooledSocketSignal extends Error {
  constructor() {
    super('stale-pooled-socket')
  }
}

/** 标记可安全重试的瞬态 WebSocket / 握手错误（保留原始中文报错文本）。 */
class TransientWsError extends Error {}

const POOL_MAX_IDLE_PER_KEY = 2
const POOL_IDLE_TTL_MS = 15_000

interface PooledTurnHandlers {
  onOpen?: () => void
  onMessage?: (event: { data: unknown }) => void
  onError?: (event?: unknown) => void
  onClose?: (event?: unknown) => void
  onUnexpectedResponse?: (req: unknown, res: UnexpectedResponseInfo) => void
}

interface PooledSocketEntry {
  socket: WebSocketLike
  timer: ReturnType<typeof setTimeout>
  key: string
  opened: boolean
  closedOrErrored: boolean
  handlers: PooledTurnHandlers | null
}

const edgeConnectionPool = new Map<string, PooledSocketEntry[]>()

function removeFromIdlePool(target: PooledSocketEntry): void {
  const bucket = edgeConnectionPool.get(target.key)
  if (!bucket) return
  const idx = bucket.indexOf(target)
  if (idx >= 0) {
    clearTimeout(target.timer)
    bucket.splice(idx, 1)
    if (bucket.length === 0) edgeConnectionPool.delete(target.key)
  }
}

function isSocketReusable(entry: PooledSocketEntry): boolean {
  if (entry.closedOrErrored || !entry.opened) return false
  const rs = (entry.socket as { readyState?: unknown }).readyState
  if (typeof rs === 'number') {
    return rs === 1
  }
  return true
}

function createManagedSocketEntry(
  key: string,
  factory: WebSocketFactory,
  url: string,
  headers: Record<string, string>,
): PooledSocketEntry {
  const socket = factory(url, { headers })
  const dummyTimer = setTimeout(() => {}, 0)
  clearTimeout(dummyTimer)
  const entry: PooledSocketEntry = {
    socket,
    timer: dummyTimer,
    key,
    opened: (socket as { readyState?: unknown }).readyState === 1,
    closedOrErrored: false,
    handlers: null,
  }

  socket.addEventListener('open', () => {
    entry.opened = true
    entry.handlers?.onOpen?.()
  })
  socket.addEventListener('message', (event) => {
    entry.handlers?.onMessage?.(event)
  })
  socket.addEventListener('error', (event) => {
    entry.closedOrErrored = true
    removeFromIdlePool(entry)
    entry.handlers?.onError?.(event)
  })
  socket.addEventListener('close', (event) => {
    entry.closedOrErrored = true
    removeFromIdlePool(entry)
    entry.handlers?.onClose?.(event)
  })
  if (typeof socket.on === 'function') {
    socket.on('unexpected-response', (req, res) => {
      entry.closedOrErrored = true
      removeFromIdlePool(entry)
      entry.handlers?.onUnexpectedResponse?.(req, res)
    })
  }

  return entry
}

function acquirePooledSocket(key: string): PooledSocketEntry | null {
  const bucket = edgeConnectionPool.get(key)
  if (!bucket || bucket.length === 0) return null

  while (bucket.length > 0) {
    const entry = bucket.pop()!
    clearTimeout(entry.timer)
    if (bucket.length === 0) edgeConnectionPool.delete(key)
    if (isSocketReusable(entry)) {
      return entry
    }
    entry.closedOrErrored = true
    entry.handlers = null
    try { entry.socket.close() } catch { /* 忽略 */ }
  }
  return null
}

function releaseSocketToPool(entry: PooledSocketEntry): void {
  entry.handlers = null
  if (!isSocketReusable(entry)) {
    entry.closedOrErrored = true
    try { entry.socket.close() } catch { /* 忽略 */ }
    return
  }

  let bucket = edgeConnectionPool.get(entry.key)
  if (!bucket) {
    bucket = []
    edgeConnectionPool.set(entry.key, bucket)
  }
  while (bucket.length >= POOL_MAX_IDLE_PER_KEY) {
    const oldest = bucket.shift()!
    clearTimeout(oldest.timer)
    oldest.closedOrErrored = true
    oldest.handlers = null
    try { oldest.socket.close() } catch { /* 忽略 */ }
  }

  const timer = setTimeout(() => {
    removeFromIdlePool(entry)
    entry.closedOrErrored = true
    entry.handlers = null
    try { entry.socket.close() } catch { /* 忽略 */ }
  }, POOL_IDLE_TTL_MS)
  timer.unref?.()
  entry.timer = timer
  bucket.push(entry)
}

function discardSocketEntry(entry: PooledSocketEntry): void {
  removeFromIdlePool(entry)
  clearTimeout(entry.timer)
  entry.closedOrErrored = true
  entry.handlers = null
  try { entry.socket.close() } catch { /* 忽略 */ }
}

/** 关闭并清空所有 Edge TTS 空闲保活 WebSocket 连接池。 */
export function closeEdgeConnectionPool(): void {
  for (const bucket of edgeConnectionPool.values()) {
    for (const entry of bucket) {
      clearTimeout(entry.timer)
      entry.closedOrErrored = true
      entry.handlers = null
      try { entry.socket.close() } catch { /* 忽略 */ }
    }
  }
  edgeConnectionPool.clear()
}

/** 直连工厂（ws 库，Node 全版本可用）。 */
function directWebSocket(url: string, options: { headers: Record<string, string> }): WebSocketLike {
  return new WebSocket(url, { headers: options.headers }) as unknown as WebSocketLike
}

/** 代理工厂：复用 proxy-fetch 缓存的 HTTP(S) / SOCKS5 Agent。 */
function proxyWebSocket(proxyUrl: string): WebSocketFactory {
  const agent = getProxyWsAgent(proxyUrl)
  return (url, options) => new WebSocket(url, { headers: options.headers, agent: agent as any }) as unknown as WebSocketLike
}

/**
 * 本地生成 Sec-MS-GEC v2 令牌（对齐 edge-tts 7.3.1）。
 */
export function generateSecMsGec(nowSeconds: number = Date.now() / 1000): string {
  let ticks = Math.floor(nowSeconds) + WIN_EPOCH_SECONDS
  ticks -= ticks % 300
  const windowsTicks = ticks * 10000000
  const raw = String(windowsTicks) + TRUSTED_CLIENT_TOKEN
  return edgeTokenV2(raw)
}

/** 去除 XML 1.0 非法控制字符（保留 \t \n \r）。 */
function stripIllegalXmlChars(text: string): string {
  return text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '')
}

/** XML 文本转义。 */
function escapeXml(text: string): string {
  return stripIllegalXmlChars(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

/** XML 属性转义（同时转义单双引号）。 */
function escapeXmlAttr(value: string): string {
  return escapeXml(value)
    .replace(/'/g, '&apos;')
    .replace(/"/g, '&quot;')
}

function renderTextWithPronunciations(
  part: string,
  map: Map<string, string>,
  regex: RegExp | null,
): string {
  if (regex === null || map.size === 0) {
    return escapeXml(part)
  }
  regex.lastIndex = 0
  let out = ''
  let lastIndex = 0
  let match: RegExpExecArray | null
  while ((match = regex.exec(part)) !== null) {
    if (match.index > lastIndex) {
      out += escapeXml(part.slice(lastIndex, match.index))
    }
    const matchedWord = match[0]
    const alias = map.get(matchedWord)
    if (alias !== undefined) {
      out += `<sub alias='${escapeXmlAttr(alias)}'>${escapeXml(matchedWord)}</sub>`
    } else {
      out += escapeXml(matchedWord)
    }
    lastIndex = match.index + matchedWord.length
  }
  if (lastIndex < part.length) {
    out += escapeXml(part.slice(lastIndex))
  }
  return out
}

function renderSsmlBody(text: string, pronunciations?: ReadonlyArray<{ word: string; alias: string }>): string {
  const cleanText = stripIllegalXmlChars(text)
  const map = new Map<string, string>()
  if (Array.isArray(pronunciations)) {
    for (const rule of pronunciations) {
      if (!rule || typeof rule.word !== 'string' || typeof rule.alias !== 'string') continue
      const word = stripIllegalXmlChars(rule.word).trim()
      const alias = stripIllegalXmlChars(rule.alias).trim()
      if (word !== '' && alias !== '') {
        map.set(word, alias)
      }
    }
  }

  const pieces = splitInlinePauses(cleanText)
  const hasPause = pieces.some((p) => p.kind === 'pause')
  if (!hasPause && map.size === 0) {
    return escapeXml(cleanText)
  }

  const regex = map.size > 0 ? buildPronunciationPattern(Array.from(map.keys())) : null
  if (!hasPause) {
    return renderTextWithPronunciations(cleanText, map, regex)
  }

  let out = ''
  for (const piece of pieces) {
    if (piece.kind === 'pause') {
      out += `<break time='${piece.durationMs}ms'/>`
    } else {
      out += renderTextWithPronunciations(piece.text, map, regex)
    }
  }
  return out
}

/** 生成 SSML。 */
export function buildSsml(options: TtsOptions): string {
  const lang = /^[a-z]{2,3}(?:-[A-Za-z]{2,4})?(?:-[A-Z]{2})?/.exec(options.voice)?.[0] ?? 'zh-CN'
  return "<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='"
    + escapeXmlAttr(lang)
    + "'><voice name='"
    + escapeXmlAttr(options.voice)
    + "'><prosody pitch='"
    + escapeXmlAttr(options.pitch)
    + "' rate='"
    + escapeXmlAttr(options.rate)
    + "' volume='+0%'>"
    + renderSsmlBody(options.text, options.pronunciations)
    + '</prosody></voice></speak>'
}

/** 生成带时间戳与路径的协议消息头。 */
function protocolHeader(path: string, extra: Record<string, string>): string {
  const lines = ['X-Timestamp:' + new Date().toISOString()]
  for (const [key, value] of Object.entries(extra)) lines.push(key + ':' + value)
  lines.push('Path:' + path)
  return lines.join('\r\n') + '\r\n\r\n'
}

/** 从 metadata JSON 文本帧中提取句/词边界字幕。 */
function parseMetadataCues(data: string, cues: SubtitleCue[]): void {
  const sepIndex = data.indexOf('\r\n\r\n')
  if (sepIndex === -1) return
  const body = data.slice(sepIndex + 4).trim()
  if (body === '') return
  let parsed: {
    Metadata?: Array<{
      Type?: string
      Data?: {
        Offset?: number
        Duration?: number
        text?: { Text?: string }
      }
    }>
  }
  try {
    parsed = JSON.parse(body) as typeof parsed
  } catch {
    return
  }
  for (const item of parsed.Metadata ?? []) {
    if (item.Type !== 'SentenceBoundary' && item.Type !== 'WordBoundary') continue
    const offset = Number(item.Data?.Offset ?? 0)
    const duration = Number(item.Data?.Duration ?? 0)
    const text = item.Data?.text?.Text ?? ''
    if (!Number.isFinite(offset) || !Number.isFinite(duration) || text === '') continue
    const startMs = Math.round(offset / 10000)
    const endMs = Math.round((offset + duration) / 10000)
    cues.push({ index: cues.length + 1, startMs, endMs, text })
  }
}

export type EdgeBoundaryMode = 'sentence' | 'word' | 'all' | false

function sendSynthesisTurn(
  socket: WebSocketLike,
  options: TtsOptions & { boundary?: EdgeBoundaryMode },
): void {
  const sentenceBoundaryEnabled = options.boundary === 'sentence' || options.boundary === 'all' ? 'true' : 'false'
  const wordBoundaryEnabled = options.boundary === 'word' || options.boundary === 'all' ? 'true' : 'false'
  const config = protocolHeader('speech.config', { 'Content-Type': 'application/json; charset=utf-8' })
    + JSON.stringify({
      context: {
        synthesis: {
          audio: {
            metadataoptions: { sentenceBoundaryEnabled, wordBoundaryEnabled },
            outputFormat: OUTPUT_FORMAT,
          },
        },
      },
    })
  const ssml = protocolHeader('ssml', { 'Content-Type': 'application/ssml+xml', 'X-RequestId': randomUUID() }) + buildSsml(options)
  socket.send(config)
  socket.send(ssml)
}

function sleepWithAbort(ms: number, signal: AbortSignal | undefined): Promise<void> {
  if (signal?.aborted === true) return Promise.reject(signal.reason)
  if (ms <= 0) return Promise.resolve()
  return new Promise<void>((resolvePromise, rejectPromise) => {
    const canListen = typeof signal?.addEventListener === 'function'
    let onAbort = () => {}
    const timer = setTimeout(() => {
      if (canListen) signal!.removeEventListener('abort', onAbort)
      resolvePromise()
    }, ms)
    timer.unref?.()
    if (canListen) {
      onAbort = () => {
        clearTimeout(timer)
        rejectPromise(signal!.reason)
      }
      signal!.addEventListener('abort', onAbort, { once: true })
    }
  })
}

async function runSynthesisAttempt(
  options: TtsOptions & { boundary?: EdgeBoundaryMode },
  factory: WebSocketFactory,
  nowSeconds: number,
  attemptTimeoutMs: number,
  totalTimeoutMs: number,
  abortSignal: AbortSignal | undefined,
  canRetryOn403: boolean,
  poolingEnabled: boolean,
  allowPoolReuse: boolean,
  poolKey: string,
): Promise<{ audio: Buffer; cues: SubtitleCue[] }> {
  let reusedEntry = poolingEnabled && allowPoolReuse ? acquirePooledSocket(poolKey) : null
  const isReused = reusedEntry !== null

  let entry: PooledSocketEntry
  if (reusedEntry !== null) {
    entry = reusedEntry
  } else {
    const token = generateSecMsGec(nowSeconds)
    // 对齐 edge-tts 当前协议：Sec-MS-GEC 走 URL 查询参数，MUID 走 header
    const url = WS_BASE + '?TrustedClientToken=' + TRUSTED_CLIENT_TOKEN + '&ConnectionId=' + randomUUID().replace(/-/g, '') + '&Sec-MS-GEC=' + token + '&Sec-MS-GEC-Version=' + SEC_MS_GEC_VERSION
    const headers = { ...WSS_HEADERS, Cookie: 'muid=' + randomBytes(16).toString('hex').toUpperCase() + ';' }
    entry = createManagedSocketEntry(poolKey, factory, url, headers)
  }

  const chunks: Buffer[] = []
  const cues: SubtitleCue[] = []
  let done = false

  await new Promise<void>((resolvePromise, reject) => {
    const canListen = typeof abortSignal?.addEventListener === 'function'
    let settled = false
    let timer: ReturnType<typeof setTimeout> | undefined
    let onAbort = () => { /* 占位，随后立即赋值 */ }

    // 先结算再关/回收 socket：即使 socket.close() 同步触发 close 事件，取消原因也不会被通用错误覆盖。
    const fail = (error: unknown, shouldCloseSocket = true) => {
      if (settled) return
      settled = true
      entry.handlers = null
      if (timer !== undefined) clearTimeout(timer)
      if (canListen) (abortSignal as AbortSignal).removeEventListener('abort', onAbort)
      if (shouldCloseSocket) {
        discardSocketEntry(entry)
      }
      reject(error)
    }

    const finish = () => {
      if (settled) return
      settled = true
      entry.handlers = null
      if (timer !== undefined) clearTimeout(timer)
      if (canListen) (abortSignal as AbortSignal).removeEventListener('abort', onAbort)
      if (poolingEnabled) {
        releaseSocketToPool(entry)
      } else {
        discardSocketEntry(entry)
      }
      resolvePromise()
    }

    onAbort = () => {
      const reason = abortSignal?.reason ?? new Error('语音合成已取消。')
      fail(reason, true)
    }

    timer = setTimeout(() => {
      fail(new Error('语音合成超时（' + totalTimeoutMs + ' 毫秒无完整音频），请重试或检查网络。'), true)
    }, attemptTimeoutMs)

    if (canListen) (abortSignal as AbortSignal).addEventListener('abort', onAbort, { once: true })
    if (abortSignal?.aborted === true) {
      onAbort()
      return
    }

    entry.handlers = {
      onUnexpectedResponse(_req, res) {
        const status = res?.statusCode
        if (status === 403 && canRetryOn403) {
          const rawDate = res.headers?.date ?? res.headers?.Date
          const dateStr = Array.isArray(rawDate) ? rawDate[0] : rawDate
          const serverSeconds = typeof dateStr === 'string' ? Date.parse(dateStr) / 1000 : Number.NaN
          if (Number.isFinite(serverSeconds)) {
            clockSkewSeconds = serverSeconds - Date.now() / 1000
            try { res.resume?.() } catch { /* 忽略 */ }
            fail(new ClockSkewRetrySignal(), true)
            return
          }
        }
        try { res?.resume?.() } catch { /* 忽略 */ }
        if (status === 403) {
          fail(new Error('edge-tts 服务端返回 HTTP 403（请求被拒绝或本机时钟偏差过大）。'), true)
        } else if (status === undefined || status >= 500 || status === 429) {
          fail(new TransientWsError('edge-tts 握手失败（HTTP ' + String(status ?? 'unknown') + '）。'), true)
        } else {
          fail(new Error('edge-tts 握手失败（HTTP ' + String(status) + '）。'), true)
        }
      },

      onOpen() {
        try {
          sendSynthesisTurn(entry.socket, options)
        } catch (error) {
          fail(new TransientWsError(error instanceof Error ? error.message : String(error)), true)
        }
      },

      onMessage(event) {
        const data = event.data
        if (typeof data === 'string') {
          if (data.includes('Path:audio.metadata')) {
            parseMetadataCues(data, cues)
            return
          }
          if (data.includes('Path:turn.end')) {
            if (chunks.length === 0) {
              if (isReused) {
                fail(new StalePooledSocketSignal(), true)
              } else {
                fail(new Error('合成结束但没有收到音频数据（服务端可能拒绝了请求）。'), true)
              }
            } else if (!done) {
              done = true
              finish()
            }
          }
          return
        }
        // 二进制帧：2 字节大端头长 + 头文本 + 音频数据；只收 Path:audio 帧避免非音频头污染 MP3 流
        const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data as ArrayBuffer)
        if (buffer.length > 2) {
          const headerLength = buffer.readUInt16BE(0)
          if (buffer.length > 2 + headerLength) {
            const header = buffer.subarray(2, 2 + headerLength).toString('utf8')
            if (/(?:^|\r?\n)Path:audio(?:\r?\n|$)/.test(header)) {
              chunks.push(buffer.subarray(2 + headerLength))
            }
          }
        }
      },

      onError() {
        if (isReused && chunks.length === 0) {
          fail(new StalePooledSocketSignal(), true)
          return
        }
        fail(
          new TransientWsError('edge-tts WebSocket 连接失败。若网络需要特殊代理（梯子），请在 DSH「设置 → 插件 → 语音」配置 proxyUrl（保存即生效）。'),
          true,
        )
      },

      onClose() {
        if (!done) {
          if (isReused && chunks.length === 0) {
            fail(new StalePooledSocketSignal(), true)
            return
          }
          fail(new TransientWsError('edge-tts 连接在收到完整音频前关闭（未收到 turn.end）。'), true)
        }
      },
    }

    if (isReused || entry.opened) {
      try {
        sendSynthesisTurn(entry.socket, options)
      } catch (error) {
        if (isReused) {
          fail(new StalePooledSocketSignal(), true)
        } else {
          fail(new TransientWsError(error instanceof Error ? error.message : String(error)), true)
        }
      }
    }
  })

  const audio = Buffer.concat(chunks)
  if (audio.length === 0) throw new Error('合成结果为空。')
  return { audio, cues }
}

/**
 * 合成语音并可选返回句/词级边界字幕时间轴。
 * 支持 Keep-Alive WebSocket 连接池复用、HTTP 403 时钟自动校准与瞬态断连自动重试。
 * @throws 文本为空/超长 / 连接失败 / 超时 / 无音频数据时抛中文错误。
 */
export async function synthesizeSpeechWithMetadata(
  options: TtsOptions & { boundary?: EdgeBoundaryMode },
  deps: TtsDeps = {},
  timeoutMs = 30000,
  signal?: AbortSignal,
): Promise<{ audio: Buffer; cues: SubtitleCue[] }> {
  const abortSignal = signal ?? deps.signal
  throwIfAborted(abortSignal)
  if (options.text.trim() === '') throw new Error('要合成的文本为空。')
  if (options.text.length > 5000) throw new Error('文本过长（超过 5000 字符），请分段合成。')

  const factory = deps.webSocketFactory ?? (deps.proxyUrl !== undefined && deps.proxyUrl !== '' ? proxyWebSocket(deps.proxyUrl) : directWebSocket)
  const poolingEnabled = deps.usePool === true || deps.webSocketFactory === undefined
  const poolKey = deps.proxyUrl && deps.proxyUrl !== '' ? deps.proxyUrl : 'direct'
  const rawRetries = deps.maxRetries ?? (deps.webSocketFactory === undefined ? 1 : 0)
  let retriesLeft = Number.isFinite(rawRetries) ? Math.max(0, Math.floor(rawRetries)) : 0
  let canRetryOn403 = true
  let allowPoolReuse = poolingEnabled

  const startedAt = Date.now()
  const now = () => (deps.nowSeconds ? deps.nowSeconds() : Date.now() / 1000 + clockSkewSeconds)

  while (true) {
    throwIfAborted(abortSignal)
    const remainingMs = timeoutMs - (Date.now() - startedAt)
    if (remainingMs <= 0) {
      throw new Error('语音合成超时（' + timeoutMs + ' 毫秒无完整音频），请重试或检查网络。')
    }

    try {
      return await runSynthesisAttempt(
        options,
        factory,
        now(),
        remainingMs,
        timeoutMs,
        abortSignal,
        canRetryOn403,
        poolingEnabled,
        allowPoolReuse,
        poolKey,
      )
    } catch (error) {
      throwIfAborted(abortSignal)

      if (error instanceof StalePooledSocketSignal) {
        allowPoolReuse = false
        continue
      }

      if (error instanceof ClockSkewRetrySignal) {
        canRetryOn403 = false
        allowPoolReuse = false
        continue
      }

      if (error instanceof TransientWsError && retriesLeft > 0) {
        retriesLeft -= 1
        allowPoolReuse = false
        const leftBeforeWait = timeoutMs - (Date.now() - startedAt)
        if (leftBeforeWait <= 0) {
          throw new Error('语音合成超时（' + timeoutMs + ' 毫秒无完整音频），请重试或检查网络。')
        }
        await sleepWithAbort(Math.min(150, leftBeforeWait), abortSignal)
        continue
      }

      throw error
    }
  }
}

/**
 * 合成语音，返回 MP3 字节。
 * @throws 文本为空/超长 / 连接失败 / 超时 / 无音频数据时抛中文错误。
 */
export async function synthesizeSpeech(options: TtsOptions, deps: TtsDeps = {}, timeoutMs = 30000, signal?: AbortSignal): Promise<Buffer> {
  const result = await synthesizeSpeechWithMetadata(options, deps, timeoutMs, signal)
  return result.audio
}

/** 在线音色列表拉取的可注入依赖。 */
export interface FetchEdgeVoicesDeps {
  fetchImpl?: typeof fetch
  nowSeconds?: () => number
  signal?: AbortSignal
  forceRefresh?: boolean
}

interface RawEdgeVoiceItem {
  ShortName?: unknown
  Gender?: unknown
  Locale?: unknown
  FriendlyName?: unknown
  VoiceTag?: {
    ContentCategories?: unknown
    VoicePersonalities?: unknown
  }
}

let cachedEdgeVoices: { voices: VoiceInfo[]; fetchedAtMs: number } | undefined

/** 重置 Edge 在线音色内存缓存（测试专用）。 */
export function resetEdgeVoicesCacheForTest(): void {
  cachedEdgeVoices = undefined
}

function throwIfAborted(signal: AbortSignal | undefined): void {
  if (signal?.aborted === true) throw signal.reason
}

function raceAbortSignal<T>(value: T | PromiseLike<T>, signal: AbortSignal | undefined): Promise<T> {
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

function collectLowercaseTags(builtinTags: readonly string[] | undefined, voiceTag: RawEdgeVoiceItem['VoiceTag']): string[] {
  const tagSet = new Set<string>()
  const pushAll = (items: unknown) => {
    if (!Array.isArray(items)) return
    for (const item of items) {
      if (typeof item !== 'string') continue
      const normalized = item.trim().toLowerCase()
      if (normalized !== '') tagSet.add(normalized)
    }
  }
  pushAll(builtinTags)
  pushAll(voiceTag?.ContentCategories)
  pushAll(voiceTag?.VoicePersonalities)
  return Array.from(tagSet)
}

/**
 * 动态拉取微软 Edge 在线全量（300+）音色目录并缓存 24 小时。
 * @throws 请求失败 / 重定向 / 响应异常 / 超时时抛中文错误。
 */
export async function fetchEdgeVoices(deps: FetchEdgeVoicesDeps = {}, timeoutMs = 15000): Promise<VoiceInfo[]> {
  throwIfAborted(deps.signal)

  if (
    deps.forceRefresh !== true
    && cachedEdgeVoices !== undefined
    && Date.now() - cachedEdgeVoices.fetchedAtMs < EDGE_VOICES_CACHE_TTL_MS
  ) {
    return cachedEdgeVoices.voices
  }

  const nowSec = deps.nowSeconds ? deps.nowSeconds() : Date.now() / 1000 + clockSkewSeconds
  const token = generateSecMsGec(nowSec)
  const url = `${VOICES_LIST_URL}?trustedclienttoken=${TRUSTED_CLIENT_TOKEN}&Sec-MS-GEC=${token}&Sec-MS-GEC-Version=${SEC_MS_GEC_VERSION}`
  const fetchImpl = deps.fetchImpl ?? globalThis.fetch
  const timeoutSignal = AbortSignal.timeout(timeoutMs)
  const requestSignal = deps.signal === undefined ? timeoutSignal : AbortSignal.any([timeoutSignal, deps.signal])

  let response: Response
  try {
    response = await raceAbortSignal(
      fetchImpl(url, {
        method: 'GET',
        redirect: 'manual',
        headers: {
          'User-Agent': WSS_HEADERS['User-Agent'],
          Accept: 'application/json',
          'Sec-MS-GEC': token,
          'Sec-MS-GEC-Version': SEC_MS_GEC_VERSION,
        },
        signal: requestSignal,
      }),
      requestSignal,
    )
  } catch (error) {
    throwIfAborted(deps.signal)
    if (timeoutSignal.aborted) throw new Error('拉取 Edge 在线音色列表超时，请重试或检查网络。')
    throw new Error('拉取 Edge 在线音色列表失败：' + (error instanceof Error ? error.message : String(error)))
  }

  if (response.status >= 300 && response.status < 400) {
    try { await raceAbortSignal(response.body?.cancel(), requestSignal) } catch { /* 忽略 */ }
    throwIfAborted(deps.signal)
    throw new Error('Edge 在线音色列表返回重定向（HTTP ' + response.status + '），已阻止跳转。')
  }

  if (!response.ok) {
    try { await raceAbortSignal(response.body?.cancel(), requestSignal) } catch { /* 忽略 */ }
    throwIfAborted(deps.signal)
    throw new Error('拉取 Edge 在线音色列表失败：HTTP ' + response.status + '。')
  }

  let rawList: unknown
  try {
    rawList = await raceAbortSignal(response.json(), requestSignal)
  } catch (error) {
    throwIfAborted(deps.signal)
    if (timeoutSignal.aborted) throw new Error('拉取 Edge 在线音色列表超时，请重试或检查网络。')
    throw new Error('Edge 在线音色列表响应不是合法 JSON：' + (error instanceof Error ? error.message : String(error)))
  }

  if (!Array.isArray(rawList) || rawList.length === 0) {
    throw new Error('Edge 在线音色列表为空或格式异常。')
  }

  const builtinById = new Map(VOICES.map((voice) => [voice.id, voice]))
  const mapped: VoiceInfo[] = []
  for (const entry of rawList) {
    if (typeof entry !== 'object' || entry === null) continue
    const item = entry as RawEdgeVoiceItem
    if (typeof item.ShortName !== 'string' || item.ShortName.trim() === '') continue

    const id = item.ShortName.trim()
    const gender: 'Female' | 'Male' = item.Gender === 'Male' ? 'Male' : 'Female'
    const builtin = builtinById.get(id)
    const localeRaw = typeof item.Locale === 'string' && item.Locale.trim() !== ''
      ? item.Locale.trim()
      : id.split('-').slice(0, 2).join('-')
    const friendlyRaw = typeof item.FriendlyName === 'string' ? item.FriendlyName.trim() : ''
    const locale = builtin !== undefined ? builtin.locale : `${localeRaw}（${friendlyRaw || id}）`
    const tags = collectLowercaseTags(builtin?.tags, item.VoiceTag)

    mapped.push({ id, gender, locale, tags })
  }

  if (mapped.length === 0) {
    throw new Error('Edge 在线音色列表为空或格式异常。')
  }

  cachedEdgeVoices = { voices: mapped, fetchedAtMs: Date.now() }
  return mapped
}
