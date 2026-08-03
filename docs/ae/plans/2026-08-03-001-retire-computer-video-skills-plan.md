---
type: plan
status: completed
date: 2026-08-03
title: retire-computer-video-skills
origin: docs/ae/prds/2026-08-03-retire-computer-video-skills-prd.md
originFingerprint: 2026-08-03-retire-computer-video-skills
depth: standard
format: human-readable-plan
sharded: false
---

# Plan: Retire Computer Use And Video Editing Skills

## Source

- Requirements: `docs/ae/prds/2026-08-03-retire-computer-video-skills-prd.md`.
- Upstream audit: `docs/ae/solutions/2026-08-03-external-skill-optimization-audit.md`.

## AI Parse Contract

- canonicalKind: plan
- humanEquivalent: true
- stableIdsRequired: true
- noImplicitScope: true

## Scope

Delete the two named skills from both active roots, remove active catalog and dependency references, update focused checks and package metadata, then validate the complete local distribution contract. Historical documents and unrelated user-owned files remain untouched.

## Readiness

- Goal: R2-R5 and NFR1-NFR2.
- Acceptance criteria: PRD R2-R5 and NFR1-NFR2.
- Non-goals: upstream runtime port, new skills, archive cleanup, commit, and push.
- Affected areas: Knowledge, Guardrail, and Distribution layers.
- Validation surface: static search, source/mirror checks, metadata, contract, artifact, install-smoke, package tests/check, and diff inspection.
- Open questions: none.

## Assumptions

- The existing untracked security-scan directory is user-owned and excluded from edits.
- Package/plugin version currently reads `0.3.6`; the implementation will increment both to `0.3.7`.

## Alternatives Considered

- Recommended: delete the two skills and remove only active references, retaining generic imagegen safety guidance and historical records.
- Alternative: leave compatibility stubs under the old names. Rejected because stubs would keep retired entrypoints discoverable and violate the explicit removal request.
- Alternative: delete all legacy Computer Use templates and historical records. Rejected because the unowned active templates must be removed, but deleting historical records expands scope and destroys provenance.

## Decision Drivers

- Keep source/mirror/discovery/install behavior internally consistent.
- Avoid dangling active references without rewriting historical evidence.
- Minimize distribution and runtime changes.

## Decisions

### ADR-1 - Retire active surfaces as one transaction

- Decision: remove both canonical and mirror skill directories, then update every active consumer in the same change.
- Drivers: R2, R3, R4, NFR2.
- Alternatives: partial deletion or compatibility aliases.
- Why chosen: aliases and partial removal would make discovery and install behavior ambiguous.
- Consequences: the package loses two user-facing entrypoints and their unowned hook/profile contract.
- Follow-ups: future video/desktop workflows require a separately designed replacement skill if needed.

### ADR-2 - Keep upstream adaptation advisory

- Decision: retain the upstream audit as evidence but do not import its OpenCode tools or agents.
- Drivers: R1, D4.
- Alternatives: copy `api-test-runner` or review tools into this plugin.
- Why chosen: runtime boundaries and licensing/provenance are not established for a direct port, and implementation is outside this request.
- Consequences: portable API-test/review ideas remain deferred recommendations.
- Follow-ups: open a separate PRD if the user authorizes an AE-native adaptation.

## Risks

- A missed active reference could break language switching, install smoke, or imagegen guidance.
- Version mismatch could make installed plugin metadata stale.
- Over-broad cleanup could remove historical evidence or unrelated user work.

## Pre-Mortem

- Failure scenario 1: one source/mirror directory remains. Mitigation: delete both roots and run mirror plus explicit directory checks.
- Failure scenario 2: tests still expect deleted labels. Mitigation: update expected metadata/install-smoke fixtures and run `npm test`.
- Failure scenario 3: imagegen retains a dangling dependency. Mitigation: rewrite both source/mirror imagegen files and run active-reference search.

## Global Constraints

- Preserve unrelated changes and historical/archive files.
- Keep canonical source and `.agents/skills` mirror synchronized.
- Do not add dependencies, runtime behavior, commits, or pushes.

## Implementation Units

### U1 - Remove skill directories and active references

