---
name: ae-lfg
description: Use when the user explicitly requests ae-lfg, /ae-lfg, $ae-lfg, or the full AE workflow for genuinely multi-step engineering work.
---

# AE LFG

Use the smallest route that satisfies the request. Do not turn a direct answer,
small fix, read-only review, or Git-only request into the full pipeline.

1. Read [task-routing](references/task-routing.md) and classify the request.
2. For S1/S2/S3/S5/S6, hand off once to the narrower skill and stop.
3. For genuine S4 work, load [pipeline](references/pipeline.md) and only the
   references required by the selected stage.
4. Preserve the user's scope, acceptance boundary, and evidence tier. Do not
   repeat completed scans or ceremonies.
5. Before helper commands, resolve `aeEntry` using
   [runtime-entry](../ae-help/references/runtime-entry.md).

An explicit `ae-lfg` invocation does not widen a narrower request. For S7,
finish implementation, review and validation before separately authorized
Git/review/deploy actions. A Git request does not authorize deployment.

## Task References

Read only the row triggered by the task, not the whole table.

| Trigger | Reference |
| --- | --- |
| Genuine S4 or multi-step S7 implementation stage | [Recovery, consensus and full pipeline](references/full-workflow.md) |

For data-backed queries/writes, use the [data-access contract](../ae-backend/references/data-access-contract.md).
For scale-sensitive work, use the [scale contract](../ae-help/references/scale-and-distributed-engineering.md).
For workflow sizing and recovery, use the [model-adaptation contract](../ae-help/references/model-adaptation-contract.md).

Stop at acceptance, a real blocker, or the declared work budget. Never claim a
higher validation tier from a lower one.
