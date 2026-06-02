<!-- ae-codex:process-archive -->
# Oh My Codex Workflow Adaptation Archive

## Status

Done.

## Summary

Reviewed `Yeachan-Heo/oh-my-codex` as external workflow research and adapted selected ideas into local AE skills. The project kept AE naming and artifact layout, and rejected importing oh-my-codex runtime behavior.

## Implemented Changes

- `ae-brainstorm`: repo-grounded clarification and material ambiguity gate.
- `ae-plan`: decision drivers, ADR-style decisions, high-risk pre-mortem, layered validation.
- `ae-lfg`: consensus gate and lightweight S4 execution evidence guidance.
- `ae-review`: reviewer lane, architect lane, deterministic verdict rules.
- `ae-work`: cleanup gate for fallback-like code, dead code, speculative abstractions, formatting churn, weak tests, and inaccurate comments.

## Related Artifacts

- `docs/ae/solutions/2026-06-02-oh-my-codex-workflow-adaptation.md`
- `docs/ae/experience/2026-06-02-oh-my-codex-workflow-adaptation.md`
- `docs/08-ai-memory/03-key-workflows.md`
- `docs/08-ai-memory/05-decision-log.md`
- `docs/08-ai-memory/06-agent-maintenance-rules.md`

## Validation Evidence

```powershell
git diff --check
Select-String -Path '.agents/skills/ae-*/SKILL.md','.agents/skills/ae-*/references/*.md' -Pattern 'consensus gate|Decision Drivers|ADR-|Pre-Mortem|Lane Verdicts|Cleanup Gate|fallback-like|material ambiguity'
node scripts/ae-tools.mjs recovery
```

`git diff --check` returned no whitespace errors. `node scripts/ae-tools.mjs recovery` returned the current repository and existing AE artifacts successfully.

## Residual Risk

- Some existing Chinese docs display as mojibake in default PowerShell output. This was treated as terminal encoding behavior and those files were not rewritten.
- The new rules are prompt-level workflow contracts; they should be exercised in future AE tasks and refined if they create too much ceremony for small changes.

