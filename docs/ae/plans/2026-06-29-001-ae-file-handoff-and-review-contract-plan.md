---
type: plan
status: drafted
date: 2026-06-29
title: ae-file-handoff-and-review-contract
depth: standard
format: human-readable-plan
sharded: false
---

# Plan: ae-file-handoff-and-review-contract

## Source

- User-approved implementation scope from the current conversation:
  - add `ae-tools task-brief`
  - add `ae-tools review-package`
  - strengthen `ae-work` with pre-flight conflict scan and recovery guidance
  - strengthen `ae-review` task-level output contract
  - add `Global Constraints` to the AE plan template without replacing `U*` units

## AI Parse Contract

- canonicalKind: plan
- humanEquivalent: true
- stableIdsRequired: true
- noImplicitScope: true

## Scope

Implement low-context file handoff helpers and align the related AE workflow docs and contracts so plan execution and review can move large task text and diffs as files instead of prompt-resident text.

## Readiness

- Goal: Add deterministic AE tooling and documentation for task briefs, review packages, plan global constraints, task-level review verdict shape, and execution recovery/pre-flight behavior.
- Acceptance criteria:
  - `node scripts/ae-tools.mjs task-brief --plan <path> --unit U1` can extract one AE implementation unit into a file artifact.
  - `node scripts/ae-tools.mjs review-package --base <ref> --head <ref>` can write a review bundle artifact with commit list, stat summary, and diff.
  - AE docs describe pre-flight conflict scanning, ledger/git-log based recovery, and the new task review output contract.
  - AE plan template contains a `Global Constraints` section while preserving `U*` implementation units.
- Non-goals:
  - no new standalone execution skill
  - no runtime-specific subagent orchestration port
  - no broad redesign of `task-analyze` unit parsing beyond what the new commands require
- Affected areas:
  - `plugins/ai-agent-engine-codex/scripts/ae-tools.mjs`
  - `tests/skill-scripts.test.mjs`
  - `plugins/ai-agent-engine-codex/skills/ae-work/**`
  - `plugins/ai-agent-engine-codex/skills/ae-review/**`
  - `plugins/ai-agent-engine-codex/skills/ae-plan/**`
  - mirrored `.agents/skills/**`
  - capability catalog mirrors
- Validation surface:
  - focused Node tests for new commands and updated templates/contracts
  - skill mirror/language/contract checks
  - script syntax checks
- Open questions:
  - none; the user selected the implementation priority and allowed execution on `main`

## Assumptions

- `task-brief` should target AE `### U* - ...` units, not Superpowers `Task N`.
- scratch artifacts should live under `docs/ae/evidence/artifacts/` rather than a new gitignored runtime scratch directory, because this repository already treats evidence as first-class process output.
- `review-package` should remain read-only and not depend on external diff tooling.

## Alternatives Considered

- Recommended: implement both helpers as `ae-tools` subcommands and keep artifacts under `docs/ae/evidence/artifacts`.
- Alternative: add separate shell scripts under a skill directory and call them from docs.
- Rejected because: the repository already centralizes deterministic workflow helpers in `ae-tools.mjs`, and script sprawl would increase mirror, install, and validation maintenance cost.

## Decision Drivers

- Driver 1: reduce prompt-resident task/diff payload while keeping repository-native evidence.
- Driver 2: preserve current AE plan structure and Codex-native runtime boundaries.
- Driver 3: minimize maintenance drift across plugin source, `.agents` mirror, tests, and capability metadata.

## Decisions

### ADR-1 - Put file handoff helpers in ae-tools

- Decision: add `task-brief` and `review-package` as `ae-tools` subcommands.
- Drivers: existing deterministic helper pattern, single validation surface, project-local wrapper reuse.
- Alternatives: standalone shell scripts under a skill directory.
- Why chosen: easier cross-platform behavior, easier tests, easier catalog exposure.
- Consequences: `ae-tools.mjs` grows modestly; tests must cover artifact paths and output shape.
- Follow-ups: if more artifact-oriented helpers appear later, consider factoring internal helper functions, not a separate runtime.

### ADR-2 - Keep artifacts under docs/ae/evidence

- Decision: write task brief and review package artifacts into `docs/ae/evidence/artifacts/<kind>/`.
- Drivers: durable recovery, existing evidence ledger model, no hidden gitignored state.
- Alternatives: `.superpowers/sdd/`-style scratch area.
- Why chosen: AE already has explicit evidence storage and recovery commands.
- Consequences: generated files become visible repository artifacts unless ignored or cleaned deliberately.
- Follow-ups: future cleanup/retention policy may be added if artifact volume grows.

## Risks

- task brief extraction may under-select or over-select content if unit parsing is too loose.
- review package range handling may silently mislead if `base`/`head` validation is weak.
- template or skill text changes may break mirror/contract validation.

## Pre-Mortem

- Failure scenario 1: `task-brief` extracts the wrong unit body and a downstream worker uses incomplete requirements.
- Failure scenario 2: `review-package` writes a diff for the wrong commit range and review evidence becomes misleading.
- Failure scenario 3: docs and implementation drift, so users invoke commands with unsupported flags or rely on stale review/output shape.
- Mitigations:
  - add focused tests for multi-unit extraction and explicit output paths
  - validate `base` and `head` refs before diff generation
  - update capability catalog and skill docs in the same patch, then run contract and mirror checks

