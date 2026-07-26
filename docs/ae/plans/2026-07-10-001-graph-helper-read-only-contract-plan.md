---
type: plan
status: completed
date: 2026-07-10
title: graph-helper-read-only-contract
origin: docs/ae/prds/2026-07-10-001-graph-helper-read-only-contract-prd.md
originFingerprint: 2026-07-10-graph-helper-read-only-contract
depth: standard
format: human-readable-plan
sharded: false
---

# Graph Helper Read-Only Contract Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task. Each step uses a checkbox and must retain its stated validation evidence.

**Goal:** Make the documented graph-build and graph-query commands read-only while preserving their current graph response contract.

**Architecture:** The packaged `ae-tools` graph builder remains an in-memory scan. The default response is the existing `--no-write` store payload, and the former snapshot helper is removed. Tests run commands in temporary worktrees and assert that no graph snapshot exists.

**Tech Stack:** Node.js ESM, Node built-in test runner, existing repository scripts.

---

## Source

- Requirements: `docs/ae/prds/2026-07-10-001-graph-helper-read-only-contract-prd.md`
- Approved design: `docs/superpowers/specs/2026-07-10-graph-helper-read-only-design.md`
- Governing rules: `AGENTS.md` and `docs/ae/constitution.md`

## AI Parse Contract

- canonicalKind: plan
- humanEquivalent: true
- stableIdsRequired: true
- noImplicitScope: true

## Scope

Remove the graph snapshot write path, add regression tests for default build/query behavior and README wording, and clarify the public read-only claim. The root wrapper, graph extraction algorithm, graph result fields other than `store.written`, and all persistent graph features remain out of scope.

## Readiness

- Goal: default `ae-graph-build` and `ae-graph-query` commands do not modify the inspected project.
- Acceptance criteria: R1-R4 and NFR1-NFR2 from the source PRD.
- Non-goals: no graph database, persistence option, graph schema, dependency, installer change, or full graph refactor.
- Affected areas:
  - `plugins/ai-agent-engine-codex/scripts/ae-tools.mjs`
  - `tests/skill-scripts.test.mjs`
  - `README.md`
  - `README.en.md`
  - `docs/00-process/active/graph-helper-read-only-contract/progress.md`
- Validation surface:
  - `node --test --test-name-pattern "graph-(build|query)|graph helper documentation" tests/skill-scripts.test.mjs`
  - `npm.cmd test`
  - `npm.cmd run check`
  - `git diff --check`
- Open questions: none.

## Assumptions

- The current `--no-write` payload is the compatibility baseline: `{ path: 'docs/ae/graphs/graph.json', schemaVersion: 1, written: false }`.
- The reviewed documentation and PRD are authoritative that implicit graph persistence is unsupported.
- The user has approved the design and current scope; no new product decision is required before work.

## Alternatives Considered

- Recommended: make the in-memory `--no-write` result unconditional and delete the snapshot helper.
  - Fit: exactly restores the documented contract with the smallest behavioral change.
  - Risk: callers that relied on an undocumented snapshot lose it.
- Alternative: add an explicit `--write` snapshot mode.
  - Rejected because: this introduces a new write lifecycle, authorization boundary, persistence contract, and documentation surface outside the approved scope.
- Alternative: add `--no-write` to documentation examples only.
  - Rejected because: the default API would still contradict the public read-only claim and could dirty a worktree.

## Decision Drivers

- Driver 1: restore a published read-only behavior guarantee.
- Driver 2: preserve the existing response shape used by current `--no-write` callers.
- Driver 3: remove rather than hide unapproved persistence complexity.

## Decisions

### ADR-1 - In-Memory Graph Results Only

- Decision: `graphBuild()` always returns the no-write store object and no longer calls a graph snapshot writer.
- Drivers: read-only contract, minimality, response compatibility.
- Alternatives: explicit persistence flag; documentation-only workaround.
- Why chosen: it eliminates the offending side effect while retaining the graph data and stable response fields.
- Consequences: `docs/ae/graphs/graph.json` is never produced by these commands; `--no-write` remains harmless compatibility input.
- Follow-ups: a future persistent graph feature requires a separate PRD, explicit write authorization, schema, lifecycle, and rollback design.

## Risks

- Risk: a hidden consumer depends on the undocumented snapshot file.
  - Mitigation: preserve the returned `store.path`, `schemaVersion`, and `written: false` representation; make persistence a separate future decision.
- Risk: a refactor accidentally changes graph extraction while removing the writer.
  - Mitigation: retain existing node, edge, dependency, and freshness assertions.
