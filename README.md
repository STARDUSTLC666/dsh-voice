**简体中文** · [English](README.en.md)

# Voice

**一句话许愿，把文字变成自然人声，把音视频变成干净文字。**

DeepSeek Harness（`>=0.2.2-rc.3`）**许愿式（Wish-Driven）聊天优先**语音插件（同时附带 5 套主题可选的 **Voice Studio** 侧边栏工作台）：无需记音色 ID、无需反复填参数，在对话框里用自然语言提出需求即可在 1–2 步内拿到完整成品——支持 **6 大创作场景预设（`scene`：`podcast`/`short-video`/`audiobook`/`briefing`/`story`/`dubbing`）**、**自然语言风格与方言模糊选声（`"深夜"`、`"纪录片"`、`"粤语男声"`、`"东北话"` 等）**、**目标时长自动校准（`targetDurationSec`）**、**内置词边界安全技术发音词典（`autoPronunciations`）**、**自包含 HTML5 交互跟读播放器（`createPlayer` / `playerOutput` → `.player.html`）**、**按场景一键精选试听（`voice_preview({ scene })`）** 与 **对话动口持久化记住偏好（`voice_prefs`）**。底层提供零密钥 Edge 神经网络语音（Keep-Alive 连接池、51 个实测可用内置 + 300+ 在线音色、10 套人设）及 OpenAI / SiliconFlow / 自定义引擎（情绪演技、Kokoro 混音、SHA-256 缓存零样本克隆），全面覆盖 **短视频卡拉 OK `.ass` 字幕（`\kf` 逐词高亮）**、**内联停顿（`[pause:500ms]`）**、**原生 MP3 章节书签（ID3v2 `CHAP`/`CTOC`）**、**零漂移 `.srt`/`.vtt` 反向配音（`atempo`）**、**播客 BGM 自动闪避与 `-16 LUFS` 均衡** 以及 **视频直传抽音（`.mp4`/`.mkv`/`.mov`/`.avi`）+ 说话人区分（`diarize`）** 的多引擎 STT，全部读写严格限制在当前会话工作区内。

