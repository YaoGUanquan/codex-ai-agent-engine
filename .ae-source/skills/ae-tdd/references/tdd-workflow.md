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

Frontend test harnesses:

- Use the repository's existing runner, such as Vitest, Jest, or the framework CLI, with its component-testing library before considering any new harness.
- Write the failing test against user-visible behavior: rendered output, roles and labels, and interaction results, not component internals.
- A DOM-simulation pass in jsdom or similar does not prove real-browser behavior such as layout, focus order, or navigation. State that boundary when the change depends on it, and route real-browser acceptance to `ae-test-browser`.
