---
type: plan
status: drafted
date: 2026-08-30
title: global-runtime-contract-repair
origin: docs/ae/prds/2026-08-30-global-runtime-contract-repair-prd.md
originFingerprint: 2026-08-30-global-runtime-contract-repair
depth: standard
format: human-readable-plan
sharded: false
---

# Plan: Global Runtime Contract Repair

## Source

- PRD: `docs/ae/prds/2026-08-30-global-runtime-contract-repair-prd.md`
- Design: `docs/ae/designs/global-runtime-contract-repair-2026-08-30/design.md`
- Governing rules: `AGENTS.md`

## AI Parse Contract

- canonicalKind: plan
- humanEquivalent: true
- stableIdsRequired: true
- noImplicitScope: true

## Scope

Repair global CLI/help parity, root semantics, explicit design compatibility reporting, regression evidence, release metadata, and current-user Codex/Cursor distribution.

## Readiness

- Goal: all globally advertised commands execute, root options are unambiguous, design migration checks do not weaken strict gates, and installed copies match the new release.
- Acceptance criteria: PRD R1-R6 and NFR1-NFR2.
- Non-goals: consumer-document migration, relaxed strict default, commit, or push.
- Affected areas: dispatcher, checker scripts, global updater, help/skill mirror, tests, release metadata, current-user install.
- Validation surface: focused Node tests, contract checks, isolated install smoke, real installed-version/fingerprint checks.
- Open questions: none.

## Validation Evidence

| Acceptance criterion | Applicable tier | Expected signal and bounded claim | Preconditions / owner | Status | Recovery or rollback signal |
| --- | --- | --- | --- | --- | --- |
| R1, R3-R5 | Focused automated test | CLI syntax, root containment, strict/compat behavior work in fixtures. | Maintainer; Node test runner. | unverified | Any advertised command or mode disagrees with expected exit/output. |
| R1-R6, NFR1 | Integration or build | Full test/check/smoke passes except explicitly reported host constraints. | Maintainer; local repo. | unverified | Mirror, rollback, release, or install smoke fails. |
| R2, R6 | Deployment or operations | Current-user runtime, personal plugin and Cursor copies match the release. | User explicitly requested update; network and Codex CLI available. | unverified | Installer reports rollback/recovery failure or fingerprints diverge. |

## Assumptions

- Existing unrelated 0.3.35 frontend-governance changes are retained and included in the next patch release.

## Alternatives Considered

- Recommended: thin dispatcher adapters plus existing scripts/installer; explicit report-only `--compat`.
- Alternative: mode-aware help that hides unsupported commands. Rejected because checkers and update are expected capabilities and already exist in the installed runtime.
- Alternative: relax design checks by artifact date or format. Rejected because dates do not identify the generating contract and would hide invalid new artifacts.
- Alternative: add a new contract-version migration framework now. Rejected as larger than the proven defect; explicit compatibility output is sufficient and reversible.

## Decision Drivers

- Driver 1: executable public help and backward-compatible strict gates.
- Driver 2: deterministic path selection and containment.
- Driver 3: transactional, evidence-backed current-user distribution.

## Decisions

### ADR-1 - Reuse runtime implementation boundaries

- Decision: checker adapters spawn existing scripts; updater delegates to existing global install preview/apply.
- Drivers: minimal ownership and consistent rollback.
- Alternatives: duplicate validation/install logic.
- Why chosen: existing scripts are the canonical behavior.
- Consequences: adapters need focused output/exit propagation tests.
- Follow-ups: none.

### ADR-2 - Keep compatibility explicit

- Decision: `--compat` changes severity/exit only; it does not suppress diagnostics or alter default validation.
- Drivers: migration visibility and delivery integrity.
- Alternatives: heuristic legacy classification.
- Why chosen: callers cannot mistake default success for compatibility.
- Consequences: documentation must state the proof boundary.
- Follow-ups: versioned contracts may be proposed separately if real migrations require automated transforms.

## Risks

- Replacing the executing global runtime could leave a partial install if the transactional boundary is bypassed.
- Help/source mirror or release notes may drift in a dirty worktree.
- Existing tests may rely on the old ignored `--root` bypass.

## Pre-Mortem

- Failure scenario 1: global update replaces runtime but not Cursor copies. Mitigation: existing publish phase plus post-install fingerprints.
- Failure scenario 2: `--compat` is treated as conformance. Mitigation: distinct status, warning field, help wording, and tests.
- Failure scenario 3: root change breaks skill-audit fixtures. Mitigation: migrate project selection to `--project-root` and preserve relative scan roots only where implemented.

