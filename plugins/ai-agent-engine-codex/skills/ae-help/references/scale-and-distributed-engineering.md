# Scale And Distributed Engineering Contract

Use this reference when a request involves large repositories, large datasets, high concurrency, distributed workers, queues, streaming, bulk work, external providers, long-running operations, or production-like failure recovery. It is a reusable decision contract, not a promise that the target project already has these capabilities.

## Trigger And Evidence Boundary

- Load this contract when work can exceed one process, one request, one page, one transaction, one host, or a comfortable in-memory working set.
- Distinguish `observed`, `measured`, `inferred`, `declared`, `executed`, `passed`, `unverified`, and `blocked` evidence.
- A local unit test does not prove distributed correctness; an HTTP 2xx does not prove persistence; an accepted job does not prove completion; a browser check does not prove deployment or production behavior.
- Do not invent capacity numbers. Capture the user or repository SLO, expected cardinality, concurrency, payload size, retention, and failure budget, or record them as open decisions.

## Required Decision Record

For every scale-sensitive change, record the smallest applicable values:

| Dimension | Required question |
|---|---|
| Workload | What is the item count, payload size, request rate, concurrency, burst and growth horizon? |
| Resource budget | What are the time, memory, CPU, file, network, database, queue and token budgets? |
| Boundaries | What is the unit of work, ownership scope, partition key, batch size and maximum in-flight work? |
| Correctness | What must be atomic, ordered, exactly-once-like, at-least-once, idempotent or eventually consistent? |
| Recovery | Where is the checkpoint, lease, retry state, dead-letter path, resume token and rollback signal? |
| Compatibility | Which API/schema/event/version/feature capability is negotiated, and how are unknown values handled? |
| Observability | Which correlation ID, counters, latency histograms, queue depth, failure reason and saturation signal prove behavior? |
| Evidence | Which validation tier is actually available, and which higher tiers remain unverified? |

## Resource And Memory Rules

- Prefer bounded streaming, cursors, iterators and chunked processing over loading an unbounded result into memory.
- Put limits on depth, file count, item count, bytes, response size, execution time, retries and concurrency. Return the effective limit and truncation reason.
- Never hide skipped, malformed, unreadable or over-budget inputs. A partial result must carry `complete=false` or an equivalent diagnostic even when the command remains backward-compatible with `status: ok`.
- Use backpressure. A producer must not outrun the consumer, connection pool, heap, queue or downstream rate limit.
- Keep exact totals, full scans and global sorts opt-in when they are expensive; state the freshness and approximation semantics.

## Token And Output Budgets

- Treat token use as an executable budget, not a note: track `inputTokens`, `outputTokens`, `contextWindow`, `inputBudget`, `outputBudget` and `remainingBudget` when the provider exposes them; otherwise label estimates and their evidence tier.
- Enforce context and output caps before expanding a large result. Return a bounded, resumable envelope with `complete`, `stopReason` and evidence status; `stopReason` is one of `budget`, `deadline`, `cancel`, `complete` or `blocked`.
- Use progressive disclosure for large inputs: first return scope, counts, risk and candidate paths; expand only the selected slice or next page. A truncation must preserve `complete=false`, the stop reason and the resume/scope signal instead of silently dropping context.

## Bounded Review Loop

- Start each audit with one objective, owned paths, decisive questions, acceptance checks and a review budget. Every finding must map to that objective or be recorded as deferred; do not widen scope because a nearby file is interesting.
- Keep one evidence ledger per task with `status`, `owner`, `paths`, `commands`, `findings`, `nextAction` and `stopReason`. A second pass may re-check changed evidence or an unresolved finding, but must not repeat a completed check without a stated reason.
- After interruption or context compaction, reload the smallest canonical artifact set and reconcile the ledger with the current worktree. Continue from `nextAction`; do not restart a completed audit from memory or relabel the same evidence as new work.
- Stop when acceptance checks pass, the remaining items are explicitly `unverified`/`blocked`, or the review budget is exhausted. Report residual risk instead of opening another exploratory pass.

## Concurrency, Leases And Idempotency

- Define the contention key and the ownership boundary before adding a lock. A local file lock is not a distributed lock.
- For multi-process or multi-host work, define lease expiry, renewal, owner identity, fencing/version token and stale-owner behavior. Do not rely on wall-clock time alone.
- Every retried write or job must have a stable idempotency key or a deduplication rule. Reuse the same job/manifest/operation identity on recovery; do not submit a duplicate merely because polling timed out.
- Use bounded exponential backoff with jitter, a retry budget and a terminal classification. Do not retry validation, authorization, invariant or non-idempotent failures blindly.
- Protect shared state with compare-and-set/version checks and make conflict behavior explicit.

## Deadlines, Cancellation And Ordering

- Propagate a deadline or cancellation signal through nested calls, queues and child workers. A timeout must not silently become unbounded work.
- Separate client timeout, server deadline, queue visibility timeout, lease expiry and provider timeout.
- Define ordering scope: global, partition, key, batch or none. Do not claim global order from per-partition order.
- For streaming or polling, define heartbeats, cursor/sequence semantics, reconnect behavior and terminal states.

## Partitioning, Queues And Durable Async Work

- Choose a partition key that distributes load and preserves the required locality. Record hot-key and skew behavior.
- Keep messages bounded and versioned. Use an outbox or durable enqueue boundary when a database state change and event publication must not diverge.
- Persist progress/checkpoints and enough input identity to resume safely. `accepted`, `enqueued`, `running`, `partially_completed`, `completed`, `failed` and `cancelled` are different states.
- Define poison-message, dead-letter, replay and operator-recovery behavior. Do not treat an in-memory queue or process restart as durable recovery.

