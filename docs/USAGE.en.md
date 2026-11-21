# dsh-voice Usage Guide

[Overview](../README.en.md) · [Changelog](../CHANGELOG.md) · [Validation](VALIDATION.md)

## Get Started in 3 Steps

### Step 1: Know What Works Out of the Box (Wish-Driven Chat-First) & Optional Setup

- **Wish-Driven chat-first TTS & preferences (`voice_tts`, `voice_preview`, `voice_list`, `voice_prefs`) work with zero keys**: Uses Edge neural voices by default (with a keep-alive WebSocket connection pool and transient retry) — fulfill high-level wishes in 1–2 tool calls using **6 high-level `scene` presets (`podcast` / `short-video` / `audiobook` / `briefing` / `story` / `dubbing` plus Chinese aliases)**, **fuzzy natural-language style & dialect matching** (`"深夜"`, `"纪录片"`, `"播客女"`, `"粤语男声"`, `"东北话"`, etc.), **automatic `targetDurationSec` duration fitting (`3–3600s`)**, **built-in word-boundary-safe `autoPronunciations` tech lexicon** (enabled by default), **self-contained HTML5 interactive player (`createPlayer` / `playerOutput` → `<stem>.player.html`)**, **curated scene auditions (`voice_preview({ scene })`)**, and **conversational preference memory (`voice_prefs`)**. Includes **51 live-verified built-in Edge voices**, 300+ live online Edge voices, and 10 live-verified `persona` presets. Switch `ttsEngine` to `siliconflow`, `openai`, or `custom` in Settings when you need emotion `instructions`, Kokoro blending, or zero-shot `referenceAudio` cloning.
- **Optional 5-theme Voice Studio sidebar workbench**: Open Voice Studio in the DSH sidebar on demand when you want **8-second browser mic 1-click clone creation** (`voice_clones/` + auto-ASR `referenceText` + `customVoices` registration), visual multi-speaker dialogue authoring, or the **Workspace Library** click-to-seek subtitle player across 5 synced themes (**Native Airy / Warm Cream / Claude Warmth / Bright 8-Bit / Airy Mint**) with Coachmark onboarding.
- **Speech-to-text (`voice_stt`) supports direct video files & keyless loopback Whisper**:
  - **Recommended**: Open **DSH → Settings → Plugins → Voice (`dsh-voice`)**, pick `asrEngine` (`groq` by default, `openai`, `siliconflow`, or `custom`), and paste `asrApiKey` (masked and **applied live on save without restarting**; when `custom` points to `127.0.0.1` or `localhost`, no key is required). Pass audio or `.mp4`/`.mkv`/`.mov`/`.avi` video files directly;
  - **Custom voice aliases (`customVoices`) & pronunciation lexicon (`pronunciations`)**: Manage directly from chat via `voice_prefs` (*"Default to documentary voice / remember Cordis as 科迪斯"*) or via DSH Settings / Voice Studio (live-reloaded without restarting);
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
    #   - word: Nginx                     # built-in tech lexicon covers common terms by default; override or extend here
    #     alias: Engine X
    #   - word: OS                        # ASCII word-boundary safe: matches "Mac OS"/"OS系统", never "POST"
    #     alias: Operating System
    #   - word: Cordis
    #     alias: Cor-dis
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

All `voice_tts` input files (`inputFile`), reverse-dubbing subtitle files (`subtitleInput`, ≤200 cues), podcast background music (`bgmFile`), zero-shot cloning clips (`referenceAudio`, ≤10 MB — including paths registered via `voice_prefs`), input audio/video (`audio`), and generated MP3 / `.txt` / `.srt` / `.vtt` / `.ass` / `chaptersOutput` / `.player.html` / `voice_clones/` / `voice_outputs/` / preview files must resolve under the active DSH session workspace (`session.header.cwd`) to protect host files. Copy outside files into the workspace first.

### Step 3: Fulfill Wishes in 1–2 Calls, Refine Naturally, or Save Defaults via Chat

Unsure which voice fits best? Ask for an audition by scene or style (*"Pick a few podcast / dialect / late-night radio voices"*): `voice_preview({ scene })` curates 3–4 contrasting live voices/personas and writes `voice_previews/index.html` in one call. For targeted catalog browsing, call `voice_list({ online: true, locale, gender, tag })` (24h cached 300+ online voices with fallback to 51 live-verified built-ins; chat output collapses >60 voices to the top 40 + locale summary while preserving the full structured list). The bundled Wish-Driven `skills/voice-workflow/SKILL.md` guides the assistant to combine `scene`, fuzzy styles, `targetDurationSec`, `createPlayer`, and `voice_prefs` seamlessly.

