**简体中文** · [English](README.en.md)

# Voice

**把文字变成自然人声，把会议录音转成干净文字。**

DeepSeek Harness（`>=0.2.2-rc.3`）语音插件：内置零密钥 Edge 神经网络语音合成（TTS）与 OpenAI / SiliconFlow 兼容备用引擎，支持长文直读与 Markdown 口播清理、多角色播客拼接、同步 `.srt` / `.vtt` 字幕导出、浏览器交互式试听页，以及 Groq / OpenAI / SiliconFlow / 本地 Whisper 语音转文字（STT），并严格将读写限制在当前会话工作区内。

[![npm](https://img.shields.io/npm/v/dsh-voice)](https://www.npmjs.com/package/dsh-voice) [![downloads](https://raw.githubusercontent.com/STARDUSTLC666/dsh-suite/npm-downloads/assets/dsh-voice-downloads.svg)](https://www.npmjs.com/package/dsh-voice) [![total downloads](https://raw.githubusercontent.com/STARDUSTLC666/dsh-suite/npm-downloads/assets/dsh-voice-total-downloads.svg)](https://www.npmjs.com/package/dsh-voice)

**[安装使用](#安装) · [最快 3 步用起来](#最快-3-步用起来) · [完整说明](https://github.com/STARDUSTLC666/dsh-voice/blob/master/docs/USAGE.md)**

<picture>
  <source media="(prefers-color-scheme: dark) and (max-width: 640px)" srcset="https://raw.githubusercontent.com/STARDUSTLC666/dsh-voice/master/docs/assets/intro/workflow-zh-mobile-dark.svg">
  <source media="(max-width: 640px)" srcset="https://raw.githubusercontent.com/STARDUSTLC666/dsh-voice/master/docs/assets/intro/workflow-zh-mobile-light.svg">
  <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/STARDUSTLC666/dsh-voice/master/docs/assets/intro/workflow-zh-dark.svg">
  <img src="https://raw.githubusercontent.com/STARDUSTLC666/dsh-voice/master/docs/assets/intro/workflow-zh-light.svg" alt="把文字变成声音，把录音变成文字。 · 流程示意" width="100%">
</picture>

## 核心亮点

- **长文直读与口播清理**：支持 `inputFile` 直接读取工作区 `.md` / `.txt` 文稿，自动剥离代码块/链接等 Markdown 语法，超过 5,000 字自动按句断句合成并无缝拼接（最高 10 万字）。
- **多角色播客与零成本字幕**：单次合成即可通过 `segments` 编排多主持人对话与停顿（`pauseMs`），并支持零额外开销同步导出 `.srt` / `.vtt` 字幕（TTS 与 STT 均支持）。
- **音色筛选与浏览器试听页**：支持按语种、性别、标签（如 `podcast`、`multilingual`）筛选并内置多语种旗舰音色；批量试听自动生成 `voice_previews/index.html` 交互试听页（支持倍速试听与一键复制音色 ID）。
- **灵活引擎、大文件转写与代理**：除零密钥 Edge TTS 外，支持 `openai` / `siliconflow` / `custom` TTS 与 ASR 预设及本地回环免密 Whisper；>25MB 录音可开启 `autoCompress` 调用本机 `ffmpeg` 自动压缩/切片并零拷贝流式上传；代理原生支持 `http://`、`https://`、`socks5://` 与 `socks5h://`（设置保存即生效）。

## 安装

在 DSH 桌面版「插件」面板搜索安装 `dsh-voice`，或使用命令行：

```bash
dsh plugin --profile desktop add dsh-voice
```

网页版把 `desktop` 改为 `web`；安装后重启一次 DSH。宿主要求 `>=0.2.2-rc.3`。插件附带 `voice-workflow` 技能包，会在语音合成、播客与转写任务中自动指引助手采用最佳实践。

<a id="开始使用"></a>
## 最快 3 步用起来

1. **文字转语音开箱即用（零 API 密钥）**：装好插件后无需填任何密钥，直接在工作区新建会话，就能试听音色、直接朗读 Markdown 长文、编排双人播客并顺带导出 `.srt` / `.vtt` 字幕。
2. **录音转文字按需填密钥（本地回环免密）**：需要转写录音时，打开 DSH「**设置 → 插件 → 语音（dsh-voice）**」选择 `asrEngine`（`groq` / `openai` / `siliconflow` / `custom`）并填入 `asrApiKey`（自动脱敏、保存即生效；也支持 `DSH_VOICE_ASR_KEY`）。若 `custom` 指向 `127.0.0.1` / `localhost` 的本地 Whisper 服务，无需密钥即可直接转写。
3. **试听选声 → 合成或转写交付**：把待转写录音或文稿放到当前会话工作区，生成的 MP3、`.txt` 纪要、`.srt` / `.vtt` 字幕与试听页面都会安全落在工作区，默认同名自动编号不误盖。

## 平时怎么对助手说（可直接复制的自然语言示例）

- **筛选播客音色并在浏览器试听页里对比**
  > 按 `podcast` 标签筛选几个中英文音色生成短试听，用生成的 `voice_previews/index.html` 让我试听挑选，再把这篇早报合成完整 MP3。
- **直接把 Markdown 长文变成双人播客 + 字幕**
  > 直接读取工作区里的 `weekly-report.md`，整理成双人对话播客（女声用 `zh-CN-XiaoxiaoMultilingualNeural`，男声用 `zh-CN-YunyiMultilingualNeural`），输出 `podcast.mp3` 和 `podcast.srt`。
- **把大体积会议录音转成文字、字幕与纪要**
  > 把当前目录里的 `meeting.m4a` 转写成中文（如果超过 25MB 就自动压缩分段），同时输出 `meeting.txt` 和 `meeting.srt`，再提炼待办事项清单。

## 常见卡点自检

| 遇到的现象 | 10 秒定位原因 | 怎么修 |
| :--- | :--- | :--- |
| 自检提示「缺 ASR 密钥」但只想做朗读配音 | ASR 密钥仅录音转文字需要，不影响朗读 | **直接正常合成语音即可**（自检可按 `tts` 范围单独查看 `ttsReady`） |
| 提示「必须位于会话工作区内」 | 文稿、录音或输出路径指到了工作区文件夹外面 | 先把文件复制进当前会话工作区文件夹再让助手处理 |
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
