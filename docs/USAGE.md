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
| `voice_stt` | 音频转文字 | `audio` 必填；`model`/`language`/`prompt`/`output` 可选；`engine` 只能与配置 `asrEngine` 相同 |
| `voice_list` | 常用音色清单 | 无 |
| `voice_preview` | 音色试听：批量生成短样例 MP3 | `voices`（≤8 个）/ `text` / `outputDir` 可选 |
| `voice_health` | 配置自检（不联网） | 无 |

### 示例

```text
voice_tts { text: 今天的 AI 早报来了 }                    # 晓晓女声，输出 voice_output.mp3
voice_tts { text: hello, voice: en-US-AriaNeural }        # 英文女声
voice_stt { audio: meeting.mp3, language: zh }           # 转写会话工作区里的录音
voice_list {}
voice_preview { voices: [zh-CN-XiaoxiaoNeural, en-US-AriaNeural] } # 生成两个试听样例
voice_health {}                                          # 自检 TTS / ASR / 代理配置
```

## 实现与文件限制

- **edge-tts 协议直连**：对齐开源 edge-tts 7.3.1 的 Sec-MS-GEC v2 协议，令牌在本地按 5 分钟窗口生成；WS 使用 `ws` 库与可选 HTTP CONNECT 代理。不是微软官方 SDK，服务协议仍可能变更。
- **接口配置**：TTS 无需另填 API Key；STT 使用你配置的 ASR 服务，其计费与额度由该服务决定。
- 文本 ≤5000 字符、音频 ≤25MB 前置校验（读入后再按实际字节数复查一次）；输出同名自动加序号
- **读写都在会话工作区内**：`audio` 与 `output` / `outputDir` 解析后（含符号链接）必须落在 `session.header.cwd` 之下，越界直接报错。想转写工作区外的录音，先复制进来；输出同理
- **不跟随符号链接写文件**：目标是符号链接（含悬空链接）时拒绝写入，新建文件用 `O_EXCL`，避免检查完再被换成链接
- **转写文本 0600**：`voice_stt` 写出的 `.txt` 只给当前用户读写（Windows 不检查权限位）
- **密钥只发给配置的地址**：ASR 请求地址一律取配置 `asrBaseUrl`（groq/openai 的预设只是缺省值），模型传的 `engine` 与配置不一致会直接报错，避免把密钥发到另一家的主机
- **重定向需要用户确认地址**：接口返回 3xx 时停止，不向跳转地址发送音频。请检查服务文档，把 `asrBaseUrl` 设为可信的最终接口；这也适用于配置了插件代理的请求。
- **并发生成不覆盖**：`overwrite=false` 时即使两个任务同时写同名文件，或合成期间出现用户同名文件，也会另存并返回实际文件名。显式覆盖只接受没有硬链接的普通文件。
- Edge TTS 协议适配保留在插件实现中，不使用旧令牌端点。

## 开发

```bash
pnpm install
pnpm test       # 构建 + 离线单元测试（使用模拟的 TTS/ASR）
pnpm test:integration  # 显式联网，调用真实 edge-tts；网络或断言失败均报错
```

## License

主体 MIT；独立的 Edge v2 令牌模块 LGPLv3，见[第三方声明](../THIRD_PARTY_NOTICES.md)。
