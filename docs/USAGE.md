# dsh-voice 使用说明

[返回简介](../README.md) · [更新记录](../CHANGELOG.md) · [验证记录](VALIDATION.md)

## 最快 3 步用起来

### 第 1 步：了解零配置范围、5 主题真·创作闭环工作台与可选配置

- **原生 5 主题 Voice Studio 真·创作闭环工作台**：在 DSH 侧边栏打开语音工作台，支持 **原生清透 / 米白纸感 / Claude 暖书卷 / 8-Bit 像素 / 晴空薄荷** 5 套同步主题与交互式 Coachmark 新手引导；可在面板内直接试听 300+ 在线音色与 10 套人设（支持 `0.8x–1.5x` 倍速、一键下载与**点击字幕跳转跟读播放栏**）、使用**可视化多角色对话编排器**在面板内直出 MP3、通过浏览器麦克风 **8 秒录音一键生成克隆角色**（落盘 `voice_clones/` + 自动 ASR 提取参考台词 + 自动注册 `customVoices`）、在 **「工作区成品库」** 标签页回放工作区音频与同步字幕，以及可视化管理 `pronunciations` 发音词典。
- **文字转语音（`voice_tts` / `voice_list` / `voice_preview`）零配置即用**：默认使用 Edge 神经语音（内置 Keep-Alive WebSocket 连接池与瞬断重试），无需任何 API 密钥即可联网发现 300+ 实时音色或使用 45+ 全年龄/方言内置音色、调用 10 大内置 `persona` 人设、导出短视频短句/逐词粒度与 `.ass` 卡拉 OK 动态高亮字幕（`subtitleGranularity` / `maxCharsPerCue`）、识别内联停顿标记（`[pause:500ms]`）、执行词边界安全替读（`pronunciations`）、写入原生 MP3 章节书签（ID3v2 `CHAP`/`CTOC` + `chaptersOutput`）、按 `subtitleInput`（`.srt`/`.vtt`）零漂移反向配音、获取 VBR 多段精确 `durationMs` / `durationSec` 时长并生成网页试听页；如需情绪指令（`instructions`）、Kokoro 混音或零样本参考克隆（`referenceAudio`），可在设置中切换 `ttsEngine` 为 `siliconflow`、`openai` 或 `custom`。
- **音视频转文字（`voice_stt`）按需填密钥（支持视频直传抽音与本地回环免密）**：
  - **推荐方式**：打开 **DSH → 设置 → 插件 → 语音（`dsh-voice`）**，选择 `asrEngine`（默认 `groq`，可选 `openai`、`siliconflow` 或 `custom`），填入 `asrApiKey`（自动脱敏，**保存立即生效、无需重启**；当 `custom` 指向 `127.0.0.1` / `localhost` 本地 Whisper 服务时无需密钥）；支持直接传入 `.mp4` / `.mkv` / `.mov` / `.avi` 视频容器自动抽音转写；
  - **自定义音色别名（`customVoices`）与词边界发音词典（`pronunciations`）**：可在 DSH 设置或工作台保存命名角色与发音替读规则（如 `Nginx` → `Engine X`、`OS` → `Operating System`，自动保护 `POST` 等单词不被误替换），保存即热更新生效；
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
    #   - word: Nginx
    #     alias: Engine X
    #   - word: OS                      # ASCII 词边界保护：匹配 "Mac OS"/"OS系统"，绝不误伤 "POST"
    #     alias: Operating System
    #   - word: SQL
    #     alias: S Q L
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

为了防止路径越界读取隐私文件，所有 `voice_tts` 直读文稿（`inputFile`）、反向卡点字幕（`subtitleInput`，≤200 条）、播客背景音乐（`bgmFile`）、零样本克隆参考音频（`referenceAudio`，≤10MB）、待转写音视频（`audio`）以及生成的 MP3 / `.txt` / `.srt` / `.vtt` / `.ass` / `chaptersOutput` / `voice_clones/` / `voice_outputs/` / 试听页都严格限制在**当前会话工作区**内；外部文件请先复制进工作区目录。

### 第 3 步：发现音色/人设 → 试听对比 → 合成或转写 → 成品库验收

不确定哪个声音合适时，先让助手调用 `voice_list({ online: true, locale, gender, tag })` 联网发现微软 300+ 神经音色（24h 缓存，断网自动回退 45+ 精选音色，并一并返回 10 大内置 `persona` 与 `customVoices` 别名），再用 `voice_preview` 生成短试听样例与交互式 `voice_previews/index.html` 浏览器试听页；插件内建 `skills/voice-workflow/SKILL.md` 工作流指南，助手会自动按场景搭配 `inputFile`、章节导出、`.ass` 卡拉 OK 字幕、`[pause:500ms]` 停顿、`segments` 播客混音与视频直传转写。

