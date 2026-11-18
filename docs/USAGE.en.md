# dsh-voice Usage Guide

[Overview](../README.en.md) · [Changelog](../CHANGELOG.md) · [Validation](VALIDATION.md)

## Get Started in 3 Steps

### Step 1: Know What Works Out of the Box vs. Optional ASR Setup

- **Text-to-speech (`voice_tts`, `voice_list`, `voice_preview`) works with zero config**: No API keys needed — install the plugin and synthesize speech or audition voices right away.
- **Speech-to-text (`voice_stt`) needs an ASR key when you want transcription**:
  - **Recommended**: Open **DSH → Settings → Plugins → Voice (`dsh-voice`)**, pick `asrEngine` (`groq` by default, `openai`, or `custom`), and paste `asrApiKey` (masked and **applied live on save without restarting**);
  - **CLI / Environment variable**: Set `DSH_VOICE_ASR_KEY` or configure `cordis.patch.yml`:

```yaml
- id: voice
  name: 'dsh-voice'
  config:
    ttsVoice: zh-CN-XiaoxiaoNeural        # default voice (applies live)
    ttsRate: '+0%'                        # default speech rate, e.g. +15% or -10%
    ttsPitch: '+0Hz'                      # default pitch, e.g. +2Hz or -1Hz
    asrEngine: groq                       # groq | openai | custom
    asrModel: whisper-large-v3-turbo      # optional; defaults to engine preset
    # asrApiKey: gsk_...                  # prefer DSH Settings or env var DSH_VOICE_ASR_KEY
    # proxyUrl: http://127.0.0.1:7890     # optional HTTP(S) proxy URL
```

### Step 2: Keep Audio & Outputs Inside Your Session Workspace

All input audio and output MP3 / `.txt` files must resolve under the active DSH session workspace (`session.header.cwd`) to protect host files. Copy outside recordings into the workspace first.

### Step 3: Audition Voices, Then Synthesize or Transcribe

Unsure which voice fits best? Ask the assistant to generate short preview samples in parallel before rendering your full script.

---

## Copy-Ready Prompts for Everyday Work

- **Audition voices before committing to a full render**
  > List the built-in voices and generate short preview MP3s for 4 distinct voices so I can choose my favorite.
- **Render a polished voiceover MP3**
  > Synthesize this release summary into `release-note.mp3` using `en-US-AriaNeural` at `+10%` speed.
- **Transcribe a recording with domain terminology hints**
  > Transcribe `interview.mp3` in this workspace (prompt hint: DeepSeek Harness, Cordis), save the full text to `interview.txt`, and list the 5 key takeaways.
- **Offline configuration self-check**
  > Run a voice health check to verify my default TTS voice, proxy, and ASR key status.

---

## Quick Troubleshooting Checklist

Run `voice_health` first (offline check with zero network traffic that clearly separates `voice_stt`-only issues from TTS):

| Symptom | Usual Cause | Quick Fix |
| :--- | :--- | :--- |
| Health check says `asrApiKey` is missing | `asrApiKey` and `DSH_VOICE_ASR_KEY` are both empty | Safe to ignore if you only need TTS (`voice_tts` needs no key); for transcription, fill `asrApiKey` in **DSH Settings → Plugins → Voice** (applies live) |
| Invalid voice ID error | `ttsVoice` does not match Edge neural voice format | Run `voice_list` to pick a valid ID (e.g. `zh-CN-XiaoxiaoNeural`) and update `ttsVoice` in Settings |
| Network error on TTS or STT | Direct connection blocked by corporate network | Enter an HTTP(S) `proxyUrl` (e.g. `http://127.0.0.1:7890`) in **DSH Settings → Plugins → Voice** (applies live) |
| Path outside session workspace error | Audio or output path resolves outside workspace | Copy the recording into the current session workspace folder first |
| Audio exceeds 25 MB limit | Standard Whisper / ASR multipart cap is 25 MB | Compress or split the recording with `dsh-ffmpeg` before transcribing |
| ASR refuses a 3xx redirect | Redirects are blocked so audio/keys never leak to another host | Set `asrBaseUrl` directly to the final non-redirecting `/v1` endpoint |
| Existing output file was not overwritten | `overwrite: false` (default) suffixes `_1`, `_2` safely | Use the exact path returned by the tool, or enable `overwrite` in Settings |

---

## Tool & Safety Reference

### Registered Tools (All 5)

| Tool | Purpose | Key Parameters & Notes |
| :--- | :--- | :--- |
| `voice_tts` | Synthesize MP3 from text (keyless Edge neural TTS) | `text` required (≤5000 chars); optional `voice`, `rate`, `pitch`, `output` |
| `voice_stt` | Transcribe audio to text (Groq / OpenAI / custom) | `audio` required (≤25 MB); optional `model`, `language`, `prompt`, `output` |
| `voice_list` | Browse curated multilingual & dialect voice catalog | No parameters |
| `voice_preview` | Bounded-concurrency (≤3) batch voice preview MP3s | Optional `voices` (≤8), `text` (≤200 chars), `outputDir` |
| `voice_health` | Offline configuration self-check | Checks TTS voice, proxy, and ASR engine/endpoint/key |

### Workspace & Credential Guardrails

- **Workspace confinement & symlink protection**: All reads and writes stay under `session.header.cwd`, symlinks are never written through, new files use `O_EXCL`, and `.txt` transcripts use `0600` permissions on POSIX.
- **Pinned endpoint & redirect block**: ASR requests only go to the configured `asrBaseUrl`, mismatched `engine` overrides are rejected, and `3xx` redirects abort immediately before sending audio.
- **Instant cancellation**: `voice_tts`, `voice_preview`, and `voice_stt` propagate `exec.signal` to close WebSockets and abort uploads immediately on cancel.

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
