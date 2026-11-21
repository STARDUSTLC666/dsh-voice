# 更新记录

## 0.10.8 (2026-11-22)

- 修复微软免费 Edge ReadAloud 端对 SSML `<sub alias>` 与 `<break>` 拒收导致 `WS 1007 "SSML is invalid"` 的问题：`pronunciations` 在 Edge 端改为词边界安全的纯文本替读（避免转义破坏），行内 `[pause:...]` / `[break:...]` / `[停顿...]` 改为多段复用连接池合成并无缝拼接同采样率静音帧与偏移字幕时间轴，实测全流程零报错。
- Fix live Microsoft Edge ReadAloud `WS 1007 "SSML is invalid"` rejections caused by `<sub alias>` and `<break>` tags: Edge now applies word-boundary-safe plain-text pronunciation substitution before XML escaping and synthesizes inline `[pause:...]` segments over the keep-alive WSS pool with matched-sample-rate silence frames and offset subtitle cues.
- 全面对齐微软 Edge 实时可用音色目录并补齐旧 Azure 音色兼容映射：将内置音色更新为 51 个全部通过真实 Edge WSS 验证的在线音色，替换 6 套原本指向 Azure 专属音色及 1 个实测断连音色的人设配方（10/10 人设全部真机实测通过），并为 18 个历史 Azure 音色 ID 提供自动平滑映射（`resolveEdgeVoiceId`）；Edge WebSocket 遇到服务端 1007/1003/1008 等非瞬时拒收码立即返回明确中文原因不再空转重试，并修复 `sleepWithAbort` 的 `.unref()` 提前退出问题。
- Align built-in voices and personas with live Microsoft Edge ReadAloud availability: replace 18 Azure-only voice IDs with 51 live-verified Edge voices, update all 10/10 `VOICE_PERSONAS` to live-verified Edge voices (`bilingual-tech-male` -> `en-US-BrianMultilingualNeural`), add automatic legacy fallback mapping (`resolveEdgeVoiceId`), fail fast with clear error messages on non-transient WebSocket close codes (`WS 1007`/`1003`/`1008`), and fix `sleepWithAbort` `.unref()` premature exits in standalone Node runs.
- 修复 React 19 `useId()` 含冒号 ID（如 `:r19:`）导致 Voice Studio 侧边栏 Coachmark 新手引导 `querySelector` 抛出 `SyntaxError` 崩溃槽位的问题：清理工作台 Tabs `baseId` 并在 `CoachmarkTour` 增加安全选择器解析与 `getElementById` 回退，同时替换工作台过期的 Azure 音色默认占位符。
- Fix React 19 `useId()` colon selector crash (`SyntaxError` in `CoachmarkTour` `querySelector`) by sanitizing Voice Studio tab IDs and adding safe `CSS.escape` / `getElementById` fallback in `CoachmarkTour`, and update stale Azure voice placeholders in Voice Studio.

## 0.10.7 (2026-11-20)

- 升级共享更新组件至 0.2.10，移除跨插件右下角浮动提醒，保留工作台及插件详情页更新控制。

- ASR 并发任务失败后停止派发剩余请求，并等待已启动任务结束后清理临时文件，防止失败返回后继续请求和访问已删除音频。

## 0.10.6 (2026-11-20)

- 修复 SiliconFlow 参考音频缓存跨 API 密钥复用私有音色 URI 的问题；已完成上传缓存和并发上传去重均按账号隔离，同账号分段合成仍复用上传结果。
- Scope cached and in-flight SiliconFlow reference-voice uploads to the authenticated account, preserving same-account reuse while preventing private voice URIs from crossing credential changes.
- 修复工具参数使用宿主不支持的 JSON Schema 范围关键词导致工具注册失败的问题；数值限制继续由运行时校验，补充官方宿主注册和双语言 PTC SDK 验证。
- 同步共享更新组件 0.2.9，修复取消窗口和失败响应清理，并确保运行中旧协调器在空闲后接管修复。

## 0.10.5 (2026-11-20)

