---
type: plan
status: completed
date: 2026-07-07
title: design-web-forge-skills
depth: deep
format: human-readable-plan
sharded: false
---

# Plan: design-web-forge-skills

## Source

- User request: after pushing current work to main, add the deferred `ae-design` and independent `ae-web-forge` entrypoints with detailed plan, review, fixes, and execution.
- Current branch after Git phase: `main`
- Current baseline commit: `2405903 feat: modernize upstream AE skills`
- Upstream reference repository: `https://gitee.com/jiangqiang1996/ai-agent-engine`
- Last verified upstream commit: `f0cb655ca76fc5e32b5179e155c84f857a9ec289`
- Freshness note: immediate `git ls-remote` retry timed out during this run; local upstream audit checkout is at `f0cb655ca76fc5e32b5179e155c84f857a9ec289`.
- Inspected upstream files:
  - `src/assets/skills/ae-design/SKILL.md`
  - `src/assets/skills/ae-web-forge/SKILL.md`
- Inspected local files:
  - `plugins/ai-agent-engine-codex/scripts/skill-language-metadata.mjs`
  - `plugins/ai-agent-engine-codex/skills/ae-help/references/capability-catalog.json`
  - `scripts/check-install-smoke.mjs`
  - `tests/skill-scripts.test.mjs`
  - `README.md`
  - `README.en.md`

## AI Parse Contract

- canonicalKind: plan
- humanEquivalent: true
- stableIdsRequired: true
- noImplicitScope: true

## Scope

Add two Codex-native skills:

- `ae-design`: a PRD-to-plan design contract stage that records architecture, API, data, UI/UX, test, security, observability, and non-functional decisions only when they matter.
- `ae-web-forge`: a unified web/frontend routing entrypoint that chooses between existing Codex skills (`ae-frontend-design`, `ae-web-app`, `ae-test-browser`, plus backend/sql when needed) and records rework loops without claiming OpenCode sub-agents or dynamic MCP registration.

Keep plugin source and `.agents/skills` mirror aligned, update metadata/catalog/README/install smoke tests, and add regression tests before implementation.

## Readiness

- Goal: expose `ae-design` and `ae-web-forge` as first-class Codex AE skills with truthful runtime boundaries and validation coverage.
- Acceptance criteria:
  - `ae-design` exists in plugin source and `.agents/skills`, with `SKILL.md`, `agents/openai.yaml`, and at least one reference file for design contract structure.
  - `ae-design` defines PRD input, old design input, bare-description fallback, risk-based dimension triggers, stable IDs, explicit omitted dimensions, cross-dimension mapping, review closure, output path under `docs/ae/designs`, and the boundary that it does not implement code.
  - `ae-web-forge` exists in plugin source and `.agents/skills`, with `SKILL.md` and `agents/openai.yaml`.
  - `ae-web-forge` defines target existence check, Q1/Q2/Q3/Q4 routing, forced final browser acceptance through `ae-test-browser`, up to three rework loops, and runtime-boundary rejection for OpenCode `@ui-*` agents and dynamic Chrome MCP.
  - `skill-language-metadata`, capability catalog, README files, install smoke checks, and regression tests include both new skills.
  - `check-skill-mirror`, `check-skill-language-metadata`, `check-skill-contract`, `check-install-smoke`, `npm test`, and `npm run check` pass.
- Non-goals:
  - Do not port OpenCode `ae:chrome-devtools`, `@ui-architect`, `@ui-matcher`, `@logic-weaver`, or `@browser-inspector` as active runtime agents.
  - Do not add a helper script or MCP server for design generation in this pass.
  - Do not implement a real frontend feature; this is skill/catalog work.
  - Do not make `ae-design` mandatory for every task.
- Affected areas:
  - Knowledge: skill instructions, references, README, catalog.
  - Distribution: plugin source, `.agents/skills` mirror, language metadata, install smoke.
  - Guardrail: tests and validation commands.
  - Memory: decision log and port analysis only if public claims change materially.
