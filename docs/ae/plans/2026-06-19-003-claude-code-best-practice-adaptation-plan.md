---
type: plan
status: completed
date: 2026-06-19
title: claude-code-best-practice-adaptation
origin: docs/ae/prds/2026-06-19-003-claude-code-best-practice-adaptation-prd.md
supersededBy: docs/ae/plans/2026-06-19-004-claude-code-best-practice-detailed-execution-plan.md
---

# Plan: claude-code-best-practice-adaptation

> Status: superseded by `docs/ae/plans/2026-06-19-004-claude-code-best-practice-detailed-execution-plan.md`, which was implemented and merged in commit `3e7f01a`.

## Source

- PRD: `docs/ae/prds/2026-06-19-003-claude-code-best-practice-adaptation-prd.md`
- Audit: `docs/ae/solutions/2026-06-19-claude-code-best-practice-audit.md`
- External source: `https://github.com/shanraisshan/claude-code-best-practice`

## Scope

Adapt portable workflow guidance from the external repository into existing AE skills and docs. Do not port Claude runtime behavior.

## Readiness

- Goal: improve AE audit, creation, delegation, planning, review, and memory guidance.
- Acceptance criteria: source/mirror skill updates, focused tests, concise docs, and validation gates.
- Non-goals: no `.claude` runtime vendoring, no hooks/MCP auto-loading, no broad permission defaults.
- Affected areas: AE skills, help catalog, tests, memory/docs.
- Validation surface: mirror checks, metadata checks, AE artifact checks, tests, package check, diff check.
- Open questions: whether `ae-claude-code` needs new CLI flags or documentation-only fallback.

## Assumptions

- Existing AE skills can absorb the first implementation pass.
- The external MIT repository is used as reference input only.
- Any source-derived copying would need a separate license/notice pass; this plan assumes rewrite-only adaptation.

## Alternatives Considered

- Recommended: improve existing AE skills and tests.
- Alternative: create a new `ae-extension-router` skill.
- Rejected because: the current need is shared guidance across `ae-skill-creator`, `ae-agent-creator`, and `ae-skill-audit`; a new entrypoint would duplicate existing boundaries before proving independent value.

## Decision Drivers

- Preserve Codex-native approval and skill model.
- Reduce repeated judgment in external audits and skill creation.
- Keep maintenance cost low by avoiding runtime feature ports.

## Decisions

### ADR-1 - Rewrite Patterns, Do Not Vendor Runtime

- Decision: adapt taxonomy and deterministic checks only.
- Drivers: GPL-2.0-only project, Codex approval model, existing AE mirror architecture.
- Alternatives: copy `.claude` examples or build Codex hook runtime.
- Why chosen: copied runtime behavior would be brittle and platform-specific.
- Consequences: implementation is mostly skill guidance, tests, and documentation.
- Follow-ups: revisit only if Codex exposes stable project-level hooks or scheduled tasks.

### ADR-2 - Existing Skills First

- Decision: update existing skills before creating a new router or verifier skill.
- Drivers: avoid entrypoint sprawl, keep help catalog concise, reuse installed AE workflows.
- Alternatives: add `ae-extension-router` and `ae-verify`.
- Why chosen: current guidance maps cleanly to existing skills.
- Consequences: tests must cover multiple skill files and mirrors.
- Follow-ups: split only when guidance grows beyond a single skill's responsibility.

## Risks

- Overfitting AE to Claude Code terminology.
- Making help output too verbose.
- Treating second-model advice as verified evidence.
- Introducing mirror drift between plugin source and `.agents/skills`.

## Pre-Mortem

- Failure scenario 1: new guidance says "command" or "hook" in a way users mistake for Codex runtime support.
- Failure scenario 2: `ae-claude-code` documentation encourages cross-directory reads but the wrapper cannot support them cleanly.
- Failure scenario 3: tests check for generic words but not the actual boundary language.
- Mitigations: use Codex-native terms, document direct-CLI fallback separately, and assert specific phrases in source and mirror.

## Implementation Units

### U1 - Audit Classification Guidance

- Goal: strengthen external audit classification.
- Requirements covered: 1, 7.
- Acceptance criteria covered: documentation records license compatibility and rejected runtime assumptions.
- Depends on: none.
- Files:
  - `plugins/ai-agent-engine-codex/skills/ae-skill-audit/SKILL.md`
  - `.agents/skills/ae-skill-audit/SKILL.md`
- Forbidden files:
  - external clone files
  - `.claude/**`
- Approach: add explicit source freshness, license, inspected files, runtime-boundary, and deterministic-pattern checks.
- Tests:
  - add focused assertions to `tests/skill-scripts.test.mjs`.
- Validation:
  - `npm.cmd test -- --test-name-pattern "Claude Code best practice adaptation"`
  - `node scripts/check-skill-mirror.mjs`
- Rollback signals: audit guidance permits copying runtime artifacts or omits license notes.
- Deferred to implementation: exact wording and test fixture strings.

### U2 - Skill And Agent Routing Matrix

- Goal: help creators choose the correct AE artifact type.
- Requirements covered: 2, 3.
- Acceptance criteria covered: future implementation improves existing AE skills before proposing new skills.
- Depends on: U1.
- Files:
  - `plugins/ai-agent-engine-codex/skills/ae-skill-creator/SKILL.md`
  - `.agents/skills/ae-skill-creator/SKILL.md`
  - `plugins/ai-agent-engine-codex/skills/ae-agent-creator/SKILL.md`
  - `.agents/skills/ae-agent-creator/SKILL.md`
