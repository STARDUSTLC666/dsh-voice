[简体中文](README.md) · **English**

# Voice

**Turn text into natural speech and recordings into clean transcripts.**

Voice plugin for DeepSeek Harness (`>=0.2.2-rc.3`): provides zero-key Edge neural text-to-speech (TTS), batch voice previews, native live Settings forms with secret masking, and OpenAI/Groq-compatible speech-to-text (STT) strictly scoped to your session workspace.

[![npm](https://img.shields.io/npm/v/dsh-voice)](https://www.npmjs.com/package/dsh-voice) [![downloads](https://raw.githubusercontent.com/STARDUSTLC666/dsh-suite/npm-downloads/assets/dsh-voice-downloads.svg)](https://www.npmjs.com/package/dsh-voice) [![total downloads](https://raw.githubusercontent.com/STARDUSTLC666/dsh-suite/npm-downloads/assets/dsh-voice-total-downloads.svg)](https://www.npmjs.com/package/dsh-voice)

**[Install](#install) · [Get Started in 3 Steps](#get-started-in-3-steps) · [Full Guide](https://github.com/STARDUSTLC666/dsh-voice/blob/master/docs/USAGE.en.md)**

<picture>
  <source media="(prefers-color-scheme: dark) and (max-width: 640px)" srcset="https://raw.githubusercontent.com/STARDUSTLC666/dsh-voice/master/docs/assets/intro/workflow-en-mobile-dark.svg">
  <source media="(max-width: 640px)" srcset="https://raw.githubusercontent.com/STARDUSTLC666/dsh-voice/master/docs/assets/intro/workflow-en-mobile-light.svg">
  <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/STARDUSTLC666/dsh-voice/master/docs/assets/intro/workflow-en-dark.svg">
  <img src="https://raw.githubusercontent.com/STARDUSTLC666/dsh-voice/master/docs/assets/intro/workflow-en-light.svg" alt="Turn text into speech and recordings into text. · workflow illustration" width="100%">
</picture>

## Install

Open **Plugins** in the DSH desktop app and install `dsh-voice`, or use the CLI:

```bash
dsh plugin --profile desktop add dsh-voice
```

For the web profile, replace `desktop` with `web`. Restart DSH once after installing. Requires DSH `>=0.2.2-rc.3`.

<a id="start-using-it"></a>
## Get Started in 3 Steps

1. **Read-aloud works out of the box (zero API keys)**: Open a DSH session in your target workspace and ask the assistant to preview voices or turn any script into an MP3 immediately.
2. **Add an ASR key when you need transcription (applies live)**: Open **DSH Settings → Plugins → Voice (`dsh-voice`)** and enter your Groq or OpenAI-compatible `asrApiKey` (masked and applied immediately without restarting; `DSH_VOICE_ASR_KEY` env var is also supported).
3. **Preview, synthesize, or transcribe inside your workspace**: Place recordings inside your session workspace; generated MP3s and `.txt` transcripts stay safely inside the workspace and auto-number instead of overwriting existing files.

## Copy-Ready Prompts for Everyday Work

- **Audition 3 voices first, then synthesize the full audio (zero config)**
  > Generate short voice preview samples for 3 natural narration voices so I can listen first, then synthesize the full MP3 once I pick one.
- **Turn a written briefing into a ready-to-play MP3**
  > Condense today's notes into a 2-minute spoken script and generate `morning-brief.mp3` at `+10%` speed.
- **Transcribe a meeting recording & extract action items**
  > Transcribe `meeting.m4a` in this workspace, save the full transcript to `meeting.txt`, and list the action items.

## Quick Troubleshooting Checklist

| Symptom | Likely Cause | Fix |
| :--- | :--- | :--- |
| Health check says `asrApiKey` is missing, but you only want TTS | ASR key is only needed for audio-to-text transcription | **Keep using TTS directly** — no key is required for speech synthesis or previews |
| "Must stay inside the session workspace" error | Recording or output path points outside the workspace folder | Copy the audio file into the current DSH workspace folder first |
| Network / connection error | Corporate firewall or proxy required to reach Edge TTS / ASR | Set `proxyUrl` (e.g. `http://127.0.0.1:7890`) in **DSH Settings → Plugins → Voice** (applies live) |
| Audio exceeds 25 MB limit | Standard Whisper/ASR upload limit is 25 MB | Compress or split the audio with `dsh-ffmpeg` first, then transcribe |

## Plugin updates

Check updates at the bottom of native plugin details. Automatic checks are on by default; **automatic installation is off**. Suite-managed components update with their bundle.

## Documentation

- [Usage guide and configuration reference](https://github.com/STARDUSTLC666/dsh-voice/blob/master/docs/USAGE.en.md)
- [Full reference](https://github.com/STARDUSTLC666/dsh-voice/blob/master/docs/REFERENCE.en.md)
- [Release notes](https://github.com/STARDUSTLC666/dsh-voice/blob/master/CHANGELOG.md)
- [Validation scope and history](https://github.com/STARDUSTLC666/dsh-voice/blob/master/docs/VALIDATION.md)

## Feedback and contributions

If the plugin helps, a Star makes it easier for others to discover. Report issues in [Issues](https://github.com/STARDUSTLC666/dsh-voice/issues) or open [PRs](https://github.com/STARDUSTLC666/dsh-voice/pulls) (please strip credentials).

## License

[MIT AND LGPL-3.0-only](https://github.com/STARDUSTLC666/dsh-voice/blob/master/LICENSE)

<a id="what-it-does"></a>
<a id="requirements-and-configuration"></a>
