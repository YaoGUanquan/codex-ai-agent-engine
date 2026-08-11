---
type: prd
status: completed
date: 2026-08-11
topic: governance-batch-two
format: human-readable-requirements
sharded: false
---

# 知识库治理第二批：tidy 归档命令、gate 传参修整、skill 精修与记忆预算

## AI Parse Contract

- canonicalKind: requirements
- humanEquivalent: true
- stableIdsRequired: true
- noImplicitScope: true

## Problem Frame

第一批（0.3.22）落地了需求单通道、init 停建兼容指针与证据保留策略，但保留策略仍是"纸面规则"：没有可执行的归档命令，本仓 active/ 仍有 7 月滞留任务，work 参照项目有 23 个空任务目录与 3 个月前的 gate。同时遗留两个工具瑕疵（`gate --validation` 重复传参 last-wins）与四个 skill 精修项（碰撞洞见无落点、评审无轻量档、证据词汇多处重述、handoff 双落点）以及记忆体积预算缺失。用户已确认全部按建议执行。

## Requirements

**工具修整**
- R1. `parseOptions` 对重复的 `--key value` 累积为数组（而非 last-wins），`gate --validation` 多次传参时每条验证命令独立记录。
  Acceptance: 新单测断言 `gate --validation A --validation B` 的 `validation_commands` 为两个元素；`npm test` 通过。

**tidy 归档命令（A1）**
- R2. 新增 `tidy` 命令：默认 dry-run，输出过程记录分类（`done`／`empty`／`stale`／`archived-pointer`／`active`）与超期证据清单；`--apply` 执行归档：`done` 目录移入 `docs/00-process/archive/YYYY-MM/<task>/`，`empty` 目录删除，超期（默认 3 个月，`--retention-months` 可调）的 `docs/ae/gates/` 与 `docs/ae/evidence/artifacts/` 文件移入 `docs/ae/archive/<原子目录>/YYYY-MM/`；移动 evidence 产物时同步重写 `ledger.jsonl` 中的路径引用；`stale`（默认 30 天无更新，`--stale-days` 可调）仅报告，`--archive-stale` 才归档；`archived-pointer` 目录默认保留。
  Acceptance: fixture 单测覆盖 dry-run 分类、apply 移动、ledger 重写与二次 apply 幂等；`npm test` 通过。
- R3. 用 tidy 治理本仓：`done` 与七月滞留（archive-stale）过程记录归档，近期活跃任务与指针目录保留。
  Acceptance: tidy 输出记录在过程笔记中；active/ 仅剩活跃任务与归档指针。
- R4. 用 tidy 治理 work 参照项目（`--project-root D:\codes\work`）：先 dry-run 复核清单，再 apply（空目录删除、done 记录归档、超期 gate 归档）。
  Acceptance: 前后对比计数记录在过程笔记中；不触碰 work 项目 docs 之外的内容。

**skill 精修**
- R5. 碰撞洞见落点（S2）：`ae-prd` capture 模板新增可选 `## Perspective Collision (Conditional)` 小节；`ae-brainstorm` 碰撞段补确定性触发条件（价值冲突／方向抉择／S3+ 设计题才开启，S1-S2 单一可行方向跳过，默认至多四视角）并指明落点；`ae-ideate` 增加与碰撞段的双向路由一句话。
  Acceptance: skills-docs 测试断言模板小节与触发语句存在，镜像一致。
- R6. 评审轻量档（S3）：`ae-review` 开头新增 Light Path 段——变更 ≤3 文件、不跨公共 API／持久数据／安全／依赖边界、非交付门禁时，免 review-package/review-contract，单 lane 直接给 verdict；出现边界跨越或疑似 P0/P1 立即回退完整流程；并给 persona 三行速选提示。
  Acceptance: skills-docs 测试断言 Light Path 关键语句，镜像一致。
- R7. 证据词汇收敛（S4）：`ae-brainstorm`、`ae-prd`、`ae-review` 在各自涉及 validation-evidence 的段落保留一句规则并显式指向唯一定义 `ae-plan/references/validation-evidence-profile.md`；不删除既有关键句。
  Acceptance: 三个 SKILL 均含指向该 profile 的引用；既有测试断言（tiers 语句等）不回归。
- R8. handoff 归一（S5）：`ae-handoff` 与 `ae-lfg` 写入同一条路由规则——有任务过程目录时交接写 `docs/00-process/active/<task>/handoff.md`，无任务上下文的跨会话交接才写 `docs/ae/handoffs/`。
  Acceptance: 两个 SKILL 均含该路由语句，镜像一致。

