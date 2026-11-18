---
name: voice-workflow
description: Best-practice workflows for dsh-voice: direct file TTS with Markdown cleanup, oral script adaptation, multi-speaker podcast segments, SRT/VTT subtitle export, interactive voice auditions, and large-recording transcription. Load when turning documents/notes into speech, producing podcasts/subtitles, or transcribing audio.
---

# Voice Workflow (`dsh-voice`)

Use this guide when converting articles, notes, or briefings into audio/subtitles, auditioning voices, or transcribing recordings inside the active session workspace.

## 1. Pick Voices & Audition Before Long Renders

- Discover voices with `voice_list({ locale, gender, tag })` instead of guessing IDs. Useful tags include `podcast`, `multilingual`, `warm`, `news`, `dialect`.
- Flagship multilingual options:
  - Chinese + English bilingual: `zh-CN-XiaoxiaoMultilingualNeural`, `zh-CN-YunyiMultilingualNeural`, `zh-CN-YunfanMultilingualNeural`
  - English multilingual: `en-US-AvaMultilingualNeural`, `en-US-AndrewMultilingualNeural`, `en-US-EmmaMultilingualNeural`
- When the user wants to compare voices, call `voice_preview({ voices: [...], text })`. It writes MP3 samples and an interactive `voice_previews/index.html` browser audition page (with playback speed toggles and one-click voice ID copy).

## 2. Direct File Synthesis & Markdown Cleanup (`inputFile`)

- **Do not copy large `.md` or `.txt` files into `text` arguments.** Pass `inputFile` directly to `voice_tts`:
  ```json
  {
    "inputFile": "docs/article.md",
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

## 4. Multi-Speaker Podcasts (`segments`)

Produce two-host or multi-role dialogues in a single MP3 using `voice_tts` `segments` (up to 50 segments per call):

```json
{
  "segments": [
    {
      "voice": "zh-CN-XiaoxiaoMultilingualNeural",
      "text": "欢迎收听本期技术早报，今天我们来聊聊最新的语音工作流。",
      "pauseMs": 350
    },
    {
      "voice": "zh-CN-YunyiMultilingualNeural",
      "text": "没错，现在长文稿和双人播客都可以一次合成，还能同步导出字幕。",
      "rate": "+5%",
      "pauseMs": 300
    }
  ],
  "output": "podcast.mp3",
  "subtitleOutput": "podcast.srt"
}
```

- Each segment supports optional `voice`, `rate`, `pitch`, and `pauseMs` (default inter-segment silence `300` ms).
- Pair contrasting voices (for example `zh-CN-XiaoxiaoMultilingualNeural` + `zh-CN-YunyiMultilingualNeural`, or `en-US-AvaMultilingualNeural` + `en-US-AndrewMultilingualNeural`) for natural turn-taking.

## 5. Synchronized Subtitles for Video Pipelines (`subtitleOutput`)

- Pass `subtitleOutput: "out.srt"` or `"out.vtt"` to `voice_tts` (single-speaker or `segments`) to export synchronized sentence-boundary subtitles alongside the MP3 at zero extra API cost.
- Pass `subtitleOutput: "transcript.srt"` (or `.vtt`) to `voice_stt` to automatically request word/segment timestamps and write subtitles alongside the transcript.
- Hand the resulting `.mp3` and `.srt`/`.vtt` files directly to `dsh-ffmpeg` for subtitle burn-in or `dsh-remotion` for timeline composition.

## 6. Meeting Transcription & Health Checks

- **Domain accuracy**: Pass project names, acronyms, and speaker terms in `voice_stt({ audio, prompt: "DeepSeek Harness, Cordis, ...", output: "meeting.txt" })`.
- **Large recordings (>25 MB)**: Pass `autoCompress: true` to `voice_stt`. When local `ffmpeg` is available, `dsh-voice` automatically transcodes (16kHz mono) and splits recordings longer/larger than 24 MB into segments, merges the transcript, and shifts subtitle timestamps accurately.
- **Local / keyless Whisper**: If `asrEngine` is `custom` pointing to a loopback URL (e.g. `http://127.0.0.1:8000/v1`), no `asrApiKey` is required.
- **Scoped diagnostics**:
  - Run `voice_health({ scope: "tts" })` before TTS-only tasks so an unconfigured ASR key does not trigger false alarms.
  - Run `voice_health({ scope: "stt" })` before transcription, or `voice_health()` (default `all`) for full engine, voice/prosody, proxy (`http://`, `https://`, `socks5://`, `socks5h://`), and key diagnostics.
