---
name: ae-tdd
description: Use when the user asks for AE TDD, /ae-tdd, red-green-refactor, test-first implementation, or a regression-safe bug fix with a failing test first.
---

# AE TDD

Use red-green-refactor when the behavior is precise enough to test before implementation.

## Workflow

1. Read `references/tdd-workflow.md`.
2. Identify the behavior to lock down and the smallest test surface that proves it.
3. Write or update a failing test first.
4. Run the target test and confirm it fails for the expected reason.
5. Implement the smallest production change needed to make that test pass.
6. Re-run the target test, then run broader validation if the change touches shared behavior.
7. Refactor only after the behavior is protected by passing tests.
8. Report the failing test, the fix, and the final validation commands.

## Rules

- Do not call the workflow TDD if the failing test never ran before the implementation.
- If the repository has no usable test harness, say so and fall back to the narrowest practical verification.
- Keep the first failing test focused on the requested behavior, not a broad integration path unless that is the only credible proof.
- Use `ae-work` for the broader execution flow when the task includes more than the TDD loop itself.
