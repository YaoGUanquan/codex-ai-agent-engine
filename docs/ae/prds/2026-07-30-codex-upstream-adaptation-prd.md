---
type: prd
status: drafted
date: 2026-07-30
topic: codex-upstream-adaptation
format: human-readable-requirements
sharded: false
---

# Codex Upstream Adaptation

## AI Parse Contract

- canonicalKind: requirements
- humanEquivalent: true
- stableIdsRequired: true
- noImplicitScope: true

## Problem Frame

The latest upstream AE source contains useful process ideas, but it is a GPL-3.0-or-later OpenCode plugin. This Codex GPL-2.0-only distribution must improve only through independently written, Codex-native guidance that does not depend on OpenCode tools, agent registries, or copied source text.

## Requirements

**Design Context**
- R1. `ae-design` must require a lightweight, read-only existing-project evidence pass before producing a design, unless the user explicitly asks for a greenfield or no-repository-context design.
  Acceptance: The guidance names the allowed evidence categories, excludes likely secret-bearing paths, and requires the resulting constraints to be recorded without copying sensitive values.
- R2. The design contract template must provide a compact place to record the inspected evidence, reuse decisions, and an explicit bypass reason.
  Acceptance: The template can distinguish verified local conventions from assumptions without requiring absolute paths or source-file copies.

**Test Design Quality**
- R3. `ae-design` must require test-case quality checks for stable-ID traceability, observable assertions, and semantic duplication.
  Acceptance: The guidance rejects untraceable, weak, or duplicate test cases while retaining the existing risk-scaled method selection.
- R4. Test-case guidance must not introduce fixed counts, measured coverage claims, or mandatory test categories when their triggering structure is absent.
  Acceptance: Existing statements that test design is risk-scaled and does not require fixed scenario counts remain present.

**Distribution**
- R5. Plugin source and `.agents/skills` mirror changes must remain byte-equivalent, and the distribution versions must advance together.
  Acceptance: Mirror, language metadata, skill contract, install smoke, package tests, and package checks pass with both versions set to `0.3.6`.

## Non-Functional Requirements

- NFR1. No new dependency, skill directory, script, runtime hook, automatic agent routing, or browser action is added.
  Acceptance: The scoped diff affects only the existing `ae-design` guidance/template, mirrors, tests, versions, and task evidence.
- NFR2. Guidance must not claim that static checks prove runtime, browser, or deployment behavior.
  Acceptance: The validation report states the bounded scope of the tests and checks.

## Scope Boundary

### In Scope

- Existing-project evidence guidance in `ae-design`.
- A matching `Existing Project Evidence` template section.
- Non-quantitative test-case quality rules.
- Source/mirror regression coverage and synchronized `0.3.6` metadata.

### Out Of Scope

- Upstream code or text copying, OpenCode runtime support, new skills, E2E report generation, Playwright configuration, and automatic review dispatch.
- Runtime, browser, deployment, or target-project acceptance testing.
- Git commit or push.

### Constraints

- Retain the current risk-scaled test-design contract.
- Use repository-relative paths and keep secret-bearing paths out of recorded evidence.
- Preserve user-owned work and current plugin conventions.

## Validation Evidence (Conditional)

- Static inspection: required for source/mirror equality, guidance wording, version synchronization, and scoped diff review.
- Focused automated test: required for the new source/mirror assertions.
- Integration/build: required through `npm test` and `npm run check`.
- Runtime health, authenticated service smoke, browser acceptance, deployment/operations: not-applicable because this change only alters local skill guidance and tests.

## Key Decisions

- D1. Adapt portable process contracts rather than copy upstream artifacts.
  Reason: The upstream license and OpenCode runtime are incompatible with direct reuse.
- D2. Add non-quantitative test-case quality checks instead of upstream quotas.
  Reason: Risk structure, rather than arbitrary scenario counts, determines useful coverage.
- D3. Record existing-project evidence in the design artifact rather than create a repository-exploration skill.
  Reason: The design phase is the consumer of this context; a new entrypoint would duplicate ownership.

## Dependencies And Assumptions

### Dependencies

- Current `ae-design` source/mirror and existing semantic test harness.

### Assumptions

- The `0.3.5` manifests observed before work are the current distribution baseline.

## Open Questions

None.

## Evidence Notes

- Latest upstream source observed at `4547f7c49a3cbf061739eb9c2a9676ceba674e0f` through `git ls-remote` and a read-only clone.
- Upstream `package.json` declares `GPL-3.0-or-later`; local `package.json` declares `GPL-2.0-only`.
- Existing local risk-scaled contract is in `plugins/ai-agent-engine-codex/skills/ae-design/SKILL.md` and its design template.

## Consistency Check

- requirementsCount: 5
- nonFunctionalRequirementsCount: 2
- decisionsCount: 3
- openQuestionsCount: 0
