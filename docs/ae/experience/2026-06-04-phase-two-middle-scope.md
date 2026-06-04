<!-- ae-codex:experience -->
# Phase Two Middle Scope Experience

## Scope

This note is repo-specific to AI Agent Engine for Codex. The reusable lesson is how to introduce higher-value OpenCode-inspired capabilities without importing their runtime or overcommitting to a full implementation too early.

## Problem

The next candidate capabilities were graph build/query, merge branch automation, and Chrome DevTools integration. All three have value, but each carries different risk:

- graph build/query is useful but can become a large persistent schema, freshness, sharding, and preview-page project,
- merge branch automation writes Git state and needs explicit authorization and rollback evidence,
- Chrome DevTools integration in OpenCode depends on dynamic MCP registration that Codex does not expose as a stable project-local contract.

## Decision

Adopt only the shallow, low-risk parts:

- implement `ae-graph-build` and `ae-graph-query` as read-only local JSON helper commands,
- document that full graph persistence and preview UX remain future work,
- defer `ae-merge-branch` until `ae-work` has stronger Git evidence and authorization boundaries,
- strengthen `ae-test-browser` route selection for Browser, Playwright, and already available DevTools tooling instead of creating a separate dynamic MCP skill.

## Implementation Notes

- Keep graph commands in `plugins/ai-agent-engine-codex/scripts/ae-tools.mjs`; the root `scripts/ae-tools.mjs` remains a wrapper.
- Keep graph output bounded and explicit about limitations.
- Add tests for graph edges and query filtering before relying on the helper in `npm run check`.
- Record deferrals in the capability catalog so future work does not accidentally claim unsupported runtime behavior.

## Validation

Commands used:

```powershell
npm.cmd test
npm.cmd run check
git diff --check
node scripts/check-skill-mirror.mjs
```

## Durable Lessons

- A shallow helper command can provide useful dependency visibility without prematurely designing a persistent graph platform.
- Git merge automation should not be treated as a normal workflow skill until evidence capture, rollback, and explicit authorization rules are mature.
- DevTools-style browser debugging should be routed through the browser tools actually available in the Codex session, not through OpenCode dynamic MCP assumptions.
