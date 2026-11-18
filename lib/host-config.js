const kSchema = Symbol.for('schemastery');
const kValidationError = Symbol.for('ValidationError');
const kVolatileWrite = Symbol.for('cosmokit.volatile.write');
const kCheckedVolatile = Symbol('checked-volatile-schema');
const globalState = globalThis;
export class HostValidationError extends TypeError {
    options;
    name = 'ValidationError';
    constructor(message, options = {}) {
        let prefix = '$';
        for (const segment of options.path ?? []) {
            if (typeof segment === 'string')
                prefix += '.' + segment;
            else if (typeof segment === 'number')
                prefix += '[' + segment + ']';
            else
                prefix += `[Symbol(${segment.toString()})]`;
        }
        if (prefix.startsWith('.'))
            prefix = prefix.slice(1);
        super((prefix === '$' ? '' : `${prefix} `) + message);
        this.options = options;
    }
    static is(error) {
        return typeof error === 'object' && error !== null && Boolean(error[kValidationError]);
    }
}
Object.defineProperty(HostValidationError.prototype, kValidationError, { value: true });
function isNullable(value) {
    return value === null || value === undefined;
}
function isPlainObject(value) {
    if (typeof value !== 'object' || value === null || Array.isArray(value))
        return false;
    const proto = Object.getPrototypeOf(value);
    return proto === Object.prototype || proto === null;
}
function isVolatile(value) {
    return typeof value === 'object' && value !== null && kVolatileWrite in value;
}
function cloneValue(value) {
    if (value === null || typeof value !== 'object')
        return value;
    if (Array.isArray(value))
        return value.map((item) => cloneValue(item));
    if (isPlainObject(value)) {
        return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, cloneValue(v)]));
    }
    return value;
}
function deepEqual(a, b) {
    if (Object.is(a, b))
        return true;
    if (typeof a !== 'object' || a === null || typeof b !== 'object' || b === null)
        return false;
    if (Array.isArray(a) || Array.isArray(b)) {
        if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length)
            return false;
        return a.every((item, idx) => deepEqual(item, b[idx]));
    }
    if (!isPlainObject(a) || !isPlainObject(b))
        return false;
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    if (keysA.length !== keysB.length)
        return false;
    return keysA.every((key) => Object.prototype.hasOwnProperty.call(b, key) && deepEqual(a[key], b[key]));
}
function snapshotValue(value, ancestors = new Set()) {
    if (typeof value === 'function')
        throw new TypeError('volatile config cannot contain functions');
    if (value === null || typeof value !== 'object')
        return value;
    if (ancestors.has(value))
        throw new TypeError('volatile config cannot contain cycles');
    ancestors.add(value);
    try {
        if (Array.isArray(value))
            return Object.freeze(value.map((item) => snapshotValue(item, ancestors)));
        if (!isPlainObject(value))
            throw new TypeError('volatile config objects must be plain objects or arrays');
        return Object.freeze(Object.fromEntries(Object.entries(value).map(([key, item]) => [key, snapshotValue(item, ancestors)])));
    }
    finally {
        ancestors.delete(value);
    }
}
export function createVolatile(value) {
    let current = snapshotValue(value);
    return Object.freeze({
        get: () => current,
        [kVolatileWrite]: (next) => { current = snapshotValue(next); },
    });
}
function validateVolatileTree(schema, path = [], blocked = false, seen = new Map()) {
    const states = seen.get(schema) ?? new Set();
    if (states.has(blocked))
        return;
    states.add(blocked);
    seen.set(schema, states);
    if (schema.meta?.volatile && blocked) {
        throw new HostValidationError('volatile fields require a fixed object path without an enclosing volatile field', { path });
    }
    const nested = blocked || Boolean(schema.meta?.volatile);
    if (schema.dict) {
        for (const [key, child] of Object.entries(schema.dict))
            validateVolatileTree(child, [...path, key], nested, seen);
    }
    if (schema.inner)
        validateVolatileTree(schema.inner, [...path, '*'], true, seen);
    if (schema.list) {
        schema.list.forEach((child, idx) => validateVolatileTree(child, [...path, String(idx)], true, seen));
    }
}
function checkRange(value, meta, label, options, skipMin = false) {
    const max = meta.max ?? Infinity;
    const min = meta.min ?? -Infinity;
    if (value > max)
        throw new HostValidationError(`expected ${label} <= ${max} but got ${value}`, options);
    if (value < min && !skipMin)
        throw new HostValidationError(`expected ${label} >= ${min} but got ${value}`, options);
}
function resolveProperty(data, key, schema, options) {
    const container = data;
    try {
        const [value, adapted] = resolveSchema(container[key], schema, {
            ...options,
            path: [...(options.path ?? []), key],
        });
        if (adapted !== undefined)
            container[key] = adapted;
        return value;
    }
    catch (error) {
        if (!options.autofix)
            throw error;
        delete container[key];
        return schema.meta.volatile ? createVolatile(schema.meta.default) : cloneValue(schema.meta.default);
    }
}
function resolveSchema(data, schema, options = {}, strict = false) {
    if (!schema)
        return [data];
    if (!options[kCheckedVolatile]) {
        validateVolatileTree(schema, options.path);
        options = { ...options, [kCheckedVolatile]: true };
    }
    if (schema.meta?.volatile) {
        const inner = makeSchema({ ...schema, meta: { ...schema.meta, volatile: false } });
        const [value, adapted] = resolveSchema(data, inner, options, strict);
        try {
            return [createVolatile(value), adapted];
        }
        catch (error) {
            throw new HostValidationError(error instanceof Error ? error.message : String(error), options);
        }
    }
    if (options.ignore?.(data, schema))
        return [data];
    if (isNullable(data)) {
        if (schema.meta.required)
            throw new HostValidationError('missing required value', options);
        if (isNullable(schema.meta.default))
            return [data];
        data = cloneValue(schema.meta.default);
    }
    try {
        switch (schema.type) {
            case 'any':
                return [data];
            case 'const':
                if (deepEqual(data, schema.value))
                    return [schema.value];
                throw new HostValidationError(`expected ${String(schema.value)} but got ${String(data)}`, options);
            case 'string': {
                if (typeof data !== 'string')
                    throw new HostValidationError(`expected string but got ${String(data)}`, options);
                if (schema.meta.pattern) {
                    const re = new RegExp(schema.meta.pattern.source, schema.meta.pattern.flags);
                    if (!re.test(data))
                        throw new HostValidationError(`expect string to match regexp ${String(re)}`, options);
                }
                checkRange(data.length, schema.meta, 'string length', options);
                return [data];
            }
            case 'number': {
                if (typeof data !== 'number' || Number.isNaN(data))
                    throw new HostValidationError(`expected number but got ${String(data)}`, options);
                checkRange(data, schema.meta, 'number', options);
                return [data];
            }
            case 'boolean':
                if (typeof data === 'boolean')
                    return [data];
                throw new HostValidationError(`expected boolean but got ${String(data)}`, options);
            case 'array': {
                if (!Array.isArray(data) || !schema.inner)
                    throw new HostValidationError(`expected array but got ${String(data)}`, options);
                checkRange(data.length, schema.meta, 'array length', options, !isNullable(schema.inner.meta.default));
                const copy = [...data];
                return [copy.map((_, idx) => resolveProperty(copy, idx, schema.inner, options))];
            }
            case 'object': {
                if (!isPlainObject(data))
                    throw new HostValidationError(`expected object but got ${String(data)}`, options);
                const dict = schema.dict ?? {};
                const copy = { ...data };
                const result = {};
                for (const key of Object.keys(dict)) {
                    const value = resolveProperty(copy, key, dict[key], options);
                    if (!isNullable(value) || key in copy)
                        result[key] = value;
                }
                if (!strict) {
                    for (const key of Object.keys(copy)) {
                        if (!(key in result))
                            result[key] = copy[key];
                    }
                }
                return [result];
            }
            case 'union': {
                for (const candidate of schema.list ?? []) {
                    try {
                        return resolveSchema(data, candidate, options, strict);
                    }
                    catch {
                        // Try next union branch.
                    }
                }
                throw new HostValidationError(`expected ${schema.toString()} but got ${JSON.stringify(data)}`, options);
            }
            default:
                throw new HostValidationError(`unsupported type "${schema.type}"`, options);
        }
    }
    catch (error) {
        if (!schema.meta.loose)
            throw error;
        return [cloneValue(schema.meta.default)];
    }
}
function mergeDescriptions(original, messages) {
    const result = typeof original === 'string' ? { '': original } : { ...(original ?? {}) };
    for (const [locale, entry] of Object.entries(messages)) {
        if (typeof entry === 'string') {
            result[locale] = entry;
        }
        else if (isPlainObject(entry)) {
            const desc = entry.$description ?? entry.$desc;
            if (typeof desc === 'string')
                result[locale] = desc;
        }
    }
    return result;
}
const schemaProto = Object.create(Function.prototype);
schemaProto[kSchema] = true;
Object.defineProperty(schemaProto, '~standard', {
    get() {
        return {
            version: 1,
            vendor: 'schemastery',
            validate: (value) => {
                try {
                    return { value: resolveSchema(value, this, {})[0] };
                }
                catch (error) {
                    if (HostValidationError.is(error)) {
                        return { issues: [{ message: error.message, path: error.options.path }] };
                    }
                    throw error;
                }
            },
        };
    },
});
schemaProto.toJSON = function toJSON() {
    if (globalState.__schemastery_refs__) {
        globalState.__schemastery_refs__[this.uid] ??= JSON.parse(JSON.stringify({ ...this }));
        return this.uid;
    }
    globalState.__schemastery_refs__ = { [this.uid]: { ...this } };
    globalState.__schemastery_refs__[this.uid] = JSON.parse(JSON.stringify({ ...this }));
    const result = { uid: this.uid, refs: globalState.__schemastery_refs__ };
    globalState.__schemastery_refs__ = undefined;
    return result;
};
schemaProto.toString = function toString(inline = false) {
    if (this.type === 'const')
        return typeof this.value === 'string' ? JSON.stringify(this.value) : String(this.value);
    if (this.type === 'array' && this.inner)
        return `${this.inner.toString(true)}[]`;
    if (this.type === 'union' && this.list) {
        const joined = this.list.map((item) => item.toString()).join(' | ');
        return inline ? `(${joined})` : joined;
    }
    if (this.type === 'object' && this.dict) {
        const entries = Object.entries(this.dict);
        if (entries.length === 0)
            return '{}';
        return `{ ${entries.map(([k, v]) => `${k}${v.meta.required ? '' : '?'}: ${v.toString()}`).join(', ')} }`;
    }
    return this.type;
};
schemaProto.simplify = function simplify(raw) {
    const value = isVolatile(raw) ? raw.get() : raw;
    if (deepEqual(value, this.meta.default))
        return null;
    if (isNullable(value))
        return value;
    if (this.type === 'object' && isPlainObject(value)) {
        const out = {};
        for (const [key, item] of Object.entries(value)) {
            const simplified = this.dict?.[key] ? this.dict[key].simplify(item) : item;
            if (!isNullable(simplified))
                out[key] = simplified;
        }
        return deepEqual(out, this.meta.default) ? null : out;
    }
    if (this.type === 'array' && Array.isArray(value)) {
        return value.map((item) => (this.inner ? this.inner.simplify(item) : item));
    }
    return value;
};
schemaProto.i18n = function i18n(messages) {
    const cloned = makeSchema(this);
    const desc = mergeDescriptions(cloned.meta.description, messages);
    if (Object.keys(desc).length > 0)
        cloned.meta = { ...cloned.meta, description: desc };
    if (cloned.dict) {
        const nextDict = {};
        for (const [key, child] of Object.entries(cloned.dict)) {
            const childMessages = {};
            for (const [locale, data] of Object.entries(messages)) {
                if (isPlainObject(data)) {
                    const inner = isPlainObject(data.$value) ? data.$value : isPlainObject(data.$inner) ? data.$inner : data;
                    if (key in inner)
                        childMessages[locale] = inner[key];
                }
            }
            nextDict[key] = child.i18n(childMessages);
        }
        cloned.dict = nextDict;
    }
    if (cloned.inner) {
        const innerMessages = {};
        for (const [locale, data] of Object.entries(messages)) {
            if (isPlainObject(data)) {
                const inner = data.$value ?? data.$inner;
                if (inner !== undefined)
                    innerMessages[locale] = inner;
            }
        }
        cloned.inner = cloned.inner.i18n(innerMessages);
    }
    return cloned;
};
schemaProto.extra = function extra(key, value) {
    const cloned = makeSchema(this);
    cloned.meta = { ...cloned.meta, [key]: value };
    return cloned;
};
schemaProto.role = function role(name, extraValue) {
    const cloned = makeSchema(this);
    cloned.meta = { ...cloned.meta, role: name, ...(extraValue !== undefined ? { extra: extraValue } : {}) };
    return cloned;
};
for (const key of ['default', 'link', 'comment', 'description', 'max', 'min', 'step']) {
    schemaProto[key] = function (value) {
        return this.extra(key, value);
    };
}
for (const key of ['required', 'disabled', 'collapse', 'hidden', 'loose']) {
    schemaProto[key] = function (value = true) {
        return this.extra(key, value);
    };
}
schemaProto.pattern = function pattern(regexp) {
    return this.extra('pattern', { source: regexp.source, flags: regexp.flags });
};
schemaProto.volatile = function volatile() {
    if (this.meta.volatile)
        throw new TypeError('volatile schema is already wrapped');
    return this.extra('volatile', true);
};
schemaProto.set = function set(key, value) {
    this.dict ??= {};
    this.dict[key] = value;
    return this;
};
schemaProto.push = function push(value) {
    this.list ??= [];
    this.list.push(value);
    return this;
};
function makeSchema(init) {
    const fn = function (data, options = {}) {
        return resolveSchema(data, fn, options)[0];
    };
    Object.assign(fn, {
        type: init.type,
        meta: { ...(init.meta ?? {}) },
        ...(init.dict ? { dict: { ...init.dict } } : {}),
        ...(init.inner ? { inner: init.inner } : {}),
        ...(init.list ? { list: [...init.list] } : {}),
        ...('value' in init ? { value: init.value } : {}),
    });
    globalState.__schemastery_index__ ??= 0;
    Object.defineProperty(fn, 'uid', { value: globalState.__schemastery_index__++, enumerable: false });
    Object.setPrototypeOf(fn, schemaProto);
    fn.toString = fn.toString.bind(fn);
    return fn;
}
function fromSource(source) {
    if (typeof source === 'function' && Boolean(source[kSchema])) {
        return source;
    }
    if (typeof source === 'string' || typeof source === 'number' || typeof source === 'boolean') {
        return makeSchema({ type: 'const', value: source, meta: { required: true } });
    }
    throw new TypeError(`cannot infer schema from ${String(source)}`);
}
export const z = {
    string: () => makeSchema({ type: 'string' }),
    number: () => makeSchema({ type: 'number' }),
    boolean: () => makeSchema({ type: 'boolean' }),
    const: (value) => makeSchema({ type: 'const', value }),
    union: (list) => makeSchema({ type: 'union', list: list.map(fromSource) }),
    array: (inner) => makeSchema({ type: 'array', inner, meta: { default: [] } }),
    object: (dict) => makeSchema({ type: 'object', dict, meta: { default: {} } }),
    ValidationError: HostValidationError,
};
/**
 * 宿主原生设置表单 Schema。
 * 标量字段不设 default，以便留空时自动回退内置预设与环境变量 DSH_VOICE_ASR_KEY / DSH_VOICE_TTS_KEY。
 */
