# dsh-voice 使用说明

[返回简介](../README.md) · [更新记录](../CHANGELOG.md) · [验证记录](VALIDATION.md)

## 最快 3 步用起来

### 第 1 步：了解零配置许愿式范围、对话记偏好与可选配置

- **许愿式（Wish-Driven）聊天优先即用（`voice_tts` / `voice_preview` / `voice_list` / `voice_prefs`）**：默认使用零密钥 Edge 神经语音（内置 Keep-Alive WebSocket 连接池与瞬断重试），无需任何 API 密钥即可在对话框里一句话直达成品——支持 **6 大创作场景预设（`scene`：`podcast`/`short-video`/`audiobook`/`briefing`/`story`/`dubbing` 及中文别名）**、**自然语言风格与方言模糊选声（`"深夜"`、`"纪录片"`、`"播客女"`、`"粤语男声"`、`"东北话"` 等）**、**目标时长自动校准（`targetDurationSec`，`3–3600` 秒）**、**内置词边界安全技术发音词典（`autoPronunciations`，默认开启）**、**自包含 HTML5 交互播放器（`createPlayer` / `playerOutput` → `<文件名>.player.html`）**、**按场景一键精选试听（`voice_preview({ scene })`）**，以及通过 **`voice_prefs`** 在对话中持久化记住默认音色/人设、语速音调、发音词典与自定义角色别名。内置 **51 个实测可用 Edge 音色** + 联网 300+ 实时音色 + 10 大 `persona` 人设；如需情绪指令（`instructions`）、Kokoro 混音或零样本参考克隆（`referenceAudio`），可在设置中切换 `ttsEngine` 为 `siliconflow`、`openai` 或 `custom`。
- **按需打开 5 主题 Voice Studio 侧边栏工作台**：当你希望使用浏览器麦克风 **8 秒录音一键生成克隆角色**（落盘 `voice_clones/` + 自动 ASR 提取参考台词 + 自动注册 `customVoices`）、可视化多角色对话编排或「工作区成品库」页面内回放时，可在 DSH 侧边栏随时打开 Voice Studio（同步 **原生清透 / 米白纸感 / Claude 暖书卷 / 8-Bit 像素 / 晴空薄荷** 5 套主题与 Coachmark 引导）。
- **音视频转文字（`voice_stt`）按需填密钥（支持视频直传抽音与本地回环免密）**：
  - **推荐方式**：打开 **DSH → 设置 → 插件 → 语音（`dsh-voice`）**，选择 `asrEngine`（默认 `groq`，可选 `openai`、`siliconflow` 或 `custom`），填入 `asrApiKey`（自动脱敏，**保存立即生效、无需重启**；当 `custom` 指向 `127.0.0.1` / `localhost` 本地 Whisper 服务时无需密钥）；支持直接传入 `.mp4` / `.mkv` / `.mov` / `.avi` 视频容器自动抽音转写；
  - **自定义音色别名（`customVoices`）与词边界发音词典（`pronunciations`）**：除了在 DSH 设置或工作台配置外，现在可以直接在聊天框对助手说「以后默认用…… / 记住把 X 读成 Y / 把参考音存成角色」，由 `voice_prefs` 热更新持久化；
  - **命令行 / 环境变量方式**：设置环境变量 `DSH_VOICE_ASR_KEY`（及可选 `DSH_VOICE_TTS_KEY`），或在 `cordis.patch.yml` 中配置：

