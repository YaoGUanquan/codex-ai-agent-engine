---
type: plan
status: completed
date: 2026-06-08
title: multi-agent-execution-config
---

# Plan: multi-agent-execution-config

## Source

User requested implementation of the prior recommendation: add an optional, disabled-by-default multi-agent execution configuration for AE skills so large tasks can use parallel agents safely when enabled.

## Scope

Add configuration-aware analysis and skill guidance for multi-agent execution. Keep the runtime conservative: no automatic spawning is introduced by scripts, and write-agent parallelism remains gated by Codex tool availability, clean Git state, plan dependencies, and disjoint file ownership.

## Readiness

- Goal: Make AE task analysis and skill docs support an opt-in multi-agent execution policy.
- Acceptance criteria:
  - `.codex/ae-skill-profiles.yaml` example documents the safe `multi_agent.enabled: auto` analysis default.
  - `task-analyze` reports effective multi-agent config, strategy, read/write lane eligibility, blockers, owned files, forbidden files, and parallel waves.
  - `ae-work`, `ae-review`, and `ae-plan` explain how to use the config without forcing parallel writes.
  - Tests cover disabled defaults, enabled suggest-mode analysis, read-only review lanes, write-worker pre-edit gating, forbidden-file parsing, and dependency punctuation.
- Non-goals: Build a real agent registry, auto-spawn agents from `ae-tools`, or force a minimum of three workers.
- Affected areas: `plugins/ai-agent-engine-codex/scripts/ae-tools.mjs`, skill docs in plugin and `.agents` mirror, profile template, smoke checks, tests.
- Validation surface: `npm test`, `npm run check`, targeted `task-analyze` command.
- Open questions: none blocking.

## Assumptions

- Codex sub-agent spawning remains an orchestration behavior controlled by the host, not a script-side runtime.
- Existing plans may not declare dependencies; in that case enabled multi-agent write execution should be blocked or downgraded.
- Read-only review lanes are lower risk than parallel write workers.
- `parallel_eligibility` can remain as a compatibility summary, but new orchestration should use `read_parallel_eligibility` and `write_parallel_eligibility`.

## Alternatives Considered

- Recommended: Add config-aware analysis with safe defaults and wave suggestions.
- Alternative: Add a new `ae-multi-agent` skill. Rejected for now because the behavior belongs in existing `ae-work` and `ae-review` decisions.
- Alternative: Enable at least three write workers whenever configured. Rejected because file ownership and dependencies decide safe parallelism, not a fixed worker count.

## Decision Drivers

- Driver 1: Preserve current single-agent behavior unless the user or operator opts in.
- Driver 2: Make parallelism explainable and auditable before any worker is spawned.
- Driver 3: Keep plugin source and `.agents/skills` mirror synchronized.

## Decisions

### ADR-1 - Config-Gated Multi-Agent Execution

- Decision: Extend `.codex/ae-skill-profiles.yaml` with `multi_agent` and teach `task-analyze` to emit execution strategy, lane-specific eligibility, owned/forbidden file boundaries, and waves.
- Drivers: reuse existing profile path, avoid runtime registry assumptions, keep defaults safe.
- Alternatives: separate config file, new skill, hard-coded parallelism.
- Why chosen: the existing profile template already handles optional local behavior and safe defaults.
- Consequences: plans need explicit `Depends on`, `Files`, and `Forbidden files` fields to unlock safe parallel execution.
- Follow-ups: a future MCP/server implementation could consume the same output to automate spawning.

## Risks

- Existing plans may produce conservative serial recommendations until they declare dependencies clearly.
- YAML parsing is intentionally lightweight; supported config should remain simple scalars and mappings.
- Parallel execution quality still depends on the orchestrating agent respecting owned/forbidden file boundaries.

## Pre-Mortem

- Failure scenario 1: Enabled config causes unsafe write parallelism on overlapping files.
- Failure scenario 2: Missing or punctuated dependency declarations are treated as safe or incomplete.
- Failure scenario 3: Installed templates drift from smoke-check expectations.
- Mitigations: require disjoint file checks, block or downgrade when dependency markers are missing, normalize dependency IDs, keep forbidden files separate from owned files, add tests and install smoke checks.

## Implementation Units

### U1 - task-analyze config and waves

- Goal: Add effective multi-agent config, strategy, lane-specific blockers, owned/forbidden file boundaries, and parallel wave output.
- Requirements covered: config-aware execution analysis.
- Acceptance criteria covered: `task-analyze` reports defaults, enabled suggest-mode waves, read/write lane eligibility, conservative write-spawn readiness, forbidden files, and dependency punctuation handling.
- Depends on: none.
- Files:
  - `plugins/ai-agent-engine-codex/scripts/ae-tools.mjs`
  - `tests/skill-scripts.test.mjs`
