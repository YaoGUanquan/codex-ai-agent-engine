---
name: ae-design
description: Use when the user requests AE design, /ae-design, a design contract, PRD-to-plan decisions or revision of an existing design.
---

# AE Design

Create the contract between requirements and an implementation plan, not code.
Read the supplied PRD or old design; preserve stable IDs unless explicitly
superseded. With only a description, resolve PRD-first versus lightweight design.

Inspect relevant repository instructions, dependencies, source, tests and
reusable assets before choosing architecture. A user-requested greenfield or
no-context design may bypass this pass with a recorded reason. Do not inspect
secret-bearing files. Mark conclusions verified, inferred or assumed.

1. Select dimensions from actual API/data/UI/operational risks; justify omitted
   dimensions explicitly.
2. Use [design-contract-template](references/design-contract-template.md):
   stable ADR/EP/T/TC/ST IDs, cross-dimension mappings and implementation
   constraints. Shards belong in the Split Manifest.
3. Link observable tests to covered IDs; review the design before planning.
4. Store artifacts under the resolved documentation space; repository layouts
   use `docs/ae/designs/<topic>-YYYY-MM-DD/`.

## Task References

Read only the row triggered by the task, not the whole table.

| Trigger | Reference |
| --- | --- |
| Selecting dimensions or writing a design contract | [Dimensions and contract](references/design-dimensions.md) |
| Test design and readiness closure | [Tests and review](references/design-testing.md) |

For data-backed queries/writes, use the [data-access contract](../ae-backend/references/data-access-contract.md).
For persistence changes, use [persistence-contract](../ae-backend/references/persistence-contract.md).
For scale-sensitive architecture, use the [scale contract](../ae-help/references/scale-and-distributed-engineering.md).
Do not write code, tests, migrations, CSS or runtime configuration, or invent
missing persistence decisions.
