# dsh-voice 使用说明

[返回简介](../README.md) · [更新记录](../CHANGELOG.md) · [验证记录](VALIDATION.md)

## 最快 3 步用起来

### 第 1 步：了解零配置范围与可选 TTS / ASR / 自定义别名配置

- **文字转语音（`voice_tts` / `voice_list` / `voice_preview`）零配置即用**：默认使用 Edge 神经语音，无需任何 API 密钥即可联网发现 300+ 实时音色或使用 45+ 全年龄/方言内置音色、调用 10 大内置 `persona` 人设、生成网页试听页、直读长文并合成 MP3 与 `.srt`/`.vtt` 字幕；如需情绪指令（`instructions`）、Kokoro 混音或零样本参考克隆（`referenceAudio`），可在设置中切换 `ttsEngine` 为 `siliconflow`、`openai` 或 `custom`。
- **录音转文字（`voice_stt`）按需填密钥（本地回环免密）**：
  - **推荐方式**：打开 **DSH → 设置 → 插件 → 语音（`dsh-voice`）**，选择 `asrEngine`（默认 `groq`，可选 `openai`、`siliconflow` 或 `custom`），填入 `asrApiKey`（自动脱敏，**保存立即生效、无需重启**；当 `custom` 指向 `127.0.0.1` / `localhost` 本地 Whisper 服务时无需密钥）；
  - **自定义音色别名（`customVoices`）**：可在 DSH 设置的 `customVoices` 列表中保存命名角色（支持绑定 `voice`、`persona`、`rate`、`pitch`、`instructions`、`referenceAudio`、`referenceText`），保存即热更新生效，可直接在 `voice_tts`、`segments[]` 与 `voice_preview` 中按别名调用；
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
    # customVoices:
    #   - name: 老王
    #     persona: documentary-narrator
    #     rate: '-5%'
    #   - name: 混音女声
    #     voice: 'zf_xiaobei*0.6+zf_xiaoni*0.4'
    #   - name: 小智克隆
    #     referenceAudio: voices/xiaozhi.wav
    #     referenceText: '你好，这是我的声音参考样本。'
    asrEngine: groq                       # groq | openai | siliconflow | custom
    asrModel: whisper-large-v3-turbo      # 可选；留空按引擎预设自动填入
    # asrApiKey: gsk_...                  # 推荐在 DSH 设置页填写或用 DSH_VOICE_ASR_KEY（本地回环 custom 可留空）
    # proxyUrl: socks5://127.0.0.1:1080   # 支持 http://、https://、socks5://、socks5h://
