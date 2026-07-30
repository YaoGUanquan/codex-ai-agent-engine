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

## Existing Project Evidence (Conditional)

When the design uses repository context, record the smallest evidence set that affects the design. For a greenfield or no-context request, use `mode: bypassed` and state the user-requested reason.

- mode: inspected | bypassed
- bypass reason:

| Evidence category | Repository-relative inputs | Sanitized conclusion | Confidence |
| --- | --- | --- | --- |
| stack and commands | <manifest/config paths> | <established stack or command> | verified \| inferred \| assumed |
| structure and conventions | <relevant source/test paths> | <module or coding convention> | verified \| inferred \| assumed |
| reusable assets | <component/helper/contract paths> | <reuse decision or non-reuse reason> | verified \| inferred \| assumed |

Do not record secrets, credentials, private keys, local authentication values, or absolute paths. This section is not a repository inventory; list only evidence that constrains the design and keep unknown facts explicit.

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

### Test Coverage Matrix

| TC ID | Scenario | Design method | Covered IDs | Automatable verification signal |
| --- | --- | --- | --- | --- |
| TC-XXX | <risk-relevant scenario> | equivalence-class \| boundary-value \| decision-table \| state-transition \| error-guessing | <ADR/EP/T/ST IDs> | <assertable response, state, record, or event> |

Use equivalence classes and boundary values for constrained inputs; decision tables for multi-condition business rules; state transitions for declared state machines; and error guessing for residual failure risks. Cover API errors, database constraints, authorization decisions, and UI interactions only when their triggering structure exists. Record `N/A when the related dimension is explicitly omitted`, with its reason. Do not require fixed scenario counts or claim that this template measures executed coverage.

### Test-Case Quality Rules

- Every `TC-XXX` must reference the requirement or contract IDs it proves and define an observable expected result.
- Do not use `succeeds`, `works`, or implementation details as the only expected assertion.
- Merge semantically duplicate cases; a changed fixture value alone is not a distinct test intent.
- Keep distinct cases only for different risks, boundaries, failure behavior, or covered contract elements.
- These rules are qualitative. Do not require fixed scenario counts, measured coverage, or a test category whose trigger is absent.

### ui-component-to-api-endpoint-mapping

| Component/route | ST ID | EP ID | Data dependency |
| --- | --- | --- | --- |

## Architecture

## API

### EP-XXX - <endpoint or API contract>

## Database

### T-XXX - <table or durable data structure>

## UI/UX

### ST-XXX - <UI state machine or state>

## Test Cases

### TC-XXX - <scenario>

- Priority:
- Preconditions:
- Steps:
- Expected result: <observable response, state, record, or event>
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
- Declare every stable ID referenced by a mapping table with a canonical `### ADR|EP|T|TC|ST-XXX` heading in `design.md` or a Markdown shard listed in the Split Manifest. A mapping-table cell is a reference, not a declaration.
- If a dimension is omitted, list it in Overview with `explicitly-omitted` and the reason.
- If a dimension is split into a sibling file, keep the overview, implementation constraints, decisions, mapping tables, and consistency check in `design.md`.
- Every Split Manifest file must be an existing Markdown file inside the current design directory. Use either a sibling filename or its repository-relative path.
