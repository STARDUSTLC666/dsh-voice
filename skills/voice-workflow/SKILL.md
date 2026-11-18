---
name: voice-workflow
description: Best-practice workflows for dsh-voice: 5-theme Voice Studio creative-loop workbench (8s mic clone, visual dialogue synth, workspace library & click-to-seek subtitle player), 300+ online Edge voices with keep-alive WSS pool, 10 personas, short-video clause/word subtitles & karaoke .ass export (subtitleGranularity/maxCharsPerCue), inline [pause:500ms] tags, word-boundary pronunciation lexicon (pronunciations), MP3 ID3v2 CHAP/CTOC audiobook/podcast chapters (chaptersOutput), zero-drift atempo .srt/.vtt dubbing (subtitleInput), VBR-safe durationMs/durationSec, podcast BGM auto-ducking & -16 LUFS mastering, SiliconFlow SHA-256 cached cloning, direct video (.mp4/.mkv/.mov/.avi) STT, and speaker diarization (diarize). Load when synthesizing speech/subtitles, dubbing timelines, building chaptered podcasts/audiobooks, cloning voices, or transcribing audio/video.
---

# Voice Workflow (`dsh-voice`)

Use this guide when converting articles, notes, briefings, or subtitle timelines into audio, chapters, or karaoke subtitles, auditioning voices/personas, cloning reference voices, mixing podcast BGM, or transcribing audio and video recordings inside the active session workspace.

## 1. Native Voice Studio Workbench ("True Creative Loop"), Discovery & Auditions

- **5-theme Voice Studio sidebar workbench & creative loop**:
  - Open the native DSH sidebar workbench (5 themes: 原生清透 / 米白纸感 / Claude 暖书卷 / 8-Bit 像素 / 晴空薄荷 + interactive Coachmark tour) to:
    1. Audition 300+ Edge voices and 10 personas (`0.8x–1.5x` speed + live duration badge) with an **interactive click-to-seek synchronized subtitle follow-along player** and 1-click MP3 download;
    2. Compose and synthesize multi-speaker dialogues visually in-panel (optionally saving `.mp3` + `.srt` to `voice_outputs/`);
    3. Record **8 seconds on the browser mic to create a cloned voice in 1 click** (saves to `voice_clones/`, auto-transcribes `referenceText` via ASR, and registers in `customVoices`);
    4. Browse and play generated workspace audio + paired `.srt`/`.vtt` subtitles in the **Workspace Library** tab, and manage `pronunciations` visually.
- **Online 300+ Edge voice catalog, keep-alive WSS pool & 45+ curated built-ins**:
  - Call `voice_list({ online: true, locale, gender, tag })` to fetch and cache (24h in-memory) Microsoft's live 300+ neural voice catalog, with automatic offline fallback (`source: "builtin-fallback"`) to 45+ curated voices across child (`zh-CN-XiaoshuangNeural`, `zh-CN-XiaoyouNeural`), teen/anime (`zh-CN-YunxiaNeural`), mature/documentary (`zh-CN-YunzeNeural`, `zh-CN-XiaoqiuNeural`), elder (`zh-CN-XiaoruiNeural`), passionate (`zh-CN-YunhaoNeural`), and dialects (Northeast `zh-CN-liaoning-XiaobeiNeural`, Shaanxi `zh-CN-shaanxi-XiaoniNeural`, Sichuan `zh-CN-sichuan-YunxiNeural`, Henan `zh-CN-henan-YundengNeural`, Shandong `zh-CN-shandong-YunxiangNeural`, Cantonese `zh-HK-WanLungNeural` / `zh-HK-HiuMaanNeural`, Taiwanese `zh-TW-YunJheNeural` / `zh-TW-HsiaoChenNeural` / `zh-TW-HsiaoYuNeural`).
  - Edge TTS automatically reuses a keep-alive WebSocket connection pool across multi-chunk articles and podcast turns with transient network retry.
  - `voice_list` also returns `personas` (unless `includePersonas: false`) and configured `customVoices` aliases.
