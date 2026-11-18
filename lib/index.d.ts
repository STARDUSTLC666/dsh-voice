import { type VoiceConfig } from './config.js';
import { type VoiceToolDefinition } from './tools.js';
/** cordis 服务注入：apply 里要用 ctx.tools，必须显式声明。 */
export declare const Config: import("./host-config.js").HostSchemaNode<VoiceConfig>;
export declare const name = "voice";
export declare const inject: string[];
/** 随包分发的技能目录绝对路径。 */
export declare function bundledSkillsDir(): string;
/** 解析 SKILL.md 的 YAML frontmatter（零外部依赖）。 */
export declare function parseSkillFile(text: string): {
    name: string;
    description: string;
    content: string;
};
/** 插件所需的最小 ctx 面。 */
export interface VoicePluginContext {
    logger?: {
        warn?(message: string, ...args: unknown[]): void;
    };
    tools: {
        register(definition: VoiceToolDefinition): () => void;
    };
    inject?: Function;
    effect?(effect: () => () => void, label?: string): unknown;
    on?(event: string, listener: () => void): () => void;
}
/**
 * 插件入口：解析配置、注册五个语音工具、按需注入运行时工作流技能并挂载 Voice Studio Web 路由。
 */
export declare function apply(ctx: VoicePluginContext, config?: VoiceConfig | null): void;
export * from './config.js';
export { liveConfig, createVolatile, HostValidationError, type HostSchemaNode, type HostSchemaMeta, type VolatileRef } from './host-config.js';
export * from './edge-tts.js';
export * from './openai-tts.js';
export * from './paths.js';
export * from './proxy-fetch.js';
export * from './stt.js';
export * from './tools.js';
export * from './tts-text.js';
export * from './voices.js';
export * from './web.js';
