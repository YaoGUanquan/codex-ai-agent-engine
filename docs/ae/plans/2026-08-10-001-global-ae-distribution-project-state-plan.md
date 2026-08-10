---
type: plan
status: drafted
date: 2026-08-10
title: global-ae-distribution-project-state
origin: docs/ae/prds/2026-08-10-global-ae-distribution-project-state-prd.md
originFingerprint: 2026-08-10-global-ae-distribution-project-state
depth: deep
format: human-readable-plan
sharded: false
---

# Plan: 全局 AE 分发与项目状态归属

## Source

- Requirements: `docs/ae/prds/2026-08-10-global-ae-distribution-project-state-prd.md`
- Governing rules: `AGENTS.md`

## AI Parse Contract

- canonicalKind: plan
- humanEquivalent: true
- stableIdsRequired: true
- noImplicitScope: true

## Scope

实现每用户全局 skill 和私有运行时，使用统一 dispatcher 对项目根进行确定性解析，并以“整批原子迁移”清理经过确认和归属验证的项目级 AE 副本。所有项目 docs、memory、graph、archive 和 `AGENTS.md` 保持原位且不复制。

## Readiness

- Goal: 全局运行时唯一、consumer 项目状态独立、历史 docs 零迁移，并在任何失败后恢复迁移前运行时状态；分发源仓库保持不变，首批只处理 7 个 consumer。
- Acceptance criteria: PRD R1-R13、NFR1-NFR4。
- Non-goals: 集中知识库、跨用户管理、删除分发源仓库、删除 deferred 的 `D:\codes\work`、真实 consumer 清理、管理员模式和未验证的 Codex 全局插件目录。
- Affected areas: 插件 CLI、分发安装器、技能说明与镜像、安装文档、回归测试、发布 metadata。
- Validation surface: 解析单测、两用户两项目迁移 fixture、安装烟测、源镜像和发布检查；真实 apply 仍需明确授权。
- Open questions: none；跨卷备份和同目录多标记的语义已在 ADR-2/ADR-3 定案。

## Contract Value Classification

- Canonical persisted value: 每个项目根下的 `AGENTS.md` 与 `docs/**`；它们不属于全局运行时，也不进入备份内容。
- Derived or ephemeral representation: 用户级迁移清单、阶段报告、指纹和暂存目录；报告不包含 docs 正文。
- Caller-controlled input: `--project-root`、全局根覆盖、清单路径、`--apply` 与操作确认标识。
- Compatibility fallback or source precedence: `--project-root` 优先于最近项目标记；无显式根时只使用最近 `.git`、受管 `AGENTS.md` 或 `docs/ae` 标记，同目录的多个标记合并为同一根；项目包装器只用于恢复，不是新运行入口。
- Trust boundary: 清单中的路径和 `role` 都是调用方输入；`apply` 时以路径规范化、`lstat`、`realpath` 当前用户包含性、动态 source-root、固定首批允许集合、AE 归属指纹、操作确认和每次删除前的重新校验重新建立可信边界。

## Validation Evidence

| Acceptance criterion | Applicable tier | Expected signal and bounded claim | Preconditions / owner | Status | Recovery or rollback signal |
| --- | --- | --- | --- | --- | --- |
| R4-R6 | Focused automated test | dispatcher 在子目录、nested Git、submodule、monorepo 和显式根 fixture 返回唯一 project root。 | Maintainer；Node fixture。 | unverified | 根不匹配、链接或全局根被接受即失败。 |
| R2-R3, R9-R13 | Integration or build | 逐阶段故障注入后，7 个 consumer 项目级组件和原有用户级 AE 完整恢复，source/deferred fixture 不写入，全局 skill 不激活。 | Maintainer；隔离 home/project fixture。 | unverified | 任一路径、指纹或恢复哈希不符即报告 `rolled-back` 并失败。 |
| R7-R8, NFR2 | Integration or build | 两项目 docs 哈希不变，memory/graph 查询不跨根。 | Maintainer；临时项目 fixture。 | unverified | docs 被读写为迁移输入、哈希变化或跨根查询即停止。 |
| R1-R3, R11-R13 | Deployment or operations | 当前用户实际清单的 preview 与逐项预检报告一致，明确显示 7 个 consumer、1 个 distribution-source 和 1 个 deferred。 | 用户确认的全局根和清单。 | blocked | 任一候选未通过归属/路径检查即不允许 apply。 |
| R9-R13 | Deployment or operations | 实际 apply 后 7 项 consumer 均后检通过、source/deferred 哈希不变，且只激活一个用户级 AE skill 集；备份和 journal 保留。 | 单独的明确 apply 授权和回滚访问。 | blocked | 任一项失败立即整批恢复，不声明迁移完成。 |

