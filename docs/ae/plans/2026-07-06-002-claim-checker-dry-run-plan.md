---
type: plan
status: completed
date: 2026-07-06
title: claim-checker-dry-run
origin: docs/ae/prds/2026-07-06-002-claim-checker-dry-run-prd.md
originFingerprint: 2026-07-06-claim-checker-dry-run
depth: standard
format: human-readable-plan
sharded: false
---

# Plan: claim-checker-dry-run

## Source

- PRD: `docs/ae/prds/2026-07-06-002-claim-checker-dry-run-prd.md`
- Prior completed plan: `docs/ae/plans/2026-07-06-001-agent-skill-audit-optimization-plan.md`
- Integrity ledger entrypoint: `docs/ae/integrity/README.md`

## AI Parse Contract

- canonicalKind: plan
- humanEquivalent: true
- stableIdsRequired: true
- noImplicitScope: true

## Scope

Add the first manual-only automation for claim-integrity checks: a Node.js dry-run script, tests, and schema documentation. The script validates explicit claim blocks only and does not execute commands, infer claims from prose, or become part of the package-wide check command.

## Readiness

- Goal: make claim-integrity checks repeatable for explicit `ae-claim` blocks while preserving dry-run safety.
- Acceptance criteria:
  - Script emits stable JSON with the PRD output fields.
  - Schema errors include file and line evidence.
  - Path evidence is checked against repository-relative existing paths.
  - Command, assumption, and deferred evidence is surfaced as not automatically verified.
  - Regression tests cover valid, invalid, legacy/no-claim, and deferred/unverifiable cases.
  - Existing validation remains green.
- Non-goals:
  - No natural-language extraction.
  - No command execution.
  - No network calls.
  - No `npm run check` wiring.
  - No new skill or dependency.
- Affected areas:
  - `scripts/check-claims.mjs`
  - `tests/check-claims.test.mjs`
  - `docs/ae/integrity/README.md`
  - `docs/00-process/active/claim-checker-dry-run/progress.md`
- Validation surface:
  - targeted Node test for `check-claims`
  - full `npm test`
  - `npm run check`
  - `node scripts/check-claims.mjs --dry-run`
  - `git diff --check`
- Open questions:
  - none blocking.

## Assumptions

- First automation is worthwhile once the schema is explicit and fixtures prove the valid/invalid/deferred cases.
- A repository with zero production claim blocks should return `status: ok`, not fail.
- Command evidence cannot be verified safely in dry-run and must stay in `unverifiable`.

## Alternatives Considered

- Recommended: explicit fenced block parser using Node.js standard library.
- Alternative: YAML files under `docs/ae/integrity/`.
- Rejected because: colocated blocks keep evidence near the claim source and do not require a YAML parser dependency.
- Alternative: scan prose with regex heuristics.
- Rejected because: false positives would make the checker noisy before schema adoption.
- Alternative: add to `npm run check` immediately.
- Rejected because: the first pass should observe schema adoption before becoming a release gate.

## Decision Drivers

- Driver 1: deterministic output for future gate wiring.
- Driver 2: no external dependencies or command execution.
- Driver 3: low-friction manual adoption.

## Decisions

### ADR-1 - Explicit Claim Blocks

