[中文](README.md)

![npm](https://img.shields.io/npm/v/dsh-voice) ![downloads](https://img.shields.io/npm/dm/dsh-voice) ![license](https://img.shields.io/github/license/STARDUSTLC666/dsh-voice) ![stars](https://img.shields.io/github/stars/STARDUSTLC666/dsh-voice?style=social)

# dsh-voice

[![Awesome DSH Plugin](https://awesome-dsh-plugin.com/badge.svg)](https://awesome-dsh-plugin.com)

DSH (DeepSeek Harness) voice plugin pair: let the agent **speak and listen**.

- **voice_tts**: text-to-speech over the **edge-tts protocol** (Microsoft Edge read-aloud service — free, unlimited, 22+ curated voices)
- **voice_stt**: speech-to-text over any **OpenAI-compatible ASR endpoint** (Groq / OpenAI / custom)
- **voice_list**: voice catalog
- **voice_preview**: batch-generate short preview MP3s to pick a voice by ear
- **voice_health**: offline self-check of TTS voice / ASR key / endpoint / proxy

## Compatibility

Verified with official `@deepseek-ai/dsh@0.1.5-rc.1` and Node `24.16.0` on 2026-09-11: all 18 components load alongside Modlens, with passing tool-schema, skill-registration and offline read-only invocation checks. Uses the `cordis.patch.yml` + `dsh.bundle.patch` bundle model. Node requirements match this Harness release: 22.19 or later within 22.x, or 24 or later. Live external-service workflows require separate configuration and validation.

## Installation

```bash
dsh plugin --profile web add dsh-voice
```

## Uninstall

```bash
dsh plugin --profile web remove dsh-voice
```

Then restart the web service. To clean up fully, also remove the plugin entry from your profile `cordis.patch.yml` if you overrode it.


## Configuration

`voice_tts` works with zero config; `voice_stt` needs an ASR key:

```yaml
- id: voice
  name: 'dsh-voice'
  config:
    asrEngine: groq                       # groq | openai | custom
    asrModel: whisper-large-v3-turbo      # Groq whisper model
    # asrApiKey: gsk_...                  # prefer env var DSH_VOICE_ASR_KEY
    ttsVoice: zh-CN-XiaoxiaoNeural        # default voice
    # proxyUrl: http://127.0.0.1:7890     # enable when the ASR endpoint needs a special proxy
```

## Tools

| Tool | Purpose | Key parameters |
| :-- | :-- | :-- |
| `voice_tts` | Synthesize MP3 from text (free) | `text` required; `voice`/`rate`/`pitch`/`output` optional |
| `voice_stt` | Transcribe audio to text | `audio` required; `engine`/`model`/`language`/`prompt`/`output` optional |
| `voice_list` | Curated voice catalog | none |
| `voice_preview` | Batch-generate short preview MP3s | optional `voices` (≤8) / `text` / `outputDir` |
| `voice_health` | Offline config self-check | none |

### Examples

```text
voice_tts { text: hello world }                              # outputs voice_output.mp3
voice_tts { text: hello, voice: en-US-AriaNeural }           # English female voice
voice_stt { audio: E:\audio\meeting.mp3, language: zh }     # transcribe a recording
voice_list {}
voice_preview { voices: [zh-CN-XiaoxiaoNeural, en-US-AriaNeural] } # generate two preview samples
voice_health {}                                              # self-check TTS / ASR / proxy config
```

## Under the hood

- **Direct edge-tts protocol**: the Sec-MS-GEC token is **generated locally** with the official DRM algorithm (SHA256 of Windows file time + trusted client token, 5-minute windows); transport uses the `ws` library with permessage-deflate and an optional HTTP CONNECT proxy tunnel
- **Zero API cost**: TTS is completely free; STT costs only whatever your ASR provider charges
- Up-front validation: text ≤ 5000 chars, audio ≤ 25MB; same-name outputs auto-suffixed
- Protocol aligned with current open-source edge-tts (7.x) — no reliance on the outdated token endpoint

## Development

```bash
pnpm install
pnpm test       # build + offline unit tests with mocked TTS/ASR
pnpm test:integration  # opt-in real edge-tts request; network and assertion errors fail
```

## License

MIT

## Changelog

- **0.3.4 (2026-09-18)**: 修复代理路径 STT 上传 `[object FormData]`、25MB 校验在读入之后、输出目录不存在白烧一次合成、默认输出落宿主 cwd; `exec.signal` 全程透传、preview 改 3 路并发. 测试 55 项. 
