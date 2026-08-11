---
type: plan
status: completed
date: 2026-08-11
title: governance-batch-three
format: human-readable-plan
sharded: false
archive: docs/00-process/archive/2026-08/governance-batch-three/summary.md
---

# 知识库治理第三批实施计划（2026-08-11）

依据 `docs/ae/prds/2026-08-11-governance-batch-three-prd.md`。

## Global Constraints

- TDD：行为变更先红后绿；镜像逐字节一致；0.3.23 -> 0.3.24。
- 自动维护失败不阻断更新；work 项目只新增文件与既定归档合并。
- 交付门槛：`npm run check`、`npm test`、`npm run check:smoke` 全绿。

## Implementation Units

### U1 - tidy 冲突按文件合并（R1）
- Files: `plugins/ai-agent-engine-codex/scripts/ae-tools/tidy.mjs`、`tests/ae-tools.test.mjs`
- 内容：done/stale 归档遇目标已存在时逐文件合并（缺失移动、相同去重、不同带 `.from-active-<YYYYMMDD>` 后缀），清空后删源目录；action 记 `merged`。
- 验证：新用例先红后绿。

### U2 - tidy memoryBudget 报告（R2）
- Files: 同 U1
- 内容：扫描 `docs/08-ai-memory/*.md`，超 `--memory-budget-kb`（默认 15）列入 `memoryBudget.oversized`；仅报告。
- 验证：新用例先红后绿。

### U3 - 更新后自动维护（R3）
- Files: `plugins/ai-agent-engine-codex/scripts/update-project.mjs`、`tests/install-scripts.test.mjs`、`INSTALL.md`、`INSTALL.zh-CN.md`、`README.md`、`README.en.md`、`plugins/ai-agent-engine-codex/skills/ae-update/SKILL.md` 与镜像
- 内容：安装器返回后在目标根运行 `node scripts/ae-tools.mjs tidy --apply`（无 `--archive-stale`），摘要并入输出 `maintenance`；`--no-tidy` 跳过；CLI 缺失/失败降级 `skipped`。
- 验证：既有 update 测试扩展 + stub CLI 新用例先红后绿。

### U4 - work 项目收尾（R4）
- Files: work 项目 `docs/00-process/active/{class-create-drawer-backend,class-create-drawer-subject-options}`（合并归档）、`docs/00-process/active/memory-distillation/handoff.md`（新增）
- 内容：升级后 tidy --apply 合并冲突；记忆预算报告留档；写蒸馏交接（05 按日期轮换、03/04 按主题拆分、index/registry 同步步骤）。
- 验证：work active/ 无冲突残留；handoff 存在；记忆文件本体未改（mtime/内容不由本批变更）。

### U5 - 校准信号（R5）
- Files: `docs/ae/experience/2026-08-11-governance-batch-two.md`
- 内容：追加 Light Path 误用信号、碰撞过/欠触发信号与复评窗口。

### U6 - 版本与交付（NFR1-3）
- Files: `package.json`、`plugin.json`、`README.md`、`README.en.md`、`docs/00-process/active/governance-batch-three/progress.md`
- 内容：0.3.24、双语条目、全量验证、gate、tidy 归档本任务记录。

## 风险与回滚

- 风险：自动维护在异构目标项目产生意外归档。缓解：仅执行规则完全明确的 done/empty/超期证据；stale 永不自动；输出全量透明；`--no-tidy` 可关。
- 风险：合并后缀策略产生重名。缓解：后缀含日期，重名时追加 `-2` 递增。
- 回滚：本仓按文件 git restore；work 项目合并前有 dry-run 清单，可逆向移回；handoff 为新增文件可直接删除。