## Verification Gaps

- Affected requirement ID: R1, R4
  Required proof and missing check: Codex 对用户级 `$HOME/.agents/skills` 以外目录的发现行为及任何“全局 plugin”说法。
  Status: unverified
  Owner and next action: 实现者仅在 `$HOME/.agents/skills` 放置 skill；在受控用户级烟测中验证，文档不将私有运行时目录说成官方插件目录。

## Alternatives Considered

- Recommended: 用户级运行时 + 项目内状态 + 单一 dispatcher + 全局 skill 最后激活的整批原子迁移。
  Fit: 运行时去重，资料与 Git 边界不变，失败后不留下重复 skill。
  Trade-off: 单个项目异常会回滚整批，必须修复问题后重试。
- Alternative: 用户级运行时 + 项目内状态 + 可恢复的部分迁移。
  Rejected because: 失败时全局与已恢复项目级 skill 会并存，需要另行设计冲突禁用机制，违背 R9。
- Alternative: 集中 docs 和知识库。
  Rejected because: 破坏项目可携带性、相对链接、访问边界和 Git 历史，并引入高风险历史数据迁移。

## Decision Drivers

- Driver 1: docs、记忆、图谱和 archive 的项目级完整性。
- Driver 2: 删除/覆盖操作的最小权限、可审计性和可恢复性。
- Driver 3: 全局 skill 与项目级 skill 不能在失败后长期并存。

## Decisions

### ADR-1 - 单一全局 dispatcher 与显式项目根约定

- Decision: 全局 skill 统一调用 `$HOME/.agents/ai-agent-engine-codex/bin/ae.mjs` dispatcher；所有项目相关命令支持 `--project-root <absolute-path>`。
- Drivers: 清理项目包装器后仍需稳定入口，且不能让 `process.cwd()` 隐式指向用户级运行时。
- Alternatives: 保留薄项目 shim；继续只依赖 `process.cwd()`。
- Why chosen: 直接路径在全局 skill 中可审计；显式根可处理项目外启动、monorepo 和自动化场景。
- Consequences: 所有 24 处源/镜像说明与能力目录必须同步；`bin/ae.mjs` 需路由到经验证的私有运行时，`ae-tools.mjs` 需统一剥离并解析全局选项后再分派命令。
- Follow-ups: 将路径显示为平台正确的 PowerShell/Node 调用，并在 `help` 中说明无项目根的错误和 `init` 的显式根要求。

### ADR-2 - 最近项目标记解析

- Decision: `--project-root` 优先；否则自 CWD 向上选择最近真实目录中的 `.git`、受管 `AGENTS.md` 或 `docs/ae` 标记。同一目录中多个标记合并为同一个根，标记种类只记录在诊断输出；`init` 从无标记目录运行时必须要求显式根。
- Drivers: 嵌套仓库、submodule、monorepo、项目子目录与非项目目录的确定性。
- Alternatives: 始终使用 Git 顶层；始终使用 CWD；隐式创建 docs。
- Why chosen: 最近标记支持真正的嵌套项目，同时避免从任意临时目录生成资料树。
- Consequences: 需要检查 `.git` 文件型 worktree、符号链接/junction 和同目录多标记 fixture；全局运行时根列入拒绝集合。
- Follow-ups: 将合并诊断和错误码固定为根解析合同测试。

### ADR-3 - 全局 skill 最后激活的整批原子迁移

