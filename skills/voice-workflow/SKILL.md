---
name: voice-workflow
description: Best-practice workflows for dsh-voice: 5-theme Voice Studio sidebar workbench, 300+ online Edge voice discovery, 10 built-in personas, exact MP3 duration feedback (durationMs/durationSec), pronunciation lexicon (pronunciations), reverse .srt/.vtt video dubbing (subtitleInput), podcast BGM auto-ducking (bgmFile/bgmVolume/bgmDucking) with -16 LUFS mastering, emotion/acting instructions, SiliconFlow SHA-256 cached cloning & customVoices aliases, direct file TTS with Markdown cleanup, and speaker-diarized transcription (diarize). Load when turning documents/subtitles into speech, hitting exact duration targets, producing podcasts with BGM, cloning voices, or transcribing audio.
---

# Voice Workflow (`dsh-voice`)

Use this guide when converting articles, notes, briefings, or subtitle timelines into audio/subtitles, auditioning voices/personas, cloning reference voices, mixing podcast BGM, or transcribing recordings inside the active session workspace.

## 1. Native Voice Studio Workbench, Discovery & Auditions

- **5-theme Voice Studio sidebar workbench**:
  - Users can open the native DSH sidebar workbench (5 themes: 原生清透 / 米白纸感 / Claude 暖书卷 / 8-Bit 像素 / 晴空薄荷 + interactive Coachmark onboarding tour) to audition 300+ voices and 10 personas in-panel, dictate with the browser microphone, and manage `customVoices` and `pronunciations` rules without editing YAML.
- **Online 300+ Edge voice catalog + 45+ curated built-ins**:
  - Call `voice_list({ online: true, locale, gender, tag })` to fetch and cache (24h in-memory) Microsoft's live 300+ neural voice catalog. If offline or unreachable, it falls back automatically (`source: "builtin-fallback"`) to 45+ curated voices spanning child (`zh-CN-XiaoshuangNeural`, `zh-CN-XiaoyouNeural`), teen/anime (`zh-CN-YunxiaNeural`), mature/documentary (`zh-CN-YunzeNeural`, `zh-CN-XiaoqiuNeural`), elder (`zh-CN-XiaoruiNeural`), passionate (`zh-CN-YunhaoNeural`), and dialects (Northeast `zh-CN-liaoning-XiaobeiNeural`, Shaanxi `zh-CN-shaanxi-XiaoniNeural`, Sichuan `zh-CN-sichuan-YunxiNeural`, Henan `zh-CN-henan-YundengNeural`, Shandong `zh-CN-shandong-YunxiangNeural`, Cantonese `zh-HK-WanLungNeural` / `zh-HK-HiuMaanNeural`, Taiwanese `zh-TW-YunJheNeural` / `zh-TW-HsiaoChenNeural` / `zh-TW-HsiaoYuNeural`).
  - `voice_list` also returns `personas` (unless `includePersonas: false`) and any `customVoices` aliases configured in DSH Settings.
- **10 ready-made personas (`persona`)**:
  - Use `persona` in `voice_tts`, `segments[]`, or `voice_preview` for instant character tuning (`voice`, `rate`, `pitch`, `pauseMs`):
    `late-night-radio`, `podcast-host-female`, `podcast-host-male`, `documentary-narrator`, `bedtime-story`, `anime-boy`, `energetic-anchor`, `news-briefing`, `bilingual-tech-female`, `bilingual-tech-male`.
- **Interactive audition page**:
  - Call `voice_preview({ voices: [...], text })` with raw voice IDs, built-in `persona` IDs/labels, or `customVoices` alias names. It writes MP3 samples and an interactive `voice_previews/index.html` browser audition page (with playback speed toggles and one-click ID copy).

## 2. Direct File Synthesis, Pronunciation Lexicon & Exact Duration Targets

- **Do not copy large `.md` or `.txt` files into `text` arguments.** Pass `inputFile` directly to `voice_tts`:
  ```json
  {
    "inputFile": "docs/article.md",
    "persona": "documentary-narrator",
    "pronunciations": [{ "word": "Nginx", "alias": "Engine X" }],
    "output": "article.mp3",
    "subtitleOutput": "article.srt"
  }
  ```
