---
type: prd
status: completed
date: 2026-08-11
topic: knowledge-base-governance
format: human-readable-requirements
sharded: false
---

# 知识库治理第一批：需求单通道、init 停建兼容指针、证据保留策略

## AI Parse Contract

- canonicalKind: requirements
- humanEquivalent: true
- stableIdsRequired: true
- noImplicitScope: true

## Problem Frame

2026-08-11 的知识库与 skill 审查（本会话报告）确认了四个已由用户拍板的治理决策：需求产物存在双通道（`docs/ae/brainstorms/*-requirements.md` 与 `docs/ae/prds/*`，两套 capture 模板已分叉 184 行）；`docs/ai-memory` 兼容指针会被 init 永久带入每个新项目；`docs/external-samples/` 128 个文件无登记说明；`docs/ae/gates/`（本仓 68 个）与 `docs/ae/evidence/artifacts/`（单个 review-package 全量 diff 219KB）无保留策略。本 PRD 把四项决策固化为可验证的需求，交付边界为插件 0.3.22。

## Requirements

**需求单通道（canonical = prds）**
- R1. `docs/ae/prds/` 是需求产物的唯一正典目录；`ae-brainstorm` 产出持久化需求时必须复用 `ae-prd` 的 capture 契约并写入 `docs/ae/prds/`，`ae-brainstorm` 自带的 `references/requirements-capture.md` 删除；`docs/ae/brainstorms/` 保留为探索性记录（视角碰撞、选项对比）。
  Acceptance: 两棵 skill 树中 `ae-brainstorm/references/requirements-capture.md` 不存在；`ae-brainstorm/SKILL.md` 引用 `../ae-prd/references/requirements-capture.md` 与 `docs/ae/prds/`；`tests/skills-docs.test.mjs` 断言新契约且 `npm test` 通过。
- R2. `recovery` 命令把 `docs/ae/prds/*-prd.md` 作为 `requirements` 类型候选纳入扫描（`brainstorms` 旧通道继续识别，保证存量项目可恢复）。
  Acceptance: 在含 PRD 的仓库运行 `node scripts/ae-tools.mjs recovery`，候选列表包含 prds 条目且类型为 `requirements`；新增单测覆盖。
- R3. `init` 创建 `docs/ae/prds/` 目录，`aeReadme` 模板（en/zh-CN）目录说明与新通道一致，并说明其余 AE 子目录（designs、evidence、integrity 等）由对应命令按需创建。
  Acceptance: init dry-run 输出包含 `docs/ae/prds`；模板与本仓 `docs/ae/README.md` 列出 prds 并把 brainstorms 描述为探索记录。

**init 停建兼容指针（存量不动）**
- R4. 自 0.3.22 起 `init` 不再创建 `docs/ai-memory/` 目录与其 `README.md`；不引入任何删除或迁移存量目录的逻辑。
  Acceptance: 临时目录 init dry-run 与实跑输出均不含 `docs/ai-memory`；`memoryReadme` 模板文件从 init-templates 移除；对存量项目无写操作。
- R5. 现行契约文档与新行为一致：`ae-init/SKILL.md`（描述与验证清单）、`capability-catalog.json`、`INSTALL.md`、`INSTALL.zh-CN.md`、`README.md`、`README.en.md` 结构说明、`docs/ae/references/codex-five-layer-architecture.md`、`docs/08-ai-memory/03-key-workflows.md` 不再把 `docs/ai-memory` 描述为 init 产物；历史记录（决策日志既有条目、经验、旧计划）不改写；`docs/08-ai-memory/05-decision-log.md` 追加本次决策条目。
  Acceptance: 上述现行契约文件中 `docs/ai-memory` 仅以"存量兼容说明"形式出现或不出现；决策日志新增条目注明 0.3.22 与理由。

**证据保留策略**
- R6. `review-package` 产物指纹化：不再写入全量 diff 正文；保留提交列表、diffstat、评审清单、可选 impact、base/head 的解析短哈希与逐字节可重建命令（`git diff -U10 <base>..<head>`）。命令返回结构中 `inventory`、`artifact.path` 字段语义不变。
  Acceptance: 单测断言产物包含重建命令且不含 diff 正文段；`npm test` 通过。
- R7. 归档规则（init-templates en/zh-CN 与本仓 `docs/00-process/templates/archive-rules.md`）新增证据保留策略：`docs/ae/gates/` 与 `docs/ae/evidence/artifacts/` 保留 3 个月，超期移入 `docs/ae/archive/` 对应月份目录；review-package 仅保留指纹产物，历史全量 `.diff` 确认无引用后可删除。
  Acceptance: 三个文件包含同义的保留策略章节。

**external-samples 登记保留**
- R8. `docs/external-samples/` 以登记方式保留：新增 `docs/external-samples/README.md` 说明用途（claim checker 的样本语料）、来源（work 项目拷贝，源项目未修改）、引用方（`docs/ae/integrity/work-docs-*.md`）与保留条件（在 integrity 声明引用期间不移动、不改写）。
  Acceptance: README 存在；`docs/ae/integrity/` 引用的样本路径全部保持不变；`check-claims --dry-run` 仍通过。

## Non-Functional Requirements