- **10 ready-made personas (`persona`)**:
  - Use `persona` in `voice_tts`, `segments[]`, or `voice_preview` for instant character tuning (`voice`, `rate`, `pitch`, `pauseMs`):
    `late-night-radio`, `podcast-host-female`, `podcast-host-male`, `documentary-narrator`, `bedtime-story`, `anime-boy`, `energetic-anchor`, `news-briefing`, `bilingual-tech-female`, `bilingual-tech-male`.
- **Interactive audition page**:
  - Call `voice_preview({ voices: [...], text })` with raw voice IDs, `persona` IDs/labels, or `customVoices` aliases to generate MP3 samples and `voice_previews/index.html`.

## 2. Direct File Synthesis, Inline Pauses, Word-Boundary Lexicon & Chapters

- **Do not copy large `.md` or `.txt` files into `text` arguments.** Pass `inputFile` directly to `voice_tts`:
  ```json
  {
    "inputFile": "docs/article.md",
    "persona": "documentary-narrator",
    "pronunciations": [
      { "word": "Nginx", "alias": "Engine X" },
      { "word": "OS", "alias": "Operating System" }
    ],
    "output": "article.mp3",
    "subtitleOutput": "article.srt",
    "chaptersOutput": "article-chapters.md"
  }
  ```
- **Inline speech pause tags (`[pause:500ms]`, `[break:600ms]`, `[停顿0.6s]`)**:
  - Embed `[pause:500ms]`, `[break:600ms]`, or `[停顿0.6s]` (`50ms–10s`) anywhere inside `text`, `inputFile`, or `segments[]`.
  - Compiled to native SSML `<break time="...ms"/>` on Edge TTS and matched-sample-rate MP3 silence frames on OpenAI/SiliconFlow/custom engines, while automatically stripped from exported `.srt`/`.vtt`/`.ass` subtitles.
- **Word-boundary-safe pronunciation lexicon (`pronunciations`)**:
  - Pass `pronunciations` as `[{ word, alias }]` (or `{ "Nginx": "Engine X" }`) on `voice_tts`, or save persistent rules in DSH Settings `pronunciations` (per-call overrides same-word Settings rules).
  - ASCII acronyms/words (`OS`, `UI`, `SQL`, `Nginx`) enforce word boundaries so `OS` matches `"Mac OS"` and `"OS系统"` while **never** corrupting substrings inside words like `"POST"` or `"BUILD"`.
  - On Edge TTS, rules compile to SSML `<sub alias="...">` so subtitles keep original spelling (`Nginx`) while speech pronounces the alias (`Engine X`). Non-Edge engines apply longest-first non-recursive replacement on spoken text while keeping original spelling in fallback subtitles.
- **Audiobook & Markdown chapters (native MP3 ID3v2 `CHAP`/`CTOC` + `chaptersOutput`)**:
  - Multi-heading Markdown (`#` / `##` / `###`, ignoring code-block comments) in `inputFile` (or `title` on `segments[]`) automatically embeds native clickable ID3v2.3 `CHAP`/`CTOC` chapter bookmarks into the MP3, returns `chapters: [{ title, startMs, endMs }]`, and optionally writes `MM:SS` show-notes timestamps (`chapters.md` / `.txt`) or structured JSON (`chapters.json`) via `chaptersOutput`.
- **Exact VBR-safe MP3 duration feedback (`durationMs` / `durationSec`)**:
  - `concatMp3Buffers` strips per-segment `Xing`/`Info`/`VBRI` metadata frames when joining multi-segment OpenAI/SiliconFlow VBR MP3s so player seekbars and `inspectMp3Buffer` (`durationMs` / `durationSec`) always reflect the full audio duration.
  - When targeting a strict duration (e.g. a 60s short-video voiceover), check `durationSec` and re-adjust `rate` or script length.
- `cleanMarkdown` defaults to `true` for `.md`/`.markdown` `inputFile` (pass `cleanMarkdown: true` for inline Markdown in `text`). Texts over `5,000` chars (up to `100,000` chars) split cleanly on sentence/clause boundaries and merge into one seamless MP3.

