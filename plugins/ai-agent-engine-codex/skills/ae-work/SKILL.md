---
name: ae-work
description: Use when the user asks for AE work, /ae-work, execute an AE plan, implement this plan, or perform a tightly scoped engineering change with validation and delivery evidence. This skill may edit files, but only after Git/worktree safety checks.
---

# AE Work

Execute a plan or tightly scoped task with safety checks, validation, and delivery evidence.

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

## Execution Rules

- Read the plan and referenced files first.
- Execute one implementation unit or one small checkpoint at a time.
- Keep changes scoped to the assigned unit or task.
- Do not overwrite user-owned unrelated changes.
- Establish a baseline when the task is a bug fix or behavior-sensitive refactor.
- Add tests or update existing tests when behavior changes.
- Stop and report blockers when the failure mode invalidates the current step or assumptions.
- Run the narrowest meaningful validation, then broader validation when practical.
- Track validation commands exactly for final reporting.
- Prefer ae-debug for investigation-heavy failures and ae-tdd when the user wants or the change benefits from red-green-refactor discipline.

## Shipping

Read `references/shipping-workflow.md` before final response.

When ready, run a final gate, for example:

```powershell
node scripts/ae-tools.mjs gate --workflow work --checkpoint final --plan <path> --validation "npm test" --review-status not_run --worktree-decision rejected --write-proof
```

Final response sections: completed, verified, unverified/unable to verify, Git operations, gate result, residual risks.
