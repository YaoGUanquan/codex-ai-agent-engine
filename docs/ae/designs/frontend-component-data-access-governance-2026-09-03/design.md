---
type: design
status: completed
date: 2026-09-03
title: frontend-component-data-access-governance
origin: docs/ae/prds/2026-09-03-frontend-component-data-access-governance-prd.md
originFingerprint: 2026-09-03-frontend-component-data-access-governance
format: human-readable-design
sharded: false
---

# Design: Frontend Component And Data-Access Governance

## Source

- `docs/ae/prds/2026-09-03-frontend-component-data-access-governance-prd.md`

## AI Parse Contract

- canonicalKind: design
- humanEquivalent: true
- stableIdsRequired: true
- noImplicitScope: true

## Split Manifest

- mode: unified
- root: docs/ae/designs/frontend-component-data-access-governance-2026-09-03
- files:
  - design.md

## Overview

- Goal: make target-project component and API-access reuse explicit, reviewable, and consistent across frontend workflow stages.
- Source requirements: R1-R8, NFR1-NFR2.
- Required dimensions: overview, architecture, ui-ux, api, security, test-cases.
- Explicit omitted dimensions: database: explicitly-omitted because this plugin change adds no durable application data; observability: explicitly-omitted because it adds no runtime service; non-functional: explicitly-omitted because NFR1-NFR2 are enforced through the shared contract and validation.
- Cross-dimension dependencies: UI component selection depends on API state/error semantics; implementation and review consume the same contract; plugin source/mirror distribute it.

## Existing Project Evidence

- mode: inspected
- bypass reason: none

| Evidence category | Repository-relative inputs | Sanitized conclusion | Confidence |
| --- | --- | --- | --- |
| stack and commands | `package.json`, `scripts/check-skill-mirror.mjs`, `scripts/check-release-notes.mjs` | Node plugin has deterministic mirror, artifact, release, and install-smoke checks. | verified |
| structure and conventions | `skills/ae-frontend-design`, `skills/ae-web-app`, `skills/ae-web-forge`, `skills/ae-review` | Existing owners separate visual design, app/API implementation, routing, and review. | verified |
| reusable assets | `ae-frontend-design/references/ui-direction-contract.md`, `web-ui-quality.md`, `ae-backend/references/api-contract-checklist.md` | Existing references contain adjacent policy but no reusable-component/data-access ownership contract. | verified |

## Implementation Constraints

- Repository paths: plugin source, matching `.ae-source/skills`, tests, metadata, release notes, and workflow evidence.
- Runtime/build commands: focused Node test, `npm test`, `npm run check`, `npm run check:smoke`, `git diff --check`.
- Dependency boundaries: no UI runtime, HTTP dependency, component generator, target-project code, or automatic extraction.
- Rollback constraints: revert source/mirror consumers and the shared reference together; no target data recovery is required.

## Decisions

### ADR-001 - One frontend-owned component and data-access reference

- Decision: add `ae-frontend-design/references/component-data-access-contract.md`; frontend, web-app, web-forge, design, review, and LFG link to it only when component or API-access work is in scope.
- Drivers: R1, R2, R6, R8, NFR1.
- Alternatives: duplicate the policy in each skill; create a cross-framework runtime component package.
- Consequences: shared vocabulary prevents drift without imposing framework code.

### ADR-002 - Semantic reuse ladder, not a universal component

- Decision: define tokens/primitives, shared semantic components, feature components, and route composition; require extraction review before a third independent semantic duplicate.
- Drivers: R2-R5, R7, NFR2.
- Alternatives: force extraction on every second use; permit unlimited route-local copies.
- Consequences: target projects retain domain-specific behavior while repeated stable interaction shells are visible to reviewers.

### ADR-003 - Layered API ownership

- Decision: require existing transport-client, domain-service/query/mutation, and rendering boundaries to remain separate.
- Drivers: R1, R6, NFR2.
- Alternatives: raw requests in components; prescribe one data-fetching library.
- Consequences: auth, envelopes, transforms, paging, cancellation, retry, and error normalization have one local owner without a mandated library.

## Mapping Tables

### api-field-to-database-column-mapping

| EP ID | API field | T ID | Data field | Notes |
| --- | --- | --- | --- | --- |
| N/A | N/A | N/A | N/A | No target application API or data schema changes. |

### api-error-to-ui-state-mapping

| EP ID | Error/status | ST ID | UI state | User-visible behavior |
| --- | --- | --- | --- | --- |
| EP-001 | normalized request failure | ST-003 | request error | Route/feature displays the established retry or field-error state without duplicating transport parsing. |

### test-case-to-contract-coverage

| TC ID | Scenario | Covered IDs | Verification signal |
| --- | --- | --- | --- |
| TC-001 | Consumers route UI/API work to the shared reference. | ADR-001, R1, R6, R8 | Source/mirror assertion finds links and exact parity. |
| TC-002 | Shared contract carries component and API ownership boundaries. | ADR-002, ADR-003, R2-R7 | Focused assertion finds ladder, patterns, extraction rule, and no-raw-request policy. |
| TC-003 | Release artifacts distribute the guidance. | R8, NFR1 | Version, notes, contract and install-smoke checks pass. |

### Test Coverage Matrix

