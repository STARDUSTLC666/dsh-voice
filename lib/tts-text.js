/**
 * TTS 文本预处理、长文智能分段、MP3 帧拼接/静音生成、字幕格式化与试听卡片 HTML 渲染。
 *
 * @module dsh-voice/tts-text
 */
import { execFile } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
/**
 * 清洗 Markdown 为适合语音朗读的纯文本：
 * 移除代码块、链接地址、裸 URL、标题/引用/强调标记与 HTML 标签，保留句末标点与段落结构。
 */
export function cleanMarkdownForSpeech(text) {
    let out = text.replace(/\r\n?/g, '\n');
    // 移除围栏代码块（``` 与 ~~~）
    out = out.replace(/```[\s\S]*?```/g, '');
    out = out.replace(/~~~[\s\S]*?~~~/g, '');
    // 行内代码保留内容，仅去反引号
    out = out.replace(/`([^`]+)`/g, '$1');
    // 图片与链接保留可读文本
    out = out.replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1');
    out = out.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1');
    // 裸 URL
    out = out.replace(/https?:\/\/\S+/g, '');
    // HTML 标签
    out = out.replace(/<[^>]+>/g, '');
    // 标题、引用、水平分割线、无序列表符号
    out = out.replace(/^#{1,6}\s+/gm, '');
    out = out.replace(/^>\s*/gm, '');
    out = out.replace(/^\s*(?:[-*_]\s*){3,}$/gm, '');
    out = out.replace(/^\s*[-*+]\s+/gm, '');
    // 粗体、斜体、删除线标记
    out = out.replace(/(\*\*|__|~~|\*)/g, '');
    // 折叠行内多余空白并规范段落空行
    out = out.replace(/[ \t]+/g, ' ');
    out = out.replace(/^[ \t]+|[ \t]+$/gm, '');
    out = out.replace(/\n{3,}/g, '\n\n');
    return out.trim();
}
function needsSpaceBetween(left, right) {
    return /[A-Za-z0-9.?!;,:]$/.test(left) && /^[A-Za-z0-9]/.test(right);
}
function splitAtLevel(unit, maxChars, level) {
    const trimmed = unit.trim();
    if (trimmed === '')
        return [];
    if (trimmed.length <= maxChars)
        return [trimmed];
    if (level >= 4) {
        const slices = [];
        for (let i = 0; i < trimmed.length; i += maxChars) {
            const part = trimmed.slice(i, i + maxChars).trim();
            if (part !== '')
                slices.push(part);
        }
        return slices;
    }
    const splitters = [
        /\n+/,
        /(?<=[。！？；.!?;])\s*/,
        /(?<=[，、,：:])\s*/,
        /\s+/,
    ];
    const rawParts = trimmed
        .split(splitters[level])
        .map((part) => part.trim())
        .filter((part) => part !== '');
    if (rawParts.length <= 1) {
        return splitAtLevel(trimmed, maxChars, level + 1);
    }
    const chunks = [];
    let current = '';
    for (const part of rawParts) {
        if (part.length > maxChars) {
            if (current !== '') {
                chunks.push(current);
                current = '';
            }
            chunks.push(...splitAtLevel(part, maxChars, level + 1));
            continue;
        }
        if (current === '') {
            current = part;
            continue;
        }
        const sep = level === 0 ? '\n\n' : level === 3 ? ' ' : (needsSpaceBetween(current, part) ? ' ' : '');
        if (current.length + sep.length + part.length <= maxChars) {
            current += sep + part;
        }
        else {
            chunks.push(current);
            current = part;
        }
    }
    if (current !== '')
        chunks.push(current);
    return chunks;
}
/**
 * 按段落 → 句子 → 子句 → 空白 → 硬切分五级回退策略将长文本切分为不超过 maxChars 的非空段。
 */
export function splitTextIntoChunks(text, maxChars = 2800) {
    const trimmed = text.trim();
    if (trimmed === '')
        return [];
    const limit = Math.max(1, Math.floor(maxChars));
    if (trimmed.length <= limit)
        return [trimmed];
    return splitAtLevel(trimmed, limit, 0);
}
/**
 * 若 MP3 缓冲以 ID3v2 标签头开头，剥离其标签头（及可选 footer），避免多段拼接后在流中残留 ID3 头。
 */
export function stripId3v2(mp3) {
    if (mp3.length < 10)
        return mp3;
    if (mp3[0] !== 0x49 || mp3[1] !== 0x44 || mp3[2] !== 0x33)
        return mp3; // 'ID3'
    if (mp3[3] === 0xff || mp3[4] === 0xff)
        return mp3;
    if ((mp3[6] & 0x80) !== 0 || (mp3[7] & 0x80) !== 0 || (mp3[8] & 0x80) !== 0 || (mp3[9] & 0x80) !== 0) {
        return mp3;
    }
    const tagSize = ((mp3[6] & 0x7f) << 21)
        | ((mp3[7] & 0x7f) << 14)
        | ((mp3[8] & 0x7f) << 7)
        | (mp3[9] & 0x7f);
    const footerSize = (mp3[5] & 0x10) !== 0 ? 10 : 0;
    const totalHeader = 10 + tagSize + footerSize;
    if (mp3.length < totalHeader)
        return mp3;
    return mp3.subarray(totalHeader);
}
const MPEG1_BITRATES = [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320];
const MPEG2_BITRATES = [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160];
const SAMPLE_RATES_BY_VERSION = {
    3: [44100, 48000, 32000], // MPEG-1
    2: [22050, 24000, 16000], // MPEG-2
    0: [11025, 12000, 8000], // MPEG-2.5
};
function parseMp3FrameHeader(buf, offset) {
    if (offset + 4 > buf.length)
        return null;
    if (buf[offset] !== 0xff || (buf[offset + 1] & 0xe0) !== 0xe0)
        return null;
    const b1 = buf[offset + 1];
    const b2 = buf[offset + 2];
    const b3 = buf[offset + 3];
    const versionBits = (b1 >> 3) & 3;
    if (versionBits === 1)
        return null; // reserved
    const layerBits = (b1 >> 1) & 3;
    if (layerBits !== 1)
        return null; // Layer III only
    const bitrateIdx = (b2 >> 4) & 0x0f;
    if (bitrateIdx === 0 || bitrateIdx === 15)
        return null;
    const sampleRateIdx = (b2 >> 2) & 3;
    if (sampleRateIdx === 3)
        return null;
    const isMpeg1 = versionBits === 3;
    const bitrateKbps = isMpeg1 ? MPEG1_BITRATES[bitrateIdx] : MPEG2_BITRATES[bitrateIdx];
    const sampleRate = SAMPLE_RATES_BY_VERSION[versionBits][sampleRateIdx];
    const padding = (b2 >> 1) & 1;
    const channelMode = (b3 >> 6) & 3;
    const channels = channelMode === 3 ? 1 : 2;
    const samplesPerFrame = isMpeg1 ? 1152 : 576;
    const frameSize = Math.floor(((isMpeg1 ? 144 : 72) * bitrateKbps * 1000) / sampleRate) + padding;
    if (frameSize < 4 || offset + frameSize > buf.length)
        return null;
    const sideInfoSize = isMpeg1 ? (channels === 1 ? 17 : 32) : (channels === 1 ? 9 : 17);
    return { versionBits, sampleRate, channels, bitrateKbps, samplesPerFrame, frameSize, sideInfoSize };
}
function stripId3v1(buf) {
    if (buf.length >= 128 && buf[buf.length - 128] === 0x54 && buf[buf.length - 127] === 0x41 && buf[buf.length - 126] === 0x47) {
        return buf.subarray(0, buf.length - 128);
    }
    return buf;
}
/**
 * 精确解析 MP3 缓冲的采样率、声道、比特率、帧数与时长；
 * 支持 ID3v2 / ID3v1 剥离、Xing / Info / VBRI VBR 头与逐帧扫描；
 * 对非真实 MP3 帧的测试占位缓冲按 48kbps 估算兜底。
 */
export function inspectMp3Buffer(mp3) {
    const afterId3v2 = stripId3v2(mp3);
    const data = stripId3v1(afterId3v2);
    let offset = 0;
    let frameCount = 0;
    let totalDurationMs = 0;
    let bitrateSum = 0;
    let firstSampleRate = 24000;
    let firstChannels = 1;
    let firstBitrate = 48;
    let isVbr = false;
    while (offset + 4 <= data.length) {
        // 跳过拼接流中可能残留的 ID3v2 标签头
        if (data[offset] === 0x49 && data[offset + 1] === 0x44 && data[offset + 2] === 0x33 && offset + 10 <= data.length) {
            const stripped = stripId3v2(data.subarray(offset));
            const skipped = data.length - offset - stripped.length;
            if (skipped > 0) {
                offset += skipped;
                continue;
            }
        }
        const header = parseMp3FrameHeader(data, offset);
        if (header === null) {
            offset += 1;
            continue;
        }
        if (frameCount === 0) {
            firstSampleRate = header.sampleRate;
            firstChannels = header.channels;
            firstBitrate = header.bitrateKbps;
            const xingOffset = offset + 4 + header.sideInfoSize;
            if (xingOffset + 12 <= offset + header.frameSize) {
                const tag = data.subarray(xingOffset, xingOffset + 4).toString('ascii');
                if (tag === 'Xing' || tag === 'Info') {
                    const flags = data.readUInt32BE(xingOffset + 4);
                    if ((flags & 0x01) !== 0 && xingOffset + 12 <= data.length) {
                        const totalFrames = data.readUInt32BE(xingOffset + 8);
                        if (totalFrames > 0) {
                            const durationMs = Math.round((totalFrames * header.samplesPerFrame * 1000) / header.sampleRate);
                            let avgBitrate = header.bitrateKbps;
                            if ((flags & 0x02) !== 0 && xingOffset + 16 <= data.length && durationMs > 0) {
                                const totalBytes = data.readUInt32BE(xingOffset + 12);
                                if (totalBytes > 0)
                                    avgBitrate = Math.round((totalBytes * 8) / durationMs);
                            }
                            return {
                                durationMs,
                                sampleRate: header.sampleRate,
                                channels: header.channels,
                                bitrateKbps: avgBitrate,
                                isVbr: tag === 'Xing',
                                frameCount: totalFrames,
                            };
                        }
                    }
                }
            }
            const vbriOffset = offset + 36;
            if (vbriOffset + 18 <= offset + header.frameSize && vbriOffset + 18 <= data.length) {
                const vbriTag = data.subarray(vbriOffset, vbriOffset + 4).toString('ascii');
                if (vbriTag === 'VBRI') {
                    const totalBytes = data.readUInt32BE(vbriOffset + 10);
                    const totalFrames = data.readUInt32BE(vbriOffset + 14);
                    if (totalFrames > 0) {
                        const durationMs = Math.round((totalFrames * header.samplesPerFrame * 1000) / header.sampleRate);
                        const avgBitrate = totalBytes > 0 && durationMs > 0
                            ? Math.round((totalBytes * 8) / durationMs)
                            : header.bitrateKbps;
                        return {
                            durationMs,
                            sampleRate: header.sampleRate,
                            channels: header.channels,
                            bitrateKbps: avgBitrate,
                            isVbr: true,
                            frameCount: totalFrames,
                        };
                    }
                }
            }
        }
        else if (header.bitrateKbps !== firstBitrate) {
            isVbr = true;
        }
        frameCount += 1;
        totalDurationMs += (header.samplesPerFrame * 1000) / header.sampleRate;
        bitrateSum += header.bitrateKbps;
        offset += header.frameSize;
    }
    if (frameCount === 0) {
        return {
            durationMs: Math.round((afterId3v2.length * 8) / 48),
            sampleRate: 24000,
            channels: 1,
            bitrateKbps: 48,
            isVbr: false,
            frameCount: 0,
        };
    }
    return {
        durationMs: Math.round(totalDurationMs),
        sampleRate: firstSampleRate,
        channels: firstChannels,
        bitrateKbps: Math.round(bitrateSum / frameCount),
        isVbr,
        frameCount,
    };
}
const SILENCE_SPECS = {
    24000: { header: [0xff, 0xf3, 0x64, 0xc0], frameSize: 144, frameDurationMs: (576 * 1000) / 24000 },
    22050: { header: [0xff, 0xf3, 0x60, 0xc0], frameSize: 156, frameDurationMs: (576 * 1000) / 22050 },
    16000: { header: [0xff, 0xf3, 0x68, 0xc0], frameSize: 216, frameDurationMs: (576 * 1000) / 16000 },
    44100: { header: [0xff, 0xfb, 0x50, 0xc0], frameSize: 208, frameDurationMs: (1152 * 1000) / 44100 },
    48000: { header: [0xff, 0xfb, 0x54, 0xc0], frameSize: 192, frameDurationMs: (1152 * 1000) / 48000 },
    32000: { header: [0xff, 0xfb, 0x58, 0xc0], frameSize: 288, frameDurationMs: (1152 * 1000) / 32000 },
};
/**
 * 生成匹配目标采样率的合法单声道静音 MP3 帧（默认 24000Hz MPEG-2 48kbps 144B/24ms）。
 */
export function createSilenceMp3(durationMs, sampleRate = 24000) {
    if (!Number.isFinite(durationMs) || durationMs <= 0)
        return Buffer.alloc(0);
    const spec = SILENCE_SPECS[sampleRate] ?? SILENCE_SPECS[24000];
    const frames = Math.max(1, Math.round(durationMs / spec.frameDurationMs));
    const out = Buffer.alloc(frames * spec.frameSize);
    for (let i = 0; i < frames; i++) {
        const offset = i * spec.frameSize;
        out[offset] = spec.header[0];
        out[offset + 1] = spec.header[1];
        out[offset + 2] = spec.header[2];
        out[offset + 3] = spec.header[3];
    }
    return out;
}
/**
 * 剥离单段 MP3 的首尾 ID3 标签以及首帧 Xing / Info / VBRI 元数据空帧，
 * 避免多段 VBR MP3 拼接后播放器或时长解析器被首段的帧数头锁死。
 */
export function stripMp3MetadataFrame(mp3) {
    let afterId3v2 = stripId3v2(mp3);
    while (afterId3v2.length < mp3.length) {
        const next = stripId3v2(afterId3v2);
        if (next.length === afterId3v2.length)
            break;
        afterId3v2 = next;
    }
    const data = stripId3v1(afterId3v2);
    let offset = 0;
    while (offset + 4 <= data.length) {
        const header = parseMp3FrameHeader(data, offset);
        if (header === null) {
            offset += 1;
            continue;
        }
        const xingOffset = offset + 4 + header.sideInfoSize;
        if (xingOffset + 4 <= offset + header.frameSize && xingOffset + 4 <= data.length) {
            const tag = data.subarray(xingOffset, xingOffset + 4).toString('ascii');
            if (tag === 'Xing' || tag === 'Info') {
                return data.subarray(offset + header.frameSize);
            }
        }
        const vbriOffset = offset + 36;
        if (vbriOffset + 4 <= offset + header.frameSize && vbriOffset + 4 <= data.length) {
            const vbriTag = data.subarray(vbriOffset, vbriOffset + 4).toString('ascii');
            if (vbriTag === 'VBRI') {
                return data.subarray(offset + header.frameSize);
            }
        }
        return data;
    }
    return data;
}
/**
 * 拼接多段 MP3：单段原样返回；多段拼接时剥离各段的 Xing/Info/VBRI 元数据帧及非首段 ID3 标签。
 */
export function concatMp3Buffers(buffers) {
    const nonEmpty = buffers.filter((buf) => buf.length > 0);
    if (nonEmpty.length === 0)
        return Buffer.alloc(0);
    if (nonEmpty.length === 1)
        return nonEmpty[0];
    const normalized = nonEmpty.map((buf, index) => {
        if (index === 0) {
            const afterId3 = stripId3v2(buf);
            if (afterId3.length < buf.length) {
                const id3Prefix = buf.subarray(0, buf.length - afterId3.length);
                return Buffer.concat([id3Prefix, stripMp3MetadataFrame(afterId3)]);
            }
        }
        return stripMp3MetadataFrame(buf);
    });
    return Buffer.concat(normalized);
}
/**
 * 精确计算 MP3 音频时长（毫秒）；非真实 MP3 帧的占位缓冲回退按 48kbps 估算。
 */
export function estimateMp3DurationMs(mp3) {
    return inspectMp3Buffer(mp3).durationMs;
}
/**
 * 平移字幕时间轴并从 startIndex 起重新编号。
 */
export function offsetCues(cues, offsetMs, startIndex = 1) {
    return cues.map((cue, idx) => ({
        index: startIndex + idx,
        startMs: cue.startMs + offsetMs,
        endMs: cue.endMs + offsetMs,
        text: cue.text,
    }));
}
function measureCueTextWeight(text) {
    let weight = 0;
    for (const ch of text) {
        if (/\s/.test(ch))
            continue;
        const cp = ch.codePointAt(0) ?? 0;
        weight += cp <= 0x00ff ? 0.5 : 1;
    }
    return weight;
}
/**
 * 将词级时间轴按目标粒度重组：
 * - `'word'`：逐词编号返回；
 * - `'sentence'`：保持原条目重新编号；
 * - `'clause'`：按显示字重上限（CJK 计 1，ASCII 计 0.5）、停顿间隙（>=350ms）与子句标点智能聚合成紧凑短句。
 */
export function groupWordCues(wordCues, granularity, maxCharsPerCue = 16) {
    if (!Array.isArray(wordCues) || wordCues.length === 0)
        return [];
    if (granularity === 'sentence') {
        return wordCues.map((cue, idx) => ({
            index: idx + 1,
            startMs: cue.startMs,
            endMs: cue.endMs,
            text: cue.text,
        }));
    }
    const nonEmpty = wordCues.filter((cue) => typeof cue.text === 'string' && cue.text.trim() !== '');
    if (nonEmpty.length === 0)
        return [];
    if (granularity === 'word') {
        return nonEmpty.map((cue, idx) => ({
            index: idx + 1,
            startMs: cue.startMs,
            endMs: cue.endMs,
            text: cue.text.trim(),
        }));
    }
    const limit = Math.max(4, Number.isFinite(maxCharsPerCue) ? maxCharsPerCue : 16);
    const groups = [];
    let curStartMs = 0;
    let curEndMs = 0;
    let curText = '';
    let curWeight = 0;
    let prevCue = null;
    for (const cue of nonEmpty) {
        const word = cue.text.trim();
        const wWeight = measureCueTextWeight(word);
        const isStandalonePunct = /^[。！？；，、.!?;,:：]+$/.test(word);
        if (prevCue !== null) {
            const exceedsWeight = !isStandalonePunct && curWeight + wWeight > limit;
            const hasPauseGap = cue.startMs - prevCue.endMs >= 350;
            const endedClause = /[。！？；，、.!?;,:：]$/.test(curText);
            if (exceedsWeight || hasPauseGap || endedClause) {
                groups.push({ startMs: curStartMs, endMs: curEndMs, text: curText });
                curStartMs = cue.startMs;
                curEndMs = Math.max(cue.startMs, cue.endMs);
                curText = word;
                curWeight = wWeight;
                prevCue = cue;
                continue;
            }
            curText += (needsSpaceBetween(curText, word) ? ' ' : '') + word;
            curEndMs = Math.max(curEndMs, cue.endMs);
            curWeight += wWeight;
            prevCue = cue;
        }
        else {
            curStartMs = cue.startMs;
            curEndMs = Math.max(cue.startMs, cue.endMs);
            curText = word;
            curWeight = wWeight;
            prevCue = cue;
        }
    }
    if (prevCue !== null && curText !== '') {
        groups.push({ startMs: curStartMs, endMs: curEndMs, text: curText });
    }
    return groups.map((g, idx) => ({
        index: idx + 1,
        startMs: g.startMs,
        endMs: g.endMs,
        text: g.text,
    }));
}
function formatSubtitleTimestamp(ms, decimalSep) {
    const safe = Math.max(0, Math.round(ms));
    const hours = Math.floor(safe / 3600000);
    const minutes = Math.floor((safe % 3600000) / 60000);
    const seconds = Math.floor((safe % 60000) / 1000);
    const millis = safe % 1000;
    return String(hours).padStart(2, '0')
        + ':' + String(minutes).padStart(2, '0')
        + ':' + String(seconds).padStart(2, '0')
        + decimalSep + String(millis).padStart(3, '0');
}
function formatAssTimestamp(ms) {
    const totalCs = Math.max(0, Math.round(ms / 10));
    const cs = totalCs % 100;
    const totalSec = Math.floor(totalCs / 100);
    const sec = totalSec % 60;
    const totalMin = Math.floor(totalSec / 60);
    const min = totalMin % 60;
    const hours = Math.floor(totalMin / 60);
    return `${hours}:${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}.${String(cs).padStart(2, '0')}`;
}
function escapeAssText(text) {
    return text
        .replace(/\r\n?/g, '\n')
        .replace(/\{/g, '\\{')
        .replace(/\}/g, '\\}')
        .replace(/\n/g, '\\N');
}
/**
 * 将字幕格式化为 SubStation Alpha (`v4.00+` `.ass`) 文本；
 * 若同时提供词级时间轴 `wordCues`，自动生成带 `{\kf<cs>}` 逐词高亮标签的卡拉 OK 字幕。
 */
export function formatAssSubtitles(cues, wordCues) {
    const headerLines = [
        '[Script Info]',
        'Title: dsh-voice Subtitles',
        'ScriptType: v4.00+',
        'WrapStyle: 0',
        'ScaledBorderAndShadow: yes',
        'PlayResX: 1080',
        'PlayResY: 1920',
        '',
        '[V4+ Styles]',
        'Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding',
        'Style: Default,Microsoft YaHei,58,&H0000FFFF,&H00FFFFFF,&H00000000,&H80000000,-1,0,0,0,100,100,0,0,1,3,1,2,60,60,180,1',
        '',
        '[Events]',
        'Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text',
    ];
    const hasWords = Array.isArray(wordCues) && wordCues.length > 0;
    const dialogues = [];
    for (const cue of cues) {
        const startStr = formatAssTimestamp(cue.startMs);
        const endStr = formatAssTimestamp(Math.max(cue.startMs, cue.endMs));
        let renderedText = '';
        if (hasWords) {
            const matching = wordCues.filter((w) => typeof w.text === 'string'
                && w.text.trim() !== ''
                && ((w.endMs > cue.startMs && w.startMs < cue.endMs)
                    || (w.startMs === w.endMs && w.startMs >= cue.startMs && w.startMs <= cue.endMs)));
            if (matching.length > 0) {
                const speakerMatch = /^(\[[^\]]+\]\s+)/.exec(cue.text);
                if (speakerMatch && !matching[0].text.trim().startsWith('[')) {
                    renderedText += escapeAssText(speakerMatch[1]);
                }
                for (let i = 0; i < matching.length; i++) {
                    const w = matching[i];
                    const rawWord = w.text.trim();
                    if (i > 0 && needsSpaceBetween(matching[i - 1].text.trim(), rawWord)) {
                        renderedText += ' ';
                    }
                    const durCs = Math.max(1, Math.round((w.endMs - w.startMs) / 10));
                    renderedText += `{\\kf${durCs}}${escapeAssText(rawWord)}`;
                }
            }
        }
        if (renderedText === '') {
            renderedText = escapeAssText(cue.text);
        }
        dialogues.push(`Dialogue: 0,${startStr},${endStr},Default,,0,0,0,,${renderedText}`);
    }
    return [...headerLines, ...dialogues].join('\n') + '\n';
}
/**
 * 将字幕条目格式化为 SRT、WebVTT 或 ASS（支持卡拉 OK 词级高亮）文本。
 */
export function formatSubtitles(cues, format, wordCues) {
    if (format === 'ass') {
        return formatAssSubtitles(cues, wordCues);
    }
    if (format === 'vtt') {
        if (cues.length === 0)
            return 'WEBVTT\n\n';
        const blocks = cues.map((cue) => formatSubtitleTimestamp(cue.startMs, '.')
            + ' --> '
            + formatSubtitleTimestamp(cue.endMs, '.')
            + '\n'
            + cue.text);
        return 'WEBVTT\n\n' + blocks.join('\n\n') + '\n';
    }
    if (cues.length === 0)
        return '';
    return cues
        .map((cue, idx) => String(idx + 1)
        + '\n'
        + formatSubtitleTimestamp(cue.startMs, ',')
        + ' --> '
        + formatSubtitleTimestamp(cue.endMs, ',')
        + '\n'
        + cue.text)
        .join('\n\n') + '\n';
}
function escapeHtml(value) {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
/**
 * 生成自包含、支持明暗主题与倍速播放的 HTML5 音色试听卡片页面。
 */
export function renderPreviewHtml(samples, text) {
    const cards = samples.map((sample) => {
        const safeVoice = escapeHtml(sample.voice);
        const safeFile = escapeHtml(sample.fileName);
        const metaParts = [sample.locale, sample.gender].filter((item) => typeof item === 'string' && item !== '');
        const metaHtml = metaParts.length > 0
            ? '<p class="meta">' + metaParts.map((item) => escapeHtml(item)).join(' · ') + '</p>'
            : '';
        return [
            '      <article class="card">',
            '        <div class="card-head">',
            '          <div>',
            '            <h2>' + safeVoice + '</h2>',
            metaHtml,
            '          </div>',
            '          <button type="button" class="copy-btn" data-voice="' + safeVoice + '">复制 ID</button>',
            '        </div>',
            '        <audio controls preload="none" src="./' + safeFile + '"></audio>',
            '      </article>',
        ].filter(Boolean).join('\n');
    }).join('\n');
    return [
        '<!DOCTYPE html>',
        '<html lang="zh-CN">',
        '<head>',
        '  <meta charset="UTF-8">',
        '  <meta name="viewport" content="width=device-width, initial-scale=1.0">',
        '  <title>dsh-voice 音色试听对比</title>',
        '  <style>',
        '    :root { color-scheme: light dark; --bg: #f6f7f9; --card: #ffffff; --fg: #181a1f; --muted: #5c6370; --border: #e1e4e8; --accent: #2563eb; }',
        '    @media (prefers-color-scheme: dark) { :root { --bg: #0f1117; --card: #181b24; --fg: #eceef2; --muted: #9aa2b1; --border: #2a2f3d; --accent: #60a5fa; } }',
        '    * { box-sizing: border-box; }',
        '    body { margin: 0; padding: 24px; font-family: system-ui, -apple-system, sans-serif; background: var(--bg); color: var(--fg); }',
        '    .wrap { max-width: 920px; margin: 0 auto; }',
        '    header { display: flex; flex-wrap: wrap; gap: 12px; justify-content: space-between; align-items: center; margin-bottom: 16px; }',
        '    h1 { margin: 0; font-size: 1.35rem; }',
        '    .quote { margin: 0 0 20px; padding: 12px 14px; background: var(--card); border: 1px solid var(--border); border-radius: 10px; color: var(--muted); line-height: 1.5; }',
        '    .controls { display: flex; align-items: center; gap: 8px; font-size: 0.9rem; }',
        '    select, .copy-btn { padding: 6px 10px; border-radius: 8px; border: 1px solid var(--border); background: var(--card); color: var(--fg); cursor: pointer; }',
        '    .copy-btn:hover { border-color: var(--accent); color: var(--accent); }',
        '    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 14px; }',
        '    .card { background: var(--card); border: 1px solid var(--border); border-radius: 12px; padding: 14px; display: flex; flex-direction: column; gap: 10px; }',
        '    .card-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; }',
        '    h2 { margin: 0; font-size: 1rem; word-break: break-all; }',
        '    .meta { margin: 4px 0 0; font-size: 0.85rem; color: var(--muted); }',
        '    audio { width: 100%; }',
        '  </style>',
        '</head>',
        '<body>',
        '  <main class="wrap">',
        '    <header>',
        '      <h1>音色试听对比</h1>',
        '      <label class="controls">倍速播放：',
        '        <select id="rate-select">',
        '          <option value="0.8">0.8x</option>',
        '          <option value="1.0" selected>1.0x</option>',
        '          <option value="1.2">1.2x</option>',
        '          <option value="1.5">1.5x</option>',
        '        </select>',
        '      </label>',
        '    </header>',
        '    <p class="quote">试听文本：' + escapeHtml(text) + '</p>',
        '    <section class="grid">',
        cards,
        '    </section>',
        '  </main>',
        '  <script>',
        '    const rateSelect = document.getElementById("rate-select");',
        '    rateSelect.addEventListener("change", () => {',
        '      const rate = Number(rateSelect.value) || 1;',
        '      for (const el of document.querySelectorAll("audio")) el.playbackRate = rate;',
        '    });',
        '    for (const btn of document.querySelectorAll(".copy-btn")) {',
        '      btn.addEventListener("click", async () => {',
        '        const id = btn.getAttribute("data-voice") || "";',
        '        try {',
        '          await navigator.clipboard.writeText(id);',
        '          const prev = btn.textContent;',
        '          btn.textContent = "已复制";',
        '          setTimeout(() => { btn.textContent = prev; }, 1200);',
        '        } catch {',
        '          window.prompt("复制音色 ID：", id);',
        '        }',
        '      });',
        '    }',
        '  </script>',
        '</body>',
        '</html>',
    ].join('\n') + '\n';
}
/**
 * 清洗并解析时间戳字符串（支持 HH:MM:SS,mmm / HH:MM:SS.mmm / MM:SS.mmm）。
 */
function parseSubtitleTimestampMs(raw) {
    const match = /^(?:(\d{1,3}):)?(\d{1,2}):(\d{2})[.,](\d{1,3})$/.exec(raw.trim());
    if (!match)
        return null;
    const hours = match[1] !== undefined ? Number(match[1]) : 0;
    const minutes = Number(match[2]);
    const seconds = Number(match[3]);
    const millis = Number(match[4].padEnd(3, '0'));
    if (!Number.isFinite(hours) || !Number.isFinite(minutes) || !Number.isFinite(seconds) || !Number.isFinite(millis)) {
        return null;
    }
    return ((hours * 60 + minutes) * 60 + seconds) * 1000 + millis;
}
function stripInlineSubtitleTags(text) {
    return text
        .replace(/<\/?(?:v|c|b|i|u|ruby|rt|lang|font)(?=[\s.>/]|$)[^>]*>/gi, '')
        .replace(/<\d{1,2}:\d{2}(?::\d{2})?[.,]\d{1,3}>/g, '');
}
/**
 * 解析 SRT 或 WebVTT 字幕文件为按开始时间排序的 SubtitleCue 数组（1-based 索引）。
 */
export function parseSubtitleFile(content) {
    const normalized = content.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n').trim();
    if (normalized === '')
        return [];
    const blocks = normalized.split(/\n{2,}/);
    const parsed = [];
    for (const block of blocks) {
        const lines = block.split('\n').map((line) => line.trimEnd());
        const firstNonEmpty = lines.find((line) => line.trim() !== '')?.trim() ?? '';
        if (firstNonEmpty === ''
            || firstNonEmpty.startsWith('WEBVTT')
            || firstNonEmpty.startsWith('NOTE')
            || firstNonEmpty === 'STYLE'
            || firstNonEmpty === 'REGION') {
            continue;
        }
        const timingIdx = lines.findIndex((line) => line.includes('-->'));
        if (timingIdx === -1)
            continue;
        const timingLine = lines[timingIdx];
        const arrowPos = timingLine.indexOf('-->');
        const leftPart = timingLine.slice(0, arrowPos).trim();
        const rightPart = timingLine.slice(arrowPos + 3).trim();
        const startToken = leftPart.split(/\s+/).pop() ?? '';
        const endToken = rightPart.split(/\s+/)[0] ?? '';
        const startMs = parseSubtitleTimestampMs(startToken);
        const endMsRaw = parseSubtitleTimestampMs(endToken);
        if (startMs === null || endMsRaw === null)
            continue;
        const endMs = Math.max(startMs, endMsRaw);
        const text = stripInlineSubtitleTags(lines.slice(timingIdx + 1).join('\n')).trim();
        if (text === '')
            continue;
        parsed.push({ startMs, endMs, text });
    }
    parsed.sort((a, b) => (a.startMs !== b.startMs ? a.startMs - b.startMs : a.endMs - b.endMs));
    return parsed.map((cue, idx) => ({
        index: idx + 1,
        startMs: cue.startMs,
        endMs: cue.endMs,
        text: cue.text,
    }));
}
/**
 * 将基础语速百分比（如 `+10%`）乘以缩放因子并钳制在 `[0.7, 1.85]`（`-30%` 至 `+85%`），返回 `'+25%'` / `'-10%'` 格式。
 */
export function scaleRatePercent(baseRate, factor) {
    const match = /^([+-]?\d+(?:\.\d+)?)%$/.exec(baseRate.trim());
    const baseMultiplier = match && Number.isFinite(Number(match[1])) ? 1 + Number(match[1]) / 100 : 1.0;
    const safeFactor = Number.isFinite(factor) && factor > 0 ? factor : 1.0;
    const combined = Math.min(1.85, Math.max(0.7, baseMultiplier * safeFactor));
    const percent = Math.round((combined - 1) * 100);
    return (percent >= 0 ? '+' : '') + String(percent) + '%';
}
function escapeRegExp(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
/**
 * 构造词边界安全的发音词典全局正则：
 * - 按词长降序去重排序，避免短词抢先截断长词；
 * - 纯 ASCII 单词/缩写（`OS` / `UI` / `SQL` / `Nginx`）自动包裹 `(?<![A-Za-z0-9_])...(?![A-Za-z0-9_])`，
 *   使其匹配独立单词与中英混排（如 `"Mac OS"`、`"OS系统"`），但绝不误伤 `"POST"` / `"BUILD"` 等单词内部子串。
 */
export function buildPronunciationPattern(words) {
    if (!Array.isArray(words) || words.length === 0)
        return null;
    const unique = Array.from(new Set(words
        .filter((w) => typeof w === 'string')
        .map((w) => w.trim())
        .filter((w) => w.length > 0))).sort((a, b) => b.length - a.length);
    if (unique.length === 0)
        return null;
    const alternatives = unique.map((word) => {
        const escaped = escapeRegExp(word);
        return /^[A-Za-z0-9_]+$/.test(word)
            ? `(?<![A-Za-z0-9_])${escaped}(?![A-Za-z0-9_])`
            : escaped;
    });
    return new RegExp(alternatives.join('|'), 'g');
}
/**
 * 纯文本单遍发音词典替换（用于不支持 SSML `<sub alias>` 的 OpenAI / SiliconFlow 引擎）。
 * 按原词长度降序构造单次正则同步替换，保证替读结果不会递归触发其它规则且保护 ASCII 词边界。
 */
export function applyPronunciationsPlain(text, rules) {
    if (text === '' || !Array.isArray(rules) || rules.length === 0)
        return text;
    const map = new Map();
    for (const rule of rules) {
        if (!rule || typeof rule.word !== 'string' || typeof rule.alias !== 'string')
            continue;
        const word = rule.word.trim();
        const alias = rule.alias.trim();
        if (word !== '' && alias !== '') {
            map.set(word, alias);
        }
    }
    const regex = buildPronunciationPattern(Array.from(map.keys()));
    if (regex === null)
        return text;
    return text.replace(regex, (matched) => map.get(matched) ?? matched);
}
const INLINE_PAUSE_SOURCE = '\\[(?:pause|break|停顿)\\s*[:：=]?\\s*(\\d+(?:\\.\\d+)?)\\s*(ms|s|秒|毫秒)?\\]';
function parseInlinePauseMs(rawNum, rawUnit) {
    const value = Number(rawNum);
    const unit = (rawUnit ?? 'ms').toLowerCase();
    const ms = unit === 's' || unit === '秒' ? value * 1000 : value;
    if (!Number.isFinite(ms))
        return 500;
    return Math.min(10000, Math.max(50, Math.round(ms)));
}
/**
 * 解析并切分行内停顿标签（如 `[pause:500ms]`、`[break:600ms]`、`[停顿0.6s]`），
 * 返回非空文本与停顿交替序列（自动合并相邻停顿并钳制在 50..10000ms）。
 */
export function splitInlinePauses(text) {
    if (typeof text !== 'string' || text === '')
        return [];
    const re = new RegExp(INLINE_PAUSE_SOURCE, 'gi');
    const pieces = [];
    let lastIndex = 0;
    let match;
    const pushPause = (durationMs) => {
        const prev = pieces[pieces.length - 1];
        if (prev && prev.kind === 'pause') {
            prev.durationMs = Math.min(10000, prev.durationMs + durationMs);
        }
        else {
            pieces.push({ kind: 'pause', durationMs });
        }
    };
    while ((match = re.exec(text)) !== null) {
        if (match.index > lastIndex) {
            const part = text.slice(lastIndex, match.index).trim();
            if (part !== '') {
                pieces.push({ kind: 'text', text: part });
            }
        }
        pushPause(parseInlinePauseMs(match[1], match[2]));
        lastIndex = match.index + match[0].length;
    }
    if (lastIndex < text.length) {
        const tail = text.slice(lastIndex).trim();
        if (tail !== '') {
            pieces.push({ kind: 'text', text: tail });
        }
    }
    return pieces;
}
/**
 * 剥离行内停顿标签并折叠周围多余水平空白，生成干净的字幕展示文本。
 */
export function stripInlinePauses(text) {
    if (typeof text !== 'string' || text === '')
        return '';
    const re = new RegExp(INLINE_PAUSE_SOURCE, 'gi');
    const replaced = text.replace(re, (matched, _num, _unit, offset, full) => {
        const before = full.slice(0, offset);
        const after = full.slice(offset + matched.length);
        if (before !== ''
            && after !== ''
            && !/[ \t\r\n]$/.test(before)
            && !/^[ \t\r\n]/.test(after)
            && needsSpaceBetween(before, after)) {
            return ' ';
        }
        return '';
    });
    return replaced
        .replace(/[ \t]{2,}/g, ' ')
        .replace(/^[ \t]+|[ \t]+$/gm, '')
        .trim();
}
function throwIfAborted(signal) {
    if (signal?.aborted === true)
        throw signal.reason;
}
function runFfmpegArgs(args, errorPrefix, signal) {
    throwIfAborted(signal);
    return new Promise((resolvePromise, rejectPromise) => {
        execFile('ffmpeg', args, { signal, maxBuffer: 4 * 1024 * 1024 }, (error, _stdout, stderr) => {
            if (signal?.aborted === true) {
                rejectPromise(signal.reason);
                return;
            }
            if (error) {
                const detail = typeof stderr === 'string' && stderr.trim() !== ''
                    ? stderr.trim().slice(-300)
                    : error.message;
                rejectPromise(new Error(errorPrefix + detail));
                return;
            }
            resolvePromise();
        });
    });
}
/**
 * 使用本地 ffmpeg `atempo` 滤镜对超窗 MP3 进行保调精准变速压缩，确保字幕时间窗零累积漂移。
 */
export async function fitAudioToWindow(mp3, targetMaxMs, signal) {
    throwIfAborted(signal);
    if (mp3.length === 0 || !Number.isFinite(targetMaxMs) || targetMaxMs <= 50) {
        return mp3;
    }
    const info = inspectMp3Buffer(mp3);
    if (info.durationMs <= targetMaxMs) {
        return mp3;
    }
    const ratio = info.durationMs / targetMaxMs;
    const atempoFilter = ratio <= 2.0
        ? `atempo=${ratio.toFixed(4)}`
        : `atempo=2.0,atempo=${Math.min(2.0, ratio / 2).toFixed(4)}`;
    const targetRate = [8000, 11025, 12000, 16000, 22050, 24000, 32000, 44100, 48000].includes(info.sampleRate)
        ? info.sampleRate
        : 24000;
    const bitrateArg = String(Math.min(320, Math.max(32, info.bitrateKbps || 48))) + 'k';
    const tempDir = mkdtempSync(join(tmpdir(), 'dsh-voice-atempo-'));
    try {
        const inPath = join(tempDir, 'in.mp3');
        const outPath = join(tempDir, 'out.mp3');
        writeFileSync(inPath, mp3);
        await runFfmpegArgs([
            '-y',
            '-i', inPath,
            '-vn',
            '-af', atempoFilter,
            '-ar', String(targetRate),
            '-ac', String(info.channels),
            '-b:a', bitrateArg,
            outPath,
        ], 'ffmpeg 语速窗口对齐失败：', signal);
        throwIfAborted(signal);
        const fitted = readFileSync(outPath);
        if (fitted.length === 0) {
            throw new Error('ffmpeg 语速窗口对齐结果为空。');
        }
        return fitted;
    }
    finally {
        try {
            rmSync(tempDir, { recursive: true, force: true });
        }
        catch {
            // 尽力清理临时目录
        }
    }
}
/**
 * 使用本地 ffmpeg 对 MP3 音频执行播客级响度均衡（-16 LUFS / TP -1.5 dBTP / LRA 11）。
 * @throws 取消时抛出 signal.reason，ffmpeg 失败时抛中文错误。
 */
export async function normalizeAudioLoudness(mp3, signal) {
    throwIfAborted(signal);
    const tempDir = mkdtempSync(join(tmpdir(), 'dsh-voice-loudnorm-'));
    try {
        const inPath = join(tempDir, 'in.mp3');
        const outPath = join(tempDir, 'out.mp3');
        writeFileSync(inPath, mp3);
        await runFfmpegArgs(['-y', '-i', inPath, '-af', 'loudnorm=I=-16:TP=-1.5:LRA=11', '-ar', '24000', '-ac', '1', '-b:a', '48k', outPath], 'ffmpeg 响度均衡失败：', signal);
        throwIfAborted(signal);
        const normalized = readFileSync(outPath);
        if (normalized.length === 0) {
            throw new Error('ffmpeg 响度均衡结果为空。');
        }
        return normalized;
    }
    finally {
        try {
            rmSync(tempDir, { recursive: true, force: true });
        }
        catch {
            // 尽力清理临时目录
        }
    }
}
/**
 * 使用本地 ffmpeg 将人声 MP3 与背景音乐混音：
 * 自动循环 BGM、按人声侧链压缩闪避（ducking）、在结尾 1.2s 平滑淡出（总长 > 3s），并可选联动响度均衡。
 */
export async function mixAudioWithBgm(voiceMp3, opts, signal) {
    throwIfAborted(signal);
    if (voiceMp3.length === 0) {
        throw new Error('人声音频为空，无法混入 BGM。');
    }
    if (typeof opts.bgmPath !== 'string' || opts.bgmPath.trim() === '') {
        throw new Error('未提供有效的背景音乐路径（bgmPath）。');
    }
    const info = inspectMp3Buffer(voiceMp3);
    const targetRate = [16000, 22050, 24000, 32000, 44100, 48000].includes(info.sampleRate) ? info.sampleRate : 24000;
    const targetLayout = info.channels === 2 ? 'stereo' : 'mono';
    const volume = Math.min(1.0, Math.max(0.02, Number.isFinite(opts.bgmVolume) ? opts.bgmVolume : 0.18));
    const ducking = opts.ducking !== false;
    const fadeFilter = info.durationMs > 3000
        ? `,afade=t=out:st=${Math.max(0, (info.durationMs - 1200) / 1000).toFixed(3)}:d=1.2`
        : '';
    const loudnormFilter = opts.normalizeLoudness === true ? ',loudnorm=I=-16:TP=-1.5:LRA=11' : '';
    const bitrateArg = String(Math.min(192, Math.max(48, info.bitrateKbps))) + 'k';
    const filterGraph = ducking
        ? `[0:a]aformat=sample_rates=${targetRate}:channel_layouts=${targetLayout},asplit=2[v_mix][v_sc];`
            + `[1:a]aformat=sample_rates=${targetRate}:channel_layouts=${targetLayout},volume=${volume.toFixed(4)}${fadeFilter}[bgm];`
            + `[bgm][v_sc]sidechaincompress=threshold=0.03:ratio=6:attack=40:release=450[bgm_ducked];`
            + `[v_mix][bgm_ducked]amix=inputs=2:duration=first:dropout_transition=2:normalize=0${loudnormFilter}[out]`
        : `[0:a]aformat=sample_rates=${targetRate}:channel_layouts=${targetLayout}[v_mix];`
            + `[1:a]aformat=sample_rates=${targetRate}:channel_layouts=${targetLayout},volume=${volume.toFixed(4)}${fadeFilter}[bgm];`
            + `[v_mix][bgm]amix=inputs=2:duration=first:dropout_transition=2:normalize=0${loudnormFilter}[out]`;
    const tempDir = mkdtempSync(join(tmpdir(), 'dsh-voice-bgm-'));
    try {
        const voicePath = join(tempDir, 'voice.mp3');
        const outPath = join(tempDir, 'out.mp3');
        writeFileSync(voicePath, voiceMp3);
        await runFfmpegArgs([
            '-y',
            '-i', voicePath,
            '-stream_loop', '-1', '-i', opts.bgmPath,
            '-filter_complex', filterGraph,
            '-map', '[out]',
            '-ar', String(targetRate),
            '-ac', String(info.channels),
            '-b:a', bitrateArg,
            outPath,
        ], 'ffmpeg BGM 混音失败：', signal);
        throwIfAborted(signal);
        const mixed = readFileSync(outPath);
        if (mixed.length === 0) {
            throw new Error('ffmpeg BGM 混音结果为空。');
        }
        return mixed;
    }
    finally {
        try {
            rmSync(tempDir, { recursive: true, force: true });
        }
        catch {
            // 尽力清理临时目录
        }
    }
}
/**
 * 按一级至三级 Markdown 标题（`#` / `##` / `###`）提取有声书/播客章节：
 * 先剥离围栏代码块以避免将代码注释误判为标题；首标题前若有正文则归入 `导言` 章节。
 */