- Forbidden files:
  - `plugins/ai-agent-engine-codex/skills/ae-help/references/capability-catalog.json`
- Approach: add a compact Codex-native decision matrix for skill, agent prompt, helper script, reference/template, process artifact, defer, or reject.
- Tests:
  - assert matrix concepts exist in source and mirror.
- Validation:
  - `node scripts/check-skill-mirror.mjs`
  - `npm.cmd test`
- Rollback signals: guidance implies Claude slash commands or auto agents are available in Codex.
- Deferred to implementation: whether a separate template is warranted.

### U3 - Claude Delegate Robustness Guidance

- Goal: make cross-model delegation evidence explicit.
- Requirements covered: 4, 5.
- Acceptance criteria covered: Claude advice is treated as untrusted until reviewed.
- Depends on: none.
- Files:
  - `plugins/ai-agent-engine-codex/skills/ae-claude-code/SKILL.md`
  - `.agents/skills/ae-claude-code/SKILL.md`
  - optionally `scripts/ae-tools.mjs`
  - optionally `plugins/ai-agent-engine-codex/scripts/ae-tools.mjs`
- Forbidden files:
  - lockfiles
  - external clone files
- Approach: first document direct CLI fallback for `--add-dir`, read-only tools, and no-output diagnostics; only edit scripts if a small diagnostic addition is approved.
- Tests:
  - if scripts change, add tests for empty stdout diagnostic and mirror install smoke.
- Validation:
  - `node scripts/ae-tools.mjs claude-delegate --check`
  - `npm.cmd test`
  - `npm.cmd run check`
- Rollback signals: wrapper starts allowing write-capable Claude delegation by default.
- Deferred to implementation: new wrapper flags versus documentation-only guidance.

### U4 - Cross-Model Plan Review Lane

- Goal: make optional second-model review explicit in planning/review.
- Requirements covered: 5.
- Acceptance criteria covered: validation and evidence are clear.
- Depends on: U3.
- Files:
  - `plugins/ai-agent-engine-codex/skills/ae-plan/SKILL.md`
  - `.agents/skills/ae-plan/SKILL.md`
  - `plugins/ai-agent-engine-codex/skills/ae-review/SKILL.md`
  - `.agents/skills/ae-review/SKILL.md`
- Forbidden files:
  - `scripts/**`
- Approach: add guidance for when Claude review is useful, what prompt contract it needs, and how Codex must verify or reject its output.
- Tests:
  - assert second-model evidence and untrusted-advice language.
- Validation:
  - `node scripts/check-skill-mirror.mjs`
  - `npm.cmd test`
- Rollback signals: plans require Claude by default or mark Claude output as verified.
- Deferred to implementation: no dedicated `ae-verify` skill in this pass.

### U5 - Memory And Help Surface

- Goal: record stable memory boundaries and concise help/capability wording.
- Requirements covered: 6, 7.
- Acceptance criteria covered: help/catalog updates stay concise.
- Depends on: U1, U2, U3, U4.
- Files:
  - `plugins/ai-agent-engine-codex/skills/ae-save-experience/SKILL.md`
  - `.agents/skills/ae-save-experience/SKILL.md`
  - `docs/08-ai-memory/03-key-workflows.md`
  - `docs/08-ai-memory/05-decision-log.md`
  - optionally `plugins/ai-agent-engine-codex/skills/ae-help/references/capability-catalog.json`
- Forbidden files:
  - README files unless explicitly approved.
- Approach: add a short memory placement rule and only minimal help wording if needed.
- Tests:
  - `node scripts/check-skill-language-metadata.mjs`
  - `node scripts/check-ae-artifacts.mjs`
- Validation:
  - `npm.cmd run check`
  - `git diff --check`
- Rollback signals: help catalog becomes a Claude feature catalog or memory docs store one-off task logs.
- Deferred to implementation: whether to add a reusable template under `docs/ae/templates`.

## Validation Plan

- Unit: focused `node --test` assertions for skill text.
- Integration: `node scripts/check-skill-mirror.mjs` and install smoke through `npm.cmd run check`.
- User flow: run `node scripts/ae-tools.mjs help claude` and inspect concise output if help catalog changes.
- Data / operations: no data migration or runtime service change.
- Observability: process note and solution doc provide audit evidence.

## Rollback / Recovery

- Revert only the implementing skill/doc/test changes from the future implementation branch.
- If script changes are made and delegation behavior regresses, revert script changes while keeping documentation guidance.
- Use mirror check output to identify source/mirror drift.

## Plan Self-Review

- Placeholder scan: no placeholders remain.
- Consistency check: scope, decisions, units, and validation align.
- Scope check: no implementation code is changed by this plan.
- Acceptance coverage: every PRD requirement maps to at least one unit.
- Validation gaps: direct Claude CLI cross-directory behavior remains an open implementation decision.
- Alternatives and ADR check: existing-skills-first choice is recorded.
- High-risk pre-mortem check: runtime port and delegation evidence risks are covered.

## Handoff

Use `ae-work` only after approving this plan. Keep external repository material as reference input and rewrite all local guidance in project language.
