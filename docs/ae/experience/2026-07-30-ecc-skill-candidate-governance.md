---
type: experience
date: 2026-07-30
topic: ecc-skill-candidate-governance
---

# ECC Skill Candidate Governance Experience

## Context

ECC provided a useful candidate-quality pattern for turning repeated work into reusable skills, but its continuous-learning runtime depends on hooks, automatic session injection, and generated artifacts that Codex does not enforce in this project.

## Decision

Adapt only the candidate evaluation method. `ae-skill-creator` now screens prospective skill changes for source evidence, overlap, scope, owner, validation, and a `Create`, `Improve`, `Absorb`, or `Drop` verdict. The result is a staged proposal and needs explicit user authorization before any skill, memory, runtime, or generated artifact changes.

## Implementation

- Updated paired `ae-skill-creator` skill bodies and added paired `references/candidate-evaluation.md` files.
- Updated paired `ae-save-experience` skill bodies so a reusable lesson is candidate evidence, not authorization.
- Added a focused source/mirror regression test.
- Bumped root and plugin distribution versions from `0.3.3` to `0.3.4`.

## Validation

```powershell
node --test --test-name-pattern "skill candidate governance" tests/skill-scripts.test.mjs
npm.cmd test
npm.cmd run check
git diff --check
```

All commands passed on 2026-07-30. `npm.cmd run check` confirmed source/mirror parity, 40-skill metadata coverage, 80 checked source/mirror skill instances, installation smoke with plugin version `0.3.4`, artifact checks, and read-only graph inspection.

## Reusable Lesson

For external skill-learning frameworks, retain candidate evidence and explicit adoption while rejecting automatic runtime mutation. Do not call a completed lesson a reusable skill until the candidate survives overlap, scope, ownership, validation, and user-authorization checks.
