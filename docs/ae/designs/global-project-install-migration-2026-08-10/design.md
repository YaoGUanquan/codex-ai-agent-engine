---
type: design
status: completed
date: 2026-08-10
title: global-project-install-migration
origin: docs/ae/prds/2026-08-10-global-project-install-migration.md
originFingerprint: pending-plan-baseline
format: human-readable-design
sharded: false
---

# Design: Global Project Install Migration

## Source

- `docs/ae/prds/2026-08-10-global-project-install-migration.md`

## AI Parse Contract

- canonicalKind: design
- humanEquivalent: true
- stableIdsRequired: true
- noImplicitScope: true

## Split Manifest

- mode: unified
- root: docs/ae/designs/global-project-install-migration-2026-08-10
- files:
  - design.md

## Overview

- Goal: replace portable, verified project-local AE installations with one updatable user-level runtime and a Codex-visible personal plugin.
- Source requirements: R1-R7, NFR1-NFR3.
- Required dimensions: overview, architecture, security, observability, non-functional, test-cases.
- Explicit omitted dimensions: api: explicitly-omitted (no service endpoint); database: explicitly-omitted (no durable data model); ui-ux: explicitly-omitted (no browser UI).
- Cross-dimension dependencies: manifest classification determines cleanup; journals bind rollback and upgrade visibility.

## Existing Project Evidence (Conditional)

- mode: inspected

| Evidence category | Repository-relative inputs | Sanitized conclusion | Confidence |
| --- | --- | --- | --- |
| stack and commands | package.json, tests/skill-scripts.test.mjs | Node ESM with built-in test runner is established | verified |
| structure and conventions | plugins/ai-agent-engine-codex/scripts/global-install*.mjs | Existing preview/apply/journal/backup model should be extended | verified |
| reusable assets | global-install-contract.mjs | Canonical path, foreign-home, and fingerprint helpers are reusable | verified |

## Implementation Constraints

- Repository paths: preserve the current global-install script and contract ownership.
- Runtime/build commands: `npm.cmd test`, `npm.cmd run check`, global-install smoke fixtures.
- Environment variables: use only the current user's home resolution; never accept another user's home as a target.
- Dependency boundaries: Node standard library only.
- Feature flags/configuration: manifest is caller input but must pass root and component verification.
- Rollback constraints: write journal before every move or runtime replacement; retain backups until explicit purge.

## Decisions

### ADR-001 - Explicit portable manifest

- Decision: default migration takes a user-supplied manifest; examples may enumerate the current user's roots but are not authority.
- Drivers: R1, NFR1, predictable cleanup.
- Alternatives: fixed folder scan; rejected because it is machine-specific and risks accidental enrollment.
- Consequences: documentation must provide a manifest template and preview command.
- Supersedes: fixed parent-directory project-name inference.

### ADR-002 - Cataloged historical fingerprints

- Decision: preflight compares every removable component against current or trusted historical fingerprints.
- Drivers: R2, R3, R5.
- Alternatives: manifest-version-only authorization; rejected because it cannot detect changed content.
- Consequences: catalog generation and fixture coverage are release obligations.
- Supersedes: current-source-only ownership check.

### ADR-003 - Versioned global runtime replacement

- Decision: stage the new runtime beside the active runtime, verify it, then atomically promote it with rollback metadata.
- Drivers: R4, NFR2.
- Alternatives: reject any existing global runtime; rejected because it prevents normal upgrades.
- Consequences: recovery handles interrupted promotion before a later apply.
- Supersedes: empty-runtime-only safety check.

### ADR-004 - Publish through the personal marketplace

- Decision: keep the private dispatcher at `$HOME/.agents/ai-agent-engine-codex`, copy the distributable plugin to `$HOME/plugins/ai-agent-engine-codex`, maintain `$HOME/.agents/plugins/marketplace.json`, explicitly register its marketplace root with `codex plugin marketplace add`, then call `codex plugin add ai-agent-engine-codex@personal --json`.
- Drivers: R6, R7, NFR3, Codex plugin visibility.
- Alternatives: copy skills only; rejected because it does not appear in Codex plugin management. Write the Codex cache directly; rejected because the cache and client registration format are private implementation details.
- Consequences: a plugin-install failure is reported separately from file rollback because only the Codex CLI owns client registry state.

## Mapping Tables

### api-field-to-database-column-mapping

N/A: no API or database dimension.

### api-error-to-ui-state-mapping

N/A: no UI dimension.

### test-case-to-contract-coverage

