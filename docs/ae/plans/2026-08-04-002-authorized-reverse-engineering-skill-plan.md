---
type: plan
status: drafted
date: 2026-08-04
title: authorized-reverse-engineering-skill
origin: docs/ae/prds/2026-08-04-authorized-reverse-engineering-skill-prd.md
originFingerprint: 2026-08-04-authorized-reverse-engineering-skill
depth: standard
format: human-readable-plan
sharded: false
---

# Plan: Authorized Reverse Engineering Skill

## Source

- Requirements: `docs/ae/prds/2026-08-04-authorized-reverse-engineering-skill-prd.md`.
- Governance: `AGENTS.md`, `docs/ae/constitution.md`, and `.agents/skills/ae-skill-creator/references/candidate-evaluation.md`.
- External method reference, not implementation input: `https://github.com/zhaoxuya520/reverse-skill` at observed commit `79cdde737e0bf3ce7000eb3a084d47e124d70504`.

## AI Parse Contract

- canonicalKind: plan
- humanEquivalent: true
- stableIdsRequired: true
- noImplicitScope: true

## Scope

Add one Codex-native `ae-reverse-engineering` skill for explicitly authorized, defensive analysis of local artifacts. The implementation creates guidance, a small report template, discovery metadata, help-catalog coverage, focused regression assertions, and the required distribution release update. It does not install or invoke reverse-engineering tools, create MCP configuration, or provide offensive workflows.

## Readiness

- Goal: provide a distinct, safe owner for authorized reverse-engineering workflow judgment.
- Acceptance criteria: R1-R7 and NFR1-NFR3 from the source PRD.
- Non-goals: external runtime integration, tool bootstrap, a specialist-skill catalog, artifact execution, network assessment, and any offensive capability.
- Affected areas: Guardrail, Knowledge, and Distribution. Memory remains owned by `ae-save-experience`; Delegation is not changed.
- Validation surface: static document/skill inspection, focused Node assertions, mirror/metadata/contract/install smoke checks, release-note validation, package checks, and artifact validation.
- Open questions: Q1 and Q2 are resolved by using only a skill-local template and direct focused assertions; no shared `docs/ae` fixture is needed.

## Validation Evidence

| Acceptance criterion | Applicable tier | Expected signal and bounded claim | Preconditions / owner | Status | Recovery or rollback signal |
| --- | --- | --- | --- | --- | --- |
| R1-R6, NFR1-NFR2 | Static inspection and focused automated test | The skill and reference template contain required authorization, prohibited-action, evidence, and explicit-install boundaries. | Maintainer; local Node runtime. | unverified | Remove the skill, references, metadata, catalog entry, and test in one rollback commit. |
| R7, NFR3 | Integration or build | Source/mirror, metadata, contract, install-smoke, release-note, artifact, package, and focused tests pass. | Maintainer; repository dependencies. | unverified | Do not distribute the version; revert only task-owned files. |
| R3-R5 | Runtime health / authenticated service / browser acceptance | Not applicable to this distribution change because no analyzer process, target, browser flow, or service boundary is added. | N/A. | not-applicable | A later real-artifact workflow evaluation requires separate authorization and evidence. |

## Assumptions

- `agents/openai.yaml` is generated or updated by the established language metadata flow in the same way as existing skills.
- The root package and plugin manifest are currently `0.3.8`; a distributable skill addition requires the next compatible SemVer patch release and dated release-note entries.
- The source and mirror capability catalogs remain identical after the addition.

## Alternatives Considered

- Recommended: a dedicated, narrow `ae-reverse-engineering` skill with static-first, authorization-first guidance.
  - Fit: owns a recurring workflow that existing skills do not cover without broadening their triggers.
  - Trade-off: it deliberately defers per-platform specialist playbooks and automation.
  - Risk: evidence quality still depends on the analyst and available tools, which the skill must label as unverified.
- Alternative: extend `ae-debug`.
  - Rejected because: it would blur failure diagnosis with authorization, artifact provenance, and safety concerns specific to reverse engineering.
- Alternative: install or route through `reverse-skill`.
  - Rejected because: it brings unsupported global configuration, automatic bootstrap/MCP behavior, a broad offensive catalog, and composite license/runtime risk.

## Decision Drivers

- Driver 1: enforce authorization and defensive scope before any risky action.
- Driver 2: preserve the project-local Codex runtime and GPL-2.0-only distribution boundary.
- Driver 3: minimize maintenance by using existing validators and no new runtime dependency.

## Decisions

### ADR-1 - One Defensive Skill, No Router Catalog

