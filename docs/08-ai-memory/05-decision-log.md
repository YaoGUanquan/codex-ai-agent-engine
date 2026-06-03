<!-- ae-codex:init managed -->
# 决策记录

这里记录长期有效的项目决策。

## 模板

- 日期：
- 决策：
- 背景：
- 影响：
- 何时重新评估：

## 2026-05-11：初始化命令的文档与记忆库布局

- 日期：2026-05-11
- 决策：`init` 命令同时创建 `AGENTS.md`、`docs/ae`、`docs/00-process`、`docs/08-ai-memory`，并保留 `docs/ai-memory` 作为兼容入口；同时提供 `ae-init` 作为可见 skill 入口。
- 背景：用户希望项目级安装后可以一键初始化项目规则、相关文档存储和 AI 记忆库，并且需要兼容中文文档读写。
- 影响：后续项目初始化应优先维护 `docs/08-ai-memory` 作为长期记忆；`docs/ae` 保留为 AE 技能产物目录；`docs/00-process/active` 是恢复执行状态的候选来源。
- 何时重新评估：如果 AE 技能的标准产物目录变更，或 Codex 原生支持新的项目记忆入口，需要重新评估目录布局和 recovery 逻辑。

## 2026-06-02: Adapt external workflow ideas without importing runtime

- Date: 2026-06-02
- Decision: When learning from `Yeachan-Heo/oh-my-codex`, keep AE entrypoints and artifact layout, and adopt only local workflow contracts: clarification ambiguity gate, decision-driver planning, consensus gate, execution evidence, dual-lane review, and cleanup gate.
- Context: oh-my-codex has useful process patterns but also runtime assumptions such as `.omx`, CLI orchestration, and platform-specific execution style.
- Impact: AE skills now express stronger prompt-level gates while remaining Codex project-local skills.
- Re-evaluate when: AE adds its own runtime orchestrator, a dedicated process ledger format, or automated skill validation that can enforce these rules mechanically.

## 2026-06-03: Default bilingual skill metadata and external skill audit entrypoint

- Date: 2026-06-03
- Decision: Keep `ae-language` as an advanced switching entrypoint, make `bilingual` the default installed skill-list metadata, and add `ae-skill-audit` for read-only external agent/skill repository audits.
- Context: ECC/everything-claude-code research showed useful governance patterns, but direct skill catalog import and hook-heavy runtime assumptions do not fit Codex. The user also preferred Chinese plus English names/content as the default discovery mode.
- Impact: Fresh installs and updates default to bilingual metadata when no existing language is detected; all `agents/openai.yaml` files in plugin source and `.agents` mirror are bilingual by default; external repository analysis should produce an audit/fit report before any implementation.
- Re-evaluate when: Codex supports live language-aware skill metadata, the skill catalog becomes too noisy in bilingual display, or `ae-skill-audit` usage shows that it should merge into `ae-review` or `ae-skill-creator`.
