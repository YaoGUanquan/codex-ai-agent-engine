---
type: plan
status: drafted
date: 2026-06-24
title: upstream-ae-skill-optimization
format: human-readable-plan
sharded: false
---

# Upstream AE Skill Optimization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adapt useful workflow logic from the updated upstream AI Agent Engine repository into Codex-native AE skills, templates, metadata, and validation without porting OpenCode runtime behavior.

**Architecture:** Update existing Codex skill guidance first, then strengthen deterministic artifact validation, then refresh audit/source metadata, and only expose graph helper skills if the local shallow graph boundary stays explicit. Keep plugin source and `.agents/skills` mirrors synchronized.

**Tech Stack:** Codex skills in Markdown, Node.js ESM helper scripts, `node:test`, JSON capability catalog, existing AE validation scripts.

---

## Source

- User request: create a detailed execution plan based on the prior upstream optimization analysis.
- External source: `https://gitee.com/jiangqiang1996/ai-agent-engine`.
- Verified upstream Git HEAD at audit time: `b50ca004a6b4300f4ad5d8d281bcb17d4be1b392`.
- Local recorded source commit currently observed in `plugins/ai-agent-engine-codex/skills/ae-help/references/capability-catalog.json`: `597b409eb3a53f78aa86861783e282ae6ffedcb5`.
- Governing local artifact: `docs/ae/constitution.md`.
- Relevant existing files:
  - `plugins/ai-agent-engine-codex/skills/ae-prd/SKILL.md`
  - `.agents/skills/ae-prd/SKILL.md`
  - `plugins/ai-agent-engine-codex/skills/ae-plan/SKILL.md`
  - `.agents/skills/ae-plan/SKILL.md`
  - `plugins/ai-agent-engine-codex/skills/ae-plan/references/plan-template.md`
  - `.agents/skills/ae-plan/references/plan-template.md`
  - `plugins/ai-agent-engine-codex/skills/ae-brainstorm/references/requirements-capture.md`
  - `.agents/skills/ae-brainstorm/references/requirements-capture.md`
  - `plugins/ai-agent-engine-codex/skills/ae-skill-audit/SKILL.md`
  - `.agents/skills/ae-skill-audit/SKILL.md`
  - `plugins/ai-agent-engine-codex/skills/ae-skill-audit/references/audit-template.md`
  - `.agents/skills/ae-skill-audit/references/audit-template.md`
  - `scripts/check-ae-artifacts.mjs`
  - `tests/skill-scripts.test.mjs`
  - `plugins/ai-agent-engine-codex/skills/ae-help/references/capability-catalog.json`
  - `.agents/skills/ae-help/references/capability-catalog.json`
  - `plugins/ai-agent-engine-codex/scripts/skill-language-metadata.mjs`
  - `scripts/check-install-smoke.mjs`
  - `docs/codex-port-analysis.md`
  - `docs/08-ai-memory/03-key-workflows.md`
  - `docs/08-ai-memory/05-decision-log.md`

## Scope

In scope:

- Strengthen PRD and plan skill contracts so generated artifacts are both human-readable and machine-extractable.
- Extend artifact validation for the new frontmatter and cross-field invariants.
- Improve `ae-skill-audit` source freshness and upstream comparison logic.
- Refresh capability source metadata from `597b409...` to `b50ca004...`.
- Optionally promote existing `ae-graph-build` and `ae-graph-query` helper commands into Codex skills through optional branch G1, with explicit shallow/read-only/freshness limits.
- Update focused tests, source/mirror copies, language metadata, install smoke expectations, and docs when user-facing behavior changes.

Out of scope:

- Directly porting OpenCode slash command registration, agent registry, dynamic MCP registration, model scenario routing, session creation, or global rule injection.
- Implementing the upstream full graph database, SQLite storage, AST/tree-sitter parser layer, sharding, or preview UI.
- Changing package dependencies unless a later implementation unit proves the existing standard-library parsing is insufficient.
- Modifying unrelated archived process notes.

