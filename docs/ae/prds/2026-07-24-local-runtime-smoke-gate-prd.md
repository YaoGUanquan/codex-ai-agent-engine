---
type: prd
status: review-passed
date: 2026-07-24
topic: local-runtime-smoke-gate
format: human-readable-requirements
sharded: false
origin: docs/ae/brainstorms/2026-07-24-local-runtime-smoke-gate-requirements.md
originFingerprint: 2026-07-24-local-runtime-smoke-gate
---

# PRD: Local Runtime Smoke Gate

## AI Parse Contract

- canonicalKind: requirements
- humanEquivalent: true
- stableIdsRequired: true
- noImplicitScope: true

## Problem Frame

Implementation-oriented AE skills require focused validation but do not share an explicit local-runtime smoke transition. This can make an explicit user request stall after restart confirmation, especially when authentication is required.

## Requirements

- R1. Equivalent requests for local runtime validation must select a shared smoke gate.
  Acceptance: `ae-work`, `ae-tdd`, `ae-debug`, and `ae-task-loop` direct relevant work to the same gate.
- R2. The gate must make restart confirmation, safe request classification, and authorization preconditions visible before sending a request.
  Acceptance: each condition has a defined proceed or blocked outcome.
- R3. Authenticated smoke guidance must prohibit transferring a raw chat credential through command text, patches, files written by the agent, logs, or tool stdin.
  Acceptance: it requires an already-created user-owned local secret reference and instructs the agent not to inspect it.
- R4. A ready, read-only smoke must execute once and report route, response status, expected signal, actual signal, and unverified scope.
  Acceptance: a repeated question is not permitted after the same prerequisite was already confirmed.
- R5. Failed runtime responses must stop the success claim and route to evidence-backed diagnosis.
  Acceptance: the gate lists 4xx, 5xx, transport failures, and business errors as blockers.

## Non-Functional Requirements

- NFR1. The change must be skill guidance only and make no unsupported Codex capability claim.
  Acceptance: no dependency, secret-store, hook, server-lifecycle, or production-access feature is added.
- NFR2. Source and mirror contracts must remain synchronized and regression-tested.
  Acceptance: focused tests, mirror checks, static checks, installation smoke, and the full test suite pass.

## Success Criteria

- The next local smoke action is deterministic after a user request.
- A future agent cannot reasonably interpret chat credentials as safe terminal or stdin input.

## Scope Boundary

### In Scope

- A shared reference under the existing `ae-work` skill.
- Cross-references from the four implementation and diagnostic skills.
- Regression assertions and delivery artifacts.

### Out Of Scope

- Executing a live smoke in this repository, changing credentials, adding a secret manager, or changing external application rules.

### Constraints

- Preserve source/mirror equality.
- Preserve the user's untracked `.opencode/` and `ae/` content.
- Keep existing test-first and diagnosis rules; the gate adds runtime validation selection rather than replacing them.

## Key Decisions

- D1. One reference is the canonical local-runtime smoke contract.
  Reason: duplicated credential guidance would drift between skills.
- D2. User-created secret references are required for authenticated requests.
  Reason: current command and stdin traces are not a secret-safe transport.

## Dependencies And Assumptions

### Dependencies

- The target project has a local service and supplies a test-safe request surface when runtime testing is requested.

### Assumptions

- Existing installation copies the complete skill tree, so sibling skill references remain available.

## Evidence Notes

- Local workflow failure analysis from session `019f91e5-78d7-7442-b033-f34f4fd1d9a6` -> explicit restart and smoke requests preceded delayed credential handoff; later curl commands proved no platform test block.
- Existing mirror and installation checks -> canonical source/mirror distribution is already enforced.

## Consistency Check

- requirementsCount: 5
- nonFunctionalRequirementsCount: 2
- decisionsCount: 2
- openQuestionsCount: 0
