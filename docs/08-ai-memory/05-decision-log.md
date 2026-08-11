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
- Impact: `ae-skill-audit`, `ae-skill-creator`, `ae-agent-creator`, `ae-claude-code`, `ae-plan`, `ae-review`, and `ae-save-experience` gain explicit routing and trust-boundary guidance. `claude-delegate` reports diagnostics when a successful run produces empty stdout and stderr. The implementation landed on `main` in commit `3e7f01a`.
- Re-evaluate when: Codex exposes stable project hooks, schedulers, permission profiles, or an agent registry that can enforce these behaviors natively.

## 2026-06-24: Refresh upstream AE audit baseline and artifact contracts

- Date: 2026-06-24
- Decision: Treat upstream `jiangqiang1996/ai-agent-engine` commit `b50ca004a6b4300f4ad5d8d281bcb17d4be1b392` as the current audit baseline and adapt only Codex-native artifact/audit logic.
- Context: User identified a newer upstream commit than the local catalog. The portable parts are human-readable but machine-parseable PRD/plan contracts, source freshness checks, and runtime-boundary classification.
- Impact: PRD/plan skills now require `format`, `sharded`, AI parse contracts, stable IDs, and origin/fingerprint pairing. `ae-skill-audit` now records `git ls-remote`, `observedCommit`, ref source, inspected files, commit mismatch or unreachable short hash, and classifies portable method, local deterministic mechanism, and runtime-specific behavior.
- Re-evaluate when: strict artifact validation can be enabled by default after historical PRD/plan artifacts are migrated.

## 2026-07-07: Refresh upstream AE baseline and repair PRD reference completeness

- Date: 2026-07-07
- Decision: Treat upstream `jiangqiang1996/ai-agent-engine` commit `760cc5b548d3f82c5db764fc01b98d7874867b95` as the current observed baseline for future audits, while syncing only Codex-native PRD reference completeness in this pass.
- Context: A fresh `git ls-remote` showed the upstream `master` HEAD had advanced. Local `ae-prd` referenced `references/requirements-capture.md`, but plugin source and `.agents` mirror did not include that file.
- Impact: `ae-prd` now has mirrored `requirements-capture.md` and `handoff.md` references, and source metadata records the observed upstream HEAD. Broader upstream `ae-review` and `ae-work` runtime changes remain deferred until they are rewritten against Codex-available tools.
- Re-evaluate when: adapting upstream review dispatch, worktree handoff, or plan deepening contracts.

## 2026-07-07: Adapt upstream brainstorm collision and formal web routing

- Date: 2026-07-07
- Decision: Treat upstream `jiangqiang1996/ai-agent-engine` commit `f0cb655ca76fc5e32b5179e155c84f857a9ec289` as the current observed baseline for this modernization pass, and adapt only portable brainstorm and web workflow methods.
- Context: Upstream now exposes multi-perspective brainstorm synthesis and a formal `ae-web-forge` style web routing model. Local Codex skills still described frontend work as an initial version and did not encode collision insights or four-question web routing.
- Impact: `ae-brainstorm` now records perspective matrices, disagreement types, collision insights, blind spots, thinking preservation zones, and deepening directions when useful. `ae-frontend-design` is repositioned as frontend design and UI implementation. `ae-web-app` owns Codex-native four-question routing while browser acceptance remains in `ae-test-browser`.
- Re-evaluate when: adding a dedicated `ae-design` design-contract skill or creating a separate `ae-web-forge` entrypoint becomes more valuable than strengthening existing skill boundaries.

## 2026-07-07: Add Codex-native ae-design and ae-web-forge entrypoints

- Date: 2026-07-07
- Decision: Add `ae-design` as a PRD-to-plan design contract skill and `ae-web-forge` as an independent frontend/Web routing entrypoint, while keeping both rewritten for Codex-native skills and artifact roots.
- Context: Upstream includes richer design-contract and web-forge flows, but its OpenCode-specific paths, sub-agent registry, dynamic Chrome MCP registration, and slash command behavior are not portable to this Codex plugin.
- Impact: `ae-design` writes design contracts under `docs/ae/designs` with stable IDs, risk-triggered dimensions, explicit omitted dimensions, mapping tables, and document review closure. `ae-web-forge` routes to existing `ae-frontend-design`, `ae-web-app`, `ae-test-browser`, `ae-backend`, and `ae-sql` rather than claiming unavailable `@ui-*` agents.
- Re-evaluate when: a deterministic design validator is added, Codex exposes stable native sub-agent/runtime contracts, or frontend routing duplication between `ae-web-app` and `ae-web-forge` becomes confusing in real use.

## 2026-07-07: Make ae-web-forge the unified Web routing entrypoint and add design contract checks

