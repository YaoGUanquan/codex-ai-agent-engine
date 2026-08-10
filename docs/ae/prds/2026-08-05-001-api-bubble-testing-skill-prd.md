---
type: prd
status: review-passed
date: 2026-08-05
topic: api-bubble-testing-skill
format: human-readable-requirements
sharded: false
origin: docs/ae/brainstorms/2026-08-05-api-bubble-testing-requirements.md
originFingerprint: 2026-08-05-api-bubble-testing
---

# PRD: API Bubble Testing Skill

## AI Parse Contract

- canonicalKind: requirements
- humanEquivalent: true
- stableIdsRequired: true
- noImplicitScope: true

## Problem Frame

After backend development, the AE catalog has no dedicated API-level verification entrypoint comparable to `ae-test-browser` for UI flows. `ae-backend` requires contract-aware narrow tests, while `ae-work` exposes a guarded local runtime smoke only when explicitly requested. Neither defines a reusable post-change API test workflow that selects affected endpoints, runs the smallest credible checks, and reports API evidence separately from browser or deployment acceptance.

"API bubble testing" in this PRD means post-change API/interface verification. It does not mean browser testing, unattended service automation, or blanket permission to mutate test data.

## Requirements

**Dedicated API Verification**

- R1. Provide a new `ae-test-api` skill for post-change backend API verification.
  Acceptance: the skill has clear trigger language for API/interface/bubble testing after backend work and explicitly routes UI-only acceptance to `ae-test-browser`.
- R2. The skill must determine the in-scope API surface from the changed contract and available repository evidence.
  Acceptance: before testing, it identifies affected routes, methods, request and response contracts, expected errors, authorization rules, persistence effects, and applicable idempotency/retry or external-service risks; unrelated endpoints are not implied to be covered.
- R3. The skill must select the smallest credible evidence profile for the affected API.
  Acceptance: it distinguishes static contract inspection, focused automated API/controller tests, integration/build checks, local runtime health, read-only API smoke, authenticated API smoke, and deployment acceptance; each entry has an exact bounded claim and status.
- R4. The skill must verify relevant success and failure behavior without assuming a universal scenario count.
  Acceptance: each selected endpoint has a happy-path assertion plus applicable validation/error assertions; contract checks assert consumer-relied-on fields or the available schema instead of incidental full-payload equality; conditional auth, authorization, persistence, concurrency/idempotency, and external-integration risks are either exercised or reported as `not-applicable`, `blocked`, or `unverified` with a reason.

**Live Request Safety And Reporting**

- R5. Any live local API call must use the existing local-runtime smoke gate as its sole safety owner.
  Acceptance: `ae-test-api` delegates restart/hot-reload confirmation, read-only versus state-changing classification, authorization, and user-controlled secret-reference handling to the shared gate and does not reproduce conflicting guidance. When a credential reference is missing, it creates a non-empty UTF-8 fillable request-config template from the shared `request-config-template` reference.
- R6. The skill must report useful, non-sensitive API evidence.
  Acceptance: its report records endpoint and method, operation classification, non-secret fixture class, expected and actual signal, HTTP and business outcome, a reproducible sanitized command form or observation, evidence tier, unverified proof, and known unrelated failures; mutation tests use isolated synthetic data and, where the API exposes a read surface, confirm the effect through that surface; it excludes credentials, private headers, raw secret references, private response data, and raw command lines that contain such material.
- R7. The skill must route implementation and diagnosis to existing owners.
  Acceptance: it directs code changes to `ae-backend` or `ae-work`, red-green implementation to `ae-tdd`, failures to `ae-debug` or `ae-task-loop`, OpenAPI inspection to `ae-swagger-parser`, and UI verification to `ae-test-browser`.
- R8. Each completed API verification must create one sanitized, task-scoped API Verification Record.
  Acceptance: the record is written under `docs/ae/evidence/api/` and identifies the validation, contract source, changed scope, endpoint rows, request/response field summaries, assertion results, evidence tiers, relevant source/tests, and unverified or blocked proof without retaining raw payloads or secrets.
- R9. The record must define a source-precedence rule for contract fields.
  Acceptance: an OpenAPI/Swagger definition is preferred when authoritative; otherwise the repository's controller/DTO or handler contract is authoritative; observed responses and test fixtures may support evidence but cannot silently redefine the contract.
- R10. API knowledge-graph indexing must be deliberate and evidence-linked.
  Acceptance: per-run records are not automatically added to `docs/08-ai-memory/00-registry.json`; a durable, cross-module API relationship may be curated only on an explicit request with a safe Markdown knowledge record, declared evidence relation, and no secret or raw-payload data.

**Distribution**

- R11. The distributable skill change must integrate with the plugin's existing mirror and discovery contracts.
  Acceptance: plugin source, `.agents` mirror, metadata, user-facing catalog, installation smoke, release version, and dated release notes are synchronized and validate before release.

