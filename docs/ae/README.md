<!-- ae-codex:init managed -->
# AE 工作流产物

这里存放使用 AI Agent Engine for Codex 时产生的过程文档。

## 目录说明

- `brainstorms/`：需求澄清和验收标准。
- `plans/`：实现计划。
- `reviews/`：代码或文档审查报告。
- `gates/`：验证和交付门禁证据。
- `handoffs/`：下次继续工作的交接说明。
- `experience/`：可复用的实现经验。
- `solutions/`：方案比较和选型记录。
- `archive/`：已完成或已废弃的过程记录。

## 与项目文档的关系

- `docs/ae` 保留为 AE 技能兼容的工作流产物目录。
- `docs/00-process` 记录执行中的方案、归档规则和可续跑状态。
- `docs/08-ai-memory` 记录跨会话复用的长期项目记忆。

## 已完成的重点过程

- `docs/ae/plans/2026-06-08-001-multi-agent-execution-config-plan.md` 记录了 `multi_agent.enabled` 从布尔开关扩展为 `auto | true | false` 的实现计划。
- `docs/00-process/archive/2026-06/multi-agent-execution-config/progress.md` 记录了实现、测试加固、文档更新和合并前验证证据。
- `docs/00-process/archive/2026-06/claude-code-delegate-skill/progress.md` 记录了 `ae-claude-code` skill、`claude-delegate` wrapper、Windows `.cmd` shim 和 stdin prompt 修复的验证证据。
- 合并到 `main` 后，其他项目通过 `scripts/update-ae-codex.mjs` 更新安装，再复制或编辑 `.codex/ae-skill-profiles.yaml` 才会改变本地运行策略；更新脚本不会覆盖该本地配置。

## 最近完成的适配

- Ponytail minimality adaptation:
  - PRD: `docs/ae/prds/2026-06-19-001-ponytail-minimality-adaptation-prd.md`
  - Plan: `docs/ae/plans/2026-06-19-001-ponytail-minimality-adaptation-plan.md`
  - Experience: `docs/ae/experience/2026-06-19-ponytail-minimality-adaptation.md`
  - Process archive: `docs/00-process/archive/2026-06/ponytail-minimality-adaptation/summary.md`
- Claude Code best-practice adaptation:
  - PRD: `docs/ae/prds/2026-06-19-003-claude-code-best-practice-adaptation-prd.md`
  - Plan: `docs/ae/plans/2026-06-19-004-claude-code-best-practice-detailed-execution-plan.md`
  - Audit solution: `docs/ae/solutions/2026-06-19-claude-code-best-practice-audit.md`
  - Experience: `docs/ae/experience/2026-06-19-claude-code-best-practice-adaptation.md`
  - Process archive: `docs/00-process/archive/2026-06/claude-code-best-practice-audit/`
