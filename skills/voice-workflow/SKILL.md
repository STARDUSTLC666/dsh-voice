---
name: voice-workflow
description: Wish-Driven ("许愿式") chat-first workflows for dsh-voice across all 6 tools (voice_tts, voice_stt, voice_list, voice_preview, voice_health, voice_prefs) — high-level scene presets (podcast/short-video/audiobook/briefing/story/dubbing), fuzzy natural-language voice/persona/dialect wishes, auto targetDurationSec fitting, built-in word-boundary-safe autoPronunciations, self-contained HTML5 interactive player (createPlayer/playerOutput), curated scene auditions (voice_preview), conversational preference memory (voice_prefs), 51 live-verified built-in + 300+ online Edge voices, 10 personas, multi-speaker BGM auto-ducking podcasts, karaoke .ass subtitles, inline [pause:500ms] tags, MP3 CHAP/CTOC chapters, zero-drift atempo dubbing, voice cloning, direct video STT, and optional Voice Studio sidebar workbench on demand.
---

# Voice Workflow (`dsh-voice`)

**Wish-Driven ("许愿式") Chat-First Principle**: Users speak high-level wishes in plain language inside the chat box (e.g. *"把这份周报做成轻松的双人科技播客"*, *"给短视频配个 30 秒以内有感染力的口播和花字字幕"*, *"用粤语男声把这篇长文做成带交互播放器的有声书"*, *"以后默认用纪录片声音，把 Nginx 读成 Engine X"*, *"把会议录像整理成带说话人的纪要"*).

- **Fulfill the wish in 1–2 tool calls — NEVER interrogate the user with a parameter form.**
  - Do NOT ask the user for raw voice IDs (`zh-CN-YunjianNeural`), `rate`, `pitch`, `bgmVolume`, `subtitleGranularity`, or `maxCharsPerCue` before acting.
  - Pass `scene` (or a fuzzy style/dialect wish in `persona`/`voice`), choose clean topic-based filenames (e.g. `weekly-podcast.mp3` + `.srt` + `.player.html` instead of generic `voice_output.mp3`), deliver the finished artifacts immediately, and let the user refine by natural-language feedback.
- **Leverage built-in Wish-Driven capabilities directly**:
  - **`scene` presets on `voice_tts`**: pass `scene: "podcast" | "short-video" | "audiobook" | "briefing" | "story" | "dubbing"` (or Chinese aliases `"播客"`, `"短视频"`, `"口播"`, `"有声书"`, `"简报"`, `"故事"`, `"配音"`). Omitted parameters automatically inherit tuned defaults (persona, `subtitleGranularity`/`maxCharsPerCue`, `normalizeLoudness`, `bgmDucking`, `cleanMarkdown`, smart `<scene>.mp3` naming), while explicit arguments always win.
  - **Fuzzy style & dialect wishes**: pass natural Chinese/English keywords directly to `persona`, `voice`, `segments[].persona`, `voice_preview({ voices })`, or `voice_prefs` — e.g. `"深夜"`, `"纪录片"`, `"播客女"`, `"播客男"`, `"双语女"`, `"双语男"`, `"睡前"`, `"少年"`, `"粤语男声"`, `"粤语"`, `"台湾男"`, `"东北话"`, `"陕西话"`, `"英语女"`, `"日语"`, `"韩语"`. No need to call `voice_list` first just to look up an ID!
  - **Auto duration fitting (`targetDurationSec`)**: whenever the user specifies a time budget (*"控制在 30 秒内"*, *"卡在 60 秒"*), pass `targetDurationSec: 30` (range `3–3600`, works on `text`, `inputFile`, and `segments`). `voice_tts` auto-calibrates speech rate once if >5% over budget and applies pitch-preserving FFmpeg `atempo` if still >3% over budget, reporting `durationAdjusted: true`.
  - **Interactive HTML5 player (`createPlayer: true` / `playerOutput`)**: for podcasts, audiobooks, stories, briefings, or whenever the user wants to listen & follow along immediately, pass `createPlayer: true` (writes `<stem>.player.html` next to the MP3 with light/dark theme, speed selector, download button, clickable chapters, and click-to-seek synchronized subtitles — auto-collecting cues even if `subtitleOutput` is omitted).
  - **Zero-effort tech pronunciations (`autoPronunciations`)**: enabled by default (`true`) in `voice_tts` with word-boundary-safe rules for `Nginx`, `SQL`, `K8s`, `Kubernetes`, `CLI`, `GUI`, `OAuth`, `PostgreSQL`, `kubectl`, `GraphQL`, and `WebSocket`. Add extra domain terms in `pronunciations` only when the script uses project-specific acronyms.
  - **One-call curated auditions (`voice_preview({ scene })`)**: when the user asks *"帮我挑几个适合播客/短视频/方言/深夜电台的声音"*, call `voice_preview({ scene: "podcast" })` directly (no `voice_list` wall of 300 IDs needed!). It curates 3–4 contrasting live-verified personas/voices and builds `voice_previews/index.html` in one step.
  - **Conversational preference memory (`voice_prefs`)**: whenever the user says *"以后默认用..."*, *"以后把 X 读成 Y"*, *"把我这个参考音存成..."*, or *"查看/删掉我存的声音偏好"*, call `voice_prefs` immediately to persist creative prefs (`ttsVoice`, `ttsRate`, `ttsPitch`, `pronunciations`, `customVoices`) live — no need to send them into Settings.
