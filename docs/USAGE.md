# dsh-voice 使用说明

[返回简介](../README.md) · [更新记录](../CHANGELOG.md) · [验证记录](VALIDATION.md)

## 本次改进

转写失败时检查 ASR 地址、密钥与响应格式；空白识别结果不会作为成功转写保存。TTS 与 ASR 的外部服务可用性应分别核对。

## 安装

```bash
dsh plugin --profile web add dsh-voice
```

## 卸载

```bash
dsh plugin --profile web remove dsh-voice
```

卸载后重启 Web 服务。如需彻底清理，可再手动删除自己 profile `cordis.patch.yml` 中覆盖的插件行。

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
| `voice_tts` | 文字合成 MP3（Edge 在线服务） | `text` 必填；`voice`/`rate`/`pitch`/`output` 可选 |
| `voice_stt` | 音频转文字 | `audio` 必填；`engine`/`model`/`language`/`prompt`/`output` 可选 |
| `voice_list` | 常用音色清单 | 无 |
| `voice_preview` | 音色试听：批量生成短样例 MP3 | `voices`（≤8 个）/ `text` / `outputDir` 可选 |
| `voice_health` | 配置自检（不联网） | 无 |

### 示例

```text
voice_tts { text: 今天的 AI 早报来了 }                    # 晓晓女声，输出 voice_output.mp3
voice_tts { text: hello, voice: en-US-AriaNeural }        # 英文女声
voice_stt { audio: E:\audio\meeting.mp3, language: zh } # 转写会议录音
voice_list {}
voice_preview { voices: [zh-CN-XiaoxiaoNeural, en-US-AriaNeural] } # 生成两个试听样例
voice_health {}                                          # 自检 TTS / ASR / 代理配置
```

## 实现与文件限制

- **edge-tts 协议直连**：Sec-MS-GEC 令牌按官方 DRM 算法**本地生成**（SHA256(Windows 文件时间 + TrustedClientToken)，5 分钟窗口），WS 传输用 `ws` 库 + permessage-deflate 压缩 + 可选 HTTP CONNECT 代理隧道
- **接口配置**：TTS 无需另填 API Key；STT 使用你配置的 ASR 服务，其计费与额度由该服务决定。
- 文本 ≤5000 字符、音频 ≤25MB 前置校验；输出同名自动加序号
- Edge TTS 协议适配保留在插件实现中，不使用旧令牌端点。

## 开发

```bash
pnpm install
pnpm test       # 构建 + 离线单元测试（使用模拟的 TTS/ASR）
pnpm test:integration  # 显式联网，调用真实 edge-tts；网络或断言失败均报错
```

## License

MIT