---

## Copy-Ready Wish-Driven Prompts

- **Curate & audition voices by scene in one call**
  > Pick a few voices for a podcast (or dialect / late-night radio / short-video) and generate `voice_previews/index.html` so I can compare them.
- **Narrate a multi-heading Markdown book/article with native MP3 chapters & interactive HTML5 player**
  > Turn `guide.md` in this workspace into a documentary-style audiobook (`guide.mp3` with embedded MP3 chapters), plus `guide.srt`, `guide-chapters.md`, and a clickable `guide.player.html`.
- **Export a ≤30s vertical short-video voiceover & karaoke `.ass` with inline pauses**
  > Read this short-video script in `short-video` style (keep `[pause:500ms]` beats and fit strictly within 30 seconds), saving `clip.mp3` and karaoke `clip.ass` for `dsh-ffmpeg` burn-in.
- **Create a chaptered, loudness-balanced two-host podcast MP3 with BGM auto-ducking & player**
  > Turn this release note into a chaptered two-host podcast using bilingual female & male hosts, mix `assets/bgm.mp3` with auto-ducking and loudness normalization, and save `episode.mp3`, `episode.srt`, `episode-chapters.md`, and an interactive player.
- **Remember preferences directly from chat (`voice_prefs`)**
  > Default to the documentary voice at `-5%` rate from now on, remember to pronounce `Cordis` as `Cor-dis`, and save `ref.wav` as a custom voice named `narrator-wang`.
- **Zero-drift reverse-dub an existing `.srt`/`.vtt` timeline with word-boundary pronunciations**
  > Dub `video.srt` in `dubbing` mode (keep tech acronyms like `OS`, `Nginx`, and `SQL` natural without affecting `POST`, preserving original spelling in subtitles), save `dubbed.mp3` and `dubbed.srt`, and report exact `durationSec`.
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
| Podcast loudness mastering shows a `warnings` note, or video STT / `bgmFile` / `atempo` says `ffmpeg` is missing | `-16 LUFS` loudness mastering, video stream stripping (`-vn`), BGM ducking, and `atempo` fitting require local `ffmpeg` | `normalizeLoudness` degrades gracefully with `warnings` and still delivers the clean MP3; install local `ffmpeg` (or use `dsh-ffmpeg`) to enable full audio/video post-processing |
| `voice_prefs` reports settings cannot be persisted | Host is in read-only mode (`settings.writable === false`) or host settings service is unavailable | Edit preferences manually in **DSH Settings → Plugins → Voice**, or pass parameters directly per `voice_tts` call |
| Invalid voice ID, rate, or pitch error | Value does not match a valid Edge ID, built-in `persona`, fuzzy style keyword, or `customVoices` alias, or `rate`/`pitch` format is invalid | Pass a fuzzy style keyword (e.g. `"深夜"`, `"纪录片"`, `"粤语男声"`) or run `voice_list` to pick a valid ID and fix prosody format |
| Network error on TTS or STT | Direct connection blocked by corporate network | Enter `proxyUrl` (`http://`, `https://`, `socks5://`, or `socks5h://`) in **DSH Settings → Plugins → Voice** (applies live) |
| Path outside session workspace error | Script, subtitle, BGM, reference clip (including `voice_prefs`), video/audio, or output resolves outside workspace | Copy the file into the current session workspace folder first |
| Audio exceeds 25 MB limit | Standard Whisper / ASR multipart cap is 25 MB | Pass `autoCompress: true` to `voice_stt` (video files auto-extract 16kHz mono via local `ffmpeg`; large audio compresses/segments automatically) or pre-process with `dsh-ffmpeg` |
| ASR or TTS refuses a 3xx redirect | Redirects are blocked so audio/keys never leak to another host | Set `asrBaseUrl` / `ttsBaseUrl` directly to the final non-redirecting `/v1` endpoint |
| Existing output file was not overwritten | `overwrite: false` (default) suffixes `_1`, `_2` safely | Use the exact path returned by the tool, or enable `overwrite` in Settings |

---

## Tool & Voice Studio Reference

### Registered Tools (All 6)

