# dsh-voice 使用说明

[返回简介](../README.md) · [更新记录](../CHANGELOG.md) · [验证记录](VALIDATION.md)

## 最快 3 步用起来

### 第 1 步：了解零配置范围与可选 TTS / ASR 配置

- **文字转语音（`voice_tts` / `voice_list` / `voice_preview`）零配置即用**：默认使用 Edge 神经语音，无需任何 API 密钥即可按语种/标签筛选音色、生成网页试听页、直读长文并合成 MP3 与 `.srt`/`.vtt` 字幕；如需切换 OpenAI 兼容或 SiliconFlow TTS 作为备用引擎，可在设置中调整 `ttsEngine`。
- **录音转文字（`voice_stt`）按需填密钥（本地回环免密）**：
  - **推荐方式**：打开 **DSH → 设置 → 插件 → 语音（`dsh-voice`）**，选择 `asrEngine`（默认 `groq`，可选 `openai`、`siliconflow` 或 `custom`），填入 `asrApiKey`（自动脱敏，**保存立即生效、无需重启**；当 `custom` 指向 `127.0.0.1` / `localhost` 本地 Whisper 服务时无需密钥）；
  - **命令行 / 环境变量方式**：设置环境变量 `DSH_VOICE_ASR_KEY`（及可选 `DSH_VOICE_TTS_KEY`），或在 `cordis.patch.yml` 中配置：

```yaml
- id: voice
  name: 'dsh-voice'
  config:
    ttsEngine: edge                       # edge | openai | siliconflow | custom
    ttsVoice: zh-CN-XiaoxiaoNeural        # 默认朗读音色（保存即生效）
    ttsRate: '+0%'                        # 默认语速，如 +15% 或 -10%
    ttsPitch: '+0Hz'                      # 默认音调，如 +2Hz 或 -1Hz
    # ttsBaseUrl: https://api.siliconflow.cn/v1  # 非 edge 引擎时可自定义
    # ttsModel: FunAudioLLM/CosyVoice2-0.5B
    # ttsApiKey: sk-...                   # 推荐在 DSH 设置页填写或用 DSH_VOICE_TTS_KEY
    asrEngine: groq                       # groq | openai | siliconflow | custom
    asrModel: whisper-large-v3-turbo      # 可选；留空按引擎预设自动填入
    # asrApiKey: gsk_...                  # 推荐在 DSH 设置页填写或用 DSH_VOICE_ASR_KEY（本地回环 custom 可留空）
    # proxyUrl: socks5://127.0.0.1:1080   # 支持 http://、https://、socks5://、socks5h://
```

### 第 2 步：在工作区内准备文稿或录音

为了防止路径越界读取隐私文件，所有 `voice_tts` 直读文稿（`inputFile`）、待转写音频（`audio`）以及生成的 MP3 / `.txt` / `.srt` / `.vtt` / 试听页都严格限制在**当前会话工作区**内；外部文件请先复制进工作区目录。

### 第 3 步：试听选定音色，合成长文/播客/字幕或转写纪要

不确定哪个声音好听时，先让助手用 `voice_list` 按语种或标签筛选，再用 `voice_preview` 生成短试听样例与交互式 `voice_previews/index.html` 浏览器试听页；插件内建 `skills/voice-workflow/SKILL.md` 工作流指南，助手会自动优先使用 `inputFile`、Markdown 清理、`segments` 播客编排与字幕导出。

---

## 平时怎么对助手说（可直接复制的自然语言示例）

- **筛选音色并生成网页试听页对比（不盲猜 ID）**
  > 按 `podcast` 标签看看中英文音色清单，挑 4 个生成短试听并打开 `voice_previews/index.html` 让我选。
- **直接朗读 Markdown 长文并导出同步字幕**
  > 用 `zh-CN-XiaoxiaoMultilingualNeural` 直接读取工作区 `guide.md` 合成 `guide.mp3`，同时导出 `guide.srt`。
- **制作双人对话播客 MP3**
  > 把这篇更新整理成双人播客，女声用 `zh-CN-XiaoxiaoMultilingualNeural`，男声用 `zh-CN-YunyiMultilingualNeural`，导出到 `episode.mp3` 和 `episode.srt`。
- **大体积录音转写 + 专有名词纠偏 + 字幕导出**
  > 把工作区里的 `interview.m4a` 转写成中文（如果超过 25MB 自动压缩分段，提示词加上：DeepSeek Harness、Cordis），存成 `interview.txt` 和 `interview.srt`。
- **按范围执行离线配置自检**
  > 跑一下语音插件自检（分别看看 `ttsReady` 和 `sttReady`），检查默认音色、语速音调格式、代理和 ASR 配置状态。

---

## 常见卡点自检

遇到问题先让助手执行 `voice_health`（纯本地检查，不发起网络请求；支持 `scope: "tts" | "stt" | "all"`，并分别返回 `ttsReady` 与 `sttReady`）：

