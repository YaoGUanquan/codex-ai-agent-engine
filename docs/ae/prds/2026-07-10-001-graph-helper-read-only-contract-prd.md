---
type: prd
status: drafted
date: 2026-07-10
topic: graph-helper-read-only-contract
format: human-readable-requirements
sharded: false
---

# Graph Helper Read-Only Contract

## AI Parse Contract

- canonicalKind: requirements
- humanEquivalent: true
- stableIdsRequired: true
- noImplicitScope: true

## Problem Frame

`ae-graph-build` and `ae-graph-query` are documented as shallow, read-only helpers, but their default implementation writes `docs/ae/graphs/graph.json`. The documented commands omit `--no-write`, so a normal graph inspection can dirty a user's worktree and violate the project's published boundary.

The outcome is a behaviorally read-only graph inspection path whose implementation, tests, and public documentation agree.

## Requirements

**R1. Default build is read-only.**

Acceptance: running `node scripts/ae-tools.mjs ae-graph-build --root <path>` returns graph JSON and does not create `docs/ae/graphs/graph.json` or another graph-output file.

**R2. Default query is read-only.**

Acceptance: running `node scripts/ae-tools.mjs ae-graph-query --root <path> --path <file>` returns matching graph data and does not create `docs/ae/graphs/graph.json` or another graph-output file.

**R3. Existing read-only output compatibility is preserved.**

Acceptance: build and query retain their existing graph nodes, edges, external dependencies, freshness metadata, and `store` output shape with `written: false`; `--no-write` remains accepted.

**R4. Public claims are unambiguous.**

Acceptance: Chinese and English README text explicitly states that graph build and query do not persist `docs/ae/graphs/graph.json`, and no changed documentation advertises implicit graph persistence.

## Non-Functional Requirements

**NFR1. Minimality.**

Acceptance: the change introduces no dependency, new persistence flag, graph schema, or unrelated graph-extraction refactor.

**NFR2. Regression safety.**

Acceptance: focused tests cover default build and query no-write behavior, and the repository test/check suites pass.

## Success Criteria

- A user can run every README graph-helper example without creating a graph snapshot.
- The code no longer contains a reachable graph-output write path.
- The test suite detects a future default-write regression.

## Scope Boundary

### In Scope

- `plugins/ai-agent-engine-codex/scripts/ae-tools.mjs`
- `tests/skill-scripts.test.mjs`
- `README.md`
- `README.en.md`
- Workflow evidence for this scoped repair.

### Out Of Scope

- Persistent graph snapshots, databases, sharding, preview UIs, or a `--write` option.
- Changes to graph extraction, dependency resolution, result limits, or source-file exclusions.
- New skills, dependencies, installer changes, or global Codex configuration.

## Key Decisions

### D1. Use an in-memory-only graph result

Reason: it matches the long-standing read-only helper contract and removes the unapproved write lifecycle.

### D2. Preserve the existing no-write JSON shape

Reason: consumers already receive this shape with `--no-write`; making it the default avoids a broader response-contract change.

### D3. Remove implicit persistence instead of hiding it behind documentation

Reason: documentation-only mitigation leaves the default behavior unsafe and contradicts the published claim.

## Dependencies / Assumptions

### Dependencies

- `plugins/ai-agent-engine-codex/scripts/ae-tools.mjs`
- `scripts/ae-tools.mjs` wrapper
- Node.js built-in test runner
- Existing graph-helper tests in `tests/skill-scripts.test.mjs`

### Assumptions

- `store.written: false` is the stable read-only response representation because the current `--no-write` branch already emits it.
- No supported caller requires implicit graph snapshot creation; documentation and project memory explicitly describe the helpers as read-only.

## Open Questions

### Must Resolve Before Planning

- None.

### Deferred To Planning

- None.

## Consistency Check

- requirementsCount: 4
- nonFunctionalRequirementsCount: 2
- decisionsCount: 3
- openQuestionsCount: 0

## Self-Review

- Problem frame states the observed code/document contradiction without assuming a new persistence requirement.
- Every requirement has a command or file-inspection acceptance signal.
- Scope excludes persistence and unrelated graph logic.
- Assumptions are separated from confirmed documentation and code facts.
- No unresolved product decision blocks a one-plan repair.
