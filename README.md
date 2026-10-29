# dsh-voice

[English](README.en.md)

![dsh-voice 鲸鱼娘插件封面](https://raw.githubusercontent.com/STARDUSTLC666/dsh-voice/master/assets/cover-whale-girl.png)

在 DSH 中把文字合成为语音，或将工作区录音转为文字。支持 Edge TTS 和 OpenAI / Groq / 自建兼容 ASR；转写使用你配置的地址，输出文件默认避免覆盖。

[![npm](https://img.shields.io/npm/v/dsh-voice)](https://www.npmjs.com/package/dsh-voice) [![downloads](https://raw.githubusercontent.com/STARDUSTLC666/dsh-suite/npm-downloads/assets/dsh-voice-downloads.svg)](https://www.npmjs.com/package/dsh-voice) [![total downloads](https://raw.githubusercontent.com/STARDUSTLC666/dsh-suite/npm-downloads/assets/dsh-voice-total-downloads.svg)](https://www.npmjs.com/package/dsh-voice)

[下载统计说明](https://github.com/STARDUSTLC666/dsh-suite/blob/npm-downloads/README.md)

欢迎使用，遇到问题或有改进建议，请提交 [issues](https://github.com/STARDUSTLC666/dsh-voice/issues) 和 [PR](https://github.com/STARDUSTLC666/dsh-voice/pulls)。

## 功能

- 使用 Edge 在线朗读服务生成语音。
- 列出音色并批量试听。
- 通过 OpenAI 兼容 ASR 接口转写音频。

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

详细配置、工具参数与排错见[使用说明](docs/USAGE.md)。从源码独立开发时，Node 要求以 [package.json](package.json) 为准。

## 文档

- [使用与排错](docs/USAGE.md)
- [更新记录](CHANGELOG.md)
- [验证范围与历史记录](docs/VALIDATION.md)
- [问题反馈与功能建议](https://github.com/STARDUSTLC666/dsh-voice/issues)

## 插件更新

需要 DSH 0.2.1-rc.3 或更新版本。更新控件直接位于原有工作台内容末尾；没有工作台的插件，位于原生插件详情页底部。检查、更新记录和偏好在原地展开，不增加独立更新页面或设置菜单。自动检查默认开启；**自动安装默认关闭**，明确授权后才会在空闲且没有未保存修改时安装兼容的稳定补丁。开关按插件独立保存，可关闭、推迟或忽略提醒；不会强制重启 DSH、升级 DSH 本体或替换本地源码安装。Suite 组件在当前页面底部明确说明并操作 Suite 整包更新。

旧版用户先在官方插件管理中手动更新一次，之后才会获得此入口。发布到 npm 不会直接替换用户已经安装的版本。

## License

主体采用 [MIT](LICENSE)；独立的 Edge v2 令牌模块采用上游 LGPLv3，源码与许可随包提供，见[第三方声明](THIRD_PARTY_NOTICES.md)。
