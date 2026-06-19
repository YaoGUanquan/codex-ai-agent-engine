---
type: plan
status: completed
date: 2026-06-19
title: ocr-review-guidance-adaptation
origin: docs/ae/prds/2026-06-19-002-ocr-review-guidance-adaptation-prd.md
---

# OCR Review Guidance Adaptation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` when executing independent units with explicit user approval, or execute inline with `ae-work` for this small documentation-first change. Steps use checkbox syntax for tracking in execution notes if converted into tasks.

**Goal:** Add OCR-inspired deterministic review discipline to AE review/audit guidance without adopting OCR runtime behavior.

**Architecture:** This is a Phase 1 documentation and regression-test change. It updates plugin skill source first, mirrors the same files under `.agents/skills`, and adds tests that lock source/mirror guidance. Automated review-scope tooling and line-position validation are deferred.

**Tech Stack:** Codex skills in Markdown, Node.js built-in test runner, AE validation scripts.

---

## Source

- PRD: `docs/ae/prds/2026-06-19-002-ocr-review-guidance-adaptation-prd.md`
- Prior analysis 1: Codex read-only audit of `alibaba/open-code-review` at HEAD `1793de0ff260c09d7d8a2a5b1be0620669828887`.
- Prior analysis 2: Claude Code CLI read-only review through `node scripts/ae-tools.mjs claude-delegate`, verdict `REQUEST_CHANGES`.
- Existing governing docs:
  - `AGENTS.md`
  - `docs/ae/constitution.md`
  - `.agents/skills/ae-review/SKILL.md`
  - `.agents/skills/ae-skill-audit/SKILL.md`

## Scope

In scope:

- Update `ae-review` source and mirror with conditional diff-scope review discipline.
- Add a new `ae-review` reference file for AE-authored code review rule profiles.
- Update `ae-skill-audit` source and mirror with deterministic engineering and license compatibility checks.
- Update `ae-skill-audit` audit template source and mirror.
- Add regression tests for the new skill guidance.
- Run project validation.

Out of scope:

- No OCR CLI integration.
- No new `ae-open-code-review` skill.
- No `review-scope`, `review-preview`, or `validate-finding-position` command.
- No automated finding schema or diff hunk mapper.
- No CI workflow changes.
- No automatic `ae-work` to `ae-review` orchestration.

## Readiness

- Goal: Clear. Strengthen skill guidance using low-risk portable patterns from OCR.
- Acceptance criteria: Defined in the PRD and mapped to U1-U5.
- Non-goals: Explicitly exclude OCR runtime, scripts, automation, and default autofix behavior.
- Affected areas:
  - `plugins/ai-agent-engine-codex/skills/ae-review/SKILL.md`
  - `plugins/ai-agent-engine-codex/skills/ae-review/references/code-review-rule-profiles.md`
  - `.agents/skills/ae-review/SKILL.md`
  - `.agents/skills/ae-review/references/code-review-rule-profiles.md`
  - `plugins/ai-agent-engine-codex/skills/ae-skill-audit/SKILL.md`
  - `plugins/ai-agent-engine-codex/skills/ae-skill-audit/references/audit-template.md`
  - `.agents/skills/ae-skill-audit/SKILL.md`
  - `.agents/skills/ae-skill-audit/references/audit-template.md`
  - `tests/skill-scripts.test.mjs`
- Validation surface: mirror check, artifact check, Node test suite, full package check.
- Open questions: Phase 2 tooling design is deferred and not required for this plan.

## Assumptions

- The implementation pass starts from a clean worktree or follows `ae-work` pre-edit gate before editing.
- Plugin source is the canonical edit target; `.agents/skills` mirror is updated to match.
- The new rule profile content must be original AE-authored guidance and not copied from OCR.
- No capability catalog update is required because no new user-facing skill or script command is introduced.
- New `ae-review` guidance should be placed in the existing skill flow:
  - Add `## Diff Review Discipline` immediately after `## Scope First`.
  - Include manual position checks and contradiction checks inside that section, not as new reviewer lanes.
  - Keep `## Findings Standard` and `## Verdict Rules` intact except for references needed to preserve findings-first behavior.

## Alternatives Considered

- Recommended: Phase 1 documentation and test hardening only.
  - Fit: High. Matches Claude review feedback and current project architecture.
  - Trade-off: Manual discipline improves before tooling enforcement.
  - Risk: Agents may not always follow guidance until tooling exists.
- Alternative: Add `review-scope` and `validate-finding-position` scripts now.
  - Fit: Medium. Useful but requires schema design and more tests.
  - Risk: Expands `ae-tools.mjs` and may introduce brittle line mapping.
  - Rejected because: Current requirement is to create a detailed execution plan from audits; Claude review specifically warned that tooling is underspecified.
