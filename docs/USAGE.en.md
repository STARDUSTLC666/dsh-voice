# dsh-voice Usage Guide

[Overview](../README.en.md) · [Changelog](../CHANGELOG.md) · [Validation](VALIDATION.md)

## Get Started in 3 Steps

### Step 1: Know What Works Out of the Box, 5-Theme Workbench & Optional Setup

- **Native 5-theme Voice Studio sidebar workbench**: Open Voice Studio in the DSH sidebar with 5 synced themes (**Native Airy / Warm Cream / Claude Warmth / Bright 8-Bit / Airy Mint**) and an interactive Coachmark onboarding tour. Audition 300+ online voices and 10 personas (`0.8x–1.5x` speed + duration badge), dictate with your browser microphone (`MediaRecorder`), and manage `customVoices` and `pronunciations` rules without editing YAML.
- **Text-to-speech (`voice_tts`, `voice_list`, `voice_preview`) works with zero config**: Uses Edge neural voices by default with zero API keys — discover 300+ live online Edge voices or 45+ all-age/dialect built-ins, apply 10 ready-made `persona` presets, reverse-dub `.srt`/`.vtt` timelines (`subtitleInput`), apply `pronunciations`, inspect exact `durationMs`/`durationSec`, generate an interactive browser audition page, narrate long workspace files, compose multi-speaker podcasts, and export `.srt`/`.vtt` subtitles. Switch `ttsEngine` to `siliconflow`, `openai`, or `custom` in Settings when you need emotion `instructions`, Kokoro voice blending, or zero-shot `referenceAudio` cloning.
- **Speech-to-text (`voice_stt`) needs an ASR key for cloud endpoints (loopback Whisper is keyless)**:
  - **Recommended**: Open **DSH → Settings → Plugins → Voice (`dsh-voice`)**, pick `asrEngine` (`groq` by default, `openai`, `siliconflow`, or `custom`), and paste `asrApiKey` (masked and **applied live on save without restarting**; when `custom` points to `127.0.0.1` or `localhost`, no key is required);
  - **Custom voice aliases (`customVoices`) & pronunciation lexicon (`pronunciations`)**: Save reusable named characters and pronunciation overrides (e.g. `Nginx` → `Engine X`) in DSH Settings or Voice Studio (live-reloaded without restarting);
  - **CLI / Environment variable**: Set `DSH_VOICE_ASR_KEY` (and optionally `DSH_VOICE_TTS_KEY`) or configure `cordis.patch.yml`:

```yaml
- id: voice
  name: 'dsh-voice'
  config:
    ttsEngine: edge                       # edge | openai | siliconflow | custom
    ttsVoice: zh-CN-XiaoxiaoNeural        # default voice ID, built-in persona, or customVoices alias (applies live)
    ttsRate: '+0%'                        # default speech rate, e.g. +15% or -10%
    ttsPitch: '+0Hz'                      # default pitch, e.g. +2Hz or -1Hz
    # ttsBaseUrl: https://api.siliconflow.cn/v1  # optional for non-edge engines
    # ttsModel: FunAudioLLM/CosyVoice2-0.5B
    # ttsApiKey: sk-...                   # prefer DSH Settings or DSH_VOICE_TTS_KEY
    # pronunciations:
    #   - word: Nginx
    #     alias: Engine X
    #   - word: SQL
    #     alias: S Q L
    # customVoices:
    #   - name: narrator-wang
    #     persona: documentary-narrator
    #     rate: '-5%'
    #   - name: kokoro-blend
    #     voice: 'zf_xiaobei*0.6+zf_xiaoni*0.4'
    #   - name: alex-clone
    #     referenceAudio: voices/alex.wav
    #     referenceText: 'Hello, this is my reference voice sample.'
    asrEngine: groq                       # groq | openai | siliconflow | custom
    asrModel: whisper-large-v3-turbo      # optional; defaults to engine preset
    # asrApiKey: gsk_...                  # prefer DSH Settings or DSH_VOICE_ASR_KEY (optional for loopback custom)
    # proxyUrl: socks5://127.0.0.1:1080   # supports http://, https://, socks5://, socks5h://
```