**记忆预算（A3）**
- R9. `memoryMaintenanceRules` 模板（en/zh-CN）与本仓 `docs/08-ai-memory/06-agent-maintenance-rules.md` 新增体积与蒸馏预算：单文件超约 15KB 先蒸馏或拆分；`05-decision-log.md` 按年轮换；每季度按 `00-registry.json` 的 `reviewStatus` 盘点；退役主题移入归档。
  Acceptance: 三个文件包含同义预算条款；本仓文件保留既有本地扩展章节。

## Non-Functional Requirements

- NFR1. 双 SemVer 0.3.22 -> 0.3.23，README 双语追加 `### 0.3.23` 条目（摘要、验证命令、证明边界）。
  Acceptance: `node scripts/check-release-notes.mjs` 通过。
- NFR2. 交付门槛全绿：`npm run check`、`npm test`、`npm run check:smoke`。
  Acceptance: 三命令零失败。
- NFR3. skill 源树与镜像逐字节一致；不回退其他会话已提交内容。
  Acceptance: `node scripts/check-skill-mirror.mjs` 通过。

## Success Criteria

- 保留策略从"纸面规则"变为一条可重复执行的命令，两个仓库的滞留任务与超期证据被实际清理。
- 需求澄清（碰撞）、评审（轻量档）、交接（单一路由）、证据词汇（单一定义）在 skill 层各只有一个权威表述。

## Scope Boundary

### In Scope

- R1-R9、NFR1-NFR3 涉及的插件脚本、模板、skill 文档、测试、两仓 docs 治理执行。

### Out Of Scope

- 记忆文件的实际蒸馏/拆分（本批只立规则，不重写 work 项目 90KB 记忆文件）。
- `archived-pointer` 目录的自动清除（保留为项目惯例）。
- ae-review persona 体系重构、review-contract 选择器变更。
- work 项目 docs 之外的任何内容。

### Constraints

- tidy 移动 evidence 产物必须同步重写 ledger 引用，符合归档规则"移动前确认引用已同步更新"。
- 对 work 项目仅执行经 dry-run 复核后的归档动作。

## Validation Evidence (Conditional)

- 插件分发边界：`npm run check:smoke` 为最高适用层级。
- tidy 对真实仓库的执行：以命令 JSON 输出与前后目录计数为证据层级；`unverified`：work 项目后续会话对归档结果的接受度。

## Key Decisions

- D1. tidy 默认保守：dry-run 为默认模式，stale 仅报告，pointer 保留；破坏性动作全部要求 `--apply` 且逐类可控。
  Reason: 归档移动不可自动回滚到语义层面，误归档成本高于漏归档。
- D2. evidence 迁移随手重写 ledger 路径引用。
  Reason: 归档规则明文要求引用同步；ledger 是唯一机器读取方。
- D3. S4 采用"保留一句规则 + 指向唯一定义"而非删除重述句。
  Reason: 关键句是既有测试断言与行为契约，删除属高风险低收益；指针已消除定义漂移。
- D4. 对 work 项目用本仓插件源通过 `--project-root` 运行 tidy，而非升级 work 的安装副本。
  Reason: work 的插件副本版本较旧；跨仓运行避免在治理任务中夹带升级。

## Dependencies And Assumptions

### Dependencies

- 第一批（0.3.22）已提交，工作区干净（仅一个未跟踪 review-contract 证据 JSON）。

### Assumptions

- `resolveProjectRoot` 接受 work 项目根（含 docs/ 与项目标记）。
- 过程记录状态启发式覆盖五种既有形态（done/completed、archived 指针、active、无状态行、空目录）。

## Open Questions

### Must Resolve Before Planning

（无。处置方式已由用户确认。）

### Deferred To Planning

- Q1. [Affects R2][technical] gate 归档目录的月份取文件名时间戳还是 mtime（计划阶段按文件名优先、mtime 兜底确定）。

## Evidence Notes

- last-wins 证据 -> `plugins/ai-agent-engine-codex/scripts/ae-tools/utils.mjs` parseOptions 第 24-32 行；gate JSON `validation_commands` 实录单元素。
- 滞留任务形态 -> `docs/00-process/active/` 扫描输出（done/archived 指针/active/无状态/空目录五态并存）。
- work 项目退化 -> 23/31 空目录、gate 142 个（2026-03 起）、记忆文件 78-93KB（2026-08-11 审查报告）。

## Consistency Check

- requirementsCount: 9
- nonFunctionalRequirementsCount: 3
- decisionsCount: 4
- openQuestionsCount: 1
