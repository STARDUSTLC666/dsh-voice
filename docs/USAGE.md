# dsh-voice 使用说明

[返回简介](../README.md) · [更新记录](../CHANGELOG.md) · [验证记录](VALIDATION.md)

## 最快 3 步用起来

### 第 1 步：了解零配置范围与可选 ASR 配置

- **文字转语音（`voice_tts` / `voice_list` / `voice_preview`）零配置即用**：无需申请任何 API 密钥，安装后联网即可试听音色与合成 MP3。
- **录音转文字（`voice_stt`）按需填密钥**：
  - **推荐方式**：打开 **DSH → 设置 → 插件 → 语音（`dsh-voice`）**，选择 `asrEngine`（默认 `groq`，也可选 `openai` 或 `custom`），填入 `asrApiKey`（自动脱敏，**保存立即生效、无需重启**）；
  - **命令行 / 环境变量方式**：设置环境变量 `DSH_VOICE_ASR_KEY`，或在 `cordis.patch.yml` 中配置：

```yaml
- id: voice
  name: 'dsh-voice'
  config:
    ttsVoice: zh-CN-XiaoxiaoNeural        # 默认朗读音色（保存即生效）
    ttsRate: '+0%'                        # 默认语速，如 +15% 或 -10%
    ttsPitch: '+0Hz'                      # 默认音调，如 +2Hz 或 -1Hz
    asrEngine: groq                       # groq | openai | custom
    asrModel: whisper-large-v3-turbo      # 可选；留空按引擎预设自动填入
    # asrApiKey: gsk_...                  # 推荐在 DSH 设置页填写或用环境变量 DSH_VOICE_ASR_KEY
    # proxyUrl: http://127.0.0.1:7890     # 网络需要 HTTP(S) 代理时填写
```

### 第 2 步：在工作区内准备文稿或录音

为了防止路径越界读取隐私文件，所有待转写音频与生成的 MP3 / `.txt` 都严格限制在**当前会话工作区**内；外部录音请先复制进工作区目录。

### 第 3 步：试听选定音色，合成配音或转写纪要

不确定哪个声音好听时，先让助手生成几段 3 秒短试听样例对比，再一键合成正式音频。

---

## 平时怎么对助手说（可直接复制的自然语言示例）

- **批量短试听挑选音色（不盲猜 ID）**
  > 先帮我看看常用中英文音色清单，挑 4 个风格不同的音色生成一段短试听 MP3 让我选。
- **把文章或报告合成可播放的语音文件**
  > 用 `zh-CN-YunxiNeural` 男声（语速 `+10%`）把这段产品更新说明合成到 `update-audio.mp3`。
- **录音转写 + 专有名词纠偏 + 落盘存档**
  > 把工作区里的 `interview.mp3` 转写成中文（提示词加上专有名词：DeepSeek Harness、Cordis），完整转写存进 `interview.txt`，并总结 5 条核心结论。
- **不确定代理或密钥是否就绪时先自检**
  > 跑一下语音插件自检，看看当前默认音色、代理和语音转文字密钥状态。

---

## 常见卡点自检

遇到问题先让助手执行 `voice_health`（纯本地检查，不发起网络请求，并明确区分哪些问题只影响 `voice_stt`）：

| 现象 | 常见原因 | 一步修复 |
| :--- | :--- | :--- |
| 自检提示「缺 ASR 密钥」 | 尚未填写 `asrApiKey` 且未设 `DSH_VOICE_ASR_KEY` | 若只需朗读配音可忽略（`voice_tts` 不需要密钥）；若需转写录音，在 **DSH「设置 → 插件 → 语音」**填入 `asrApiKey` 保存即生效 |
| 提示音色 ID 不合法 | `ttsVoice` 拼写不符合 Edge 神经音色格式 | 让助手运行 `voice_list` 查看合法 ID（如 `zh-CN-XiaoxiaoNeural`），在设置页更新 `ttsVoice` |
| `voice_tts` 或 `voice_stt` 报网络失败 | 当前网络无法直连 Edge 朗读服务或外网 ASR 接口 | 在 **DSH「设置 → 插件 → 语音」**填写 `proxyUrl`（如 `http://127.0.0.1:7890`，保存即生效） |
| 提示文件必须位于会话工作区内 | 传入了工作区外部路径或越界符号链接 | 将录音复制到当前会话工作区文件夹内再执行 |
| 音频超过 25MB 报超限 | OpenAI / Groq 兼容 ASR 单文件上限 25MB | 先用 `dsh-ffmpeg` 压低码率或分段裁剪后再转写 |
| ASR 返回 3xx 重定向被拦截 | 为防音频与密钥被转发到第三方主机，插件拒绝自动跟随重定向 | 将 `asrBaseUrl` 直接改为服务商最终无跳转的 `/v1` 地址 |
| 同名文件没有覆盖旧文件 | 默认 `overwrite: false` 防误删，自动追加 `_1`、`_2` 序号 | 查看工具返回的实际落盘路径，或在设置中显式开启 `overwrite` |

---

## 工具与安全边界参考

### 注册工具清单（共 5 个）

| 工具 | 作用 | 关键参数与说明 |
| :--- | :--- | :--- |
| `voice_tts` | 文字合成 MP3（零密钥 Edge 在线神经语音） | `text` 必填（≤5000 字符）；`voice` / `rate` / `pitch` / `output` 可选 |
| `voice_stt` | 音频转文字（Groq / OpenAI / 自定义兼容端点） | `audio` 必填（≤25MB）；`model` / `language` / `prompt` / `output` 可选 |
| `voice_list` | 查看内置常用多语种与方言音色目录 | 无参数 |
| `voice_preview` | 有界并发（最多 3 路）批量生成短试听 MP3 | `voices`（最多 8 个）/ `text`（≤200 字）/ `outputDir` 可选 |
| `voice_health` | 本地配置自检（不触网） | 逐项检查默认音色、代理、ASR 引擎/地址/密钥与影响面 |

### 安全与文件保护细节

- **工作区沙箱与符号链接防护**：所有读写路径解析后必须位于 `session.header.cwd` 内；拒绝跟随符号链接覆写，新建文件使用 `O_EXCL` 防止并发竞态覆盖，转写 `.txt` 在类 Unix 系统以 `0600` 权限写入。
- **防凭据串台与防重定向泄露**：ASR 请求固定发往配置的 `asrBaseUrl`，拒绝模型调用时用 `engine` 临时切到其他厂商，且遇 `3xx` 重定向立即中止上传。
- **随时可取消**：`voice_tts`、`voice_preview` 与 `voice_stt` 全程透传 `exec.signal`，用户点击停止即刻关闭 WebSocket 或中止上传。

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