```yaml
- id: voice
  name: 'dsh-voice'
  config:
    ttsEngine: edge                       # edge | openai | siliconflow | custom
    ttsVoice: zh-CN-XiaoxiaoNeural        # 默认音色 ID、内置 persona 或 customVoices 别名（保存即生效）
    ttsRate: '+0%'                        # 默认语速，如 +15% 或 -10%
    ttsPitch: '+0Hz'                      # 默认音调，如 +2Hz 或 -1Hz
    # ttsBaseUrl: https://api.siliconflow.cn/v1  # 非 edge 引擎时可自定义
    # ttsModel: FunAudioLLM/CosyVoice2-0.5B
    # ttsApiKey: sk-...                   # 推荐在 DSH 设置页填写或用 DSH_VOICE_TTS_KEY
    # pronunciations:
    #   - word: Nginx                     # 内置技术词典已默认涵盖常见术语，此处可增补或覆盖
    #     alias: Engine X
    #   - word: OS                        # ASCII 词边界保护：匹配 "Mac OS"/"OS系统"，绝不误伤 "POST"
    #     alias: Operating System
    #   - word: Cordis
    #     alias: 科迪斯
    # customVoices:
    #   - name: 老王
    #     persona: documentary-narrator
    #     rate: '-5%'
    #   - name: 混音女声
    #     voice: 'zf_xiaobei*0.6+zf_xiaoni*0.4'
    #   - name: 小智克隆
    #     referenceAudio: voice_clones/clone-xiaozhi.webm
    #     referenceText: '你好，这是我的声音参考样本。'
    asrEngine: groq                       # groq | openai | siliconflow | custom
    asrModel: whisper-large-v3-turbo      # 可选；留空按引擎预设自动填入
    # asrApiKey: gsk_...                  # 推荐在 DSH 设置页填写或用 DSH_VOICE_ASR_KEY（本地回环 custom 可留空）
    # proxyUrl: socks5://127.0.0.1:1080   # 支持 http://、https://、socks5://、socks5h://
```

### 第 2 步：在工作区内准备文稿、字幕、BGM、参考音频或音视频

为了防止路径越界读取隐私文件，所有 `voice_tts` 直读文稿（`inputFile`）、反向卡点字幕（`subtitleInput`，≤200 条）、播客背景音乐（`bgmFile`）、零样本克隆参考音频（`referenceAudio`，≤10MB，含 `voice_prefs` 保存角色时的路径校验）、待转写音视频（`audio`）以及生成的 MP3 / `.txt` / `.srt` / `.vtt` / `.ass` / `chaptersOutput` / `.player.html` / `voice_clones/` / `voice_outputs/` / 试听页都严格限制在**当前会话工作区**内；外部文件请先复制进工作区目录。

### 第 3 步：一句话许愿直达成品 → 按反馈微调或持久化记住偏好

不确定选哪个声音时，只需说「帮我挑几个适合播客/方言/深夜电台的声音」，助手直接调用 `voice_preview({ scene })` 一步生成 3–4 个对比样例与 `voice_previews/index.html`（无需翻阅 300 条列表）；需要精确按地区/标签检索时再调用 `voice_list({ online: true, locale, gender, tag })`（聊天渲染超 60 条自动折叠为前 40 条 + 地区分布摘要，完整列表仍在结构化结果中）。插件内建许愿式 `skills/voice-workflow/SKILL.md`，助手会自动组合 `scene`、模糊风格词、`targetDurationSec`、`createPlayer` 与 `voice_prefs` 在 1–2 次工具调用内交付成品。

---

## 平时怎么对助手说（可直接复制的许愿示例）

- **按场景一键精选试听对比**
  > 帮我挑几个适合播客（或方言 / 深夜电台 / 短视频）的声音生成短试听，打开 `voice_previews/index.html` 让我选。
- **把多标题 Markdown 长文做成带原生 MP3 章节书签与 HTML5 交互播放器的有声书**
  > 把工作区里的 `guide.md` 做成沉稳纪录片风格的有声书，输出 `guide.mp3`（带原生章节书签）、`guide.srt`、`guide-chapters.md` 和可直接点击字幕/章节跳转的 `guide.player.html`。
- **导出 30 秒内竖屏短视频口播 + `.ass` 卡拉 OK 逐词高亮字幕（含内联停顿）**
  > 按短视频场景朗读这段文案（保留 `[pause:500ms]` 停顿，总时长压在 30 秒以内），输出 `clip.mp3` 和带 `\kf` 逐词高亮的 `clip.ass` 方便传给 `dsh-ffmpeg` 烧录。
