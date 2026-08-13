---
type: design
status: review-passed
date: 2026-08-13
title: api-smoke-execution-reliability
origin: docs/ae/prds/2026-08-13-api-smoke-execution-reliability-prd.md
originFingerprint: 2026-08-13-api-smoke-execution-reliability
format: human-readable-design
sharded: false
---

# Design: API Smoke Execution Reliability

## Source

`docs/ae/prds/2026-08-13-api-smoke-execution-reliability-prd.md`

## AI Parse Contract

- canonicalKind: design
- humanEquivalent: true
- stableIdsRequired: true
- noImplicitScope: true

## Split Manifest

- mode: unified
- root: docs/ae/designs/api-smoke-execution-reliability-2026-08-13
- files:
  - design.md

## Overview

- Goal: resolve a complete source-backed request context and deterministic, prevalidated API smoke execution carrier, then classify failures without exposing sensitive values or improvising after restart.
- Source requirements: R1-R12, NFR1-NFR4.
- Required dimensions: overview, architecture, api, security, test-cases.
- Explicit omitted dimensions: database: explicitly-omitted because no persisted schema changes; ui-ux: explicitly-omitted because no browser flow changes; observability: explicitly-omitted because sanitized verification records are the existing evidence surface; non-functional: included.
- Cross-dimension dependencies: request-context resolution controls carrier eligibility, credential and scope propagation, dynamic value production, operation classification, runtime execution, failure recovery, and evidence recording.

## Existing Project Evidence

- mode: inspected

| Evidence category | Repository-relative inputs | Sanitized conclusion | Confidence |
| --- | --- | --- | --- |
| stack and commands | `package.json`, `tests/skills-docs.test.mjs` | Node test runner and repository contract checks are established validation surfaces. | verified |
| structure and conventions | `plugins/ai-agent-engine-codex/skills/ae-test-api/SKILL.md`, `plugins/ai-agent-engine-codex/skills/ae-work/references/local-runtime-smoke-gate.md` | `ae-work` owns live-call safety and `ae-test-api` owns endpoint verification records. | verified |
| reusable assets | `plugins/ai-agent-engine-codex/skills/ae-work/references/request-config-template.md` | Retain the curl template but narrow it to bounded single-request fallback. | verified |

## Implementation Constraints

- Repository paths: update plugin source and `.ae-source/skills` mirror together; add behavior assertions under `tests/`.
- Runtime/build commands: Node-based contract tests and existing package checks.
- Environment variables: no new plugin variable; a credential variable is eligible only if already visible to the executing process.
- Request context: authoritative sources and provider ownership must be resolved without retaining concrete secret, scope, identifier, revision, signature, timestamp, nonce, cookie, or body values in plugin artifacts.
- Dependency boundaries: no new HTTP, secret-management, or service-control dependency.
- Feature flags/configuration: none.
- Rollback constraints: skill and mirror text can be reverted together; no target data or schema migration is involved.

## Decisions

### ADR-001 - Resolve the execution carrier before runtime

- Decision: use ordered resolution: authoritative project runner, then validated single-request curl config, otherwise blocked.
- Drivers: deterministic behavior, target-specific assertions, minimal dependencies.
- Alternatives: curl-first for every endpoint; plugin-owned universal HTTP runner.
- Consequences: target implementation work must prepare a runner for multi-step writes; generic GET smoke remains lightweight.
- Supersedes: the implicit curl-first behavior of the current request-template guidance.

### ADR-002 - Separate carrier validity from credential validity

- Decision: validate token-free runner/template shape before handoff; at runtime classify client parse, transport, auth, and business failures separately.
- Drivers: avoid attributing 401 to quoting and avoid unnecessary carrier changes.
- Alternatives: treat all non-2xx outcomes as one blocked class.
- Consequences: records gain a sanitized failure category and recovery action.
- Supersedes: none.

### ADR-003 - Keep secrets process-local and opaque

- Decision: pass a populated file only by absolute client option; accept an environment variable only when visible to the same executing process.
- Drivers: credential confidentiality and Windows process isolation.
- Alternatives: ask the user to export into an arbitrary shell; read and relay a token.
- Consequences: some sessions remain blocked until a file reference is populated, but no false readiness is reported.
- Supersedes: ambiguous environment-variable handoff guidance in the current gate.