- Validation surface:
  - `node --test tests/skill-scripts.test.mjs`
  - `npm test`
  - `npm run check`
  - `node scripts/check-skill-mirror.mjs`
  - `node scripts/check-skill-language-metadata.mjs`
  - `node scripts/check-skill-contract.mjs`
  - `node scripts/check-install-smoke.mjs`
- Open questions: none blocking; route names are chosen as `ae-design` and `ae-web-forge`.

## Assumptions

- The user wants implementation in the same session after plan review.
- `ae-web-forge` should be independent as a user-facing skill even though `ae-web-app` already contains four-question routing.
- `ae-design` should be Codex artifact-root native: use `docs/ae/designs`, not upstream `ae/designs`.
- Skill documents should be concise and use references for longer templates.

## Alternatives Considered

- Recommended: add both skills with concise SKILL.md plus limited references and tests.
- Alternative: keep `ae-web-forge` as an alias section inside `ae-web-app`.
- Rejected because: the user explicitly requested an independent `ae-web-forge` entrypoint.
- Alternative: direct port upstream `ae-design` and `ae-web-forge` text.
- Rejected because: upstream includes OpenCode-specific question tools, sub-agent names, `ae:chrome-devtools`, and `ae/designs` paths that do not fit this Codex project.
- Alternative: implement deterministic scripts for design line checks now.
- Deferred because: current repository has no design artifact checker; first pass should encode the workflow contract and test the skill/catalog surface.

## Decision Drivers

- Driver 1: runtime truthfulness over surface parity.
- Driver 2: small skill documents with reference files for reusable templates.
- Driver 3: tests must lock source/mirror/catalog/install behavior.

## Decisions

### ADR-1 - Use Codex-native artifact paths

- Decision: `ae-design` writes design contracts under `docs/ae/designs/<topic>-YYYY-MM-DD/`.
- Drivers: this repository uses `docs/ae` for workflow artifacts.
- Alternatives: upstream `ae/designs` path.
- Why chosen: consistent with current `docs/ae/prds`, `docs/ae/plans`, and recovery behavior.
- Consequences: references and tests should assert `docs/ae/designs`.
- Follow-ups: future artifact checker may validate design frontmatter.

### ADR-2 - Make ae-web-forge a router, not an agent runtime

- Decision: `ae-web-forge` routes to existing skills and tracks rework loops; it does not create or claim OpenCode agents.
- Drivers: Codex has skills and browser/playwright tooling, not upstream OpenCode sub-agent registry.
- Alternatives: copy upstream agent table literally.
- Why chosen: prevents unsupported runtime claims.
- Consequences: user-facing behavior is explicit and manually orchestrated by Codex.
- Follow-ups: if Codex exposes stable native sub-agent contracts, revisit routing mechanics.

## Risks

- Duplicate routing between `ae-web-app` and `ae-web-forge` could confuse users.
- Adding skills requires metadata/catalog/install smoke updates in several places.
- Overly large `ae-design` docs could make the skill hard to load.
- If tests only check existence, weak skill contracts could pass while behavior is vague.

## Pre-Mortem

- Failure scenario 1: `ae-design` becomes a verbose upstream copy and imports unsupported paths/tools.
- Failure scenario 2: `ae-web-forge` claims browser MCP or sub-agent behavior that Codex cannot enforce.
- Failure scenario 3: new skill directories exist but metadata or install smoke misses them.
- Mitigations: keep explicit non-portable boundary text, add regression assertions, run mirror/metadata/contract/install checks.

## Global Constraints

- Use `apply_patch` for manual edits.
- Preserve a clean `main` baseline before editing.
- Keep plugin source and `.agents/skills` mirror byte-for-byte aligned.
- Do not add dependencies or generated lockfile changes.
- Do not claim browser acceptance for this documentation-only skill work.
- Use UTF-8 and repository-relative paths.

## Implementation Units

### U1 - Add failing regression tests for new skills

