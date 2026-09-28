# Data Access And Scale Contract

Apply when designing, changing or reviewing database-backed lists/search/count/export, create/update/delete/import, batch jobs or high-volume persistence. Schema changes and an explicit "performance" request are not prerequisites. These are engineering decisions, not an automatic SQL optimizer or a guarantee of generated-code performance. For any runtime query, plan or metadata evidence, apply the [test side-effect boundary](../../ae-help/references/test-side-effect-boundary.md); static repository metadata, sanitized user-provided metadata, and isolated fixtures are the default.

## Scale The Work

For bounded single-row CRUD, a short inline record of access path, uniqueness, transaction and validation is enough. Do not require an auxiliary table, queue, benchmark or large design document for every endpoint. Escalate when work scales with input size, table cardinality, relation fan-out or concurrency. An unknown volume is an assumption to resolve, not evidence that the table is small.

Before selecting a design, inspect repository metadata, sanitized user-provided metadata, ORM/driver declarations, schema/index definitions, queries, transaction ownership, call sites and existing tests. Do not connect to a user-managed datasource merely to inspect its version, schema or indexes; use a disposable test-only datasource or explicitly authorized isolated profile only when runtime evidence is necessary. Record only applicable decisions:

| Decision | Required evidence or explicit unknown |
| --- | --- |
| Cardinality | Current/projected rows, rows per operation, fan-out, selectivity/skew, payload bytes and peak concurrency |
| Query and count | Logical row, bounded query/round-trip budget, total semantics, order, filters, page-size cap and deep-page policy |
| Read model | Canonical source, direct-query versus auxiliary/precomputed approach, freshness and maintenance cost |
| Batch and transaction | Statement batch size, flush boundary, commit boundary, atomicity, constraints, idempotency and retry policy |
| Async acceptance | Whether async is allowed, durable handoff, bounded worker capacity and user-visible completion contract |
| Recovery | Partial failure, checkpoint, resume, cancellation, reconciliation and rollback signals |
| Evidence | Baseline, representative fixtures, acceptance budget, commands, measured results and missing runtime proof |

Reuse an already recorded decision rather than redoing intake. Do not invent latency targets, cardinalities, batch sizes or a new API contract. Unknowns affecting atomicity, exact totals, freshness or asynchronous acceptance must be resolved before implementation.

## Query Shape Before Query Loops

- Trace endpoint -> service -> mapper/repository -> generated SQL, including count, enrichment, lazy loading and per-item validation. Define a bounded query count; do not hide N+1 behind a stream, helper, asynchronous task or serializer.
- Prefer projection and bounded set-based retrieval of required columns. Batch related-key lookups and build an in-memory map only within a known page/chunk budget; bound `IN` lists by engine parameter/packet limits. Avoid whole-table preload, unbounded result lists and a query per returned row.
- Establish the logical row: root entity, joined record or aggregate group. Measure relation fan-out and preserve all membership predicates before pagination. When paginating roots, compare `EXISTS`/semijoin or root-key-first pagination followed by bounded enrichment. Preserve the root order during hydration, apply the same tenant/authorization/deletion scope and define read consistency between phases.
- Joins are not inherently wrong. Keep an efficient selective join when its plan and cardinality fit. Do not replace one join with N queries, apply `DISTINCT` blindly to hide fan-out, or page joined children and deduplicate roots afterward. Sort/filter expressions derived from child data must participate before the root page is chosen.
- Require deterministic ordering with a unique tie-breaker. Assess offset cost on deep pages; use keyset/cursor traversal for sequential scans when the contract permits it. Keyset is not a transparent replacement for arbitrary page jumps. Define tie/null/direction behavior and concurrent insert/update effects.
- Review predicates, composite/covering indexes, selectivity, sort/group/temp work and scanned versus returned rows from static SQL/schema evidence first. Index existence alone is not proof of use. Runtime plans for data and count require a disposable test-only datasource or explicitly authorized isolated profile; `EXPLAIN`, analyze and profile commands are never safe merely because they are read-only.

## Total And Count Contract

Choose exact total, no total with `hasNext`/cursor, or explicitly permitted approximate/deferred total from the caller contract. Do not remove an exact total, return page length as total, report a failed count as zero, or silently change consistency to make a slow query appear successful.

