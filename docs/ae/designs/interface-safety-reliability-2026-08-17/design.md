---
type: design
status: drafted
date: 2026-08-17
title: interface-safety-reliability
origin: docs/ae/prds/2026-08-17-interface-safety-reliability-prd.md
originFingerprint: 2026-08-17-interface-safety-reliability
format: human-readable-design
sharded: false
---

# Design: Interface Safety And Reliability

## Source

- Requirements: `docs/ae/prds/2026-08-17-interface-safety-reliability-prd.md`.
- Defect evidence: `docs/ae/solutions/2026-08-17-interface-optimization-roadmap.md`.

## AI Parse Contract

- canonicalKind: design
- humanEquivalent: true
- stableIdsRequired: true
- noImplicitScope: true

## Split Manifest

- mode: unified
- root: docs/ae/designs/interface-safety-reliability-2026-08-17
- files:
  - design.md

## Overview

- Goal: preserve consumer-owned installation state, workspace containment, ledger integrity, delimited input semantics, and review contract validity.
- Source requirements: R1-R7, NFR1-NFR3.
- Required dimensions: overview, architecture, security, observability, non-functional, test-cases.
- Explicit omitted dimensions: api: explicitly-omitted because no external HTTP API changes; database: explicitly-omitted because the ledger remains a local file, not a database; ui-ux: explicitly-omitted because no UI is changed.
- Cross-dimension dependencies: installer ownership manifest establishes security and recovery behavior; canonical path checks protect static serving; ledger atomicity feeds observability and test evidence.

## Existing Project Evidence

- mode: inspected
- bypass reason: not applicable

| Evidence category | Repository-relative inputs | Sanitized conclusion | Confidence |
| --- | --- | --- | --- |
| stack and commands | `package.json`, `tests/*.test.mjs` | ES modules and Node built-ins are the established runtime; `node --test` is the test runner. | verified |
| structure and conventions | `scripts/install-project.mjs`, `plugins/ai-agent-engine-codex/scripts/global-install*.mjs` | Project installation is the consumer distribution boundary; global installer already uses fingerprints, journals, atomic writes, and recovery. | verified |
| reusable assets | `plugins/ai-agent-engine-codex/scripts/ae-tools/{utils,evidence,static-server,markitdown,review}.mjs` | Helpers use `safeResolve`, JSON output, and focused tests; global install pattern is reusable conceptually, not copied wholesale. | verified |

## Implementation Constraints

- Repository paths: only the paths enumerated in the execution plan and required source/mirror/release metadata.
- Runtime/build commands: Node.js test runner, `npm.cmd test`, `npm.cmd run check:all`.
- Environment variables: none.
- Dependency boundaries: Node.js standard library only.
- Feature flags/configuration: explicit `--replace-modified` applies only to installer-owned component replacement; static-server has no network opt-in.
- Rollback constraints: each installer mutation has a staging backup; no user-owned component is eligible for mutation.

## Decisions

### ADR-001 - Verify Project-Installer Ownership Before Replacement

- Decision: persist an installer state record containing the deployed component paths and content fingerprints. On re-install, replace only matching recorded components; reject unrecorded or changed components unless `--replace-modified` is explicitly supplied, then stage a backup and recover it on failure.
- Drivers: R1-R3, NFR3.
- Alternatives: blind recursive replacement; refuse all existing installs; full global-installer journal port.
- Consequences: old targets without state require deliberate takeover, while ordinary owned updates remain non-interactive.
- Supersedes: none.

### ADR-002 - Canonical Loopback Static Serving

- Decision: canonicalize the worktree and selected target, require target containment after real-path resolution, and accept only `127.0.0.1`, `::1`, or `localhost` as hosts.
- Drivers: R4, NFR1.
- Alternatives: lexical-only containment; `--allow-network`; dedicated access-control layer.
- Consequences: the documented static preview remains local-only and fails closed for symlink/junction escapes.
- Supersedes: none.

### ADR-003 - Transactional Local Evidence Ledger Append

- Decision: serialize writers with an exclusive sibling lock, rebuild the ledger in a same-directory temporary file, fsync, and rename atomically; retry only for a bounded interval and always release the lock.
- Drivers: R5, NFR1.
- Alternatives: append-only writes without chain synchronization; external database; in-process mutex.
- Consequences: single-filesystem writers gain deterministic ordering; stale locks remain an observable bounded failure rather than an implicit recovery claim.
- Supersedes: none.

### ADR-004 - Bounded Stateful Delimited Parser

- Decision: replace line splitting with an internal state machine that recognizes delimiter, quote, escaped quote, CRLF, newline-in-quote, and end-of-file transitions, retaining the 5,000 data-row ceiling.
- Drivers: R6, NFR1.
- Alternatives: add a CSV dependency; preserve split behavior; parse only single-line records.
- Consequences: command behavior becomes RFC-style for the supported subset and rejects malformed quoted fields with source location.
- Supersedes: none.

### ADR-005 - Allowlist Review-Contract Inputs

- Decision: validate documented `kind`, `mode`, and target tokens against explicit local allowlists before reviewer selection or evidence writes.
- Drivers: R7.
- Alternatives: pass through unknown values; silently normalize all unknown inputs; infer values from target names.
- Consequences: callers receive early deterministic errors and evidence cannot assert an undeclared contract shape.
- Supersedes: none.

## Mapping Tables

### api-field-to-database-column-mapping

N/A: no external API or database dimension is changed.

### api-error-to-ui-state-mapping

N/A: no external API or UI dimension is changed.

### test-case-to-contract-coverage

