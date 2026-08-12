---
name: ae-refactor
description: Use when the user asks for AE refactor, /ae-refactor, refactoring plan, behavior-preserving redesign, cleanup plan, module split, migration plan, or wants refactor risk and validation before coding.
---

# AE Refactor

Plan behavior-preserving refactors before implementation.

## Workflow

1. Inspect the current behavior, call sites, tests, and module boundaries.
2. Define behavior that must not change.
3. Break the refactor into small units with owned files and dependency order.
4. Specify validation for each unit and rollback signals.
5. Write a plan under `docs/ae/plans/` when the refactor has meaningful risk.
6. Route execution to `ae-work` only after Git/worktree safety checks.

## Rules

- Do not mix product behavior changes into a refactor unless the user explicitly asks.
- Preserve public API contracts unless the plan calls out migration steps.
- Prefer incremental changes that can be reviewed and validated independently.
