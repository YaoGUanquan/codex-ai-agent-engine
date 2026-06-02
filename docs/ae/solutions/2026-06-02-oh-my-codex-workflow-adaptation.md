<!-- ae-codex:solution -->
# Oh My Codex Workflow Adaptation

## Context

The project reviewed `Yeachan-Heo/oh-my-codex` for workflow ideas that could improve the local AE skills. The useful parts were process contracts, not runtime dependencies. The project intentionally did not import `.omx`, tmux/HUD behavior, or oh-my-codex CLI runtime assumptions.

## Adopted Ideas

- Deep clarification: `ae-brainstorm` now requires repo-grounded discovery before asking questions and tracks material ambiguity before routing to planning.
- RALPLAN-style planning: `ae-plan` now records decision drivers, ADR-style choices, high-risk pre-mortem scenarios, and layered validation.
- Consensus gate: `ae-lfg` now treats requirements, plan, review status, open decisions, and validation contract as the implementation gate. Generated files alone are not consensus.
- Durable execution evidence: S4 work can use `docs/00-process/active/<task>/progress.md`, `ledger.jsonl`, or `handoff.md` when checkpoint evidence improves recovery.
- Dual-lane review: `ae-review` now separates reviewer and architect verdicts, then uses the strictest verdict as the overall result.
- Cleanup gate: `ae-work` now checks changed files for fallback-like code, dead code, speculative abstractions, unrelated formatting churn, and weak tests before final validation.

## Rejected Ideas

- Do not copy oh-my-codex runtime, `.omx` directory layout, tmux/HUD workflow, or Codex CLI assumptions.
- Do not rename AE entrypoints to oh-my-codex command names.
- Do not install third-party skill prompts directly. External skills are research input and must be rewritten into local AE contracts.

## Affected Files

- `.agents/skills/ae-brainstorm/SKILL.md`
- `.agents/skills/ae-plan/SKILL.md`
- `.agents/skills/ae-plan/references/plan-template.md`
- `.agents/skills/ae-lfg/SKILL.md`
- `.agents/skills/ae-lfg/references/pipeline.md`
- `.agents/skills/ae-review/SKILL.md`
- `.agents/skills/ae-review/references/review-output-template.md`
- `.agents/skills/ae-work/SKILL.md`

## Validation

- `git diff --check`
- `Select-String -Path '.agents/skills/ae-*/SKILL.md','.agents/skills/ae-*/references/*.md' -Pattern 'consensus gate|Decision Drivers|ADR-|Pre-Mortem|Lane Verdicts|Cleanup Gate|fallback-like|material ambiguity'`
- `node scripts/ae-tools.mjs recovery`

