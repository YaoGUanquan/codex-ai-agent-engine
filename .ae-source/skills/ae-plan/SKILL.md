---
name: ae-plan
description: Use when the user requests ae-plan, /ae-plan, $ae-plan, or an implementation, technical, or design plan before coding.
---

# AE Plan

Create a repository-grounded plan; do not implement product code.

1. Confirm the goal, acceptance signal, non-goals, affected area, and
   validation surface.
2. Use the lightweight lane for a precise low-risk change; use standard/deep
   only for ambiguity, cross-module work, or public/data/security/deployment
   boundaries.
3. Keep units independently verifiable with explicit files, dependencies,
   validation, rollback, and forbidden scope.
4. For a lightweight plan, include frontmatter, `AI Parse Contract`,
   `Scope`/`Readiness`, one `U1` unit, and `Consistency Check`; keep goal,
   acceptance, non-goals, ownership, dependencies, validation and rollback.
   Omit approach comparisons and pre-mortems for this lane.
5. Stop after writing the requested plan; do not route automatically to review
   or implementation.

## Task References

Read only the row triggered by the task, not the whole table.

| Trigger | Reference |
| --- | --- |
| Writing a durable plan | [Artifact fields](references/plan-artifact.md) |
| Standard/deep plan, material choice or cross-artifact work | [Planning decisions and self-review](references/planning-decisions.md) |

Use [plan-template](references/plan-template.md) for standard/deep artifacts.
For data-backed queries/writes, use the [data-access contract](../ae-backend/references/data-access-contract.md).
For large/distributed changes, use the [scale contract](../ae-help/references/scale-and-distributed-engineering.md).
For workflow sizing, use the [model-adaptation contract](../ae-help/references/model-adaptation-contract.md).
Use [validation-evidence-profile](references/validation-evidence-profile.md)
only for API, persistence, external-service, browser or deployment boundaries.
Write no product code, do not invent requirements, and keep artifact paths
repository-relative or in the project's resolved external documentation space.
