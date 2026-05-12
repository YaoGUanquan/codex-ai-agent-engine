---
type: plan
status: drafted
date: 2026-05-12
title: officecli-integration
origin: conversation:/ae-ideate-officecli-analysis
originFingerprint: 2026-05-12-officecli-ae-integration
---

# Plan: officecli-integration

## Source

This plan is based on:

- Current AE for Codex repository structure and install model in this repo.
- Current capability set under `plugins/ai-agent-engine-codex/skills` and `.agents/skills`.
- External reference: `https://github.com/iOfficeAI/OfficeCLI`
- External reference: `https://raw.githubusercontent.com/iOfficeAI/OfficeCLI/main/README.md`
- External reference: `https://raw.githubusercontent.com/iOfficeAI/OfficeCLI/main/SKILL.md`
- Existing external-reference policy already used for `ai-agent-engine`, `openai/plugins`, and `obra/superpowers`.

Observed OfficeCLI traits from the reference repo:

- It is a CLI-first Office automation tool for `.docx`, `.xlsx`, and `.pptx`.
- It ships as a single binary and supports installation through shell scripts or direct binary download.
- It exposes an AI-oriented `SKILL.md`, specialized document profiles, and an MCP server.
- It emphasizes deterministic CLI and JSON operations, agent-friendly render/view loops, and Office-free headless document handling.
- It is Apache-2.0 licensed.

## Scope

In scope:

- Analyze how OfficeCLI should fit into the current AE for Codex plugin shape.
- Add an OfficeCLI-oriented skill family inside the existing `ai-agent-engine-codex` package.
- Keep all new top-level skill names under the `ae-` prefix.
- Add user-facing docs, capability metadata, and language metadata for the new skills.
- Add validation and smoke checks for OfficeCLI integration logic where practical.
- Preserve Codex-native behavior: no direct reuse of OfficeCLI runtime assumptions beyond explicit CLI invocation and guidance.

Out of scope for this phase:

- Vendoring OfficeCLI binaries into this repository.
- Automatic network download during normal AE installation without explicit user approval.
- Replacing built-in Codex document plugins or claiming they are obsolete.
- Full parity with every OfficeCLI specialized profile on day one.
- Global MCP registration for OfficeCLI by default.

## Decisions

- Integrate OfficeCLI into the existing `ai-agent-engine-codex` package rather than creating a second plugin package in phase one.
- Treat OfficeCLI as an optional external tool dependency, not a bundled runtime.
- Use a layered skill design:
  - `ae-officecli` as the umbrella entrypoint for install, capability selection, and routing.
  - `ae-docx` for Word-style document workflows.
  - `ae-xlsx` for spreadsheet workflows.
  - `ae-pptx` for presentation workflows.
- Map OfficeCLI specialized skills to reference profiles before creating more top-level AE skills:
  - `academic-paper` as a reference profile under `ae-docx`
  - `pitch-deck`, `morph-ppt`, and `morph-ppt-3d` as reference profiles under `ae-pptx`
  - `financial-model` and `data-dashboard` as reference profiles under `ae-xlsx`
- Prefer CLI-backed workflows and deterministic JSON outputs over broad prose-only guidance when the tool is installed.
- Preserve fallback behavior when OfficeCLI is unavailable:
  - explain the missing dependency,
  - provide install steps,
  - avoid pretending the CLI is ready.

Recommended integration shape:

1. Keep AE as the workflow shell.
2. Use OfficeCLI only as an external execution engine for office-document tasks.
3. Avoid a top-level AE skill explosion beyond the four skills above in phase one.

## Risks

- Capability overlap: Codex already has separate document, spreadsheet, and presentation capabilities in some environments; new AE skills must state when OfficeCLI is preferable instead of pretending to replace everything.
- Install friction: OfficeCLI requires an external binary and possibly network access, which is outside this repo’s current default install scope.
- Platform-specific behavior: install commands differ across Windows and Unix-like systems.
- Skill sprawl: if every OfficeCLI specialized skill becomes a top-level AE skill, the catalog will become noisy.
- Validation cost: meaningful smoke tests may require the `officecli` binary to be present or downloadable.
- Attribution drift: README/NOTICE must clearly state that OfficeCLI is an external reference and optional dependency.

## Implementation Units

### U1 - Define OfficeCLI integration boundary

- Goal: Decide exactly how OfficeCLI fits the current AE package model.
- Requirements covered: integration shape, naming, install boundary, and fallback behavior.
- Depends on: none.
- Files:
  - `README.md`
  - `README.en.md`
  - `NOTICE.md`
  - `plugins/ai-agent-engine-codex/.codex-plugin/plugin.json`
