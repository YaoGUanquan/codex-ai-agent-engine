# C# Guidance

Apply this guidance only when the repository uses C#/.NET for backend services such as ASP.NET Core APIs, minimal APIs, gRPC, or worker services.

## Structure And Conventions

1. Follow the existing solution layout (projects, layers, feature folders) and the established minimal-API versus controller style.
2. Register services with the dependency-injection lifetimes the repository uses; avoid captive dependencies such as scoped services injected into singletons.
3. Keep DTOs or records separate from EF Core entities when the repository does, and reuse the existing mapping approach.
4. Respect nullable reference type annotations; do not silence warnings with `!` to make code compile.

## Common Defect Traps

Check these before claiming a backend change is done:

1. Async discipline: async all the way; no `.Result` or `.Wait()` on request paths, no wrapping synchronous work in `Task.Run`, and pass `CancellationToken` through IO calls.
2. EF Core queries: watch N+1 from navigation access, use the repository's `Include` or projection style, and use `AsNoTracking` for read-only queries.
3. Transactions: group dependent writes into one transaction or `SaveChanges` scope; do not persist partially and continue.
4. DI scope misuse: resolving scoped services from the root provider in background tasks, middleware, or singletons.
5. Serialization: confirm System.Text.Json options (casing, enums, dates) match the established contract; do not switch serializer settings per endpoint.
6. Configuration: bind options through the existing `IOptions` pattern instead of reading raw configuration keys inline.

## Persistence And Migration Boundaries

1. Create EF Core migrations through the tooling and review the generated SQL; keep them compatible with the running application during deploys.
2. State the concurrency assumption for concurrent updates: concurrency token or rowversion versus last-write-wins.
3. Keep background work (hosted services, queues) idempotent under retry and safe across parallel instances.

## Error And Response Contract

1. Map failures through the repository's established handler (exception middleware, `ProblemDetails`, result envelope); do not leak stack traces in responses.
2. Keep the validation-failure shape (model validation, FluentValidation) consistent with existing endpoints so frontend field mapping keeps working.
3. Return accurate status codes consistent with neighboring endpoints instead of collapsing failures into 200 or 500.

Validate with `dotnet build` and the repository's test projects (xUnit, NUnit, `WebApplicationFactory` integration tests), narrowing to affected projects first.
