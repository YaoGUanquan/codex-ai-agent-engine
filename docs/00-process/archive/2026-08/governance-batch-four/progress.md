# governance-batch-four 过程记录

- **状态：** done
- **PRD：** `docs/ae/prds/2026-08-11-governance-batch-four-prd.md`
- **计划：** `docs/ae/plans/2026-08-11-006-governance-batch-four-plan.md`

## 共识门（2026-08-11）

- 需求：PRD 已确认；四项方向为用户显式给定，技术参数以 D1-D4 记录（README 窗口 5 条、双语 CHANGELOG 完整历史模型、归档手动执行、旧栈/映射均按需触发）。
- 计划：自评审通过（TDD 顺序、无损迁移核对、git mv 保留历史、仅追加式触碰记忆文件）。
- 文档评审：通过；两处事实核查已闭合（`README.zh-CN.md` 为兼容指针不参与拆分；`check-claims.mjs` 仅校验 `ae-claim` 块，CHANGELOG 不受影响）。
- 开放决策：无需用户裁决项。
- 验证契约：`npm run check`、`npm test`、`node scripts/check-release-notes.mjs`、`node scripts/ae-tools.mjs tidy`（dry-run）、`node scripts/check-memory-knowledge-contract.mjs --root .`、`node scripts/check-ae-artifacts.mjs`。

## Git 安全检查（2026-08-11）

- 分支 `main`，HEAD `7b82509`（批次二/三文档已随该提交入库），单 worktree；工作区仅含本批 PRD/计划两个未跟踪文件。

## 检查点

- 2026-08-11: 探索完成（README 18 条版本条目、tidy archived-pointer 保留口径、4 个 active 目录状态、契约消费者清单）；PRD 与计划落盘并通过文档评审。
- 2026-08-11: U1/U2 完成——契约测试改写先红（1 fail），checker 重写后转绿（1 pass）。
- 2026-08-11: U3 完成——迁移脚本输出双语各 18 条入 CHANGELOG、README 留 5 条（0.3.24→0.3.20）、逐块包含核对通过后删除脚本；`check-release-notes` 仓库级 ok；README 路线图 7-10、推进原则、AGENTS.md、release-checklist 同步。
- 2026-08-11: U4 完成——4 个目录并入 `archive/2026-08/`，active 仅剩本批；tidy dry-run 确认（memoryBudget 超标两项为批次三已知项，范围外）。
- 2026-08-11: U5 完成——决策日志追加批次四条目、经验笔记落盘、registry 增加 2 条 decision-log 关系。
- 2026-08-11: 全量验证通过——`npm run check` 通过、`npm test` 125/125、`check-memory-knowledge-contract`（40 关系）与 `check-ae-artifacts`（111 项）ok、`git diff --check` 干净。
- 2026-08-11: domain:code 评审——变更清单 22 路径全覆盖无排除；reviewer/architect/claim-integrity 三 lane 均 APPROVE，无阻塞发现。观察项（不阻塞）：归档指针文件保留历史交叉引用（有意不改写）；记忆预算超标两项为批次三既有发现（范围外）。
- 2026-08-11: 交付收尾——本目录归档至 `docs/00-process/archive/2026-08/governance-batch-four/`，Git 提交按用户指令另行执行。