---

## 平时怎么对助手说（可直接复制的自然语言示例）

- **联网发现音色并连同内置人设生成网页试听页**
  > 调用 `voice_list` 联网按 `podcast` 标签筛选中英文音色，挑几个连同 `late-night-radio` 和 `anime-boy` 人设一起生成短试听，打开 `voice_previews/index.html` 让我选。
- **把多标题 Markdown 长文合成带原生 MP3 章节书签的有声书与章节时间轴**
  > 用 `documentary-narrator` 人设直接读取工作区 `guide.md` 合成带原生 MP3 章节书签的 `guide.mp3`，同时导出同步字幕 `guide.srt` 和节目章节单 `guide-chapters.md`。
- **导出竖屏短视频短句粒度与 `.ass` 卡拉 OK 逐词高亮字幕（含内联停顿）**
  > 用 `energetic-anchor` 朗读这段短视频文案（文内带 `[pause:500ms]` 停顿，设 `subtitleGranularity: "clause"`、`maxCharsPerCue: 14`），生成 `clip.mp3` 和带 `\kf` 逐词高亮的 `clip.ass` 方便传给 `dsh-ffmpeg` 烧录。
- **制作带章节书签、BGM 自动闪避与响度均衡的双人对话播客 MP3**
  > 把这篇更新整理成带 `title` 章节标题的双人播客，女主持用 `podcast-host-female`，男主持用 `podcast-host-male`，搭配工作区 `assets/bgm.mp3` 开启 `bgmDucking: true` 和 `normalizeLoudness: true`，导出 `episode.mp3`、`episode.srt` 和 `episode-chapters.md`。
- **按 `.srt` / `.vtt` 字幕时间轴零漂移反向配音 + 词边界安全发音词典**
  > 用 `bilingual-tech-male` 按工作区 `video.srt` 时间轴反向配音，把 `OS` 替读为 `Operating System`、`Nginx` 替读为 `Engine X`（保护 `POST` 等单词不被误改，字幕保持原拼写），保存 `dubbed.mp3` 和 `dubbed.srt` 并告诉我精确的 `durationSec` 时长。
- **情绪演技配音或 5–10 秒零样本声音克隆（也可在工作台录 8 秒麦克风一键克隆）**
  > 用工作区的 `ref.wav`（对应台词「今天天气真好，我们出发吧」）零样本克隆声音，加上 `[laughter]` 和轻快热情的 `instructions` 语气提示，合成 `greeting.mp3`。
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
| 视频直传转写、开启 `normalizeLoudness` / `bgmFile` 或密集字幕 `atempo` 报错缺 `ffmpeg` | 视频剥离画面抽音（`-vn`）、`-16 LUFS` 响度均衡、`sidechaincompress` BGM 闪避与 `atempo` 保调精缩依赖本机 `ffmpeg` | 本机安装 `ffmpeg`（或先用 `dsh-ffmpeg` 处理），或暂时传纯音频 / 关闭混音均衡开关 |
| 提示音色 ID、语速或音调不合法 | `ttsVoice` 既非合法 Edge ID 也不在内置 `persona`/`customVoices` 中，或 `ttsRate`/`ttsPitch` 格式不对 | 用 `voice_list` 查看合法 ID 与人设，在设置页修正 `ttsVoice`、`ttsRate`、`ttsPitch` |
| `voice_tts` 或 `voice_stt` 报网络失败 | 当前网络无法直连 Edge 朗读服务或外网 ASR 接口 | 在 **DSH「设置 → 插件 → 语音」**填写 `proxyUrl`（支持 `http://`、`https://`、`socks5://`、`socks5h://`，保存即生效） |
| 提示文件必须位于会话工作区内 | 传入了工作区外部路径或越界符号链接 | 将文稿、字幕、BGM、参考音频或音视频复制到当前会话工作区文件夹内再执行 |
| 音频超过 25MB 报超限 | OpenAI / Groq 兼容 ASR 单文件上限 25MB | 调用 `voice_stt` 时传入 `autoCompress: true`（视频文件会自动抽音压缩，调用本机 `ffmpeg` 自动转码/分段），或先用 `dsh-ffmpeg` 处理 |
| ASR 返回 3xx 重定向被拦截 | 为防音频与密钥被转发到第三方主机，插件拒绝自动跟随重定向 | 将 `asrBaseUrl` 或 `ttsBaseUrl` 直接改为服务商最终无跳转的 `/v1` 地址 |
| 同名文件没有覆盖旧文件 | 默认 `overwrite: false` 防误删，自动追加 `_1`、`_2` 序号 | 查看工具返回的实际落盘路径，或在设置中显式开启 `overwrite` |

