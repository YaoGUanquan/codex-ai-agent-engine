---
type: plan
status: completed
date: 2026-07-22
title: upstream-safety-test-contract
origin: docs/ae/prds/2026-07-22-001-upstream-safety-test-contract-prd.md
originFingerprint: 2026-07-22-upstream-safety-test-contract
depth: standard
format: human-readable-plan
sharded: false
---

# Plan: Upstream Safety and Test Contract Adaptation

## Source

- Requirements: `docs/ae/prds/2026-07-22-001-upstream-safety-test-contract-prd.md`.
- Current branch: `main` at `165b897`.
- Upstream reference: `5aa541d` and `a6d21d3`; adapt the behavior, not the OpenCode runtime.

## AI Parse Contract

- canonicalKind: plan
- humanEquivalent: true
- stableIdsRequired: true
- noImplicitScope: true

## Scope

Harden the two recursive validators and add a compact, risk-scaled test design contract to the canonical `ae-design` skill and its mirror.

## Readiness

- Goal: satisfy R1-R5 without expanding runtime surface.
- Acceptance criteria: R1-R5 in the source PRD.
- Non-goals: OpenCode parity, test generation, fixed metrics, dependencies, and untracked files.
- Affected areas: Guardrail (validators), Knowledge (skill/template), Distribution (mirror), and process evidence.
- Validation surface: focused Node tests; `npm.cmd test`; `npm.cmd run check`; design/artifact/mirror checks; `git diff --check`.
- Open questions: none.

## Assumptions

- The validators should reject rather than dereference any symbolic link encountered in a scanned root or listed manifest path.
- Risk-triggered coverage tables are sufficient for this pass; semantic completeness measurement is deferred.

## Alternatives Considered

- Recommended: use `lstatSync` plus real-path containment in the existing validators, and extend the existing design template.
- Alternative: add a shared filesystem-security helper.
- Rejected because: two small scripts do not justify a new abstraction, and local validation behavior is clearer in place.
- Alternative: copy upstream quantified test-template rules.
- Rejected because: fixed counts would over-specify small Codex design contracts.

## Decision Drivers

- Driver 1: prevent link traversal and contract-boundary bypasses in user-supplied targets.
- Driver 2: improve test design quality without increasing runtime or dependency ownership.
- Driver 3: preserve plugin-source/mirror parity and legacy validator behavior.

## Decisions

### ADR-1 - Reject symbolic links at every validator boundary

- Decision: skip symlinks during walks; reject manifest entries whose lexical or real path leaves the design directory.
- Drivers: R1, R2, and upstream vulnerability evidence.
- Alternatives: dereference only file links, or maintain an inode-visited set.
- Why chosen: reject-by-default is simpler, avoids cycles, and exactly matches the manifest containment contract.
- Consequences: linked artifact trees are not scanned; users must provide physical files under the target root.
- Follow-ups: generalize only if another validator needs the same boundary.

### ADR-2 - Keep coverage guidance conditional and qualitative

- Decision: add selected-method and verification-signal fields plus dimension-triggered coverage expectations; do not add universal numeric thresholds.
- Drivers: R3, R4, and current compact-design policy.
- Alternatives: upstream's universal counts or no template change.
- Why chosen: preserves proportionality while making scenario selection and downstream verification inspectable.
- Consequences: the checker validates the structural contract, not actual test execution coverage.
- Follow-ups: revisit semantic metrics only with representative design artifacts and a stable measurement method.

## Risks

- Windows may deny symbolic-link creation during tests.
- `realpath` checks can reject legitimate linked development layouts by design.
- Overly prescriptive template wording could inflate small designs.

## Pre-Mortem

- Failure scenario 1: a nested link bypasses only the leaf check.
- Failure scenario 2: a test skips on Windows and leaves the regression unproved.
- Failure scenario 3: the coverage matrix becomes mandatory for dimensions that do not exist.
- Mitigations: test both leaf and parent-link containment, make link test setup fail explicitly rather than silently skip, and define trigger-specific N/A guidance.

## Global Constraints

- Edit canonical plugin source before syncing the `.agents/skills` mirror.
- Preserve user-owned `.opencode/` and `ae/` directories.
- No dependencies, lockfile edits, or unsupported runtime claims.

## Implementation Units

### U1 - Harden recursive validator traversal

- Goal: satisfy R1 and R2.
- Requirements covered: R1, R2.
- Acceptance criteria covered: safe discovery and manifest containment.
- Depends on: none.
- Files: `plugins/ai-agent-engine-codex/scripts/check-design-contract.mjs`, `plugins/ai-agent-engine-codex/scripts/check-ae-artifacts.mjs`, `tests/skill-scripts.test.mjs`.
- Forbidden files: `package.json`, `package-lock.json`, `.opencode/**`, `ae/**`.
- Approach: add link-aware traversal and real-path containment; add direct, nested, and cycle regression fixtures.
- Tests: `node --test --test-name-pattern "symbolic link" tests/skill-scripts.test.mjs`.
- Validation: design and artifact checker commands plus full suite.
- Rollback signals: ordinary nested designs or legacy artifacts become unscannable.
- Deferred to implementation: no shared helper.

