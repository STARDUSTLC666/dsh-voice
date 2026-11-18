# dsh-voice Usage Guide

[Overview](../README.en.md) · [Changelog](../CHANGELOG.md) · [Validation](VALIDATION.md)

## Get Started in 3 Steps

### Step 1: Know What Works Out of the Box vs. Optional TTS / ASR Setup

- **Text-to-speech (`voice_tts`, `voice_list`, `voice_preview`) works with zero config**: Uses Edge neural voices by default with zero API keys — browse and filter voices, generate an interactive browser audition page, narrate long workspace files, compose multi-speaker podcasts, and export `.srt`/`.vtt` subtitles. You can optionally switch `ttsEngine` to `openai`, `siliconflow`, or `custom` in Settings.
- **Speech-to-text (`voice_stt`) needs an ASR key for cloud endpoints (loopback Whisper is keyless)**:
  - **Recommended**: Open **DSH → Settings → Plugins → Voice (`dsh-voice`)**, pick `asrEngine` (`groq` by default, `openai`, `siliconflow`, or `custom`), and paste `asrApiKey` (masked and **applied live on save without restarting**; when `custom` points to `127.0.0.1` or `localhost`, no key is required);
  - **CLI / Environment variable**: Set `DSH_VOICE_ASR_KEY` (and optionally `DSH_VOICE_TTS_KEY`) or configure `cordis.patch.yml`:

```yaml
- id: voice
  name: 'dsh-voice'
  config:
    ttsEngine: edge                       # edge | openai | siliconflow | custom
    ttsVoice: zh-CN-XiaoxiaoNeural        # default voice (applies live)
    ttsRate: '+0%'                        # default speech rate, e.g. +15% or -10%
    ttsPitch: '+0Hz'                      # default pitch, e.g. +2Hz or -1Hz
    # ttsBaseUrl: https://api.siliconflow.cn/v1  # optional for non-edge engines
    # ttsModel: FunAudioLLM/CosyVoice2-0.5B
    # ttsApiKey: sk-...                   # prefer DSH Settings or DSH_VOICE_TTS_KEY
    asrEngine: groq                       # groq | openai | siliconflow | custom
    asrModel: whisper-large-v3-turbo      # optional; defaults to engine preset
    # asrApiKey: gsk_...                  # prefer DSH Settings or DSH_VOICE_ASR_KEY (optional for loopback custom)
    # proxyUrl: socks5://127.0.0.1:1080   # supports http://, https://, socks5://, socks5h://
```

### Step 2: Keep Scripts, Audio & Outputs Inside Your Session Workspace

All `voice_tts` input files (`inputFile`), input audio (`audio`), and generated MP3 / `.txt` / `.srt` / `.vtt` / preview files must resolve under the active DSH session workspace (`session.header.cwd`) to protect host files. Copy outside files into the workspace first.

### Step 3: Audition Voices, Then Synthesize or Transcribe

Unsure which voice fits best? Filter voices with `voice_list`, then call `voice_preview` to render short samples plus an interactive `voice_previews/index.html` page. The plugin also ships `skills/voice-workflow/SKILL.md` so the assistant automatically uses `inputFile`, Markdown cleanup, `segments` podcast composition, and subtitle export.

---

## Copy-Ready Prompts for Everyday Work

- **Filter voices and audition via the interactive HTML page**
  > List voices with tag `podcast` and generate short previews with `voice_previews/index.html` so I can listen and pick my favorite.
- **Narrate a Markdown file directly with synchronized subtitles**
  > Synthesize `guide.md` in this workspace using `en-US-AvaMultilingualNeural` into `guide.mp3` and export `guide.srt`.
- **Create a two-host podcast MP3**
  > Turn this release note into a two-host podcast using `zh-CN-XiaoxiaoMultilingualNeural` and `zh-CN-YunyiMultilingualNeural`, saving `episode.mp3` and `episode.srt`.
- **Transcribe a large recording with auto-compression and subtitles**
  > Transcribe `interview.m4a` in this workspace (enable `autoCompress` if over 25 MB; prompt hint: DeepSeek Harness, Cordis), and save `interview.txt` and `interview.srt`.
- **Scoped offline configuration self-check**
  > Run a voice health check to verify `ttsReady`, `sttReady`, prosody settings, proxy, and ASR key status.

---

## Quick Troubleshooting Checklist

Run `voice_health` first (offline check with zero network traffic; supports `scope: "tts" | "stt" | "all"` and reports `ttsReady` and `sttReady` separately):

