---
type: plan
status: completed
date: 2026-08-03
title: portable-browser-review-optimization
origin: docs/ae/prds/2026-08-03-external-skill-optimization-prd.md
originFingerprint: 2026-08-03-external-skill-optimization
depth: standard
format: human-readable-plan
sharded: false
---

# Plan: Portable Browser And Review Optimization

## Authorization And Scope

The user selected the two recommendations deferred by Q1 in the source PRD: improve `ae-test-browser` and `ae-review`. This plan implements only portable guidance in existing skills. It does not install, copy, or execute an external skill or runtime.

## Constraints

- Keep canonical plugin skills and `.agents/skills` mirrors byte-equivalent.
- Do not add a skill, dependency, runtime hook, browser helper, agent registry, or background process.
- Retain the existing undelivered `0.3.7` distribution version, which already covers the combined pending skill-content changes; both manifests remain synchronized.
- Preserve the existing retirement worktree changes and `docs/ae/security-scans/`.

## Implementation Units

### U1 - Browser reconnaissance and stability guidance

- Goal: require reconnaissance before business interaction, bounded `networkidle` use, and black-box helper-script evidence.
- Files: plugin and mirror `ae-test-browser/SKILL.md`; plugin and mirror `references/browser-acceptance.md`.
- Acceptance: a non-settling page records its polling/streaming limitation and falls back to stable DOM plus console/network evidence; a successful helper script alone cannot be claimed as browser acceptance.
- Rollback: remove the added guidance from both source and mirror if it conflicts with a future verified Codex browser contract.

### U2 - Protected simplification review guidance

- Goal: prevent `delete` and `shrink` recommendations from treating locally unfamiliar protection as dead code.
- Files: plugin and mirror `ae-review/SKILL.md`.
- Acceptance: a reviewer must establish behavior baseline, call-path/consumer evidence, and design reason when available; incomplete evidence is a verification gap, not a removal recommendation.
- Rollback: remove the paired guidance only if a future reviewed rule proves it conflicts with a concrete review workflow.

### U3 - Contract regression and delivery checks

- Goal: make the new guidance durable and prove distribution consistency.
- Files: `tests/skill-scripts.test.mjs` and this plan.
- Validation: `npm test`, `npm run check`, `node scripts/check-skill-mirror.mjs`, `node scripts/check-skill-contract.mjs`, `node scripts/check-ae-artifacts.mjs`, and `git diff --check`.
- Deferred: PlanningwithFiles/Ralph mappings remain in existing `ae-lfg`, `ae-work`, and `ae-task-loop`; AgentStudio vocabulary, SkillCreator examples, UIUXProMax data/CLI, and the ambiguous CodeReview candidate receive no implementation in this change.

## Completion Evidence

- U1 and U2 were implemented in the listed source and mirror paths.
- U3 is satisfied only when every listed command succeeds; static contract checks do not prove arbitrary future model behavior or a live application flow.
