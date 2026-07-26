---
type: plan
status: completed
date: 2026-07-07
title: unified-web-routing-design-contract-check
depth: standard
format: human-readable-plan
sharded: false
---

# Plan: unified-web-routing-design-contract-check

## Source

- User request: resolve two follow-up risks from the `ae-design` and `ae-web-forge` addition.
- Approved approach: make `ae-web-forge` the unified frontend/Web routing entrypoint, keep `ae-web-app` as the Web app implementation skill, and add a standalone `check-design-contract` script.
- Current baseline: `5d4f3a7 chore: trim skill metadata yaml`.

## AI Parse Contract

- canonicalKind: plan
- humanEquivalent: true
- stableIdsRequired: true
- noImplicitScope: true

## Scope

1. Remove the competing four-question routing ownership from `ae-web-app`.
2. Keep `ae-web-forge` as the single Q1-Q4 frontend/Web router and route API/state implementation into `ae-web-app`.
3. Add `scripts/check-design-contract.mjs` for machine-checking `docs/ae/designs/**/design.md`.
4. Add tests, package check integration, smoke coverage, README/catalog/metadata updates, decision memory, and process evidence.

## Readiness

- Goal: close the two known residual risks before they become long-term workflow debt.
- Acceptance criteria:
  - `ae-web-forge` is documented and tested as the unified frontend/Web routing entrypoint.
  - `ae-web-app` no longer owns or duplicates the four-question router; it implements Web app flows selected by `ae-web-forge` or explicit user request.
  - `check-design-contract` passes when no design artifacts exist and rejects invalid design contracts with structured errors.
  - Valid design contracts with required frontmatter, sections, stable IDs, explicit omitted dimensions, mapping tables, and consistency fields pass.
  - `package.json` `check`, install smoke, regression tests, README, capability catalog, and AI memory mention the new checker and boundary.
- Non-goals:
  - Do not rewrite `ae-web-forge` into a runtime orchestrator or claim automatic agents.
  - Do not make `ae-design` mandatory for all plans.
  - Do not validate every design semantic relationship; start with deterministic structure and stable ID checks.
- Affected areas:
  - Knowledge: skills, README, capability catalog, port analysis.
  - Guardrail: new checker and regression tests.
  - Distribution: package check and install smoke.
  - Memory: `docs/08-ai-memory/05-decision-log.md`.
- Validation surface:
  - `node --test tests/skill-scripts.test.mjs --test-name-pattern "web routing|design contract"`
  - `node scripts/check-design-contract.mjs`
  - `node scripts/check-install-smoke.mjs`
  - `npm test`
  - `npm run check`
  - `git diff --check`
- Open questions: none; user approved the recommended approach.

## Assumptions

- A design contract file is named `design.md` under `docs/ae/designs/<topic>-YYYY-MM-DD/`.
- The checker should be lightweight and dependency-free, matching existing Node script style.
- Existing historical documents outside `docs/ae/designs` are out of scope for the new checker.

## Alternatives Considered

- Recommended: standalone `check-design-contract` plus `ae-web-forge` as unified routing entrypoint.
- Alternative: extend `check-ae-artifacts.mjs` with design contract semantics.
- Rejected because: frontmatter checks and design body checks have different scopes; a standalone checker keeps failure messages focused.
- Alternative: keep both routing blocks and add warnings.
- Rejected because: this preserves the ambiguity the user asked to remove.

## Decision Drivers

- Driver 1: one public routing owner for frontend/Web decision flow.
- Driver 2: deterministic checks for design artifacts before large design inventory exists.
- Driver 3: small, dependency-free scripts consistent with the repository.

## Decisions

### ADR-1 - Route frontend/Web decisions through ae-web-forge

- Decision: `ae-web-forge` owns Q1-Q4 routing; `ae-web-app` consumes routed implementation tasks.
- Drivers: avoid competing entrypoints and reduce long-term ambiguity.
- Alternatives: duplicate route in both skills, or merge `ae-web-forge` into `ae-web-app`.
- Why chosen: keeps the new unified entrypoint useful without overloading the implementation skill.
- Consequences: README, metadata, tests, and skill docs must stop describing `ae-web-app` as a four-question router.
- Follow-ups: monitor whether users still invoke `ae-web-app` for pure routing and refine descriptions if needed.

