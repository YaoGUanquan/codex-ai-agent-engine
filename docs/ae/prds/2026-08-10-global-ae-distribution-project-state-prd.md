---
type: prd
status: drafted
date: 2026-08-10
topic: global-ae-distribution-project-state
format: human-readable-requirements
sharded: false
---

# 全局 AE 分发与项目状态归属

## AI Parse Contract

- canonicalKind: requirements
- humanEquivalent: true
- stableIdsRequired: true
- noImplicitScope: true

## Problem Frame

当前 AE 以项目级插件、skill 镜像和本地脚本分发。已发现当前用户范围内的 9 个候选根，其中 `D:\codes\ph-AI-Agent-Engine` 是分发源仓库，7 个由用户批准为首批可迁移消费者，`D:\codes\work` 延后处理；每个消费者项目已有独立的 docs、记忆和知识关系。目标是让每个操作系统用户拥有独立的 AE 分发运行时，同时让项目资料继续只归属该项目；一次获授权的迁移应安全地移除首批消费者清单内的项目级运行时副本。

成功不等于“文件被删掉”：全局 skill 必须能从任意项目子目录正确定位项目根，既有资料不可移动或改写，且任何单点失败都不能留下全局和项目级同名 skill 并存的半迁移状态。

## Requirements

**用户级分发与隔离**

- R1. 每个操作系统用户可在自己的主目录安装独立的 AE 运行时；安装器不得硬编码用户名或读写其他用户的主目录。
  Acceptance: 默认 skill 目录由当前 `homedir()` 解析为 `$HOME/.agents/skills`，私有运行时、备份和迁移状态解析为 `$HOME/.agents/ai-agent-engine-codex`；所有解析后的路径均经真实路径和当前用户主目录包含关系验证。
- R2. 安装器必须把现有用户级 `$HOME/.agents/skills/ae-*` 和私有 AE 运行时视为受保护目标，而非可直接覆盖的空目录。
  Acceptance: 对每个已有候选项执行 AE 归属指纹、版本和修改状态检查；只有确认归属且未修改的项才可备份并替换，未知或已修改项会在写入前阻断整批操作并提供恢复信息。
- R3. 迁移目标只能来自当前用户明确确认的清单，扫描结果只能生成候选项。
  Acceptance: 默认命令只生成或验证清单；只有同时提供该清单、`--apply` 和本次操作确认标识才会变更文件，清单外项目、另一用户目录、`D:\codes`、项目根和用户主目录均不可成为删除目标。

**全局运行契约与项目边界**

- R4. 全局 skill 必须通过一个受支持的用户级 AE dispatcher 调用运行时，不再依赖项目内 `node scripts/ae-tools.mjs` 包装器。
  Acceptance: 稳定入口固定为 `$HOME/.agents/ai-agent-engine-codex/bin/ae.mjs`，调用形态为 `node <ae-home>/bin/ae.mjs <command> [--project-root <path>]`；安装后所有可分发 skill 说明、能力目录、帮助文本和文档均使用这一入口及参数约定；项目级包装器不再是正常运行所必需的入口。
- R5. Dispatcher 必须定义确定的项目根解析规则，并将解析出的根作为 docs、记忆、图谱和所有相对路径的唯一 worktree。
  Acceptance: `--project-root <path>` 优先；未提供时从当前工作目录向上寻找最近的真实目录项目标记（`.git` 文件或目录、受管 `AGENTS.md`、或既有 `docs/ae`）。同一目录出现多个标记时合并为同一个根，标记种类仅作为诊断信息；嵌套 Git 仓库和 submodule 取最近目录。没有标记时，除 `help` 外报 `AE_PROJECT_ROOT_REQUIRED`，而 `init` 必须显式提供 `--project-root`。全局运行时根永远不能被解析为项目根。
- R6. `--project-root` 必须支持明确的 monorepo 边界，而不允许静默从任意子目录创建或合并项目状态。
  Acceptance: 显式根必须是存在的真实目录；对非 `init` 命令，它必须是项目标记所在目录。monorepo 的默认状态归属于最近 Git 根；需要不同资料边界时用户必须显式指定该子项目根并先完成其 `init`。符号链接、junction、根目录和全局运行时目录均被拒绝。

