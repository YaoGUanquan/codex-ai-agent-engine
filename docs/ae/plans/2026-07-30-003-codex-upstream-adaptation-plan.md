---
type: plan
status: drafted
date: 2026-07-30
title: codex-upstream-adaptation
origin: docs/ae/prds/2026-07-30-codex-upstream-adaptation-prd.md
originFingerprint: 2026-07-30-codex-upstream-adaptation
depth: standard
format: human-readable-plan
sharded: false
---

# Plan: Codex Upstream Adaptation

## Source

- Requirements: `docs/ae/prds/2026-07-30-codex-upstream-adaptation-prd.md`.
- External research input: upstream `master@4547f7c49a3cbf061739eb9c2a9676ceba674e0f`, used only for independently implemented process ideas.

## AI Parse Contract

- canonicalKind: plan
- humanEquivalent: true
- stableIdsRequired: true
- noImplicitScope: true

## Scope

Add a Codex-native existing-project evidence contract and non-quantitative test-case quality checks to `ae-design`; synchronize mirrors, tests, and the distributable version.

## Readiness

- Goal: R1-R5 and NFR1-NFR2.
- Acceptance criteria: PRD acceptance conditions.
- Non-goals: upstream code/text, runtime features, new skills, tests outside this package, commit, and push.
- Affected areas: Knowledge, Guardrail, and Distribution layers.
- Validation surface: static guidance inspection, source/mirror tests, package test/check, install smoke, and diff inspection.
- Open questions: none.

## Assumptions

- The workspace remains clean before the first source edit.
- The current package and plugin versions are both `0.3.5`.

## Alternatives Considered

- Recommended: extend the existing design skill and template with two small contracts.
- Alternative: add `ae-project-explore` or a test-quality skill.
  Rejected because: the design phase already owns both decisions and no new runtime capability is needed.
- Alternative: import upstream templates or coverage quotas.
  Rejected because: GPL/runtime incompatibility and conflict with current risk-scaled guidance.

## Decision Drivers

- Preserve Codex-native runtime and license boundaries.
- Make future design decisions traceable to inspected local evidence.
- Improve test-case signal without creating metric theater.

## Decisions

### ADR-1 - Record Bounded Existing-Project Evidence

- Decision: add a conditional evidence pass and template section to `ae-design`.
- Drivers: R1, R2, NFR1.
- Alternatives: a new exploration skill; informal unrecorded scanning.
- Why chosen: it is the smallest change that makes reuse and constraints reviewable.
- Consequences: design artifacts can show the basis for reuse decisions without storing secrets.
- Follow-ups: reassess a standalone exploration skill only after repeated user demand.

### ADR-2 - Use Qualitative Test-Case Quality Guards

- Decision: require traceability, observable assertions, and semantic de-duplication while retaining risk-based method selection.
- Drivers: R3, R4.
- Alternatives: minimum scenario counts and numeric coverage targets.
- Why chosen: the present contract correctly avoids claiming execution coverage from a design document.
- Consequences: template examples become more specific but remain lightweight.
- Follow-ups: none.

## Risks

- Evidence guidance could become a full repository audit.
- Test rules could regress into mandatory quotas.
- Plugin source and installed mirror could diverge.

## Pre-Mortem

- Failure scenario 1: design artifacts record absolute paths or sensitive values.
  Mitigation: template and rules only permit repository-relative paths and sanitized summaries.
- Failure scenario 2: generated designs add irrelevant test cases to meet a count.
  Mitigation: explicitly prohibit fixed quotas and preserve trigger-based selection.
- Failure scenario 3: metadata version changes without a matching distribution validation.
  Mitigation: use existing mirror, contract, install-smoke, package-test, and package-check gates.

## Global Constraints

- Do not copy upstream code or prose.
- Do not create a new skill, script, dependency, runtime hook, or automatic action.
- Update canonical plugin source and `.agents/skills` mirrors together.
- Do not commit or push.

## Implementation Units

### U1 - Add Existing-Project Evidence Contract

