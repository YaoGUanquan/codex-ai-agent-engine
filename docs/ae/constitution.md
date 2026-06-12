---
type: design
status: drafted
date: 2026-06-12
topic: project-governance
---

# AE Project Constitution

## Purpose

This constitution defines durable governance for `ai-agent-engine-codex`. It exists so future AE requirements, plans, tasks, reviews, and work gates can check project-level principles instead of relying on ad hoc judgment.

## Scope

Applies to:

- Codex skill source under `plugins/ai-agent-engine-codex/skills`.
- Project-local skill mirror under `.agents/skills`.
- Helper scripts under `scripts` and `plugins/ai-agent-engine-codex/scripts`.
- AE workflow artifacts under `docs/ae`, process notes under `docs/00-process`, and long-term memory under `docs/08-ai-memory`.
- User-facing install, README, release, and plugin metadata documents.

Does not apply to:

- Historical archive cleanup unless explicitly requested.
- External runtimes such as Specify CLI, OpenCode, OfficeCLI, or other upstream projects.
- Global Codex configuration outside this repository unless the user explicitly authorizes it.

## Principles

### Principle 1 - Codex-Native Runtime Boundary

- Rule: Adapt external workflow ideas into local Codex skills and helper scripts; do not vendor or require external runtimes unless the user explicitly approves that dependency.
- Rationale: This project should remain installable as a project-local Codex plugin without creating competing workflow roots.
- Review check: New features must name whether they are local skill guidance, helper scripts, templates, or external runtime calls. External runtime calls require a documented reason and validation path.
- Violation examples: Adding `.specify/` as the primary workflow root; requiring Specify CLI for normal AE usage; reintroducing OfficeCLI checks into default validation.

### Principle 2 - Source And Mirror Consistency

- Rule: Every active skill in `plugins/ai-agent-engine-codex/skills` must have a matching `.agents/skills` mirror, `agents/openai.yaml`, language metadata, help catalog entry when user-facing, and install smoke coverage when it is a core entrypoint.
- Rationale: Codex discovers and displays project-local skills through both source and installed mirror paths.
- Review check: `node scripts/check-skill-mirror.mjs`, `node scripts/check-skill-language-metadata.mjs`, and `node scripts/check-install-smoke.mjs` must pass after catalog changes.
- Violation examples: Adding a skill only under plugin source; forgetting `skill-language-metadata.mjs`; help output listing a deleted skill.

### Principle 3 - Requirements Before Implementation

- Rule: S4 or ambiguous work must clarify WHAT/WHY, acceptance criteria, non-goals, assumptions, and validation signals before implementation starts.
- Rationale: AE plans and tasks are only useful when they trace back to confirmed requirements instead of invented product behavior.
- Review check: Requirements or PRD artifacts must separate confirmed facts, assumptions, open questions, and validation signals. Tiny scoped fixes may use inline confirmation instead of a durable artifact.
- Violation examples: Implementing a broad feature from a vague request; hiding product assumptions inside a technical plan; creating tasks with no acceptance coverage.

### Principle 4 - Plans, Tasks, And Reviews Must Be Traceable

- Rule: Implementation plans must identify files, dependencies, validation, rollback signals, and deferred work. Task artifacts must not introduce behavior absent from approved requirements or plans.
- Rationale: Traceability lets `ae-work` execute safely and lets `ae-review` find gaps before delivery.
- Review check: For significant work, compare requirements, constitution, plan, tasks, and validation evidence. Flag contradictions, orphan tasks, and unverified acceptance criteria.
- Violation examples: Marking tasks parallel-safe while sharing files; creating task IDs without validation commands; delivering a change whose acceptance criteria are not represented in the plan.

### Principle 5 - Validation Evidence Before Completion Claims

- Rule: Do not claim work is complete, passing, or ready without fresh validation evidence from relevant commands or inspections.
- Rationale: This repository's value depends on verifiable engineering workflow, not confidence statements.
- Review check: Final responses and gates must list exact commands, results, skipped checks, and residual risks. Use `npm.cmd run check` on Windows when `npm.ps1` is blocked.
- Violation examples: Saying tests pass without running them; treating a generated file as consensus; omitting why a check could not run.

### Principle 6 - UTF-8 And User Work Preservation

- Rule: Keep text files UTF-8, do not rewrite files merely because PowerShell renders Chinese as mojibake, and never revert unrelated user changes.
- Rationale: This project intentionally contains Chinese and bilingual documentation, and the workspace may contain user-owned work.
- Review check: Confirm byte/content issues before encoding rewrites. Scope diffs to the task. Avoid destructive Git operations unless explicitly requested.
- Violation examples: Rewriting Chinese docs because terminal output looks garbled; using `git reset --hard`; deleting historical docs outside the requested scope.

## Required Gates

- Requirements gate: For S4 work, confirm outcome, acceptance criteria, non-goals, assumptions, validation expectations, and open questions.
- Plan gate: Significant work must have an AE plan or an explicit inline equivalent with files, dependencies, tests, rollback signals, and deferred work.
- Task gate: Use `ae-tasks` for large or delegated implementation when dependency ordering, task IDs, or parallel markers improve safety.
- Review gate: Use `ae-review` for significant code or document changes, with cross-artifact consistency checks when requirements, plan, tasks, or this constitution exist.
- Validation gate: Run the narrowest relevant checks first, then broader checks when practical. Record command names and outcomes.
- Catalog gate: For skill catalog changes, run mirror, metadata, install smoke, and relevant tests before final delivery.

## Artifact Ownership

- Governance artifact: `docs/ae/constitution.md`.
- Related templates: `docs/ae/templates/constitution-template.md` and `docs/ae/templates/requirements-quality-checklist.md`.
- Related skills: `ae-constitution`, `ae-brainstorm`, `ae-prd`, `ae-plan`, `ae-tasks`, `ae-work`, and `ae-review`.
- Related checks: `scripts/check-skill-mirror.mjs`, `scripts/check-skill-language-metadata.mjs`, `scripts/check-install-smoke.mjs`, `scripts/check-ae-artifacts.mjs`, and `npm.cmd run check`.

## Amendment Process

1. Identify the source of change: user instruction, repeated failure, external audit, or repository evolution.
2. Compare the change with `AGENTS.md`, `docs/08-ai-memory`, active skills, tests, and release checklist.
3. Record the smallest principle or gate change that would alter future behavior.
4. List impacted skills, scripts, docs, tests, and install behavior.
5. Add an amendment note below.
6. Run document review when the amendment changes planning, review, implementation, or validation gates.

## Amendment Notes

### 2026-06-12 - Initial Constitution

- Reason: Spec Kit audit identified a useful constitution pattern, and `ae-constitution` was added as a governance skill.
- Changed principles: Created initial principles for runtime boundary, source/mirror consistency, requirements, traceability, validation evidence, and UTF-8/user-work preservation.
- Impacted artifacts: `ae-constitution`, `ae-brainstorm`, `ae-prd`, `ae-tasks`, `ae-review`, `ae-work`, install smoke checks, README/INSTALL docs, and release checklist.
- Migration action: Future S4 work should check this constitution during planning and review when governance affects scope, validation, or catalog behavior.

## Sync Impact

- Plans to update: Any future broad workflow or skill-catalog plan should reference this constitution.
- Skills to update: Update `ae-constitution`, `ae-review`, or `ae-work` if this document changes required gates.
- Tests or checks to update: Update skill mirror, metadata, install smoke, and artifact checks if governance changes active skill structure.
- Release notes: Mention constitution amendments when they change user-facing workflow, install behavior, or validation expectations.
