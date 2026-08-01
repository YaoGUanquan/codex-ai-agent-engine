---
type: plan
status: drafted
date: 2026-07-31
title: security-findings-remediation
origin: docs/ae/prds/2026-07-31-002-security-findings-remediation-prd.md
originFingerprint: 2026-07-31-security-findings-remediation
depth: deep
format: human-readable-plan
sharded: false
---

# Plan: Security Findings Remediation

## Source

- `docs/ae/prds/2026-07-31-002-security-findings-remediation-prd.md`

## AI Parse Contract
- canonicalKind: plan
- humanEquivalent: true
- stableIdsRequired: true
- noImplicitScope: true

## Scope

Fix the three verified findings from the completed full scan and add focused regressions without changing scanner/provider behavior.

## Readiness

- Goal: close the static preview, installer junction, and metadata injection findings.
- Acceptance criteria: R1-R4 in the source PRD.
- Non-goals: dependency/provider changes, unrelated refactoring, and new authenticated preview modes.
- Affected areas: `plugins/ai-agent-engine-codex/scripts/ae-tools.mjs`, `scripts/install-project.mjs`, `tests/skill-scripts.test.mjs`.
- Validation surface: static inspection, focused Node tests, package checks, mirror/contract checks, and install smoke.
- Open questions: none.

## Validation Evidence (Conditional)

| Tier | Expected signal | Preconditions | Status | Bounded claim |
| --- | --- | --- | --- | --- |
| Static inspection | Guards and quoting helpers are present in the owned files | Current worktree | planned | Source shape implements the selected boundary checks |
| Focused automated test | Three regression scenarios pass | Node dependencies | planned | The exercised local cases are rejected or preserved |
| Integration or build | Existing project checks and install smoke pass | Local Node toolchain | planned | Packaging and mirrored skill contracts remain intact |

## Assumptions

- Existing target directories are the supported installer input.
- A filesystem check immediately before each mutation is the repository's practical boundary; kernel-atomic race resistance is not claimed.

## Alternatives Considered

- Recommended: small reusable path guards plus quoted metadata normalization and focused tests.
- Alternative: redesign installer around descriptor-relative file APIs.
- Rejected because: that would broaden platform-specific behavior and exceed the three demonstrated findings.

## Decision Drivers

- Preserve normal AE workflows.
- Block demonstrated boundary escapes with minimal owned code.
- Keep validation deterministic on Windows and CI.

## Decisions

### ADR-1 - Reject unsafe preview and installer paths

- Decision: reject hidden/symlink/out-of-root preview paths and any symlink/junction installer component; require loopback preview hosts.
- Drivers: unauthenticated preview and filesystem write boundaries.
- Alternatives: allow an explicit insecure mode or redesign all filesystem operations.
- Why chosen: smallest behavior-preserving hardening with clear failure signals.
- Consequences: users cannot preview hidden files or expose the preview server on a LAN through this command.
- Follow-ups: design a separate authenticated mode only if a future requirement exists.

### ADR-2 - Quote untrusted metadata

- Decision: normalize line breaks/control characters and render package metadata as JSON-quoted inline data in generated documents.
- Drivers: preserve useful context while preventing instruction section injection.
- Alternatives: omit all package metadata or write it to a separate non-instruction file.
- Why chosen: preserves current generated context with a narrow template change.
- Consequences: metadata is less visually rich but cannot create Markdown sections.
- Follow-ups: none.

## Risks

- A caller with filesystem mutation authority may still race a check and operation; this remains explicitly unverified at kernel level.
- Existing tests may encode generated Markdown formatting assumptions.
- Windows junction creation may be unavailable in some environments, requiring a skipped dynamic case with a static guard test.

## Pre-Mortem

- Failure scenario 1: a symlink is introduced between guard and copy, allowing a partial escape. Mitigation: guard immediately before and after mutations, reject existing links, and document residual race risk.
- Failure scenario 2: one language template remains unquoted and still permits injection. Mitigation: centralize metadata formatting and test English, Chinese, and bilingual outputs.
- Failure scenario 3: preview hardening rejects normal paths or breaks the dry-run contract. Mitigation: retain the existing dry-run test and add a normal-file runtime probe.