---

## 工具与语音工作流参考

### 注册工具清单（共 5 个）

| 工具 | 作用 | 关键参数与说明 |
| :--- | :--- | :--- |
| `voice_tts` | 文字/文稿/字幕/播客合成 MP3、章节与字幕 | 支持 `text`（支持内联 `[pause:500ms]`/`[break:600ms]`/`[停顿0.6s]`）、`inputFile`（≤10 万字自动分片；多标题 `.md` 自动写入 MP3 ID3v2 `CHAP`/`CTOC` 章节书签）、`cleanMarkdown`（`.md` 默认开启）、`subtitleInput`（`.srt`/`.vtt` 反向卡点配音，≤200 条，自动加速 + FFmpeg `atempo` 零漂移兜底）、`segments`（≤50 段，每段支持 `title`/`voice`/`persona`/`rate`/`pitch`/`pauseMs`/`instructions`/`referenceAudio`/`referenceText`）、`pronunciations`（词边界安全替读）、`subtitleOutput`（`.srt`/`.vtt`/`.ass` 卡拉 OK 字幕）、`subtitleGranularity`（`sentence`/`clause`/`word`）、`maxCharsPerCue`（`4–80`，默认 `16`）、`chaptersOutput`（`.md`/`.txt` 时间轴或 `.json`）、`bgmFile` / `bgmVolume` / `bgmDucking`、`normalizeLoudness`（`-16 LUFS`）、`persona`、`instructions`、`referenceAudio`（≤10MB）、`referenceText`、`voice`、`rate`、`pitch`、`output`；返回 VBR 精确 `durationMs`、`durationSec` 及可选 `chapters` / `chaptersFile` |
| `voice_stt` | 音视频转文字与字幕（流式上传 + 视频自动抽音） | `audio` 必填（支持常见音频及 `.mp4`/`.mkv`/`.mov`/`.avi` 等视频容器自动 `-vn` 提取 16kHz 单声道音频）；支持 `diarize`（双声道分离或说话人轮次标记 `[说话人 A]` 与 `speakers`）、`autoCompress`（>25MB 用本机 `ffmpeg` 自动压缩分段）、`timestamps`、`subtitleOutput`（`.srt`/`.vtt`）、`model`、`language`、`prompt`、`output`、`engine`（`groq`/`openai`/`siliconflow`/`custom`） |
| `voice_list` | 在线/离线发现音色、内置人设与自定义别名 | 可选 `online`（`true` 拉取并 24h 缓存微软 300+ 实时音色，断网自动回退 45+ 精选内置）、`locale`、`gender`（`Female`/`Male`）、`tag`（如 `podcast`/`multilingual`/`dialect`/`child`/`teen`/`mature`/`elder`/`anime`/`documentary`）、`includePersonas`（默认 `true`） |
| `voice_preview` | 有界并发（≤3）批量试听并生成网页试听页 | 可选 `voices`（≤8，支持原始音色 ID、10 大内置 `persona` ID/名称及 `customVoices` 别名）、`text`（≤200 字）、`outputDir`、`htmlIndex`（默认 `true`，生成 `voice_previews/index.html`） |
| `voice_health` | 本地配置自检（不触网） | 可选 `scope`（`all`/`tts`/`stt`），返回 `ttsReady` / `sttReady` 并校验引擎、音色/人设/`customVoices` 别名、语速音调、代理与密钥 |

### `0.10.0` 真·创作闭环、卡拉 OK 字幕、原生章节与音视频工程升级