- Approach:
  - Add an explicit note that OfficeCLI is an optional external Office automation engine.
  - Clarify that AE does not bundle the OfficeCLI binary.
  - State that OfficeCLI is used through explicit CLI invocation and supporting AE skills.
- Tests:
  - None beyond document review.
- Validation:
  - Manual check that docs do not imply bundled OfficeCLI runtime.
- Rollback signals:
  - Any wording that implies OfficeCLI is always available or preinstalled.
- Deferred to implementation:
  - Exact phrasing in Chinese and English docs.

### U2 - Add `ae-officecli` umbrella skill

- Goal: Provide one entrypoint that detects whether the task is OfficeCLI-suitable and routes to format-specific handling.
- Requirements covered: install guidance, capability selection, CLI-first workflow, fallback when missing.
- Depends on: U1.
- Files:
  - `plugins/ai-agent-engine-codex/skills/ae-officecli/SKILL.md`
  - `plugins/ai-agent-engine-codex/skills/ae-officecli/agents/openai.yaml`
  - `plugins/ai-agent-engine-codex/skills/ae-officecli/references/install-and-detect.md`
  - `plugins/ai-agent-engine-codex/skills/ae-officecli/references/cli-strategy.md`
  - `.agents/skills/ae-officecli/SKILL.md`
  - `.agents/skills/ae-officecli/agents/openai.yaml`
  - `.agents/skills/ae-officecli/references/install-and-detect.md`
  - `.agents/skills/ae-officecli/references/cli-strategy.md`
- Approach:
  - Make `ae-officecli` the first stop when the user asks for Office automation, office documents, or Word/Excel/PowerPoint batch editing.
  - Define the preferred execution ladder:
    - detect `officecli`,
    - if missing, present install path,
    - if present, prefer `--json`,
    - use help instead of guessing commands,
    - route into `ae-docx` / `ae-xlsx` / `ae-pptx`.
  - Recast OfficeCLI’s `L1 -> L2 -> L3` strategy into Codex-friendly wording.
- Tests:
  - Metadata generation coverage.
- Validation:
  - `node scripts/ae-tools.mjs help office`
  - skill metadata regeneration check.
- Rollback signals:
  - The skill becomes too broad to route reliably.
- Deferred to implementation:
  - Whether `ae-officecli` also owns MCP references in phase one.

### U3 - Add `ae-docx`

- Goal: Support Word-style document creation, editing, inspection, validation, and profile-based workflows.
- Requirements covered: `.docx` handling, review loop, generic report/doc work, academic-paper profile reference.
- Depends on: U2.
- Files:
  - `plugins/ai-agent-engine-codex/skills/ae-docx/SKILL.md`
  - `plugins/ai-agent-engine-codex/skills/ae-docx/agents/openai.yaml`
  - `plugins/ai-agent-engine-codex/skills/ae-docx/references/docx-workflow.md`
  - `plugins/ai-agent-engine-codex/skills/ae-docx/references/academic-paper-profile.md`
  - `.agents/skills/ae-docx/SKILL.md`
  - `.agents/skills/ae-docx/agents/openai.yaml`
  - `.agents/skills/ae-docx/references/docx-workflow.md`
  - `.agents/skills/ae-docx/references/academic-paper-profile.md`
- Approach:
  - Focus on create/read/query/set/validate/view issues workflows for `.docx`.
  - Instruct the model to consult OfficeCLI help instead of guessing property names or XML structure.
  - Add profile guidance for academic-paper tasks without creating a separate top-level skill.
- Tests:
  - Metadata coverage.
- Validation:
  - `node scripts/ae-tools.mjs help docx`
  - manual metadata generation check.
- Rollback signals:
  - The generic workflow cannot cover both normal docs and academic-paper profile cleanly.
- Deferred to implementation:
  - Whether Word comments, fields, and TOC refresh need dedicated references in phase one.

### U4 - Add `ae-xlsx`

