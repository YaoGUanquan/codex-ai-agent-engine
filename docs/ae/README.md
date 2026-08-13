<!-- ae-codex:init managed -->
# AE 工作流产物

这里存放使用 AI Agent Engine for Codex 时产生的过程文档。

## 目录说明

- `prds/`：需求正典目录（PRD 需求数据文档，`type: prd`）。
- `brainstorms/`：探索性澄清记录（视角碰撞、选项对比等）；持久化需求写入 `prds/`。
- `plans/`：实现计划。
- `reviews/`：代码或文档审查报告。
- `gates/`：验证和交付门禁证据。
- `handoffs/`：下次继续工作的交接说明。
- `experience/`：可复用的实现经验。
- `solutions/`：方案比较和选型记录。
- `archive/`：已完成或已废弃的过程记录。

其余子目录（`designs/`、`evidence/`、`integrity/`、`security-scans/`、`work-reports/`、`references/`、`graphs/`、`prompts/` 等）由对应命令或任务按需创建。`gates/` 与 `evidence/` 产物按 `docs/00-process/templates/archive-rules.md` 的证据保留策略定期归档。

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
- Frontend motion governance:
  - PRD: `docs/ae/prds/2026-07-28-001-frontend-motion-governance-prd.md`
  - Plan: `docs/ae/plans/2026-07-28-001-frontend-motion-governance-plan.md`
  - Work report: `docs/ae/work-reports/2026-07-28-frontend-motion-governance-work-report.md`
  - Experience: `docs/ae/experience/2026-07-28-frontend-motion-governance.md`
  - Process archive: `docs/00-process/archive/2026-07/frontend-motion-governance/summary.md`
- Knowledge-base governance (四批，0.3.22–0.3.25):
  - Batch 1 — PRD: `docs/ae/prds/2026-08-11-knowledge-base-governance-prd.md`; plan: `docs/ae/plans/2026-08-11-003-knowledge-base-governance-plan.md`; experience: `docs/ae/experience/2026-08-11-knowledge-base-governance.md`; archive: `docs/00-process/archive/2026-08/knowledge-base-governance/summary.md`
  - Batch 2 — PRD: `docs/ae/prds/2026-08-11-governance-batch-two-prd.md`; plan: `docs/ae/plans/2026-08-11-004-governance-batch-two-plan.md`; experience: `docs/ae/experience/2026-08-11-governance-batch-two.md`; archive: `docs/00-process/archive/2026-08/governance-batch-two/summary.md`
  - Batch 3 — PRD: `docs/ae/prds/2026-08-11-governance-batch-three-prd.md`; plan: `docs/ae/plans/2026-08-11-005-governance-batch-three-plan.md`; experience: `docs/ae/experience/2026-08-11-governance-batch-three.md`; archive: `docs/00-process/archive/2026-08/governance-batch-three/summary.md`
  - Batch 4 — PRD: `docs/ae/prds/2026-08-11-governance-batch-four-prd.md`; plan: `docs/ae/plans/2026-08-11-006-governance-batch-four-plan.md`; experience: `docs/ae/experience/2026-08-11-governance-batch-four.md`; archive: `docs/00-process/archive/2026-08/governance-batch-four/summary.md`
  - 0.3.25 prds 路径统一 — plan: `docs/ae/plans/2026-08-11-007-prds-artifact-path-unification-plan.md`; archive: `docs/00-process/archive/2026-08/prds-artifact-path-unification/summary.md`
  - 记忆蒸馏（2026-08-11）— experience: `docs/ae/experience/2026-08-11-memory-distillation.md`; 分片: `docs/99-archive/2026-08/memory-distillation/`
  - Cursor 用户级技能发现（0.3.29–0.3.30）— PRD: `docs/ae/prds/2026-08-13-cursor-user-skill-discovery-prd.md`; plan: `docs/ae/plans/2026-08-13-002-cursor-user-skill-discovery-plan.md`; experience: `docs/ae/experience/2026-08-13-cursor-user-skill-discovery.md`; archive: `docs/00-process/archive/2026-08/cursor-user-skill-discovery/summary.md`
  - Maintainer graph: `docs/ae/graphs/maintainer-artifact-graph.md`; registry: `docs/08-ai-memory/00-registry.json`
