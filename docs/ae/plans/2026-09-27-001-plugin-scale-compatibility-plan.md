---
type: plan
status: completed
date: 2026-09-27
title: plugin-scale-compatibility
origin: docs/ae/prds/2026-09-27-001-plugin-scale-compatibility-prd.md
originFingerprint: plugin-scale-compatibility-2026-09-27
depth: deep
format: human-readable-plan
sharded: false
---

# Plan: Plugin Scale Compatibility

## Readiness

- Requirements source: present and user-confirmed.
- Design source: present with repository evidence and additive compatibility decisions.
- Worktree: intentionally dirty before this task; concurrent v0.3.48/v0.3.49 memory/document lifecycle changes and prior v0.3.47 data-access contracts are protected.
- Delivery boundary: local implementation and layered validation only; no commit, push, deploy or target-project runtime execution.

## Execution Progress

| Units | State | Evidence |
|---|---|---|
| U1, U7 | implemented, statically verified | all 40 skill routes and source/mirror checks |
| U2, U4, U5 | implemented, focused tests verified | bounded scans, graph parsing, task/config, issue concurrency and evidence gate |
| U3, U6 | implemented, focused tests verified | staged install/recovery, source-bound global publication and update maintenance status |
| U8 | completed, locally verified | v0.3.50 manifests and bilingual notes; final suite/check/smoke passed within the boundaries below |
| U9 | completed, locally verified | explicit external recovery, page exclusions/read-only ownership; 10 integration cases and joint identity regressions pass |
| U10 | completed, locally verified | v0.3.51 metadata/references and source mirrors; full suite/check/smoke pass within the boundaries below |

## Goals And Non-Goals

Goals are the PRD requirements R1-R8. Non-goals are target-project architecture, production performance proof, external services, database writes and Git delivery.

## Acceptance Matrix

| ID | Implementation units | Validation |
|---|---|---|
| A1 | U1, U7 | mirror, skill contract and focused reference tests |
| A2 | U2, U5 | bounded graph/task/recovery/issue fixtures |
| A3 | U4 | gate evidence tests |
| A4 | U3, U6 | install/update failure and smoke tests |
| A5 | U5 | issue/YAML/config tests |
| A6 | U8 | `npm test`, `npm run check`, `npm run check:smoke` |
| A7 | U8 | final evidence explicitly marks higher tiers unverified |

## Implementation Units

### U1 - Shared scale/distributed engineering contract

- Depends on: none
- Files: `plugins/ai-agent-engine-codex/skills/ae-help/references/scale-and-distributed-engineering.md`, matching `.ae-source` mirror, relevant help metadata/tests
- Forbidden files: target projects, external docs, existing user data-access reference content
- Work: define triggers, invariants, decision fields, failure/recovery and evidence tiers; add concise routing links to all skills by category.
- Validation: mirror and skill contract checks; focused content assertions.

### U2 - Bounded graph scanner

- Depends on: U1
- Files: `plugins/ai-agent-engine-codex/scripts/ae-tools/graph.mjs`, `utils.mjs`, graph tests
- Forbidden files: generated graph snapshots and unrelated scripts
- Work: depth/file/byte/error budgets, diagnostics, safe text reads, explicit completeness, preserved legacy helper behavior.
- Validation: graph limits, oversized file, unreadable directory and diagnostic tests.

### U3 - Journaled project installer

- Depends on: U1
- Files: `scripts/install-project.mjs`, installer tests/smoke
- Forbidden files: global installer semantics unless required by shared lock helper
- Work: target lock, staged validation, journaled component swap/recovery and no delete-before-stage gap. Multiple component renames are not a filesystem-wide atomic transaction; clients remain paused during activation.
- Validation: repeated install, injected failure, stale lock and ownership tests.

### U4 - Truthful validation gate

- Depends on: U1
- Files: `plugins/ai-agent-engine-codex/scripts/ae-tools/gate.mjs`, gate tests, gate references
- Forbidden files: arbitrary command runners and deployment claims
- Work: additive structured execution result input and explicit evidence status.
- Validation: declaration-only, success, failure and unverified scenarios.

### U5 - Task/recovery/issue/config bounds

- Depends on: U2
- Files: `tasks.mjs`, `recovery.mjs`, `issues.mjs`, `yaml.mjs`, `utils.mjs`, `swagger.mjs`, `markitdown.mjs`, shared local lock helper, focused tests
- Forbidden files: full issue storage migration and external database dependency
- Work: content-aware bounded scope, bounded recovery/list/conversion/spec output, lock metadata/stale diagnostics, explicit malformed config behavior.
- Validation: large fixture, pagination/limit and malformed configuration tests.

### U6 - Update/global provenance and safety

