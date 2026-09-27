---
type: design
status: completed
date: 2026-09-27
title: plugin-scale-compatibility
origin: docs/ae/prds/2026-09-27-001-plugin-scale-compatibility-prd.md
originFingerprint: plugin-scale-compatibility-2026-09-27
format: human-readable-design
sharded: false
---

# Design: Plugin Scale Compatibility

## Source

- Source: `docs/ae/prds/2026-09-27-001-plugin-scale-compatibility-prd.md`
- In scope: all distributed skills, shared AE scripts, project/global install and update paths, evidence/gate semantics, focused tests and release validation.
- Out of scope: target application runtime changes, production load testing, database writes, external provider calls and Git delivery.

## AI Parse Contract

- Stable decisions are owned by Decisions; executable acceptance cases are owned by Test Cases.
- Repository-relative paths refer to the current checkout, not installed copies or production evidence.
- A partial scan remains advisory. `status: ok` alone is not completeness.

## Split Manifest

- sharded: false
- files:
  - design.md

## Overview

- Required dimensions: architecture, CLI, filesystem integrity, tests, security, observability, non-functional.
- Explicit omitted dimensions: database and UI/UX explicitly-omitted because the plugin changes no application database or browser interface.
- Success means bounded local helpers and recoverable local installation, not a capacity guarantee for target applications.

## Implementation Constraints

- Preserve existing memory/document lifecycle changes and their 4096-byte/80-line and 15KiB contracts.
- Preserve command names and retained JSON fields; new safety failures are explicitly documented.
- Use built-in Node filesystem/process APIs and no added runtime dependency.
- Cross-host locks, network filesystem rename guarantees and automatic stale-lock removal are outside the implementation.

## Pre-Change Evidence

| Area | Evidence | Conclusion | Confidence |
|---|---|---|---|
| Distribution | `plugins/ai-agent-engine-codex/skills`, `.ae-source/skills`, mirror checker | plugin source and maintenance mirror are paired artifacts | verified |
| Scanning | `scripts/ae-tools/graph.mjs`, `tasks.mjs`, `recovery.mjs` | recursive reads and content loads lack uniform budgets | verified |
| Install | `scripts/install-project.mjs`, `plugins/.../update-project.mjs` | staging/backup exists, but project apply is delete-then-copy and update provenance is incomplete | verified |
| Evidence | `scripts/ae-tools/gate.mjs` | validation command presence is treated as sufficient for pass | verified |
| Tracker/config | `issues.mjs`, `yaml.mjs` | write lock and full scans are small-workspace oriented; unsupported YAML may be hidden by caller fallback | verified |

## Architecture

### D1. Shared contract owner

Add `plugins/ai-agent-engine-codex/skills/ae-help/references/scale-and-distributed-engineering.md` as the canonical cross-skill knowledge layer. It is a decision contract, not a runtime dependency. Skill documents link to it only when the request crosses a scale trigger; `ae-backend/references/data-access-contract.md` remains the database/query/bulk specialization.

### D2. Bounded scan primitives

Extend the existing graph utilities with a bounded source scan result containing files, skipped entries, byte counts, depth, errors and truncation reasons. Preserve `collectSourceFiles()` as a compatibility wrapper. Graph and task analysis consume the bounded result and expose completeness rather than silently dropping work.

Dependency extraction uses shallow keyword/declaration-boundary scanning rather than repeatedly searching the remaining file for a `from` clause. Static, multiline, re-export and literal import/require forms are covered; this is not a complete language parser.

### D3. Content-aware task scope

For scan mode, inspect candidate text only within the same byte/error budget. Score path matches, content matches and contract vocabulary. Return top candidates with match provenance, while retaining the existing fallback warning when no candidate is reliable.

### D4. Transactional project install

Keep the existing ownership checks and backups. Add a per-target lock and operation journal, stage each replacement under the managed staging root, validate staged fingerprints and language/CLI loading, then swap one component at a time with a recovery record. Recovery restores the recorded pre-install state. This avoids a delete-and-recopy interval, but two renames and multiple components are not one filesystem-wide transaction: consumers must not run during activation, and a crash between renames requires explicit recovery.

