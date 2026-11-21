[简体中文](README.md) · **English**

# Voice

**Make a wish in chat — turn text into natural speech and audio/video into clean transcripts.**

**Wish-Driven, chat-first** voice plugin for DeepSeek Harness (`>=0.2.2-rc.3`) with an optional **5-theme Voice Studio** sidebar workbench. No memorizing raw voice IDs or filling parameter forms — state your goal in plain language and get finished deliverables in 1–2 tool calls: **6 high-level `scene` presets (`podcast` / `short-video` / `audiobook` / `briefing` / `story` / `dubbing`)**, **fuzzy natural-language style & dialect resolution** (`"深夜"`, `"纪录片"`, `"粤语男声"`, `"东北话"`, etc.), **automatic `targetDurationSec` duration fitting**, **built-in word-boundary-safe `autoPronunciations` tech lexicon**, **self-contained HTML5 interactive follow-along player (`createPlayer` / `playerOutput` → `.player.html`)**, **curated scene auditions (`voice_preview({ scene })`)**, and **conversational preference memory (`voice_prefs`)**. Powered by zero-key Edge neural TTS (keep-alive WSS pool, 51 live-verified built-ins, 300+ online voices, 10 personas) plus OpenAI / SiliconFlow / custom engines (emotion acting, Kokoro blending, SHA-256 cached zero-shot cloning), with **short-video karaoke `.ass` captions (`\kf`)**, **inline `[pause:500ms]` beats**, **native MP3 ID3v2 `CHAP`/`CTOC` chapters**, **zero-drift `atempo` `.srt`/`.vtt` dubbing**, **podcast BGM auto-ducking & `-16 LUFS` mastering**, and **direct video container (`.mp4`/`.mkv`/`.mov`/`.avi`) speaker-diarized (`diarize`) STT** strictly confined to your session workspace.

