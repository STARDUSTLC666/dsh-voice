import { registerUpdates } from '@stardustlc/dsh-updates';
/**
 * dsh-voice —— 语音工作台与许愿式语音工具插件（node 半身，配置走 cordis.patch.yml）。
 *
 * 插件导出 apply(ctx, config)：注册六个面向模型的工具（voice_tts / voice_stt /
 * voice_list / voice_preview / voice_health / voice_prefs）。TTS 默认走 edge-tts 协议
 * （原生 WebSocket，零 API 成本）；STT 走 OpenAI 兼容 ASR 接口（Groq/OpenAI/SiliconFlow/自定义端点）。
 *
 * @module dsh-voice
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveConfig } from './config.js';
import { Config as VoiceConfigSchema, liveConfig } from './host-config.js';
import { buildVoiceTools } from './tools.js';
import { bindHostSettings, installVoiceStudioWeb } from './web.js';
/** cordis 服务注入：apply 里要用 ctx.tools，必须显式声明。 */
export const Config = VoiceConfigSchema;
export const name = 'voice';
export const inject = ['tools'];
/** 随包分发的技能目录绝对路径。 */
export function bundledSkillsDir() {
    return fileURLToPath(new URL('../skills/', import.meta.url));
}
function unquoteYamlScalar(value) {
    const trimmed = value.trim();
    if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
        return trimmed.slice(1, -1).replace(/\\"/g, '"').replace(/\\n/g, '\n').trim();
    }
    return trimmed;
}
/** 解析 SKILL.md 的 YAML frontmatter（零外部依赖）。 */
export function parseSkillFile(text) {
    const normalized = text.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
    const match = /^---[ \t]*\n([\s\S]*?)\n---[ \t]*\n?/.exec(normalized);
    if (!match)
        return { name: '', description: '', content: normalized };
    let skillName = '';
    let description = '';
    for (const rawLine of match[1].split('\n')) {
        const keyMatch = /^([A-Za-z][A-Za-z0-9_-]*):[ \t]*(.*)$/.exec(rawLine.trim());
        if (!keyMatch)
            continue;
        if (keyMatch[1] === 'name')
            skillName = unquoteYamlScalar(keyMatch[2]);
        else if (keyMatch[1] === 'description')
            description = unquoteYamlScalar(keyMatch[2]);
    }
    return { name: skillName, description, content: normalized.slice(match[0].length).trimStart() };
}
function installVoiceWorkflowSkill(ctx, warn, disposers) {
    if (typeof ctx.inject !== 'function')
        return;
    try {
        ctx.inject(['skills'], (skillCtx) => {
            if (typeof skillCtx?.skills?.register !== 'function')
                return;
            try {
                const dir = join(bundledSkillsDir(), 'voice-workflow');
                const parsed = parseSkillFile(readFileSync(join(dir, 'SKILL.md'), 'utf8'));
                if (!parsed.name || !parsed.description || !parsed.content) {
                    throw new Error('voice-workflow 的 frontmatter 不完整');
                }
                const off = skillCtx.skills.register({
                    name: parsed.name,
                    description: parsed.description,
                    content: parsed.content,
                    resourceBase: { kind: 'directory', path: dir },
                    source: 'runtime',
                });
                if (typeof off === 'function') {
                    let cleaned = false;
                    const cleanup = () => {
                        if (cleaned)
                            return;
                        cleaned = true;
                        off();
                    };
                    disposers.push(cleanup);
                    if (typeof skillCtx.effect === 'function') {
                        skillCtx.effect(() => cleanup, 'dsh-voice: voice-workflow skill');
                    }
                }
            }
            catch (error) {
                warn('[dsh-voice] 技能加载失败：' + (error instanceof Error ? error.message : String(error)));
            }
        });
    }
    catch (error) {
        warn('[dsh-voice] 技能注入未启用：' + (error instanceof Error ? error.message : String(error)));
    }
}
/**
 * 插件入口：解析配置、注册六个语音工具、按需注入运行时工作流技能与 settings 偏好绑定，并挂载 Voice Studio Web 路由。
 */
export function apply(ctx, config) {
    registerUpdates(ctx, { name: "dsh-voice" });
    const warn = (message) => {
        if (typeof ctx.logger?.warn === 'function')
            ctx.logger.warn(message);
        else
            console.warn(message);
    };
    const live = liveConfig((config ?? {}));
    const readCfg = () => {
        try {
            return resolveConfig(live, (msg) => warn('[dsh-voice] ' + msg));
        }
        catch (error) {
            warn('[dsh-voice] ' + (error instanceof Error ? error.message : String(error)));
            return resolveConfig(null, (msg) => warn('[dsh-voice] ' + msg));
        }
    };
    // 启动期跑一次校验，触发必要的告警但绝不阻断注册。
    readCfg();
    const hostSettings = bindHostSettings(ctx);
    const disposers = [];
    for (const definition of buildVoiceTools(readCfg, {
        isSettingsWritable: () => hostSettings.isWritable(),
        updateSettings: (patch) => hostSettings.update(patch),
    })) {
        disposers.push(ctx.tools.register(definition));
    }
    installVoiceWorkflowSkill(ctx, warn, disposers);
    installVoiceStudioWeb(ctx, readCfg, {
        writable: () => hostSettings.isWritable(),
        updateSettings: (patch) => hostSettings.update(patch),
    });
    const teardown = () => {
        for (const dispose of disposers)
            dispose();
    };
    if (typeof ctx.effect === 'function') {
        ctx.effect(() => teardown, 'voice.tools()');
    }
    else if (typeof ctx.on === 'function') {
        ctx.on('dispose', teardown);
    }
}
export * from './config.js';
export { liveConfig, createVolatile, HostValidationError } from './host-config.js';
export * from './edge-tts.js';
export * from './openai-tts.js';
export * from './paths.js';
export * from './proxy-fetch.js';
export * from './stt.js';
export * from './tools.js';
export * from './tts-text.js';
export * from './voices.js';
export * from './web.js';
export * from './wish.js';
