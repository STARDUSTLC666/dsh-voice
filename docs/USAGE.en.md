# dsh-voice Usage Guide

[Overview](../README.en.md) · [Changelog](../CHANGELOG.md) · [Validation](VALIDATION.md)

## Get Started in 3 Steps

### Step 1: Know What Works Out of the Box, 5-Theme Creative-Loop Workbench & Optional Setup

- **Native 5-theme Voice Studio "True Creative Loop" workbench**: Open Voice Studio in the DSH sidebar with 5 synced themes (**Native Airy / Warm Cream / Claude Warmth / Bright 8-Bit / Airy Mint**) and an interactive Coachmark tour. Audition 300+ online voices and 10 personas (`0.8x–1.5x` speed, 1-click MP3 download, and an **interactive click-to-seek synchronized subtitle player**), compose and synthesize multi-speaker dialogues visually right in the **Studio** tab, **record 8 seconds on your browser mic to create a cloned role in 1 click** (saves to `voice_clones/` + auto-ASR `referenceText` + registers in `customVoices`), browse generated files in the **Workspace Library** tab, and manage `pronunciations` rules without editing YAML.
- **Text-to-speech (`voice_tts`, `voice_list`, `voice_preview`) works with zero config**: Uses Edge neural voices by default (with a keep-alive WebSocket connection pool and transient retry) with zero API keys — discover 300+ live online Edge voices or 45+ all-age/dialect built-ins, apply 10 `persona` presets, export short-video clause/word captions & `.ass` karaoke subtitles (`subtitleGranularity`, `maxCharsPerCue`), use inline `[pause:500ms]` speech tags, apply word-boundary-safe `pronunciations`, embed native MP3 ID3v2 `CHAP`/`CTOC` chapters (`chaptersOutput`), zero-drift reverse-dub `.srt`/`.vtt` timelines (`subtitleInput`), inspect VBR-accurate `durationMs`/`durationSec`, and generate an interactive browser audition page. Switch `ttsEngine` to `siliconflow`, `openai`, or `custom` in Settings when you need emotion `instructions`, Kokoro blending, or zero-shot `referenceAudio` cloning.
- **Speech-to-text (`voice_stt`) supports direct video files & keyless loopback Whisper**:
  - **Recommended**: Open **DSH → Settings → Plugins → Voice (`dsh-voice`)**, pick `asrEngine` (`groq` by default, `openai`, `siliconflow`, or `custom`), and paste `asrApiKey` (masked and **applied live on save without restarting**; when `custom` points to `127.0.0.1` or `localhost`, no key is required). Pass audio or `.mp4`/`.mkv`/`.mov`/`.avi` video files directly;
  - **Custom voice aliases (`customVoices`) & word-boundary pronunciation lexicon (`pronunciations`)**: Save reusable named characters and pronunciation rules (e.g. `Nginx` → `Engine X`, `OS` → `Operating System` without corrupting `POST`) in DSH Settings or Voice Studio (live-reloaded without restarting);
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
    #   - word: OS                      # ASCII word-boundary safe: matches "Mac OS"/"OS系统", never "POST"
    #     alias: Operating System
    #   - word: SQL
    #     alias: S Q L
    # customVoices:
    #   - name: narrator-wang
    #     persona: documentary-narrator
    #     rate: '-5%'
    #   - name: kokoro-blend
    #     voice: 'zf_xiaobei*0.6+zf_xiaoni*0.4'
    #   - name: alex-clone
    #     referenceAudio: voice_clones/clone-alex.webm
    #     referenceText: 'Hello, this is my reference voice sample.'
    asrEngine: groq                       # groq | openai | siliconflow | custom
    asrModel: whisper-large-v3-turbo      # optional; defaults to engine preset
    # asrApiKey: gsk_...                  # prefer DSH Settings or DSH_VOICE_ASR_KEY (optional for loopback custom)
    # proxyUrl: socks5://127.0.0.1:1080   # supports http://, https://, socks5://, socks5h://
