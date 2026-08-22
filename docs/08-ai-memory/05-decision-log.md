<!-- ae-codex:init managed -->
# 决策记录

这里记录长期有效的项目决策。

## 模板

- 日期：
- 决策：
- 背景：
- 影响：
- 何时重新评估：

## 已归档决策索引（2026-05 至 2026-07）

以下 20 条决策全文已轮换至 `docs/99-archive/2026-08/memory-distillation/05-decision-log-2026-05-to-2026-07.md`（只移动、未删改）：

- 2026-05-11：初始化命令的文档与记忆库布局
- 2026-06-02: Adapt external workflow ideas without importing runtime
- 2026-06-03: Default bilingual skill metadata and external skill audit entrypoint
- 2026-06-04: Phase 2 graph, merge, and browser routing
- 2026-06-08: Multi-agent defaults to auto analysis, not write-agent spawning
- 2026-06-16: Split read and write multi-agent eligibility
- 2026-06-12: Adapt Spec Kit workflow patterns without vendoring runtime
- 2026-06-19: Adapt Ponytail minimality patterns without importing runtime
- 2026-06-19: Adapt Open Code Review mechanics without importing runtime
- 2026-06-19: Adapt Claude Code best-practice taxonomy without vendoring runtime
- 2026-06-24: Refresh upstream AE audit baseline and artifact contracts
- 2026-07-07: Refresh upstream AE baseline and repair PRD reference completeness
- 2026-07-07: Adapt upstream brainstorm collision and formal web routing
- 2026-07-07: Add Codex-native ae-design and ae-web-forge entrypoints
- 2026-07-07: Make ae-web-forge the unified Web routing entrypoint and add design contract checks
- 2026-07-07: Treat SkillOpt-style self-evolution as audit discipline before runtime
- 2026-07-13: Adapt tiered help and workflow completion guards from upstream
- 2026-07-22: Adapt upstream validator safety and risk-scaled test design
- 2026-07-24: Require an explicit local runtime smoke gate after implementation
- 2026-07-28: Make frontend motion static-first and evidence-bound

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
- Impact: `docs/ae/graphs/README.md` documents query commands and artifact types; registry relations extended for August 2026 deliveries. Knowledge-base governance batches one–three landed in **0.3.22–0.3.24** (`53c94aa`, `6721ce3`).
- Re-evaluate when: review evidence fingerprint format changes, or graph build gains persisted snapshots beyond the read-only helper.

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
- Decision: Add conservative `tidy` (dry-run default, five-state notes, retention archiving), accumulate repeated `--validation` flags, land PRD Perspective Collision, add `ae-review` Light Path, unify evidence-tier wording and handoff routing, and add memory size budgets.
- Context: Batch one (0.3.22) wrote the retention policy but nothing executed it; this repository still had July notes in `docs/00-process/active/` and the work reference project had 23 empty task directories. Gate evidence previously kept only the last `--validation` flag.
- Impact: 0.3.23. Plan `docs/ae/plans/2026-08-11-004-governance-batch-two-plan.md`; experience `docs/ae/experience/2026-08-11-governance-batch-two.md`; archive `docs/00-process/archive/2026-08/governance-batch-two/summary.md`.
- Re-evaluate when: merge-on-conflict for archive targets ships, or scheduled automation should run the retention pass.

## 2026-08-11: Post-update auto-maintenance and tidy archive merge

- Date: 2026-08-11
- Decision: Extend `tidy` with lossless file-by-file merge when an archive target already exists, add report-only `memoryBudget` (default 15KB per memory file), and run conservative `tidy --apply` automatically after `update-project` completes (summary in JSON `maintenance`; `--no-tidy` opt-out; failure does not block update). Work reference project archive conflicts merged; memory distillation deferred via handoff when files are actively edited.
- Context: Batch two skipped two same-name archive targets; consumer projects had no hook to run retention after plugin upgrades; first budget scan showed this repo's decision log and workflows over the new size limits.
- Impact: Distributable version 0.3.24; commit `6721ce3`. PRD `docs/ae/prds/2026-08-11-governance-batch-three-prd.md`; plan `docs/ae/plans/2026-08-11-005-governance-batch-three-plan.md`; experience `docs/ae/experience/2026-08-11-governance-batch-three.md`; archive `docs/00-process/archive/2026-08/governance-batch-three/summary.md`. Calibration signals for Light Path and collision triggers live in batch-two experience note.
- Re-evaluate when: memory distillation tooling automates oversized files, or auto-maintenance needs `--archive-stale` as an opt-in profile.

