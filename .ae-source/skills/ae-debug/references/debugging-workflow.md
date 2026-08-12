# Debugging Workflow

Debug in this order:

1. Reproduce or capture evidence.
2. Narrow the failing path.
3. Form explicit hypotheses.
4. Test those hypotheses with commands, code inspection, or browser tools.
5. Change the smallest thing that explains the failure.
6. Re-run the failing case and one nearby healthy case.

Useful evidence to capture:

- exact command and output,
- exact URL and user action,
- stack trace or console error,
- relevant request or response data,
- recent code path touched by the failure.

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