- Depends on: U3, U4
- Files: `update-project.mjs`, global installer contracts/scripts and relevant tests
- Forbidden files: network delivery changes outside updater contract
- Work: source revision/fingerprint, maintenance outcome separation, lock/recovery diagnostics and additive operation metadata.
- Validation: local repository update fixtures, tidy failure, `--no-tidy`, global smoke.

### U7 - All-skill and mirror integration

- Depends on: U1, U5
- Files: all affected `plugins/.../skills/**/SKILL.md`, matching `.ae-source` files, metadata/tests
- Forbidden files: unrelated skill behavior rewrites and target application code
- Work: route each skill to shared scale contract according to trigger matrix; keep references progressive and avoid duplication.
- Validation: skill contract, mirror parity, metadata, focused routing assertions.

### U8 - Release and layered validation

- Depends on: U2, U3, U4, U5, U6, U7
- Files: package/manifest, README/CHANGELOG, tests and process evidence
- Forbidden files: Git history and external docs
- Work: increment SemVer for distributable behavior, update bilingual notes, run validation tiers and record residual risks.
- Validation: syntax, focused tests, full tests, contract checks, install smoke, diff review.

### U9 - Memory/document integration

- Depends on: U2, U5, U7
- Files: `ae-tools/recovery.mjs`, `graph.mjs`, `tasks.mjs`, `review.mjs`, `utils.mjs`, `tests/scale-memory-integration.test.mjs`
- Forbidden files: `memory-navigation.mjs`, `docs-lifecycle.mjs`, `bounded-documents.mjs`, their tests, external Axon docs and current-user installations
- Work: reuse the document owner's existing root guard and page classifier; make recovery explicitly select one docs root with unambiguous path bases, and omit navigation/pages from resumable artifacts. Default source scanning omits generated pages with visible policy diagnostics; explicit inclusion is available only as read-only task evidence, including plan mode. Review inventory still includes every changed file.
- Collaboration exception: the memory-maintenance task owns its separate identity/lock fix in `bounded-documents.mjs`, `docs-lifecycle.mjs`, `memory-navigation.mjs` and its identity tests. This task must not overwrite those files; joint acceptance requires legacy-router compatibility and independent-process case-alias exclusion.
- Validation: red-to-green isolated integration fixtures; memory/docs regression suites remain unchanged.

### U10 - Follow-up release and evidence

- Depends on: U9
- Files: package/manifest, bilingual README/CHANGELOG, help/scale references, LFG/work routing and worker template, paired mirrors, install smoke and this plan/design
- Forbidden files: Git history, current-user runtime, another task's memory implementation and external documents
- Work: bump to v0.3.51, keep v0.3.48/v0.3.49/v0.3.50 provenance, document explicit context and changed scan eligibility; run final validation.
- Validation: scoped tests, full suite, checks, smoke, diff inspection, bounded read-only review from the memory task.

## File Scope

Owned paths are the files listed in U1-U10 plus the three planning artifacts. Existing dirty paths not listed are forbidden and must remain unchanged.

## Validation Strategy

1. Focused tests for each unit.
2. `npm run check:syntax`.
3. `npm test` with Windows symlink capability failures separated from assertion failures.
4. `npm run check`.
5. `npm run check:smoke`.
6. `git diff --check` and final worktree/diff ownership review.

No authenticated API, browser, deployment or production evidence is claimed.

## 0.3.50 Baseline Verification

Verified on 2026-09-27 with Windows and Node.js v24.18.0. At this checkpoint the root package and distributable plugin both declared v0.3.50; the follow-up version below preserves this historical evidence.

| Command | Actual result | Evidence boundary |
|---|---|---|
| `node --test --test-name-pattern "shallow dependency extraction|shallow graph does not|global staging rejects|global publication uses" tests/scale-runtime.test.mjs tests/global-install.test.mjs` | 5 passed, 0 failed | final dependency-parsing and staging regressions |
| `npm test` | 258 tests: 252 passed, 0 failed, 6 skipped; about 82 seconds | repository-wide local fixtures, including isolated install/update and independent issue writers |
| `npm run check` | exit 0; 72 syntax-checked files, 40 skills/metadata pairs, 140 mirrored files, 80 skill entries, 12 design contracts, v0.3.50 release checks | static contracts and local read-only helper invocations |
| `npm run check:smoke` | exit 0; isolated project version 0.3.50 and all three language modes verified | project install smoke plus read-only global preview/path checks; fake-home global apply is covered by `npm test` |
| `git diff --check` | exit 0 | tracked diff whitespace integrity only |

The six skips are two Windows file-symlink fixtures requiring unavailable privileges, two POSIX-only shell fixtures, and two optional real-document samples not supplied. Directory-junction checks and the other assertions in the parent path-safety tests still ran. These skipped boundaries remain unverified.

`check-claims --dry-run` reported seven expected warnings for historical command, assumption and deferred evidence. Exit 0 does not verify those claims or execute their external-project commands.