### U2 - Add risk-scaled test design guidance

- Goal: satisfy R3 and R4.
- Requirements covered: R3, R4.
- Acceptance criteria covered: method selection, traceability, conditional coverage, and no fixed counts.
- Depends on: U1.
- Files: `plugins/ai-agent-engine-codex/skills/ae-design/SKILL.md`, `plugins/ai-agent-engine-codex/skills/ae-design/references/design-contract-template.md`, `.agents/skills/ae-design/SKILL.md`, `.agents/skills/ae-design/references/design-contract-template.md`, `tests/skill-scripts.test.mjs`.
- Forbidden files: `package.json`, `package-lock.json`, `.opencode/**`, `ae/**`.
- Approach: add concise trigger-to-method and coverage-matrix instructions; prove source/mirror content and reject fixed-count wording in tests.
- Tests: `node --test --test-name-pattern "risk-scaled test design" tests/skill-scripts.test.mjs`.
- Validation: mirror and skill-contract checks plus full suite.
- Rollback signals: small designs require inapplicable methods or templates claim automatic coverage measurement.
- Deferred to implementation: no numeric coverage checker.

### U3 - Record source freshness and delivery evidence

- Goal: satisfy R5 and retain audit provenance.
- Requirements covered: R5.
- Acceptance criteria covered: source/mirror validity and recorded proof.
- Depends on: U1, U2.
- Files: `plugins/ai-agent-engine-codex/skills/ae-help/references/capability-catalog.json`, `.agents/skills/ae-help/references/capability-catalog.json`, `docs/codex-port-analysis.md`, `docs/08-ai-memory/05-decision-log.md`, `docs/00-process/active/upstream-safety-test-contract/progress.md`, `docs/ae/gates/<timestamp>-work-final.json`.
- Forbidden files: `package.json`, `package-lock.json`, `.opencode/**`, `ae/**`.
- Approach: record observed upstream commit and the portability boundary; run final checks and gate.
- Tests: `node --test --test-name-pattern "upstream safety" tests/skill-scripts.test.mjs`.
- Validation: full validation contract.
- Rollback signals: provenance claims lack evidence or source/mirror catalog diverges.
- Deferred to implementation: no external upstream synchronization automation.

## Consistency Check

- implementationUnitCount: 3
- sourceRequirementsCovered: R1-R5
- sourceRequirementsDeferred: none
- openQuestionsCount: 0

## Validation Plan

- Unit: U1 and U2 focused Node test patterns.
- Integration: `npm.cmd test`; `npm.cmd run check`.
- User flow: `ae-tools.mjs help design` output remains valid.
- Data / operations: direct validator runs on fixture roots and source/mirror equality checks.
- Observability: active progress note and final AE gate.

## Rollback / Recovery

Revert U1 independently to restore prior discovery behavior, or U2 independently to remove only added guidance. A failing focused test identifies the affected unit before any broad rollback.

## Plan Self-Review

- Placeholder scan: no TBD/TODO placeholders remain.
- Consistency check: U2 depends on U1 because test fixtures share the test file; U3 is serial delivery work.
- Scope check: only the approved safety repair and first portable improvement are included.
- Acceptance coverage: R1-R5 map to U1-U3 and named commands.
- Validation gaps: Windows link creation support must be proved by the test fixture, not assumed.
- Alternatives and ADR check: selected existing owners and standard library over abstractions or runtime imports.
- High-risk pre-mortem check: containment, platform test setup, and proportionality have explicit mitigations.

## Handoff

Document review: `APPROVE`; the reviewer and architect lanes found no blocking scope, ownership, validation, or rollback gap. Proceed serially on the explicitly selected `main` branch while preserving unrelated untracked content.

## Completion Record

- U1: recursive artifact and design validators now skip symbolic links; design manifests also prove real-path containment.
- U2: `ae-design` and its mirror now require a risk-scaled Test Coverage Matrix without fixed scenario quotas.
- U3: capability metadata, source analysis, decision memory, and regression expectations record upstream `76d832c96a1c810410982bf28b425a3aedb461ab` and its GPL-3.0-or-later source metadata.
- Review: reviewer lane `APPROVE`; architect lane `APPROVE`; no blocking findings.
- Validation: focused red/green tests; `npm.cmd test` passed 80/80; `npm.cmd run check` passed; direct artifact/design/mirror/metadata/skill-contract checks passed; `git diff --check` passed.
