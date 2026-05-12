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
