---
type: plan
status: completed
date: 2026-07-07
title: skillopt-audit-filter
origin: docs/ae/prds/2026-07-07-001-skillopt-audit-filter-prd.md
originFingerprint: 2026-07-07-skillopt-audit-filter
depth: standard
format: human-readable-plan
sharded: false
---

# Plan: skillopt-audit-filter

## Source

- PRD: `docs/ae/prds/2026-07-07-001-skillopt-audit-filter-prd.md`
- User-approved scope: short-term enhancement only; strengthen `ae-skill-audit`, do not install or import SkillOpt.
- External reference evidence: SkillOpt remote HEAD observed as `e4ea6a6771e797ef820cdd8bfea64c57e0481065` earlier in this session.

## AI Parse Contract

- canonicalKind: plan
- humanEquivalent: true
- stableIdsRequired: true
- noImplicitScope: true

## Scope

Add an AE-native skill-optimization pattern filter to `ae-skill-audit` and its audit template, then protect the guidance with focused tests.

## Readiness

- Goal: improve audit judgment for SkillOpt-like frameworks without adding a new runtime or broad workflow surface.
- Acceptance criteria: R1-R5 and NFR1-NFR2 from the PRD.
- Non-goals: no SkillOpt install, no new `ae-skill-optimize`, no auto-adoption, no benchmark/replay engine.
- Affected areas:
  - `plugins/ai-agent-engine-codex/skills/ae-skill-audit/SKILL.md`
  - `.agents/skills/ae-skill-audit/SKILL.md`
  - `plugins/ai-agent-engine-codex/skills/ae-skill-audit/references/audit-template.md`
  - `.agents/skills/ae-skill-audit/references/audit-template.md`
  - `tests/skill-scripts.test.mjs`
  - `docs/ae/prds/2026-07-07-001-skillopt-audit-filter-prd.md`
  - `docs/ae/plans/2026-07-07-005-skillopt-audit-filter-plan.md`
  - `docs/00-process/archive/2026-07/skillopt-audit-filter/progress.md`
- Validation surface:
  - `node --test --test-name-pattern "SkillOpt audit filter guidance" tests/skill-scripts.test.mjs`
  - `node scripts/check-skill-mirror.mjs`
  - `node scripts/check-skill-contract.mjs`
  - `node scripts/check-ae-artifacts.mjs`
- Open questions: none blocking.

## Assumptions

- Existing dirty worktree changes are unrelated and must be preserved.
- The plugin source and `.agents/skills` mirror remain the only skill files that need synchronization for this pass.

## Alternatives Considered

- Recommended: add a narrow filter to `ae-skill-audit` plus template fields and tests.
- Alternative: create `ae-skill-optimize` now.
- Rejected because: no AE held-out task suite exists yet to make auto-evolution safe.
- Alternative: install SkillOpt-Sleep as a local dependency.
- Rejected because: the short-term goal is audit capability, not runtime integration.

## Decision Drivers

- Driver 1: improve review quality for external skill-optimization frameworks.
- Driver 2: avoid unsupported runtime claims and auto-adoption risk.
- Driver 3: keep maintenance cost low by extending existing audit flow.

## Decisions

### ADR-1 - Filter Before Runtime

- Decision: implement a Skill Optimization Pattern Filter inside `ae-skill-audit`.
- Drivers: audit scope, low risk, current AE guardrails.
- Alternatives: new skill; external runtime import.
- Why chosen: it improves current decisions while preserving the option to build an optimizer later.
- Consequences: users get better recommendations, but no automatic skill evolution.
- Follow-ups: plan `ae-skill-optimize` only after repeated audits need staged replay/gating.

## Risks

- Risk: guidance implies AE can run SkillOpt-like optimization automatically.
  - Mitigation: explicitly require staged proposal, validation evidence, and runtime-support checks.
- Risk: template becomes too broad.
  - Mitigation: add one focused section only.
- Risk: mirror drift.
  - Mitigation: edit source and mirror together and run mirror validation.

## Pre-Mortem

- Failure scenario 1: the filter duplicates Runtime Boundary Filter without adding SkillOpt-specific gates.
- Failure scenario 2: template fields lack enough detail to drive future PRD/plan work.
- Failure scenario 3: tests become brittle on incidental wording.
- Mitigations: use concise section headings and assert stable concepts rather than full paragraphs.

## Global Constraints

- Do not copy SkillOpt prompt/source text.
- Do not touch unrelated dirty files.
- Do not add dependencies or scripts.
- Keep all paths repository-relative.

## Implementation Units

### U1 - Add Skill Optimization Pattern Filter

