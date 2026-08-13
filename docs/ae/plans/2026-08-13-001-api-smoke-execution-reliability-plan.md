---
type: plan
status: active
date: 2026-08-13
title: api-smoke-execution-reliability
origin: docs/ae/prds/2026-08-13-api-smoke-execution-reliability-prd.md
originFingerprint: 2026-08-13-api-smoke-execution-reliability
depth: standard
format: human-readable-plan
sharded: false
---

# Plan: API Smoke Execution Reliability

## Source

- Requirements: `docs/ae/prds/2026-08-13-api-smoke-execution-reliability-prd.md`.
- Design: `docs/ae/designs/api-smoke-execution-reliability-2026-08-13/design.md`.

## AI Parse Contract

- canonicalKind: plan
- humanEquivalent: true
- stableIdsRequired: true
- noImplicitScope: true

## Scope

Make API smoke execution select a prevalidated project runner before generic curl fallback, enforce same-process credential visibility, classify failures deterministically, and regression-test those workflow invariants.

## Readiness

- Goal: prevent runtime improvisation and repeated credential handoffs during backend API smoke tests.
- Acceptance criteria: R1-R12 and NFR1-NFR4.
- Non-goals: target backend changes, a universal HTTP client, token refresh, service restart automation, browser/deployment acceptance.
- Affected areas: `ae-test-api`, shared smoke gate/template, API verification record, tests, source mirror, release metadata.
- Validation surface: focused Node tests, source/mirror and skill checks, package/install smoke, release-note validation, target-project authenticated smoke.
- Open questions: none; target maintainers retain the decision about restoration versus named final fixture state.

## Validation Evidence

| Acceptance criterion | Applicable tier | Expected signal and bounded claim | Preconditions / owner | Status | Recovery or rollback signal |
| --- | --- | --- | --- | --- | --- |
| R1-R12 | focused automated test | routing, context completeness, eligibility, process visibility, dynamic-value handling, and failure taxonomy assertions pass | repository test runtime / implementer | unverified | revert skill and test unit together if contract conflicts |
| source/mirror distribution | integration/build | mirror, skill, artifact, release, package, and install checks pass | complete versioned change / implementer | unverified | stop release on any mismatch |
| real runner reuse | authenticated service smoke | one existing project runner is selected and completes bounded assertions | restarted target, authorization, opaque credential reference / target user | unverified | leave tier blocked; do not switch carrier |

## Contract Value Classification

- Canonical persisted value: target service state; the plugin does not own it.
- Derived or ephemeral representation: carrier decision, restart confirmation, sanitized process outcome, and verification record.
- Caller-controlled input: target route, fixture, authorization, and credential reference readiness.
- Compatibility fallback: generic curl config only for a single bounded request with no dynamic workflow.
- Trust boundary: populated credential content remains inside the selected client/runner process; state-changing authorization is checked before execution.

## Verification Gaps

- Affected requirement ID: R1-R6
  Required proof and missing check: authenticated target-project smoke with an existing multi-step runner
  Status: unverified
  Owner and next action: implementer runs after the skill change is installed and a target service is restarted with user authorization.

## Assumptions

- Target runners can be identified by method/path/assertion evidence rather than filename alone.
- Existing source/mirror update conventions and release scripts remain authoritative.

## Alternatives Considered

- Recommended: project-runner-first resolution plus narrow curl fallback.
- Alternative: strengthen prose around the existing curl-first template; rejected because phrase tests did not prevent runtime improvisation.
- Alternative: ship a universal Node HTTP runner; rejected because it expands credential, serialization, redirect, TLS, and state-restoration ownership beyond the requirement.

## Decision Drivers

- Deterministic runtime behavior.
- Credential confidentiality and process correctness.
- Minimal plugin-owned execution surface.

## Decisions

### ADR-1 - Prepare behavior-aware runners before restart