- Goal: make the expected `ae-design` and `ae-web-forge` contracts fail before implementation.
- Requirements covered: all acceptance criteria.
- Acceptance criteria covered: test-first coverage.
- Depends on: none
- Files:
  - `tests/skill-scripts.test.mjs`
- Forbidden files:
  - `package-lock.json`
- Approach: assert source/mirror SKILL equality, required contract phrases, metadata entries, catalog entries, README entries, and install smoke verified skill list.
- Tests:
  - `node --test tests/skill-scripts.test.mjs`
- Validation:
  - test must fail before U2-U4 and pass after.
- Rollback signals:
  - assertions mention unsupported OpenCode runtime behavior as expected active behavior.
- Deferred to implementation:
  - none.

### U2 - Implement ae-design skill and references

- Goal: create `ae-design` as a design-contract workflow between PRD and plan.
- Requirements covered: `ae-design` existence and contract criteria.
- Acceptance criteria covered: design skill source/mirror/reference criteria.
- Depends on: U1
- Files:
  - `plugins/ai-agent-engine-codex/skills/ae-design/SKILL.md`
  - `plugins/ai-agent-engine-codex/skills/ae-design/agents/openai.yaml`
  - `plugins/ai-agent-engine-codex/skills/ae-design/references/design-contract-template.md`
  - `.agents/skills/ae-design/SKILL.md`
  - `.agents/skills/ae-design/agents/openai.yaml`
  - `.agents/skills/ae-design/references/design-contract-template.md`
- Forbidden files:
  - `plugins/ai-agent-engine-codex/skills/ae-plan/SKILL.md`
  - `.agents/skills/ae-plan/SKILL.md`
- Approach: write concise Codex-native instructions, move detailed output skeleton to one reference file, include stable IDs and cross-dimension mapping.
- Tests:
  - U1 assertions.
- Validation:
  - `node --test tests/skill-scripts.test.mjs`
- Rollback signals:
  - skill references upstream `ae/designs`, `opencode question`, or claims implementation authority.
- Deferred to implementation:
  - no deterministic design validator script in this pass.

### U3 - Implement ae-web-forge skill

- Goal: create a unified frontend router skill that coordinates existing AE skills.
- Requirements covered: `ae-web-forge` existence and contract criteria.
- Acceptance criteria covered: web forge source/mirror criteria.
- Depends on: U1
- Files:
  - `plugins/ai-agent-engine-codex/skills/ae-web-forge/SKILL.md`
  - `plugins/ai-agent-engine-codex/skills/ae-web-forge/agents/openai.yaml`
  - `.agents/skills/ae-web-forge/SKILL.md`
  - `.agents/skills/ae-web-forge/agents/openai.yaml`
- Forbidden files:
  - `plugins/ai-agent-engine-codex/skills/ae-test-browser/SKILL.md`
  - `.agents/skills/ae-test-browser/SKILL.md`
- Approach: encode target existence check, Q1-Q4 routing, outcome mapping to existing skills, rework loop limit, and browser acceptance through `ae-test-browser`.
- Tests:
  - U1 assertions.
- Validation:
  - `node --test tests/skill-scripts.test.mjs`
- Rollback signals:
  - skill tells Codex to invoke unavailable `@ui-*` agents or dynamic Chrome MCP.
- Deferred to implementation:
  - no browser automation in this documentation-only change.

### U4 - Sync metadata, catalog, README, install smoke

- Goal: expose both skills consistently in user-facing and install surfaces.
- Requirements covered: metadata/catalog/README/install criteria.
- Acceptance criteria covered: distribution criteria.
- Depends on: U2, U3
- Files:
  - `plugins/ai-agent-engine-codex/scripts/skill-language-metadata.mjs`
  - `plugins/ai-agent-engine-codex/skills/ae-help/references/capability-catalog.json`
  - `.agents/skills/ae-help/references/capability-catalog.json`
  - `README.md`
  - `README.en.md`
  - `scripts/check-install-smoke.mjs`