## Non-Functional Requirements

- NFR1. The workflow must be stack-neutral and reuse target-repository tests, HTTP clients, OpenAPI definitions, and fixtures.
  Acceptance: no default client, dependency, mock server, data-reset service, CI runner, or framework-specific test harness is introduced.
- NFR2. The workflow must remain safety-bounded for authentication and mutation.
  Acceptance: it neither starts/restarts services nor sends an authenticated or state-changing request without the existing shared-gate preconditions and explicit authorization.
- NFR3. The skill must preserve evidence integrity.
  Acceptance: a passing lower-tier check is never presented as runtime, authenticated, browser, or deployment acceptance, and unavailable proof remains visible.
- NFR4. External methods must be rewritten as local AE guidance with attributable provenance.
  Acceptance: the implementation records source, observed commit, license, and adapted-method boundary; it copies no source text, frameworks, runtime integration, or source-derived template from an external candidate.
- NFR5. API evidence must minimize retained data and preserve traceability.
  Acceptance: records retain only contract metadata and sanitized assertion summaries; raw bodies, secrets, credentials, cookies, private headers, personal data, and volatile opaque identifiers are excluded, while every retained relation has an evidence path.

## Must-Haves

- Requirement ID: R5
  Must-have completion condition: live API execution uses the canonical shared gate and cannot weaken its secret, authorization, or state-mutation boundaries.
- Requirement ID: R6
  Must-have completion condition: the standard result separates proof tiers and does not retain secret-bearing or private request/response material.
- Requirement ID: R8
  Must-have completion condition: each completed API verification has exactly one sanitized record with declared field provenance and explicit evidence status.
- Requirement ID: R11
  Must-have completion condition: both distributable roots and all catalog/distribution checks pass before a versioned release is claimed.

## Success Criteria

- A backend developer can request API bubble testing and receive a repeatable, endpoint-scoped verification workflow.
- The workflow proves only the evidence tier actually exercised, and identifies the next safe action for blocked runtime or authenticated checks.
- The catalog gains backend API verification without duplicating browser, implementation, or secret-safety responsibilities.
- A later investigator can trace a reported endpoint from the verification record to its contract source, test evidence, and relevant implementation path without recovering sensitive request/response data.

## Scope Boundary

### In Scope

- A new `ae-test-api` skill and small reusable reference material for API evidence selection and reporting.
- A compact, task-scoped API Verification Record contract under `docs/ae/evidence/api/`.
- Source/mirror skill content, discovery metadata, README/help catalog, focused regression tests, and the required version/release documentation for the distributable update.
- Explicit routing to existing AE skills and the existing local-runtime smoke gate.

### Out Of Scope

- A universal API test framework, Postman/Insomnia collection generator, server lifecycle manager, secret manager, test-data provisioning/reset engine, CI integration, or automatic deployment validation.
- Target-project code, schemas, endpoints, credentials, service configuration, and live-environment changes.
- Automatic updates to `docs/08-ai-memory/00-registry.json`, persistent graph databases, raw request/response archives, or a general API catalog/query engine.
- Claims that a local API test proves browser behavior, production deployment, capacity, or external-provider correctness.

### Constraints

- `AGENTS.md` and `docs/ae/constitution.md` remain authoritative for mirror, release, validation, user-work preservation, and Codex runtime boundaries.
- The existing local-runtime smoke gate is canonical for live calls; `ae-test-api` may link to it but must not fork its safety contract.
- Test scope is risk-scaled from the changed contract and actual repository evidence, not a fixed number of scenarios or endpoints.
- Markdown API Verification Records are authoritative for task evidence; the existing knowledge map exposes only explicitly declared Markdown relations and the existing source graph remains a separate shallow, read-only tool.

## Validation Evidence

| Acceptance criterion | Applicable tier | Expected signal and bounded claim | Preconditions / owner | Status | Recovery or rollback signal |
| --- | --- | --- | --- | --- | --- |
| R1-R7, R8-R10, NFR1-NFR5 | Static inspection and focused automated test | Skill text and reference templates preserve endpoint selection, sanitized record fields, source precedence, declared-only graph curation, routing, and secret/mutation boundaries. | Maintainer; local Node test runtime. | unverified | Remove the new entrypoint, template, and catalog metadata; existing skills remain unchanged. |
| R11 | Integration or build | Mirror, metadata, skill contract, artifact, install-smoke, package, release-note, and relevant full-suite checks pass. | Maintainer; repository dependencies. | unverified | Do not release or version-bump until distribution checks pass. |
| R2-R6 | Local runtime / authenticated API smoke | A separately authorized target project exercises a named API route and confirms the report selects and records the correct evidence tier. | User-controlled runnable service, non-secret fixture, and authorization where required. | unverified | Retain workflow guidance only; revise from controlled target-project feedback. |
| R1, R7 | Browser acceptance / deployment | Not applicable to an API-only workflow unless a consuming project exposes a UI or deployment validation objective. | Target-project owner. | not-applicable | Keep these proof tiers explicitly outside the API pass claim. |

