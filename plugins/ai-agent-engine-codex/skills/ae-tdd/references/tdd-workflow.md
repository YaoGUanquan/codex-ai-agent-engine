# TDD Workflow

Use this loop:

1. Write the failing test.
2. Run it and confirm the failure reason matches the target behavior.
3. Make the smallest implementation change needed to pass.
4. Re-run the target test.
5. Run nearby tests when the change touches shared behavior.
6. Refactor only with passing tests.

When not to force TDD:

- the repository lacks a runnable test harness,
- the change is purely documentary,
- the work is exploratory and the behavior is not yet defined.
