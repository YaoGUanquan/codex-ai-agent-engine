---
type: plan
status: completed
date: 2026-07-30
title: ecc-skill-candidate-governance
origin: docs/ae/prds/2026-07-30-ecc-skill-candidate-governance-prd.md
originFingerprint: 2026-07-30-ecc-skill-candidate-governance
depth: standard
format: human-readable-plan
sharded: false
---

# Plan: ECC Skill Candidate Governance

## Source

- PRD: `docs/ae/prds/2026-07-30-ecc-skill-candidate-governance-prd.md`
- External audit: ECC commit `e4e4163101f162881e628f300a9ca4e6a940bcea`; only the candidate-quality method is in scope.

## AI Parse Contract

- canonicalKind: plan
- humanEquivalent: true
- stableIdsRequired: true
- noImplicitScope: true

## Scope

Add a staged candidate evaluation gate to existing skill-creation and experience-capture guidance. Protect it with targeted tests, preserve source/mirror parity, then release the distributable patch as version `0.3.4`.

## Readiness

- Goal: implement R1-R6 and NFR1-NFR2 without adding an ECC runtime or a new skill.
- Acceptance criteria: each PRD requirement maps to an implementation unit and validation command.
- Non-goals: replay runner, hooks, auto-adoption, external dependency, new skill catalog entry, or external-source copying.
- Affected areas: paired `ae-skill-creator` and `ae-save-experience` guidance; paired candidate-evaluation reference; `tests/skill-scripts.test.mjs`; root and plugin versions; AE records.
- Validation surface: focused Node test, `npm.cmd test`, `npm.cmd run check`, mirror, contract, install-smoke, artifact checks, and `git diff --check`.
- Open questions: Q1 is explicitly deferred; it does not block this guidance-only change.

## Assumptions

- The pre-edit Git gate found a clean `main` branch with an `origin` upstream.
- Version `0.3.3` is current in both distributable manifests and may advance to `0.3.4` after validation.

## Alternatives Considered

- Recommended: extend current creation and experience skills with one reference template and focused tests.
- Alternative: create a standalone skill stocktake or skill optimizer.
  Rejected because: it duplicates current ownership and lacks a Codex-compatible behavioral replay gate.
- Alternative: import ECC continuous-learning assets.
  Rejected because: they require unavailable hooks, automatic session injection, and generated outputs outside AE's explicit-adoption model.

## Decision Drivers

- Driver 1: maintain the explicit human adoption boundary.
- Driver 2: improve repeated judgment without expanding the skill catalog.
- Driver 3: keep distributable source, mirror, and version metadata trustworthy.

## Decisions

### ADR-1 - Stage Candidate Changes In The Existing Creator

- Decision: `ae-skill-creator` owns candidate screening and links to a skill-local reference.
- Drivers: R1-R3, NFR2.
- Alternatives: new candidate-governance skill; automatic generation.
- Why chosen: the creator already owns trigger, scope, validation, and mirror rules.
- Consequences: candidate results remain proposals; implementation happens only after explicit authorization.
- Follow-ups: add replay fixtures only when a deterministic Codex execution boundary exists.

## Risks

- Candidate guidance might be mistaken for permission to edit skills.
  Mitigation: repeat the staged-proposal and explicit-adoption constraint in both the workflow and reference.
- The reference may duplicate the skill body or drift in the mirror.
  Mitigation: keep process summary in `SKILL.md`, details in one reference, test source/mirror equality, and run mirror validation.
- A version mismatch could make the install payload misleading.
  Mitigation: update both manifests in the distribution unit and run install smoke.

## Pre-Mortem

- Failure scenario 1: a new skill is recommended although an existing owner suffices.
- Failure scenario 2: an experience note causes an unapproved skill or memory edit.
- Failure scenario 3: plugin source passes while the installed mirror or manifest version differs.
- Mitigations: require overlap/owner checks, make authorization explicit, and validate source/mirror/version/install consistency.

## Global Constraints

- Do not add dependencies, hooks, runtime scripts, or external source text.
- Do not create a new skill directory or public skill identifier.
- Keep candidate evaluation guidance in ASCII and repository-relative paths.
- Preserve unrelated user changes; stage only task-owned files.

## Implementation Units

### U1 - Establish Candidate-Gate Regression Contract

- Goal: make the required candidate decision and safety boundary observable before skill guidance changes.
- Requirements covered: R5, R6, NFR1, NFR2.
- Acceptance criteria covered: source/mirror parity and focused assertions for candidate evidence, overlap, verdicts, and explicit adoption.
- Depends on: none.
- Files:
  - `tests/skill-scripts.test.mjs`
- Forbidden files:
  - `package-lock.json`
  - unrelated tests
- Approach: add one narrowly named test that reads canonical skill bodies and the candidate reference, compares their mirrors, and asserts behavior-level phrases without snapshotting entire documents.
- Tests: `node --test --test-name-pattern "skill candidate governance" tests/skill-scripts.test.mjs`.
- Validation: focused test is initially expected to fail until U2.
- Rollback signals: test requires runtime behavior or brittle external wording.
- Deferred to implementation: exact assertion expressions.

