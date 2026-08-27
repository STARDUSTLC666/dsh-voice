/**
 * dsh-voice —— 语音双件套工具插件（node 半身，配置走 cordis.patch.yml）。
 *
 * 插件导出 apply(ctx, config)：注册三个面向模型的工具（voice_tts / voice_stt /
 * voice_list）。TTS 走 edge-tts 协议（原生 WebSocket，零 API 成本）；STT 走 OpenAI
 * 兼容 ASR 接口（Groq/OpenAI/自定义端点）。
 *
 * @module dsh-voice
 */
import { type VoiceConfig } from './config.js';
import { type VoiceToolDefinition } from './tools.js';
/** cordis 服务注入：apply 里要用 ctx.tools，必须显式声明。 */
export declare const name = "voice";
export declare const inject: string[];
/** 插件所需的最小 ctx 面。 */
export interface VoicePluginContext {
    tools: {
        register(definition: VoiceToolDefinition): () => void;
    };
    on?(event: string, listener: () => void): () => void;
}
/**
 * 插件入口：解析配置并注册三个语音工具。
 */
export declare function apply(ctx: VoicePluginContext, config?: VoiceConfig | null): void;
export * from './config.js';
export * from './edge-tts.js';
export * from './paths.js';
export * from './proxy-fetch.js';
export * from './stt.js';
export * from './tools.js';
export * from './voices.js';
