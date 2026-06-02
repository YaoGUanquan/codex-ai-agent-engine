<!-- ae-codex:experience -->
# Oh My Codex Workflow Adaptation Experience

## Scope

This note is repo-specific to AI Agent Engine for Codex. The reusable lesson is how to absorb external Codex workflow ideas without importing their runtime or naming model.

## Problem

The AE skills already supported brainstorm, plan, work, review, and LFG orchestration, but the workflow contracts were lightweight. External research of `Yeachan-Heo/oh-my-codex` showed several useful gates: deep clarification, RALPLAN-style deliberate planning, consensus before execution, dual-lane review, execution ledger, and cleanup of AI-generated artifacts.

## Decision

Adopt the process ideas as local AE skill rules:

- strengthen `ae-brainstorm` with repo-grounded discovery and ambiguity tracking,
- strengthen `ae-plan` with decision drivers, ADR-style records, pre-mortem, and layered validation,
- strengthen `ae-lfg` with a consensus gate and checkpoint evidence guidance,
- strengthen `ae-review` with reviewer and architect lanes plus deterministic verdicts,
- strengthen `ae-work` with a cleanup gate for fallback-like code and unrelated churn.

Do not adopt `.omx`, tmux/HUD, oh-my-codex CLI runtime, or external command names.

## Implementation Notes

- Keep changes in `.agents/skills/*` and references so the current AE entrypoints remain stable.
- Put durable rationale in `docs/ae/solutions/`.
- Put closeout evidence in `docs/00-process/archive/YYYY-MM/<task>/`.
- Update `docs/08-ai-memory` only with stable rules, not transient command output.
- On Windows, do not rewrite existing Chinese docs just because terminal output looks garbled. Verify UTF-8 before editing.

## Validation

Commands used:

```powershell
git status --short --branch
git diff --check
Select-String -Path '.agents/skills/ae-*/SKILL.md','.agents/skills/ae-*/references/*.md' -Pattern 'consensus gate|Decision Drivers|ADR-|Pre-Mortem|Lane Verdicts|Cleanup Gate|fallback-like|material ambiguity'
node scripts/ae-tools.mjs recovery
```

## Durable Lessons

- External workflow repositories are best treated as design research. Rewrite the small durable contracts that fit the local project.
- A workflow artifact is not the same as consensus. Record review state, open decisions, and validation contract before implementation.
- Dual-lane review improves signal when code correctness and architecture fit can disagree.
- Cleanup gates should focus on changed files and deterministic fixes to avoid turning delivery into unrelated refactoring.