### Step 2: Keep Scripts, Subtitles, BGM, Reference Clips, Audio & Outputs Inside Your Session Workspace

All `voice_tts` input files (`inputFile`), reverse-dubbing subtitle files (`subtitleInput`, ≤200 cues), podcast background music (`bgmFile`), zero-shot cloning clips (`referenceAudio`, ≤10 MB), input audio (`audio`), and generated MP3 / `.txt` / `.srt` / `.vtt` / preview files must resolve under the active DSH session workspace (`session.header.cwd`) to protect host files. Copy outside files into the workspace first.

### Step 3: Discover Voices/Personas, Audition, Then Synthesize or Transcribe

Unsure which voice fits best? Call `voice_list({ online: true, locale, gender, tag })` to fetch Microsoft's live 300+ neural voices (cached 24h in memory with automatic fallback to 45+ curated built-ins, plus the 10 built-in `persona` recipes and configured `customVoices`), then call `voice_preview` to render short samples plus an interactive `voice_previews/index.html` page. The plugin ships `skills/voice-workflow/SKILL.md` so your assistant automatically uses `inputFile`, Markdown cleanup, `persona`, `segments`, `-16 LUFS` loudness normalization, and subtitle export.

---

## Copy-Ready Prompts for Everyday Work

- **Discover online voices & personas and audition via the interactive HTML page**
  > Run `voice_list` with `online: true` for tag `podcast`, then preview a few alongside `late-night-radio` and `anime-boy` in `voice_previews/index.html` so I can pick my favorite.
- **Narrate a Markdown file directly with a persona and synchronized subtitles**
  > Synthesize `guide.md` in this workspace using `documentary-narrator` into `guide.mp3` and export `guide.srt`.
- **Create a loudness-balanced two-host podcast MP3 with BGM auto-ducking**
  > Turn this release note into a two-host podcast using `podcast-host-female` and `podcast-host-male`, mix `assets/bgm.mp3` with `bgmDucking: true` and `normalizeLoudness: true`, saving `episode.mp3` and `episode.srt`.
- **Reverse-dub an existing `.srt`/`.vtt` timeline with custom pronunciation rules**
  > Dub `video.srt` in this workspace using `bilingual-tech-male`, pronouncing `Nginx` as `Engine X` (keep `Nginx` in subtitles), save `dubbed.mp3` and `dubbed.srt`, and report exact `durationSec`.
- **Emotion-directed acting or 5–10s zero-shot voice cloning (SiliconFlow / OpenAI / custom engine)**
  > Use `ref.wav` (transcript: "Hello, what a great day to start!") in this workspace for zero-shot cloning with cheerful acting `instructions` and inline `[laughter]`, saving `greeting.mp3`.
- **Transcribe a large recording with speaker diarization, auto-compression, and subtitles**
  > Transcribe `interview.m4a` in this workspace with `diarize: true` (enable `autoCompress` if over 25 MB; prompt hint: DeepSeek Harness, Cordis), and save `interview.txt` and `interview.srt`.
- **Scoped offline configuration self-check**
  > Run a voice health check to verify `ttsReady`, `sttReady`, voice/persona/alias status, prosody settings, proxy, and ASR key status.

---

## Quick Troubleshooting Checklist

Run `voice_health` first (offline check with zero network traffic; supports `scope: "tts" | "stt" | "all"` and reports `ttsReady` and `sttReady` separately):

