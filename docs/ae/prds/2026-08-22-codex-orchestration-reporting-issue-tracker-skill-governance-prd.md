---
type: prd
status: drafted
date: 2026-08-22
title: codex-orchestration-reporting-issue-tracker-skill-governance
topic: codex-orchestration-reporting-issue-tracker-skill-governance
origin: user-direction
originFingerprint: 2026-08-22-external-skill-audit-and-user-direction
depth: deep
format: human-readable-requirements
sharded: false
---

# Codex 编排、报告、Issue Tracker 与全量技能治理需求

## Problem Frame

当前项目已经具备任务分析、并行资格计算、证据账本、静态预览和 40 个 AE skills，但这些能力仍然分散在命令、skill 文档和人工流程中。外部 `mattpocock/skills` 仓库证明了 grilling、TDD、诊断、代码审查、深模块设计、ticket/wayfinder 等方法的价值；本项目需要将可移植方法重写为 Codex 原生、可审计、可回滚的 AE 能力，而不是复制 Claude 运行时。

## Outcome

交付一个 Codex-native AE 扩展批次，能够：

1. 依据已批准计划的依赖和文件所有权，生成并执行受约束的只读或显式授权写入型并行代理波次。
2. 从任务、审查、门禁和技能治理结果生成自包含 HTML 报告，并通过现有 loopback 静态服务预览。
3. 提供仓库本地 Issue Tracker，管理 issue 的创建、状态、优先级、依赖、关联 PRD/plan/task/evidence 和历史变更。
4. 对全部现有 AE skills 完成一次逻辑审计：触发、路由、边界、工件、验证、镜像和元数据都得到结论；只有有证据的问题进入修复，未达到证据门槛的候选标记为 `defer` 或 `reject`。

## In Scope

- Codex 子代理编排契约、并行波次执行说明、只读/写入授权和冲突回收证据。
- 自包含 HTML 报告生成，默认无 CDN、无外网运行依赖；可选 Mermaid/CDN 仅作为明确的非默认增强。
- `docs/ae/issues/` 本地 issue 数据模型、CLI 操作和工件关联。
- 40 个 skill 的静态逻辑审计清单、结果索引、问题证据和可验证修复。
- 插件源、`.ae-source` 镜像、能力目录、语言元数据、安装烟测和版本发布记录。

## Non-Goals

- 不复制 Claude Code/OpenCode 的插件运行时、hooks、slash command 注册、自动后台 agent 或自动提交行为。
- 不强制接入 GitHub、Linear 或其他外部 tracker；外部适配器可作为后续实现。
- 不允许无审计、无测试、无显式采用的自动 skill/memory 自我修改。
- 不把 PRD、plan、task、issue、review、gate 变成互相竞争的权威来源：PRD/plan 定义意图和执行设计，task 定义执行单元，issue 定义跟踪状态，review/gate/evidence 定义证明。
- 不因“全量优化”而逐字重写所有技能；没有证据的问题必须保留为已审计但不修改。

## Acceptance Criteria

### AC-1 并行编排

- `task-analyze --mode plan` 输出的单元依赖、共享文件冲突、并行波次和阻断原因可被 Codex orchestrator 直接使用。
- 只读审查波次可在文件不冲突且依赖满足时并行；写入代理默认阻断，只有 `mode: auto`、`allow_write_agents: true`、干净 Git 状态、计划依赖完整和文件所有权不重叠同时成立时才可建议执行。
- 每个代理任务记录 unit、owned files、forbidden files、允许的验证命令、禁止操作和返回格式；失败或冲突产生可追踪证据，不静默合并。

### AC-2 HTML 报告

- 能从结构化 JSON/Markdown 输入生成自包含 HTML，包含摘要、状态、严重度、工件链接、验证命令、限制和未验证项。
- 默认报告在无网络时仍可打开；静态资源内联或使用仓库内模板。CDN 只能显式启用，并在报告中标记外部依赖。
- 报告路径位于 `docs/ae/reports/` 或明确的临时预览路径，路径受现有 containment 和 loopback 规则保护。