| TC ID | Scenario | Design method | Covered IDs | Automatable verification signal |
| --- | --- | --- | --- | --- |
| TC-001 | UI/API work chooses an existing owner before a new abstraction. | decision-table | ADR-001, R1, R6, R8 | Source/mirror test asserts all consumer links. |
| TC-002 | Shared dialog/list/form/API rules retain their layer boundaries. | state-transition | ADR-002, ADR-003, R2-R7 | Contract test finds required state/ownership rules. |
| TC-003 | Distribution does not ship stale guidance. | error-guessing | R8, NFR1 | Mirror, release-note, package, and smoke checks pass. |

### ui-component-to-api-endpoint-mapping

| Component/route | ST ID | EP ID | Data dependency |
| --- | --- | --- | --- |
| Shared dialog/drawer | ST-001 | EP-001 | Feature-provided mutation state through existing service/query owner. |
| Shared list/table | ST-002 | EP-001 | Feature-provided paging/filter/query state through existing service/query owner. |
| Feature form | ST-003 | EP-001 | Feature-provided validation and mutation result through existing service/query owner. |

## Architecture

The shared frontend reference owns reusable component and data-access decisions. `ae-frontend-design` uses it for focused UI work; `ae-web-app` uses it for API/state work; `ae-web-forge` routes Q2/Q3 work to it; `ae-design` records reuse decisions; `ae-review` checks duplication and boundary violations; and `ae-lfg` requires it for applicable S4 delivery. Framework-specific guidance remains framework-local and only points back to established repository conventions.

## API

### EP-001 - Target-repository frontend request boundary

- No application endpoint is added or modified.
- The contract requires transport, domain service/query/mutation, and rendering layers to preserve the target repository's request, auth, error-envelope, field-transform, paging, cancellation, retry, and error-normalization ownership.

## Database

Explicitly omitted: no durable application data changes.

## UI/UX

### UI Direction Contract

- Surface, audience, and primary job: AE workflow guidance for implementers and reviewers of operational/product UI.
- Existing baseline, supplied design/assets, and preserve/replace boundary: target repository components, tokens, and API client remain authoritative; no forced redesign or package replacement.
- Hierarchy and typography: shared component skeletons preserve local hierarchy; feature content owns domain wording and layout needs.
- Palette and contrast constraints: use existing semantic tokens and accessibility baseline; no component-local palette system.
- Spacing/density and expressiveness: inherit project tokens and surface intent; list/table density is explicit rather than copied route-by-route.
- Motion purpose or `none`: none; existing motion guidance remains conditional.
- Responsive intent and content priorities: dialogs/drawers, forms, and data grids record their repository-specific reflow/degradation behavior.
- Avoid list: global AE UI runtime, default library, raw component HTTP calls, duplicated error parsing, universal domain forms, and style copies without a reuse decision.
- Confidence/evidence: verified by existing frontend and API guidance; target-project component names remain inferred from repository inspection.
- Runnable-spec evidence: absent; no UI runtime is introduced.

### ST-001 - Dialog Or Drawer Interaction State

- The existing selected component owns title/action regions, open/close lifecycle, focus/keyboard behavior, responsive sizing, pending/disabled submission, validation/error presentation, destructive-close confirmation where needed, and cleanup.

### ST-002 - List Or Table Data State

- The selected component/helper owns row identity, query/filter/sort, pagination/cursor, loading, empty, error, retry, row/batch actions, density, and responsive degradation; the route supplies feature-specific configuration and permissions.

### ST-003 - Form And Request State

- Reusable fields/layout present accessible labels, validation, disabled/pending state, reset/cancel, duplicate-submission prevention, and server-error mapping. The feature owns domain validation and service/query/mutation invocation; normalized outcomes become success, field-error, or retryable-error state.

## Test Cases

### TC-001 - Cross-skill component/data-access routing

- Priority: high
- Preconditions: plugin source and mirror are present.
- Steps: inspect shared-reference links and run focused assertions.
- Expected result: all designated skills route applicable work to the same reference and mirrors are byte-equivalent.
- Covered IDs: ADR-001, R1, R6, R8.

### TC-002 - Semantic component and API ownership rules

- Priority: high
- Preconditions: shared reference exists.
- Steps: inspect ladder, dialog/drawer, list/table, form, request, and extraction sections.
- Expected result: a generic component does not absorb domain behavior and rendering components do not add ad-hoc requests when a repository owner exists.
- Covered IDs: ADR-002, ADR-003, R2-R7, NFR2.

### TC-003 - Distribution consistency

- Priority: medium
- Preconditions: metadata and bilingual notes are updated.
- Steps: run release and install-smoke checks.
- Expected result: distributed package contains the source/mirror guidance at the synchronized version.
- Covered IDs: R8, NFR1.

## Security

- Components do not own credentials, authorization policy, or client-supplied trust decisions.
- API wrappers preserve repository auth transport and prevent duplicate, inconsistent error parsing that could hide authorization failures.
- Shared components receive only the minimum display/action inputs; feature code remains responsible for permission-gated actions.

## Observability

Explicitly omitted: no runtime service or telemetry behavior changes.

## Non-Functional

Explicitly omitted: NFR1-NFR2 are bounded by the architecture, shared reference, review, and validation rules above.

## Consistency Check

- requiredDimensionsCovered: overview, architecture, ui-ux, api, security, test-cases
- omittedDimensionsJustified: database, observability, and non-functional have no separate triggered runtime surface
- stableIdsUnique: yes
- mappingTablesComplete: yes
- sourceScopePreserved: yes
- reviewStatus: approved
