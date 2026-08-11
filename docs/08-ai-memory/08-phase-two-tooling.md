<!-- ae-codex:init managed -->
# Phase Two Tooling Decisions

This memory is repo-specific for `ai-agent-engine-codex`.

## Shallow Graph Helpers

- `ae-graph-build` and `ae-graph-query` are helper CLI commands under `node scripts/ae-tools.mjs`.
- Implementation lives in `plugins/ai-agent-engine-codex/scripts/ae-tools/graph.mjs`; the dispatcher is `plugins/ai-agent-engine-codex/scripts/ae-tools.mjs`.
- They are shallow, read-only JSON tools for quick dependency previews.
- They scan source files, infer static import edges, detect file mentions, and report external dependencies.
- They intentionally do not write `.ae/graph.db`, maintain freshness, shard graph data, define a persistent graph schema, or render a preview page.
- Promote them to a full MCP-backed graph tool only after schema, write approval, freshness, sharding, and preview requirements are explicit.

## Maintainer Knowledge Graph (2026-08-11)

- Declared cross-artifact links live in `docs/08-ai-memory/00-registry.json` and are queried with `ae-knowledge-map` / `ae-knowledge-query`.
- Human curator map: `docs/ae/graphs/maintainer-artifact-graph.md`; directory README: `docs/ae/graphs/README.md`.
- This is separate from shallow import scanning: use `ae-graph-build` only for source dependency previews, not for persisting `docs/ae/graphs/graph.json`.

## Maintainer module layout (not a persisted graph)

- The command-module DAG for ae-tools is documented in `docs/ae/references/ae-tools-module-layout.md`.
- `tests/ae-tools.test.mjs` enforces acyclic local imports among `ae-tools/*.mjs`.
- Use `ae-graph-query --root plugins/ai-agent-engine-codex/scripts --path ae-tools.mjs --no-write` for advisory static edges at runtime; do not treat it as proof of complete dynamic resolution.

## Merge Branch Deferral

- Do not expose `ae-merge-branch` as a Codex skill yet.
- Merge automation writes Git state and needs stronger evidence capture, rollback guidance, and explicit authorization boundaries in `ae-work`.

## Browser And DevTools Routing

- Do not copy OpenCode dynamic Chrome DevTools MCP registration.
- Route browser validation through `ae-test-browser`.
- Use Codex Browser/in-app browser for quick local inspection and screenshots.
- Use Playwright for repeatable scripted flows, viewport checks, console/network capture, and CI-like evidence.
- Use DevTools only when the current Codex session already exposes a stable DevTools-capable tool and Browser/Playwright cannot cover the need.