- Alternative: Add OCR as optional external review skill.
  - Fit: Low. Duplicates `ae-review` and adds independent runtime/LLM configuration.
  - Risk: Maintenance, licensing attribution, user confusion, and inconsistent review semantics.
  - Rejected because: Both audits favored adapting patterns rather than importing runtime behavior.

## Decision Drivers

- Driver 1: Preserve Codex-native AE skill boundaries.
- Driver 2: Convert portable OCR mechanisms into durable workflow guidance without copying code or prompt text.
- Driver 3: Keep the execution small enough to validate in one pass while leaving tool automation for a separately designed Phase 2.

## Decisions

### ADR-1 - Conditional Diff Discipline, Not Global Restriction

- Decision: Add diff-subject guidance only for diff-like code review scopes: `from:<ref>`, `recent:<N>`, `session`, and default Git diff/status review.
- Drivers: `ae-review` also supports `full` and `full:<path>` scans; global restrictions would break existing behavior.
- Alternatives: Make all code findings target only added/modified lines; leave behavior unchanged.
- Why chosen: It preserves full-scan semantics while improving diff review precision.
- Consequences: Reviewers must identify scope before applying the guidance.
- Follow-ups: Phase 2 may add scope preview tooling if manual scope selection remains error-prone.

### ADR-2 - Manual Position Check Before Automated Guard

- Decision: Add manual position-check guidance to `ae-review`, but do not claim automated line validation exists.
- Drivers: Current `ae-tools.mjs` has no finding schema, hunk mapper, or position validator.
- Alternatives: Implement `validate-finding-position` now; omit location guidance.
- Why chosen: It captures the useful behavior without pretending infrastructure exists.
- Consequences: Findings still depend on agent discipline.
- Follow-ups: Design finding schema and validation command in a separate Phase 2 plan.

### ADR-3 - Contradiction Check Instead of Silent Discard

- Decision: Add a diff contradiction check that marks or lowers confidence for findings directly contradicted by the diff, while preserving context-dependent findings.
- Drivers: Security, reliability, and contract issues may require context beyond the diff.
- Alternatives: Automatically discard unproven findings; skip contradiction handling.
- Why chosen: It imports OCR's precision idea without suppressing valid context-based risks.
- Consequences: Final review output should distinguish contradicted, uncertain, and evidence-backed findings. This is a post-finding sanity check, not a new reviewer lane.
- Follow-ups: Later tooling may provide structured contradiction flags.

### ADR-4 - Reference Profiles Before Rule Engine

- Decision: Add a single AE-authored `code-review-rule-profiles.md` reference file under `ae-review/references`.
- Drivers: Rule profiles are useful, but automatic rule matching is not required for Phase 1.
- Alternatives: Add JSON rule engine; split one file per language.
- Why chosen: One reference file is small, readable, and easy to mirror/test.
- Consequences: Reviewers choose relevant profiles manually.
- Follow-ups: Split profiles by language only if the file becomes too large.

### ADR-5 - Extend Audit Classification

- Decision: Update `ae-skill-audit` and its audit template with deterministic engineering and license compatibility sections.
- Drivers: OCR's main value is deterministic workflow mechanics, and external repository licensing affects reuse.
- Alternatives: Leave audit template unchanged; create a separate audit skill.
- Why chosen: This is directly inside `ae-skill-audit`'s existing responsibility.
- Consequences: Future audits can classify portable deterministic constraints separately from runtime-specific hooks.
- Follow-ups: Add examples only if repeated audits show ambiguity.

## Risks

- Risk: Guidance becomes too prescriptive and narrows `ae-review` incorrectly.
  - Mitigation: Keep all diff discipline conditional on scope.
- Risk: Rule profiles become copied OCR text.
  - Mitigation: Write original AE phrasing and keep examples generic.
- Risk: Mirror drift between plugin source and `.agents`.
  - Mitigation: Run `node scripts/check-skill-mirror.mjs` and add tests asserting source/mirror guidance.
- Risk: Tests become brittle because they assert long prose.
  - Mitigation: Assert stable headings and short key phrases rather than full paragraphs.

## Pre-Mortem

- Failure scenario 1: An implementer adds `Position Drift Guard` as a required automated gate.
  - Mitigation: U1 explicitly says manual guidance only; U4 tests should look for "manual" or "does not require automated line validation" phrasing.
- Failure scenario 2: `ae-review` says all reviews must focus only on changed lines, breaking `full` scans.
  - Mitigation: U1 must name the exact scopes where the guidance applies and explicitly preserve full scans.
