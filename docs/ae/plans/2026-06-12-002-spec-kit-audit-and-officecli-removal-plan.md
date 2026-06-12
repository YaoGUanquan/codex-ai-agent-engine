---
type: plan
status: drafted
date: 2026-06-12
title: spec-kit-audit-and-officecli-removal
origin: conversation:github/spec-kit-audit
originFingerprint: github-spec-kit@1b0556c711b633a6d50b2e2f5f8db0e6717489d3
---

# Plan: spec-kit-audit-and-officecli-removal

## Source

- External repository: `https://github.com/github/spec-kit`
- Observed clone: `1b0556c711b633a6d50b2e2f5f8db0e6717489d3` on `main`
- License: MIT
- Supported harness model: Specify CLI installs command templates or skills for multiple agents, including Codex skills under `.agents/skills/speckit-<name>/SKILL.md`.
- Primary purpose: Spec-Driven Development workflow with constitution, spec, clarification, plan, tasks, analysis, checklist, and implementation phases.
- Local repository state while drafting: branch `main`; local `main` is ahead 1 and behind 1 versus `origin/main`.
- Claude Code delegation: unavailable locally because `claude` was not found on `PATH`; this plan is Codex-only.

## Scope

Adapt useful Spec Kit workflow patterns into the current AE for Codex project without copying Spec Kit runtime behavior or bulk-importing its command catalog. Remove the currently active OfficeCLI skill family because it is not expected to be used.

## Readiness

- Goal: Strengthen AE planning, requirement quality, task decomposition, cross-artifact review, and skill governance using Spec Kit patterns, while slimming the active skill catalog by removing OfficeCLI-oriented skills.
- Acceptance criteria:
  - Spec Kit patterns are classified into adopt, adapt, defer, and reject decisions.
  - Recommended AE skill changes identify exact affected skills and files.
  - OfficeCLI removal has a complete file impact list across plugin source, `.agents` mirror, help catalog, language metadata, tests, checks, docs, and manifests.
  - Validation commands are concrete and do not depend on OfficeCLI being installed.
- Non-goals:
  - Do not vendor Specify CLI.
  - Do not add `.specify/` as this project's primary artifact root.
  - Do not copy Spec Kit command templates verbatim.
  - Do not implement the plan in this step.
- Affected areas:
  - `plugins/ai-agent-engine-codex/skills/*`
  - `.agents/skills/*`
  - `plugins/ai-agent-engine-codex/scripts/skill-language-metadata.mjs`
  - `plugins/ai-agent-engine-codex/skills/ae-help/references/capability-catalog.json`
  - `scripts/check-install-smoke.mjs`
  - `tests/skill-scripts.test.mjs`
  - `package.json`
  - `README.md`, `README.en.md`, `INSTALL.md`, `INSTALL.zh-CN.md`, `NOTICE.md`
  - `plugins/ai-agent-engine-codex/.codex-plugin/plugin.json`
- Validation surface:
  - `node scripts/check-skill-mirror.mjs`
  - `node scripts/check-skill-language-metadata.mjs`
  - `node scripts/check-install-smoke.mjs`
  - `node scripts/check-ae-artifacts.mjs`
  - `node --test tests/skill-scripts.test.mjs`
  - `npm run check`
- Open questions:
  - Historical OfficeCLI notes under `docs/ae/plans` and `docs/ae/solutions` can remain as archive/history unless a later cleanup explicitly removes old decision records.

## Assumptions

- AE should keep `docs/ae` and `docs/00-process` as its artifact roots instead of adopting Spec Kit's `specs/` and `.specify/` layout.
- MIT-licensed Spec Kit can be used as reference input, but any adopted content should be rewritten in AE terms and attributed in docs where meaningful.
- Codex skill invocation remains name/description based; `/ae-*` labels stay compatibility tags, not real slash-command registration.
- Removing OfficeCLI means removing active skills and checks, not removing the separate bundled Codex app capabilities for documents, spreadsheets, or presentations.

## External Repository Audit

### Structure

