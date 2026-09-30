---
name: ae-test-api
description: Use when the user requests AE API testing, /ae-test-api, API/interface/bubble testing, endpoint verification or post-change backend acceptance.
---

# AE API Test

Verify the changed API contract using existing target tests and clients.
Before any test/smoke, read the [test side-effect boundary](../ae-help/references/test-side-effect-boundary.md):
never connect to a user-managed datastore; missing disposable/test-only
isolation is `blocked`.

1. Inspect authoritative routes/DTOs/OpenAPI and the relevant authorization,
   callers and persistence effects. Observed responses are supporting evidence.
2. Before HTTP execution, build a sanitized request-context manifest and select
   a validated project runner or the permitted single-request curl fallback.
3. Cover applicable success, validation, auth, persistence and retry risks.
   A success response does not prove downstream completion.
4. Keep static, automated, authenticated, browser and deployment evidence
   separate; classify failures before retry.
5. Write exactly one sanitized API Verification Record. Retain no credentials,
   cookies, raw bodies, personal data or secret-reference paths.

## Task References

Read only the row triggered by the task, not the whole table.

| Trigger | Reference |
| --- | --- |
| Selecting a carrier, running tests or writing evidence | [Verification procedure](references/verification-procedure.md) |

Use [api-verification-record](references/api-verification-record.md) when
writing the record. For live local calls, read the
[local runtime smoke gate](../ae-work/references/local-runtime-smoke-gate.md);
explicit authorization and its preconditions are required. Missing auth uses
the token-free [request config template](../ae-work/references/request-config-template.md),
never credentials in chat.
For list/count or async/bulk endpoints, use the [data-access contract](../ae-backend/references/data-access-contract.md)
and [scale contract](../ae-help/references/scale-and-distributed-engineering.md).
Do not start/restart services, mutate state, add test frameworks or automatically
curate memory/graphs as part of a smoke request.