- Failure scenario 3: `ae-tools.mjs` is modified opportunistically to add preview commands.
  - Mitigation: U1-U5 list no script changes except tests; `scripts/ae-tools.mjs` is forbidden for all units.

## Implementation Units

### U1 - Add Conditional Review Discipline to ae-review

- Goal: Update `ae-review` guidance with conditional diff-subject discipline, manual position checking, and contradiction checking.
- Requirements covered: PRD requirements 1-5, 9-10.
- Acceptance criteria covered: PRD acceptance criterion 1.
- Depends on: none.
- Files:
  - `plugins/ai-agent-engine-codex/skills/ae-review/SKILL.md`
  - `.agents/skills/ae-review/SKILL.md`
- Forbidden files:
  - `scripts/ae-tools.mjs`
  - `plugins/ai-agent-engine-codex/scripts/ae-tools.mjs`
  - `plugins/ai-agent-engine-codex/skills/ae-help/references/capability-catalog.json`
  - `.agents/skills/ae-help/references/capability-catalog.json`
- Approach:
  - Add a new section after `Scope First` named `Diff Review Discipline`.
  - State that it applies only to `from:<ref>`, `recent:<N>`, `session`, and default Git diff/status code reviews.
  - State that `full` and `full:<path>` reviews remain repository/path scans.
  - Add a manual position-check rule: before finalizing a code finding, re-open the target file or diff context and confirm path and line still identify the affected code; if exact line is uncertain, report path-level context and explain the uncertainty.
  - Add a contradiction-check rule: if a finding's factual claim is directly contradicted by the reviewed diff, mark it as contradicted or remove it only when the contradiction is certain; do not discard context-dependent findings merely because the diff alone cannot prove them.
  - Add a short reference pointer from `ae-review/SKILL.md` to `references/code-review-rule-profiles.md`, stating that the profiles are optional review lenses and not an automatic rule engine.
  - Use stable terms that U4 can test: `Diff Review Discipline`, `manual position check`, `contradiction check`, `full:<path>`, and `code-review-rule-profiles.md`.
- Tests:
  - Covered by U4.
- Validation:
  - `node scripts/check-skill-mirror.mjs`
  - `npm test`
- Rollback signals:
  - `ae-review` no longer mentions full-scan preservation.
  - The text claims automated line validation exists.
  - The text instructs agents to silently discard all unproven findings.
- Deferred to implementation:
  - Exact wording can be adjusted, but the three behavioral constraints must remain explicit.

### U2 - Add AE-Authored Code Review Rule Profiles

- Goal: Add a reference file with common code review profiles that `ae-review` can consult without adding a rule engine.
- Requirements covered: PRD requirements 6, 9-10.
- Acceptance criteria covered: PRD acceptance criterion 2.
- Depends on: U1.
- Files:
  - `plugins/ai-agent-engine-codex/skills/ae-review/references/code-review-rule-profiles.md`
  - `.agents/skills/ae-review/references/code-review-rule-profiles.md`
- Forbidden files:
  - `scripts/ae-tools.mjs`
  - `plugins/ai-agent-engine-codex/scripts/ae-tools.mjs`
  - OCR repository files
- Approach:
  - Create a Markdown reference with original AE phrasing.
  - Include sections:
    - `How To Use`: profiles are review lenses, not mandatory findings.
    - `General Diff Review`: correctness, tests, error propagation, public contracts, security-sensitive boundaries.
    - `Java / JVM`: nullability, concurrency evidence, transaction boundaries, N+1/data access in loops, resource closure.
    - `TypeScript / JavaScript / React`: strict equality, `any` justification, hooks rules, effect cleanup, render side effects, XSS sinks, unsafe dynamic code.
    - `package.json`: exact versions for new dependencies, dependency/devDependency duplication, script tool declarations.
    - `JSON / YAML / Config`: schema-sensitive keys, accidental secret material, environment-specific values, duplicated/conflicting entries.
    - `SQL`: parameterization, transaction/rollback behavior, migration reversibility.
  - Include a boundary note that these profiles do not replace project-specific requirements or existing AE personas.
  - Keep the file concise: each profile should list check areas and evidence expectations, not long rule prose or copied OCR wording.
  - Do not include OCR-specific rule syntax, benchmark claims, CLI flags, provider configuration, or text copied from OCR prompt/rule files.
- Tests:
  - Covered by U4.
- Validation:
  - `node scripts/check-skill-mirror.mjs`
  - `npm test`
- Rollback signals:
  - The file copies OCR text verbatim.
  - The file implies automatic matching or rule enforcement exists.
