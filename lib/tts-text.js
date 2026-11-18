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
/**
 * 生成合法的 MPEG-2 Layer III（24kHz 48kbps 单声道）静音 MP3 帧，每帧 144 字节 / 24ms。
 */
export function createSilenceMp3(durationMs) {
    if (!Number.isFinite(durationMs) || durationMs <= 0)
        return Buffer.alloc(0);
    const frames = Math.max(1, Math.round(durationMs / 24));
    const frameSize = 144;
    const out = Buffer.alloc(frames * frameSize);
    for (let i = 0; i < frames; i++) {
        const offset = i * frameSize;
        out[offset] = 0xff;
        out[offset + 1] = 0xf3;
        out[offset + 2] = 0x64;
        out[offset + 3] = 0xc0;
    }
    return out;
}
/**
 * 拼接多段 MP3：保留首段完整头部，后续段剥离 ID3v2 后拼接。
 */
export function concatMp3Buffers(buffers) {
    const nonEmpty = buffers.filter((buf) => buf.length > 0);
    if (nonEmpty.length === 0)
        return Buffer.alloc(0);
    const normalized = nonEmpty.map((buf, index) => (index === 0 ? buf : stripId3v2(buf)));
    return Buffer.concat(normalized);
}
/**
 * 按 48kbps（6 字节/毫秒）估算 MP3 音频时长（毫秒）。
 */
export function estimateMp3DurationMs(mp3) {
    return Math.round((stripId3v2(mp3).length * 8) / 48);
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
/**
 * 将字幕条目格式化为 SRT 或 WebVTT 文本。
 */
export function formatSubtitles(cues, format) {
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