## Readiness

- Goal: clear.
- Acceptance criteria:
  - `ae-prd` instructs creation of requirement data documents with stable IDs, AI parse contract, `format`, `sharded`, and origin fingerprint rules.
  - `ae-plan` and `plan-template.md` carry matching machine-readable plan contract, traceability, depth, and sharding rules.
  - `check-ae-artifacts.mjs` rejects missing required `format` / `sharded` fields for new `prd` and `plan` artifacts and rejects invalid origin/fingerprint pairing.
  - `ae-skill-audit` records source freshness evidence, inspected files, commit/ref evidence, and portable/local/runtime-specific classification.
  - Capability catalog source commit reflects `b50ca004a6b4300f4ad5d8d281bcb17d4be1b392`.
  - If optional branch G1 graph skills are added, help/catalog/metadata/install smoke/source mirror checks include them and wording does not overclaim full upstream graph behavior.
  - `npm.cmd test`, `npm.cmd run check`, `node scripts/check-skill-mirror.mjs`, `node scripts/check-skill-language-metadata.mjs`, `node scripts/check-install-smoke.mjs`, `node scripts/check-ae-artifacts.mjs`, and `git diff --check` pass.
- Non-goals: OpenCode runtime parity, new external dependencies, hidden automation.
- Affected areas: skill Markdown, references, artifact checker, tests, capability catalog, language metadata, docs/memory.
- Validation surface: Node syntax checks, Node test suite, mirror checks, metadata checks, install smoke, artifact checker, help output, graph helper smoke commands.
- Open questions:
  - Whether to include graph skill promotion in the same implementation pass or defer it after PRD/plan/audit validation lands. This plan treats it as optional branch G1 that can be skipped without blocking U1-U4 or U6.

## Assumptions

- The implementation will use `b50ca004a6b4300f4ad5d8d281bcb17d4be1b392` as the upstream baseline because `git ls-remote` and direct fetch verified it.
- Existing `docs/ae` artifacts may not yet have `format` or `sharded`; validation changes must either apply only to newly structured paths or include a compatibility strategy for existing artifacts.
- Plugin source remains the source of truth; `.agents/skills` mirrors must be byte-equivalent after normalization.
- The current package intentionally avoids extra dependencies for validation scripts.

## Alternatives Considered

- Recommended: incremental contract hardening across existing skills and checks. Fit: directly improves the current Codex port without runtime drift. Cost: moderate skill/test edits. Risk: existing artifacts may fail if validation is too strict; mitigate with scoped compatibility logic.
- Alternative: add a new `ae-doc-extract` or `ae-artifact-contract` skill first. Fit: closer to upstream tooling vocabulary. Cost: higher catalog and maintenance cost. Risk: duplicates `ae-prd`, `ae-plan`, and `check-ae-artifacts` before the contract is stable.
- Alternative: broad upstream parity port. Fit: highest feature coverage. Cost: high. Risk: violates Codex-native runtime boundary by importing OpenCode assumptions.
- Rejected because: direct parity would add command/agent/MCP/session behaviors Codex cannot enforce here.

## Decision Drivers

- Driver 1: Codex-native runtime boundary from `docs/ae/constitution.md`.
- Driver 2: Deterministic validation should catch artifact contract drift before runtime workflow claims success.
- Driver 3: User-facing help and metadata must reflect actual local capabilities, not upstream features.

## Decisions

### ADR-1 - Update Existing Skills Before Adding New Entry Points

- Decision: Improve `ae-prd`, `ae-plan`, and `ae-skill-audit` first.
- Drivers: existing skill boundaries already own requirements, planning, and external source audit.
- Alternatives: create separate skills for artifact contracts or upstream synchronization.
- Why chosen: fewer new triggers, less catalog churn, and direct alignment with the requested optimization.
- Consequences: implementation must touch both plugin source and `.agents/skills` mirrors.
- Follow-ups: add separate graph skills only if optional branch G1 is approved or still valuable after U1-U4.

