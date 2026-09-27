<!-- ae-memory-router:v1 -->
<!-- ae-codex:init managed -->
# AI 记忆索引

本文件只做路由，最多 4096 UTF-8 字节、80 行。禁止追加日期流水、完成清单、SQL 或经验正文。

## 文件导航

- `01-project-context.md`：项目定位、技术栈、路径和本地约束。
- `02-architecture-boundaries.md`：模块边界、职责边界和集成点。
- `03-key-workflows.md`：长期复用的关键流程。
- `04-known-pitfalls.md`：历史坑点、易混淆边界和编码问题。
- `05-decision-log.md`：长期有效的决策。
- `06-agent-maintenance-rules.md`：AI 读取和更新记忆的规则。
- `99-prompt-template.md`：初始化或维护记忆库的提示词模板。

## 按需检索

- 先检查索引体积；超预算时不要整篇加载。解析运行时入口后用 `ae-memory-index` 查看。
- 用 `ae-memory-search --query "<关键词>" --limit 5` 定位，再按返回路径和行号读取必要片段；`--path <记忆目录内相对路径>` 缩小范围。
- `--history` 只查拆分的旧索引，不代表现行合同。`scan.complete=false` 不能推断没有其他匹配。
- `00-registry.json` 若存在，使用 `ae-memory-query` 查询已登记主题/关系，不全量加载 JSON。
- 外部 docs 先解析当前项目/分支，再显式传 `--docs-root`；禁止混读其他分支。

## 更新

只在用户要求时更新对应专题；每个专题最多 15KiB，超额先蒸馏或拆分。新入口按领域分组，不为每次任务增加根导航。更新后运行 `ae-memory-index --check`。历史整理先用 `--compact` 预览，授权写入还需 `--apply --expect-sha256 <预览哈希>`；无新增稳定知识则不写入。

## Preserved Index History

- Source SHA-256: `5a87d7f95b0b1d8b2c3a2563b7a62f5779771c949eff129d1a2fe1f89ff0ee09`.
- 1 ordered, immutable pages: `00-index-history-5a87d7f95b0b1d8b2c3a2563b7a62f5779771c949eff129d1a2fe1f89ff0ee09-*.md`.
- Search these historical fragments only with `ae-memory-search --history --query "<text>"`.
- Do not append new events here or to the history pages. Update the owning topic.
