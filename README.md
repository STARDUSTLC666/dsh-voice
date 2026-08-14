[English](README.en.md)

`# dsh-voice

![npm version](https://img.shields.io/npm/v/dsh-voice?label=npm&color=blue) ![npm downloads](https://img.shields.io/npm/dm/dsh-voice) ![license](https://img.shields.io/npm/l/dsh-voice) ![stars](https://img.shields.io/github/stars/STARDUSTLC666/dsh-voice?style=social)


DSH（DeepSeek Harness）语音双件套插件：让 agent **会说话、能听懂**。

- **voice_tts**：文字转语音，走 **edge-tts 协议**（微软 Edge 朗读服务，免费无限量，22+ 常用音色）
- **voice_stt**：语音转文字，走 **OpenAI 兼容 ASR 接口**（Groq / OpenAI / 自定义端点）
- **voice_list**：音色清单

## 安装

```bash
dsh plugin --profile web add dsh-voice
```

## 配置

`voice_tts` 零配置可用；`voice_stt` 需要 ASR 密钥：

```yaml
- id: voice
  name: 'dsh-voice'
  config:
    asrEngine: groq                       # groq | openai | custom
    asrModel: whisper-large-v3-turbo      # groq 的 whisper 模型
    # asrApiKey: gsk_...                  # 推荐改用环境变量 DSH_VOICE_ASR_KEY
    ttsVoice: zh-CN-XiaoxiaoNeural        # 默认音色
    # proxyUrl: http://127.0.0.1:7890     # ASR 接口需要特殊代理时启用
```

## 工具一览

| 工具 | 作用 | 关键参数 |
| :-- | :-- | :-- |
| `voice_tts` | 文字合成 MP3（免费） | `text` 必填；`voice`/`rate`/`pitch`/`output` 可选 |
| `voice_stt` | 音频转文字 | `audio` 必填；`engine`/`model`/`language`/`prompt`/`output` 可选 |
| `voice_list` | 常用音色清单 | 无 |

### 示例

```text
voice_tts { text: 今天的 AI 早报来了 }                    # 晓晓女声，输出 voice_output.mp3
voice_tts { text: hello, voice: en-US-AriaNeural }        # 英文女声
voice_stt { audio: E:\audio\meeting.mp3, language: zh } # 转写会议录音
voice_list {}
```

## 硬核细节

- **edge-tts 协议直连**：Sec-MS-GEC 令牌按官方 DRM 算法**本地生成**（SHA256(Windows 文件时间 + TrustedClientToken)，5 分钟窗口），WS 传输用 `ws` 库 + permessage-deflate 压缩 + 可选 HTTP CONNECT 代理隧道
- **零 API 成本**：TTS 完全免费；STT 只花你选的 ASR 接口的钱
- 文本 ≤5000 字符、音频 ≤25MB 前置校验；输出同名自动加序号
- 协议对齐开源 edge-tts 当前版本（7.x），不依赖过时的令牌端点

## 开发

```bash
pnpm install
pnpm test       # 构建 + 31 个测试（含真实合成集成测试）
```

## License

MIT