## 3. Zero-Drift Reverse `.srt` / `.vtt` Video Dubbing (`subtitleInput`)

- When dubbing an existing video subtitle timeline into voiceover audio, pass `subtitleInput: "video.srt"` (or `.vtt`, up to 200 cues) to `voice_tts`:
  ```json
  {
    "subtitleInput": "video.srt",
    "persona": "bilingual-tech-male",
    "pronunciations": [{ "word": "SQL", "alias": "S Q L" }],
    "output": "dubbed.mp3",
    "subtitleOutput": "dubbed.srt"
  }
  ```
- Each cue is measured with `inspectMp3Buffer`: if a cue runs `>8%` past its `[startMs, endMs]` window, `voice_tts` scales its `rate` (`-30%` to `+85%`) and re-synthesizes once; if a dense cue still exceeds its window by `>3%` and local `ffmpeg` is available, `dsh-voice` applies pitch-preserving FFmpeg `atempo` window fitting and pads matched-sample-rate millisecond silences between cues for zero cumulative timeline drift.

## 4. Oral Script Adaptation for Briefings

When summarizing notes, changelogs, or reports into a spoken briefing rather than reading verbatim:

- Rewrite bullet lists, Markdown tables, code identifiers, and bare URLs into natural spoken sentences, using inline `[pause:500ms]` markers for clean section transitions.
- Spell out or register technical acronyms (`OS`, `UI`, `SQL`, `K8s`) in `pronunciations` so narration sounds natural without corrupting English words.
- Target roughly 220–260 Chinese characters or 130–160 English words per minute at `+0%` rate and verify with `durationSec`.

## 5. Multi-Speaker Podcasts, Chapters, BGM Auto-Ducking & Loudness Mastering

Produce multi-host dialogues with clickable MP3 chapters and background music in one `voice_tts` call using `segments` (up to 50 turns, optional per-segment `title`), `chaptersOutput`, `bgmFile`, `bgmVolume`, `bgmDucking`, and `-16 LUFS` mastering:

```json
{
  "segments": [
    {
      "title": "开场与看点",
      "persona": "podcast-host-female",
      "text": "欢迎收听本期技术早报 [pause:400ms] 今天聊聊最新的语音工作流。",
      "pauseMs": 350
    },
    {
      "title": "核心升级拆解",
      "persona": "podcast-host-male",
      "text": "没错，现在章节书签、卡拉 OK 字幕和 BGM 自动闪避都能一次搞定。",
      "rate": "+5%",
      "pauseMs": 300
    }
  ],
  "bgmFile": "assets/bgm.mp3",
  "bgmVolume": 0.18,
  "bgmDucking": true,
  "normalizeLoudness": true,
  "output": "podcast.mp3",
  "subtitleOutput": "podcast.srt",
  "chaptersOutput": "podcast-chapters.md"
}
```

- **Podcast BGM Auto-Ducking (`bgmFile`, `bgmVolume`, `bgmDucking`)**:
  - Loops workspace `bgmFile` at `bgmVolume` (`0.02–1.0`, default `0.18`), applies FFmpeg `sidechaincompress` ducking when `bgmDucking !== false`, adds a smooth fade-out at the end, and optionally chains `-16 LUFS` loudness normalization (`normalizeLoudness: true`) before embedding `CHAP`/`CTOC` MP3 chapters. Requires local `ffmpeg`.
- **Emotion, acting & paralinguistics (`instructions`)**:
  - Pass acting prompts via `instructions` on `voice_tts` or per segment in `segments[]` (auto-prepends `<|endofprompt|>` on SiliconFlow `CosyVoice2-0.5B` with inline `[laughter]`/`[breath]`; sent natively on OpenAI `gpt-4o-mini-tts`; custom Kokoro endpoints also accept blends like `zf_xiaobei*0.6+zf_xiaoni*0.4`).
- **Standalone loudness mastering (`normalizeLoudness: true`)**:
  - When `bgmFile` is omitted, runs local `ffmpeg` (`loudnorm=I=-16:TP=-1.5:LRA=11`) after concatenation for consistent broadcast volume.