| Tool | Purpose | Key Parameters & Notes |
| :--- | :--- | :--- |
| `voice_tts` | Wish-driven synthesis for MP3s, chapters, subtitles & interactive HTML5 players | Supports `scene` (`podcast`/`short-video`/`audiobook`/`briefing`/`story`/`dubbing` + Chinese aliases), fuzzy style/dialect `voice`/`persona` (e.g. `"深夜"`, `"纪录片"`, `"粤语男声"`), `targetDurationSec` (`3–3600s`; auto rate-calibrated retry if >105%, FFmpeg `atempo` if still >103%, returning `durationAdjusted`), `autoPronunciations` (default `true`, built-in word-boundary-safe tech lexicon), `createPlayer` / `playerOutput` (writes self-contained `<stem>.player.html` and returns `playerFile`), `text` (with inline `[pause:500ms]`/`[停顿0.6s]`), `inputFile` (≤100k chars auto-chunked; multi-heading `.md` embeds native MP3 ID3v2 `CHAP`/`CTOC` chapters), `cleanMarkdown`, `subtitleInput` (`.srt`/`.vtt` zero-drift reverse dubbing), `segments` (≤50 turns, per-turn `title`/`voice`/`persona`/`rate`/`pitch`/`pauseMs`/`instructions`/`referenceAudio`/`referenceText`), `pronunciations`, `subtitleOutput` (`.srt`/`.vtt`/`.ass` karaoke), `subtitleGranularity` (`sentence`/`clause`/`word`), `maxCharsPerCue` (`4–80`, default `16`, `short-video` default `14`), `chaptersOutput` (`.md`/`.txt`/`.json`), `bgmFile`/`bgmVolume`/`bgmDucking`, `normalizeLoudness` (degrades gracefully with `warnings` when `ffmpeg` is absent), `instructions`, `referenceAudio`/`referenceText`, `rate`/`pitch`, `output`; returns VBR-accurate `durationMs`, `durationSec`, and optional `chapters`/`chaptersFile`/`playerFile`/`warnings` |
| `voice_stt` | Transcribe audio & video containers to text & subtitles | `audio` required (accepts audio plus `.mp4`/`.mkv`/`.mov`/`.avi` video containers, automatically stripping `-vn` into 16kHz mono via local `ffmpeg`); supports `diarize` (`true` enables FFmpeg stereo split or `[Speaker]` turn diarization with `speakers`), `autoCompress` (uses local `ffmpeg` for >25 MB), `timestamps`, `subtitleOutput` (`.srt`/`.vtt`/`.ass`), `model`, `language`, `prompt`, `output`, `engine` (`groq`/`openai`/`siliconflow`/`custom`) |
| `voice_list` | Discover online/built-in voices, personas & custom aliases | Optional `online` (`true` fetches & caches 300+ live Microsoft Edge voices for 24h, falling back to 51 live-verified built-ins; chat rendering collapses >60 voices to top 40 + locale breakdown while keeping full structured `voices`), `locale`, `gender` (`Female`/`Male`), `tag` (e.g. `podcast`, `multilingual`, `dialect`, `child`, `teen`, `mature`, `elder`, `anime`, `documentary`), `includePersonas` (default `true`) |
| `voice_preview` | Curated scene/style or batch auditions (concurrency ≤3) + HTML page | Optional `scene` (auto-curates 3–4 contrasting live voices/personas for `podcast`, `short-video`, `audiobook`, `briefing`, `story`, `dubbing`, `方言`, `双语`, `深夜电台`, etc. when `voices` is omitted), `voices` (≤8; accepts raw voice IDs, 10 built-in personas, fuzzy style keywords, or `customVoices` aliases), `text` (≤200 chars), `outputDir`, `htmlIndex` (default `true`, writes `voice_previews/index.html`) |
| `voice_health` | Offline configuration self-check | Optional `scope` (`all`/`tts`/`stt`), reports `ttsReady` / `sttReady` across engines, voice/persona/`customVoices` aliases, prosody, proxy, and keys |
| `voice_prefs` | Persist creative voice preferences from chat | Required `action` (`get` / `set_default` / `add_pronunciation` / `remove_pronunciation` / `save_custom_voice` / `remove_custom_voice`); optional `voice`, `persona` (fuzzy styles supported), `rate`, `pitch`, `word`, `alias`, `name`, `instructions`, `referenceAudio` (workspace-validated, ≤10 MB), `referenceText`; strictly limited to creative prefs (`ttsVoice`, `ttsRate`, `ttsPitch`, `pronunciations`, `customVoices`) — never reads or modifies credentials, base URLs, proxies, or engines, and honors `settings.writable` |

### `0.11.0` Wish-Driven Chat-First Upgrades