[![npm](https://img.shields.io/npm/v/dsh-voice)](https://www.npmjs.com/package/dsh-voice) [![downloads](https://raw.githubusercontent.com/STARDUSTLC666/dsh-suite/npm-downloads/assets/dsh-voice-downloads.svg)](https://www.npmjs.com/package/dsh-voice) [![total downloads](https://raw.githubusercontent.com/STARDUSTLC666/dsh-suite/npm-downloads/assets/dsh-voice-total-downloads.svg)](https://www.npmjs.com/package/dsh-voice)

**[Install](#install) · [Get Started in 3 Steps](#get-started-in-3-steps) · [Full Guide](https://github.com/STARDUSTLC666/dsh-voice/blob/master/docs/USAGE.en.md)**

<picture>
  <source media="(prefers-color-scheme: dark) and (max-width: 640px)" srcset="https://raw.githubusercontent.com/STARDUSTLC666/dsh-voice/master/docs/assets/intro/workflow-en-mobile-dark.svg">
  <source media="(max-width: 640px)" srcset="https://raw.githubusercontent.com/STARDUSTLC666/dsh-voice/master/docs/assets/intro/workflow-en-mobile-light.svg">
  <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/STARDUSTLC666/dsh-voice/master/docs/assets/intro/workflow-en-dark.svg">
  <img src="https://raw.githubusercontent.com/STARDUSTLC666/dsh-voice/master/docs/assets/intro/workflow-en-light.svg" alt="Turn text into speech and recordings into text. · workflow illustration" width="100%">
</picture>

## Highlights

- **Wish-Driven Chat-First Delivery (`voice_tts` + `voice_preview` + `voice_prefs`)**:
  - **6 `scene` presets**: Pass `podcast`, `short-video`, `audiobook`, `briefing`, `story`, or `dubbing` (or Chinese aliases) to inherit tuned persona, subtitle granularity, loudness mastering, Markdown cleanup, and smart output filenames automatically — with graceful `normalizeLoudness` degradation (`warnings`) when local `ffmpeg` is unavailable.
  - **Fuzzy style/dialect matching & `targetDurationSec` fitting**: Pass natural phrases like `"深夜"`, `"纪录片"`, `"播客女"`, `"粤语男声"`, or `"东北话"` directly in `voice` or `persona`; set `targetDurationSec` (`3–3600s`) to auto-calibrate speech rate and apply pitch-preserving FFmpeg `atempo` so voiceovers land inside strict time budgets.
  - **Built-in tech lexicon & interactive HTML5 player**: `autoPronunciations` defaults to `true` with word-boundary-safe rules (`Nginx`, `SQL`, `K8s`, `PostgreSQL`, `kubectl`, `GraphQL`, `WebSocket` — never corrupting `POST` or `BUILD`); enable `createPlayer: true` or `playerOutput` to emit a zero-dependency `<stem>.player.html` with light/dark theme, speed control, download, chapter jumps, and click-to-seek synced subtitles.
  - **Conversational preference memory (`voice_prefs`) & curated auditions (`voice_preview({ scene })`)**: Say *"Default to documentary voice and remember Cordis as 科迪斯"* to persist creative preferences live (strictly excluding credentials/proxies/engines); say *"Pick a few podcast or dialect voices to audition"* to get 3–4 contrasting MP3 samples + `voice_previews/index.html` in one call.
- **Short-Video Karaoke `.ass` Subtitles, Native MP3 Chapters, Zero-Drift Dubbing & BGM Ducking**: `subtitleGranularity` (`"sentence"` | `"clause"` | `"word"`) + `maxCharsPerCue` creates punchy vertical captions, and `subtitleOutput: "clip.ass"` outputs `1080x1920` SubStation Alpha cues with `{\kf}` word-by-word karaoke timing for `dsh-ffmpeg`. Inline `[pause:500ms]` / `[停顿0.6s]` beats work across Edge and OpenAI/SiliconFlow and strip cleanly from subtitles; multi-heading Markdown or titled `segments[]` embed clickable ID3v2 `CHAP`/`CTOC` MP3 bookmarks (`chaptersOutput`); `subtitleInput` chains FFmpeg `atempo` for zero cumulative drift; VBR `Xing`/`Info`/`VBRI` stripping keeps multi-segment `durationSec` and seekbars exact.
- **Direct Video Container STT (`voice_stt`), Voice Catalog (`voice_list`) & Offline Diagnostics (`voice_health`)**: Pass `.mp4`/`.mkv`/`.mov`/`.avi` directly to `voice_stt` for automatic `-vn` 16kHz mono extraction via local `ffmpeg`, alongside `diarize: true` speaker separation, `autoCompress: true` (>25 MB), and keyless loopback Whisper. `voice_list` exposes 51 live-verified built-in + 300+ online Edge voices (auto-collapsed in chat when >60 voices) and 10 personas; `voice_health` performs offline `tts`/`stt` diagnostics.
- **Optional 5-Theme Voice Studio Sidebar Workbench**: Open the sidebar whenever you want **8-second browser mic 1-click clone creation** (`voice_clones/` + auto-ASR + `customVoices`), visual multi-speaker dialogue authoring, or the **Workspace Library** click-to-seek subtitle player across **Native Airy / Warm Cream / Claude Warmth / Bright 8-Bit / Airy Mint**.

### 6 Registered Tools at a Glance

| Tool | Purpose |
| :--- | :--- |
| `voice_tts` | Wish-driven synthesis for MP3s, `.srt`/`.vtt`/`.ass` subtitles, MP3 chapters, `.player.html` interactive players, `targetDurationSec` fitting & BGM-ducked podcasts |
| `voice_stt` | Audio & direct video container (`.mp4`/`.mkv`/`.mov`/`.avi`) transcription with `diarize` speaker separation & `autoCompress` |
| `voice_list` | Discover 51 live-verified built-in + 300+ online Edge voices, 10 `persona` presets, and `customVoices` aliases |
| `voice_preview` | Curate 3–4 contrasting voices by `scene`/style (or explicit `voices`) and generate MP3 samples + `voice_previews/index.html` |
| `voice_health` | Offline configuration self-check (`scope: "tts" | "stt" | "all"`, reporting `ttsReady` and `sttReady` separately) |
| `voice_prefs` | Persist creative preferences (`ttsVoice`, `ttsRate`, `ttsPitch`, `pronunciations`, `customVoices`) directly from chat under strict non-credential guardrails |

## Install

Open **Plugins** in the DSH desktop app and install `dsh-voice`, or use the CLI:

```bash
dsh plugin --profile desktop add dsh-voice
```

For the web profile, replace `desktop` with `web`. Restart DSH once after installing. Requires DSH `>=0.2.2-rc.3`. The plugin bundles the Wish-Driven `voice-workflow` skill so your assistant fulfills high-level speech requests in 1–2 calls with smart scene defaults, karaoke `.ass` captions, chaptered audiobooks/podcasts, interactive HTML5 players, preference persistence, cloning, dubbing, and audio/video transcription.

<a id="start-using-it"></a>
## Get Started in 3 Steps

1. **Make a wish in chat (zero API keys for TTS)**: Right after install, ask your assistant to *"turn `report.md` into a chaptered audiobook with an interactive player"* or *"pick a few podcast voices for me to audition"* — `voice_tts`, `voice_preview`, and `voice_list` deliver MP3s, subtitles, and `.player.html` immediately with zero keys.
2. **Remember preferences in chat, and add optional cloning/ASR keys only when needed**: Tell the assistant *"Default to documentary voice and pronounce Nginx as Engine X"* (`voice_prefs` saves live). Open **DSH Settings → Plugins → Voice (`dsh-voice`)** when you want to switch `ttsEngine` (`siliconflow`/`openai`/`custom`) for acting/cloning or add `asrApiKey` for `voice_stt` (loopback `127.0.0.1`/`localhost` needs no key; verify anytime with `voice_health`).
3. **Play `.player.html` or open Voice Studio on demand**: All scripts, timelines, BGM, reference clips, audio/video, and generated files stay safely inside your session workspace (auto-numbering without overwriting). Open `.player.html` in any browser for click-to-seek playback, or open the Voice Studio sidebar when you want 8-second browser mic cloning or visual Workspace Library browsing.

## Copy-Ready Wish-Driven Prompts

- **Curate and audition voices by scene in one step**
  > Pick a few voices that fit a tech podcast and generate a browser audition page so I can compare them.
- **Turn a multi-heading Markdown doc into a chaptered audiobook + interactive HTML5 player**
  > Turn `weekly-report.md` in this workspace into a documentary-style audiobook with embedded MP3 chapters, `.srt` subtitles, and an interactive `.player.html`.
- **Produce a two-host podcast with BGM auto-ducking & loudness mastering**
  > Turn this changelog into a friendly two-host podcast with `assets/bgm.mp3`, auto-ducking, loudness normalization, and an interactive player.
- **Fit a short-video voiceover inside 30 seconds with karaoke `.ass` captions**
  > Read this short-video script with an energetic voice (keep the `[pause:500ms]` beats and fit it strictly under 30 seconds), exporting `clip.mp3` and karaoke `clip.ass`.
- **Use fuzzy dialect/style wishes & remember defaults via chat**
  > Read this intro with a Cantonese male voice; also remember to use the documentary voice at `-5%` rate by default and pronounce `Cordis` as `Cor-dis`.
- **Zero-drift `.srt` dubbing or direct `.mp4` meeting transcription**
  > Dub `video.srt` with zero timeline drift; or transcribe `lecture.mp4` directly with speaker diarization and save `lecture.txt` and `lecture.srt`.

## Quick Troubleshooting Checklist

| Symptom | Likely Cause | Fix |
| :--- | :--- | :--- |
| Health check says `asrApiKey` is missing, but you only want TTS | ASR key is only needed for `voice_stt` transcription | **Keep using TTS directly** — `voice_health({ scope: "tts" })` reports `ttsReady` separately |
| `referenceAudio` fails saying cloning engine is required | Default `edge` engine does not support zero-shot reference cloning | Switch `ttsEngine` to `siliconflow` or `custom` in **DSH Settings → Plugins → Voice** (applies live) |
| Podcast loudness normalization shows a warning, or video STT / `bgmFile` / `atempo` says `ffmpeg` is missing | `-16 LUFS` mastering, video extraction (`-vn`), BGM ducking, and `atempo` fitting require local `ffmpeg` | `normalizeLoudness` degrades gracefully with `warnings` and still delivers the clean MP3; install local `ffmpeg` to enable full audio/video post-processing |
| `voice_prefs` reports read-only settings | Host is running with `settings.writable === false` | Update preferences manually in **DSH Settings → Plugins → Voice**, or pass parameters directly on `voice_tts` |
| "Must stay inside the session workspace" error | Script, subtitle, BGM, video/audio, reference clip, or output resolves outside workspace | Copy the file into the current DSH workspace folder first |
| Network / connection error | Corporate firewall or proxy required to reach Edge TTS / ASR | Set `proxyUrl` (`http://`, `https://`, `socks5://`, or `socks5h://`) in **DSH Settings → Plugins → Voice** (applies live) |
| Audio exceeds 25 MB limit | Standard Whisper/ASR upload limit is 25 MB | Ask the assistant to enable `autoCompress: true` (videos auto-extract 16kHz mono via local `ffmpeg`) or pre-process with `dsh-ffmpeg` |

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
