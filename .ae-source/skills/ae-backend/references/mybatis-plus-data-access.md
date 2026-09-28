# MyBatis-Plus Data Access

Apply only when the target repository actually uses MyBatis-Plus. Inspect the actual resolved MyBatis-Plus version, JSqlParser dependency, driver, database dialect, mapper XML/annotations and interceptor configuration before selecting an API. Verify behavior against that version's source/docs; the choices below are conditional, not mandatory flags.

## Pagination And Count Decision

Trace the real mapper statement, `IPage`/`Page` construction, pagination interceptor and tenant/data-permission/dynamic-table interception. Capture sanitized generated SQL and bindings for both data and count. Check plugin ordering and parser/dialect compatibility against the installed version.

| Condition | Candidate decision | Required proof |
| --- | --- | --- |
| Simple supported query and correct/acceptable automatic count | Keep default pagination/count | Data and count return the expected logical rows and meet budget |
| Join removal changes count membership or multiplicity | Per-page `setOptimizeJoinOfCountSql(false)` if supported, or explicit count | Preserve required joins and count the intended roots/groups, not accidental joined rows |
| Parser cannot safely rewrite the actual SQL, such as a dialect-specific expression | Per-page `setOptimizeCountSql(false)` if supported, or explicit count | Generated fallback SQL executes with correct bindings and totals on the real database |
| Exact total is required but automatic count is wrong or expensive | Dedicated mapper count via `countId` or the repository's separate count path | Same filters, tenant, authorization, deletion and grouping; test actual statement resolution and interceptor scope |
| Caller explicitly does not need a total | `setSearchCount(false)` with existing cursor/slice/hasNext contract | No count issued; no fabricated zero or page-length total; correct final-page behavior |

Do not disable count optimization globally as a blanket performance fix. Disabling rewrite does not by itself make count cheap or turn joined rows into root counts. A wrapper subquery may still be slow or incompatible. If using a separately executed count, prevent the page query from issuing a second hidden count and assign totals through the established response contract.

Avoid `SELECT *` and ambiguous unqualified aliases in joined pagination. For a root list with one-to-many relations, compare root-key selection plus bounded hydration or `EXISTS`; do not paginate expanded rows then deduplicate. Test zero/many children, child filters, tied order values, empty and deep pages. Complex `DISTINCT`, `GROUP BY`, `UNION`, nested or dialect-specific SQL requires its own total semantics rather than a universal flag.

## Batch And Transaction Reality

Inspect the implementation of the chosen `saveBatch`, mapper batch or executor API in the installed version. Separate accumulation, execution/flush and commit. A Java loop using a batch executor can be valid; a loop invoking a single-row mapper under autocommit is not equivalent. Verify executor/session configuration and driver batching behavior rather than rejecting every loop or trusting a batch method name.

Verify transaction management, session closure, flush timing, generated IDs, audit fill, logical deletion, optimistic versions and error/result reporting. Driver update counts may use success-without-exact-count conventions; do not interpret them as precise per-row business success without supported evidence/readback. Driver rewrite settings are version/statement dependent, not a universal performance switch.

An outer Spring transaction can keep all chunks in one commit even when the batch API flushes repeatedly. Independent chunk transactions require explicit partial-success semantics and a real transaction boundary; self-invocation of a proxied annotation may not create one. Reuse existing transaction facilities and do not open ad hoc sessions that bypass tenant/auth interceptors or transaction ownership.

## Verification Boundary

A mocked `Page` flag assertion proves configuration intent only. Apply the [test side-effect boundary](../../ae-help/references/test-side-effect-boundary.md) before runtime verification: use static repository metadata, synthetic fixtures, or a disposable test-only datasource / explicitly authorized isolated profile to verify generated data/count SQL, unique result IDs, total, interceptor scope, batch flush/commit behavior and failure recovery. If isolation cannot be proven, report runtime verification as `blocked`; never fall back to a user-managed database or driver. Preserve parser/count errors as evidence rather than hiding them behind fabricated success.

Official reference locations to inspect for the target version:

```text
https://baomidou.com/plugins/pagination/
https://baomidou.com/guides/batch-operation/
https://github.com/baomidou/mybatis-plus
```