- Date: 2026-07-07
- Decision: `ae-web-forge` owns frontend/Web Q1-Q4 routing. `ae-web-app` is the implementation skill for routed Web app flows. Add `check-design-contract` as the deterministic checker for `docs/ae/designs/**/design.md`.
- Context: Keeping Q1-Q4 routing in both skills created a predictable long-term ambiguity, and `ae-design` had a template contract without machine validation.
- Impact: README, metadata, catalog, tests, and skill docs now describe one routing owner. Package checks now include `node scripts/check-design-contract.mjs`, which validates design frontmatter, required sections, stable IDs, explicit omitted dimensions, mapping tables, and consistency fields.
- Re-evaluate when: design contracts need semantic cross-reference validation across mapping table row values, or users consistently bypass `ae-web-forge` for broad Web intake.

## 2026-07-07: Treat SkillOpt-style self-evolution as audit discipline before runtime

- Date: 2026-07-07
- Decision: For SkillOpt-like skill optimization frameworks, strengthen `ae-skill-audit` first with a Skill Optimization Pattern Filter. Do not install SkillOpt, create `ae-skill-optimize`, or enable automatic live skill mutation until AE has a held-out replay suite and a validated staged adoption contract.
- Context: SkillOpt's portable value is its trajectory-driven bounded edit loop, validation gate, rejected-update feedback, and staged proposal discipline. The current AE project has mirror, contract, artifact, and claim checks, but does not yet have a task replay benchmark that can safely accept or reject automatically generated skill edits.
- Impact: External audits now check trajectory source, bounded edit shape, validation gate, rejected-update handling, staging/adoption policy, and AE validation mapping before recommending any local skill change. Audit reports can adapt useful optimization mechanics as process contracts or template fields while rejecting unsupported runtime import and auto-adoption.
- Re-evaluate when: repeated audits need the same staged replay workflow, `docs/ae` gains a local held-out task suite, or a future `ae-skill-optimize` plan can prove harmful edits are rejected before live skill files change.

## 2026-07-13: Adapt tiered help and workflow completion guards from upstream

- Date: 2026-07-13
- Decision: Treat upstream commit `00d7e9ca7594945ac26a46fffc43ccd679cd461b` as the current observed baseline and adapt only capability presentation tiers, deterministic design-contract semantics, and task-loop completion guards.
- Context: The upstream delta contains useful catalog organization and workflow contracts alongside OpenCode-only sessions, hooks, dynamic MCP, async execution, media fallback, graph telemetry, and agent registries.
- Impact: AE help groups skills by explicit `core`, `docs`, `tools`, and `meta` metadata without changing routing. Design and task-loop improvements remain Codex-native process and validation contracts.
- Re-evaluate when: Codex exposes a stable headless registry test surface or a real project artifact requires a broader design declaration grammar.

## 2026-07-22: Adapt upstream validator safety and risk-scaled test design

- Decision: Treat upstream commit `76d832c96a1c810410982bf28b425a3aedb461ab` as the latest observed reference; adopt symbolic-link rejection and conditional test-design methods while retaining the Codex-native runtime boundary.
- Context: The local artifact and design validators used `statSync` recursive walks, which follow symbolic links. Upstream fixed the same class of directory traversal risk. Its newer test-case contracts add useful scenario-selection methods, but their universal scenario counts and OpenCode subagent execution model do not fit compact Codex design artifacts.
- Impact: validators skip symbolic links and manifest entries must resolve inside the real design directory. `ae-design` now records a method-tagged, automatable coverage matrix only for triggered API, UI/state, business-rule, data, or authorization structures. Upstream package metadata for this snapshot is `GPL-3.0-or-later`; this repository continues to adapt behavior rather than vendoring upstream source.
- Re-evaluate when: representative local design artifacts show a need for semantic coverage measurement beyond the current structural contract.

## 2026-07-24: Require an explicit local runtime smoke gate after implementation

- Decision: `ae-work` owns a shared local runtime smoke gate, and `ae-tdd`, `ae-debug`, and `ae-task-loop` route explicit local API/UI smoke requests to it. The gate recognizes start, execute, automatic, smoke, bubble, and local-integration requests as equivalent intent.
- Context: A completed local restart and explicit smoke request previously stalled on repeated credential handoff questions. Runtime calls were possible; the missing contract was a deterministic transition from focused tests to bounded localhost evidence and a safe credential boundary.
- Impact: A runnable local read-only request proceeds once restart, target, request fixture, and user-created secret reference are ready. Raw chat credentials must not enter command text, patches, logs, agent-written files, or tool stdin. State-changing calls still require explicit authorization, and 4xx/5xx/transport/business errors block a pass claim.
- Re-evaluate when: Codex exposes a documented non-persisting secret-input capability, or a target-project contract needs a more specific local service lifecycle policy.

## 2026-07-28: Make frontend motion static-first and evidence-bound