- Decision: require implementation work to prepare and validate multi-step/state-changing runners before runtime handoff.
- Drivers: dynamic revisions, read-back assertions, restoration, and fixture ownership.
- Alternatives: assemble curl commands after restart; universal plugin runner.
- Why chosen: target repositories already know their DTOs, fixtures, and state semantics.
- Consequences: some smoke tiers remain explicitly blocked until a runner exists.
- Follow-ups: capture reusable runner patterns as project experience only after successful use.

### ADR-2 - Preserve the selected carrier across runtime failures

- Decision: change carriers only after token-free evidence proves a carrier defect.
- Drivers: avoid conflating auth, transport, and business failures with quoting.
- Alternatives: generate a new template for every failure.
- Why chosen: each failure class has a distinct recovery action.
- Consequences: stale credentials require renewal, not request reconstruction.
- Follow-ups: none.

## Risks

- Runner discovery could select stale or unrelated scripts.
- Overly broad fallback eligibility could recreate improvised multi-step calls.
- Contract-only tests could again validate words rather than behavior.

## Pre-Mortem

- Failure scenario 1: a filename match selects the wrong smoke script. Mitigation: require method/path and assertion-source matching in the preparation record.
- Failure scenario 2: a PUT is mislabeled as a single bounded request. Mitigation: state-changing, dynamic revision, read-back, or restoration signals force project-runner eligibility.
- Failure scenario 3: a 401 causes another carrier rewrite. Mitigation: test category-to-recovery mapping and forbid carrier drift without token-free reproduction.

## Global Constraints

- Never inspect or serialize populated credential content.
- Preserve explicit authorization for exact state changes.
- Keep source and `.ae-source` mirror byte-identical.

## Implementation Units

### U1 - Define deterministic carrier preparation and outcome contracts

- Goal: revise shared smoke guidance and `ae-test-api` routing around ADR-001 through ADR-003.
- Requirements covered: R1-R6, R8-R12, NFR1-NFR4.
- Acceptance criteria covered: runner precedence, pre-runtime request-context preparation, narrow fallback, same-process credential visibility, dynamic-value lifecycle, classified failure recovery.
- Depends on: none.
- Files: `plugins/ai-agent-engine-codex/skills/ae-work/references/local-runtime-smoke-gate.md`, `plugins/ai-agent-engine-codex/skills/ae-work/references/request-config-template.md`, `plugins/ai-agent-engine-codex/skills/ae-test-api/SKILL.md`, `plugins/ai-agent-engine-codex/skills/ae-test-api/references/api-verification-record.md`, matching `.ae-source/skills/` files.
- Forbidden files: target-project application source, credential files, lockfiles.
- Approach: add preparation phase, source-backed request-context manifest, runner eligibility/precedence, operation-graph boundary, same-process rule, dynamic-value lifecycle, failure taxonomy, carrier-preservation rule, and sanitized record fields.
- Tests: covered in U2.
- Validation: inspect source/mirror diff and run skill contract checks.
- Rollback signals: any weakened state-change authorization or secret-opacity rule.
- Deferred to implementation: exact prose organization while preserving shared gate ownership.

### U2 - Add behavioral regression fixtures

- Goal: prove selection, request-context, and recovery invariants rather than only documentation phrases.
- Requirements covered: R7-R12, NFR2-NFR4.
- Acceptance criteria covered: project runner wins; unsafe fallback blocks; eligible GET falls back; required context is complete; unrelated-shell variables are rejected; dynamic values are fresh; five failure classes retain the correct carrier.
- Depends on: U1.
- Files: `tests/skills-docs.test.mjs` and, only if a reusable pure fixture is justified, one existing test-helper module under `tests/`.
- Forbidden files: production HTTP clients, credential stores, target services.
- Approach: parse compact contract tables or exported deterministic fixtures from the skill references; assert context classifications, provider completeness, dynamic-value boundaries, decisions, and source/mirror parity without live secrets or services.
- Tests: focused test-name pattern for API smoke and local runtime gate, then full `npm test`.
- Validation: `node --test --test-name-pattern "API bubble testing|local runtime smoke gate|smoke carrier" tests/skills-docs.test.mjs`; `npm test`.
- Rollback signals: tests depend on a real token, live service, private path, or platform-specific curl availability.
- Deferred to implementation: whether assertions remain in `skills-docs.test.mjs` or use an existing shared parser.

