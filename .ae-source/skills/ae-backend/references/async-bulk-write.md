# Durable Async And Bulk Persistence

Use when saving/importing/updating large datasets, choosing background work or implementing resumable chunks. Start with the repository's job/queue/transaction facilities. Do not introduce a broker or distributed workflow engine when a bounded synchronous batch already meets the contract.

## Acceptance Is Not Completion

Confirm whether the caller permits async acceptance and partial completion. Preserve an existing synchronous success contract unless an explicit API migration is approved. Define job identity, owner/tenant scope, idempotent submission, status/progress, failure/rejection details, cancellation and retention.

Return accepted only after durable acceptance: an owned job/worklist or durable message exists with the required input reference. An in-memory future, thread pool enqueue or request-scoped entity reference is not durable saving. Large payloads need a bounded, authorized durable input reference and lifecycle, not unbounded request retention.

When business state and job dispatch cross transaction boundaries, use a same-database transactional job/outbox or another demonstrated durable handoff. A database commit followed by a best-effort publish has a crash gap. An after-commit callback alone does not close it. Monitor/retry outbox delivery and clean it up according to retention.

## Bounded Execution

- Bound queue capacity/admission, worker count, input/chunk bytes, transaction size, retries, connection use and external calls. Provide backpressure and an explicit saturation response; an unbounded queue only defers resource exhaustion.
- Keep worker concurrency inside database/pool capacity and the foreground traffic budget; avoid one task per row and unbounded futures. Batch validation/lookups and writes inside the worker using the shared data-access contract.
- A request transaction does not automatically cross threads/processes. The worker owns its transaction/session lifecycle and reloads durable inputs. Propagate explicit identity/scope, not a mutable request principal or implicit thread-local context.
- Define job claim/lease, heartbeat, expiry and recovery using the existing mechanism. Use fencing/version checks so an expired worker cannot keep committing after a replacement takes ownership. Recheck authorization according to the documented job policy, particularly after delay or permission revocation.

## Chunk And Checkpoint Protocol

1. Define all-or-nothing versus partial success. For all-or-nothing results too large for a safe transaction, evaluate staging plus atomic visibility/publication. Async and chunks do not waive atomicity or make a large final publication transaction cheap.
2. Freeze input membership or use a durable worklist/stable key cursor with a defined high-water mark. Do not use offsets over rows whose eligibility changes during processing.
3. Persist the checkpoint in the same transaction as the chunk writes when they share a database. With separate stores or external side effects, document the recovery protocol and use idempotency/deduplication; never advance progress before committed work.
4. Handle the commit-before-acknowledgement crash window: replay must recognize already committed work. Do not claim exactly-once delivery merely because a worker or queue retries; prove the required idempotent effect.
5. Bound retries with backoff for classified transient failures. Deterministic invalid rows need the chosen reject/stop policy; exhausted work needs a visible failed/dead-letter state and controlled resume, not infinite retries or hidden skips.
6. Define cancellation at safe chunk boundaries, what committed data remains, cleanup of uncommitted/staged data and whether compensation is possible. Cancellation is not rollback of previously committed chunks.
7. Mark success only after committed chunks and required downstream effects have satisfied the completion contract. Track committed, rejected and remaining work without double-counting retries. Persisted completion must be verified by readback/reconciliation, not inferred from enqueue success or an empty queue.

## Recovery Evidence

Inject failure before flush, during a chunk, after commit before acknowledgement, after lease expiry and during finalization. Verify restart, duplicate submission/delivery, stale worker fencing, cancellation, poison rows and saturation. Observe persisted rows, checkpoint, task state, side-effect deduplication, queue lag, lock duration, memory and pool usage.

Unit tests can establish state-machine intent. Durable handoff and crash recovery require the actual storage/queue/transaction integration under authorized test conditions; an immediate in-process mock is not that proof.