- Decision: 清单先按 `consumer`、`distribution-source` 和 `deferred` 分类；源仓库与 deferred 项永远在所有备份、删除和恢复路径之外。所有 7 个 consumer 项目和已有用户级 AE 再预检并快照；每次路径变更前写入持久 journal；备份统一采用“复制到操作专属备份、fsync、逐文件哈希验证、再删除源”的跨卷安全序列。已确认归属的既有用户级 `ae-*` 先从发现目录撤至备份；新运行时在隔离暂存区验证；逐项移除 consumer 项目副本并后检；所有 consumer 完成后才将 skill 激活到 `$HOME/.agents/skills`。失败则在目标为空且指纹匹配时从备份逆序恢复全部已变更组件和先前用户级状态；终态备份和 journal 默认保留。
- Drivers: R9/R10 的无冲突和原子性要求。
- Alternatives: 逐项目提交后暂停；先激活全局 skill 再清理。
- Why chosen: 失败时用户返回到完整的项目级运行方式，不暴露重复选择器状态。
- Consequences: 迁移不可并发；开发源仓库保留本地 source/mirror skill，因而在该仓库工作时允许开发例外的本地/用户级重复发现，但它绝不成为 consumer cleanup 结果。全部恢复成功前操作报告保持 `rolling-back`，进程异常终止时记录 `interrupted` 并阻止下一次新操作，恢复失败为明确的 `recovery-failed` 人工处理状态而非成功。
- Follow-ups: 下一次 install/migrate/recover 必须先消费 `interrupted` journal；恢复遇到目标已存在或哈希不匹配时不得覆盖，必须报告 `recovery-failed` 并保留备份供人工处理。

### ADR-4 - 显式 purge 的备份生命周期

- Decision: `purge --operation <id>` 是唯一的备份/journal 清理入口；只接受终态操作，不接受活动或 `interrupted` 操作。
- Drivers: 保留恢复来源、审计证据和用户可控的数据删除边界。
- Alternatives: 成功后自动删除；按固定天数自动过期。
- Why chosen: 自动过期可能在用户发现问题前删除恢复材料，且固定天数无法适配不同项目风险。
- Consequences: 用户目录长期保留少量备份和状态；需要提供 purge 预览、operation ID 精确匹配和路径保护测试。
- Follow-ups: U3/U4 必须覆盖 purge dry-run/apply、活动操作拒绝和 purge 后不可 restore 的明确报告。

## Risks

- 已修改或无法指纹确认的项目级/用户级 AE 文件导致整批被阻断。
- `.git` worktree、junction 和嵌套标记造成错误根选择。
- 跨卷备份在复制或恢复途中失败。
- 全局 skill 元数据或镜像遗漏旧包装器调用，导致安装后运行失败。

## Pre-Mortem

- Failure scenario 1: 某项目 docs 被误纳入备份或删除集。
  Mitigation: 删除候选仅允许已枚举的 AE 子路径/marketplace 单条目；对 `docs/**`、`AGENTS.md`、项目根、`.codex/**` 和源代码硬拒绝，前后做 docs 哈希断言。
- Failure scenario 2: 第 N 个项目删除失败，留下全局和项目级同名 skill。
  Mitigation: 全局 skill 保持暂存且未激活；失败触发反向恢复所有已处理项目并验证恢复哈希。
- Failure scenario 3: 另一个用户的目录被写入或清单被误用。
  Mitigation: 所有默认与覆盖路径 `realpath` 后必须位于当前 `homedir()`；清单绑定当前用户标识和全局根指纹，不匹配即拒绝。
- Failure scenario 4: 分发源仓库或 deferred 项被误判为 consumer 并删除插件源。
  Mitigation: 清单为每项写入不可伪造 role；任何删除候选与当前 source root、`plugins/ai-agent-engine-codex` 或源 `.agents/skills` 重叠即拒绝，且以源/镜像哈希作为后检。
- Failure scenario 5: 成功迁移后自动清理备份，导致无法恢复。
  Mitigation: 备份和 journal 默认保留；purge 只接受终态完整 operation ID，并在执行前 preview。

## Global Constraints

- 不移动、复制、删除或改写任何项目 `docs/**`、`AGENTS.md`、项目源代码或非 AE 插件。
- 不递归删除 `D:\codes`、项目根、用户主目录或全局根；删除只对验证后的精确子路径生效。
- 不删除、备份或恢复分发源仓库 `D:\codes\ph-AI-Agent-Engine` 的插件源与 `.agents/skills` 镜像；该仓库只作为构建来源和 smoke fixture。
- 不删除、备份或恢复 deferred 项目 `D:\codes\work`；它只在清单中报告 deferred。
- 不自动清理备份和 journal；仅显式 `purge --operation <id>` 可删除对应终态操作的恢复材料。
- 不引入数据库、向量索引、MCP、后台进程、跨项目同步或管理员多用户操作。
- 实际 apply 必须在 preview 后获得独立用户授权；本计划本身不授权任何真实变更。