- **制作带章节书签、BGM 自动闪避与响度均衡的双人对话播客**
  > 把这篇更新整理成双人科技播客（女主持用「双语女」，男主持用「双语男」，配上 `assets/bgm.mp3` 开启自动闪避和响度均衡），导出 `episode.mp3`、`episode.srt`、`episode-chapters.md` 和交互播放器。
- **对话动口持久化记住偏好（`voice_prefs`）**
  > 以后默认用「纪录片」声音、语速 `-5%`；另外记住把 `Cordis` 读成 `科迪斯`，再帮我把工作区里的 `ref.wav` 存成一个叫「老王」的自定义角色。
- **按 `.srt` / `.vtt` 字幕时间轴零漂移反向配音 + 词边界安全发音词典**
  > 按 `dubbing` 场景用「双语男」对工作区 `video.srt` 做零漂移反向配音（自动保护 `OS`/`Nginx`/`SQL` 发音且绝不误伤 `POST`，字幕保持原拼写），保存 `dubbed.mp3` 和 `dubbed.srt` 并汇报精确 `durationSec`。
- **直接转写 `.mp4` 视频或大体积会议录音 + 说话人区分 + 字幕导出**
  > 直接把工作区里的 `lecture.mp4` 抽音转写成中文（开启 `diarize: true` 区分说话人，提示词加上：DeepSeek Harness、Cordis），存成 `lecture.txt` 和 `lecture.srt`。
- **按范围执行离线配置自检**
  > 跑一下语音插件自检（分别看看 `ttsReady` 和 `sttReady`），检查默认音色/人设/自定义别名、语速音调格式、代理和 ASR 配置状态。

---

## 常见卡点自检

遇到问题先让助手执行 `voice_health`（纯本地检查，不发起网络请求；支持 `scope: "tts" | "stt" | "all"`，并分别返回 `ttsReady` 与 `sttReady`）：

| 现象 | 常见原因 | 一步修复 |
| :--- | :--- | :--- |
| 自检提示「缺 ASR 密钥」 | 尚未填写 `asrApiKey` 且未设 `DSH_VOICE_ASR_KEY` | 若只需朗读配音可忽略（`ttsReady` 为 `true` 时 `voice_tts` 正常可用），或传 `scope: "tts"`；本地 Whisper 可设 `asrEngine: custom` 指向 `127.0.0.1` / `localhost` 免密运行 |
| 传入 `referenceAudio` 提示不支持克隆 | 当前 `ttsEngine` 仍为 `edge`（Edge 不支持参考音频克隆） | 在 **DSH「设置 → 插件 → 语音」**将 `ttsEngine` 切为 `siliconflow`（`CosyVoice2-0.5B`）或 `custom`（如本地 GPT-SoVITS / IndexTTS） |
| 播客响度均衡提示 `warnings` 跳过，或视频抽音/`bgmFile`/`atempo` 提示缺 `ffmpeg` | `-16 LUFS` 均衡、视频抽音（`-vn`）、BGM 闪避与 `atempo` 精缩依赖本机 `ffmpeg` | `normalizeLoudness` 缺 `ffmpeg` 时已自动优雅降级输出干净 MP3 并提示 `warnings`；本机安装 `ffmpeg`（或配合 `dsh-ffmpeg`）可启用全部音视频后处理 |
| `voice_prefs` 提示无法持久化写入 | 当前宿主设置处于只读模式（`settings.writable === false`）或未挂载 settings 服务 | 在 **DSH「设置 → 插件 → 语音」**手动保存，或在单次 `voice_tts` 调用中直接传入对应参数 |
| 提示音色 ID、语速或音调不合法 | 传入字符串既非合法 Edge ID 也不匹配内置 `persona`、自然语言风格词或 `customVoices`，或 `rate`/`pitch` 格式不对 | 可直接传风格词（如 `"深夜"`、`"纪录片"`、`"粤语男声"`），或用 `voice_list` 查看合法 ID 并修正格式 |
| `voice_tts` 或 `voice_stt` 报网络失败 | 当前网络无法直连 Edge 朗读服务或外网 ASR 接口 | 在 **DSH「设置 → 插件 → 语音」**填写 `proxyUrl`（支持 `http://`、`https://`、`socks5://`、`socks5h://`，保存即生效） |
| 提示文件必须位于会话工作区内 | 传入了工作区外部路径或越界符号链接（含 `voice_prefs` 的 `referenceAudio`） | 将文稿、字幕、BGM、参考音频或音视频复制到当前会话工作区文件夹内再执行 |
| 音频超过 25MB 报超限 | OpenAI / Groq 兼容 ASR 单文件上限 25MB | 调用 `voice_stt` 时传入 `autoCompress: true`（视频文件会自动抽音压缩，调用本机 `ffmpeg` 自动转码/分段），或先用 `dsh-ffmpeg` 处理 |
| ASR 返回 3xx 重定向被拦截 | 为防音频与密钥被转发到第三方主机，插件拒绝自动跟随重定向 | 将 `asrBaseUrl` 或 `ttsBaseUrl` 直接改为服务商最终无跳转的 `/v1` 地址 |
| 同名文件没有覆盖旧文件 | 默认 `overwrite: false` 防误删，自动追加 `_1`、`_2` 序号 | 查看工具返回的实际落盘路径，或在设置中显式开启 `overwrite` |

