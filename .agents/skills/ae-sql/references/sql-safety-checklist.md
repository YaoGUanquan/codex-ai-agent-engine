# SQL Safety Checklist

Classify every statement before writing or reviewing it, then apply the safeguards for its tier.

## Operation Risk Tiers

1. Read-only (`SELECT`, `EXPLAIN`): safe by default; still bound result size on unfamiliar tables.
2. Reversible write (`INSERT`, or `UPDATE`/`DELETE` with a verified predicate and captured before-state): requires explicit confirmation, a transaction, and a rollback statement.
3. Hard-to-reverse write (mass `UPDATE`/`DELETE`, `TRUNCATE`, type narrowing, dropping columns or tables): requires explicit confirmation, a backup or captured snapshot, and a staged rollout.
4. Locking or blocking DDL (table rewrites, index builds without a concurrent option, lock-heavy migrations): requires a lock-impact statement and a deployment-window decision.

## Migration Safety

1. Pair every forward migration with a rollback path, or state explicitly that it is irreversible and why that is accepted.
2. Keep migrations compatible with the currently running application version: expand first (add nullable column, backfill, switch reads), contract later in a separate release.
3. State ordering dependencies between the migration and the code deploy.
4. Estimate lock duration on representative row counts when a table is large or hot.

## Review Checks

1. Every `UPDATE` or `DELETE` has a `WHERE` clause reviewed against an expected row count (`SELECT COUNT(*)` with the same predicate first).
2. New indexes name the query they serve; removed indexes name the consumers that were checked.
3. Constraint changes (`NOT NULL`, unique, foreign keys) are validated against existing data before applying.
4. Dialect differences are checked before porting syntax: upsert (`ON CONFLICT` versus `ON DUPLICATE KEY` versus `MERGE`), returning clauses, identifier quoting and case sensitivity, and transactional DDL support differ across Postgres, MySQL, SQLite, and SQL Server.
5. RLS policies, permissions, and trigger side effects stay in scope when the engine uses them.
