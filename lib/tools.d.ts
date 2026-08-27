import { type ResolvedVoiceConfig } from './config.js';
import { synthesizeSpeech } from './edge-tts.js';
import { transcribe } from './stt.js';
/** 模型可见的内容块。 */
export interface ContentBlock {
    type: 'text';
    text: string;
}
/** 注册给 ctx.tools.register 的原始工具定义。 */
export interface VoiceToolDefinition {
    name: string;
    description: string;
    parameters: {
        type: 'object';
        properties: Record<string, unknown>;
        required?: string[];
    };
    output: {
        schema: Record<string, unknown>;
        render(args: unknown, value: unknown): ContentBlock[];
    };
    execute(args: unknown, exec: unknown): Promise<unknown>;
    timeoutMs?: number;
}
/** 默认试听文本（中英混合，便于感知发音差异）。 */
export declare const DEFAULT_PREVIEW_TEXT = "\u4F60\u597D\uFF0C\u8FD9\u662F\u97F3\u8272\u8BD5\u542C\u3002Hello, this is a voice preview.";
/** 可注入依赖（测试用假实现）。 */
export interface VoiceToolDeps {
    tts?: typeof synthesizeSpeech;
    stt?: typeof transcribe;
}
/**
 * 构建三个工具定义。
 */
export declare function buildVoiceTools(config: ResolvedVoiceConfig, deps?: VoiceToolDeps): VoiceToolDefinition[];