For exact totals, count the same logical row under the same filters, tenant, authorization, deletion and grouping semantics as the data query. A joined row count may not be a root count. Compare dedicated count SQL or a semantically correct subquery rather than relying on automatic rewriting. Removing an order/join is valid only when result membership/cardinality is unchanged.

Measure count and data separately. A correct count can still be expensive; when it dominates the budget, compare indexed predicates, a maintained read model or an explicitly approved total-contract change. Define snapshot consistency or tolerated drift when count and data are separate statements. A fast page query does not prove a fast or correct endpoint.

## Bounded Writes And Commit Semantics

1. Compare native set-based SQL (multi-row insert, insert-select, scoped update/delete, merge/upsert where supported) with the repository's real prepared-statement batch API. Prefer a supported bounded batch over per-row execute/commit when semantics are equivalent. If row-by-row execution is necessary, document the dependency, callback, ordering or error-isolation reason and its measured/estimated ceiling.
2. Separate statement batch, driver round trips, ORM flush and transaction commit. A batch-named method or one outer transaction does not prove batched execution; a flush does not imply commit. Inspect emitted SQL/driver behavior and generated-key, validation, audit, optimistic-lock and deletion handling. Set-based writes must not bypass required business hooks or authorization.
3. Choose chunk size from row width, bind/packet limits, memory, lock duration, undo/WAL/redo pressure and timeout budget. Make it bounded and tunable using existing configuration patterns; no universal row threshold. Stream input or scan stable keys; splitting an already fully materialized dataset does not bound memory.
4. Permit per-chunk commits only when partial completion is acceptable. For all-or-nothing operations, keep the required transaction or design staging plus atomic publication; do not silently trade atomicity for throughput. Bound staging/publication costs too. Avoid one enormous transaction when it violates the operational budget.
5. For resumable chunks, use stable key ranges or a durable worklist, not offsets over a set being mutated. Define idempotency keys/unique constraints, affected-row and rejected-row semantics, rollback of the failed chunk and restart from committed state. Retrying a committed chunk must not duplicate effects.
6. Bound retries and concurrency; classify deadlocks/timeouts separately from validation or constraint failures. Do not ignore errors, fall back silently to per-row commits, or claim success from an ORM boolean without required persisted readback.

## Conditional Design References

- When large/hot queries, repeated aggregates, relationship filters or proposed auxiliary/index/extension tables make direct access questionable, read [read-model-design.md](read-model-design.md). Compare structural alternatives rather than only rewriting the loop.
- For asynchronous saving, imports, background bulk work or durable chunk recovery, read [async-bulk-write.md](async-bulk-write.md). Async must not merely relocate N+1 work or unbounded memory.
- Only when the target uses MyBatis-Plus, read [mybatis-plus-data-access.md](mybatis-plus-data-access.md). Do not impose its APIs on another stack.
- For new or materially changed durable structures, also apply [persistence-contract.md](persistence-contract.md). This contract does not replace schema, authorization, migration or SQL execution gates.

## Acceptance And Review

Select cases from the actual path, not a mandatory full matrix for every CRUD task:

- Query: empty/single/multiple roots, skewed high fan-out, missing children, duplicate sort values, child filters, tenant/authorization/deletion exclusions, first/last/deep pages and concurrent changes. Compare IDs and exact totals against an independent expected set; separately assert bounded query counts.
- Writes: empty input, `batchSize - 1`, `batchSize`, `batchSize + 1`, several chunks and a final partial chunk; duplicate keys, invalid rows, failure during flush, failure after commit, retry and restart. Assert committed rows and side effects, not only task/HTTP success.
- Derived data: concurrent backfill plus updates/deletes, duplicate/out-of-order delivery, stale/missing projections, reconciliation, rebuild and cutover. Async: duplicate delivery, worker crash/lease expiry, saturation, cancellation and durable terminal state.
- Performance: use representative scale/skew, row width, warm/cold conditions and concurrency only in an isolated environment. Record data/count timings separately, query/round-trip count, rows examined, throughput, peak memory, pool/queue pressure and lock duration as relevant. State baseline, target, actual result and environment. Do not run load, plan, metadata, `EXPLAIN`, analyze or profile commands against a user-managed system; if isolation is unavailable, report performance/runtime proof as `blocked`.

Static inspection and focused tests do not prove throughput, production query plans, driver batching, crash recovery or model compliance. Flag unjustified unbounded/per-row work and missing count/atomicity/read-model decisions with concrete path and impact; keep unmeasured performance a risk, not a fabricated benchmark.