export function extractMarkdownSections(markdown, cleanMarkdown = true) {
    if (typeof markdown !== 'string' || markdown.trim() === '')
        return [];
    let src = markdown.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
    src = src.replace(/```[\s\S]*?```/g, '').replace(/~~~[\s\S]*?~~~/g, '');
    const headingRe = /^(#{1,3})\s+(.+)$/gm;
    const matches = [];
    let m;
    while ((m = headingRe.exec(src)) !== null) {
        matches.push({
            index: m.index,
            fullLength: m[0].length,
            rawTitle: m[2].replace(/\s+#+\s*$/, '').trim(),
        });
    }
    if (matches.length === 0)
        return [];
    const sections = [];
    const rawIntro = src.slice(0, matches[0].index);
    const cleanedIntro = cleanMarkdown ? cleanMarkdownForSpeech(rawIntro) : rawIntro.trim();
    if (cleanedIntro !== '') {
        sections.push({ title: '导言', text: cleanedIntro });
    }
    for (let i = 0; i < matches.length; i++) {
        const cur = matches[i];
        const bodyStart = cur.index + cur.fullLength;
        const bodyEnd = i + 1 < matches.length ? matches[i + 1].index : src.length;
        const rawBody = src.slice(bodyStart, bodyEnd);
        const cleanedTitle = (cleanMarkdown ? cleanMarkdownForSpeech(cur.rawTitle) : cur.rawTitle).trim() || cur.rawTitle;
        const cleanedBody = cleanMarkdown ? cleanMarkdownForSpeech(rawBody) : rawBody.trim();
        if (cleanedTitle === '' && cleanedBody === '')
            continue;
        const combined = cleanedBody !== ''
            ? (/[。！？.!?]$/.test(cleanedTitle) ? `${cleanedTitle}\n${cleanedBody}` : `${cleanedTitle}。\n${cleanedBody}`)
            : cleanedTitle;
        if (combined.trim() !== '') {
            sections.push({ title: cleanedTitle, text: combined });
        }
    }
    return sections;
}
function encodeId3v23Frame(frameId, payload) {
    const header = Buffer.alloc(10);
    header.write(frameId, 0, 4, 'ascii');
    header.writeUInt32BE(payload.length, 4);
    header[8] = 0x00;
    header[9] = 0x00;
    return Buffer.concat([header, payload]);
}
function encodeTit2Frame(title) {
    const textBytes = Buffer.from(title, 'utf16le');
    const payload = Buffer.alloc(3 + textBytes.length + 2);
    payload[0] = 0x01; // UTF-16 with BOM
    payload[1] = 0xff;
    payload[2] = 0xfe;
    textBytes.copy(payload, 3);
    payload[3 + textBytes.length] = 0x00;
    payload[3 + textBytes.length + 1] = 0x00;
    return encodeId3v23Frame('TIT2', payload);
}
/**
 * 纯 TypeScript 零依赖向 MP3 写入原生 ID3v2.3 `CTOC` + `CHAP` 章节书签标签（兼容 Apple Podcasts / VLC / ffmpeg / 车载播放器）。
 */
export function embedMp3Chapters(mp3, chapters, meta) {
    if (mp3.length === 0 || !Array.isArray(chapters) || chapters.length === 0) {
        return mp3;
    }
    let body = stripId3v2(mp3);
    while (body.length < mp3.length) {
        const next = stripId3v2(body);
        if (next.length === body.length)
            break;
        body = next;
    }
    const capped = chapters.slice(0, 255);
    const frames = [];
    if (typeof meta?.title === 'string' && meta.title.trim() !== '') {
        frames.push(encodeTit2Frame(meta.title.trim()));
    }
    const childIdBuffers = capped.map((_ch, idx) => Buffer.from(`chp${idx}\0`, 'ascii'));
    const ctocHeader = Buffer.from([0x74, 0x6f, 0x63, 0x31, 0x00, 0x03, capped.length]); // 'toc1\0' + flags(0x03) + count
    frames.push(encodeId3v23Frame('CTOC', Buffer.concat([ctocHeader, ...childIdBuffers])));
    for (let i = 0; i < capped.length; i++) {
        const ch = capped[i];
        const elemId = childIdBuffers[i];
        const startMs = Math.max(0, Math.round(Number.isFinite(ch.startMs) ? ch.startMs : 0));
        const endMs = Math.max(startMs, Math.round(Number.isFinite(ch.endMs) ? ch.endMs : startMs));
        const timing = Buffer.alloc(16);
        timing.writeUInt32BE(startMs >>> 0, 0);
        timing.writeUInt32BE(endMs >>> 0, 4);
        timing.writeUInt32BE(0xffffffff, 8);
        timing.writeUInt32BE(0xffffffff, 12);
        const tit2 = encodeTit2Frame(ch.title);
        frames.push(encodeId3v23Frame('CHAP', Buffer.concat([elemId, timing, tit2])));
    }
    const tagPayload = Buffer.concat(frames);
    const len = tagPayload.length;
    const id3Header = Buffer.alloc(10);
    id3Header[0] = 0x49; // 'I'
    id3Header[1] = 0x44; // 'D'
    id3Header[2] = 0x33; // '3'
    id3Header[3] = 0x03; // v2.3
    id3Header[4] = 0x00; // revision 0
    id3Header[5] = 0x00; // flags
    id3Header[6] = (len >>> 21) & 0x7f;
    id3Header[7] = (len >>> 14) & 0x7f;
    id3Header[8] = (len >>> 7) & 0x7f;
    id3Header[9] = len & 0x7f;
    return Buffer.concat([id3Header, tagPayload, body]);
}
/**
 * 将章节时间轴格式化为播客 Show Notes / YouTube 时间戳文本（`MM:SS 标题` 或跨小时 `HH:MM:SS 标题`）。
 */
export function formatChaptersMarkdown(chapters) {
    if (!Array.isArray(chapters) || chapters.length === 0)
        return '';
    const useHours = chapters.some((ch) => Math.max(0, Math.round(ch.startMs)) >= 3600000 || Math.max(0, Math.round(ch.endMs)) >= 3600000);
    const lines = chapters.map((ch) => {
        const totalSec = Math.max(0, Math.floor(Math.round(ch.startMs) / 1000));
        const hours = Math.floor(totalSec / 3600);
        const minutes = Math.floor((totalSec % 3600) / 60);
        const seconds = totalSec % 60;
        const stamp = useHours
            ? `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
            : `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        return `${stamp} ${ch.title.trim()}`;
    });
    return lines.join('\n') + '\n';
}