- Goal: retire both skills and clean active documentation/configuration dependencies.
- Requirements covered: R2, R3, R4, NFR1.
- Acceptance criteria covered: PRD R2-R4 and NFR1.
- Depends on: none.
- Files:
  - `plugins/ai-agent-engine-codex/skills/ae-computer-use-guard/` (delete)
  - `.agents/skills/ae-computer-use-guard/` (delete)
  - `plugins/ai-agent-engine-codex/skills/ae-video-edit-computer/` (delete)
  - `.agents/skills/ae-video-edit-computer/` (delete)
  - `README.md`
  - `README.en.md`
  - `docs/ae/templates/ae-skill-profiles.example.yaml`
  - `docs/ae/templates/computer-use-hooks/` (delete)
  - `docs/ae/solutions/2026-07-06-karpathy-t3mp3st-five-layer-audit.md`
  - `.agents/skills/ae-imagegen-prompt/SKILL.md`
  - `.agents/skills/ae-imagegen-prompt/references/generation-budget.md`
  - `.agents/skills/ae-imagegen-prompt/references/shared-profile-contract.md`
  - `plugins/ai-agent-engine-codex/skills/ae-imagegen-prompt/SKILL.md`
  - `plugins/ai-agent-engine-codex/skills/ae-imagegen-prompt/references/generation-budget.md`
  - `plugins/ai-agent-engine-codex/skills/ae-imagegen-prompt/references/shared-profile-contract.md`
- Forbidden files: `docs/00-process/archive/`, `docs/08-ai-memory/`, `docs/99-archive/`, and `docs/ae/security-scans/`.
- Approach: delete the named skill directories and their unowned hook templates; remove active catalog/profile/dependency text; preserve historical references only.
- Tests: none isolated; covered by U2 and U3.
- Validation: active `git grep` inventory, source/mirror checks, and direct path existence checks.
- Rollback signals: any historical file changes or loss of generic imagegen prompt-only behavior.
- Deferred to implementation: exact wording of generic GUI handoff.

### U2 - Update catalogs, tests, and package metadata

- Goal: make language metadata and install smoke describe the post-retirement catalog and synchronize distribution versions.
- Requirements covered: R3, R5, NFR2.
- Acceptance criteria covered: PRD R3 and R5.
- Depends on: U1.
- Files:
  - `plugins/ai-agent-engine-codex/scripts/skill-language-metadata.mjs`
  - `scripts/check-install-smoke.mjs`
  - `tests/skill-scripts.test.mjs`
  - `package.json`
  - `plugins/ai-agent-engine-codex/.codex-plugin/plugin.json`
- Forbidden files: `package-lock.json` unless the package manager proves it records the root version, external clones, and unrelated tests.
- Approach: remove retired metadata, expected labels/paths, and unowned hook-policy checks; increment both SemVer fields from `0.3.6` to `0.3.7` together.
- Tests: focused metadata/install-smoke assertions and full `npm test`.
- Validation: language metadata, install smoke, package checks, and manifest equality.
- Rollback signals: missing active skill labels, manifest mismatch, or install target missing expected remaining skills.
- Deferred to implementation: exact next patch version after reading manifests.

### U3 - Run the distribution and artifact gate

- Goal: prove the cleaned catalog is installable and source/mirror/artifact contracts remain valid.
- Requirements covered: R1-R5, NFR1-NFR2.
- Acceptance criteria covered: all validation conditions.
- Depends on: U1, U2.
- Files: `docs/ae/reviews/2026-08-03-retire-computer-video-skills-review.md`.
- Forbidden files: all source, mirror, test, and unrelated user-owned files.
- Approach: record review findings, exact commands, changed-file inventory, exclusions, and residual risks.
- Tests: `npm test`.
- Validation: `npm run check`, `node scripts/check-skill-mirror.mjs`, `node scripts/check-skill-language-metadata.mjs`, `node scripts/check-skill-contract.mjs`, `node scripts/check-install-smoke.mjs`, `node scripts/check-ae-artifacts.mjs`, and `git diff --check`.
- Rollback signals: any failed gate or active reference found outside explicit historical exclusions.
- Deferred to implementation: none.

## Consistency Check

- implementationUnitCount: 3
- sourceRequirementsCovered: R1, R2, R3, R4, R5, NFR1, NFR2
- sourceRequirementsDeferred: none
- openQuestionsCount: 0

## Validation Plan

- Unit: metadata and install-smoke tests.
- Integration: mirror, language metadata, skill contract, artifact, package, and install-smoke checks.
- User flow: not-applicable; no running application flow changes.
- Data / operations: not-applicable; no external service or persisted data changes.
- Observability: review artifact, changed-file inventory, active-reference search, and `git diff --check`.

## Rollback / Recovery

Restore only the deleted skill directories and task-owned catalog/reference edits from the working-tree diff if a validation gate fails; do not revert unrelated changes or historical documents. A future replacement skill must use a new name and a new reviewed plan.

## Plan Self-Review

- Placeholder scan: pass; no TODO/TBD placeholders.
- Consistency check: pass; every PRD requirement maps to a unit or validation.
- Scope check: pass; historical and unrelated paths are forbidden.
- Acceptance coverage: pass.
- Validation gaps: static/package checks cannot prove future model adherence; no runtime claim is made.
- Alternatives and ADR check: pass.
- High-risk pre-mortem check: pass for deletion and distribution risk.

## Handoff

Execute serially because U1 changes the catalog inputs consumed by U2 and U3. No commit or push is included.