- Goal: Support spreadsheet workflows with OfficeCLI-backed creation, editing, formulas, pivots, and profile-based guidance.
- Requirements covered: `.xlsx` handling, generic workbook work, financial-model profile, dashboard profile.
- Depends on: U2.
- Files:
  - `plugins/ai-agent-engine-codex/skills/ae-xlsx/SKILL.md`
  - `plugins/ai-agent-engine-codex/skills/ae-xlsx/agents/openai.yaml`
  - `plugins/ai-agent-engine-codex/skills/ae-xlsx/references/xlsx-workflow.md`
  - `plugins/ai-agent-engine-codex/skills/ae-xlsx/references/financial-model-profile.md`
  - `plugins/ai-agent-engine-codex/skills/ae-xlsx/references/data-dashboard-profile.md`
  - `.agents/skills/ae-xlsx/SKILL.md`
  - `.agents/skills/ae-xlsx/agents/openai.yaml`
  - `.agents/skills/ae-xlsx/references/xlsx-workflow.md`
  - `.agents/skills/ae-xlsx/references/financial-model-profile.md`
  - `.agents/skills/ae-xlsx/references/data-dashboard-profile.md`
- Approach:
  - Cover read/write/query/sort/validation/pivot-friendly spreadsheet work.
  - Add profile-level references for financial modeling and dashboard generation.
  - Emphasize `--json` and help-first discovery for schema-safe operations.
- Tests:
  - Metadata coverage.
- Validation:
  - `node scripts/ae-tools.mjs help xlsx`
  - manual metadata generation check.
- Rollback signals:
  - Profile references become too complex for a single phase-one skill.
- Deferred to implementation:
  - Whether to surface chart and pivot subreferences separately in phase one.

### U5 - Add `ae-pptx`

- Goal: Support presentation workflows with OfficeCLI-backed generation, inspection, editing, and profile-based deck logic.
- Requirements covered: `.pptx` handling, generic deck work, pitch-deck profile, morph profile references.
- Depends on: U2.
- Files:
  - `plugins/ai-agent-engine-codex/skills/ae-pptx/SKILL.md`
  - `plugins/ai-agent-engine-codex/skills/ae-pptx/agents/openai.yaml`
  - `plugins/ai-agent-engine-codex/skills/ae-pptx/references/pptx-workflow.md`
  - `plugins/ai-agent-engine-codex/skills/ae-pptx/references/pitch-deck-profile.md`
  - `plugins/ai-agent-engine-codex/skills/ae-pptx/references/morph-profile.md`
  - `.agents/skills/ae-pptx/SKILL.md`
  - `.agents/skills/ae-pptx/agents/openai.yaml`
  - `.agents/skills/ae-pptx/references/pptx-workflow.md`
  - `.agents/skills/ae-pptx/references/pitch-deck-profile.md`
  - `.agents/skills/ae-pptx/references/morph-profile.md`
- Approach:
  - Cover create/add/set/view/watch/query/validate loops for slides and shapes.
  - Use pitch-deck and morph references as profile guides, not top-level skills.
  - Emphasize render -> inspect -> fix loops, with OfficeCLI `view html` / `watch` references where applicable.
- Tests:
  - Metadata coverage.
- Validation:
  - `node scripts/ae-tools.mjs help pptx`
  - manual metadata generation check.
- Rollback signals:
  - Profile references become too heavyweight for the generic deck skill.
- Deferred to implementation:
  - Whether morph and 3D-morph should split later into separate AE skills.

### U6 - Add OfficeCLI install and smoke helpers

- Goal: Make OfficeCLI use operationally real instead of pure documentation.
- Requirements covered: install guidance, binary detection, smoke validation.
- Depends on: U2, U3, U4, U5.
- Files:
  - `scripts/check-officecli-available.mjs`
  - `scripts/check-officecli-smoke.mjs`
  - `package.json`
- Approach:
  - Add a script that checks whether `officecli` exists in PATH and reports a machine-readable result.
  - Add a smoke script that can run a minimal create + inspect flow when `officecli` is available.
  - Decide whether smoke should fail hard when `officecli` is absent or return a structured skip. Recommended: structured skip in default repo check, hard fail only in explicit OfficeCLI validation mode.
- Tests:
  - Node-based tests for detection and skip behavior.
- Validation:
  - `node scripts/check-officecli-available.mjs`
  - `node scripts/check-officecli-smoke.mjs`
- Rollback signals:
  - The default repo validation becomes network- or binary-dependent for all contributors.
- Deferred to implementation:
  - Whether to keep the OfficeCLI smoke path opt-in rather than part of `npm run check`.

### U7 - Add metadata, capability catalog, and language coverage

- Goal: Make the new OfficeCLI-oriented skills discoverable and language-switchable.
- Requirements covered: capability catalog, language metadata, help discoverability.
- Depends on: U2, U3, U4, U5.
- Files:
  - `plugins/ai-agent-engine-codex/skills/ae-help/references/capability-catalog.json`
  - `.agents/skills/ae-help/references/capability-catalog.json`
  - `plugins/ai-agent-engine-codex/scripts/skill-language-metadata.mjs`
  - `tests/skill-scripts.test.mjs`
