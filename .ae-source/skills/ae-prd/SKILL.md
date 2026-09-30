---
name: ae-prd
description: Use when the user requests ae-prd, /ae-prd, $ae-prd, AE PRD or a durable WHAT-before-HOW requirements artifact.
---

# AE PRD

Capture WHAT/WHY, not implementation. Recover only the explicitly referenced
PRD or one created in this session; do not resume similar historical work.

1. Inspect relevant project context, then choose quick answer, lightweight,
   standard or deep PRD.
2. Confirm the problem, outcome, acceptance, boundaries and material decisions.
   Ask one focused question when necessary; record assumptions separately.
3. Keep requirements behavior-focused with stable IDs and concrete acceptance.
4. When durable output helps, use
   [requirements-capture](references/requirements-capture.md) in the resolved
   documentation space (`docs/ae/prds/` for repository docs).
5. Stop at readiness; significant PRDs may need document review before an
   explicitly requested planning stage.

## Task References

Read only the row triggered by the task, not the whole table.

| Trigger | Reference |
| --- | --- |
| Creating/updating a durable PRD or verifying its readiness | [Artifact and evidence](references/prd-artifact.md) |

For data-backed queries/writes, use the [data-access contract](../ae-backend/references/data-access-contract.md).
For persistence changes, use [persistence-contract](../ae-backend/references/persistence-contract.md).
For large/distributed requirements, use the [scale contract](../ae-help/references/scale-and-distributed-engineering.md).
Keep unknown budgets, validation gaps and unresolved decisions visible.
Do not implement code or promote assumptions into requirements.
