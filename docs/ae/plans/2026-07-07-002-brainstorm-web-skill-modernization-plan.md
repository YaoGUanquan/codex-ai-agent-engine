---
type: plan
status: drafted
date: 2026-07-07
title: brainstorm-web-skill-modernization
depth: standard
format: human-readable-plan
sharded: false
---

# Plan: brainstorm-web-skill-modernization

## Source

- User request: adapt upstream AI Agent Engine multi-role collision insight logic and newer frontend skill direction into this Codex AE project.
- External source: `https://gitee.com/jiangqiang1996/ai-agent-engine`
- Freshness method: `git ls-remote https://gitee.com/jiangqiang1996/ai-agent-engine.git refs/heads/master`
- Observed upstream commit: `f0cb655ca76fc5e32b5179e155c84f857a9ec289`
- Inspected upstream files:
  - `src/tools/ae-brainstorm.tool.ts`
  - `src/services/brainstorm-service.ts`
  - `src/assets/skills/ae-web-forge/SKILL.md`
  - `src/assets/skills/ae-design/SKILL.md`
- Local source files inspected:
  - `.agents/skills/ae-brainstorm/SKILL.md`
  - `.agents/skills/ae-frontend-design/SKILL.md`
  - `.agents/skills/ae-web-app/SKILL.md`
  - `.agents/skills/ae-test-browser/SKILL.md`
  - `.agents/skills/ae-help/references/capability-catalog.json`
  - `plugins/ai-agent-engine-codex/scripts/skill-language-metadata.mjs`
  - `tests/skill-scripts.test.mjs`

## AI Parse Contract

- canonicalKind: plan
- humanEquivalent: true
- stableIdsRequired: true
- noImplicitScope: true

## Scope

Modernize existing AE Codex skills by adapting portable upstream workflow methods:

- add explicit multi-perspective collision insight guidance to `ae-brainstorm`;
- reposition `ae-frontend-design` from "first frontend version" to formal frontend design and UI implementation;
- upgrade `ae-web-app` with a Codex-native four-question web routing contract inspired by upstream `ae-web-forge`;
- update metadata, help catalog, README claims, and regression tests;
- keep plugin source and `.agents/skills` mirrors byte-for-byte aligned.

## Readiness

- Goal: current Codex AE skills should reflect the upstream multi-role brainstorm and formal web workflow direction without copying unsupported OpenCode runtime behavior.
- Acceptance criteria:
  - `ae-brainstorm` documents perspective matrix, disagreement classification, collision insights, blind spots, thinking preservation zone, and deepening directions.
  - `ae-frontend-design` no longer presents itself as only a first-version UI skill.
  - `ae-web-app` documents Q1/Q2/Q3/Q4 routing and routes final acceptance through `ae-test-browser`.
  - capability catalog, language metadata, and README no longer describe frontend work as only "初版".
  - tests fail before the skill edits and pass after implementation.
  - mirror, contract, check, and test commands pass.
- Non-goals:
  - Do not add `ae-design` in this pass.
  - Do not create `ae-web-forge` in this pass.
  - Do not claim OpenCode sub-agent registry, dynamic MCP registration, or slash command behavior.
  - Do not edit unrelated previous dirty changes except where the same metadata/test files must be updated.
- Affected areas:
  - Knowledge: skill instructions, README, capability catalog.
  - Distribution: plugin skill source, `.agents/skills` mirror, language metadata.
  - Guardrail: regression tests and validation commands.
- Validation surface:
  - `node --test tests/skill-scripts.test.mjs`
  - `npm test`
  - `npm run check`
  - `node scripts/check-skill-mirror.mjs`
  - `node scripts/check-skill-contract.mjs`
  - `node scripts/check-skill-language-metadata.mjs`
- Open questions: none blocking.

## Assumptions

- The user accepted the earlier audit recommendation and wants implementation now.
- Existing uncommitted changes are user/session work and must be preserved.
- Updating existing skills is lower risk than adding new skill entrypoints in this pass.

## Alternatives Considered

- Recommended: update existing `ae-brainstorm`, `ae-frontend-design`, and `ae-web-app` with Codex-native contracts.
- Alternative: add a new `ae-web-forge` skill now.
- Rejected because: it would expand the capability surface and require more catalog/install/test work while the current `ae-web-app` already owns broad web routing.
- Alternative: add upstream-like `ae-design` now.
- Rejected because: design contract is valuable but separable; doing it together would mix P1 modernization with a new workflow stage.

## Decision Drivers

- Driver 1: preserve Codex runtime truthfulness.
- Driver 2: reduce stale "frontend first draft" language.
- Driver 3: keep one execution pass small enough to validate.

## Decisions

### ADR-1 - Adapt upstream methods, not runtime behavior

- Decision: rewrite upstream multi-role and web routing ideas as local skill guidance.
- Drivers: Codex does not expose the same OpenCode agent registry or MCP registration contract.
- Alternatives: direct port of `ae-web-forge` and agent names.
- Why chosen: this keeps claims enforceable by existing Codex skills and local scripts.
- Consequences: no new slash command parity claim; `ae-test-browser` remains the browser acceptance endpoint.
- Follow-ups: evaluate `ae-design` as a separate design-contract skill later.

## Risks

- Metadata and README can drift from skill wording if not updated together.
- Existing dirty files may already contain unrelated user/session edits.
- Tests may include stale upstream commit expectations from prior work.

## Pre-Mortem

- Failure scenario 1: skill mirror drift causes installation or contract checks to fail.
- Failure scenario 2: README/catalog claims imply unsupported OpenCode runtime behavior.
- Failure scenario 3: tests pass by only checking one copy of a skill, leaving `.agents` stale.
- Mitigations: update source and mirror together; assert mirror equality; keep runtime caveats explicit.

