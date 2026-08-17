---
type: plan
status: drafted
date: 2026-08-17
title: interface-safety-reliability
origin: docs/ae/prds/2026-08-17-interface-safety-reliability-prd.md
originFingerprint: 2026-08-17-interface-safety-reliability
depth: deep
format: human-readable-plan
sharded: false
---

# Plan: Interface Safety And Reliability

## Source

- Requirements: `docs/ae/prds/2026-08-17-interface-safety-reliability-prd.md`.
- Design: `docs/ae/designs/interface-safety-reliability-2026-08-17/design.md`.
- Defect evidence: `docs/ae/solutions/2026-08-17-interface-optimization-roadmap.md`.

## AI Parse Contract

- canonicalKind: plan
- humanEquivalent: true
- stableIdsRequired: true
- noImplicitScope: true

## Scope

Repair five confirmed input/persistence/distribution defects with targeted tests, source/mirror synchronization, and patch release metadata.

## Readiness

- Goal: satisfy R1-R7 and NFR1-NFR3 without changing unrelated user worktree content.
- Acceptance criteria: PRD acceptance conditions and design test contracts TC-001 through TC-006.
- Non-goals: global installer redesign, network hosting, dependencies, commits, push, deployment, or user-content cleanup.
- Affected areas: Guardrail (installer/static server/review validation), Reliability (ledger/parser), Distribution (mirror/version/release records), Knowledge (skill guidance).
- Validation surface: focused Node tests, installer smoke, package test/check/all, release note and mirror contracts, diff inspection.
- Open questions: none blocking; lock retry values and state-file field names are constrained implementation details.

## Validation Evidence

| Acceptance criterion | Applicable tier | Expected signal and bounded claim | Preconditions / owner | Status | Recovery or rollback signal |
| --- | --- | --- | --- | --- | --- |
| R1-R3 | focused integration | installer fixture verifies target ownership and restoration only | local temp dirs / implementer | planned | preserved fixture fingerprint or backup stage remains |
| R4 | focused integration | static-server dry-run/link fixture checks local path and host behavior | local filesystem / implementer | planned | command rejects before server start |
| R5 | focused integration | child writers yield a valid ledger | Node process support / implementer | planned | lock is released and ledger remains readable |
| R6-R7 | focused unit | parser/selector fixtures assert exact semantic output/errors | Node test runner / implementer | planned | failed test identifies unsupported input handling |
| NFR2 | distribution | package test/check/all and isolated installer smoke pass | repository toolchain / implementer | planned | revert task-owned release candidate files |

Browser, authenticated-service, deployment, and external-network tiers are not-applicable; local tests do not prove them.

## Contract Value Classification

- Canonical persisted values: installation state fingerprints, staged backups, evidence JSON artifacts, and ledger JSONL events.
- Derived or ephemeral values: resolved paths, static preview URLs, parsed Markdown, lock files, and temporary ledger files.
- Caller-controlled input: installer target/options, host, static target, delimited input content, review selectors.
- Compatibility/source precedence: installer state proves ownership; missing or divergent state makes target content consumer-owned by default.
- Trust boundary: filesystem content inside a chosen consumer project and worktree cannot be trusted merely because its lexical path resembles a managed component.

## Assumptions

- The dirty `main` worktree is explicitly in scope for this user-requested repair; unrelated files will remain untouched.
- The temporary test environment supports ordinary directories and symbolic links; junction assertions may be conditionally skipped only for unavailable OS capability.

## Alternatives Considered

- Recommended: narrow standard-library hardening using ownership metadata, canonical paths, bounded filesystem locking, and an internal parser.
- Alternative: reuse the global installer transaction system directly for project installation.
  Rejected because: it has different user-home responsibilities and would expand this focused repair.
- Alternative: add dependencies for CSV parsing or file locks.
  Rejected because: the supported grammar and local writer scope are narrow; dependencies add distribution burden without a requirement.

## Decision Drivers

- Prevent irreversible consumer-content deletion and workspace data exposure.
- Preserve existing plugin distribution and test conventions.
- Make failures recoverable and regression behavior deterministic.

## Decisions

### ADR-1 - Use Provenance-Gated Installer Replacement

- Decision: implement design ADR-001 with a compact state record, staging backup, ownership gate, and explicit override.
- Drivers: R1-R3, NFR3.
- Alternatives: blind replacement; global migration reuse.
- Why chosen: smallest solution with both ordinary upgrade compatibility and protective default behavior.
- Consequences: legacy installs require deliberate takeover when the first safe update occurs.
- Follow-ups: none in this repair.

### ADR-2 - Fail Closed for Network and Canonical Escapes

- Decision: implement design ADR-002 without an external-listener feature flag.
- Drivers: R4, NFR1.
- Alternatives: lexical guard or network confirmation.
- Why chosen: static preview is local-only by documented intent.
- Consequences: users needing LAN serving must choose another explicit tool.
- Follow-ups: none.

