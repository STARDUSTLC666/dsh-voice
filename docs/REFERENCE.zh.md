> 完整使用说明。首页已按用途、安装和操作流程重新整理；这里保留详细参数、限制、更新规则与历史验证链接。

# dsh-voice

[English](./REFERENCE.en.md)

![dsh-voice 鲸鱼娘插件封面](https://raw.githubusercontent.com/STARDUSTLC666/dsh-voice/master/assets/cover-whale-girl.png)

在 DSH 中将文字合成为自然人声，或将工作区音视频转为文字与字幕（v0.11.0）。内置零密钥 Edge TTS、OpenAI / SiliconFlow / 自建兼容 TTS 与 ASR、5 主题 **Voice Studio** 侧边栏工作台与 `voice-workflow` 技能包；严格限制读写在当前会话工作区内，输出文件默认自动编号防覆盖。

[![npm](https://img.shields.io/npm/v/dsh-voice)](https://www.npmjs.com/package/dsh-voice) [![downloads](https://raw.githubusercontent.com/STARDUSTLC666/dsh-suite/npm-downloads/assets/dsh-voice-downloads.svg)](https://www.npmjs.com/package/dsh-voice) [![total downloads](https://raw.githubusercontent.com/STARDUSTLC666/dsh-suite/npm-downloads/assets/dsh-voice-total-downloads.svg)](https://www.npmjs.com/package/dsh-voice)

[下载统计说明](https://github.com/STARDUSTLC666/dsh-suite/blob/npm-downloads/README.md)

欢迎使用，遇到问题或有改进建议，请提交 [issues](https://github.com/STARDUSTLC666/dsh-voice/issues) 和 [PR](https://github.com/STARDUSTLC666/dsh-voice/pulls)。

## 功能

- **许愿式场景直出与目标时长校准**：内置 6 套场景预设（`podcast` / `short-video` / `audiobook` / `briefing` / `story` / `dubbing`）、自然语言风格/方言模糊选声与 `targetDurationSec` 目标时长自动适配。
- **多引擎语音合成与声音克隆**：默认零密钥 Edge TTS（51 个实测内置 + 300+ 在线音色、10 套人设），按需扩展 OpenAI / SiliconFlow / 自定义兼容引擎，支持情绪演技指令（`instructions`）、Kokoro 音色混合与零样本声音克隆（`referenceAudio` / `referenceText`）。
- **交互播放器、字幕与后期**：支持零依赖 `.player.html` 跟读播放器、词边界安全技术发音词典（内置 11 条规则 + 自定义 `pronunciations`）、竖屏卡拉 OK `.ass`（`\kf`）与 `.srt`/`.vtt` 字幕、行内停顿标签（`[pause:500ms]`）、MP3 ID3v2 原生章节书签、`.srt`/`.vtt` 零漂移反向配音及播客 BGM 自动闪避 / `-16 LUFS` 响度均衡。
- **音视频直传转写**：`voice_stt` 支持 `.mp4`/`.mkv`/`.mov`/`.avi` 视频容器自动抽音转写、说话人区分（`diarize`）、超 25MB 自动压缩切片（`autoCompress`）与本机回环免密 Whisper。
- **对话记住偏好（`voice_prefs`）与 6 大工具**：注册 `voice_tts`、`voice_stt`、`voice_list`、`voice_preview`、`voice_health`、`voice_prefs` 六个工具；通过 `voice_prefs` 在对话中持久化默认音色、语速音调、发音词典与自定义角色别名（严格隔离 API 密钥与代理凭据）。
- **5 主题 Voice Studio 侧边栏工作台**：支持 5 套明亮主题切换（`harness` / `cream` / `claude` / `pixel8bit` / `mint`），提供 8 秒浏览器麦克风一键建克隆角色、多角色对话编排、自定义角色编辑与工作区成品库点击字幕跳播。

## 安装

桌面版可在「插件」面板按包名 `dsh-voice` 安装。已配置 dsh 命令时也可使用：

```bash
dsh plugin --profile desktop add dsh-voice
```

网页版把命令中的 `desktop` 改为 `web`。安装后重启 DSH。

## 开始使用

1. 在要保存音频的工作区新建 DSH 会话，让助手先检查语音工具是否可用。
2. 提供要朗读的文字、语言、音色和语速，例如“把这段文字生成中文 MP3，先给我短试听”。
3. 试听后再生成完整音频，按工具返回的文件路径播放或交付。
4. 需要转写时先配置自己的兼容 ASR 服务，再提供本地音频文件；核对转写结果后使用。

## 依赖与配置

语音合成需要网络连接；转写需配置对应 ASR 服务与密钥。代理可以单独设置。

详细配置、工具参数与排错见[使用说明](USAGE.md)。从源码独立开发时，Node 要求以 [package.json](../package.json) 为准。

## 文档

- [使用与排错](USAGE.md)
- [更新记录](../CHANGELOG.md)
- [验证范围与历史记录](VALIDATION.md)
- [问题反馈与功能建议](https://github.com/STARDUSTLC666/dsh-voice/issues)

## 插件更新

需要 DSH 0.2.2-rc.3 或更新版本。更新控件直接位于原有工作台内容末尾；没有工作台的插件，位于原生插件详情页底部。检查、更新记录和偏好在原地展开，不增加独立更新页面或设置菜单。自动检查默认开启；**自动安装默认关闭**，明确授权后才会在空闲且没有未保存修改时安装兼容的稳定更新（默认支持次版本与补丁更新，也可按插件收窄为仅补丁）。开关按插件独立保存，可关闭、推迟或忽略提醒；不会强制重启 DSH、升级 DSH 本体或替换本地源码安装。Suite 组件在当前页面底部明确说明并操作 Suite 整包更新。

旧版用户先在官方插件管理中手动更新一次，之后才会获得此入口。发布到 npm 不会直接替换用户已经安装的版本。

## License

主体采用 [MIT](../LICENSE)；独立的 Edge v2 令牌模块采用上游 LGPLv3，源码与许可随包提供，见[第三方声明](../THIRD_PARTY_NOTICES.md)。
