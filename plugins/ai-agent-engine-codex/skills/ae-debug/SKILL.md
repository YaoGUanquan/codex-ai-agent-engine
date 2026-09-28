---
name: ae-debug
description: Use when the user asks for AE debug, /ae-debug, investigate a failing build, broken UI, runtime error, failing test, API incident, or reproduce-and-fix troubleshooting workflow.
---

# AE Debug

For saturation, concurrency or distributed incidents, use the [scale and distributed engineering contract](../ae-help/references/scale-and-distributed-engineering.md). Correlate bounded samples across stages, separate timeout from terminal failure, and preserve existing job/checkpoint identity before any authorized recovery.

Before reproducing a test or runtime failure, read the [test side-effect boundary](../ae-help/references/test-side-effect-boundary.md). Do not probe or connect to a user-managed MySQL or other datastore; use captured evidence, static inspection, fixtures, or a proven isolated profile and mark missing isolation `blocked`.

Investigate a failure systematically before changing code.

For slow lists/counts, N+1, bulk persistence or async-job failures, use the [data-access and scale contract](../ae-backend/references/data-access-contract.md) to trace generated SQL, count/data timings, call counts, transaction/flush boundaries, pool/queue pressure and committed progress. Read its framework reference only for the actual stack. Keep diagnosis read-only when a fix was not requested; do not invent a root cause or replace the architecture merely because data is large.

## Operating Principles

- Reproduce or capture the failure before explaining it.
- Build and run one tight, deterministic, red-capable feedback loop before moving to hypotheses; rank 3-5 falsifiable hypotheses to avoid anchoring.
- Minimise the reproduction, redact secrets from evidence, tag temporary diagnostics, and remove them before completion.
- Fix the nearest proven cause, then widen only if evidence requires it.
- Preserve the failure evidence and validation command in the final report.

## Workflow

1. Read `references/debugging-workflow.md`.
2. Reproduce the failure or capture the best available evidence: exact error text, command, route, request, screenshot, or log excerpt.
3. Identify the nearest failing path in the repository instead of starting with a broad redesign.
4. Form 3-5 ranked concrete hypotheses and test one falsifiable prediction at a time.
5. Apply the smallest fix that matches the observed evidence.
6. Add a regression test or equivalent validation when practical.
7. Report the observed failure, root-cause evidence, fix, validation, and any remaining unknowns.

When the user explicitly requests a local runtime smoke for a changed API or UI surface, read [the local runtime smoke gate](../ae-work/references/local-runtime-smoke-gate.md). Use it after the failing path is understood; do not treat an authentication or transport failure as proof of the business behavior.

## Rules

- Do not claim a root cause without evidence from code, logs, commands, or browser behavior.
- Do not hide a reproduction gap; state it explicitly if you cannot reproduce.
- Prefer `ae-test-browser` for UI investigations that require a real browser.
- Prefer `ae-sql` when the failure is tied to schema, data shape, or query behavior.
- Avoid speculative rewrites when the failing path is narrow.
- If the symptom disappears during investigation, report the last known evidence and what remains unproven.
- If no red-capable loop can be built, stop and report the missing environment or artifact instead of guessing.
