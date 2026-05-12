---
name: ae-sql
description: Use when the user asks for AE SQL, /ae-sql, database query, schema inspection, SQL generation, SQL review, migration check, data fix plan, or controlled database operation.
---

# AE SQL

Generate, review, or execute SQL with explicit safety boundaries.

## Workflow

1. Identify database type, target environment, tables, and whether the request is read-only or write.
2. Verify schema from repo entities, migrations, DDL, or user-provided database metadata before writing SQL.
3. When the repo indicates Postgres or Supabase, also inspect migrations, indexes, and policy or RLS implications when relevant.
4. For read-only queries, return ready-to-run SQL and explain assumptions.
5. For writes, migrations, deletes, production access, or remote DB calls, require explicit user confirmation and follow Codex escalation rules.
6. Provide rollback or verification SQL for any data-changing statement.

## Rules

- Default to read-only analysis.
- Never invent columns or enum values when the repo can be checked.
- Use transactions or idempotent guards when appropriate.
- Do not run database commands against live systems without explicit approval.
- For schema changes, call out application impact, migration ordering, and verification queries.