### ADR-2 - Artifact Checker Enforces Structure Without Breaking Existing Archives

- Decision: Extend `scripts/check-ae-artifacts.mjs` with required fields and pairing rules, but plan compatibility for legacy artifacts.
- Drivers: current repository already has historical PRD/plan files that may not carry new fields.
- Alternatives: hard-fail every existing artifact immediately, or leave checks manual.
- Why chosen: deterministic checks are valuable, but a single contract upgrade should not force unrelated archive rewrites.
- Consequences: tests must include both valid new-format artifacts and invalid missing-field fixtures.
- Follow-ups: once all active docs are migrated, consider tightening compatibility rules.

### ADR-3 - Graph Skill Exposure Remains Optional And Shallow

- Decision: Treat graph skill promotion as an optional unit that wraps existing `ae-tools.mjs` commands only.
- Drivers: helper commands already exist; full upstream graph tooling is much larger than the current optimization target.
- Alternatives: defer all graph work, or implement upstream graph database and preview.
- Why chosen: exposing existing helper commands can improve discoverability without increasing runtime complexity.
- Consequences: if G1 lands, help notes must emphasize shallow JSON graph, freshness metadata, and no SQLite/preview/runtime dependency claims. If G1 is deferred, U6 still runs final verification for U1-U4 and records graph promotion as deferred scope.
- Follow-ups: full graph storage belongs in a separate plan such as the existing SQLite/vector knowledge index work.

## Risks

- Existing artifact validation may start failing on historical docs if new rules are too broad.
- Skill text may become too long if templates are copied into `SKILL.md` instead of references.
- Source/mirror drift is easy when touching many Markdown files.
- Adding graph skills through optional branch G1 may require metadata and install smoke updates beyond the intended first pass.
- Updating observed upstream commit without recording inspected files would reduce audit traceability.

## Pre-Mortem

- Failure scenario 1: `npm.cmd run check` fails because `check-ae-artifacts.mjs` rejects old PRD/plan files.
- Failure scenario 2: help output lists new graph skills but `.agents/skills` mirror or language metadata is missing, breaking install smoke.
- Failure scenario 3: `ae-skill-audit` guidance claims to verify "latest" without recording `git ls-remote`, branch, inspected files, or unreachable short-hash checks.
- Mitigations:
  - Add focused tests before broadening validation.
  - Run mirror, language metadata, install smoke, and help searches after catalog changes.
  - Require audit output fields for source URL, observed commit, ref source, and inspected files.

## Implementation Units

### U1 - PRD And Requirements Artifact Contract

- Goal: Make PRD and requirements capture output machine-extractable while preserving concise human readability.
- Requirements covered: stable PRD IDs, AI parse contract, origin/fingerprint rules, sharding rule, no implementation leakage.
- Acceptance criteria covered:
  - `ae-prd` names `format: human-readable-requirements`, `sharded`, stable IDs, and `AI Parse Contract`.
  - requirements capture reference includes stable `R*`, `NFR*`, `D*` IDs and consistency check.
  - source and mirror files match.
- Depends on: none.
- Files:
  - `plugins/ai-agent-engine-codex/skills/ae-prd/SKILL.md`
  - `.agents/skills/ae-prd/SKILL.md`
  - `plugins/ai-agent-engine-codex/skills/ae-brainstorm/references/requirements-capture.md`
  - `.agents/skills/ae-brainstorm/references/requirements-capture.md`
  - `tests/skill-scripts.test.mjs`
- Forbidden files:
  - `package-lock.json`
  - `node_modules/**`
- Approach:
  - Add concise PRD workflow phases: recover/source, classify scope, repo scan, pressure-test, capture, review handoff.
  - Move longer template rules into `requirements-capture.md` rather than bloating `ae-prd/SKILL.md`.
  - Add a test that reads plugin and mirror files and asserts the new PRD contract phrases.
- Tests:
  - `npm.cmd test -- --test-name-pattern "PRD artifact contract"`
  - Existing full `npm.cmd test`.
