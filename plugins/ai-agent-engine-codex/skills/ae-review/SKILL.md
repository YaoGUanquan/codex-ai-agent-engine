---
name: ae-review
description: Use when the user requests ae-review, /ae-review, $ae-review, or review of code, documents, plans, requirements, or delivery risk.
---

# AE Review

Review the user's locked scope and return evidence-backed findings before any
summary.

1. Read [scope-detection](references/scope-detection.md) and select one scope
   and one domain.
2. Start at the smallest review class. S1 is one behavior or at most three
   files without a contract/security/data/dependency boundary or delivery gate.
   S1 uses one read-only lane and only the
   direct call path; do not widen scope because related files exist.
3. Add complexity, security, performance, API, reliability, or claim-integrity
   lenses only when the request or a concrete boundary requires them.
4. Findings include severity, file/line, trigger, evidence, impact and remedy.
   Confirm locations and contradictions before reporting; label unverified
   claims and unrelated pre-existing problems.
5. Stop when the scoped verdict and required evidence are supported.

Default to `mode:report-only`; `mode:autofix` permits only deterministic
in-scope fixes preserving user changes. Never spawn agents without explicit
user authorization. A missing specification is a gap, not a new requirement.
Return `APPROVE`, `COMMENT`, `REQUEST_CHANGES`, or `BLOCK`; the strictest
applicable lane wins. Accepted serious findings remain residual risk.

## Task References

Read only the row triggered by the task, not the whole table.

| Trigger | Reference |
| --- | --- |
| S2/S3 range, workspace or layered review | [Preparation and lenses](references/review-preparation.md) |
| Complexity/claim-integrity, second-model or cross-artifact review | [Specialist lanes](references/specialist-lanes.md) |
| Task delivery gate or autofix | [Findings, evidence and verdict contract](references/review-delivery.md) |

Before helper commands, resolve [runtime-entry](../ae-help/references/runtime-entry.md).
For scale-sensitive access, pass `--has-performance` when using `review-contract`
and read the [data-access contract](../ae-backend/references/data-access-contract.md).
For concurrent/distributed work, read the [scale contract](../ae-help/references/scale-and-distributed-engineering.md).
For scope/budget recovery, use the [model-adaptation contract](../ae-help/references/model-adaptation-contract.md).
Load [code-review-rule-profiles](references/code-review-rule-profiles.md) only
when the file type or requested lens needs it.