| Symptom | Usual Cause | Quick Fix |
| :--- | :--- | :--- |
| Health check says `asrApiKey` is missing | `asrApiKey` and `DSH_VOICE_ASR_KEY` are both empty | Safe to ignore if you only need TTS (`ttsReady` is `true`), or pass `scope: "tts"`; for local Whisper, set `asrEngine: custom` with `127.0.0.1`/`localhost` (no key needed) |
| `referenceAudio` fails saying cloning engine is required | `ttsEngine` is still `edge` (Edge does not support zero-shot reference cloning) | Switch `ttsEngine` to `siliconflow` (`CosyVoice2-0.5B`) or `custom` (e.g. local GPT-SoVITS / IndexTTS) in **DSH Settings → Plugins → Voice** |
| `normalizeLoudness` or `bgmFile` fails saying `ffmpeg` is missing | `-16 LUFS` loudness mastering and `sidechaincompress` BGM ducking require local `ffmpeg` | Install `ffmpeg` locally (or pre-process with `dsh-ffmpeg`), or omit `normalizeLoudness`/`bgmFile` |
| Invalid voice ID, rate, or pitch error | `ttsVoice` is not a valid Edge ID, built-in `persona`, or `customVoices` alias, or `ttsRate`/`ttsPitch` format is invalid | Run `voice_list` to pick a valid ID or persona, and fix `ttsVoice` / `ttsRate` / `ttsPitch` in Settings |
| Network error on TTS or STT | Direct connection blocked by corporate network | Enter `proxyUrl` (`http://`, `https://`, `socks5://`, or `socks5h://`) in **DSH Settings → Plugins → Voice** (applies live) |
| Path outside session workspace error | Script, subtitle, BGM, reference clip, audio, or output resolves outside workspace | Copy the file into the current session workspace folder first |
| Audio exceeds 25 MB limit | Standard Whisper / ASR multipart cap is 25 MB | Pass `autoCompress: true` to `voice_stt` (uses local `ffmpeg` to compress/segment automatically) or pre-process with `dsh-ffmpeg` |
| ASR or TTS refuses a 3xx redirect | Redirects are blocked so audio/keys never leak to another host | Set `asrBaseUrl` / `ttsBaseUrl` directly to the final non-redirecting `/v1` endpoint |
| Existing output file was not overwritten | `overwrite: false` (default) suffixes `_1`, `_2` safely | Use the exact path returned by the tool, or enable `overwrite` in Settings |

---

## Tool & Voice Studio Reference

### Registered Tools (All 5)

| Tool | Purpose | Key Parameters & Notes |
| :--- | :--- | :--- |
| `voice_tts` | Synthesize MP3 & subtitles from text, files, timelines, or dialogues | Supports `text`, `inputFile` (≤100k chars auto-chunked), `cleanMarkdown` (default `true` for `.md`), `subtitleInput` (`.srt`/`.vtt` reverse timeline dubbing, ≤200 cues), `segments` (≤50 turns, per-turn `voice`/`persona`/`rate`/`pitch`/`pauseMs`/`instructions`/`referenceAudio`/`referenceText`), `pronunciations` (`[{ word, alias }]` or `{ word: alias }`), `bgmFile` / `bgmVolume` (`0.02–1.0`, default `0.18`) / `bgmDucking` (default `true`), `normalizeLoudness` (`-16 LUFS`), `persona`, `instructions`, `referenceAudio` (≤10 MB), `referenceText`, `subtitleOutput` (`.srt`/`.vtt`), `voice`, `rate`, `pitch`, `output`; returns exact `durationMs` and `durationSec` |
| `voice_stt` | Transcribe audio to text & subtitles (zero-copy upload) | `audio` required; supports `diarize` (`true` enables FFmpeg stereo channel split or `[Speaker]` turn diarization with `speakers` output), `autoCompress` (uses local `ffmpeg` for >25 MB), `timestamps`, `subtitleOutput` (`.srt`/`.vtt`), `model`, `language`, `prompt`, `output`, `engine` |
| `voice_list` | Discover online/built-in voices, personas & custom aliases | Optional `online` (`true` fetches & caches 300+ live Microsoft Edge voices for 24h, falling back to 45+ curated built-ins), `locale`, `gender` (`Female`/`Male`), `tag` (e.g. `podcast`, `multilingual`, `dialect`, `child`, `teen`, `mature`, `elder`, `anime`, `documentary`), `includePersonas` (default `true`) |
| `voice_preview` | Bounded-concurrency (≤3) batch previews + HTML page | Optional `voices` (≤8; accepts raw voice IDs, built-in `persona` IDs/labels, or `customVoices` aliases), `text` (≤200 chars), `outputDir`, `htmlIndex` (default `true`, writes `voice_previews/index.html`) |
| `voice_health` | Offline configuration self-check | Optional `scope` (`all`/`tts`/`stt`), reports `ttsReady` / `sttReady` across engines, voice/persona/`customVoices` aliases, prosody, proxy, and keys |