- 升级共享更新组件至 `@stardustlc/dsh-updates@0.2.7`：对话页「有新版本」提醒浮卡支持无交互 15 秒自动收起（悬停、聚焦、查看记录或确认弹窗时自动暂停，安装成功提示 6 秒收起，安装中/失败/需要重启仍保持常驻不隐藏）。
- Upgrade `@stardustlc/dsh-updates` to `0.2.7`: auto-dismiss idle update reminder cards after 15s and silent complete cards after 6s while pausing on hover/focus/notes/dialogs and keeping active, failed, or restart-required cards pinned.

## 0.10.4 (2026-11-20)

- 升级共享更新组件至 `@stardustlc/dsh-updates@0.2.6`：端到端验收修复浮卡与日历按钮重叠、详情页/工作台挂载时瞬时让位及 `package-moved` / 包管理器报错诊断文案，继续保持过期检查自动刷新与 `bundle-in-use` 指导。
- Upgrade `@stardustlc/dsh-updates` to `0.2.6`: E2E-verified fixes for floating Calendar FAB clearance, immediate reminder yield on native detail/workbench mount, and clearer `package-moved` / package-manager error messages, alongside auto-refresh and `bundle-in-use` guidance.

## 0.10.3 (2026-11-20)

- 在备用弹窗中，子菜单优先处理 Escape，避免误关外层表单。
- Let nested controls consume Escape before closing a fallback dialog.

## 0.10.2 (2026-11-19)

- 修复语音工作台弹窗和备用输入控件反复重挂载造成的编辑失焦，保留宿主迟到、替换与卸载的控件发现。
- Keep voice-workbench modal/input identity stable while observing host availability changes.

## 0.10.1 (2026-11-18)

- 升级共享更新组件至 `@stardustlc/dsh-updates@0.2.5`：独立安装插件详情页底栏去重（保留组合包组件委派与对话页热更新卡片），补齐 `bundle-in-use` 组合包占用提示说明，并在检查结果过期或远端版本变更时自动刷新元数据，彻底消除 `check-first` 卡顿。
- Upgrade `@stardustlc/dsh-updates` to `0.2.5`: deduplicate standalone native plugin detail footers while keeping Suite delegation and in-chat reminder cards, surface clear `bundle-in-use` guidance, and automatically refresh expired update checks without `check-first` stalls.

## 0.10.0 (2026-11-18)