```

### Step 2: Keep Scripts, Subtitles, BGM, Reference Clips, Audio/Video & Outputs Inside Your Session Workspace

All `voice_tts` input files (`inputFile`), reverse-dubbing subtitle files (`subtitleInput`, ≤200 cues), podcast background music (`bgmFile`), zero-shot cloning clips (`referenceAudio`, ≤10 MB), input audio/video (`audio`), and generated MP3 / `.txt` / `.srt` / `.vtt` / `.ass` / `chaptersOutput` / `voice_clones/` / `voice_outputs/` / preview files must resolve under the active DSH session workspace (`session.header.cwd`) to protect host files. Copy outside files into the workspace first.

### Step 3: Discover Voices/Personas, Audition, Synthesize or Transcribe, and Review in Workspace Library

Unsure which voice fits best? Call `voice_list({ online: true, locale, gender, tag })` to fetch Microsoft's live 300+ neural voices (cached 24h in memory with automatic fallback to 45+ curated built-ins, plus the 10 built-in `persona` recipes and configured `customVoices`), then call `voice_preview` to render short samples plus an interactive `voice_previews/index.html` page. The plugin ships `skills/voice-workflow/SKILL.md` so your assistant automatically pairs `inputFile`, native MP3 chapters, karaoke `.ass` subtitles, inline `[pause:500ms]` beats, `segments` BGM podcasts, and direct video STT.

---

## Copy-Ready Prompts for Everyday Work

- **Discover online voices & personas and audition via the interactive HTML page**
  > Run `voice_list` with `online: true` for tag `podcast`, then preview a few alongside `late-night-radio` and `anime-boy` in `voice_previews/index.html` so I can pick my favorite.
- **Narrate a multi-heading Markdown book/article with native MP3 chapters & show notes**
  > Synthesize `guide.md` in this workspace using `documentary-narrator` into `guide.mp3` (embedding MP3 chapters), and export `guide.srt` plus chapter timestamps `guide-chapters.md`.
- **Export vertical short-video clause captions & karaoke `.ass` with inline pauses**
  > Read this short-video script with `energetic-anchor` (keep `[pause:500ms]` pauses, set `subtitleGranularity: "clause"` and `maxCharsPerCue: 14`), and save `clip.mp3` plus karaoke `clip.ass` for `dsh-ffmpeg` burn-in.
- **Create a chaptered, loudness-balanced two-host podcast MP3 with BGM auto-ducking**
  > Turn this release note into a chaptered two-host podcast (`title` on each segment) using `podcast-host-female` and `podcast-host-male`, mix `assets/bgm.mp3` with `bgmDucking: true` and `normalizeLoudness: true`, saving `episode.mp3`, `episode.srt`, and `episode-chapters.md`.
- **Zero-drift reverse-dub an existing `.srt`/`.vtt` timeline with word-boundary pronunciations**
  > Dub `video.srt` in this workspace using `bilingual-tech-male`, pronouncing `OS` as `Operating System` and `Nginx` as `Engine X` (protecting words like `POST` and keeping original spelling in subtitles), save `dubbed.mp3` and `dubbed.srt`, and report exact `durationSec`.
- **Emotion-directed acting or 5–10s zero-shot voice cloning (or 8s mic clone in Voice Studio)**
  > Use `ref.wav` (transcript: "Hello, what a great day to start!") in this workspace for zero-shot cloning with cheerful acting `instructions` and inline `[laughter]`, saving `greeting.mp3`.
- **Transcribe a `.mp4` video or large recording directly with speaker diarization & subtitles**
  > Transcribe `lecture.mp4` directly in this workspace with `diarize: true` (prompt hint: DeepSeek Harness, Cordis), and save `lecture.txt` and `lecture.srt`.
- **Scoped offline configuration self-check**
  > Run a voice health check to verify `ttsReady`, `sttReady`, voice/persona/alias status, prosody settings, proxy, and ASR key status.

---

## Quick Troubleshooting Checklist

Run `voice_health` first (offline check with zero network traffic; supports `scope: "tts" | "stt" | "all"` and reports `ttsReady` and `sttReady` separately):

| Symptom | Usual Cause | Quick Fix |
| :--- | :--- | :--- |
| Health check says `asrApiKey` is missing | `asrApiKey` and `DSH_VOICE_ASR_KEY` are both empty | Safe to ignore if you only need TTS (`ttsReady` is `true`), or pass `scope: "tts"`; for local Whisper, set `asrEngine: custom` with `127.0.0.1`/`localhost` (no key needed) |
| `referenceAudio` fails saying cloning engine is required | `ttsEngine` is still `edge` (Edge does not support zero-shot reference cloning) | Switch `ttsEngine` to `siliconflow` (`CosyVoice2-0.5B`) or `custom` (e.g. local GPT-SoVITS / IndexTTS) in **DSH Settings → Plugins → Voice** |
| Direct video STT, `normalizeLoudness`, `bgmFile`, or dense `atempo` fit says `ffmpeg` is missing | Video stream stripping (`-vn`), `-16 LUFS` loudness mastering, `sidechaincompress` BGM ducking, and `atempo` window fitting require local `ffmpeg` | Install `ffmpeg` locally (or pre-process with `dsh-ffmpeg`), or pass plain audio / omit BGM & loudness flags |
| Invalid voice ID, rate, or pitch error | `ttsVoice` is not a valid Edge ID, built-in `persona`, or `customVoices` alias, or `ttsRate`/`ttsPitch` format is invalid | Run `voice_list` to pick a valid ID or persona, and fix `ttsVoice` / `ttsRate` / `ttsPitch` in Settings |
| Network error on TTS or STT | Direct connection blocked by corporate network | Enter `proxyUrl` (`http://`, `https://`, `socks5://`, or `socks5h://`) in **DSH Settings → Plugins → Voice** (applies live) |
| Path outside session workspace error | Script, subtitle, BGM, reference clip, video/audio, or output resolves outside workspace | Copy the file into the current session workspace folder first |
| Audio exceeds 25 MB limit | Standard Whisper / ASR multipart cap is 25 MB | Pass `autoCompress: true` to `voice_stt` (video files auto-extract 16kHz mono via local `ffmpeg`; large audio compresses/segments automatically) or pre-process with `dsh-ffmpeg` |
| ASR or TTS refuses a 3xx redirect | Redirects are blocked so audio/keys never leak to another host | Set `asrBaseUrl` / `ttsBaseUrl` directly to the final non-redirecting `/v1` endpoint |
| Existing output file was not overwritten | `overwrite: false` (default) suffixes `_1`, `_2` safely | Use the exact path returned by the tool, or enable `overwrite` in Settings |

