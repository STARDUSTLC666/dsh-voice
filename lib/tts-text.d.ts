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
/** MP3 音频元信息（由帧头 / Xing / Info / VBRI 解析得出）。 */
export interface Mp3AudioInfo {
    durationMs: number;
    sampleRate: number;
    channels: 1 | 2;
    bitrateKbps: number;
    isVbr: boolean;
    frameCount: number;
}
/**
 * 精确解析 MP3 缓冲的采样率、声道、比特率、帧数与时长；
 * 支持 ID3v2 / ID3v1 剥离、Xing / Info / VBRI VBR 头与逐帧扫描；
 * 对非真实 MP3 帧的测试占位缓冲按 48kbps 估算兜底。
 */
export declare function inspectMp3Buffer(mp3: Buffer): Mp3AudioInfo;
/**
 * 生成匹配目标采样率的合法单声道静音 MP3 帧（默认 24000Hz MPEG-2 48kbps 144B/24ms）。
 */
export declare function createSilenceMp3(durationMs: number, sampleRate?: number): Buffer;
/**
 * 剥离单段 MP3 的首尾 ID3 标签以及首帧 Xing / Info / VBRI 元数据空帧，
 * 避免多段 VBR MP3 拼接后播放器或时长解析器被首段的帧数头锁死。
 */
export declare function stripMp3MetadataFrame(mp3: Buffer): Buffer;
/**
 * 拼接多段 MP3：单段原样返回；多段拼接时剥离各段的 Xing/Info/VBRI 元数据帧及非首段 ID3 标签。
 */
export declare function concatMp3Buffers(buffers: Buffer[]): Buffer;
/**
 * 精确计算 MP3 音频时长（毫秒）；非真实 MP3 帧的占位缓冲回退按 48kbps 估算。
 */
export declare function estimateMp3DurationMs(mp3: Buffer): number;
/**
 * 平移字幕时间轴并从 startIndex 起重新编号。
 */
export declare function offsetCues(cues: SubtitleCue[], offsetMs: number, startIndex?: number): SubtitleCue[];
/** 字幕切分粒度：整句、短视频紧凑短句或逐词。 */
export type SubtitleGranularity = 'sentence' | 'clause' | 'word';
/**
 * 将词级时间轴按目标粒度重组：
 * - `'word'`：逐词编号返回；
 * - `'sentence'`：保持原条目重新编号；
 * - `'clause'`：按显示字重上限（CJK 计 1，ASCII 计 0.5）、停顿间隙（>=350ms）与子句标点智能聚合成紧凑短句。
 */
export declare function groupWordCues(wordCues: readonly SubtitleCue[], granularity: SubtitleGranularity, maxCharsPerCue?: number): SubtitleCue[];
/**
 * 将字幕格式化为 SubStation Alpha (`v4.00+` `.ass`) 文本；
 * 若同时提供词级时间轴 `wordCues`，自动生成带 `{\kf<cs>}` 逐词高亮标签的卡拉 OK 字幕。
 */
export declare function formatAssSubtitles(cues: readonly SubtitleCue[], wordCues?: readonly SubtitleCue[]): string;
/**
 * 将字幕条目格式化为 SRT、WebVTT 或 ASS（支持卡拉 OK 词级高亮）文本。
 */
export declare function formatSubtitles(cues: readonly SubtitleCue[], format: 'srt' | 'vtt' | 'ass', wordCues?: readonly SubtitleCue[]): string;
/**
 * 生成自包含、支持明暗主题与倍速播放的 HTML5 音色试听卡片页面。
 */
export declare function renderPreviewHtml(samples: Array<{
    voice: string;
    fileName: string;
    locale?: string;
    gender?: string;
}>, text: string): string;
/**
 * 解析 SRT 或 WebVTT 字幕文件为按开始时间排序的 SubtitleCue 数组（1-based 索引）。
 */
export declare function parseSubtitleFile(content: string): SubtitleCue[];
/**
 * 将基础语速百分比（如 `+10%`）乘以缩放因子并钳制在 `[0.7, 1.85]`（`-30%` 至 `+85%`），返回 `'+25%'` / `'-10%'` 格式。
 */
