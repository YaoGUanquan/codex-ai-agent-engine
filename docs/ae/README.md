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

## 当前合并候选

- `docs/ae/plans/2026-06-08-001-multi-agent-execution-config-plan.md` 记录了 `multi_agent.enabled` 从布尔开关扩展为 `auto | true | false` 的实现计划。
- `docs/00-process/active/multi-agent-execution-config/progress.md` 记录了实现、测试加固、文档更新和合并前验证证据。
- 合并到 `main` 后，其他项目通过 `scripts/update-ae-codex.mjs` 更新安装，再复制或编辑 `.codex/ae-skill-profiles.yaml` 才会改变本地运行策略；更新脚本不会覆盖该本地配置。
