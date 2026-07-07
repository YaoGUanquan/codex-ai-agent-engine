# Codex Skill Slash Discoverability

## Stable Decision

AE for Codex should improve entrypoint discoverability through supported Codex skill metadata and descriptions, not by claiming OpenCode `config.command`-style slash command registration.

Use this phrasing in future docs and plans:

- Supported direction: "Codex skill-backed discoverability" or "enabled skills may be discoverable through Codex skill or slash search surfaces."
- Unsupported claim: "AE automatically registers Codex slash commands" unless a verified Codex API exists in the active runtime.

## Source Artifacts

- PRD: `docs/ae/prds/2026-07-07-002-codex-skill-slash-discoverability-prd.md`
- Plan: `docs/ae/plans/2026-07-07-006-codex-skill-slash-discoverability-plan.md`
- Port analysis note: `docs/codex-port-analysis.md`

## Reusable Workflow

When optimizing AE skill entrypoints:

1. Treat `plugins/ai-agent-engine-codex/scripts/skill-language-metadata.mjs` as the metadata source.
2. Keep plugin source and `.agents/skills` mirror synchronized.
3. Update README/help/catalog wording with claim boundaries.
4. Add regression tests for metadata wording and unsupported runtime claims.
5. Validate with `node scripts/check-skill-mirror.mjs`, `node scripts/check-skill-language-metadata.mjs`, `node scripts/check-skill-contract.mjs`, `node scripts/check-install-smoke.mjs`, and `node scripts/check-ae-artifacts.mjs`.
6. Record manual fresh Codex thread verification separately because local file checks cannot prove the current app slash UI behavior.

## Boundary

Do not implement deprecated prompt shims as the primary path for AE workflow entrypoints. Do not add MCP auto-loading, hooks, global config propagation, or always-on agent registries to simulate command registration.
