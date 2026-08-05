---
type: design
status: review-passed
date: 2026-08-05
title: api-bubble-testing-skill
origin: docs/ae/prds/2026-08-05-001-api-bubble-testing-skill-prd.md
originFingerprint: 2026-08-05-api-bubble-testing
format: human-readable-design
sharded: false
---

# Design: API Bubble Testing Skill

## Source

- Requirements: `docs/ae/prds/2026-08-05-001-api-bubble-testing-skill-prd.md` (R1-R11, NFR1-NFR5).
- External method provenance: `docs/ae/solutions/2026-08-05-api-bubble-testing-skill-audit.md`.

## AI Parse Contract

- canonicalKind: design
- humanEquivalent: true
- stableIdsRequired: true
- noImplicitScope: true

## Split Manifest

- mode: unified
- root: docs/ae/designs/api-bubble-testing-skill-2026-08-05
- files:
  - design.md

## Overview

- Goal: give `ae-test-api` a durable, non-sensitive API Verification Record that lets later work trace an interface test to contract, implementation, and evidence.
- Source requirements: R2-R6, R8-R10, NFR2-NFR5.
- Required dimensions: overview, architecture, api, database, security, observability, non-functional, test-cases.
- Explicit omitted dimensions: ui-ux: explicitly-omitted; this is a documentation and API-verification workflow with no product UI.
- Cross-dimension dependencies: record fields drive API evidence, security redaction, observability identifiers, document retention, and declared knowledge relations.

## Existing Project Evidence

- mode: inspected
- bypass reason: N/A

| Evidence category | Repository-relative inputs | Sanitized conclusion | Confidence |
| --- | --- | --- | --- |
| workflow and validation | `.agents/skills/ae-backend/SKILL.md`, `.agents/skills/ae-work/references/local-runtime-smoke-gate.md`, `.agents/skills/ae-test-browser/SKILL.md` | Backend tests, runtime-smoke safety, and browser acceptance have distinct owners; API evidence must route to them without replacing them. | verified |
| knowledge graph | `docs/08-ai-memory/00-registry.json`, `plugins/ai-agent-engine-codex/scripts/memory-knowledge-contract.mjs`, `README.md` | Knowledge relations are declared, path-validated Markdown edges; source graph is shallow/read-only and neither is a general API catalog or raw runtime store. | verified |
| reusable assets | `docs/ae/evidence/ledger.jsonl`, `docs/ae/prds/2026-07-30-work-docs-evidence-governance-prd.md` | Existing AE evidence vocabulary supports bounded proof tiers; no API-record template currently exists. | verified |
| upstream method boundary | `docs/ae/solutions/2026-08-05-api-bubble-testing-skill-audit.md` | The upstream Gitee `ae-api-test` process confirms stable endpoint identity, side-effect classification, workflow-before-boundary sequencing, and conditional cleanup as portable ideas, but GPL-3.0 text and OpenCode-specific script/agent runtime are excluded. | verified |

## Implementation Constraints

- Repository paths: task records belong under `docs/ae/evidence/api/`; a future skill may add a template beneath its paired skill reference directories.
- Runtime/build commands: no API call, service lifecycle action, or graph mutation is implied by record creation; live calls remain governed by the existing local-runtime smoke gate.
- Environment variables: none. Credential or authentication references must never appear in a record.
- Dependency boundaries: use existing target-repository OpenAPI, controller/DTO, tests, and HTTP client; add no data store, graph database, schema validator, or API runner.
- External provenance boundary: independently author all guidance; do not copy GPL-3.0 source text, schemas, generated-script templates, agent prompts, automatic repair loops, or `ae/tests/api`/`ae/reports` runtime ownership from the upstream Gitee repository.
- Feature flags/configuration: none.
- Rollback constraints: deleting a generated record is not a substitute for correcting an inaccurate contract source; append a correction or superseding record that preserves the evidence chain.

## Decisions

