---
name: ae-debug
description: Use when the user asks for AE debug, /ae-debug, investigate a failing build, broken UI, runtime error, failing test, API incident, or reproduce-and-fix troubleshooting workflow.
---

# AE Debug

Investigate a failure systematically before changing code.

## Workflow

1. Read `references/debugging-workflow.md`.
2. Reproduce the failure or capture the best available evidence: exact error text, command, route, request, screenshot, or log excerpt.
3. Identify the nearest failing path in the repository instead of starting with a broad redesign.
4. Form one or more concrete hypotheses and test them with disconfirming checks.
5. Apply the smallest fix that matches the observed evidence.
6. Add a regression test or equivalent validation when practical.
7. Report the observed failure, root-cause evidence, fix, validation, and any remaining unknowns.

## Rules

- Do not claim a root cause without evidence from code, logs, commands, or browser behavior.
- Do not hide a reproduction gap; state it explicitly if you cannot reproduce.
- Prefer `ae-test-browser` for UI investigations that require a real browser.
- Prefer `ae-sql` when the failure is tied to schema, data shape, or query behavior.
- Avoid speculative rewrites when the failing path is narrow.
