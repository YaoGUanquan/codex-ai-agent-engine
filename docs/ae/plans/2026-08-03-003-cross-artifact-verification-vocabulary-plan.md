---
type: plan
status: completed
date: 2026-08-03
title: cross-artifact-verification-vocabulary
origin: docs/ae/prds/2026-08-03-cross-artifact-verification-vocabulary-prd.md
originFingerprint: 2026-08-03-cross-artifact-verification-vocabulary
depth: standard
format: human-readable-plan
sharded: false
---

# Plan: Cross-Artifact Verification Vocabulary

## Source

- Requirements: `docs/ae/prds/2026-08-03-cross-artifact-verification-vocabulary-prd.md`.
- External audit: `docs/ae/solutions/2026-08-03-external-skill-optimization-audit.md`.

## AI Parse Contract

- canonicalKind: plan
- humanEquivalent: true
- stableIdsRequired: true
- noImplicitScope: true

## Scope

Add optional must-have, deviation, and verification-gap wording to existing requirement, plan, and review references. Mirror every active skill reference, add focused contract assertions, and make no runtime or workflow-root change.

## Readiness

- Goal: R1-R5 and NFR1-NFR2.
- Acceptance criteria: PRD R1-R5 and NFR1-NFR2.
- Non-goals: new skills, automatic judging, hooks, AgentStudio runtime features, catalog changes, or browser/runtime validation.
- Affected areas: Knowledge and Guardrail layers.
- Validation surface: focused text contract assertions, mirror, metadata, skill contract, artifact, install-smoke, package checks, and diff inspection.
- Open questions: none; detailed conditional shapes belong in references and `SKILL.md` entrypoints remain concise.

## Alternatives Considered

- Recommended: optional vocabulary in the existing requirement, plan, and review references.
- Alternative: enforce a new required section in every artifact. Rejected because it creates empty boilerplate and violates NFR1.
- Alternative: add an independent AgentStudio-style judge or background runtime. Rejected because it crosses the Codex runtime boundary and cannot be proven by local template checks.

## Decision Drivers

- Preserve the existing AE ownership and source/mirror model.
- Improve traceability without inventing enforcement.
- Keep ordinary task documentation concise.

## Decisions

### ADR-1 - Put the contract in references

- Decision: update the PRD capture, plan template, and review output template rather than add mandatory workflow prose to their `SKILL.md` entrypoints.
- Drivers: R1-R4 and NFR1.
- Alternatives: new skill or broad edits to execution skills.
- Why chosen: references already own detailed output structures while existing skills remain concise.
- Consequences: future agents receive a clear optional schema, but human and model adherence remains a review concern.
- Follow-ups: evaluate real artifact samples before considering stricter enforcement.

## Risks

- Similar wording could conflate a deliberate deviation with absent evidence.
- A source-only edit could make installed mirrors inconsistent.
- Tests could assert phrases without protecting the conditional semantics.

## Pre-Mortem

- Failure scenario 1: all routine artifacts gain empty sections. Mitigation: each template states when the vocabulary is applicable and permits omission otherwise.
- Failure scenario 2: a helper or static check is treated as proof. Mitigation: retain proof-tier boundaries in verification-gap wording.
- Failure scenario 3: a template changes without its mirror. Mitigation: modify paired paths and run mirror plus focused tests.

## Global Constraints

- Preserve all existing pending retirement and browser/review optimization changes.
- Do not add dependencies or new runtime behavior. Plugin metadata is immutable except for a synchronized SemVer-only update when distributable skill content requires it.
- Keep the root and plugin manifest versions synchronized if a later authorized implementation changes distributable skill content.

## Implementation Units

### U1 - Add conditional requirements vocabulary

- Goal: let PRDs mark only delivery-critical criteria as must-haves.
- Requirements covered: R1, R4, NFR1.
- Acceptance criteria covered: PRD R1, R4, and NFR1.
- Depends on: none.
- Files:
  - `plugins/ai-agent-engine-codex/skills/ae-prd/references/requirements-capture.md`
  - `.agents/skills/ae-prd/references/requirements-capture.md`