| 现象 | 常见原因 | 一步修复 |
| :--- | :--- | :--- |
| 自检提示「缺 ASR 密钥」 | 尚未填写 `asrApiKey` 且未设 `DSH_VOICE_ASR_KEY` | 若只需朗读配音可忽略（`ttsReady` 为 `true` 时 `voice_tts` 正常可用），或传 `scope: "tts"`；本地 Whisper 可设 `asrEngine: custom` 指向 `127.0.0.1` / `localhost` 免密运行 |
| 提示音色 ID、语速或音调不合法 | `ttsVoice` 不符合 Edge 格式，或 `ttsRate`/`ttsPitch` 非 `+10%`/`+2Hz` 格式 | 用 `voice_list` 查看合法 ID，在设置页修正 `ttsVoice`、`ttsRate`、`ttsPitch` |
| `voice_tts` 或 `voice_stt` 报网络失败 | 当前网络无法直连 Edge 朗读服务或外网 ASR 接口 | 在 **DSH「设置 → 插件 → 语音」**填写 `proxyUrl`（支持 `http://`、`https://`、`socks5://`、`socks5h://`，保存即生效） |
| 提示文件必须位于会话工作区内 | 传入了工作区外部路径或越界符号链接 | 将文稿或录音复制到当前会话工作区文件夹内再执行 |
| 音频超过 25MB 报超限 | OpenAI / Groq 兼容 ASR 单文件上限 25MB | 调用 `voice_stt` 时传入 `autoCompress: true`（调用本机 `ffmpeg` 自动转码压缩/分段），或先用 `dsh-ffmpeg` 处理 |
| ASR 返回 3xx 重定向被拦截 | 为防音频与密钥被转发到第三方主机，插件拒绝自动跟随重定向 | 将 `asrBaseUrl` 或 `ttsBaseUrl` 直接改为服务商最终无跳转的 `/v1` 地址 |
| 同名文件没有覆盖旧文件 | 默认 `overwrite: false` 防误删，自动追加 `_1`、`_2` 序号 | 查看工具返回的实际落盘路径，或在设置中显式开启 `overwrite` |

---

## 工具与安全边界参考

### 注册工具清单（共 5 个）

| 工具 | 作用 | 关键参数与说明 |
| :--- | :--- | :--- |
| `voice_tts` | 文字/文稿/播客合成 MP3 与字幕 | 支持 `text`、`inputFile`（≤10 万字自动分片拼接）、`cleanMarkdown`（`.md` 默认开启）、`segments`（最多 50 段多角色对话与 `pauseMs`）、`subtitleOutput`（`.srt`/`.vtt`）、`voice`、`rate`、`pitch`、`output` |
| `voice_stt` | 音频转文字与字幕（零拷贝流式上传） | `audio` 必填；支持 `autoCompress`（>25MB 用本机 `ffmpeg` 自动压缩分段）、`timestamps`、`subtitleOutput`（`.srt`/`.vtt`）、`model`、`language`、`prompt`、`output`、`engine` |
| `voice_list` | 查看并筛选内置多语种与方言音色目录 | 可选 `locale`（语种/地区子串）、`gender`（`Female`/`Male`）、`tag`（如 `podcast`/`multilingual`/`dialect`） |
| `voice_preview` | 有界并发（≤3）批量试听并生成网页试听页 | 可选 `voices`（≤8）、`text`（≤200 字）、`outputDir`、`htmlIndex`（默认 `true`，生成 `voice_previews/index.html`） |
| `voice_health` | 本地配置自检（不触网） | 可选 `scope`（`all`/`tts`/`stt`），返回 `ttsReady` / `sttReady` 并校验引擎、音色、语速音调、代理与密钥 |

### 引擎预设与安全细节

- **引擎预设**：
  - `asrEngine`：`groq`（`whisper-large-v3-turbo`）、`openai`（`whisper-1`）、`siliconflow`（`FunAudioLLM/SenseVoiceSmall`）、`custom`（支持本地回环地址免密钥）。
  - `ttsEngine`：`edge`（零密钥默认）、`openai`（`gpt-4o-mini-tts`）、`siliconflow`（`FunAudioLLM/CosyVoice2-0.5B`）、`custom`（OpenAI `/audio/speech` 兼容端点）。
- **工作区沙箱与符号链接防护**：所有读写路径解析后必须位于 `session.header.cwd` 内；拒绝跟随符号链接覆写，新建文件使用 `O_EXCL` 防止并发竞态覆盖，转写 `.txt` 与字幕在类 Unix 系统以 `0600` 权限写入。
- **防凭据串台与防重定向泄露**：ASR 与 TTS 请求固定发往配置端点，拒绝模型调用时用 `engine` 临时切换厂商，遇 `3xx` 重定向立即中止请求。
- **动态超时与随时可取消**：`timeoutMs` 随设置热更新即时生效；`voice_tts`、`voice_preview` 与 `voice_stt` 全程透传 `exec.signal`，取消即关闭连接或中止压缩/上传。

## 安装、卸载与开发

```bash
# 安装（桌面版把 web 换为 desktop）
dsh plugin --profile web add dsh-voice

# 卸载
dsh plugin --profile web remove dsh-voice

# 本地构建与离线单元测试
pnpm install
pnpm test
```

## License

主体代码采用 MIT；独立的 Edge v2 令牌计算模块遵循 LGPL-3.0-only，详见 [第三方声明](../THIRD_PARTY_NOTICES.md)。
