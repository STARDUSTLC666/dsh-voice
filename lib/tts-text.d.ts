/**
 * TTS 文本预处理、长文智能分段、MP3 帧拼接/静音生成、字幕格式化与试听卡片 HTML 渲染。
 *
 * @module dsh-voice/tts-text
 */
import type { SubtitleCue } from './edge-tts.js';
/**
 * 清洗 Markdown 为适合语音朗读的纯文本：
 * 移除代码块、链接地址、裸 URL、标题/引用/强调标记与 HTML 标签，保留句末标点与段落结构。
 */
export declare function cleanMarkdownForSpeech(text: string): string;
/**
 * 按段落 → 句子 → 子句 → 空白 → 硬切分五级回退策略将长文本切分为不超过 maxChars 的非空段。
 */
export declare function splitTextIntoChunks(text: string, maxChars?: number): string[];
/**
 * 若 MP3 缓冲以 ID3v2 标签头开头，剥离其标签头（及可选 footer），避免多段拼接后在流中残留 ID3 头。
 */
export declare function stripId3v2(mp3: Buffer): Buffer;
/**
 * 生成合法的 MPEG-2 Layer III（24kHz 48kbps 单声道）静音 MP3 帧，每帧 144 字节 / 24ms。
 */
export declare function createSilenceMp3(durationMs: number): Buffer;
/**
 * 拼接多段 MP3：保留首段完整头部，后续段剥离 ID3v2 后拼接。
 */
export declare function concatMp3Buffers(buffers: Buffer[]): Buffer;
/**
 * 按 48kbps（6 字节/毫秒）估算 MP3 音频时长（毫秒）。
 */
export declare function estimateMp3DurationMs(mp3: Buffer): number;
/**
 * 平移字幕时间轴并从 startIndex 起重新编号。
 */
export declare function offsetCues(cues: SubtitleCue[], offsetMs: number, startIndex?: number): SubtitleCue[];
/**
 * 将字幕条目格式化为 SRT 或 WebVTT 文本。
 */
export declare function formatSubtitles(cues: SubtitleCue[], format: 'srt' | 'vtt'): string;
/**
 * 生成自包含、支持明暗主题与倍速播放的 HTML5 音色试听卡片页面。
 */
export declare function renderPreviewHtml(samples: Array<{
    voice: string;
    fileName: string;
    locale?: string;
    gender?: string;
}>, text: string): string;