- 短视频逐词/短句字幕与 `.ass` 卡拉 OK 高亮导出：`voice_tts` 新增 `subtitleGranularity`（`sentence` / `clause` / `word`）与 `maxCharsPerCue`（默认 `16`），支持导出 `1080×1920` SubStation Alpha `.ass` 字幕（含 `\kf` 逐词卡拉 OK 时间轴），可直接配合 `dsh-ffmpeg` 烧录竖屏花字。
- Short-video clause/word subtitles & `.ass` karaoke export: add `subtitleGranularity` (`sentence` / `clause` / `word`) and `maxCharsPerCue` (default `16`) to `voice_tts`, with `1080×1920` SubStation Alpha `.ass` output emitting `\kf` word-level karaoke timing ready for `dsh-ffmpeg` burn-in.
- 内联停顿标签与英文词边界发音保护：台词内支持 `[pause:500ms]` / `[break:600ms]` / `[停顿0.6s]` 导演级气口标记（Edge 编译为 SSML `<break>`，OpenAI/SiliconFlow 拼接同采样率静音帧，导出字幕自动剔除标记）；`pronunciations` 新增 ASCII 词边界保护，确保 `OS`、`UI`、`SQL` 等缩写绝不误伤 `POST`、`BUILD` 等单词子串。
- Inline speech pause tags & word-boundary-safe pronunciation lexicon: compile inline `[pause:500ms]` / `[break:600ms]` / `[停顿0.6s]` markers to SSML `<break>` on Edge and matched-sample-rate silence frames on OpenAI/SiliconFlow (automatically stripped from subtitles), and add ASCII word-boundary protection to `pronunciations` so short acronyms like `OS`, `UI`, and `SQL` never corrupt substrings inside `POST` or `BUILD`.
- 有声书/播客自动分章与原生 MP3 `CHAP`/`CTOC` 书签嵌入：多级标题 Markdown 文稿（`inputFile`）或带 `title` 的分段播客（`segments[]`）自动写入纯 TypeScript 生成的 ID3v2.3 `CHAP`/`CTOC` 章节书签，并支持 `chaptersOutput` 导出 `.md` 节目时间轴或 `.json` 章节清单。
- Audiobook/podcast auto-chapters & native MP3 `CHAP`/`CTOC` bookmarks: automatically embed pure-TS ID3v2.3 `CHAP`/`CTOC` chapter tags from multi-heading Markdown (`inputFile`) or titled `segments[]`, with optional `chaptersOutput` (`.md` show-notes timestamps or `.json`).
- 视频文件直传转写、零漂移 `atempo` 字幕配音、VBR 拼接修复与 Edge 热连接池：`voice_stt` 支持直接传入 `.mp4`/`.mkv`/`.mov`/`.avi` 视频容器自动调用本机 FFmpeg `-vn` 抽取 16kHz 单声道音频转写；`subtitleInput` 在超密台词加速后仍超窗时启用 FFmpeg `atempo` 保调精压实现零累积漂移；修复多段 VBR MP3 拼接残留首段 `Xing`/`Info`/`VBRI` 帧头锁死进度条的问题；Edge TTS 新增 WebSocket 保活连接池（`closeEdgeConnectionPool`）与瞬时断连自动重试。
- Direct video container STT, zero-drift `atempo` dubbing, VBR concat fix & Edge keep-alive WSS pool: auto-extract `-vn` 16kHz mono audio from `.mp4`/`.mkv`/`.mov`/`.avi` in `voice_stt`; add FFmpeg `atempo` pitch-preserving window fitting on dense `subtitleInput` cues; strip stale `Xing`/`Info`/`VBRI` metadata frames on multi-segment VBR MP3 concatenation; and add an Edge TTS keep-alive WebSocket pool (`closeEdgeConnectionPool`) with transient retry.
- Voice Studio 侧边栏「真·创作闭环」升级：新增「8 秒录音一键生成克隆角色」（`saveCloneVoice` 落盘 `voice_clones/` + 自动 ASR 转写参考台词 + 自动注册 `customVoices`）、可视化多角色对话合成器（`synthesizeDialogue` 面板内直接生成 MP3 与同步字幕）、第 5 标签页「工作区成品库」（`workspaceLibrary` / `loadWorkspaceMedia`）以及顶栏点击跳播的同步字幕跟读播放器与音频下载按钮。
- Voice Studio workbench "True Creative Loop": add 8-second 1-click mic voice clone creation (`saveCloneVoice` -> `voice_clones/` + auto-ASR + `customVoices`), visual multi-speaker dialogue synthesis (`synthesizeDialogue`), the 5th **Workspace Library** tab (`workspaceLibrary` / `loadWorkspaceMedia`), and an interactive click-to-seek synchronized subtitle follow-along player bar with direct audio download.

## 0.9.1 (2026-11-18)

- 运行时技能自动挂载与设置回退 ID 对齐：`apply` 通过 `ctx.inject(['skills'])` 将随包 `voice-workflow` 技能自动注册进宿主运行时技能表（支持 `effect`/`dispose` 热卸载）；Voice Studio 面板在缺少 `fiber` 元信息时的设置更新目标 ID 对齐 `cordis.patch.yml` 的 `'voice'`，并严格遵守宿主 `settings.writable` 只读状态。
- Runtime skill registration & settings entry ID alignment: automatically register the bundled `voice-workflow` skill into the host runtime `skills` service via `ctx.inject(['skills'])` with full `effect`/`dispose` cleanup, align the Voice Studio fallback settings entry ID with `'voice'` in `cordis.patch.yml`, and honor host `settings.writable` read-only state.

## 0.9.0 (2026-11-18)

