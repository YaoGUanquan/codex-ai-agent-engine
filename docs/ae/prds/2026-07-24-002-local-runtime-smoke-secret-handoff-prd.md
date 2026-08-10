---
type: prd
status: review-passed
date: 2026-07-24
topic: local-runtime-smoke-secret-handoff
format: human-readable-requirements
sharded: false
origin: docs/ae/prds/2026-07-24-local-runtime-smoke-gate-prd.md
originFingerprint: 2026-07-24-local-runtime-smoke-gate
---

# PRD: Local Runtime Smoke Secret Handoff

## AI Parse Contract

- canonicalKind: requirements
- humanEquivalent: true
- stableIdsRequired: true
- noImplicitScope: true

## Problem Frame

An authenticated local smoke may need a short-lived token. The user wants the test flow to prepare a local place to enter that token without pasting it into the conversation or asking the agent to create a secret-bearing file. The next action must remain deterministic after the user marks the local reference ready.

## Requirements

- R1. When an authenticated local smoke lacks a credential reference, the workflow must create a token-free request template in a verified ignored project path or the operating-system temporary directory and report its absolute path.
  Acceptance: the source and mirror gate both require automatic template creation, a credential placeholder, and an absolute-path handoff. Follow-up hardening (2026-08-10) requires the template to be non-empty, UTF-8 without BOM, and shaped by `request-config-template.md` with `REPLACE_WITH_LOCAL_TOKEN`.
- R2. The user must populate the template locally and explicitly confirm readiness before an authenticated request is sent.
  Acceptance: the workflow does not request a raw credential in chat or continue before the readiness confirmation.
- R3. After the local handoff, the workflow must invoke the HTTP client by reference only and must not inspect, print, validate, archive, move, or delete the populated reference.
  Acceptance: the gate prohibits opening or reading the populated reference and allows only its path to be supplied to a non-echoing client option.
- R4. The completed smoke must archive only sanitized route, operation class, status, expected signal, actual signal, and unverified scope.
  Acceptance: the gate explicitly excludes credentials, headers, configuration contents, and the reference path from archived evidence.

## Non-Functional Requirements

- NFR1. The workflow must not claim a Codex secret store, direct chat-token transport, automatic credential rotation, or unattended access.
  Acceptance: the guidance remains a user-mediated local handoff with explicit capability limits.
- NFR2. The plugin source and project-local mirror must stay synchronized and regression-tested.
  Acceptance: focused contract tests, mirror checks, installation smoke, full tests, and static checks pass.

## Success Criteria

- A user can receive a safe local template path, fill a short-lived token locally, then obtain an automatic bounded smoke and sanitized archive.
- No workflow artifact, command text, or report contains the token or the populated template contents.

## Scope Boundary

### In Scope

- The shared local-runtime smoke gate and its source/mirror regression contract.
- Requirement and plan evidence for the user-mediated local handoff.

### Out Of Scope

- Reading a populated credential file, copying chat tokens, introducing a secret manager, or changing a target service.

### Constraints

- Preserve the existing `.opencode/` and `ae/` local-output ignore policy.
- Keep the template target-specific and create it only when an authenticated smoke is actually requested.

## Key Decisions

- D1. The agent creates only a token-free template; the user supplies the secret locally.
  Reason: it removes repeated setup work without moving a credential through the chat or agent file-write path.
- D2. The HTTP client receives only the template path after user confirmation.
  Reason: the client can consume the configuration while the agent avoids inspecting its contents.

## Dependencies And Assumptions

### Dependencies

- The target provides a bounded smoke route, expected signal, and a verified ignored path or an available operating-system temporary directory.

### Assumptions

- The selected HTTP client supports passing a configuration reference without printing its content.

## Open Questions

- None.

## Evidence Notes

- Existing local-runtime smoke gate -> establishes shared trigger, request classification, failure handling, and sanitized archival.
- User-confirmed workflow -> local template handoff is preferred over persistent project secrets or chat-token transfer.

## Consistency Check

- requirementsCount: 4
- nonFunctionalRequirementsCount: 2
- decisionsCount: 2
- openQuestionsCount: 0
