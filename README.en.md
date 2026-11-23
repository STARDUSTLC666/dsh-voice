[简体中文](README.md) · **English**

# Voice

> **Make a wish in chat — turn text into natural speech and audio/video into clean transcripts.**

Wish-Driven, chat-first voice plugin for DeepSeek Harness (`>=0.2.2-rc.3`) with an optional 5-theme **Voice Studio** sidebar workbench. Ships zero-key Edge neural TTS out of the box with strict session-workspace isolation.

[![npm](https://img.shields.io/npm/v/dsh-voice)](https://www.npmjs.com/package/dsh-voice) [![downloads](https://raw.githubusercontent.com/STARDUSTLC666/dsh-suite/npm-downloads/assets/dsh-voice-downloads.svg)](https://www.npmjs.com/package/dsh-voice) [![total downloads](https://raw.githubusercontent.com/STARDUSTLC666/dsh-suite/npm-downloads/assets/dsh-voice-total-downloads.svg)](https://www.npmjs.com/package/dsh-voice)

**[Highlights](#highlights) · [Install](#install) · [Get Started in 3 Steps](#get-started-in-3-steps) · [Full Guide](https://github.com/STARDUSTLC666/dsh-voice/blob/master/docs/USAGE.en.md)**

<picture>
  <source media="(prefers-color-scheme: dark) and (max-width: 640px)" srcset="https://raw.githubusercontent.com/STARDUSTLC666/dsh-voice/master/docs/assets/intro/workflow-en-mobile-dark.svg">
  <source media="(max-width: 640px)" srcset="https://raw.githubusercontent.com/STARDUSTLC666/dsh-voice/master/docs/assets/intro/workflow-en-mobile-light.svg">
  <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/STARDUSTLC666/dsh-voice/master/docs/assets/intro/workflow-en-dark.svg">
  <img src="https://raw.githubusercontent.com/STARDUSTLC666/dsh-voice/master/docs/assets/intro/workflow-en-light.svg" alt="Turn text into speech and recordings into text. · workflow illustration" width="100%">
</picture>

## Highlights

| Pillar | Capabilities |
| :--- | :--- |
| **Wish-Driven Delivery** | 6 scene presets (`podcast` / `short-video` / `audiobook` / `briefing` / `story` / `dubbing`), fuzzy style & dialect resolution, and `targetDurationSec` automatic duration fitting |
| **Interactive Player & Memory** | Built-in word-boundary-safe tech lexicon (`Nginx`, `K8s`, `SQL`, etc.), zero-dep `.player.html` follow-along player, and conversational preference persistence (`voice_prefs`) |
| **Multi-Engine & Cloning** | Zero-key Edge neural TTS (51 built-ins + 300+ online voices, 10 personas), plus optional OpenAI / SiliconFlow / custom engines for emotion acting, Kokoro blending & zero-shot cloning |
| **Captions & Podcast Mastering** | Vertical karaoke `.ass` (`\kf`) captions, inline `[pause:500ms]` beats, native MP3 ID3v2 chapters, zero-drift `atempo` `.srt`/`.vtt` dubbing, and BGM auto-ducking (`-16 LUFS`) |
| **Direct Video Container STT** | Pass `.mp4`/`.mkv`/`.mov`/`.avi` directly to `voice_stt` for auto `-vn` audio extraction, `diarize` speaker separation, `autoCompress` (>25 MB), and keyless loopback Whisper |
| **5-Theme Voice Studio** | Optional sidebar workbench for 8-second browser mic 1-click clone creation, visual multi-speaker authoring, and Workspace Library click-to-seek playback |

### 6 Registered Tools at a Glance

| Tool | Purpose |
| :--- | :--- |
| `voice_tts` | One-call synthesis for MP3s, `.srt`/`.vtt`/`.ass` subtitles, MP3 chapters, `.player.html` players, duration fitting & BGM-ducked podcasts |
| `voice_stt` | Audio & direct video container transcription with `diarize` speaker separation & `autoCompress` |
| `voice_list` | Browse 51 live-verified built-in + 300+ online Edge voices, 10 personas, and `customVoices` aliases |
| `voice_preview` | Curate 3–4 contrasting voices by `scene`/style and output MP3 samples + `voice_previews/index.html` |
| `voice_health` | Offline config self-check (`scope: "tts" | "stt" | "all"`) reporting `ttsReady` and `sttReady` separately |
| `voice_prefs` | Persist non-credential creative defaults (`ttsVoice`, rate, pitch, pronunciations, aliases) directly from chat |

## Install

Open **Plugins** in the DSH desktop app and install `dsh-voice`, or use the CLI:

```bash
dsh plugin --profile desktop add dsh-voice
```

For the web profile, replace `desktop` with `web` and restart DSH. Requires DSH `>=0.2.2-rc.3` (bundles the `voice-workflow` skill).

<a id="start-using-it"></a>
## Get Started in 3 Steps

1. **Make a wish in chat (zero API keys for TTS)**: Ask *"turn `report.md` into a chaptered audiobook with an interactive player"* or *"pick a few podcast voices to audition"* to get MP3s, subtitles, and `.player.html` in 1–2 calls.
2. **Save habits in chat, add keys only if needed**: Say *"Default to documentary voice and pronounce Nginx as Engine X"* (`voice_prefs` saves live). Open **DSH Settings → Plugins → Voice** only for cloning or cloud ASR keys.
3. **Play `.player.html` or open Voice Studio**: All artifacts stay safely inside your session workspace with auto-numbering. Open `.player.html` in any browser, or use the sidebar for 8-second mic cloning and library browsing.

### Copy-Ready Prompts

- **Audition by scene**: `Pick a few voices that fit a tech podcast and generate a browser audition page so I can compare them.`
- **Chaptered audiobook**: `Turn weekly-report.md into a documentary-style audiobook with embedded MP3 chapters, .srt subtitles, and an interactive .player.html.`
- **Two-host podcast + BGM**: `Turn this changelog into a friendly two-host podcast with assets/bgm.mp3, auto-ducking, loudness normalization, and an interactive player.`
- **30s short-video + karaoke `.ass`**: `Read this short-video script energetically (keep [pause:500ms] beats, strictly under 30 seconds), exporting clip.mp3 and karaoke clip.ass.`
- **Dialect & saved defaults**: `Read this intro with a Cantonese male voice; remember to use the documentary voice at -5% rate by default and pronounce Cordis as Cor-dis.`
- **Dubbing / video STT**: `Dub video.srt with zero timeline drift; or transcribe lecture.mp4 directly with speaker diarization into lecture.txt and lecture.srt.`

## Quick Troubleshooting Checklist

| Symptom | Likely Cause | Fix |
| :--- | :--- | :--- |
| Health check flags missing `asrApiKey` when only using TTS | ASR key is only needed for `voice_stt` | **Keep using TTS normally** — check `voice_health({ scope: "tts" })` separately |
| `referenceAudio` says cloning is unsupported | Default `edge` engine does not support cloning | Switch `ttsEngine` to `siliconflow` or `custom` in plugin settings (applies live) |
| Loudness warning, or video STT / BGM / `atempo` reports missing tool | `-16 LUFS`, `-vn` extraction, ducking & `atempo` need local `ffmpeg` | Loudness degrades gracefully with `warnings`; install `ffmpeg` for full post-processing |
| "Must stay inside the session workspace" | Input or output path escapes the current workspace | Copy source files into the active session workspace first |
| Network / connection error | Restricted network blocking Edge TTS / ASR | Set `proxyUrl` (`http`/`https`/`socks5`) in plugin settings (applies live) |
| Audio exceeds 25 MB limit | Standard ASR endpoint upload cap is 25 MB | Enable `autoCompress: true` or pre-process with `dsh-ffmpeg` |

## Plugin updates

Check updates at the bottom of native plugin details. Automatic checks are on by default; **automatic installation is off**. Suite-managed components update with their bundle.

## Documentation & feedback

- [Usage guide](https://github.com/STARDUSTLC666/dsh-voice/blob/master/docs/USAGE.en.md) · [Full reference](https://github.com/STARDUSTLC666/dsh-voice/blob/master/docs/REFERENCE.en.md) · [Release notes](https://github.com/STARDUSTLC666/dsh-voice/blob/master/CHANGELOG.md) · [Validation history](https://github.com/STARDUSTLC666/dsh-voice/blob/master/docs/VALIDATION.md)
- Stars, [Issues](https://github.com/STARDUSTLC666/dsh-voice/issues), and [PRs](https://github.com/STARDUSTLC666/dsh-voice/pulls) are welcome (strip credentials first).

## License

[MIT AND LGPL-3.0-only](https://github.com/STARDUSTLC666/dsh-voice/blob/master/LICENSE)

<a id="what-it-does"></a>
<a id="requirements-and-configuration"></a>