- 新增原生 5 主题 Voice Studio 侧边栏工作台（原生清透 / 米白纸感 / Claude 暖书卷 / 8-Bit 像素 / 晴空薄荷）与 Coachmark 新手引导：支持在线试听 300+ 音色与 10 套人设、0.8x–1.5x 倍速播放、浏览器麦克风速记转写、自定义角色与发音词典管理，并集成 `@stardustlc/dsh-updates` 底部更新控件。
- Add native 5-theme Voice Studio sidebar workbench (Native Airy / Warm Cream / Claude Warmth / Bright 8-Bit / Airy Mint) with interactive Coachmark onboarding: in-panel audition of 300+ voices & 10 personas with 0.8x–1.5x playback speed, browser `MediaRecorder` mic memo transcription, custom voice aliases & pronunciation lexicon management, and `@stardustlc/dsh-updates` footer controls.
- 精准 MP3 帧与 Xing/VBRI VBR 时长解析（`inspectMp3Buffer`）与匹配采样率静音帧生成（`createSilenceMp3`）：`voice_tts` 返回精确数值 `durationMs` 与 `durationSec`，助力精准卡点配音。
- Exact MP3 frame & Xing/VBRI VBR duration inspector (`inspectMp3Buffer`) and matched-sample-rate silence frames (`createSilenceMp3`): `voice_tts` now returns accurate numeric `durationMs` and `durationSec` for tight voiceover timing.
- 发音词典（`pronunciations`）：Edge 引擎自动生成单趟 SSML `<sub alias>`（字幕保留 `Nginx` 原文，朗读按 `Engine X` 发音），OpenAI/SiliconFlow 引擎执行非递归纯文本替读，并支持宿主原生热更新配置。
- Pronunciation lexicon (`pronunciations`): emits single-pass SSML `<sub alias>` on Edge (retaining original terms like `Nginx` in subtitles while speaking `Engine X`), performs non-recursive plain-text replacement on OpenAI/SiliconFlow, and supports volatile live-reloaded DSH settings.
- 反向 `.srt` / `.vtt` 字幕时间轴卡点配音（`subtitleInput`）：按视频字幕时间窗自动计算 `scaleRatePercent` 加速重合成并精确填充前导与句间静音。
- Reverse `.srt` / `.vtt` timeline-synced video dubbing (`subtitleInput`): automatically computes per-cue `scaleRatePercent` speedup re-synthesis when over-window and pads exact leading/inter-cue silence.
- 播客 BGM 自动闪避混音（`bgmFile` / `bgmVolume` / `bgmDucking`）、说话人区分（`voice_stt` `diarize: true` + 双声道分离）与 SiliconFlow SHA-256 参考音频 URI 缓存上传（`/uploads/audio/voice` 分段仅上传一次）。
- Podcast BGM auto-ducking (`bgmFile` / `bgmVolume` / `bgmDucking` via FFmpeg `sidechaincompress`), speaker diarization (`voice_stt` `diarize: true` with stereo channel splitting), and SiliconFlow SHA-256 reference voice URI upload caching (`/uploads/audio/voice` uploaded once per reference clip).

## 0.8.1 (2026-11-18)

- 升级共享更新组件至 `@stardustlc/dsh-updates@0.2.4`：对话页新增一键热更新提醒卡片，自动检查周期缩短至 6 小时，手动热更新后可顺手开启包含兼容功能小版本的空闲自动更新。
- Upgrade `@stardustlc/dsh-updates` to `0.2.4`: add an actionable in-chat hot-update reminder card, 6-hour background update checks, compatible minor+patch idle auto-updates, and a post-update opt-in prompt.

## 0.8.0 (2026-11-18)

