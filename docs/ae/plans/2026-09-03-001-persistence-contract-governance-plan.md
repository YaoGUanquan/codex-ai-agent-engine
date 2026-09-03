---
type: plan
status: completed
date: 2026-09-03
title: persistence-contract-governance
origin: docs/ae/prds/2026-09-03-persistence-contract-governance-prd.md
originFingerprint: 2026-09-03-persistence-contract-governance
depth: standard
format: human-readable-plan
sharded: false
---

# Plan: Persistence Contract Governance

## Source

- `docs/ae/prds/2026-09-03-persistence-contract-governance-prd.md`
- `docs/ae/designs/persistence-contract-governance-2026-09-03/design.md`

## AI Parse Contract

- canonicalKind: plan
- humanEquivalent: true
- stableIdsRequired: true
- noImplicitScope: true

## Scope

Add one conditional persistence contract, route relevant AE skills to it, lock it with source/mirror tests, and release `0.3.40`.

## Readiness

- Goal: R1-R6 and NFR1.
- Acceptance criteria: unconfirmed keys block a new table; fields remain conditional; enum/error/migration rules agree; distribution checks pass.
- Non-goals: schema generation, base entities, application migrations, or reverse-engineering changes.
- Affected areas: ideate, brainstorm, PRD, design, backend, SQL, review, LFG, mirror, tests, release metadata, process evidence.
- Validation surface: focused tests, full suite, contract checks, install smoke, release-note checker, diff check, review.
- Open questions: none.

## Validation Evidence

| Acceptance criterion | Applicable tier | Expected signal and bounded claim | Preconditions / owner | Status | Recovery signal |
| --- | --- | --- | --- | --- | --- |
| R1-R5 guidance | static/focused test | Canonical contract and links agree. | Repository files; Codex | pending | Revise conflicting text. |
| R6 distribution | integration/install smoke | Mirror, notes, metadata, and installed fixture agree. | Node/npm; Codex | pending | Correct release artifacts. |
| Application data behavior | not applicable | No DDL/API execution occurs. | N/A | not-applicable | N/A |

## Assumptions

- Direct execution on clean `main` is user-approved.
- `0.3.40` is the next patch version after `0.3.39`.

## Alternatives Considered

- Recommended: backend-owned conditional reference and short cross-skill links.
- Alternative: duplicate full policies in each skill; rejected because they drift.
- Alternative: new persistence skill; rejected because it duplicates existing backend/SQL ownership.

## Decisions

### ADR-1 - Canonical backend reference

- Decision: implement design ADR-001.
- Drivers: R2-R5, NFR1.
- Alternatives: duplicated policy or new skill.
- Why chosen: smallest durable ownership boundary.
- Consequences: all consumers and mirrors must be synchronized.
- Follow-ups: none.

### ADR-2 - No default identifier

- Decision: implement design ADR-002.
- Drivers: R1.
- Alternatives: auto-increment or UUID defaults.
- Why chosen: both choices materially affect contracts and operations.
- Consequences: unresolved feature work asks one focused question.
- Follow-ups: none.

## Risks

- Generic language could become a universal base-entity mandate.
- Mirror drift could ship stale guidance.
- README release history could exceed its five-entry window.

## Pre-Mortem

- MyBatis-Plus guidance is applied to JPA. Mitigation: stack condition in the canonical reference and Java guidance.
- Soft deletion lacks restore/index decisions. Mitigation: lifecycle and unique-index checks.
- Source passes but mirror ships stale. Mitigation: explicit parity and install-smoke validation.

## Global Constraints

- No dependencies, runtime hooks, database connections, generated migrations, commit, or push.
- Preserve unrelated work and target repository conventions.

## Implementation Units

### U1 - Contract and workflow routing

