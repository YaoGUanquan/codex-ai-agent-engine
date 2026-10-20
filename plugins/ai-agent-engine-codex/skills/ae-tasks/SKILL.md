---
name: ae-tasks
description: Use only when explicitly requested as $ae-tasks or its named AE capability. Scope includes the user asks for AE tasks, task breakdown, dependency-ordered implementation tasks, task IDs, parallel markers, file-level task lists, or turning an approved AE plan into executable task artifacts.
---

# AE Tasks

For multi-unit team work, load the [adaptive team contract](../ae-help/references/team-execution.md). For large-scale execution, also use the [scale and distributed engineering contract](../ae-help/references/scale-and-distributed-engineering.md).

Turn an approved AE plan into a dependency-ordered task artifact for larger implementations.

## Workflow

1. Read the source plan fully. Do not create tasks from an unclear or unreviewed plan.
2. Carry each unit's Role, Depends on, Files, Read-only files, Shared resources, Acceptance, Data Access Budget, Forbidden files, validation and rollback signal into its tasks. Use the canonical role catalog linked by the team contract; one role may have multiple instances.
3. Create `docs/ae/tasks/YYYY-MM-DD-<topic>-tasks.md` when a durable task list will help execution or handoff.
4. Use task IDs such as `T001`, `T002`, and group them by phase or user-visible slice.
5. Mark candidate parallel-safe tasks with `[P]` only after checking exclusive writes, reader/writer file conflicts, business dependencies and shared-resource access. Shared reads are safe; an overlapping resource with any writer requires serialization. Different files alone do not prove independence.
6. Include exact file paths for each task whenever possible.
7. End with validation tasks that prove the acceptance criteria and plan gates.
8. Treat each task as a tracer-bullet slice: it must have one observable outcome, be independently verifiable or explicitly blocked by a dependency, and name the issue or artifact that records its status.
9. Keep blocking edges explicit. An issue may track task status and dependencies, but it must link to the canonical plan/task artifact rather than copying its intent.

## Task Format

```markdown
- [ ] T001 [phase] Create <path> for <specific outcome>
- [ ] T002 [P] [phase] Update <path> with <specific outcome>
- [ ] T003 [validation] Run <command> and record result
```

For each implementation task, append the unit fields above and its source `U*`
ID. `Files` grants writable ownership; `Read-only files` grants none. Declare
shared API/state-machine/schema/config keys as `key=read` or `key=write`, or
`none` after inspection. Keep budgets concise and mark inapplicable ones.
Legacy task lines remain valid; missing fields need manual reconciliation
before delegation and never prove business independence.

## Rules

- Do not add implementation behavior that is absent from the approved plan.
- Do not mark tasks parallel-safe based only on intuition; file ownership and dependencies must support it.
- Do not turn tiny single-step work into a task artifact unless the user asks.
- Route inconsistent plans to `ae-review domain:document` before task generation.
- Do not call a task complete because files changed; require its stated observable outcome and validation evidence.
- The parent technical lead accepts the actual diff and acceptance evidence before marking a unit passed or releasing dependents. Candidate waves and worker messages do not prove completion; failed/blocked/cancelled units cannot release dependents.
- Keep tiny tasks inline. Reuse the approved plan and its approval across normal phases; seek a new decision only for a material contract change affecting the assignment.
