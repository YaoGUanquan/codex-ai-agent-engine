---
type: plan
status: ready
date: 2026-09-10
title: model-adaptive-instruction-governance
origin: docs/ae/prds/2026-09-10-model-adaptive-instruction-governance-prd.md
originFingerprint: 2026-09-10-model-adaptive-instruction-governance
depth: deep
format: human-readable-plan
sharded: false
---

# Plan: Model-Adaptive Instruction Governance

## AI Parse Contract

- canonicalKind: plan
- humanEquivalent: true
- stableIdsRequired: true
- noImplicitScope: true

## Readiness

- Goal: improve init-generated guidance and core AE orchestration for current and future high-capability Codex models without model-name coupling.
- Acceptance: AC1-AC6 from the source PRD.
- Non-goals: provider catalogs, reasoning metadata, automatic thread rotation, blanket skill rewrites, hard metrics, or forced delegation.
- Validation: focused Node tests, full tests, contract checks, install smoke, release checks, and diff review.
- Open decisions: none.

## Alternatives

1. Add GPT-5.6/GPT-6 branches to each skill. Rejected because model labels and provider capabilities drift and would duplicate instruction bodies.
2. Change only init templates. Rejected because users can invoke installed skills without initializing a project.
3. Add one model-neutral contract, integrate core workflow owners, and strengthen init generation. Selected because it covers installed-skill and initialized-project paths with bounded duplication.

## Implementation Units

### U1 - Shared model-adaptation contract

- Requirements: R5-R8.
- Depends on: none.
- Files: `plugins/ai-agent-engine-codex/skills/ae-help/references/model-adaptation-contract.md`, mirrored `.ae-source` path.
- Forbidden: provider catalogs, Codex configuration, context-continuity implementation.
- Validation: source/mirror equality and skill-doc assertions.
- Rollback: remove the paired reference if it conflicts with higher-priority project rules or claims unsupported runtime behavior.

### U2 - Profile-aware init guidance

- Requirements: R1-R4, R6.
- Depends on: U1.
- Files: both init `agents.md` templates, `init.mjs`, `tests/ae-tools.test.mjs`, and the root `AGENTS.md` legacy managed-region migration.
- Approach: add profile-rendered engineering and validation placeholders; classify discovered package scripts without inventing commands.
- Validation: focused init tests for minimal, core, bilingual, command order, and bounded managed regions.
- Rollback: restore the previous placeholders and templates if generated output becomes verbose or unstable.

### U3 - Core skill integration

- Requirements: R5-R7.
- Depends on: U1.
- Files: source and mirror copies of `ae-brainstorm`, `ae-lfg`, `ae-plan`, `ae-work`, `ae-review`, `ae-init`, and `ae-help`; `tests/skills-docs.test.mjs`.
- Approach: add concise routing clauses, not copied contract bodies; preserve each skill's existing ownership.
- Validation: focused skill-doc tests, mirror and link checks.
- Rollback: remove individual routing clauses without removing the shared contract.

### U4 - Relative reference guardrail

- Requirements: R6, R9; AC5.
- Depends on: U3.
- Files: `scripts/check-skill-contract.mjs`, related tests.
- Approach: validate repository-relative Markdown links in skill documents and references while ignoring URLs and anchors.
- Validation: contract-check fixtures plus full `npm run check`.
- Rollback: narrow the parser if valid documentation constructs produce false positives.

### U5 - Release and delivery evidence

- Requirements: R9.
- Depends on: U2-U4.
- Files: version manifests, README/CHANGELOG pairs, process/review/gate artifacts.
- Validation: `npm test`, `npm run check`, `npm run check:smoke`, `node scripts/check-release-notes.mjs`, `git diff --check`.
- Proof boundary: local repository and distribution contracts only; runtime behavior across every model/provider remains unverified.

## Risks And Pre-Mortem

- Failure: the shared contract becomes another long mandatory prompt. Mitigation: keep it short and load it only through core workflow routing.
- Failure: generated commands are invalid. Mitigation: emit only existing package scripts and test deterministic ordering.
- Failure: model adaptation is confused with provider metadata repair. Mitigation: explicit non-goal and model-label prohibition.
- Failure: new release changes overwrite existing 0.3.42 work. Mitigation: preserve the current diff and layer 0.3.43 notes above it.

## Consensus Gate

- Requirements: confirmed by the user's request and repository evidence.
- Plan: self-reviewed; no unresolved product decisions.
- Document review: required before implementation; blocking findings must be resolved.
- Worktree: dirty on `main`; existing changes are user-owned and must be preserved.
- Execution: serial because core skill and release files overlap.

## Plan Self-Review

- Scope and non-goals are explicit.
- Every requirement maps to U1-U5.
- Source/mirror and release boundaries are covered.
- No model capability or runtime acceptance is inferred from static checks.
- No placeholder or unresolved decision remains.