---

## 工具与语音工作流参考

### 注册工具清单（共 6 个）

| 工具 | 作用 | 关键参数与说明 |
| :--- | :--- | :--- |
| `voice_tts` | 许愿式合成 MP3、章节、字幕与交互播放器 | 支持高阶场景 `scene`（`podcast`/`short-video`/`audiobook`/`briefing`/`story`/`dubbing` 及中文别名）、模糊风格/方言词 `voice`/`persona`（如 `"深夜"`、`"纪录片"`、`"粤语男声"`）、`targetDurationSec`（`3–3600` 秒，超 5% 自动调速重合成、仍超 3% 用 `ffmpeg atempo` 精压并返回 `durationAdjusted`）、`autoPronunciations`（默认 `true`，内置词边界安全技术发音词典）、`createPlayer` / `playerOutput`（生成自包含 `<文件名>.player.html` HTML5 交互播放器并返回 `playerFile`）、`text`（含 `[pause:500ms]`/`[停顿0.6s]`）、`inputFile`（≤10 万字自动分片；多标题 `.md` 自动写入 MP3 ID3v2 `CHAP`/`CTOC` 章节）、`cleanMarkdown`、`subtitleInput`（`.srt`/`.vtt` 零漂移反向配音）、`segments`（≤50 段，每段支持 `title`/`voice`/`persona`/`rate`/`pitch`/`pauseMs`/`instructions`/`referenceAudio`/`referenceText`）、`pronunciations`、`subtitleOutput`（`.srt`/`.vtt`/`.ass` 卡拉 OK 字幕）、`subtitleGranularity`（`sentence`/`clause`/`word`）、`maxCharsPerCue`（`4–80`，默认 `16`，短视频场景默认 `14`）、`chaptersOutput`（`.md`/`.txt`/`.json`）、`bgmFile`/`bgmVolume`/`bgmDucking`、`normalizeLoudness`（缺 `ffmpeg` 时优雅降级返回 `warnings`）、`instructions`、`referenceAudio`/`referenceText`、`rate`/`pitch`、`output`；返回精确 `durationMs`、`durationSec`、可选 `chapters`/`chaptersFile`/`playerFile`/`warnings` |
| `voice_stt` | 音视频转文字与字幕（流式上传 + 视频自动抽音） | `audio` 必填（支持常见音频及 `.mp4`/`.mkv`/`.mov`/`.avi` 等视频容器自动 `-vn` 提取 16kHz 单声道音频）；支持 `diarize`（双声道分离或说话人轮次标记 `[说话人 A]` 与 `speakers`）、`autoCompress`（>25MB 用本机 `ffmpeg` 自动压缩分段）、`timestamps`、`subtitleOutput`（`.srt`/`.vtt`/`.ass`）、`model`、`language`、`prompt`、`output`、`engine`（`groq`/`openai`/`siliconflow`/`custom`） |
| `voice_list` | 在线/离线发现音色、内置人设与自定义别名 | 可选 `online`（`true` 拉取并 24h 缓存微软 300+ 实时音色，断网自动回退 51 个实测可用内置；聊天渲染超 60 条自动折叠为前 40 条 + 地区分布摘要，完整数组保留在结构化结果中）、`locale`、`gender`（`Female`/`Male`）、`tag`（如 `podcast`/`multilingual`/`dialect`/`child`/`teen`/`mature`/`elder`/`anime`/`documentary`）、`includePersonas`（默认 `true`） |
| `voice_preview` | 按场景精选或批量试听（并发 ≤3）并生成对比页 | 可选 `scene`（按场景或风格如 `podcast`/`播客`、`short-video`/`短视频`、`audiobook`、`方言`、`双语`、`深夜电台` 自动精选 3–4 个对比音色/人设）、`voices`（≤8，支持原始音色 ID、10 大内置 `persona`、自然语言风格词及 `customVoices` 别名）、`text`（≤200 字）、`outputDir`、`htmlIndex`（默认 `true`，生成 `voice_previews/index.html`） |
| `voice_health` | 本地配置自检（不触网） | 可选 `scope`（`all`/`tts`/`stt`），返回 `ttsReady` / `sttReady` 并校验引擎、音色/人设/`customVoices` 别名、语速音调、代理与密钥 |
| `voice_prefs` | 对话动口持久化管理语音创作偏好 | `action` 必填（`get` / `set_default` / `add_pronunciation` / `remove_pronunciation` / `save_custom_voice` / `remove_custom_voice`）；可选 `voice`、`persona`（均支持自然语言风格词）、`rate`、`pitch`、`word`、`alias`、`name`、`instructions`、`referenceAudio`（严格校验会话工作区内且 ≤10MB）、`referenceText`；仅读写非凭据创作偏好（`ttsVoice`/`ttsRate`/`ttsPitch`/`pronunciations`/`customVoices`），绝不触碰密钥、接口地址、代理或引擎，并严格遵守宿主只读设置保护 |

