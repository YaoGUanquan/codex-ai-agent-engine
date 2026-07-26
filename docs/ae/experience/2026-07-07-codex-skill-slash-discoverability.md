<!-- ae-codex:experience -->
# Codex Skill Slash Discoverability Experience

## Context

The project needed AE workflow entrypoints to feel closer to the upstream AI Agent Engine entry experience in Codex without claiming unsupported OpenCode runtime behavior. The risk was wording or metadata that implied `/ae-*` commands were dynamically registered by this repository.

## Decision

Use Codex skill-backed discoverability as the supported mechanism. Keep `/ae-*` as compatibility labels, and make explicit skill names, `$ae-*`, and natural-language requests the reliable invocation paths.

Do not add prompt shims, MCP auto-loading, hooks, global config writes, command registries, or always-on agent registries to simulate OpenCode `config.command`.

## Implementation

- PRD: `docs/ae/prds/2026-07-07-002-codex-skill-slash-discoverability-prd.md`
- Plan: `docs/ae/plans/2026-07-07-006-codex-skill-slash-discoverability-plan.md`
- Canonical metadata generator: `plugins/ai-agent-engine-codex/scripts/skill-language-metadata.mjs`
- Core source skills:
  - `plugins/ai-agent-engine-codex/skills/ae-brainstorm/SKILL.md`
  - `plugins/ai-agent-engine-codex/skills/ae-lfg/SKILL.md`
  - `plugins/ai-agent-engine-codex/skills/ae-plan/SKILL.md`
  - `plugins/ai-agent-engine-codex/skills/ae-prd/SKILL.md`
  - `plugins/ai-agent-engine-codex/skills/ae-review/SKILL.md`
  - `plugins/ai-agent-engine-codex/skills/ae-work/SKILL.md`
- Mirror skills under `.agents/skills/` were kept synchronized.
- Regression coverage: `tests/skill-scripts.test.mjs`.

## Validation

```powershell
npm test
npm run check
git diff --check
```

All listed commands passed on 2026-07-07 before pushing `67896d0 feat: strengthen AE skill trigger metadata` to `origin/main`.

## Reusable Lesson

When improving Codex skill entrypoints, strengthen three layers together:

1. `SKILL.md` frontmatter for model routing.
2. `agents/openai.yaml` metadata for UI/search surfaces.
3. Regression tests for source/mirror drift and unsupported runtime claims.

Keep runtime claims evidence-bound. Local repository checks can prove metadata, mirror synchronization, and wording, but they cannot prove a specific Codex App slash/search UI state.

## Remaining Manual Evidence

Before release text claims observed UI behavior, open a fresh Codex App thread, type `/`, search `ae-plan` and `ae-prd`, and record the observed result. Treat that as app-version-specific evidence, not as command registration implemented by this repository.