| TC ID | Scenario | Covered IDs | Verification signal |
| --- | --- | --- | --- |
| TC-001 | Portable nonstandard project root | R1, ADR-001 | preview/apply fixture cleans only declared root |
| TC-002 | Historical verified component | R2, R3, ADR-002 | preflight reports historical verified and apply succeeds |
| TC-003 | Modified historical component | R5, ADR-002 | preflight aborts with no mutation |
| TC-004 | Prior global runtime update | R4, ADR-003 | post-apply runtime fingerprint equals new release |
| TC-005 | Personal marketplace publish | R6, R7, ADR-004 | runner command, source fingerprint, and marketplace preservation assertions |

### Test Coverage Matrix

| TC ID | Scenario | Design method | Covered IDs | Automatable verification signal |
| --- | --- | --- | --- |
| TC-001 | arbitrary root manifest | equivalence-class | R1, ADR-001 | only declared consumer components move |
| TC-002 | known old release | decision-table | R2, R3, ADR-002 | accepted historical fingerprints |
| TC-003 | unknown changed content | error-guessing | R5, ADR-002 | preflight rejects before journal mutation |
| TC-004 | active global runtime | state-transition | R4, ADR-003 | old to staged to active state is recoverable |
| TC-005 | personal plugin activation | state-transition | R6, R7, ADR-004 | CLI receives expected selector and `codex plugin list` sees it |

### ui-component-to-api-endpoint-mapping

N/A: no UI/API dimension.

## Architecture

The CLI loads a manifest, canonicalizes roots, classifies removable components against a release catalog, then creates an operation journal. Project cleanup, private dispatcher promotion, and personal plugin-source publication share one file transaction. Only after file activation does the installer invoke the Codex CLI to refresh the plugin registration. The active runtime is represented explicitly in operation metadata so recovery can restore it.

## API

Explicitly omitted: no network/API contract.

## Database

Explicitly omitted: operation journals are existing JSON files, not a database schema.

## UI/UX

Explicitly omitted: CLI JSON output is the user surface; no browser UI is introduced.

## Test Cases

### TC-001 - Manifest portability

- Priority: P1
- Preconditions: an arbitrary temporary root with a verified project-local fixture.
- Steps: run preview and apply with an explicit manifest.
- Expected result: only declared components move; docs and `AGENTS.md` hashes remain unchanged.
- Covered IDs: R1, R3, ADR-001

### TC-002 - Historical release acceptance

- Priority: P1
- Preconditions: fixture copied from cataloged historical release.
- Steps: preview then apply.
- Expected result: components classify historical verified and are backed up before removal.
- Covered IDs: R2, R3, ADR-002

### TC-003 - Modified legacy rejection

- Priority: P1
- Preconditions: one byte differs from the cataloged historical component.
- Steps: attempt apply.
- Expected result: preflight fails and no component or global runtime changes.
- Covered IDs: R5, ADR-002

### TC-004 - Global runtime upgrade and recovery

- Priority: P1
- Preconditions: prior valid global runtime.
- Steps: apply with a failure injected before promotion, recover, then apply normally.
- Expected result: recovery retains the prior runtime; normal apply activates the new verified runtime.
- Covered IDs: R4, ADR-003

### TC-005 - Personal marketplace publication

- Priority: P1
- Preconditions: an isolated user home and a marketplace containing an unrelated plugin entry.
- Steps: apply with an injected successful Codex runner, then inspect the plugin source, marketplace, and runner arguments.
- Expected result: the published plugin hash equals the source hash, the unrelated marketplace entry remains, and the runner receives marketplace registration followed by `ai-agent-engine-codex@personal` with JSON output requested.
- Covered IDs: R6, R7, NFR3, ADR-004

## Security

Path canonicalization, symlink rejection, foreign-home rejection, confirmation digests, and backup retention remain mandatory. No project component is trusted from a version string alone. The installer never writes Codex cache paths; it calls the supported CLI and records its redacted exit result.

## Observability

Preview classifies every candidate; journals record component classification, backup locations, old/new runtime fingerprints, transition phase, and recovery status.

## Non-Functional

The operation is local-only, uses no new dependencies, and must remain deterministic across Windows and Unix paths.

## Consistency Check

- requiredDimensionsCovered: overview, architecture, security, observability, non-functional, test-cases
- omittedDimensionsJustified: api, database, ui-ux
- stableIdsUnique: true
- mappingTablesComplete: true
- sourceScopePreserved: true
- reviewStatus: passed
