---
type: prd
status: review-passed
date: 2026-08-13
topic: api-smoke-execution-reliability
format: human-readable-requirements
sharded: false
---

# API Smoke Execution Reliability

## AI Parse Contract

- canonicalKind: requirements
- humanEquivalent: true
- stableIdsRequired: true
- noImplicitScope: true

## Problem Frame

`ae-test-api` correctly separates automated checks from authenticated runtime evidence, but its live-call contract stops at a fillable curl template. For multi-step or state-changing smoke tests, agents can still improvise the HTTP carrier, quoting, credential handoff, and read-back sequence after the service is restarted. The observed result was repeated credential prompts, an invalid second template, an environment-variable handoff that could not cross process boundaries, and delayed reuse of an already successful project smoke runner.

The desired outcome is deterministic request-context preparation, carrier selection, and failure classification. A previously validated project runner must be reused first; a generic curl config is only a bounded single-request fallback. The selected runner must account for every contract-required header, path/query parameter, body field, dynamic validation value, and response assertion before live execution. Authentication or transport failure must not cause the workflow to invent a new carrier without evidence.

## Requirements

**Execution carrier selection**

- R1. The workflow must discover and prefer an existing project-owned smoke runner, fixture, or documented command that covers the target endpoint and its required request context before creating a generic request config.  
  Acceptance: when a matching runner exists, the verification record names its repository-relative source, confirms coverage of required headers and parameters, and the workflow does not create an alternative curl template.
- R2. A state-changing or multi-step smoke must have its runner, request-context manifest, assertions, restoration behavior, and secret-reference interface prepared and statically validated before the user is asked to restart the service.  
  Acceptance: the runner has a syntax or dry-run check, classifies writes, verifies required input presence without printing values, validates parameter relationships, verifies through a read surface, and declares its final-state or restoration rule before runtime execution.
- R3. The shared curl config template may be used only for a single bounded request whose expected signal can be proven by that request alone.  
  Acceptance: GET -> PUT -> GET, revision acquisition, dynamic headers or signatures, cross-field validation, dynamic bodies, cleanup, or restoration routes to a project runner and cannot be represented as an improvised sequence of generic templates.

**Request-context completeness**

- R8. Before selecting a carrier, the workflow must resolve required request inputs from authoritative sources using this precedence: OpenAPI/Swagger when complete, then controller/DTO plus authentication, gateway, filter, or interceptor configuration, then an existing validated project runner. Observed requests and user recollection are supporting evidence only.  
  Acceptance: every required header, cookie, path parameter, query parameter, body field, and conditional validation value has a source reference and unresolved contradictions leave live smoke `blocked`.
- R9. Each request input must be classified by sensitivity and provider: static non-secret fixture, user-controlled opaque secret, environment-specific non-secret context, runtime-derived value, or prior-response-derived value.  
  Acceptance: the request-context manifest identifies the input location, requiredness, source, classification, provider, validation rule, and redaction rule without recording a live value.
- R10. The workflow must account for contract-required headers beyond authentication, including applicable tenant or organization scope, school or workspace scope, content negotiation, media type, locale, version/concurrency, idempotency, signature, timestamp, nonce, and gateway-specific context.  
  Acceptance: applicable headers are supplied by the declared provider and validated structurally; inapplicable header categories are explicitly omitted with a source-backed reason rather than silently absent.
- R11. Parameter validation must cover presence, type, format, allowed values, cross-field rules, path/query/body consistency, and freshness or one-time-use constraints when applicable.  
  Acceptance: a missing or contradictory required parameter fails during preparation where locally decidable; runtime-only validation is named as an expected error assertion and is not mistaken for transport or authentication failure.
- R12. Runtime-derived and prior-response-derived values must be produced inside the selected runner at the point of use and must not be copied into reusable templates as stale constants.  
  Acceptance: revisions, ETags, timestamps, nonces, signatures, CSRF values, and response-derived resource identifiers are acquired or generated by the runner, validated for presence, kept in memory or an approved ephemeral boundary, and redacted from durable evidence.

