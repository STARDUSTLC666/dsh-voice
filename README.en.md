[简体中文](README.md) · **English**

# Voice

**Turn text into natural speech and audio/video into clean transcripts.**

Voice Studio workbench plugin for DeepSeek Harness (`>=0.2.2-rc.3`): includes a **native 5-theme Voice Studio "True Creative Loop" sidebar workbench** (Native Airy / Warm Cream / Claude Warmth / Bright 8-Bit / Airy Mint with Coachmark tour, 8-second browser mic direct-to-clone creator, visual multi-speaker dialogue synthesizer, workspace media library, and click-to-seek synchronized subtitle player) alongside zero-key Edge neural TTS (keep-alive WSS pool, 300+ online voices, 45+ built-ins, 10 personas) and OpenAI / SiliconFlow / custom engines (emotion acting, Kokoro blending, SHA-256 cached zero-shot cloning). Supports **short-video clause/word subtitles & karaoke `.ass` export (`\kf`)**, **inline `[pause:500ms]` speech tags & word-boundary-safe `pronunciations`**, **native MP3 ID3v2 `CHAP`/`CTOC` chapters (`chaptersOutput`)**, **zero-drift `atempo` `.srt`/`.vtt` dubbing & VBR-accurate `durationSec`**, **podcast BGM auto-ducking & `-16 LUFS` mastering**, and **direct video container (`.mp4`/`.mkv`/`.mov`/`.avi`) speaker-diarized (`diarize`) STT** strictly confined to your session workspace.