- **Natural follow-up tweaks**: After delivering the files (with duration, chapter timeline, and `.player.html` path), offer a single concise follow-up line (*"如需换声线、控时长、加 BGM 或设为默认偏好直接告诉我"*). Translate vague tweaks (*"再慢一点"*, *"换成粤语男声"*, *"压到 20 秒内"*, *"以后就这样"*) straight into updated tool calls.
- **Voice Studio sidebar workbench ONLY on demand**: Do NOT push users to open the sidebar workbench for ordinary chat requests. Mention **Voice Studio (`语音工作室`)** ONLY when the user explicitly asks for live browser microphone recording (8-second 1-click clone / mic voice memo) or in-app visual browsing & playback.

---

## 1. Wish-Driven Intent Routing (1–2 Tool Calls)

| What the user wishes in chat | Call directly |
| --- | --- |
| "把这篇文章做成有声书，带章节和交互播放器" | `voice_tts({ scene: "audiobook", inputFile: "article.md", output: "article.mp3", subtitleOutput: "article.srt", chaptersOutput: "article-chapters.md", createPlayer: true })` |
| "把周报做成轻松的双人科技播客，配背景音乐" | `voice_tts({ scene: "podcast", segments: [{ title, persona: "双语女", text }, { title, persona: "双语男", text }], bgmFile: "assets/bgm.mp3", output: "weekly-podcast.mp3", subtitleOutput: "weekly-podcast.srt", createPlayer: true })` |
| "给短视频配个 30 秒内有感染力的口播 + 竖屏花字字幕" | `voice_tts({ scene: "short-video", text, targetDurationSec: 30, output: "clip.mp3", subtitleOutput: "clip.ass" })` |
| "用粤语男声 / 深夜电台 / 东北话读这段话" | `voice_tts({ text, voice: "粤语男声", output: "cantonese-demo.mp3" })` (fuzzy matching resolves straight to live-verified Edge voices/personas) |
| "按这个 video.srt 字幕零漂移卡点配音" | `voice_tts({ scene: "dubbing", subtitleInput: "video.srt", output: "dubbing.mp3", subtitleOutput: "dubbing.srt" })` |
| "帮我挑几个适合播客 / 纪录片 / 方言的声音听听" | `voice_preview({ scene: "播客" })` (or `scene: "方言"` / `"双语"` / `"深夜电台"` — generates 3–4 MP3s + `voice_previews/index.html` in 1 call) |
| "以后默认用纪录片声音、语速慢一点" | `voice_prefs({ action: "set_default", persona: "纪录片", rate: "-10%" })` |
| "以后记住把 Cordis 读成 科迪斯" | `voice_prefs({ action: "add_pronunciation", word: "Cordis", alias: "科迪斯" })` |
| "把我的参考音频存成自定义角色叫老王" | `voice_prefs({ action: "save_custom_voice", name: "老王", referenceAudio: "ref.wav", referenceText: "..." })` |
| "看看我现在存了哪些默认音色和发音规则" | `voice_prefs({ action: "get" })` |
| "把这个 MP4 录像 / 会议录音转文字，分清谁说的" | `voice_stt({ audio: "meeting.mp4", diarize: true, output: "transcript.txt", subtitleOutput: "meeting.srt" })` |
| "为什么语音转文字不能用 / 帮我检查配置" | `voice_health({ scope: "stt" })` (or `"tts"` / `"all"`) |