- Skills or commands: core templates for `constitution`, `specify`, `clarify`, `plan`, `tasks`, `analyze`, `checklist`, `implement`, and `taskstoissues`.
- Agents: integration packages under `src/specify_cli/integrations/<key>/`; Codex uses `SkillsIntegration`.
- Hooks or automation: extension manifests define hook points such as `before_specify`, `after_plan`, and `before_implement`.
- Commands or scripts: Bash and PowerShell helpers for feature setup, plan setup, task setup, and prerequisite checks.
- MCP or external services: no core MCP requirement in the inspected paths.
- Installer or manifest: `specify init`, integration manifests, extension manifests, preset manifests, and catalog files.

### Portable Patterns

- Project constitution as a durable governance input.
- Requirement-first spec generation with technology-agnostic success criteria.
- Clarification loop with a strict question budget and immediate spec integration.
- Requirements checklist as "unit tests for English", focused on requirement quality rather than implementation behavior.
- Plan artifacts that separate research, data model, contracts, quickstart, and task generation.
- Dependency-ordered `tasks.md` with task IDs, user-story phases, file paths, and parallel markers.
- Read-only cross-artifact analysis across spec, plan, tasks, and governance.
- Template, preset, and extension governance with manifests, catalogs, and path traversal protection.
- Agent integration metadata as a single source of truth.

### Platform-Specific Patterns

- Specify CLI command dispatch and slash-command behavior.
- `.specify/` template resolution and extension hook executor.
- Automatic command installation for 30+ agents.
- Spec Kit Git extension hook behavior that auto-creates feature branches and optionally commits after phases.
- Community extension and preset installation model.

## Alternatives Considered

- Recommended: Adapt selected Spec Kit patterns into existing AE skills and scripts.
- Alternative: Add Spec Kit as an external dependency and call `specify` directly.
- Rejected because: It would create two competing workflow roots, introduce Python/uv dependency assumptions, and duplicate AE's existing `ae-lfg`, `ae-plan`, `ae-work`, and `ae-review` responsibilities.
- Alternative: Import all Speckit skills as `speckit-*` alongside `ae-*`.
- Rejected because: It would make the catalog noisy, duplicate user-facing flows, and blur AE's Codex-native boundaries.

## Decision Drivers

- Driver 1: Keep the active skill catalog small and high-signal.
- Driver 2: Strengthen artifact quality gates without adding runtime-heavy dependencies.
- Driver 3: Preserve AE's existing Chinese/bilingual docs, install scripts, and `.agents` mirror model.

## Decisions

### ADR-1 - Adapt Spec Kit Workflow Concepts, Not Runtime

- Decision: Treat Spec Kit as a reference for workflow mechanics and governance, not as a runtime dependency.
- Drivers: AE already has a Codex plugin structure, skills, installer, and validation scripts.
- Alternatives: direct dependency, skill import, no adoption.
- Why chosen: It improves quality while avoiding dual systems.
- Consequences: New wording and scripts must be AE-native, and validation must prove no copy-paste drift.
- Follow-ups: Add attribution for Spec Kit as an external reference if implementation lands.

### ADR-2 - Add Governance and Cross-Artifact Quality Gates

- Decision: Add or improve AE skills around project constitution, requirement quality checklist, task breakdown, and cross-artifact analysis.
- Drivers: These are the strongest gaps between AE and Spec Kit.
- Alternatives: keep only `ae-plan` and `ae-review`; add a full Spec Kit clone.
- Why chosen: Narrow skills keep responsibilities clear.
- Consequences: `ae-lfg` should route through these gates only for S4 work, not for tiny fixes.
- Follow-ups: Decide final names during implementation; recommended names are below.

### ADR-3 - Remove Active OfficeCLI Skills

- Decision: Remove `ae-officecli`, `ae-docx`, `ae-xlsx`, and `ae-pptx` from the active plugin and installed mirror.
- Drivers: User stated these skills are unlikely to be used; they add catalog and validation maintenance cost.
- Alternatives: keep only umbrella `ae-officecli`; mark as deprecated.
- Why chosen: Deletion is cleaner because current environment already has separate document, spreadsheet, and presentation plugin capabilities.
- Consequences: Tests, docs, manifests, language metadata, and smoke checks must be updated together.
- Follow-ups: Keep historical plan/solution docs unless a later archive cleanup requests full history removal.