- 全量音色发现与内置目录扩容（Layer 1–2）：`voice_list` 支持 `online: true` 联网拉取并缓存微软 Edge 300+ 实时音色目录（24 小时内存缓存，断网自动回退）；内置音色由 29 个扩充至 45 个，覆盖童声（晓双/晓悠）、少年动漫（云夏）、纪录片/成熟（云泽/晓秋）、老年（晓睿）、激昂解说（云皓）及粤语/台湾腔/河南话/山东话等方言，并附带 `tags` 标签筛选。
- Full live voice discovery & catalog expansion (Layers 1–2): `voice_list` adds `online: true` to fetch and cache Microsoft Edge's 300+ live neural voice catalog for 24h (with automatic offline fallback); built-in `VOICES` expands from 29 to 45 voices covering child, teen/anime, mature/documentary, elder, expressive commercial, and regional Chinese dialects with tag filtering.
- 10 组开箱即用角色人设（Layer 2–4）：新增 `VOICE_PERSONAS` 与 `persona` 参数（如 `late-night-radio`、`documentary-narrator`、`anime-boy`、`bedtime-story`、`bilingual-tech-female` 等），可直接用于 `voice_tts`、`segments[]` 分段播客及 `voice_preview` 试听对比。
- 10 ready-made voice personas (Layers 2–4): introduce `VOICE_PERSONAS` and the `persona` parameter (e.g., `late-night-radio`, `documentary-narrator`, `anime-boy`, `bedtime-story`, `bilingual-tech-female`) across `voice_tts`, multi-speaker `segments[]`, and `voice_preview`.
- 情绪演技指令、零样本声音克隆与自定义别名（Layer 3–4）：新增 `instructions` 自然语言语气控制（自动映射 SiliconFlow `CosyVoice2-0.5B` `<|endofprompt|>` 前缀及 `[laughter]`/`[breath]` 副语言标记，以及 OpenAI `gpt-4o-mini-tts` `instructions`）；新增工作区边界受控的 `referenceAudio` + `referenceText` 零样本克隆与可热更新的 `customVoices` 自定义别名设置；新增 `normalizeLoudness: true` 调用本机 FFmpeg 执行 `-16 LUFS` 播客响度均衡。
- Emotion acting, zero-shot cloning & custom aliases (Layers 3–4): add natural-language `instructions` (mapped to `<|endofprompt|>` with `[laughter]`/`[breath]` on SiliconFlow `CosyVoice2-0.5B`, or `instructions` on `gpt-4o-mini-tts`), workspace-bounded `referenceAudio` + `referenceText` zero-shot voice cloning, live-reloaded `customVoices` aliases in DSH Settings, and optional `-16 LUFS` podcast loudness mastering via `normalizeLoudness: true`.

## 0.7.0 (2026-11-18)

- 稳定性与协议加固（P0）：严格校验 Edge TTS `Path:audio` 音频帧头与 `turn.end` 截断保护；HTTP 403 自动读取响应 `Date` 校准时钟偏差；剔除 XML 1.0 非法控制字符并转义 SSML 属性；扩展方言、多语种及 HD 音色校验与筛选；支持配置 `timeoutMs` 热更新读取与动态 `isConcurrencySafe`；`voice_health` 新增 `ttsReady`/`sttReady`、`scope` 影响面、韵律参数检查及本机免密钥 Whisper 探测。
- P0 hardening: validate Edge TTS `Path:audio` binary frame headers and enforce strict `turn.end` truncation guards; auto-calibrate clock skew from HTTP 403 `Date` headers; strip illegal XML 1.0 control chars and escape SSML attributes; expand dialect, multilingual, and HD voice validation/filtering; resolve `timeoutMs` dynamically with live `isConcurrencySafe`; and enrich `voice_health` with `ttsReady`/`sttReady`, `scope`, prosody validation, and keyless loopback Whisper probing.
- 核心能力升级（P1）：`voice_tts` 新增 `inputFile` 文档直读、Markdown 清理与 10 万字符长文本自动分段合成，支持多角色 `segments` 播客合成及原生 MP3 静音帧拼接；`voice_tts` 与 `voice_stt` 均支持导出 `.srt`/`.vtt` 字幕（`subtitleOutput`）；`voice_stt` 采用 `openAsBlob` 零拷贝上传，并支持 `autoCompress` 对超 25MB 音频调用 FFmpeg 转码或分段识别。
- P1 core upgrades: add `inputFile` reading, Markdown cleanup, and 100k-char auto-chunking to `voice_tts`, plus multi-speaker `segments` podcast synthesis with native MP3 silence frames; support `.srt`/`.vtt` `subtitleOutput` in both `voice_tts` and `voice_stt`; switch `voice_stt` to zero-copy `openAsBlob` uploads and add `autoCompress` FFmpeg transcode/segmentation for >25MB audio.
- 生态扩展与交互增强（P2）：新增 `ttsEngine` 对 OpenAI / SiliconFlow / 自定义网关的支持与 `siliconflow` ASR/TTS 预设；内置零外部依赖的 `socks5://` 与 `socks5h://` 代理隧道；`voice_preview` 生成可视化 `index.html` 音色试听卡片；新增内置工作流技能 `skills/voice-workflow/SKILL.md`。
- P2 ecosystem & UX: add `ttsEngine` support for OpenAI, SiliconFlow, and custom endpoints with `siliconflow` ASR/TTS presets; add zero-dependency `socks5://`/`socks5h://` proxy tunneling; generate a visual `index.html` audition card in `voice_preview`; and bundle `skills/voice-workflow/SKILL.md`.