The five final regression tests failed before the corresponding fixes. A synthetic dependency case with two 917504-byte repeated keyword inputs exceeded its 5-second child-process limit before the parser change and completed in about 176ms during the final suite. This is one local synthetic regression result, not a throughput, memory or capacity guarantee. The graph remains a shallow heuristic.

Installation regression fixtures verify rejection of source mutation during staging, removal of failed unpublished staging, and publication from the verified copy after the original source roster changes. They do not update the current user's installed Codex/Cursor copies.

## 0.3.51 Integration Verification

Verified on 2026-09-27 in the same Windows/Node environment. Both manifests now declare v0.3.51. The memory-maintenance task delivered only its three core identity modules and `tests/document-identity.test.mjs`; its source writes have stopped.

| Command | Actual result | Evidence boundary |
|---|---|---|
| `node --test tests/scale-memory-integration.test.mjs tests/ae-tools.test.mjs` | 81 tests: 79 passed, 0 failed, 2 Windows file-link privilege skips | source integration, CLI compatibility and unchanged review inventory |
| `npm test` | 276 tests: 269 passed, 0 failed, 7 skipped; about 83 seconds | full local fixture suite, including real independent issue/document writers and isolated installer failure/recovery |
| `npm run check` | exit 0; 74 syntax-checked files, 40 skills/metadata pairs, 140 mirrored files, 80 skill entries, 12 design contracts and v0.3.51 release checks | static contracts and bounded local helper invocations |
| `npm run check:smoke` | exit 0; installed version 0.3.51 and all three language modes; explicit-root recovery, page inclusion/exclusion and read-only task ownership exercised | isolated consumer installation and read-only global preview/path checks, not current-user installation |
| `git diff --check` | exit 0 | tracked diff whitespace integrity only |

The seven full-suite skips are two Windows file-symlink privilege fixtures, two POSIX shell fixtures, one POSIX case-sensitive identity fixture, and two optional real-document samples not supplied to this run. The collaborating task separately reported 41 passes and one POSIX skip with its two read-only samples enabled, plus byte-preserving recovery checks for nine external documents. That sample report is collaborator evidence, not a claim that this task migrated or rewrote the originals.

New task-ownership regressions first failed in both scan and plan modes, then passed after read-only file/worker separation. Explicit page inclusion never removes a page from the changed-file review inventory. Mixed units retain source ownership, existing forbidden paths, dependency/conflict checks and the independent parent authorization gate.

After resolving this checkout's registered `main` docs context, a read-only `recovery --docs-root <resolved-root> --type plan --limit 3 --file-limit 100` returned exactly its three external plans, docs-relative paths and complete selected scope without mixing repository artifacts. `contextVerified=false` remains intentional: the separate resolver, not recovery, establishes registration.

The collaboration review found three actionable integration defects: Windows alias identity, ignored recovery roots and writable immutable-page candidates. All have local regression coverage. Equivalent shipping checks comprise focused/full tests, static contracts, installed smoke, source/mirror parity and final diff review; no generated gate proof substitutes for these executions. Historical claim-checker dry-run warnings remain explicitly unverified.

## Delivery And Compatibility

- The implementation, tests, shared reference, source/mirror routes and bilingual release notes are complete for the PRD's plugin-local scope.
- `gate --validation` alone no longer passes final/before-review validation. Existing callers must provide observed `--validation-result` execution records and nonempty local evidence artifacts; a blocked gate exits 1.
- Explicit invalid or unsupported YAML/profile data now fails visibly and disables parallel readiness. Scan/list/conversion limits expose partial results; callers must inspect `completeness` and diagnostics.
- Preserve the concurrent memory/document-lifecycle changes and their v0.3.48/v0.3.49 release entries. The entire dirty worktree is not solely owned by this task.
- Recovery selects one docs root and declares its path base; callers must resolve external registration independently. Generated pages are excluded from source/impact scans by default and remain read-only task evidence when explicitly included or listed in plans.
- Windows document aliases now share native canonical identity and local writer locks. Existing v1 metadata retains its original page namespace. POSIX files are not merged through blanket lowercasing; POSIX runtime behavior and concurrent unpatched legacy writers remain unverified.
- No repository commit, push, deployment, target database mutation or real current-user plugin installation was performed. HEAD remains `c42cfe1749811dbf38af2a9924928a33496ac1e5` on `main`.

## Rollback And Recovery

- Revert only task-owned paths if a code change regresses compatibility.
- Use installer journal/backup recovery for interrupted installation fixtures.
- If release-note/version checks fail, do not claim a distributable release.
- Preserve all pre-existing user changes.

## Unverified Boundaries

- Real multi-host distributed locks, shared filesystems and cross-process consensus.
- Target project throughput, memory pressure, queue saturation and production recovery.
- Real Codex/Cursor UI reload/discovery after installation.
- External Git/network provider behavior beyond local fixtures.
