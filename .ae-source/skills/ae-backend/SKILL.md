---
name: ae-backend
description: Use when the user asks for AE backend, /ae-backend, API implementation, service-layer work, repository changes, backend bug fixes, auth or permission logic, or backend validation.
---

# AE Backend

For bulk, concurrent or distributed service work, apply the [scale and distributed engineering contract](../ae-help/references/scale-and-distributed-engineering.md). Trace transaction/enqueue boundaries, retry ownership, idempotency and pool/backpressure budgets alongside the existing data-access contract.

Implement or modify backend behavior using the repository's actual API, service, data, and validation contracts.

For database-backed lists/search/count/export, create/update/delete/import or batch/async persistence, apply the [data-access and scale contract](references/data-access-contract.md) before implementation, even without schema changes. Keep bounded single-row CRUD light; for scale-sensitive work record query/count budgets, read-model alternatives, batch/commit semantics and recovery evidence. Load its read-model, async and MyBatis-Plus references only when triggered.

Validation follows the [test side-effect boundary](../ae-help/references/test-side-effect-boundary.md): never connect to a user-managed datastore merely to test backend behavior; use repository fixtures or a proven isolated profile and keep missing runtime proof `blocked`.

## Workflow

1. Read `references/backend-workflow.md`.
2. Inspect the relevant routes, controllers, handlers, services, repositories, schemas, migrations, and tests before editing.
3. Identify the exact contract being changed: request shape, response shape, auth boundary, permission rule, persistence behavior, and error handling.
4. When durable data is created or materially changed, read `references/persistence-contract.md` before selecting identifiers, fields, indexes, deletion, concurrency, enum, migration, or exception behavior.
5. Read the language guidance matching the repository stack: `references/java-guidance.md` for Java and JVM stacks, `references/go-guidance.md` for Go, `references/python-guidance.md` for Python services, `references/c-guidance.md` for C, `references/cpp-guidance.md` for C++, `references/csharp-guidance.md` for C#/.NET. For other backend languages, follow the repository's existing conventions without inventing a new structure.
6. Implement the smallest backend path that satisfies the requested behavior.
7. Update or add narrow tests around the changed contract, then expand validation when the change touches shared behavior.
8. Before final signoff, read `references/api-contract-checklist.md`; when a frontend consumes the changed API, walk its Frontend-Backend Alignment section explicitly.
9. Use `ae-sql` for SQL generation or migration review and `ae-swagger-parser` when an OpenAPI contract needs inspection.
10. Report the changed behavior, validation evidence, and any rollout or migration considerations.

## Rules

- Treat the repository contract as the source of truth for DTOs, routes, schema names, and permission logic.
- Do not silently broaden backend behavior beyond the requested path.
- Call out data migration, rollback, and shared-config risk when the change is not isolated.
- Apply a language guidance file only when the repository actually uses that stack; for any other backend language, stay framework-agnostic and follow the repository's existing conventions.