- NFR1. 双 SemVer 同步递增 0.3.21 -> 0.3.22（根 `package.json` 与插件 `plugin.json`），README 双语追加 `### 0.3.22` 条目（摘要、验证命令、证明边界）。
  Acceptance: `node scripts/check-release-notes.mjs` 通过。
- NFR2. 交付门槛全绿：`npm run check`、`npm test`、`npm run check:smoke`。
  Acceptance: 三个命令零失败。
- NFR3. 不触碰并行会话文件集：fullstack 会话的 `ae-backend`、`ae-sql`、`ae-web-app`、`ae-web-forge`、`ae-debug` references 及其过程记录；共享文件（`package.json`、`plugin.json`、README 双语）仅做字段级或追加式编辑。
  Acceptance: 本批 diff 不含上述 skill 文件。

## Success Criteria

- 新项目 init 后需求产物只有一个正典目录，且不再携带兼容指针目录。
- 评审证据产物体量从百 KB 级降到 KB 级，且保留可重建性。
- 归档规则对证据类产物有明确出口，后续 tidy 工具（下一批）有策略可执行。

## Scope Boundary

### In Scope

- 上述 R1-R8、NFR1-NFR3 涉及的插件脚本、模板、skill 文档、测试与仓库侧文档。

### Out Of Scope

- `ae.mjs tidy`/归档执行命令（分析报告 A1，下一批）。
- 记忆库体积预算与蒸馏规则（A3）。
- 碰撞洞见模板落点（S2）、ae-review 轻量档位（S3）、证据词汇收敛（S4）、handoff 归一（S5）。
- 对存量项目（含本仓与 work 项目）的 `docs/ai-memory` 删除或迁移。
- 归档其他会话遗留的 active 过程记录。

### Constraints

- 与 fullstack 优化会话共享工作区，遵守 NFR3。
- 历史文档（决策日志旧条目、经验、旧 PRD/计划）不得改写。

## Validation Evidence (Conditional)

- 涉及公共分发边界（插件安装面）：以 `npm run check:smoke`（install-smoke + global-install-smoke）为最高适用层级；不声称目标项目运行时验收。
- init 行为变化：以临时目录 dry-run/实跑 JSON 输出为证据层级；`unverified`：真实第三方项目上的 init 效果本批不验证。

## Key Decisions

- D1. 需求正典目录选 `docs/ae/prds/`，`brainstorms/` 降级为探索记录。
  Reason: prds 已有 27 个存量、契约模板更完整（170 行含 Validation Evidence/Must-Haves），且 `ae-prd` 是唯一维护方，消除双模板分叉。
- D2. `docs/ai-memory` 兼容指针对新项目停建，存量不动。
  Reason: 指针创建于 2026-05-11，三个月过渡期已过；每个新项目永久携带 268B 死目录的成本大于兼容收益；存量删除风险高于收益。
- D3. `external-samples/` 登记保留而非归档。
  Reason: `docs/ae/integrity/work-docs-*.md` 以数十条 evidence 路径引用其内容作为 claim checker 样本，移动会使证据路径悬空。
- D4. gate 与 evidence artifacts 保留 3 个月；review-package 指纹化。
  Reason: 用户确认；gate 为小 JSON 可归档保存，review-package 全量 diff 可由 Git 历史逐字节重建，无需入库。

## Dependencies And Assumptions

### Dependencies

- 结构性重构会话已提交（`scripts/ae-tools/` 模块基线可编辑）。
- fullstack 会话对共享文件的编辑为追加式（已观察到 0.3.21 条目与版本字段）。

### Assumptions

- `check-skill-contract.mjs` 支持跨 skill 相对引用（先例：`ae-debug` 引用 `../ae-work/references/local-runtime-smoke-gate.md` 且检查通过）。
- 无测试断言 init 创建 `docs/ai-memory`（已 grep 验证 tests 与 scripts 无此断言）。

## Open Questions

### Must Resolve Before Planning

（无。四项产品决策已由用户确认。）

### Deferred To Planning

- Q1. [Affects R6][technical] review-package 指纹产物是否继续沿用 `.diff` 扩展名或改为 `.md`（由计划阶段按测试与消费方最小改动原则决定）。

## Evidence Notes

- 双模板分叉 -> Evidence: `Compare-Object` 对比两份 requirements-capture.md，差异 184 行（brainstorm 80 行 / prd 170 行）。
- recovery 不扫 prds -> Evidence: `plugins/ai-agent-engine-codex/scripts/ae-tools/recovery.mjs` specs 数组仅含 brainstorms/plans/reviews/gates/handoffs/process-note。
- init 创建 ai-memory -> Evidence: `plugins/ai-agent-engine-codex/scripts/ae-tools/init.mjs` 第 48 行目录数组与第 82 行 memoryReadme 写入。
- review-package 全量 diff -> Evidence: `review.mjs` 第 29/43-44 行 `git diff -U10` 写入 `## Diff` 段；现存产物 219,328 字节。
- external-samples 被引用 -> Evidence: `docs/ae/integrity/work-docs-expanded-claims.md`、`work-docs-sample-claims.md` 数十条 `docs/external-samples/work-docs/...` evidence 路径。
- 版本占用 -> Evidence: `package.json`/`plugin.json` 当前 0.3.21，README 双语已有 `### 0.3.21` 条目。

## Consistency Check

- requirementsCount: 8
- nonFunctionalRequirementsCount: 3
- decisionsCount: 4
- openQuestionsCount: 1
