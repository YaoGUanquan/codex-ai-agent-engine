---
type: plan
status: completed
date: 2026-07-26
title: review-capability-upstream-adaptation
origin: docs/ae/prds/2026-07-26-001-review-capability-upstream-adaptation-prd.md
originFingerprint: 2026-07-26-review-capability-upstream-adaptation
depth: standard
format: human-readable-plan
sharded: false
---

# Plan: Review Capability Upstream Adaptation

## Source

- PRD: `docs/ae/prds/2026-07-26-001-review-capability-upstream-adaptation-prd.md`.
- Audit: `docs/ae/solutions/2026-07-26-review-capability-upstream-audit.md`.

## AI Parse Contract

- canonicalKind: plan
- humanEquivalent: true
- stableIdsRequired: true
- noImplicitScope: true

## Scope

Extend existing review preparation with an exact Git inventory and optional shallow impact context. Keep review judgment human/agent-owned and preserve existing mirror and plugin distribution rules.

## Readiness

- Goal: provide deterministic coverage evidence before diff review without adding a runtime dependency.
- Acceptance criteria: R1-R4 and NFR1-NFR3 from the source PRD.
- Non-goals: persistent graph, external tools, hooks, MCP, model configuration, or a new skill.
- Affected areas: Guardrail (`ae-tools`), Knowledge (`ae-review`), Distribution (mirror and version metadata), and process evidence.
- Validation surface: focused Node tests, mirror/contract checks, artifact checks, full tests, package checks, and diff whitespace check.
- Open questions: none.

## Alternatives Considered

- Recommended: extend `review-package` and reuse the shallow graph only with `--with-impact`.
- Alternative: install `code-review-graph` or `open-code-review` as a runtime dependency.
- Rejected because: operational and licensing surface expands while duplicating current review entrypoints.
- Alternative: add a new Spec Kit-like analyze skill.
- Rejected because: `ae-review` already has traceability and evidence lanes, so a new command would duplicate scope.

## Decision Drivers

- Driver 1: deterministic changed-file coverage.
- Driver 2: bounded, non-overclaiming context expansion.
- Driver 3: preserve the plugin's existing Codex-native distribution model.

## Decisions

### ADR-1 - Optional Advisory Graph Context

- Decision: impact context is opt-in and reports its static-scan limitations.
- Drivers: R2, NFR1, NFR2.
- Alternatives: mandatory graph context; persistent AST/SQLite graph.
- Why chosen: it provides value on coupled source changes without slowing or overclaiming for every review.
- Consequences: reviewers still inspect runtime-specific boundaries independently.
- Follow-ups: only consider persistent analysis after repeated evidence shows shallow context is insufficient.

## Risks

- Git rename and binary output can produce special record shapes.
- The shallow graph can omit runtime or framework dependencies.
- Documentation-only changes could drift from the source mirror.

## Pre-Mortem

- Failure scenario 1: changed files are missed due to status parsing. Mitigation: use Git NUL-delimited output and focused tests.
- Failure scenario 2: reviewers assume the graph proves impact completeness. Mitigation: output and skill instructions label it advisory.
- Failure scenario 3: distributable artifacts diverge. Mitigation: run mirror and version tests plus full checks.

## Implementation Units

### U1 - Add Review Inventory And Advisory Impact Context

- Goal: emit complete changed-file metadata and optional bounded context from the existing review package.
- Requirements covered: R1, R2, NFR1, NFR2.
- Acceptance criteria covered: R1 and R2.
- Depends on: none.
- Files:
  - `plugins/ai-agent-engine-codex/scripts/ae-tools.mjs`
  - `tests/skill-scripts.test.mjs`
- Forbidden files:
  - `package-lock.json`
  - external repository clones
- Approach: parse NUL-delimited Git name-status and numstat output, classify files with the existing graph role mapper, and traverse existing shallow edges only when explicitly requested.
- Tests: extend review-package coverage for inventory and impact fields.
- Validation: `npm test -- --test-name-pattern "review-package|review-contract"`.
- Rollback signals: inventory does not match Git output, renamed/binary input fails, or graph limitations are absent.
- Deferred to implementation: deep language-specific dependency resolution.

### U2 - Strengthen Review Coverage Contract

- Goal: make deterministic inventory and explicit exclusions part of diff-review guidance.
- Requirements covered: R3, R4, NFR2.
- Acceptance criteria covered: R3 and R4.
- Depends on: U1.
- Files:
  - `plugins/ai-agent-engine-codex/skills/ae-review/SKILL.md`
  - `.agents/skills/ae-review/SKILL.md`
- Forbidden files:
  - new `ae-*` skill directories
  - external runtime configuration
- Approach: add preparation guidance and evidence requirements without changing finding severities or enabling external hooks.
- Tests: source/mirror validation.
- Validation: `node scripts/check-skill-mirror.mjs` and `node scripts/check-skill-contract.mjs`.
- Rollback signals: instructions claim complete graph analysis or omit a selected changed file.
- Deferred to implementation: custom path-rule catalogs.

### U3 - Preserve Distribution And Delivery Evidence

- Goal: synchronize version metadata and record audit/PRD/plan/process evidence.
- Requirements covered: R4, NFR3.
- Acceptance criteria covered: R4 and NFR3.
- Depends on: U1, U2.
- Files:
  - `package.json`
  - `plugins/ai-agent-engine-codex/.codex-plugin/plugin.json`
  - `docs/ae/**`
  - `docs/00-process/**`
  - `docs/08-ai-memory/**`
- Forbidden files:
  - external repository clones
  - lockfiles
- Approach: increment both SemVer fields and record source provenance, rejection reasons, validation, and residual limitations.
- Tests: root/plugin version assertion and artifact validation.
- Validation: `npm test`, `npm run check`, `git diff --check`.
- Rollback signals: version mismatch, unverified external claim, or failing project gate.
- Deferred to implementation: release, commit, and push.

## Consistency Check

- implementationUnitCount: 3
- sourceRequirementsCovered: R1, R2, R3, R4, NFR1, NFR2, NFR3
- sourceRequirementsDeferred: none
- openQuestionsCount: 0

## Validation Plan

- Unit: focused review-package test.
- Integration: skill mirror, skill contract, artifact validation, and source-version assertions.
- User flow: run a review package between two temporary Git commits with `--with-impact`.
- Data / operations: no network, persistence, provider, or external runtime mutation.
- Observability: package JSON and Markdown artifact show inventory and advisory limitations.

## Rollback / Recovery

Revert the review-package inventory helpers, paired skill guidance, and version bump together. Review packages without `--with-impact` retain their prior diff artifact behavior plus the new inventory section.

## Plan Self-Review

- Placeholder scan: pass.
- Consistency check: pass.
- Scope check: pass; no external runtime is introduced.
- Acceptance coverage: pass.
- Validation gaps: rename/binary edge cases are parsed defensively but need future dedicated fixtures if expanded.
- Alternatives and ADR check: pass.
- High-risk pre-mortem check: pass.

## Completion Record

- U1: added Git NUL-delimited review inventory, optional bounded shallow impact context, and rename coverage.
- U2: updated paired `ae-review` skill instructions with inventory, exclusion, and advisory-context rules.
- U3: synchronized distributable version `0.3.2` and recorded audit/process evidence.
- Validation: focused review-package tests, `npm test` (83/83), `npm run check`, and `git diff --check` passed.
- Review: reviewer and architect lanes found no blocking issue after clamping the impact scan limit to 1-5000 files.