- Validation:
  - `node scripts/check-skill-mirror.mjs`
  - `node scripts/check-ae-artifacts.mjs`
- Rollback signals:
  - Skill becomes too verbose or duplicates the entire upstream text.
  - Tests pass only by matching large brittle paragraphs.
- Deferred to implementation:
  - Exact section names can be tuned, but must remain stable and parseable.

### U2 - Plan Template And Planning Skill Contract

- Goal: Align `ae-plan` and `plan-template.md` with the stronger artifact contract and requirement traceability.
- Requirements covered: plan `format`, `sharded`, source fingerprint, depth, stable implementation units, no invented product behavior.
- Acceptance criteria covered:
  - `plan-template.md` includes `format: human-readable-plan`, `sharded`, optional `depth`, origin/fingerprint pairing guidance, `AI Parse Contract`, and consistency checks.
  - `ae-plan` workflow says source PRD is the truth and must be carried into plan coverage.
  - source and mirror files match.
- Depends on: U1.
- Files:
  - `plugins/ai-agent-engine-codex/skills/ae-plan/SKILL.md`
  - `.agents/skills/ae-plan/SKILL.md`
  - `plugins/ai-agent-engine-codex/skills/ae-plan/references/plan-template.md`
  - `.agents/skills/ae-plan/references/plan-template.md`
  - `tests/skill-scripts.test.mjs`
- Forbidden files:
  - `package-lock.json`
  - `docs/ae/plans/2026-06-24-001-upstream-ae-skill-optimization-plan.md`
- Approach:
  - Preserve existing ADR, pre-mortem, validation, rollback, and multi-agent readiness content.
  - Add a compact artifact contract section rather than replacing the whole skill.
  - Add tests for `format: human-readable-plan`, `sharded`, `AI Parse Contract`, and origin/fingerprint rules.
- Tests:
  - `npm.cmd test -- --test-name-pattern "plan artifact contract"`
  - `node scripts/ae-tools.mjs task-analyze --mode plan --plan docs/ae/plans/2026-06-24-001-upstream-ae-skill-optimization-plan.md`
- Validation:
  - `node scripts/check-skill-mirror.mjs`
  - `node scripts/check-ae-artifacts.mjs`
- Rollback signals:
  - `task-analyze` stops parsing implementation units.
  - Existing plan tests fail because required headings were renamed incompatibly.
- Deferred to implementation:
  - Whether to update older plan artifacts is not part of this unit unless validation requires it.

### U3 - Artifact Checker Contract Validation

- Goal: Make `check-ae-artifacts.mjs` enforce the new PRD/plan contract deterministically.
- Requirements covered: required `format`, `sharded`, origin/fingerprint pairing, shard parent/module validation, repository-relative paths.
- Acceptance criteria covered:
  - Missing `format` or `sharded` on newly managed `prd` and `plan` fixtures fails.
  - `origin` without `originFingerprint`, or reverse, fails.
  - Existing repository artifacts still pass without unrelated archive rewrites under compatibility mode.
  - Strict mode can be run explicitly to enforce the new contract across all `prd` and `plan` artifacts.
- Depends on: U1, U2.
- Files:
  - `scripts/check-ae-artifacts.mjs`
  - `tests/skill-scripts.test.mjs`
  - Optional if plugin script copy exists in future: `plugins/ai-agent-engine-codex/scripts/check-ae-artifacts.mjs`
- Forbidden files:
  - `docs/ae/archive/**`
  - `docs/00-process/archive/**`
  - `package-lock.json`
