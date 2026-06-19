---
type: plan
status: completed
date: 2026-06-12
title: claude-code-delegate-skill
origin: docs/ae/brainstorms/2026-06-12-claude-code-delegate-skill-requirements.md
---

# Plan: Claude Code Delegate Skill

## Source

User requested a new branch and a new skill that can let Codex call local Claude Code CLI to complete work. The requirements artifact records the safe default: controlled delegation, not unattended takeover.

## Scope

Add a new `ae-claude-code` skill, local wrapper support, help/metadata integration, install smoke coverage, and tests.

## Readiness

- Goal: make the new Claude Code delegation skill visible and testable.
- Acceptance criteria: help search works, availability check is stable, mirrors are synchronized, tests pass.
- Non-goals: installing Claude, managing auth, direct default writes.
- Affected areas: skills, metadata, `ae-tools`, install smoke tests, docs/ae artifacts.
- Validation surface: `claude-delegate --check`, mirror/language checks, `npm test`, `npm run check`.
- Open questions: exact Claude CLI flags remain configurable.

## Assumptions

- The local `claude` command may be absent; this must be a non-failing skip for checks.
- Users who want direct writes can opt in later through explicit command flags and isolated worktree rules.

## Alternatives Considered

- Recommended: skill plus deterministic wrapper.
- Alternative: skill-only instructions.
- Rejected because: skill-only instructions repeat error handling and cannot be smoke-tested.

## Decision Drivers

- Driver 1: preserve Codex as the AE orchestrator.
- Driver 2: make absence of local Claude explicit and non-destructive.
- Driver 3: keep installation and metadata checks deterministic.

## Decisions

### ADR-1 - Controlled External Worker

- Decision: represent Claude Code CLI as a controlled worker, not a replacement orchestrator.
- Drivers: safety, debuggability, AE gate compatibility.
- Alternatives: direct automatic write delegation; no CLI integration.
- Why chosen: it provides the requested effect while preserving validation and user-change protection.
- Consequences: users need Codex to inspect and apply Claude output.
- Follow-ups: direct isolated-write mode can be expanded once a real local Claude CLI contract is observed.

### ADR-2 - Wrapper Command

- Decision: add `node scripts/ae-tools.mjs claude-delegate`.
- Drivers: deterministic checks, stable JSON output, reusable invocation path.
- Alternatives: call `claude` directly from skill instructions.
- Why chosen: scripts can be tested and can normalize missing CLI behavior.
- Consequences: `ae-tools` gains a small external-tool command.
- Follow-ups: update default CLI args if Claude Code CLI changes.

## Risks

- Local CLI may not support the expected non-interactive mode.
- Users may expect the skill to install Claude or grant permissions automatically.
- Direct writes are unsafe without isolation.

## Pre-Mortem

- Failure scenario 1: `claude` is missing and validation fails. Mitigation: `--check` returns `status: skip`.
- Failure scenario 2: Claude CLI flags differ. Mitigation: support configurable `--claude-arg` values.
- Failure scenario 3: Claude output is treated as verified work. Mitigation: skill requires Codex review and validation before applying.

## Implementation Units

### U1 - Skill and Metadata

- Goal: add `ae-claude-code` skill and UI metadata.
- Requirements covered: 1, 2, 3, 4, 5, 7.
- Acceptance criteria covered: mirror files and install metadata.
- Depends on: none
- Files:
  - `plugins/ai-agent-engine-codex/skills/ae-claude-code/SKILL.md`
  - `plugins/ai-agent-engine-codex/skills/ae-claude-code/agents/openai.yaml`
  - `.agents/skills/ae-claude-code/SKILL.md`
  - `.agents/skills/ae-claude-code/agents/openai.yaml`
  - `plugins/ai-agent-engine-codex/scripts/skill-language-metadata.mjs`
- Forbidden files: package lockfiles.
- Approach: create concise skill instructions and metadata matching existing AE patterns.
- Tests: metadata and mirror checks.
- Validation: `node scripts/check-skill-mirror.mjs`, `node scripts/check-skill-language-metadata.mjs`.
- Rollback signals: metadata mismatch or skill missing from mirror.
- Deferred to implementation: exact Chinese display text may follow existing encoded file convention.

### U2 - Wrapper Command and Help Catalog

- Goal: add `claude-delegate` command and help entry.
- Requirements covered: 2, 3, 5, 6, 7.
- Acceptance criteria covered: help and `--check`.
- Depends on: U1
- Files:
  - `plugins/ai-agent-engine-codex/scripts/ae-tools.mjs`
  - `plugins/ai-agent-engine-codex/skills/ae-help/references/capability-catalog.json`
  - `.agents/skills/ae-help/references/capability-catalog.json`
- Forbidden files: generated build output.
- Approach: implement availability check and guarded invocation with JSON output.
- Tests: add CLI tests.
- Validation: `node scripts/ae-tools.mjs help claude`, `node scripts/ae-tools.mjs claude-delegate --check`.
- Rollback signals: unknown command, non-JSON output, failing when CLI is missing.
- Deferred to implementation: no real Claude invocation is required in this environment.

### U3 - Install Smoke and Regression Tests

- Goal: make the new skill covered by install and test scripts.
- Requirements covered: all.
- Acceptance criteria covered: `npm test`, `npm run check`.
- Depends on: U1, U2
- Files:
  - `scripts/check-install-smoke.mjs`
  - `tests/skill-scripts.test.mjs`
- Forbidden files: `.tmp-install-smoke-checks` persisted output.
- Approach: extend existing expected lists and add focused command assertions.
- Tests: `npm test`.
- Validation: `npm run check`.
- Rollback signals: install smoke fails or check script misses new files.
- Deferred to implementation: none.

## Validation Plan

- Unit: run `node scripts/ae-tools.mjs claude-delegate --check`.
- Integration: run mirror, language metadata, and install smoke scripts.
- User flow: run `node scripts/ae-tools.mjs help claude`.
- Data / operations: no external writes or network calls.
- Observability: final gate records commands run.

## Rollback / Recovery

Remove the new skill folders, metadata entry, help entry, command branch, and tests. Re-run mirror and install checks.

## Plan Self-Review

- Placeholder scan: no placeholders remain.
- Consistency check: plan aligns with safe delegated-worker requirement.
- Scope check: one branch, one implementation pass.
- Acceptance coverage: all acceptance criteria map to U1-U3 and validation.
- Validation gaps: real Claude invocation is not validated because CLI is absent; availability skip is validated.
- Alternatives and ADR check: material alternatives are recorded.
- High-risk pre-mortem check: external CLI and write safety risks are covered.

## Handoff

Completed and archived. The original implementation added `ae-claude-code`, `claude-delegate`, metadata/help integration, install smoke coverage, and tests. Follow-up passes added Windows `.cmd/.bat` shim support and changed prompt delivery to stdin for the default `claude -p` invocation.

Archive: `docs/00-process/archive/2026-06/claude-code-delegate-skill/progress.md`.
