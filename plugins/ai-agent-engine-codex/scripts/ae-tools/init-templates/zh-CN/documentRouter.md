# {{title}}

有界入口，共 {{pages}} 个不可变分片。[第一页]({{firstPage}}) / [末页]({{lastPage}})。

- 检索：`ae-docs-search --path "{{path}}" --query "<关键词>" --limit 5`，按返回路径、页号和行号续查。
- 当前记忆：`ae-memory-search --query "<关键词>" --limit 5`。旧索引中的历史记录不代表当前结论。
- 恢复：按数字顺序拼接前 {{originalPages}} 页，原文 {{originalBytes}} 字节，SHA-256 `{{sha256}}`；用 `ae-docs-maintain --path "{{path}}" --verify` 核验。
- 禁止向此入口追加正文或编辑旧分片。专题、历史、滚动台账用 `ae-docs-append --path "{{path}}" --entry "<记录.md>"` 预览，核对两项哈希后应用；导航索引不接受追加。
- 写后运行 `ae-docs-maintain --check`。外部文档先确认项目/分支再加 `--docs-root`；分页不代表内容仍然有效。
- 普通相对文件链接保留基准目录，跨页锚点和引用定义未改写。不要把全部分片载入上下文。
