# OCR Review Guidance Adaptation

## Stable Decision

AE adapts selected ideas from `https://github.com/alibaba/open-code-review` as Codex-native review and audit guidance only. Do not vendor OCR CLI, provider configuration, telemetry/session viewer, GitHub Actions workflow, prompt text, rule documents, Go source, or plugin command behavior into this project by default.

## Skill Contracts

- `ae-review`: apply `Diff Review Discipline` only for diff-like code scopes: `from:<ref>`, `recent:<N>`, `session`, or default Git status/diff review.
- `ae-review`: keep `full` and `full:<path>` reviews as broad repository/path scans.
- `ae-review`: before final output, perform a manual position check for code findings and a contradiction check for facts directly contradicted by the reviewed diff.
- `ae-review`: use `references/code-review-rule-profiles.md` as optional review lenses, not as an automatic rule engine.
- `ae-skill-audit`: classify deterministic engineering patterns separately from platform-specific runtime behavior.
- `ae-skill-audit`: record license compatibility before recommending copied templates, prompt text, source-derived assets, or runtime integration.

## Prompt Pattern

For future external review-tool audits, prompts should ask for:

- external source, license, supported harnesses, and runtime assumptions,
- portable deterministic mechanisms,
- platform-specific behavior to reject or defer,
- target AE skill boundaries,
- implementation impact for plugin source, `.agents/skills` mirror, tests, and help metadata,
- validation commands and residual risks.

Reusable prompt shape:

```text
Use ae-skill-audit to inspect <external repo> as reference input only.
Classify portable deterministic engineering patterns, platform-specific runtime behavior, license compatibility, and AE skill fit.
Recommend updates to existing AE skills before proposing a new skill.
If implementation is approved, keep plugin source and .agents/skills mirror synchronized, add focused regression tests, update docs/ae plus docs/08-ai-memory, and validate with check-skill-mirror, check-ae-artifacts, npm test, and npm run check.
Stop if the work requires vendoring external runtime behavior, copying source-derived prompts/rules without license review, or adding new tooling without a schema and validation contract.
```

Do not ask agents to import a third-party skill catalog wholesale.

## Validation Pattern

The regression test `OCR-inspired review guidance is present in source and mirror skills` in `tests/skill-scripts.test.mjs` locks the guidance into both plugin source and `.agents/skills` mirror. Use:

```powershell
npm.cmd test -- --test-name-pattern "OCR-inspired review guidance"
node scripts/check-skill-mirror.mjs
npm.cmd run check
```

## Re-Evaluate When

- AE has a formal finding schema and can validate line positions mechanically.
- A review-scope preview command has a clear JSON schema and user-facing purpose.
- The rule profile reference grows large enough to split by language.
- Users explicitly request OCR CLI integration rather than AE-native guidance.