### ADR-3 - Use Local Transaction Primitives for Ledger and Parser

- Decision: implement design ADR-003 and ADR-004 with Node built-ins and bounded behavior.
- Drivers: R5, R6, NFR1.
- Alternatives: append-only race or external dependencies.
- Why chosen: fixes concrete correctness defects with no runtime expansion.
- Consequences: cross-filesystem distributed coordination remains unsupported.
- Follow-ups: monitor lock contention only if an actual workload demonstrates it.

## Risks

- Installer migration can accidentally classify a user component as owned.
- Canonical path checks can be undermined by links created after server startup.
- Lock cleanup can leave stale state on abrupt process termination.
- CSV compatibility could regress ordinary unquoted input.
- Source skill and `.ae-source` mirror can diverge.

## Pre-Mortem

- Failure scenario 1: an installer fault after deletion leaves a consumer without a usable plugin.
  Mitigation: stage before mutation, journal state in-memory/on disk as needed, and inject failure after each phase in tests.
- Failure scenario 2: an in-worktree symlink exposes an external file after startup.
  Mitigation: canonicalize each request target as well as startup target; test linked path rejection.
- Failure scenario 3: parallel ledger writers share the same predecessor hash or truncate one event.
  Mitigation: lock predecessor lookup through atomic replacement and use multiprocess regression coverage.

## Global Constraints

- Preserve unrelated dirty-worktree files and do not create a branch, worktree, commit, or push.
- Use Node.js built-ins only and no external listener mode.
- Update distribution version manifests together and synchronize changed skill source/mirror files.
- Keep public claims bounded to local test and distribution evidence.

## Implementation Units

### U1 - Make Project Installation Provenance-Gated And Recoverable

- Goal: protect consumer components from implicit replacement or deletion and retain recovery evidence.
- Requirements covered: R1, R2, R3, NFR3.
- Acceptance criteria covered: installer target validation, ownership gate, backup, failure restoration, and retired component preservation.
- Depends on: none.
- Files: `scripts/install-project.mjs`, `scripts/check-install-smoke.mjs`, `tests/install-scripts.test.mjs`.
- Forbidden files: `plugins/ai-agent-engine-codex/scripts/global-install.mjs`, `plugins/ai-agent-engine-codex/scripts/global-install-contract.mjs`, unrelated tests.
- Approach: introduce a fixed managed-component inventory/state file, canonical target validation, old-state ownership verification, staging/restore, and `--replace-modified`; update fixtures for normal first install, owned update, changed-content rejection, authorized replacement, and injected rollback.
- Tests: focused `tests/install-scripts.test.mjs` and installer smoke.
- Validation: `node --test tests/install-scripts.test.mjs`, `node scripts/check-install-smoke.mjs`.
- Rollback signals: any unsupported replacement, missing backup after mutation, failed recovery fixture, or source/target overlap acceptance.
- Deferred to implementation: exact durable state filename and failure injection hook only if scoped to tests.

### U2 - Contain Static Preview Canonically On Loopback

- Goal: prevent static-server workspace escape and external binding.
- Requirements covered: R4, NFR1.
- Acceptance criteria covered: loopback-only host and canonical containment before start and per request.
- Depends on: U1.
- Files: `plugins/ai-agent-engine-codex/scripts/ae-tools/static-server.mjs`, `plugins/ai-agent-engine-codex/skills/ae-static-server/SKILL.md`, `.ae-source/skills/ae-static-server/SKILL.md`, `tests/ae-tools.test.mjs`.
- Forbidden files: `scripts/ae-tools.mjs`, external networking configuration, all unrelated skills.
- Approach: use real-path containment, explicit host allowlist, and per-request canonical file check; document local-only enforcement in both skill copies.
- Tests: static-server dry-run host/path fixtures including link escape.
- Validation: `node --test tests/ae-tools.test.mjs`, `node scripts/check-skill-mirror.mjs`.
- Rollback signals: a non-loopback URL or external canonical path can be returned/served.
- Deferred to implementation: platform-gated junction fixture mechanics.

### U3 - Serialize Evidence Ledger Appends

- Goal: make concurrent ledger updates complete and hash-chain ordered.
- Requirements covered: R5, NFR1.
- Acceptance criteria covered: one valid event per concurrent writer and bounded recovery on lock contention.
- Depends on: U2.
- Files: `plugins/ai-agent-engine-codex/scripts/ae-tools/evidence.mjs`, `tests/ae-tools.test.mjs`.
- Forbidden files: evidence artifact history, unrelated command modules, package dependencies.
- Approach: protect predecessor lookup and atomic ledger rewrite with exclusive lock, same-directory temporary write, fsync, rename, and `finally` cleanup.
- Tests: parallel local child-process writers plus ledger verification.
- Validation: `node --test tests/ae-tools.test.mjs`.
- Rollback signals: missing event, invalid JSONL, broken previous hash, or retained lock after normal failure.
- Deferred to implementation: stale-lock intervention remains an observable error, not automatic cleanup.

