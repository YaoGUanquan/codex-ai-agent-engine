---
type: prd
status: completed
date: 2026-07-30
topic: ecc-skill-candidate-governance
format: human-readable-requirements
sharded: false
---

# ECC Skill Candidate Governance

## AI Parse Contract

- canonicalKind: requirements
- humanEquivalent: true
- stableIdsRequired: true
- noImplicitScope: true

## Problem Frame

The ECC audit found a portable quality gate for turning repeated experience into skills, but its automatic learning and generation runtime does not fit Codex. AE already preserves source/mirror integrity and requires explicit adoption, yet `ae-skill-creator` does not define a consistent candidate evaluation before a new or changed skill is proposed.

The outcome is a concise, Codex-native candidate evaluation workflow owned by existing skills. It must distinguish reusable evidence from authorization to change a skill.

## Requirements

**Candidate Evaluation**

- R1. `ae-skill-creator` must evaluate a prospective skill change before creating, updating, or absorbing it.
  Acceptance: The workflow requires a candidate record with source evidence, trigger, scope, expected reuse, and validation expectations.
- R2. Candidate evaluation must check the canonical skill catalog and existing project guidance for overlap before recommending a new skill.
  Acceptance: The workflow requires an overlap check against plugin-source skills, installed mirrors, and relevant durable project guidance, then selects `Create`, `Improve`, `Absorb`, or `Drop`.
- R3. Candidate evaluation must preserve explicit adoption.
  Acceptance: The workflow says that `Create`, `Improve`, and `Absorb` produce a staged proposal and do not authorize writing skills, changing memory, or installing runtime behavior.
- R4. `ae-save-experience` must route a reusable lesson to candidate evaluation without treating the lesson as a skill change request.
  Acceptance: The skill directs users to `ae-skill-creator` when a completed experience might justify a skill change, and states that the experience is evidence only.

**Distribution And Regression Safety**

- R5. The changed skill guidance and its reference must remain identical between canonical plugin source and `.agents/skills` mirror.
  Acceptance: `node scripts/check-skill-mirror.mjs` passes.
- R6. Regression coverage must assert the candidate gate, explicit-adoption boundary, and source/mirror parity.
  Acceptance: A focused Node test passes before full validation.

## Non-Functional Requirements

- NFR1. The change must not introduce ECC, new dependencies, hooks, slash-command registration, session observation, automatic context injection, or automatic skill generation.
  Acceptance: The diff contains only existing AE skill guidance, a skill-local reference, tests, required distribution metadata, and AE delivery records.
- NFR2. The candidate process must be concise and owned by existing skills rather than creating a new catalog entry.
  Acceptance: No new skill directory or public skill name is added.

## Success Criteria

- A maintainer can consistently turn a completed lesson into a bounded proposal, an existing-skill improvement, an absorption proposal, or a deliberate rejection.
- No documentation can be read as permission for an agent to self-modify project skills or memory.

## Scope Boundary

### In Scope

- Extend `ae-skill-creator` source, mirror, and a skill-local candidate-evaluation reference.
- Clarify the `ae-save-experience` source and mirror handoff.
- Add focused regression coverage and synchronize distributable version metadata.
- Record requirements, plan, process evidence, review outcome, and final delivery evidence.

### Out Of Scope

- ECC installation or vendoring.
- A new `ae-skill-optimize` or stocktake skill.
- Held-out behavioral replay runner, agent benchmarking, or automatic adoption.
- Changes to user memory outside explicitly requested memory updates.

### Constraints

- Plugin source remains canonical and every changed skill file is mirrored byte-for-byte after line-ending normalization.
- External methods are rewritten in AE-native wording; no ECC text or runtime code is copied.
- The root and plugin-manifest SemVer versions must advance together for this distributable change.

## Key Decisions

- D1. Add the quality gate to `ae-skill-creator`, with a reference template.
  Reason: Skill creation owns the write decision; a separate skill would duplicate routing and distribution work.
- D2. Treat `ae-save-experience` output as candidate evidence, not adoption authority.
  Reason: Experience is frequently useful but may be one-off, stale, or already represented elsewhere.
- D3. Defer behavioral replay evaluation.
  Reason: Current Codex execution does not supply a local, deterministic runner for prompt-to-tool-trace scoring; claiming one would be unsafe.

## Dependencies And Assumptions

### Dependencies

- Existing `scripts/check-skill-mirror.mjs`, `scripts/check-skill-contract.mjs`, install smoke, and artifact checks.
- Existing skill-script test conventions and distribution version assertion.

### Assumptions

- The ECC audit at observed commit `e4e4163101f162881e628f300a9ca4e6a940bcea` remains reference evidence only.
- The user-authorized target is the current `main` branch and its configured `origin` remote.

## Open Questions

### Must Resolve Before Planning

- None.

### Deferred To Planning

- Q1. [Affects D3][technical] Define a replay fixture format only after a Codex-compatible execution and grading boundary is available.

## Evidence Notes

- ECC `learn-eval` candidate checklist -> Evidence: external audit at commit `e4e4163101f162881e628f300a9ca4e6a940bcea`, inspected `commands/learn-eval.md`.
- ECC runtime mismatch -> Evidence: inspected `skills/continuous-learning-v2/SKILL.md`, `commands/evolve.md`, and `skills/skill-comply/SKILL.md`.
- AE protection boundary -> Evidence: `plugins/ai-agent-engine-codex/skills/ae-skill-audit/SKILL.md` and `scripts/check-skill-mirror.mjs`.

## Consistency Check

- requirementsCount: 6
- nonFunctionalRequirementsCount: 2
- decisionsCount: 3
- openQuestionsCount: 1

## Completion

- Completed: 2026-07-30.
- Outcome: added a staged candidate quality gate to existing skill creation and clarified that completed experience is evidence rather than authorization.
- Deferred: behavioral replay remains a future Codex-runtime project and was not represented as an available capability.
