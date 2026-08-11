---
type: prd
status: completed
date: 2026-08-11
topic: governance-batch-three
format: human-readable-requirements
sharded: false
---

# 知识库治理第三批：tidy 冲突合并、更新后自动维护、work 收尾

## AI Parse Contract

- canonicalKind: requirements
- humanEquivalent: true
- stableIdsRequired: true
- noImplicitScope: true

## Problem Frame

第二批留下三项残余：tidy 遇归档同名目录只会跳过（本仓与 work 各出现 2 例）；work 项目 90KB 级记忆文件未蒸馏（该项目此刻有活跃会话实时写入记忆文件，mtime 为当前分钟，禁止并发改写）；Light Path/碰撞触发条件缺校准信号。用户同时要求：其他项目更新插件版本后，这套维护要自动执行。

## Requirements

- R1. tidy 归档目标已存在时按文件合并：源文件在目标缺失则移动；内容相同则去重删除源文件；同名不同内容则以 `<名称>.from-active-<YYYYMMDD><扩展名>` 无损并入；合并后源目录清空即删除。evidence 文件冲突保持跳过（时间戳命名天然不冲突）。
  Acceptance: 新单测覆盖三种文件形态与目录清除；二次 apply 幂等。
- R2. tidy 输出 `memoryBudget` 报告：扫描 `docs/08-ai-memory/*.md`，超出预算（默认 15KB，`--memory-budget-kb` 可调）的文件列出路径与体积；仅报告，永不自动移动记忆文件。
  Acceptance: 单测断言超预算文件被列出、未超出的不列出。
- R3. `update-project` 更新完成后自动执行维护：目标项目存在 `scripts/ae-tools.mjs` 且未传 `--no-tidy` 时，在目标根运行 `tidy --apply`（不含 `--archive-stale`），把归档/清理/超期证据/记忆预算摘要并入更新输出 `maintenance` 字段；CLI 缺失或执行失败时降级为 `skipped` 并给原因，不阻断更新。
  Acceptance: 既有 update-project 测试扩展断言 `maintenance.status`；新增 stub CLI 测试断言 tidy 被以 `--apply` 调用且摘要透出。
- R4. work 项目收尾执行：升级后的 tidy 合并 2 个冲突目录；输出记忆预算报告；因活跃会话正在写入记忆文件，实际蒸馏改为在 work 项目创建结构化交接任务（`docs/00-process/active/memory-distillation/handoff.md`：按 63 个日期标题轮换 `05-decision-log.md`、按主题拆分 03/04、同步 index/registry 的具体步骤），供该项目会话收尾后执行。
  Acceptance: work active/ 不再有冲突残留目录；handoff 文件存在且步骤可执行；不改写 work 记忆文件本体。
- R5. 校准信号落地：在第二批经验笔记追加 Light Path 与碰撞触发的具体校准信号（误用/过触发/欠触发的可观察表现）与复评窗口。
  Acceptance: 经验笔记包含信号清单。

## Non-Functional Requirements

- NFR1. 双 SemVer 0.3.23 -> 0.3.24 + README 双语条目；`check-release-notes` 通过。
- NFR2. `npm run check`、`npm test`、`npm run check:smoke` 全绿。
- NFR3. skill/文档镜像一致；对 work 项目仅新增交接文件与既定归档合并，不触碰其记忆文件与活跃任务。

## Success Criteria

- 任何项目更新插件后无需手动记得跑维护；归档冲突从"跳过待人工"变为"无损自动合并"。

## Scope Boundary

### In Scope
- R1-R5、NFR1-NFR3。

### Out Of Scope
- work 记忆文件的实际改写（交接给该项目会话）。
- 更新流程自动执行 `--archive-stale`（stale 判定始终留给人工口径）。

### Constraints
- 自动维护必须不阻断更新主流程；一切降级可见。

## Validation Evidence (Conditional)

- 分发边界以 `npm run check:smoke` 为最高层级；update 自动维护以本地 file:// 仓库模拟测试为证据层级；`unverified`：真实远端仓库的端到端更新。

## Key Decisions

- D1. 冲突文件带日期后缀并入而非内容仲裁：无损、确定性、不需要领域判断。
- D2. 更新自动维护不含 `--archive-stale`：stale 阈值依赖项目节奏，自动化只做规则完全明确的部分。
- D3. work 记忆蒸馏交接而非并发执行：其会话正在写入（mtime 为当前分钟），并发改写有数据损坏风险。

## Dependencies And Assumptions

### Dependencies
- 0.3.23 已就绪（本工作区待提交状态）。

### Assumptions
- work 项目会话对新增独立任务目录无冲突（仅新增文件）。

## Open Questions

### Must Resolve Before Planning
（无）

### Deferred To Planning
- Q1. [Affects R3][technical] maintenance 摘要字段的精确形状（计划阶段按 tidy 输出裁剪）。

## Evidence Notes

- work 活跃会话 -> `docs/08-ai-memory/{00-index,03,04,05}` 与 2 个任务 mtime = 2026-08-11 12:19:20（检查时刻）。
- 冲突形态 -> 两个 active 残留各含 1 个小 progress.md，与归档同名文件内容不同（545B/354B vs 5072B/10905B）。
- 更新链路 -> 根 `update-ae-codex.mjs`/`update-project.mjs` 均为薄包装，逻辑在插件 `scripts/update-project.mjs`（克隆后委派克隆内 install-project）。

## Consistency Check

- requirementsCount: 5
- nonFunctionalRequirementsCount: 3
- decisionsCount: 3
- openQuestionsCount: 1
