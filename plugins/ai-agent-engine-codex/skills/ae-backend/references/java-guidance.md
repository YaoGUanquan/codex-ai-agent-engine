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
7. Controller tests: do not make test classes subclasses of a production Controller carrying Spring MVC mapping or OpenAPI endpoint annotations. Static source scanners can treat inherited mappings as duplicate endpoints. Use the repository's MVC slice, a direct Controller instance with mocks, or a Mockito spy/proxy for protected request-context seams. `@Hidden` or Javadoc ignore markers are not an enforcement boundary.

## Transactions And Persistence Boundaries

1. Keep a write and its dependent reads inside one transaction; do not split them across service calls unintentionally.
2. Confirm migration scripts (Flyway, Liquibase) match entity changes and deploy before the code that depends on them.
3. State the concurrency assumption when the change touches concurrent updates: optimistic version column versus pessimistic locking.
4. Verify cascade and orphan-removal settings before relying on them for deletes.

## MyBatis-Plus Entity Governance (Conditional)

Apply this section only when the repository already uses MyBatis-Plus and its local conventions support these columns. First classify the table: mutable business aggregates can require this pattern; association tables, append-only audit/event/outbox tables, and reference/dictionary tables may intentionally omit some or all fields.

1. For every new durable table, confirm the primary-key strategy from repository evidence or ask: `本次新增持久化表的主键策略选择自增 BIGINT，还是 UUID？是否需要对外暴露该 ID？` Do not choose a default.
2. For an applicable mutable aggregate, the local entity may use this pattern after confirming field names/types and a configured fill handler:

```java
/** Optimistic lock version. */
@Version
@TableField("version")
private Integer version;

/** Logical delete marker. */
@TableLogic
@TableField("deleted")
private Integer deleted;

/** Creator. */
@TableField("create_by")
private String createBy;

/** Creation time. */
@TableField(value = "create_time", fill = FieldFill.INSERT)
private LocalDateTime createTime;

/** Updater. */
@TableField("update_by")
private String updateBy;

/** Update time. */
@TableField(value = "update_time", fill = FieldFill.INSERT_UPDATE)
private LocalDateTime updateTime;
```

3. Fill audit fields from the authenticated principal or documented system actor, never directly from a client DTO. Define the zone/clock policy and verify that update filling actually overwrites update-time values when required.
4. `@TableLogic` does not solve query filters, uniqueness with deleted rows, restore policy, foreign-key/child handling, or retention. Design the matching indexes and recovery semantics explicitly.
5. Use `@Version` only for concurrent mutable updates, include the version in the appropriate request/command contract, and translate zero-row/optimistic-lock failures to the repository's established conflict response.
6. Persist business enums using stable explicit codes, never Java ordinal. Define unknown and retired-code behavior before migration or API exposure.

## Error And Response Contract

1. Map exceptions to responses in the repository's established handler (`@ControllerAdvice`, `ProblemDetail`, or the local envelope); do not leak stack traces or entity internals.
2. Keep error codes, messages, and validation-failure shape consistent with existing endpoints so frontend error and form mapping keeps working.
3. Return accurate status codes consistent with neighboring endpoints instead of collapsing failures into 200 or 500.

Validate with the repository's build and test commands, preferring focused slice tests over full-context tests when both exist.