### `0.9.0` Voice Studio & Pro Audio Capabilities

1. **Native 5-Theme Voice Studio Sidebar Workbench**:
   - Features 5 live-synced themes (**Native Airy / Warm Cream / Claude Warmth / Bright 8-Bit / Airy Mint**) and an interactive spotlight Coachmark onboarding tour;
   - Includes 4 workbench tabs: **Voices & Personas** (live audition 300+ voices & 10 personas, `0.8x–1.5x` playback, set default), **Studio & Prompts** (live duration badge + 1-click prompt templates), **Mic & Custom Voices** (browser `MediaRecorder` dictation -> `transcribeMic`, plus `customVoices` editor), and **Lexicon & Health** (`pronunciations` rules + `ttsReady`/`sttReady` badges).
2. **Exact MP3 Duration Feedback (`durationMs` / `durationSec`) & Matched-Sample-Rate Silence Frames**:
   - Inspects CBR/VBR and multi-engine MP3 frame headers to compute exact output duration and generates matched-sample-rate silence frames for pauses and timeline padding so agents can reliably target exact durations (such as 60s short-video voiceovers).
3. **Pronunciation Lexicon (`pronunciations`)**:
   - Compiles to SSML `<sub alias>` on Edge (exported `.srt`/`.vtt` subtitles preserve `Nginx` while speech says `Engine X`), and applies longest-first non-recursive replacement on OpenAI/SiliconFlow/custom engines while keeping original spellings in fallback subtitle cues.
4. **Reverse `.srt` / `.vtt` Video Dubbing (`subtitleInput`)**:
   - Parses `.srt`/`.vtt` cues, measures synthesized cue duration, re-synthesizes cues exceeding their time window by >8% with scaled speech rate (clamped `-30%` to `+85%`), and inserts millisecond silence gaps to stay aligned with the video timeline.
5. **Podcast BGM Auto-Ducking (`bgmFile`, `bgmVolume`, `bgmDucking`)**:
   - Uses local `ffmpeg` to loop workspace BGM, duck music under speech via `sidechaincompress`, add a smooth fade-out at the end, and optionally apply `-16 LUFS` loudness normalization (`normalizeLoudness: true`).
6. **Speaker Diarization (`diarize: true`) & SiliconFlow SHA-256 Cached Cloning URI**:
   - `voice_stt({ diarize: true })` splits stereo channels via `ffmpeg` when available or parses/infers speaker turns from `verbose_json` to output `[说话人 A]` paragraphs, `speakers` list, and speaker-prefixed `.srt`/`.vtt` cues;
   - SiliconFlow zero-shot cloning uploads `referenceAudio` once per SHA-256 hash to `/uploads/audio/voice` and caches the returned `speech:...` URI across podcast segments.

### `0.8.0` 4-Layer Voice Diversity Overview

