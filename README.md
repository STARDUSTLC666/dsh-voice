**简体中文** · [English](README.en.md)

# Voice

**把文字变成自然人声，把音视频变成干净文字。**

DeepSeek Harness（`>=0.2.2-rc.3`）语音工作台插件：原生提供 **5 套主题可切换的 Voice Studio 真·创作闭环侧边栏工作台**（原生清透 / 米白纸感 / Claude 暖书卷 / 8-Bit 像素 / 晴空薄荷，支持 8 秒麦克风一键建克隆角色、可视化多角色对话直出 MP3、工作区成品库与点击跳转字幕跟读播放器），内建零密钥 Edge 神经网络语音（连接池复用、300+ 在线音色与 10 套人设）及 OpenAI / SiliconFlow / 自定义引擎（情绪演技、Kokoro 混音、SHA-256 缓存零样本克隆），支持 **短视频词/短句粒度与卡拉 OK `.ass` 字幕（`\kf` 逐词高亮）**、**文稿内联停顿标记（`[pause:500ms]`）与词边界安全发音词典（`pronunciations`）**、**原生 MP3 章节书签（ID3v2 `CHAP`/`CTOC` + `chaptersOutput`）**、**零漂移 `.srt`/`.vtt` 字幕反向配音（`atempo`）与 VBR 多段精确时长（`durationSec`）**、**播客 BGM 自动闪避与 `-16 LUFS` 响度均衡**，以及支持 **视频文件直传抽音（`.mp4`/`.mkv`/`.mov`/`.avi`）与说话人区分（`diarize`）** 的多引擎 STT，严格限制在当前会话工作区内。

