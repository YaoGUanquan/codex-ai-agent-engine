---
type: prd
status: completed
date: 2026-07-07
topic: skillopt-audit-filter
format: human-readable-requirements
sharded: false
---

# SkillOpt Audit Filter

## AI Parse Contract

- canonicalKind: requirements
- humanEquivalent: true
- stableIdsRequired: true
- noImplicitScope: true

## Problem Frame

AE can already audit external skill and agent repositories, but skill-optimization frameworks such as SkillOpt need a more precise review path. The desired outcome is a narrow enhancement to `ae-skill-audit` that helps distinguish portable skill-optimization mechanics from runtime-specific automation and unsafe auto-adoption claims.

## Requirements

**Audit Behavior**
- R1. `ae-skill-audit` must explicitly evaluate external skill-optimization frameworks for trajectory source, bounded edit shape, validation gate, staging/adoption boundary, and replay evidence.
  Acceptance: The skill instructions include a dedicated filter for skill optimization patterns with those checks.
- R2. Audit output must distinguish safe process adaptation from direct runtime import or automatic live skill mutation.
  Acceptance: The skill instructions reject ungated or auto-adopted live changes unless the current AE/Codex runtime has explicit support and validation evidence.
- R3. The audit template must capture skill-optimization evidence in a reusable section.
  Acceptance: `audit-template.md` includes fields for train/eval traces, candidate edit boundaries, gate metric, accepted/rejected update handling, staging/adoption policy, and AE validation mapping.

**Validation**
- R4. The change must keep plugin source and `.agents/skills` mirror synchronized.
  Acceptance: `node scripts/check-skill-mirror.mjs` passes.
- R5. Regression coverage must protect the new audit filter wording.
  Acceptance: A focused test asserts the new skill and template guidance exists.

## Non-Functional Requirements

- NFR1. The change must stay documentation/skill-guidance only.
  Acceptance: No new runtime dependency, scheduler, SkillOpt import, or external code is added.
- NFR2. The change must preserve current external-audit flow and output shape.
  Acceptance: Existing audit template sections remain present and existing skill-script tests continue to pass.

## Success Criteria

- `ae-skill-audit` can answer whether SkillOpt-like mechanisms should be adapted, deferred, or rejected with evidence-backed reasoning.
- The enhancement is narrow enough to ship without creating a new public skill or command.

## Scope Boundary

### In Scope

- Update `ae-skill-audit` source and mirror.
- Update `ae-skill-audit` audit template source and mirror.
- Add focused regression assertions.
- Run mirror, contract, and targeted test validation.

### Out Of Scope

- Installing SkillOpt or SkillOpt-Sleep.
- Creating `ae-skill-optimize`.
- Building replay datasets or held-out AE benchmark tasks.
- Auto-mutating live `SKILL.md` files.

### Constraints

- Preserve existing dirty worktree changes unrelated to this task.
- Do not copy external SkillOpt source text into AE skills; rewrite the method as AE-native guidance.
- Keep paths repository-relative in artifacts.

## Key Decisions

- D1. Improve existing `ae-skill-audit` first.
  Reason: The current need is better audit judgment, not a new optimization runtime.
- D2. Treat SkillOpt-style mechanics as a pattern filter, not an adopted dependency.
  Reason: AE lacks a held-out task suite for automatic skill evolution today.

## Dependencies And Assumptions

### Dependencies

- Existing mirror validation scripts.
- Existing skill contract tests.
- User-approved short-term scope from the current conversation.

### Assumptions

- SkillOpt remains a reference input only; this pass does not need a fresh clone during implementation because the audit conclusion was established earlier in-session from observed HEAD `e4ea6a6771e797ef820cdd8bfea64c57e0481065`.

## Open Questions

### Must Resolve Before Planning

- None.

### Deferred To Planning

- Q1. [Affects future work][technical] What AE held-out replay set would make automatic skill evolution safe?

## Evidence Notes

- SkillOpt source freshness -> Evidence: `git ls-remote https://github.com/microsoft/SkillOpt.git HEAD` observed `e4ea6a6771e797ef820cdd8bfea64c57e0481065` earlier in this session.
- Existing AE claim and mirror guardrails -> Evidence: `scripts/check-claims.mjs`, `scripts/check-skill-mirror.mjs`, `scripts/check-skill-contract.mjs`.

## Consistency Check

- requirementsCount: 5
- nonFunctionalRequirementsCount: 2
- decisionsCount: 2
- openQuestionsCount: 1

## Completion

- Completed: 2026-07-07
- Outcome: implemented as an audit-guidance enhancement, not a SkillOpt runtime integration.
- Implemented artifacts:
  - `plugins/ai-agent-engine-codex/skills/ae-skill-audit/SKILL.md`
  - `.agents/skills/ae-skill-audit/SKILL.md`
  - `plugins/ai-agent-engine-codex/skills/ae-skill-audit/references/audit-template.md`
  - `.agents/skills/ae-skill-audit/references/audit-template.md`
  - `tests/skill-scripts.test.mjs`
- Supporting artifacts:
  - `docs/ae/plans/2026-07-07-005-skillopt-audit-filter-plan.md`
  - `docs/ae/experience/2026-07-07-skillopt-audit-filter.md`
  - `docs/00-process/archive/2026-07/skillopt-audit-filter/progress.md`
- Validation evidence:
  - `node --test --test-name-pattern "SkillOpt audit filter guidance" tests/skill-scripts.test.mjs`
  - `node scripts/check-skill-mirror.mjs`
  - `node scripts/check-skill-contract.mjs`
  - `node scripts/check-ae-artifacts.mjs`
  - final gate proof: `docs/ae/gates/20260707T090448Z-work-final.json`