### D5. Evidence model

Gate output gains explicit evidence arrays and an `evidence_status` summary. `--validation` remains a declaration for compatibility; `--validation-result` records structured execution results. A final gate is blocked or marked unverified unless successful validation is explicitly supplied. The gate never executes arbitrary commands.

### D6. Bounded operational records

Recovery and issue list commands gain bounded result options and diagnostics. Issue locks contain metadata and stale-lock messages. Multi-agent config parsing distinguishes unsupported YAML from malformed YAML; callers report invalid configuration instead of silently taking defaults.

### D7. Source-bound global publication

Reuse the same source fingerprint for preview confirmation and the operation record. Journal the staging location before copying so copy or verification failure can remove unpublished staging. Compare both staged and current source content against the confirmed fingerprint; publish the skill roster from the installed verified copy, not the mutable source checkout.

### D8. Memory/document integration

The document-lifecycle owner remains the sole owner of pagination, retrieval and generated-page identity. Reuse `docsLocation` and `isDocumentPage`; do not fork their regexes or storage format. Recovery accepts one explicit absolute `--docs-root`, rejects invalid roots/options and never mixes external and repository docs. Default paths remain worktree-relative; explicit-root paths are docs-relative, reported via `pathBase` and `docsRoot`, with `docsPath` always docs-relative. Root selection is not registry/branch identity verification.

Navigation and immutable fragments are not resumable tasks. Source graph/task/review-impact scans exclude generated pages by default, expose the eligibility policy and exclusion counts, and allow `--include-document-pages` explicitly. A changed page remains in the mandatory review inventory. Owning-topic retrieval uses the existing bounded document/memory search and preserves its history/current authority boundary. Excluding page content does not eliminate directory-entry traversal; entry-budget exhaustion remains incomplete.

Both scan and plan units mark immutable pages `read_only`; worker requests exclude them from `owned_files` and include them in `read_only_files` and `forbidden_files`. Page-only units use a read-only lane and block write-parallel readiness. Mixed units retain writable source ownership and all existing conflict/dependency/parent gates. This is an execution contract, not an operating-system permission mechanism.

The collaborating memory task owns the canonical identity/local-lock repair. Case aliases must coordinate on the same Windows document without a blanket POSIX lowercase identity, and existing router metadata/page hashes must remain recoverable. Cross-host coordination and uncoordinated legacy writers are not established by these fixtures.

## Decisions

### ADR-001: shared reference versus copy-pasting all skills

- Chosen: one `ae-help` reference plus short routing clauses.
- Rejected: duplicate checklists in 40 skills because wording and policy would drift and token cost would scale with every invocation.

### ADR-002: stage/swap versus delete/copy

- Chosen: staged component replacement with journaled recovery.
- Rejected: delete-then-copy because a process interruption creates a visible partial install.

### ADR-003: gate executes validation versus records external execution

- Chosen: caller or CI supplies structured execution results.
- Rejected: arbitrary command execution inside gate because it expands command-injection and environment-side-effect risk and cannot establish authenticated/deployment proof.

### ADR-004: full storage migration versus bounded compatibility layer

- Chosen: preserve Markdown format and add bounds/diagnostics first.
- Rejected: immediate database/index migration because it would create a large compatibility and rollback surface unrelated to the current plugin release.

## Data And Compatibility Contract

- Existing JSON keys and command names remain valid.
- New fields are additive: `diagnostics`, `completeness`, `evidence`, `source_revision`, `maintenance` and operation lock metadata.
- Existing `status: ok` is retained for bounded partial scans; callers inspect completeness/truncation before treating a result as complete evidence.
- Invalid explicit user configuration is surfaced; only missing configuration may use documented defaults.
- Final/before-review gate command declarations now block with CLI exit 1. Existing callers must supply real structured execution records and local evidence artifacts.
- YAML remains an explicitly limited subset. Unsupported syntax fails; this release does not claim full YAML compatibility.

## API