### ADR-004 - Resolve request context before carrier selection

- Decision: create a smoke-specific request-context manifest that references authoritative API, auth, gateway, filter, interceptor, DTO, and validated-runner sources.
- Drivers: required headers and validation inputs can live outside the endpoint DTO; silent omission produces misleading 4xx results.
- Alternatives: infer required context from one captured request; duplicate the full API contract in the manifest.
- Consequences: preparation can fail before runtime with a precise missing-context category; the manifest owns providers and redaction rules but not target field semantics.
- Supersedes: route-and-token-only preparation in the current gate.

### ADR-005 - Model input provenance and lifetime

- Decision: classify each input as static non-secret fixture, user-controlled opaque secret, environment-specific non-secret context, runtime-derived, or prior-response-derived.
- Drivers: revisions, ETags, signatures, timestamps, nonces, CSRF values, and resource identifiers cannot be safely hardcoded or treated like ordinary fixture fields.
- Alternatives: place all inputs in one populated curl config; ask the user to fill every value manually.
- Consequences: multi-step or freshness-sensitive inputs force a project runner; durable evidence records classifications and assertions only.
- Supersedes: none.

## Mapping Tables

### api-field-to-database-column-mapping

| EP ID | API field | T ID | Data field | Notes |
| --- | --- | --- | --- | --- |
| EP-001 | carrier candidate metadata | N/A | N/A | No database dimension; values are ephemeral workflow inputs. |
| EP-002 | sanitized outcome | N/A | N/A | Stored only in the existing Markdown verification record. |
| EP-003 | request-context manifest | N/A | N/A | References authoritative sources and providers; stores no live request values. |

### api-error-to-ui-state-mapping

| EP ID | Error/status | ST ID | UI state | User-visible behavior |
| --- | --- | --- | --- | --- |
| EP-002 | client-config | N/A | N/A | Report invalid runner/template and its token-free reproduction; no UI exists. |
| EP-002 | transport | N/A | N/A | Report runtime endpoint unavailable; retain carrier. |
| EP-002 | auth | N/A | N/A | Request renewal of the same secret reference; retain carrier. |
| EP-002 | business | N/A | N/A | Route to API debugging with sanitized contract evidence. |
| EP-003 | context-missing or contradictory | N/A | N/A | Stop before live execution and report the missing location/category and authoritative source needed. |

### test-case-to-contract-coverage

| TC ID | Scenario | Covered IDs | Verification signal |
| --- | --- | --- | --- |
| TC-001 | matching project runner exists | ADR-001, EP-001, R1 | selection result is project runner and no curl template is created |
| TC-002 | multi-step write has no runner | ADR-001, EP-001, R2, R3 | live execution is blocked before credential handoff |
| TC-003 | bounded GET has no runner | ADR-001, EP-001, R3 | validated curl fallback is selected |
| TC-004 | credential variable is in another shell | ADR-003, EP-001, R4 | readiness is rejected; file handoff or blocked state is returned |
| TC-005 | runtime returns five failure classes | ADR-002, EP-002, R5, R6 | each signal maps to one recovery action without carrier drift |
| TC-006 | required scope and content headers | ADR-004, EP-003, R8-R11 | every applicable header has a source, provider, structural validation, and redaction rule |
| TC-007 | revision/signature/nonce lifecycle | ADR-005, EP-003, R12 | dynamic values are acquired/generated at point of use and absent from reusable templates/evidence |
| TC-008 | path/query/body contradiction | ADR-004, EP-003, R11 | preparation rejects locally decidable contradictions before client execution |

### Test Coverage Matrix

