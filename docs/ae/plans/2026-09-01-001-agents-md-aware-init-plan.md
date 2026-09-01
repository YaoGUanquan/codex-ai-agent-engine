---
type: plan
status: completed
date: 2026-09-01
title: agents-md-aware-init
origin: docs/ae/prds/2026-09-01-agents-md-aware-init-prd.md
originFingerprint: 2026-09-01-agents-md-aware-init
depth: standard
format: human-readable-plan
sharded: false
---

# Plan: AGENTS.md-aware AE Init

## Source

- `docs/ae/prds/2026-09-01-agents-md-aware-init-prd.md`
- Read-only audit of `agentsmd/agents.md` at `6ae22720966e9cca6b2c2dd0780fb7265a87a46c` and current OpenAI Codex AGENTS.md documentation.

## AI Parse Contract

- canonicalKind: plan
- humanEquivalent: true
- stableIdsRequired: true
- noImplicitScope: true

## Scope

Add deterministic profile selection, managed-region safety, command rendering, instruction explanation, and bounded nested previews to `ae-init`; synchronize its distributed skill contract, tests, provenance, and release metadata.

## Readiness

- Goal: make init standards-aware and conservative without adding dependencies or auto-writing nested rules.
- Acceptance criteria: R1-R6 and NFR1 from the source PRD.
- Non-goals: client-specific config generation, automatic nested files, complete workspace parsing, automatic legacy migration.
- Affected areas: init CLI/templates, skill source/mirror, help/catalog, tests, README/changelog/version, external watchlist.
- Validation surface: focused init tests, full tests, contracts, install smoke, release notes, diff check.
- Open questions: none.

## Assumptions

- The current dirty worktree contains user-owned GSAP release work and must be merged incrementally.
- Defaulting to `ae-core` is an accepted behavior change because the user approved the reviewed recommendation; `full` is the compatibility route.

## Alternatives Considered

- Recommended: three profiles plus diagnostic preview and managed regions.
- Alternative: patch only force overwrite and override detection; rejected because it leaves command rendering and scaffold sizing unresolved.
- Alternative: generate configuration for every supported agent; rejected because runtime semantics differ and the request is about AGENTS.md initialization.

## Decision Drivers

- Preserve user-authored living documentation.
- Keep generic format claims separate from Codex runtime behavior.
- Retain deterministic, dependency-free, preview-first operation.

## Decisions

### ADR-1 - Profiles replace a single implicit scaffold

- Decision: make `ae-core` default, expose `minimal` and `full` explicitly.
- Drivers: minimality, discoverability, legacy compatibility.
- Alternatives: preserve full default; remove legacy directories entirely.
- Why chosen: explicit profiles make both new-project simplicity and compatibility testable.
- Consequences: help and release notes must describe the default change.
- Follow-ups: none.

### ADR-2 - Managed regions replace whole-file force writes

- Decision: new generated files receive start/end markers; force replaces only that region and reports legacy marker-only files as conflicts.
- Drivers: data preservation and deterministic ownership.
- Alternatives: content fingerprints; explicit destructive legacy flag.
- Why chosen: regions preserve user content without maintaining historical template fingerprints.
- Consequences: legacy projects need a manual migration before future force updates.
- Follow-ups: return actionable conflict notes.

## Risks

- Existing scripts may assume the former default directory set.
- Broad nested scanning could become slow or cross links.
- Bilingual marker composition could produce ambiguous regions.

## Pre-Mortem

- Failure scenario 1: default profile omits a path later commands require. Mitigation: retain all canonical AE/process/memory paths in `ae-core` and test them.
- Failure scenario 2: force replacement removes surrounding user text. Mitigation: exact single-region parsing plus preservation tests.
- Failure scenario 3: nested preview walks dependency or linked trees. Mitigation: depth/result caps, excluded directories, and no symbolic-link traversal.

## Global Constraints

- No new dependencies and no client-specific configuration generation.
- Preserve unrelated dirty-worktree changes.
- No automatic nested-file writes or legacy whole-file overwrite.

## Implementation Units

### U1 - Init behavior and templates