- Decision: Extend `ae-frontend-design`, `ae-web-forge`, and `ae-test-browser` rather than add a motion skill or animation runtime. Default to static UI or minimal state feedback; material motion needs a task-relevant purpose, usable completion state, reduced-motion alternative, and reported acceptance evidence.
- Context: External frontend references supplied useful design and animation examples, but a generic visual upgrade would conflict with target-project baselines, introduce optional dependencies into plugin scope, and leave accessibility evidence implicit.
- Impact: Web routing reports now expose motion and reduced-motion fields. Browser acceptance describes an explicit `unverified` result when target-route evidence is unavailable. The distributed source/mirror pair is versioned as `0.3.3` and protected by regression, mirror, contract, artifact, and install-smoke checks.
- Re-evaluate when: target-project adoption shows a need for a stricter performance budget or a deterministic browser fixture that can exercise `prefers-reduced-motion` across supported toolchains.

## 2026-08-10: Require fillable UTF-8 request-config templates for authenticated API smoke

- Decision: Keep the user-mediated token-free smoke handoff, but require a shared non-empty fillable request-config template with `REPLACE_WITH_LOCAL_TOKEN`, method/path, and numbered fill steps. Write UTF-8 without BOM through a UTF-8-safe writer; forbid empty files and unsafe PowerShell redirection for non-ASCII config text. `ae-test-api` routes to the shared template and does not fork the smoke gate.
- Context: Agents previously created empty credential files or encoding-broken Chinese fill instructions, so users could not complete authenticated bubble testing safely.
- Impact: Distributable version `0.3.17` adds `request-config-template.md`, hardens the shared gate and `ae-test-api`, and records durable workflow/pitfall/decision memory plus declared knowledge relations.
- Re-evaluate when: a deterministic template generator becomes necessary, or Codex exposes a documented non-persisting secret-input capability that replaces file handoff.

## 2026-08-10: Keep AE runtime global per user and project knowledge local

- Decision: A global install owns only the current user's dispatcher, skills, personal marketplace plugin source, operation journal, and backups. Each consumer retains its own `AGENTS.md`, `docs/**`, AI memory, graph, archive, and Git history. Project-level AE runtime files are retired only from an explicit manifest; modified or unknown historical copies require `--retire-modified` and are fully backed up first.
- Context: Project-level installs had accumulated different plugin versions and historical documentation. Centralizing docs would break project portability, links, ownership, and recovery; automatic path scanning would also make the installer unusable for other users.
- Impact: The default global preview is read-only and source-only. Consumer cleanup is opt-in, portable across user home locations, and bounded to exact AE paths. Backups and journals remain until `purge --operation <id> --apply`; the source repository keeps its local mirror as a development exception, and deferred projects remain untouched.
- Re-evaluate when: Codex exposes a stable user-level plugin discovery contract that removes the need for the personal marketplace source/dispatcher split, or a separate approved cross-project knowledge product is designed.

## 2026-08-11: Frontend stack guidance as parallel reference files

- Date: 2026-08-11
- Decision: Extend existing frontend skills with parallel framework references (`react`/`vue`/`svelte`/`angular-guidance.md`) and optional non-frontend lenses (`ae-review` FE profile, `ae-tdd` harness notes, `ae-debug` quick map) instead of new entrypoint skills. Legacy or niche stacks fall back to matching repository conventions.
- Context: Frontend implementation guidance was too thin for React and absent for other frameworks; accessibility and browser proof boundaries were implicit.
- Impact: Distributable versions 0.3.18–0.3.19; committed as `a51ef3c`. Experience: `docs/ae/experience/2026-08-11-frontend-skill-optimization.md`.
- Re-evaluate when: legacy Svelte 4 / NgModule / Options API projects show repeated checklist misses, or a fifth mainstream framework needs a dedicated reference.

## 2026-08-11: Fullstack skill symmetry via backend language guidance and FE/BE contract checklist