## 6. Zero-Shot Voice Cloning (`referenceAudio`) & `customVoices` Aliases

- **Zero-shot reference cloning with SHA-256 URI caching**:
  - Pass a 5–10s clean workspace clip (`≤10 MB`, `.wav`/`.mp3`/`.webm`/etc.) in `referenceAudio` + `referenceText` on `voice_tts` or `segments[]` (requires `ttsEngine` set to `siliconflow` or `custom`).
  - SiliconFlow uploads `referenceAudio` to `/uploads/audio/voice` once per SHA-256 hash and reuses the cached `speech:...` URI across all podcast turns.
- **1-click Studio mic clone & `customVoices` aliases**:
  - Users can record 8s directly in the Voice Studio **Mic & Custom Voices** tab (`voice_clones/` + auto-ASR + `customVoices` registration) or save named presets in DSH Settings `customVoices` and invoke them by `name` in `voice_tts`, `segments[]`, or `voice_preview`.

## 7. Short-Video Word/Clause Subtitles & Karaoke `.ass` Export

- **Short-video compact cues & karaoke `.ass` (`subtitleGranularity`, `maxCharsPerCue`, `subtitleOutput`)**:
  - Pass `subtitleGranularity: "clause"` (or `"word"`, default `"sentence"`) and `maxCharsPerCue` (default `16`, range `4–80`, ~16 CJK chars or ~32 English chars per screen) to `voice_tts` so vertical short videos get punchy single-line captions instead of overflowing paragraphs.
  - Pass `subtitleOutput: "clip.ass"` to export a `1080x1920` SubStation Alpha (`v4.00+`) file with genuine `{\kf...}` word-by-word karaoke timing (or `.srt`/`.vtt` for standard players):
    ```json
    {
      "text": "三秒学会短视频卡拉OK动态高亮字幕！",
      "persona": "energetic-anchor",
      "subtitleGranularity": "clause",
      "maxCharsPerCue": 14,
      "output": "clip.mp3",
      "subtitleOutput": "clip.ass"
    }
    ```
- Pass `subtitleOutput: "transcript.srt"` (or `.vtt`) to `voice_stt` for timestamped ASR subtitles.
- Hand the resulting `.mp3` and `.ass`/`.srt`/`.vtt` files directly to `dsh-ffmpeg` for subtitle burn-in (`subtitles=clip.ass`) or `dsh-remotion` for programmatic video composition.

## 8. Direct Video Transcription, Speaker Diarization (`diarize`) & Health Checks

- **Direct video container transcription (`voice_stt`)**:
  - Pass `.mp4`, `.mkv`, `.mov`, or `.avi` (plus `.flv`/`.wmv`/`.m4v`/`.ts`/`.mts`) directly to `voice_stt({ audio: "lecture.mp4", subtitleOutput: "lecture.srt" })`. When local `ffmpeg` is available, `dsh-voice` automatically strips the video stream (`-vn`) into lightweight 16kHz mono audio before uploading to ASR — even if the video file is under 25 MB.
- **Speaker diarization (`diarize: true` on `voice_stt`)**:
  - Separates stereo channels via local `ffmpeg` (`说话人 A` / `说话人 B`) or infers speaker turns from `verbose_json`, returning `speakers`, `[说话人 A 00:01]` paragraphs, and `[speaker]`-prefixed `.srt`/`.vtt` cues.
- **Domain accuracy & >25 MB audio**:
  - Pass domain terms in `prompt` (`voice_stt({ audio, prompt: "DeepSeek Harness, Cordis" })`), and pass `autoCompress: true` to automatically transcode and split audio recordings over 25 MB via local `ffmpeg`.
- **Local / keyless Whisper & scoped diagnostics**:
  - Loopback `custom` ASR (`127.0.0.1` / `localhost`) requires no `asrApiKey`.
  - Run `voice_health({ scope: "tts" })` before TTS-only tasks, `voice_health({ scope: "stt" })` before transcription, or `voice_health()` for full engine, voice/persona/alias, prosody, proxy (`http://`, `https://`, `socks5://`, `socks5h://`), and key checks.
