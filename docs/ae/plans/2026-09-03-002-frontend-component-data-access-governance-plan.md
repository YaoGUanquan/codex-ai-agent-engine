---
type: plan
status: completed
date: 2026-09-03
title: frontend-component-data-access-governance
origin: docs/ae/prds/2026-09-03-frontend-component-data-access-governance-prd.md
originFingerprint: 2026-09-03-frontend-component-data-access-governance
depth: standard
format: human-readable-plan
sharded: false
---

# Plan: Frontend Component And Data-Access Governance

## Source

- `docs/ae/prds/2026-09-03-frontend-component-data-access-governance-prd.md`
- `docs/ae/designs/frontend-component-data-access-governance-2026-09-03/design.md`

## AI Parse Contract

- canonicalKind: plan
- humanEquivalent: true
- stableIdsRequired: true
- noImplicitScope: true

## Scope

Add one conditional frontend-owned component/data-access contract, route existing owning skills through it, lock source/mirror behavior with regression tests, and release `0.3.41`.

## Readiness

- Goal: R1-R8 and NFR1-NFR2.
- Acceptance criteria: target-project reuse is inspected first; component/data-access layering is explicit; repeated patterns require extraction review; designated skills agree; distribution checks pass.
- Non-goals: a universal component runtime, UI library, HTTP dependency, target-project refactor, browser fixture, or API deployment.
- Affected areas: frontend design, web app, web forge, design, review, LFG, tests, mirrors, metadata, release notes, and process evidence.
- Validation surface: focused docs test, full suite, repository checks, install smoke, release-note checker, and patch hygiene.
- Open questions: none.

## Validation Evidence

| Acceptance criterion | Applicable tier | Expected signal and bounded claim | Preconditions / owner | Status | Recovery signal |
| --- | --- | --- | --- | --- | --- |
| R1-R7 governance | static/focused test | Shared contract and all consumer links agree. | Repository files; Codex | planned | Revise conflicting contract text. |
| R8/NFR1 distribution | integration/install smoke | Mirror, notes, metadata, and installed fixture agree. | Node/npm; Codex | planned | Correct distribution artifacts. |
| Target UI/API behavior | not applicable | No target app is changed or executed. | N/A | not-applicable | N/A |

## Alternatives Considered

- Recommended: one frontend-owned reference with short consumer routes.
- Alternative: duplicate rules across frontend/framework skills; rejected because reuse/API policy would drift.
- Alternative: add a shared AE component package or default request library; rejected because target stacks remain authoritative.

## Decisions

### ADR-1 - Shared reference with existing owners

- Decision: implement design ADR-001.
- Drivers: R1, R6, R8, NFR1.
- Alternatives: duplicated policy or runtime package.
- Why chosen: the smallest ownership boundary that preserves framework neutrality.
- Consequences: source/mirror and affected consumer links must stay synchronized.
- Follow-ups: none.

### ADR-2 - Reuse review before a third equivalent implementation

- Decision: implement design ADR-002.
- Drivers: R2-R5, R7, NFR2.
- Alternatives: immediate universal extraction or unlimited route-local copies.
- Why chosen: it prevents silent copy-paste drift without prematurely generalizing a feature.
- Consequences: a future task documents why a third copy is still necessary.
- Follow-ups: none.

## Risks

- The contract could turn into an oversized generic-component mandate.
- Consumer skills could duplicate or contradict the shared reference.
- API guidance could prescribe a library rather than preserve repository ownership.
- Source/mirror/release metadata can drift.

## Pre-Mortem

- Failure: a feature component is forced into a universal form/table abstraction. Signal: contract does not separate domain behavior from reusable skeleton. Mitigation: explicit ownership ladder and review rules.
- Failure: new page code still uses raw requests beside an existing client. Signal: API contract allows rendering-layer ownership. Mitigation: transport/service/query/rendering boundaries and focused assertions.
- Failure: mirrors or installed package omit the new reference. Signal: mirror or smoke check fails. Mitigation: atomic source/mirror edits and release gate.

## Global Constraints

- Preserve existing task-owned persistence governance changes and all unrelated work.
- No dependencies, runtime components, target-project code, database calls, commit, or push.
- Version, plugin manifest, bilingual README/changelog, and README five-entry windows must remain synchronized.

