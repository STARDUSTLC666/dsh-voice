/**
 * edge-tts 协议客户端：原生 WebSocket 直连微软 Edge 朗读服务，零 API 成本。
 * 协议对齐开源 edge-tts 当前版本：Sec-MS-GEC 令牌由本地 DRM 算法生成
 * （SHA256(Windows 文件时间 + TrustedClientToken)，5 分钟窗口），不再请求令牌端点。
 *
 * @module dsh-voice/edge-tts
 */
import { randomBytes, randomUUID } from 'node:crypto';
import WebSocket from 'ws';
import { edgeTokenV2 } from './edge-drm-v2.js';
import { getProxyWsAgent } from './proxy-fetch.js';
import { VOICES } from './voices.js';
const TRUSTED_CLIENT_TOKEN = '6A5AA1D4EAFF4E9FB37E23D68491D6F4';
const WS_BASE = 'wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1';
const VOICES_LIST_URL = 'https://speech.platform.bing.com/consumer/speech/synthesize/readaloud/voices/list';
const EDGE_VOICES_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const OUTPUT_FORMAT = 'audio-24khz-48kbitrate-mono-mp3';
const SEC_MS_GEC_VERSION = '2-143.0.3650.75';
const WIN_EPOCH_SECONDS = 11644473600;
const WSS_HEADERS = {
    Pragma: 'no-cache',
    'Cache-Control': 'no-cache',
    Origin: 'chrome-extension://jdiccldimpdaibmpdkjnbmckianbfold',
    'Accept-Encoding': 'gzip, deflate, br, zstd',
    'Accept-Language': 'en-US,en;q=0.9',
    'Sec-WebSocket-Version': '13',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0',
};
/** 403 响应校准出的服务端时钟偏差（秒）：serverSeconds - Date.now() / 1000。 */
let clockSkewSeconds = 0;
/** 重置时钟偏差缓存（测试专用）。 */
export function resetClockSkewForTest() {
    clockSkewSeconds = 0;
}
/** 读取当前时钟偏差（秒）。 */
export function getClockSkewSeconds() {
    return clockSkewSeconds;
}
/** 内部哨兵错误：收到 403 且已根据服务端 Date 头校准时钟后触发单次重试。 */
class ClockSkewRetrySignal extends Error {
    constructor() {
        super('clock-skew-retry');
    }
}
/** 直连工厂（ws 库，Node 全版本可用）。 */
function directWebSocket(url, options) {
    return new WebSocket(url, { headers: options.headers });
}
/** 代理工厂：复用 proxy-fetch 缓存的 HTTP(S) / SOCKS5 Agent。 */
function proxyWebSocket(proxyUrl) {
    const agent = getProxyWsAgent(proxyUrl);
    return (url, options) => new WebSocket(url, { headers: options.headers, agent: agent });
}
/**
 * 本地生成 Sec-MS-GEC v2 令牌（对齐 edge-tts 7.3.1）。
 */