| TC ID | Scenario | Design method | Covered IDs | Automatable verification signal |
| --- | --- | --- | --- | --- |
| TC-001 | authoritative runner precedence | decision-table | ADR-001, EP-001 | selected carrier kind and source path |
| TC-002 | unsafe generic fallback rejection | boundary-value | ADR-001, EP-001 | multi-step/state-changing boundary returns blocked |
| TC-003 | eligible generic fallback | equivalence-class | ADR-001, EP-001 | one-request read-only descriptor passes contract validation |
| TC-004 | process visibility boundary | error-guessing | ADR-003, EP-001 | unrelated-shell variable is not claimed ready |
| TC-005 | failure taxonomy and retry rule | decision-table | ADR-002, EP-002 | category and next action match signal; retry count does not advance without new evidence |
| TC-006 | complete required-header context | decision-table | ADR-004, EP-003 | applicable/omitted header categories and providers are explicit |
| TC-007 | dynamic input lifecycle | state-transition | ADR-005, EP-003 | acquire/generate -> validate -> consume -> discard transitions are asserted |
| TC-008 | cross-location validation | error-guessing | ADR-004, EP-003 | mismatched path/query/body identifiers or revisions stop in preparation |

### ui-component-to-api-endpoint-mapping

| Component/route | ST ID | EP ID | Data dependency |
| --- | --- | --- | --- |
| N/A, workflow-only change | N/A | EP-001, EP-002, EP-003 | none |

## Architecture

The workflow has two phases:

1. Preparation builds EP-003 from authoritative target sources, resolving required headers, cookies, path/query parameters, body fields, conditional inputs, validation relationships, providers, sensitivity, lifetime, and redaction. It then resolves the endpoint operation graph, searches for an authoritative runner that covers that context, validates its syntax/dry-run contract, and records the carrier decision. Multi-step, dynamic-value, and state-changing graphs require a project runner.
2. Execution consumes the resolved carrier and opaque credential reference once, then classifies the outcome. Recovery may correct a missing prerequisite but cannot change carriers unless token-free evidence proves a carrier defect.

The authoritative runner contract contains route templates, operation classification, request-context providers, validation assertions, read-back behavior, final-state/restoration behavior, and opaque secret-reference parameters. It owns no credential or environment value. The curl fallback retains the existing template shape but is eligible only for one bounded request whose complete context is static or safely provided by one opaque reference.

## API

### EP-001 - Smoke carrier resolution contract

- Inputs: endpoint method/path templates, operation graph, expected signal, repository runner candidates, restart state, authorization state, and secret-reference availability.
- Output: `project-runner`, `single-request-curl`, or `blocked`, plus sanitized reason and required precondition.
- Rule: state-changing, revision-dependent, read-back, or restoration workflows cannot select `single-request-curl`.

### EP-002 - Smoke outcome classification contract

- Inputs: selected carrier and sanitized process outcome.
- Output category: `passed`, `request-context`, `client-config`, `transport`, `auth`, or `business`.
- Recovery: client-config permits carrier repair only after token-free reproduction; transport retains carrier; auth retains carrier and renews the same reference; business routes to debugging; passed records bounded assertions.

### EP-003 - Request-context manifest contract

- Authoritative source precedence: complete OpenAPI/Swagger; otherwise controller/DTO plus auth, gateway, filter, or interceptor configuration; then a validated project runner. Captures and observed responses are supporting evidence only.
- Per-input fields: location, sanitized name or category, requiredness/condition, authoritative source, classification, provider, structural or relationship validation, lifetime, and redaction rule.
- Locations: header, cookie, path, query, body, and prior response.
- Classifications: static non-secret fixture, user-controlled opaque secret, environment-specific non-secret context, runtime-derived, and prior-response-derived.
- Header categories: authentication, tenant/organization/school/workspace scope, content negotiation/media type, locale, concurrency/version, idempotency, signature/timestamp/nonce, CSRF/session, and gateway-specific context. Each category is either resolved or explicitly omitted with source-backed reason.
- Readiness: any unresolved required input, source contradiction, unavailable provider, stale reusable value, or locally decidable cross-field inconsistency returns `request-context` before live execution.

## Database

Explicitly omitted: no persisted application data or schema is changed by the plugin design.

## UI/UX

Explicitly omitted: the workflow communicates through task updates and a Markdown verification record, not a browser UI.

## Test Cases

### TC-001 - Existing project runner wins