---

## 2. Scene Presets (`scene`), Fuzzy Styles & Voice Discovery

- **6 built-in `scene` presets on `voice_tts`** (all support English IDs and Chinese aliases):
  - `podcast` (`播客`/`对谈`/`访谈`): `defaultPersona: "podcast-host-female"`, `normalizeLoudness: true`, `bgmDucking: true`, default filename `podcast.mp3`.
  - `short-video` (`短视频`/`口播`/`抖音`/`小红书`): `defaultPersona: "energetic-anchor"`, `subtitleGranularity: "clause"`, `maxCharsPerCue: 14`, default filename `short-video.mp3`.
  - `audiobook` (`有声书`/`朗读`/`听书`/`长文`): `defaultPersona: "documentary-narrator"`, `cleanMarkdown: true`, default filename `audiobook.mp3`.
  - `briefing` (`简报`/`早报`/`新闻`/`日报`): `defaultPersona: "news-briefing"`, default filename `briefing.mp3`.
  - `story` (`故事`/`睡前`/`绘本`/`童话`): `defaultPersona: "bedtime-story"`, default filename `story.mp3`.
  - `dubbing` (`配音`/`翻配`): `defaultPersona: "bilingual-tech-male"`, default filename `dubbing.mp3`.
- **10 live-verified built-in `persona` presets** (exact ID, Chinese label, or fuzzy style keyword):
  `late-night-radio`, `podcast-host-female`, `podcast-host-male`, `documentary-narrator`, `bedtime-story`, `anime-boy`, `energetic-anchor`, `news-briefing`, `bilingual-tech-female`, `bilingual-tech-male`.
- **Voice audition vs. catalog browsing**:
  - Prefer `voice_preview({ scene })` (or `voice_preview({ voices: ["深夜", "纪录片", "粤语男声"], text })`) for *"挑个声音"* wishes — gives playable MP3 samples + `voice_previews/index.html` directly.
  - Only call `voice_list` when the user wants to inspect specific locales/tags across the 51 live-verified built-in voices or 300+ online Edge voices (`voice_list({ online: true, locale, gender, tag })`). Always pass filters (`locale`/`gender`/`tag`) with `online: true` to stay concise (chat rendering automatically collapses >60 voices into top 40 + locale breakdown while preserving full structured `voices`).

---

## 3. Conversational Preference Memory (`voice_prefs`)

Use `voice_prefs` whenever the user asks to **remember, change, inspect, or remove** recurring creative preferences so future turns automatically inherit them:

- `action: "get"` — inspect current `ttsVoice`, `ttsRate`, `ttsPitch`, `pronunciations`, `customVoices`, and whether host settings are `writable`.
- `action: "set_default"` — update default `voice` / `persona` (supports fuzzy keywords like `"深夜"`, `"纪录片"`, `"粤语男声"`), `rate` (e.g. `"+10%"`, `"-10%"`), and/or `pitch` (e.g. `"+2Hz"`, `"-1st"`).
- `action: "add_pronunciation"` / `"remove_pronunciation"` — persist or remove `{ word, alias }` pronunciation rules (live-reloaded immediately).
- `action: "save_custom_voice"` / `"remove_custom_voice"` — save or delete a named `customVoices` alias (combining `voice`/`persona`, `rate`/`pitch`, `instructions`, and/or workspace-bounded `referenceAudio` + `referenceText`).
- **Security & read-only guardrails**:
  - `voice_prefs` ONLY touches creative preferences (`ttsVoice`, `ttsRate`, `ttsPitch`, `pronunciations`, `customVoices`). It NEVER reads or writes API keys, base URLs, `proxyUrl`, or `ttsEngine`/`asrEngine` (direct users to **DSH Settings → Plugins → Voice** for credentials/engine switching).
  - If host settings are read-only (`writable: false`), inform the user clearly and apply their requested preferences directly in the current `voice_tts` call instead.

---

## 4. Direct File Synthesis, Target Duration, Interactive Player, Pauses & Chapters

