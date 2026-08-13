# API Verification Record Contract

Use this reference to select endpoint-scoped API evidence and write one sanitized record for a completed verification. It is not a test runner, request generator, service controller, secret store, or graph database.

## Contents

- Scope Selection
- Contract Source Precedence
- Request Context Manifest
- Evidence Tiers
- Live Call Boundary
- Retention Rules
- Record Template
- Knowledge Curation

## Scope Selection

For each changed route, record a stable endpoint key made of `method`, `pathTemplate`, and `operationRef` when available. Identify the changed reason and explicitly exclude related endpoints that are outside the changed contract.

Select only applicable risks:

- request validation and error behavior;
- authentication and authorization;
- persistence and visible read-back;
- idempotency, retries, duplicate operations, pagination, and concurrency;
- external-service effects and recovery behavior.

Run the approved workflow path before boundary cases when both apply. Do not require a fixed endpoint count or scenario count.

## Contract Source Precedence

1. Use an authoritative OpenAPI or Swagger definition when one exists.
2. Otherwise use the repository controller, DTO, handler, and applicable authentication, gateway, filter, or interceptor contract.
3. Use tests, fixtures, and observed responses only to support assertions. They cannot silently redefine a field, requiredness, status, or error shape.

When sources contradict each other, report a validation gap instead of merging them. Retain repository-relative source paths and stable symbols or operation references only.

## Evidence Tiers

| Tier | Status values | Bounded claim |
| --- | --- | --- |
| Static inspection | passed, failed, blocked, not-applicable, unverified | The documented contract and changed source were inspected. |
| Focused automated test | passed, failed, blocked, not-applicable, unverified | The named controller/API test executed its selected assertion. |
| Integration or build | passed, failed, blocked, not-applicable, unverified | The named package, contract, or wiring check completed. |
| Runtime health | passed, failed, blocked, not-applicable, unverified | A running target reported the expected health signal. |
| Read-only API smoke | passed, failed, blocked, not-applicable, unverified | One authorized, bounded read-only request observed its expected signal. |
| Authenticated API smoke | passed, failed, blocked, not-applicable, unverified | One authorized protected request observed its expected signal. |
| Browser acceptance | passed, failed, blocked, not-applicable, unverified | A separate UI flow was exercised through `ae-test-browser`. |
| Deployment or operations | passed, failed, blocked, not-applicable, unverified | A separately authorized release or operational condition was observed. |

A passing lower tier cannot satisfy a higher-tier claim.

## Request Context Manifest

Before selecting a client, record a sanitized manifest for every request input. The manifest is not a second API schema; it records how the smoke obtains and validates values from the authoritative target contract.

| Field | Required content |
| --- | --- |
| location | `header`, `cookie`, `path`, `query`, `body`, or `prior-response` |
| requiredness | required, optional, or conditional rule |
| source | repository-relative OpenAPI/controller/auth/gateway/filter/interceptor/runner source |
| classification | static non-secret fixture, user-controlled opaque secret, environment non-secret context, runtime-derived, or prior-response-derived |
| provider | runner, opaque file reference, same-process environment, fixture, or prior response |
| validation | presence, type/format, allowed values, cross-field consistency, or freshness rule |
| lifetime | static, request, step, or one-time |
| redaction | what may be retained in sanitized evidence; never retain live values |

Check applicable authentication, tenant/organization/school/workspace scope, content negotiation/media type, locale, version/concurrency, idempotency, signature/timestamp/nonce, CSRF/session, and gateway context headers. Explicitly record why an inapplicable category is omitted. Missing providers, source contradictions, stale reusable values, and locally decidable path/query/body conflicts block live execution before the client is invoked.

## Live Call Boundary

Before a live local API call, read `../../ae-work/references/local-runtime-smoke-gate.md` and, when a credential handoff is needed, `../../ae-work/references/request-config-template.md`. Do not duplicate or weaken their restart, authorization, secret-reference, request-template, request classification, or failure handling rules. The handoff file must be a non-empty UTF-8 fillable template with `REPLACE_WITH_LOCAL_TOKEN`; never leave the user an empty script.