- Approach:
  - Add helper predicates for required fields and origin pair validation.
  - Keep parser dependency-free.
  - Use temp fixtures in `tests/skill-scripts.test.mjs` for invalid and valid frontmatter.
  - Implement two deterministic validation levels:
    - Compatibility mode, used by the existing package checks: enforce `format` and `sharded` only when an artifact is new-contract managed. A file is new-contract managed when either `format` or `sharded` is present, or when its `date` is `2026-06-24` or later. This keeps historical artifacts from failing merely because they predate the contract.
    - Strict mode, enabled by a new `--strict` flag: enforce `format` and `sharded` for every `type: prd` and `type: plan` artifact under `docs/ae`.
  - Enforce origin/fingerprint pairing in both modes for any artifact that has either `origin` or `originFingerprint`, because partial source lineage is invalid regardless of document age.
  - Add tests named to distinguish compatibility behavior from strict behavior.
- Tests:
  - `npm.cmd test -- --test-name-pattern "check-ae-artifacts"`
  - `node scripts/check-ae-artifacts.mjs`
  - `node scripts/check-ae-artifacts.mjs --strict` after either confirming existing artifacts comply or documenting any legacy failures as a migration follow-up outside this implementation pass.
- Validation:
  - `npm.cmd test`
  - `npm.cmd run check`
- Rollback signals:
  - The checker rejects current docs/ae artifacts without a deliberate migration decision.
  - Compatibility mode and strict mode produce indistinguishable results in tests, making the rollout boundary unclear.
  - The implementation starts using a YAML package just for this simple validation.
- Deferred to implementation:
  - Full semantic ID count validation can be added after the field-level contract lands if it proves too large for this unit.

### U4 - Source Freshness And Audit Output Upgrade

- Goal: Make `ae-skill-audit` reliably capture upstream freshness, inspected files, and runtime-boundary classification.
- Requirements covered: source URL, license, observed commit, ref source, inspected files, commit mismatch handling, portable/local/runtime-specific classification.
- Acceptance criteria covered:
  - Audit skill requires `git ls-remote` or equivalent source verification when network is available.
  - Audit template includes source freshness fields and comparison matrix.
  - Capability catalog source commit is updated to `b50ca004a6b4300f4ad5d8d281bcb17d4be1b392`.
  - `docs/codex-port-analysis.md` records the new observed source commit and boundary summary.
- Depends on: none.
- Files:
  - `plugins/ai-agent-engine-codex/skills/ae-skill-audit/SKILL.md`
  - `.agents/skills/ae-skill-audit/SKILL.md`
  - `plugins/ai-agent-engine-codex/skills/ae-skill-audit/references/audit-template.md`
  - `.agents/skills/ae-skill-audit/references/audit-template.md`
  - `plugins/ai-agent-engine-codex/skills/ae-help/references/capability-catalog.json`
  - `.agents/skills/ae-help/references/capability-catalog.json`
  - `docs/codex-port-analysis.md`
  - `docs/08-ai-memory/03-key-workflows.md`
  - `docs/08-ai-memory/05-decision-log.md`
  - `tests/skill-scripts.test.mjs`
- Forbidden files:
  - `package-lock.json`
- Approach:
  - Extend audit guidance; do not copy upstream OpenCode tool text.
  - Add test expectations for `git ls-remote`, `observedCommit`, `inspected files`, `portable method`, `local deterministic mechanism`, and `runtime-specific behavior`.
  - Update catalog source commit in both source and mirror.
  - Use docs/memory updates only for durable behavior and observed commit, not transient command output.
- Tests:
  - `npm.cmd test -- --test-name-pattern "source freshness"`
  - `node scripts/ae-tools.mjs help skill-audit`
  - `node scripts/ae-tools.mjs help graph`
- Validation:
  - `node scripts/check-skill-mirror.mjs`
  - `node scripts/check-skill-language-metadata.mjs`
  - `node scripts/check-install-smoke.mjs`
- Rollback signals:
  - Audit output implies Codex can enforce OpenCode runtime hooks.
  - Help catalog update changes user-facing skill count without matching metadata.
- Deferred to implementation:
  - No new network helper script is required unless repeated audits show manual `git ls-remote` is error-prone.

### G1 - Optional Graph Skill Promotion

