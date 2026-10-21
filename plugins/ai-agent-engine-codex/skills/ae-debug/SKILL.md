---
name: ae-debug
description: Use when the user names AE debug (ae-debug, /ae-debug, $ae-debug, "AE 调试") to investigate a failure with AE reproduce-and-fix workflow.
---

# AE Debug

For saturation, concurrency or distributed incidents, use the [scale and distributed engineering contract](../ae-help/references/scale-and-distributed-engineering.md). Correlate bounded samples across stages, separate timeout from terminal failure, and preserve existing job/checkpoint identity before any authorized recovery.

Before reproducing a test or runtime failure, read the [test side-effect boundary](../ae-help/references/test-side-effect-boundary.md). Do not probe or connect to a user-managed MySQL or other datastore; use captured evidence, static inspection, fixtures, or a proven isolated profile and mark missing isolation `blocked`.

Investigate a failure systematically before changing code.

Use the [validation contract](../ae-help/references/validation-contract.md) for targeted reproduction, evidence reuse and test stopping.

For slow lists/counts, N+1, bulk persistence or async-job failures, use the [data-access and scale contract](../ae-backend/references/data-access-contract.md) to trace generated SQL, count/data timings, call counts, transaction/flush boundaries, pool/queue pressure and committed progress. Read its framework reference only for the actual stack. Keep diagnosis read-only when a fix was not requested; do not invent a root cause or replace the architecture merely because data is large.

## Operating Principles

- Reproduce or capture the failure before explaining it.
- Prefer one tight, deterministic, red-capable feedback loop when it can be built. When it cannot, continue read-only analysis of logs, call chains, configuration, and existing evidence, and state the reproduction gap.
- Form falsifiable hypotheses only when evidence is ambiguous; never pad to a fixed count such as 3-5.
- Missing environment blocks only dependent repair/acceptance, not independent investigation. Insufficient evidence is not a confirmed root cause or a proven fix.
- Minimise the reproduction, redact secrets from evidence, tag temporary diagnostics, and remove them before completion.
- Fix the nearest proven cause, then widen only if evidence requires it.
- Preserve the failure evidence and validation command in the final report.
- Keep isolation tests, authorization boundaries, and the ban on unauthorized user-database connections.

## Workflow

1. Read `references/debugging-workflow.md`.
2. Reproduce the failure or capture the best available evidence: exact error text, command, route, request, screenshot, or log excerpt.
3. Identify the nearest failing path in the repository instead of starting with a broad redesign.
4. When evidence is ambiguous, form only the necessary falsifiable hypotheses and test one prediction at a time. When the cause is already clear, skip speculative hypothesis lists.
5. Apply the smallest fix that matches the observed evidence when the required environment exists and the fix is authorized.
6. Add a regression test or equivalent validation when practical.
7. Report the observed failure, root-cause evidence (or explicit gap), fix (if any), validation, and any remaining unknowns.

When the user explicitly requests a local runtime smoke for a changed API or UI surface, read [the local runtime smoke gate](../ae-work/references/local-runtime-smoke-gate.md). Use it after the failing path is understood; do not treat an authentication or transport failure as proof of the business behavior.

## Rules

- Do not claim a root cause without evidence from code, logs, commands, or browser behavior.
- Do not hide a reproduction gap; state it explicitly if you cannot reproduce.
- Prefer [ae-test-browser](../ae-test-browser/SKILL.md) for UI investigations that require a real browser.
- Prefer [ae-sql](../ae-sql/SKILL.md) when the failure is tied to schema, data shape, or query behavior.
- Prefer [ae-backend](../ae-backend/SKILL.md) when the failure is in service, API, auth, or repository behavior.
- Avoid speculative rewrites when the failing path is narrow.
- If the symptom disappears during investigation, report the last known evidence and what remains unproven.
- If no red-capable loop can be built, continue with read-only evidence analysis and report the missing environment or artifact instead of guessing.
