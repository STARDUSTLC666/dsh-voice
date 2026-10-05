# Historical release notes

[Current changelog](../CHANGELOG.md) · [Overview](../README.en.md)

These English notes preserve the earlier translations. The main changelog contains the consolidated version history.

## 0.3.6 (2026-10-05)

- Apply cancellation and timeouts to both ASR transport and response parsing. Preserve cancellation reasons and reject empty or missing transcripts.

## 0.3.4 (2026-09-19)

- 修复代理路径 STT 上传 `[object FormData]`、25MB 校验在读入之后、输出目录不存在白烧一次合成、默认输出落宿主 cwd; `exec.signal` 全程透传、preview 改 3 路并发. 测试 55 项.