**Credential and failure handling**

- R4. A credential reference must be visible to the process that executes the client without the agent reading or echoing its content.  
  Acceptance: file references are passed by absolute path to the selected client; environment variables are accepted only when already visible to the executing process, and the user is never asked to set a variable in an unrelated shell session.
- R5. The first failed attempt must be classified as request-context preparation, client-configuration, transport, authentication/authorization, or business-contract failure before retry.  
  Acceptance: the workflow records one sanitized classification and its evidence, then either reuses the same validated carrier with the missing prerequisite corrected or leaves the tier blocked.
- R6. The workflow must not invent a second config syntax, switch credential carriers, or request a prerequisite already supplied unless a disconfirming check proves the original carrier is the cause.  
  Acceptance: a 401 retains the validated request carrier and requests token/session renewal; a client parse error is reproduced against the token-free template before that template is changed.

**Regression contract**

- R7. Distribution checks must validate executable smoke-routing and request-context invariants rather than only matching documentation phrases.  
  Acceptance: tests cover project-runner precedence, single-request fallback limits, complete context classification, process-visible credential rules, five-way failure classification, derived-value handling, and source/mirror equality.

## Non-Functional Requirements

- NFR1. The workflow must not log, inspect, archive, commit, or copy a populated secret reference.  
  Acceptance: durable records contain only sanitized route templates, operation classifications, status, assertions, and evidence boundaries.
- NFR2. The solution must remain client-light and portable.  
  Acceptance: it reuses target-project runners and the installed system client; it does not add a general HTTP framework, secret manager, or service-lifecycle controller to the plugin.
- NFR3. One failed runtime attempt must not trigger an unbounded troubleshooting loop.  
  Acceptance: each retry requires a new evidence-backed hypothesis; otherwise authenticated smoke remains `blocked`.
- NFR4. Request-context validation must not create a second source of truth for target API contracts.  
  Acceptance: manifests reference authoritative target sources and describe only smoke-specific providers, classifications, and assertions; they do not redefine target field semantics.

## Must-Haves

- Requirement ID: R2
  Must-have completion condition: a multi-step write smoke cannot reach live execution without a prevalidated project runner and explicit restoration/final-state behavior.
- Requirement ID: R4
  Must-have completion condition: the selected credential reference is consumable by the same executing process without exposing its value.
- Requirement ID: R5
  Must-have completion condition: runtime failures are classified before any retry or carrier change.
- Requirement ID: R8
  Must-have completion condition: no live call runs while any contract-required request input lacks an authoritative source and provider.
- Requirement ID: R12
  Must-have completion condition: freshness-sensitive or response-derived values are produced by the runner and never retained as reusable constants.

## Success Criteria

- Repeating the scenario from task `019ff9ca-953d-7151-8cef-c143ad0ead39` selects the existing project PowerShell smoke runner before asking for credentials.
- A stale token produces one `authentication blocked` result and a renewal request, without generating v2/v3 config files.
- A valid single-request curl template parses on supported Windows curl without exposing a credential.
- Multi-step write smoke reaches a deterministic GET -> write -> read-back -> restore/final-state result or a precise blocked state.
- A smoke requiring authentication, school/tenant scope, a revision, and body validation either resolves all four through declared providers or stops before the request with a precise missing-context report.
- Validation distinguishes a missing scope header, an expired token, a stale revision, and a business-rule rejection without rewriting the request carrier.

## Scope Boundary

### In Scope

- `ae-test-api`, the shared local runtime smoke gate, request-template guidance, API verification records, regression tests, mirrored skill distribution, and release documentation required by plugin rules.

### Out Of Scope

- Target backend changes, automatic service restart, production credentials, a plugin-owned general HTTP client, browser acceptance, and automatic token refresh.

### Constraints

- The agent must not inspect a populated credential file.
- State-changing requests still require explicit user authorization for the exact target and effect.
- A lower evidence tier cannot prove authenticated runtime behavior.