[![npm](https://img.shields.io/npm/v/dsh-voice)](https://www.npmjs.com/package/dsh-voice) [![downloads](https://raw.githubusercontent.com/STARDUSTLC666/dsh-suite/npm-downloads/assets/dsh-voice-downloads.svg)](https://www.npmjs.com/package/dsh-voice) [![total downloads](https://raw.githubusercontent.com/STARDUSTLC666/dsh-suite/npm-downloads/assets/dsh-voice-total-downloads.svg)](https://www.npmjs.com/package/dsh-voice)

**[Install](#install) · [Get Started in 3 Steps](#get-started-in-3-steps) · [Full Guide](https://github.com/STARDUSTLC666/dsh-voice/blob/master/docs/USAGE.en.md)**

<picture>
  <source media="(prefers-color-scheme: dark) and (max-width: 640px)" srcset="https://raw.githubusercontent.com/STARDUSTLC666/dsh-voice/master/docs/assets/intro/workflow-en-mobile-dark.svg">
  <source media="(max-width: 640px)" srcset="https://raw.githubusercontent.com/STARDUSTLC666/dsh-voice/master/docs/assets/intro/workflow-en-mobile-light.svg">
  <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/STARDUSTLC666/dsh-voice/master/docs/assets/intro/workflow-en-dark.svg">
  <img src="https://raw.githubusercontent.com/STARDUSTLC666/dsh-voice/master/docs/assets/intro/workflow-en-light.svg" alt="Turn text into speech and recordings into text. · workflow illustration" width="100%">
</picture>

## Highlights

- **Native 5-Theme Voice Studio "True Creative Loop" Workbench**: Switch live across **Native Airy / Warm Cream / Claude Warmth / Bright 8-Bit / Airy Mint** with an interactive Coachmark tour. Audition 300+ Edge voices & 10 `persona` presets (`0.8x–1.5x` speed), **record 8 seconds on your browser mic to create a cloned character in 1 click** (`voice_clones/` + auto-ASR + `customVoices` registration), **compose and synthesize multi-speaker dialogues visually in-panel**, and play back generated files in the **Workspace Library + click-to-seek synchronized subtitle player**.
- **Short-Video Clause/Word Subtitles, Karaoke `.ass` Export, Inline Pauses & Word-Boundary Lexicon**: `subtitleGranularity` (`"sentence"` | `"clause"` | `"word"`) + `maxCharsPerCue` (default `16`) produces punchy vertical-video captions, while `subtitleOutput: "clip.ass"` emits `1080x1920` SubStation Alpha cues with `{\kf}` word-by-word karaoke timing ready for `dsh-ffmpeg` burn-in. Inline `[pause:500ms]` / `[break:600ms]` / `[停顿0.6s]` tags compile to Edge SSML `<break>` or matched-sample-rate silence frames (automatically stripped from subtitles), and ASCII word-boundary protection on `pronunciations` ensures acronyms like `OS`, `UI`, and `SQL` never corrupt words like `POST` or `BUILD`.
- **Native MP3 Chapters (`CHAP`/`CTOC`), Zero-Drift `atempo` Dubbing, VBR Fix & BGM Ducking**: Multi-heading Markdown (`#`/`##`/`###`) in `inputFile` or `title` on `segments[]` automatically embeds clickable ID3v2 `CHAP`/`CTOC` MP3 bookmarks and writes show-notes timestamps or JSON via `chaptersOutput` (`"chapters.md"` / `"chapters.json"`). `subtitleInput` chains FFmpeg `atempo` pitch-preserving window fitting for zero cumulative drift; VBR `Xing`/`Info`/`VBRI` frame stripping fixes multi-segment player seekbars and `durationSec`; Edge TTS pools keep-alive WSS connections with transient retry; full support for `bgmFile` ducking, `-16 LUFS` mastering, acting `instructions`, and SHA-256 cached cloning.
- **Direct Video Container STT (`.mp4`/`.mkv`/`.mov`/`.avi`), Long-Form Files & Diarization**: Pass video files straight to `voice_stt` to automatically strip video tracks (`-vn`) into lightweight 16kHz mono audio via local `ffmpeg` before ASR upload, alongside `diarize: true` speaker separation, `autoCompress: true` (>25 MB), and keyless loopback Whisper. Includes 100k-char `inputFile` synthesis, `voice_preview` HTML audition pages, and native `http://`, `https://`, `socks5://`, `socks5h://` proxies.

## Install

Open **Plugins** in the DSH desktop app and install `dsh-voice`, or use the CLI:

```bash
dsh plugin --profile desktop add dsh-voice
```

For the web profile, replace `desktop` with `web`. Restart DSH once after installing. Requires DSH `>=0.2.2-rc.3`. The plugin bundles the `voice-workflow` skill so your assistant automatically follows best practices for voice discovery, karaoke `.ass` subtitles, chaptered audiobooks/podcasts, cloning, zero-drift dubbing, BGM ducking, and audio/video transcription.

<a id="start-using-it"></a>
## Get Started in 3 Steps

1. **Open the Voice Studio sidebar workbench (zero API keys for TTS)**: Follow the Coachmark tour in the 5-theme workbench to audition 300+ Edge voices and 10 `persona` presets, compose and synthesize multi-speaker dialogues directly in-panel with synchronized subtitle follow-along, or ask the assistant to narrate chaptered Markdown files, export karaoke `.ass` captions, and dub `.srt` timelines.
2. **Optional TTS engines (acting/cloning) or ASR keys (1-click 8s mic clone & keyless loopback Whisper)**: Open **DSH Settings → Plugins → Voice (`dsh-voice`)** — switch `ttsEngine` to `siliconflow`, `openai`, or `custom` for emotion `instructions` or `referenceAudio` cloning (and use the 8s browser mic recorder in Voice Studio to create cloned characters in one click). For audio/video transcription or mic dictation, pick `asrEngine` (`groq`, `openai`, `siliconflow`, or `custom`) and add `asrApiKey` (loopback `127.0.0.1`/`localhost` needs no key).
3. **Synthesize, transcribe, and review in the Workspace Library**: Keep scripts, `.srt`/`.vtt` timelines, BGM tracks, reference clips, and audio/video files inside your session workspace; generated chaptered MP3s, `.ass`/`.srt`/`.vtt` subtitles, `chapters.md` show notes, and preview pages stay safely inside the workspace (auto-numbering without overwriting) and play right inside the **Workspace Library** tab with click-to-seek subtitles.

## Copy-Ready Prompts for Everyday Work

- **Discover online voices & personas and audition in the browser**
  > Fetch online voices tagged `podcast` and generate previews in `voice_previews/index.html` comparing them with `late-night-radio` and `bilingual-tech-female` so I can pick one.
- **Turn a multi-heading Markdown report into a chaptered podcast/audiobook with BGM ducking**
  > Read `weekly-report.md` in this workspace into a chaptered audio episode with `assets/bgm.mp3` (`bgmDucking: true`, `normalizeLoudness: true`), and save `podcast.mp3` (with embedded MP3 chapters), `podcast.srt`, and show notes `chapters.md`.
- **Export short-video clause captions & karaoke `.ass` with inline pauses**
  > Read this short-video script with `energetic-anchor` (keep the `[pause:500ms]` beats, set `subtitleGranularity: "clause"` and `maxCharsPerCue: 14`), and export `clip.mp3` plus karaoke `clip.ass` for `dsh-ffmpeg` burn-in.
- **Zero-drift reverse-dub a `.srt` timeline with word-boundary pronunciation rules**
  > Dub `video.srt` in this workspace using `bilingual-tech-male`, pronouncing `OS` as `Operating System` and `SQL` as `S Q L` without affecting words like `POST`, save `dubbed.mp3` and `dubbed.srt`, and report exact `durationSec`.
- **Zero-shot clone or emotion-directed voiceover (or 8s mic clone in Voice Studio)**
  > Clone the voice from `sample_ref.wav` (transcript: "Hello, I am Alex, nice to meet you") in this workspace and read this welcome script with a warm, cheerful tone, saving `welcome.mp3`.
- **Transcribe a `.mp4` video or large meeting recording with speaker diarization**
  > Transcribe `lecture.mp4` directly in this workspace with `diarize: true`, save `lecture.txt` and `lecture.srt`, and list the action items.

## Quick Troubleshooting Checklist

| Symptom | Likely Cause | Fix |
| :--- | :--- | :--- |
| Health check says `asrApiKey` is missing, but you only want TTS | ASR key is only needed for audio/video transcription | **Keep using TTS directly** — health check reports `ttsReady` / `sttReady` separately and supports `scope: "tts"` |
| `referenceAudio` fails saying cloning engine is required | Default `edge` engine does not support zero-shot reference cloning | Switch `ttsEngine` to `siliconflow` or `custom` in **DSH Settings → Plugins → Voice** (applies live) |
| Direct video STT, `bgmFile`, `normalizeLoudness`, or dense `atempo` fit says `ffmpeg` is missing | Video audio extraction (`-vn`), BGM ducking, `-16 LUFS` mastering, and `atempo` fitting require local `ffmpeg` | Install `ffmpeg` locally (or pre-process with `dsh-ffmpeg`), or pass audio directly / omit BGM & loudness flags |
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
