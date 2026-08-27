/**
 * 五个面向模型的语音工具：voice_tts / voice_stt / voice_list / voice_preview。
 *
 * @module dsh-voice/tools
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';
import { synthesizeSpeech } from './edge-tts.js';
import { assertAudioFile, resolveOutputPath } from './paths.js';
import { createProxyFetch } from './proxy-fetch.js';
import { transcribe } from './stt.js';
import { isValidVoiceId, VOICES } from './voices.js';
function compileParameters(spec) {
    const properties = {};
    const required = [];
    for (const [key, prop] of Object.entries(spec)) {
        if (prop?.required === true)
            required.push(key);
        const node = {};
        if (typeof prop?.type === 'string')
            node.type = prop.type;
        if (typeof prop?.description === 'string')
            node.description = prop.description;
        properties[key] = node;
    }
    return { type: 'object', properties, ...(required.length > 0 ? { required } : {}) };
}
function asRecord(value) {
    return typeof value === 'object' && value !== null ? value : {};
}
function optionalString(args, key) {
    const value = args[key];
    return typeof value === 'string' && value.trim() !== '' ? value.trim() : undefined;
}
function requiredString(args, key, label) {
    const value = optionalString(args, key);
    if (value === undefined)
        throw new Error(label + '（参数 ' + key + '）为必填，请提供非空字符串。');
    return value;
}
const voiceItemSchema = {
    type: 'object',
    properties: { id: { type: 'string' }, gender: { type: 'string' }, locale: { type: 'string' } },
    additionalProperties: true,
};
const listSchema = {
    type: 'object',
    properties: { count: { type: 'integer' }, voices: { type: 'array', items: voiceItemSchema } },
    additionalProperties: true,
};
const ttsSchema = {
    type: 'object',
    properties: {
        output: { type: 'string' },
        bytes: { type: 'integer' },
        voice: { type: 'string' },
        rate: { type: 'string' },
        pitch: { type: 'string' },
        textLength: { type: 'integer' },
    },
    additionalProperties: true,
};
const sttSchema = {
    type: 'object',
    properties: {
        text: { type: 'string' },
        model: { type: 'string' },
        language: { type: 'string' },
        audio: { type: 'string' },
        transcriptFile: { type: 'string' },
    },
    additionalProperties: true,
};
const previewSchema = {
    type: 'object',
    properties: {
        count: { type: 'integer' },
        samples: { type: 'array', items: { type: 'object', additionalProperties: true } },
        failed: { type: 'array', items: { type: 'object', additionalProperties: true } },
        text: { type: 'string' },
    },
    additionalProperties: true,
};
/** 默认试听文本（中英混合，便于感知发音差异）。 */
export const DEFAULT_PREVIEW_TEXT = '你好，这是音色试听。Hello, this is a voice preview.';
/**
 * 构建三个工具定义。
 */
