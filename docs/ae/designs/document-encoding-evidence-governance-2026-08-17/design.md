---
type: design
status: drafted
date: 2026-08-17
title: document-encoding-evidence-governance
origin: docs/ae/prds/2026-08-17-document-encoding-evidence-governance-prd.md
originFingerprint: 2026-08-17-document-encoding-evidence-governance
format: human-readable-design
sharded: false
---

# Design: document-encoding-evidence-governance

## Source

- `docs/ae/prds/2026-08-17-document-encoding-evidence-governance-prd.md`

## AI Parse Contract

- canonicalKind: design
- humanEquivalent: true
- stableIdsRequired: true
- noImplicitScope: true

## Split Manifest

- mode: unified
- root: docs/ae/designs/document-encoding-evidence-governance-2026-08-17
- files:
  - design.md

## Overview

- Goal: preserve UTF-8 byte evidence without changing runtime behavior or rewriting validated rule/business document content.
- Source requirements: R1, R2, R3, NFR1, NFR2.
- Required dimensions: overview, architecture, test-cases, non-functional.
- Explicit omitted dimensions: api: explicitly-omitted (no API); database: explicitly-omitted (no schema); ui-ux: explicitly-omitted (no UI); security: explicitly-omitted (no trust boundary); observability: explicitly-omitted (no service).
- Cross-dimension dependencies: `TC-001` proves `ADR-001`; registry edges make the evidence queryable.

## Existing Project Evidence

- mode: inspected
- bypass reason: none

| Evidence category | Repository-relative inputs | Sanitized conclusion | Confidence |
| --- | --- | --- | --- |
| stack and commands | `package.json`, `scripts/check-memory-knowledge-contract.mjs` | Node validation and registry checking are established. | verified |
| conventions | `docs/00-process/templates/encoding-rules.md`, `docs/ae/graphs/README.md` | Encoding rules and declared graph metadata already have canonical homes. | verified |
| reuse | `docs/08-ai-memory/00-index.md` | Extend existing memory index and registry; create no second graph store. | verified |

## Implementation Constraints

- Repository paths: documentation below `docs/ae/` and `docs/08-ai-memory/` only.
- Runtime/build commands: strict Node decode; memory registry checker.
- Environment variables: none.
- Dependency boundaries: no package, plugin, CI, or runtime changes.
- Feature flags/configuration: none.
- Rollback constraints: remove only added artifacts and edges; never rewrite source documents.

## Decisions

### ADR-001 - Store bounded byte evidence instead of rewriting documents

- Decision: retain the strict UTF-8 snapshot as durable documentation.
- Drivers: R1, R2, NFR1.
- Alternatives: bulk rewrite; chat-only note; immediate CI gate.
- Consequences: content preservation is explicit; continuous enforcement is deferred.
- Supersedes: none.

### ADR-002 - Reuse the declared memory graph

- Decision: link one canonical memory record to PRD, design, plan and curated graph.
- Drivers: R3 and existing read-only graph boundary.
- Alternatives: generated `graph.json`; unregistered links.
- Consequences: Markdown remains the source of truth.
- Supersedes: none.

## Mapping Tables

### api-field-to-database-column-mapping

N/A: API and database dimensions are explicitly omitted.

### api-error-to-ui-state-mapping

N/A: API and UI/UX dimensions are explicitly omitted.

### test-case-to-contract-coverage

| TC ID | Scenario | Covered IDs | Verification signal |
| --- | --- | --- | --- |
| TC-001 | Strictly decode declared `docs/` text files and check `U+FFFD`. | R1, NFR1, ADR-001 | 516 scanned, 0 failures, 0 replacement files. |
| TC-002 | Validate declared memory relations. | R3, ADR-002 | Registry checker returns `status: ok`. |

### Test Coverage Matrix

| TC ID | Scenario | Design method | Covered IDs | Automatable verification signal |
| --- | --- | --- | --- |
| TC-001 | UTF-8 and replacement-character check. | error-guessing | R1, NFR1, ADR-001 | Fatal decoding and explicit search return zero failures. |
| TC-002 | Registry target and relation validation. | equivalence-class | R3, ADR-002 | Checker returns `status: ok`. |

### Test-Case Quality Rules

- Each case asserts an observable count or contract result, not a vague success.

### ui-component-to-api-endpoint-mapping

N/A: UI/UX and API dimensions are explicitly omitted.

## Architecture

Strict decoder evidence -> PRD/design/plan -> canonical memory -> registry relations -> curated maintainer graph. The registry is metadata; Markdown remains authoritative.

## API

Explicitly omitted: no API change.

## Database

Explicitly omitted: no application data or schema change.

## UI/UX

Explicitly omitted: no UI change.

## Test Cases

### TC-001 - Strict document decoding evidence

- Priority: high
- Preconditions: repository checkout with `docs/`.
- Steps: enumerate declared extensions, fatal-decode each file, search decoded text for `U+FFFD`.
- Expected result: all 516 files decode and no replacement character is present.
- Covered IDs: R1, NFR1, ADR-001.

### TC-002 - Declared memory relation validation

- Priority: medium
- Preconditions: memory record and registry entries exist.
- Steps: run `node scripts/check-memory-knowledge-contract.mjs --root .`.
- Expected result: checker returns success for existing declared `docs/ae/**` targets.
- Covered IDs: R3, ADR-002.

## Security

Explicitly omitted: no credentials, authorization, or new trust boundary; evidence remains sanitized.

## Observability

Explicitly omitted: command counts are dated evidence, not telemetry.

## Non-Functional

- Use fatal UTF-8 decoding, then a separate replacement-character check.
- Write new artifacts as UTF-8 without BOM; do not rewrite validated files because of console rendering.

## Consistency Check

- requiredDimensionsCovered: overview, architecture, test-cases, non-functional
- omittedDimensionsJustified: api, database, ui-ux, security, observability are explicitly-omitted
- stableIdsUnique: ADR-001, ADR-002, TC-001, TC-002 are declared once
- mappingTablesComplete: required tables are present and non-triggered dimensions are N/A
- sourceScopePreserved: R1-R3 and NFR1-NFR2 introduce no runtime behavior
- reviewStatus: self-reviewed; external document review not yet requested
