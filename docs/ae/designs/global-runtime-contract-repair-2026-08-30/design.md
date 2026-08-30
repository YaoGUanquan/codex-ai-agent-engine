---
type: design
status: drafted
date: 2026-08-30
title: global-runtime-contract-repair
origin: docs/ae/prds/2026-08-30-global-runtime-contract-repair-prd.md
originFingerprint: 2026-08-30-global-runtime-contract-repair
format: human-readable-design
sharded: false
---

# Design: Global Runtime Contract Repair

## Source

- `docs/ae/prds/2026-08-30-global-runtime-contract-repair-prd.md`

## AI Parse Contract

- canonicalKind: design
- humanEquivalent: true
- stableIdsRequired: true
- noImplicitScope: true

## Split Manifest

- mode: unified
- root: docs/ae/designs/global-runtime-contract-repair-2026-08-30
- files:
  - design.md

## Overview

- Goal: make global help executable, separate project selection from repository-relative scan roots, add explicit design migration reporting, and refresh current-user distribution.
- Source requirements: R1-R6, NFR1-NFR2.
- Required dimensions: overview, architecture, api, security, test-cases, observability, non-functional
- Explicit omitted dimensions: database: explicitly-omitted - no durable schema change; ui-ux: explicitly-omitted - no visual or interaction surface.
- Cross-dimension dependencies: CLI syntax drives help, dispatcher routing, validation, and install smoke evidence.

## Existing Project Evidence (Conditional)

- mode: inspected

| Evidence category | Repository-relative inputs | Sanitized conclusion | Confidence |
| --- | --- | --- | --- |
| stack and commands | package.json, scripts/check-global-install-smoke.mjs | Node ESM with Node test and transactional install smoke | verified |
| structure and conventions | plugins/ai-agent-engine-codex/scripts/ae-tools.mjs, global-install.mjs | dispatcher owns command routing; installer owns user-level replacement and rollback | verified |
| reusable assets | checker scripts, global-install.mjs, tests/global-install.test.mjs | reuse existing scripts and installer; add thin routing only | verified |

## Implementation Constraints

- Repository paths: plugin scripts, source/mirror help catalog and affected skills, tests, release metadata, focused AE artifacts.
- Runtime/build commands: Node.js ESM, `npm test`, `npm run check`, `npm run check:smoke`.
- Environment variables: existing `AE_RUNTIME_ROOT` only.
- Dependency boundaries: no new package dependency; network only during the explicitly requested real update.
- Feature flags/configuration: `--compat` is explicit; strict remains default.
- Rollback constraints: global update must use the existing operation journal and installer rollback.

## Decisions

### ADR-001 - Route advertised maintenance commands through the dispatcher

- Decision: add thin dispatcher command adapters for checkers and global update; do not duplicate checker or installer behavior.
- Drivers: wrapper-free consumers, one executable help contract, existing transactional distribution.
- Alternatives: render installation-mode-specific wrapper help; restore project wrappers globally.
- Consequences: global smoke must execute every newly advertised command.
- Supersedes: none.

### ADR-002 - Separate project root from scan root

- Decision: remove the generic `--root` project-discovery bypass; `--project-root` selects project-aware commands and `--root` resolves inside them, while graph helpers retain their explicit generic scan mode.
- Drivers: deterministic nested-CWD behavior and path containment.
- Alternatives: command-specific overloaded `--root`; preserve implicit CWD bypass.
- Consequences: old test-only calls that used ignored `--root` as a project selector move to `--project-root`.
- Supersedes: none.

### ADR-003 - Compatibility is report-only

- Decision: `check-design-contract --compat` exits successfully with all strict diagnostics as warnings; default and `--strict` fail.
- Drivers: migration assessment without weakening gates.
- Alternatives: date heuristics; automatic document rewriting; relaxed default.
- Consequences: compatibility output cannot be cited as strict conformance.
- Supersedes: none.

## Mapping Tables

### api-field-to-database-column-mapping

| EP ID | API field | T ID | Data field | Notes |
| --- | --- | --- | --- | --- |
| EP-001 | project-root/root | T-001 | N/A | No persisted database; T-001 records the durable CLI contract. |

### api-error-to-ui-state-mapping

| EP ID | Error/status | ST ID | UI state | User-visible behavior |
| --- | --- | --- | --- | --- |
| EP-001 | invalid root or strict violation | ST-001 | terminal CLI result | Non-zero strict error or explicit compatibility warning result. |