## Implementation Units

### U1 - Add file handoff command tests

- Goal: lock down desired CLI behavior before implementation.
- Requirements covered: AC1, AC2
- Acceptance criteria covered: new tests fail before implementation and specify artifact shape for both commands.
- Depends on: none
- Files:
  - `tests/skill-scripts.test.mjs`
- Forbidden files:
  - `package.json`
  - `scripts/check-skill-contract.mjs`
- Approach:
  - add tests for `task-brief` unit extraction and `review-package` output bundle generation
  - add assertions for help/catalog-visible command names only if required by existing tests
- Tests:
  - `node --test tests/skill-scripts.test.mjs`
- Validation:
  - targeted test run should fail before implementation for the new command cases
- Rollback signals:
  - tests are too brittle around repository-specific paths or git assumptions
- Deferred to implementation:
  - choose stable artifact path naming compatible with existing evidence layout

### U2 - Implement ae-tools handoff helpers

- Goal: add the new subcommands and supporting artifact helpers.
- Requirements covered: AC1, AC2
- Acceptance criteria covered: `task-brief` and `review-package` generate the expected files and metadata.
- Depends on: U1
- Files:
  - `plugins/ai-agent-engine-codex/scripts/ae-tools.mjs`
  - `plugins/ai-agent-engine-codex/skills/ae-help/references/capability-catalog.json`
  - `.agents/skills/ae-help/references/capability-catalog.json`
- Forbidden files:
  - `tests/check-*`
  - unrelated skill directories
- Approach:
  - add command dispatch entries
  - reuse repository-relative safe path handling
  - parse AE `U*` sections from plan files
  - generate durable artifact files under `docs/ae/evidence/artifacts/task-brief/` and `docs/ae/evidence/artifacts/review-package/`
  - surface concise JSON metadata including artifact path
- Tests:
  - `node --test tests/skill-scripts.test.mjs`
- Validation:
  - new tests pass
  - capability catalog remains readable by help tooling
- Rollback signals:
  - command output shape causes existing consumers or tests to fail in unrelated areas
- Deferred to implementation:
  - whether to add optional custom output path support if simple enough

### U3 - Update AE workflow contracts and templates

- Goal: align docs with the new helper commands and review/plan contract changes.
- Requirements covered: AC3, AC4
- Acceptance criteria covered: skills/templates mention the new pre-flight scan, recovery guidance, review verdict fields, and `Global Constraints`.
- Depends on: U2
- Files:
  - `plugins/ai-agent-engine-codex/skills/ae-work/SKILL.md`
  - `plugins/ai-agent-engine-codex/skills/ae-review/SKILL.md`
  - `plugins/ai-agent-engine-codex/skills/ae-review/references/review-output-template.md`
  - `plugins/ai-agent-engine-codex/skills/ae-plan/references/plan-template.md`
  - `.agents/skills/ae-work/SKILL.md`
  - `.agents/skills/ae-review/SKILL.md`
  - `.agents/skills/ae-review/references/review-output-template.md`
  - `.agents/skills/ae-plan/references/plan-template.md`
- Forbidden files:
  - unrelated README files
  - skill language metadata unless text changes demand it
- Approach:
  - add pre-flight conflict scan guidance to `ae-work`
  - add recovery guidance that explicitly reads `docs/00-process/active/<task>/ledger.jsonl` and `git log`
  - define task-level review output fields in the review template
  - add `Global Constraints` section to the plan template while keeping `Implementation Units`
- Tests:
  - `node --test tests/skill-scripts.test.mjs`
  - `node scripts/check-skill-contract.mjs`
  - `node scripts/check-skill-mirror.mjs`
- Validation:
  - template and mirror checks pass
- Rollback signals:
  - mirror mismatch or skill contract errors appear after doc edits
- Deferred to implementation:
  - none

## Consistency Check

- implementationUnitCount: 3
- sourceRequirementsCovered: inline conversation scope
- sourceRequirementsDeferred: none
- openQuestionsCount: 0

## Validation Plan

- Unit: `node --test tests/skill-scripts.test.mjs`
- Integration: `node scripts/check-skill-contract.mjs`
- User flow: `node scripts/ae-tools.mjs help`, `node scripts/ae-tools.mjs task-brief ...`, `node scripts/ae-tools.mjs review-package ...`
- Data / operations: artifact writes under `docs/ae/evidence/artifacts/`
- Observability: inspect JSON command output and generated artifact paths

## Rollback / Recovery

- revert the new commands and associated tests if artifact generation proves too brittle
- keep plan/template doc updates only if the command layer stabilizes
- use `git log` and generated evidence paths to inspect exactly what changed if recovery is needed

## Plan Self-Review

- Placeholder scan: pass
- Consistency check: pass
- Scope check: focused on the four requested changes only
- Acceptance coverage: all requested items map to implementation units
- Validation gaps: none known; command and mirror validation are explicit
- Alternatives and ADR check: pass
- High-risk pre-mortem check: pass

## Handoff

- Execute with test-first changes in `tests/skill-scripts.test.mjs`, then implement `ae-tools.mjs`, then update mirrored skill docs and templates, then run focused and broader validation.