- **Pronunciation lexicon (`pronunciations`)**:
  - Pass `pronunciations` as `[{ word, alias }]` (or `{ "Nginx": "Engine X" }`) on `voice_tts`, or configure persistent rules in DSH Settings `pronunciations` (per-call rules override same-word Settings rules).
  - On Edge TTS, rules compile to SSML `<sub alias="...">` so exported `.srt`/`.vtt` subtitles preserve the original spelling (`Nginx`) while speech pronounces the alias (`Engine X`). On OpenAI/SiliconFlow/custom engines, spoken text applies non-recursive longest-first replacement while fallback subtitle cues retain the original text.
- **Exact MP3 duration feedback (`durationMs` / `durationSec`)**:
  - Every `voice_tts` call inspects the final MP3 stream across CBR/VBR and multi-engine chunks (generating matched-sample-rate silence frames for pauses) and returns exact `durationMs` and `durationSec`.
  - When targeting a strict duration (e.g. a 60s short-video voiceover), check `durationSec` and re-adjust `rate` or trim script length accordingly.
- `cleanMarkdown` defaults to `true` when `inputFile` ends with `.md` or `.markdown` (pass `cleanMarkdown: true` explicitly for inline Markdown in `text`). It strips fenced code blocks, URLs, Markdown links/images, headings, emphasis markers, and HTML tags while preserving punctuation and paragraph breaks.
- Texts longer than `5,000` characters (up to `100,000` characters) are automatically split on sentence/clause boundaries and merged into a single seamless MP3 in one `voice_tts` call.

## 3. Reverse `.srt` / `.vtt` Video Dubbing (`subtitleInput`)

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
- Each cue is synthesized and measured with `inspectMp3Buffer`; if a cue runs more than `8%` past its `[startMs, endMs]` window, `voice_tts` automatically scales its `rate` (clamped `-30%` to `+85%`) and re-synthesizes once, then inserts matched-sample-rate millisecond silence padding between cues so audio stays locked to the video timeline.

## 4. Oral Script Adaptation for Briefings

When the user asks to summarize notes, changelogs, or reports into a spoken briefing rather than reading a file verbatim:

- Rewrite bullet lists, Markdown tables, code identifiers, and bare URLs into natural spoken sentences before calling `voice_tts`.
- Spell out or paraphrase abbreviations and symbols (or register technical acronyms in `pronunciations`) so the narration sounds like a human host.
- Keep target duration in mind (roughly 220–260 Chinese characters or 130–160 English words per minute at `+0%` rate) and verify with the returned `durationSec`.

## 5. Multi-Speaker Podcasts, BGM Auto-Ducking & Loudness Mastering

Produce two-host or multi-role dialogues with background music in a single MP3 using `voice_tts` `segments` (up to 50 segments per call), `bgmFile`, `bgmVolume`, `bgmDucking`, and `-16 LUFS` broadcast loudness mastering:

```json
{
  "segments": [
    {
      "persona": "podcast-host-female",
      "text": "欢迎收听本期技术早报，今天我们来聊聊最新的语音工作流。",
      "pauseMs": 350
    },
    {
      "persona": "podcast-host-male",
      "text": "没错，现在长文稿、BGM 自动闪避和响度均衡都可以一次搞定。",
      "rate": "+5%",
      "pauseMs": 300
    }
  ],
  "bgmFile": "assets/bgm.mp3",
  "bgmVolume": 0.18,
  "bgmDucking": true,
  "normalizeLoudness": true,
  "output": "podcast.mp3",
  "subtitleOutput": "podcast.srt"
}
```

- **Podcast BGM Auto-Ducking (`bgmFile`, `bgmVolume`, `bgmDucking`)**:
  - Loops workspace `bgmFile` under the speech track at `bgmVolume` (`0.02–1.0`, default `0.18`), applies FFmpeg `sidechaincompress` ducking when `bgmDucking !== false` so music automatically dips whenever hosts speak, adds a smooth fade-out at the end, and optionally chains `-16 LUFS` loudness normalization (`normalizeLoudness: true`). Requires local `ffmpeg`.
- **Emotion, acting & paralinguistics (`instructions`)**:
  - Pass natural-language acting prompts via `instructions` on `voice_tts` or per segment in `segments[]`.
  - On SiliconFlow `CosyVoice2-0.5B`, `instructions` is automatically prepended with `<|endofprompt|>` and supports inline `[laughter]` and `[breath]` tags.
  - On OpenAI `gpt-4o-mini-tts`, `instructions` is passed natively as the top-level API parameter.
  - On custom Kokoro endpoints, `voice` also accepts voice-blending expressions such as `zf_xiaobei*0.6+zf_xiaoni*0.4`.
