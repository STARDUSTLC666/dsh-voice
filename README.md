**简体中文** · [English](README.en.md)

# Voice

**把文字变成自然人声，把会议录音转成干净文字。**

DeepSeek Harness（`>=0.2.2-rc.3`）语音插件：内置零密钥 Edge 神经网络语音合成（TTS）与短试听音色挑选，支持原生设置表单与热生效、OpenAI / Groq 兼容语音转文字（STT），并严格将读写限制在当前会话工作区内。

[![npm](https://img.shields.io/npm/v/dsh-voice)](https://www.npmjs.com/package/dsh-voice) [![downloads](https://raw.githubusercontent.com/STARDUSTLC666/dsh-suite/npm-downloads/assets/dsh-voice-downloads.svg)](https://www.npmjs.com/package/dsh-voice) [![total downloads](https://raw.githubusercontent.com/STARDUSTLC666/dsh-suite/npm-downloads/assets/dsh-voice-total-downloads.svg)](https://www.npmjs.com/package/dsh-voice)

**[安装使用](#安装) · [最快 3 步用起来](#最快-3-步用起来) · [完整说明](https://github.com/STARDUSTLC666/dsh-voice/blob/master/docs/USAGE.md)**

<picture>
  <source media="(prefers-color-scheme: dark) and (max-width: 640px)" srcset="https://raw.githubusercontent.com/STARDUSTLC666/dsh-voice/master/docs/assets/intro/workflow-zh-mobile-dark.svg">
  <source media="(max-width: 640px)" srcset="https://raw.githubusercontent.com/STARDUSTLC666/dsh-voice/master/docs/assets/intro/workflow-zh-mobile-light.svg">
  <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/STARDUSTLC666/dsh-voice/master/docs/assets/intro/workflow-zh-dark.svg">
  <img src="https://raw.githubusercontent.com/STARDUSTLC666/dsh-voice/master/docs/assets/intro/workflow-zh-light.svg" alt="把文字变成声音，把录音变成文字。 · 流程示意" width="100%">
</picture>

## 安装

在 DSH 桌面版「插件」面板搜索安装 `dsh-voice`，或使用命令行：

```bash
dsh plugin --profile desktop add dsh-voice
```

网页版把 `desktop` 改为 `web`；安装后重启一次 DSH。宿主要求 `>=0.2.2-rc.3`。

<a id="开始使用"></a>
## 最快 3 步用起来

1. **文字转语音开箱即用（零 API 密钥）**：装好插件后无需填任何密钥，直接在工作区新建会话，就能让助手试听多种音色并把文章、播客稿或早报合成 MP3。
2. **录音转文字按需填密钥（保存即生效）**：需要把录音转文字时，打开 DSH「**设置 → 插件 → 语音（dsh-voice）**」填入 Groq 或 OpenAI 兼容的 `asrApiKey`（自动脱敏、保存即生效；也支持环境变量 `DSH_VOICE_ASR_KEY`）。
3. **试听选声 → 合成或转写交付**：把待转写录音放到当前会话工作区，合成出的 MP3 或 `.txt` 纪要也会安全落在工作区且同名自动编号不误盖。

## 平时怎么对助手说（可直接复制的自然语言示例）

- **先生成短试听挑音色，再合成完整配音（零配置）**
  > 挑 3 个适合播客的中英文音色给我生成短试听样例，等我选好后再把这篇早报稿合成完整 MP3。
- **一步把总结变成可带走听的语音早报**
  > 把今天的重点文档浓缩成 300 字口播稿，用温和自然的中文男声（语速 +10%）生成 `morning-brief.mp3`。
- **把工作区里的会议录音转成文字并提炼纪要**
  > 把当前目录里的 `meeting.m4a` 转写成中文，原稿存到 `meeting.txt`，再帮我整理一份待办事项清单。

## 常见卡点自检

| 遇到的现象 | 10 秒定位原因 | 怎么修 |
| :--- | :--- | :--- |
| 自检提示「缺 ASR 密钥」但只想做朗读配音 | ASR 密钥仅录音转文字需要，不影响朗读 | **直接正常合成语音即可**；日后需要转写录音再去「设置 → 插件 → 语音」补填 `asrApiKey` |
| 提示「必须位于会话工作区内」 | 录音或输出路径指到了工作区文件夹外面 | 先把音频复制进当前会话工作区文件夹再让助手转写 |
| 合成或转写报网络连接失败 | 受限网络无法直连在线语音 / ASR 服务 | 在 DSH「设置 → 插件 → 语音」填入本地 HTTP 代理 `proxyUrl`（如 `http://127.0.0.1:7890`，保存即生效） |
| 音频超过 25MB 无法转写 | 在线 ASR 接口单文件体积上限为 25MB | 先让助手用 `dsh-ffmpeg` 压缩码率或按时间切段后再转写 |

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
