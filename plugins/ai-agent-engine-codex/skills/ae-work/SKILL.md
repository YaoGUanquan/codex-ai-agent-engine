---
name: ae-work
description: Use when the user requests ae-work, /ae-work, $ae-work, execution of an approved AE plan, or a tightly scoped engineering change.
---

# AE Work

Implement only the approved scope and preserve unrelated work.

1. Inspect `git status --short`, `git branch --show-current`, and
   `git log --oneline -1`. Preserve unrelated changes; resolve unsafe worktree
   decisions before editing. Git writes require explicit authorization.
2. Read the plan and direct references; use `task-analyze` only when a plan or
   dependency boundary requires it.
3. Choose the smallest behaviorally complete change. Add focused tests when
   behavior changes.
4. Validate from the narrowest meaningful check upward and record the exact
   result. Do not claim runtime or deployment proof from static checks.
5. Stop at acceptance, a real blocker, or the declared budget.

Before helper commands, resolve `aeEntry` with
[runtime-entry](../ae-help/references/runtime-entry.md).

For a small task, inspect direct paths, implement, test, review the scoped diff,
and report results inline. Do not create task scans or gate artifacts for
ceremony. Delegation is serial by default and needs explicit user authorization.
Safety controls and explicit requirements are not simplification targets.

## Task References

Read only the row triggered by the task, not the whole table.

| Trigger | Reference |
| --- | --- |
| Approved multi-unit plan or non-trivial implementation | [Execution](references/task-execution.md) |
| Explicitly authorized delegation | [Ownership and worker gates](references/task-delegation.md) |
| Changed capability claims or explicit shipping gate | [Claim and shipping evidence](references/claim-and-shipping.md) |

For data-backed queries/writes, use the [data-access contract](../ae-backend/references/data-access-contract.md).
For large/concurrent/distributed work, use the [scale contract](../ae-help/references/scale-and-distributed-engineering.md).
For workflow sizing or recovery, use the [model-adaptation contract](../ae-help/references/model-adaptation-contract.md).
Load
[local-runtime-smoke-gate](references/local-runtime-smoke-gate.md) only when a
local runtime smoke is explicitly requested.
