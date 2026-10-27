# dsh-voice

[English](README.en.md)

![dsh-voice 鲸鱼娘插件封面](https://raw.githubusercontent.com/STARDUSTLC666/dsh-voice/master/assets/cover-whale-girl.png)

把文字生成语音，或通过兼容接口把音频转为文字。

[![npm](https://img.shields.io/npm/v/dsh-voice)](https://www.npmjs.com/package/dsh-voice) [![downloads](https://raw.githubusercontent.com/STARDUSTLC666/dsh-suite/npm-downloads/assets/dsh-voice-downloads.svg)](https://www.npmjs.com/package/dsh-voice)

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

可说：“把这段文字生成中文 MP3，并给我两个音色试听。”配置 ASR 后，也可要求转写音频文件。

## 依赖与配置

语音合成需要网络连接；转写需配置对应 ASR 服务与密钥。代理可以单独设置。

详细配置、工具参数与排错见[使用说明](docs/USAGE.md)。从源码独立开发时，Node 要求以 [package.json](package.json) 为准。

## 文档

- [使用与排错](docs/USAGE.md)
- [更新记录](CHANGELOG.md)
- [验证范围与历史记录](docs/VALIDATION.md)
- [问题反馈与功能建议](https://github.com/STARDUSTLC666/dsh-voice/issues)

## 插件更新

需要 DSH 0.2.1-rc.3 或更新版本。每个插件在自己的页面或设置项提供检查、更新记录与确认安装入口，开关独立保存。自动检查默认开启；**自动安装默认关闭**，只有明确授权后，兼容的稳定补丁才会在空闲且没有未保存修改时安装。可单独关闭、推迟或忽略提醒；不会强制重启 DSH、升级 DSH 本体或替换本地源码安装。Suite 安装的组件会明确提示通过 Suite 整包更新。

旧版用户先在官方插件管理中手动更新一次，之后才会获得此入口。发布到 npm 不会直接替换用户已经安装的版本。

## License

[MIT](LICENSE)