- Risk: documentation becomes stale again.
  - Mitigation: add a focused assertion for the explicit no-snapshot wording in both README files.

## Pre-Mortem

- Failure scenario 1: build no longer writes but query still does through a different path.
  - Mitigation: test both default CLI commands in separate temporary worktrees.
- Failure scenario 2: deleting `writeGraphStore` changes JSON output expected by existing users.
  - Mitigation: assert `store.path`, `store.schemaVersion`, and `store.written === false` before and after the implementation.
- Failure scenario 3: public documentation still only denies `.ae/graph.db`, allowing a different implicit snapshot claim.
  - Mitigation: assert the concrete `docs/ae/graphs/graph.json` no-write statement in Chinese and English README files.

## Global Constraints

- Do not add dependencies, flags, skills, installers, schemas, or persistence files.
- Do not change local dependency extraction, source filtering, output limits, or query matching behavior.
- Do not modify `scripts/ae-tools.mjs`; it is a distribution wrapper and has no graph behavior.
- Keep source text UTF-8 and preserve unrelated worktree changes.
- Run the plan serially because U2 depends on the failing test from U1 and U3 completes the documented claim tested by U1.

## Implementation Units

### U1 - Lock the Read-Only Contract with Failing Tests

- Goal: make default-write regressions observable before implementation.
- Requirements covered: R1, R2, R3, R4, NFR2.
- Acceptance criteria covered: default build/query leave no snapshot; output compatibility stays explicit; both README files name the no-snapshot boundary.
- Depends on: none.
- Files:
  - `tests/skill-scripts.test.mjs`
- Forbidden files:
  - `plugins/ai-agent-engine-codex/scripts/ae-tools.mjs`
  - `README.md`
  - `README.en.md`
- Approach: extend the existing graph-build and graph-query tests rather than adding a second fixture helper; add one focused documentation contract test beside those graph tests.
- Tests:
  - `node --test --test-name-pattern "graph-(build|query)|graph helper documentation" tests/skill-scripts.test.mjs`
- Validation: initial command must fail under the current implementation because both defaults create `docs/ae/graphs/graph.json` and README wording lacks the concrete snapshot path.
- Rollback signals: the initial test passes before U2/U3, indicating the regression assertion is not actually checking the current behavior.
- Deferred to implementation: none.

- [ ] **Step 1: Extend the build fixture with response and filesystem assertions.**

  In the existing `graph-build reports shallow local dependencies` test, immediately after the current `result.store.path` assertion, add:

  ```js
  assert.equal(result.store.schemaVersion, 1)
  assert.equal(result.store.written, false)
  assert.equal(existsSync(join(tempRoot, 'docs', 'ae', 'graphs', 'graph.json')), false)
  ```

- [ ] **Step 2: Extend the query fixture with the same no-write assertions.**

  In the existing `graph-query filters shallow graph by path` test, immediately after the current `result.store.path` assertion, add:

  ```js
  assert.equal(result.store.schemaVersion, 1)
  assert.equal(result.store.written, false)
  assert.equal(existsSync(join(tempRoot, 'docs', 'ae', 'graphs', 'graph.json')), false)
  ```

- [ ] **Step 3: Add a focused public-claim regression test.**

  Add this test immediately after the query test. `readFileSync` and `repoRoot` are already available in the test module.

  ```js
  test('graph helper documentation states that graph snapshots are not persisted', () => {
    const readme = readFileSync(resolve(repoRoot, 'README.md'), 'utf8')
    const readmeEn = readFileSync(resolve(repoRoot, 'README.en.md'), 'utf8')

    assert.match(readme, /不会写入 `docs\/ae\/graphs\/graph\.json`/)
    assert.match(readmeEn, /do not write `docs\/ae\/graphs\/graph\.json`/i)
  })
  ```

- [ ] **Step 4: Run the focused tests and record the expected red state.**

  Run:

  ```powershell
  node --test --test-name-pattern "graph-(build|query)|graph helper documentation" tests/skill-scripts.test.mjs
  ```

  Expected: FAIL. The build/query tests find `docs/ae/graphs/graph.json`; the documentation test does not find the explicit no-write statement.

### U2 - Remove the Implicit Graph Snapshot Writer

- Goal: make build and query results in-memory-only without changing graph extraction or result fields.
- Requirements covered: R1, R2, R3, NFR1, NFR2.
- Acceptance criteria covered: default build/query do not create a snapshot and retain the current no-write output shape.
- Depends on: U1.
- Files:
  - `plugins/ai-agent-engine-codex/scripts/ae-tools.mjs`