### ADR-001 - Document-First API Evidence

- Decision: each `ae-test-api` execution writes one sanitized Markdown API Verification Record under `docs/ae/evidence/api/`.
- Drivers: R6, R8, NFR3, NFR5.
- Alternatives: store only terminal output; build a persistent graph database; update long-term memory for every run.
- Consequences: the Markdown record is the canonical task evidence; terminal output and test logs are supporting evidence only and must be summarized safely.
- Supersedes: none.

### ADR-002 - Stable Contract Source Precedence

- Decision: resolve request/response field definitions from an authoritative OpenAPI/Swagger source when present; otherwise use controller/DTO/handler contracts. Test fixtures and observed responses are evidence only.
- Drivers: R2, R3, R9.
- Alternatives: infer fields from the latest runtime payload; merge all sources without precedence.
- Consequences: field rows carry `sourceKind`, `sourcePath`, and an optional stable operation or symbol reference; a contradiction is reported as a validation gap, not silently reconciled.
- Supersedes: none.

### ADR-003 - Declared Graph Curation Only

- Decision: do not auto-write API verification records into the knowledge registry or shallow source graph. On explicit user request, curate only stable cross-module relations through a safe Markdown knowledge record and its declared registry relation.
- Drivers: R10, NFR3, NFR5.
- Alternatives: index every endpoint/test run; add an API graph schema; merge documentation and source graph edges.
- Consequences: ordinary location uses record links and repository search; `ae-knowledge-query` can expose only curated artifact relationships with declared provenance.
- Supersedes: none.

### ADR-004 - Minimal Retention And Sanitized Evidence

- Decision: retain field metadata and assertion summaries, never sample values or raw payloads.
- Drivers: R5, R6, R8, NFR2, NFR5.
- Alternatives: archive full HTTP exchanges; redact after writing; retain encrypted request captures.
- Consequences: records exclude secrets, headers, cookies, tokens, personal data, access-controlled resource values, opaque IDs, request bodies, response bodies, and stack traces. A need for private diagnostic artifacts is an explicit target-project authorization decision outside this skill.
- Supersedes: none.

## Mapping Tables

### api-field-to-database-column-mapping

| EP ID | API field | T ID | Data field | Notes |
| --- | --- | --- | --- | --- |
| EP-001 | `validationId` | T-001 | record frontmatter | Stable record identifier, not a user or request identifier. |
| EP-001 | `method`, `pathTemplate`, `operationRef` | T-001 | endpoint row | Path template only; omit concrete resource values and query values. |
| EP-001 | `requestFields[]`, `responseFields[]` | T-001 | field summary rows | Names, types, requiredness, semantics, source provenance; never field values. |
| EP-002 | `tier`, `status`, `expectedSignal`, `actualSignal` | T-001 | evidence rows | Bounded claim and result; no raw response content or sensitive command line. |
| EP-003 | `relationType`, `targetArtifact`, `evidencePath` | T-002 | declared relation | Exists only for explicitly curated durable knowledge. |

### api-error-to-ui-state-mapping

| EP ID | Error/status | ST ID | UI state | User-visible behavior |
| --- | --- | --- | --- | --- |
| N/A | N/A | N/A | explicitly-omitted | UI behavior is owned by `ae-test-browser` when a consuming project has a UI flow. |

### test-case-to-contract-coverage

| TC ID | Scenario | Covered IDs | Verification signal |
| --- | --- | --- | --- |
| TC-001 | Contract source is selected and field provenance recorded | ADR-002, EP-001, T-001 | Every retained field has a source kind and repository-relative source path. |
| TC-002 | Read-only API result is summarized without raw payload retention | ADR-001, ADR-004, EP-001, EP-002, T-001 | Record contains expected/actual signal and status only; prohibited material is absent. |
| TC-003 | Mutation result is verified through an available API read path | ADR-004, EP-001, EP-002 | Record links the safe fixture class and the read-back assertion, or documents why no read surface exists. |
| TC-004 | Long-term relation is requested for a stable cross-module contract | ADR-003, EP-003, T-002 | A declared evidence-linked relation is valid; no relation is created when curation is not requested. |

