import { EventEmitter } from 'node:events';
import { Readable } from 'node:stream';
import { isLoopbackBaseUrl, isValidProsody, resolveCustomVoice, } from './config.js';
import { fetchEdgeVoices, synthesizeSpeech } from './edge-tts.js';
import { rateToSpeed, synthesizeOpenAiSpeech } from './openai-tts.js';
import { createProxyFetch } from './proxy-fetch.js';
import { hasFfmpeg, transcribe } from './stt.js';
import { DEFAULT_PREVIEW_TEXT } from './tools.js';
import { applyPronunciationsPlain, inspectMp3Buffer } from './tts-text.js';
import { filterVoices, isValidVoiceId, resolvePersona, VOICE_PERSONAS, VOICES } from './voices.js';
export const VOICE_STUDIO_SETTINGS_ROUTE = '/_dsh/dsh-voice/studio';
export const VOICE_STUDIO_API_ROUTE = '/api/dsh-voice/studio';
const AUTHENTICATED_CARRIER = Symbol('DSH authenticated Voice Studio connection');
const MAX_AUDIO_BYTES = 10 * 1024 * 1024;
const MAX_BODY = 16 * 1024 * 1024;
const MAX_PREVIEW_CHARS = 300;
const loopback = (host) => ['127.0.0.1', 'localhost', '::1', '[::1]', '::ffff:127.0.0.1'].includes(host.toLowerCase());
const record = (value) => value && typeof value === 'object' && !Array.isArray(value) ? value : {};
const text = (args, key) => typeof args[key] === 'string' ? args[key].trim() : '';
export class VoiceStudioError extends Error {
    status;
    code;
    constructor(message, status = 400, code = 'invalid') {
        super(message);
        this.status = status;
        this.code = code;
    }
}
function requestGuard(req) {
    const host = req.headers.host;
    if (!host || !loopback(req.socket.remoteAddress ?? '')) {
        throw new VoiceStudioError('Voice Studio 面板仅允许本机访问。', 403, 'local_only');
    }
    let target;
    try {
        target = new URL('http://' + host);
    }
    catch {
        throw new VoiceStudioError('无效的请求地址。', 403);
    }
    if (!loopback(target.hostname) || target.username || target.password || target.pathname !== '/' || target.search || target.hash) {
        throw new VoiceStudioError('Voice Studio 面板仅允许本机访问。', 403, 'local_only');
    }
    const protocol = req.socket.encrypted ? 'https:' : 'http:';
    target.protocol = protocol;
    const origin = req.headers.origin;
    const desktop = origin === 'dsh-app://app' && req.headers['x-dsh-voice'] === '1';
    if (!desktop && ((req.method === 'POST' && !origin) || (origin !== undefined && origin !== target.origin))) {
        throw new VoiceStudioError('请从当前 DSH 设置页面操作。', 403, 'origin');
    }
    if (req.method === 'POST' && !/^application\/json(?:\s*;|$)/i.test(req.headers['content-type'] ?? '')) {
        throw new VoiceStudioError('请求必须使用 JSON。', 415);
    }
}
/** 宿主载体受鉴权后仍校验来源、方法与请求头标记，防止跨站请求。 */
function carrierGuard(request) {
    if (!['GET', 'POST'].includes(request.method)) {
        throw new VoiceStudioError('仅支持 GET 和 POST。', 405, 'method');
    }
    if (request.headers.get('x-dsh-voice') !== '1') {
        throw new VoiceStudioError('请从当前 DSH 设置页面操作。', 403, 'origin');
    }
    const site = request.headers.get('sec-fetch-site');
    if (site && !['same-origin', 'none'].includes(site)) {
        throw new VoiceStudioError('请从当前 DSH 设置页面操作。', 403, 'origin');
    }
    const origin = request.headers.get('origin');
    if (origin && origin !== 'dsh-app://app') {
        try {
            const source = new URL(origin);
            const expectedHost = request.headers.get('host') || new URL(request.url).host;
            if (!['http:', 'https:'].includes(source.protocol) ||
                source.username ||
                source.password ||
                source.origin !== origin ||
                source.host !== expectedHost) {
                throw new Error('origin mismatch');
            }
        }
        catch {
            throw new VoiceStudioError('请从当前 DSH 设置页面操作。', 403, 'origin');
        }
    }
    if (request.method === 'POST' &&
        request.headers.get('content-type')?.split(';')[0].trim().toLowerCase() !== 'application/json') {
        throw new VoiceStudioError('请求必须使用 JSON。', 415);
    }
}
function readBody(req, signal) {
    return new Promise((resolve, reject) => {
        let length = 0;
        const chunks = [];
        const cleanup = () => {
            req.off('data', data);
            req.off('end', end);
            req.off('error', error);
            signal.removeEventListener('abort', abort);
        };
        const fail = (reason) => {
            cleanup();
            reject(reason);
        };
        const data = (chunk) => {
            length += chunk.length;
            if (length > MAX_BODY) {
                chunks.length = 0;
                fail(new VoiceStudioError('请求体超过 16 MiB 上限。', 413, 'bodyLarge'));
                req.resume();
            }
            else {
                chunks.push(chunk);
            }
        };
        const error = (reason) => fail(reason);
        const abort = () => fail(signal.reason);
        const end = () => {
            cleanup();
            try {
                const value = JSON.parse(Buffer.concat(chunks).toString('utf8'));
                if (!value || typeof value !== 'object' || Array.isArray(value))
                    throw new Error();
                resolve(value);
            }
            catch {
                reject(new VoiceStudioError('请求内容不是有效的 JSON。'));
            }
        };
        if (signal.aborted) {
            abort();
            return;
        }
        req.on('data', data);
        req.on('end', end);
        req.on('error', error);
        signal.addEventListener('abort', abort, { once: true });
    });
}
function readPronunciations(cfg) {
    const raw = cfg.pronunciations;
    if (!Array.isArray(raw))
        return [];
    const out = [];
    for (const item of raw) {
        if (!item || typeof item !== 'object')
            continue;
        const rec = item;
        const word = typeof rec.word === 'string' ? rec.word.trim() : '';
        const alias = typeof rec.alias === 'string' ? rec.alias.trim() : '';
        if (word !== '' && alias !== '')
            out.push({ word, alias });
    }
    return out;
}
function sanitizeCustomVoicesPatch(raw) {
    if (!Array.isArray(raw)) {
        throw new VoiceStudioError('customVoices 必须是数组。', 400);
    }
    const out = [];
    for (let i = 0; i < raw.length; i++) {
        const item = record(raw[i]);
        const name = text(item, 'name');
        if (!name) {
            throw new VoiceStudioError(`customVoices[${i}].name 不能为空。`, 400);
        }
        const entry = { name };
        const voice = text(item, 'voice');
        if (voice)
            entry.voice = voice;
        const persona = text(item, 'persona');
        if (persona)
            entry.persona = persona;
        const rate = text(item, 'rate');
        if (rate) {
            if (!isValidProsody(rate)) {
                throw new VoiceStudioError(`customVoices[${i}].rate 格式不合法（如 +0%、+15%、-10%）。`, 400);
            }
            entry.rate = rate;
        }
        const pitch = text(item, 'pitch');
        if (pitch) {
            if (!isValidProsody(pitch)) {
                throw new VoiceStudioError(`customVoices[${i}].pitch 格式不合法（如 +0Hz、+2Hz、-1st）。`, 400);
            }
            entry.pitch = pitch;
        }
        const instructions = text(item, 'instructions');
        if (instructions)
            entry.instructions = instructions;
        const referenceAudio = text(item, 'referenceAudio');
        if (referenceAudio)
            entry.referenceAudio = referenceAudio;
        const referenceText = text(item, 'referenceText');
        if (referenceText)
            entry.referenceText = referenceText;
        out.push(entry);
    }
    return out;
}
function sanitizePronunciationsPatch(raw) {
    if (!Array.isArray(raw)) {
        throw new VoiceStudioError('pronunciations 必须是数组。', 400);
    }
    const out = [];
    const seen = new Set();
    for (let i = 0; i < raw.length; i++) {
        const item = record(raw[i]);
        const word = text(item, 'word');
        const alias = text(item, 'alias');
        if (!word || !alias) {
            throw new VoiceStudioError(`pronunciations[${i}] 的 word 与 alias 均不能为空。`, 400);
        }
        const key = word.toLowerCase();
        if (!seen.has(key)) {
            seen.add(key);
            out.push({ word, alias });
        }
    }
    return out;
}
function sanitizeConfigPatch(rawPatch) {
    const raw = record(rawPatch);
    const sanitized = {};
    if ('ttsVoice' in raw) {
        const ttsVoice = text(raw, 'ttsVoice');
        if (!ttsVoice)
            throw new VoiceStudioError('ttsVoice 不能为空。', 400);
        sanitized.ttsVoice = ttsVoice;
    }
    if ('ttsRate' in raw) {
        const ttsRate = text(raw, 'ttsRate');
        if (!isValidProsody(ttsRate)) {
            throw new VoiceStudioError('ttsRate 格式不合法（如 +0%、+15%、-10%）。', 400);
        }
        sanitized.ttsRate = ttsRate;
    }
    if ('ttsPitch' in raw) {
        const ttsPitch = text(raw, 'ttsPitch');
        if (!isValidProsody(ttsPitch)) {
            throw new VoiceStudioError('ttsPitch 格式不合法（如 +0Hz、+2Hz、-1st）。', 400);
        }
        sanitized.ttsPitch = ttsPitch;
    }
    if ('ttsEngine' in raw) {
        const ttsEngine = text(raw, 'ttsEngine');
        if (!['edge', 'openai', 'siliconflow', 'custom'].includes(ttsEngine)) {
            throw new VoiceStudioError('ttsEngine 不合法。', 400);
        }
        sanitized.ttsEngine = ttsEngine;
    }
    if ('asrEngine' in raw) {
        const asrEngine = text(raw, 'asrEngine');
        if (!['groq', 'openai', 'siliconflow', 'custom'].includes(asrEngine)) {
            throw new VoiceStudioError('asrEngine 不合法。', 400);
        }
        sanitized.asrEngine = asrEngine;
    }
    if ('overwrite' in raw) {
        if (typeof raw.overwrite !== 'boolean') {
            throw new VoiceStudioError('overwrite 必须是布尔值。', 400);
        }
        sanitized.overwrite = raw.overwrite;
    }
    if ('customVoices' in raw) {
        sanitized.customVoices = sanitizeCustomVoicesPatch(raw.customVoices);
    }
    if ('pronunciations' in raw) {
        sanitized.pronunciations = sanitizePronunciationsPatch(raw.pronunciations);
    }
    if (Object.keys(sanitized).length === 0) {
        throw new VoiceStudioError('未提供可保存的有效配置项。', 400);
    }
    return sanitized;
}
export function createVoiceStudioBackend(readCfg, options = {}) {
    let cachedProxyUrl = '';
    let cachedFetchImpl;
    const getProxyFetch = (proxyUrl) => {
        if (proxyUrl === '')
            return undefined;
        if (cachedFetchImpl === undefined || cachedProxyUrl !== proxyUrl) {
            cachedProxyUrl = proxyUrl;
            cachedFetchImpl = createProxyFetch(proxyUrl);
        }
        return cachedFetchImpl;
    };
    const writable = () => options.writable !== undefined ? options.writable() !== false : typeof options.updateSettings === 'function';
    const snapshot = () => {
        const cfg = readCfg();
        const pronunciations = readPronunciations(cfg);
        const hasTtsKey = cfg.ttsApiKey !== '';
        const hasAsrKey = cfg.asrApiKey !== '' || (cfg.asrEngine === 'custom' && cfg.asrBaseUrl !== '' && isLoopbackBaseUrl(cfg.asrBaseUrl));
        const hasProxy = cfg.proxyUrl !== '';
        const ttsReady = cfg.ttsEngine === 'edge' ||
            (cfg.ttsBaseUrl !== '' && (cfg.ttsApiKey !== '' || isLoopbackBaseUrl(cfg.ttsBaseUrl)));
        const sttReady = cfg.asrBaseUrl !== '' && hasAsrKey;
        return {
            ttsEngine: cfg.ttsEngine,
            ttsVoice: cfg.ttsVoice,
            ttsRate: cfg.ttsRate,
            ttsPitch: cfg.ttsPitch,
            ttsModel: cfg.ttsModel,
            hasTtsKey,
            asrEngine: cfg.asrEngine,
            asrModel: cfg.asrModel,
            hasAsrKey,
            hasProxy,
            overwrite: cfg.overwrite,
            customVoices: cfg.customVoices,
            pronunciations,
            voices: VOICES,
            personas: VOICE_PERSONAS,
            writable: writable(),
            hasFfmpeg: hasFfmpeg(),
            ttsReady,
            sttReady,
        };
    };
    async function dispatch(args, signal) {
        const action = text(args, 'action');
        const cfg = readCfg();
        if (action === 'voices') {
            const online = args.online === true;
            const locale = text(args, 'locale') || undefined;
            const gender = text(args, 'gender') || undefined;
            const tag = text(args, 'tag') || undefined;
            let sourceVoices = VOICES;
            let source = 'builtin';
            let fallbackReason = '';
            if (online) {
                try {
                    const fetchVoicesFn = options.fetchVoices ?? fetchEdgeVoices;
                    const fetched = await fetchVoicesFn({ fetchImpl: getProxyFetch(cfg.proxyUrl) ?? globalThis.fetch, signal }, cfg.timeoutMs);
                    signal.throwIfAborted();
                    if (Array.isArray(fetched) && fetched.length > 0) {
                        sourceVoices = fetched;
                        source = 'edge-online';
                    }
                    else {
                        source = 'builtin-fallback';
                        fallbackReason = '在线音色目录返回为空';
                    }
                }
                catch (error) {
                    signal.throwIfAborted();
                    source = 'builtin-fallback';
                    fallbackReason = error instanceof Error ? error.message : String(error);
                }
            }
            const voices = locale || gender || tag ? filterVoices({ locale, gender, tag }, sourceVoices) : sourceVoices;
            return {
                voices,
                source,
                ...(fallbackReason !== '' ? { fallbackReason } : {}),
            };
        }
        if (action === 'preview') {
            const rawText = typeof args.text === 'string' ? args.text.trim() : '';
            const previewText = rawText !== '' ? rawText : DEFAULT_PREVIEW_TEXT;
            if (previewText.length > MAX_PREVIEW_CHARS) {
                throw new VoiceStudioError(`试听文本不能超过 ${MAX_PREVIEW_CHARS} 个字符。`, 400, 'textTooLong');
            }
            const rawVoice = text(args, 'voice') || undefined;
            const rawPersona = text(args, 'persona') || undefined;
            const rawRate = text(args, 'rate') || undefined;
            const rawPitch = text(args, 'pitch') || undefined;
            const rawInstructions = text(args, 'instructions') || undefined;
            let customAlias;
            let voiceConsumedAsAlias = false;
            let personaConsumedAsAlias = false;
            if (rawPersona !== undefined) {
                customAlias = resolveCustomVoice(cfg.customVoices, rawPersona);
                if (customAlias !== undefined)
                    personaConsumedAsAlias = true;
            }
            if (customAlias === undefined && rawVoice !== undefined) {
                customAlias = resolveCustomVoice(cfg.customVoices, rawVoice);
                if (customAlias !== undefined)
                    voiceConsumedAsAlias = true;
            }
            let defaultAlias;
            if (rawVoice === undefined && rawPersona === undefined) {
                defaultAlias = resolveCustomVoice(cfg.customVoices, cfg.ttsVoice);
            }
            const activeAlias = customAlias ?? defaultAlias;
            let voiceConsumedAsPersona = false;
            let personaSpec = !personaConsumedAsAlias && rawPersona !== undefined ? resolvePersona(rawPersona) : undefined;
            if (personaSpec === undefined && activeAlias?.persona !== undefined) {
                personaSpec = resolvePersona(activeAlias.persona);
            }
            if (personaSpec === undefined && !voiceConsumedAsAlias && rawVoice !== undefined && !isValidVoiceId(rawVoice)) {
                personaSpec = resolvePersona(rawVoice);
                if (personaSpec !== undefined)
                    voiceConsumedAsPersona = true;
            }
            let defaultPersona;
            if (rawVoice === undefined && rawPersona === undefined && activeAlias === undefined && !isValidVoiceId(cfg.ttsVoice)) {
                defaultPersona = resolvePersona(cfg.ttsVoice);
            }
            const activePersona = personaSpec ?? defaultPersona;
            const explicitRawVoice = !voiceConsumedAsAlias && !voiceConsumedAsPersona ? rawVoice : undefined;
            const resolvedVoice = explicitRawVoice ?? activeAlias?.voice ?? activePersona?.voice ?? cfg.ttsVoice;
            const resolvedRate = rawRate ?? activeAlias?.rate ?? activePersona?.rate ?? cfg.ttsRate;
            const resolvedPitch = rawPitch ?? activeAlias?.pitch ?? activePersona?.pitch ?? cfg.ttsPitch;
            const resolvedInstructions = rawInstructions ?? activeAlias?.instructions;
            if (!isValidProsody(resolvedRate)) {
                throw new VoiceStudioError('语速格式不合法（如 +0%、+15%、-10%）。', 400);
            }
            if (!isValidProsody(resolvedPitch)) {
                throw new VoiceStudioError('音调格式不合法（如 +0Hz、+2Hz、-1st）。', 400);
            }
            const useEdge = options.tts !== undefined
                ? true
                : options.openaiTts !== undefined && cfg.ttsEngine !== 'edge'
                    ? false
                    : cfg.ttsEngine === 'edge';
            const pronunciations = readPronunciations(cfg);
            let audio;
            if (useEdge) {
                if (!isValidVoiceId(resolvedVoice)) {
                    throw new VoiceStudioError('音色 ID 不合法：' + resolvedVoice, 400);
                }
                const ttsFn = options.tts ?? synthesizeSpeech;
                const ttsOpts = {
                    text: previewText,
                    voice: resolvedVoice,
                    rate: resolvedRate,
                    pitch: resolvedPitch,
                    ...(pronunciations.length > 0 ? { pronunciations } : {}),
                };
                audio = await ttsFn(ttsOpts, { proxyUrl: cfg.proxyUrl }, cfg.timeoutMs, signal);
            }
            else {
                if (cfg.ttsBaseUrl === '') {
                    throw new VoiceStudioError('未配置 TTS 接口地址（ttsBaseUrl）。', 400, 'config');
                }
                if (cfg.ttsApiKey === '' && !isLoopbackBaseUrl(cfg.ttsBaseUrl)) {
                    throw new VoiceStudioError('未配置 TTS 密钥（ttsApiKey）。', 400, 'config');
                }
                if (resolvedVoice.trim() === '') {
                    throw new VoiceStudioError('音色 ID 不能为空。', 400);
                }
                const spokenText = pronunciations.length > 0 ? applyPronunciationsPlain(previewText, pronunciations) : previewText;
                const openaiFn = options.openaiTts ?? synthesizeOpenAiSpeech;
                audio = await openaiFn(cfg.ttsBaseUrl, cfg.ttsApiKey, {
                    text: spokenText,
                    voice: resolvedVoice,
                    model: cfg.ttsModel !== '' ? cfg.ttsModel : 'gpt-4o-mini-tts',
                    speed: rateToSpeed(resolvedRate),
                    ...(resolvedInstructions ? { instructions: resolvedInstructions } : {}),
                    signal,
                }, getProxyFetch(cfg.proxyUrl) ?? globalThis.fetch, cfg.timeoutMs, signal);
            }
            const info = inspectMp3Buffer(audio);
            return {
                preview: {
                    audioBase64: audio.toString('base64'),
                    mime: 'audio/mpeg',
                    bytes: audio.length,
                    durationMs: info.durationMs,
                    durationSec: Math.round(info.durationMs / 100) / 10,
                    voice: resolvedVoice,
                },
            };
        }
        if (action === 'transcribeMic') {
            const rawB64 = typeof args.audioBase64 === 'string' ? args.audioBase64.trim() : '';
            const cleanedB64 = rawB64.replace(/^data:[^;]+;base64,/i, '');
            if (!cleanedB64) {
                throw new VoiceStudioError('请提供录音音频数据（audioBase64）。', 400);
            }
            const audioBuf = Buffer.from(cleanedB64, 'base64');
            if (audioBuf.length === 0) {
                throw new VoiceStudioError('录音音频数据为空或格式无效。', 400);
            }
            if (audioBuf.length > MAX_AUDIO_BYTES) {
                throw new VoiceStudioError('录音音频超过 10 MiB 上限。', 413, 'bodyLarge');
            }
            const rawFilename = text(args, 'filename');
            const filename = (rawFilename || 'mic-recording.webm').replace(/[/\\]/g, '_');
            const language = text(args, 'language') || undefined;
            const prompt = text(args, 'prompt') || undefined;
            const sttFn = options.stt ?? transcribe;
            const res = await sttFn(cfg.asrBaseUrl, cfg.asrApiKey, {
                audio: audioBuf,
                filename,
                model: cfg.asrModel !== '' ? cfg.asrModel : 'whisper-1',
                ...(language ? { language } : {}),
                ...(prompt ? { prompt } : {}),
                allowEmptyApiKey: cfg.asrEngine === 'custom' && isLoopbackBaseUrl(cfg.asrBaseUrl),
                signal,
            }, getProxyFetch(cfg.proxyUrl) ?? globalThis.fetch, cfg.timeoutMs, signal);
            return {
                transcript: {
                    text: res.text,
                    ...(res.language !== undefined ? { language: res.language } : {}),
                    ...(res.duration !== undefined ? { duration: res.duration } : {}),
                },
            };
        }
        if (action === 'updateConfig') {
            if (!writable() || typeof options.updateSettings !== 'function') {
                throw new VoiceStudioError('当前配置是只读的，无法保存设置。', 403, 'readonly');
            }
            const sanitizedPatch = sanitizeConfigPatch(args.patch);
            await options.updateSettings(sanitizedPatch);
            return { saved: Object.keys(sanitizedPatch) };
        }
        throw new VoiceStudioError('未知的操作。', 400);
    }
    return {
        snapshot,
        /** 仅由宿主已鉴权的 connection.fetch 路由调用。 */
        async fetch(request) {
            try {
                carrierGuard(request);
            }
            catch (error) {
                return new Response(JSON.stringify({
                    error: error instanceof Error ? error.message : String(error),
                    code: error instanceof VoiceStudioError ? error.code : 'invalid',
                }), {
                    status: error instanceof VoiceStudioError ? error.status : 400,
                    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
                });
            }
            request.signal.throwIfAborted();
            const req = (request.body ? Readable.fromWeb(request.body) : Readable.from([]));
            req.method = request.method;
            req.headers = Object.fromEntries(request.headers);
            const headers = new Headers();
            let status = 200;
            let bytes = Buffer.alloc(0);
            const res = Object.assign(new EventEmitter(), {
                destroyed: false,
                writableFinished: false,
                setHeader(name, value) {
                    headers.set(name, value);
                },
                writeHead(value, entries) {
                    status = value;
                    for (const [name, entry] of Object.entries(entries || {}))
                        headers.set(name, entry);
                },
                end(value) {
                    bytes = Buffer.from(value);
                    this.writableFinished = true;
                },
            });
            const abort = () => req.emit('aborted');
            request.signal.addEventListener('abort', abort, { once: true });
            try {
                await this.handle(req, res, AUTHENTICATED_CARRIER);
            }
            finally {
                request.signal.removeEventListener('abort', abort);
                req.destroy();
            }
            request.signal.throwIfAborted();
            return new Response(new Uint8Array(bytes), { status, headers });
        },
        async handle(req, res, transport) {
            const controller = new AbortController();
            const abort = () => {
                if (!res.writableFinished)
                    controller.abort(new Error('请求已取消'));
            };
            req.on('aborted', abort);
            res.on('close', abort);
            const send = (status, value) => {
                if (res.destroyed)
                    return;
                res.writeHead(status, {
                    'Content-Type': 'application/json; charset=utf-8',
                    'Cache-Control': 'no-store',
                    'X-Content-Type-Options': 'nosniff',
                });
                res.end(JSON.stringify(value));
            };
            try {
                if (transport !== AUTHENTICATED_CARRIER)
                    requestGuard(req);
                if (req.method === 'GET') {
                    send(200, { snapshot: snapshot() });
                }
                else if (req.method === 'POST') {
                    const result = await dispatch(await readBody(req, controller.signal), controller.signal);
                    send(200, { ...result, snapshot: snapshot() });
                }
                else {
                    res.setHeader('Allow', 'GET, POST');
                    send(405, { error: '仅支持 GET 和 POST。', code: 'method' });
                }
            }
            catch (error) {
                if (!controller.signal.aborted) {
                    let state;
                    try {
                        state = snapshot();
                    }
                    catch {
                        /* 忽略 snapshot 读取异常，避免掩盖原始错误。 */
                    }
                    send(error instanceof VoiceStudioError ? error.status : 400, {
                        error: error instanceof Error ? error.message : String(error),
                        code: error instanceof VoiceStudioError ? error.code : 'invalid',
                        snapshot: state,
                    });
                }
            }
            finally {
                req.off('aborted', abort);
                res.off('close', abort);
            }
        },
    };
}
export function installVoiceStudioWeb(ctx, readCfg, deps = {}) {
    let updateSettings = deps.updateSettings;
    let isHostWritable;
    const backend = createVoiceStudioBackend(readCfg, {
        ...deps,
        writable: deps.writable ??
            (() => typeof updateSettings === 'function' && (isHostWritable ? isHostWritable() : true)),
        updateSettings: (patch) => {
            if (typeof updateSettings !== 'function' || (isHostWritable && !isHostWritable())) {
                return Promise.reject(new VoiceStudioError('当前配置是只读的，无法保存设置。', 403, 'readonly'));
            }
            return updateSettings(patch);
        },
    });
    if (typeof ctx.inject !== 'function')
        return backend;
    if (!deps.updateSettings) {
        try {
            ctx.inject(['settings'], (host) => {
                const rawId = ctx.fiber?.entry?.options?.id;
                const pluginId = typeof rawId === 'string' && rawId.trim() !== '' ? rawId.trim() : 'voice';
                if (typeof host?.settings?.update === 'function') {
                    const setFn = (patch) => host.settings.update(pluginId, patch);
                    const checkWritable = () => host.settings?.writable !== false;
                    updateSettings = setFn;
                    isHostWritable = checkWritable;
                    if (typeof host.effect === 'function') {
                        host.effect(() => () => {
                            if (updateSettings === setFn)
                                updateSettings = undefined;
                            if (isHostWritable === checkWritable)
                                isHostWritable = undefined;
                        }, 'dsh-voice: settings binding');
                    }
                }
            });
        }
        catch {
            /* 宿主未提供 settings 服务时回退只读状态。 */
        }
    }
    ctx.inject(['connection'], (host) => {
        const mount = () => host.connection?.fetch?.register?.({
            path: VOICE_STUDIO_API_ROUTE,
            methods: ['GET', 'POST'],
            requestBody: 'buffered',
            fetch: (request) => backend.fetch(request),
        });
        if (typeof host?.effect === 'function') {
            host.effect(() => {
                const off = mount();
                return typeof off === 'function' ? off : undefined;
            }, 'dsh-voice: studio api route');
        }
        else {
            mount();
        }
    });
    ctx.inject(['webServer'], (webCtx) => {
        if (!webCtx?.webServer?.register)
            return;
        const mount = () => webCtx.webServer.register({
            kind: 'exact',
            path: VOICE_STUDIO_SETTINGS_ROUTE,
            handler: (req, res) => backend.handle(req, res),
        });
        if (typeof webCtx.effect === 'function') {
            webCtx.effect(() => mount(), 'dsh-voice: studio settings route');
        }
        else {
            mount();
        }
    });
    return backend;
}
