/**
 * 本地受鉴权 Voice Studio 后端路由：复用宿主 connection/webServer 载体，提供音色列表、即时试听、
 * 8 秒录音直出克隆角色、多角色对话合成、工作区成品库、麦克风转写与安全配置更新。
 * 绝不向前端返回 asrApiKey / ttsApiKey / proxyUrl 等敏感凭据原文。
 *
 * @module dsh-voice/web
 */
import type { IncomingMessage, ServerResponse } from 'node:http';
import { type AsrEngine, type CustomVoiceAlias, type ResolvedVoiceConfig, type TtsEngine } from './config.js';
import { fetchEdgeVoices, synthesizeSpeech, synthesizeSpeechWithMetadata } from './edge-tts.js';
import { synthesizeOpenAiSpeech } from './openai-tts.js';
import { transcribe } from './stt.js';
export declare const VOICE_STUDIO_SETTINGS_ROUTE = "/_dsh/dsh-voice/studio";
export declare const VOICE_STUDIO_API_ROUTE = "/api/dsh-voice/studio";
export declare class VoiceStudioError extends Error {
    readonly status: number;
    readonly code: string;
    constructor(message: string, status?: number, code?: string);
}
export interface StudioPronunciationRule {
    word: string;
    alias: string;
}
export interface VoiceStudioBackendOptions {
    updateSettings?: (patch: Record<string, unknown>) => Promise<void>;
    writable?: () => boolean;
    workspaceDir?: string | (() => string);
    tts?: typeof synthesizeSpeech;
    ttsWithMeta?: typeof synthesizeSpeechWithMetadata;
    openaiTts?: typeof synthesizeOpenAiSpeech;
    fetchVoices?: typeof fetchEdgeVoices;
    stt?: typeof transcribe;
}
export declare function createVoiceStudioBackend(readCfg: () => ResolvedVoiceConfig, options?: VoiceStudioBackendOptions): {
    snapshot: () => {
        ttsEngine: TtsEngine;
        ttsVoice: string;
        ttsRate: string;
        ttsPitch: string;
        ttsModel: string;
        hasTtsKey: boolean;
        asrEngine: AsrEngine;
        asrModel: string;
        hasAsrKey: boolean;
        hasProxy: boolean;
        overwrite: boolean;
        customVoices: CustomVoiceAlias[];
        pronunciations: StudioPronunciationRule[];
        voices: import("./voices.js").VoiceInfo[];
        personas: import("./voices.js").VoicePersona[];
        writable: boolean;
        hasFfmpeg: boolean;
        ttsReady: boolean;
        sttReady: boolean;
    };
    /** 仅由宿主已鉴权的 connection.fetch 路由调用。 */
    fetch(request: Request): Promise<Response>;
    handle(req: IncomingMessage, res: ServerResponse, transport?: symbol): Promise<void>;
};
export interface HostSettingsBinding {
    isWritable(): boolean;
    update(patch: Record<string, unknown>): Promise<void>;
}
/**
 * 可选注入宿主 `settings` 服务并按 cordis 条目 ID（默认 `'voice'`）绑定配置持久化写入与只读检查。
 * 不改变插件顶层 `export const inject = ['tools']` 声明；宿主无 settings 服务时优雅回退只读。
 */
export declare function bindHostSettings(ctx: {
    inject?: Function;
    fiber?: {
        entry?: {
            options?: {
                id?: string;
            };
        };
    };
}): HostSettingsBinding;
export declare function installVoiceStudioWeb(ctx: {
    inject?: Function;
    fiber?: {
        entry?: {
            options?: {
                id?: string;
            };
        };
    };
}, readCfg: () => ResolvedVoiceConfig, deps?: VoiceStudioBackendOptions): ReturnType<typeof createVoiceStudioBackend>;
