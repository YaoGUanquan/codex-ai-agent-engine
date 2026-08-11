---
type: prd
status: completed
date: 2026-08-11
topic: governance-batch-four
format: human-readable-requirements
sharded: false
---

# 知识库治理第四批：版本记录拆分、过程归档收尾、旧栈与前端契约处置

## AI Parse Contract

- canonicalKind: requirements
- humanEquivalent: true
- stableIdsRequired: true
- noImplicitScope: true

## Problem Frame

README 路线图第 7-10 条是三批治理后的残余：README 版本节积累 18 条双语条目（0.3.24→0.3.7）使正文过长；`docs/00-process/active/` 仍有 4 个已完成或指针目录（tidy 对 archived-pointer 刻意保留、对无 done 标记的完成任务不动手）；旧栈前端适配与前端质量契约交叉一致性两项按用户方向不做预填实现，只需把"按需触发"的处置固化为可查的决策记录。本批为纯仓库侧变更，不触碰 `plugins/`、`.agents/` 分发内容。

## Requirements

- R1. 版本记录拆分：新建根 `CHANGELOG.md`（中文）与 `CHANGELOG.en.md`（英文）承载全部历史条目（0.3.7 起，共 18 条）；README.md/README.en.md 版本节仅保留最近 5 条（0.3.24→0.3.20）并链接对应 CHANGELOG；`scripts/check-release-notes.mjs` 校验目标改为：当前版本条目须同时存在于 README 与 CHANGELOG 四个文件、README 版本条目数 ≤5、README 含 CHANGELOG 链接、README 条目版本集合是对应 CHANGELOG 的子集；同步更新 `tests/contracts.test.mjs` 断言与 AGENTS.md「插件分发版本」规则、`docs/release-checklist.md`、README 双语「推进原则/Working rule」段。
  Acceptance: `node scripts/check-release-notes.mjs` 通过；新契约单测含正例与至少 3 个反例（CHANGELOG 缺当前条目、README 超 5 条、README 缺链接）；迁移无损（README+CHANGELOG 条目并集 = 迁移前 README 条目集合，逐条内容一致）。
- R2. 过程文档归档收尾：`docs/00-process/active/` 下 4 个目录并入 `docs/00-process/archive/2026-08/<task>/`——`api-smoke-fillable-request-config`、`personal-marketplace-global-plugin`（progress.md 原样移动）；`fullstack-skill-optimization`、`knowledge-base-governance`（指针 progress.md 并入已有归档目录，无同名冲突）；本批自身的过程目录在交付时同样归档，active 结束时不留残余。
  Acceptance: active 目录为空；归档侧文件齐全无覆盖；引用旧 active 路径的文档不产生新增断链（历史归档文档中的"former path"表述属历史记录，不改写）。
- R3. 旧栈按需补充策略契约化：不预填 Svelte 4 stores / NgModule / Options API 对照条目；README 双语路线图第 7 条改写为"策略已定：按需触发"，指向决策日志既有条目（2026-08-11 Frontend stack guidance as parallel reference files，其 Re-evaluate 条件即触发信号）；触发后的动作边界写入本批经验笔记：仅为受影响框架补最小对照条目，届时属插件内容变更须按规则递增版本。
  Acceptance: README 双语第 7 条为已记录策略而非待办；`plugins/**`、`.agents/**` 的 guidance 文件零改动。
- R4. 前端质量契约交叉一致性评估与处置：完成评估并记录——对应关系现状（`web-ui-quality.md` 第 8/9/10/12-15 项 ↔ `ae-review` Frontend Components / Styles 镜头 6 项 ↔ `browser-acceptance.md` 第 6/7 项与 Material Motion 节，约 5 组对应）、既有守护（motion/reduced-motion 关键词已被 `tests/skills-docs.test.mjs` 锁定）、漂移史（0.3.18/0.3.19 同日引入至今零漂移事故）；处置为暂缓实现映射说明与 contract 检查，复评触发：出现第 4 份前端契约文件、发生一次实际漂移缺陷、或前端条目再批量增长；届时先做轻量映射说明而非校验脚本。落点：决策日志新条目 + README 双语第 10 条改写。
  Acceptance: 决策日志含评估结论与复评触发；README 双语第 10 条为已评估处置而非待办。
- R5. 批次治理工件：PRD（本文件）、计划、经验笔记、归档 summary 按批次惯例产出；`docs/08-ai-memory/00-registry.json` 增加 decision-log 到本批工件的声明关系。
  Acceptance: `node scripts/check-ae-artifacts.mjs`、`node scripts/check-memory-knowledge-contract.mjs --root .` 通过。

## Non-Functional Requirements