- Decision: create one skill for approved local-artifact analysis and reject tool-specific subskills, auto-routing, or automatic toolchain provisioning.
- Drivers: explicit scope, safety, license compatibility, and low maintenance.
- Alternatives: extend `ae-debug`; import external router; create one skill per platform.
- Why chosen: the generic workflow has a clear repeatable trigger while specialist paths require future evidence and potentially different safety decisions.
- Consequences: users with an uncommon artifact type may receive an evidence-based limitation rather than a guessed tool path.
- Follow-ups: use `ae-skill-creator` candidate evaluation only after repeated approved cases justify a reference or helper.

### ADR-2 - Report Template Is Local To The Skill

- Decision: add a skill-local template that records scope, artifact provenance, method, evidence, confidence, and validation gaps.
- Drivers: reusable reporting discipline without forcing every case into a repository-wide artifact directory.
- Alternatives: automatic `docs/ae` report creation; field journal writeback; no template.
- Why chosen: durable process artifacts and experience storage already require an explicit user request.
- Consequences: the skill references `ae-save-experience` when the user asks to retain a completed lesson.
- Follow-ups: promote a report format only after users request a stable cross-project artifact contract.

## Risks

- A later edit may accidentally include prohibited reverse-engineering instructions.
  - Mitigation: focused assertions verify explicit prohibited categories and the authorization gate.
- A concise skill could appear to promise tool support that is unavailable.
  - Mitigation: require observed tool availability and mark missing tools as recommendations, never as auto-installed dependencies.
- Distribution changes can drift between canonical source, mirror, metadata, catalog, and version.
  - Mitigation: update all ownership surfaces in dependency order and run existing full distribution checks.

## Pre-Mortem

- Failure scenario 1: the new skill becomes an umbrella router and overlaps `ae-debug`, `ae-skill-audit`, or `ae-save-experience`.
  - Mitigation: retain the stated trigger, non-goals, and sibling routing in `SKILL.md`; review the wording against those owners.
- Failure scenario 2: the implementation silently introduces an external tool or runtime requirement.
  - Mitigation: forbid dependency, MCP, bootstrap, and global-config edits in every implementation unit.
- Failure scenario 3: release metadata is updated but an installed project cannot discover the skill.
  - Mitigation: run mirror, metadata, contract, install-smoke, and help-catalog assertions before version/release completion.

## Implementation Units

### U1 - Define Canonical Defensive Workflow

- Goal: create the canonical skill and its reusable report template.
- Requirements covered: R1, R2, R3, R4, R5, R6, NFR1, NFR2.
- Acceptance criteria covered: authorization gate, defensive non-goals, static-first baseline, evidence classification, dynamic/network hold point, and no automatic setup.
- Depends on: none.
- Layers: Guardrail, Knowledge.
- Files: `plugins/ai-agent-engine-codex/skills/ae-reverse-engineering/SKILL.md`; `plugins/ai-agent-engine-codex/skills/ae-reverse-engineering/agents/openai.yaml`; `plugins/ai-agent-engine-codex/skills/ae-reverse-engineering/references/analysis-report-template.md`.
- Forbidden files: `.mcp.json`; `scripts/install-project.mjs`; `scripts/update-project.mjs`; all external source directories.
- Approach: write an original concise workflow with authorization classification, artifact baseline, static-first progression, evidence confidence labels, explicit stop conditions, sibling-skill routing, and the approved report-template fields.
- Tests: add direct content assertions in U4.
- Validation: inspect generated source files for all R1-R6/NFR1-NFR2 conditions.
- Rollback signals: any instruction could be read as authorization to bypass licensing, evade defenses, or interact with an unapproved target.
- Deferred to implementation: exact prose and the smallest report fields that make the template useful.

### U2 - Synchronize Mirror And Discovery Metadata

- Goal: expose the same skill through the project-local mirror and Codex language metadata.
- Requirements covered: R7, NFR3.
- Acceptance criteria covered: source/mirror parity and discoverable bilingual metadata.
- Depends on: U1.
- Layers: Distribution.
- Files: `.agents/skills/ae-reverse-engineering/SKILL.md`; `.agents/skills/ae-reverse-engineering/agents/openai.yaml`; `.agents/skills/ae-reverse-engineering/references/analysis-report-template.md`; `plugins/ai-agent-engine-codex/scripts/skill-language-metadata.mjs`.
- Forbidden files: global Codex/client configuration; external repositories; `.mcp.json`.
- Approach: mirror the finalized canonical files byte-for-byte where required and add a narrow bilingual metadata entry whose trigger is authorized reverse engineering or defensive artifact analysis.
- Tests: update metadata expectations in U4.
- Validation: `node scripts/check-skill-mirror.mjs`; `node scripts/check-skill-language-metadata.mjs`; `node scripts/check-skill-contract.mjs`.
- Rollback signals: source/mirror mismatch, unrecognized metadata, or a trigger broad enough to hijack generic debugging work.
- Deferred to implementation: none.