- **Do not copy large `.md` or `.txt` files into `text`.** Pass `inputFile` directly to `voice_tts` (supports up to `100,000` chars with automatic sentence/clause chunking and keep-alive Edge WSS pooling):
  ```json
  {
    "scene": "audiobook",
    "inputFile": "docs/article.md",
    "output": "article.mp3",
    "subtitleOutput": "article.srt",
    "chaptersOutput": "article-chapters.md",
    "createPlayer": true
  }
  ```
- **Target duration fitting (`targetDurationSec`)**:
  - Pass `targetDurationSec` (`3–3600` seconds) for ads, short videos, elevator pitches, or tight segments. Works across `text`, `inputFile`, and `segments`.
  - If synthesized audio exceeds `targetDurationSec * 1.05`, `voice_tts` re-synthesizes once with calibrated rate (`scaleRatePercent`); if still `> 1.03x` and local `ffmpeg` is present, it runs pitch-preserving `atempo` window fitting and returns `targetDurationSec` + `durationAdjusted: true`.
- **Self-contained interactive HTML5 player (`createPlayer` / `playerOutput`)**:
  - Set `createPlayer: true` (outputs `<stem>.player.html` next to the MP3) or specify `playerOutput: "episode-player.html"`.
  - Automatically collects cues even when `subtitleOutput` is not requested, and bundles synchronized clickable subtitles, clickable chapter navigation, playback speed (`0.75x–2x`), dark/light styling, and audio download with strict XSS escaping.
- **Inline speech pause tags (`[pause:500ms]`, `[break:600ms]`, `[停顿0.6s]`)**:
  - Embed pause tags (`50ms–10s`) inside `text`, `inputFile`, or `segments[]`. Synthesized seamlessly across Edge and OpenAI/SiliconFlow/custom engines with matched-sample-rate MP3 silence frames, and stripped automatically from `.srt`/`.vtt`/`.ass` subtitles and interactive player cues.
- **Word-boundary-safe pronunciation lexicon (`autoPronunciations` & `pronunciations`)**:
  - `autoPronunciations` defaults to `true`, applying conservative ASCII word-boundary-safe tech rules (`Nginx`, `SQL`, `K8s`, `Kubernetes`, `CLI`, `GUI`, `OAuth`, `PostgreSQL`, `kubectl`, `GraphQL`, `WebSocket`). Settings `pronunciations` and per-call `pronunciations` merge on top and take precedence.
  - ASCII words enforce word boundaries so `OS` matches `"Mac OS"` and `"OS系统"` while never corrupting `"POST"` or `"BUILD"`. Pass `autoPronunciations: false` only if the user explicitly wants raw un-aliased reading.
- **Audiobook & Markdown chapters (ID3v2.3 `CHAP`/`CTOC` + `chaptersOutput`)**:
  - Multi-heading Markdown (`#` / `##` / `###`, ignoring code fences) in `inputFile`, or `title` on `segments[]`, automatically embeds native clickable MP3 `CHAP`/`CTOC` chapters, returns `chapters: [{ title, startMs, endMs }]`, renders chapter timestamps directly in chat, and optionally exports `chapters.md`/`.txt` or `chapters.json` via `chaptersOutput`.

---

## 5. Multi-Speaker Podcasts, BGM Auto-Ducking, Loudness & Graceful Degradation

Produce multi-host dialogues with clickable MP3 chapters, BGM auto-ducking, `-16 LUFS` loudness mastering, and an interactive web player in one `voice_tts` call:

```json
{
  "scene": "podcast",
  "segments": [
    {
      "title": "开场与看点",
      "persona": "播客女",
      "text": "欢迎收听本期技术早报 [pause:400ms] 今天聊聊最新升级。",
      "pauseMs": 350
    },
    {
      "title": "核心亮点拆解",
      "persona": "播客男",
      "text": "现在场景预设、自动控时长和交互播放器都能一句话搞定。",
      "rate": "+5%",
      "pauseMs": 300
    }
  ],
  "bgmFile": "assets/bgm.mp3",
  "output": "weekly-podcast.mp3",
  "subtitleOutput": "weekly-podcast.srt",
  "chaptersOutput": "weekly-podcast-chapters.md",
  "createPlayer": true
}
```

