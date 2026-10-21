# Debugging Workflow

Use the [validation contract](../../ae-help/references/validation-contract.md) to select checks and reuse passing results across investigation and delivery.

## Feedback Loop Gate

Do not move from exploration to a root-cause story until one red-capable loop has been run, **or** you have recorded why such a loop cannot be built yet. A usable loop reaches the user's exact symptom, is deterministic, and completes quickly enough to repeat. If no such loop can be built locally, continue with read-only analysis of logs, call chains, configuration, and already captured evidence; do not invent a root cause.

Debug in this order:

1. Reproduce or capture the best available evidence.
2. Narrow the failing path.
3. Minimise the reproduction one input, caller, config, or step at a time; keep only load-bearing elements.
4. Form hypotheses **only when evidence is ambiguous**. Propose the minimum number of falsifiable hypotheses needed to decide between competing explanations; state the prediction for each before probing. Do **not** invent a fixed quota such as "list 3-5 hypotheses" when the cause is already clear.
5. Test one prediction at a time with commands, code inspection, or browser tools.
6. Change the smallest thing that explains the failure (only when a fix is authorized and the dependent environment exists).
7. Run the repaired case and any directly affected checks selected by the validation contract.

### Environment And Evidence Boundaries

- Missing local environment blocks only the fix or acceptance steps that depend on it; independent investigation may continue.
- Insufficient evidence must never be reported as a confirmed root cause or as proof that a fix worked.
- Keep isolation tests, authorization boundaries, and the ban on connecting to user-managed databases without explicit authorization.
- Prefer captured evidence, static inspection, fixtures, or a proven isolated profile when live reproduction is unavailable.

### Positive And Negative Cases

| Situation | Expected behavior |
| --- | --- |
| Reproducible local failure with a red-capable loop | Reproduce, minimise, fix the nearest proven cause, validate the repaired case. |
| Only logs / call chain / config available | Read-only analysis is allowed; mark reproduction gap; do not claim root-cause confirmation. |
| Environment missing for the failing path | Block only dependent repair/acceptance; continue independent investigation; report the gap. |
| Small fault with a clear single cause | Skip speculative hypothesis lists; apply the smallest matching fix and validate. |
| Evidence ambiguous between two paths | State only the necessary falsifiable hypotheses and test one prediction at a time. |

Useful evidence to capture (redact secrets before recording):

- exact command and output,
- exact URL and user action,
- stack trace or console error,
- relevant request or response data,
- recent code path touched by the failure.

Tag temporary diagnostics with a unique marker such as `[DEBUG-<id>]`. Before completion, remove tagged diagnostics and throwaway harnesses and verify the marker no longer exists. Reuse valid evidence for the original symptom; rerun only checks affected by cleanup or other relevant changes. Never persist credentials, authorization headers, cookies, or raw private payloads in an evidence artifact.

## Frontend Failure Quick Map

When the failure is in a web UI, check the nearest matching signal before changing code:

- blank page or dead interaction: browser console errors first, then the framework error overlay;
- hydration warning or mismatched markup: date, locale, random-value, or browser-only rendering differences between server and client;
- missing or wrong data: the failing request's status, payload shape, and CORS or auth headers in the network panel before blaming component code;
- stale behavior: hard-reload with cache disabled and confirm the dev server actually rebuilt the changed module;
- style regressions: inspect computed styles and the winning rule's origin instead of guessing at CSS;
- works locally but not deployed: environment variables, API base URLs, and build-time versus runtime configuration.

Capture the console output and the failing request/response as evidence before applying a fix.

## Backend Failure Quick Map

When the failure is in an API or service, check the nearest matching signal before changing code:

- 5xx with a stack trace: read the innermost frame that is repository code and inspect that path before blaming the framework;
- 401 or 403: token or session transport first, then expiry and clock skew, then auth middleware order and the specific permission rule;
- 404 or 405: route registration, path template and trailing slash, HTTP method, and any proxy or base-path rewrite in front of the service;
- 400 or 422: compare the actual request payload against the validation schema or DTO field by field, including casing and types;
- slow or timing out: N+1 queries, missing index, connection-pool exhaustion, or a blocking call on an async path; measure before optimizing;
- wrong data: serialization (timezone, numeric precision, enum names), cache staleness, or transaction isolation, checked against the canonical persisted value;
- works locally but fails deployed: environment variables, migration drift between schema and code, and configuration or dependency version differences.

Capture the failing request, the response, and the matching server-log excerpt as evidence before applying a fix.

## Frontend-Backend Boundary Quick Map

When each side looks correct in isolation, check the seam between them:

- CORS preflight failures: exact origin, allowed methods and headers, and credentials mode on both sides;
- cookies not sent or session lost: `SameSite`, `Secure`, domain and path scope, and cross-origin credentials configuration;
- body rejected or empty on the server: `Content-Type` header versus the parser the server expects (JSON, form, multipart);
- fields silently missing: camelCase versus snake_case mismatch, or a serializer dropping empty and zero values;
- dates or numbers wrong in the UI: timezone assumptions and precision loss for 64-bit integers in JavaScript;
- request never reaches the handler: dev-proxy or gateway path rewrite and API base-URL differences between environments;
- repeated logouts or refresh loops: the token refresh flow racing concurrent 401 responses;
- uploads failing only for some files: client, server, and reverse-proxy size limits and multipart boundaries.

Capture the same request from both sides (browser network entry and server log) before deciding which side owns the fix.