- NFR1. 零分发内容变更：`git status` 不出现 `plugins/`、`.agents/` 改动；不递增 SemVer；不新增 README 版本条目。
- NFR2. `npm run check`、`npm test` 全绿。
- NFR3. 全部新文件与改写为 UTF-8 无 BOM；迁移的中文条目除位置外逐字节保持。

## Success Criteria

- README 版本节从 18 条降到 5 条且被 checker 锁定上限，双语正文显著变短；active 目录只反映真正进行中的工作；两项"按需触发"处置可在决策日志中直接查到触发条件。

## Scope Boundary

### In Scope
- R1-R5、NFR1-NFR3。

### Out Of Scope
- tidy 的 archived-pointer 保留策略变更（插件行为，另批评估）。
- svelte/angular/vue guidance 文件内容与前端契约映射说明/检查的实现。
- 本仓记忆文件蒸馏（05-decision-log 超预算为批次三已知项，另行处理）。
- Git commit/push（按用户显式指令执行）。

### Constraints
- 发布说明校验契约的消费者全部在仓库侧（脚本、测试、AGENTS.md、release-checklist、README），插件目录零引用，改动不影响已安装项目。

## Validation Evidence (Conditional)

- 本批证据层级为静态检查与单元测试（`npm run check`、`npm test`、`check-release-notes` 正反例）；`unverified`：GitHub 页面对 CHANGELOG 的渲染效果、其他消费项目更新后的运行时影响（无插件变更，预期无影响）。

## Key Decisions

- D1. CHANGELOG 采用"完整历史"模型而非"仅溢出条目"模型：每次发布同时写 README 与 CHANGELOG，README 只做最近窗口（5 条），CHANGELOG 单文件即完整历史；子集校验防手工删漏。双语两份（CHANGELOG.md 中文 / CHANGELOG.en.md 英文）与 README 布局对齐。
- D2. 归档执行为手动移动而非改 tidy：tidy 对 archived-pointer 目录"always kept"、对无标记完成任务不判 done，均为面向异构项目的保守运行时行为；本仓一次性收尾不值得为此改插件并升版本。
- D3. 旧栈适配不预填：决策日志 2026-08-11 前端条目的 Re-evaluate 条件已是正确触发信号，本批只把 README 待办改写为指向该策略，避免重复决策记录。
- D4. 交叉一致性评估结论为暂缓：3 文件约 5 组对应、零漂移史、motion 维已有测试锁定，新增 contract 检查的长期维护成本高于当前漂移风险；触发条件成立时先做映射说明。

## Dependencies And Assumptions

### Dependencies
- 0.3.24 已发布（`6721ce3`），当前工作区仅有未跟踪的治理文档。

### Assumptions
- README 版本保留窗口 5 条为合理默认；用户方向仅说"最近数个版本"，如需调整仅改一处常量与文案。
- 归档月份取任务完成月（四个目录均为 2026-08）。

## Open Questions

### Must Resolve Before Planning
（无）

### Deferred To Planning
（无）

## Evidence Notes

- README 版本节现存 18 条（0.3.24→0.3.7）；`git log -S "### 0.3.6" -- README.md` 无结果，发布说明自 0.3.7 起才存在，CHANGELOG 前言可如实声明。
- tidy 分类口径 -> `plugins/ai-agent-engine-codex/scripts/ae-tools/tidy.mjs`：`状态/status: archived` 判 archived-pointer 且始终保留；done/completed 标记才判 done；`api-smoke`、`personal-marketplace` 两目录无状态标记。
- 归档目标现状 -> `archive/2026-08/fullstack-skill-optimization/`、`archive/2026-08/knowledge-base-governance/` 均仅含 summary.md，指针 progress.md 并入无同名冲突。
- 发布说明契约消费者 -> `scripts/check-release-notes.mjs`、`tests/contracts.test.mjs`（27-49 行）、`AGENTS.md` 插件分发版本节、`docs/release-checklist.md`（39 行）、README 双语推进原则段；`plugins/` 内零引用（全库 grep）。
- 交叉一致性现状 -> `web-ui-quality.md`（15 项，其中 8/9/10/12-15 为可访问性/响应式/布局稳定/动效）、`ae-review` FE 镜头（6 查项）、`browser-acceptance.md`（7 项最低证据 + Material Motion 节）；`tests/skills-docs.test.mjs` 806-838 行锁定 quality 与 acceptance 的 motion/reduced-motion/completion state 关键词及镜像一致。
- 既有测试对 README 的其余断言均针对能力清单与边界章节，与版本条目迁移无冲突（`tests/skills-docs.test.mjs`、`tests/ae-tools.test.mjs` 相关行核对）。

## Consistency Check

- requirementsCount: 5
- nonFunctionalRequirementsCount: 3
- decisionsCount: 4
- openQuestionsCount: 0
