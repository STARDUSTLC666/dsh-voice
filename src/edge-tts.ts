/**
 * edge-tts 协议客户端：原生 WebSocket 直连微软 Edge 朗读服务，零 API 成本。
 * 协议对齐开源 edge-tts 当前版本：Sec-MS-GEC 令牌由本地 DRM 算法生成
 * （SHA256(Windows 文件时间 + TrustedClientToken)，5 分钟窗口），不再请求令牌端点。
 *
 * @module dsh-voice/edge-tts
 */
import { createHash, randomBytes, randomUUID } from 'node:crypto'
import { HttpsProxyAgent } from 'https-proxy-agent'
import WebSocket from 'ws'

const TRUSTED_CLIENT_TOKEN = '6A5AA1D4EAFF4E9FB37E23D68491D6F4'
const WS_BASE = 'wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1'
const OUTPUT_FORMAT = 'audio-24khz-48kbitrate-mono-mp3'
const SEC_MS_GEC_VERSION = '1-143.0.3650.75'
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

/** 合成选项。 */
export interface TtsOptions {
  text: string
  voice: string
  rate: string
  pitch: string
}

/** 可注入依赖（测试用假实现）。 */
export interface TtsDeps {
  webSocketFactory?: WebSocketFactory
  nowSeconds?: () => number
  proxyUrl?: string
}

/** 最小的 WebSocket 面。 */
export interface WebSocketLike {
  addEventListener(type: 'message', listener: (event: { data: unknown }) => void): void
  addEventListener(type: 'open' | 'close' | 'error', listener: (event?: unknown) => void): void
  send(data: string): void
  close(): void
}

export type WebSocketFactory = (url: string, options: { headers: Record<string, string> }) => WebSocketLike

/** 直连工厂（ws 库，Node 全版本可用）。 */
function directWebSocket(url: string, options: { headers: Record<string, string> }): WebSocketLike {
  return new WebSocket(url, { headers: options.headers }) as unknown as WebSocketLike
}

/** 代理工厂：经 HTTP CONNECT 隧道走本地代理（大陆直连会被重置时使用）。 */
function proxyWebSocket(proxyUrl: string): WebSocketFactory {
  const agent = new HttpsProxyAgent(proxyUrl)
  return (url, options) => new WebSocket(url, { headers: options.headers, agent }) as unknown as WebSocketLike
}

/**
 * 本地生成 Sec-MS-GEC 令牌（对齐 edge-tts DRM 算法）。
 */
export function generateSecMsGec(nowSeconds: number = Date.now() / 1000): string {
  let ticks = Math.floor(nowSeconds) + WIN_EPOCH_SECONDS
  ticks -= ticks % 300
  const windowsTicks = ticks * 10000000
  const raw = String(windowsTicks) + TRUSTED_CLIENT_TOKEN
  return createHash('sha256').update(raw, 'ascii').digest('hex').toUpperCase()
}

/** XML 转义。 */
function escapeXml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/** 生成 SSML。 */
export function buildSsml(options: TtsOptions): string {
  const lang = /^[a-z]{2,3}(-[A-Z]{2})?/.exec(options.voice)?.[0] ?? 'zh-CN'
  return "<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='" + lang + "'><voice name='" + options.voice + "'><prosody pitch='" + options.pitch + "' rate='" + options.rate + "' volume='+0%'>" + escapeXml(options.text) + '</prosody></voice></speak>'
}

/** 生成带时间戳与路径的协议消息头。 */
function protocolHeader(path: string, extra: Record<string, string>): string {
  const lines = ['X-Timestamp:' + new Date().toISOString()]
  for (const [key, value] of Object.entries(extra)) lines.push(key + ':' + value)
  lines.push('Path:' + path)
  return lines.join('\r\n') + '\r\n\r\n'
}

/**
 * 合成语音，返回 MP3 字节。
 * @throws 文本为空/超长 / 连接失败 / 超时 / 无音频数据时抛中文错误。
 */
