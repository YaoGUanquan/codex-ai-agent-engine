---
type: prd
status: drafted
date: 2026-08-03
topic: external-skill-optimization
format: human-readable-requirements
sharded: false
---

# External Skill Optimization

## AI Parse Contract

- canonicalKind: requirements
- humanEquivalent: true
- stableIdsRequired: true
- noImplicitScope: true

## Problem Frame

Several public skill repositories describe persistent planning, code simplification, browser testing, iterative repair, skill creation, and UI design. The current AE project already implements many of these concerns, but a focused comparison can identify small improvements without importing incompatible runtime behavior or duplicating existing skills.

The desired outcome is a staged, evidence-backed recommendation for improving current AE skill logic. This PRD does not authorize implementation.

## Requirements

**Audit And Provenance**

- R1. The audit must identify each external source, inspected files, license evidence, freshness method, and unresolved source limitations.
  Acceptance: The audit report contains a source table with URL, observed/ref status, inspected evidence, license notes, and a bounded verdict for every candidate family.
- R2. External methods must be classified as portable method, local deterministic mechanism, or runtime-specific behavior.
  Acceptance: The audit report maps each recommended or rejected pattern to an existing AE skill or an explicit rejection boundary.

**Candidate Selection**

- R3. The first optimization proposal must prefer improving existing skills over creating a new skill.
  Acceptance: The proposal names the owning existing skills and explains why a new entrypoint is unnecessary.
- R4. The proposal must preserve Codex runtime, license, and distribution boundaries.
  Acceptance: It rejects or rewrites hooks, slash commands, background daemons, automatic mutation, MCP auto-loading, copied source, and unverified benchmark claims.
- R5. The proposal must distinguish recommendation from authorization.
  Acceptance: The PRD and audit state that no skill, memory, dependency, or plugin metadata may be changed until the user authorizes a follow-up implementation task.

**Future Validation**

- R6. Any authorized skill change must preserve canonical plugin source and `.agents/skills` mirror parity.
  Acceptance: `node scripts/check-skill-mirror.mjs` passes after implementation.
- R7. Any authorized skill change must have contract, metadata, artifact, package, and focused regression validation.
  Acceptance: The implementation plan names exact commands and records failures or unverified runtime behavior explicitly.
- R8. Any authorized change to distributable skill content must keep the root package and plugin manifest versions synchronized.
  Acceptance: `package.json` and `plugins/ai-agent-engine-codex/.codex-plugin/plugin.json` contain the same incremented SemVer, and install smoke passes.

## Non-Functional Requirements

- NFR1. The optimization must remain low-maintenance and avoid bulk external catalogs or new runtime dependencies.
  Acceptance: The first implementation proposal changes only existing skill guidance/references and required tests or evidence files.
- NFR2. Material claims must remain evidence-backed and proof-tier bounded.
  Acceptance: External freshness failures and unavailable replay validation are recorded as limitations rather than promoted to current capability claims.

## Success Criteria

- A maintainer can see which external ideas are already covered, which two improvements are recommended, and which patterns are rejected for runtime, license, duplication, or evidence reasons.
- A follow-up implementation can name owned files, exact validation commands, and rollback or non-adoption boundaries without redoing the external audit.
- No reader can interpret the audit or PRD as permission for automatic skill or memory mutation.

## Scope Boundary

### In Scope

- Read-only comparison of the named public skill families.
- One audit report and this requirements artifact.
- A bounded recommendation to improve `ae-test-browser` and `ae-review` first.

### Out Of Scope

- Editing any skill, mirror, plugin manifest, memory, tests, or runtime.
- Installing external repositories, dependencies, hooks, MCP servers, slash commands, or background services.
- Building a new planning, Ralph, CodeReview, UI/UX, or skill-creator catalog.
- Treating GitHub stars, external benchmark claims, or source-page snapshots as current performance evidence.

### Constraints

- Existing AE skill boundaries, GPL-2.0-only distribution, source/mirror parity, and current Codex approval model remain authoritative.
- Direct GitHub freshness checks may be unavailable; unresolved source state must stay visible.

## Validation Evidence (Conditional)

