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

## 2026-06-04: Phase 2 graph, merge, and browser routing

- Date: 2026-06-04
- Decision: Add `ae-graph-build` and `ae-graph-query` as shallow read-only helper commands; defer `ae-merge-branch`; route Chrome DevTools-style work through `ae-test-browser` with Browser, Playwright, or already available DevTools tooling.
- Context: Graph build/query is valuable but a full OpenCode-style graph requires schema, persistence, sharding, freshness, and preview work. Merge automation writes Git state and needs stronger evidence and authorization. Dynamic DevTools MCP registration is not a stable Codex project-local contract.
- Impact: Users get immediate graph visibility through JSON helper commands without committing to `.ae/graph.db`. Browser validation instructions stay Codex-native. Git merge automation remains unavailable until safety rules mature.
- Re-evaluate when: A persistent graph schema is designed, Codex exposes a stable DevTools tool contract, or `ae-work` gains stronger Git write evidence, rollback, and explicit authorization gates.

## 2026-06-08: Multi-agent defaults to auto analysis, not write-agent spawning

- Date: 2026-06-08
- Decision: Make `multi_agent.enabled: auto` the default profile policy, keep `enabled: false` as the hard off switch, and require explicit `mode: auto` plus `allow_write_agents: true` before write-agent auto parallelism can be considered.
- Context: The user wanted multi-agent execution to be available by default when beneficial, but the earlier boolean switch was too blunt: `false` disabled useful analysis, while `true` could be misread as authorizing write workers.
- Impact: `task-analyze` now reports safe parallelism recommendations by default and emits blockers, waves, and notes. Installed projects still need a local `.codex/ae-skill-profiles.yaml` to customize runtime policy; update scripts do not overwrite that local file.
- Re-evaluate when: Codex exposes stronger first-class sub-agent orchestration contracts, write-worker isolation becomes mechanically enforceable, or real end-to-end multi-agent execution tests are added.

## 2026-06-16: Split read and write multi-agent eligibility

- Date: 2026-06-16
- Decision: `task-analyze` must report read-only and write-worker parallel eligibility separately. Use `read_parallel_eligibility` for review/exploration lanes and `write_parallel_eligibility` for write-worker readiness. Keep `parallel_eligibility` only as a conservative compatibility summary.
- Context: OpenAI Codex subagents guidance recommends parallel agents first for read-heavy tasks and warns that write-heavy parallel work needs extra care. The previous output could block `review_only` read lanes and could make write-agent readiness look stronger than the actual Git Pre-Edit Gate allowed.
- Impact: `review_only` can now recommend read-only parallel waves without authorizing write workers. Write-worker config readiness is expressed as `write_parallel_eligibility.config_allows_write_agents`, while `can_spawn_write_agents_now` remains false until the orchestrating agent verifies the current worktree. Plan units now expose `forbidden_files` separately from owned `files`.
- Re-evaluate when: Codex exposes a machine-checkable subagent pre-spawn gate, project custom agents are added under `.codex/agents`, or external consumers depend on the old `parallel_eligibility.can_spawn_write_agents` field.

## 2026-06-12: Adapt Spec Kit workflow patterns without vendoring runtime

- Date: 2026-06-12
- Decision: Use GitHub Spec Kit as a workflow reference for constitution, requirement quality checklist, task breakdown, and cross-artifact analysis, but keep AE artifact roots and Codex skill/runtime boundaries.
- Context: Spec Kit has useful governance and spec-driven workflow patterns, but importing Specify CLI or `.specify/` would create a second workflow root and dependency model.
- Impact: Add `ae-constitution` and `ae-tasks`, strengthen requirement clarification and PRD quality gates, expand review/work cross-artifact checks, and add skill governance checks for mirror, metadata, and path-safety consistency. Active OfficeCLI skills are removed from the catalog.
- Re-evaluate when: AE adds a first-class runtime orchestrator, task artifacts become too heavy for common work, or Codex gains native spec/constitution workflow support.

## 2026-06-19: Adapt Ponytail minimality patterns without importing runtime

- Date: 2026-06-19
- Decision: Use `DietrichGebert/ponytail` as a reference for minimality gates and complexity review tags, but keep AE Codex-native and do not import Ponytail skills, hooks, mode persistence, statusline behavior, MCP, benchmark display, or persona mode.
- Context: Ponytail's strongest transferable method is a concrete shortest-correct decision ladder and deletion-oriented review taxonomy. Its runtime adapters and always-on activation model do not fit AE's explicit skill entrypoints.
- Impact: `ae-work` gains a Minimality Gate, `ae-review` gains a Complexity Lane with `delete`, `stdlib`, `native`, `yagni`, and `shrink`, `ae-plan` checks simplest viable routes, and `ae-task-loop` requires smallest plausible fix hypotheses. A regression test locks the behavior into plugin source and mirror.
- Re-evaluate when: AE gains first-class runtime hooks, the complexity lane becomes noisy in normal reviews, or enough deliberate simplification markers accumulate to justify a dedicated debt-ledger workflow.

## 2026-06-19: Adapt Open Code Review mechanics without importing runtime

- Date: 2026-06-19
- Decision: Use `alibaba/open-code-review` as a reference for deterministic review mechanics, but keep AE Codex-native and do not import OCR CLI, LLM provider configuration, telemetry/session viewer, CI workflow, prompt/rule text, Go source, or plugin command behavior by default.
- Context: OCR's strongest transferable ideas are constrained file/review scope, rule-profile attention, position checking, and reflection/contradiction filtering. Direct runtime integration would duplicate `ae-review` and add a second LLM/review backend.
- Impact: `ae-review` gains `Diff Review Discipline`, manual position checks, contradiction checks, and optional code review rule profiles. `ae-skill-audit` gains deterministic engineering and license compatibility audit dimensions. A regression test locks the behavior into plugin source and mirror.
- Re-evaluate when: AE has a formal finding schema, users explicitly request OCR CLI integration, or review-scope/position-validation tooling has a clear JSON contract and validation path.

## 2026-06-19: Adapt Claude Code best-practice taxonomy without vendoring runtime

- Date: 2026-06-19
- Decision: Use `shanraisshan/claude-code-best-practice` as a taxonomy and deterministic-check reference, but rewrite guidance into existing AE skills and do not vendor Claude runtime files, hooks, settings, command catalogs, sounds, schedules, or prompt text.
- Context: The repository is useful for source freshness, extension routing, delegation boundaries, second-model review, and memory placement. Its runtime assumptions are Claude Code-specific and do not map directly to Codex project-local skills.
- Impact: `ae-skill-audit`, `ae-skill-creator`, `ae-agent-creator`, `ae-claude-code`, `ae-plan`, `ae-review`, and `ae-save-experience` gain explicit routing and trust-boundary guidance. `claude-delegate` reports diagnostics when a successful run produces empty stdout and stderr.
- Re-evaluate when: Codex exposes stable project hooks, schedulers, permission profiles, or an agent registry that can enforce these behaviors natively.