## Global Constraints

- Preserve all unrelated dirty-worktree changes.
- Do not edit consumer projects or add dependencies.
- Do not commit or push.

## Implementation Units

### U1 - Dispatcher and root contract

- Goal: expose checkers/update through the global dispatcher and separate project/root semantics.
- Requirements covered: R1-R3, NFR1.
- Acceptance criteria covered: globally advertised commands run; nested/explicit root matrix passes.
- Depends on: none.
- Files: `plugins/ai-agent-engine-codex/scripts/ae-tools.mjs`, new focused command modules, capability catalog and affected skill source/mirror files, dispatcher/global tests.
- Forbidden files: consumer repositories, lockfiles.
- Approach: thin adapters; no checker duplication; restrict generic root bypass to graph helper commands.
- Tests: command routing, help syntax, nested cwd, absolute/relative roots, updater delegation.
- Validation: focused `node --test` suites.
- Rollback signals: project selection changes outside documented commands or help advertises unavailable scripts.
- Deferred to implementation: exact update result envelope while preserving installer report.

### U2 - Design compatibility corpus

- Goal: add explicit compatibility reporting and a deterministic partial-design fixture.
- Requirements covered: R4-R5.
- Acceptance criteria covered: strict fails, compat succeeds with identical diagnostics.
- Depends on: none.
- Files: `plugins/ai-agent-engine-codex/scripts/check-design-contract.mjs`, root wrapper if needed, `tests/fixtures/**`, `tests/contracts.test.mjs`.
- Forbidden files: `D:/codes/work/**`.
- Approach: collect the same errors, then choose strict failure or compatibility warning result at output boundary.
- Tests: no-design, valid, malformed strict, malformed compat, UI direction rule.
- Validation: focused contract tests and checker against this repository.
- Rollback signals: default invalid artifacts start passing or compat drops diagnostics.
- Deferred to implementation: none.

### U3 - Release and distribution verification

- Goal: synchronize version/release evidence and refresh current-user Codex/Cursor copies.
- Requirements covered: R2, R6, NFR1-NFR2.
- Acceptance criteria covered: all checks pass and installed copies match.
- Depends on: U1, U2.
- Files: `package.json`, `plugins/ai-agent-engine-codex/.codex-plugin/plugin.json`, bilingual README/CHANGELOG files, `tests/ae-tools.test.mjs`, `tests/contracts.test.mjs`, `scripts/check-install-smoke.mjs`, `scripts/check-global-install-smoke.mjs`, `docs/00-process/active/global-runtime-contract-repair/progress.md`; current-user managed install paths only during final apply.
- Forbidden files: consumer docs/source, Git metadata.
- Approach: bump patch version, run release checks, run global preview/apply from current source, verify manifests and Cursor fingerprints.
- Tests: full automated suite and smoke.
- Validation: `npm test`, `npm run check`, `npm run check:smoke`, release notes, diff check, installed runtime commands/fingerprints.
- Rollback signals: installer not completed, recovery failed, source/mirror mismatch, or installed copies diverge.
- Deferred to implementation: real update may remain unverified if network/Codex registration is unavailable; report exact blocker.

## Consistency Check

- implementationUnitCount: 3
- sourceRequirementsCovered: R1, R2, R3, R4, R5, R6, NFR1, NFR2
- sourceRequirementsDeferred: none
- openQuestionsCount: 0

## Validation Plan

- Unit: dispatcher/root and strict/compat tests.
- Integration: full checks plus isolated global/project install smoke.
- User flow: execute installed help/checker/memory commands from a consumer project and inspect update result.
- Data / operations: current-user managed runtime/plugin/Cursor paths only; consumer project state excluded.
- Observability: structured checker mode/count and installer operation report.

## Rollback / Recovery

- Source patch remains uncommitted and can be selectively reverted by the user.
- Global apply uses the existing operation journal and backups; any apply failure must report rolled-back or recovery-failed and retain evidence.

## Plan Self-Review

- Placeholder scan: pass.
- Consistency check: pass; every requirement maps to a unit.
- Scope check: pass; external consumer migration excluded.
- Acceptance coverage: pass.
- Validation gaps: real network/update evidence remains unverified until U3.
- Alternatives and ADR check: pass.
- High-risk pre-mortem check: pass; distribution rollback and dirty-worktree drift are covered.

## Handoff

Run document review, task analysis and Git safety checks, then execute U1-U3 serially because release/help/test files overlap existing work.