- Static/document tier: inspect the audit, PRD, local skill owners, and external URLs; run `node scripts/check-ae-artifacts.mjs`.
- Distribution tier for any later skill edit: run mirror, language metadata, skill contract, package, focused tests, and `npm run check` commands.
- Runtime/browser tier: not applicable to this read-only audit; any future browser skill change must retain `ae-test-browser` evidence requirements.
- Unverified: full remote commit freshness for most candidates and any held-out behavioral replay metric.

## Key Decisions

- D1. Prefer `ae-test-browser` reconnaissance guidance and `ae-review` complexity preconditions as the first implementation candidates.
  Reason: both are small, directly aligned with existing ownership, and have clear local validation surfaces.
- D2. Map PlanningwithFiles and Ralph ideas to existing AE process artifacts instead of adding duplicate root-level files.
  Reason: `ae-lfg` and `ae-work` already own progress, ledger, recovery, and final gates.
- D3. Treat AgentStudio's must-haves/deviation/verification-gap ideas as optional vocabulary, not as a new runtime or automatic judge.
  Reason: the portable method is useful, but its hooks, background loops, and model-specific registry are outside Codex enforcement.
- D4. Defer UIUXProMax data and CLI adoption.
  Reason: the current project has frontend design and browser skills; a large data bundle would add license, size, sync, and maintenance risk without a demonstrated current gap.

## Perspective Collision

| Perspective | Main concern | Collision insight |
| --- | --- | --- |
| Critic | External skills may duplicate current AE contracts or overclaim runtime behavior | The useful unit is a narrow rule improvement, not a new catalog |
| Pragmatist | Persistent files and browser reconnaissance reduce repeated rediscovery | Existing AE artifacts can absorb both without changing the runtime |
| Innovator | Independent must-haves, deviation records, and design-system overrides could improve scale | These should first be tested as references/templates, not installed as automation |
| Systems | Source freshness, license, mirror parity, and proof tiers constrain safe adoption | Provenance and explicit non-adoption are part of the feature, not paperwork after it |

### Blind Spots And Preservation Zone

- Blind spots: external repositories did not provide a reproducible held-out replay for this Codex runtime; license terms for some candidates remain unresolved because direct Git access timed out.
- Thinking preservation zone: deciding whether a human team wants richer design-system vocabulary or a stricter independent review ritual should remain a user/team choice, not an automatic skill mutation.

## Dependencies And Assumptions

### Dependencies

- `docs/ae/solutions/2026-08-03-external-skill-optimization-audit.md`.
- Current local skills and deterministic scripts listed in the audit.

### Assumptions

- The user is asking for analysis and a staged recommendation, not immediate implementation.
- The current branch is `main`; existing unrelated untracked files remain user-owned and out of scope.

## Open Questions

### Must Resolve Before Planning

- Q1. [Affects R3][user decision] Which recommendation, if any, should receive a follow-up implementation plan: browser guidance, complexity guidance, must-haves vocabulary, or no change?

### Deferred To Planning

- Q2. [Affects R6][technical] If a skill is changed, which exact reference/template files should carry the new rule while keeping `SKILL.md` concise?
- Q3. [Affects R7][technical] Which focused regression fixture best proves the chosen rule without pretending to test arbitrary future model behavior?

## Evidence Notes

- Local persistence and recovery -> `.agents/skills/ae-lfg/SKILL.md`, `.agents/skills/ae-work/SKILL.md`, and `node scripts/ae-tools.mjs recovery`.
- Local iterative repair -> `.agents/skills/ae-task-loop/SKILL.md`.
- Local review complexity and claim-integrity lanes -> `.agents/skills/ae-review/SKILL.md`.
- Local browser validation -> `.agents/skills/ae-test-browser/SKILL.md`.
- External candidate evidence and freshness limitations -> `docs/ae/solutions/2026-08-03-external-skill-optimization-audit.md`.

## Consistency Check

- requirementsCount: 8
- nonFunctionalRequirementsCount: 2
- decisionsCount: 4
- openQuestionsCount: 3


## Self-Review

- No implementation files, dependencies, or runtime behavior are requested by this artifact.
- Every requirement has an `Acceptance:` condition.
- Confirmed local facts, external assumptions, and unresolved source freshness are separated.
- The proposed scope fits one follow-up plan after Q1 is answered.