## AE Fit

### Improve Existing Skills

- `ae-brainstorm` and `ae-prd`
  - Adapt `speckit.specify` and `speckit.clarify` ideas.
  - Add explicit "what/why before how", technology-agnostic success criteria, maximum clarification budget, assumptions, and spec quality checklist guidance.
- `ae-plan`
  - Strengthen file-level plan units with optional research, data model, contracts, quickstart, and task handoff sections.
  - Keep existing plan template but add Spec Kit-style traceability from acceptance criteria to units.
- `ae-review`
  - Add a document review mode for cross-artifact consistency: requirements, plan, tasks, and governance.
  - Use findings-first output and coverage metrics similar to Spec Kit `analyze`, rewritten for AE artifacts.
- `ae-work`
  - Add a pre-implementation checklist gate when a plan references a generated task/checklist artifact.
  - Mark task items complete only when the task artifact is explicitly in scope.
- `ae-skill-creator` and `ae-update`
  - Add manifest/path-safety checks inspired by Spec Kit integration tests.
  - Keep plugin source and `.agents/skills` mirror as the local source-of-truth pair.

### New Skill Candidates

- `ae-constitution`
  - Purpose: create or update project governance principles, sync them into plan/review gates, and prevent vague "principles" that cannot be checked.
  - Fit: high. AE currently has `AGENTS.md` and memory docs but no focused governance skill.
- `ae-checklist`
  - Purpose: generate requirement-quality checklists as "unit tests for English".
  - Fit: high. This is distinct from `ae-review` because it creates reusable checklist artifacts before implementation.
- `ae-tasks`
  - Purpose: turn an approved AE plan into dependency-ordered `tasks.md` with task IDs, file paths, `[P]` markers, and independent validation criteria.
  - Fit: medium-high. AE plans already have units, but a task artifact would improve larger implementations and multi-agent readiness.

### Add Reference or Template Only

- Extension and preset manifests.
  - Fit: medium. Add examples for future AE extension governance, but do not build a full resolver yet.
- Agent integration registry architecture.
  - Fit: medium. Useful for a future multi-agent or multi-surface installer, but not required now.
- Branch numbering and feature directory rules.
  - Fit: low-medium. AE currently relies on Codex/git workflow and does not need Spec Kit's feature branch automation.

### Reject or Defer

- `speckit.taskstoissues`
  - Defer. GitHub issue sync is useful but outside the current AE core scope.
- Full `.specify/` runtime and Specify CLI install.
  - Reject for this project. It duplicates AE roots and adds external dependency assumptions.
- Automatic hook execution from manifest.
  - Defer. Codex skills can describe hooks, but cannot enforce a Spec Kit hook executor without a new local runtime.
- Community extension catalog install flow.
  - Defer. Current AE plugin/update flow is simpler and project-local.

## Implementation Units

### U1 - Add AE governance skill from Spec Kit constitution pattern

- Goal: Add a narrow governance workflow that creates or updates durable project principles.
- Requirements covered: Spec Kit `constitution` pattern.
- Acceptance criteria covered: A user can ask for governance/constitution and get a clear AE skill route; plans and reviews can reference the governance artifact.
- Depends on: none.
- Files:
  - `plugins/ai-agent-engine-codex/skills/ae-constitution/SKILL.md`
  - `plugins/ai-agent-engine-codex/skills/ae-constitution/agents/openai.yaml`
  - `plugins/ai-agent-engine-codex/skills/ae-constitution/references/constitution-workflow.md`
  - `.agents/skills/ae-constitution/SKILL.md`
  - `.agents/skills/ae-constitution/agents/openai.yaml`
  - `.agents/skills/ae-constitution/references/constitution-workflow.md`
  - `docs/ae/templates/constitution-template.md`
  - `plugins/ai-agent-engine-codex/scripts/skill-language-metadata.mjs`
  - `plugins/ai-agent-engine-codex/skills/ae-help/references/capability-catalog.json`
