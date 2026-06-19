<!-- ae-codex:solution -->
# OCR Review Guidance Adaptation

## Context

The project reviewed `alibaba/open-code-review` for ideas that could improve AE code review and external skill audits. OCR's value was its deterministic engineering around review scope, file/rule selection, position handling, and comment reflection. Its CLI runtime, LLM configuration, telemetry, CI examples, and plugin commands were not adopted.

## Adopted Ideas

- Conditional diff discipline: `ae-review` now narrows finding subjects to changed code only for diff-like scopes such as `from:<ref>`, `recent:<N>`, `session`, or default Git diff/status review.
- Full scan preservation: `full` and `full:<path>` reviews remain broad repository/path scans.
- Manual position check: reviewers must confirm path and line context before finalizing code findings, or report path-level uncertainty.
- Contradiction check: reviewers must mark or remove findings only when the reviewed diff directly contradicts a factual claim; context-dependent findings are not discarded merely because the diff alone cannot prove them.
- Rule profiles: `ae-review/references/code-review-rule-profiles.md` provides optional file-type review lenses without adding a rule engine.
- Audit classification: `ae-skill-audit` now captures deterministic engineering patterns and license compatibility.

## Rejected Ideas

- Do not install or call OCR CLI as the default AE review backend.
- Do not add a default `ae-open-code-review` skill.
- Do not copy OCR prompt text, rule documents, Go source, CI scripts, provider configuration, or benchmark claims.
- Do not add OCR's GitHub Actions workflow or `pull_request_target` pattern without a separate CI security design.
- Do not add `review-scope`, `review-preview`, or automated finding-position validation in this phase.

## Affected Files

- `plugins/ai-agent-engine-codex/skills/ae-review/SKILL.md`
- `plugins/ai-agent-engine-codex/skills/ae-review/references/code-review-rule-profiles.md`
- `.agents/skills/ae-review/SKILL.md`
- `.agents/skills/ae-review/references/code-review-rule-profiles.md`
- `plugins/ai-agent-engine-codex/skills/ae-skill-audit/SKILL.md`
- `plugins/ai-agent-engine-codex/skills/ae-skill-audit/references/audit-template.md`
- `.agents/skills/ae-skill-audit/SKILL.md`
- `.agents/skills/ae-skill-audit/references/audit-template.md`
- `tests/skill-scripts.test.mjs`

## Documentation And Memory

- PRD: `docs/ae/prds/2026-06-19-002-ocr-review-guidance-adaptation-prd.md`
- Plan: `docs/ae/plans/2026-06-19-002-ocr-review-guidance-adaptation-plan.md`
- Execution prompt: `docs/ae/prompts/2026-06-19-ocr-review-guidance-execution-prompt.md`
- Experience note: `docs/ae/experience/2026-06-19-ocr-review-guidance-adaptation.md`
- AI memory: `docs/08-ai-memory/11-ocr-review-guidance.md`
- Index and workflow memory updates: `docs/08-ai-memory/00-index.md`, `docs/08-ai-memory/03-key-workflows.md`, `docs/08-ai-memory/05-decision-log.md`

## Validation

- `node scripts/check-skill-mirror.mjs`
- `node scripts/check-ae-artifacts.mjs`
- `npm.cmd test`
- `npm.cmd run check`
- `npm.cmd test -- --test-name-pattern "OCR-inspired review guidance"`

## Follow-Up

Phase 2 may design structured finding schemas, diff hunk mapping, or review-scope previews. Those should remain separate from this documentation-first adaptation until the data model and validation contract are clear.
