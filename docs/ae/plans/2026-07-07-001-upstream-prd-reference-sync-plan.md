---
type: plan
status: completed
date: 2026-07-07
title: upstream-prd-reference-sync
depth: standard
format: human-readable-plan
sharded: false
---

# Plan: upstream-prd-reference-sync

## Source

- User request: execute the recommended first optimization from the upstream AE audit.
- Upstream source: `https://gitee.com/jiangqiang1996/ai-agent-engine`.
- Observed upstream HEAD: `760cc5b548d3f82c5db764fc01b98d7874867b95`.
- Prior local baseline: `b50ca004a6b4300f4ad5d8d281bcb17d4be1b392`.
- Prior analysis found that `ae-prd` references `references/requirements-capture.md`, but both plugin source and `.agents` mirror lack that file.

## AI Parse Contract

- canonicalKind: plan
- humanEquivalent: true
- stableIdsRequired: true
- noImplicitScope: true

## Scope

### Include

- Restore `ae-prd` reference completeness in plugin source and `.agents` mirror.
- Add a Codex-native PRD handoff reference if the skill points to it.
- Update source metadata from the prior upstream baseline to the observed upstream HEAD.
- Add regression coverage so missing `ae-prd` reference files and stale upstream metadata are caught.

### Exclude

- No direct OpenCode runtime port.
- No new public skill entrypoint.
- No `ae-design` skill creation.
- No broad rewrite of `ae-review` or `ae-work` in this pass.
- No dependency or lockfile change.

### Constraints

- Keep plugin source and `.agents/skills` mirror synchronized.
- Rewrite upstream ideas in Codex-native terms; do not copy runtime assumptions such as OpenCode `question` tools or slash command execution.
- Use repository-relative paths in AE artifacts and skill guidance.

## Requirements Traceability

| Requirement ID | Plan response |
| --- | --- |
| R1 | U1, U2 |
| R2 | U3 |
| R3 | U4 |

## High-Level Technical Design

- Treat this as a skill-contract repair, not a feature expansion.
- Keep `ae-prd/SKILL.md` concise and place long template rules in reference files.
- Use tests to verify file existence and stable source metadata before changing skill content.

### Key Decisions

- D1. First pass focuses on `ae-prd` only -> Reason: it has a confirmed broken reference today.
- D2. Metadata updates are included -> Reason: the local catalog claims a stale upstream commit after the latest audit.
- D3. Review/work upstream changes are deferred -> Reason: they require broader runtime-boundary rewriting and tool compatibility checks.

## Implementation Units

### U1. Add failing regression coverage

- [ ] Goal: prove the current repo misses required `ae-prd` references and stale source metadata before implementation.
- [ ] Covered requirements: R1, R2, R3
- [ ] Unique output: failing test in `tests/skill-scripts.test.mjs`.
- [ ] Depends on: none
- Depends on: none
- [ ] Files:
  - `tests/skill-scripts.test.mjs`
- [ ] Method:
  - Add assertions for plugin and mirror `ae-prd/references/requirements-capture.md`.
  - Add assertions for plugin and mirror `ae-prd/references/handoff.md`.
  - Add assertion that capability catalog observed commit equals `760cc5b548d3f82c5db764fc01b98d7874867b95`.
- [ ] Tests:
  - Red path: `node --test --test-name-pattern "upstream PRD reference sync" tests/skill-scripts.test.mjs`
- [ ] Validation:
  - The new test must fail before implementation.

### U2. Restore PRD reference files

- [ ] Goal: make every reference named by `ae-prd` exist in source and mirror.
- [ ] Covered requirements: R1
- [ ] Unique output: PRD requirements capture and handoff references exist under both skill roots.
- [ ] Depends on: U1
- Depends on: U1
- [ ] Files:
  - `plugins/ai-agent-engine-codex/skills/ae-prd/references/requirements-capture.md`
  - `.agents/skills/ae-prd/references/requirements-capture.md`
  - `plugins/ai-agent-engine-codex/skills/ae-prd/references/handoff.md`
  - `.agents/skills/ae-prd/references/handoff.md`
- [ ] Method:
  - Use the current upstream structure as reference input.
  - Rewrite content for Codex-native AE paths and available local skills.
  - Avoid claiming OpenCode interactive tooling or `ae-design` availability.
- [ ] Tests:
  - Green path: `node --test --test-name-pattern "upstream PRD reference sync" tests/skill-scripts.test.mjs`
