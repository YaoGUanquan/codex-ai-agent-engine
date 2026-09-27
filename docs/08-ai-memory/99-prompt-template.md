<!-- ae-codex:init managed -->
# 提示词模板

要求 agent 维护项目记忆时可使用：

```text
先解析当前项目/分支的 docs 根目录，检查 00-index.md 体积，超过 4096 UTF-8 字节或 80 行时不整篇加载。解析 AE 运行时入口，用 ae-memory-search --query "<关键词>" --limit 5 检索，只读取命中附近必要片段；历史需显式 --history，截断不是无匹配。用户要求更新记忆时，只更新相关专题，不把日期流水、SQL 或总结追加到入口；专题最多 15KiB，超额先蒸馏/拆分，并运行 ae-memory-index --check。不要记录一次性日志或未确认猜测。
```

托管专题/开发历史/滚动台账用 `ae-docs-append` 追加，应用核对预览的源和记录两项哈希，不向入口或旧分片追加。`ae-docs-search` 按返回页号/行号续查，相关写入后运行 `ae-docs-maintain --check`，外部文档传同一已解析 `--docs-root`。
