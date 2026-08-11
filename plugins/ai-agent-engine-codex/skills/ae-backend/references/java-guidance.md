# Java Guidance

Apply this guidance only when the repository uses Java or another JVM backend stack such as Spring Boot, Quarkus, Micronaut, or Jakarta EE.

## Structure And Conventions

1. Follow the existing layering before adding new abstractions: transport concerns in controllers, business rules in services, persistence in repositories, matching the repository's current split.
2. Keep DTOs separate from persistence entities when the repository does; never serialize lazy entity graphs straight into responses.
3. Reuse the established dependency-injection style, configuration-properties binding, and mapping approach instead of introducing a parallel one.
4. Match the repository's package-by-layer or package-by-feature organization for new classes.

## Common Defect Traps

Check these before claiming a backend change is done:

1. Transaction boundaries: `@Transactional` on the wrong layer, self-invocation that bypasses the proxy, or exception types that do not trigger rollback by default.
2. Lazy loading: `LazyInitializationException` outside the persistence context and N+1 queries from serializing entity collections; use the fetch joins or projections the repository already uses.
3. Validation: enforce request validation with the repository's mechanism (`@Valid`, Bean Validation constraints) at the boundary instead of ad hoc null checks deep in services.
4. Nullability: keep null contracts explicit across DTO boundaries; do not let `Optional` fields or unchecked nulls cross serialization silently.
5. Concurrency: no shared mutable state in singleton beans; no blocking calls inside reactive or async paths that starve the worker pool.
6. Time and money: use `java.time` types with explicit zones and `BigDecimal` for money; never `double` for amounts or implicit server-default timezones.

## Transactions And Persistence Boundaries

1. Keep a write and its dependent reads inside one transaction; do not split them across service calls unintentionally.
2. Confirm migration scripts (Flyway, Liquibase) match entity changes and deploy before the code that depends on them.
3. State the concurrency assumption when the change touches concurrent updates: optimistic version column versus pessimistic locking.
4. Verify cascade and orphan-removal settings before relying on them for deletes.

## Error And Response Contract

1. Map exceptions to responses in the repository's established handler (`@ControllerAdvice`, `ProblemDetail`, or the local envelope); do not leak stack traces or entity internals.
2. Keep error codes, messages, and validation-failure shape consistent with existing endpoints so frontend error and form mapping keeps working.
3. Return accurate status codes consistent with neighboring endpoints instead of collapsing failures into 200 or 500.

Validate with the repository's build and test commands, preferring focused slice tests over full-context tests when both exist.