- Goal: extend `ae-skill-audit` instructions with SkillOpt-style audit criteria.
- Requirements covered: R1, R2, NFR1, NFR2.
- Acceptance criteria covered: dedicated filter exists; auto live mutation is rejected unless validated and supported.
- Depends on: none.
- Files:
  - `plugins/ai-agent-engine-codex/skills/ae-skill-audit/SKILL.md`
  - `.agents/skills/ae-skill-audit/SKILL.md`
- Forbidden files:
  - other skill directories
  - package files
- Approach: insert a concise section after claim provenance, before fit criteria.
- Tests: covered by U3 focused assertions.
- Validation: mirror check.
- Rollback signals: section claims automatic optimization support.
- Deferred to implementation: exact wording.

### U2 - Extend Audit Template

- Goal: capture skill-optimization evidence in audit reports.
- Requirements covered: R3, NFR2.
- Acceptance criteria covered: template contains train/eval traces, edit boundaries, gate metrics, rejected updates, and staging/adoption fields.
- Depends on: U1.
- Files:
  - `plugins/ai-agent-engine-codex/skills/ae-skill-audit/references/audit-template.md`
  - `.agents/skills/ae-skill-audit/references/audit-template.md`
- Forbidden files:
  - scripts
  - external source clones
- Approach: add one section between Deterministic Engineering Patterns and Runtime Boundary Classification.
- Tests: covered by U3 focused assertions.
- Validation: mirror check and artifact check.
- Rollback signals: template requires adopting an external runtime.
- Deferred to implementation: none.

### U3 - Add Regression Assertions

- Goal: protect the new skill and template guidance.
- Requirements covered: R4, R5.
- Acceptance criteria covered: focused test asserts source/mirror parity and key filter fields.
- Depends on: U1, U2.
- Files:
  - `tests/skill-scripts.test.mjs`
- Forbidden files:
  - unrelated tests
- Approach: add one focused test named `SkillOpt audit filter guidance is present in source and mirror skills`.
- Tests:
  - `node --test --test-name-pattern "SkillOpt audit filter guidance" tests/skill-scripts.test.mjs`
- Validation:
  - targeted test
  - `node scripts/check-skill-mirror.mjs`
  - `node scripts/check-skill-contract.mjs`
  - `node scripts/check-ae-artifacts.mjs`
- Rollback signals: test fails due to mirror drift or missing guidance.
- Deferred to implementation: broader full `npm run check` unless targeted checks expose shared issues.

## Consistency Check

- implementationUnitCount: 3
- sourceRequirementsCovered: R1, R2, R3, R4, R5, NFR1, NFR2
- sourceRequirementsDeferred: none
- openQuestionsCount: 0

## Validation Plan

- Unit: targeted Node test for new guidance.
- Integration: mirror, contract, and AE artifact checks.
- User flow: inspect `ae-skill-audit` output expectations for a SkillOpt-like repository.
- Data / operations: no database, network, dependency, lockfile, or production state changes.
- Observability: final gate proof records validation commands.

## Rollback / Recovery

- Revert only U1-U3 files and the PRD/plan/progress artifacts from this task.
- If the filter proves too specific, keep the template section and shorten the skill body section.

## Plan Self-Review

- Placeholder scan: pass.
- Consistency check: pass.
- Scope check: pass; no runtime work included.
- Acceptance coverage: pass.
- Validation gaps: full-package validation is intentionally not required for a narrow skill-doc/test change unless targeted checks fail.
- Alternatives and ADR check: pass.
- High-risk pre-mortem check: pass.

## Handoff

Execute U1-U3 serially in the current worktree, preserving unrelated dirty files. Run targeted validation and write a final gate proof.

## Completion Record

- Completed: 2026-07-07.
- U1 result: added `Skill Optimization Pattern Filter` to `ae-skill-audit` source and mirror.
- U2 result: added matching skill-optimization evidence fields to `audit-template.md` source and mirror.
- U3 result: added focused regression coverage in `tests/skill-scripts.test.mjs`.
- Documentation result: added `docs/ae/experience/2026-07-07-skillopt-audit-filter.md` and updated `docs/08-ai-memory/05-decision-log.md`.
- Archive: `docs/00-process/archive/2026-07/skillopt-audit-filter/progress.md`.
- Validation passed:
  - `node --test --test-name-pattern "SkillOpt audit filter guidance" tests/skill-scripts.test.mjs`
  - `node --test tests/skill-scripts.test.mjs`
  - `npm test`
  - `node scripts/check-skill-mirror.mjs`
  - `node scripts/check-skill-contract.mjs`
  - `node scripts/check-ae-artifacts.mjs`
  - `npm run check`
  - `git diff --check`
- Final gate proof: `docs/ae/gates/20260707T090448Z-work-final.json`.
- Deferred work: no `ae-skill-optimize`, SkillOpt install, replay suite, or auto-adoption in this pass.