export async function synthesizeSpeech(options: TtsOptions, deps: TtsDeps = {}, timeoutMs = 30000): Promise<Buffer> {
  if (options.text.trim() === '') throw new Error('要合成的文本为空。')
  if (options.text.length > 5000) throw new Error('文本过长（超过 5000 字符），请分段合成。')

  const factory = deps.webSocketFactory ?? (deps.proxyUrl !== undefined && deps.proxyUrl !== '' ? proxyWebSocket(deps.proxyUrl) : directWebSocket)
  const token = generateSecMsGec(deps.nowSeconds?.() ?? Date.now() / 1000)
  // 对齐 edge-tts 当前协议：Sec-MS-GEC 走 URL 查询参数，MUID 走 header
  const url = WS_BASE + '?TrustedClientToken=' + TRUSTED_CLIENT_TOKEN + '&ConnectionId=' + randomUUID().replace(/-/g, '') + '&Sec-MS-GEC=' + token + '&Sec-MS-GEC-Version=' + SEC_MS_GEC_VERSION
  const socket = factory(url, {
    headers: { ...WSS_HEADERS, MUID: randomBytes(16).toString('hex').toUpperCase() },
  })

  const chunks: Buffer[] = []
  let done = false
  await new Promise<void>((resolvePromise, reject) => {
    const timer = setTimeout(() => {
      try { socket.close() } catch { /* 忽略 */ }
      reject(new Error('语音合成超时（' + timeoutMs + ' 毫秒无完整音频），请重试或检查网络。'))
    }, timeoutMs)
    const finish = () => { clearTimeout(timer); try { socket.close() } catch { /* 忽略 */ } resolvePromise() }

    socket.addEventListener('open', () => {
      const config = protocolHeader('speech.config', { 'Content-Type': 'application/json; charset=utf-8' })
        + JSON.stringify({
          context: {
            synthesis: {
              audio: { metadataoptions: { sentenceBoundaryEnabled: 'false', wordBoundaryEnabled: 'false' }, outputFormat: OUTPUT_FORMAT },
            },
          },
        })
      const ssml = protocolHeader('ssml', { 'Content-Type': 'application/ssml+xml', 'X-RequestId': randomUUID() }) + buildSsml(options)
      try {
        socket.send(config)
        socket.send(ssml)
      } catch (error) {
        clearTimeout(timer)
        reject(error instanceof Error ? error : new Error(String(error)))
      }
    })

    socket.addEventListener('message', (event) => {
      const data = event.data
      if (typeof data === 'string') {
        if (data.includes('Path:turn.end')) {
          if (chunks.length === 0) {
            clearTimeout(timer)
            reject(new Error('合成结束但没有收到音频数据（服务端可能拒绝了请求）。'))
          } else if (!done) {
            done = true
            finish()
          }
        }
        return
      }
      // 二进制帧：2 字节大端头长 + 头文本 + 音频数据
      const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data as ArrayBuffer)
      if (buffer.length > 2) {
        const headerLength = buffer.readUInt16BE(0)
        if (buffer.length > 2 + headerLength) {
          chunks.push(buffer.subarray(2 + headerLength))
        }
      }
    })

    socket.addEventListener('error', () => {
      clearTimeout(timer)
      reject(new Error('edge-tts WebSocket 连接失败。若网络需要特殊代理（梯子），请在 cordis.patch.yml 配置 proxyUrl 后重启。'))
    })

    socket.addEventListener('close', () => {
      if (!done) {
        clearTimeout(timer)
        if (chunks.length > 0) {
          done = true
          finish()
        } else {
          reject(new Error('edge-tts 连接在收到音频前关闭。'))
        }
      }
    })
  })

  const audio = Buffer.concat(chunks)
  if (audio.length === 0) throw new Error('合成结果为空。')
  return audio
}