- **Graceful FFmpeg degradation**: `scene: "podcast"` enables `normalizeLoudness: true` automatically. If local `ffmpeg` is unavailable, `voice_tts` does NOT fail the user's wish — it skips `-16 LUFS` normalization, delivers the clean MP3, and reports a friendly note in `warnings`.
- **BGM Auto-Ducking (`bgmFile`, `bgmVolume`, `bgmDucking`)**: loops workspace `bgmFile` at `bgmVolume` (`0.02–1.0`, default `0.18`), applies FFmpeg `sidechaincompress` ducking (`bgmDucking: true` by default), fades out cleanly, and chains `-16 LUFS` loudness mastering before embedding `CHAP`/`CTOC` chapters. Requires local `ffmpeg`.
- **Emotion, acting & paralinguistics (`instructions`)**: pass acting prompts via `instructions` on `voice_tts` or `segments[]` (SiliconFlow `CosyVoice2-0.5B` `<|endofprompt|>` + `[laughter]`/`[breath]`; OpenAI `gpt-4o-mini-tts`; custom Kokoro blends like `zf_xiaobei*0.6+zf_xiaoni*0.4`).
- **Oral script adaptation**: when turning bullet notes/changelogs into spoken briefings, rewrite tables, code identifiers, and bare URLs into natural spoken sentences with `[pause:500ms]` beats (~220–260 Chinese chars or 130–160 English words per minute at `+0%`).

---

## 6. Short-Video Karaoke `.ass` Subtitles & Zero-Drift `.srt`/`.vtt` Dubbing

- **Short-video clause/word captions & `.ass` karaoke**:
  - `scene: "short-video"` automatically sets `persona: "energetic-anchor"`, `subtitleGranularity: "clause"`, and `maxCharsPerCue: 14`.
  - Pass `subtitleOutput: "clip.ass"` to emit `1080x1920` SubStation Alpha (`v4.00+`) karaoke captions with genuine `{\kf...}` word-level highlight timing ready for `dsh-ffmpeg` (`subtitles=clip.ass`) or `dsh-remotion`.
- **Zero-drift reverse `.srt`/`.vtt` dubbing (`subtitleInput`)**:
  - Pass `scene: "dubbing"` + `subtitleInput: "video.srt"` (or `.vtt`, ≤200 cues) to `voice_tts`. Over-window cues (`>8%`) automatically re-synthesize faster (`-30%` to `+85%`), dense cues still `>3%` over apply pitch-preserving FFmpeg `atempo`, and matched-sample-rate silences eliminate cumulative drift.

---

## 7. Zero-Shot Voice Cloning (`referenceAudio`) & Custom Aliases

- Pass a 5–10s clean workspace audio clip (`≤10 MB`) in `referenceAudio` + `referenceText` on `voice_tts` or `segments[]` (requires `ttsEngine` set to `siliconflow` or `custom`; SiliconFlow caches uploaded `speech:...` URIs per account by SHA-256 hash across segments).
- To make a clone reusable by name across chats, call `voice_prefs({ action: "save_custom_voice", name, referenceAudio, referenceText })` (or suggest the **Voice Studio** sidebar **Mic & Custom Voices** tab when the user wants 8-second browser mic recording directly).

---

## 8. Direct Video STT (`voice_stt`), Diarization & Scoped Health Checks

- **Direct video container transcription**: pass `.mp4`, `.mkv`, `.mov`, `.avi` (plus `.flv`/`.wmv`/`.m4v`/`.ts`/`.mts`) straight to `voice_stt({ audio: "lecture.mp4", subtitleOutput: "lecture.srt" })`. When local `ffmpeg` is available, `dsh-voice` automatically strips video (`-vn`) into 16kHz mono audio before uploading.
- **Speaker diarization (`diarize: true`)**: separates stereo channels via local `ffmpeg` (`说话人 A` / `说话人 B`) or infers turns from `verbose_json`, returning `speakers`, `[说话人 A 00:01]` paragraphs, and speaker-prefixed `.srt`/`.vtt`/`.ass` subtitles.
- **Domain accuracy & >25 MB audio**: pass domain terms in `prompt` (`"DeepSeek Harness, Cordis"`), and set `autoCompress: true` for >25 MB recordings. Loopback `custom` ASR (`127.0.0.1`/`localhost`) needs no `asrApiKey`.
- **Scoped offline diagnostics (`voice_health`)**: run `voice_health({ scope: "tts" })` for TTS-only issues, `voice_health({ scope: "stt" })` for transcription issues, or `voice_health()` for full offline engine, voice/persona/alias, prosody, proxy (`http://`, `https://`, `socks5://`, `socks5h://`), and key verification.
