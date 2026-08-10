---
type: plan
status: completed
date: 2026-07-24
title: local-runtime-smoke-secret-handoff
origin: docs/ae/prds/2026-07-24-002-local-runtime-smoke-secret-handoff-prd.md
originFingerprint: 2026-07-24-local-runtime-smoke-secret-handoff
depth: standard
format: human-readable-plan
sharded: false
---

# Plan: Local Runtime Smoke Secret Handoff

## Source

- Requirements: `docs/ae/prds/2026-07-24-002-local-runtime-smoke-secret-handoff-prd.md`.
- Existing contract: `plugins/ai-agent-engine-codex/skills/ae-work/references/local-runtime-smoke-gate.md`.

## AI Parse Contract

- canonicalKind: plan
- humanEquivalent: true
- stableIdsRequired: true
- noImplicitScope: true

## Scope

Extend the shared local-runtime smoke gate so a requested authenticated smoke can create and report a token-free local template, then execute by reference after user confirmation without agent inspection of the populated file.

## Readiness

- Goal: satisfy R1-R4 and NFR1-NFR2.
- Acceptance criteria: the source PRD acceptance conditions.
- Non-goals: secret transport, secret storage, target-service changes, or live endpoint execution during this repository validation.
- Affected areas: Guardrail, Knowledge, Distribution, and regression coverage.
- Validation surface: focused Node test, full test suite, mirror check, skill contract, installation smoke, static checks, and whitespace check.
- Open questions: none.

## Assumptions

- A request-specific template can remain token-free until the user edits it locally.
- The target's HTTP client can consume a configuration reference without printing its contents.

## Alternatives Considered

- Recommended: automatically create a token-free template and pass only its absolute path after user confirmation.
- Alternative: require a pre-set environment variable.
- Rejected because: it does not provide the requested file-path handoff for expiring credentials.
- Alternative: copy a chat-provided token into a template.
- Rejected because: it transfers a credential into agent execution and persistence traces.

## Decision Drivers

- Driver 1: remove repeated local setup while retaining a strict secret boundary.
- Driver 2: make the post-handoff smoke action deterministic.
- Driver 3: preserve source/mirror distribution and existing test boundaries.

## Decisions

### ADR-1 - Use a user-populated token-free template

- Decision: create a request template with a credential placeholder, report its absolute path, and invoke a client by reference only after explicit readiness confirmation.
- Drivers: R1-R4 and NFR1.
- Alternatives: environment-only handoff or chat-token transfer.
- Why chosen: it directly supports short-lived credentials without asking the agent to inspect or persist a secret.
- Consequences: each target smoke creates a user-local configuration reference that is excluded from reports and version control.
- Follow-ups: use a documented native secret input only when Codex provides one with an equivalent non-persisting boundary.

## Risks

- A template path might not be ignored by the target repository.
- A client might echo configuration content on an error path.
- A user could mark the template ready before replacing its placeholder.

## Pre-Mortem

- Failure scenario 1: the agent creates a template in a tracked target location.
- Failure scenario 2: a command reads or prints the populated configuration.
- Failure scenario 3: a 401 placeholder response is reported as a successful smoke.
- Mitigations: require verified ignored-or-temporary placement, reference-only client invocation, and existing 4xx blocker handling.

## Global Constraints

- Edit plugin source before the `.agents` mirror and keep the two files identical.
- Preserve `.opencode/` and `ae/` local output directories and their ignore rules.
- Do not add dependencies, a secret manager, target-service code, or secret-bearing fixtures.

## Implementation Units

### U1 - Clarify the source and mirror handoff contract

- Goal: satisfy R1-R4 and NFR1.
- Requirements covered: R1, R2, R3, R4, NFR1.
- Acceptance criteria covered: template creation, absolute-path handoff, reference-only execution, and sanitized archive boundary.
- Depends on: none.
- Files: `plugins/ai-agent-engine-codex/skills/ae-work/references/local-runtime-smoke-gate.md`, `.agents/skills/ae-work/references/local-runtime-smoke-gate.md`.
- Forbidden files: `.opencode/**`, `ae/**`, target service files, and secret-bearing files.
- Approach: specify token-free template contents, local readiness confirmation, non-echoing client reference, and no-inspection boundary.
- Tests: focused local runtime smoke gate test.
- Validation: mirror and skill-contract checks.
- Rollback signals: the guidance permits a raw token in chat, command text, or agent-readable file content.
- Deferred to implementation: target-specific curl syntax remains selected only when a real smoke route is known.