[![npm](https://img.shields.io/npm/v/dsh-voice)](https://www.npmjs.com/package/dsh-voice) [![downloads](https://raw.githubusercontent.com/STARDUSTLC666/dsh-suite/npm-downloads/assets/dsh-voice-downloads.svg)](https://www.npmjs.com/package/dsh-voice) [![total downloads](https://raw.githubusercontent.com/STARDUSTLC666/dsh-suite/npm-downloads/assets/dsh-voice-total-downloads.svg)](https://www.npmjs.com/package/dsh-voice)

**[安装使用](#安装) · [最快 3 步用起来](#最快-3-步用起来) · [完整说明](https://github.com/STARDUSTLC666/dsh-voice/blob/master/docs/USAGE.md)**

<picture>
  <source media="(prefers-color-scheme: dark) and (max-width: 640px)" srcset="https://raw.githubusercontent.com/STARDUSTLC666/dsh-voice/master/docs/assets/intro/workflow-zh-mobile-dark.svg">
  <source media="(max-width: 640px)" srcset="https://raw.githubusercontent.com/STARDUSTLC666/dsh-voice/master/docs/assets/intro/workflow-zh-mobile-light.svg">
  <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/STARDUSTLC666/dsh-voice/master/docs/assets/intro/workflow-zh-dark.svg">
  <img src="https://raw.githubusercontent.com/STARDUSTLC666/dsh-voice/master/docs/assets/intro/workflow-zh-light.svg" alt="把文字变成声音，把录音变成文字。 · 流程示意" width="100%">
</picture>

## 核心亮点

- **许愿式（Wish-Driven）一句话出成品（`voice_tts` + `voice_preview` + `voice_prefs`）**：
  - **6 大场景配方（`scene`）**：直接传 `podcast`（播客）、`short-video`（短视频/口播）、`audiobook`（有声书）、`briefing`（简报）、`story`（故事）或 `dubbing`（配音），自动配齐人设、字幕粒度、响度均衡、Markdown 清理与智能文件名；本机缺 `ffmpeg` 时响度均衡自动优雅降级并返回 `warnings`，不打断创作。
  - **自然语言模糊选声与目标时长校准**：`voice`/`persona` 直接识别 `"深夜"`、`"纪录片"`、`"播客女"`、`"粤语男声"`、`"东北话"` 等口语风格词；传入 `targetDurationSec`（`3–3600` 秒）自动按比例调速重合成并配合 FFmpeg `atempo` 精准压入目标时长。
  - **内置技术发音词典 + 自包含 HTML5 交互播放器**：默认开启 `autoPronunciations`（`Nginx`、`SQL`、`K8s`、`PostgreSQL`、`kubectl`、`GraphQL`、`WebSocket` 等词边界安全替读，绝不误伤 `POST`/`BUILD`）；开启 `createPlayer: true` 或指定 `playerOutput` 即刻生成零依赖 `<文件名>.player.html`（明暗主题、倍速、下载、章节跳转与点击字幕跟读）。
  - **对话动口记住偏好（`voice_prefs`）与按场景精选试听（`voice_preview({ scene })`）**：说一句「以后默认用纪录片声音、把 Cordis 读成科迪斯」即热更新持久化保存创作偏好（严格隔离密钥/代理/引擎）；说「帮我挑几个播客/方言声音」一步生成 3–4 路精选对比试听页。
- **短视频卡拉 OK `.ass` 字幕、原生 MP3 章节、零漂移配音与播客 BGM 闪避**：`subtitleGranularity`（`"sentence"` | `"clause"` | `"word"`）+ `maxCharsPerCue` 切出紧凑竖屏短句，`subtitleOutput: "clip.ass"` 直出 `1080x1920` 带 `\kf` 逐词高亮字幕供 `dsh-ffmpeg` 烧录；文稿内联 `[pause:500ms]` / `[停顿0.6s]` 停顿跨引擎通用且自动从字幕剥离；多标题 Markdown 或带 `title` 的 `segments[]` 自动写入 MP3 ID3v2 `CHAP`/`CTOC` 章节书签并支持 `chaptersOutput`；`subtitleInput` 叠加 FFmpeg `atempo` 实现零累积漂移配音，VBR 多段拼接自动剥离 `Xing`/`Info`/`VBRI` 保证进度条与 `durationSec` 精准。
- **视频文件直传转写（`voice_stt`）与范围化离线自检（`voice_health`）**：`voice_stt` 支持直接传入 `.mp4`/`.mkv`/`.mov`/`.avi` 视频容器自动 `-vn` 抽音（16kHz 单声道）送审 ASR，支持 `diarize: true` 说话人区分、`autoCompress`（>25MB 自动切片）与本地回环免密 Whisper；`voice_list` 支持 51 个实测内置 + 300+ 在线 Edge 音色（聊天输出超 60 条自动折叠防刷屏）及 10 大 `persona`；`voice_health` 纯离线分 `tts`/`stt` 范围快速定位配置问题。
- **按需使用的 5 主题 Voice Studio 侧边栏工作台**：当你需要**浏览器麦克风 8 秒录音一键建克隆角色**（落盘 `voice_clones/` + 自动 ASR 提取台词 + 注册 `customVoices`）、可视化编排多角色对话或在「工作区成品库」里边听边跟读字幕时，打开侧边栏即可实时切换 **原生清透 / 米白纸感 / Claude 暖书卷 / 8-Bit 像素 / 晴空薄荷** 5 套主题。

### 内置 6 个工具速览

| 工具 | 一句话定位 |
| :--- | :--- |
| `voice_tts` | 许愿式一体化合成 MP3、同步字幕（`.srt`/`.vtt`/`.ass`）、MP3 章节、交互播放器（`.player.html`）与 BGM 自动闪避播客 |
| `voice_stt` | 音视频转文字与字幕（支持 `.mp4`/`.mkv`/`.mov`/`.avi` 自动抽音、`diarize` 说话人区分与 `autoCompress`） |
| `voice_list` | 发现 51 个实测内置与 300+ 在线 Edge 音色、10 套 `persona` 人设及自定义角色别名 |
| `voice_preview` | 按 `scene` 场景/风格一键精选 3–4 个音色批量试听并生成 `voice_previews/index.html` 对比页 |
| `voice_health` | 纯本地离线配置自检（支持 `scope: "tts" | "stt" | "all"`，分别汇报 `ttsReady` / `sttReady`） |
| `voice_prefs` | 对话动口持久化记住默认音色/人设、语速音调、发音词典与自定义角色别名（严格非凭据白名单） |

## 安装

在 DSH 桌面版「插件」面板搜索安装 `dsh-voice`，或使用命令行：

```bash
dsh plugin --profile desktop add dsh-voice
```

网页版把 `desktop` 改为 `web`；安装后重启一次 DSH。宿主要求 `>=0.2.2-rc.3`。插件附带许愿式 `voice-workflow` 技能包，会在语音合成、按场景选声、目标时长控制、交互播放器生成、偏好记忆、短视频卡拉 OK 字幕、播客混音与音视频转写任务中自动指引助手 1–2 步直达成品。

<a id="开始使用"></a>
## 最快 3 步用起来

1. **直接在聊天框许愿，零密钥即刻合成**：装好插件后无需任何密钥，直接对助手说「把 `report.md` 做成带章节和交互播放器的有声书」或「帮我挑几个适合播客的声音听听」，助手自动调用 `voice_tts` / `voice_preview` / `voice_list` 一次交齐 MP3、字幕与 `.player.html`。
2. **动口记住习惯，按需配置克隆或转写密钥**：随时对助手说「以后默认用纪录片声音、把 `Nginx` 读成 `Engine X`」（`voice_prefs` 立即持久化）；如需情绪演技、零样本克隆或音视频转写（`voice_stt`），打开 **DSH「设置 → 插件 → 语音（dsh-voice）」** 切换 `ttsEngine`（`siliconflow` / `openai` / `custom`）或填写 `asrApiKey`（本地回环 `127.0.0.1`/`localhost` 免密，保存即生效），遇到问题随时用 `voice_health` 离线自检。
3. **打开 `.player.html` 或按需使用侧边栏 Voice Studio**：所有文稿、字幕、BGM、参考音频与成品均安全落在当前会话工作区（默认同名自动编号不误盖），可直接打开 `.player.html` 点击字幕/章节回放，或按需在侧边栏 Voice Studio 进行 8 秒麦克风录音一键克隆与成品库浏览。

## 平时怎么对助手说（可直接复制的许愿示例）

- **一句话按场景挑声音试听**
  > 帮我挑几个适合科技播客的声音试听一下，生成对比网页让我选。
- **把多标题 Markdown 做成带章节与交互播放器的有声书**
  > 直接把工作区里的 `weekly-report.md` 做成沉稳纪录片风格的有声书，带上章节书签、字幕和 `.player.html` 交互播放器。
- **制作带 BGM 自动闪避的双人科技播客**
  > 把这份更新日志改写成轻松的双人播客（女主持 + 男主持，配上工作区 `assets/bgm.mp3`），做好响度均衡和交互播放器。
- **给短视频配 30 秒以内的口播 + 竖屏卡拉 OK 花字字幕**
  > 用有感染力的声音读这段短视频口播稿（保留 `[pause:500ms]` 停顿，总时长严格控制在 30 秒以内），导出 `clip.mp3` 和带逐词高亮的 `clip.ass`。
- **用方言/风格词即刻配音，并让助手以后记住偏好**
  > 先用粤语男声读一下这段产品介绍；另外以后默认用「纪录片」声音、语速 `-5%`，并记住把 `Cordis` 读成 `科迪斯`。
- **按 `.srt` 字幕零漂移卡点配音，或直接转写 `.mp4` 会议录像**
  > 按 `video.srt` 时间轴做零漂移中文配音；或者把 `lecture.mp4` 直接转写成带说话人区分的纪要和 `lecture.srt`。

## 常见卡点自检

| 遇到的现象 | 10 秒定位原因 | 怎么修 |
| :--- | :--- | :--- |
| 自检提示「缺 ASR 密钥」但只想做朗读配音 | ASR 密钥仅音视频转文字（`voice_stt`）需要，不影响朗读 | **直接正常合成语音即可**（`voice_health({ scope: "tts" })` 可单独确认 `ttsReady`） |
| 传入 `referenceAudio` 提示引擎不支持克隆 | 默认 `edge` 引擎不支持零样本参考音频克隆 | 在 DSH「设置 → 插件 → 语音」将 `ttsEngine` 切为 `siliconflow` 或 `custom`（保存即生效） |
| 播客响度均衡提示跳过，或视频抽音/`bgmFile`/`atempo` 提示缺工具 | `-16 LUFS` 均衡、视频抽音（`-vn`）、BGM 闪避与 `atempo` 精缩需本机 `ffmpeg` | `normalizeLoudness` 缺 `ffmpeg` 时会自动跳过并输出干净 MP3 + `warnings`；安装本机 `ffmpeg` 即可开启全部音视频后处理 |
| `voice_prefs` 提示当前设置只读 | 宿主当前以只读配置模式运行（`settings.writable === false`） | 在 DSH「设置 → 插件 → 语音」手动修改，或在单次 `voice_tts` 中直接传入所需参数 |
| 提示「必须位于会话工作区内」 | 文稿、字幕、BGM、音视频、参考音频或输出路径指到了工作区外面 | 先把文件复制进当前会话工作区文件夹再让助手处理 |
| 合成或转写报网络连接失败 | 受限网络无法直连在线语音 / ASR 服务 | 在 DSH「设置 → 插件 → 语音」填入本地代理 `proxyUrl`（支持 `http://` / `https://` / `socks5://` / `socks5h://`，保存即生效） |
| 音频超过 25MB 无法转写 | 在线 ASR 接口单文件体积上限为 25MB | 让助手开启 `autoCompress: true`（视频文件会自动抽音压缩，需本机 `ffmpeg`）或先用 `dsh-ffmpeg` 处理 |

## 插件更新

在原生插件详情页底部检查更新。默认自动检查，**默认不自动安装**；是否安装、何时重启由你决定。Suite 管理的组件随整包更新。

## 文档

- [使用说明与参数参考](https://github.com/STARDUSTLC666/dsh-voice/blob/master/docs/USAGE.md)
- [详细参考说明](https://github.com/STARDUSTLC666/dsh-voice/blob/master/docs/REFERENCE.zh.md)
- [更新记录](https://github.com/STARDUSTLC666/dsh-voice/blob/master/CHANGELOG.md)
- [验证范围与历史](https://github.com/STARDUSTLC666/dsh-voice/blob/master/docs/VALIDATION.md)

## 反馈与贡献

如果插件帮到了你，欢迎 Star。问题和建议请提交 [Issues](https://github.com/STARDUSTLC666/dsh-voice/issues)，也欢迎 [PR](https://github.com/STARDUSTLC666/dsh-voice/pulls)（反馈时请移除凭据）。

## License

[MIT AND LGPL-3.0-only](https://github.com/STARDUSTLC666/dsh-voice/blob/master/LICENSE)

<a id="依赖与配置"></a>