- Forbidden files:
  - `scripts/ae-tools.mjs`
  - `README.md`
  - `README.en.md`
  - `package.json`
- Approach: replace the conditional store expression in `graphBuild()` with the existing no-write object; then delete the now-unreferenced `writeGraphStore()` function.
- Tests:
  - `node --test --test-name-pattern "graph-(build|query)" tests/skill-scripts.test.mjs`
- Validation: focused build/query tests pass and `rg -n "writeGraphStore" plugins/ai-agent-engine-codex/scripts/ae-tools.mjs` has no matches.
- Rollback signals: graph output loses nodes, edges, external dependencies, freshness, or the `store` fields asserted in U1.
- Deferred to implementation: no persistence replacement is allowed.

- [ ] **Step 1: Replace the conditional store branch with the compatibility store payload.**

  Replace:

  ```js
  const store = truthy(opts['no-write'])
    ? { path: 'docs/ae/graphs/graph.json', schemaVersion: 1, written: false }
    : writeGraphStore(worktree, root, graph)
  ```

  With:

  ```js
  const store = {
    path: 'docs/ae/graphs/graph.json',
    schemaVersion: 1,
    written: false,
  }
  ```

- [ ] **Step 2: Delete the obsolete snapshot writer.**

  Delete the complete `writeGraphStore(worktree, root, graph)` function. Do not remove shared `readJson`, `readText`, `mkdirSync`, or `writeFileSync` imports because other AE commands still use them.

- [ ] **Step 3: Verify the behavior and deletion.**

  Run:

  ```powershell
  node --test --test-name-pattern "graph-(build|query)" tests/skill-scripts.test.mjs
  rg -n "writeGraphStore" plugins/ai-agent-engine-codex/scripts/ae-tools.mjs
  ```

  Expected: both graph tests pass; `rg` exits with code 1 because no reference remains.

### U3 - Align Chinese and English Public Claims

- Goal: make the README contract say exactly what the implementation guarantees.
- Requirements covered: R4, NFR1, NFR2.
- Acceptance criteria covered: both README files explicitly reject persistence of `docs/ae/graphs/graph.json` and remain consistent with the existing shallow-helper boundary.
- Depends on: U1, U2.
- Files:
  - `README.md`
  - `README.en.md`
- Forbidden files:
  - `README.zh-CN.md`
  - `INSTALL.md`
  - `INSTALL.zh-CN.md`
  - `docs/codex-port-analysis.md`
- Approach: strengthen only the graph-helper paragraph below the command examples and the existing boundary bullet; retain all current limitations and avoid claiming a graph database or persistent snapshot.
- Tests:
  - `node --test --test-name-pattern "graph helper documentation" tests/skill-scripts.test.mjs`
- Validation: focused documentation test passes and an explicit text search finds the no-write path in both files.
- Rollback signals: either README claims a snapshot is written, omits the concrete path, or deviates from the shallow/read-only limitation.
- Deferred to implementation: no documentation changes outside these two README files.

- [ ] **Step 1: Strengthen the Chinese graph-helper paragraph and boundary bullet.**

  In `README.md`, change the graph-helper paragraph below the command example to include this sentence:

  ```markdown
  它们不会写入 `docs/ae/graphs/graph.json` 或 `.ae/graph.db`，也不提供完整图谱 schema、分片、freshness 或预览页。
  ```

  Change the existing important-boundary bullet to state that the helpers are shallow read-only scripts and do not persist `docs/ae/graphs/graph.json`.

- [ ] **Step 2: Strengthen the English graph-helper paragraph and boundary bullet.**

  In `README.en.md`, change the graph-helper paragraph below the command example to include this sentence:

  ```markdown
  They do not write `docs/ae/graphs/graph.json` or `.ae/graph.db`, maintain graph freshness, shard a graph schema, or render a preview page.
  ```

  Change the existing important-boundary bullet to state that the helpers are shallow read-only scripts and do not persist `docs/ae/graphs/graph.json`.

- [ ] **Step 3: Run documentation and combined focused regression checks.**

  Run:

  ```powershell
  node --test --test-name-pattern "graph-(build|query)|graph helper documentation" tests/skill-scripts.test.mjs
  rg -n "docs/ae/graphs/graph.json" README.md README.en.md
  ```

  Expected: all selected tests pass; both README files contain the concrete no-snapshot path.

### U4 - Record Execution Evidence and Run the Delivery Gate

- Goal: retain evidence that the scoped repair met every source requirement without expanding its code surface.
- Requirements covered: R1, R2, R3, R4, NFR1, NFR2.
- Acceptance criteria covered: fresh targeted and full validation evidence, code review result, and final gate proof exist.
- Depends on: U1, U2, U3.
- Files:
  - `docs/00-process/active/graph-helper-read-only-contract/progress.md`
