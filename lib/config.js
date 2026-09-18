/**
 * dsh-voice 配置解析：TTS 默认音色与语速、ASR 引擎与密钥、代理。
 *
 * @module dsh-voice/config
 */
const ENGINE_PRESETS = {
    groq: { baseUrl: 'https://api.groq.com/openai/v1', model: 'whisper-large-v3-turbo' },
    openai: { baseUrl: 'https://api.openai.com/v1', model: 'whisper-1' },
};
/** ASR 密钥：配置优先，其次环境变量 DSH_VOICE_ASR_KEY。 */
export function resolveAsrApiKey(config, env = process.env) {
    const cfg = config ?? {};
    if (typeof cfg.asrApiKey === 'string' && cfg.asrApiKey.trim() !== '')
        return cfg.asrApiKey.trim();
    return env.DSH_VOICE_ASR_KEY?.trim() ?? '';
}
/** 默认告警出口：非法字段逐项回退时点名，避免一个字段拖垮整份配置。 */
function defaultWarn(message) {
    console.warn('[dsh-voice] ' + message);
}
/**
 * 解析并校验配置：非法字段逐项回退到默认值，其余字段照常生效。
 * @param onWarning 非法字段的告警回调，默认打到 console.warn。
 */
export function resolveConfig(config, onWarning = defaultWarn) {
    const cfg = config ?? {};
    const ttsVoice = typeof cfg.ttsVoice === 'string' && cfg.ttsVoice.trim() !== '' ? cfg.ttsVoice.trim() : 'zh-CN-XiaoxiaoNeural';
    const ttsRate = typeof cfg.ttsRate === 'string' && cfg.ttsRate.trim() !== '' ? cfg.ttsRate.trim() : '+0%';
    const ttsPitch = typeof cfg.ttsPitch === 'string' && cfg.ttsPitch.trim() !== '' ? cfg.ttsPitch.trim() : '+0Hz';
    const asrEngine = cfg.asrEngine === 'openai' ? 'openai' : cfg.asrEngine === 'custom' ? 'custom' : 'groq';
    const preset = asrEngine === 'custom' ? undefined : ENGINE_PRESETS[asrEngine];
    const asrBaseUrl = (typeof cfg.asrBaseUrl === 'string' && cfg.asrBaseUrl.trim() !== '' ? cfg.asrBaseUrl.trim() : preset?.baseUrl ?? '').replace(/\/$/, '');
    const asrModel = typeof cfg.asrModel === 'string' && cfg.asrModel.trim() !== '' ? cfg.asrModel.trim() : preset?.model ?? '';
    const asrApiKey = resolveAsrApiKey(cfg);
    let proxyUrl = typeof cfg.proxyUrl === 'string' && cfg.proxyUrl.trim() !== '' ? cfg.proxyUrl.trim() : '';
    if (proxyUrl !== '' && !/^https?:\/\//i.test(proxyUrl)) {
        onWarning('proxyUrl 配置不合法（必须以 http(s):// 开头，例如 http://127.0.0.1:7890），已忽略该项，其余配置继续生效：' + proxyUrl);
        proxyUrl = '';
    }
    let timeoutMs = 60000;
    if (cfg.timeoutMs !== undefined) {
        if (typeof cfg.timeoutMs !== 'number' || !Number.isFinite(cfg.timeoutMs) || cfg.timeoutMs <= 0) {
            onWarning('timeoutMs 配置不合法（必须是大于 0 的数字，毫秒），已回退默认值 60000。');
        }
        else {
            timeoutMs = Math.min(10 * 60 * 1000, Math.max(5000, Math.round(cfg.timeoutMs)));
        }
    }
    const overwrite = cfg.overwrite === true;
    return { ttsVoice, ttsRate, ttsPitch, asrEngine, asrBaseUrl, asrApiKey, asrModel, proxyUrl, timeoutMs, overwrite };
}
