---
name: ae-sql
description: Use when the user asks for AE SQL, /ae-sql, database query, schema inspection, SQL generation, SQL review, migration check, data fix plan, or controlled database operation.
---

# AE SQL

Generate, review, or execute SQL with explicit safety boundaries.

For query/list/count/export or multi-row writes, apply the [data-access and scale contract](../ae-backend/references/data-access-contract.md). Compare set-based and bounded batch execution, distinguish flush from commit, and preserve atomicity instead of generating unjustified per-row submissions. For large joins/aggregates, compare indexes and maintained read models; verify data and count separately. This adds no database execution permission.

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
