---
type: prd
status: drafted
date: 2026-06-19
topic: ocr-review-guidance-adaptation
---

# PRD: OCR-Inspired AE Review Guidance Adaptation

## Background

Two read-only audits compared `alibaba/open-code-review` with this project's Codex-native AE skills.

The first audit found that Open Code Review's strongest transferable ideas are deterministic review constraints: file selection, file-type rule matching, diff-subject discipline, line-location checking, and review-comment reflection. The audit rejected direct adoption of OCR as the default AE review backend because it introduces a separate CLI runtime, separate LLM configuration, telemetry/session semantics, and overlapping review behavior.

The second audit used local Claude Code CLI through `ae-claude-code` in read-only patch-proposal mode. That review agreed with the direction but found the original adaptation plan too broad in three places:

- `Diff Focus Contract` must be conditional on diff-like review scopes, not global to all `ae-review` modes.
- `Position Drift Guard` needs schema and tooling that do not exist yet, so it should start as manual guidance only.
- `Reflection Pass` should be reframed as a contradiction check that marks or lowers confidence, not an automatic discard gate.

## Goal

Strengthen AE review and external skill audit guidance with OCR-inspired deterministic review discipline, while preserving Codex-native skill boundaries and avoiding new runtime dependencies.

## Affected Systems

- `ae-review`: code review scope discipline, manual finding-position checks, contradiction handling, and optional rule-profile references.
- `ae-skill-audit`: external repository audit classification, especially deterministic engineering patterns and license compatibility.
- Project validation: source/mirror skill consistency, artifact frontmatter checks, and focused regression tests.

## Functional Requirements

1. `ae-review` must distinguish diff-like code review scopes from full scans.
2. For diff-like code review scopes, `ae-review` must direct findings toward newly added or modified code while allowing unchanged/deleted code and other files as supporting context.
3. `ae-review` must include manual position-check guidance for code findings without implying automated line validation exists.
4. `ae-review` must include a diff contradiction check that marks or lowers confidence for findings directly contradicted by the reviewed diff.
5. The contradiction check must not silently discard context-dependent security, reliability, contract, or architecture findings merely because the diff alone cannot prove them.
6. `ae-review` should gain an AE-authored rule-profile reference for common file and language review concerns.
7. `ae-skill-audit` must classify deterministic engineering patterns separately from platform-specific runtime behavior.
8. `ae-skill-audit` must record license compatibility as part of external repository evaluation.
9. Plugin source files and `.agents/skills` mirror files must remain synchronized.
10. The implementation must not add a default `ae-open-code-review` skill, must not call OCR from AE by default, and must not add CI automation based on OCR examples.

## Acceptance Criteria

1. `plugins/ai-agent-engine-codex/skills/ae-review/SKILL.md` and `.agents/skills/ae-review/SKILL.md` contain conditional diff-scope guidance, manual position-check guidance, and contradiction-check guidance.
2. `plugins/ai-agent-engine-codex/skills/ae-review/references/code-review-rule-profiles.md` and its `.agents` mirror exist with AE-authored guidance, not copied OCR text.
3. `plugins/ai-agent-engine-codex/skills/ae-skill-audit/SKILL.md` and `.agents/skills/ae-skill-audit/SKILL.md` include deterministic engineering pattern classification and license compatibility checks.
4. `plugins/ai-agent-engine-codex/skills/ae-skill-audit/references/audit-template.md` and its `.agents` mirror include deterministic engineering and license compatibility sections.
5. A focused test in `tests/skill-scripts.test.mjs` asserts the new guidance exists in both plugin source and mirror.
6. `node scripts/check-skill-mirror.mjs` reports `status: ok`.
7. `node scripts/check-ae-artifacts.mjs` reports `status: ok`.
8. `npm test` passes.
9. `npm run check` passes or any failure is explained with exact blocker and residual risk.

## Non-Goals

- Do not implement automated diff hunk mapping or finding-position validation.
- Do not add `review-scope`, `review-preview`, or `validate-finding-position` commands in this phase.
- Do not add OCR CLI as a runtime dependency.
- Do not add a default `ae-open-code-review` skill.
- Do not copy OCR prompt text, Go source, CI scripts, or rule documents into this GPL-2.0-only project.
- Do not change `ae-work` to automatically call `ae-review`.
- Do not change GitHub Actions or repository release automation.

## Constraints

- Keep changes documentation-first and compatible with existing AE skill boundaries.
- Use repository-relative paths in implementation artifacts.
- Keep plugin source and `.agents/skills` mirror byte-equivalent after normalization.
- Preserve existing `ae-review` support for `full` and `full:<path>` scans.
- Treat external repositories as reference input only.

## Validation Expectations

- Static mirror validation: `node scripts/check-skill-mirror.mjs`.
- Artifact frontmatter validation: `node scripts/check-ae-artifacts.mjs`.
- Focused test suite: `npm test`.
- Full project check: `npm run check`.
- Optional plan review before execution: `ae-review domain:document mode:report-only` on the implementation plan.

## Assumptions

- The next execution pass will implement only Phase 1 documentation and test changes.
- Tooling for automated line-position validation will be designed separately if still needed.
- The current project preference is to improve existing AE skills before creating new skills.

## Open Questions

- Should Phase 2 introduce a new script command for review-scope previews, or should review scope remain manual until finding schemas are formalized?
- Should rule profiles remain one combined reference file, or later split by language if the file becomes too long?