### `0.11.0` 许愿式（Wish-Driven）聊天优先体验升级

1. **6 大高阶场景预设（`scene`）与智能默认配方**：
   - `voice_tts` 新增 `scene` 参数，支持 `podcast`（播客：默认 `podcast-host-female`、`-16 LUFS` 响度均衡、`bgmDucking: true`、`podcast.mp3`）、`short-video`（短视频/口播：默认 `energetic-anchor`、`subtitleGranularity: "clause"`、`maxCharsPerCue: 14`、`short-video.mp3`）、`audiobook`（有声书：默认 `documentary-narrator`、`cleanMarkdown: true`、`audiobook.mp3`）、`briefing`（简报/早报：默认 `news-briefing`、`briefing.mp3`）、`story`（故事/睡前：默认 `bedtime-story`、`story.mp3`）、`dubbing`（配音：默认 `bilingual-tech-male`、`dubbing.mp3`）；所有场景仅补齐调用方未显式传入的参数，显式传参始终优先。
2. **自然语言模糊风格与方言选声（`resolveVoiceWish`）**：
   - `voice_tts`（`voice`/`persona`/`segments[]`）、`voice_preview` 与 `voice_prefs` 均按「自定义别名 → 精确人设 → 合法 Edge ID → 中英文风格关键词 → 方言/语种回退」优先级自动解析自然语言表达（如 `"深夜"` → `late-night-radio`、`"纪录片"` → `documentary-narrator`、`"粤语男声"` → `zh-HK-WanLungNeural`、`"东北话"` → `zh-CN-liaoning-XiaobeiNeural`、`"双语女"` → `bilingual-tech-female`）。