- Forbidden files:
  - `docs/ae/plans/2026-05-12-002-officecli-integration-plan.md`
- Approach: Reword Spec Kit's constitution mechanics into AE terms: principles, versioning, amendment notes, sync impact, and review gates.
- Tests:
  - Add language metadata checks for `ae-constitution`.
  - Add install smoke expectations for the new skill.
- Validation:
  - `node scripts/check-skill-mirror.mjs`
  - `node scripts/check-skill-language-metadata.mjs`
  - `node scripts/check-install-smoke.mjs`
- Rollback signals: mirror check fails, help catalog cannot query the skill, or the skill overlaps too much with `ae-init`.
- Deferred to implementation: exact artifact path, recommended `docs/ae/constitution.md` or `docs/ae/governance/constitution.md`.

### U2 - Strengthen requirements and clarification flow

- Goal: Improve `ae-brainstorm` and `ae-prd` with Spec Kit-style spec quality and clarification discipline.
- Requirements covered: `speckit.specify`, `speckit.clarify`, and spec quality checklist patterns.
- Acceptance criteria covered: Requirements artifacts distinguish WHAT from HOW, cap critical clarifications, record assumptions, and define measurable acceptance criteria.
- Depends on: none.
- Files:
  - `plugins/ai-agent-engine-codex/skills/ae-brainstorm/SKILL.md`
  - `plugins/ai-agent-engine-codex/skills/ae-brainstorm/references/requirements-capture.md`
  - `plugins/ai-agent-engine-codex/skills/ae-prd/SKILL.md`
  - `.agents/skills/ae-brainstorm/SKILL.md`
  - `.agents/skills/ae-brainstorm/references/requirements-capture.md`
  - `.agents/skills/ae-prd/SKILL.md`
  - `docs/ae/templates/requirements-quality-checklist.md`
- Forbidden files:
  - OfficeCLI skill directories.
- Approach: Add a requirement-quality section and question-budget rules without forcing every small task into a full spec document.
- Tests:
  - Install smoke and mirror checks.
- Validation:
  - `node scripts/check-skill-mirror.mjs`
  - `node scripts/check-install-smoke.mjs`
- Rollback signals: `ae-brainstorm` becomes too heavyweight for S2 clarification.
- Deferred to implementation: whether to create checklist artifacts by default or only when requested/S4.

### U3 - Add task breakdown and cross-artifact analysis

- Goal: Add a clearer bridge from plan units to executable tasks and review consistency before implementation.
- Requirements covered: `speckit.tasks` and `speckit.analyze` patterns.
- Acceptance criteria covered: Large plans can produce task IDs, dependencies, file paths, and a read-only consistency report.
- Depends on: U2.
- Files:
  - `plugins/ai-agent-engine-codex/skills/ae-tasks/SKILL.md`
  - `plugins/ai-agent-engine-codex/skills/ae-tasks/agents/openai.yaml`
  - `plugins/ai-agent-engine-codex/skills/ae-review/SKILL.md`
  - `plugins/ai-agent-engine-codex/skills/ae-review/references/review-output-template.md`
  - `plugins/ai-agent-engine-codex/skills/ae-work/SKILL.md`
  - `.agents/skills/ae-tasks/SKILL.md`
  - `.agents/skills/ae-tasks/agents/openai.yaml`
  - `.agents/skills/ae-review/SKILL.md`
  - `.agents/skills/ae-review/references/review-output-template.md`
  - `.agents/skills/ae-work/SKILL.md`
  - `plugins/ai-agent-engine-codex/scripts/skill-language-metadata.mjs`
  - `plugins/ai-agent-engine-codex/skills/ae-help/references/capability-catalog.json`
- Forbidden files:
  - `scripts/ae-tools.mjs` unless implementation chooses to add a parser/checker.
- Approach: Create `ae-tasks` only if the team wants a durable task artifact; otherwise fold the task checklist into `ae-plan` and add the cross-artifact report to `ae-review`.
- Tests:
  - Metadata and install smoke tests for `ae-tasks` if created.
  - Review skill mirror check.
