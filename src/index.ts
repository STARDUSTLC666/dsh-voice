import { registerUpdates } from '@stardustlc/dsh-updates'
/**
 * dsh-voice —— 语音双件套工具插件（node 半身，配置走 cordis.patch.yml）。
 *
 * 插件导出 apply(ctx, config)：注册五个面向模型的工具（voice_tts / voice_stt /
 * voice_list / voice_preview / voice_health）。TTS 走 edge-tts 协议（原生 WebSocket，
 * 零 API 成本）；STT 走 OpenAI 兼容 ASR 接口（Groq/OpenAI/自定义端点）。
 *
 * @module dsh-voice
 */

import { resolveConfig, type VoiceConfig } from './config.js'
import { Config as VoiceConfigSchema, liveConfig } from './host-config.js'
import { buildVoiceTools, type VoiceToolDefinition } from './tools.js'
import { installVoiceStudioWeb } from './web.js'

/** cordis 服务注入：apply 里要用 ctx.tools，必须显式声明。 */
export const Config = VoiceConfigSchema
export const name = 'voice'
export const inject = ['tools']

/** 插件所需的最小 ctx 面。 */
export interface VoicePluginContext {
  logger?: { warn?(message: string, ...args: unknown[]): void }
  tools: { register(definition: VoiceToolDefinition): () => void }
  inject?: Function
  effect?(effect: () => () => void, label?: string): unknown
  on?(event: string, listener: () => void): () => void
}

/**
 * 插件入口：解析配置、注册五个语音工具并挂载 Voice Studio Web 路由。
 */
export function apply(ctx: VoicePluginContext, config?: VoiceConfig | null): void {
  registerUpdates(ctx, { name: "dsh-voice" })

  const warn = (message: string) => {
    if (typeof ctx.logger?.warn === 'function') ctx.logger.warn(message)
    else console.warn(message)
  }

  const live = liveConfig((config ?? {}) as VoiceConfig)
  const readCfg = () => {
    try {
      return resolveConfig(live, (msg) => warn('[dsh-voice] ' + msg))
    } catch (error) {
      warn('[dsh-voice] ' + (error instanceof Error ? error.message : String(error)))
      return resolveConfig(null, (msg) => warn('[dsh-voice] ' + msg))
    }
  }
  // 启动期跑一次校验，触发必要的告警但绝不阻断注册。
  readCfg()

  const disposers: Array<() => void> = []
  for (const definition of buildVoiceTools(readCfg)) {
    disposers.push(ctx.tools.register(definition))
  }
  installVoiceStudioWeb(ctx as any, readCfg)
  const teardown = () => {
    for (const dispose of disposers) dispose()
  }
  if (typeof ctx.effect === 'function') {
    ctx.effect(() => teardown, 'voice.tools()')
  } else if (typeof ctx.on === 'function') {
    ctx.on('dispose', teardown)
  }
}

export * from './config.js'
export { liveConfig, createVolatile, HostValidationError, type HostSchemaNode, type HostSchemaMeta, type VolatileRef } from './host-config.js'
export * from './edge-tts.js'
export * from './openai-tts.js'
export * from './paths.js'
export * from './proxy-fetch.js'
export * from './stt.js'
export * from './tools.js'
export * from './tts-text.js'
export * from './voices.js'
export * from './web.js'
