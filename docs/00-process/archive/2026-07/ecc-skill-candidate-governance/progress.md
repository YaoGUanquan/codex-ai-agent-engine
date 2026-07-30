---
type: process-note
status: done
date: 2026-07-30
topic: ecc-skill-candidate-governance
---

# ECC Skill Candidate Governance Progress

## Scope

Adapt ECC's candidate-quality method into existing AE skill creation and experience capture. Exclude ECC runtime installation, hooks, automatic context injection, automatic generation, and behavioral replay execution.

## Checkpoints

- Pre-edit Git gate: clean `main` branch; `origin` upstream confirmed.
- PRD: `docs/ae/prds/2026-07-30-ecc-skill-candidate-governance-prd.md`.
- Plan and document review: `docs/ae/plans/2026-07-30-001-ecc-skill-candidate-governance-plan.md` and `docs/ae/reviews/2026-07-30-ecc-skill-candidate-governance-review.md`.
- U1: focused regression contract added; initial expected failure confirmed the missing candidate gate.
- U2: paired candidate gate and experience routing implemented.
- U3: manifests synchronized at `0.3.4` and final delivery evidence recorded.

## Validation Result

- Passed: `node --test --test-name-pattern "skill candidate governance" tests/skill-scripts.test.mjs`.
- Passed: `npm.cmd test` with 86 tests passing.
- Passed: `npm.cmd run check`, including source/mirror, language metadata, skill contract, install smoke, artifact, design-contract, and read-only graph checks.
- Passed: `git diff --check` before final review and Git operations.

## Result

- Added a staged `Create`/`Improve`/`Absorb`/`Drop` candidate evaluation contract under the existing `ae-skill-creator` owner.
- Preserved explicit user authorization and rejected automatic skill, memory, runtime, and generated-artifact mutations.
- Deferred behavioral replay evaluation until a Codex-compatible deterministic runner exists.
