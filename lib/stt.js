/**
 * ASR 客户端：OpenAI 兼容 /audio/transcriptions multipart 上传。
 *
 * @module dsh-voice/stt
 */
import { extname } from 'node:path';
const MAX_AUDIO_BYTES = 25 * 1024 * 1024;
/**
 * 调用 OpenAI 兼容 ASR 接口转写音频。
 * @throws 缺密钥 / 文件过大 / HTTP 错误 / 无文本时抛中文错误。
 */
export async function transcribe(baseUrl, apiKey, options, fetchImpl = globalThis.fetch, timeoutMs = 120000) {
    if (apiKey === '')
        throw new Error('未配置 ASR 密钥：请设置环境变量 DSH_VOICE_ASR_KEY，或在 cordis.patch.yml 的 asrApiKey 配置后重启。');
    if (baseUrl === '')
        throw new Error('未配置 ASR 接口地址（asrEngine=custom 时必须提供 asrBaseUrl）。');
    if (options.audio.length === 0)
        throw new Error('音频文件为空。');
    if (options.audio.length > MAX_AUDIO_BYTES)
        throw new Error('音频超过 25MB 上限（ASR 接口限制），请先用 ffmpeg 压缩。');
    const form = new FormData();
    const mime = mimeOf(options.filename);
    form.append('file', new Blob([options.audio], { type: mime }), options.filename);
    form.append('model', options.model);
    if (options.language !== undefined && options.language !== '')
        form.append('language', options.language);
    if (options.prompt !== undefined && options.prompt !== '')
        form.append('prompt', options.prompt);
    let response;
    try {
        response = await fetchImpl(baseUrl + '/audio/transcriptions', {
            method: 'POST',
            headers: { authorization: 'Bearer ' + apiKey },
            body: form,
            signal: AbortSignal.timeout(timeoutMs),
        });
    }
    catch (error) {
        throw new Error('ASR 请求失败：' + (error instanceof Error ? error.message : String(error)) + '。若接口需要特殊代理（梯子），请在 cordis.patch.yml 配置 proxyUrl 后重启。');
    }
    if (!response.ok) {
        const body = (await response.text()).slice(0, 300);
        throw new Error('ASR 失败：HTTP ' + response.status + '。' + body);
    }
    let json;
    try {
        json = await response.json();
    }
    catch {
        throw new Error('ASR 响应不是合法 JSON。');
    }
    const text = typeof json === 'object' && json !== null && typeof json.text === 'string' ? json.text : '';
    return { text, model: options.model };
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