### U2 - Lock the behavior with regression coverage

- Goal: satisfy NFR2.
- Requirements covered: NFR2.
- Acceptance criteria covered: source/mirror parity and required handoff wording.
- Depends on: U1.
- Files: `tests/skill-scripts.test.mjs`.
- Forbidden files: `.opencode/**`, `ae/**`, lockfiles, and secret fixtures.
- Approach: assert absolute-path handoff, no-inspection language, reference-only client use, and bounded execution wording.
- Tests: `node --test --test-name-pattern "local runtime smoke gate" tests/skill-scripts.test.mjs`.
- Validation: full validation contract.
- Rollback signals: a regression allows an agent to open the populated configuration or omits source/mirror parity.
- Deferred to implementation: no real credential or endpoint fixture.

### U3 - Maintain requirement and plan evidence

- Goal: preserve inspectable decision, scope, and validation boundaries.
- Requirements covered: R1-R4, NFR1-NFR2.
- Acceptance criteria covered: durable PRD/plan with explicit non-goals and validation.
- Depends on: U1, U2.
- Files: this plan and `docs/ae/prds/2026-07-24-002-local-runtime-smoke-secret-handoff-prd.md`.
- Forbidden files: `.opencode/**`, `ae/**`, and user-populated secret references.
- Approach: record the user-mediated handoff decision and the unsupported secret-transport boundary.
- Tests: artifact checker.
- Validation: document review and `node scripts/check-ae-artifacts.mjs`.
- Rollback signals: the artifacts imply a secret manager or unsupported automatic token intake.
- Deferred to implementation: no external target documentation change.

## Consistency Check

- implementationUnitCount: 3
- sourceRequirementsCovered: R1-R4, NFR1-NFR2
- sourceRequirementsDeferred: none
- openQuestionsCount: 0

## Validation Plan

- Unit: focused local-runtime smoke gate test.
- Integration: `npm.cmd test`; `npm.cmd run check`.
- User flow: inspect source/mirror template-handoff language and installation smoke output.
- Data / operations: no live request or credential is used.
- Observability: command results, document review, and final gate proof.

## Rollback / Recovery

Revert U1 and U2 together to restore the prior user-controlled-reference guidance. The template handoff remains documentation-only and has no runtime state to migrate.

## Plan Self-Review

- Placeholder scan: no placeholders or vague implementation steps remain.
- Consistency check: U2 depends on U1; U3 records the final contract after implementation evidence exists.
- Scope check: no secret manager, client wrapper, or target integration is introduced.
- Acceptance coverage: R1-R4 and NFR1-NFR2 map to U1-U3.
- Validation gaps: workflow text cannot prove a future model never violates it; source/mirror assertions provide the available regression boundary.
- Alternatives and ADR check: token-free file handoff meets the user flow without direct chat-token transport.
- High-risk pre-mortem check: tracked placement, configuration disclosure, and false-success risks each have an explicit mitigation.

## Handoff

Document review must verify the user-mediated secret boundary and the plan must pass the consensus gate before completion is recorded.

## Completion Record

- U1: Source and mirror gate now require an automatic token-free template, absolute-path handoff, readiness confirmation, reference-only client use, and no inspection of the populated reference.
- U2: Regression coverage asserts each handoff boundary and source/mirror parity.
- U3: This PRD and plan record the supported local handoff and direct-chat-token non-goal.
- Review: coherence, feasibility, and evidence review found no blocking issue.
- Validation: focused contract test, `npm.cmd test` (82/82), `npm.cmd run check`, artifact checks, mirror checks, installation smoke, and `git diff --check` passed.
- Residual risk: future agents must still select a target-specific ignored or operating-system temporary path and a client whose error output does not disclose configuration contents.

## Follow-up (2026-08-10)

- Follow-up PRD: `docs/ae/prds/2026-08-10-api-smoke-fillable-request-config-prd.md`
- Follow-up plan: `docs/ae/plans/2026-08-10-003-api-smoke-fillable-request-config-plan.md`
- Hardening: require a non-empty UTF-8 fillable template with `REPLACE_WITH_LOCAL_TOKEN`, method/path, and fill steps; forbid empty files and unsafe PowerShell redirection for non-ASCII request-config text.
- Shared reference: `plugins/ai-agent-engine-codex/skills/ae-work/references/request-config-template.md` and its `.agents` mirror.
- Distributable version: `0.3.17`.
