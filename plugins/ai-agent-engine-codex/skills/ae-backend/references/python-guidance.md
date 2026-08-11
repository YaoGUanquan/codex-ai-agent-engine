# Python Guidance

Apply this guidance only when the repository uses Python for backend services with frameworks such as FastAPI, Django, Flask, or task workers like Celery.

## Structure And Conventions

1. Follow the existing project layout (apps, routers or blueprints, services, models) instead of restructuring it.
2. Reuse the repository's validation layer (Pydantic models, Django forms and serializers, Marshmallow) for request and response shapes.
3. Match the existing settings pattern (environment-driven settings module, FastAPI dependencies) rather than reading environment variables ad hoc.
4. Keep type hints at public function boundaries when the repository uses them, and run the configured type checker.

## Common Defect Traps

Check these before claiming a backend change is done:

1. Async discipline: never call blocking IO (sync HTTP clients, sync ORM, file IO, `time.sleep`) inside `async def` paths; use the async client or the repository's threadpool offloading pattern.
2. ORM sessions and transactions: keep session and connection scope explicit; no queries after session close, and wrap multi-write operations in one transaction.
3. N+1 queries: use `select_related`/`prefetch_related` (Django) or eager-loading options (SQLAlchemy) for relations that responses serialize.
4. Mutable defaults and module-level state: they leak across requests and tests; construct per-request state explicitly.
5. Datetimes: use timezone-aware UTC datetimes end to end; naive datetimes and implicit local zones corrupt serialized contracts.
6. Exception handling: no silent broad `except Exception`; preserve the traceback and translate to the contract error at the boundary.

## Migration And Deployment Boundaries

1. Generate migrations with the repository's tool (Alembic, Django migrations) and review the generated operations; do not edit schema manually.
2. Keep migrations compatible with the running application during deploys: expand first, backfill, contract in a later release.
3. Keep background tasks idempotent under retry and confirm their arguments serialize safely.
4. Change dependencies through the repository's lock-file mechanism, not ad hoc installs.

## Error And Response Contract

1. Raise the framework's contract errors (FastAPI `HTTPException`, DRF exceptions) or the repository's error envelope; do not return bare dicts with inconsistent shapes.
2. Keep the validation-failure shape consistent with existing endpoints so frontend field-error mapping keeps working.
3. Log internal details server-side; return sanitized messages and accurate status codes to clients.

Validate with the repository's runner (pytest, Django test) plus the configured linter and type checker, narrowing to touched modules first.
