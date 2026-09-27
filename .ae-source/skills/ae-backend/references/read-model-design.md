# Large Query And Read-Model Design

Load from the data-access contract only for large/hot queries, repeated joins/aggregates, complex relationship filtering or proposed auxiliary/index/extension tables. Do not default to denormalization, a cache, a new table, partitioning or sharding just because a dataset is described as large.

## Compare The Actual Alternatives

Use the current query plan, workload shape and access budget to compare the smallest viable options. Record why the selected design beats the others for this path:

| Option | Useful when | Cost or rejection signal |
| --- | --- | --- |
| Direct projection with composite/covering indexes | Selective predicates, bounded joins and compatible ordering | Write/index storage cost, broad scans or high fan-out still exceed budget |
| Set-based root selection plus bounded enrichment | Paging roots while displaying related data | Must preserve child predicates/order and account for cross-query consistency |
| Auxiliary lookup/index table | Repeated relationship, eligibility, flattened-key or membership queries are costly | Must maintain scoped unique keys, deletion, change propagation and rebuild |
| Business extension table | Sparse/large optional fields or a separate lifecycle should be isolated | An extension table is not automatically a query index; extra joins may be slower |
| Precomputed aggregate, projection or materialized read model | Repeated costly counts/aggregations or multi-table views can tolerate a stated freshness policy | Refresh lag, write amplification, storage, contention and reconciliation |
| Existing cache/search service | Repeated reads or search semantics justify the established platform | Invalidation, stampede, eviction, security scoping and source drift |

Consider archival/partitioning only when the access/retention pattern can prune data and operations support it; sharding is a separate architectural decision, not a default fix. Do not add a new infrastructure dependency before evaluating database-native and repository-native paths.

## Canonical Ownership

For each proposed table/view/cache, state whether it is canonical business data or derived data. A derived read model has one named source of truth and an owner, not two independently editable truths. An extension table may own canonical fields; do not label it disposable unless it is actually reconstructible.

Record keys and uniqueness including tenant/scope, supported filters/sorts, expected row count/fan-out, payload, indexes, retention and consumers. Do not preserve large JSON/text only to parse or query it per row when an indexed projection of stable query fields is justified.

For derived data, decide:

- Maintenance: same-transaction update for required strong consistency, or durable change log/outbox/CDC with a bounded freshness objective. Trace every write, delete, restore, permission and bulk path; do not rely on a single happy-path service callback.
- Ordering: identify source version/sequence, idempotency key, delete/tombstone behavior and handling of duplicate or out-of-order changes. Reject stale updates that would resurrect deleted or superseded state.
- Authorization: carry tenant scope and use canonical authorization where stale permissions could expose data. A stale read model or cached total must not broaden access. Scope all lookups, caches and aggregate keys.
- Freshness: define lag visibility, read-your-writes expectations, missing/stale projection policy and behavior when maintenance fails. Never silently serve stale "exact" totals or fall back to an unbounded query.
- Economics: estimate and then measure query savings against write amplification, build time, hot-row contention, storage and operational complexity. Unknown numbers stay assumptions.

## Backfill, Cutover And Rebuild

1. Introduce schema/indexes using the target migration and online-DDL conventions; inspect lock/space/replication costs rather than assuming creation is online.
2. Establish a consistent snapshot or a change-capture watermark with a race-free replay/overlap protocol. Ensure changes are captured before they can be missed by the backfill. A wall-clock timestamp alone is not a safe consistency boundary without supporting semantics.
3. Backfill by stable key ranges with bounded reads/writes and durable checkpoints. Reconcile the interleaving of snapshot rows, updates and tombstones; do not let a late snapshot overwrite newer state.
4. Shadow-compare canonical and derived results for IDs, filters, scope, ordering and totals under representative skew and concurrent writes. Record mismatch and lag thresholds before cutover; do not enable a new read path solely because backfill finished.
5. Switch readers using the repository's existing release mechanism, retain a scoped recovery path, and monitor lag/mismatches. Reverting to the canonical path needs a load budget; an unbounded fallback can cause a second outage.
6. Define reconciliation and full/incremental rebuild from canonical sources, repair ownership, temporary storage and disposal only after the recovery window. Preserve executed migration immutability.

## Proof

Verify query plans and realistic before/after cost on the target engine. Exercise update/delete/restore, duplicate/out-of-order delivery, tenant boundaries, concurrent backfill, interrupted rebuild and reader rollback. Mocks, an index declaration or the existence of a new table do not prove consistency or improved latency.