- Goal: Decide whether to expose existing shallow graph helper commands as first-class Codex skills.
- Requirements covered: discoverability of graph helpers, explicit limitations, source/mirror/metadata/help consistency.
- Acceptance criteria covered if implemented:
  - New `ae-graph-build` and `ae-graph-query` skills exist in plugin source and `.agents/skills`.
  - `agents/openai.yaml` exists for both skills.
  - `skill-language-metadata.mjs`, `check-install-smoke.mjs`, and capability catalog include both skills.
  - Skill wording states shallow JSON graph, read-only helper, freshness metadata, and no full upstream graph DB/preview/AST guarantees.
  - Existing graph command tests still pass.
- Depends on: U4, and only after the user or executor explicitly chooses `graph_skill_decision: implemented`.
- Files:
  - `plugins/ai-agent-engine-codex/skills/ae-graph-build/SKILL.md`
  - `.agents/skills/ae-graph-build/SKILL.md`
  - `plugins/ai-agent-engine-codex/skills/ae-graph-build/agents/openai.yaml`
  - `.agents/skills/ae-graph-build/agents/openai.yaml`
  - `plugins/ai-agent-engine-codex/skills/ae-graph-query/SKILL.md`
  - `.agents/skills/ae-graph-query/SKILL.md`
  - `plugins/ai-agent-engine-codex/skills/ae-graph-query/agents/openai.yaml`
  - `.agents/skills/ae-graph-query/agents/openai.yaml`
  - `plugins/ai-agent-engine-codex/scripts/skill-language-metadata.mjs`
  - `scripts/check-install-smoke.mjs`
  - `plugins/ai-agent-engine-codex/skills/ae-help/references/capability-catalog.json`
  - `.agents/skills/ae-help/references/capability-catalog.json`
  - `tests/skill-scripts.test.mjs`
- Forbidden files:
  - `plugins/ai-agent-engine-codex/scripts/ae-tools.mjs`
  - `scripts/ae-tools.mjs`
  - `package-lock.json`
- Approach:
  - Prefer not touching graph implementation code.
  - Create thin skill wrappers around existing commands.
  - If metadata churn is too large, skip G1 and leave graph helpers as commands only.
- Tests:
  - `node scripts/ae-tools.mjs ae-graph-build --root scripts --no-write`
  - `node scripts/ae-tools.mjs ae-graph-query --root scripts --path ae-tools.mjs --no-write`
  - `node scripts/check-install-smoke.mjs`
- Validation:
  - `npm.cmd test`
  - `npm.cmd run check`
- Rollback signals:
  - New skills create confusion with the separate vector/SQLite knowledge-index plan.
  - Help output suggests full upstream graph behavior.
- Deferred to implementation:
  - Full graph persistence and preview UI are not part of this unit.

### U6 - Final Verification And Delivery Evidence

- Goal: Verify the whole optimization and preserve enough delivery evidence for review.
- Requirements covered: full validation, mirror consistency, help/catalog consistency, artifact validation.
- Acceptance criteria covered:
  - Full validation command set passes or blockers are named precisely.
  - `git diff --check` reports no whitespace errors.
  - Final summary identifies whether G1 was implemented or deferred.
- Depends on: U1, U2, U3, U4.
- Files:
  - `docs/ae/gates/<timestamp>-work-final.json` if `ae-tools.mjs gate --write-proof` is used.
  - Optional process note under `docs/00-process/active/upstream-ae-skill-optimization/` if implementation spans multiple turns.
- Forbidden files:
  - none beyond preserving unrelated user changes.
- Approach:
  - Run narrow checks after each unit, then broad checks at the end.
  - Use `npm.cmd` on Windows for package scripts.
  - Record exact command results in final response and gate proof when generated.
  - Before final validation, record `graph_skill_decision: implemented` or `graph_skill_decision: deferred`.
  - If `graph_skill_decision: implemented`, run G1's graph skill metadata, install smoke, and graph helper checks as part of U6.
  - If `graph_skill_decision: deferred`, do not require G1 files, metadata, or install smoke changes beyond existing graph helper command coverage.