## Implementation Units

### U1 - 建立用户级分发、归属与迁移合同

- Goal: 定义用户级根、用户级现有安装保护、带 source/consumer 角色的清单、操作状态、允许删除集合、指纹、阶段报告和跨卷恢复合同。
- Requirements covered: R1-R3, R9-R13, NFR1, NFR2, NFR4.
- Acceptance criteria covered: 所有候选路径、已有用户级 AE 和 manifest 都在写入前通过当前用户、真实路径、归属和 role 检查；source/deferred repository 永远不能进入写入集合。
- Depends on: none.
- Files:
  - `docs/ae/references/global-ae-install-contract.md`
  - `plugins/ai-agent-engine-codex/scripts/global-install-contract.mjs`
  - `tests/skill-scripts.test.mjs`
- Forbidden files:
  - real target project `docs/**`
  - `AGENTS.md`
  - real target projects
- Layer ownership: Distribution, Guardrail.
- Approach: 以 `homedir()` 为唯一默认边界；从安装器的真实 `repoRoot` 推导 source root，定义 schema：`operationId`、当前用户根指纹、全局根、清单项、预览 `role`、组件指纹、状态、journal phase、backup、rollback。禁止通过扫描直接 apply，且 `apply` 不信任清单的路径或 `role`：它必须重新推导当前用户范围、source/deferred 排除和固定首批 consumer 允许集合。只有重新验证后的 `consumer` 可产生候选组件；`distribution-source` 和与动态 source root 重叠的路径必须在预检前拒绝。给所有目标加入 `lstat`、`realpath`、允许子路径和 AE 内容指纹检查；用户级旧 AE 与 consumer 候选采用同一阻断/备份/恢复策略。
- Tests: 当前用户和第二用户 home、路径逃逸、junction/symlink、修改过的 `ae-*`、未知 marketplace 条目、清单外项目、跨用户清单、source/deferred 拒绝、`interrupted` journal 恢复、purge 状态/路径保护和 `D:\codes`/根目录拒绝。
- Validation: focused Node tests；直接 schema/fixture 断言；`node scripts/check-ae-artifacts.mjs`。
- Rollback signals: 合同接受任一非当前用户、非 AE 或宽泛删除路径。
- Deferred to implementation: 用操作专属备份目录执行复制、fsync、逐文件哈希验证、删除源和逆序恢复；恢复绝不覆盖意外的新目标。

### U2 - 实现 dispatcher 与项目根解析

- Goal: 让全局运行时对每个项目命令都使用确定的 project root，并从全局 skill 直接调用。
- Requirements covered: R4-R6, R7-R8, NFR2.
- Acceptance criteria covered: 子目录、nested Git、submodule、monorepo、显式根和非项目目录均得到规定的根或错误码；全局根不会成为 worktree。
- Depends on: U1.
- Files:
  - `plugins/ai-agent-engine-codex/scripts/ae-tools.mjs`
  - `plugins/ai-agent-engine-codex/scripts/project-root.mjs`
  - `plugins/ai-agent-engine-codex/skills/**/SKILL.md`
  - `.agents/skills/**/SKILL.md`
  - `plugins/ai-agent-engine-codex/skills/ae-help/references/capability-catalog.json`
  - `.agents/skills/ae-help/references/capability-catalog.json`
  - `plugins/ai-agent-engine-codex/skills/ae-lfg/references/pipeline.md`
  - `.agents/skills/ae-lfg/references/pipeline.md`
  - `plugins/ai-agent-engine-codex/skills/ae-work/references/shipping-workflow.md`
  - `.agents/skills/ae-work/references/shipping-workflow.md`
  - `tests/skill-scripts.test.mjs`
- Forbidden files:
  - `docs/08-ai-memory/**`
  - `.mcp.json`
  - project `scripts/ae-tools.mjs` wrappers