## 0.6.1 (2026-11-18)

- 同步 `@stardustlc/dsh-updates` 0.2.3：侧边栏工作台平时默认隐藏底部更新栏（零高度占用），仅在检测到兼容新版本或执行更新时浮现单行精简提示条；完整更新设置与检查入口统一保留在 DSH「插件」详情页底部。
- Sync `@stardustlc/dsh-updates` 0.2.3: keep the sidebar workbench update footer hidden by default when up-to-date, surfacing a single-line compact strip only for actionable updates or active jobs while retaining full controls in native Plugin Details.

## 0.6.0 (2026-11-18)

- 新增零外部依赖的宿主原生 `Config` 设置表单声明（`asrApiKey` 与 `proxyUrl` 自动脱敏并支持热更新生效），明确配音免密钥开箱即用与转写配置指引，并补齐日常配音/会议纪要使用流程。
- Export a zero-dependency native DSH `Config` schema with secret masking and live reload across all 10 voice/ASR settings, clearer zero-key TTS vs. ASR setup hints, and human-centric workflow docs.

## 0.5.11 (2026-11-18)

- 更新区底部新增克制、无打扰的 GitHub 点赞与问题反馈快捷链接，并完善中英文检索关键词。
- Add subtle, non-intrusive GitHub Star and issue feedback links in the update footer, and expand search keywords.

## 0.5.10 (2026-11-18)

- 同步 `@stardustlc/dsh-updates` 0.2.1：恢复 Suite 整包统一更新（移除独立拆包迁移），保留整包与独立插件的原地热更新与失败自动回滚。
- Sync `@stardustlc/dsh-updates` 0.2.1: restore unified Suite bundle updates (removing standalone conversion) while retaining in-place hot reload and automatic rollback.

## 0.5.9 (2026-11-18)

- 深度适配 DSH 0.2.2：补齐 manifestVersion 1 与双语元数据；改用 Cordis 4 `ctx.effect` 管理清理并使用宿主日志接口，为音色列表与健康检查工具声明并发安全。
- Deeply adapt to DSH 0.2.2: add manifestVersion 1 and bilingual locale metadata; migrate lifecycle cleanup to Cordis 4 `ctx.effect` with host logger support and mark `voice_list`/`voice_health` concurrency-safe.

## 0.5.8 (2026-11-17)

- 在原生插件详情页单独检查和安装兼容版本。自动安装默认关闭，可为该插件开启空闲时的稳定补丁更新。
- Check and install compatible versions separately from the native plugin details. Automatic installation is off by default. Enable it for this plugin to apply stable patches while idle.

## 0.5.7 (2026-11-14)

- 适配 DSH 0.2.2-rc.3：最低 Harness 版本声明提升至 0.2.2-rc.3，运行时代码未变。
- Support DSH 0.2.2-rc.3: raise the minimum Harness declaration to 0.2.2-rc.3; runtime code is unchanged.

## 0.5.6 (2026-11-04)

- 同步共享界面：嵌入设置时继承宿主底色，输入框跟随主题，空状态保持可读宽度；新版 DSH 可显示插件设置图标。
- Align embedded surfaces, themed inputs, readable empty states and optional native settings icons.


## 0.5.5 (2026-11-03)

- voice_stt 显示落盘路径；voice_health 失败项带 hint 与影响面；使用说明补齐排错。
- voice_stt reports the transcript path, voice_health adds hints and scope, and troubleshooting docs are added.

## 0.5.4 (2026-10-30)

- 重整中英文首页：用途、三步流程图、安装入口与操作示例；详细配置与边界集中到完整说明。
- 保留下载统计、独立更新选择、问题反馈和贡献入口；原封面与运行功能保留。
- Refresh bilingual landing pages, workflow artwork, quick starts and reference navigation.


## 0.5.3 (2026-10-30)

- 原生插件列表与详情新增专门生成的鲸鱼娘图标：大头像、独立功能符号、透明留白，适合 30 / 36 px 显示；原封面保留。
- Add purpose-made whale-girl artwork with a distinct function emblem, transparent padding and small-size readability; preserve the original cover.