- Goal: create the shared contract and conditionally route durable-data work through the selected skills.
- Requirements covered: R1-R5, NFR1.
- Acceptance criteria covered: key question, lifecycle, conditional fields, enums/errors, shared usage.
- Depends on: none.
- Files: `plugins/ai-agent-engine-codex/skills/ae-ideate/SKILL.md`, `plugins/ai-agent-engine-codex/skills/ae-brainstorm/SKILL.md`, `plugins/ai-agent-engine-codex/skills/ae-prd/SKILL.md`, `plugins/ai-agent-engine-codex/skills/ae-prd/references/requirements-capture.md`, `plugins/ai-agent-engine-codex/skills/ae-design/SKILL.md`, `plugins/ai-agent-engine-codex/skills/ae-design/references/design-contract-template.md`, `plugins/ai-agent-engine-codex/skills/ae-backend/SKILL.md`, `plugins/ai-agent-engine-codex/skills/ae-backend/references/java-guidance.md`, `plugins/ai-agent-engine-codex/skills/ae-backend/references/persistence-contract.md`, `plugins/ai-agent-engine-codex/skills/ae-sql/SKILL.md`, `plugins/ai-agent-engine-codex/skills/ae-sql/references/sql-safety-checklist.md`, `plugins/ai-agent-engine-codex/skills/ae-review/SKILL.md`, `plugins/ai-agent-engine-codex/skills/ae-review/references/review-personas.md`, `plugins/ai-agent-engine-codex/skills/ae-lfg/SKILL.md`, and matching `.ae-source/skills` files.
- Forbidden files: `plugins/ai-agent-engine-codex/skills/ae-reverse-engineering/**` and target application code.
- Approach: one reference, short links, no runtime enforcement claims.
- Tests: focused `skills-docs` assertions.
- Validation: mirror check and focused test pattern.
- Rollback signals: default key choice, universal annotation language, or conflicting copies.
- Deferred to implementation: none.

### U2 - Regression and release

- Goal: add tests and synchronize `0.3.40` metadata and release notes.
- Requirements covered: R5, R6.
- Acceptance criteria covered: source/mirror tests and distribution artifacts agree.
- Depends on: U1.
- Files: `tests/skills-docs.test.mjs`, `package.json`, plugin manifest, READMEs, and changelogs.
- Forbidden files: installers and global configuration.
- Approach: extend existing checks and retain only five README releases.
- Tests: focused then full suite.
- Validation: `npm test`, `npm run check`, `npm run check:smoke`, `git diff --check`.
- Rollback signals: mismatch or failed validation.
- Deferred to implementation: none.

### U3 - Evidence and review closure

- Goal: record progress, review task-owned changes, and write the final gate.
- Requirements covered: R6.
- Acceptance criteria covered: bounded distribution proof and explicit non-applicable application-runtime boundary.
- Depends on: U1, U2.
- Files: active progress, implementation review, generated gate.
- Forbidden files: `docs/08-ai-memory/**`.
- Approach: retain exact command results and no runtime claim inflation.
- Tests: none.
- Validation: final gate after review.
- Rollback signals: failed review or final check.
- Deferred to implementation: no commit or push.

## Consistency Check

- implementationUnitCount: 3
- sourceRequirementsCovered: R1, R2, R3, R4, R5, R6, NFR1
- sourceRequirementsDeferred: none
- openQuestionsCount: 0

## Validation Plan

- Unit: focused source/mirror assertions.
- Integration: `npm test`, `npm run check`.
- User flow: `npm run check:smoke` installed fixture.
- Data / operations: not applicable.
- Observability: final gate and progress note contain exact results.

## Rollback / Recovery

Revert task-owned source/mirror, test, metadata, release-note, and workflow artifacts together. No target data recovery is needed.

## Plan Self-Review

- Placeholder scan: passed.
- Consistency check: passed.
- Scope check: passed.
- Acceptance coverage: passed.
- Validation gaps: application runtime is not applicable.
- Alternatives and ADR check: passed.
- High-risk pre-mortem check: passed.

## Handoff

Run serially on user-approved clean `main`; release files and source/mirror paths share ownership.
