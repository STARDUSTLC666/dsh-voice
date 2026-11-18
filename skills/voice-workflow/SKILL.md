---
name: voice-workflow
description: Best-practice workflows for dsh-voice: 300+ online Edge voice discovery, 10 built-in voice personas, emotion/acting instructions, zero-shot reference cloning & customVoices aliases, direct file TTS with Markdown cleanup, oral script adaptation, multi-speaker podcasts with -16 LUFS loudness mastering, SRT/VTT subtitle export, interactive voice auditions, and large-recording transcription. Load when turning documents/notes into speech, producing podcasts/subtitles, cloning voices, or transcribing audio.
---

# Voice Workflow (`dsh-voice`)

Use this guide when converting articles, notes, or briefings into audio/subtitles, auditioning voices/personas, cloning reference voices, or transcribing recordings inside the active session workspace.

## 1. Discover Voices, Pick Personas & Audition Before Long Renders

- **Online 300+ Edge voice catalog + 45+ curated built-ins**:
  - Call `voice_list({ online: true, locale, gender, tag })` to fetch and cache (24h in-memory) Microsoft's live 300+ neural voice catalog. If offline or unreachable, it falls back automatically (`source: "builtin-fallback"`) to 45+ curated voices spanning child (`zh-CN-XiaoshuangNeural`, `zh-CN-XiaoyouNeural`), teen/anime (`zh-CN-YunxiaNeural`), mature/documentary (`zh-CN-YunzeNeural`, `zh-CN-XiaoqiuNeural`), elder (`zh-CN-XiaoruiNeural`), passionate (`zh-CN-YunhaoNeural`), and dialects (Northeast `zh-CN-liaoning-XiaobeiNeural`, Shaanxi `zh-CN-shaanxi-XiaoniNeural`, Sichuan `zh-CN-sichuan-YunxiNeural`, Henan `zh-CN-henan-YundengNeural`, Shandong `zh-CN-shandong-YunxiangNeural`, Cantonese `zh-HK-WanLungNeural` / `zh-HK-HiuMaanNeural`, Taiwanese `zh-TW-YunJheNeural` / `zh-TW-HsiaoChenNeural` / `zh-TW-HsiaoYuNeural`).
  - `voice_list` also returns `personas` (unless `includePersonas: false`) and any `customVoices` aliases configured in DSH Settings.
- **10 ready-made personas (`persona`)**:
  - Use `persona` in `voice_tts`, `segments[]`, or `voice_preview` for instant character tuning (`voice`, `rate`, `pitch`, `pauseMs`):
    `late-night-radio`, `podcast-host-female`, `podcast-host-male`, `documentary-narrator`, `bedtime-story`, `anime-boy`, `energetic-anchor`, `news-briefing`, `bilingual-tech-female`, `bilingual-tech-male`.
- **Interactive audition page**:
  - Call `voice_preview({ voices: [...], text })` with raw voice IDs, built-in `persona` IDs/labels, or `customVoices` alias names. It writes MP3 samples and an interactive `voice_previews/index.html` browser audition page (with playback speed toggles and one-click ID copy).

## 2. Direct File Synthesis & Markdown Cleanup (`inputFile`)

- **Do not copy large `.md` or `.txt` files into `text` arguments.** Pass `inputFile` directly to `voice_tts`:
  ```json
  {
    "inputFile": "docs/article.md",
    "persona": "documentary-narrator",
    "output": "article.mp3"
  }
  ```
- `cleanMarkdown` defaults to `true` when `inputFile` ends with `.md` or `.markdown` (pass `cleanMarkdown: true` explicitly for inline Markdown in `text`). It strips fenced code blocks, URLs, Markdown links/images, headings, emphasis markers, and HTML tags while preserving punctuation and paragraph breaks.
- Texts longer than `5,000` characters (up to `100,000` characters) are automatically split on sentence/clause boundaries and merged into a single seamless MP3 in one `voice_tts` call.

## 3. Oral Script Adaptation for Briefings

When the user asks to summarize notes, changelogs, or reports into a spoken briefing rather than reading a file verbatim:

- Rewrite bullet lists, Markdown tables, code identifiers, and bare URLs into natural spoken sentences before calling `voice_tts`.
- Spell out or paraphrase abbreviations and symbols (e.g., turn `->`, `>=`, or file paths into natural transitions) so the narration sounds like a human host.
- Keep target duration in mind (roughly 220–260 Chinese characters or 130–160 English words per minute at `+0%` rate).

