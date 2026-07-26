---
type: process-note
status: done
date: 2026-07-07
topic: codex-skill-slash-discoverability
---

# Codex Skill Slash Discoverability Progress

## Scope

Improve AE workflow entrypoint discoverability in Codex through skill metadata, trigger descriptions, documentation boundaries, and regression tests. Do not implement or claim OpenCode `config.command` style slash command registration.

## Artifacts

- PRD: `docs/ae/prds/2026-07-07-002-codex-skill-slash-discoverability-prd.md`
- Plan: `docs/ae/plans/2026-07-07-006-codex-skill-slash-discoverability-plan.md`
- Experience: `docs/ae/experience/2026-07-07-codex-skill-slash-discoverability.md`
- AI memory: `docs/08-ai-memory/12-codex-skill-slash-discoverability.md`
- Port analysis: `docs/codex-port-analysis.md`

## Timeline

- 2026-07-07: Captured PRD and implementation plan for Codex skill-backed discoverability.
- 2026-07-07: Updated README, release checklist, `ae-help`, and capability catalog wording to distinguish skill-backed discoverability from OpenCode runtime command registration.
- 2026-07-07: Strengthened six core workflow entrypoints: `ae-prd`, `ae-plan`, `ae-brainstorm`, `ae-work`, `ae-review`, and `ae-lfg`.
- 2026-07-07: Added regression coverage for stable core trigger signals and unsupported slash-command claim boundaries.
- 2026-07-07: Pushed final implementation to `origin/main`.

## Validation Result

- Passed: `npm test` with 71 tests.
- Passed: `npm run check`.
- Passed: `git diff --check`.
- Passed through `npm run check`:
  - `node scripts/check-skill-mirror.mjs`
  - `node scripts/check-skill-language-metadata.mjs`
  - `node scripts/check-skill-contract.mjs`
  - `node scripts/check-install-smoke.mjs`
  - `node scripts/check-ae-artifacts.mjs`

## Git Evidence

- Planning commit: `022a19c docs: plan Codex skill discoverability`
- Documentation boundary commit: `60d05c2 docs: clarify Codex skill discoverability`
- Final metadata commit: `67896d0 feat: strengthen AE skill trigger metadata`

## Result

- Core AE skills now expose stable names in UI metadata and frontmatter trigger descriptions.
- Plugin source and `.agents/skills` mirror remain synchronized.
- Local deterministic checks cover metadata drift and unsupported runtime claim wording.
- Runtime slash/search UI visibility remains a manual Codex App verification item.

## Residual Risk

The repository can prove metadata and wording, but it cannot prove whether a given Codex App version/session displays enabled AE skills in `/` or skill search. Record that observation separately before making release-specific UI visibility claims.