- Approach: load `.codex/ae-skill-profiles.yaml` when present, clamp `multi_agent`, parse plan dependencies and file boundary fields, compute non-conflicting waves, and keep old fields as compatibility summaries.
- Tests: add Node test cases with temporary worktrees and plan files.
- Validation: `node --test tests/skill-scripts.test.mjs`.
- Rollback signals: existing `task-analyze` tests or smoke checks fail.
- Deferred to implementation: none.

### U2 - skill and profile documentation

- Goal: Document the opt-in behavior in planner, worker, reviewer, and profile template.
- Requirements covered: skill guidance and disabled default.
- Acceptance criteria covered: profile example includes `multi_agent.enabled: false`; skill docs define safe use.
- Depends on: U1.
- Files:
  - `docs/ae/templates/ae-skill-profiles.example.yaml`
  - `plugins/ai-agent-engine-codex/skills/ae-plan/SKILL.md`
  - `plugins/ai-agent-engine-codex/skills/ae-plan/references/plan-template.md`
  - `plugins/ai-agent-engine-codex/skills/ae-work/SKILL.md`
  - `plugins/ai-agent-engine-codex/skills/ae-review/SKILL.md`
  - `.agents/skills/ae-plan/SKILL.md`
  - `.agents/skills/ae-plan/references/plan-template.md`
  - `.agents/skills/ae-work/SKILL.md`
  - `.agents/skills/ae-review/SKILL.md`
- Approach: update wording and mirror plugin source to installed skill copy.
- Tests: install smoke checks.
- Validation: `node scripts/check-skill-mirror.mjs`, `node scripts/check-install-smoke.mjs`.
- Rollback signals: mirror check fails or profile defaults become ambiguous.
- Deferred to implementation: none.

### U3 - install and final gates

- Goal: Verify installed profile metadata and full project checks.
- Requirements covered: validation and delivery evidence.
- Acceptance criteria covered: smoke output includes multi-agent disabled default.
- Depends on: U1, U2.
- Files:
  - `scripts/check-install-smoke.mjs`
- Approach: assert installed template contains `multi_agent`, disabled default, and max worker guard.
- Tests: update existing smoke test expectations.
- Validation: `npm test`, `npm run check`, final AE gate.
- Rollback signals: full check fails.
- Deferred to implementation: none.

## Validation Plan

- Unit: `node --test tests/skill-scripts.test.mjs`.
- Integration: `node scripts/check-skill-mirror.mjs`, `node scripts/check-install-smoke.mjs`.
- User flow: run `node scripts/ae-tools.mjs task-analyze --mode plan --plan docs/ae/plans/2026-06-08-001-multi-agent-execution-config-plan.md`.
- Data / operations: no data writes outside repository files.
- Observability: final gate proof under `docs/ae/gates`.

## Rollback / Recovery

Revert this branch's edits if task-analyze output breaks existing consumers. Because old fields remain present, expected rollback risk is limited to newly added lane-specific output and docs. Consumers should migrate from `parallel_eligibility.can_spawn_write_agents` to `write_parallel_eligibility.config_allows_write_agents` plus an independently completed Pre-Edit Gate.

## Plan Self-Review

- Placeholder scan: pass.
- Consistency check: pass.
- Scope check: pass.
- Acceptance coverage: pass.
- Validation gaps: none known.
- Alternatives and ADR check: pass.
- High-risk pre-mortem check: pass.

## Handoff

Executed inline on branch `codex/optimize-multi-agent-logic`; do not spawn write workers for this implementation because the files are tightly coupled.

## Completion Record

- Completed: 2026-06-16 follow-up alignment included.
- Archive: `docs/00-process/archive/2026-06/multi-agent-execution-config/progress.md`.
- Work report: `docs/ae/work-reports/2026-06-08-multi-agent-auto-config-report.md`.
- Durable memory: `docs/08-ai-memory/09-multi-agent-auto-config.md`.
- Validation evidence: `npm.cmd test`, `npm.cmd run check`, `node scripts/check-skill-mirror.mjs`, `node scripts/check-install-smoke.mjs`, and `node scripts/ae-tools.mjs task-analyze --mode plan --plan docs/ae/plans/2026-06-08-001-multi-agent-execution-config-plan.md` passed during the recorded implementation and follow-up passes.
