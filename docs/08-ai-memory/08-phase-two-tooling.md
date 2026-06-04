<!-- ae-codex:init managed -->
# Phase Two Tooling Decisions

This memory is repo-specific for `ai-agent-engine-codex`.

## Shallow Graph Helpers

- `ae-graph-build` and `ae-graph-query` are helper CLI commands under `node scripts/ae-tools.mjs`.
- They are shallow, read-only JSON tools for quick dependency previews.
- They scan source files, infer static import edges, detect file mentions, and report external dependencies.
- They intentionally do not write `.ae/graph.db`, maintain freshness, shard graph data, define a persistent graph schema, or render a preview page.
- Promote them to a full MCP-backed graph tool only after schema, write approval, freshness, sharding, and preview requirements are explicit.

## Merge Branch Deferral

- Do not expose `ae-merge-branch` as a Codex skill yet.
- Merge automation writes Git state and needs stronger evidence capture, rollback guidance, and explicit authorization boundaries in `ae-work`.

## Browser And DevTools Routing

- Do not copy OpenCode dynamic Chrome DevTools MCP registration.
- Route browser validation through `ae-test-browser`.
- Use Codex Browser/in-app browser for quick local inspection and screenshots.
- Use Playwright for repeatable scripted flows, viewport checks, console/network capture, and CI-like evidence.
- Use DevTools only when the current Codex session already exposes a stable DevTools-capable tool and Browser/Playwright cannot cover the need.