- Layer ownership: Distribution, Memory, Knowledge, Guardrail.
- Approach: dispatcher 先抽取 `--project-root`，再解析真实根并将其传入所有 worktree 相关命令；只有 `help` 不要求根，`init` 在未发现标记时必须显式根。将 24 个已发现的源/镜像调用面统一为用户级 dispatcher，不保留旧包装器为正常路径。根解析以最近目录取胜、同目录标记合并，并对 `.git` 文件/目录、受管 `AGENTS.md`、`docs/ae` 和拒绝路径保留诊断结果。
- Tests: 命令矩阵覆盖 every dispatcher command；explicit-root precedence、subdirectory、nested repository、submodule `.git` file、monorepo、uninitialized explicit init、未标记目录、global root、链接/junction 和跨根 memory/graph 查询；逐一覆盖 18 个 `SKILL.md` 和 6 个 reference/catalog 旧入口。
- Validation: focused Node tests；源/镜像哈希与 capability catalog 检查；对两个 skill trees 执行旧项目包装器引用数为 0 的断言；安装后的 `help` 及 `init --dry-run --project-root <fixture>`。
- Rollback signals: 任一全局 skill/目录仍引用项目包装器，或命令把全局根/错误祖先根用于 docs 操作。
- Deferred to implementation: 同目录多标记的合并诊断与错误消息作为合同测试固定下来。

### U3 - 实现隔离暂存与整批原子迁移

- Goal: 安装和验证全局运行时后，以全局 skill 最后激活的顺序完成 7 项 consumer 或用户自有 consumer 清单的原子迁移。
- Requirements covered: R1-R3, R7, R9-R13, NFR1-NFR4.
- Acceptance criteria covered: 任意阶段失败均恢复每个已变更的 consumer 项目级/用户级 AE 组件，global skill 未激活，docs 哈希不变，source/deferred 仓库哈希不变；备份和 journal 保留。
- Depends on: U1, U2.
- Files:
  - `scripts/install-global.mjs`
  - `plugins/ai-agent-engine-codex/scripts/global-install.mjs`
  - `scripts/install-project.mjs`
  - `plugins/ai-agent-engine-codex/scripts/update-project.mjs`
  - `tests/skill-scripts.test.mjs`
- Forbidden files:
  - `docs/**`
  - `AGENTS.md`
  - `.codex/**`
  - real target projects
- Layer ownership: Distribution, Guardrail.
- Approach: 预检全部清单和已有用户级 AE；先拒绝 `distribution-source`、`deferred` 和所有 source-root 重叠候选。将新运行时和 skill 写到操作专属 staging；验证受控用户级 smoke 确认 `$HOME/.agents/skills` 的 skill 可被发现；将已验证的旧用户级 `ae-*` 从发现目录移至备份；逐项对允许 consumer AE 子路径做可校验快照、删除和后检；仅在全部成功后激活全局 skill。每个不可逆步骤前提交 journal；下次运行先恢复 `interrupted` journal。任一错误走逆序恢复：先撤销已激活/替换的全局项，再恢复 consumer 项目和旧用户级项；恢复不完整时保留备份、输出 `recovery-failed` 并停止。终态备份和 journal 不自动删除；`purge --operation <id>` 经过 preview 后才可清理。项目安装器只作为旧安装恢复/兼容检查输入，不能在迁移后被 dispatcher 依赖。
- Tests: 每个迁移阶段注入失败、journal 中断恢复、不可写目标、跨卷备份、已修改 wrapper、非 AE skill、第三方 marketplace 条目、激活失败、恢复失败、source/deferred 拒绝、purge 状态和 7 consumer + 1 source + 1 deferred 的清单 fixture；前后 docs 哈希、source/mirror 哈希、全局 skills 可见性和恢复哈希断言。
- Validation: isolated two-user/two-project integration fixture；受控用户级 discovery smoke；purge dry-run/apply smoke；`npm test`；global/project install smoke；`node scripts/check-ae-artifacts.mjs`。
- Rollback signals: 任一失败后发现全局 `ae-*` 已激活、consumer 项目 AE 缺失、source/deferred/mirror 哈希变化或 docs 哈希变化；purge 删除非目标 operation 路径。

### U4 - 同步分发文档、烟测与发布证据

- Goal: 将新 dispatcher、项目根规则、原子迁移/恢复语义、7 consumer + 1 source + 1 deferred 的首批清单边界和其他用户隔离要求明确写入可分发文档。
- Requirements covered: R1-R13, NFR1-NFR4.
- Acceptance criteria covered: 文档、帮助、镜像、测试和版本记录不再声称未验证的全局插件能力或可恢复的半迁移状态。
- Depends on: U2, U3.
- Files:
  - `INSTALL.md`
  - `INSTALL.zh-CN.md`
  - `README.md`
  - `README.en.md`
  - `scripts/check-global-install-smoke.mjs`
  - `scripts/check-install-smoke.mjs`
  - `package.json`
  - `plugins/ai-agent-engine-codex/.codex-plugin/plugin.json`