**项目状态与知识归属**

- R7. `AGENTS.md`、`docs/ae`、`docs/00-process`、`docs/08-ai-memory` 和 `docs/ai-memory` 必须留在各自项目根，不迁移、复制、集中重建或删除。
  Acceptance: 迁移前后每个项目中上述路径及内容保持原位、可读且哈希不变；全局运行时只保存分发代码、版本、受保护备份和不含 docs 内容的迁移元数据。
- R8. 已有历史资料无需转换；各项目的 `docs/08-ai-memory/00-registry.json` 继续只声明本项目的 Markdown 和关系。
  Acceptance: 两个独立项目的 memory、registry、knowledge-map 和 knowledge-query 只读取或写入各自解析出的项目根，未声明关系继续返回 `no declared match`。

**原子迁移与清理**

- R9. 获授权的首次用户级迁移必须在全局 skill 激活前完成所有项目级副本清理，避免任意时刻因半完成迁移长期产生同名 skill 冲突。
  Acceptance: 流程依次为完整预检、隔离暂存新运行时、将已确认归属的既有用户级 AE skill 从发现目录移入备份、逐项目备份并移除已验证 AE 组件、后检、最后激活全局 skill；项目级插件、AE skill 镜像、AE 包装脚本和 marketplace 中唯一的 AE 条目仅在归属校验通过后处理。
- R10. 批量迁移采用可崩溃恢复的整批原子语义。
  Acceptance: 每次路径变更前持久写入 journal。全局 skill 激活前的任一预检、备份、删除、后检或激活失败，会停止流程、恢复本次已移除的项目级 AE 组件和已替换的用户级 AE 组件、移除本次暂存输出，并报告 `rolled-back`；进程异常终止则留下 `interrupted` journal，下一次安装、迁移或显式 recover 在新操作前必须先完成恢复。恢复失败只能报告 `recovery-failed` 并保留备份；不提供“带重复 skill 的暂停完成”状态。仅在所有项目后检和全局激活均成功时报告 `completed`。
- R11. 当前用户第一批发现清单包含 9 个根，其中 7 个消费者项目获得首批迁移批准，`D:\codes\work` 标记为 `deferred`；实际变更仍须该用户显式 apply 授权。
  Acceptance: 清单逐项列出 `D:\codes\ph-92wailian`、`D:\codes\ph-AI-Agent-Engine`、`D:\codes\ph-AionUi`、`D:\codes\ph-centent`、`D:\codes\ph-fromour`、`D:\codes\ph-Lingcard`、`D:\codes\ph-tranform`、`D:\codes\ph-uumit`、`D:\codes\work`，并记录仅供预览的 `role`。`apply` 不信任清单中的 `role` 或路径：必须重新验证当前用户包含性、动态 `repoRoot` 派生的 distribution-source 排除、固定首批 consumer 允许集合以及每项 AE 组件指纹。只有重新验证后的 7 个 `consumer` 根可记录首批删除候选、指纹、预检、备份、后检和恢复结果；`work` 不得进入本次 apply；没有真实 apply 授权时不删除任何一项。
- R12. 分发源仓库必须永久排除在项目级运行时删除、备份和恢复集合之外。
  Acceptance: 安装器以自身真实 `repoRoot` 推导 `distribution-source`，而不是硬编码用户路径；当前 `D:\codes\ph-AI-Agent-Engine` 清单项因此为 `distribution-source`。安装器拒绝处理任何与该 source root、其 `plugins/ai-agent-engine-codex` 或源 `.agents/skills` 镜像重叠的删除候选。源仓库只参与构建、源镜像校验和全局安装 smoke，不参与 consumer cleanup。
- R13. 迁移成功或回滚后，备份和 journal 默认永久保留；只有用户显式执行 `purge --operation <id>` 才可清理指定操作的备份和 journal。
  Acceptance: `purge` 必须要求完整 operation ID，只允许终态 `completed`、`rolled-back` 或 `recovery-failed`，不得清理活动或 `interrupted` 操作；未执行 purge 时备份与 journal 可用于 restore 和审计。