### AC-3 Issue Tracker

- 支持 `create`、`list`、`show`、`update/transition`、`link`、`close` 和依赖查询；输入和输出有稳定 JSON 合约。
- issue 至少包含稳定 ID、标题、状态、优先级、描述、创建/更新时间、依赖、关联工件和关闭理由；状态转换拒绝未知状态或缺失关闭理由。
- issue 文件/索引写入受 worktree 路径保护，更新可恢复，历史或 evidence 可追溯；不保存 secrets、原始请求或凭证。
- issue 与 PRD/plan/task 的关系是引用关系，不复制正文；关联路径必须存在或明确标记为外部/未解析。

### AC-4 全量技能治理

- 40 个插件 skills 与 40 个镜像 skills 各有一条审计结果，覆盖 trigger、scope、routing、runtime boundary、artifact contract、validation、metadata/mirror、license/provenance。
- 每条 finding 包含严重度、文件/段落、证据、影响、修复或 `defer/reject` 原因；不得用“看起来更好”作为唯一依据。
- 修复后的 distributable skill 变更同步源/镜像、语言元数据、能力目录、README/CHANGELOG 和版本；仓库侧脚本/测试变更不强制升级版本。
- 审计结果可生成 HTML 汇总，并能从 issue 或 review 追溯到原始 skill 文件和验证命令。

### AC-5 验证和安全

- `npm test`、`npm run check`、`npm run check:smoke`（可运行时）以及新增聚焦测试通过；失败项必须保留真实输出和边界说明。
- 路径逃逸、符号链接逃逸、非 loopback 监听、未知 issue 状态、并行文件冲突、未经授权写入和外部 CDN 缺失均有负例测试。
- 所有外部仓库方法只记录来源、提交、许可证和适配边界；不复制不兼容运行时代码。

## Decision Drivers

1. 证明强度和安全边界优先于自动化数量。
2. 与现有 `ae-tools`、`docs/ae`、镜像和契约测试保持一致。
3. 所有新状态和报告必须可追踪、可恢复、可离线验证。

## Perspective Collision

| Perspective | 观点 |
| --- | --- |
| Critic | 一次性重写 40 个 skill 会制造不可审计的行为漂移；必须把审计与修复分开。 |
| Pragmatist | 复用 `task-analyze`、`static-server`、`evidence`、`gate` 和现有工件路径，新增薄命令层。 |
| Innovator | Codex 可以形成自己的代理波次、报告和本地 tracker，不必等待外部平台。 |
| Systems | issue、task、plan、review、gate 必须各自有单一职责和明确关系，否则会出现多套状态真相。 |

Collision insight：自动化能力越强，越必须把输入快照、授权条件、冲突矩阵、失败证据和回滚信号作为一等输出；“全量优化”应以全量覆盖为目标，不等同于全量改写。

## Evidence Contract

| Acceptance | Proof | Status before implementation | Boundary |
| --- | --- | --- | --- |
| AC-1 | task-analyze JSON、并行资格测试、代理执行/阻断记录 | unverified | Codex orchestrator 是否实际调用子代理需运行时验证 |
| AC-2 | 离线打开 HTML、报告 schema 测试、static-server dry-run | unverified | 浏览器视觉体验需浏览器验证 |
| AC-3 | issue CLI 合约测试、路径安全负例、恢复测试 | unverified | 外部 tracker 不在本期证明范围 |
| AC-4 | 40 条审计记录、镜像/元数据/契约检查和修复 diff | unverified | 不证明每个 skill 在真实项目中的效果 |
| AC-5 | npm 测试/检查/烟测输出 | partial | 烟测可能受本机安装和环境限制 |

## Open Questions

- 是否在本期实现 GitHub/Linear 适配器：默认否，留为后续 issue。
- 是否将报告保存在仓库还是临时目录：默认持久化交付报告在 `docs/ae/reports/`，大体积视觉预览可临时生成。

## AI Parse Contract

- canonicalKind: requirements
- humanEquivalent: true
- stableIdsRequired: true
- noImplicitScope: true