- Forbidden files:
  - `docs/08-ai-memory/*`
  - `docs/ae/integrity/*`
- Approach: write a concise progress note after each red/green checkpoint; use the existing gate command only after validation and code review are complete. The command creates its timestamped proof in `docs/ae/gates/`.
- Tests:
  - `npm.cmd test`
  - `npm.cmd run check`
- Validation: `git diff --check`, targeted graph tests, full tests, full check, code review, and final gate command all succeed.
- Rollback signals: any validation fails, the code review finds a blocker, or the final gate does not report `pass`.
- Deferred to implementation: archive the process note only after final delivery, following `docs/00-process` archive rules.

- [ ] **Step 1: Create the active progress note before editing runtime behavior.**

  Create `docs/00-process/active/graph-helper-read-only-contract/progress.md` with the PRD/plan paths, pre-edit Git state, scoped files, and the intended red-green validation sequence.

- [ ] **Step 2: Run fresh full validation after U1-U3.**

  Run:

  ```powershell
  npm.cmd test
  npm.cmd run check
  git diff --check
  ```

  Expected: all commands exit 0. Record the exact results in the active progress note.

- [ ] **Step 3: Run final code review and write final gate evidence.**

  Run the `ae-review` code review on the session diff, then run:

  ```powershell
  node scripts/ae-tools.mjs gate --workflow work --checkpoint final --plan docs/ae/plans/2026-07-10-001-graph-helper-read-only-contract-plan.md --validation "node --test --test-name-pattern graph tests/skill-scripts.test.mjs|npm.cmd test|npm.cmd run check|git diff --check" --review-status approve --worktree-decision current-main-user-approved --write-proof
  ```

  Expected: the gate reports `status: pass` and writes a JSON proof under `docs/ae/gates/`.

## Consistency Check

- implementationUnitCount: 4
- sourceRequirementsCovered: R1, R2, R3, R4, NFR1, NFR2
- sourceRequirementsDeferred: none
- openQuestionsCount: 0

## Validation Plan

- Unit: U1 red tests, U2 green graph tests, and U3 documentation test.
- Integration: `npm.cmd test` and `npm.cmd run check` confirm the packaged script, wrappers, mirrors, artifact contracts, and install smoke remain valid.
- User flow: run the two documented graph helper commands in an isolated temporary worktree and confirm graph JSON is returned without a snapshot path appearing on disk.
- Data / operations: no network, database, dependency, lockfile, or external service operation; temporary test worktrees are deleted by existing test cleanup.
- Observability: the final gate JSON records commands and review status; the active progress note records red/green and full-suite outcomes.

## Rollback / Recovery

- Revert only the U1-U4 files and scoped PRD/plan/process artifacts if graph consumers report an undocumented dependency on the deleted snapshot.
- Do not restore default writing silently. A requested persistence feature must begin with a new approved PRD and explicit write authorization.

## Plan Self-Review

- Placeholder scan: pass; all commands, files, test names, and code snippets are concrete.
- Consistency check: pass; every R* and NFR* source item maps to U1-U4.
- Scope check: pass; no graph extraction, installer, dependency, or persistence redesign is included.
- Acceptance coverage: pass; filesystem assertions prove R1/R2, output assertions prove R3, and README assertions prove R4.
- Validation gaps: no browser or external-runtime validation applies to a Node CLI behavior repair.
- Alternatives and ADR check: pass; explicit persistence and documentation-only mitigation are rejected.
- High-risk pre-mortem check: pass; the three likely contract regressions have direct tests or review evidence.

## Handoff

Run `node scripts/ae-tools.mjs task-analyze --mode plan --plan docs/ae/plans/2026-07-10-001-graph-helper-read-only-contract-plan.md`, perform the AE pre-edit Git gate, then execute U1-U4 serially. No subagents are required or authorized.

## Completion Result

- U1: completed with an observed 3/3 red state for runtime and documentation regressions.
- U2: completed; graph commands are in-memory-only and `writeGraphStore` was removed.
- U3: completed; Chinese and English README contracts name the non-persisted snapshot path.
- U4: completed; focused tests pass 3/3, full tests pass 74/74, full checks pass, code review approves, and the final gate reports `pass`.
- Process archive: `docs/00-process/archive/2026-07/graph-helper-read-only-contract/progress.md`.
- Final gate: `docs/ae/gates/20260710T015903Z-work-final.json`.
