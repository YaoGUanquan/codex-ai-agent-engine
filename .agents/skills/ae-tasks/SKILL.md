---
name: ae-tasks
description: Use when the user asks for AE tasks, task breakdown, dependency-ordered implementation tasks, task IDs, parallel markers, file-level task lists, or turning an approved AE plan into executable task artifacts.
---

# AE Tasks

Turn an approved AE plan into a dependency-ordered task artifact for larger implementations.

## Workflow

1. Read the source plan fully. Do not create tasks from an unclear or unreviewed plan.
2. Check that each implementation unit has goal, files, dependencies, validation, and rollback signal.
3. Create `docs/ae/tasks/YYYY-MM-DD-<topic>-tasks.md` when a durable task list will help execution or handoff.
4. Use task IDs such as `T001`, `T002`, and group them by phase or user-visible slice.
5. Mark parallel-safe tasks with `[P]` only when they touch disjoint files and have no ordering dependency.
6. Include exact file paths for each task whenever possible.
7. End with validation tasks that prove the acceptance criteria and plan gates.

## Task Format

```markdown
- [ ] T001 [phase] Create <path> for <specific outcome>
- [ ] T002 [P] [phase] Update <path> with <specific outcome>
- [ ] T003 [validation] Run <command> and record result
```

## Rules

- Do not add implementation behavior that is absent from the approved plan.
- Do not mark tasks parallel-safe based only on intuition; file ownership and dependencies must support it.
- Do not turn tiny single-step work into a task artifact unless the user asks.
- Route inconsistent plans to `ae-review domain:document` before task generation.