1. **6 High-Level `scene` Presets & Smart Defaults**:
   - `voice_tts` adds `scene` supporting `podcast` (`podcast-host-female`, `normalizeLoudness: true`, `bgmDucking: true`, `podcast.mp3`), `short-video` (`energetic-anchor`, `subtitleGranularity: "clause"`, `maxCharsPerCue: 14`, `short-video.mp3`), `audiobook` (`documentary-narrator`, `cleanMarkdown: true`, `audiobook.mp3`), `briefing` (`news-briefing`, `briefing.mp3`), `story` (`bedtime-story`, `story.mp3`), and `dubbing` (`bilingual-tech-male`, `dubbing.mp3`), plus Chinese aliases. Explicit parameters always override scene defaults.
2. **Fuzzy Natural-Language Style & Dialect Matching (`resolveVoiceWish`)**:
   - Across `voice_tts`, `voice_preview`, and `voice_prefs`, natural phrases resolve in priority order (custom alias → exact persona → valid Edge voice ID → Chinese/English style keywords → dialect/language fallback), e.g. `"深夜"` → `late-night-radio`, `"纪录片"` → `documentary-narrator`, `"粤语男声"` → `zh-HK-WanLungNeural`, `"东北话"` → `zh-CN-liaoning-XiaobeiNeural`, `"双语女"` → `bilingual-tech-female`.
3. **Automatic `targetDurationSec` Fitting & Graceful `normalizeLoudness` Degradation**:
   - Pass `targetDurationSec` (`3–3600s`) on single text, `inputFile`, or `segments`: audio exceeding `targetDurationSec * 1.05` triggers one calibrated rate re-synthesis, followed by pitch-preserving FFmpeg `atempo` if still `> 1.03x`, returning `targetDurationSec` and `durationAdjusted: true`.
   - When local `ffmpeg` is missing, `normalizeLoudness: true` (including `scene: "podcast"` defaults) skips normalization gracefully instead of failing, delivering the clean MP3 alongside actionable `warnings`.
4. **Built-In Word-Boundary-Safe Tech Lexicon (`autoPronunciations`)**:
   - Enabled by default (`autoPronunciations: true`) with conservative ASCII word-boundary rules (`Nginx` → `Engine X`, `SQL` → `S Q L`, `K8s`/`Kubernetes` → `K 8 s`, `CLI` → `C L I`, `GUI` → `G U I`, `OAuth` → `O Auth`, `PostgreSQL` → `Postgres`, `kubectl` → `cube control`, `GraphQL` → `Graph Q L`, `WebSocket` → `Web Socket`), merged beneath Settings and per-call `pronunciations`.
5. **Self-Contained Interactive HTML5 Player (`createPlayer` / `playerOutput`)**:
   - Set `createPlayer: true` (emits `<stem>.player.html` next to the MP3) or specify `playerOutput` to generate a zero-dependency, XSS-escaped interactive HTML5 player with light/dark theme, speed control, MP3 download, chapter navigation, and click-to-seek synchronized subtitles (auto-collecting cues even if `subtitleOutput` was omitted).
6. **Curated Scene Auditions (`voice_preview({ scene })`) & 6th Tool `voice_prefs`**:
   - `voice_preview({ scene })` selects 3–4 contrasting live-verified personas/voices for any scene or style (`"podcast"`, `"short-video"`, `"方言"`, `"双语"`, `"深夜电台"`, etc.) in one call.
   - `voice_prefs` persists default voice/persona/prosody, pronunciation rules, and custom voice aliases live via optional host `settings` injection (preserving `export const inject = ['tools']`), under strict non-credential allowlisting, workspace `referenceAudio` validation, and read-only `settings.writable` guards.

### `0.10.0` True Creative Loop, Karaoke Subtitles, MP3 Chapters & Pro Audio Upgrades

1. **Short-Video Word/Clause Subtitles & Karaoke `.ass` Export**:
   - `voice_tts` supports `subtitleGranularity` (`"sentence"` default | `"clause"` compact short-video phrases | `"word"` per-word cues) and `maxCharsPerCue` (default `16`, counting CJK/fullwidth as `1` and ASCII as `0.5`, splitting at clause punctuation or `≥350ms` silence gaps);
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
6. **Voice Studio Workbench (5 Themes · 5 Tabs)**:
   - **8-Second Mic Direct-to-Clone Creator** (**Mic & Custom Voices** tab): Record 5–10s in the browser to save under `voice_clones/`, auto-transcribe `referenceText` via ASR, and register in `customVoices` in 1 click;
   - **Visual Multi-Speaker Dialogue Composer** (**Studio** tab): Add/edit speaker turns, optionally save `.mp3` + `.srt` to `voice_outputs/`, and synthesize & play multi-host dialogues directly inside the sidebar;
   - **5th "Workspace Library" Tab & Click-to-Seek Subtitle Player**: Browse workspace audio + paired `.srt`/`.vtt` files, download MP3s in 1 click, and click any highlighted cue in the player bar to seek immediately.