- Deferred to implementation:
  - Additional languages beyond the listed set.

### U3 - Extend ae-skill-audit Classification and Template

- Goal: Teach `ae-skill-audit` to classify deterministic engineering patterns and record license compatibility.
- Requirements covered: PRD requirements 7-10.
- Acceptance criteria covered: PRD acceptance criteria 3-4.
- Depends on: none.
- Files:
  - `plugins/ai-agent-engine-codex/skills/ae-skill-audit/SKILL.md`
  - `plugins/ai-agent-engine-codex/skills/ae-skill-audit/references/audit-template.md`
  - `.agents/skills/ae-skill-audit/SKILL.md`
  - `.agents/skills/ae-skill-audit/references/audit-template.md`
- Forbidden files:
  - `scripts/ae-tools.mjs`
  - `plugins/ai-agent-engine-codex/scripts/ae-tools.mjs`
- Approach:
  - In `SKILL.md`, add deterministic engineering as a first-class inspection concern: deterministic file selection, schema validation, routing contracts, evidence capture, reflection/filtering, dry-run previews, or bounded tool access.
  - In `SKILL.md`, require license compatibility to be recorded before recommending copied templates or source-derived assets.
  - In `audit-template.md`, add:
    - `## Deterministic Engineering Patterns`
    - `## License Compatibility`
  - Place `## License Compatibility` after `## Source` so the license conclusion is captured before fit recommendations.
  - Place `## Deterministic Engineering Patterns` after `## Platform-Specific Patterns` so audits compare portable workflow mechanics against runtime-specific behavior.
  - Clarify that Apache-2.0 or permissive sources can inspire behavior, but copied text/code/templates need explicit compatibility review with this GPL-2.0-only project.
- Tests:
  - Covered by U4.
- Validation:
  - `node scripts/check-skill-mirror.mjs`
  - `npm test`
- Rollback signals:
  - The guidance permits copying external runtime behavior by default.
  - License compatibility is absent from the template.
- Deferred to implementation:
  - Legal attribution files, because this plan avoids copying protected source text or code.

### U4 - Add Focused Regression Tests

- Goal: Lock the new skill guidance into source and mirror.
- Requirements covered: PRD requirements 1-10.
- Acceptance criteria covered: PRD acceptance criteria 1-5.
- Depends on: U1, U2, U3.
- Files:
  - `tests/skill-scripts.test.mjs`
- Forbidden files:
  - `package.json`
  - `package-lock.json`
  - `scripts/ae-tools.mjs`
  - `plugins/ai-agent-engine-codex/scripts/ae-tools.mjs`
- Approach:
  - Add one test, near the existing minimality guidance test, named `OCR-inspired review guidance is present in source and mirror skills`.
  - Reuse `readSkillBody` helper.
  - Assert source and mirror equality for `ae-review` and `ae-skill-audit`.
  - Assert `ae-review` contains stable phrases such as:
    - `Diff Review Discipline`
    - `from:<ref>`
    - `full:<path>`
    - `manual position check`
    - `contradiction check`
    - `code-review-rule-profiles.md`
  - Assert the new source and mirror rule profile files exist by reading both paths and comparing equality.
  - Assert rule profile content contains stable headings:
    - `Java / JVM`
    - `TypeScript / JavaScript / React`
    - `package.json`
    - `JSON / YAML / Config`
  - Assert `ae-skill-audit` and its template contain:
    - `Deterministic Engineering`
    - `License Compatibility`
  - Use regex expectations that are specific but not paragraph-length:
    - `/## Diff Review Discipline/`
    - `/from:<ref>/`
    - `/full:<path>/`
    - `/manual position check/i`
    - `/contradiction check/i`
    - `/code-review-rule-profiles\.md/`
    - `/## Deterministic Engineering Patterns/`
    - `/## License Compatibility/`
- Tests:
  - Run `npm test` after implementation.
- Validation:
  - `npm test`
- Rollback signals:
  - Tests assert long fragile paragraphs.
  - Tests require exact non-ASCII text rendering.
- Deferred to implementation:
  - No new test file is needed unless `tests/skill-scripts.test.mjs` becomes difficult to maintain.

### U5 - Run Validation and Record Delivery Evidence

- Goal: Verify the change and report exact evidence.
- Requirements covered: PRD requirements 9-10.
- Acceptance criteria covered: PRD acceptance criteria 6-9.
- Depends on: U4.
- Files:
  - No planned source changes.
- Forbidden files:
  - All source files unless validation reveals a deterministic issue inside U1-U4 scope.