- Forbidden files:
  - `README.zh-CN.md`
- Approach: add bilingual metadata, catalog entries, README capability bullets, install smoke expected paths, help queries, language labels, and `verifiedSkills`.
- Tests:
  - `node --test tests/skill-scripts.test.mjs`
  - `node scripts/check-install-smoke.mjs`
- Validation:
  - `npm test`
  - `npm run check`
- Rollback signals:
  - metadata count mismatch or install smoke missing new skill directories.
- Deferred to implementation:
  - none.

### U5 - Record evidence and run final review/gate

- Goal: prove the skill additions are validated and keep audit trail current.
- Requirements covered: review, validation, and final gate.
- Acceptance criteria covered: all.
- Depends on: U4
- Files:
  - `docs/08-ai-memory/05-decision-log.md`
  - `docs/codex-port-analysis.md`
  - `docs/ae/gates/<generated>-work-final.json`
- Forbidden files:
  - none
- Approach: record only durable decision updates, run validation, inspect diff for unsupported claims, and write final gate.
- Tests:
  - all validation commands.
- Validation:
  - `git diff --check`
  - `npm test`
  - `npm run check`
- Rollback signals:
  - final review finds runtime claims or validation gaps.
- Deferred to implementation:
  - commit/push of this second stage unless user asks after completion.

## Consistency Check

- implementationUnitCount: 5
- sourceRequirementsCovered: user request covered inline
- sourceRequirementsDeferred: deterministic design validator script, Codex-native sub-agent runtime, browser automation
- openQuestionsCount: 0

## Validation Plan

- Unit:
  - `node --test tests/skill-scripts.test.mjs`
- Integration:
  - `npm test`
  - `npm run check`
  - `node scripts/check-skill-mirror.mjs`
  - `node scripts/check-skill-language-metadata.mjs`
  - `node scripts/check-skill-contract.mjs`
  - `node scripts/check-install-smoke.mjs`
- User flow:
  - Help discoverability through `node scripts/ae-tools.mjs help design` and `node scripts/ae-tools.mjs help forge`, via install smoke.
- Data / operations:
  - not applicable.
- Observability:
  - final AE gate JSON.

## Rollback / Recovery

- If tests fail after U2/U3, remove or fix only the new skill directories and corresponding tests.
- If metadata/catalog checks fail, treat plugin source as canonical and resync `.agents`.
- If install smoke fails, update expected path/label/query lists rather than weakening skill contract tests.

## Plan Self-Review

- Placeholder scan: no placeholders.
- Consistency check: units match acceptance criteria and file ownership.
- Scope check: no helper scripts, dependencies, MCP, or real UI changes.
- Acceptance coverage: every acceptance criterion maps to U1-U5.
- Validation gaps: no browser validation needed because no UI implementation changes.
- Alternatives and ADR check: direct upstream port and alias-only approach rejected with reasons.
- High-risk pre-mortem check: runtime-claim and metadata-drift risks covered.

## Completion Evidence

- Red test evidence: `node --test tests/skill-scripts.test.mjs` failed before implementation because `ae-design`, `ae-web-forge`, metadata, catalog, README, and install-smoke surfaces were missing.
- Current worktree validation on 2026-07-07: `npm test` passed 65/65 tests and `npm run check` returned ok with `skillCount: 40`, `metadataCount: 40`, `checkedSkills: 80`, and install smoke verifying `ae-design` and `ae-web-forge`.
- Previous commit validation on 2026-07-07: temporary local clone of `240590330af6d0e66d0b31fab770e3595cecbad1` passed `npm test` 64/64 and `npm run check`, confirming the prior submitted baseline was not broken by hidden local state.
- Remaining risk: `ae-web-forge` intentionally overlaps with `ae-web-app` routing; the decision log keeps this as a re-evaluation trigger.

## Handoff

Completed serially: failing tests were added, `ae-design` and `ae-web-forge` were implemented, metadata/catalog/README/smoke coverage was updated, validations passed, and the process record was archived.