[![npm](https://img.shields.io/npm/v/dsh-voice)](https://www.npmjs.com/package/dsh-voice) [![downloads](https://raw.githubusercontent.com/STARDUSTLC666/dsh-suite/npm-downloads/assets/dsh-voice-downloads.svg)](https://www.npmjs.com/package/dsh-voice) [![total downloads](https://raw.githubusercontent.com/STARDUSTLC666/dsh-suite/npm-downloads/assets/dsh-voice-total-downloads.svg)](https://www.npmjs.com/package/dsh-voice)

**[安装使用](#安装) · [最快 3 步用起来](#最快-3-步用起来) · [完整说明](https://github.com/STARDUSTLC666/dsh-voice/blob/master/docs/USAGE.md)**

<picture>
  <source media="(prefers-color-scheme: dark) and (max-width: 640px)" srcset="https://raw.githubusercontent.com/STARDUSTLC666/dsh-voice/master/docs/assets/intro/workflow-zh-mobile-dark.svg">
  <source media="(max-width: 640px)" srcset="https://raw.githubusercontent.com/STARDUSTLC666/dsh-voice/master/docs/assets/intro/workflow-zh-mobile-light.svg">
  <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/STARDUSTLC666/dsh-voice/master/docs/assets/intro/workflow-zh-dark.svg">
  <img src="https://raw.githubusercontent.com/STARDUSTLC666/dsh-voice/master/docs/assets/intro/workflow-zh-light.svg" alt="把文字变成声音，把录音变成文字。 · 流程示意" width="100%">
</picture>

## 核心亮点

- **Voice Studio 真·创作闭环侧边栏工作台（5 套主题）**：实时同步 **原生清透 / 米白纸感 / Claude 暖书卷 / 8-Bit 像素 / 晴空薄荷** 主题与 Coachmark 引导；支持在线试听 300+ Edge 音色与 10 套 `persona`、**浏览器麦克风 8 秒录音一键生成克隆角色**（自动保存至 `voice_clones/`、自动 ASR 提取参考台词并注册 `customVoices`）、**可视化多角色对话编排器面板内直出 MP3**，以及 **工作区成品库 + 点击字幕跳转跟读播放器**。
- **短视频短句/逐词字幕、卡拉 OK `.ass` 导出、内联停顿与词边界替读**：`subtitleGranularity`（`"sentence"` | `"clause"` | `"word"`）配合 `maxCharsPerCue`（默认 `16`）自动切出紧凑竖屏短句，`subtitleOutput: "clip.ass"` 直出带 `\kf` 逐词高亮时间轴的 `1080x1920` SubStation Alpha 字幕供 `dsh-ffmpeg` 烧录；文稿内嵌 `[pause:500ms]` / `[break:600ms]` / `[停顿0.6s]` 在 Edge（复用保活连接池）与 OpenAI/SiliconFlow 下统一分段合成并插入匹配采样率静音帧，且在字幕中自动剥离；`pronunciations` 具备 ASCII 词边界保护（`OS`、`UI`、`SQL` 绝不误伤 `POST`、`BUILD`）。
- **有声书/播客原生 MP3 章节（`CHAP`/`CTOC`）、零漂移配音、VBR 修复与 BGM 闪避**：多级标题 Markdown（`#`/`##`/`###`）或带 `title` 的 `segments[]` 自动写入可点击跳转的 MP3 ID3v2 `CHAP`/`CTOC` 章节书签并可通过 `chaptersOutput` 导出 `chapters.md` / `chapters.json`；`subtitleInput` 叠加 FFmpeg `atempo` 保调精缩实现密集字幕零累积漂移；多段 VBR MP3 拼接自动剥离 `Xing`/`Info`/`VBRI` 帧头确保进度条与 `durationSec` 完整准确；Edge TTS 内置 Keep-Alive WebSocket 连接池与瞬断重试；完整支持 `bgmFile` 自动闪避、`-16 LUFS` 响度均衡、演技 `instructions` 与 SiliconFlow SHA-256 缓存克隆。
- **视频文件直传转写（`.mp4`/`.mkv`/`.mov`/`.avi`）、长文直读与说话人区分**：`voice_stt` 支持直接传入视频容器并通过本机 `ffmpeg` 自动剥离画面（`-vn`）提取 16kHz 单声道音频送审 ASR，同时支持 `diarize: true` 说话人区分、`autoCompress`（>25MB 自动切片）与本地回环免密 Whisper；`inputFile` 直读 10 万字长文，`voice_preview` 生成交互式网页试听页，代理原生支持 `http://`、`https://`、`socks5://` 与 `socks5h://`。

## 安装

在 DSH 桌面版「插件」面板搜索安装 `dsh-voice`，或使用命令行：

```bash
dsh plugin --profile desktop add dsh-voice
```

网页版把 `desktop` 改为 `web`；安装后重启一次 DSH。宿主要求 `>=0.2.2-rc.3`。插件附带 `voice-workflow` 技能包，会在语音合成、短视频卡拉 OK 字幕、章节有声书、声音克隆、字幕卡点、播客混音与音视频转写任务中自动指引助手采用最佳实践。

<a id="开始使用"></a>
## 最快 3 步用起来

1. **打开侧边栏 Voice Studio 工作台，零密钥即可试听、编排对话与合成**：装好插件后无需填任何密钥，即可在 5 主题侧边栏工作台试听 300+ Edge 音色与 10 种 `persona`、在面板内可视化编排双人对话直出 MP3 并跟读字幕，或让助手直读多章节 Markdown、导出 `.ass` 卡拉 OK 字幕及按 `.srt` 时间轴零漂移配音。
2. **按需配置备用 TTS（情绪/克隆）或 ASR 密钥（支持 8 秒录音一键克隆与本地免密 Whisper）**：打开 DSH「**设置 → 插件 → 语音（dsh-voice）**」：如需情绪指令或零样本克隆，将 `ttsEngine` 切为 `siliconflow` / `openai` / `custom`（保存即生效，还可在工作台直接录 8 秒人声一键注册克隆角色）；如需音视频转写或麦克风速记，选择 `asrEngine`（`groq` / `openai` / `siliconflow` / `custom`）并填入 `asrApiKey`（本地 `127.0.0.1` / `localhost` 免密）。
3. **试听选声 → 合成或转写交付 → 成品库跟读验收**：把文稿、`.srt`/`.vtt` 字幕、BGM、参考克隆音频或音视频文件放进当前会话工作区，生成的带章节 MP3、`.ass`/`.srt`/`.vtt` 字幕、`chapters.md` 时间轴与试听页均安全落在工作区内（默认同名自动编号不误盖），并可在工作台「工作区成品库」随时点击字幕跳转回放。

## 平时怎么对助手说（可直接复制的自然语言示例）

- **联网发现音色/人设并在浏览器试听页里对比**
  > 联网查一下带 `podcast` 标签的中文和英文音色，连同 `late-night-radio`、`bilingual-tech-female` 人设一起生成短试听，用 `voice_previews/index.html` 让我挑选。
- **把多标题 Markdown 合成带原生 MP3 章节书签与 BGM 闪避的播客/有声书**
  > 直接读取工作区里的 `weekly-report.md`，生成带原生 MP3 章节书签的有声节目（配上 `assets/bgm.mp3` 开启 BGM 自动闪避和 `-16 LUFS` 响度均衡），同时输出 `podcast.mp3`、`podcast.srt` 和节目单 `chapters.md`。
- **生成竖屏短视频短句卡拉 OK `.ass` 动态高亮字幕 + 内联停顿**
  > 用 `energetic-anchor` 朗读这段口播稿（保留稿子里的 `[pause:500ms]` 停顿，设置 `subtitleGranularity: "clause"`、`maxCharsPerCue: 14`），导出 `clip.mp3` 和带逐词高亮的 `clip.ass` 方便后续烧录字幕。
- **按现有 `.srt` 字幕零漂移反向配音 + 词边界安全发音词典**
  > 按工作区里的 `video.srt` 时间轴用 `bilingual-tech-male` 零漂移卡点配音（把 `OS` 替读成 `Operating System`、`SQL` 替读成 `S Q L`，不要影响 `POST`），导出 `dubbed.mp3` 和 `dubbed.srt` 并告诉我精确时长。
- **零样本克隆配音（或直接在工作台 8 秒麦克风录音建角色）**
  > 用工作区里的 `sample_ref.wav`（台词是「你好，我是小智，很高兴认识大家」）作为参考声音，用轻快带笑意的语气朗读这段欢迎词，导出 `welcome.mp3`。
- **直接转写 `.mp4` 录屏/视频或大体积会议录音并区分说话人**
  > 直接把工作区里的 `lecture.mp4` 抽音转写成中文（开启 `diarize: true` 区分说话人），同时输出 `lecture.txt` 和 `lecture.srt`，再提炼待办事项清单。

## 常见卡点自检

| 遇到的现象 | 10 秒定位原因 | 怎么修 |
| :--- | :--- | :--- |
| 自检提示「缺 ASR 密钥」但只想做朗读配音 | ASR 密钥仅音视频转文字需要，不影响朗读 | **直接正常合成语音即可**（自检可按 `tts` 范围单独查看 `ttsReady`） |
| 传入 `referenceAudio` 提示引擎不支持克隆 | 默认 `edge` 引擎不支持零样本参考音频克隆 | 在 DSH「设置 → 插件 → 语音」将 `ttsEngine` 切为 `siliconflow` 或 `custom`（保存即生效） |
| 视频直传转写、`bgmFile`、`normalizeLoudness` 或超密字幕 `atempo` 提示缺工具 | 视频抽音（`-vn`）、BGM 闪避、`-16 LUFS` 均衡与 `atempo` 精缩需本机 `ffmpeg` | 本机安装 `ffmpeg`（或配合 `dsh-ffmpeg` 处理），未安装时先传纯音频或关闭混音/均衡开关 |
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
