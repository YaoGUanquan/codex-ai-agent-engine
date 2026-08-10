---
type: prd
status: review-passed
date: 2026-08-10
topic: api-smoke-fillable-request-config
format: human-readable-requirements
sharded: false
origin: docs/ae/prds/2026-07-24-002-local-runtime-smoke-secret-handoff-prd.md
originFingerprint: 2026-07-24-local-runtime-smoke-secret-handoff
---

# PRD: API Smoke Fillable Request Config

## AI Parse Contract

- canonicalKind: requirements
- humanEquivalent: true
- stableIdsRequired: true
- noImplicitScope: true

## Problem Frame

Authenticated `ae-test-api` smoke already requires a token-free local handoff, but agents sometimes create empty config files or write non-ASCII content through Windows PowerShell redirection. Users then do not know what to fill, and Chinese comments may appear corrupted even when the intended contract is correct.

## Requirements

- R1. When an authenticated local smoke lacks a credential reference, the workflow must create a non-empty fillable request template rather than an empty file.
  Acceptance: the template includes method, URL or path, non-secret headers or fixture settings, numbered fill steps, and exactly one `REPLACE_WITH_LOCAL_TOKEN` placeholder.
- R2. The template shape must be owned by a shared reference under the local-runtime smoke gate, and `ae-test-api` must route to that reference without forking the safety contract.
  Acceptance: source and mirror contain `request-config-template.md`, and both the gate and `ae-test-api` cite it.
- R3. Template files that include non-ASCII text must be written as UTF-8 without BOM through a UTF-8-safe writer.
  Acceptance: the shared reference forbids PowerShell `Out-File`, default `Set-Content`, and shell redirection for this handoff file.
- R4. After handoff, the agent still must not open, read, write, print, validate, archive, move, or delete the user-populated reference.
  Acceptance: existing no-inspection and sanitized-archive boundaries remain intact.

## Non-Functional Requirements

- NFR1. Do not add a default HTTP client, secret manager, or automatic credential intake.
- NFR2. Plugin source and `.agents` mirror must stay synchronized and regression-tested.

## Success Criteria

- A user receives a ready-to-edit local template, replaces only the token placeholder, confirms readiness in chat, and never pastes the token into the conversation.
- Empty handoff files and unsafe encoding writes are rejected by the workflow contract and regression tests.

## Scope Boundary

### In Scope

- Shared smoke-gate reference, `ae-test-api` routing text, regression coverage, release notes, durable memory, and declared knowledge relations.

### Out Of Scope

- Deterministic template-generator scripts, target-service changes, live authenticated execution in this repository, and marketplace/global-install work.

## Key Decisions

- D1. Prefer a shared fillable template reference over a new generator script.
  Reason: it closes the empty-file and encoding gaps without expanding runtime surface area.
- D2. Keep one credential placeholder token string: `REPLACE_WITH_LOCAL_TOKEN`.
  Reason: users and agents share one obvious edit target.

## Consistency Check

- requirementsCount: 4
- nonFunctionalRequirementsCount: 2
- decisionsCount: 2
- openQuestionsCount: 0