- Validation:
  - `node scripts/check-skill-language-metadata.mjs`
  - `node scripts/check-install-smoke.mjs`
  - `node scripts/check-skill-mirror.mjs`
- Rollback signals: duplicate responsibilities between `ae-plan`, `ae-tasks`, and `ae-work` become confusing.
- Deferred to implementation: final decision on new `ae-tasks` versus improving existing `ae-plan`.

### U4 - Add skill governance and manifest hardening

- Goal: Adapt Spec Kit's integration, manifest, and path-safety lessons to AE's plugin/mirror model.
- Requirements covered: Spec Kit integration registry and extension/preset governance patterns.
- Acceptance criteria covered: Skill metadata has a single authoritative list or stronger consistency checks; path traversal and missing-mirror issues are caught by tests.
- Depends on: none.
- Files:
  - `scripts/check-skill-mirror.mjs`
  - `scripts/check-skill-language-metadata.mjs`
  - `scripts/check-install-smoke.mjs`
  - `scripts/install-project.mjs`
  - `scripts/update-project.mjs`
  - `plugins/ai-agent-engine-codex/scripts/update-project.mjs`
  - `tests/skill-scripts.test.mjs`
  - `docs/ae/templates/ae-skill-profiles.example.yaml`
- Forbidden files:
  - `package-lock.json`
- Approach: Add tests before code changes. Check generated paths stay under target root, plugin skill names match metadata, and docs do not list missing skills.
- Tests:
  - New Node tests for path traversal and metadata consistency.
- Validation:
  - `node --test tests/skill-scripts.test.mjs`
  - `npm run check`
- Rollback signals: installer tests become brittle or require non-local state.
- Deferred to implementation: whether to consolidate metadata into one JSON file.

### U5 - Remove OfficeCLI active skill family

- Goal: Delete OfficeCLI-oriented skills and remove active references from runtime checks and docs.
- Requirements covered: user request to delete OfficeCLI-related skills.
- Acceptance criteria covered: `ae-officecli`, `ae-docx`, `ae-xlsx`, and `ae-pptx` no longer appear in installed skills, help catalog, language metadata, plugin default prompts, README capability list, or check scripts.
- Depends on: none.
- Files:
  - `plugins/ai-agent-engine-codex/skills/ae-officecli/`
  - `plugins/ai-agent-engine-codex/skills/ae-docx/`
  - `plugins/ai-agent-engine-codex/skills/ae-xlsx/`
  - `plugins/ai-agent-engine-codex/skills/ae-pptx/`
  - `.agents/skills/ae-officecli/`
  - `.agents/skills/ae-docx/`
  - `.agents/skills/ae-xlsx/`
  - `.agents/skills/ae-pptx/`
  - `scripts/check-officecli-available.mjs`
  - `scripts/check-officecli-smoke.mjs`
  - `scripts/check-install-smoke.mjs`
  - `tests/skill-scripts.test.mjs`
  - `package.json`
  - `plugins/ai-agent-engine-codex/scripts/skill-language-metadata.mjs`
  - `plugins/ai-agent-engine-codex/skills/ae-help/references/capability-catalog.json`
  - `README.md`
  - `README.en.md`
  - `INSTALL.md`
  - `INSTALL.zh-CN.md`
  - `NOTICE.md`
  - `plugins/ai-agent-engine-codex/.codex-plugin/plugin.json`
- Forbidden files:
  - Historical records under `docs/ae/plans/` and `docs/ae/solutions/` unless explicitly choosing a deeper archive cleanup.
- Approach: Remove the four skill directories from plugin source and mirror, then remove all active references and OfficeCLI-only smoke scripts.
- Tests:
  - Update tests that currently assert OfficeCLI metadata exists.
  - Add negative assertions that OfficeCLI skills are absent from metadata and install smoke output.
- Validation:
  - `node scripts/check-skill-mirror.mjs`
  - `node scripts/check-skill-language-metadata.mjs`
  - `node scripts/check-install-smoke.mjs`
  - `node --test tests/skill-scripts.test.mjs`
  - `npm run check`
