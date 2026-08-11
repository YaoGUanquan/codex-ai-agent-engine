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