## Global Constraints

- Do not read or modify the populated external launcher.
- Do not copy raw scan artifacts or secrets into tracked files.
- Preserve unrelated worktree changes.

## Implementation Units

### U1 - Harden static preview boundaries

- Goal: prevent hidden-file, symlink, traversal, and non-loopback exposure.
- Requirements covered: R1
- Acceptance criteria covered: preview rejects unsafe requests and serves a normal local file.
- Depends on: none
- Files: `plugins/ai-agent-engine-codex/scripts/ae-tools.mjs`, `tests/skill-scripts.test.mjs`
- Forbidden files: `scripts/install-project.mjs`, `package-lock.json`
- Approach: add lstat/realpath-aware root containment and hidden-component checks; require loopback host; return 404 for unsafe request paths.
- Tests: runtime HTTP probe plus existing dry-run test.
- Validation: focused test, `node --check`, `npm test`.
- Rollback signals: normal file probe or existing dry-run fails.
- Deferred to implementation: none.

### U2 - Harden installer target mutations

- Goal: stop writes/deletes/copies and language-setter launch through target-tree links.
- Requirements covered: R2
- Acceptance criteria covered: junction target fails without outside writes; normal target still installs.
- Depends on: none
- Files: `scripts/install-project.mjs`, `tests/skill-scripts.test.mjs`
- Forbidden files: `package-lock.json`, `plugins/ai-agent-engine-codex/scripts/ae-tools.mjs`
- Approach: canonical target validation plus reusable immediate pre/post mutation guards for mkdir, remove, copy, write, and spawn.
- Tests: disposable junction regression and existing install smoke.
- Validation: focused test, `npm run check`, `node scripts/check-install-smoke.mjs`.
- Rollback signals: normal install fails or outside junction receives a file.
- Deferred to implementation: exact platform error wording.

### U3 - Bound initialization metadata

- Goal: prevent package metadata from becoming normative agent instructions.
- Requirements covered: R3
- Acceptance criteria covered: all generated language variants keep injected text inside one quoted metadata value.
- Depends on: none
- Files: `plugins/ai-agent-engine-codex/scripts/ae-tools.mjs`, `tests/skill-scripts.test.mjs`
- Forbidden files: `scripts/install-project.mjs`, `package-lock.json`
- Approach: centralize normalization/JSON quoting and use it for descriptions and generated metadata lists.
- Tests: init with a newline/heading payload in English, Chinese, and bilingual templates.
- Validation: focused test, mirror/check scripts.
- Rollback signals: generated output adds a second heading or loses required project context.
- Deferred to implementation: none.

## Consistency Check
- implementationUnitCount: 3
- sourceRequirementsCovered: R1, R2, R3, R4
- sourceRequirementsDeferred: none
- openQuestionsCount: 0

## Validation Plan

- Unit: focused security regression tests.
- Integration: `npm test`, `npm run check`, mirror/contract/install-smoke checks.
- User flow: static preview dry-run and normal file request; normal disposable install; init output inspection.
- Data / operations: confirm no outside junction writes and no tracked raw scan artifacts.
- Observability: capture exit codes and test counts; no secret or raw finding output.

## Rollback / Recovery

Revert only the task-owned source/test/doc changes if a normal workflow regresses. Delete only disposable test directories. Do not delete or alter the protected scan artifact directory.

## Plan Self-Review

- Placeholder scan: no TODO/TBD placeholders.
- Consistency check: all PRD requirements map to units or validation.
- Scope check: no provider, dependency, or unrelated refactor.
- Acceptance coverage: R1-R4 mapped.
- Validation gaps: kernel-atomic race resistance and authenticated remote preview remain unverified by design.
- Alternatives and ADR check: both material choices recorded.
- High-risk pre-mortem check: three failure scenarios and recovery signals included.

## Handoff

Execute U1-U3 serially, then run the complete validation plan and an `ae-review` code review of the task-owned diff.