## 2026-08-11: Release-notes split, process-archive closeout, and deferred frontend contract mapping

- Date: 2026-08-11
- Decision: Complete release history lives in `CHANGELOG.md`/`CHANGELOG.en.md`; each README keeps the latest five entries plus a changelog link, enforced by `scripts/check-release-notes.mjs`. Finished process dirs leave `docs/00-process/active/` by a manual pass. Legacy frontend counterparts and the quality-contract map were later closed early (next entry).
- Context: README version history was unbounded; tidy does not classify unlabeled finished tasks.
- Impact: Repository-side only. Experience `docs/ae/experience/2026-08-11-governance-batch-four.md`; archive `docs/00-process/archive/2026-08/governance-batch-four/summary.md`.
- Re-evaluate when: the five-entry README window is the wrong size.

## 2026-08-11: Close roadmap items 7 and 10 early with legacy counterparts and a descriptive contract map

- Date: 2026-08-11
- Decision: At the user's direction, add minimal Svelte 4 / NgModule / Options API counterparts and the descriptive map `docs/ae/references/frontend-quality-contract-map.md` without waiting for the recorded triggers. No checker; `ae-review` Frontend Components / Styles stays version-agnostic.
- Context: Batch four had deferred both items; the 2026-08-11 re-check found no trigger, then the user chose early completion.
- Impact: 0.3.26. Experience `docs/ae/experience/2026-08-11-frontend-legacy-and-contract-map.md`; archive `docs/00-process/archive/2026-08/frontend-legacy-and-contract-map/summary.md`.
- Re-evaluate when: a real legacy-stack miss or contract-surface growth justifies extending the counterparts or upgrading the map.

## 2026-08-22: Track mattpocock/skills without auto-updating AE skills

- Date: 2026-08-22
- Decision: Pin `https://github.com/mattpocock/skills` as research input. Recheck with `skill-audit --watch`; never auto-edit skills.
- Context: Diagnosing, TDD, review, deep-module, and tracer-ticket methods were already adapted.
- Impact: 0.3.32–0.3.34. Issues stay referential. See `16-mattpocock-skills-watch.md` and `docs/ae/experience/2026-08-22-codex-orchestration-and-mattpocock-watch.md`.
- Re-evaluate when: a stale recheck produces an adopted-skill gap with evidence, or another external source needs the same watchlist.

## 2026-08-13: Cursor user skills are real copies, not links

- Date: 2026-08-13
- Decision: Codex stays on `ai-agent-engine-codex@personal`. Cursor discovery is real `~/.cursor/skills/ae-*` copies of the personal plugin skills. Do not restore `.agents/skills` or write `~/.cursor/skills-cursor`. Leftover 0.3.29 links that still resolve to the plugin may be replaced without `--retire-modified`; unlink them, never recursive-delete through a junction.
- Context: 0.3.29 junctions passed isolated-home `realpath` checks, but live `/ae` stayed empty until a real copy appeared. Cursor does not track skill-directory links.
- Impact: 0.3.29 then 0.3.30 (`8236fa6`, `cd20d47`). Experience `docs/ae/experience/2026-08-13-cursor-user-skill-discovery.md`; archive `docs/00-process/archive/2026-08/cursor-user-skill-discovery/summary.md`.
- Re-evaluate when: Cursor documents a supported user-plugin or symlink-tracking skill root, or a Cursor marketplace plugin is in scope.