- Decision: parse fenced Markdown blocks opened by ```` ```ae-claim ````.
- Drivers: deterministic parsing, low false-positive rate, easy fixture coverage.
- Alternatives: prose scan; standalone YAML files.
- Why chosen: supports incremental adoption without changing existing documents.
- Consequences: existing prose claims are not checked until authors add claim blocks.
- Follow-ups: future plans may add adoption guidance to skills after real usage.

### ADR-2 - Dry-Run Evidence Classes

- Decision: validate `path` evidence immediately and classify `command`, `assumption`, and `deferred` evidence as not automatically verified.
- Drivers: dry-run safety, useful path checks, honest output.
- Alternatives: execute command evidence; treat assumptions as warnings only.
- Why chosen: command execution belongs in a later guarded design.
- Consequences: dry-run output may contain `unverifiable` entries even when the schema is valid.
- Follow-ups: command execution can be added only after guardrails and allowlists exist.

## Risks

- Risk: authors believe the checker validates all documentation claims.
  - Mitigation: README states that only explicit `ae-claim` blocks are checked.
- Risk: schema becomes too rigid before adoption.
  - Mitigation: keep required fields minimal and do not wire into package checks.
- Risk: invalid paths outside the repo are mishandled on Windows.
  - Mitigation: normalize paths with Node path APIs and reject absolute or parent traversal.

## Pre-Mortem

- Failure scenario 1: the script scans natural prose and produces noisy false positives.
- Failure scenario 2: dry-run silently treats command evidence as verified.
- Failure scenario 3: path validation allows `..` or absolute paths to escape the repository.
- Mitigations:
  - parse only fenced `ae-claim` blocks,
  - report command evidence in `unverifiable`,
  - reject absolute and parent-traversal paths before resolving.

## Global Constraints

- Use Node.js standard library only.
- Keep output JSON deterministic.
- Do not modify `package.json` scripts for this first pass.
- Do not execute command evidence.
- Do not add a new skill directory.

## Implementation Units

### U1 - Add Failing Checker Tests

- Goal: define the dry-run contract before implementation.
- Requirements covered: R1, R2, R3, R4, R5, R6.
- Acceptance criteria covered: valid, invalid, legacy/no-claim, and deferred/unverifiable fixtures.
- Depends on: none.
- Files:
  - `tests/check-claims.test.mjs`
- Forbidden files:
  - `scripts/check-claims.mjs`
- Approach:
  - Use temporary directories and fixture Markdown files.
  - Spawn `node scripts/check-claims.mjs --dry-run --target <tmp> --include <file>`.
  - Assert expected status, counts, errors, warnings, and unverifiable records.
- Tests:
  - `node --test tests/check-claims.test.mjs`
- Validation:
  - first run must fail because the script does not exist yet.
- Rollback signals:
  - tests require network, shell commands, or repository-global state.
- Deferred to implementation:
  - exact parser helper names.

### U2 - Implement Dry-Run Script

- Goal: make the U1 tests pass with the smallest deterministic parser.
- Requirements covered: R1, R2, R3, R4, R5, NFR1, NFR2.
- Acceptance criteria covered: JSON output, schema validation, path validation, dry-run unverifiable handling.
- Depends on: U1.
- Files:
  - `scripts/check-claims.mjs`
- Forbidden files:
  - `package.json`
  - lockfiles
- Approach:
  - Parse CLI flags: `--dry-run`, `--target`, and repeated `--include`.
  - Walk Markdown files when no include is provided.
  - Extract fenced `ae-claim` blocks, parse `key: value` lines, validate required fields and enum values.
  - Reject absolute paths, `..`, and missing path evidence.
  - Return stable JSON and exit non-zero only when `errors` is non-empty.
- Tests:
  - `node --test tests/check-claims.test.mjs`
- Validation:
  - `node scripts/check-claims.mjs --dry-run`
- Rollback signals:
  - script reports failures for the current repo with no explicit claim blocks.
- Deferred to implementation:
  - command execution and NLP extraction.

### U3 - Document Schema And Process Evidence

- Goal: make the claim block format discoverable and record the execution checkpoint.
- Requirements covered: R7.
- Acceptance criteria covered: README explains supported fields and dry-run limitations.
- Depends on: U2.
- Files:
  - `docs/ae/integrity/README.md`
  - `docs/00-process/active/claim-checker-dry-run/progress.md`
- Forbidden files:
  - `README.md`
  - `README.zh-CN.md`
- Approach:
  - Add a short `ae-claim` block contract to the integrity README.
  - Record commands and results in the process note.
- Tests:
  - `node scripts/check-ae-artifacts.mjs`
- Validation:
  - `git diff --check`
- Rollback signals:
  - README implies the checker validates prose or executes commands.
- Deferred to implementation:
  - public README links.

### U4 - Final Validation And Review

- Goal: prove the dry-run checker is safe and scoped.
- Requirements covered: R1, R6, R7, NFR1, NFR2.
- Acceptance criteria covered: focused and full validation pass; no package check wiring.
- Depends on: U1, U2, U3.
- Files:
  - no additional planned files.
- Forbidden files:
  - `package.json`
  - lockfiles
- Approach:
  - Run targeted test, script dry-run, AE artifact check, `npm test`, `npm run check`, and `git diff --check`.
  - Review changed files for scope drift.
  - Write final gate evidence.
- Tests:
  - `node --test tests/check-claims.test.mjs`
  - `npm test`
- Validation:
  - `node scripts/check-claims.mjs --dry-run`
  - `node scripts/check-ae-artifacts.mjs`
  - `npm run check`
  - `git diff --check`
- Rollback signals:
  - validation failure caused by this script or docs.
- Deferred to implementation:
  - adding `check-claims` to `npm run check`.

## Consistency Check

- implementationUnitCount: 4
- sourceRequirementsCovered: R1, R2, R3, R4, R5, R6, R7, NFR1, NFR2
- sourceRequirementsDeferred: none
- openQuestionsCount: 0

## Validation Plan

- Unit:
  - `node --test tests/check-claims.test.mjs`
- Integration:
  - `node scripts/check-claims.mjs --dry-run`
  - `node scripts/check-ae-artifacts.mjs`
- User flow:
  - manual run of the dry-run checker from the repository root.
- Data / operations:
  - no network, database, command evidence execution, dependency install, or lockfile change.
- Observability:
  - JSON output exposes checked counts, warnings, errors, and unverifiable claims.

## Rollback / Recovery

- Remove `scripts/check-claims.mjs`, `tests/check-claims.test.mjs`, the integrity README schema section, and the process note if the first schema proves wrong.
- Since the command is not wired into `npm run check`, rollback does not affect existing package checks.

## Plan Self-Review

- Placeholder scan: pass.
- Consistency check: pass.
- Scope check: pass; dry-run only.
- Acceptance coverage: pass.
- Validation gaps: command execution is intentionally deferred and represented as unverifiable.
- Alternatives and ADR check: pass.
- High-risk pre-mortem check: pass.

## Completion Record

- Completed: 2026-07-06.
- U1 result: added TDD coverage in `tests/check-claims.test.mjs` for valid path evidence, legacy/no-claim files, invalid schema/path evidence, and command/assumption/deferred unverifiable evidence.
- U2 result: added `scripts/check-claims.mjs` dry-run checker using Node.js standard library only.
- U3 result: documented the `ae-claim` schema in `docs/ae/integrity/README.md` and recorded process evidence in `docs/00-process/active/claim-checker-dry-run/progress.md`.
- U4 result: validation completed; command remains manual-only and is not wired into `package.json`.
- Deferred work: command evidence execution, natural-language extraction, and package/CI gating remain out of scope until the schema has real adoption.