### ADR-2 - Add a standalone design contract checker

- Decision: add `scripts/check-design-contract.mjs` and wire it into package checks.
- Drivers: `ae-design` now creates a durable artifact contract that should fail fast when malformed.
- Alternatives: only document manual review or fold checks into `check-ae-artifacts`.
- Why chosen: standalone checker gives focused messages and can evolve independently.
- Consequences: tests must create temporary valid and invalid design artifacts.
- Follow-ups: semantic cross-reference validation can be added later if design usage grows.

## Risks

- Checker may overfit the template and reject useful compact designs.
- Removing routing language from `ae-web-app` may make direct `ae-web-app` usage less self-explanatory.
- Tests may assert wording too tightly and create churn.

## Pre-Mortem

- Failure scenario 1: `ae-web-app` still contains Q1-Q4 routing language after the change.
- Failure scenario 2: checker passes invalid contracts because it only reads frontmatter.
- Failure scenario 3: package check omits the new checker, so CI-equivalent validation does not exercise it.
- Mitigations: add red tests for routing ownership, invalid design rejection, and package check wiring.

## Global Constraints

- Use `apply_patch` for manual edits.
- Keep plugin source and `.agents/skills` mirror aligned.
- Do not add dependencies or lockfile changes.
- Do not edit unrelated archived process notes except for current task evidence.
- Preserve UTF-8 content; do not rewrite files because of terminal mojibake.

## Implementation Units

### U1 - Add red tests for routing ownership and checker behavior

- Goal: lock expected behavior before implementation.
- Requirements covered: unified routing, machine checker.
- Acceptance criteria covered: all.
- Depends on: none
- Files:
  - `tests/skill-scripts.test.mjs`
- Forbidden files:
  - `package-lock.json`
- Approach: update web routing assertions and add `check-design-contract` valid/invalid/no-design tests.
- Tests:
  - targeted `node --test tests/skill-scripts.test.mjs --test-name-pattern "web routing|design contract"`
- Validation:
  - tests fail before U2/U3 for expected missing behavior.
- Rollback signals:
  - tests fail because of syntax errors instead of missing implementation.
- Deferred to implementation:
  - none.

### U2 - Implement unified web routing documentation boundary

- Goal: make `ae-web-forge` the only Q1-Q4 owner and keep `ae-web-app` as an implementation skill.
- Requirements covered: first user issue.
- Acceptance criteria covered: unified routing.
- Depends on: U1
- Files:
  - `plugins/ai-agent-engine-codex/skills/ae-web-app/SKILL.md`
  - `.agents/skills/ae-web-app/SKILL.md`
  - `plugins/ai-agent-engine-codex/scripts/skill-language-metadata.mjs`
  - `plugins/ai-agent-engine-codex/skills/ae-help/references/capability-catalog.json`
  - `.agents/skills/ae-help/references/capability-catalog.json`
  - `README.md`
  - `README.en.md`
  - `docs/codex-port-analysis.md`
- Forbidden files:
  - `plugins/ai-agent-engine-codex/skills/ae-web-forge/SKILL.md`
- Approach: remove duplicated Q1-Q4 table from `ae-web-app`, point broad routing to `ae-web-forge`, and update public descriptions.
- Tests:
  - U1 routing assertions.
- Validation:
  - `node scripts/check-skill-mirror.mjs`
- Rollback signals:
  - `ae-web-app` becomes unable to describe its implementation responsibilities.
- Deferred to implementation:
  - none.

### U3 - Implement check-design-contract

- Goal: add dependency-free design contract validation.
- Requirements covered: second user issue.
- Acceptance criteria covered: checker behavior and package integration.
- Depends on: U1
- Files:
  - `scripts/check-design-contract.mjs`
  - `package.json`
  - `scripts/check-install-smoke.mjs`
  - `tests/skill-scripts.test.mjs`