- Approach:
  - Run:
    - `node scripts/check-skill-mirror.mjs`
    - `node scripts/check-ae-artifacts.mjs`
    - `npm test`
    - `npm run check`
  - If `npm run check` fails, inspect failure and fix only deterministic issues caused by U1-U4.
  - Do not add unrelated cleanup or formatting churn.
  - Final response must list commands and outcomes.
- Tests:
  - Validation commands above.
- Validation:
  - Same as approach.
- Rollback signals:
  - Mirror mismatch persists.
  - Artifact frontmatter check fails.
  - New tests fail because guidance is missing in source or mirror.
- Deferred to implementation:
  - Optional `ae-review domain:document mode:report-only` of this plan before coding if the user requests a review gate.

## Validation Plan

- Unit:
  - `npm test` verifies focused skill guidance and existing script behavior.
- Integration:
  - `node scripts/check-skill-mirror.mjs` verifies plugin source and `.agents` mirror consistency.
  - `node scripts/check-ae-artifacts.mjs` verifies PRD and plan frontmatter.
- User flow:
  - `node scripts/ae-tools.mjs help review` should continue to find `ae-review`.
  - `node scripts/ae-tools.mjs help skill-audit` should continue to find `ae-skill-audit` if the current help search supports that query.
- Data / operations:
  - No runtime data migration or external services.
  - No OCR CLI installation or external network calls.
- Observability:
  - Final delivery should include validation command outputs in summary.
  - Optional gate proof can be written with `node scripts/ae-tools.mjs gate --workflow work --checkpoint final --plan docs/ae/plans/2026-06-19-002-ocr-review-guidance-adaptation-plan.md --validation "npm run check" --review-status not_run --worktree-decision not_applicable --write-proof` only during implementation if desired.

## Rollback / Recovery

- If guidance proves too restrictive, revert only U1 wording while preserving U2/U3 references if still useful.
- If rule profiles become noisy, keep the file but make invocation explicit: `Use this reference only when the file type is present in scope`.
- If mirror validation fails, copy the canonical plugin-source skill/reference changes into `.agents/skills` and rerun `node scripts/check-skill-mirror.mjs`.
- If tests are brittle, narrow assertions to headings and short stable phrases.

## Plan Self-Review

- Placeholder scan: No `TBD`, `TODO`, or unresolved implementation placeholders remain.
- Consistency check: PRD requirements map to U1-U5; Phase 2 tooling is consistently deferred.
- Scope check: No runtime OCR integration, no new script commands, no CI changes, no `ae-work` orchestration changes.
- Acceptance coverage:
  - AC1: U1 and U4.
  - AC2: U2 and U4.
  - AC3: U3 and U4.
  - AC4: U3 and U4.
  - AC5: U4.
  - AC6-AC9: U5.
- Validation gaps: No browser or integration runtime validation is needed because this is skill documentation and tests only.
- Alternatives and ADR check: Alternatives cover direct OCR integration, immediate tooling, and reference-first approach.
- High-risk pre-mortem check: Key failure scenarios from Claude review are covered.

## Handoff

Recommended next step:

1. Run `ae-review domain:document mode:report-only` on this plan if a review gate is desired before editing.
2. Execute with `ae-work` inline because the units are small and touch overlapping skill source/mirror/test files.
3. Keep implementation serial:
   - U1 and U3 can be edited independently in concept, but both affect mirrored skill trees.
   - U4 depends on U1-U3.
   - U5 depends on all edits.

Execution prompt:

```text
Use ae-work to execute docs/ae/plans/2026-06-19-002-ocr-review-guidance-adaptation-plan.md. Keep it serial, do not add OCR runtime integration, do not add new ae-tools commands, and validate with npm test plus npm run check.
```

## Completion Record

- Completed: 2026-06-19.
- Commit: `90c29b3 feat: adapt OCR review guidance`.
- Pushed: `main -> origin/main`.
- U1 result: `ae-review` plugin source and mirror gained conditional Diff Review Discipline, manual position checks, contradiction checks, and full-scan preservation.
- U2 result: `ae-review/references/code-review-rule-profiles.md` was added in plugin source and `.agents` mirror with AE-authored review lenses.
- U3 result: `ae-skill-audit` and its audit template gained deterministic engineering and license compatibility dimensions.
- U4 result: `tests/skill-scripts.test.mjs` gained focused OCR-inspired source/mirror regression coverage.
- U5 result: validation passed with mirror, artifact, focused test, full test, full check, and whitespace checks.
- Documentation result: PRD, plan, solution, execution prompt, experience note, and AI memory were updated.
- Archive: `docs/00-process/archive/2026-06/ocr-review-guidance-adaptation/summary.md`
