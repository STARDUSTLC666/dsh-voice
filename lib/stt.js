/**
 * ASR 客户端：OpenAI 兼容 /audio/transcriptions multipart 上传、字幕导出与超限音频自动压缩分段。
 *
 * @module dsh-voice/stt
 */
import { execFile, spawnSync } from 'node:child_process';
import { mkdtempSync, openAsBlob, readdirSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { extname, join } from 'node:path';
import { isLoopbackBaseUrl } from './config.js';
const MAX_AUDIO_BYTES = 25 * 1024 * 1024;
const COMPRESSED_CHUNK_LIMIT_BYTES = 24 * 1024 * 1024;
const SEGMENT_DURATION_SECONDS = 1200;
/** 字节数超过 25MB 时抛错：调用方可在读文件前先按 statSync 大小快速拒绝，避免白读整文件。 */
export function assertAudioSize(bytes) {
    if (bytes > MAX_AUDIO_BYTES) {
        throw new Error('音频超过 25MB 上限（ASR 接口限制）。可传入 autoCompress=true 自动压缩分段，或先用 dsh-ffmpeg / ffmpeg 压缩。');
    }
}
/** 已取消则抛出取消原因；作为 await 前后的统一取消检查。 */
function throwIfAborted(signal) {
    if (signal?.aborted === true)
        throw signal.reason;
}
/** 让不认 signal 的 fetch 实现也能在外部取消时立即 reject。 */
function raceAbort(value, signal) {
    const promise = Promise.resolve(value);
    if (signal === undefined || typeof signal.addEventListener !== 'function')
        return promise;
    if (signal.aborted === true)
        return Promise.reject(signal.reason);
    return new Promise((resolvePromise, rejectPromise) => {
        const onAbort = () => rejectPromise(signal.reason);
        signal.addEventListener('abort', onAbort, { once: true });
        promise.then((settled) => { signal.removeEventListener('abort', onAbort); resolvePromise(settled); }, (error) => { signal.removeEventListener('abort', onAbort); rejectPromise(error); });
    });
}
/**
 * 调用 OpenAI 兼容 ASR 接口转写音频。
 * @throws 缺密钥 / 文件过大 / HTTP 错误 / 无文本时抛中文错误。
 */
export async function transcribe(baseUrl, apiKey, options, fetchImpl = globalThis.fetch, timeoutMs = 120000, signal) {
    const abortSignal = signal ?? options.signal;
    throwIfAborted(abortSignal);
    const allowEmptyKey = options.allowEmptyApiKey === true || isLoopbackBaseUrl(baseUrl);
    if (apiKey === '' && !allowEmptyKey) {
        throw new Error('未配置 ASR 密钥：可在 DSH「设置 → 插件 → 语音（dsh-voice）」直接填写 asrApiKey（保存即生效，无需重启），或设置环境变量 DSH_VOICE_ASR_KEY，或在 cordis.patch.yml 配置 asrApiKey。（注：文字转语音无需密钥即可直接使用。）');
    }
    if (baseUrl === '') {
        throw new Error('未配置 ASR 接口地址：asrEngine=custom 时必须在 DSH「设置 → 插件 → 语音」或 cordis.patch.yml 提供 asrBaseUrl（或切回 groq / openai / siliconflow 预设）。');
    }
    const byteLength = Buffer.isBuffer(options.audio) ? options.audio.length : options.audio.size;
    if (byteLength === 0)
        throw new Error('音频文件为空。');
    assertAudioSize(byteLength);
    // 代理 fetch（undici）只认它自己那份 FormData：喂 Node 全局 FormData 会被当成普通
    // 对象序列化成 "[object FormData]"（content-type: text/plain），所以优先用调用方 fetch
    // 附带的构造器。传入 Blob 时直接零拷贝追加。
    const FormDataImpl = fetchImpl.FormData ?? FormData;
    const form = new FormDataImpl();
    const mime = mimeOf(options.filename);
    const filePart = Buffer.isBuffer(options.audio)
        ? new Blob([options.audio], { type: mime })
        : options.audio;
    form.append('file', filePart, options.filename);
    form.append('model', options.model);
    if (options.language !== undefined && options.language !== '')
        form.append('language', options.language);
    if (options.prompt !== undefined && options.prompt !== '')
        form.append('prompt', options.prompt);
    if (options.timestamps === true || options.diarize === true)
        form.append('response_format', 'verbose_json');
    const headers = apiKey !== '' ? { authorization: 'Bearer ' + apiKey } : {};
    const timeoutSignal = AbortSignal.timeout(timeoutMs);
    const requestSignal = abortSignal === undefined ? timeoutSignal : AbortSignal.any([timeoutSignal, abortSignal]);
    let response;
    try {
        response = await raceAbort(fetchImpl(baseUrl + '/audio/transcriptions', {
            method: 'POST',
            // 音频只交给配置的端点；307/308 也不能把 multipart 转发到另一站。
            redirect: 'manual',
            headers,
            body: form,
            signal: requestSignal,
        }), requestSignal);
    }
    catch (error) {
        throwIfAborted(abortSignal);
        if (timeoutSignal.aborted)
            throw new Error('ASR 请求超时，请重试或缩短音频。');
        throw new Error('ASR 请求失败：' + (error instanceof Error ? error.message : String(error)) + '。若接口需要特殊代理（梯子），请在 DSH「设置 → 插件 → 语音」或 cordis.patch.yml 配置 proxyUrl（保存即生效）。');
    }
    if (response.status >= 300 && response.status < 400) {
        try {
            await raceAbort(response.body?.cancel(), requestSignal);
        }
        catch { /* 尽力释放响应，仍受请求超时限制。 */ }
        throwIfAborted(abortSignal);
        throw new Error('ASR 接口返回重定向（HTTP ' + response.status + '），未向跳转地址发送音频。请确认服务地址，并在 asrBaseUrl 中直接填写可信的最终接口地址。');
    }
    if (!response.ok) {
        let body;
        try {
            body = (await raceAbort(response.text(), requestSignal)).slice(0, 300);
        }
        catch (error) {
            throwIfAborted(abortSignal);
            if (timeoutSignal.aborted)
                throw new Error('ASR 响应读取超时，请重试或缩短音频。');
            throw error;
        }
        throw new Error('ASR 失败：HTTP ' + response.status + '。' + body);
    }
    let json;
    try {
        json = await raceAbort(response.json(), requestSignal);
    }
    catch {
        throwIfAborted(abortSignal);
        if (timeoutSignal.aborted)
            throw new Error('ASR 响应读取超时，请重试或缩短音频。');
        throw new Error('ASR 响应不是合法 JSON。');
    }
    if (typeof json !== 'object' || json === null || typeof json.text !== 'string') {
        throw new Error('ASR 响应缺少文本字段，请检查接口是否兼容 /audio/transcriptions。');
    }
    const rec = json;
    const text = rec.text;
    if (text.trim() === '')
        throw new Error('未识别到语音，请检查音频是否包含清晰的人声。');
    const language = typeof rec.language === 'string' && rec.language !== '' ? rec.language : undefined;
    const duration = typeof rec.duration === 'number' && Number.isFinite(rec.duration) ? rec.duration : undefined;
    let segments;
    if (Array.isArray(rec.segments)) {
        segments = rec.segments
            .filter((item) => typeof item === 'object' && item !== null)
            .map((item, idx) => {
            let speaker;
            if (typeof item.speaker === 'string' && item.speaker.trim() !== '') {
                speaker = item.speaker.trim();
            }
            else if (typeof item.speaker === 'number' && Number.isFinite(item.speaker)) {
                speaker = 'Speaker ' + String(item.speaker);
            }
            return {
                id: typeof item.id === 'number' && Number.isFinite(item.id) ? item.id : idx,
                start: typeof item.start === 'number' && Number.isFinite(item.start) ? item.start : 0,
                end: typeof item.end === 'number' && Number.isFinite(item.end) ? item.end : 0,
                text: typeof item.text === 'string' ? item.text.trim() : '',
                ...(speaker !== undefined ? { speaker } : {}),
            };
        });
        if (options.diarize === true && segments.length > 0 && segments.every((seg) => seg.speaker === undefined)) {
            let speakerTurn = 0;
            segments[0].speaker = '说话人 A';
            for (let i = 1; i < segments.length; i++) {
                if (segments[i].start - segments[i - 1].end >= 1.2) {
                    speakerTurn = 1 - speakerTurn;
                }
                segments[i].speaker = speakerTurn === 0 ? '说话人 A' : '说话人 B';
            }
        }
    }
    const speakerSet = new Set();
    for (const seg of segments ?? []) {
        if (typeof seg.speaker === 'string' && seg.speaker.trim() !== '') {
            speakerSet.add(seg.speaker.trim());
        }
    }
    const speakers = speakerSet.size > 0 ? Array.from(speakerSet) : undefined;
    return {
        text,
        model: options.model,
        ...(language !== undefined ? { language } : {}),
        ...(duration !== undefined ? { duration } : {}),
        ...(segments !== undefined ? { segments } : {}),
        ...(speakers !== undefined ? { speakers } : {}),
    };
}
function formatSubtitleTimestamp(seconds, decimalSep) {
    const safeSeconds = Number.isFinite(seconds) ? Math.max(0, seconds) : 0;
    const totalMs = Math.round(safeSeconds * 1000);
    const ms = totalMs % 1000;
    const totalSec = Math.floor(totalMs / 1000);
    const sec = totalSec % 60;
    const totalMin = Math.floor(totalSec / 60);
    const min = totalMin % 60;
    const hour = Math.floor(totalMin / 60);
    return `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}${decimalSep}${String(ms).padStart(3, '0')}`;
}
function formatSegmentText(seg) {
    const clean = seg.text.trim();
    const speaker = typeof seg.speaker === 'string' ? seg.speaker.trim() : '';
    return speaker !== '' ? `[${speaker}] ${clean}` : clean;
}
/** 将 ASR 返回的 segments 格式化为 SRT 或 WebVTT 字幕文本。 */
export function formatSttSubtitles(segments, format) {
    const valid = segments.filter((seg) => seg.text.trim() !== '');
    if (format === 'vtt') {
        if (valid.length === 0)
            return 'WEBVTT\n';
        const body = valid
            .map((seg) => `${formatSubtitleTimestamp(seg.start, '.')} --> ${formatSubtitleTimestamp(seg.end, '.')}\n${formatSegmentText(seg)}`)
            .join('\n\n');
        return `WEBVTT\n\n${body}\n`;
    }
    if (valid.length === 0)
        return '';
    return (valid
        .map((seg, idx) => `${idx + 1}\n${formatSubtitleTimestamp(seg.start, ',')} --> ${formatSubtitleTimestamp(seg.end, ',')}\n${formatSegmentText(seg)}`)
        .join('\n\n') + '\n');
}
function formatTranscriptTimestamp(seconds) {
    const safe = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0;
    const hours = Math.floor(safe / 3600);
    const minutes = Math.floor((safe % 3600) / 60);
    const secs = safe % 60;
    if (hours > 0) {
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}
/** 将带说话人标签的分段合并为按发言人分段的可读逐字稿（如 `[说话人 A 00:01] ...`）。 */
export function formatDiarizedTranscript(segments) {
    const valid = segments.filter((seg) => seg.text.trim() !== '');
    if (valid.length === 0)
        return '';
    const groups = [];
    for (const seg of valid) {
        const speaker = typeof seg.speaker === 'string' && seg.speaker.trim() !== ''
            ? seg.speaker.trim()
            : '说话人';
        const part = seg.text.trim();
        const last = groups[groups.length - 1];
        if (last && last.speaker === speaker) {
            const needsSpace = !/[\u4e00-\u9fff\u3000-\u303f\uff00-\uffef]$/.test(last.text)
                || !/^[\u4e00-\u9fff]/.test(part);
            last.text += (needsSpace ? ' ' : '') + part;
        }
        else {
            groups.push({ speaker, start: seg.start, text: part });
        }
    }
    return groups
        .map((group) => `[${group.speaker} ${formatTranscriptTimestamp(group.start)}] ${group.text}`)
        .join('\n\n');
}
/** 检测环境 PATH 中是否可用 ffmpeg。 */
export function hasFfmpeg(env = process.env) {
    try {
        return spawnSync('ffmpeg', ['-version'], { env, stdio: 'ignore', timeout: 3000 }).status === 0;
    }
    catch {
        return false;
    }
}
function runFfmpeg(args, signal) {
    throwIfAborted(signal);
    return new Promise((resolve, reject) => {
        execFile('ffmpeg', args, { signal, maxBuffer: 4 * 1024 * 1024 }, (error, _stdout, stderr) => {
            if (signal?.aborted) {
                reject(signal.reason);
                return;
            }
            if (error) {
                const detail = typeof stderr === 'string' && stderr.trim() !== ''
                    ? stderr.trim().slice(-300)
                    : error.message;
                reject(new Error('ffmpeg 音频压缩/分段失败：' + detail));
                return;
            }
            resolve();
        });
    });
}
/**
 * 使用 ffmpeg 将大于 25MB 的音频转码为 16kHz 单声道 32kbps MP3；
 * 若转码后仍超过 24MB，则按每段 20 分钟（1200 秒）无损切分。
 */
export async function prepareAudioForAsr(audioPath, signal) {
    throwIfAborted(signal);
    const tempDir = mkdtempSync(join(tmpdir(), 'dsh-voice-asr-'));
    const cleanup = () => {
        try {
            rmSync(tempDir, { recursive: true, force: true });
        }
        catch {
            // 尽力清理临时目录
        }
    };
    try {
        const compressedPath = join(tempDir, 'compressed.mp3');
        await runFfmpeg(['-y', '-i', audioPath, '-vn', '-ac', '1', '-ar', '16000', '-b:a', '32k', compressedPath], signal);
        throwIfAborted(signal);
        const compressedSize = statSync(compressedPath).size;
        if (compressedSize <= COMPRESSED_CHUNK_LIMIT_BYTES) {
            const blob = await openAsBlob(compressedPath, { type: 'audio/mpeg' });
            return {
                chunks: [{ audio: blob, filename: 'compressed.mp3', offsetSeconds: 0 }],
                cleanup,
            };
        }
        const segmentPattern = join(tempDir, 'part_%03d.mp3');
        await runFfmpeg(['-y', '-i', compressedPath, '-f', 'segment', '-segment_time', String(SEGMENT_DURATION_SECONDS), '-c', 'copy', segmentPattern], signal);
        throwIfAborted(signal);
        const partNames = readdirSync(tempDir)
            .filter((name) => /^part_\d+\.mp3$/.test(name))
            .sort();
        if (partNames.length === 0) {
            throw new Error('ffmpeg 分段后未生成任何音频切片。');
        }
        const chunks = [];
        for (let idx = 0; idx < partNames.length; idx++) {
            const name = partNames[idx];
            const blob = await openAsBlob(join(tempDir, name), { type: 'audio/mpeg' });
            chunks.push({
                audio: blob,
                filename: name,
                offsetSeconds: idx * SEGMENT_DURATION_SECONDS,
            });
        }
        return { chunks, cleanup };
    }
    catch (error) {
        cleanup();
        throw error;
    }
}
async function probeAudioChannels(audioPath, signal) {
    throwIfAborted(signal);
    const viaFfprobe = await new Promise((resolve) => {
        execFile('ffprobe', ['-v', 'error', '-select_streams', 'a:0', '-show_entries', 'stream=channels', '-of', 'csv=p=0', audioPath], { signal, maxBuffer: 1024 * 1024 }, (error, stdout) => {
            if (error) {
                resolve(null);
                return;
            }
            const parsed = Number.parseInt(String(stdout).trim(), 10);
            resolve(Number.isFinite(parsed) && parsed > 0 ? parsed : null);
        });
    });
    throwIfAborted(signal);
    if (viaFfprobe !== null)
        return viaFfprobe;
    return await new Promise((resolve) => {
        execFile('ffmpeg', ['-i', audioPath], { signal, maxBuffer: 2 * 1024 * 1024 }, (_error, _stdout, stderr) => {
            const text = typeof stderr === 'string' ? stderr : '';
            const audioLine = text.split(/\r?\n/).find((line) => /\bAudio:\b/.test(line)) ?? '';
            if (/\b(?:stereo|quad|5\.1|7\.1)\b/i.test(audioLine) || /\b2 channels\b/i.test(audioLine)) {
                resolve(2);
                return;
            }
            const chMatch = /\b(\d+)\s+channels?\b/i.exec(audioLine);
            if (chMatch) {
                resolve(Number.parseInt(chMatch[1], 10) || 1);
                return;
            }
            resolve(1);
        });
    });
}
/**
 * 探测音频是否包含 >= 2 声道；若为立体声/多声道，拆分为左右声道（16kHz 32kbps 单声道 MP3）用于精准分轨说话人分离。
 * 若非立体声或 ffmpeg 不可用/失败，返回 null。
 */
export async function splitStereoChannelsForDiarization(audioPath, signal) {
    throwIfAborted(signal);
    let channels = 1;
    try {
        channels = await probeAudioChannels(audioPath, signal);
    }
    catch {
        throwIfAborted(signal);
        return null;
    }
    throwIfAborted(signal);
    if (channels < 2)
        return null;
    const tempDir = mkdtempSync(join(tmpdir(), 'dsh-voice-stereo-'));
    const cleanup = () => {
        try {
            rmSync(tempDir, { recursive: true, force: true });
        }
        catch {
            // 尽力清理临时目录
        }
    };
    try {
        const leftPath = join(tempDir, 'channel_left.mp3');
        const rightPath = join(tempDir, 'channel_right.mp3');
        await runFfmpeg(['-y', '-i', audioPath, '-vn', '-af', 'pan=mono|c0=c0', '-ar', '16000', '-ac', '1', '-b:a', '32k', leftPath], signal);
        await runFfmpeg(['-y', '-i', audioPath, '-vn', '-af', 'pan=mono|c0=c1', '-ar', '16000', '-ac', '1', '-b:a', '32k', rightPath], signal);
        throwIfAborted(signal);
        const leftBlob = await openAsBlob(leftPath, { type: 'audio/mpeg' });
        const rightBlob = await openAsBlob(rightPath, { type: 'audio/mpeg' });
        return {
            channels: [
                { audio: leftBlob, filename: 'channel_left.mp3', speaker: '说话人 A' },
                { audio: rightBlob, filename: 'channel_right.mp3', speaker: '说话人 B' },
            ],
            cleanup,
        };
    }
    catch {
        cleanup();
        throwIfAborted(signal);
        return null;
    }
}
/** 常见音频扩展名 → MIME。 */
function mimeOf(filename) {
    const ext = extname(filename).toLowerCase();
    const table = {
        '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.m4a': 'audio/mp4', '.mp4': 'audio/mp4',
        '.ogg': 'audio/ogg', '.opus': 'audio/ogg', '.flac': 'audio/flac', '.webm': 'audio/webm',
    };
    return table[ext] ?? 'application/octet-stream';
}