---

## Tool & Voice Studio Reference

### Registered Tools (All 5)

| Tool | Purpose | Key Parameters & Notes |
| :--- | :--- | :--- |
| `voice_tts` | Synthesize MP3, chapters & subtitles from text, files, timelines, or dialogues | Supports `text` (with inline `[pause:500ms]`/`[break:600ms]`/`[停顿0.6s]`), `inputFile` (≤100k chars auto-chunked; multi-heading `.md` embeds native MP3 ID3v2 `CHAP`/`CTOC` chapters), `cleanMarkdown` (default `true` for `.md`), `subtitleInput` (`.srt`/`.vtt` reverse dubbing, ≤200 cues, auto rate-scale + FFmpeg `atempo` zero-drift fit), `segments` (≤50 turns, per-turn `title`/`voice`/`persona`/`rate`/`pitch`/`pauseMs`/`instructions`/`referenceAudio`/`referenceText`), `pronunciations` (word-boundary safe), `subtitleOutput` (`.srt`/`.vtt`/`.ass` karaoke), `subtitleGranularity` (`sentence`/`clause`/`word`), `maxCharsPerCue` (`4–80`, default `16`), `chaptersOutput` (`.md`/`.txt` timestamps or `.json`), `bgmFile` / `bgmVolume` / `bgmDucking`, `normalizeLoudness` (`-16 LUFS`), `persona`, `instructions`, `referenceAudio` (≤10 MB), `referenceText`, `voice`, `rate`, `pitch`, `output`; returns VBR-accurate `durationMs`, `durationSec`, and optional `chapters` / `chaptersFile` |
| `voice_stt` | Transcribe audio & video containers to text & subtitles | `audio` required (accepts audio plus `.mp4`/`.mkv`/`.mov`/`.avi` video containers, automatically stripping `-vn` into 16kHz mono via local `ffmpeg`); supports `diarize` (`true` enables FFmpeg stereo split or `[Speaker]` turn diarization with `speakers`), `autoCompress` (uses local `ffmpeg` for >25 MB), `timestamps`, `subtitleOutput` (`.srt`/`.vtt`), `model`, `language`, `prompt`, `output`, `engine` (`groq`/`openai`/`siliconflow`/`custom`) |
| `voice_list` | Discover online/built-in voices, personas & custom aliases | Optional `online` (`true` fetches & caches 300+ live Microsoft Edge voices for 24h, falling back to 45+ curated built-ins), `locale`, `gender` (`Female`/`Male`), `tag` (e.g. `podcast`, `multilingual`, `dialect`, `child`, `teen`, `mature`, `elder`, `anime`, `documentary`), `includePersonas` (default `true`) |
| `voice_preview` | Bounded-concurrency (≤3) batch previews + HTML page | Optional `voices` (≤8; accepts raw voice IDs, built-in `persona` IDs/labels, or `customVoices` aliases), `text` (≤200 chars), `outputDir`, `htmlIndex` (default `true`, writes `voice_previews/index.html`) |
| `voice_health` | Offline configuration self-check | Optional `scope` (`all`/`tts`/`stt`), reports `ttsReady` / `sttReady` across engines, voice/persona/`customVoices` aliases, prosody, proxy, and keys |

