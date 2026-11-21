/**
 * Wish-Driven（“许愿式”）核心纯函数库：
 * - 场景配方（VOICE_SCENES / resolveScenePreset）
 * - 场景/风格试听推荐（curatePreviewVoicesForScene）
 * - 自然语言模糊音色与人设解析（resolveVoiceWish）
 * - 保守的词边界安全默认技术发音词典（DEFAULT_TECH_PRONUNCIATIONS / mergePronunciations）
 * - 零依赖自包含 HTML5 交互播放器渲染（renderInteractivePlayerHtml，严格 XSS 转义）
 *
 * @module dsh-voice/wish
 */
import { type CustomVoiceAlias, type PronunciationRule } from './config.js';
import type { SubtitleCue } from './edge-tts.js';
import type { AudioChapter, SubtitleGranularity } from './tts-text.js';
import { type VoicePersona } from './voices.js';
/** 支持的 6 大高频语音创作场景 ID。 */
export type VoiceSceneId = 'podcast' | 'short-video' | 'audiobook' | 'briefing' | 'story' | 'dubbing';
/** 单个语音创作场景的默认配方。 */
export interface VoiceScenePreset {
    readonly id: VoiceSceneId;
    readonly label: string;
    readonly description: string;
    readonly defaultPersona: string;
    readonly defaultSubtitleGranularity?: SubtitleGranularity;
    readonly defaultMaxCharsPerCue?: number;
    readonly defaultNormalizeLoudness?: boolean;
    readonly defaultBgmDucking?: boolean;
    readonly defaultCleanMarkdown?: boolean;
    readonly defaultOutputBase: string;
    readonly previewTargets: readonly string[];
    readonly aliases: readonly string[];
}
/** 6 大高频创作场景预设（所有 previewTargets 均指向内置已验证音色或角色人设）。 */
export declare const VOICE_SCENES: Readonly<Record<VoiceSceneId, VoiceScenePreset>>;
/**
 * 解析场景预设（支持英文场景 ID 与常见中英文别名，如 `'播客'`、`'短视频'`、`'口播'`、`'有声书'`、`'早报'`、`'故事'`、`'配音'`）。
 * 无法识别时返回 `undefined`。
 */
export declare function resolveScenePreset(scene: string | undefined): VoiceScenePreset | undefined;
/**
 * 按场景或风格关键词精选 3–4 个对比鲜明且经 Edge 实时验证可用的试听音色/人设 ID。
 * 所有返回 ID 均保证存在于 `VOICES` 或 `VOICE_PERSONAS`。
 */
export declare function curatePreviewVoicesForScene(sceneOrStyle?: string): string[];
/** 音色心愿解析命中的目标类别。 */
export type VoiceWishKind = 'custom' | 'persona' | 'voice';
/** 音色心愿解析结果。 */
export interface ResolvedVoiceWish {
    kind: VoiceWishKind;
    id: string;
    persona?: VoicePersona;
    custom?: CustomVoiceAlias;
    voice?: string;
    matchedBy: string;
}
/**
 * 解析用户的音色/人设“心愿”表达：
 * 优先级：(a) 自定义音色别名 -> (b) 精确内置人设 -> (c) 合法 Edge 音色 ID -> (d) 模糊中英文风格/人设词 -> (e) 方言/语种回退。
 * 无法识别的无效字符串返回 `undefined`。
 */
export declare function resolveVoiceWish(query: string, customVoices?: readonly CustomVoiceAlias[]): ResolvedVoiceWish | undefined;
/**
 * 保守、词边界安全的默认技术术语发音词典（用于自动修正科技/开发播客与口播的常见误读）。
 * 全部词条均为纯 ASCII 标识符，在 `buildPronunciationPattern` 下自动包裹词边界，绝不误伤普通英文单词内部子串。
 */
export declare const DEFAULT_TECH_PRONUNCIATIONS: readonly PronunciationRule[];
/**
 * 合并多组发音词典，后传入的规则按 `word`（去空白精确匹配）覆盖先前的同名规则。
 */
export declare function mergePronunciations(...ruleSets: Array<readonly PronunciationRule[] | undefined>): PronunciationRule[];
/** 交互式 HTML5 音频播放器页面渲染选项。 */
export interface InteractivePlayerOptions {
    title: string;
    audioFileName: string;
    voice?: string;
    durationSec?: number;
    cues?: readonly SubtitleCue[];
    chapters?: readonly AudioChapter[];
}
/**
 * 生成零依赖、自包含、支持明暗主题、倍速播放、下载、章节跳转与跟读同步字幕高亮的 HTML5 交互播放器页面。
 * 严格对所有 HTML 文本/属性与内联 `<script>` JSON 执行 XSS 防护转义。
 */
export declare function renderInteractivePlayerHtml(opts: InteractivePlayerOptions): string;