### Test Coverage Matrix

| TC ID | Scenario | Design method | Covered IDs | Automatable verification signal |
| --- | --- | --- | --- | --- |
| TC-001 | Contract source and field provenance | decision-table | ADR-002, EP-001, T-001 | Template/check asserts authoritative source choice and nonempty source path. |
| TC-002 | Sanitized record fields | equivalence-class | ADR-001, ADR-004, EP-001, EP-002, T-001 | Fixture checks allowed metadata and forbidden raw-value categories. |
| TC-003 | Mutation/read-back and unavailable read surface | decision-table | ADR-004, EP-001, EP-002 | Record includes a read-back assertion or a bounded unverified reason. |
| TC-004 | Optional curated graph relation | state-transition | ADR-003, EP-003, T-002 | Registry validation passes only after explicit curation prerequisites. |
| N/A | UI states | N/A | N/A | Explicitly omitted because UI is out of scope. |

### Test-Case Quality Rules

- Every record validation case must assert a retained field, an omission, or an evidence relation; it must not claim generic API coverage.
- Fixture variations that differ only by field values are not distinct test cases.
- A source contradiction, missing authoritative contract, unsafe fixture, or prohibited record content is a distinct failure outcome.

### ui-component-to-api-endpoint-mapping

| Component/route | ST ID | EP ID | Data dependency |
| --- | --- | --- | --- |
| N/A | N/A | N/A | UI is explicitly out of scope. |

## Architecture

`ae-test-api` selects endpoint scope from the changed contract, invokes target-repository checks, and produces a task-scoped record. The record links to source paths, tests, and the shared local-runtime smoke gate only by repository-relative reference. Existing `ae-knowledge-map` consumes declared durable documentation relations; it does not ingest records automatically. Existing `ae-graph-build` remains a separate, inferred source-dependency view.

## API

### EP-001 - Scoped Endpoint Record

- Required metadata: `method`, `pathTemplate`, `operationRef` when available, `contractSource`, `operationClassification`, `changedReason`, and `coverageStatus`.
- Request field summary: `name`, `location`, `typeOrSchemaRef`, `requiredness`, `semanticConstraint`, `sourceKind`, and `sourcePath`.
- Response field summary: `statusClass`, `name`, `typeOrSchemaRef`, `requiredness`, `semanticConstraint`, `sourceKind`, and `sourcePath`.
- Exclusions: concrete URL, query values, request values, response values, headers, cookies, tokens, resource identifiers, and stack traces.

### EP-002 - Evidence Entry

- Required metadata: `tier`, `status` (`passed`, `failed`, `blocked`, `not-applicable`, or `unverified`), `sanitizedCommandOrObservation`, `expectedSignal`, `actualSignal`, `operationClassification`, and `evidenceBoundary`.
- Conditional metadata: `fixtureClass`, `readBackAssertion`, `authorizationReferenceStatus`, and `unrelatedFailureReason`.
- Rules: a lower-tier entry cannot satisfy a higher-tier requirement. A command form may retain the executable name, non-secret flags, path template, and placeholders, but must omit any secret/config path, header, cookie, concrete query/body value, private host, or opaque resource identifier.

### EP-003 - Curated Knowledge Relation

- Preconditions: explicit user request, stable cross-module relevance, a sanitized Markdown knowledge record, and a repository-relative evidence path.
- Allowed content: artifact paths, relation type, durable contract role, and summary-level field/endpoint labels.
- Forbidden content: any test payload, raw response, credential, header, cookie, personal data, or private resource identifier.

## Database

### T-001 - API Verification Record

