# Phase Two Middle Scope Solution Archive

## Summary

This archive records the completed middle-scope Phase 2 adaptation for AI Agent Engine for Codex.

The work intentionally avoids a direct OpenCode runtime port. It adds shallow graph helper scripts, records merge-branch deferral, and routes Chrome DevTools-style needs through existing Codex browser tooling.

## Final Decisions

- `ae-graph-build` and `ae-graph-query` are local helper commands, not top-level Codex skills.
- The graph helpers are shallow and read-only. They scan source files, infer static import edges and file mentions, and emit JSON.
- The graph helpers do not write `.ae/graph.db`, maintain freshness, shard graph data, define a persistent graph schema, or render a preview page.
- `ae-merge-branch` remains deferred because it involves Git write operations and needs stronger `ae-work` evidence, rollback, and authorization boundaries.
- `ae-chrome-devtools` is not copied as a dynamic MCP registration flow. Browser validation is routed through `ae-test-browser` using Codex Browser, Playwright, or an already available DevTools-capable tool.

## Key Artifacts

- CLI implementation: `plugins/ai-agent-engine-codex/scripts/ae-tools.mjs`
- Root wrapper: `scripts/ae-tools.mjs`
- Browser routing docs:
  - `plugins/ai-agent-engine-codex/skills/ae-test-browser/SKILL.md`
  - `plugins/ai-agent-engine-codex/skills/ae-test-browser/references/browser-acceptance.md`
- Capability catalog:
  - `plugins/ai-agent-engine-codex/skills/ae-help/references/capability-catalog.json`
  - `.agents/skills/ae-help/references/capability-catalog.json`
- Tests: `tests/skill-scripts.test.mjs`
- Related analysis: `docs/codex-port-analysis.md`

## Validation

- `npm.cmd test`
- `npm.cmd run check`
- `git diff --check`
- `node scripts/check-skill-mirror.mjs`

## Residual Risks

- Graph output is intentionally incomplete for dynamic imports, generated code, path aliases, framework-specific resolution, and non-JavaScript ecosystems.
- Full graph persistence and preview UX remain future work.
- Merge automation remains intentionally unavailable until Git safety evidence is stronger.