| TC ID | Scenario | Covered IDs | Verification signal |
| --- | --- | --- | --- |
| TC-001 | Unsafe installer target and unowned component rejection | ADR-001, R1-R3 | child installer exits non-zero without target mutation |
| TC-002 | Owned install replacement and rollback | ADR-001, R2 | state record, backup, and recovered component fingerprints match expected values |
| TC-003 | Loopback and canonical static containment | ADR-002, R4 | dry-run accepts loopback and rejects external/canonical escape inputs |
| TC-004 | Concurrent ledger append | ADR-003, R5 | ledger read returns `passed` with expected number of records |
| TC-005 | Quoted delimited conversion | ADR-004, R6 | Markdown rows preserve quoted field semantics |
| TC-006 | Invalid review-contract selectors | ADR-005, R7 | command exits with stable unsupported-value error |

### Test Coverage Matrix

| TC ID | Scenario | Design method | Covered IDs | Automatable verification signal |
| --- | --- | --- | --- | --- |
| TC-001 | target/mutation authorization combinations | decision-table | ADR-001, R1-R3 | path and ownership fixture assertions |
| TC-002 | install stage failure transition | state-transition | ADR-001, R2 | backup then restore leaves prior fingerprint intact |
| TC-003 | host and resolved path boundaries | equivalence-class | ADR-002, R4 | allowed/rejected host and target outcomes |
| TC-004 | writer contention and lock release | error-guessing | ADR-003, R5 | complete JSONL chain after child processes exit |
| TC-005 | delimiter/quote/newline grammar | equivalence-class | ADR-004, R6 | exact Markdown text and malformed location message |
| TC-006 | selector allowlists | boundary-value | ADR-005, R7 | allowed tokens succeed; unknown token rejects |

### ui-component-to-api-endpoint-mapping

N/A: ui-ux and API dimensions are explicitly omitted.

## Architecture

The project installer becomes a bounded transaction over a fixed component inventory. It captures verified prior state, stages only eligible replacement targets, applies source content, runs language synchronization, writes state only after success, and restores staged state on any later failure.

Static-server authorization has two checks: canonical input containment before start and canonical request-file containment before response. The latter prevents a link inside an otherwise valid directory from escaping after startup.

Evidence remains JSON artifacts plus JSONL ledger. The ledger lock protects both predecessor discovery and append, so a chain link cannot be selected concurrently by two writers.

## API

No external endpoints are added. CLI contracts change only by rejecting invalid values and adding installer `--replace-modified` behavior.

## Database

Explicitly omitted. `docs/ae/evidence/ledger.jsonl` is a local durable data structure covered by ADR-003, not a database table.

## UI/UX

Explicitly omitted. Errors remain CLI diagnostics and structured command exit behavior.

## Test Cases

### TC-001 - Installer Ownership Rejection

- Priority: critical
- Preconditions: temporary target containing unrecorded or changed managed path.
- Steps: run installation without replacement authorization.
- Expected result: non-zero exit; pre-existing content remains byte-identical.
- Covered IDs: R1, R2, R3, ADR-001.

### TC-002 - Installer Transaction Recovery

- Priority: critical
- Preconditions: owned target with recorded fingerprint and injected later-stage failure.
- Steps: invoke installer in failure-injection test mode.
- Expected result: target component is restored from staging and state reports no completed upgrade.
- Covered IDs: R2, ADR-001.

### TC-003 - Canonical Static Containment

- Priority: critical
- Preconditions: workspace fixture and external linked file/directory.
- Steps: dry-run static-server for loopback/non-loopback hosts and link target.
- Expected result: only loopback contained target produces preview JSON.
- Covered IDs: R4, ADR-002.

### TC-004 - Evidence Writer Contention

- Priority: critical
- Preconditions: empty temporary evidence directory.
- Steps: start multiple local writer processes and read ledger after all exit.
- Expected result: one valid record per writer and no diagnostics.
- Covered IDs: R5, ADR-003.

### TC-005 - Delimited Quoting

- Priority: high
- Preconditions: CSV/TSV fixtures containing quotes, embedded delimiters, CRLF, and multiline fields.
- Steps: convert each fixture and a malformed fixture.
- Expected result: preserved table cells or a line-and-column error.
- Covered IDs: R6, ADR-004.

### TC-006 - Review Selector Validation

- Priority: high
- Preconditions: temporary worktree.
- Steps: invoke allowed and unknown `kind`, `mode`, and target values.
- Expected result: allowed selector produces contract; unknown selector fails before evidence creation.
- Covered IDs: R7, ADR-005.

## Security

- Input trust boundaries: project target paths, server target paths and host values, ledger filesystem state, delimited file text, and CLI selectors are caller-controlled.
- Canonicalization and ownership fingerprints are mandatory before destructive installer/server actions.
- `--replace-modified` is explicit local authorization, not a proof that the overwritten content is safe or recoverable beyond the created backup.

## Observability

- Installer summary records installed state and backup/recovery location without exposing content.
- Evidence lock contention fails with a bounded diagnostic; ledger integrity is visible through the existing read command.
- Tests retain exact command outputs as local validation evidence only.

## Non-Functional

- No new npm packages or services.
- Parsing and lock retry work is bounded; static serving remains intentionally simple and local.
- Windows link behavior is tested where supported and otherwise reported as platform-gated, not inferred.

## Consistency Check

- requiredDimensionsCovered: overview, architecture, security, observability, non-functional, test-cases
- omittedDimensionsJustified: api, database, ui-ux
- stableIdsUnique: pass
- mappingTablesComplete: pass; N/A dimensions explicitly omitted
- sourceScopePreserved: pass
- reviewStatus: approved by `docs/ae/reviews/2026-08-17-interface-safety-reliability-design-review.md`