- Rollback signals: install smoke still expects deleted skills, docs mention active OfficeCLI support, or plugin manifest default prompts reference OfficeCLI.
- Deferred to implementation: whether to remove `NOTICE.md` OfficeCLI reference or keep it as historical attribution. Recommendation: remove if no active or copied OfficeCLI-derived material remains.

### U6 - Update docs and release notes for the new catalog shape

- Goal: Keep user-facing docs aligned after adding Spec Kit-inspired improvements and removing OfficeCLI.
- Requirements covered: discoverability and installation consistency.
- Acceptance criteria covered: README, install docs, and help output describe the active skill set accurately.
- Depends on: U1, U2, U3, U5.
- Files:
  - `README.md`
  - `README.en.md`
  - `README.zh-CN.md`
  - `INSTALL.md`
  - `INSTALL.zh-CN.md`
  - `docs/release-checklist.md`
  - `docs/08-ai-memory/05-decision-log.md`
  - `plugins/ai-agent-engine-codex/.codex-plugin/plugin.json`
- Forbidden files:
  - Generated dependency directories.
- Approach: Rewrite capability lists and external reference notes. Add Spec Kit as a reference only if concrete adopted patterns land.
- Tests:
  - `node scripts/ae-tools.mjs help`
  - `node scripts/ae-tools.mjs help spec`
  - `node scripts/ae-tools.mjs help task`
- Validation:
  - `npm run check`
- Rollback signals: help output and README disagree on available skills.
- Deferred to implementation: whether to add a dedicated `docs/ae/solutions/<date>-spec-kit-audit.md` decision note.

## Validation Plan

- Unit:
  - `node --test tests/skill-scripts.test.mjs`
  - `node --check scripts/install-project.mjs`
  - `node --check scripts/update-project.mjs`
  - `node --check plugins/ai-agent-engine-codex/scripts/skill-language-metadata.mjs`
- Integration:
  - `node scripts/check-skill-mirror.mjs`
  - `node scripts/check-skill-language-metadata.mjs`
  - `node scripts/check-install-smoke.mjs`
  - `node scripts/check-ae-artifacts.mjs`
- User flow:
  - `node scripts/ae-tools.mjs help`
  - `node scripts/ae-tools.mjs help constitution`
  - `node scripts/ae-tools.mjs help checklist`
  - `node scripts/ae-tools.mjs help tasks`
  - Confirm `node scripts/ae-tools.mjs help office` no longer reports an active skill.
- Data / operations:
  - No database or external service writes.
  - No OfficeCLI binary check remains in default validation.
- Observability:
  - Final implementation should write an AE gate under `docs/ae/gates` if executed through `ae-work`.

## Rollback / Recovery

- Restore deleted OfficeCLI directories and references from Git if downstream users still require them.
- If new skill candidates feel too broad, keep only U2 and U5, then defer `ae-constitution`, `ae-checklist`, and `ae-tasks`.
- If `main` divergence is unresolved before implementation, first decide whether to merge, rebase, or continue on a feature branch from local `main`.

## Plan Self-Review

- Placeholder scan: pass. No `TBD`, `TODO`, or placeholder sections remain.
- Consistency check: pass. OfficeCLI removal and Spec Kit adaptation are separated into independent units.
- Scope check: pass. The plan does not implement changes or import Specify CLI.
- Acceptance coverage: pass. Each user request maps to audit findings, skill recommendations, and OfficeCLI removal scope.
- Validation gaps: full `npm run check` remains an implementation-time validation because this plan does not edit runtime code.
- Alternatives and ADR check: pass.
- High-risk pre-mortem check: pass. Main risks are catalog drift, duplicate skills, and installer/test mismatch.

## Handoff

Recommended next execution order:

1. Resolve branch divergence or create `codex/spec-kit-ae-slimdown` from the intended base.
2. Execute U5 first to remove OfficeCLI active skills and reduce catalog noise.
3. Execute U2 and the `ae-review` portion of U3 to strengthen existing flows with minimal new skill sprawl.
4. Add `ae-constitution`, `ae-checklist`, and `ae-tasks` only if the smaller improvements still leave clear workflow gaps.
5. Finish with U4 and U6 so metadata, docs, installer behavior, and validation are aligned.