export function generateSecMsGec(nowSeconds = Date.now() / 1000) {
    let ticks = Math.floor(nowSeconds) + WIN_EPOCH_SECONDS;
    ticks -= ticks % 300;
    const windowsTicks = ticks * 10000000;
    const raw = String(windowsTicks) + TRUSTED_CLIENT_TOKEN;
    return edgeTokenV2(raw);
}
/** 去除 XML 1.0 非法控制字符（保留 \t \n \r）。 */
function stripIllegalXmlChars(text) {
    return text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '');
}
/** XML 文本转义。 */
function escapeXml(text) {
    return stripIllegalXmlChars(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}
/** XML 属性转义（同时转义单双引号）。 */
function escapeXmlAttr(value) {
    return escapeXml(value)
        .replace(/'/g, '&apos;')
        .replace(/"/g, '&quot;');
}
function renderSsmlBody(text, pronunciations) {
    const cleanText = stripIllegalXmlChars(text);
    if (!Array.isArray(pronunciations) || pronunciations.length === 0) {
        return escapeXml(cleanText);
    }
    const map = new Map();
    for (const rule of pronunciations) {
        if (!rule || typeof rule.word !== 'string' || typeof rule.alias !== 'string')
            continue;
        const word = stripIllegalXmlChars(rule.word).trim();
        const alias = stripIllegalXmlChars(rule.alias).trim();
        if (word !== '' && alias !== '') {
            map.set(word, alias);
        }
    }
    if (map.size === 0) {
        return escapeXml(cleanText);
    }
    const sortedWords = Array.from(map.keys()).sort((a, b) => b.length - a.length);
    const regex = new RegExp(sortedWords.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'), 'g');
    let out = '';
    let lastIndex = 0;
    let match;
    while ((match = regex.exec(cleanText)) !== null) {
        if (match.index > lastIndex) {
            out += escapeXml(cleanText.slice(lastIndex, match.index));
        }
        const matchedWord = match[0];
        const alias = map.get(matchedWord);
        out += `<sub alias='${escapeXmlAttr(alias)}'>${escapeXml(matchedWord)}</sub>`;
        lastIndex = match.index + matchedWord.length;
    }
    if (lastIndex < cleanText.length) {
        out += escapeXml(cleanText.slice(lastIndex));
    }
    return out;
}
/** 生成 SSML。 */
export function buildSsml(options) {
    const lang = /^[a-z]{2,3}(?:-[A-Za-z]{2,4})?(?:-[A-Z]{2})?/.exec(options.voice)?.[0] ?? 'zh-CN';
    return "<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='"
        + escapeXmlAttr(lang)
        + "'><voice name='"
        + escapeXmlAttr(options.voice)
        + "'><prosody pitch='"
        + escapeXmlAttr(options.pitch)
        + "' rate='"
        + escapeXmlAttr(options.rate)
        + "' volume='+0%'>"
        + renderSsmlBody(options.text, options.pronunciations)
        + '</prosody></voice></speak>';
}
/** 生成带时间戳与路径的协议消息头。 */
function protocolHeader(path, extra) {
    const lines = ['X-Timestamp:' + new Date().toISOString()];
    for (const [key, value] of Object.entries(extra))
        lines.push(key + ':' + value);
    lines.push('Path:' + path);
    return lines.join('\r\n') + '\r\n\r\n';
}
/** 从 metadata JSON 文本帧中提取句/词边界字幕。 */
function parseMetadataCues(data, cues) {
    const sepIndex = data.indexOf('\r\n\r\n');
    if (sepIndex === -1)
        return;
    const body = data.slice(sepIndex + 4).trim();
    if (body === '')
        return;
    let parsed;
    try {
        parsed = JSON.parse(body);
    }
    catch {
        return;
    }
    for (const item of parsed.Metadata ?? []) {
        if (item.Type !== 'SentenceBoundary' && item.Type !== 'WordBoundary')
            continue;
        const offset = Number(item.Data?.Offset ?? 0);
        const duration = Number(item.Data?.Duration ?? 0);
        const text = item.Data?.text?.Text ?? '';
        if (!Number.isFinite(offset) || !Number.isFinite(duration) || text === '')
            continue;
        const startMs = Math.round(offset / 10000);
        const endMs = Math.round((offset + duration) / 10000);
        cues.push({ index: cues.length + 1, startMs, endMs, text });
    }
}
async function runSynthesisAttempt(options, factory, nowSeconds, attemptTimeoutMs, totalTimeoutMs, abortSignal, canRetryOn403) {
    const token = generateSecMsGec(nowSeconds);
    // 对齐 edge-tts 当前协议：Sec-MS-GEC 走 URL 查询参数，MUID 走 header
    const url = WS_BASE + '?TrustedClientToken=' + TRUSTED_CLIENT_TOKEN + '&ConnectionId=' + randomUUID().replace(/-/g, '') + '&Sec-MS-GEC=' + token + '&Sec-MS-GEC-Version=' + SEC_MS_GEC_VERSION;
    const socket = factory(url, {
        headers: { ...WSS_HEADERS, Cookie: 'muid=' + randomBytes(16).toString('hex').toUpperCase() + ';' },
    });
    const chunks = [];
    const cues = [];
    let done = false;
    await new Promise((resolvePromise, reject) => {
        const canListen = typeof abortSignal?.addEventListener === 'function';
        let settled = false;
        let timer;
        let onAbort = () => { };
        // 先结算再关 socket：即使 socket.close() 同步触发 close 事件，取消原因也不会被通用错误覆盖。
        const fail = (error) => {
            if (settled)
                return;
            settled = true;
            if (timer !== undefined)
                clearTimeout(timer);
            if (canListen)
                abortSignal.removeEventListener('abort', onAbort);
            reject(error);
        };
        const finish = () => {
            if (settled)
                return;
            settled = true;
            if (timer !== undefined)
                clearTimeout(timer);
            if (canListen)
                abortSignal.removeEventListener('abort', onAbort);
            try {
                socket.close();
            }
            catch { /* 忽略 */ }
            resolvePromise();
        };
        onAbort = () => {
            const reason = abortSignal?.reason ?? new Error('语音合成已取消。');
            fail(reason);
            try {
                socket.close();
            }
            catch { /* 忽略 */ }
        };
        timer = setTimeout(() => {
            fail(new Error('语音合成超时（' + totalTimeoutMs + ' 毫秒无完整音频），请重试或检查网络。'));
            try {
                socket.close();
            }
            catch { /* 忽略 */ }
        }, attemptTimeoutMs);
        if (canListen)
            abortSignal.addEventListener('abort', onAbort, { once: true });
        if (abortSignal?.aborted === true) {
            onAbort();
            return;
        }
        if (typeof socket.on === 'function') {
            socket.on('unexpected-response', (_req, res) => {
                const status = res?.statusCode;
                if (status === 403 && canRetryOn403) {
                    const rawDate = res.headers?.date ?? res.headers?.Date;
                    const dateStr = Array.isArray(rawDate) ? rawDate[0] : rawDate;
                    const serverSeconds = typeof dateStr === 'string' ? Date.parse(dateStr) / 1000 : Number.NaN;
                    if (Number.isFinite(serverSeconds)) {
                        clockSkewSeconds = serverSeconds - Date.now() / 1000;
                        try {
                            res.resume?.();
                        }
                        catch { /* 忽略 */ }
                        fail(new ClockSkewRetrySignal());
                        try {
                            socket.close();
                        }
                        catch { /* 忽略 */ }
                        return;
                    }
                }
                try {
                    res?.resume?.();
                }
                catch { /* 忽略 */ }
                fail(new Error(status === 403
                    ? 'edge-tts 服务端返回 HTTP 403（请求被拒绝或本机时钟偏差过大）。'
                    : 'edge-tts 握手失败（HTTP ' + String(status ?? 'unknown') + '）。'));
                try {
                    socket.close();
                }
                catch { /* 忽略 */ }
            });
        }
        socket.addEventListener('open', () => {
            const sentenceBoundaryEnabled = options.boundary === 'sentence' ? 'true' : 'false';
            const wordBoundaryEnabled = options.boundary === 'word' ? 'true' : 'false';
            const config = protocolHeader('speech.config', { 'Content-Type': 'application/json; charset=utf-8' })
                + JSON.stringify({
                    context: {
                        synthesis: {
                            audio: {
                                metadataoptions: { sentenceBoundaryEnabled, wordBoundaryEnabled },
                                outputFormat: OUTPUT_FORMAT,
                            },
                        },
                    },
                });
            const ssml = protocolHeader('ssml', { 'Content-Type': 'application/ssml+xml', 'X-RequestId': randomUUID() }) + buildSsml(options);
            try {
                socket.send(config);
                socket.send(ssml);
            }
            catch (error) {
                fail(error instanceof Error ? error : new Error(String(error)));
            }
        });
        socket.addEventListener('message', (event) => {
            const data = event.data;
            if (typeof data === 'string') {
                if (data.includes('Path:audio.metadata')) {
                    parseMetadataCues(data, cues);
                    return;
                }
                if (data.includes('Path:turn.end')) {
                    if (chunks.length === 0) {
                        fail(new Error('合成结束但没有收到音频数据（服务端可能拒绝了请求）。'));
                    }
                    else if (!done) {
                        done = true;
                        finish();
                    }
                }
                return;
            }
            // 二进制帧：2 字节大端头长 + 头文本 + 音频数据；只收 Path:audio 帧避免非音频头污染 MP3 流
            const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data);
            if (buffer.length > 2) {
                const headerLength = buffer.readUInt16BE(0);
                if (buffer.length > 2 + headerLength) {
                    const header = buffer.subarray(2, 2 + headerLength).toString('utf8');
                    if (/(?:^|\r?\n)Path:audio(?:\r?\n|$)/.test(header)) {
                        chunks.push(buffer.subarray(2 + headerLength));
                    }
                }
            }
        });
        socket.addEventListener('error', () => {
            fail(new Error('edge-tts WebSocket 连接失败。若网络需要特殊代理（梯子），请在 DSH「设置 → 插件 → 语音」配置 proxyUrl（保存即生效）。'));
        });
        socket.addEventListener('close', () => {
            if (!done) {
                fail(new Error('edge-tts 连接在收到完整音频前关闭（未收到 turn.end）。'));
            }
        });
    });
    const audio = Buffer.concat(chunks);
    if (audio.length === 0)
        throw new Error('合成结果为空。');
    return { audio, cues };
}
/**
 * 合成语音并可选返回句/词级边界字幕时间轴。
 * 收到 HTTP 403 且响应带有效 Date 头时自动校准时钟偏差并单次重试。
 * @throws 文本为空/超长 / 连接失败 / 超时 / 无音频数据时抛中文错误。
 */
export async function synthesizeSpeechWithMetadata(options, deps = {}, timeoutMs = 30000, signal) {
    const abortSignal = signal ?? deps.signal;
    if (abortSignal?.aborted === true)
        throw abortSignal.reason;
    if (options.text.trim() === '')
        throw new Error('要合成的文本为空。');
    if (options.text.length > 5000)
        throw new Error('文本过长（超过 5000 字符），请分段合成。');
    const factory = deps.webSocketFactory ?? (deps.proxyUrl !== undefined && deps.proxyUrl !== '' ? proxyWebSocket(deps.proxyUrl) : directWebSocket);
    const startedAt = Date.now();
    const now = () => (deps.nowSeconds ? deps.nowSeconds() : Date.now() / 1000 + clockSkewSeconds);
    try {
        return await runSynthesisAttempt(options, factory, now(), timeoutMs, timeoutMs, abortSignal, true);
    }
    catch (error) {
        if (!(error instanceof ClockSkewRetrySignal))
            throw error;
        if (abortSignal?.aborted === true)
            throw abortSignal.reason;
        const remainingMs = timeoutMs - (Date.now() - startedAt);
        if (remainingMs <= 0) {
            throw new Error('语音合成超时（' + timeoutMs + ' 毫秒无完整音频），请重试或检查网络。');
        }
        return await runSynthesisAttempt(options, factory, now(), remainingMs, timeoutMs, abortSignal, false);
    }
}
/**
 * 合成语音，返回 MP3 字节。
 * @throws 文本为空/超长 / 连接失败 / 超时 / 无音频数据时抛中文错误。
 */
export async function synthesizeSpeech(options, deps = {}, timeoutMs = 30000, signal) {
    const result = await synthesizeSpeechWithMetadata(options, deps, timeoutMs, signal);
    return result.audio;
}
let cachedEdgeVoices;
/** 重置 Edge 在线音色内存缓存（测试专用）。 */
export function resetEdgeVoicesCacheForTest() {
    cachedEdgeVoices = undefined;
}
function throwIfAborted(signal) {
    if (signal?.aborted === true)
        throw signal.reason;
}
function raceAbortSignal(value, signal) {
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
function collectLowercaseTags(builtinTags, voiceTag) {
    const tagSet = new Set();
    const pushAll = (items) => {
        if (!Array.isArray(items))
            return;
        for (const item of items) {
            if (typeof item !== 'string')
                continue;
            const normalized = item.trim().toLowerCase();
            if (normalized !== '')
                tagSet.add(normalized);
        }
    };
    pushAll(builtinTags);
    pushAll(voiceTag?.ContentCategories);
    pushAll(voiceTag?.VoicePersonalities);
    return Array.from(tagSet);
}
/**
 * 动态拉取微软 Edge 在线全量（300+）音色目录并缓存 24 小时。
 * @throws 请求失败 / 重定向 / 响应异常 / 超时时抛中文错误。
 */
export async function fetchEdgeVoices(deps = {}, timeoutMs = 15000) {
    throwIfAborted(deps.signal);
    if (deps.forceRefresh !== true
        && cachedEdgeVoices !== undefined
        && Date.now() - cachedEdgeVoices.fetchedAtMs < EDGE_VOICES_CACHE_TTL_MS) {
        return cachedEdgeVoices.voices;
    }
    const nowSec = deps.nowSeconds ? deps.nowSeconds() : Date.now() / 1000 + clockSkewSeconds;
    const token = generateSecMsGec(nowSec);
    const url = `${VOICES_LIST_URL}?trustedclienttoken=${TRUSTED_CLIENT_TOKEN}&Sec-MS-GEC=${token}&Sec-MS-GEC-Version=${SEC_MS_GEC_VERSION}`;
    const fetchImpl = deps.fetchImpl ?? globalThis.fetch;
    const timeoutSignal = AbortSignal.timeout(timeoutMs);
    const requestSignal = deps.signal === undefined ? timeoutSignal : AbortSignal.any([timeoutSignal, deps.signal]);
    let response;
    try {
        response = await raceAbortSignal(fetchImpl(url, {
            method: 'GET',
            redirect: 'manual',
            headers: {
                'User-Agent': WSS_HEADERS['User-Agent'],
                Accept: 'application/json',
                'Sec-MS-GEC': token,
                'Sec-MS-GEC-Version': SEC_MS_GEC_VERSION,
            },
            signal: requestSignal,
        }), requestSignal);
    }
    catch (error) {
        throwIfAborted(deps.signal);
        if (timeoutSignal.aborted)
            throw new Error('拉取 Edge 在线音色列表超时，请重试或检查网络。');
        throw new Error('拉取 Edge 在线音色列表失败：' + (error instanceof Error ? error.message : String(error)));
    }
    if (response.status >= 300 && response.status < 400) {
        try {
            await raceAbortSignal(response.body?.cancel(), requestSignal);
        }
        catch { /* 忽略 */ }
        throwIfAborted(deps.signal);
        throw new Error('Edge 在线音色列表返回重定向（HTTP ' + response.status + '），已阻止跳转。');
    }
    if (!response.ok) {
        try {
            await raceAbortSignal(response.body?.cancel(), requestSignal);
        }
        catch { /* 忽略 */ }
        throwIfAborted(deps.signal);
        throw new Error('拉取 Edge 在线音色列表失败：HTTP ' + response.status + '。');
    }
    let rawList;
    try {
        rawList = await raceAbortSignal(response.json(), requestSignal);
    }
    catch (error) {
        throwIfAborted(deps.signal);
        if (timeoutSignal.aborted)
            throw new Error('拉取 Edge 在线音色列表超时，请重试或检查网络。');
        throw new Error('Edge 在线音色列表响应不是合法 JSON：' + (error instanceof Error ? error.message : String(error)));
    }
    if (!Array.isArray(rawList) || rawList.length === 0) {
        throw new Error('Edge 在线音色列表为空或格式异常。');
    }
    const builtinById = new Map(VOICES.map((voice) => [voice.id, voice]));
    const mapped = [];
    for (const entry of rawList) {
        if (typeof entry !== 'object' || entry === null)
            continue;
        const item = entry;
        if (typeof item.ShortName !== 'string' || item.ShortName.trim() === '')
            continue;
        const id = item.ShortName.trim();
        const gender = item.Gender === 'Male' ? 'Male' : 'Female';
        const builtin = builtinById.get(id);
        const localeRaw = typeof item.Locale === 'string' && item.Locale.trim() !== ''
            ? item.Locale.trim()
            : id.split('-').slice(0, 2).join('-');
        const friendlyRaw = typeof item.FriendlyName === 'string' ? item.FriendlyName.trim() : '';
        const locale = builtin !== undefined ? builtin.locale : `${localeRaw}（${friendlyRaw || id}）`;
        const tags = collectLowercaseTags(builtin?.tags, item.VoiceTag);
        mapped.push({ id, gender, locale, tags });
    }
    if (mapped.length === 0) {
        throw new Error('Edge 在线音色列表为空或格式异常。');
    }
    cachedEdgeVoices = { voices: mapped, fetchedAtMs: Date.now() };
    return mapped;
}