export const Config = z.object({
    ttsEngine: z.union(['edge', 'openai', 'siliconflow', 'custom']).volatile()
        .description('语音合成（TTS）引擎预设：edge（默认，零密钥）/ openai / siliconflow / custom'),
    ttsBaseUrl: z.string().volatile()
        .description('TTS 接口基地址（custom 模式必填；openai / siliconflow 留空使用官方预设，edge 模式忽略）'),
    ttsApiKey: z.string().role('secret').volatile()
        .description('TTS API 密钥（自动脱敏；留空时读取环境变量 DSH_VOICE_TTS_KEY，edge 与本机回环服务无需填写）'),
    ttsModel: z.string().volatile()
        .description('TTS 模型名（可选；openai 默认 gpt-4o-mini-tts，siliconflow 默认 FunAudioLLM/CosyVoice2-0.5B）'),
    ttsVoice: z.string().volatile()
        .description('默认朗读音色（默认 zh-CN-XiaoxiaoNeural，edge 模式无需 API 密钥即可合成 MP3）'),
    ttsRate: z.string().volatile()
        .description('默认语速（如 +0%、+15%、-10%）'),
    ttsPitch: z.string().volatile()
        .description('默认音调（如 +0Hz、+2Hz、-1Hz）'),
    asrEngine: z.union(['groq', 'openai', 'siliconflow', 'custom']).volatile()
        .description('语音转文字（ASR）服务预设：groq（默认）/ openai / siliconflow / custom'),
    asrBaseUrl: z.string().volatile()
        .description('ASR 接口地址（custom 模式必填，如 https://api.example.com/v1；groq / openai / siliconflow 留空使用官方预设）'),
    asrApiKey: z.string().role('secret').volatile()
        .description('ASR API 密钥（自动脱敏；留空时读取环境变量 DSH_VOICE_ASR_KEY，本机回环服务可留空）'),
    asrModel: z.string().volatile()
        .description('ASR 模型名（可选；groq 默认 whisper-large-v3-turbo，openai 默认 whisper-1，siliconflow 默认 FunAudioLLM/SenseVoiceSmall）'),
    proxyUrl: z.string().role('secret').volatile()
        .description('网络代理地址（可选，支持 http(s):// 或 socks5(h)://，如 http://127.0.0.1:7890）'),
    timeoutMs: z.number().min(5000).max(600000).step(1000).volatile()
        .description('单次合成或转写超时毫秒数（5000–600000，默认 60000）'),
    overwrite: z.boolean().volatile()
        .description('同名输出文件是否直接覆盖（默认关闭，自动加序号防误盖）'),
    customVoices: z.array(z.object({
        name: z.string().required().description('自定义音色别名（如 老王、女主持、悬疑旁白）'),
        voice: z.string().description('底层音色 ID 或混合表达式（可选，如 zh-CN-YunzeNeural、FunAudioLLM/CosyVoice2-0.5B:alex、zf_xiaobei*0.6+zf_xiaoni*0.4）'),
        persona: z.string().description('继承的内置人设 ID（可选，如 late-night-radio）'),
        rate: z.string().description('专属语速（可选，如 -8%、+10%）'),
        pitch: z.string().description('专属音调（可选，如 -2Hz、+2Hz）'),
        instructions: z.string().description('情绪/语气指令（可选，用于 gpt-4o-mini-tts 或 CosyVoice2，如“用低沉神秘的语气轻声讲述”）'),
        referenceAudio: z.string().description('零样本克隆参考音频路径（可选，会话工作区内 5–10 秒干净人声 wav/mp3）'),
        referenceText: z.string().description('参考音频对应的原始台词文本（可选，CosyVoice2 等克隆模型推荐填写）'),
    })).collapse().volatile()
        .description('自定义音色与零样本克隆别名列表（保存后立即生效）'),
    pronunciations: z.array(z.object({
        word: z.string().required().description('原词或缩写（如 Nginx、SQL、重构）'),
        alias: z.string().required().description('替读发音文本（如 Engine X、S Q L、虫构）'),
    })).collapse().volatile()
        .description('自定义发音词典（专有名词、缩写与多音字替读规则，保存后立即生效）'),
}).i18n({
    zh: {
        $description: '零密钥 Edge / OpenAI 兼容语音合成（TTS）与语音转文字（ASR）设置（保存立即生效）',
        ttsEngine: '语音合成引擎预设（edge / openai / siliconflow / custom）',
        ttsBaseUrl: 'TTS 接口基地址（custom 必填，需含 /v1；openai / siliconflow 可留空，edge 不需要）',
        ttsApiKey: 'TTS API 密钥（脱敏保存；留空时读取环境变量 DSH_VOICE_TTS_KEY，edge 与本机服务免填）',
        ttsModel: 'TTS 模型名称（可选；留空按引擎预设自动选择）',
        ttsVoice: '默认朗读音色（如 zh-CN-XiaoxiaoNeural、en-US-AriaNeural；edge 模式无需密钥）',
        ttsRate: '默认语速（如 +0%、+15%、-10%）',
        ttsPitch: '默认音调（如 +0Hz、+2Hz、-1Hz）',
        asrEngine: '语音转文字引擎预设（groq / openai / siliconflow / custom）',
        asrBaseUrl: 'ASR 接口基地址（custom 必填，需含 /v1；groq / openai / siliconflow 可留空）',
        asrApiKey: 'ASR API 密钥（脱敏保存；留空时读取环境变量 DSH_VOICE_ASR_KEY，本机服务可留空）',
        asrModel: 'ASR 模型名称（可选；留空按引擎预设自动选择）',
        proxyUrl: '网络代理地址（可选，支持 http(s):// 或 socks5(h)://，如 http://127.0.0.1:7890）',
        timeoutMs: '请求超时毫秒数（5000–600000，默认 60000）',
        overwrite: '允许覆盖同名音频或转写文本（默认关闭，自动追加序号）',
        customVoices: '自定义音色与零样本克隆别名列表（可为常用音色、人设或参考音频命名，保存后立即生效）',
        pronunciations: '自定义发音词典（专有名词、缩写与多音字替读规则，字幕保留原词，保存后立即生效）',
    },
    en: {
        $description: 'Keyless Edge / OpenAI-compatible TTS read-aloud and ASR transcription settings (live on save)',
        ttsEngine: 'Text-to-speech engine preset (edge / openai / siliconflow / custom)',
        ttsBaseUrl: 'TTS API base URL (required when ttsEngine is custom, e.g. https://api.example.com/v1; unused for edge)',
        ttsApiKey: 'TTS API key (masked; falls back to env var DSH_VOICE_TTS_KEY; not needed for edge or loopback URLs)',
        ttsModel: 'TTS model name (optional; defaults to gpt-4o-mini-tts on openai or FunAudioLLM/CosyVoice2-0.5B on siliconflow)',
        ttsVoice: 'Default TTS voice ID (e.g. zh-CN-XiaoxiaoNeural, en-US-AriaNeural; no API key required for edge)',
        ttsRate: 'Default speech rate (e.g. +0%, +15%, -10%)',
        ttsPitch: 'Default pitch offset (e.g. +0Hz, +2Hz, -1Hz)',
        asrEngine: 'Speech-to-text engine preset (groq / openai / siliconflow / custom)',
        asrBaseUrl: 'ASR API base URL (required when asrEngine is custom, e.g. https://api.example.com/v1)',
        asrApiKey: 'ASR API key (masked; falls back to env var DSH_VOICE_ASR_KEY; optional for loopback URLs)',
        asrModel: 'ASR model name (optional; defaults to whisper-large-v3-turbo on groq, whisper-1 on openai, or FunAudioLLM/SenseVoiceSmall on siliconflow)',
        proxyUrl: 'Optional proxy URL (supports http(s):// or socks5(h)://, e.g. http://127.0.0.1:7890)',
        timeoutMs: 'Per-request timeout in ms (5000–600000, default 60000)',
        overwrite: 'Overwrite existing output files instead of auto-numbering (default off)',
        customVoices: 'Custom voice and zero-shot cloning aliases (name reusable voices, personas, or reference audio clips; live on save)',
        pronunciations: 'Custom pronunciation lexicon (override spoken aliases for acronyms/terms while keeping subtitles intact; live on save)',
    },
});
/** 活引用视图：同时兼容 DSH >=0.1.7 的 { get() } 活引用与旧宿主/测试传入的普通对象。 */
export function liveConfig(config) {
    return new Proxy(config, {
        get(target, key, receiver) {
            const value = Reflect.get(target, key, receiver);
            return value !== null && typeof value === 'object' && typeof value.get === 'function'
                ? value.get()
                : value;
        },
    });
}