- Goal: implement profiles, managed regions, commands, instruction inventory, and nested preview.
- Requirements covered: R1, R2, R3, R4, R5, NFR1.
- Acceptance criteria covered: profile boundaries, real commands, deterministic explanation, preview-only candidates, preservation/conflict behavior.
- Depends on: none.
- Files: `plugins/ai-agent-engine-codex/scripts/ae-tools/init.mjs`, `plugins/ai-agent-engine-codex/scripts/ae-tools/init-templates/en/agents.md`, `plugins/ai-agent-engine-codex/scripts/ae-tools/init-templates/zh-CN/agents.md`, `plugins/ai-agent-engine-codex/scripts/ae-tools/help.mjs`.
- Forbidden files: frontend-design skill files and GSAP process artifacts.
- Approach: use Node standard-library bounded discovery and a single generated managed region per file.
- Tests: focused `ae-tools` init fixtures.
- Validation: `node --test tests/ae-tools.test.mjs`.
- Rollback signals: any whole-file user-content loss, nested writes, or missing canonical core paths.
- Deferred to implementation: none.

### U2 - Skill and distribution contract

- Goal: document implemented semantics and publish the change consistently.
- Requirements covered: R6.
- Acceptance criteria covered: source/mirror, help/catalog, provenance, version, release notes, and claim checks agree.
- Depends on: U1.
- Files: `.ae-source/skills/ae-init/**`, `plugins/ai-agent-engine-codex/skills/ae-init/**`, `plugins/ai-agent-engine-codex/skills/ae-help/references/capability-catalog.json`, `.ae-source/skills/ae-help/references/capability-catalog.json`, `plugins/ai-agent-engine-codex/scripts/skill-language-metadata.mjs`, `docs/ae/references/external-skill-watchlist.json`, `README.md`, `README.en.md`, `CHANGELOG.md`, `CHANGELOG.en.md`, `package.json`, `plugins/ai-agent-engine-codex/.codex-plugin/plugin.json`.
- Forbidden files: existing GSAP skill guidance and its PRD/plan/solution.
- Approach: describe generic AGENTS.md support separately from Codex diagnostics; increment to `0.3.39` on top of current `0.3.38` edits.
- Tests: mirror, language, skill contract, release-note, and claims checks.
- Validation: `npm run check` and `npm run check:smoke`.
- Rollback signals: mismatched versions, mirror drift, unsupported runtime claim, or overwritten GSAP release content.
- Deferred to implementation: none.

### U3 - Regression and delivery evidence

- Goal: prove behavior, review the complete task scope, and write a final gate.
- Requirements covered: R1-R6, NFR1.
- Acceptance criteria covered: all source acceptance conditions.
- Depends on: U1, U2.
- Files: `tests/ae-tools.test.mjs`, `docs/00-process/active/agents-md-aware-init/progress.md`, `docs/ae/reviews/2026-09-01-agents-md-aware-init-implementation-review.md`, generated gate evidence.
- Forbidden files: unrelated tests.
- Approach: add behavior-level fixtures, run focused then broad validation, inspect complete diff, and record bounded claims.
- Tests: focused init suite plus repository suite.
- Validation: `npm test`, `npm run check`, `npm run check:smoke`, `node scripts/check-release-notes.mjs`, `git diff --check`.
- Rollback signals: any failed scoped test or blocking review finding.
- Deferred to implementation: none.

## Consistency Check

- implementationUnitCount: 3
- sourceRequirementsCovered: R1, R2, R3, R4, R5, R6, NFR1
- sourceRequirementsDeferred: none
- openQuestionsCount: 0

## Validation Plan

- Unit: profile, managed-region, inventory, nested-preview fixtures.
- Integration: full Node test suite and contract checks.
- User flow: init dry-run and real init against temporary projects for each profile.
- Data / operations: not applicable; no service or persisted-data boundary.
- Observability: JSON result fields provide profiles, instruction inventory, nested candidates, conflicts, and notes.

## Rollback / Recovery

Revert only task-owned changes; keep the prior full scaffold available under `--profile full`. A validation failure or conflict-handling regression blocks release.

## Plan Self-Review

- Placeholder scan: passed; no placeholders.
- Consistency check: passed; all requirements mapped.
- Scope check: passed; no client-config expansion.
- Acceptance coverage: passed.
- Validation gaps: none before implementation; runtime claims remain bounded to local CLI tests.
- Alternatives and ADR check: passed.
- High-risk pre-mortem check: passed for destructive overwrite risk.

## Handoff

Execute serially in the current worktree because shared release files are already modified by user-owned work and multi-agent write workers are disabled.
