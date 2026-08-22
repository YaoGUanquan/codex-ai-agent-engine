---
type: plan
status: drafted
date: 2026-08-17
title: document-encoding-evidence-governance
origin: docs/ae/prds/2026-08-17-document-encoding-evidence-governance-prd.md
originFingerprint: 2026-08-17-document-encoding-evidence-governance
depth: standard
format: human-readable-plan
sharded: false
---

# Plan: document-encoding-evidence-governance

## Source

- PRD: `docs/ae/prds/2026-08-17-document-encoding-evidence-governance-prd.md`
- Design: `docs/ae/designs/document-encoding-evidence-governance-2026-08-17/design.md`

## AI Parse Contract

- canonicalKind: plan
- humanEquivalent: true
- stableIdsRequired: true
- noImplicitScope: true

## Scope

Preserve the verified encoding baseline. This documentation plan does not authorize file rewrites, CI, runtime code, plugins, versions, or release notes.

## Readiness

- Goal: keep UTF-8 evidence and its prevention rule discoverable.
- Acceptance criteria: R1-R3, NFR1-NFR2.
- Non-goals: bulk rewrite, scripts, CI, dependencies, version changes.
- Affected areas: `docs/00-process/templates/encoding-rules.md`, `docs/ae/**`, `docs/08-ai-memory/**`.
- Validation surface: strict byte decoding, registry check, artifact inspection.
- Open questions: Q1 is deferred and does not block documentation work.

## Assumptions

- Node is available for the existing strict-decoder command.

## Alternatives Considered

- Recommended: evidence snapshot plus memory/graph relations; defer automation.
- Alternative: add a maintained encoding checker and CI gate now.
- Rejected because: no concrete regression yet justifies the surface area.

## Decision Drivers

- Preserve valid content.
- Make the result usable across sessions.
- Keep scope proportional to an output-rendering issue.

## Decisions

### ADR-1 - Separate file-byte proof from console-rendering proof

- Decision: document strict decoder output as byte evidence only.
- Drivers: R1, R2, NFR1.
- Alternatives: infer corruption from console output; assume the scan validates PowerShell.
- Why chosen: avoids false-positive remediation and overclaiming.
- Consequences: future checks start with explicit decoding.
- Follow-ups: reconsider Q1 after a real regression.

## Risks

- The dated count can be mistaken for continuous monitoring.
- New text extensions are outside the declared scan scope.

## Pre-Mortem

- Valid text is rewritten after mojibake: keep the verification-before-edit rule explicit.
- A new invalid file appears later: rerun the strict scan before claiming freshness.
- Registry links drift: run the registry checker after changes.

## Global Constraints

- Preserve UTF-8 and unrelated worktree changes.
- Use repository-relative paths.
- Do not infer runtime, browser, deployment, or host health from file bytes.

## Implementation Units

### U1 - Consolidate the verification procedure

- Goal: add bounded strict-decoding guidance to the canonical encoding rule only if existing wording is insufficient.
- Requirements covered: R1, R2, NFR1, NFR2.
- Acceptance criteria covered: maintainers distinguish byte evidence from console display.
- Depends on: none.
- Files:
  - `docs/00-process/templates/encoding-rules.md`
- Forbidden files:
  - `plugins/**`
  - `package.json`
  - `README.md`
  - `CHANGELOG.md`
- Approach: add a compact command and no-preview-rewrite boundary; do not touch existing document bodies.
- Tests: strict decoder over `docs/`.
- Validation: zero malformed/replacement files; diff limited to rule wording.
- Rollback signals: wording treats terminal display as content proof.
- Deferred to implementation: skip the edit if equivalent wording already suffices.

### U2 - Register evidence and graph relations

- Goal: make the evidence and workflow artifacts queryable.
- Requirements covered: R1, R3, NFR1, NFR2.
- Acceptance criteria covered: registry and graph describe existing relationships only.
- Depends on: U1.
- Files:
  - `docs/08-ai-memory/00-index.md`
  - `docs/08-ai-memory/14-document-encoding-evidence.md`
  - `docs/08-ai-memory/00-registry.json`
  - `docs/ae/graphs/maintainer-artifact-graph.md`
- Forbidden files:
  - `docs/ae/graphs/graph.json`
  - `docs/99-archive/**`
  - `plugins/**`
- Approach: add one canonical memory record and declared edges; do not generate a graph store.
- Tests: registry checker and targeted knowledge query.
- Validation: checker returns success and query returns only declared edges.
- Rollback signals: missing/out-of-bound relation target.
- Deferred to implementation: none.

### U3 - Evaluate continuous enforcement on a real regression

- Goal: resolve Q1 only with an observed trigger.
- Requirements covered: R2.
- Acceptance criteria covered: no checker or CI claim is added without an approved scope.
- Depends on: U1, U2.
- Files:
  - `docs/ae/prds/2026-08-17-document-encoding-evidence-governance-prd.md`
  - `docs/ae/plans/2026-08-17-001-document-encoding-evidence-governance-plan.md`
- Forbidden files:
  - `scripts/**`
  - `tests/**`
  - `package.json`
  - `plugins/**`
- Approach: leave Q1 deferred.
- Tests: none; decision checkpoint only.
- Validation: no speculative automation is introduced.
- Rollback signals: a checker or release requirement appears without a new approved PRD.
- Deferred to implementation: Q1.

## Consistency Check

- implementationUnitCount: 3
- sourceRequirementsCovered: R1 (U1,U2), R2 (U1,U3), R3 (U2), NFR1 (U1,U2), NFR2 (U1,U2)
- sourceRequirementsDeferred: none; Q1 is a planning question
- openQuestionsCount: 1

## Validation Plan

- Unit: fatal UTF-8 decode and `U+FFFD` search.
- Integration: `node scripts/check-memory-knowledge-contract.mjs --root .`.
- User flow: maintainer locates the memory record and reruns the documented check.
- Data / operations: not applicable.
- Observability: not applicable.

## Rollback / Recovery

Remove only newly created evidence/registry/graph records if incorrect, then rerun checks. Never use rollback to rewrite validated documents.

## Plan Self-Review

- Placeholder scan: no TODO or TBD.
- Consistency check: each source requirement maps to a unit or decision checkpoint.
- Scope check: no runtime, plugin, CI, release, or rewrite change is authorized.
- Acceptance coverage: strict decoding and registry validation cover the documented proof boundary.
- Validation gaps: PowerShell host configuration and future files remain outside the dated evidence.
- Alternatives and ADR check: automation remains explicitly deferred.
- High-risk pre-mortem check: not high-risk; failure and recovery conditions recorded.

## Handoff

Run `ae-review domain:document` before marking this plan ready. Use `ae-work` only when U1 is needed or Q1 receives a separately approved scope.