```

### 第 2 步：在工作区内准备文稿、参考音频或录音

为了防止路径越界读取隐私文件，所有 `voice_tts` 直读文稿（`inputFile`）、零样本克隆参考音频（`referenceAudio`，≤10MB）、待转写音频（`audio`）以及生成的 MP3 / `.txt` / `.srt` / `.vtt` / 试听页都严格限制在**当前会话工作区**内；外部文件请先复制进工作区目录。

### 第 3 步：发现音色/人设 → 试听对比 → 合成或转写

不确定哪个声音合适时，先让助手调用 `voice_list({ online: true, locale, gender, tag })` 联网发现微软 300+ 神经音色（24h 缓存，断网自动回退 45+ 精选音色，并一并返回 10 大内置 `persona` 与 `customVoices` 别名），再用 `voice_preview` 生成短试听样例与交互式 `voice_previews/index.html` 浏览器试听页；插件内建 `skills/voice-workflow/SKILL.md` 工作流指南，助手会自动优先使用 `inputFile`、Markdown 清理、`persona`、`segments` 播客编排、`-16 LUFS` 响度均衡与字幕导出。

---

## 平时怎么对助手说（可直接复制的自然语言示例）

- **联网发现音色并连同内置人设生成网页试听页**
  > 调用 `voice_list` 联网按 `podcast` 标签筛选中英文音色，挑几个连同 `late-night-radio` 和 `anime-boy` 人设一起生成短试听，打开 `voice_previews/index.html` 让我选。
- **直接朗读 Markdown 长文并导出同步字幕**
  > 用 `documentary-narrator` 人设直接读取工作区 `guide.md` 合成 `guide.mp3`，同时导出 `guide.srt`。
- **制作响度均衡的双人对话播客 MP3**
  > 把这篇更新整理成双人播客，女主持用 `podcast-host-female`，男主持用 `podcast-host-male`，开启 `normalizeLoudness` 响度均衡，导出 `episode.mp3` 和 `episode.srt`。
- **情绪演技配音或 5–10 秒零样本声音克隆（SiliconFlow / OpenAI / 自定义引擎）**
  > 用工作区的 `ref.wav`（对应台词「今天天气真好，我们出发吧」）零样本克隆声音，加上 `[laughter]` 和轻快热情的 `instructions` 语气提示，合成 `greeting.mp3`。
- **大体积录音转写 + 专有名词纠偏 + 字幕导出**
  > 把工作区里的 `interview.m4a` 转写成中文（如果超过 25MB 自动压缩分段，提示词加上：DeepSeek Harness、Cordis），存成 `interview.txt` 和 `interview.srt`。
- **按范围执行离线配置自检**
  > 跑一下语音插件自检（分别看看 `ttsReady` 和 `sttReady`），检查默认音色/人设/自定义别名、语速音调格式、代理和 ASR 配置状态。

---

## 常见卡点自检

遇到问题先让助手执行 `voice_health`（纯本地检查，不发起网络请求；支持 `scope: "tts" | "stt" | "all"`，并分别返回 `ttsReady` 与 `sttReady`）：

| 现象 | 常见原因 | 一步修复 |
| :--- | :--- | :--- |
| 自检提示「缺 ASR 密钥」 | 尚未填写 `asrApiKey` 且未设 `DSH_VOICE_ASR_KEY` | 若只需朗读配音可忽略（`ttsReady` 为 `true` 时 `voice_tts` 正常可用），或传 `scope: "tts"`；本地 Whisper 可设 `asrEngine: custom` 指向 `127.0.0.1` / `localhost` 免密运行 |
| 传入 `referenceAudio` 报错不支持克隆 | 当前 `ttsEngine` 仍为 `edge`（Edge 不支持参考音频克隆） | 在 **DSH「设置 → 插件 → 语音」**将 `ttsEngine` 切为 `siliconflow`（`CosyVoice2-0.5B`）或 `custom`（如本地 GPT-SoVITS / IndexTTS） |
| 开启 `normalizeLoudness` 报错缺 `ffmpeg` | `-16 LUFS` 广电响度均衡依赖本机 `ffmpeg` | 本机安装 `ffmpeg`（或先用 `dsh-ffmpeg` 处理），或暂时关闭 `normalizeLoudness` |
| 提示音色 ID、语速或音调不合法 | `ttsVoice` 既非合法 Edge ID 也不在内置 `persona`/`customVoices` 中，或 `ttsRate`/`ttsPitch` 格式不对 | 用 `voice_list` 查看合法 ID 与人设，在设置页修正 `ttsVoice`、`ttsRate`、`ttsPitch` |
| `voice_tts` 或 `voice_stt` 报网络失败 | 当前网络无法直连 Edge 朗读服务或外网 ASR 接口 | 在 **DSH「设置 → 插件 → 语音」**填写 `proxyUrl`（支持 `http://`、`https://`、`socks5://`、`socks5h://`，保存即生效） |
| 提示文件必须位于会话工作区内 | 传入了工作区外部路径或越界符号链接 | 将文稿、参考音频或录音复制到当前会话工作区文件夹内再执行 |
| 音频超过 25MB 报超限 | OpenAI / Groq 兼容 ASR 单文件上限 25MB | 调用 `voice_stt` 时传入 `autoCompress: true`（调用本机 `ffmpeg` 自动转码压缩/分段），或先用 `dsh-ffmpeg` 处理 |
| ASR 返回 3xx 重定向被拦截 | 为防音频与密钥被转发到第三方主机，插件拒绝自动跟随重定向 | 将 `asrBaseUrl` 或 `ttsBaseUrl` 直接改为服务商最终无跳转的 `/v1` 地址 |
| 同名文件没有覆盖旧文件 | 默认 `overwrite: false` 防误删，自动追加 `_1`、`_2` 序号 | 查看工具返回的实际落盘路径，或在设置中显式开启 `overwrite` |

---

## 工具与语音多样性参考

### 注册工具清单（共 5 个）

| 工具 | 作用 | 关键参数与说明 |
| :--- | :--- | :--- |
| `voice_tts` | 文字/文稿/播客合成 MP3 与字幕 | 支持 `text`、`inputFile`（≤10 万字自动分片拼接）、`cleanMarkdown`（`.md` 默认开启）、`segments`（最多 50 段，每段独立支持 `voice`/`persona`/`rate`/`pitch`/`pauseMs`/`instructions`/`referenceAudio`/`referenceText`）、`persona`、`instructions`、`referenceAudio`（≤10MB）、`referenceText`、`normalizeLoudness`（`-16 LUFS`）、`subtitleOutput`（`.srt`/`.vtt`）、`voice`、`rate`、`pitch`、`output` |
| `voice_stt` | 音频转文字与字幕（零拷贝流式上传） | `audio` 必填；支持 `autoCompress`（>25MB 用本机 `ffmpeg` 自动压缩分段）、`timestamps`、`subtitleOutput`（`.srt`/`.vtt`）、`model`、`language`、`prompt`、`output`、`engine` |
| `voice_list` | 在线/离线发现音色、内置人设与自定义别名 | 可选 `online`（`true` 拉取并 24h 缓存微软 300+ 实时音色，断网自动回退 45+ 精选内置）、`locale`、`gender`（`Female`/`Male`）、`tag`（如 `podcast`/`multilingual`/`dialect`/`child`/`teen`/`mature`/`elder`/`anime`/`documentary`）、`includePersonas`（默认 `true`） |
| `voice_preview` | 有界并发（≤3）批量试听并生成网页试听页 | 可选 `voices`（≤8，支持原始音色 ID、10 大内置 `persona` ID/名称及 `customVoices` 别名）、`text`（≤200 字）、`outputDir`、`htmlIndex`（默认 `true`，生成 `voice_previews/index.html`） |
| `voice_health` | 本地配置自检（不触网） | 可选 `scope`（`all`/`tts`/`stt`），返回 `ttsReady` / `sttReady` 并校验引擎、音色/人设/`customVoices` 别名、语速音调、代理与密钥 |