- Goal: make design context, reuse choices, secret exclusions, and explicit bypasses inspectable.
- Requirements covered: R1, R2, NFR1.
- Acceptance criteria covered: R1-R2 acceptance conditions.
- Depends on: none.
- Files: `plugins/ai-agent-engine-codex/skills/ae-design/SKILL.md`, `.agents/skills/ae-design/SKILL.md`, `plugins/ai-agent-engine-codex/skills/ae-design/references/design-contract-template.md`, `.agents/skills/ae-design/references/design-contract-template.md`.
- Forbidden files: all other skill directories, scripts, and runtime configuration.
- Approach: add a compact conditional evidence pass with a greenfield opt-out and a template section containing inspected categories, reuse decisions, sanitized constraints, and bypass reason.
- Tests: extend the existing `ae-design` semantic guidance test.
- Validation: focused test, `check-skill-mirror`, and direct source/mirror diff.
- Rollback signals: absolute path requirement, secret-bearing values, or mandatory deep scan.
- Deferred to implementation: concise field wording.

### U2 - Add Test-Case Quality Guards

- Goal: improve test-design signal without numeric quotas.
- Requirements covered: R3, R4.
- Acceptance criteria covered: R3-R4 acceptance conditions.
- Depends on: U1.
- Files: `plugins/ai-agent-engine-codex/skills/ae-design/SKILL.md`, `.agents/skills/ae-design/SKILL.md`, `plugins/ai-agent-engine-codex/skills/ae-design/references/design-contract-template.md`, `.agents/skills/ae-design/references/design-contract-template.md`.
- Forbidden files: all new skill directories and test-runner configuration.
- Approach: define traceability, observable result, and semantic de-duplication rules next to the existing risk-scaled matrix.
- Tests: extend the existing semantic guidance test with positive wording assertions and the no-fixed-count safeguard.
- Validation: focused test and direct template inspection.
- Rollback signals: numeric targets, mandatory categories, or measured-coverage claim.
- Deferred to implementation: none.

### U3 - Synchronize Distribution And Validate

- Goal: ship the scoped guidance change as one consistent `0.3.6` plugin release candidate.
- Requirements covered: R5, NFR2.
- Acceptance criteria covered: R5 and NFR2 acceptance conditions.
- Depends on: U1, U2.
- Files: `tests/skill-scripts.test.mjs`, `package.json`, `plugins/ai-agent-engine-codex/.codex-plugin/plugin.json`, task PRD/plan/process/review artifacts.
- Forbidden files: lockfiles, external source clones, and unrelated local runtime artifacts.
- Approach: add focused assertions, bump both SemVer fields, validate scoped and package-wide checks, and record bounded evidence.
- Tests: `npm test`, `npm run check`.
- Validation: package validation, artifact validation, and `git diff --check`.
- Rollback signals: manifest mismatch, failed install smoke, failed regression, or claim beyond static/package validation.
- Deferred to implementation: commit and push remain user-controlled.

## Consistency Check

- implementationUnitCount: 3
- sourceRequirementsCovered: R1, R2, R3, R4, R5, NFR1, NFR2
- sourceRequirementsDeferred: none
- openQuestionsCount: 0

## Validation Plan

- Unit: focused semantic test for both contracts.
- Integration: mirror, language metadata, skill-contract, artifact, install-smoke, package test, and package check.
- User flow: not-applicable; no user-facing runtime behavior is changed.
- Data / operations: not-applicable; no external data or service boundary exists.
- Observability: process note, document review, test outputs, and scoped diff inspection.

## Rollback / Recovery

Revert only the task-owned guidance, mirror, test, metadata, and AE artifact changes as one release candidate; do not alter unrelated workflow work.

## Plan Self-Review

- Placeholder scan: pass.
- Consistency check: pass.
- Scope check: pass.
- Acceptance coverage: pass.
- Validation gaps: static/package validation cannot prove model adherence across arbitrary future prompts.
- Alternatives and ADR check: pass.
- High-risk pre-mortem check: pass.

## Handoff

Execute serially because U1 and U2 share the same source/mirror files. No commit or push is included.
