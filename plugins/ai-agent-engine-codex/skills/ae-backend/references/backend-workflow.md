# Backend Workflow

Use this sequence for backend implementation work:

1. Confirm the route or entrypoint, request shape, response shape, and auth boundary.
2. Inspect the service and data path end to end before changing anything.
3. Limit edits to the narrowest set of files that owns the behavior.
4. Add or update tests for the changed contract.
5. Validate with the smallest meaningful command, then broader checks if the change touches shared behavior.

Escalate attention when the change touches:

- public API contracts,
- auth or authorization,
- migrations or schema changes,
- shared config,
- background jobs or external integrations.
