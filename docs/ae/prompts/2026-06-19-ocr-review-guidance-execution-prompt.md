# OCR Review Guidance Execution Prompt

Use this prompt when asking Codex to execute or review the OCR-inspired AE guidance adaptation.

```text
Use ae-work to execute docs/ae/plans/2026-06-19-002-ocr-review-guidance-adaptation-plan.md.

Scope:
- Update only the files named in the plan.
- Keep plugin source and .agents/skills mirror synchronized.
- Add or update focused regression tests for the new guidance.
- Do not add OCR CLI integration, new ae-tools commands, CI automation, provider configuration, telemetry/session behavior, or a default ae-open-code-review skill.

Required guidance:
- ae-review must apply Diff Review Discipline only to diff-like code scopes.
- ae-review must preserve full and full:<path> scan behavior.
- ae-review must include manual position check and contradiction check language.
- ae-review must reference code-review-rule-profiles.md as optional review lenses, not an automatic rule engine.
- ae-skill-audit must classify deterministic engineering patterns and license compatibility.

Validation:
- node scripts/check-skill-mirror.mjs
- node scripts/check-ae-artifacts.mjs
- npm.cmd test
- npm.cmd run check

Stop conditions:
- Stop if the plan would require OCR runtime integration or new review-scope tooling.
- Stop if source and mirror cannot be kept equivalent.
- Stop if validation fails for reasons outside the plan scope.
```

## What Changed

This prompt makes the implementation boundary explicit, names the exact guidance that must exist, and requires Windows-safe validation commands.
