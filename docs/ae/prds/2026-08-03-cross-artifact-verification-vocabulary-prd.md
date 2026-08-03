---
type: prd
status: completed
date: 2026-08-03
topic: cross-artifact-verification-vocabulary
format: human-readable-requirements
sharded: false
---

# Cross-Artifact Verification Vocabulary

## AI Parse Contract

- canonicalKind: requirements
- humanEquivalent: true
- stableIdsRequired: true
- noImplicitScope: true

## Problem Frame

Existing AE artifacts already capture requirements, acceptance criteria, open questions, and some unverified evidence. They do not provide a shared way to mark a delivery-critical requirement as a must-have, record a deliberate deviation, or carry a verification gap from planning into review. The desired outcome is optional, evidence-backed vocabulary in existing requirement, plan, and review templates, without creating a new judge, runtime, or workflow root.

## Requirements

**Shared vocabulary**

- R1. Authors can mark a small set of delivery-critical acceptance criteria as must-haves without duplicating every ordinary requirement.
  Acceptance: The requirements template defines an optional must-have entry with its requirement ID and measurable completion condition.
- R2. A deliberate mismatch from a must-have is recorded as a deviation instead of silently rewording the requirement.
  Acceptance: The plan or review template requires the related requirement ID, reason, impact, authority or decision source, and recovery or explicit deferral for each recorded deviation.
- R3. A verification gap identifies missing proof without being promoted to a pass or silently treated as a deviation.
  Acceptance: The plan and review templates distinguish the affected requirement, missing evidence tier or check, current status, and recovery owner or next action.

**Boundary and governance**

- R4. The vocabulary remains an optional process contract in existing AE artifacts.
  Acceptance: No new skill, background process, hook, automatic judge, Telegram integration, memory mutation, or runtime registration is added.
- R5. Any later implementation preserves source/mirror parity and makes the new wording regression-testable.
  Acceptance: The implementation plan names paired plugin and `.agents/skills` references plus mirror, contract, artifact, focused test, package, and diff validation.

## Non-Functional Requirements

- NFR1. The new vocabulary must not force empty sections or repeated narrative into routine small tasks.
  Acceptance: Each template explicitly makes the vocabulary conditional on a material must-have, deviation, or missing proof.
- NFR2. Evidence language must remain proof-tier bounded.
  Acceptance: Templates prohibit treating static inspection, a helper output, or a generated artifact as runtime, browser, or deployment acceptance.

## Success Criteria

- A downstream reviewer can distinguish a hard delivery criterion, an approved or unresolved deviation, and an unverified requirement without reconstructing context from prose.
- Existing `ae-lfg`, `ae-work`, and `ae-task-loop` remain the only process owners for persistence, execution, and iterative repair.
- No user can infer a new automatic enforcement or external runtime from the templates.

## Scope Boundary

### In Scope

- Existing `ae-prd`, `ae-plan`, and `ae-review` reference templates and their mirrors.
- A focused regression assertion for the new template contract.
- This PRD and its implementation plan.

### Out Of Scope

- New skills, root-level planning files, runtime hooks, background loops, automatic memory changes, model judges, Telegram, or agent registries.
- Rewriting `ae-lfg`, `ae-work`, `ae-task-loop`, `ae-skill-creator`, or the two completed browser/review improvements without a concrete gap.
- UIUXProMax datasets or CLI, SkillCreator catalog changes, and the unresolved CodeReview source.

### Constraints

- The existing external audit remains the evidence source and does not imply copied external text or behavior.
- A later distributable skill-content change must synchronize root and plugin manifest SemVer from the committed baseline.

## Validation Evidence (Conditional)

- Static/document tier: inspect the paired templates and run `node scripts/check-ae-artifacts.mjs`; this proves document structure only.
- Distribution tier for this skill edit: run mirror, metadata, contract, install-smoke, focused tests, `npm test`, `npm run check`, and `git diff --check`.
- Runtime/browser/deployment tiers: not applicable because this proposal changes process wording only; future model adherence remains unverified.

## Key Decisions

- D1. Use optional vocabulary in existing templates rather than a new AgentStudio-derived skill.
  Reason: the concrete gap is traceability between existing artifacts, not a missing runtime capability.
- D2. Keep deviations separate from verification gaps.
  Reason: a permitted variance and absent proof have different recovery paths and must not be conflated.
- D3. Do not add must-have fields to every workflow artifact.
  Reason: mandatory empty sections would add maintenance noise to routine tasks.

## Perspective Collision

| Perspective | Main concern | Collision insight |
| --- | --- | --- |
| Critic | New vocabulary may duplicate acceptance criteria and create paperwork | Optional entries preserve ordinary requirements while exposing only delivery-critical exceptions |
| Pragmatist | Reviewers need a quick way to see what cannot silently slip | Requirement IDs connect hard criteria, deviations, and missing proof without a new system |
| Innovator | Independent judging could catch more issues | The useful part is transparent evidence vocabulary; automatic judges and runtime registration remain out of scope |
| Systems | Extra templates can drift across source and mirror paths | Paired reference edits and existing deterministic checks make the contract maintainable |

### Blind Spots And Preservation Zone

- No static template can prove that future agents consistently fill optional fields; a future task may evaluate real artifact samples before tightening enforcement.
- Teams retain the judgment to designate a requirement as a must-have; the template must not infer product priority automatically.

## Dependencies And Assumptions

### Dependencies

- `docs/ae/solutions/2026-08-03-external-skill-optimization-audit.md`.
- Existing requirement, plan, and review templates plus deterministic source/mirror checks.

### Assumptions

- The requirements and plan were authored before the user explicitly authorized implementation; implementation remains limited to the paired references and focused regression coverage.
- The two earlier authorized improvements to `ae-test-browser` and `ae-review` remain separate completed work.

## Open Questions

### Must Resolve Before Planning

- None. The vocabulary is explicitly optional and bounded by this PRD.

### Deferred To Planning

- None. Detailed conditional schemas belong in existing references; `SKILL.md` entrypoints remain concise.

## Evidence Notes

- Existing persistence and loop ownership -> `.agents/skills/ae-lfg/SKILL.md`, `.agents/skills/ae-work/SKILL.md`, and `.agents/skills/ae-task-loop/SKILL.md`.
- Existing gap -> no active must-have or deviation template vocabulary was found; `ae-review` currently has a narrow verification-gap rule only for `delete` and `shrink` findings.
- External method boundary -> `docs/ae/solutions/2026-08-03-external-skill-optimization-audit.md` classifies AgentStudio vocabulary as portable and its runtime features as rejected.

## Consistency Check

- requirementsCount: 5
- nonFunctionalRequirementsCount: 2
- decisionsCount: 3
- openQuestionsCount: 0

## Self-Review

- Requirements remain behavior-focused and distinguish must-haves, deviations, and missing proof.
- Runtime-specific AgentStudio features are explicitly excluded.
- Each requirement has an inspectable acceptance condition; implementation was later explicitly authorized through the paired plan and remains limited to its scope.