## Key Decisions

- D1. Create `ae-test-api` instead of expanding `ae-backend`.
  Reason: API verification has a distinct invocation trigger, endpoint-selection process, evidence report, and live-request risk boundary; embedding it in an implementation skill would make standalone post-change testing undiscoverable.
- D2. Reuse the local-runtime smoke gate rather than creating an API-specific live-call protocol.
  Reason: restart, authentication, secret-reference, and state-mutation safety rules must remain consistent across implementation and test entrypoints.
- D3. Prefer evidence profiles and conditional risk paths over fixed test cases.
  Reason: API contracts vary by authorization, data effects, concurrency, external dependencies, and available local fixtures.
- D4. Adapt only independently rewritten methods from the audited candidates.
  Reason: the MIT candidates support API-layer assertions, test data, and risk selection. The upstream Gitee AE repository confirms useful process ideas (stable endpoint identity, side-effect classification, workflow-before-boundary sequencing, and conditional cleanup), but its GPL-3.0 source and OpenCode-specific runtime are reference-only. Postman MCP runtime, framework-specific examples, generated scripts, automatic repairs, and GPL source text do not fit this distribution.
- D5. Make the API Verification Record authoritative and graph indexing opt-in.
  Reason: current knowledge-map relations are declared Markdown links, while source graphs are shallow inferred edges; automatically indexing every volatile API test result would mix evidence confidence, bloat durable memory, and increase sensitive-data risk.

## Dependencies And Assumptions

### Dependencies

- Existing `ae-backend`, `ae-work`, `ae-tdd`, `ae-debug`, `ae-task-loop`, `ae-test-browser`, `ae-swagger-parser`, and the local-runtime smoke gate.
- Existing source/mirror, language metadata, skill contract, artifact, install smoke, and release-note checks.
- The external audit `docs/ae/solutions/2026-08-05-api-bubble-testing-skill-audit.md` remains provenance for method adoption, not an implementation dependency.
- Existing `docs/08-ai-memory/00-registry.json` and `ae-knowledge-map` remain available only for explicitly curated, declared API artifact relations.

### Assumptions

- Current user authorization covers requirement definition only; implementation, service startup, and live API calls require a subsequent explicit request.
- Consuming repositories provide enough route, contract, test, or runtime information to choose scoped API evidence.

## Open Questions

### Must Resolve Before Planning

- None.

### Deferred To Planning

- Q1. [Affects R2-R6][technical] Determine the smallest reference format for endpoint selection and final evidence reporting across controller-test, OpenAPI, and runtime-only repositories.
- Q2. [Affects R8-R10][technical] Define the smallest field template and validation assertions for API Verification Records without creating a general catalog or graph schema.
- Q3. [Affects R11][technical] Identify the current canonical metadata generator and all catalog/install test assertions that a new skill must update.

## Evidence Notes

- Backend implementation boundary -> `.agents/skills/ae-backend/SKILL.md` and `references/api-contract-checklist.md`.
- Current local API safety boundary -> `.agents/skills/ae-work/references/local-runtime-smoke-gate.md`.
- Browser-only verification boundary -> `.agents/skills/ae-test-browser/SKILL.md`.
- Evidence-tier vocabulary -> `docs/ae/prds/2026-07-30-work-docs-evidence-governance-prd.md`.
- Candidate creation criterion -> `docs/ae/prds/2026-07-30-ecc-skill-candidate-governance-prd.md` requires overlap evaluation and explicit adoption before a new skill implementation.
- External method audit -> `docs/ae/solutions/2026-08-05-api-bubble-testing-skill-audit.md` records current commits, licenses, inspected files, reusable methods, and rejected runtime or license-bound patterns.
- Upstream AE API-test boundary -> Gitee `master` commit `c4e5c14ec8b62adabaefc5f98fe267d1188211d5` was inspected through the external audit; it validates the problem-category fit only and is not a copied source, runtime, or implementation dependency.
- API evidence and graph boundary -> `docs/ae/designs/api-bubble-testing-skill-2026-08-05/design.md` defines the record schema, source precedence, retention exclusions, and curation-only graph relation model.

## Consistency Check

- requirementsCount: 11
- nonFunctionalRequirementsCount: 5
- decisionsCount: 5
- openQuestionsCount: 3

## Self-Review

- The PRD describes what post-change API verification must achieve without choosing a test framework, HTTP client, endpoint schema, or server orchestration implementation.
- Existing backend, browser, and local-runtime owners remain distinct, and the live-call safety contract has one owner.
- Every requirement and non-functional requirement has a concrete acceptance condition, while runtime and deployment claims remain separately marked as unverified or not applicable.