## Non-Functional Requirements

- NFR1. 迁移必须可审计、可预览、可恢复，并在失败时留下可验证的状态和终态记录。
  Acceptance: 每次操作具有唯一 ID、阶段、逐组件指纹、允许路径、备份位置、错误和恢复结果；中断态为 `interrupted`，终态只能是 `completed`、`rolled-back` 或明确失败的 `recovery-failed`，报告不得包含项目 docs 内容、敏感正文或其他用户路径。
- NFR2. 全局分发不得将长期项目知识、原始工作记录或图谱内容写入用户级目录。
  Acceptance: 测试中用户级运行时目录不含项目 `docs/**` 内容、registry 内容或图谱输出；仅允许脱敏项目标识、相对组件清单、哈希和操作状态。
- NFR3. 可分发变更保持插件源、镜像、语言 metadata、版本和发布说明一致。
  Acceptance: 源与镜像检查、版本一致性、发布说明检查和安装烟测均通过。
- NFR4. 默认用户级安装不要求管理员权限，也不得通过提升权限跨用户管理状态。
  Acceptance: 两个隔离用户主目录 fixture 均仅访问自己的解析目录；跨用户路径显式失败。

## Must-Haves

- Requirement ID: R7
  Must-have completion condition: 历史 docs、记忆和知识关系零迁移，且迁移前后哈希保持不变。
- Requirement ID: R10
  Must-have completion condition: 注入任一阶段失败后，所有已处理项目恢复项目级副本，全局 AE skill 未激活。
- Requirement ID: R12
  Must-have completion condition: source repository fixture 触发迁移请求时在写入前拒绝，且源插件与镜像哈希不变。
- Requirement ID: R13
  Must-have completion condition: 未显式 purge 前，迁移备份和 journal 始终存在且可被 operation ID 定位。

## Success Criteria

- 一个用户可从项目子目录使用全局 AE skill，dispatcher 解析到唯一、正确的项目根。
- 所有已确认 consumer 项目仅在显式 apply 后完成清理，或者在任意失败后恢复到迁移前的可用项目级状态；分发源仓库始终保持不变，迁移备份和 journal 在显式 purge 前可恢复。
- 两个项目和两个用户的 fixture 证明 docs/知识数据与运行时迁移状态互不混合。

## Scope Boundary

### In Scope

- 每用户 AE skill、私有运行时、dispatcher、项目根解析、清单预览、原子迁移、恢复、报告及对应文档和测试。
- 当前用户的 9 项首批发现清单、7 项 consumer cleanup 候选、1 项 deferred 项及其预览后显式 apply 流程。

### Out Of Scope

- 把项目 docs、记忆、知识图谱或 archive 集中到全局目录。
- 管理员代替其他用户扫描、安装、删除或恢复其项目。
- 未验证的 Codex 全局插件目录、后台自动迁移、数据库、向量索引、MCP、守护进程和跨项目内容同步。
- 真实 consumer 清理；该操作需要单独的用户明确授权，distribution-source 只报告排除结果，`work` 只报告 deferred。
- 删除或迁移分发源仓库的插件源、源 skill 镜像或开发资产。

### Constraints

- 官方已知用户级 skill 位置是 `$HOME/.agents/skills`；AE 私有运行时目录是本产品约定，不得表述为 Codex 官方全局插件机制。
- 严禁递归删除项目根、`D:\codes` 或任何用户主目录；仅能处理经指纹验证的单个 AE 子路径或 marketplace 单个条目。
- 现有项目级安装在全局迁移完成前保留为回滚来源。
- 分发源仓库保留其 `plugins/ai-agent-engine-codex` 和 `.agents/skills` 源镜像；这是开发例外，不是可迁移 consumer runtime。

## Validation Evidence

