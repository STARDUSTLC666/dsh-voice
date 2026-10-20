# dsh-voice usage guide

[Overview](../README.en.md) · [Changelog](../CHANGELOG.md) · [Validation](VALIDATION.md)

## Current improvements

Check the ASR endpoint, key and response format after a failure. Blank results are not saved as successful transcripts. Verify TTS and ASR service availability separately.

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
| `voice_tts` | Synthesize MP3 from text (Edge online service) | `text` required; `voice`/`rate`/`pitch`/`output` optional |
| `voice_stt` | Transcribe audio to text | `audio` required; `model`/`language`/`prompt`/`output` optional; `engine` may only repeat the configured `asrEngine` |
| `voice_list` | Curated voice catalog | none |
| `voice_preview` | Batch-generate short preview MP3s | optional `voices` (≤8) / `text` / `outputDir` |
| `voice_health` | Offline config self-check | none |

### Examples

```text
voice_tts { text: hello world }                              # outputs voice_output.mp3
voice_tts { text: hello, voice: en-US-AriaNeural }           # English female voice
voice_stt { audio: meeting.mp3, language: zh }               # transcribe a recording inside the session workspace
voice_list {}
voice_preview { voices: [zh-CN-XiaoxiaoNeural, en-US-AriaNeural] } # generate two preview samples
voice_health {}                                              # self-check TTS / ASR / proxy config
```

## Implementation and file limits

- **Direct edge-tts protocol**: the Sec-MS-GEC token is **generated locally** with the official DRM algorithm (SHA256 of Windows file time + trusted client token, 5-minute windows); transport uses the `ws` library with permessage-deflate and an optional HTTP CONNECT proxy tunnel
- **API configuration**: TTS needs no separate API key. STT uses your configured ASR service, whose pricing and limits apply.
- Up-front validation: text ≤ 5000 chars, audio ≤ 25MB (re-checked against the bytes actually read); same-name outputs auto-suffixed
- **Reads and writes stay inside the session workspace**: `audio`, `output` and `outputDir` must resolve (symlinks included) under `session.header.cwd`; anything outside is rejected. Copy the file in first.
- **Symlinks are never written through**: a target that is a symlink (including a dangling one) is refused, and new files are created with `O_EXCL`.
- **Transcripts are 0600**: the `.txt` written by `voice_stt` is owner-only (Windows does not enforce the mode bits).
- **The key only goes to the configured endpoint**: ASR always uses `asrBaseUrl` from config (the groq/openai presets are defaults only); an `engine` argument that differs from config is rejected instead of shipping the key to another vendor.
- Protocol aligned with current open-source edge-tts (7.x) — no reliance on the outdated token endpoint

## Development

```bash
pnpm install
pnpm test       # build + offline unit tests with mocked TTS/ASR
pnpm test:integration  # opt-in real edge-tts request; network and assertion errors fail
```

## License

MIT
