---
type: design
status: completed
date: 2026-09-03
title: persistence-contract-governance
origin: docs/ae/prds/2026-09-03-persistence-contract-governance-prd.md
originFingerprint: 2026-09-03-persistence-contract-governance
format: human-readable-design
sharded: false
---

# Design: Persistence Contract Governance

## Source

- `docs/ae/prds/2026-09-03-persistence-contract-governance-prd.md`

## AI Parse Contract

- canonicalKind: design
- humanEquivalent: true
- stableIdsRequired: true
- noImplicitScope: true

## Split Manifest

- mode: unified
- root: docs/ae/designs/persistence-contract-governance-2026-09-03
- files:
  - design.md

## Overview

- Goal: provide a shared, conditional persistence decision contract for database-affecting workflow work.
- Source requirements: R1-R6, NFR1.
- Required dimensions: overview, architecture, database, security, test-cases.
- Explicit omitted dimensions: api: explicitly-omitted because this change adds no target application endpoint; ui-ux: explicitly-omitted because it adds no user interface; observability: explicitly-omitted because no runtime service changes; non-functional: explicitly-omitted because NFR1 is covered by implementation constraints and validation.
- Cross-dimension dependencies: requirements capture decisions; backend and SQL use them; review checks them; distribution preserves them.

## Existing Project Evidence

- mode: inspected
- bypass reason: none

| Evidence category | Repository-relative inputs | Sanitized conclusion | Confidence |
| --- | --- | --- | --- |
| stack and commands | `package.json`, `scripts/check-skill-mirror.mjs`, `scripts/check-release-notes.mjs` | Node plugin has deterministic source/mirror and release checks. | verified |
| structure and conventions | `plugins/ai-agent-engine-codex/skills/ae-backend`, `skills/ae-sql`, `skills/ae-design`, `skills/ae-review` | Skill-local references are the reusable knowledge boundary. | verified |
| reusable assets | `skills/ae-backend/references/java-guidance.md`, `skills/ae-sql/references/sql-safety-checklist.md` | Existing guidance can be extended without a new runtime abstraction. | verified |

## Implementation Constraints

- Repository paths: plugin source, matching `.ae-source/skills`, tests, metadata, release notes, and workflow artifacts.
- Runtime/build commands: `npm test`, `npm run check`, `npm run check:smoke`, `git diff --check`.
- Dependency boundaries: no packages, ORM dependencies, DDL generation, or runtime hooks.
- Rollback constraints: revert only task-owned files; do not change application data.

## Decisions

### ADR-001 - One backend-owned shared persistence contract

- Decision: create `ae-backend/references/persistence-contract.md`; affected skills link to it only for durable-data work.
- Drivers: R2, R4, R5, NFR1.
- Alternatives: duplicated checklists or a new database skill.
- Consequences: one canonical source governs terminology and remains stack-aware.

### ADR-002 - Explicit no-default primary-key decision

- Decision: require the exact clarification question unless the user or repository already decides the key strategy.
- Drivers: R1, NFR1.
- Alternatives: default auto-increment, default UUID, or defer the choice.
- Consequences: a future implementation may pause for one user decision.

### ADR-003 - Conditional MyBatis-Plus entity governance

- Decision: retain the supplied annotations as a Java/MyBatis-Plus example for applicable mutable aggregates only.
- Drivers: R2-R4.
- Alternatives: universal base entity or no example.
- Consequences: non-applicable tables/stacks must state their rationale.

## Mapping Tables

### api-field-to-database-column-mapping

| EP ID | API field | T ID | Data field | Notes |
| --- | --- | --- | --- | --- |
| N/A | N/A | T-001 | decision fields | No target application API changes. |

### api-error-to-ui-state-mapping

| EP ID | Error/status | ST ID | UI state | User-visible behavior |
| --- | --- | --- | --- | --- |
| N/A | N/A | N/A | N/A | Workflow guidance only. |

### test-case-to-contract-coverage

| TC ID | Scenario | Covered IDs | Verification signal |
| --- | --- | --- | --- |
| TC-001 | Source/mirror contain the shared contract and consumer links. | ADR-001, R5, R6 | Assertions and mirror check pass. |
| TC-002 | Contract has no default key and conditional MyBatis-Plus policy. | ADR-002, ADR-003, R1-R4 | Assertions find the rules. |
| TC-003 | Metadata and bilingual notes describe the release. | R6 | Release checks pass. |

### ui-component-to-api-endpoint-mapping

| Component/route | ST ID | EP ID | Data dependency |
| --- | --- | --- | --- |
| N/A | N/A | N/A | Workflow guidance only. |

## Architecture

The backend reference is the knowledge-layer owner. Brainstorm/PRD/design capture decisions, backend/SQL apply them, review verifies them, and LFG requires the contract before implementation. Source/mirror and release assets are distribution consumers.

## API

Explicitly omitted: this change adds no target application API.

## Database

### T-001 - Persistence decision contract

- Durable structure: workflow reference, not an application table.
- Required decisions: lifecycle, primary key, external ID exposure, audit ownership, deletion, concurrency, enum codes, exception translation, migration/rollback, indexes/constraints.
- `@TableLogic` does not replace unique-index, restore, foreign-key, or query-filter decisions; optimistic locking requires a client-visible conflict mapping.

## Security

- Audit actors come from the authenticated principal or documented system actor, never client input.
- Error translation does not leak SQL, ORM, stack trace, or entity internals.
- Identifier exposure/enumeration risk is assessed with the primary-key choice.

## Test Cases

### TC-001 - Cross-skill contract reference

- Priority: high
- Preconditions: source and mirror present.
- Steps: inspect links and run mirror/document checks.
- Expected result: all owners link to the canonical conditional contract and mirror parity remains intact.
- Covered IDs: ADR-001, R5, R6.

### TC-002 - Conditional table governance

- Priority: high
- Preconditions: shared reference present.
- Steps: inspect key, lifecycle, MyBatis-Plus, enum, and error sections.
- Expected result: no default key, no universal annotations, and explicit enum/error boundaries.
- Covered IDs: ADR-002, ADR-003, R1-R4, NFR1.

### TC-003 - Distribution release consistency

- Priority: medium
- Preconditions: metadata and bilingual release notes are updated.
- Steps: run release-note and install-smoke checks.
- Expected result: package/manifest versions and distributed skill content agree.
- Covered IDs: R6.

## UI/UX

Explicitly omitted: this change adds no user interface.

## Observability

Explicitly omitted: workflow documentation has no runtime service behavior.

## Non-Functional

Explicitly omitted: NFR1 is governed through implementation constraints and validation, with no separate runtime performance or operations contract.

## Consistency Check

- requiredDimensionsCovered: overview, architecture, database, security, test-cases
- omittedDimensionsJustified: api and ui-ux are not triggered
- stableIdsUnique: yes
- mappingTablesComplete: yes
- sourceScopePreserved: yes
- reviewStatus: approved
