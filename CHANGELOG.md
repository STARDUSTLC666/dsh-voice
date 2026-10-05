# 更新记录

[返回简介](README.md) · [使用说明](docs/USAGE.md) · [验证记录](docs/VALIDATION.md)

[历史英文记录](docs/CHANGELOG.en.md)

## 0.3.6 (2026-10-05)

- ASR 网络与响应体读取均受超时和取消控制；保留用户取消原因，空白或缺失识别结果明确报错，不伪造成功文本文件。

## 0.3.5 (2026-09-28)

- 更新官方 Harness 0.2.0-rc.1 的兼容声明和共同加载验证；运行时代码未变。验证范围见[验证记录](docs/VALIDATION.md)。

## 0.3.4 (2026-09-19)

- 修复代理路径 STT 上传 `[object FormData]`、25MB 校验在读入之后、输出目录不存在白烧一次合成、默认输出落宿主 cwd；`exec.signal` 全程透传、preview 改 3 路并发。测试 55 项。

## 更早的改动

完整历史可查阅 [GitHub 提交记录](https://github.com/STARDUSTLC666/dsh-voice/commits/master)。