## Compatibility And Rollback

- Prefer additive schema/API/event changes, capability negotiation and tolerant readers. Unknown enum/version values must fail visibly or use an explicitly documented safe path.
- Keep display aliases separate from accepted wire codes. Do not broaden a third-party contract by inventing values.
- Define mixed-version behavior during rolling deployment, migration ordering, rollback compatibility and data cleanup timing.
- A rollback signal includes duplicate side effects, lost checkpoints, partial activation, version mismatch, queue divergence, unbounded retries, memory growth or evidence that cannot be reproduced.

## Observability Minimum

- Propagate a correlation/operation/job ID without storing secrets or raw credentials.
- Emit counts for received, accepted, processed, skipped, retried, failed, dead-lettered and completed items where applicable.
- Capture latency by stage, in-flight and queue depth, retry/backoff, resource saturation, checkpoint age and version/capability.
- Log structured failure categories and bounded samples. Do not dump full large payloads or unredacted provider responses.

## Review And Validation Checklist

- [ ] Workload and capacity assumptions are explicit or marked open.
- [ ] Memory, bytes, concurrency, time and retry limits are bounded.
- [ ] Idempotency, deduplication, conflict, lease/fencing and recovery semantics are named.
- [ ] Async progress and terminal states are durable or clearly described as best effort.
- [ ] Version negotiation and rollback across mixed versions are considered.
- [ ] Metrics/logs/traces can distinguish partial, retried, failed and completed work.
- [ ] Validation evidence is reported at the actual tier reached; higher tiers are not inferred.

## Local Helper Boundaries

These are implementation limits, not target-project capacity estimates:

- Source analysis defaults to 500 files (task analysis: 1000), 20000 directory entries, depth 32, 1MiB/file, 16MiB total, 20 errors and a cooperative 10-second scan deadline. Scope with `--root`; tune `--file-limit` (graph: `--limit`), `--entry-limit`, `--max-depth`, `--max-file-bytes`, `--max-total-bytes`, `--max-errors`, and `--max-ms` only when justified.
- Scans do not follow links, infer ignored/generated dependencies or provide an atomic repository snapshot. Graph edges remain shallow JavaScript import/path heuristics, not a cross-language distributed call graph. `freshness.canUseAsEvidence=false` and `completeness.complete=false` require narrower scope or further evidence.
- Graph, task and review-impact scans exclude generated document pages by default; `scope.documentPages` and `diagnostics` expose that policy. `--include-document-pages` is an explicit flag for evidence analysis, not permission to edit immutable pages. Review's changed-file inventory always retains changed pages. Excluded pages still consume directory-entry traversal; scope a large history tree instead of assuming pagination removes scan cost.
- Task scores distinguish path, content and contract-word matches. They select review candidates, not automatic file ownership. Invalid profiles and cyclic dependencies disable parallel readiness; a YAML subset error requires a supported representation, not silent defaults.
- Scan and plan task modes mark immutable pages `read_only`, remove them from worker `owned_files`, and retain them in `read_only_files` plus `forbidden_files`. A page-only unit cannot become a write worker. Existing file conflicts, dependencies and parent authorization gates still apply.
- `recovery --docs-root <absolute-resolved-docs-root>` selects exactly one document root; invalid roots/options fail without falling back to repository docs. Resolve project/branch registration first: `contextVerified=false` explicitly means recovery does not validate that identity. With an explicit root, candidate `path` is docs-relative; otherwise it remains worktree-relative. `docsPath` is always docs-relative. Use `--type` to scope artifact classes and inspect completeness before treating a candidate as the latest. Navigation and immutable pages are excluded; retrieve their content through owner-aware `ae-docs-search` or `ae-memory-search`.
- Issue list uses `--limit`, `--offset` and bounded `--file-limit`. Totals are exact only if `pagination.totalIsExact=true`; pagination is not snapshot-isolated. Markdown records have a 512KiB write/read limit, and the compatible daily ID space remains 999. This is a local tracker, not a high-throughput distributed issue store.
- OpenAPI input is bounded to 1MiB; use `limit:` and `offset:` for result pages. Conversion input remains capped at 10MiB, with `--row-limit`, `--column-limit` and `--max-output-bytes` exposing truncation. Large unsupported inputs must be scoped before invoking these lightweight helpers.
- `gate --validation` is only a declaration. Supply observed records via repeated `--validation-result` JSON objects; execution states require actual timestamps, exit code and an existing nonempty evidence artifact. A blocked gate exits 1. Supplied artifacts are hashed, not independently authenticated, and no command is run by the gate.
- Project installation stages language metadata and CLI loading before journaled component swaps. `--recover <operation-id>` restores an interrupted operation; recovery conflicts preserve user changes. A swap is not a single transaction across every component, and consumers must not run during activation.
- Local installer/tracker locks contain owner, PID, token and expiry metadata. Expired locks are never automatically stolen; verify the writer has stopped before operator recovery. Cross-host/network-filesystem coordination and concurrent project-to-global migration require separate orchestration.
- Update records the fetched revision and installed source fingerprint. `--revision <full-sha>` binds the expected revision; `updated-maintenance-failed` means installation completed but tidy failed. Retry maintenance separately after inspection, not by blindly reinstalling.