### U3 - Add Help Catalog And Distribution Release Surface

- Goal: document the new entrypoint and satisfy release-policy ownership.
- Requirements covered: R7, NFR3.
- Acceptance criteria covered: help discovery and synchronized distributable version/release documentation.
- Depends on: U2.
- Layers: Knowledge, Distribution.
- Files: `plugins/ai-agent-engine-codex/skills/ae-help/references/capability-catalog.json`; `.agents/skills/ae-help/references/capability-catalog.json`; `package.json`; `plugins/ai-agent-engine-codex/.codex-plugin/plugin.json`; `README.md`; `README.en.md`.
- Forbidden files: external license text; `docs/08-ai-memory`; global configuration.
- Approach: add one help-catalog record with the defensive authorization boundary; bump both package versions together; append dated release-note entries that state only local skill/distribution validation claims.
- Tests: update help-catalog assertions in U4.
- Validation: `node scripts/check-release-notes.mjs`; inspect synchronized versions; run U4 checks.
- Rollback signals: version mismatch, an undocumented user-visible entrypoint, or release text that overclaims runtime/analyst acceptance.
- Deferred to implementation: whether the patch version is `0.3.9` must be confirmed against the current manifests immediately before editing.

### U4 - Add Focused Contract Coverage And Run Gates

- Goal: prove the new skill remains structurally discoverable and preserves its critical boundary language.
- Requirements covered: R1, R2, R4, R6, R7, NFR1, NFR2, NFR3.
- Acceptance criteria covered: mandatory safety wording, report-template presence, source/mirror/catalog parity, metadata rendering, and distributable validation.
- Depends on: U1, U2, U3.
- Layers: Guardrail, Distribution.
- Files: `tests/skill-scripts.test.mjs`.
- Forbidden files: external tooling, package lockfiles, generated install fixtures outside test-controlled temporary paths.
- Approach: add a narrow test that checks both skill roots for the authorization/prohibited-action/no-auto-install/report-template contract, and extend existing metadata/catalog expectations for the new entrypoint.
- Tests: `npm.cmd test`.
- Validation: `node scripts/check-skill-mirror.mjs`; `node scripts/check-skill-language-metadata.mjs`; `node scripts/check-skill-contract.mjs`; `node scripts/check-install-smoke.mjs`; `node scripts/check-ae-artifacts.mjs`; `node scripts/check-release-notes.mjs`; `npm.cmd test`; `npm.cmd run check`; `git diff --check`.
- Rollback signals: a test failure, any unintended source/mirror difference, or distribution check failure.
- Deferred to implementation: no real-artifact test is added because the plugin intentionally does not bundle or execute analyzer tooling.

## Consistency Check

- implementationUnitCount: 4
- sourceRequirementsCovered: R1, R2, R3, R4, R5, R6, R7, NFR1, NFR2, NFR3
- sourceRequirementsDeferred: none
- openQuestionsCount: 0

## Validation Plan

- Unit: inspect U1 content and run focused `npm.cmd test` coverage.
- Integration: run source/mirror, language-metadata, skill-contract, help-catalog, release-note, and artifact checks.
- User flow: `check-install-smoke` confirms the installed project receives the entrypoint and generated metadata.
- Data / operations: not applicable; no persisted service, deployment, target artifact, or external runtime is introduced.
- Observability: final gate records exact commands and their results; any unavailable real-artifact evaluation remains unverified.

## Rollback / Recovery

- Before release, remove only files and edits owned by U1-U4, restore both versions together, and rerun the distribution checks.
- After release, issue a patch that removes or narrows the skill if its trigger causes incorrect routing or its boundary language is inadequate.
- Never recover by adding global rules, runtime hooks, or automatic tools; return to the documented no-adoption state instead.

## Plan Self-Review

- Placeholder scan: no TODO/TBD markers or vague implementation units.
- Consistency check: every PRD requirement is owned by at least one unit.
- Scope check: excludes external runtime integration and real-target actions.
- Acceptance coverage: R1-R7/NFR1-NFR3 map to U1-U4 and named checks.
- Validation gaps: real reverse-tool efficacy and analyst usability remain explicitly unverified.
- Alternatives and ADR check: dedicated skill selected over debug extension or external-router adoption.
- High-risk pre-mortem check: authorization, runtime creep, and distribution drift have recovery signals.

## Handoff

Implement U1-U4 serially. Run `ae-review domain:document` on this PRD and plan before `ae-work`; after implementation, use the same review skill for the changed distribution files and retain runtime/real-artifact proof as a separate authorized gate.
