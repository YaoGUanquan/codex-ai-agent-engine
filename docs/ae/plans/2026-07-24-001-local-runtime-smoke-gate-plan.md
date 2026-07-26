---
type: plan
status: completed
date: 2026-07-24
title: local-runtime-smoke-gate
origin: docs/ae/prds/2026-07-24-local-runtime-smoke-gate-prd.md
originFingerprint: 2026-07-24-local-runtime-smoke-gate
depth: standard
format: human-readable-plan
sharded: false
---

# Plan: Local Runtime Smoke Gate

## Source

- Requirements: `docs/ae/prds/2026-07-24-local-runtime-smoke-gate-prd.md`.
- Evidence: session `019f91e5-78d7-7442-b033-f34f4fd1d9a6` and the current canonical skill tree.

## AI Parse Contract

- canonicalKind: plan
- humanEquivalent: true
- stableIdsRequired: true
- noImplicitScope: true

## Scope

Add a shared, capability-honest local runtime smoke gate to the four AE execution skills, synchronize mirrors, and lock the contract with regression tests.

## Readiness

- Goal: satisfy R1-R5 and NFR1-NFR2.
- Acceptance criteria: the source PRD acceptance conditions.
- Non-goals: secret transport implementation, live service testing, or new dependencies.
- Affected areas: Guardrail (credential and response boundary), Knowledge (skill reference), Distribution (mirror), and validation tests.
- Validation surface: focused Node test, full Node test suite, mirror, language metadata, skill contract, install smoke, static checks, artifact checks, and whitespace check.
- Open questions: none.

## Assumptions

- The installed project receives the complete sibling skill tree, so cross-skill references are resolvable.
- A target-specific secret reference is created by the user before an authenticated call.

## Alternatives Considered

- Recommended: a shared markdown gate referenced by the existing skills.
- Alternative: copy the procedure into every skill.
- Rejected because: safety-critical instructions would drift.
- Alternative: add a Node secret-handoff or test-launcher runtime.
- Rejected because: current Codex does not offer a documented secret-safe input channel, and a new runtime exceeds the requested repair.

## Decision Drivers

- Driver 1: make explicit smoke requests deterministic after restart confirmation.
- Driver 2: prevent secret leakage through commands, patches, logs, or stdin.
- Driver 3: preserve current TDD, debug, and task-loop scopes without inventing runtime automation.

## Decisions

### ADR-1 - Centralize the local runtime smoke contract

- Decision: `ae-work` owns one reference; `ae-tdd`, `ae-debug`, and `ae-task-loop` link to it.
- Drivers: R1-R5 and NFR2.
- Alternatives: duplicated text or a new script.
- Why chosen: smallest maintainable change with existing distribution guarantees.
- Consequences: future changes modify one canonical procedure and its mirror.
- Follow-ups: add a dedicated secret surface only when Codex documents one.

## Risks

- Agents may treat generic unit-test work as a live-runtime requirement.
- A user-created secret reference may be absent.
- A target project may define stronger local smoke rules.

## Pre-Mortem

- Failure scenario 1: synonym guidance still fails to select the gate.
- Failure scenario 2: a skill tells the agent to write or inspect a credential file.
- Failure scenario 3: a failed HTTP response is reported as sufficient business validation.
- Mitigations: explicit trigger set, prohibition assertions, and blocker/evidence language in the focused test.

## Global Constraints

- Edit plugin source before the `.agents` mirror.
- Preserve `.opencode/**` and `ae/**`.
- Do not add dependencies, secret handling code, hook claims, or external runtime commands.

## Implementation Units

### U1 - Add the canonical runtime smoke gate

- Goal: satisfy R1-R5 and NFR1.
- Requirements covered: R1, R2, R3, R4, R5, NFR1.
- Acceptance criteria covered: trigger, preconditions, secret boundary, execution evidence, and blocked responses.
- Depends on: none.
- Files: `plugins/ai-agent-engine-codex/skills/ae-work/references/local-runtime-smoke-gate.md`, `.agents/skills/ae-work/references/local-runtime-smoke-gate.md`.
- Forbidden files: `package.json`, `package-lock.json`, `.opencode/**`, `ae/**`.
- Approach: define trigger synonyms, readiness state, safe secret-reference requirement, read-only and state-changing boundaries, result evidence, and failure stop conditions.
- Tests: focused runtime-smoke contract test.
- Validation: source/mirror and skill-contract checks.
- Rollback signals: the reference claims automatic secrets, server lifecycle, or unbounded live testing.
- Deferred to implementation: no secret input mechanism.

