[简体中文](README.md) · **English**

# Voice

**Turn text into natural speech and recordings into clean transcripts.**

Voice Studio workbench plugin for DeepSeek Harness (`>=0.2.2-rc.3`): includes a **native 5-theme sidebar Voice Studio workbench** (Native Airy / Warm Cream / Claude Warmth / Bright 8-Bit / Airy Mint with interactive Coachmark tour) alongside zero-key Edge neural TTS (300+ live online voices, 45+ all-age/dialect built-ins, 10 personas) and OpenAI / SiliconFlow / custom engines (emotion acting, Kokoro blending, SHA-256 cached zero-shot cloning). Supports **exact MP3 duration feedback (`durationMs` / `durationSec`)**, **pronunciation lexicon (`pronunciations`)**, **reverse `.srt`/`.vtt` video dubbing (`subtitleInput`)**, **podcast BGM auto-ducking & `-16 LUFS` mastering**, and **speaker-diarized (`diarize`)** multi-engine STT strictly confined to your session workspace.

[![npm](https://img.shields.io/npm/v/dsh-voice)](https://www.npmjs.com/package/dsh-voice) [![downloads](https://raw.githubusercontent.com/STARDUSTLC666/dsh-suite/npm-downloads/assets/dsh-voice-downloads.svg)](https://www.npmjs.com/package/dsh-voice) [![total downloads](https://raw.githubusercontent.com/STARDUSTLC666/dsh-suite/npm-downloads/assets/dsh-voice-total-downloads.svg)](https://www.npmjs.com/package/dsh-voice)

**[Install](#install) · [Get Started in 3 Steps](#get-started-in-3-steps) · [Full Guide](https://github.com/STARDUSTLC666/dsh-voice/blob/master/docs/USAGE.en.md)**

<picture>
  <source media="(prefers-color-scheme: dark) and (max-width: 640px)" srcset="https://raw.githubusercontent.com/STARDUSTLC666/dsh-voice/master/docs/assets/intro/workflow-en-mobile-dark.svg">
  <source media="(max-width: 640px)" srcset="https://raw.githubusercontent.com/STARDUSTLC666/dsh-voice/master/docs/assets/intro/workflow-en-mobile-light.svg">
  <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/STARDUSTLC666/dsh-voice/master/docs/assets/intro/workflow-en-dark.svg">
  <img src="https://raw.githubusercontent.com/STARDUSTLC666/dsh-voice/master/docs/assets/intro/workflow-en-light.svg" alt="Turn text into speech and recordings into text. · workflow illustration" width="100%">
</picture>

## Highlights

- **Native 5-Theme Voice Studio Sidebar Workbench**: Switch live between 5 synced themes (**Native Airy / Warm Cream / Claude Warmth / Bright 8-Bit / Airy Mint**) with an interactive Coachmark onboarding tour. Audition 300+ Edge voices and 10 `persona` presets in-panel (`0.8x–1.5x` playback + duration badge), dictate with your browser microphone, and manage `customVoices` aliases and `pronunciations` rules visually.
- **Exact MP3 Duration, Pronunciation Lexicon & Reverse `.srt`/`.vtt` Dubbing**: Inspects CBR/VBR and multi-engine MP3 streams to return exact `durationMs` / `durationSec` with matched-sample-rate silence frames (for hitting exact 60s short-video voiceover targets). `pronunciations` compiles to SSML `<sub alias>` on Edge (subtitles keep `Nginx` while speech says `Engine X`) and plain non-recursive replacement on OpenAI/SiliconFlow. `subtitleInput` scales per-cue speech rate and pads millisecond silences to stay locked to `.srt`/`.vtt` video timelines.
- **Podcast BGM Auto-Ducking, Emotion Acting & SHA-256 Cached Cloning**: Pass `bgmFile`, `bgmVolume`, and `bgmDucking` alongside `segments` for FFmpeg `sidechaincompress` music ducking, smooth fade-out, and optional `-16 LUFS` loudness mastering. Use `instructions` for acting direction (`<|endofprompt|>` + `[laughter]`/`[breath]` on CosyVoice2, native on `gpt-4o-mini-tts`, Kokoro voice blending), while SiliconFlow caches uploaded `referenceAudio` URIs by SHA-256 hash instead of re-uploading megabytes per segment.
- **Long-form File Synthesis, Browser Auditions, Speaker Diarization & Proxies**: `inputFile` reads `.md`/`.txt` with automatic Markdown cleanup (up to 100k chars); `voice_preview` writes `voice_previews/index.html`; `voice_stt` supports `groq`/`openai`/`siliconflow`/keyless loopback `custom`, `autoCompress: true` for >25 MB audio, and `diarize: true` (FFmpeg stereo channel split or `[Speaker A]` turn labeling); native `http://`, `https://`, `socks5://`, `socks5h://` proxy support.

## Install

Open **Plugins** in the DSH desktop app and install `dsh-voice`, or use the CLI:

```bash
dsh plugin --profile desktop add dsh-voice
```

For the web profile, replace `desktop` with `web`. Restart DSH once after installing. Requires DSH `>=0.2.2-rc.3`. The plugin bundles the `voice-workflow` skill so your assistant automatically follows best practices for voice discovery, personas, cloning, subtitle dubbing, BGM podcasts, and diarized transcription.

<a id="start-using-it"></a>
## Get Started in 3 Steps

1. **Open the Voice Studio sidebar workbench (zero API keys for TTS)**: Follow the Coachmark tour in the 5-theme sidebar workbench to audition 300+ Edge voices and 10 built-in `persona` presets, manage custom characters and pronunciation rules, or have the assistant narrate Markdown files, produce podcasts, and dub `.srt` timelines immediately.
2. **Optional TTS engines (acting/cloning) or ASR keys (loopback Whisper is keyless)**: Open **DSH Settings → Plugins → Voice (`dsh-voice`)** — switch `ttsEngine` to `siliconflow`, `openai`, or `custom` for emotion `instructions` or `referenceAudio` cloning (live on save). For browser mic dictation or transcription, pick `asrEngine` (`groq`, `openai`, `siliconflow`, or `custom`) and add `asrApiKey` (loopback `127.0.0.1`/`localhost` needs no key).
3. **Preview, synthesize, or transcribe inside your workspace**: Keep scripts, `.srt`/`.vtt` timelines, BGM clips, reference clips, and recordings inside your session workspace; generated MP3s, `.txt` transcripts, `.srt`/`.vtt` subtitles, and preview pages stay safely inside the workspace and auto-number instead of overwriting existing files.

## Copy-Ready Prompts for Everyday Work

- **Discover online voices & personas and audition in the browser**
  > Fetch online voices tagged `podcast` and generate previews in `voice_previews/index.html` comparing them with `late-night-radio` and `bilingual-tech-female` so I can pick one.
- **Turn a Markdown report into a two-host podcast with BGM auto-ducking**
  > Read `weekly-report.md` in this workspace and turn it into a two-host dialogue using `podcast-host-female` and `podcast-host-male`, mix `assets/bgm.mp3` with `bgmDucking: true` and `normalizeLoudness: true`, and save `podcast.mp3` and `podcast.srt`.
- **Reverse-dub a `.srt` timeline with custom pronunciation rules**
  > Dub `video.srt` in this workspace using `bilingual-tech-male`, pronouncing `Nginx` as `Engine X` while keeping `Nginx` in subtitles, save `dubbed.mp3` and `dubbed.srt`, and tell me the exact duration.
- **Zero-shot clone or emotion-directed voiceover (SiliconFlow / custom engine)**
  > Clone the voice from `sample_ref.wav` (transcript: "Hello, I am Alex, nice to meet you") in this workspace and read this welcome script with a warm, cheerful tone, saving `welcome.mp3`.
- **Transcribe a large meeting recording with speaker diarization & subtitles**
  > Transcribe `meeting.m4a` in this workspace with `diarize: true` (auto-compress if over 25 MB), save `meeting.txt` and `meeting.srt`, and list the action items.

## Quick Troubleshooting Checklist

| Symptom | Likely Cause | Fix |
| :--- | :--- | :--- |
| Health check says `asrApiKey` is missing, but you only want TTS | ASR key is only needed for audio-to-text transcription | **Keep using TTS directly** — health check reports `ttsReady` / `sttReady` separately and supports `scope: "tts"` |
| `referenceAudio` fails saying cloning engine is required | Default `edge` engine does not support zero-shot reference cloning | Switch `ttsEngine` to `siliconflow` or `custom` in **DSH Settings → Plugins → Voice** (applies live) |
| `normalizeLoudness` or `bgmFile` fails saying `ffmpeg` is missing | `-16 LUFS` loudness mastering and BGM ducking use local `ffmpeg` | Install `ffmpeg` locally (or pre-process with `dsh-ffmpeg`), or omit `normalizeLoudness`/`bgmFile` |
| "Must stay inside the session workspace" error | Script, subtitle, BGM, recording, reference clip, or output resolves outside workspace | Copy the file into the current DSH workspace folder first |
| Network / connection error | Corporate firewall or proxy required to reach Edge TTS / ASR | Set `proxyUrl` (`http://`, `https://`, `socks5://`, or `socks5h://`) in **DSH Settings → Plugins → Voice** (applies live) |
| Audio exceeds 25 MB limit | Standard Whisper/ASR upload limit is 25 MB | Ask the assistant to enable `autoCompress: true` (uses local `ffmpeg`) or pre-process with `dsh-ffmpeg` |

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