- **Standalone loudness mastering (`normalizeLoudness: true`)**:
  - When `bgmFile` is omitted, runs local `ffmpeg` (`loudnorm=I=-16:TP=-1.5:LRA=11`) after concatenation so multi-speaker or cross-voice podcasts have consistent broadcast volume. (Requires `ffmpeg` installed locally.)

## 6. Zero-Shot Voice Cloning (`referenceAudio`) & `customVoices` Aliases

- **Zero-shot reference cloning with SHA-256 URI caching**:
  - Pass a 5–10 second clean workspace speech clip (`≤10 MB`, `.wav`/`.mp3`/etc.) in `referenceAudio` alongside its transcript in `referenceText` on `voice_tts` or `segments[]`.
  - Requires `ttsEngine` set to `siliconflow` (`FunAudioLLM/CosyVoice2-0.5B`) or `custom` (e.g., local GPT-SoVITS / IndexTTS). Using `referenceAudio` while `ttsEngine: "edge"` throws an actionable error guiding the user to switch engines.
  - On SiliconFlow, `dsh-voice` automatically uploads the reference clip to `/uploads/audio/voice` once per SHA-256 hash and caches the returned `speech:...` URI across podcast segments instead of re-sending megabytes of base64 audio on every turn.
- **Reusable named aliases (`customVoices`)**:
  - Users can save named characters (`name`, `voice`, `persona`, `rate`, `pitch`, `instructions`, `referenceAudio`, `referenceText`) in DSH Settings `customVoices` or the Voice Studio sidebar (live-reloaded without restart) and invoke them by `name` in `voice_tts`, `segments[]`, or `voice_preview`.

## 7. Synchronized Subtitles for Video Pipelines (`subtitleOutput`)

- Pass `subtitleOutput: "out.srt"` or `"out.vtt"` to `voice_tts` (single-speaker, `segments`, or `subtitleInput`) to export synchronized sentence-boundary subtitles alongside the MP3 at zero extra API cost.
- Pass `subtitleOutput: "transcript.srt"` (or `.vtt`) to `voice_stt` to automatically request word/segment timestamps and write subtitles alongside the transcript.
- Hand the resulting `.mp3` and `.srt`/`.vtt` files directly to `dsh-ffmpeg` for subtitle burn-in or `dsh-remotion` for timeline composition.

## 8. Speaker-Diarized Transcription (`diarize`) & Health Checks

- **Speaker diarization (`diarize: true` on `voice_stt`)**:
  - Pass `diarize: true` to `voice_stt` to separate multi-speaker recordings: splits stereo channels via local `ffmpeg` when available (`说话人 A` / `说话人 B`), or reads/infers speaker turn switches in `verbose_json`, returning `speakers`, formatted `[说话人 A 00:01]` transcript paragraphs, and `[speaker]`-prefixed `.srt`/`.vtt` cues.
- **Domain accuracy**: Pass project names, acronyms, and speaker terms in `voice_stt({ audio, prompt: "DeepSeek Harness, Cordis, ...", output: "meeting.txt" })`.
- **Large recordings (>25 MB)**: Pass `autoCompress: true` to `voice_stt`. When local `ffmpeg` is available, `dsh-voice` automatically transcodes (16kHz mono) and splits recordings larger than 24 MB into segments, merges the transcript, and shifts subtitle timestamps accurately.
- **Local / keyless Whisper**: If `asrEngine` is `custom` pointing to a loopback URL (e.g. `http://127.0.0.1:8000/v1`), no `asrApiKey` is required.
- **Scoped diagnostics**:
  - Run `voice_health({ scope: "tts" })` before TTS-only tasks so an unconfigured ASR key does not trigger false alarms (also recognizes built-in `persona` IDs and `customVoices` aliases as valid `ttsVoice` values).
  - Run `voice_health({ scope: "stt" })` before transcription, or `voice_health()` (default `all`) for full engine, voice/prosody, proxy (`http://`, `https://`, `socks5://`, `socks5h://`), and key diagnostics.