- Priority: P1
- Preconditions: a repository runner covers the method/path and assertions.
- Steps: resolve the smoke carrier.
- Expected result: `project-runner` is selected; no request template is generated.
- Covered IDs: R1, ADR-001, EP-001.

### TC-002 - Multi-step fallback is blocked

- Priority: P1
- Preconditions: the operation requires GET-derived revision, PUT, and GET read-back; no runner exists.
- Steps: resolve the smoke carrier.
- Expected result: preparation reports a missing runner before restart or credential handoff.
- Covered IDs: R2, R3, ADR-001, EP-001.

### TC-003 - Single bounded GET uses curl fallback

- Priority: P2
- Preconditions: no runner exists; one authenticated GET proves the expected signal.
- Steps: resolve and token-free validate the fallback template.
- Expected result: `single-request-curl` is selected and the template has one placeholder and valid request fields.
- Covered IDs: R3, R7, ADR-001, EP-001.

### TC-004 - Unrelated shell variable is not ready

- Priority: P1
- Preconditions: the user set a variable in another PowerShell process; it is not visible to the executor.
- Steps: evaluate credential readiness.
- Expected result: readiness remains false and the workflow offers a file reference or blocked state without requesting the token value.
- Covered IDs: R4, NFR1, ADR-003, EP-001.

### TC-005 - Failure classification preserves carrier

- Priority: P1
- Preconditions: token-free parse failure, connection failure, 401/403, and business 4xx fixtures are available.
- Steps: classify each outcome and derive the next action.
- Expected result: request-context, client-config, transport, auth, and business categories are distinct; transport/auth/business do not create a new template or carrier.
- Covered IDs: R5, R6, NFR3, ADR-002, EP-002.

### TC-006 - Required headers are complete and sourced

- Priority: P1
- Preconditions: the target requires authentication, school or tenant scope, JSON media type, and one gateway context header; locale and idempotency are inapplicable.
- Steps: build EP-003 and evaluate readiness without reading live secret values.
- Expected result: four applicable headers have authoritative sources, providers, structural checks, and redaction rules; omitted categories have source-backed reasons.
- Covered IDs: R8-R10, NFR1, NFR4, ADR-004, EP-003.

### TC-007 - Dynamic validation inputs are fresh

- Priority: P1
- Preconditions: a write requires a revision from GET and a timestamped signature with a nonce.
- Steps: prepare and execute the project runner through acquire/generate, validate, consume, and discard transitions.
- Expected result: values are created at point of use, never embedded in a reusable template, and durable evidence contains only assertion summaries.
- Covered IDs: R3, R9, R12, NFR1, ADR-005, EP-003.

### TC-008 - Cross-location parameter mismatch stops early

- Priority: P1
- Preconditions: path scope, scope header, and body scope must identify the same context; the fixture declares different sanitized aliases.
- Steps: run preparation validation.
- Expected result: the runner is not invoked and the outcome identifies a request-context relationship failure without exposing concrete values.
- Covered IDs: R11, NFR4, ADR-004, EP-003.

## Security

- Populated credential references remain opaque to the agent and durable artifacts.
- A runner must accept a path or process-visible variable without printing its value.
- Scope headers, cookies, signatures, timestamps, nonces, revisions, and identifiers inherit explicit sensitivity and redaction rules even when they are not authentication tokens.
- State-changing authorization remains separate from credential availability.
- Sanitized records exclude concrete resource IDs, request/response bodies, headers, cookies, and secret-reference paths.

## Observability

Explicitly omitted as a new subsystem. The existing API Verification Record adds carrier kind, preparation status, failure category, retry hypothesis, and final bounded assertion.

## Non-Functional

- Determinism: identical authoritative sources, request-context classifications, and operation graph produce the same readiness and carrier class.
- Portability: contract tests do not require a live service or real secret.
- Bounded retries: no retry without a changed prerequisite or disconfirming evidence.
- Distribution: source and mirror remain byte-identical.

## Consistency Check

- requiredDimensionsCovered: overview, architecture, api, security, test-cases, non-functional
- omittedDimensionsJustified: database, ui-ux, observability
- stableIdsUnique: true
- mappingTablesComplete: true
- sourceScopePreserved: true
- reviewStatus: review-passed