export function buildVoiceTools(config, deps = {}) {
    const cfg = config;
    const fetchImpl = cfg.proxyUrl !== '' ? createProxyFetch(cfg.proxyUrl) : undefined;
    const timeout = cfg.timeoutMs;
    const voiceList = {
        name: 'voice_list',
        description: '列出常用语音合成音色（edge-tts 微软神经语音，免费）。含普通话/方言/粤语/英/日/韩/法/德/俄/西。voice_tts 的 voice 参数也接受清单外的合法 edge 音色 id（如 zh-CN-XXXNeural）。',
        parameters: compileParameters({}),
        output: {
            schema: listSchema,
            render: (_args, value) => {
                const rec = asRecord(value);
                const voices = Array.isArray(rec.voices) ? rec.voices : [];
                const lines = ['共 ' + voices.length + ' 个常用音色：'];
                for (const voice of voices) {
                    const v = asRecord(voice);
                    lines.push('- ' + v.id + '（' + v.locale + '）');
                }
                return [{ type: 'text', text: lines.join('\n') }];
            },
        },
        async execute() {
            return { count: VOICES.length, voices: VOICES };
        },
    };
    const voiceTts = {
        name: 'voice_tts',
        description: '文字转语音：调用 edge-tts（微软 Edge 朗读服务，免费）合成 MP3。text 必填（≤5000 字符，更长请分段）；voice 可选（默认 zh-CN-XiaoxiaoNeural，清单见 voice_list）；rate/pitch 如 +10%、-2Hz；输出默认 voice_output.mp3（同名自动加序号）。',
        parameters: compileParameters({
            text: { type: 'string', required: true, description: '要合成的文本（必填，≤5000 字符）。' },
            voice: { type: 'string', description: '音色 id（可选，默认配置的 ttsVoice）。' },
            rate: { type: 'string', description: '语速，如 +20% 或 -10%（可选）。' },
            pitch: { type: 'string', description: '音调，如 +2Hz 或 -1Hz（可选）。' },
            output: { type: 'string', description: '输出 MP3 路径（可选）。' },
        }),
        output: {
            schema: ttsSchema,
            render: (_args, value) => {
                const rec = asRecord(value);
                return [{ type: 'text', text: '语音合成完成：' + rec.output + '（' + rec.bytes + ' 字节，音色 ' + rec.voice + '）' }];
            },
        },
        async execute(rawArgs) {
            const args = asRecord(rawArgs);
            const text = requiredString(args, 'text', '要合成的文本');
            if (text.length > 5000)
                throw new Error('文本超过 5000 字符，请分段合成。');
            const voice = optionalString(args, 'voice') ?? cfg.ttsVoice;
            if (!isValidVoiceId(voice))
                throw new Error('音色 id 不合法：' + voice + '。请用 voice_list 查看常用音色，或使用 zh-CN-XXXNeural 形式的 edge 音色。');
            const rate = optionalString(args, 'rate') ?? cfg.ttsRate;
            const pitch = optionalString(args, 'pitch') ?? cfg.ttsPitch;
            for (const [value, label] of [[rate, '语速 rate'], [pitch, '音调 pitch']]) {
                if (!/^[+-]?\d+(\.\d+)?(%|Hz|st)$/.test(value))
                    throw new Error(label + ' 不合法：' + value + '。合法格式如 +10%、-2Hz、+1st。');
            }
            const output = resolveOutputPath(optionalString(args, 'output'), 'voice_output.mp3', cfg.overwrite);
            const audio = await (deps.tts ?? synthesizeSpeech)({ text, voice, rate, pitch }, { proxyUrl: cfg.proxyUrl }, timeout);
            writeFileSync(output, audio);
            return { output, bytes: audio.length, voice, rate, pitch, textLength: text.length };
        },
        timeoutMs: timeout + 10000,
    };
    const voiceStt = {
        name: 'voice_stt',
        description: '语音转文字：调用 OpenAI 兼容 ASR 接口（默认 Groq whisper-large-v3-turbo；可切 openai/custom）。audio 为音频文件路径（mp3/wav/m4a/ogg/flac，≤25MB）；language/prompt 可选；output 可把转写文本写成 .txt。密钥用环境变量 DSH_VOICE_ASR_KEY 或配置 asrApiKey。',
        parameters: compileParameters({
            audio: { type: 'string', required: true, description: '音频文件路径（必填）。' },
            engine: { type: 'string', description: '引擎：groq / openai / custom（可选，默认配置值）。' },
            model: { type: 'string', description: '模型名（可选，覆盖配置）。' },
            language: { type: 'string', description: '语言提示，如 zh（可选）。' },
            prompt: { type: 'string', description: '提示词（专有名词/术语纠偏，可选）。' },
            output: { type: 'string', description: '把转写文本写成 .txt 的路径（可选）。' },
        }),
        output: {
            schema: sttSchema,
            render: (_args, value) => {
                const rec = asRecord(value);
                return [{ type: 'text', text: '转写完成（模型 ' + rec.model + '）：' + rec.text }];
            },
        },
        async execute(rawArgs) {
            const args = asRecord(rawArgs);
            const audioPath = assertAudioFile(requiredString(args, 'audio', '音频文件'));
            const engine = optionalString(args, 'engine') ?? cfg.asrEngine;
            let baseUrl;
            let model;
            if (engine === 'openai') {
                baseUrl = 'https://api.openai.com/v1';
                model = optionalString(args, 'model') ?? 'whisper-1';
            }
            else if (engine === 'custom') {
                baseUrl = cfg.asrBaseUrl;
                model = optionalString(args, 'model') ?? cfg.asrModel;
            }
            else if (engine === 'groq') {
                baseUrl = 'https://api.groq.com/openai/v1';
                model = optionalString(args, 'model') ?? (cfg.asrModel !== '' && cfg.asrEngine === 'groq' ? cfg.asrModel : 'whisper-large-v3-turbo');
            }
            else
                throw new Error('engine 必须是 groq / openai / custom 之一（当前：' + engine + '）。');
            const { text } = await (deps.stt ?? transcribe)(baseUrl, cfg.asrApiKey, {
                audio: readFileSync(audioPath),
                filename: basename(audioPath),
                model,
                language: optionalString(args, 'language'),
                prompt: optionalString(args, 'prompt'),
            }, fetchImpl ?? globalThis.fetch, timeout);
            let transcriptFile = null;
            const output = optionalString(args, 'output');
            if (output !== undefined) {
                const target = resolveOutputPath(output, '', cfg.overwrite);
                writeFileSync(target, text, 'utf8');
                transcriptFile = target;
            }
            return { text, model, language: optionalString(args, 'language') ?? null, audio: audioPath, transcriptFile };
        },
        timeoutMs: timeout + 10000,
    };
    const voicePreview = {
        name: 'voice_preview',
        description: '音色试听：用一段固定试听文本批量生成短样例 MP3，方便挑选音色。voices 为音色 id 数组（可选，缺省 voice_list 前 4 个，最多 8 个）；text 可自定义（≤200 字符）；样例文件写入输出目录（默认工作目录 voice_previews），文件名含音色 id。单个音色失败不阻断其他。',
        parameters: compileParameters({
            voices: { type: 'array', items: { type: 'string' }, description: '音色 id 数组（可选，缺省 voice_list 前 4 个，最多 8 个）。' },
            text: { type: 'string', description: '试听文本（可选，默认中英混合试听句，≤200 字符）。' },
            outputDir: { type: 'string', description: '输出目录（可选，默认工作目录下 voice_previews）。' },
        }),
        output: {
            schema: previewSchema,
            render: (_args, value) => {
                const rec = asRecord(value);
                const samples = Array.isArray(rec.samples) ? rec.samples : [];
                const failed = Array.isArray(rec.failed) ? rec.failed : [];
                const lines = ['试听样例已生成 ' + samples.length + ' 个（试听文本：' + rec.text + '）：'];
                for (const item of samples) {
                    const s = asRecord(item);
                    lines.push('- ' + s.voice + ' -> ' + s.output);
                }
                for (const item of failed) {
                    const f = asRecord(item);
                    lines.push('- ' + f.voice + ' 失败：' + String(f.error ?? ''));
                }
                return [{ type: 'text', text: lines.join('\n') }];
            },
        },
        async execute(rawArgs) {
            const args = asRecord(rawArgs);
            const rawVoices = Array.isArray(args.voices)
                ? args.voices.filter((v) => typeof v === 'string' && v.trim() !== '').map((v) => v.trim())
                : [];
            const targets = rawVoices.length > 0 ? rawVoices : VOICES.slice(0, 4).map((v) => v.id);
            if (targets.length > 8)
                throw new Error('voices 最多 8 个（当前 ' + targets.length + ' 个），试听一次别太多，慢且耗资源。');
            const text = optionalString(args, 'text') ?? DEFAULT_PREVIEW_TEXT;
            if (text.length > 200)
                throw new Error('试听文本请控制在 200 字以内（试听要短平快）。');
            const outDir = resolve(optionalString(args, 'outputDir') ?? 'voice_previews');
            mkdirSync(outDir, { recursive: true });
            const samples = [];
            const failed = [];
            for (const voice of targets) {
                if (!isValidVoiceId(voice)) {
                    failed.push({ voice, error: '音色 id 不合法（应为 zh-CN-XXXNeural 形式的 edge 音色）' });
                    continue;
                }
                try {
                    const audio = await (deps.tts ?? synthesizeSpeech)({ text, voice, rate: cfg.ttsRate, pitch: cfg.ttsPitch }, { proxyUrl: cfg.proxyUrl }, timeout);
                    const file = join(outDir, 'voice-preview-' + voice.replace(/[^a-zA-Z0-9-]/g, '_') + '.mp3');
                    writeFileSync(file, audio);
                    samples.push({ voice, output: file, bytes: audio.length });
                }
                catch (error) {
                    failed.push({ voice, error: error instanceof Error ? error.message : String(error) });
                }
            }
            return { count: samples.length, samples, failed, text };
        },
        timeoutMs: timeout + 10000,
    };
    const voiceHealth = {
        name: 'voice_health',
        description: 'dsh-voice 自检：检查 TTS 音色合法性、代理配置与 ASR 引擎/密钥就绪状态（不发起网络请求）。遇到问题时先运行本工具定位。',
        parameters: compileParameters({}),
        output: {
            schema: { type: 'object', additionalProperties: true },
            render: (_args, value) => {
                const rec = asRecord(value);
                const checks = Array.isArray(rec.checks) ? rec.checks : [];
                const lines = ['dsh-voice 自检' + (rec.ok === true ? '：正常。' : '：发现问题。')];
                for (const item of checks) {
                    const c = asRecord(item);
                    lines.push('- ' + c.name + '：' + (c.ok === true ? '✅ ' + String(c.detail ?? '') : '❌ ' + String(c.detail ?? '')));
                }
                return [{ type: 'text', text: lines.join('\n') }];
            },
        },
        async execute() {
            const checks = [];
            let ok = true;
            const voiceOk = isValidVoiceId(cfg.ttsVoice);
            checks.push({ name: 'TTS 音色', ok: voiceOk, detail: voiceOk ? cfg.ttsVoice : '不合法：' + cfg.ttsVoice + '（用 voice_list 查看）' });
            if (!voiceOk)
                ok = false;
            checks.push({ name: '特殊代理', ok: true, detail: cfg.proxyUrl !== '' ? '已配置 ' + cfg.proxyUrl : '未配置' });
            checks.push({ name: 'ASR 引擎', ok: true, detail: cfg.asrEngine });
            const hasKey = cfg.asrApiKey !== '' || typeof process.env.DSH_VOICE_ASR_KEY === 'string' && process.env.DSH_VOICE_ASR_KEY !== '';
            checks.push({ name: 'ASR 密钥', ok: hasKey, detail: hasKey ? '已配置' : '未配置：voice_stt 需要 DSH_VOICE_ASR_KEY 环境变量或配置 asrApiKey' });
            if (!hasKey)
                ok = false;
            return { ok, plugin: 'dsh-voice', checks };
        },
        timeoutMs: 5000,
    };
    return [voiceList, voiceTts, voiceStt, voicePreview, voiceHealth];
}
