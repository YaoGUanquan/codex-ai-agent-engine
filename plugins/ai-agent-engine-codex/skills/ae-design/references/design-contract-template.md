# Design Contract Template

Filename pattern:

`docs/ae/designs/<topic>-YYYY-MM-DD/design.md`

Required structure:

```markdown
---
type: design
status: drafted
date: YYYY-MM-DD
title: <topic>
origin: <optional PRD or previous design path>
originFingerprint: <optional fingerprint>
format: human-readable-design
sharded: false
---

# Design: <topic>

## Source

## AI Parse Contract

- canonicalKind: design
- humanEquivalent: true
- stableIdsRequired: true
- noImplicitScope: true

## Split Manifest

- mode: unified | split
- root: docs/ae/designs/<topic>-YYYY-MM-DD
- files:
  - design.md
  - architecture.md
  - api.md
  - database.md
  - ui-ux.md
  - test-cases.md
  - security.md
  - observability.md
  - non-functional.md

## Overview

- Goal:
- Source requirements:
- Required dimensions:
- Explicit omitted dimensions:
- Cross-dimension dependencies:

## Implementation Constraints

- Repository paths:
- Runtime/build commands:
- Environment variables:
- Dependency boundaries:
- Feature flags/configuration:
- Rollback constraints:

## Decisions

### ADR-XXX - <decision title>

- Decision:
- Drivers:
- Alternatives:
- Consequences:
- Supersedes:

## Mapping Tables

### api-field-to-database-column-mapping

| EP ID | API field | T ID | Data field | Notes |
| --- | --- | --- | --- | --- |

### api-error-to-ui-state-mapping

| EP ID | Error/status | ST ID | UI state | User-visible behavior |
| --- | --- | --- | --- | --- |

### test-case-to-contract-coverage

| TC ID | Scenario | Covered IDs | Verification signal |
| --- | --- | --- | --- |

### ui-component-to-api-endpoint-mapping

| Component/route | ST ID | EP ID | Data dependency |
| --- | --- | --- | --- |

## Architecture

## API

## Database

## UI/UX

## Test Cases

### TC-XXX - <scenario>

- Priority:
- Preconditions:
- Steps:
- Expected result:
- Covered IDs:

## Security

## Observability

## Non-Functional

## Consistency Check

- requiredDimensionsCovered:
- omittedDimensionsJustified:
- stableIdsUnique:
- mappingTablesComplete:
- sourceScopePreserved:
- reviewStatus:
```

Rules:

- Use repository-relative paths.
- Keep stable IDs unchanged across design revisions; mark old IDs superseded instead of reusing them.
- If a dimension is omitted, list it in Overview with `explicitly-omitted` and the reason.
- If a dimension is split into a sibling file, keep the overview, implementation constraints, decisions, mapping tables, and consistency check in `design.md`.
