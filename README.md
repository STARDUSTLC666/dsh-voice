**简体中文** · [English](README.en.md)

# Voice

**把文字变成自然人声，把会议录音转成干净文字。**

DeepSeek Harness（`>=0.2.2-rc.3`）语音工作台插件：原生提供 **5 套主题可切换的侧边栏语音工作台**（原生清透 / 米白纸感 / Claude 暖书卷 / 8-Bit 像素 / 晴空薄荷，附 Coachmark 新手引导），支持零密钥 Edge 神经网络语音合成（300+ 在线音色与 10 套人设）与 OpenAI / SiliconFlow / 自定义备用引擎（情绪演技、Kokoro 混音、SHA-256 缓存零样本克隆），具备 **精确 MP3 时长反馈（`durationMs` / `durationSec`）**、**发音词典替读（`pronunciations`）**、**`.srt` / `.vtt` 字幕反向卡点配音（`subtitleInput`）**、**播客 BGM 自动闪避与 `-16 LUFS` 响度均衡**，以及支持 **说话人区分（`diarize`）** 的多引擎语音转文字（STT），严格将读写限制在当前会话工作区内。

[![npm](https://img.shields.io/npm/v/dsh-voice)](https://www.npmjs.com/package/dsh-voice) [![downloads](https://raw.githubusercontent.com/STARDUSTLC666/dsh-suite/npm-downloads/assets/dsh-voice-downloads.svg)](https://www.npmjs.com/package/dsh-voice) [![total downloads](https://raw.githubusercontent.com/STARDUSTLC666/dsh-suite/npm-downloads/assets/dsh-voice-total-downloads.svg)](https://www.npmjs.com/package/dsh-voice)

**[安装使用](#安装) · [最快 3 步用起来](#最快-3-步用起来) · [完整说明](https://github.com/STARDUSTLC666/dsh-voice/blob/master/docs/USAGE.md)**

<picture>
  <source media="(prefers-color-scheme: dark) and (max-width: 640px)" srcset="https://raw.githubusercontent.com/STARDUSTLC666/dsh-voice/master/docs/assets/intro/workflow-zh-mobile-dark.svg">
  <source media="(max-width: 640px)" srcset="https://raw.githubusercontent.com/STARDUSTLC666/dsh-voice/master/docs/assets/intro/workflow-zh-mobile-light.svg">
  <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/STARDUSTLC666/dsh-voice/master/docs/assets/intro/workflow-zh-dark.svg">
  <img src="https://raw.githubusercontent.com/STARDUSTLC666/dsh-voice/master/docs/assets/intro/workflow-zh-light.svg" alt="把文字变成声音，把录音变成文字。 · 流程示意" width="100%">
</picture>

## 核心亮点

- **原生 5 套主题 Voice Studio 侧边栏工作台**：支持 **原生清透 / 米白纸感 / Claude 暖书卷 / 8-Bit 像素 / 晴空薄荷** 5 套实时同步主题与 Coachmark 新手引导；在侧边栏即可在线试听 300+ Edge 音色与 10 套内置 `persona`（支持 `0.8x–1.5x` 倍速与实时时长显示）、使用浏览器麦克风语音速记转写，并可视化管理 `customVoices` 自定义角色与 `pronunciations` 发音词典。
- **精确 MP3 时长反馈、发音词典与 `.srt` / `.vtt` 字幕反向卡点配音**：跨 CBR/VBR 与多引擎流精确计算 `durationMs` / `durationSec` 并生成匹配采样率的静音帧（轻松卡准 60 秒短视频配音）；`pronunciations` 在 Edge 自动编译为 SSML `<sub alias>`（字幕保留 `Nginx` 原拼写、语音读作 `Engine X`），在 OpenAI/SiliconFlow 自动做非递归替读；`subtitleInput` 支持按既有 `.srt` / `.vtt` 时间轴自动逐条测速加速并补齐毫秒静音间隙对齐画面。
- **播客 BGM 自动闪避、情绪演技与 SHA-256 缓存零样本克隆**：`segments` 编排多主持人对话时可传入 `bgmFile` / `bgmVolume` / `bgmDucking`（FFmpeg `sidechaincompress` 人声闪避 + 结尾平滑淡出 + 可选 `-16 LUFS` 响度均衡）；`instructions` 透传演技指令（支持 CosyVoice2 `<|endofprompt|>`、`[laughter]`/`[breath]` 与 Kokoro 混音）；SiliconFlow 克隆按参考音频 SHA-256 哈希自动缓存 `speech:...` URI，多段播客无需重复上传 MB 级参考音频。
- **长文直读、网页试听、说话人区分转写与代理**：`inputFile` 直读工作区 `.md` / `.txt` 并自动清理 Markdown（最高 10 万字自动按句分片）；`voice_preview` 生成 `voice_previews/index.html` 交互式试听页；`voice_stt` 支持 `groq` / `openai` / `siliconflow` / `custom`（本地回环免密）、`autoCompress`（>25MB 自动压缩切片）与 `diarize: true`（双声道分离或说话人轮次标记 `[说话人 A]`）；代理原生支持 `http://`、`https://`、`socks5://` 与 `socks5h://`。

## 安装

在 DSH 桌面版「插件」面板搜索安装 `dsh-voice`，或使用命令行：

```bash
dsh plugin --profile desktop add dsh-voice
```

网页版把 `desktop` 改为 `web`；安装后重启一次 DSH。宿主要求 `>=0.2.2-rc.3`。插件附带 `voice-workflow` 技能包，会在语音合成、人设配音、声音克隆、字幕卡点、播客混音与转写任务中自动指引助手采用最佳实践。

<a id="开始使用"></a>
## 最快 3 步用起来

1. **打开侧边栏 Voice Studio 工作台，零密钥即可开箱试听与配音**：装好插件后无需填任何密钥，即可在 5 主题侧边栏工作台跟随 Coachmark 引导试听 300+ Edge 音色与 10 种内置 `persona`、管理自定义角色与发音词典，并直接让助手直读 Markdown 长文、合成多角色播客或按 `.srt` 字幕卡点配音。
2. **按需配置备用 TTS（情绪/克隆）或 ASR 密钥（本地回环免密）**：打开 DSH「**设置 → 插件 → 语音（dsh-voice）**」或在工作台操作：如需情绪指令或零样本声音克隆，可切换 `ttsEngine` 为 `siliconflow` / `openai` / `custom`（保存即生效）；如需使用浏览器麦克风速记或转写录音，选择 `asrEngine`（`groq` / `openai` / `siliconflow` / `custom`）并填入 `asrApiKey`（本地 `127.0.0.1` / `localhost` Whisper 免密）。
3. **试听选声 → 合成或转写交付**：把待转写录音、背景音乐、字幕时间轴、参考克隆音频或文稿放到当前会话工作区，生成的 MP3、`.txt` 纪要、`.srt` / `.vtt` 字幕与试听页面都会安全落在工作区，默认同名自动编号不误盖。

## 平时怎么对助手说（可直接复制的自然语言示例）

- **联网发现音色/人设并在浏览器试听页里对比**
  > 联网查一下带 `podcast` 标签的中文和英文音色，连同 `late-night-radio`、`bilingual-tech-female` 人设一起生成短试听，用 `voice_previews/index.html` 让我挑选。
- **直接把 Markdown 长文变成带 BGM 自动闪避的双人播客**
  > 直接读取工作区里的 `weekly-report.md`，用 `podcast-host-female` 和 `podcast-host-male` 编排成双人播客，配上 `assets/bgm.mp3` 开启 BGM 自动闪避和 `-16 LUFS` 响度均衡，输出 `podcast.mp3` 和 `podcast.srt`。
- **按现有 `.srt` 字幕反向卡点配音 + 发音词典替读**
  > 按工作区里的 `video.srt` 时间轴用 `bilingual-tech-male` 反向卡点配音（把 `Nginx` 替读成 `Engine X`，字幕仍保留 `Nginx`），导出 `dubbed.mp3` 和 `dubbed.srt`，并告诉我精确时长。
- **用工作区 5–10 秒参考音频做零样本克隆或情绪配音（SiliconFlow / 自定义引擎）**
  > 用工作区里的 `sample_ref.wav`（台词是「你好，我是小智，很高兴认识大家」）作为参考声音，用轻快带笑意的语气朗读这段欢迎词，导出 `welcome.mp3`。
- **把大体积会议录音转成带说话人区分的纪要与字幕**
  > 把当前目录里的 `meeting.m4a` 转写成中文（如果超过 25MB 自动压缩分段，开启 `diarize: true` 区分说话人），同时输出 `meeting.txt` 和 `meeting.srt`，再提炼待办事项清单。

## 常见卡点自检

| 遇到的现象 | 10 秒定位原因 | 怎么修 |
| :--- | :--- | :--- |
| 自检提示「缺 ASR 密钥」但只想做朗读配音 | ASR 密钥仅录音转文字需要，不影响朗读 | **直接正常合成语音即可**（自检可按 `tts` 范围单独查看 `ttsReady`） |
| 传入 `referenceAudio` 提示引擎不支持克隆 | 默认 `edge` 引擎不支持零样本参考音频克隆 | 在 DSH「设置 → 插件 → 语音」将 `ttsEngine` 切为 `siliconflow` 或 `custom`（保存即生效） |
| 开启 `normalizeLoudness` 或 `bgmFile` 报错缺工具 | `-16 LUFS` 响度均衡与 BGM 自动闪避混音需要本机 `ffmpeg` | 本机安装 `ffmpeg`（或先用 `dsh-ffmpeg` 处理），未安装时先不开启该开关 |
| 提示「必须位于会话工作区内」 | 文稿、字幕、BGM、录音、参考音频或输出路径指到了工作区外面 | 先把文件复制进当前会话工作区文件夹再让助手处理 |
| 合成或转写报网络连接失败 | 受限网络无法直连在线语音 / ASR 服务 | 在 DSH「设置 → 插件 → 语音」填入本地代理 `proxyUrl`（支持 `http://` / `https://` / `socks5://` / `socks5h://`，保存即生效） |
| 音频超过 25MB 无法转写 | 在线 ASR 接口单文件体积上限为 25MB | 让助手开启 `autoCompress: true`（需本机有 `ffmpeg`）自动压缩/切片转写，或先用 `dsh-ffmpeg` 处理 |

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
