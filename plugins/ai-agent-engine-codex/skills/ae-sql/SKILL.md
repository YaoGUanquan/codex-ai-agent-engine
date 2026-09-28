---
name: ae-sql
description: Use when the user asks for AE SQL, /ae-sql, database query, schema inspection, SQL generation, SQL review, migration check, data fix plan, or controlled database operation.
---

# AE SQL

For large tables, backfills or concurrent writes, use the [scale and distributed engineering contract](../ae-help/references/scale-and-distributed-engineering.md) with the existing data-access contract. Inspect plans, lock/transaction budgets, resumable ranges and mixed-version migrations; SQL preparation never authorizes execution.

Generate, review, or execute SQL with explicit safety boundaries.

For query/list/count/export or multi-row writes, apply the [data-access and scale contract](../ae-backend/references/data-access-contract.md). Compare set-based and bounded batch execution, distinguish flush from commit, and preserve atomicity instead of generating unjustified per-row submissions. For large joins/aggregates, compare indexes and maintained read models; verify data and count separately. This adds no database execution permission.

For any validation of generated SQL, read the [test side-effect boundary](../ae-help/references/test-side-effect-boundary.md). Inspect SQL statically or use isolated fixtures; never connect to a user-managed database merely to check a query or plan. If isolation cannot be proven, report validation as `blocked`.

## Workflow

1. Identify database type, target environment, tables, and whether the request is read-only or write.
2. Verify schema from repo entities, migrations, DDL, or user-provided database metadata before writing SQL.
3. When the repo indicates Postgres or Supabase, also inspect migrations, indexes, and policy or RLS implications when relevant.
4. Classify the operation risk tier with `references/sql-safety-checklist.md` before generating or reviewing any write, migration, or DDL statement.
5. For a new or materially changed durable table, read `../ae-backend/references/persistence-contract.md` and verify its decisions against entity mappings and DDL.
6. For read-only queries, return ready-to-run SQL and explain assumptions.
7. For writes, migrations, deletes, production access, or remote DB calls, require explicit user confirmation and follow Codex escalation rules.
8. Provide rollback or verification SQL for any data-changing statement.

## Rules

- Default to read-only analysis.
- Never invent columns or enum values when the repo can be checked.
- Use transactions or idempotent guards when appropriate.
- Do not run database commands against live systems without explicit approval.
- For schema changes, call out application impact, migration ordering, and verification queries.