3. **目标时长自动校准（`targetDurationSec`）与 `normalizeLoudness` 优雅降级**：
   - 传入 `targetDurationSec`（`3–3600` 秒，适用于单文本、`inputFile` 与多角色 `segments`），合成音频若超过目标 `>5%` 则自动按实测比例换算 `rate` 重合成一次，若仍超过目标 `>3%` 且本机有 `ffmpeg` 则执行保调 `atempo` 精压并返回 `durationAdjusted: true`；
   - 本机无 `ffmpeg` 时，启用 `normalizeLoudness: true`（如 `scene: "podcast"` 默认开启）不再报错中断，而是优雅跳过响度均衡、交付干净 MP3 并在 `warnings` 字段给出清晰提示。
4. **内置词边界安全技术发音词典（`autoPronunciations`）**：
   - 默认开启（`autoPronunciations: true`），自动应用保守且受 ASCII 词边界保护的常见技术术语读法（`Nginx` → `Engine X`、`SQL` → `S Q L`、`K8s`/`Kubernetes` → `K 8 s`、`CLI` → `C L I`、`GUI` → `G U I`、`OAuth` → `O Auth`、`PostgreSQL` → `Postgres`、`kubectl` → `cube control`、`GraphQL` → `Graph Q L`、`WebSocket` → `Web Socket`），设置与单次 `pronunciations` 按同名覆盖优先生效。
5. **零依赖自包含 HTML5 交互播放器（`createPlayer` / `playerOutput`）**：
   - 传入 `createPlayer: true`（默认生成 `<输出文件名>.player.html`）或 `playerOutput` 即可自动采集同步字幕并生成零外部依赖、严格 HTML/JS XSS 转义的交互播放器页面，内置明暗主题适配、倍速切换、MP3 下载、章节跳转与点击字幕定位跟读。
6. **场景精选试听（`voice_preview({ scene })`）与第 6 个工具 `voice_prefs`**：
   - `voice_preview({ scene })` 根据场景或风格（如 `"podcast"`、`"short-video"`、`"方言"`、`"双语"`、`"深夜电台"`）自动挑选 3–4 个对比鲜明且经 Edge 实测可用的音色/人设一步出试听页；
   - `voice_prefs` 让用户直接在聊天框管理默认音色/人设/语速/音调、增删发音词典与保存/删除自定义音色别名，通过可选宿主 `settings` 服务即时热更新持久化，同时保持 `export const inject = ['tools']` 与严格非凭据安全边界。

### `0.10.0` 真·创作闭环、卡拉 OK 字幕、原生章节与音视频工程升级

1. **短视频词/短句粒度字幕与卡拉 OK `.ass` 动态高亮导出**：
   - `voice_tts` 支持 `subtitleGranularity`（`"sentence"` | `"clause"` | `"word"`）与 `maxCharsPerCue`（默认 `16`，中日韩全角计 `1`、英文半角计 `0.5`，结合标点与 `≥350ms` 停顿切屏）；
   - `subtitleOutput` 支持导出 `.ass`（`1080x1920` SubStation Alpha `v4.00+`），自动拉取词级边界写入 `{\kf<cs>}` 逐词高亮时间标签，可直接交给 `dsh-ffmpeg` 烧录竖屏短视频动态字幕。
