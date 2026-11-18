/**
 * 本地受鉴权 Voice Studio 后端路由：复用宿主 connection/webServer 载体，提供音色列表、即时试听、麦克风转写与安全配置更新。
 * 绝不向前端返回 asrApiKey / ttsApiKey / proxyUrl 等敏感凭据原文。
 *
 * @module dsh-voice/web
 */
import type { IncomingMessage, ServerResponse } from 'node:http';
import { type AsrEngine, type CustomVoiceAlias, type ResolvedVoiceConfig, type TtsEngine } from './config.js';
import { fetchEdgeVoices, synthesizeSpeech } from './edge-tts.js';
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
    tts?: typeof synthesizeSpeech;
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