### test-case-to-contract-coverage

| TC ID | Scenario | Covered IDs | Verification signal |
| --- | --- | --- | --- |
| TC-001 | dispatcher root and checker matrix | ADR-001, ADR-002, EP-001, T-001, ST-001 | focused Node tests pass |
| TC-002 | compatibility corpus | ADR-003, EP-001, T-001, ST-001 | strict fails and compat succeeds with equal diagnostics |
| TC-003 | current-user distribution | ADR-001, EP-001, T-001, ST-001 | install operation completes and fingerprints match |

### Test Coverage Matrix

| TC ID | Scenario | Design method | Covered IDs | Automatable verification signal |
| --- | --- | --- | --- | --- |
| TC-001 | absolute project root versus relative scan root | equivalence-class | ADR-001, ADR-002, EP-001 | expected project path and rejection codes |
| TC-002 | malformed partial consumer design | decision-table | ADR-003, EP-001 | strict exit 1; compat exit 0 with warning count |
| TC-003 | isolated and real global refresh | state-transition | ADR-001, T-001, ST-001 | preview/apply/completed plus matching versions/fingerprints |

### ui-component-to-api-endpoint-mapping

| Component/route | ST ID | EP ID | Data dependency |
| --- | --- | --- | --- |
| N/A - UI explicitly omitted | ST-001 | EP-001 | terminal output only |

## Architecture

The installed `bin/ae.mjs` loads the plugin dispatcher. The dispatcher strips `--project-root`, resolves the project once, and forwards repository-relative `--root` to memory/graph handlers. Thin command adapters execute existing checker scripts against that project. Global update clones a release and delegates replacement to the existing global installer.

## API

### EP-001 - Global CLI maintenance and root contract

- `check-ae-artifacts`, `check-design-contract`, and `check-memory-knowledge-contract` execute through `ae.mjs` with optional `--project-root`.
- `check-design-contract` accepts `--compat`; compatibility success means migration-report completion, not conformance.
- `update` accepts repository, branch, language, and explicit update options and delegates to transactional global install.
- `--root` must remain repository-relative; `--project-root` may select an absolute project.

## Database

### T-001 - Durable CLI contract

No database is introduced. The durable distributed values are the capability catalog, plugin version, installed manifest, and release notes.

## UI/UX

Explicitly omitted: the surface is terminal output and existing skill discovery only.

### ST-001 - Terminal command state

- success: command completed and prints structured output.
- compatible-with-warnings: migration report completed but strict violations remain.
- failed: invalid options, path escape, strict violation, clone, install, or rollback failure.

## Test Cases

### TC-001 - Root and dispatcher behavior

- Priority: P1
- Preconditions: marked temporary project and nested working directory.
- Steps: run maintenance and graph/memory commands with explicit/implicit project root and relative/absolute scan roots.
- Expected result: project selection is stable; absolute or escaping scan roots fail.
- Covered IDs: ADR-001, ADR-002, EP-001, T-001, ST-001.

### TC-002 - Design compatibility report

- Priority: P1
- Preconditions: partial consumer-style design fixture.
- Steps: run default, `--strict`, and `--compat` checks.
- Expected result: strict modes fail; compatibility succeeds and preserves every diagnostic as a warning.
- Covered IDs: ADR-003, EP-001, T-001, ST-001.

### TC-003 - Global Codex and Cursor refresh

- Priority: P1
- Preconditions: isolated home for automation; current-user home for explicitly requested operation.
- Steps: preview/apply release, inspect runtime/personal manifest and Cursor skill fingerprints.
- Expected result: operation completes transactionally and all installed copies match the release.
- Covered IDs: ADR-001, EP-001, T-001, ST-001.

## Security

- Preserve realpath containment, protected-root rejection, modified-content authorization, backup, journal, and rollback behavior.
- Do not log credentials or consumer document contents.

## Observability

- Checker output includes mode, checked count, and errors or warnings.
- Update output includes operation ID, phase, status, installed paths, and rollback failure when applicable.

## Non-Functional

- No new dependency.
- Existing strict behavior remains backward compatible.
- Global installation remains current-user scoped and atomic.

## Consistency Check

- requiredDimensionsCovered: true
- omittedDimensionsJustified: true
- stableIdsUnique: true
- mappingTablesComplete: true
- sourceScopePreserved: true
- reviewStatus: pending