### `0.8.0`–`0.9.0` Voice Studio & Diversity Foundation

1. **5 Synced Themes & Coachmark Tour**: Live theme switching across **Native Airy / Warm Cream / Claude Warmth / Bright 8-Bit / Airy Mint** with spotlight onboarding.
2. **300+ Live Edge Voices, 51 Live-Verified All-Age/Dialect Built-ins & 10 `persona` Presets**:
   - `voice_list({ online: true })` caches Microsoft's 300+ neural voices for 24h with offline fallback (`source: "builtin-fallback"`) to 51 live-verified Edge voices across child/story (`XiaoyiNeural`/`en-US-AnaNeural`), teen/anime (`YunxiaNeural`), mature/documentary/elder (`YunjianNeural`/`YunyangNeural`/`en-US-RogerNeural`), multilingual (`en-US-AvaMultilingualNeural`/`en-US-BrianMultilingualNeural`), and Chinese dialects (Northeast, Shaanxi, Cantonese, Taiwanese);
   - 10 ready-made `persona` presets: `late-night-radio`, `podcast-host-female`, `podcast-host-male`, `documentary-narrator`, `bedtime-story`, `anime-boy`, `energetic-anchor`, `news-briefing`, `bilingual-tech-female`, `bilingual-tech-male`.
3. **Podcast BGM Auto-Ducking (`bgmFile`), `-16 LUFS` Mastering, Emotion `instructions` & SHA-256 Cached Cloning**:
   - `bgmFile` ducks music under speech via FFmpeg `sidechaincompress` with end fade-out and optional `-16 LUFS` loudness normalization (`normalizeLoudness: true`);
   - `instructions` passes natively to `gpt-4o-mini-tts` or formats `<|endofprompt|>` on CosyVoice2 (with `[laughter]`/`[breath]`), plus Kokoro voice blending (`zf_xiaobei*0.6+zf_xiaoni*0.4`); SiliconFlow scopes and caches uploaded `referenceAudio` `speech:...` URIs per account by SHA-256 hash across segments.
4. **Speaker Diarization (`diarize: true`)**: Splits stereo channels via `ffmpeg` or infers speaker turns from `verbose_json` to emit `[说话人 A]` paragraphs, `speakers` list, and speaker-prefixed `.srt`/`.vtt` cues.

### Engine Presets & Workspace Guardrails

- **Engine presets**:
  - `asrEngine`: `groq` (`whisper-large-v3-turbo`), `openai` (`whisper-1`), `siliconflow` (`FunAudioLLM/SenseVoiceSmall`), `custom` (keyless when targeting loopback `127.0.0.1` / `localhost`).
  - `ttsEngine`: `edge` (zero-key default), `openai` (`gpt-4o-mini-tts`), `siliconflow` (`FunAudioLLM/CosyVoice2-0.5B`), `custom` (OpenAI `/audio/speech`-compatible endpoint).
- **Workspace confinement & symlink protection**: All reads and writes (`inputFile`, `referenceAudio`, `audio`, `chaptersOutput`, `playerOutput`, `voice_prefs` clone paths, Studio `voice_clones`/`voice_outputs`, and all outputs) stay under `session.header.cwd`, symlinks are never written through, new files use `O_EXCL`, and `.txt`/subtitle outputs use `0600` permissions on POSIX.
- **Pinned endpoint, non-credential preference allowlist & redirect block**: Requests only go to the configured endpoint, mismatched `engine` overrides are rejected, `3xx` redirects abort immediately, `voice_prefs` enforces a strict non-credential allowlist and read-only checks, interactive player HTML/JSON escapes all strings against XSS, and Studio HTTP endpoints enforce `X-DSH-VOICE: 1`, same-origin guards, and secret masking.
- **Live timeouts & instant cancellation**: `timeoutMs`, `pronunciations`, and `customVoices` update dynamically on config save; `voice_tts`, `voice_preview`, `voice_list`, `voice_stt`, and `voice_prefs` propagate `exec.signal` to close WebSockets and abort extraction/compression/uploads immediately on cancel.

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