## Validation Evidence

- Static inspection: current skill and test contracts; expected signal is deterministic context resolution, carrier precedence, and failure taxonomy in source and mirror.
- Focused automated test: routing and contract tests; expected signal is executable assertions for R1-R12.
- Integration/distribution: package, mirror, artifact, release-note, and install-smoke checks; expected signal is matching distributable content.
- Authenticated service smoke: one target-project read-only case and one authorized state-changing runner case; status `unverified` until implementation and target runtime are available.

## Perspective Collision

| Perspective | Position | Disagreement type |
| --- | --- | --- |
| Critic | A prose template cannot constrain an agent's runtime improvisation or prove header completeness. | fact |
| Pragmatist | Existing project runners often encode headers, fixtures, validation parameters, and read-back; select them first. | value |
| Innovator | A generic request manifest could generate every client invocation. | value |
| Systems | Credentials, scope headers, gateway context, dynamic revisions, signatures, and restoration have different authorities and lifetimes. | assumption |

- Collision insight: determinism does not require a universal HTTP client; it requires resolving the carrier before runtime and testing the selection contract.
- Collision insight: the generic curl template remains useful only after its scope is narrowed to one bounded request.
- Collision insight: a request-context manifest should describe provenance and providers, not duplicate API values or become a second OpenAPI document.
- Blind spot: target repositories may have several stale smoke scripts; discovery therefore needs method, path, required-context, and assertion matching, not filename matching alone.
- Thinking preservation zone: maintainers decide whether a target write smoke restores prior state or intentionally leaves a named final fixture state.

## Key Decisions

- D1. Use `project runner -> single-request curl fallback -> blocked` as the execution precedence.  
  Reason: it reuses the most behavior-aware artifact without adding a universal client.
- D2. Prepare write-smoke runners during implementation, not after restart.  
  Reason: request bodies, revision handling, assertions, and restoration are implementation evidence, not credential-handoff details.
- D3. Treat 401/403 as authentication/authorization evidence, not as proof of curl syntax failure.  
  Reason: client parse, transport, auth, and business failures require different recovery actions.
- D4. Require a source-backed request-context manifest before carrier selection.  
  Reason: a syntactically valid client call is still invalid when required scope headers, conditional parameters, or derived validation values are missing or stale.
- D5. Keep dynamic values inside the project runner rather than the generic template.  
  Reason: revisions, signatures, timestamps, nonces, and response-derived identifiers have lifetimes and dependencies that static templates cannot safely represent.

## Dependencies And Assumptions

### Dependencies

- Target repositories expose enough route/controller/fixture evidence to identify a matching smoke runner.
- Authentication, gateway, filters, and interceptors may define mandatory request context not fully represented in endpoint DTOs.
- The current Codex process can invoke the target runner and its configured system client.

### Assumptions

- The successful prior task accurately demonstrates the value of a project-owned PowerShell runner; its actual credential content is neither needed nor inspected.

## Evidence Notes

- The failing task created two curl templates, suggested a shell-local environment variable, then eventually found and reused the existing project runner -> Evidence: Codex task `019ff9ca-953d-7151-8cef-c143ad0ead39`.
- The prior successful task used a project PowerShell runner for GET/PUT/read-back and restoration -> Evidence: Codex task `019ff55e-8049-7542-9c21-dc16be282965`.
- The current template's normal and extra-quoted header forms both parsed under local `curl 8.21.0`; the observed claim that spaces in `Authorization` were incompatible is contradicted -> Evidence: token-free stdin config reproduction on 2026-08-13; both attempts reached transport timeout rather than config parse failure.
- Current tests assert phrases and exact template text but do not exercise carrier precedence or failure classification -> Evidence: `tests/skills-docs.test.mjs`.

## Consistency Check

- requirementsCount: 12
- nonFunctionalRequirementsCount: 4
- decisionsCount: 5
- openQuestionsCount: 0
