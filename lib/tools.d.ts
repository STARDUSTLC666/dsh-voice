import { type ResolvedVoiceConfig } from './config.js';
import { fetchEdgeVoices, synthesizeSpeech, synthesizeSpeechWithMetadata } from './edge-tts.js';
import { synthesizeOpenAiSpeech } from './openai-tts.js';
import { prepareAudioForAsr, splitStereoChannelsForDiarization, transcribe } from './stt.js';
import { fitAudioToWindow, mixAudioWithBgm, normalizeAudioLoudness } from './tts-text.js';
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
    isConcurrencySafe?(args?: unknown): boolean;
    execute(args: unknown, exec: unknown): Promise<unknown>;
    timeoutMs?: number;
}
/** 默认试听文本（中英混合，便于感知发音差异）。 */
export declare const DEFAULT_PREVIEW_TEXT = "\u4F60\u597D\uFF0C\u8FD9\u662F\u97F3\u8272\u8BD5\u542C\u3002Hello, this is a voice preview.";
/** 可注入依赖（测试用假实现与宿主 settings 写入绑定）。 */
export interface VoiceToolDeps {
    tts?: typeof synthesizeSpeech;
    ttsWithMeta?: typeof synthesizeSpeechWithMetadata;
    openaiTts?: typeof synthesizeOpenAiSpeech;
    stt?: typeof transcribe;
    prepareAudio?: typeof prepareAudioForAsr;
    fetchVoices?: typeof fetchEdgeVoices;
    normalizeAudio?: typeof normalizeAudioLoudness;
    mixBgm?: typeof mixAudioWithBgm;
    splitStereo?: typeof splitStereoChannelsForDiarization;
    fitWindow?: typeof fitAudioToWindow;
    hasFfmpeg?: () => boolean;
    updateSettings?: (patch: Record<string, unknown>) => Promise<void>;
    isSettingsWritable?: () => boolean;
}
/**
 * 构建六个语音工具定义（支持静态配置对象或活引用配置 getter）。
 */
export declare function buildVoiceTools(config: ResolvedVoiceConfig | (() => ResolvedVoiceConfig), deps?: VoiceToolDeps): VoiceToolDefinition[];
