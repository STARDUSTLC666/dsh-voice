# dsh-voice

[中文](README.md)

![dsh-voice whale girl plugin cover](https://raw.githubusercontent.com/STARDUSTLC666/dsh-voice/master/assets/cover-whale-girl.png)

Generate speech from text or transcribe audio through a compatible API.

[![npm](https://img.shields.io/npm/v/dsh-voice)](https://www.npmjs.com/package/dsh-voice) [![downloads](https://raw.githubusercontent.com/STARDUSTLC666/dsh-suite/npm-downloads/assets/dsh-voice-downloads.svg)](https://www.npmjs.com/package/dsh-voice)

Feedback and contributions are welcome: report [issues](https://github.com/STARDUSTLC666/dsh-voice/issues) or submit [pull requests](https://github.com/STARDUSTLC666/dsh-voice/pulls).

## What it does

- Generate speech using the Edge online read-aloud service.
- List voices and generate batch voice previews.
- Transcribe audio using an OpenAI-compatible ASR endpoint.

## Install

In DSH Desktop, install `dsh-voice` from the Plugins panel. If the bundled dsh command is available:

```bash
dsh plugin --profile desktop add dsh-voice
```

For the web version, replace `desktop` with `web`. Restart DSH after installation.

## Start using it

Ask to turn text into a Chinese MP3 and preview two voices. After configuring ASR, you can also request audio transcription.

## Requirements and configuration

Speech synthesis requires network access. Transcription needs an ASR endpoint and key. A plugin-specific proxy can be configured.

Detailed configuration, tool arguments and troubleshooting are in the [usage guide](docs/USAGE.en.md). For standalone development, follow the Node requirement in [package.json](package.json).

## Documentation

- [Usage and troubleshooting](docs/USAGE.en.md)
- [Changelog](CHANGELOG.md)
- [Validation scope and history](docs/VALIDATION.md)
- [Report a problem or suggest a feature](https://github.com/STARDUSTLC666/dsh-voice/issues)

## License

[MIT](LICENSE)