### `0.10.0` True Creative Loop, Karaoke Subtitles, MP3 Chapters & Pro Audio Upgrades

1. **Short-Video Word/Clause Subtitles & Karaoke `.ass` Export**:
   - `voice_tts` adds `subtitleGranularity` (`"sentence"` default | `"clause"` compact short-video phrases | `"word"` per-word cues) and `maxCharsPerCue` (default `16`, counting CJK/fullwidth as `1` and ASCII as `0.5`, splitting at clause punctuation or `≥350ms` silence gaps);
   - `subtitleOutput: "clip.ass"` outputs `1080x1920` SubStation Alpha (`v4.00+`) files with genuine `{\kf<cs>}` word-by-word karaoke highlight timing ready for `dsh-ffmpeg` burn-in.
2. **Inline Speech Pause Tags & Word-Boundary-Safe Pronunciation Lexicon**:
   - Embed `[pause:500ms]`, `[break:600ms]`, or `[停顿0.6s]` (`50–10000ms`) directly in scripts — synthesized across Edge (reusing the keep-alive WSS pool) and OpenAI/SiliconFlow/custom engines with matched-sample-rate MP3 silence frames, and automatically stripped from `.srt`/`.vtt`/`.ass` subtitles;
   - `pronunciations` enforces ASCII word boundaries on alphanumeric terms (`OS`, `UI`, `SQL`, `AI`) so `"Mac OS"` and `"OS系统"` match cleanly while substrings inside `"POST"`, `"HOST"`, or `"BUILD"` are never corrupted.
3. **Audiobook & Podcast Chapters (Native MP3 ID3v2.3 `CHAP`/`CTOC` + `chaptersOutput`)**:
   - Multi-heading Markdown (`#` / `##` / `###`, ignoring `#` inside fenced code blocks, with 350ms inter-chapter breathing room) in `inputFile` or `title` on `segments[]` embeds native clickable ID3v2.3 `CTOC` + `CHAP` bookmarks directly into the MP3 (preserving exact `inspectMp3Buffer` duration measurement);
   - Optional `chaptersOutput` (`"chapters.md"` / `"chapters.txt"` or `"chapters.json"`) writes `MM:SS Title` show-notes timestamps or structured JSON alongside the audio.
4. **Direct Video Container Transcription in `voice_stt`**:
   - Passing `.mp4`, `.mkv`, `.mov`, or `.avi` (plus `.flv`/`.wmv`/`.m4v`/`.ts`/`.mts`) directly to `voice_stt` automatically strips the video stream (`-vn`) into lightweight 16kHz mono audio via local `ffmpeg` before uploading to ASR — even when the video file is under 25 MB (browser mic `.webm` clips still upload directly without requiring `ffmpeg`).
