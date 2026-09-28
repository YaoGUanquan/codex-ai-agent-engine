# Test Side-Effect Boundary

Apply this contract before any unit, contract, API, browser, smoke, debug, benchmark, or generated-SQL validation that could reach a datastore or external service. It is a safety boundary, not permission to execute a test.

## Default Isolation

- Validation is local and side-effect-free by default. Never open a direct connection to a user-managed MySQL, PostgreSQL, Redis, search index, object store, or other external datastore merely to test, debug, benchmark, inspect SQL, or check health. Read-only access is still a connection and is not an exception.
- Prefer static inspection, pure unit/contract tests, mocks, synthetic fixtures, repository-provided test profiles, or an ephemeral datastore created and owned by the test harness. A local URL or an available credential does not prove that a datastore is isolated.
- Do not read or print credential values, probe a configured datasource, run migrations, seed or clean user data, execute `EXPLAIN`, or use a user's application server as an implicit database test harness.

## Runtime And Load Boundary

- A browser or HTTP call is not exempt: before starting a service or sending a request, establish that the service uses a disposable, test-only data source or a repository-provided isolated profile. If that cannot be proved, stop as `blocked` and do not start the service or send the request.
- Load, benchmark, recovery, and production-like tests require explicit authorization plus an isolated environment. They are never a default validation step and must not fall back to a user's configured datasource.
- If the only available path resolves to a user-managed datasource, report the missing isolation prerequisite and use the highest safe static or fixture-based evidence instead.

## Evidence

- Record the isolation mechanism and evidence tier without recording URLs, credentials, headers, cookies, private identifiers, or raw request/response data.
- A blocked live test is not a failed product test. Report it as `blocked` or `unverified`; never imply that a static or fixture check proved database behavior, production performance, or recovery.
