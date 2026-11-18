/** 时间戳分段结构（verbose_json 返回）。 */
export interface SttSegment {
    id: number;
    start: number;
    end: number;
    text: string;
}
/** 转写选项。 */
export interface SttOptions {
    audio: Buffer | Blob;
    filename: string;
    model: string;
    language?: string;
    prompt?: string;
    timestamps?: boolean;
    allowEmptyApiKey?: boolean;
    /** 取消信号（可选）；也可通过 transcribe 第 6 个参数传入。 */
    signal?: AbortSignal;
}
/** 转写结果。 */
export interface SttResult {
    text: string;
    model: string;
    language?: string;
    duration?: number;
    segments?: SttSegment[];
}
/** 预处理后的单个音频切片。 */
export interface PreparedAudioChunk {
    audio: Blob | Buffer;
    filename: string;
    offsetSeconds: number;
}
/** 超限音频预处理结果（含临时目录清理回调）。 */
export interface OversizeAudioPreparation {
    chunks: PreparedAudioChunk[];
    cleanup: () => void;
}
/** 字节数超过 25MB 时抛错：调用方可在读文件前先按 statSync 大小快速拒绝，避免白读整文件。 */
export declare function assertAudioSize(bytes: number): void;
/** 传给 transcribe 的 fetch：可以像代理那样一并带上自己的 FormData/Blob 构造器。 */
export type SttFetch = typeof fetch & {
    FormData?: typeof FormData;
};
/**
 * 调用 OpenAI 兼容 ASR 接口转写音频。
 * @throws 缺密钥 / 文件过大 / HTTP 错误 / 无文本时抛中文错误。
 */
export declare function transcribe(baseUrl: string, apiKey: string, options: SttOptions, fetchImpl?: SttFetch, timeoutMs?: number, signal?: AbortSignal): Promise<SttResult>;
/** 将 ASR 返回的 segments 格式化为 SRT 或 WebVTT 字幕文本。 */
export declare function formatSttSubtitles(segments: SttSegment[], format: 'srt' | 'vtt'): string;
/** 检测环境 PATH 中是否可用 ffmpeg。 */
export declare function hasFfmpeg(env?: NodeJS.ProcessEnv): boolean;
/**
 * 使用 ffmpeg 将大于 25MB 的音频转码为 16kHz 单声道 32kbps MP3；
 * 若转码后仍超过 24MB，则按每段 20 分钟（1200 秒）无损切分。
 */
export declare function prepareAudioForAsr(audioPath: string, signal?: AbortSignal): Promise<OversizeAudioPreparation>;
