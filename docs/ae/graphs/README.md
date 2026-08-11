<!-- ae-codex:reference -->
# Graph Artifacts In This Repository

## Shallow dependency graph (CLI, not persisted)

`ae-graph-build` and `ae-graph-query` return JSON previews only. They **do not** write files here by design (see `docs/ae/prds/2026-07-10-001-graph-helper-read-only-contract-prd.md`).

Example maintainer queries after the 0.3.20 module split:

```powershell
node scripts/ae-tools.mjs ae-graph-query --root plugins/ai-agent-engine-codex/scripts --path ae-tools.mjs --no-write
node scripts/ae-tools.mjs ae-graph-build --root plugins/ai-agent-engine-codex/scripts/ae-tools --no-write
```

Module import layering is also documented in `docs/ae/references/ae-tools-module-layout.md` (maintainer contract, not a runtime snapshot).

## Declared knowledge graph (registry)

Cross-artifact links between memory, plans, experience notes, and references live in `docs/08-ai-memory/00-registry.json`. Inspect with:

```powershell
node scripts/ae-tools.mjs ae-knowledge-map --root . --limit 40
node scripts/ae-tools.mjs ae-knowledge-query --root . --path docs/08-ai-memory/05-decision-log.md --direction both --limit 20
```

Human-readable maintainer map: [`maintainer-artifact-graph.md`](maintainer-artifact-graph.md).

## What belongs in this directory

| Artifact | Purpose |
| --- | --- |
| `README.md` | Boundary and query commands (this file) |
| `maintainer-artifact-graph.md` | Curated 2026-08-11 delivery graph (plans → code → memory) |
| `graph.json` | **Not used** — reserved path name only; shallow CLI keeps `store.written: false` |

Do not commit large auto-generated diff snapshots here; review evidence uses fingerprinted artifacts under `docs/ae/evidence/artifacts/` (see drafted PRD `docs/ae/prds/2026-08-11-knowledge-base-governance-prd.md`).