The interface is CLI JSON. Shared scan options are file/entry/depth/file-byte/total-byte/error/time limits. `gate --validation-result` accepts a bounded JSON object with command, status, tier and, for execution states, exitCode, timestamps and an evidence path. No shell command is executed by gate. Update output separates installation and maintenance status.

## Database

explicitly-omitted: Markdown/JSON storage remains local; no database or migration is introduced. Issue pagination is over a bounded live sample, not a transactional cursor or exact total after truncation.

## UI/UX

explicitly-omitted: No browser UI changes. Installed metadata and source parity do not establish client reload/discovery.

## Mapping Tables

### api-field-to-database-column-mapping

Not applicable to a database. CLI `completeness` maps to scan diagnostics; gate `evidence` maps to local artifact SHA-256; installer `operationId` maps to its filesystem journal.

### api-error-to-ui-state-mapping

No UI states. Partial scan maps to `complete: false`; invalid explicit config disables parallel readiness; gate blocks with exit 1; maintenance failure returns `updated-maintenance-failed`; recovery conflicts preserve existing files.

### test-case-to-contract-coverage

| Requirement | Case | Boundary |
| --- | --- | --- |
| Bounded analysis | TC-001, TC-002, TC-008 | Local filesystem and bounded child-process fixtures |
| Truthful gate | TC-003 | Caller evidence, no execution |
| Install recovery | TC-004, TC-009 | Isolated target, no live deployment |
| Issue/config safety | TC-005, TC-006 | Local concurrency/config fixtures |
| Skill distribution | TC-007 | Static source/mirror and smoke |
| Memory/document integration | TC-010 | Isolated fixtures plus read-only registered external-root recovery |
| Canonical document identity | TC-011 | Windows aliases, legacy metadata and independent local writers |

### ui-component-to-api-endpoint-mapping

Not applicable: no UI component or HTTP endpoint is added.

## Security

- Bounded scans and project-installer managed writes enforce lexical and canonical containment and reject link/junction traversal. Existing global migration/link handling remains a separate contract; local cooperative locking is not protection against hostile or uncoordinated filesystem mutation.
- Locks are local coordination, not distributed consensus. The reference requires lease/fencing discussion for shared filesystems or multi-host orchestration.
- Staged content is fingerprinted before activation; rollback failure is a distinct recovery-failed state.
- Secrets, credentials, raw cookies and opaque runtime identifiers remain excluded from artifacts.

## Observability

- Every bounded operation reports requested/effective limits, observed counts, skipped/error counts and completeness.
- Install operations report operation ID, phase and source revision/fingerprint where available; update output additionally separates installation from maintenance. Rollback/recovery status is reported when that path is exercised.
- Validation reports declaration, execution, success/failure and unverified boundaries separately.
- This design only proves plugin-local behavior. Application load, distributed correctness and production acceptance remain unverified.

## Test Cases

| ID | Scenario | Expected signal |
|---|---|---|
| TC-001 | nested/large scan exceeds depth or byte budget | bounded result and explicit truncation diagnostics |
| TC-002 | broad task description with matching content but unrelated paths | content candidates returned with provenance |
| TC-003 | gate receives declarations without execution | no false successful validation evidence |
| TC-004 | install failure during staged activation | old target restored and journal explains phase |
| TC-005 | stale issue lock and bounded list | actionable lock diagnostic and result limit |
| TC-006 | malformed/unsupported YAML | explicit invalid configuration, no silent default |
| TC-007 | source/mirror and release checks | parity and release contract pass |
| TC-008 | repeated malformed import/export text below file limit | bounded subprocess finishes and retains trailing valid dependencies |
| TC-009 | source changes during/after staging or copy fails | reject changed staging, clean unpublished files, publish verified roster only |
| TC-010 | external docs recovery and explicit immutable page inclusion | one selected root, visible path bases, no page write ownership and intact review inventory |
| TC-011 | Windows aliases or two document writer entrypoints address the same file | one local lock, stale preview rejected, legacy pages preserved and retry retains both appends |

### TC-001 Bounded scan

Exercise large directories, depth, byte, file and error budgets; incomplete results cannot claim complete freshness.

