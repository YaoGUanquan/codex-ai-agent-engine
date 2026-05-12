---
name: ae-backend
description: Use when the user asks for AE backend, /ae-backend, API implementation, service-layer work, repository changes, backend bug fixes, auth or permission logic, or backend validation.
---

# AE Backend

Implement or modify backend behavior using the repository's actual API, service, data, and validation contracts.

## Workflow

1. Read `references/backend-workflow.md`.
2. Inspect the relevant routes, controllers, handlers, services, repositories, schemas, migrations, and tests before editing.
3. Identify the exact contract being changed: request shape, response shape, auth boundary, permission rule, persistence behavior, and error handling.
4. Implement the smallest backend path that satisfies the requested behavior.
5. Update or add narrow tests around the changed contract, then expand validation when the change touches shared behavior.
6. Before final signoff, read `references/api-contract-checklist.md`.
7. Use `ae-sql` for SQL generation or migration review and `ae-swagger-parser` when an OpenAPI contract needs inspection.
8. Report the changed behavior, validation evidence, and any rollout or migration considerations.

## Rules

- Treat the repository contract as the source of truth for DTOs, routes, schema names, and permission logic.
- Do not silently broaden backend behavior beyond the requested path.
- Call out data migration, rollback, and shared-config risk when the change is not isolated.
- Keep the skill framework-agnostic unless the repository clearly uses a specific backend stack.
