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
 * 拼接多段 MP3：保留首段完整头部，后续段剥离 ID3v2 后拼接。
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
/**
 * 解析 SRT 或 WebVTT 字幕文件为按开始时间排序的 SubtitleCue 数组（1-based 索引）。
 */
export declare function parseSubtitleFile(content: string): SubtitleCue[];
/**
 * 将基础语速百分比（如 `+10%`）乘以缩放因子并钳制在 `[0.7, 1.85]`（`-30%` 至 `+85%`），返回 `'+25%'` / `'-10%'` 格式。
 */
export declare function scaleRatePercent(baseRate: string, factor: number): string;
/**
 * 纯文本单遍发音词典替换（用于不支持 SSML `<sub alias>` 的 OpenAI / SiliconFlow 引擎）。
 * 按原词长度降序构造单次正则同步替换，保证替读结果不会递归触发其它规则。
 */
export declare function applyPronunciationsPlain(text: string, rules: ReadonlyArray<{
    word: string;
    alias: string;
}>): string;
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