- Durable structure: one Markdown document at `docs/ae/evidence/api/<timestamp>-<topic>.md` per verification run.
- Lifecycle: created after scope selection; updated only to add sanitized results or a correction; archived with the owning task according to project process rules.
- Source of truth: this document, with links to the product contract and test evidence.

### T-002 - Curated Knowledge Relation

- Durable structure: an explicit document/edge pair in `docs/08-ai-memory/` and `docs/08-ai-memory/00-registry.json`.
- Lifecycle: created only by an explicit curation request; validated by the existing registry checker; never created automatically by an API test run.
- Source of truth: the curated Markdown record and its declared evidence path, not a generated graph cache.

## UI/UX

Explicitly omitted. A target UI that consumes a changed API remains a separate `ae-test-browser` concern.

## Test Cases

### TC-001 - Contract Provenance

- Priority: high
- Preconditions: a changed endpoint has an OpenAPI/Swagger source or a repository controller/DTO/handler contract.
- Steps: select the endpoint and enumerate retained request/response metadata.
- Expected result: every retained field identifies authoritative source kind/path; fixture and observed-response fields do not override the contract.
- Covered IDs: ADR-002, EP-001, T-001.

### TC-002 - Sanitized Evidence

- Priority: high
- Preconditions: a focused test or read-only local API result exists.
- Steps: write the result into the record using the evidence entry contract.
- Expected result: tier, sanitized command/observation, status, and expected/actual signal are present; prohibited payload, secret, and sensitive command categories are absent.
- Covered IDs: ADR-001, ADR-004, EP-001, EP-002, T-001.

### TC-003 - Mutation Verification Boundary

- Priority: high
- Preconditions: a state-changing endpoint is explicitly authorized and a test-safe fixture is available.
- Steps: run the approved mutation path and attempt an API read-back where exposed.
- Expected result: the record identifies the synthetic fixture class and read-back assertion, or explicitly states the hidden-effect limitation without adding database data to the public contract claim.
- Covered IDs: ADR-004, EP-001, EP-002.

### TC-004 - Opt-In Knowledge Relation

- Priority: medium
- Preconditions: the user explicitly requests durable cross-module API contract curation.
- Steps: create the sanitized knowledge record and declared relation, then query it through the existing knowledge command.
- Expected result: the relation is returned as declared with its evidence path; an ordinary per-run record creates no graph edge.
- Covered IDs: ADR-003, EP-003, T-002.

## Security

- Classify all record fields as metadata, assertion summary, or prohibited data before writing.
- A user-controlled secret reference may be named only by status, never path or contents.
- State-changing verification requires the shared gate's explicit authorization; record the operation classification, not an authorization token or raw request.
- Sanitization failure blocks record creation and the success claim until a safe summary can be produced.

## Observability

- `validationId` links the record, tests, and any later issue without exposing a request ID from production.
- `contractSource` and repository-relative `sourcePath` make contract drift diagnosable.
- Each evidence row has a tier and status, so a failed, blocked, or unverified runtime result cannot be confused with a passing focused test.
- Corrections add a `supersedes` reference to the earlier record and a short sanitized reason.

## Non-Functional

- No new runtime service, graph database, network operation, dependency, or global configuration.
- Records are compact summaries; no full API catalog, payload history, or background indexing.
- Record creation remains best-effort only after safe evidence exists. A missing `docs/ae` scaffold is a documented setup blocker, not permission to write elsewhere.
- The current source graph and knowledge map retain their distinct provenance models and must not be presented as a combined API graph.

## Consistency Check

- requiredDimensionsCovered: overview, architecture, api, database, security, observability, non-functional, test-cases
- omittedDimensionsJustified: ui-ux
- stableIdsUnique: ADR-001..ADR-004, EP-001..EP-003, T-001..T-002, TC-001..TC-004
- mappingTablesComplete: yes; UI mappings explicitly N/A
- sourceScopePreserved: yes
- reviewStatus: passed; see `docs/ae/reviews/2026-08-05-api-bubble-testing-skill-document-review.md`