- Forbidden files:
  - `plugins/ai-agent-engine-codex/scripts/ae-tools.mjs`
- Approach: scan design files, parse frontmatter and sections, validate required fields, stable IDs, explicit omitted dimensions, mapping headings, and consistency fields; emit JSON status.
- Tests:
  - U1 checker assertions.
- Validation:
  - `node scripts/check-design-contract.mjs`
  - `npm run check`
- Rollback signals:
  - existing repository fails because no design artifacts exist.
- Deferred to implementation:
  - full semantic graph validation of mapping row references.

### U4 - Update memory, process evidence, and final gate

- Goal: make the decision durable and record validation evidence.
- Requirements covered: documentation and audit trail.
- Acceptance criteria covered: AI memory, plan/process updates, gate.
- Depends on: U2, U3
- Files:
  - `docs/08-ai-memory/05-decision-log.md`
  - `docs/00-process/active/unified-web-routing-design-contract-check/progress.md`
  - `docs/ae/gates/<generated>-work-final.json`
- Forbidden files:
  - none
- Approach: record the resolved routing decision, checker addition, and final validation commands.
- Tests:
  - artifact checks via `npm run check`.
- Validation:
  - final validation suite.
- Rollback signals:
  - decision log contradicts README or skill docs.
- Deferred to implementation:
  - none.

## Consistency Check

- implementationUnitCount: 4
- sourceRequirementsCovered: both user issues covered.
- sourceRequirementsDeferred: semantic cross-reference validation inside design mappings.
- openQuestionsCount: 0

## Validation Plan

- Unit:
  - `node --test tests/skill-scripts.test.mjs --test-name-pattern "web routing|design contract"`
- Integration:
  - `node scripts/check-skill-mirror.mjs`
  - `node scripts/check-design-contract.mjs`
  - `node scripts/check-install-smoke.mjs`
  - `npm test`
  - `npm run check`
- User flow:
  - help/catalog and README describe `ae-web-forge` as routing entrypoint and `ae-web-app` as implementation skill.
- Data / operations:
  - no runtime data changes.
- Observability:
  - final gate JSON under `docs/ae/gates`.

## Rollback / Recovery

- Revert `scripts/check-design-contract.mjs`, package check wiring, and tests if the checker blocks legitimate existing artifacts.
- Revert only `ae-web-app`/metadata/docs if routing wording proves too narrow.
- Keep `ae-web-forge` itself intact unless a later task removes the unified entrypoint.

## Plan Self-Review

- Placeholder scan: no placeholders.
- Consistency check: units map to affected files and decisions.
- Scope check: no dependency, runtime agent, or browser implementation changes.
- Acceptance coverage: both requested issues map to tests and validation.
- Validation gaps: semantic mapping row reference checks are deferred explicitly.
- Alternatives and ADR check: standalone checker and unified routing decision recorded.
- High-risk pre-mortem check: package omission and overfitting risks covered.

## Completion Evidence

- Red test evidence: `node --test tests/skill-scripts.test.mjs --test-name-pattern "web routing|design contract"` initially failed for old `ae-web-app` routing ownership, missing `check-design-contract` package/install wiring, and missing checker script.
- Targeted green evidence: `node --test tests/skill-scripts.test.mjs --test-name-pattern "web routing|design contract"` passed 64/64 matching tests after implementation.
- Full validation evidence: `git diff --check` had no output, `npm test` passed 68/68 tests, and `npm run check` returned ok with `check-design-contract` included in syntax checks, install smoke, and runtime checks.
- Guardrail evidence: `node scripts/check-design-contract.mjs` returned `status: ok` and `checked: 0` for the current repository because no design artifacts exist yet.
- Remaining risk: the first checker validates structure and stable ID definitions, not full semantic cross-reference correctness for every mapping table row.

## Handoff

Completed serially with TDD evidence: failing tests were added first, route ownership and checker implementation were updated, docs and memory were synced, validation passed, and a final gate should be written before delivery.