### U3 - Version, document, distribute, and smoke-install

- Goal: ship the changed plugin contract consistently.
- Requirements covered: R7, NFR1, NFR2.
- Acceptance criteria covered: distributable version parity and complete evidence boundaries.
- Depends on: U1, U2.
- Files: `package.json`, `plugins/ai-agent-engine-codex/.codex-plugin/plugin.json`, `README.md`, `README.en.md`, `CHANGELOG.md`, `CHANGELOG.en.md`, applicable process/evidence record.
- Forbidden files: populated secret references, unrelated roadmap or memory files.
- Approach: bump both versions to the same next SemVer, add bilingual release entries with validation boundaries, and preserve only sanitized evidence.
- Tests: release-note, mirror, skill-contract, artifact, package, and install-smoke checks.
- Validation: `node scripts/check-release-notes.mjs`; `npm run check`; `npm test`; `npm run check:smoke`; `git diff --check`.
- Rollback signals: version mismatch, release mapping failure, source/mirror drift, or install-smoke regression.
- Deferred to implementation: exact next SemVer based on repository HEAD at execution time.

### U4 - Target-project acceptance

- Goal: confirm the new workflow reuses an existing multi-step runner and handles stale authentication without carrier drift.
- Requirements covered: R1-R6, R8-R12, NFR1, NFR3, NFR4.
- Acceptance criteria covered: successful bounded runner case, complete required request context, fresh dynamic values, and authentication-blocked case.
- Depends on: U3.
- Files: one sanitized API Verification Record in the chosen target repository; no plugin product files.
- Forbidden files: populated secret reference, unrelated target data, production configuration.
- Approach: install/update the plugin in a controlled target, resolve its existing runner, execute one authorized case, and separately observe or fixture an authentication failure without generating a replacement carrier.
- Tests: target runner syntax/dry-run, authenticated smoke, sanitized record inspection.
- Validation: target-owned commands recorded without credentials or concrete identifiers.
- Rollback signals: carrier drift, secret exposure, missing restoration/final-state rule, or unexpected write scope.
- Deferred to implementation: target selection and user-authorized fixture.

## Consistency Check

- implementationUnitCount: 4
- sourceRequirementsCovered: R1-R12, NFR1-NFR4
- sourceRequirementsDeferred: none
- openQuestionsCount: 0

## Validation Plan

- Unit: deterministic routing and failure taxonomy assertions.
- Integration: full repository tests and source/mirror/plugin contract checks.
- User flow: restart confirmation -> existing runner selection -> opaque credential reference -> one execution -> classified result.
- Data / operations: state-changing runner proves read-back and restoration or named final state.
- Observability: sanitized API Verification Record contains carrier class, preparation evidence, result category, and bounded claims.

## Rollback / Recovery

- Revert U1-U3 as one versioned plugin change if distribution checks fail.
- On target failure, preserve the selected carrier and leave authenticated evidence `blocked`; never roll back target data through an unverified generic request.

## Plan Self-Review

- Placeholder scan: passed; no TODO/TBD placeholders.
- Consistency check: R1-R12 and NFR1-NFR4 map to U1-U4.
- Scope check: no universal HTTP client, service controller, or backend product change.
- Acceptance coverage: focused tests plus target runtime evidence are separated by tier.
- Validation gaps: target authenticated acceptance remains explicitly unverified until U4.
- Alternatives and ADR check: three approaches compared; two decisions preserve the minimal execution surface.
- High-risk pre-mortem check: credential, state-change, and retry risks covered.

## Handoff

Run `ae-review domain:document` over the PRD, design, and plan. After approval, execute with `ae-work`; do not implement product code as part of planning.