export declare function scaleRatePercent(baseRate: string, factor: number): string;
/**
 * 构造词边界安全的发音词典全局正则：
 * - 按词长降序去重排序，避免短词抢先截断长词；
 * - 纯 ASCII 单词/缩写（`OS` / `UI` / `SQL` / `Nginx`）自动包裹 `(?<![A-Za-z0-9_])...(?![A-Za-z0-9_])`，
 *   使其匹配独立单词与中英混排（如 `"Mac OS"`、`"OS系统"`），但绝不误伤 `"POST"` / `"BUILD"` 等单词内部子串。
 */
export declare function buildPronunciationPattern(words: readonly string[]): RegExp | null;
/**
 * 纯文本单遍发音词典替换（用于不支持 SSML `<sub alias>` 的 OpenAI / SiliconFlow 引擎）。
 * 按原词长度降序构造单次正则同步替换，保证替读结果不会递归触发其它规则且保护 ASCII 词边界。
 */
export declare function applyPronunciationsPlain(text: string, rules: ReadonlyArray<{
    word: string;
    alias: string;
}>): string;
/** 行内停顿切分片段：朗读文本块或毫秒级停顿块。 */
export type SpeechPiece = {
    kind: 'text';
    text: string;
} | {
    kind: 'pause';
    durationMs: number;
};
/**
 * 解析并切分行内停顿标签（如 `[pause:500ms]`、`[break:600ms]`、`[停顿0.6s]`），
 * 返回非空文本与停顿交替序列（自动合并相邻停顿并钳制在 50..10000ms）。
 */
export declare function splitInlinePauses(text: string): SpeechPiece[];
/**
 * 剥离行内停顿标签并折叠周围多余水平空白，生成干净的字幕展示文本。
 */
export declare function stripInlinePauses(text: string): string;
/**
 * 使用本地 ffmpeg `atempo` 滤镜对超窗 MP3 进行保调精准变速压缩，确保字幕时间窗零累积漂移。
 */
export declare function fitAudioToWindow(mp3: Buffer, targetMaxMs: number, signal?: AbortSignal): Promise<Buffer>;
/**
 * 使用本地 ffmpeg 对 MP3 音频执行播客级响度均衡（-16 LUFS / TP -1.5 dBTP / LRA 11）。
 * @throws 取消时抛出 signal.reason，ffmpeg 失败时抛中文错误。
 */
export declare function normalizeAudioLoudness(mp3: Buffer, signal?: AbortSignal): Promise<Buffer>;
/** 播客 BGM 混音与自动闪避选项。 */
export interface BgmMixOptions {
    bgmPath: string;
    bgmVolume?: number;
    ducking?: boolean;
    normalizeLoudness?: boolean;
}
/**
 * 使用本地 ffmpeg 将人声 MP3 与背景音乐混音：
 * 自动循环 BGM、按人声侧链压缩闪避（ducking）、在结尾 1.2s 平滑淡出（总长 > 3s），并可选联动响度均衡。
 */
export declare function mixAudioWithBgm(voiceMp3: Buffer, opts: BgmMixOptions, signal?: AbortSignal): Promise<Buffer>;
/** 音频章节时间轴条目（毫秒级）。 */
export interface AudioChapter {
    title: string;
    startMs: number;
    endMs: number;
}
/** Markdown 标题分节结果。 */
export interface MarkdownSection {
    title: string;
    text: string;
}
/**
 * 按一级至三级 Markdown 标题（`#` / `##` / `###`）提取有声书/播客章节：
 * 先剥离围栏代码块以避免将代码注释误判为标题；首标题前若有正文则归入 `导言` 章节。
 */
export declare function extractMarkdownSections(markdown: string, cleanMarkdown?: boolean): MarkdownSection[];
/**
 * 纯 TypeScript 零依赖向 MP3 写入原生 ID3v2.3 `CTOC` + `CHAP` 章节书签标签（兼容 Apple Podcasts / VLC / ffmpeg / 车载播放器）。
 */
export declare function embedMp3Chapters(mp3: Buffer, chapters: readonly AudioChapter[], meta?: {
    title?: string;
}): Buffer;
/**
 * 将章节时间轴格式化为播客 Show Notes / YouTube 时间戳文本（`MM:SS 标题` 或跨小时 `HH:MM:SS 标题`）。
 */
export declare function formatChaptersMarkdown(chapters: readonly AudioChapter[]): string;