2. **文稿内联停顿标签（`[pause:500ms]`）与词边界安全发音词典（`pronunciations`）**：
   - 支持在文稿与台词中直接嵌入 `[pause:500ms]`、`[break:600ms]` 或 `[停顿0.6s]`（限幅 `50–10000ms`），Edge（复用保活连接池）与 OpenAI / SiliconFlow / 自定义引擎均自动分段合成并插入匹配采样率 MP3 静音帧，且所有导出的 `.srt`/`.vtt`/`.ass` 字幕均自动剥离停顿标记；
   - `pronunciations` 对 ASCII 词汇（如 `OS`、`UI`、`SQL`、`AI`）自动启用词边界保护，精准匹配 `"Mac OS"` 与 `"OS系统"`，绝不破坏 `"POST"`、`"HOST"` 或 `"BUILD"` 等单词子串。
3. **有声书与播客原生 MP3 章节（ID3v2.3 `CHAP`/`CTOC` + `chaptersOutput`）**：
   - `inputFile` 读取含 `#` / `##` / `###` 多标题的 Markdown 文稿（自动忽略代码块内的 `#` 注释并在章间留出 350ms 自然呼吸停顿），或在 `segments[]` 中为段落指定 `title`，即可零依赖向 MP3 头部写入原生可点击跳转的 ID3v2.3 `CTOC` + `CHAP` 章节书签（不影响 `inspectMp3Buffer` 帧时长统计）；
   - 配合 `chaptersOutput`（如 `"chapters.md"` / `"chapters.txt"` 或 `"chapters.json"`）可同步导出 `MM:SS 标题` 节目单时间轴或结构化章节 JSON。
4. **`voice_stt` 视频容器文件直传自动抽音（`.mp4` / `.mkv` / `.mov` / `.avi`）**：
   - 直接向 `voice_stt` 传入 `.mp4`、`.mkv`、`.mov`、`.avi`（及 `.flv`/`.wmv`/`.m4v`/`.ts`/`.mts`）视频文件时，插件自动调用本机 `ffmpeg` 剥离视频流（`-vn`）转为轻量 16kHz 单声道音频后再上传 ASR（即使视频小于 25MB 也会自动提取纯音频，而浏览器麦克风 `.webm` 仍免 `ffmpeg` 直传）。
5. **零漂移 `.srt` 反向配音（`atempo`）、VBR 多段拼接修复与 Edge Keep-Alive 连接池**：
   - `subtitleInput` 在语速比例重合成后若密集台词仍超出时间窗 `>3%` 且本机有 `ffmpeg`，自动执行 `atempo` 保调精缩，彻底消除长视频累积时间漂移；
   - `concatMp3Buffers` 拼接多段音频时自动剥离每段首尾 ID3 与 `Xing`/`Info`/`VBRI` VBR 元数据帧，彻底解决多段 OpenAI / SiliconFlow 播客在播放器中进度条与时长卡在第一段的通病；
   - Edge TTS 内置按代理隔离的 Keep-Alive WebSocket 连接池（空闲自动回收且不阻塞进程退出）与网络瞬断自动换连重试，大幅提速长文与多角色播客合成。
6. **Voice Studio 侧边栏工作台（5 套主题 · 5 大标签页）**：
   - **8 秒录音一键生成克隆角色**（「麦克风与角色」页）：浏览器直接录音 5–10 秒，自动落盘至 `voice_clones/`、调用 ASR 自动识别 `referenceText` 并一键写入 `customVoices`；
   - **可视化多角色对话编排器**（「试配与编排」页）：增删台词、切换发言人与音色/人设、可选落盘 `voice_outputs/*.mp3` + `.srt`，在面板内一键合成并跟读播放；
   - **第 5 标签页「工作区成品库」与点击跳转字幕播放器**：自动扫描工作区音频及同名 `.srt`/`.vtt` 字幕，顶部播放栏支持一键下载 MP3、实时高亮当前台词并点击任意字幕秒级跳转播放。

### `0.8.0`–`0.9.0` 语音工作台与音色多样性能力底座