## 4. Multi-Speaker Podcasts, Emotion Acting & Loudness Mastering

Produce two-host or multi-role dialogues in a single MP3 using `voice_tts` `segments` (up to 50 segments per call), with optional per-segment `persona`, `instructions`, `referenceAudio`/`referenceText`, and `-16 LUFS` broadcast loudness mastering:

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
      "text": "没错，现在长文稿、人设配音和响度均衡都可以一次搞定。",
      "rate": "+5%",
      "pauseMs": 300
    }
  ],
  "normalizeLoudness": true,
  "output": "podcast.mp3",
  "subtitleOutput": "podcast.srt"
}
```

- **Emotion, acting & paralinguistics (`instructions`)**:
  - Pass natural-language acting prompts via `instructions` on `voice_tts` or per segment in `segments[]`.
  - On SiliconFlow `CosyVoice2-0.5B`, `instructions` is automatically prepended with `<|endofprompt|>` and supports inline `[laughter]` and `[breath]` tags.
  - On OpenAI `gpt-4o-mini-tts`, `instructions` is passed natively as the top-level API parameter.
  - On custom Kokoro endpoints, `voice` also accepts voice-blending expressions such as `zf_xiaobei*0.6+zf_xiaoni*0.4`.
- **Podcast loudness mastering (`normalizeLoudness: true`)**:
  - Runs local `ffmpeg` (`loudnorm=I=-16:TP=-1.5:LRA=11`) after concatenation so multi-speaker or cross-voice podcasts have consistent broadcast volume. (Requires `ffmpeg` installed locally.)

## 5. Zero-Shot Voice Cloning (`referenceAudio`) & `customVoices` Aliases

- **Zero-shot reference cloning**:
  - Pass a 5–10 second clean workspace speech clip (`≤10 MB`, `.wav`/`.mp3`/etc.) in `referenceAudio` alongside its transcript in `referenceText` on `voice_tts` or `segments[]`.
  - Requires `ttsEngine` set to `siliconflow` (`FunAudioLLM/CosyVoice2-0.5B`) or `custom` (e.g., local GPT-SoVITS / IndexTTS). Using `referenceAudio` while `ttsEngine: "edge"` throws an actionable error guiding the user to switch engines.
- **Reusable named aliases (`customVoices`)**:
  - Users can save named characters (`name`, `voice`, `persona`, `rate`, `pitch`, `instructions`, `referenceAudio`, `referenceText`) in DSH Settings `customVoices` (live-reloaded without restart) and invoke them by `name` in `voice_tts`, `segments[]`, or `voice_preview`.

## 6. Synchronized Subtitles for Video Pipelines (`subtitleOutput`)

- Pass `subtitleOutput: "out.srt"` or `"out.vtt"` to `voice_tts` (single-speaker or `segments`) to export synchronized sentence-boundary subtitles alongside the MP3 at zero extra API cost.
- Pass `subtitleOutput: "transcript.srt"` (or `.vtt`) to `voice_stt` to automatically request word/segment timestamps and write subtitles alongside the transcript.
- Hand the resulting `.mp3` and `.srt`/`.vtt` files directly to `dsh-ffmpeg` for subtitle burn-in or `dsh-remotion` for timeline composition.

## 7. Meeting Transcription & Health Checks

- **Domain accuracy**: Pass project names, acronyms, and speaker terms in `voice_stt({ audio, prompt: "DeepSeek Harness, Cordis, ...", output: "meeting.txt" })`.
- **Large recordings (>25 MB)**: Pass `autoCompress: true` to `voice_stt`. When local `ffmpeg` is available, `dsh-voice` automatically transcodes (16kHz mono) and splits recordings larger than 24 MB into segments, merges the transcript, and shifts subtitle timestamps accurately.
- **Local / keyless Whisper**: If `asrEngine` is `custom` pointing to a loopback URL (e.g. `http://127.0.0.1:8000/v1`), no `asrApiKey` is required.
- **Scoped diagnostics**:
  - Run `voice_health({ scope: "tts" })` before TTS-only tasks so an unconfigured ASR key does not trigger false alarms (also recognizes built-in `persona` IDs and `customVoices` aliases as valid `ttsVoice` values).
  - Run `voice_health({ scope: "stt" })` before transcription, or `voice_health()` (default `all`) for full engine, voice/prosody, proxy (`http://`, `https://`, `socks5://`, `socks5h://`), and key diagnostics.