For an explicitly authorized mutation, use an isolated synthetic fixture class and clean up only through the target's supported pattern when appropriate. If the API exposes a read surface, record a sanitized read-back assertion. If it does not, state the hidden-effect limitation; do not substitute direct database state for a public API claim. Dynamic revisions, ETags, timestamps, nonces, signatures, CSRF values, and response-derived identifiers must be acquired or generated at point of use by the selected runner.

## Retention Rules

Allowed record content:

- path templates, HTTP methods, operation/symbol references, contract source paths, field names, types, requiredness, and semantic constraints;
- non-secret fixture class, operation classification, expected/actual summary, evidence tier, status, and sanitized command form or observation;
- request-context classifications, carrier class, preparation status, failure category, and bounded retry/recovery action;
- repository-relative test/source paths, known unrelated failure reason, blocked or unverified proof, and correction/supersession references.

Forbidden record content:

- concrete URLs, hosts, resource IDs, query or body values, raw requests or responses, headers, cookies, tokens, credentials, secret-reference paths, personal data, stack traces, and opaque identifiers;
- dynamic revisions, ETags, timestamps, nonces, signatures, CSRF values, and response-derived identifiers;
- original command lines that contain any forbidden content.

A sanitized command form may retain the executable name, non-secret flags, path template, and placeholders. It must omit secret/config paths, headers, cookies, concrete values, private hosts, and opaque IDs. If safe summarization is impossible, mark evidence blocked and do not write a success claim.

## Record Template

```markdown
---
type: api-verification-record
status: completed
validationId: <timestamp-topic>
date: YYYY-MM-DD
topic: <sanitized-topic>
---

# API Verification: <sanitized topic>

## Scope

- Changed source: `<repository-relative path>`
- Contract source: `<repository-relative path>`
- Source precedence: OpenAPI/Swagger | controller/DTO/handler
- Excluded endpoints: `<method path template - reason>` or none

## Endpoints

| Method | Path template | Operation reference | Classification | Coverage status |
| --- | --- | --- | --- | --- |
| `<METHOD>` | `<path template>` | `<operation or symbol>` | read-only | covered |

## Request Context

| Location | Name | Requiredness | Classification | Provider | Lifetime | Header category or omission |
| --- | --- | --- | --- | --- | --- | --- |
| header | `<sanitized name>` | required | user-controlled opaque secret | opaque file reference | request | authentication |

## Carrier

- Kind: project-runner | single-request-curl | blocked
- Source: `<repository-relative runner or template path>`
- Coverage: `<METHOD> <path template> — <repository-relative assertion source>`
- Preparation status: ready | blocked

## Outcome

- Failure category: passed | request-context | client-config | transport | auth | business
- Retry hypothesis: `<sanitized>` or none

## Field Summary

| Direction | Status class or location | Name | Type or schema reference | Requiredness | Semantic constraint | Source kind | Source path |
| --- | --- | --- | --- | --- | --- | --- | --- |
| request | query | `<field>` | `<type>` | required | `<sanitized constraint>` | OpenAPI | `<path>` |
| response | 2xx | `<field>` | `<type>` | required | `<sanitized meaning>` | DTO | `<path>` |

## Evidence

| Tier | Status | Operation classification | Sanitized command or observation | Expected signal | Actual signal | Boundary |
| --- | --- | --- | --- | --- | --- | --- |
| focused automated test | passed | read-only | `<test command or observation>` | `<summary>` | `<summary>` | does not prove runtime |

## Conditional Evidence

- Fixture class: `<synthetic class>` or not-applicable
- Read-back assertion: `<sanitized summary>` or not-applicable
- Authorization reference status: present | not-required | blocked; never include a path or value
- Known unrelated failures: none or `<sanitized reason>`

## Gaps And Corrections

- Blocked or unverified proof: none or `<tier and reason>`
- Contract contradiction: none or `<sanitized source conflict>`
- Supersedes: none or `<earlier record path>`
```

## Knowledge Curation

Do not add ordinary records to `docs/08-ai-memory/00-registry.json` or a source graph. Curate a relation only when all conditions hold:

1. The user explicitly requests durable API knowledge.
2. The relationship is stable and cross-module, not a per-run result.
3. A sanitized Markdown knowledge record identifies the durable contract role.
4. The declared relation has a repository-relative evidence path.
5. The record contains no forbidden content from this reference.

The curated Markdown record remains authoritative. The existing knowledge map exposes declared document relations only; source graph output stays shallow and read-only.