- [ ] Validation:
  - `node scripts/check-skill-mirror.mjs`

### U3. Update source freshness metadata

- [ ] Goal: record the latest observed upstream commit consistently.
- [ ] Covered requirements: R2
- [ ] Unique output: capability catalog and port analysis point to `760cc5b548d3f82c5db764fc01b98d7874867b95`.
- [ ] Depends on: U1
- Depends on: U1
- [ ] Files:
  - `plugins/ai-agent-engine-codex/skills/ae-help/references/capability-catalog.json`
  - `.agents/skills/ae-help/references/capability-catalog.json`
  - `docs/codex-port-analysis.md`
  - `docs/08-ai-memory/05-decision-log.md`
- [ ] Method:
  - Update only freshness evidence and decision-log baseline wording.
  - Do not claim all upstream behavior has been ported.
- [ ] Tests:
  - `node --test --test-name-pattern "upstream PRD reference sync" tests/skill-scripts.test.mjs`
- [ ] Validation:
  - `node scripts/check-skill-mirror.mjs`
  - `node scripts/check-skill-language-metadata.mjs`

### U4. Validate and gate

- [ ] Goal: prove the scoped sync is complete and does not break existing AE checks.
- [ ] Covered requirements: R3
- [ ] Unique output: validation command results and final gate proof.
- [ ] Depends on: U2, U3
- Depends on: U2, U3
- [ ] Files:
  - optional `docs/ae/gates/<timestamp>-work-final.json`
- [ ] Method:
  - Run narrow tests first, then broader checks.
  - Run review-oriented inspection by checking diff and contract consistency.
- [ ] Tests:
  - `node --test --test-name-pattern "upstream PRD reference sync" tests/skill-scripts.test.mjs`
  - `node scripts/check-skill-mirror.mjs`
  - `node scripts/check-skill-contract.mjs`
  - `node scripts/check-skill-language-metadata.mjs`
  - `node scripts/check-ae-artifacts.mjs`
  - `npm test`
  - `npm run check`
  - `git diff --check`
- [ ] Validation:
  - Final gate with `node scripts/ae-tools.mjs gate --workflow work --checkpoint final --plan docs/ae/plans/2026-07-07-001-upstream-prd-reference-sync-plan.md --validation "<commands>" --review-status not_run --worktree-decision rejected --write-proof`

## Risks And Mitigations

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Reference content imports OpenCode-only assumptions | Codex users get impossible instructions | Rewrite for Codex-native paths and skill names |
| Stale metadata is updated without evidence | Audit trail weakens | Cite observed `git ls-remote` commit in plan and docs |
| New test is too brittle | Maintenance overhead | Assert file existence and key contract phrases, not long paragraphs |

## Pending Questions

### Deferred To Execution

- Q1. Whether `ae-prd/SKILL.md` needs wording changes after references are restored. Decide only if tests or contract checks show the current pointer is ambiguous.

## Consistency Check

- implementationUnitsCount: 4
- tracedRequirementsCount: 3
- decisionsCount: 3
- risksCount: 3

## Completion Record

- Completed: 2026-07-07.
- Execution route: `ae-lfg` with `ae-work` execution and TDD.
- U1 result: added failing regression coverage in `tests/skill-scripts.test.mjs`; RED failed because `plugins/ai-agent-engine-codex/skills/ae-prd/references/requirements-capture.md` did not exist.
- U2 result: added mirrored `ae-prd/references/requirements-capture.md` and `ae-prd/references/handoff.md`.
- U3 result: updated capability catalog, port analysis, and decision log to observed upstream HEAD `760cc5b548d3f82c5db764fc01b98d7874867b95`.
- U4 result: validation passed.
- Validation passed:
  - `node --test --test-name-pattern "upstream PRD reference sync" tests/skill-scripts.test.mjs`
  - `node scripts/check-skill-mirror.mjs`
  - `node scripts/check-skill-contract.mjs`
  - `node scripts/check-skill-language-metadata.mjs`
  - `node scripts/check-ae-artifacts.mjs`
  - `node scripts/check-install-smoke.mjs`
  - `npm test`
  - `npm run check`
  - `git diff --check`
- Deferred work: broader upstream `ae-review` dispatch/synthesis adaptation and `ae-work` worktree handoff strengthening remain separate follow-up work.