- Forbidden files:
  - real target projects
  - user-home docs content
- Layer ownership: Distribution, Knowledge, Guardrail.
- Approach: 将正式命令语法、`--project-root` 规则、默认 preview、显式 apply、整批 rollback、restore、purge、首批发现清单为 7 consumer + 1 distribution-source + 1 deferred、开发源仓库保留 source/mirror、其他用户需各自安装与清单确认写入双语文档。版本仅在可分发内容确实变更且 U1-U3 回归通过后递增；发布说明写明测试证明边界。
- Tests: source/mirror metadata、skill command contract、dispatcher root matrix、global/project install smoke、release note/package checks。
- Validation: `npm test`、`npm run check`、`node scripts/check-ae-artifacts.mjs`、global/project install smoke、`node scripts/check-release-notes.mjs`、`git diff --check`。
- Rollback signals: 文档仍要求 `node scripts/ae-tools.mjs`、宣称未验证的 Codex 全局 plugin 目录，或将部分迁移描述为成功。
- Deferred to implementation: 真实用户级 smoke 仅证明当前用户的受控安装，不提升为管理员跨用户支持证明。

## Consistency Check

- implementationUnitCount: 4
- sourceRequirementsCovered: R1, R2, R3, R4, R5, R6, R7, R8, R9, R10, R11, R12, R13, NFR1, NFR2, NFR3, NFR4
- sourceRequirementsDeferred: none; every real apply needs separate authorization.
- openQuestionsCount: 0

## Validation Plan

- Unit: 清单/路径/指纹合同和 dispatcher 根解析的 Node fixture。
- Integration: 两个用户主目录、两个项目、nested Git/submodule/monorepo、全部失败阶段与跨卷备份的模拟迁移。
- User flow: 在当前用户的用户级安装中，分别从项目子目录和显式根执行 help、dry-run、init preview、memory/knowledge 查询。
- Data / operations: 真实 7 项 consumer 仅执行预览，实际 apply 必须另行书面明确授权；9 项发现清单中的 source 和 deferred 项只报告排除原因，备份/journal 在 purge 前保留，逐项报告不含 docs 正文。
- Observability: 输出 operation ID、阶段、解析根、角色、允许删除路径、指纹、备份、后检、rollback 和 purge 结果；`completed` 仅在全局 skill 激活后出现。

## Rollback / Recovery

- 任一预检失败：不创建活动全局 skill，不变更项目。
- 暂存/清理/后检/激活失败：逆序恢复本次变更的用户级和 consumer 项目级 AE 组件；验证恢复哈希并保留备份/journal，不自动删除恢复材料。
- 恢复本身失败：保留只读备份和完整报告，标记 `recovery-failed`，停止且不把迁移视为完成；由用户使用明确 operation ID 处理。
- 项目 docs、记忆、图谱、`AGENTS.md`、source repository 和 deferred `work` 永远不在恢复或删除集合中；purge 仅按 operation ID 删除对应恢复材料。

## Plan Self-Review

- Placeholder scan: pass；没有未决技术问题或未标注占位符。
- Consistency check: pass；R1-R13 与 NFR1-NFR4 都映射到至少一个 unit。
- Scope check: pass；历史资料集中迁移、跨用户操作和真实清理明确排除。
- Acceptance coverage: pass；新增 dispatcher、根解析、用户级既有安装保护、角色分类、整批原子回滚和显式 purge 均有 unit 与验证。
- Validation gaps: 官方运行时对用户级 skill 发现仍需受控 smoke；真实 7 项 consumer apply、purge 和其他用户实际安装均未执行。
- Alternatives and ADR check: pass；部分迁移因同名 skill 冲突风险被拒绝。
- High-risk pre-mortem check: pass；删除、根解析、跨用户和跨卷恢复均有止损信号。

## Handoff

先以 `ae-review domain:document mode:report-only` 审查本 PRD 和计划。只有审查通过且用户单独授权后，才进入 `ae-work`；不得由本计划触发全局安装或真实删除。
