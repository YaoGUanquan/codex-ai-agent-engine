---
name: ae-refactor
description: Use when the user asks for AE refactor, /ae-refactor, refactoring plan, behavior-preserving redesign, cleanup plan, module split, migration plan, or wants refactor risk and validation before coding.
---

# AE Refactor

Plan behavior-preserving refactors before implementation.

Use the deep-module vocabulary when it improves a decision: module, interface, seam, adapter, depth, locality, and leverage. Apply the deletion test before proposing a wrapper or split: if deleting the module only moves complexity, it is shallow and the refactor needs a stronger seam. Record the behavior baseline, design alternatives, and the evidence that makes the proposed seam real rather than hypothetical.

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