- Date: 2026-08-11
- Decision: Mirror the frontend reference shape on the backend with six priority language guides (Java, Go, Python, C, C++, C#), expand `api-contract-checklist.md` for implementation-layer FE/BE alignment, add backend and boundary debug quick maps, and add `ae-sql` safety checklist. Other backend languages keep framework-agnostic fallback.
- Context: Backend references were ~26 lines with no language traps; contract alignment existed only in design artifacts.
- Impact: Distributable version 0.3.21; plan `docs/ae/plans/2026-08-11-002-fullstack-skill-optimization-plan.md`; experience `docs/ae/experience/2026-08-11-fullstack-skill-optimization.md`.
- Re-evaluate when: OpenAPI-driven contract tests become a first-class AE skill or niche backend stacks need dedicated references beyond convention fallback.

## 2026-08-11: Maintainer knowledge graph lives in registry plus curated markdown

- Date: 2026-08-11
- Decision: Keep shallow `ae-graph-build` read-only (no `graph.json` persistence); maintain cross-artifact links in `docs/08-ai-memory/00-registry.json` and a human curator map at `docs/ae/graphs/maintainer-artifact-graph.md` with directory README explaining boundaries.
- Context: Users need durable links between plans, experiences, memory, and post-split code layout without violating the graph-helper read-only contract.
- Impact: `docs/ae/graphs/README.md` documents query commands and artifact types; registry relations extended for August 2026 deliveries. Knowledge-base governance batch one landed in **0.3.22** (`53c94aa`, `f36e58e`).
- Re-evaluate when: a deterministic tidy/archival command exists, or review evidence fingerprint format changes.

## 2026-08-11: Layer repository checks and split ae-tools without changing CLI contracts

- Date: 2026-08-11
- Decision: Split the ~2860-line `ae-tools.mjs` into fifteen command modules under `scripts/ae-tools/`, externalize init templates, extract `artifact-check-utils.mjs`, layer `npm run check` into syntax/contracts/smoke/all, split tests by domain, and bump distributable version to **0.3.20**. Keep root thin wrappers unchanged.
- Context: A repository scan found duplicate `update-project.mjs`, missing gitignore for smoke temp dirs, and `check-claims` outside the default check chain (fixed in commit `781d4f6` before the larger refactor). `node --check` cannot detect ESM circular imports between new modules.
- Impact: Maintainer layout in `docs/ae/references/ae-tools-module-layout.md`; import-cycle regression guard in tests; commit `315db38`; experience `docs/ae/experience/2026-08-11-structural-debt-refactor.md`; archive `docs/00-process/archive/2026-08/structural-debt-refactor/summary.md`.
- Re-evaluate when: a new command family makes the module count unwieldy again, or Codex provides a first-class plugin CLI packaging model.

## 2026-08-11: Knowledge-base governance: canonical PRD channel, retired init pointer, evidence retention

- Date: 2026-08-11
- Decision: Make `docs/ae/prds` the canonical requirements location (`ae-brainstorm` reuses the `ae-prd` capture contract and its own template is removed; `recovery` scans prds), stop creating the legacy `docs/ai-memory` pointer for new inits while keeping existing projects untouched, fingerprint `review-package` artifacts instead of storing full diff bodies, adopt a three-month retention policy for gates and evidence artifacts, and register `docs/external-samples` with a README instead of archiving it.
- Context: The 2026-08-11 knowledge-base review found the two requirements-capture templates had diverged by 184 lines, gates and evidence artifacts accumulated without an exit path (a 219KB full-diff artifact), and the reference consumer project showed the same decay at larger scale. The four dispositions were confirmed by the user.
- Impact: Distributable version 0.3.22. PRD `docs/ae/prds/2026-08-11-knowledge-base-governance-prd.md`; plan `docs/ae/plans/2026-08-11-003-knowledge-base-governance-plan.md`; experience `docs/ae/experience/2026-08-11-knowledge-base-governance.md`; archive `docs/00-process/archive/2026-08/knowledge-base-governance/summary.md`.
- Re-evaluate when: a tidy/archival command automates the retention policy, or legacy brainstorm requirements artifacts need migration tooling.

## 2026-08-11: Tidy command turns the retention policy into an executable maintenance pass

- Date: 2026-08-11
- Decision: Add a conservative `tidy` command (dry-run default; five-state process-note classification; retention-based evidence archiving with ledger rewrite; `--archive-stale`, `--stale-days`, `--retention-months` opt-ins; existing archive targets skipped safely), make `parseOptions` accumulate repeated flags so `gate --validation` records every command, land the `## Perspective Collision (Conditional)` section in the PRD capture contract with deterministic brainstorm triggers, add an `ae-review` Light Path, point evidence-tier wording in brainstorm/prd/review at the single `validation-evidence-profile.md` definition, unify handoff routing between `ae-handoff` and `ae-lfg`, and add memory size-and-distillation budgets to the maintenance rules.
- Context: Batch one (0.3.22) wrote the retention policy but nothing executed it; this repository still had July notes in `docs/00-process/active/` and the work reference project had 23 empty task directories. Gate evidence previously kept only the last `--validation` flag.
- Impact: Distributable version 0.3.23. Tidy applied here (structural-debt-refactor merged into its existing archive, four stale July tasks archived) and on the work project (23 empty dirs removed, 2 tasks archived, 4 active kept, 2 skipped on same-name archive conflicts). PRD `docs/ae/prds/2026-08-11-governance-batch-two-prd.md`; plan `docs/ae/plans/2026-08-11-004-governance-batch-two-plan.md`.
- Re-evaluate when: tidy needs merge-on-conflict behavior for existing archive targets, or a scheduled automation should run the retention pass.
