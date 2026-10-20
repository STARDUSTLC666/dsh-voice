# 更新记录

[返回简介](README.md) · [使用说明](docs/USAGE.md) · [验证记录](docs/VALIDATION.md)

[历史英文记录](docs/CHANGELOG.en.md)

## 0.3.7 (2026-10-20)

- 修复 voice_stt 的引擎/地址错配：openai、groq 分支不再写死厂商地址，一律使用配置 `asrBaseUrl`；模型传的 `engine` 与配置 `asrEngine` 不一致时直接报错，避免把 groq 的密钥发给 OpenAI 或把自建服务的密钥发给厂商
- 修复读写越界：`audio` 与 `output`/`outputDir` 解析后必须落在会话工作区内（含符号链接解析），工作区外的文件不再被整份上传给 ASR，也不再在工作区外创建文件
- 拒绝跟随符号链接写入（含悬空链接），新建文件用 `O_EXCL`；转写文本改为 0600
- `voice_preview` 复用 `resolveOutputPath`：`overwrite=false` 时同名样例加序号，不再直接覆盖
- 音频大小按实际读到的字节数复查，`stat` 报 0 字节的伪文件不再绕过 25MB 预检
- 新增 8 项回归测试（工作区越界、私钥不被上传、符号链接、engine 错配、自定义网关、preview 不覆盖）

## 0.3.6 (2026-10-05)

- ASR 网络与响应体读取均受超时和取消控制；保留用户取消原因，空白或缺失识别结果明确报错，不伪造成功文本文件。

## 0.3.5 (2026-09-28)

- 更新官方 Harness 0.2.0-rc.1 的兼容声明和共同加载验证；运行时代码未变。验证范围见[验证记录](docs/VALIDATION.md)。

## 0.3.4 (2026-09-19)

- 修复代理路径 STT 上传 `[object FormData]`、25MB 校验在读入之后、输出目录不存在白烧一次合成、默认输出落宿主 cwd；`exec.signal` 全程透传、preview 改 3 路并发。测试 55 项。

## 更早的改动

完整历史可查阅 [GitHub 提交记录](https://github.com/STARDUSTLC666/dsh-voice/commits/master)。
