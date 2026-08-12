---
name: ae-test-api
description: Use when the user asks for AE API testing, /ae-test-api, API/interface/bubble testing after backend work, controller or endpoint verification, API smoke evidence, request/response contract checks, or post-change backend acceptance without browser UI testing.
---

# AE API Test

Verify a changed backend API surface with the target repository's existing contracts, test harness, and HTTP client.

## Workflow

1. Read `references/api-verification-record.md` before selecting tests or writing evidence.
2. Inspect the changed routes, OpenAPI/Swagger source, controllers/handlers, DTOs, authorization rules, persistence effects, tests, and relevant callers.
3. Identify each in-scope endpoint by method, path template, and operation or symbol reference when available. Record excluded related endpoints with a reason.
4. Resolve request and response fields from an authoritative OpenAPI/Swagger source when present; otherwise use the controller, DTO, or handler contract. Treat fixtures and observed responses only as supporting evidence.
5. Select the smallest applicable evidence tiers: static contract inspection, focused automated API/controller tests, integration or build checks, runtime health, read-only smoke, authenticated smoke, browser acceptance, and deployment acceptance. A lower tier never proves a higher tier.
6. Cover the happy path plus applicable validation/error behavior. Conditionally assess authentication, authorization, persistence, idempotency/retry, pagination, concurrency, and external-service effects from the changed contract.
7. Reuse existing target tests, fixtures, and clients. Prefer isolated synthetic data. When an explicitly authorized mutation is exercised and a read surface exists, verify its effect through that API read surface.
8. For any live local call, read [the local runtime smoke gate](../ae-work/references/local-runtime-smoke-gate.md). It is the sole owner of restart state, authorization, secret references, and read-only versus state-changing execution.
9. When an authenticated smoke lacks a local secret reference, create a non-empty UTF-8 token-free fillable template from [the request config template](../ae-work/references/request-config-template.md), report its absolute path, and wait for the user to replace `REPLACE_WITH_LOCAL_TOKEN` locally. Do not create an empty config file or ask the user to invent the request shape.
10. Write or update exactly one sanitized API Verification Record under `docs/ae/evidence/api/` for the completed verification. Use the reference template; preserve only contract metadata and assertion summaries.
11. Route product changes to `ae-backend` or `ae-work`, red-green work to `ae-tdd`, failures to `ae-debug` or `ae-task-loop`, OpenAPI inspection to `ae-swagger-parser`, and UI acceptance to `ae-test-browser`.

## Rules

- This is post-change API verification, not browser acceptance, a universal API runner, a server lifecycle manager, or permission to issue a state-changing request.
- Do not start or restart a service, make an authenticated request, or mutate state unless the shared smoke gate's preconditions and explicit authorization are satisfied.
- Do not add a default HTTP client, dependency, test framework, mock server, data-reset service, CI runner, or external runtime.
- Record a reproducible sanitized command form or observation, never an original command line containing a credential, secret-file path, header, cookie, concrete query/body value, private host, or opaque resource identifier.
- Do not retain raw request/response bodies, stack traces, private headers, tokens, cookies, personal data, resource identifiers, or secret-reference paths.
- Keep blocked, failed, not-applicable, and unverified evidence visible. Do not report focused tests as runtime, authenticated, browser, or deployment acceptance.
- Do not automatically update `docs/08-ai-memory/00-registry.json` or any graph. Curate a stable cross-module API relation only when the user explicitly requests it and the reference preconditions are met.
- Do not claim OpenCode agents, generated test scripts, automatic repair loops, MCP registration, or external test-runner integration.
