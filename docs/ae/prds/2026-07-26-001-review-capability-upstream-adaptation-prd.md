---
type: prd
status: completed
date: 2026-07-26
topic: review-capability-upstream-adaptation
format: human-readable-requirements
sharded: false
---

# PRD: Review Capability Upstream Adaptation

## Source

- User request: assess `tirth8205/code-review-graph`, `alibaba/open-code-review`, and `github/spec-kit` for current AE skill improvements on `main`.
- Brainstorm: `docs/ae/brainstorms/2026-07-26-review-capability-upstream-analysis.md`.
- Audit: `docs/ae/solutions/2026-07-26-review-capability-upstream-audit.md`.

## AI Parse Contract

- canonicalKind: requirements
- humanEquivalent: true
- stableIdsRequired: true
- noImplicitScope: true

## Problem Frame

Range reviews need a deterministic account of all changed files before applying reviewer judgment. The existing shallow graph can provide useful local context, but only when it is clearly bounded and advisory.

## Requirements

- R1. `review-package` must emit a machine-readable inventory for every file changed between the selected Git references.
  Acceptance: each entry includes path, status, optional previous path for rename/copy status, additions/deletions or binary classification, and the existing AE file role.
- R2. `review-package --with-impact` must add a bounded shallow static impact context without persisting a graph.
  Acceptance: the result identifies graph seeds, unresolved changed files, related files with hop counts and relation direction, and explicit limitations.
- R3. `ae-review` must require reviewers to account for every changed file in diff-like review scopes.
  Acceptance: the skill directs a reviewer to use the inventory, record explicit exclusions, and treat impact context as advisory.
- R4. The adaptation must remain Codex-native and distribution-safe.
  Acceptance: no external runtime, dependency, MCP configuration, hook, model provider, or copied external source is added; plugin source and `.agents/skills` mirror remain aligned.

## Non-Functional Requirements

- NFR1. The new impact calculation must remain bounded and deterministic.
  Acceptance: traversal depth is capped at four and source scan limit remains configurable.
- NFR2. User-facing evidence must avoid overclaiming.
  Acceptance: generated output states that dynamic imports, aliases, generated code, and framework resolution can be incomplete.
- NFR3. The distributable plugin version must change consistently.
  Acceptance: root `package.json` and plugin manifest use the same incremented SemVer version.

## Scope Boundary

### In Scope

- `review-package`, `ae-review` source/mirror guidance, focused tests, version metadata, and durable AE artifacts.

### Out Of Scope

- Persistent code graph storage, external review CLI installation, CI automation, LLM configuration, and new public skills.

### Constraints

- External repositories are reference inputs only.
- The project license is GPL-2.0-only; source text and code are not copied.

## Key Decisions

- D1. Reuse the current shallow graph as opt-in review context rather than introduce a full AST/SQLite graph.
  Reason: it fits existing runtime and validation boundaries while retaining a clear completeness limitation.
- D2. Extend existing review entrypoints rather than create a new skill.
  Reason: inventory preparation and review coverage are already owned by `review-package` and `ae-review`.

## Dependencies And Assumptions

### Dependencies

- Git is available because `review-package` already depends on Git references.

### Assumptions

- Existing `collectSourceFiles` and `graphNodeKind` classifications are appropriate for review preparation.

## Open Questions

- None. Persistent graph analysis and CI enforcement are explicitly deferred.

## Evidence Notes

- `code-review-graph` observed commit `4cdc7c5876791e5bb9f84ce8c2f81cae7f5bab46`, inspected `README.md` and `docs/architecture.md` -> bounded impact-context method.
- `open-code-review` observed commit `0ced7165718725e15223c3e5a506df7b7e9de51f`, inspected `README.md` and `skills/open-code-review-delegate/SKILL.md` -> deterministic file inventory and explicit review coverage method.
- `spec-kit` observed commit `c0fe0e43cd728ebc3dd1f714343f3921510a157f`, inspected `README.md` and `templates/commands/analyze.md` -> retain existing cross-artifact review lane rather than duplicate it.

## Consistency Check

- requirementsCount: 4
- nonFunctionalRequirementsCount: 3
- decisionsCount: 2
- openQuestionsCount: 0

## Completion

- Completed: 2026-07-26.
- Outcome: extended the existing review package and review skill without adding an external runtime, dependency, graph store, or new skill.
