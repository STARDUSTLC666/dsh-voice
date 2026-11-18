[简体中文](README.md) · **English**

# Voice

**Turn text into natural speech and recordings into clean transcripts.**

Voice plugin for DeepSeek Harness (`>=0.2.2-rc.3`): provides zero-key Edge neural text-to-speech (with 300+ live online voices, 45+ all-age/dialect built-ins, and 10 ready-made personas) alongside OpenAI/SiliconFlow/custom engines (supporting emotion/acting instructions, Kokoro voice blending, and 5–10s zero-shot voice cloning), direct file synthesis with Markdown cleanup, multi-speaker podcasts with `-16 LUFS` loudness mastering, synchronized `.srt`/`.vtt` subtitles, interactive browser previews, and Groq/OpenAI/SiliconFlow/local Whisper speech-to-text (STT) strictly scoped to your session workspace.

[![npm](https://img.shields.io/npm/v/dsh-voice)](https://www.npmjs.com/package/dsh-voice) [![downloads](https://raw.githubusercontent.com/STARDUSTLC666/dsh-suite/npm-downloads/assets/dsh-voice-downloads.svg)](https://www.npmjs.com/package/dsh-voice) [![total downloads](https://raw.githubusercontent.com/STARDUSTLC666/dsh-suite/npm-downloads/assets/dsh-voice-total-downloads.svg)](https://www.npmjs.com/package/dsh-voice)

**[Install](#install) · [Get Started in 3 Steps](#get-started-in-3-steps) · [Full Guide](https://github.com/STARDUSTLC666/dsh-voice/blob/master/docs/USAGE.en.md)**

<picture>
  <source media="(prefers-color-scheme: dark) and (max-width: 640px)" srcset="https://raw.githubusercontent.com/STARDUSTLC666/dsh-voice/master/docs/assets/intro/workflow-en-mobile-dark.svg">
  <source media="(max-width: 640px)" srcset="https://raw.githubusercontent.com/STARDUSTLC666/dsh-voice/master/docs/assets/intro/workflow-en-mobile-light.svg">
  <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/STARDUSTLC666/dsh-voice/master/docs/assets/intro/workflow-en-dark.svg">
  <img src="https://raw.githubusercontent.com/STARDUSTLC666/dsh-voice/master/docs/assets/intro/workflow-en-light.svg" alt="Turn text into speech and recordings into text. · workflow illustration" width="100%">
</picture>

## Highlights

- **300+ Live Edge Voices, All-Age/Dialect Built-ins & 10 Personas**: `voice_list({ online: true })` fetches and caches Microsoft's live 300+ neural voice catalog for 24h, falling back automatically offline to 45+ curated built-ins spanning child (`Xiaoshuang`/`Xiaoyou`), teen/anime (`Yunxia`), mature/documentary (`Yunze`/`Xiaoqiu`), elder (`Xiaorui`), passionate (`Yunhao`), and dialects (Northeast, Shaanxi, Sichuan, Henan, Shandong, Cantonese M/F, Taiwanese M/F). Ten built-in `persona` recipes (`late-night-radio`, `documentary-narrator`, `anime-boy`, etc.) work directly in `voice_tts`, `segments[]`, and `voice_preview`.
- **Emotion Acting, Voice Blending & Zero-Shot Cloning**: Pass natural-language acting prompts via `instructions` (mapped automatically to `<|endofprompt|>` with `[laughter]` / `[breath]` support on SiliconFlow `CosyVoice2-0.5B`, and sent natively to OpenAI `gpt-4o-mini-tts`), plus Kokoro voice-blending expressions (`zf_xiaobei*0.6+zf_xiaoni*0.4`) on custom endpoints. Clone any voice from a 5–10s workspace audio clip (`referenceAudio` + `referenceText` on `siliconflow`/`custom`) or save live-reloaded aliases in Settings `customVoices`.
- **Long-form File Synthesis, Podcasts, Loudness Mastering & Subtitles**: Read workspace `.md`/`.txt` files via `inputFile` with automatic Markdown cleanup and sentence-boundary chunking up to 100k chars; compose multi-speaker `segments` with `pauseMs` silences and optional `-16 LUFS` broadcast mastering (`normalizeLoudness: true` via local `ffmpeg`); export synchronized `.srt`/`.vtt` subtitles alongside TTS or STT outputs.
- **Interactive Auditions, Oversize Audio & Proxy Support**: `voice_preview` auditions raw voice IDs, `persona` names, and `customVoices` aliases into `voice_previews/index.html` with speed controls and one-click ID copy; `voice_stt` supports `groq`, `openai`, `siliconflow`, and keyless loopback `custom` Whisper with `autoCompress: true` for >25 MB audio; native `http://`, `https://`, `socks5://`, `socks5h://` proxy support applies live on save.

## Install

Open **Plugins** in the DSH desktop app and install `dsh-voice`, or use the CLI:

```bash
dsh plugin --profile desktop add dsh-voice
```

For the web profile, replace `desktop` with `web`. Restart DSH once after installing. Requires DSH `>=0.2.2-rc.3`. The plugin bundles the `voice-workflow` skill so your assistant automatically follows best practices for voice discovery, personas, cloning, podcasts, subtitles, and transcription.

<a id="start-using-it"></a>
## Get Started in 3 Steps

1. **TTS and voice personas work out of the box (zero API keys)**: Open a DSH session in your workspace to discover 300+ online Edge voices, use 10 built-in `persona` presets, audition samples, narrate long Markdown files, produce multi-speaker podcasts, and export `.srt`/`.vtt` subtitles immediately.
2. **Optional TTS engines (acting/cloning) or ASR keys (loopback Whisper is keyless)**: Open **DSH Settings → Plugins → Voice (`dsh-voice`)** — switch `ttsEngine` to `siliconflow`, `openai`, or `custom` for emotion `instructions` or `referenceAudio` cloning (and optionally save reusable `customVoices` aliases, live on save). For transcription, pick `asrEngine` (`groq`, `openai`, `siliconflow`, or `custom`) and add `asrApiKey` (loopback `127.0.0.1`/`localhost` needs no key).
3. **Preview, synthesize, or transcribe inside your workspace**: Keep scripts, reference clips, and recordings inside your session workspace; generated MP3s, `.txt` transcripts, `.srt`/`.vtt` subtitles, and preview pages stay safely inside the workspace and auto-number instead of overwriting existing files.

## Copy-Ready Prompts for Everyday Work

- **Discover online voices & personas and audition in the browser**
  > Fetch online voices tagged `podcast` and generate previews in `voice_previews/index.html` comparing them with `late-night-radio` and `bilingual-tech-female` so I can pick one.
- **Turn a Markdown report into a balanced two-host podcast with subtitles**
  > Read `weekly-report.md` in this workspace and turn it into a two-host dialogue using `podcast-host-female` and `podcast-host-male` with `normalizeLoudness` enabled, saving `podcast.mp3` and `podcast.srt`.
- **Zero-shot clone or emotion-directed voiceover (SiliconFlow / custom engine)**
  > Clone the voice from `sample_ref.wav` (transcript: "Hello, I am Alex, nice to meet you") in this workspace and read this welcome script with a warm, cheerful tone, saving `welcome.mp3`.
- **Transcribe a large meeting recording with subtitles & action items**
  > Transcribe `meeting.m4a` in this workspace (auto-compress if over 25 MB), save `meeting.txt` and `meeting.srt`, and list the action items.

## Quick Troubleshooting Checklist

| Symptom | Likely Cause | Fix |
| :--- | :--- | :--- |
| Health check says `asrApiKey` is missing, but you only want TTS | ASR key is only needed for audio-to-text transcription | **Keep using TTS directly** — health check reports `ttsReady` / `sttReady` separately and supports `scope: "tts"` |
| `referenceAudio` fails saying cloning engine is required | Default `edge` engine does not support zero-shot reference cloning | Switch `ttsEngine` to `siliconflow` or `custom` in **DSH Settings → Plugins → Voice** (applies live) |
| `normalizeLoudness` fails saying `ffmpeg` is missing | `-16 LUFS` broadcast loudness mastering uses local `ffmpeg` | Install `ffmpeg` locally (or pre-process with `dsh-ffmpeg`), or omit `normalizeLoudness` |
| "Must stay inside the session workspace" error | Script, recording, reference clip, or output resolves outside workspace | Copy the file into the current DSH workspace folder first |
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