- Approach:
  - Add `ae-officecli`, `ae-docx`, `ae-xlsx`, and `ae-pptx` to the capability catalog.
  - Extend the shared skill language metadata map.
  - Extend tests so missing OfficeCLI skill metadata fails automatically.
- Tests:
  - `npm test`
  - `node scripts/check-skill-language-metadata.mjs`
- Validation:
  - `node scripts/ae-tools.mjs help office`
  - `node scripts/ae-tools.mjs help docx`
  - `node scripts/ae-tools.mjs help xlsx`
  - `node scripts/ae-tools.mjs help pptx`
- Rollback signals:
  - Metadata additions introduce drift or duplicated routing language.
- Deferred to implementation:
  - Whether to add dedicated example prompts to plugin manifest in phase one.

### U8 - Update README and install docs

- Goal: Explain the OfficeCLI extension clearly to both humans and Codex agents.
- Requirements covered: documentation, installation notes, external-reference transparency.
- Depends on: U1, U2, U7.
- Files:
  - `README.md`
  - `README.en.md`
  - `INSTALL.md`
  - `INSTALL.zh-CN.md`
  - `NOTICE.md`
- Approach:
  - Add a new capability section for OfficeCLI-backed Office document automation.
  - State that OfficeCLI is optional and externally installed.
  - Point users at the relevant AE skills rather than telling them to paste upstream `SKILL.md` directly.
  - Keep attribution explicit.
- Tests:
  - None beyond review.
- Validation:
  - Manual review for consistency across Chinese and English docs.
- Rollback signals:
  - Docs imply bundled binary or unsupported automatic setup.
- Deferred to implementation:
  - Whether to include direct OfficeCLI install snippets or only AE-mediated instructions.

### U9 - Decide phase-two expansion boundary

- Goal: Keep room for more OfficeCLI specialization without overloading phase one.
- Requirements covered: future routing for advanced Office use cases.
- Depends on: U8.
- Files:
  - `docs/ae/solutions/2026-05-12-officecli-phase-two-candidates.md`
- Approach:
  - Record candidate future skills or profiles:
    - `ae-academic-paper`
    - `ae-pitch-deck`
    - `ae-financial-model`
    - `ae-data-dashboard`
    - `ae-morph-ppt`
  - Mark them as deferred until phase-one usage proves the need.
- Tests:
  - None.
- Validation:
  - Manual review only.
- Rollback signals:
  - None; document-only.
- Deferred to implementation:
  - Whether phase two stays reference-based or becomes top-level skills.

## Validation Plan

Minimum phase-one validation:

```powershell
npm test
npm run check
node scripts/ae-tools.mjs help office
node scripts/ae-tools.mjs help docx
node scripts/ae-tools.mjs help xlsx
node scripts/ae-tools.mjs help pptx
node scripts/check-skill-language-metadata.mjs
```

Conditional OfficeCLI validation when the binary is installed or the user approves installation:

```powershell
officecli --version
node scripts/check-officecli-available.mjs
node scripts/check-officecli-smoke.mjs
```

Manual validation:

- Confirm the new skills appear in both `plugins/ai-agent-engine-codex/skills` and `.agents/skills`.
- Confirm language switching updates the new OfficeCLI-oriented `openai.yaml` files.
- Confirm docs describe OfficeCLI as optional and external.
- Confirm the skills route to OfficeCLI help instead of guessing command or property syntax.

## Rollback / Recovery

- If the OfficeCLI skill family feels too large for phase one, keep only `ae-officecli` and move format-specific logic into references.
- If validation becomes too environment-dependent, keep the metadata and docs but make OfficeCLI smoke scripts opt-in rather than part of default checks.
- If install docs become too brittle, remove automatic install language and keep only explicit external prerequisite guidance.
- If the capability list becomes too crowded, demote advanced profile material into references and defer additional top-level skills.

## Handoff

Recommended execution order:

1. Run `ae-review domain:document mode:report-only` on this plan.
2. Implement `ae-officecli` first, then the three format skills.
3. Add metadata and docs only after the skill set shape is stable.
4. Add OfficeCLI detection and smoke helpers last so they reflect the final integration shape.

Recommended next command:

```text
Use ae-review domain:document mode:report-only to review docs/ae/plans/2026-05-12-002-officecli-integration-plan.md
```
