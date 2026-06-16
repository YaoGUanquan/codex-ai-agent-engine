# Multi-Agent Lane Eligibility

## Context

The multi-agent task analysis contract needed to match current Codex subagent guidance: read-heavy subagents are useful for review, exploration, triage, and summarization, while write-heavy parallel work needs stronger coordination and pre-edit checks.

## Problem

The previous `task-analyze` output mixed read-only and write-worker readiness into one `parallel_eligibility` object. That caused three concrete risks:

- `review_only` mode blocked parallel read-only reviewer lanes.
- `parallel_eligibility.can_spawn_write_agents` could be read as immediate write-spawn approval before the Git Pre-Edit Gate.
- `Forbidden files:` in plans was not represented separately from owned `Files:`.

During validation, a fourth issue surfaced: `Depends on: U1, U2.` dropped `U2` because dependency IDs did not strip trailing punctuation.

## Decision

Split the output contract:

- `read_parallel_eligibility` controls read-only lanes.
- `write_parallel_eligibility` controls write-worker config readiness.
- `parallel_eligibility` remains as a conservative compatibility summary and never claims write agents can spawn immediately.
- `write_parallel_eligibility.can_spawn_write_agents_now` remains false until the orchestrating agent verifies the active worktree.

Plan parsing now keeps `files` and `forbidden_files` separate and normalizes dependency IDs with common trailing punctuation.

## Validation

Commands used:

```bash
npm.cmd test
npm.cmd run check
node scripts/ae-tools.mjs task-analyze --mode plan --plan docs/ae/plans/2026-06-08-001-multi-agent-execution-config-plan.md
node scripts/check-skill-mirror.mjs
```

## Reusable Lesson

When an agent orchestration feature has both read-only and write-capable modes, do not express readiness as one boolean. Split the contract by permission lane, keep compatibility fields conservative, and make any state that depends on the current worktree explicitly unverifiable until the orchestrator runs the gate.
