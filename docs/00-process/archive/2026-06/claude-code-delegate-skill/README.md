<!-- ae-codex:process-archive -->
# Claude Code Delegate Skill Archive

## Status

Done.

## Summary

Implemented the `ae-claude-code` skill and `claude-delegate` wrapper so Codex can delegate bounded analysis or patch-proposal work to a locally installed Claude Code CLI while keeping Codex as orchestrator and validator.

## Related Artifacts

- Requirements: `docs/ae/brainstorms/2026-06-12-claude-code-delegate-skill-requirements.md`
- Plan: `docs/ae/plans/2026-06-12-001-claude-code-delegate-skill-plan.md`
- Progress: `docs/00-process/archive/2026-06/claude-code-delegate-skill/progress.md`
- Gate evidence: `docs/ae/gates/20260612T041914Z-work-final.json`

## Validation Evidence

The archived progress file records passing mirror, metadata, install smoke, `npm.cmd test`, and `npm.cmd run check` validation. It also records follow-up validation for Windows `.cmd` shim support and stdin prompt delivery.

## Residual Risk

Claude Code CLI behavior and authentication remain local-environment dependent. The wrapper normalizes availability and invocation evidence; it does not install Claude or authorize unattended write delegation.