- Tests:
  - `npm.cmd test`
  - `npm.cmd run check`
  - `node scripts/check-skill-mirror.mjs`
  - `node scripts/check-skill-language-metadata.mjs`
  - `node scripts/check-install-smoke.mjs`
  - `node scripts/check-ae-artifacts.mjs`
  - `node scripts/ae-tools.mjs help prd`
  - `node scripts/ae-tools.mjs help graph`
  - `git diff --check`
- Validation:
  - Optional final gate:
    - `node scripts/ae-tools.mjs gate --workflow work --checkpoint final --plan docs/ae/plans/2026-06-24-001-upstream-ae-skill-optimization-plan.md --validation "npm.cmd test; npm.cmd run check; node scripts/check-skill-mirror.mjs; node scripts/check-skill-language-metadata.mjs; node scripts/check-install-smoke.mjs; node scripts/check-ae-artifacts.mjs; git diff --check" --review-status not_run --worktree-decision not_applicable --write-proof`
- Rollback signals:
  - Any core validation command fails after changes.
  - Help or install smoke lists skills that do not exist in source and mirror.
- Deferred to implementation:
  - Code review with `ae-review` should run after implementation if the user wants review before delivery.

## Validation Plan

- Unit:
  - Focused `node:test` patterns for PRD contract, plan contract, artifact checker, source freshness, and optional graph skills.
- Integration:
  - `npm.cmd test`
  - `npm.cmd run check`
  - `node scripts/check-skill-mirror.mjs`
  - `node scripts/check-skill-language-metadata.mjs`
  - `node scripts/check-install-smoke.mjs`
  - `node scripts/check-ae-artifacts.mjs`
- User flow:
  - `node scripts/ae-tools.mjs help prd`
  - `node scripts/ae-tools.mjs help plan`
  - `node scripts/ae-tools.mjs help skill-audit`
  - `node scripts/ae-tools.mjs help graph`
- Data / operations:
  - Validate `capability-catalog.json` parses as JSON in source and mirror.
  - Validate source and mirror content equality.
- Observability:
  - Final response records exact command names and pass/fail status.
  - Optional final gate writes `docs/ae/gates/<timestamp>-work-final.json`.

## Rollback / Recovery

- If artifact validation becomes too strict, revert only `scripts/check-ae-artifacts.mjs` and its focused tests, then re-run the old checker to confirm current artifacts pass.
- If source/mirror drift appears, copy from plugin source to `.agents/skills` for the touched skill directories only, then run `node scripts/check-skill-mirror.mjs`.
- If optional graph promotion destabilizes metadata or install smoke, revert G1 files and keep graph helpers as CLI commands.
- If capability catalog JSON breaks help, restore the last valid JSON shape and reapply only the `observedCommit` field update.

## Plan Self-Review

- Placeholder scan: no placeholders remain; optional G1 is explicitly scoped and can be skipped.
- Consistency check: plan preserves Codex-native runtime boundary and does not require OpenCode runtime behavior.
- Scope check: one execution pass can implement U1-U4 and U6; G1 is separable and not part of default task execution.
- Acceptance coverage: required acceptance criteria map to U1-U4 and U6; optional graph acceptance maps to G1 only when selected.
- Validation gaps: document review is recommended after implementation but not run by this planning step.
- Alternatives and ADR check: incremental existing-skill update is selected over new skills or direct upstream parity.
- High-risk pre-mortem check: validation breakage, catalog drift, and source freshness overclaiming have mitigations.
- Review feedback resolution: U6 no longer depends on optional graph work; graph promotion is now branch G1 instead of a default `U*` execution unit. U3 defines compatibility mode, strict mode, and deterministic new-contract detection.

## Handoff

Recommended next step: review this plan, then execute with `ae-work` in serial mode for U1-U4 and U6. Decide explicitly whether to include optional branch G1 before implementation starts.

If using Superpowers execution, use subagent-driven development only after the pre-edit Git gate confirms a clean branch and the worker prompts constrain each unit to its listed files.