### TC-002 Task candidates

Find a symbol in file contents without a path match, preserve match provenance and require manual scoping.

### TC-003 Validation gate

Declarations, missing evidence, duplicate results and unsuccessful execution cannot pass final validation; supplied evidence is hashed without execution.

### TC-004 Installation failure

Inject failure between renames and restore old state; recover an interrupted journal idempotently; preserve conflicts and separate tidy failures.

### TC-005 Operational records

Bound issue/recovery output, serialize independent local writers, record owners and refuse automatic expired-lock stealing.

### TC-006 Invalid configuration

Reject duplicate/malformed/unsupported YAML and invalid multi-agent values; cycles cannot report parallel readiness.

### TC-007 Distribution

Check 40 conditional skill routes, source/mirror parity, bilingual release notes and isolated project/global installation.

### TC-008 Dependency parsing

Exercise static/multiline imports, re-exports and literal calls. For repeated malformed import/export clauses, use a subprocess timeout so a regression cannot stall the test runner. Synthetic elapsed time is not an application throughput or distributed capacity benchmark.

### TC-009 Global staging

Inject source mutation and copy failure at the filesystem copy boundary in an isolated home. Fail before registration and remove staging. A later source roster change must not change the already confirmed installed release.

### TC-010 Document integration

Verify default and explicit recovery roots, invalid input rejection, metadata-only scope and excluded navigation/pages. Exercise graph/task/review impact inclusion, scan and plan read-only ownership, mixed writable/read-only units and changed-file review inventory. Repeat the CLI contract through an isolated installed copy.

### TC-011 Document identity

The collaborating memory task supplies fixtures for native file identity, old router/page compatibility and real independent-process contention across path aliases and index/document entrypoints. Require a new preview after contention; do not mutate external originals or equate local file locking with multi-host coordination.

## Non-Functional

- Default source scan: 500 files, 20000 entries, depth 32, 1MiB/file, 16MiB total, 20 errors, cooperative 10-second traversal deadline. Task scans default to 1000 files.
- Filesystem calls are synchronous and cannot be interrupted mid-system-call; the deadline is not a hard network-filesystem timeout.
- Source fingerprints represent files read during the invocation, not an atomic repository snapshot.
- Local exclusive-create locks are cooperative coordination, not distributed leases or fencing. Expiry only diagnoses; operator recovery requires verifying that the writer stopped.
- Application load, throughput and memory improvements require a separately authorized target benchmark.

## Consistency Check

- requiredDimensionsCovered: architecture, CLI, filesystem, tests, security, observability, non-functional
- omittedDimensionsJustified: database and UI explicitly omitted above
- stableIdsUnique: true
- mappingTablesComplete: true for the CLI/filesystem scope
- sourceScopePreserved: true
- reviewStatus: implementation reviewed and plugin-local validation passed; higher-tier runtime acceptance unverified

## Implementation Verification

The local v0.3.50 implementation is complete. Final verification on 2026-09-27: `npm test` ran 258 tests with 252 passes, no failures and six explicit environment/sample skips; `npm run check`, `npm run check:smoke` and `git diff --check` passed. Exact commands, skips, dry-run warnings, compatibility changes and regression observations are recorded in `docs/ae/plans/2026-09-27-001-plugin-scale-compatibility-plan.md`.

The v0.3.51 follow-up integrates explicit external-root recovery, immutable-page scan/ownership rules and the collaborating memory task's canonical identity fix. The full local suite ran 276 tests: 269 passed, no failures and seven explicit environment/sample skips. Static checks and installed smoke passed, including external-root selection and read-only page ownership; real independent-process contention fixtures passed. The plan retains the v0.3.50 baseline separately from this follow-up.

This result does not establish real target-project load behavior, multi-host fencing, shared-filesystem crash semantics, production acceptance or current-user plugin installation. Global staging and publication were exercised only in isolated homes with an injected registration runner.

## Rollback

Rollback is file-scoped: revert the task-owned code/reference/test/release files only. Installer rollback must use its journal/backup path. Do not reset the worktree or delete unrelated user changes.