## Global Constraints

- Preserve unrelated user changes.
- Use UTF-8 without rewriting files due to console display alone.
- Use `apply_patch` for manual edits.
- Do not add new dependencies.
- Do not claim browser acceptance for this documentation-only change.

## Implementation Units

### U1 - Add regression tests for modernization contracts

- Goal: encode the expected skill and metadata behavior before implementation.
- Requirements covered: acceptance criteria for brainstorm collision contract, web routing, frontend repositioning, metadata/catalog/README.
- Acceptance criteria covered: all.
- Depends on: none
- Files:
  - `tests/skill-scripts.test.mjs`
- Forbidden files:
  - `package-lock.json`
- Approach: add assertions that currently fail against stale wording and missing contracts.
- Tests: `node --test tests/skill-scripts.test.mjs`
- Validation: test must fail before U2-U4 and pass after.
- Rollback signals: test expectations are too broad or assert unsupported runtime behavior.
- Deferred to implementation: none.

### U2 - Modernize brainstorm skill contract

- Goal: add Codex-native multi-perspective collision output guidance to `ae-brainstorm`.
- Requirements covered: multi-role collision insight adaptation.
- Acceptance criteria covered: brainstorm-specific criteria.
- Depends on: U1
- Files:
  - `plugins/ai-agent-engine-codex/skills/ae-brainstorm/SKILL.md`
  - `.agents/skills/ae-brainstorm/SKILL.md`
- Forbidden files:
  - `src/tools/ae-brainstorm.tool.ts`
- Approach: add concise workflow and readiness guidance for perspective matrix, disagreement classification, collision insights, blind spots, thinking preservation zone, and deepening directions.
- Tests: U1 regression assertions.
- Validation: `node --test tests/skill-scripts.test.mjs`
- Rollback signals: skill becomes too heavyweight for normal S2 clarification.
- Deferred to implementation: none.

### U3 - Modernize web/frontend skill contracts

- Goal: make frontend skills reflect formal UI implementation and web-app routing.
- Requirements covered: frontend skill modernization.
- Acceptance criteria covered: frontend and web-app criteria.
- Depends on: U1
- Files:
  - `plugins/ai-agent-engine-codex/skills/ae-frontend-design/SKILL.md`
  - `.agents/skills/ae-frontend-design/SKILL.md`
  - `plugins/ai-agent-engine-codex/skills/ae-frontend-design/references/web-ui-quality.md`
  - `.agents/skills/ae-frontend-design/references/web-ui-quality.md`
  - `plugins/ai-agent-engine-codex/skills/ae-web-app/SKILL.md`
  - `.agents/skills/ae-web-app/SKILL.md`
- Forbidden files:
  - `plugins/ai-agent-engine-codex/skills/ae-test-browser/SKILL.md`
  - `.agents/skills/ae-test-browser/SKILL.md`
- Approach: replace "first version" positioning with design/implementation wording and add Q1/Q2/Q3/Q4 routing in `ae-web-app` while preserving `ae-test-browser` as final acceptance.
- Tests: U1 regression assertions.
- Validation: `node --test tests/skill-scripts.test.mjs`
- Rollback signals: route logic duplicates `ae-test-browser` implementation responsibilities.
- Deferred to implementation: none.

### U4 - Synchronize public metadata and catalog claims

- Goal: keep user-visible skill lists and install metadata aligned with new skill behavior.
- Requirements covered: distribution and help catalog consistency.
- Acceptance criteria covered: metadata/catalog/README criteria.
- Depends on: U2, U3
- Files:
  - `plugins/ai-agent-engine-codex/scripts/skill-language-metadata.mjs`
  - `.agents/skills/ae-frontend-design/agents/openai.yaml`
  - `plugins/ai-agent-engine-codex/skills/ae-frontend-design/agents/openai.yaml`
  - `.agents/skills/ae-help/references/capability-catalog.json`
  - `plugins/ai-agent-engine-codex/skills/ae-help/references/capability-catalog.json`
  - `README.md`
- Forbidden files:
  - `README.zh-CN.md`
- Approach: update stale labels and record observed upstream commit `f0cb655...`.
- Tests: metadata and catalog assertions.
- Validation: metadata/mirror/check commands.
- Rollback signals: user-visible catalog claims diverge from skill bodies.
- Deferred to implementation: none.

## Consistency Check

- implementationUnitCount: 4
- sourceRequirementsCovered: user request covered inline
- sourceRequirementsDeferred: `ae-design` and `ae-web-forge` creation deferred
- openQuestionsCount: 0

## Validation Plan

- Unit: `node --test tests/skill-scripts.test.mjs`
- Integration: `npm test`
- User flow: not applicable; no runnable UI changed.
- Data / operations: not applicable.
- Observability: final AE gate evidence under `docs/ae/gates`.

## Rollback / Recovery

- Revert only the files touched by this plan if validation fails and cannot be corrected.
- If mirror checks fail, restore plugin source as the canonical copy and resync `.agents/skills`.
- If catalog/metadata checks fail, align visible metadata with SKILL.md rather than weakening tests.

## Plan Self-Review

- Placeholder scan: no placeholders.
- Consistency check: scope, units, and validation agree.
- Scope check: no new skill entrypoint or runtime claim.
- Acceptance coverage: all acceptance criteria map to U1-U4.
- Validation gaps: no browser check needed because no UI behavior changed.
- Alternatives and ADR check: direct port and new skill creation considered and deferred.
- High-risk pre-mortem check: runtime-claim and mirror-drift risks covered.

## Handoff

Execute serially. Start with failing tests, then update skill source and mirror, then metadata/catalog/README, then run validation and final gate.