### `0.8.0` 语音多样性四层能力一览

1. **全量发现与全年龄/方言内置（45+ 内置 / 300+ 在线）**：
   - `voice_list({ online: true })` 联网拉取微软 Edge 300+ 全量神经音色并内存缓存 24 小时，离线自动回退至 45+ 精选内置音色：
     - **童声/幼童**：`zh-CN-XiaoshuangNeural`、`zh-CN-XiaoyouNeural`
     - **少年/动漫**：`zh-CN-YunxiaNeural`
     - **成熟/纪录片/老年**：`zh-CN-YunzeNeural`、`zh-CN-XiaoqiuNeural`、`zh-CN-XiaoruiNeural`
     - **激昂/情感/戏剧**：`zh-CN-YunhaoNeural`、`zh-CN-YunfengNeural`、`zh-CN-XiaohanNeural`、`zh-CN-XiaomoNeural`、`zh-CN-XiaoxuanNeural`
     - **方言与港澳台**：东北（`zh-CN-liaoning-XiaobeiNeural`）、陕西（`zh-CN-shaanxi-XiaoniNeural`）、四川（`zh-CN-sichuan-YunxiNeural`）、河南（`zh-CN-henan-YundengNeural`）、山东（`zh-CN-shandong-YunxiangNeural`）、粤语男女（`zh-HK-WanLungNeural` / `zh-HK-HiuMaanNeural`）、台湾男女（`zh-TW-YunJheNeural` / `zh-TW-HsiaoChenNeural` / `zh-TW-HsiaoYuNeural`）
2. **10 大开箱即用音色人设（`persona`）**：
   - `late-night-radio`、`podcast-host-female`、`podcast-host-male`、`documentary-narrator`、`bedtime-story`、`anime-boy`、`energetic-anchor`、`news-briefing`、`bilingual-tech-female`、`bilingual-tech-male`。
3. **情绪演技指令与 Kokoro 混音（`instructions`）**：
   - `gpt-4o-mini-tts` 直接发送原生 `instructions` 字段；
   - SiliconFlow `FunAudioLLM/CosyVoice2-0.5B` 自动将 `instructions` 拼接为 `<|endofprompt|>` 前缀，并支持文本内联 `[laughter]`、`[breath]` 等副语言标记；
   - 自定义 Kokoro 端点支持如 `zf_xiaobei*0.6+zf_xiaoni*0.4` 的音色加权混合表达式。
4. **零样本参考克隆（`referenceAudio` + `referenceText`）与 `customVoices` 别名**：
   - 在 `siliconflow` 或 `custom` 引擎下传入工作区内 5–10 秒干净语音（≤10MB）及对应参考台词即可零样本克隆；
   - 在 DSH 设置 `customVoices` 配置一次即可按中文或英文别名在 `voice_tts`、`segments[]` 与 `voice_preview` 中热更新复用。
5. **播客广电级响度均衡（`normalizeLoudness: true`）**：
   - 合成或拼接完成后调用本机 `ffmpeg` 执行 `-16 LUFS`（`loudnorm=I=-16:TP=-1.5:LRA=11`）标准化，消除多角色或跨引擎音色之间的音量落差。

### 引擎预设与安全细节

- **引擎预设**：
  - `asrEngine`：`groq`（`whisper-large-v3-turbo`）、`openai`（`whisper-1`）、`siliconflow`（`FunAudioLLM/SenseVoiceSmall`）、`custom`（支持本地回环地址免密钥）。
  - `ttsEngine`：`edge`（零密钥默认）、`openai`（`gpt-4o-mini-tts`）、`siliconflow`（`FunAudioLLM/CosyVoice2-0.5B`）、`custom`（OpenAI `/audio/speech` 兼容端点）。
- **工作区沙箱与符号链接防护**：所有读写路径（含 `inputFile`、`referenceAudio`、`audio` 与各类输出）解析后必须位于 `session.header.cwd` 内；拒绝跟随符号链接覆写，新建文件使用 `O_EXCL` 防止并发竞态覆盖，转写 `.txt` 与字幕在类 Unix 系统以 `0600` 权限写入。
- **防凭据串台与防重定向泄露**：ASR 与 TTS 请求固定发往配置端点，拒绝模型调用时用 `engine` 临时切换厂商，遇 `3xx` 重定向立即中止请求。
- **动态超时与随时可取消**：`timeoutMs` 与 `customVoices` 随设置热更新即时生效；`voice_tts`、`voice_preview`、`voice_list` 与 `voice_stt` 全程透传 `exec.signal`，取消即关闭连接或中止压缩/上传。

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
