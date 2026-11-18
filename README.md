**简体中文** · [English](README.en.md)

# Voice

**把文字变成自然人声，把会议录音转成干净文字。**

DeepSeek Harness（`>=0.2.2-rc.3`）语音插件：内置零密钥 Edge 神经网络语音合成（支持 300+ 在线音色发现、45+ 全年龄与方言精选、10 大内置音色人设）与 OpenAI / SiliconFlow / 自定义备用引擎（支持情绪演技指令、Kokoro 混音与 5–10 秒零样本声音克隆），支持长文直读与 Markdown 清理、多角色播客拼接与 `-16 LUFS` 响度均衡、同步 `.srt` / `.vtt` 字幕导出、浏览器交互式试听页，以及 Groq / OpenAI / SiliconFlow / 本地 Whisper 语音转文字（STT），并严格将读写限制在当前会话工作区内。

[![npm](https://img.shields.io/npm/v/dsh-voice)](https://www.npmjs.com/package/dsh-voice) [![downloads](https://raw.githubusercontent.com/STARDUSTLC666/dsh-suite/npm-downloads/assets/dsh-voice-downloads.svg)](https://www.npmjs.com/package/dsh-voice) [![total downloads](https://raw.githubusercontent.com/STARDUSTLC666/dsh-suite/npm-downloads/assets/dsh-voice-total-downloads.svg)](https://www.npmjs.com/package/dsh-voice)

**[安装使用](#安装) · [最快 3 步用起来](#最快-3-步用起来) · [完整说明](https://github.com/STARDUSTLC666/dsh-voice/blob/master/docs/USAGE.md)**

<picture>
  <source media="(prefers-color-scheme: dark) and (max-width: 640px)" srcset="https://raw.githubusercontent.com/STARDUSTLC666/dsh-voice/master/docs/assets/intro/workflow-zh-mobile-dark.svg">
  <source media="(max-width: 640px)" srcset="https://raw.githubusercontent.com/STARDUSTLC666/dsh-voice/master/docs/assets/intro/workflow-zh-mobile-light.svg">
  <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/STARDUSTLC666/dsh-voice/master/docs/assets/intro/workflow-zh-dark.svg">
  <img src="https://raw.githubusercontent.com/STARDUSTLC666/dsh-voice/master/docs/assets/intro/workflow-zh-light.svg" alt="把文字变成声音，把录音变成文字。 · 流程示意" width="100%">
</picture>

## 核心亮点

- **300+ 在线 Edge 音色、全年龄/方言与 10 大内置人设**：`voice_list({ online: true })` 动态拉取并 24 小时缓存微软全量 300+ 神经音色，断网自动回退至 45+ 精选内置音色（覆盖童声 `Xiaoshuang`/`Xiaoyou`、少年动漫 `Yunxia`、纪录片/成熟 `Yunze`/`Xiaoqiu`、老年 `Xiaorui`、激昂 `Yunhao` 及东北/陕西/四川/河南/山东/粤语男女/台湾腔男女）；内置 `late-night-radio`、`documentary-narrator`、`anime-boy` 等 10 种开箱即用 `persona`，可在 `voice_tts`、`segments[]` 与 `voice_preview` 中直接调用。
- **情绪演技指令、Kokoro 混音与零样本克隆**：通过 `instructions` 传入自然语言情绪与表演提示（SiliconFlow `CosyVoice2-0.5B` 自动映射 `<|endofprompt|>` 并支持 `[laughter]` / `[breath]` 副语言标记，OpenAI `gpt-4o-mini-tts` 原生透传 `instructions`），自定义端点支持 Kokoro 混音表达式（`zf_xiaobei*0.6+zf_xiaoni*0.4`）；搭配 `referenceAudio` + `referenceText`（`siliconflow` / `custom` 引擎）可用 5–10 秒工作区音频零样本克隆，或在 DSH 设置 `customVoices` 中保存热更新复用别名。
- **长文直读、多角色播客、响度均衡与零成本字幕**：`inputFile` 直读工作区 `.md` / `.txt` 并自动清理 Markdown（最高 10 万字自动按句分片拼接）；`segments` 编排多主持人对话与停顿（`pauseMs`），支持 `normalizeLoudness: true`（本机 `ffmpeg` `-16 LUFS` 广电级响度均衡）；零额外开销导出 `.srt` / `.vtt` 字幕（TTS 与 STT 均支持）。
- **浏览器试听页、大文件转写与代理**：`voice_preview` 支持按音色 ID、内置 `persona` 与 `customVoices` 别名批量试听并生成 `voice_previews/index.html`（倍速试听与一键复制）；`voice_stt` 支持 `groq` / `openai` / `siliconflow` / `custom`（本地回环免密）及 `autoCompress`（>25MB 自动压缩切片）；代理原生支持 `http://`、`https://`、`socks5://` 与 `socks5h://`（保存即生效）。

## 安装

在 DSH 桌面版「插件」面板搜索安装 `dsh-voice`，或使用命令行：

```bash
dsh plugin --profile desktop add dsh-voice
```

网页版把 `desktop` 改为 `web`；安装后重启一次 DSH。宿主要求 `>=0.2.2-rc.3`。插件附带 `voice-workflow` 技能包，会在语音合成、人设配音、声音克隆、播客与转写任务中自动指引助手采用最佳实践。

<a id="开始使用"></a>
## 最快 3 步用起来

1. **文字转语音与人设配音开箱即用（零 API 密钥）**：装好插件后无需填任何密钥，即可联网发现 300+ Edge 音色、使用 10 种内置 `persona`、在网页试听页对比、直读 Markdown 长文、合成多角色播客并导出 `.srt` / `.vtt` 字幕。
2. **按需配置备用 TTS（情绪/克隆）或 ASR 密钥（本地回环免密）**：打开 DSH「**设置 → 插件 → 语音（dsh-voice）**」：如需情绪指令或零样本声音克隆，可切换 `ttsEngine` 为 `siliconflow` / `openai` / `custom`（也可在 `customVoices` 保存常用角色别名，保存即生效）；如需转写录音，选择 `asrEngine`（`groq` / `openai` / `siliconflow` / `custom`）并填入 `asrApiKey`（本地 `127.0.0.1` / `localhost` Whisper 免密）。
3. **试听选声 → 合成或转写交付**：把待转写录音、参考克隆音频或文稿放到当前会话工作区，生成的 MP3、`.txt` 纪要、`.srt` / `.vtt` 字幕与试听页面都会安全落在工作区，默认同名自动编号不误盖。

## 平时怎么对助手说（可直接复制的自然语言示例）

- **联网发现音色/人设并在浏览器试听页里对比**
  > 联网查一下带 `podcast` 标签的中文和英文音色，连同 `late-night-radio`、`bilingual-tech-female` 人设一起生成短试听，用 `voice_previews/index.html` 让我挑选。
- **直接把 Markdown 长文变成双人播客 + 响度均衡 + 字幕**
  > 直接读取工作区里的 `weekly-report.md`，用 `podcast-host-female` 和 `podcast-host-male` 两个人设编排成双人对话播客，开启响度均衡，输出 `podcast.mp3` 和 `podcast.srt`。
- **用工作区 5–10 秒参考音频做零样本克隆或情绪配音（SiliconFlow / 自定义引擎）**
  > 用工作区里的 `sample_ref.wav`（台词是「你好，我是小智，很高兴认识大家」）作为参考声音，用轻快带笑意的语气朗读这段欢迎词，导出 `welcome.mp3`。
- **把大体积会议录音转成文字、字幕与纪要**
  > 把当前目录里的 `meeting.m4a` 转写成中文（如果超过 25MB 就自动压缩分段），同时输出 `meeting.txt` 和 `meeting.srt`，再提炼待办事项清单。

## 常见卡点自检

| 遇到的现象 | 10 秒定位原因 | 怎么修 |
| :--- | :--- | :--- |
| 自检提示「缺 ASR 密钥」但只想做朗读配音 | ASR 密钥仅录音转文字需要，不影响朗读 | **直接正常合成语音即可**（自检可按 `tts` 范围单独查看 `ttsReady`） |
| 传入 `referenceAudio` 提示引擎不支持克隆 | 默认 `edge` 引擎不支持零样本参考音频克隆 | 在 DSH「设置 → 插件 → 语音」将 `ttsEngine` 切为 `siliconflow` 或 `custom`（保存即生效） |
| 开启 `normalizeLoudness` 报错缺工具 | `-16 LUFS` 响度均衡需要本机 `ffmpeg` | 本机安装 `ffmpeg`（或先用 `dsh-ffmpeg` 处理），未安装时先不开启该开关 |
| 提示「必须位于会话工作区内」 | 文稿、录音、参考音频或输出路径指到了工作区外面 | 先把文件复制进当前会话工作区文件夹再让助手处理 |
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