### U4 - Parse Quoted CSV And TSV Correctly

- Goal: preserve supported delimited text semantics and report malformed quoting precisely.
- Requirements covered: R6, NFR1.
- Acceptance criteria covered: quoted delimiter/quote/CRLF/multiline handling and location-bearing invalid input error.
- Depends on: U3.
- Files: `plugins/ai-agent-engine-codex/scripts/ae-tools/markitdown.mjs`, `tests/ae-tools.test.mjs`.
- Forbidden files: package dependencies, unrelated conversion commands.
- Approach: replace splitting with a bounded state machine while preserving current Markdown conversion and row limit.
- Tests: table-driven CSV and TSV fixtures plus malformed input case.
- Validation: `node --test tests/ae-tools.test.mjs`.
- Rollback signals: basic existing CSV fixture changes output, valid escaped quote fails, or row ceiling disappears.
- Deferred to implementation: unsupported delimiter dialects remain out of scope.

### U5 - Validate Review-Contract Selectors

- Goal: reject undefined review selectors before reviewer/evidence processing.
- Requirements covered: R7.
- Acceptance criteria covered: allowed selector compatibility and stable errors for invalid kind/mode/target.
- Depends on: U4.
- Files: `plugins/ai-agent-engine-codex/scripts/ae-tools/review.mjs`, `tests/ae-tools.test.mjs`.
- Forbidden files: review policy skills, external review runtimes, evidence history.
- Approach: add local constants and precondition validation matching existing documented selector vocabulary.
- Tests: table-driven selector success/failure assertions and no-evidence-on-invalid assertion.
- Validation: `node --test tests/ae-tools.test.mjs`.
- Rollback signals: unknown selector yields a contract or writes evidence.
- Deferred to implementation: changing documented selector vocabulary is out of scope.

### U6 - Synchronize Distribution And Record Completion Evidence

- Goal: ship the fixes as a consistent patch release and preserve workflow evidence.
- Requirements covered: NFR2, NFR3.
- Acceptance criteria covered: source/mirror consistency, matching manifests, release notes, and full local verification.
- Depends on: U1, U2, U3, U4, U5.
- Files: `package.json`, `plugins/ai-agent-engine-codex/.codex-plugin/plugin.json`, `README.md`, `README.en.md`, `CHANGELOG.md`, `CHANGELOG.en.md`, `docs/00-process/active/interface-safety-reliability/progress.md`, `docs/00-process/active/interface-safety-reliability/ledger.jsonl`, `docs/ae/reviews/2026-08-17-interface-safety-reliability-*.md`, `docs/ae/gates/*`.
- Forbidden files: lockfiles, user-owned document-encoding artifacts, global installer source.
- Approach: bump `0.3.30` to `0.3.31`, follow existing release-note window rules, execute validations, and record bounded evidence.
- Tests: package suites and contract checks.
- Validation: `npm.cmd test`, `npm.cmd run check`, `npm.cmd run check:smoke`, `npm.cmd run check:all`, `git diff --check`.
- Rollback signals: version mismatch, mirror mismatch, release-note failure, or any new scoped regression.
- Deferred to implementation: commit and publication remain user-controlled.

## Consistency Check

- implementationUnitCount: 6
- sourceRequirementsCovered: R1, R2, R3, R4, R5, R6, R7, NFR1, NFR2, NFR3
- sourceRequirementsDeferred: none
- openQuestionsCount: 0

## Validation Plan

- Unit: focused installer and ae-tools test files after each affected unit.
- Integration: install smoke, skill mirror, release note, artifact/design/memory contracts.
- User flow: isolated local installer smoke and static-server dry-run only; no browser request is needed or claimed.
- Data / operations: concurrent local ledger fixture and transaction recovery fixture.
- Observability: process ledger, document/code reviews, package command outputs, and final gate proof.

## Rollback / Recovery

Revert only task-owned source, tests, skills, metadata, release notes, and workflow evidence together. For a failed consumer install, restore the staged backup captured before mutation. No automatic recovery is claimed for an interrupted process beyond the explicit state/backup contract covered by tests.

## Plan Self-Review

- Placeholder scan: pass.
- Consistency check: pass.
- Scope check: pass; no global installer or network-serving expansion.
- Acceptance coverage: pass; every R/NFR maps to a unit and validation signal.
- Validation gaps: local tests cannot prove arbitrary consumer filesystem permissions, browser behavior, external networking, or deployment acceptance.
- Alternatives and ADR check: pass.
- High-risk pre-mortem check: pass.

## Handoff

Execute serially. Every behavior unit shares `tests/ae-tools.test.mjs` or distribution metadata, and the active policy does not authorize write subagents.