### U2 - Wire the execution skills to the gate

- Goal: make runtime validation selection consistent without replacing focused tests or debugging.
- Requirements covered: R1, R2, R4, R5.
- Acceptance criteria covered: shared references and no repeated prerequisite question.
- Depends on: U1.
- Files: plugin and mirror `ae-work/SKILL.md`, `ae-tdd/SKILL.md`, `ae-debug/SKILL.md`, `ae-task-loop/SKILL.md`.
- Forbidden files: `package.json`, `package-lock.json`, `.opencode/**`, `ae/**`.
- Approach: add concise routing language at the existing validation steps.
- Tests: focused runtime-smoke contract test.
- Validation: mirror and installation smoke checks.
- Rollback signals: routine unit-only work incorrectly promises a localhost call.
- Deferred to implementation: no change to `ae-plan` or review-only workflows.

### U3 - Add regression coverage and final evidence

- Goal: satisfy NFR2 and preserve delivery proof.
- Requirements covered: NFR2.
- Acceptance criteria covered: static assertions and all named checks pass.
- Depends on: U1, U2.
- Files: `tests/skill-scripts.test.mjs`, `docs/ae/brainstorms/2026-07-24-local-runtime-smoke-gate-requirements.md`, `docs/ae/prds/2026-07-24-local-runtime-smoke-gate-prd.md`, this plan, and final gate evidence.
- Forbidden files: `package.json`, `package-lock.json`, `.opencode/**`, `ae/**`.
- Approach: assert source/mirror content, the secret prohibition, and the trigger/blocker wording; run the full validation contract.
- Tests: `node --test --test-name-pattern "local runtime smoke gate" tests/skill-scripts.test.mjs`.
- Validation: full validation contract.
- Rollback signals: source/mirror drift or an installed target omits the changed reference.
- Deferred to implementation: no runtime endpoint fixture.

## Consistency Check

- implementationUnitCount: 3
- sourceRequirementsCovered: R1-R5, NFR1-NFR2
- sourceRequirementsDeferred: none
- openQuestionsCount: 0

## Validation Plan

- Unit: focused local-runtime smoke gate test.
- Integration: `npm.cmd test`; `npm.cmd run check`.
- User flow: inspect installed skill reference from install smoke output.
- Data / operations: no live request or credential is used.
- Observability: exact commands, review result, and final gate proof.

## Rollback / Recovery

Revert U2 to remove routing language, or U1 and U2 together to restore the former validation contract. The focused test identifies contract drift before a broad rollback is needed.

## Plan Self-Review

- Placeholder scan: no placeholders or vague implementation steps remain.
- Consistency check: U2 depends on U1; U3 is serial because it owns shared test evidence.
- Scope check: no new runtime, secret manager, or application integration is introduced.
- Acceptance coverage: R1-R5 and NFR1-NFR2 map to U1-U3.
- Validation gaps: skill text cannot prove future model compliance, so it is tested as an explicit process contract.
- Alternatives and ADR check: a shared reference is smaller and safer than duplication or runtime code.
- High-risk pre-mortem check: secret, trigger, and false-pass failures each have a direct assertion.

## Handoff

Document and code review selected correctness, testing, standards, maintainability, coherence, feasibility, and evidence lenses. No blocking finding was identified.

## Completion Record

- U1: Added the canonical source and mirror local runtime smoke gate with trigger, restart, operation classification, secret-reference, evidence, blocker, and capability-boundary rules.
- U2: Routed `ae-work`, `ae-tdd`, `ae-debug`, and `ae-task-loop` to the gate only for explicit local runtime smoke of changed API or UI surfaces.
- U3: Added source/mirror regression coverage and completed the full package validation contract.
- Validation: focused test passed; `npm.cmd test` passed 81/81; `npm.cmd run check`, artifact/design, mirror, metadata, skill-contract, installation-smoke, and whitespace checks passed.
- Residual risk: this is a prompt-level workflow contract. A future secret-safe Codex input capability can replace the user-created secret-reference precondition only after its persistence boundary is documented.