## Implementation Units

### U1 - Shared frontend component and data-access contract

- Goal: define conditional reuse, ownership, interaction-state, and API-access rules once.
- Requirements covered: R1-R7, NFR1-NFR2.
- Acceptance criteria covered: inspect/reuse existing owners; semantic ladder; dialog/list/form states; API layering; third-copy review.
- Depends on: none.
- Files: `plugins/ai-agent-engine-codex/skills/ae-frontend-design/references/component-data-access-contract.md`, matching `.ae-source/skills` reference, `ae-frontend-design/SKILL.md`, `references/web-ui-quality.md`, `references/ui-direction-contract.md`, and matching mirrors.
- Forbidden files: framework runtime code, package lock, target-project components, API clients, and external source payloads.
- Approach: retain target-project authority, use conditional language, and make reuse decisions explicit without prescribing a component library or HTTP dependency.
- Tests: focused `skills-docs` assertions.
- Validation: mirror check and focused test pattern.
- Rollback signals: universal component mandate, raw-request exception, or duplicated policy.
- Deferred to implementation: none.

### U2 - Workflow routing and review integration

- Goal: route implementation, design, review, and LFG work through U1.
- Requirements covered: R1, R6, R8.
- Acceptance criteria covered: applicable UI/API work cannot silently bypass the contract.
- Depends on: U1.
- Files: `ae-web-app/SKILL.md`, `ae-web-app/references/web-app-workflow.md`, `ae-web-forge/SKILL.md`, `ae-design/SKILL.md`, `ae-design/references/design-contract-template.md`, `ae-review/SKILL.md`, `ae-review/references/code-review-rule-profiles.md`, `ae-lfg/SKILL.md`, and matching `.ae-source/skills` files.
- Forbidden files: new skill metadata/catalogs, backend SQL guidance, browser runtime implementation.
- Approach: each skill links to U1 and retains its current ownership; design records component/API reuse, review checks duplication and boundaries, LFG requires the contract before implementation.
- Tests: focused source/mirror assertions.
- Validation: focused test, design contract check, mirror/contract checks.
- Rollback signals: duplicate workflow owner, required UI fields on non-UI designs, or review scope expansion beyond frontend/API work.
- Deferred to implementation: none.

### U3 - Regression, release, and evidence closure

- Goal: lock the new contract, distribute `0.3.41`, and preserve bounded delivery evidence.
- Requirements covered: R8, NFR1.
- Acceptance criteria covered: tests and installed fixture prove source/mirror/release consistency.
- Depends on: U1, U2.
- Files: `tests/skills-docs.test.mjs`, `package.json`, plugin manifest, `README.md`, `README.en.md`, `CHANGELOG.md`, `CHANGELOG.en.md`, active process note, implementation review, and final gate.
- Forbidden files: global installation state, docs/08-ai-memory, external project files.
- Approach: extend existing regression test, retain five README releases, and state only local contract/distribution evidence.
- Tests: focused test then full suite.
- Validation: `npm test`, `npm run check`, `npm run check:smoke`, release-note checker, `git diff --check`.
- Rollback signals: version/note mismatch, install-smoke failure, or P0/P1 review finding.
- Deferred to implementation: no commit or push.

## Consistency Check

- implementationUnitCount: 3
- sourceRequirementsCovered: R1, R2, R3, R4, R5, R6, R7, R8, NFR1, NFR2
- sourceRequirementsDeferred: none
- openQuestionsCount: 0

## Validation Plan

- Unit: focused contract assertions.
- Integration: `npm test`, `npm run check`.
- User flow: `npm run check:smoke` installed fixture.
- Data / operations: not applicable.
- Observability: process note and final gate record exact results.

## Rollback / Recovery

Revert task-owned frontend source/mirror, tests, metadata, release-note, and workflow artifacts together. No target application state is changed.

## Plan Self-Review

- Placeholder scan: passed.
- Consistency check: passed.
- Scope check: passed.
- Acceptance coverage: passed.
- Validation gaps: target UI/API behavior is not applicable to this plugin-only change.
- Alternatives and ADR check: passed.
- High-risk pre-mortem check: passed.

## Handoff

Run serially on user-approved direct `main`; source/mirror and release assets share ownership.
