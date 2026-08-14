[中文](README.md)

# dsh-voice

DSH (DeepSeek Harness) voice plugin pair: let the agent **speak and listen**.

- **voice_tts**: text-to-speech over the **edge-tts protocol** (Microsoft Edge read-aloud service — free, unlimited, 22+ curated voices)
- **voice_stt**: speech-to-text over any **OpenAI-compatible ASR endpoint** (Groq / OpenAI / custom)
- **voice_list**: voice catalog

## Installation

```bash
dsh plugin --profile web add dsh-voice
```

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

### Examples

```text
voice_tts { text: hello world }                              # outputs voice_output.mp3
voice_tts { text: hello, voice: en-US-AriaNeural }           # English female voice
voice_stt { audio: E:\audio\meeting.mp3, language: zh }     # transcribe a recording
voice_list {}
```

## Under the hood

- **Direct edge-tts protocol**: the Sec-MS-GEC token is **generated locally** with the official DRM algorithm (SHA256 of Windows file time + trusted client token, 5-minute windows); transport uses the `ws` library with permessage-deflate and an optional HTTP CONNECT proxy tunnel
- **Zero API cost**: TTS is completely free; STT costs only whatever your ASR provider charges
- Up-front validation: text ≤ 5000 chars, audio ≤ 25MB; same-name outputs auto-suffixed
- Protocol aligned with current open-source edge-tts (7.x) — no reliance on the outdated token endpoint

## Development

```bash
pnpm install
pnpm test       # build + 31 tests, including a real-synthesis integration test
```

## License

MIT
