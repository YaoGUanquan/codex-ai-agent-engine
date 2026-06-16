---
name: ae-work
description: Use when the user asks for AE work, /ae-work, execute an AE plan, implement this plan, or perform a tightly scoped engineering change with validation and delivery evidence. This skill may edit files, but only after Git/worktree safety checks.
---

# AE Work

Execute a plan or tightly scoped task with safety checks, validation, and delivery evidence.

## Operating Principles

- Read before editing and let the repository's existing structure decide the shape of the change.
- Prefer the smallest behaviorally complete patch over broad cleanup.
- Keep a clear chain from request, to changed files, to validation evidence.
- Surface uncertainty early when it affects correctness, data safety, or public contracts.

## Pre-Edit Gate

Before modifying any project file, run and inspect:

```powershell
git status --short
git branch --show-current
git log --oneline -1
```

If the directory is not a Git repository, say so and use `worktree_decision: not_applicable`.

Then decide with the user when needed:

- default branch or dirty worktree: explain the risk and ask before continuing, creating a branch, or creating a worktree.
- feature branch and clean worktree: continue unless the task is risky enough to need a worktree.
- if the plan touches shared config, auth, public contracts, or a risky refactor, propose an isolated branch or worktree and a baseline validation pass before editing.
- Git writes such as commit, reset, clean, rebase, push, or worktree add require explicit user approval and Codex escalation rules.

## Task Analysis

For a plan file, run:

```powershell
node scripts/ae-tools.mjs task-analyze --mode plan --plan <path>
```

For a plain task, run:

```powershell
node scripts/ae-tools.mjs task-analyze --mode scan --task "<description>"
```

Use the result to choose inline, serial, or parallel execution. Spawn sub-agents only when the user explicitly allowed parallel agent work and file ownership is disjoint. Use `references/work-subagent-template.md` for delegated prompts.

If `.codex/ae-skill-profiles.yaml` contains `multi_agent.enabled: auto` or `multi_agent.enabled: true`, treat `task-analyze` as the source of truth for `execution_strategy`, `read_parallel_eligibility`, `write_parallel_eligibility`, `parallel_waves`, and each unit's owned `files` plus `forbidden_files`. `parallel_eligibility` remains a compatibility summary and must not be used as the sole write-worker gate.

- `auto` enabled state means automatically analyze whether parallel work is safe. It does not mean scripts spawn agents.
- `suggest` mode may recommend waves, but the orchestrating agent must still decide whether to spawn sub-agents.
- `review_only` mode allows `read_parallel_eligibility.can_parallelize` and parallel read-only review lanes, but keeps write workers disabled.
- `auto` mode is eligible for write workers only when `write_parallel_eligibility.config_allows_write_agents` is true, `write_parallel_eligibility.blockers` is empty, the Pre-Edit Gate confirmed a clean safe branch, plan units declare dependencies, and file ownership is disjoint.
- `write_parallel_eligibility.can_spawn_write_agents_now` is false until the orchestrating agent has independently completed the Pre-Edit Gate for the current worktree.
- `multi_agent.enabled: false` is a hard off switch and must force serial execution.
- Never force a minimum of three workers. Use no more than the safe units in the current wave and no more than `multi_agent.max_workers`.
- If `read_parallel_eligibility.blockers` or `write_parallel_eligibility.blockers` are non-empty for the lane you intend to use, fall back to serial execution or report the blocker instead of guessing.

## Execution Rules

- Read the plan and referenced files first.
- If the plan references a constitution, checklist, or task artifact, read it before editing and treat unresolved blockers as pre-implementation blockers.
- Execute one implementation unit or one small checkpoint at a time.
- Keep changes scoped to the assigned unit or task.
- Do not overwrite user-owned unrelated changes.
- Establish a baseline when the task is a bug fix or behavior-sensitive refactor.
- Add tests or update existing tests when behavior changes.
- Stop and report blockers when the failure mode invalidates the current step or assumptions.
- Run the narrowest meaningful validation, then broader validation when practical.
- Track validation commands exactly for final reporting.
- When using a task artifact, mark or report task completion only after the corresponding file change or validation evidence exists.
- Prefer ae-debug for investigation-heavy failures and ae-tdd when the user wants or the change benefits from red-green-refactor discipline.
- Do not bundle opportunistic refactors, formatting churn, dependency upgrades, or unrelated test rewrites into the task.
- If verification cannot be run, name the exact blocker and the residual risk.

## Cleanup Gate

Before final validation, inspect the files changed in this task for AI-generated cleanup risks:

- fallback-like code that silently swallows errors, returns fabricated defaults, or hides missing integration work,
- dead code, duplicate helpers, unused flags, speculative abstractions, or placeholder branches,
- broad formatting churn unrelated to the task,
- tests that assert implementation details without protecting the requested behavior,
- comments or names that describe intent inaccurately after the edit.

Fix only deterministic issues inside the current task scope. Do not expand cleanup into unrelated refactors. If a suspicious pattern may be intentional, record it as residual risk or route to ae-review instead of rewriting product behavior.

## Shipping

Read `references/shipping-workflow.md` before final response.

When ready, run a final gate, for example:

```powershell
node scripts/ae-tools.mjs gate --workflow work --checkpoint final --plan <path> --validation "npm test" --review-status not_run --worktree-decision rejected --write-proof
```

Final response sections: completed, verified, unverified/unable to verify, Git operations, gate result, residual risks.