### U2 - Add Staged Candidate Guidance

- Goal: add candidate screening to skill creation and evidence handoff from completed experience.
- Requirements covered: R1, R2, R3, R4, NFR1, NFR2.
- Acceptance criteria covered: source evidence, overlap scan, Create/Improve/Absorb/Drop verdict, staged proposal, explicit adoption, and experience-as-evidence boundary.
- Depends on: U1.
- Files:
  - `plugins/ai-agent-engine-codex/skills/ae-skill-creator/SKILL.md`
  - `plugins/ai-agent-engine-codex/skills/ae-skill-creator/references/candidate-evaluation.md`
  - `.agents/skills/ae-skill-creator/SKILL.md`
  - `.agents/skills/ae-skill-creator/references/candidate-evaluation.md`
  - `plugins/ai-agent-engine-codex/skills/ae-save-experience/SKILL.md`
  - `.agents/skills/ae-save-experience/SKILL.md`
- Forbidden files:
  - all other skill directories
  - skill metadata YAML
  - runtime or hook configuration
- Approach: maintain concise routing in the creator body; place the candidate record, required checks, verdict rules, and proposed-output format in the reference; add one handoff sentence to experience capture.
- Tests: U1 targeted assertion.
- Validation: mirror and skill-contract checks.
- Rollback signals: text implies auto-adoption, auto-memory update, or non-Codex enforcement.
- Deferred to implementation: none.

### U3 - Synchronize Distribution And Delivery Evidence

- Goal: publish the modified distributable content with matching metadata and complete AE records.
- Requirements covered: R5, R6, NFR1.
- Acceptance criteria covered: synchronized `0.3.4` versions, focused/full validation evidence, review record, experience note, process archive, and final gate proof.
- Depends on: U1, U2.
- Files:
  - `package.json`
  - `plugins/ai-agent-engine-codex/.codex-plugin/plugin.json`
  - `docs/ae/prds/2026-07-30-ecc-skill-candidate-governance-prd.md`
  - `docs/ae/plans/2026-07-30-001-ecc-skill-candidate-governance-plan.md`
  - `docs/ae/reviews/2026-07-30-ecc-skill-candidate-governance-review.md`
  - `docs/ae/experience/2026-07-30-ecc-skill-candidate-governance.md`
  - `docs/00-process/archive/2026-07/ecc-skill-candidate-governance/progress.md`
  - generated final gate JSON under `docs/ae/gates/`
- Forbidden files:
  - lockfiles
  - README files
  - external clones
- Approach: bump both manifests after focused guidance tests pass; write outcomes using actual commands/results; move the active process note to its dated archive only after final validation.
- Tests: full package test suite and distribution validation.
- Validation: `npm.cmd test`; `npm.cmd run check`; `git diff --check`.
- Rollback signals: version mismatch, install smoke failure, failed artifact validation, or untracked unintended files.
- Deferred to implementation: actual timestamp and command outputs.

## Consistency Check

- implementationUnitCount: 3
- sourceRequirementsCovered: R1, R2, R3, R4, R5, R6, NFR1, NFR2
- sourceRequirementsDeferred: none
- openQuestionsCount: 1

## Validation Plan

- Unit: focused `skill candidate governance` Node test and source/mirror inspection.
- Integration: `npm.cmd test`, `npm.cmd run check`, mirror, contract, install-smoke, and artifact checks.
- User flow: inspect the creator candidate output contract to confirm it yields a proposal rather than a write.
- Data / operations: no external service, runtime installation, or user-memory write.
- Observability: review record, experience note, archived process record, final gate JSON, and commit/push state.

## Rollback / Recovery

- Revert only U1-U3 task files together, including the paired source/mirror files and version pair.
- If candidate guidance proves ambiguous, retain the existing creator behavior and remove the new reference rather than introducing a second routing surface.

## Plan Self-Review

- Placeholder scan: pass; the final gate path is intentionally generated at U3 rather than guessed in this plan.
- Consistency check: pass.
- Scope check: pass; no runtime, dependency, or new skill is planned.
- Acceptance coverage: pass; every requirement has an owner and validation.
- Validation gaps: held-out behavioral replay remains explicitly deferred.
- Alternatives and ADR check: pass.
- High-risk pre-mortem check: pass.

## Handoff

Execute U1 through U3 serially in the current clean `main` worktree. Commit and push only the verified, task-owned files after final review.

## Completion Record

- Completed: 2026-07-30.
- U1: added the focused `skill candidate governance` regression contract.
- U2: added paired candidate-evaluation references, staged-proposal guidance, and experience-to-candidate routing.
- U3: synchronized distributable version `0.3.4` and recorded review, experience, archive, and gate evidence.
- Deferred work: no Codex behavioral replay runner, hook, automatic skill generation, or automatic adoption was added.