1. **5 套同步主题与 Coachmark 引导**：支持 **原生清透 / 米白纸感 / Claude 暖书卷 / 8-Bit 像素 / 晴空薄荷** 5 套实时同步主题与聚光灯引导。
2. **全量发现与 51 个实测可用全年龄/方言内置音色 + 10 大 `persona`**：
   - `voice_list({ online: true })` 24h 缓存微软 300+ 神经音色，离线自动回退 51 个经 Edge 实测可用的精选音色（涵盖绘本/童声 `XiaoyiNeural`/`en-US-AnaNeural`、少年动漫 `YunxiaNeural`、成熟纪录片/新闻 `YunjianNeural`/`YunyangNeural`、长者 `en-US-RogerNeural`、多语混读 `en-US-AvaMultilingualNeural`/`en-US-BrianMultilingualNeural` 及东北/陕西/粤语/台湾方言）；
   - 内置 10 大 `persona`：`late-night-radio`、`podcast-host-female`、`podcast-host-male`、`documentary-narrator`、`bedtime-story`、`anime-boy`、`energetic-anchor`、`news-briefing`、`bilingual-tech-female`、`bilingual-tech-male`。
3. **播客 BGM 自动闪避（`bgmFile`）、`-16 LUFS` 响度均衡、演技 `instructions` 与 SHA-256 缓存克隆**：
   - `bgmFile` 通过 FFmpeg `sidechaincompress` 在人声出现时自动压低配乐并在结尾淡出，可链式叠加 `normalizeLoudness: true`；
   - `instructions` 原生透传 `gpt-4o-mini-tts` 或拼接 CosyVoice2 `<|endofprompt|>`（支持 `[laughter]`/`[breath]`），支持 Kokoro `zf_xiaobei*0.6+zf_xiaoni*0.4` 混音；SiliconFlow 参考音频按账号隔离并按 SHA-256 哈希上传一次跨段复用 `speech:...` URI。
4. **说话人区分（`diarize: true`）**：双声道录音自动经 `ffmpeg` 左右声道分离转写归并，单声道解析/推断说话人切换并输出 `[说话人 A]` 段落与字幕。

### 引擎预设与安全细节

- **引擎预设**：
  - `asrEngine`：`groq`（`whisper-large-v3-turbo`）、`openai`（`whisper-1`）、`siliconflow`（`FunAudioLLM/SenseVoiceSmall`）、`custom`（支持本地回环地址免密钥）。
  - `ttsEngine`：`edge`（零密钥默认）、`openai`（`gpt-4o-mini-tts`）、`siliconflow`（`FunAudioLLM/CosyVoice2-0.5B`）、`custom`（OpenAI `/audio/speech` 兼容端点）。
- **工作区沙箱与符号链接防护**：所有读写路径（含 `inputFile`、`referenceAudio`、`audio`、`chaptersOutput`、`playerOutput`、`voice_prefs` 克隆样本路径、工作台 `voice_clones`/`voice_outputs` 与各类输出）解析后必须位于 `session.header.cwd` 内；拒绝跟随符号链接覆写，新建文件使用 `O_EXCL` 防止并发竞态覆盖，转写 `.txt` 与字幕在类 Unix 系统以 `0600` 权限写入。
- **防凭据串台、非凭据偏好白名单与防重定向泄露**：ASR 与 TTS 请求固定发往配置端点，拒绝模型调用时用 `engine` 临时切换厂商，遇 `3xx` 重定向立即中止请求；`voice_prefs` 严格限定非凭据创作偏好字段且遵守只读保护；交互播放器 HTML 与内联 JSON 严格执行 XSS 转义；工作台接口严格校验 `X-DSH-VOICE: 1` 与同源请求并脱敏全部密钥。
- **动态超时与随时可取消**：`timeoutMs`、`pronunciations` 与 `customVoices` 随设置热更新即时生效；`voice_tts`、`voice_preview`、`voice_list`、`voice_stt` 与 `voice_prefs` 全程透传 `exec.signal`，取消即关闭连接或中止抽音/压缩/上传。

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