5. **Zero-Drift `.srt` Dubbing (`atempo`), VBR Concatenation Fix & Edge Keep-Alive WSS Pool**:
   - `subtitleInput` follows rate-scaled re-synthesis with pitch-preserving FFmpeg `atempo` window fitting whenever a dense cue still exceeds its window by `>3%`, eliminating cumulative timeline drift;
   - `concatMp3Buffers` strips leading/trailing ID3 tags and per-segment `Xing`/`Info`/`VBRI` metadata frames on multi-segment VBR MP3 concatenation so player seekbars and `durationSec` reflect the full episode;
   - Edge TTS reuses a proxy-keyed keep-alive WebSocket connection pool (with unref'd idle timers) and retries transient network drops automatically.
6. **Voice Studio Workbench "True Creative Loop" (5 Tabs)**:
   - **8-Second Mic Direct-to-Clone Creator** (**Mic & Custom Voices** tab): Record 5–10s in the browser to save under `voice_clones/`, auto-transcribe `referenceText` via ASR, and register in `customVoices` in 1 click;
   - **Visual Multi-Speaker Dialogue Composer** (**Studio** tab): Add/edit speaker turns, optionally save `.mp3` + `.srt` to `voice_outputs/`, and synthesize & play multi-host dialogues directly inside the sidebar;
   - **5th "Workspace Library" Tab & Click-to-Seek Subtitle Player**: Browse workspace audio + paired `.srt`/`.vtt` files, download MP3s in 1 click, and click any highlighted cue in the player bar to seek immediately.

### `0.8.0`–`0.9.0` Voice Studio & Diversity Foundation

1. **5 Synced Themes & Coachmark Tour**: Live theme switching across **Native Airy / Warm Cream / Claude Warmth / Bright 8-Bit / Airy Mint** with spotlight onboarding.
2. **300+ Live Edge Voices, 45+ All-Age/Dialect Built-ins & 10 `persona` Presets**:
   - `voice_list({ online: true })` caches Microsoft's 300+ neural voices for 24h with offline fallback (`source: "builtin-fallback"`) to 51 live-verified Edge voices across child/story (`XiaoyiNeural`/`en-US-AnaNeural`), teen/anime (`YunxiaNeural`), mature/documentary/elder (`YunjianNeural`/`YunyangNeural`/`en-US-RogerNeural`), multilingual (`en-US-AvaMultilingualNeural`/`AndrewMultilingualNeural`), and Chinese dialects (Northeast, Shaanxi, Cantonese, Taiwanese);
   - 10 ready-made `persona` presets: `late-night-radio`, `podcast-host-female`, `podcast-host-male`, `documentary-narrator`, `bedtime-story`, `anime-boy`, `energetic-anchor`, `news-briefing`, `bilingual-tech-female`, `bilingual-tech-male`.
3. **Podcast BGM Auto-Ducking (`bgmFile`), `-16 LUFS` Mastering, Emotion `instructions` & SHA-256 Cached Cloning**:
   - `bgmFile` ducks music under speech via FFmpeg `sidechaincompress` with end fade-out and optional `-16 LUFS` loudness normalization (`normalizeLoudness: true`);
   - `instructions` passes natively to `gpt-4o-mini-tts` or formats `<|endofprompt|>` on CosyVoice2 (with `[laughter]`/`[breath]`), plus Kokoro voice blending (`zf_xiaobei*0.6+zf_xiaoni*0.4`); SiliconFlow caches uploaded `referenceAudio` `speech:...` URIs by SHA-256 hash across segments.
4. **Speaker Diarization (`diarize: true`)**: Splits stereo channels via `ffmpeg` or infers speaker turns from `verbose_json` to emit `[说话人 A]` paragraphs, `speakers` list, and speaker-prefixed `.srt`/`.vtt` cues.

### Engine Presets & Workspace Guardrails

- **Engine presets**:
  - `asrEngine`: `groq` (`whisper-large-v3-turbo`), `openai` (`whisper-1`), `siliconflow` (`FunAudioLLM/SenseVoiceSmall`), `custom` (keyless when targeting loopback `127.0.0.1` / `localhost`).
  - `ttsEngine`: `edge` (zero-key default), `openai` (`gpt-4o-mini-tts`), `siliconflow` (`FunAudioLLM/CosyVoice2-0.5B`), `custom` (OpenAI `/audio/speech`-compatible endpoint).
- **Workspace confinement & symlink protection**: All reads and writes (`inputFile`, `referenceAudio`, `audio`, `chaptersOutput`, Studio `voice_clones`/`voice_outputs`, and all outputs) stay under `session.header.cwd`, symlinks are never written through, new files use `O_EXCL`, and `.txt`/subtitle outputs use `0600` permissions on POSIX.
- **Pinned endpoint & redirect block**: Requests only go to the configured endpoint, mismatched `engine` overrides are rejected, `3xx` redirects abort immediately, and Studio HTTP endpoints enforce `X-DSH-VOICE: 1`, same-origin guards, and secret masking.
- **Live timeouts & instant cancellation**: `timeoutMs`, `pronunciations`, and `customVoices` update dynamically on config save; `voice_tts`, `voice_preview`, `voice_list`, and `voice_stt` propagate `exec.signal` to close WebSockets and abort extraction/compression/uploads immediately on cancel.

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