[返回简介](README.md) · [使用说明](docs/USAGE.md) · [验证记录](docs/VALIDATION.md)

[历史英文记录](docs/CHANGELOG.en.md)

## 0.5.2 (2026-10-29)

- 补齐中英文使用流程：准备、入口、具体操作与结果核对；新增累计 npm 下载徽章并保留月统计。
- Add practical getting-started workflows and lifetime npm download badges alongside monthly counts.

## 0.5.1 (2026-10-29)

- 同步仓库与 npm 的简明介绍、中英文 README 和反馈入口；本次为文档与包元数据更新。
- Sync npm descriptions and both README guides with the repository, including issue and pull-request links.

## 0.5.0 (2026-10-28)

- 跟进 edge-tts 7.3.1 的 v2 令牌与 Cookie 协议，恢复真实 Edge 在线语音；独立模块保留上游 LGPLv3 许可与源码，主体仍为 MIT。

- ASR 不再跟随重定向上传音频；请将 asrBaseUrl 直接设为可信的最终接口。直连和插件代理均适用。
- 修复同名音频并发生成时的覆盖问题，转写和试听也返回实际保存的独立文件名。
- 显式覆盖只允许没有硬链接的普通文件，保留工作区和链接边界检查。

## 0.4.3 (2026-10-27)

- 修复分批更新时的新旧更新控件混用：保留原页面、草稿与安装保护，空闲后接管旧控制器，兼容旧入口。

## 0.4.2 (2026-10-27)

- 更新控件移至原有工作台或原生插件详情页底部；更新记录与选项原地展开，移除独立更新菜单与页面。
- 保留原页面操作与草稿，自动安装默认关闭；安装前确认，遇到未保存修改或运行任务时暂停。

## 0.4.1 (2026-10-27)

- Keep this component's own update entry visible when installed transitively through Suite. Confirm whole-Suite update scope before opening its controls.
- Keep automatic installation off by default and preserve independent installation behavior.

## 0.4.0 (2026-10-26)

- Add this plugin’s own update controls and independent preferences. Automatic installation stays off until explicitly enabled.
- Confirm manual installs, preserve local sources and disabled state, pause for tasks or unsaved changes, and use native DSH recovery without forced restarts.
- Require the public DSH 0.2.1-rc.3 update APIs; Suite components remain managed through Suite.

## 0.3.7 (2026-10-20)

- 修复 voice_stt 的引擎/地址错配：openai、groq 分支不再写死厂商地址，一律使用配置 `asrBaseUrl`；模型传的 `engine` 与配置 `asrEngine` 不一致时直接报错，避免把 groq 的密钥发给 OpenAI 或把自建服务的密钥发给厂商
- 修复读写越界：`audio` 与 `output`/`outputDir` 解析后必须落在会话工作区内（含符号链接解析），工作区外的文件不再被整份上传给 ASR，也不再在工作区外创建文件
- 拒绝跟随符号链接写入（含悬空链接），新建文件用 `O_EXCL`；转写文本改为 0600
- `voice_preview` 复用 `resolveOutputPath`：`overwrite=false` 时同名样例加序号，不再直接覆盖
- 音频大小按实际读到的字节数复查，`stat` 报 0 字节的伪文件不再绕过 25MB 预检
- 新增 8 项回归测试（工作区越界、私钥不被上传、符号链接、engine 错配、自定义网关、preview 不覆盖）

## 0.3.6 (2026-10-05)

- ASR 网络与响应体读取均受超时和取消控制；保留用户取消原因，空白或缺失识别结果明确报错，不伪造成功文本文件。

## 0.3.5 (2026-09-28)

- 更新官方 Harness 0.2.0-rc.1 的兼容声明和共同加载验证；运行时代码未变。验证范围见[验证记录](docs/VALIDATION.md)。

## 0.3.4 (2026-09-19)

- 修复代理路径 STT 上传 `[object FormData]`、25MB 校验在读入之后、输出目录不存在白烧一次合成、默认输出落宿主 cwd；`exec.signal` 全程透传、preview 改 3 路并发。测试 55 项。

## 更早的改动

完整历史可查阅 [GitHub 提交记录](https://github.com/STARDUSTLC666/dsh-voice/commits/master)。