1. **300+ Live Edge Voice Discovery & 45+ All-Age/Dialect Built-ins**:
   - `voice_list({ online: true })` fetches and caches (24h) Microsoft's live 300+ neural voice catalog, with automatic offline fallback (`source: "builtin-fallback"`) to 45+ curated voices:
     - **Child / Cute**: `zh-CN-XiaoshuangNeural`, `zh-CN-XiaoyouNeural`
     - **Teen / Anime**: `zh-CN-YunxiaNeural`
     - **Mature / Documentary / Elder**: `zh-CN-YunzeNeural`, `zh-CN-XiaoqiuNeural`, `zh-CN-XiaoruiNeural`
     - **Passionate / Drama**: `zh-CN-YunhaoNeural`, `zh-CN-YunfengNeural`, `zh-CN-XiaohanNeural`, `zh-CN-XiaomoNeural`, `zh-CN-XiaoxuanNeural`
     - **Chinese Dialects & HK/TW**: Northeast (`zh-CN-liaoning-XiaobeiNeural`), Shaanxi (`zh-CN-shaanxi-XiaoniNeural`), Sichuan (`zh-CN-sichuan-YunxiNeural`), Henan (`zh-CN-henan-YundengNeural`), Shandong (`zh-CN-shandong-YunxiangNeural`), Cantonese M/F (`zh-HK-WanLungNeural` / `zh-HK-HiuMaanNeural`), Taiwanese M/F (`zh-TW-YunJheNeural` / `zh-TW-HsiaoChenNeural` / `zh-TW-HsiaoYuNeural`)
2. **10 Ready-Made Personas (`persona`)**:
   - `late-night-radio`, `podcast-host-female`, `podcast-host-male`, `documentary-narrator`, `bedtime-story`, `anime-boy`, `energetic-anchor`, `news-briefing`, `bilingual-tech-female`, `bilingual-tech-male`.
3. **Emotion, Acting & Kokoro Blending (`instructions`)**:
   - Sent natively as `instructions` on OpenAI `gpt-4o-mini-tts`;
   - Automatically formatted as `<|endofprompt|>` prefix on SiliconFlow `FunAudioLLM/CosyVoice2-0.5B` with inline `[laughter]` / `[breath]` paralinguistics;
   - Supports Kokoro voice-blending expressions (`zf_xiaobei*0.6+zf_xiaoni*0.4`) on custom endpoints.
4. **Zero-Shot Voice Cloning (`referenceAudio` + `referenceText`) & `customVoices` Aliases**:
   - Clone any voice from a 5–10s clean workspace clip (≤10 MB) on `ttsEngine: 'siliconflow'` or `'custom'`;
   - Save reusable named presets in DSH Settings `customVoices` (live-reloaded without restart) for `voice_tts`, `segments[]`, and `voice_preview`.

### Engine Presets & Workspace Guardrails

- **Engine presets**:
  - `asrEngine`: `groq` (`whisper-large-v3-turbo`), `openai` (`whisper-1`), `siliconflow` (`FunAudioLLM/SenseVoiceSmall`), `custom` (keyless when targeting loopback `127.0.0.1` / `localhost`).
  - `ttsEngine`: `edge` (zero-key default), `openai` (`gpt-4o-mini-tts`), `siliconflow` (`FunAudioLLM/CosyVoice2-0.5B`), `custom` (OpenAI `/audio/speech`-compatible endpoint).
- **Workspace confinement & symlink protection**: All reads and writes (`inputFile`, `referenceAudio`, `audio`, and all outputs) stay under `session.header.cwd`, symlinks are never written through, new files use `O_EXCL`, and `.txt`/subtitle outputs use `0600` permissions on POSIX.
- **Pinned endpoint & redirect block**: Requests only go to the configured endpoint, mismatched `engine` overrides are rejected, and `3xx` redirects abort immediately.
- **Live timeouts & instant cancellation**: `timeoutMs` and `customVoices` update dynamically on config save; `voice_tts`, `voice_preview`, `voice_list`, and `voice_stt` propagate `exec.signal` to close WebSockets and abort compression/uploads immediately on cancel.

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