- Forbidden files: `docs/08-ai-memory/`, `docs/ae/security-scans/`, plugin metadata, and external runtime configuration.
- Approach: define an optional compact must-have form keyed by existing requirement IDs and acceptance conditions.
- Tests: focused source/mirror template assertions.
- Validation: `node scripts/check-skill-mirror.mjs` and `node scripts/check-skill-contract.mjs`.
- Rollback signals: must-haves become mandatory boilerplate or duplicate ordinary requirement text.
- Deferred to implementation: exact heading and table/list shape.

### U2 - Add deviation and verification-gap vocabulary

- Goal: make review and planning distinguish intentional variance from absent proof.
- Requirements covered: R2, R3, R4, NFR2.
- Acceptance criteria covered: PRD R2-R4 and NFR2.
- Depends on: U1.
- Files:
  - `plugins/ai-agent-engine-codex/skills/ae-plan/references/plan-template.md`
  - `.agents/skills/ae-plan/references/plan-template.md`
  - `plugins/ai-agent-engine-codex/skills/ae-review/references/review-output-template.md`
  - `.agents/skills/ae-review/references/review-output-template.md`
- Forbidden files: `docs/08-ai-memory/`, `docs/ae/security-scans/`, new skill roots, hooks, and runtime registration files.
- Approach: make deviation entries identify requirement ID, authority, impact, and recovery; make verification gaps name required proof, status, and next owner/action without inferring a pass.
- Tests: focused source/mirror template assertions.
- Validation: `node scripts/check-skill-mirror.mjs`, `node scripts/check-skill-contract.mjs`, and `node scripts/check-ae-artifacts.mjs`.
- Rollback signals: templates treat a gap as an approved deviation or imply automatic enforcement.
- Deferred to implementation: no task or work skill update unless a review shows the references are insufficient.

### U3 - Add regression coverage and distribution gate

- Goal: retain the optional vocabulary and prove complete local packaging behavior.
- Requirements covered: R5, NFR1, NFR2.
- Acceptance criteria covered: PRD R5 and NFR1-NFR2.
- Depends on: U1, U2.
- Files:
  - `tests/skill-scripts.test.mjs`
  - `package.json` (SemVer only, if an increment is required)
  - `plugins/ai-agent-engine-codex/.codex-plugin/plugin.json` (SemVer only, if an increment is required)
- Forbidden files: `package-lock.json` unless the package manager proves it must record the root version; all plugin metadata fields other than the paired `version` fields; external clones; and user-owned scan artifacts.
- Approach: assert source/mirror equivalence and conditional terms; before editing manifests, compare the committed baseline and current pending distribution version, then increment both exactly once only if needed.
- Tests: `npm test`.
- Validation: `npm run check`, mirror, metadata, skill contract, install smoke, AE artifact check, and `git diff --check`.
- Rollback signals: version mismatch, install-smoke failure, or regression test that permits mandatory boilerplate.
- Deferred to implementation: no browser or deployment tier applies.

## Consistency Check

- implementationUnitCount: 3
- sourceRequirementsCovered: R1, R2, R3, R4, R5, NFR1, NFR2
- sourceRequirementsDeferred: none
- openQuestionsCount: 0

## Validation Plan

- Unit: focused template assertions for all three vocabulary categories.
- Integration: mirror, metadata, contract, artifact, install-smoke, package, and diff checks.
- User flow: not applicable; no user-facing application flow changes.
- Data / operations: not applicable; no external service or persisted data changes.
- Observability: document review, changed-file inventory, and final gate evidence.

## Rollback / Recovery

Restore only the paired reference and test edits from the task-owned diff if a validation gate fails. Do not delete historical audit records or unrelated pending changes. A future automatic judge requires a new PRD, runtime-boundary review, and explicit authorization.

## Plan Self-Review

- Placeholder scan: pass; no TODO or TBD sections.
- Consistency check: pass; every PRD requirement is covered.
- Scope check: pass; no runtime, new skill, or external source import is planned.
- Acceptance coverage: pass.
- Validation gaps: static checks cannot prove future model adherence and do not imply browser or deployment acceptance.
- Alternatives and ADR check: pass.
- High-risk pre-mortem check: pass for template and distribution risk.

## Handoff

Executed serially on `main` after explicit user authorization. U1 added the optional must-have form, U2 added distinct deviation and verification-gap forms, and U3 added focused mirror/semantic regression coverage. Distribution versions remain synchronized at the already-pending `0.3.7`; no additional increment was required for this plan.
