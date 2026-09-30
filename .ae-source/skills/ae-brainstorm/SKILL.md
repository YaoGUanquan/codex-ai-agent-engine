---
name: ae-brainstorm
description: Use when the user requests ae-brainstorm, /ae-brainstorm, $ae-brainstorm, AE requirement clarification or perspective collision.
---

# AE Brainstorm

Clarify WHAT should be built. Read relevant repository evidence before asking
for discoverable facts. Small, already-clear work needs a confirmed inline
scope, not a new requirements package.

1. Identify the outcome, non-goals, acceptance, affected users/systems and
   validation boundary. Decompose independent systems before refining details.
2. Ask one focused question only when its answer changes a material decision.
   After at most three clarification questions, record remaining assumptions;
   unresolved safety/product decisions remain blockers, not invented defaults.
3. Compare 2-3 approaches only for genuinely competing designs.
4. Write durable requirements only when downstream planning benefits; use
   [requirements-capture](../ae-prd/references/requirements-capture.md).
5. Stop when the agreed scope is ready. Continue to plan/work only when
   requested or part of an authorized workflow.

## Task References

Read only the row triggered by the task, not the whole table.

| Trigger | Reference |
| --- | --- |
| Ambiguous or durable requirements going to planning | [Readiness](references/requirement-readiness.md) |
| Competing values, directions or design-heavy work | [Perspective collision](references/perspective-collision.md) |

For data-backed queries/writes, use the [data-access contract](../ae-backend/references/data-access-contract.md).
For new tables, use [persistence-contract](../ae-backend/references/persistence-contract.md).
For scale/concurrency requirements, use the [scale contract](../ae-help/references/scale-and-distributed-engineering.md).
For workflow sizing, use the [model-adaptation contract](../ae-help/references/model-adaptation-contract.md).
Keep non-software brainstorming free of forced software sections.
