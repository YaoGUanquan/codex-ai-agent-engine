<!-- ae-codex:process-archive -->
# SQLite-Vec Knowledge Index Plan Archive

## Status

Deferred. The PRD and detailed execution plan were created and reviewed, but no implementation was started.

## Summary

This archive records the project-level knowledge retrieval proposal for using SQLite FTS5 plus `sqlite-vec` as the first local vector backend. The plan keeps Markdown and JSON artifacts as the source of truth, stores derived index state under `.ae/index/`, and preserves a future adapter boundary for LanceDB, Zvec, Qdrant, Chroma, or another backend.

The document review found the original plan directionally feasible but not executable until dependency distribution and sqlite-vec extension loading were made explicit. The plan has been revised to add:

- `ae-index-doctor` as a required first command.
- U0 as a hard backend dependency and sqlite-vec runtime spike.
- opt-in target-project dependency enablement instead of implicit installer-managed npm installs.
- a JSONL embedding input path so the embedding provider contract can be tested without network access.

## Related Artifacts

- PRD: `docs/ae/prds/2026-06-22-001-project-knowledge-vector-index-prd.md`
- Plan: `docs/ae/plans/2026-06-22-001-sqlite-vec-knowledge-index-plan.md`
- Review verdict before revision: `REQUEST_CHANGES`

## Current Decision

Do not implement now. Keep the plan available for future execution after the project decides whether sqlite-vec should remain the first backend and which target platforms must pass the native extension probe.

## Resume Conditions

Before implementation resumes:

1. Reconfirm the current `sqlite-vec` package version, license, and Node usage.
2. Run or implement `ae-index-doctor` first; do not continue to scanner/chunker/query work until a temporary SQLite vector table can be created and queried.
3. Decide whether target projects must install sqlite-vec explicitly or whether the plugin should gain a separate dependency packaging mechanism.
4. Re-run document review if Node SQLite or sqlite-vec APIs changed since this archive.

## Validation Performed

```powershell
node scripts/ae-tools.mjs task-analyze --mode plan --plan docs/ae/plans/2026-06-22-001-sqlite-vec-knowledge-index-plan.md
node scripts/check-ae-artifacts.mjs
node scripts/ae-tools.mjs review-contract --kind document --mode report-only --targets document
git status --short
```

Results:

- `task-analyze` parsed the plan and recommended serial execution because multiple units share files.
- `check-ae-artifacts` passed.
- `review-contract` selected document review lenses: coherence, feasibility, and evidence.
- Git status showed only the new PRD, plan, and archive files as uncommitted changes.

## Residual Risk

- The revised plan is still unimplemented and has no runtime proof yet.
- `sqlite-vec` is pre-v1; API or extension loading behavior may change before execution.
- The default `hash-v1` embedding path is only a deterministic fallback and does not prove production semantic retrieval quality.
- Target-project backend enablement remains opt-in unless a future plan adds dependency packaging.

## AI Memory

No durable AI memory update was made. This is a deferred plan, not a completed stable implementation decision.