| Symptom | Usual Cause | Quick Fix |
| :--- | :--- | :--- |
| Health check says `asrApiKey` is missing | `asrApiKey` and `DSH_VOICE_ASR_KEY` are both empty | Safe to ignore if you only need TTS (`ttsReady` is `true`), or pass `scope: "tts"`; for local Whisper, set `asrEngine: custom` with `127.0.0.1`/`localhost` (no key needed) |
| Invalid voice ID, rate, or pitch error | `ttsVoice` or `ttsRate`/`ttsPitch` format is invalid | Run `voice_list` to pick a valid ID and fix `ttsVoice` / `ttsRate` / `ttsPitch` in Settings |
| Network error on TTS or STT | Direct connection blocked by corporate network | Enter `proxyUrl` (`http://`, `https://`, `socks5://`, or `socks5h://`) in **DSH Settings → Plugins → Voice** (applies live) |
| Path outside session workspace error | Script, audio, or output path resolves outside workspace | Copy the file into the current session workspace folder first |
| Audio exceeds 25 MB limit | Standard Whisper / ASR multipart cap is 25 MB | Pass `autoCompress: true` to `voice_stt` (uses local `ffmpeg` to compress/segment automatically) or pre-process with `dsh-ffmpeg` |
| ASR or TTS refuses a 3xx redirect | Redirects are blocked so audio/keys never leak to another host | Set `asrBaseUrl` / `ttsBaseUrl` directly to the final non-redirecting `/v1` endpoint |
| Existing output file was not overwritten | `overwrite: false` (default) suffixes `_1`, `_2` safely | Use the exact path returned by the tool, or enable `overwrite` in Settings |

---

## Tool & Safety Reference

### Registered Tools (All 5)

| Tool | Purpose | Key Parameters & Notes |
| :--- | :--- | :--- |
| `voice_tts` | Synthesize MP3 & subtitles from text, files, or dialogues | Supports `text`, `inputFile` (≤100k chars auto-chunked), `cleanMarkdown` (default `true` for `.md`), `segments` (≤50 turns with `pauseMs`), `subtitleOutput` (`.srt`/`.vtt`), `voice`, `rate`, `pitch`, `output` |
| `voice_stt` | Transcribe audio to text & subtitles (zero-copy upload) | `audio` required; supports `autoCompress` (uses local `ffmpeg` for >25 MB), `timestamps`, `subtitleOutput` (`.srt`/`.vtt`), `model`, `language`, `prompt`, `output`, `engine` |
| `voice_list` | Browse & filter built-in multilingual & dialect voices | Optional `locale`, `gender` (`Female`/`Male`), `tag` (e.g. `podcast`, `multilingual`, `dialect`) |
| `voice_preview` | Bounded-concurrency (≤3) batch previews + HTML page | Optional `voices` (≤8), `text` (≤200 chars), `outputDir`, `htmlIndex` (default `true`, writes `voice_previews/index.html`) |
| `voice_health` | Offline configuration self-check | Optional `scope` (`all`/`tts`/`stt`), reports `ttsReady` / `sttReady` across engines, voice/prosody, proxy, and keys |

### Engine Presets & Workspace Guardrails

- **Engine presets**:
  - `asrEngine`: `groq` (`whisper-large-v3-turbo`), `openai` (`whisper-1`), `siliconflow` (`FunAudioLLM/SenseVoiceSmall`), `custom` (keyless when targeting loopback `127.0.0.1` / `localhost`).
  - `ttsEngine`: `edge` (zero-key default), `openai` (`gpt-4o-mini-tts`), `siliconflow` (`FunAudioLLM/CosyVoice2-0.5B`), `custom` (OpenAI `/audio/speech`-compatible endpoint).
- **Workspace confinement & symlink protection**: All reads and writes stay under `session.header.cwd`, symlinks are never written through, new files use `O_EXCL`, and `.txt`/subtitle outputs use `0600` permissions on POSIX.
- **Pinned endpoint & redirect block**: Requests only go to the configured endpoint, mismatched `engine` overrides are rejected, and `3xx` redirects abort immediately.
- **Live timeouts & instant cancellation**: `timeoutMs` updates dynamically on config save; `voice_tts`, `voice_preview`, and `voice_stt` propagate `exec.signal` to close WebSockets and abort compression/uploads immediately on cancel.

## Install, Uninstall & Development

```bash
# Install (use desktop instead of web for DSH Desktop)
dsh plugin --profile web add dsh-voice

# Uninstall
dsh plugin --profile web remove dsh-voice

# Build & run offline unit tests
pnpm install
pnpm test
```

## License

Original code MIT; separate Edge v2 token module LGPL-3.0-only. See [third-party notices](../THIRD_PARTY_NOTICES.md).
