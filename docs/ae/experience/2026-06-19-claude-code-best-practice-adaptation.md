<!-- ae-codex:experience -->
# Claude Code Best-Practice Adaptation Experience

## Context

The project audited `shanraisshan/claude-code-best-practice` as an external workflow reference and adapted only the portable process contracts into Codex-native AE skills.

## Decision

Keep the adaptation rewrite-only. Do not vendor Claude runtime files, hook settings, command catalogs, sound assets, schedules, agent registries, or prompt text.

## Implementation

- Commit: `3e7f01a feat: adapt Claude Code best-practice guidance`
- Branch merged to `main`: `codex/claude-code-best-practice-adaptation`
- Skills updated: `ae-skill-audit`, `ae-skill-creator`, `ae-agent-creator`, `ae-claude-code`, `ae-plan`, `ae-review`, and `ae-save-experience`
- Script behavior: `claude-delegate` now reports diagnostics when Claude exits `0` with empty stdout and stderr
- Tests: focused regression coverage was added in `tests/skill-scripts.test.mjs`

## Validation

```powershell
npm.cmd test
npm.cmd run check
node scripts/check-skill-mirror.mjs
node scripts/check-ae-artifacts.mjs
git diff --check
```

All listed checks passed before merge and again on `main`.

## Reusable Lesson

For external agent or Claude Code repositories, adapt taxonomy, routing criteria, evidence gates, and diagnostics. Reject runtime behavior unless Codex exposes an equivalent enforcement point. Store temporary prompts in process archives, durable decisions in `docs/08-ai-memory`, and reusable implementation lessons in `docs/ae/experience`.