1. **短视频词/短句粒度字幕与卡拉 OK `.ass` 动态高亮导出**：
   - `voice_tts` 新增 `subtitleGranularity`（`"sentence"` 整句默认 | `"clause"` 竖屏短句智能切分 | `"word"` 逐词时间轴）与 `maxCharsPerCue`（默认 `16`，中日韩全角计 `1`、英文半角计 `0.5`，结合标点与 `≥350ms` 停顿切屏）；
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
6. **Voice Studio 侧边栏工作台「真·创作闭环」（5 大标签页）**：
   - **8 秒录音一键生成克隆角色**（「麦克风与角色」页）：浏览器直接录音 5–10 秒，自动落盘至 `voice_clones/`、调用 ASR 自动识别 `referenceText` 并一键写入 `customVoices`；
   - **可视化多角色对话编排器**（「试配与编排」页）：增删台词、切换发言人与音色/人设、可选落盘 `voice_outputs/*.mp3` + `.srt`，在面板内一键合成并跟读播放；
   - **第 5 标签页「工作区成品库」与点击跳转字幕播放器**：自动扫描工作区音频及同名 `.srt`/`.vtt` 字幕，顶部播放栏支持一键下载 MP3、实时高亮当前台词并点击任意字幕秒级跳转播放。

### `0.8.0`–`0.9.0` 语音工作台与音色多样性能力底座

1. **5 套同步主题与 Coachmark 引导**：支持 **原生清透 / 米白纸感 / Claude 暖书卷 / 8-Bit 像素 / 晴空薄荷** 5 套实时同步主题与聚光灯引导。
2. **全量发现与全年龄/方言内置（45+ 内置 / 300+ 在线）与 10 大 `persona`**：
   - `voice_list({ online: true })` 24h 缓存微软 300+ 神经音色，离线自动回退 51 个经 Edge 实测可用的精选音色（涵盖绘本/童声 `XiaoyiNeural`/`en-US-AnaNeural`、少年动漫 `YunxiaNeural`、成熟纪录片/新闻 `YunjianNeural`/`YunyangNeural`、长者 `en-US-RogerNeural`、多语混读 `en-US-AvaMultilingualNeural`/`AndrewMultilingualNeural` 及东北/陕西/粤语/台湾方言）；
   - 内置 10 大 `persona`：`late-night-radio`、`podcast-host-female`、`podcast-host-male`、`documentary-narrator`、`bedtime-story`、`anime-boy`、`energetic-anchor`、`news-briefing`、`bilingual-tech-female`、`bilingual-tech-male`。
3. **播客 BGM 自动闪避（`bgmFile`）、`-16 LUFS` 响度均衡、演技 `instructions` 与 SHA-256 缓存克隆**：
   - `bgmFile` 通过 FFmpeg `sidechaincompress` 在人声出现时自动压低配乐并在结尾淡出，可链式叠加 `normalizeLoudness: true`；
   - `instructions` 原生透传 `gpt-4o-mini-tts` 或拼接 CosyVoice2 `<|endofprompt|>`（支持 `[laughter]`/`[breath]`），支持 Kokoro `zf_xiaobei*0.6+zf_xiaoni*0.4` 混音；SiliconFlow 参考音频按 SHA-256 哈希上传一次并跨段复用 `speech:...` URI。
4. **说话人区分（`diarize: true`）**：双声道录音自动经 `ffmpeg` 左右声道分离转写归并，单声道解析/推断说话人切换并输出 `[说话人 A]` 段落与字幕。

### 引擎预设与安全细节

- **引擎预设**：
  - `asrEngine`：`groq`（`whisper-large-v3-turbo`）、`openai`（`whisper-1`）、`siliconflow`（`FunAudioLLM/SenseVoiceSmall`）、`custom`（支持本地回环地址免密钥）。
  - `ttsEngine`：`edge`（零密钥默认）、`openai`（`gpt-4o-mini-tts`）、`siliconflow`（`FunAudioLLM/CosyVoice2-0.5B`）、`custom`（OpenAI `/audio/speech` 兼容端点）。
- **工作区沙箱与符号链接防护**：所有读写路径（含 `inputFile`、`referenceAudio`、`audio`、`chaptersOutput`、工作台 `voice_clones`/`voice_outputs` 与各类输出）解析后必须位于 `session.header.cwd` 内；拒绝跟随符号链接覆写，新建文件使用 `O_EXCL` 防止并发竞态覆盖，转写 `.txt` 与字幕在类 Unix 系统以 `0600` 权限写入。
- **防凭据串台与防重定向泄露**：ASR 与 TTS 请求固定发往配置端点，拒绝模型调用时用 `engine` 临时切换厂商，遇 `3xx` 重定向立即中止请求，工作台接口严格校验 `X-DSH-VOICE: 1` 与同源请求并脱敏全部密钥。
- **动态超时与随时可取消**：`timeoutMs`、`pronunciations` 与 `customVoices` 随设置热更新即时生效；`voice_tts`、`voice_preview`、`voice_list` 与 `voice_stt` 全程透传 `exec.signal`，取消即关闭连接或中止抽音/压缩/上传。

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
