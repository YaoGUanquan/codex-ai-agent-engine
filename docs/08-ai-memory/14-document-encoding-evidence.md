<!-- ae-codex:memory -->
# 文档编码证据（2026-08-17）

## 稳定结论

- `docs/` 下 `.md`、`.json`、`.jsonl`、`.yaml`、`.yml`、`.txt`、`.csv`、`.tsv` 共 516 个文件已严格 UTF-8 解码；解码失败为 0，含 `U+FFFD` 的文件为 0。
- 这证明当日扫描集合的文件字节可按 UTF-8 解码；不证明 PowerShell 控制台、编辑器、Git 配置或未扫描文件的编码状态。
- PowerShell 显示乱码时，先显式 UTF-8 或字节级核验；不得仅据预览重写有效文件。
- 新增文本默认 UTF-8 无 BOM，除非目标工具明确要求 BOM。

## 可复现核验形状

使用 `TextDecoder('utf-8', { fatal: true })` 严格解码，再独立搜索 `U+FFFD`。两个信号均为零才可对该次文件集合做出本记录的结论。

## 维护边界

- 正典规则：`docs/00-process/templates/encoding-rules.md`。
- 本记录是证据快照，不是持续监控或发布门禁。
- 出现可复现回归后，再评估独立检查脚本或 CI。

## 关联工件

- `docs/ae/brainstorms/2026-08-17-document-encoding-evidence-governance.md`
- `docs/ae/prds/2026-08-17-document-encoding-evidence-governance-prd.md`
- `docs/ae/designs/document-encoding-evidence-governance-2026-08-17/design.md`
- `docs/ae/plans/2026-08-17-001-document-encoding-evidence-governance-plan.md`
- `docs/ae/graphs/maintainer-artifact-graph.md`