| Requirement | Applicable tier | Expected signal and bounded claim | Preconditions / owner | Status |
| --- | --- | --- | --- | --- |
| R4-R6 | Focused automated test | 从嵌套目录、submodule fixture、monorepo fixture 和显式根解析出预期 worktree，所有资料路径都在该根内。 | Maintainer; Node fixture。 | unverified |
| R2-R3, R9-R13 | Integration or build | 注入每个迁移阶段失败，断言 7 个 consumer 项目级运行时与用户级既有安装恢复、源仓库和 deferred 项目不写入，且全局 skill 未激活。 | Maintainer; 隔离用户主目录和项目 fixture。 | unverified |
| R7-R8, NFR2 | Integration or build | 两个临时项目的 docs 哈希与 registry/查询结果隔离且保持不变。 | Maintainer; 临时项目 fixture。 | unverified |
| R1-R3, R9-R13 | Deployment or operations | 用户批准的真实清单预览将 9 项中的 7 项标为 consumer、1 项标为 distribution-source、1 项标为 deferred；单独 apply 逐项报告一致。 | 当前 OS 用户；明确 apply 授权。 | blocked |

## Key Decisions

- D1. 全局化运行时，不全局化项目数据。
  Reason: 项目根本身是 docs、Git 历史、相对链接和知识关系的安全边界。
- D2. 使用一个全局 dispatcher，而非保留项目包装器作为正常入口。
  Reason: 项目级副本清理后，所有 skill 都需要稳定且可审计的运行入口。
- D3. 项目根的默认规则是“最近标记优先”，显式根优先于默认发现。
  Reason: 这同时覆盖子目录运行、嵌套仓库、submodule 和 monorepo，并避免意外将全局目录当作 worktree。
- D4. 批量迁移采用整批原子回滚，且全局 skill 最后激活。
  Reason: 用户目标是去除项目级重复安装，失败时不能把同名 skill 冲突留给用户手工处理。
- D5. 其他用户自行运行同一安装器并确认各自清单。
  Reason: 用户级状态和文件权限是本设计的隔离边界。
- D6. 分发源仓库是开发例外，不是 consumer migration target。
  Reason: 现有项目安装器在 source 与 target plugin 同路径时会先删除目标；把源仓库放入删除集合会损坏分发源。
- D7. 备份和 journal 采用显式 purge 生命周期。
  Reason: 保留恢复能力和审计记录，避免成功迁移后自动删除唯一恢复来源。

## Dependencies And Assumptions

### Dependencies

- Node.js 可执行并能够运行用户级私有运行时。
- Codex 继续发现 `$HOME/.agents/skills` 下的用户 skill；若官方运行时行为变更，必须在实现前重新验证。

### Assumptions

- 当前发现的 9 个根归当前操作系统用户管理；其中 7 个经预检后可作为首批 consumer，`work` 固定为 deferred，当前仓库固定为 distribution-source。
- marketplace JSON 可在不改动第三方条目的情况下精确删除唯一的 AE 条目；否则该项目必须使整批迁移回滚。

## Evidence Notes

- 项目级安装器 -> Evidence: `scripts/install-project.mjs` 当前写入 `.agents/skills`、插件、marketplace 和 `scripts/ae-tools.mjs` 包装器。
- 源仓库删除风险 -> Evidence: `scripts/install-project.mjs` 在 `targetRoot === repoRoot` 时使 `sourcePlugin` 与 `targetPlugin` 相同，且在复制前递归删除 `targetPlugin`。
- 当前运行入口 -> Evidence: `plugins/ai-agent-engine-codex/scripts/ae-tools.mjs` 对多数命令直接传入 `process.cwd()`。
- 需同步的调用面 -> Evidence: 24 个源/镜像 skill 或能力目录仍包含 `node scripts/ae-tools.mjs`。
- 项目知识的现有边界 -> Evidence: `plugins/ai-agent-engine-codex/scripts/ae-tools.mjs` 及项目记忆注册表约定使用当前 worktree 下的 `docs/**`。

## Consistency Check

- requirementsCount: 13
- nonFunctionalRequirementsCount: 4
- decisionsCount: 7
- openQuestionsCount: 0
