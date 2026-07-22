---
type: prd
status: review-passed
date: 2026-07-22
topic: upstream-safety-test-contract
format: human-readable-requirements
sharded: false
---

# PRD: Upstream Safety and Test Contract Adaptation

## Source

- User request: repair the discovered validator issue, then begin the portable upstream skill improvements.
- Upstream evidence: `jiangqiang1996/ai-agent-engine` commits `5aa541d` (symbolic-link traversal) and `a6d21d3` (test-case design coverage), inspected through the Gitee API on 2026-07-22.
- Local evidence: `plugins/ai-agent-engine-codex/scripts/check-design-contract.mjs` and `check-ae-artifacts.mjs` recurse with `statSync`; `ae-design` has stable test IDs but no risk-scaled coverage-method contract.

## AI Parse Contract

- canonicalKind: requirements
- humanEquivalent: true
- stableIdsRequired: true
- noImplicitScope: true

## Goal

Prevent recursive AE validators from traversing symbolic links outside their intended roots, and make test-case design contracts more systematic without imposing disproportionate fixed test counts.

## Requirements

### R1 - Safe Recursive Validation

The design-contract and artifact validators must skip symbolic links during recursive discovery.

Acceptance: a symbolic-link directory cannot cause recursive traversal outside the requested target or create an unbounded traversal.

### R2 - Safe Design Manifest Resolution

Every Split Manifest entry must resolve to a real Markdown file inside the real design directory; symbolic-link escapes must fail with a structured validation error.

Acceptance: direct file links and links through a manifest subdirectory outside the design root are rejected, while ordinary in-directory Markdown files remain valid.

### R3 - Risk-Scaled Test Design Contract

When the test-cases dimension is required, `ae-design` must require a compact coverage matrix that records the selected design method, covered contract IDs, and automatable verification signal for each critical test scenario.

Acceptance: the contract explicitly selects applicable methods from equivalence classes, boundary values, decision tables, state transitions, and error guessing; it does not require a method when its triggering structure is absent.

### R4 - Proportionate Coverage Guidance

The template must guide API, UI/state, business-rule, data-constraint, and authorization coverage only when those dimensions exist, and must preserve compact designs for small tasks.

Acceptance: no universal endpoint/parameter count, new runtime dependency, OpenCode command, agent, or automatic tool behavior is introduced.

### R5 - Distribution Integrity

Canonical plugin skills and the `.agents/skills` mirror must remain identical, with regression coverage for the safety and test-contract behavior.

Acceptance: focused tests, mirror checks, artifact/design checks, full test suite, static checks, and whitespace validation pass.

## Non-Goals

- No OpenCode session, command, MCP, specialist-agent, or `playwright-cli` port.
- No automatic test generation or test execution framework.
- No fixed coverage counts, dependency upgrades, or changes to user-owned untracked files.

## Constraints

- Use Node.js standard library only.
- Preserve existing legacy artifact compatibility.
- Keep validators read-only and continue to emit structured errors.
- Use repository-relative paths in generated documentation.

## Assumptions

- A symlinked manifest target is invalid even when it points to a Markdown file, because the contract requires containment within the design directory.
- Coverage methodology is workflow guidance rather than a claim that a script can measure behavioral coverage.

## Open Questions

- None.

## Consistency Check

- requirementCount: 5
- nonFunctionalRequirementCount: 0
- decisionCount: 0
- openQuestionCount: 0
