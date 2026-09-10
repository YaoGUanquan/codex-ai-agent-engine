---
type: design
status: drafted
date: 2026-09-04
title: codex-context-continuity
origin: docs/ae/prds/2026-09-04-codex-context-continuity-prd.md
originFingerprint: 2026-09-04-codex-context-continuity
format: human-readable-design
sharded: false
---

# Design: Codex Context Continuity

## Source

- `docs/ae/prds/2026-09-04-codex-context-continuity-prd.md`

## AI Parse Contract

- canonicalKind: design
- humanEquivalent: true
- stableIdsRequired: true
- noImplicitScope: true

## Split Manifest

- mode: unified
- root: docs/ae/designs/codex-context-continuity-2026-09-04
- files:
  - design.md

## Overview

- Goal: create a default-off, provider-gated continuity contract that safely creates a task checkpoint and only rotates a Codex conversation when the active host/provider proves the complete lifecycle.
- Source requirements: R1-R10, NFR1-NFR3.
- Required dimensions: overview, architecture, api, database, security, observability, non-functional, test-cases.
- Explicit omitted dimensions: ui-ux: explicitly-omitted because this change has no product UI; operator visibility is task-artifact output, not a graphical surface.
- Cross-dimension dependencies: a verified host lifecycle signal selects a provider; coordinator writes T-001; provider operations progress the state machine; only verified successor acknowledgement permits source archival.

## Existing Project Evidence

- mode: inspected
- bypass reason: none

| Evidence category | Repository-relative inputs | Sanitized conclusion | Confidence |
| --- | --- | --- | --- |
| stack and commands | `package.json`, `scripts/check-design-contract.mjs`, `scripts/check-ae-artifacts.mjs` | Node-based plugin has deterministic document-contract checks. | verified |
| structure and conventions | `plugins/ai-agent-engine-codex/skills/ae-handoff/SKILL.md`, `plugins/ai-agent-engine-codex/skills/ae-work/SKILL.md`, `plugins/ai-agent-engine-codex/scripts/ae-tools/tidy.mjs` | Handoff and task artifacts are existing recovery boundaries; archival is conservative. | verified |
| reusable assets | `.codex/ae-skill-profiles.yaml`, `plugins/ai-agent-engine-codex/scripts/ae-tools/tasks.mjs`, `docs/ae/references/codex-five-layer-architecture.md` | Profile parsing and five-layer boundaries can host a default-off coordinator, but this checkout has no `.ae-source` mirror and no host lifecycle hook. | verified |

## Implementation Constraints

- Repository paths: plugin source is canonical; any changed skill must retain its matching `.ae-source/skills` mirror.
- Runtime/build commands: `node scripts/check-design-contract.mjs`, `node scripts/check-ae-artifacts.mjs`, focused Node tests, `git diff --check`.
- Environment variables: none for provider-independent behavior; a later adapter must declare any official credential/authorization surface without storing secrets.
- Dependency boundaries: no UI automation package, daemon, headless browser, transcript store, or unverified Codex client dependency.
- Feature flags/configuration: disabled by default; provider name, capability evidence, and host lifecycle entry point are explicit opt-in/precondition fields.
- Rollback constraints: disabling configuration leaves task artifacts intact; no source conversation is archived before verified continuation.

## Decisions

### ADR-001 - Provider gate before automatic lifecycle action

- Decision: expose a provider-neutral contract, but ship no automatic rotation until all four R1 capabilities are verified against the exact Codex surface.
- Drivers: R1, R6, NFR1, NFR3.
- Alternatives: infer behavior from AGENTS.md; automate the desktop UI; use a different OpenAI API as proof.
- Consequences: local checkpoint/recovery can ship independently; a provider adapter remains blocked by Q1 and Q2.
- Supersedes: none.

### ADR-002 - Compact task-local state is canonical

- Decision: use a mutable task-local continuation record linked to existing progress, ledger, and handoff artifacts instead of storing a transcript.
- Drivers: R4, R5, NFR2.
- Alternatives: full transcript archive; no local state; central persistent service.
- Consequences: a successor receives concise, redacted continuation content; recovery can continue manually when provider actions fail.
- Supersedes: none.

### ADR-003 - Successor-first archival ordering

- Decision: treat `source-archived` as reachable only after a verified successor acknowledgement; archive errors retain `partial` state.
- Drivers: R3, R6, R9.
- Alternatives: archive source immediately after checkpoint; mark source archival as non-critical success.
- Consequences: retry logic must be idempotent by rotation ID and preserve an operator-recoverable source reference.
- Supersedes: none.

### ADR-004 - Host lifecycle entry point is mandatory

- Decision: a skill instruction or manually runnable `ae-tools` command is never treated as the automatic context trigger; automatic rotation remains unavailable until the host supplies an impending-context event and a safe invocation point.
- Drivers: R1, R7, R8, R10, NFR1, NFR3.
- Alternatives: poll from a script, infer context pressure from token count, or trigger from each skill turn.
- Consequences: U2/U3 cannot be implemented as automatic behavior from the current repository alone; they require positive U1 evidence for a host integration boundary.
- Supersedes: none.

## Mapping Tables

### api-field-to-database-column-mapping

| EP ID | API field | T ID | Data field | Notes |
| --- | --- | --- | --- | --- |
| EP-001 | `taskId`, `provider`, `rotationId`, `state` | T-001 | `task_id`, `provider`, `rotation_id`, `state` | Provider-neutral state transition request. |
| EP-002 | `continuation`, `rotationId` | T-001 | `continuation_digest`, `successor_ref` | Content is redacted and digest-bound. |
| EP-003 | `rotationId`, `sourceRef` | T-001 | `source_ref`, `archive_result` | Available only after EP-002 acknowledgement. |

### api-error-to-ui-state-mapping

| EP ID | Error/status | ST ID | UI state | User-visible behavior |
| --- | --- | --- | --- | --- |
| N/A | N/A | N/A | N/A | No graphical UI is in scope; status is exposed through task artifacts and existing workflow output. |

### test-case-to-contract-coverage

| TC ID | Scenario | Covered IDs | Verification signal |
| --- | --- | --- | --- |
| TC-001 | Default profile has no rotation action. | ADR-001, R1, R8 | No provider call or continuity state mutation. |
| TC-002 | Active work blocks checkpoint. | ADR-003, R3 | State remains waiting; work receives no cancel/duplicate action. |
| TC-003 | Checkpoint redaction and idempotency. | ADR-002, R4, R5, T-001 | Record excludes prohibited fields and repeat rotation ID is stable. |
| TC-004 | Verified provider follows successor-first sequence. | ADR-001, ADR-003, EP-001-EP-003 | Ordered invocation and final `source-archived` state. |
| TC-005 | Source archive failure is recoverable. | ADR-003, R6 | Successor reference and retry data remain; state is `partial`. |
| TC-006 | Eligible skills route while ideation/review remain inert. | R7, R8 | Route tests show only declared execution skills use coordinator. |

### Test Coverage Matrix

| TC ID | Scenario | Design method | Covered IDs | Automatable verification signal |
| --- | --- | --- | --- | --- |
| TC-001 | Disabled or unavailable provider | decision-table | R1, R2 | No lifecycle adapter call and declared state. |
| TC-002 | Active command/tool/delegation | state-transition | R3 | Checkpoint waits until all activity flags are terminal. |
| TC-003 | Redacted checkpoint and repeat retry | equivalence-class | R4, R5, T-001 | Required fields kept; prohibited fields rejected; one rotation ID. |
| TC-004 | Normal provider lifecycle | state-transition | R1, R6, EP-001, EP-002, EP-003 | Ordered event trace ends at `source-archived`. |
| TC-005 | Archive failure after acknowledgement | error-guessing | R6, NFR2 | `partial` with a recoverable retry instruction. |
| TC-006 | Skill eligibility boundary | decision-table | R7, R8 | Only named execution skills request continuity. |

### Test-Case Quality Rules

- Every test asserts a state, event order, or durable record rather than internal implementation detail.
- Provider-runtime acceptance remains blocked until Q1/Q2 are resolved; mocked provider tests do not prove Codex desktop support.

### ui-component-to-api-endpoint-mapping

| Component/route | ST ID | EP ID | Data dependency |
| --- | --- | --- | --- |
| N/A | N/A | N/A | No graphical UI is in scope. |

## Architecture

The coordinator belongs in the Guardrail layer. It consumes a project profile and task activity facts, writes T-001 beside the active task artifacts, and calls a provider adapter only after its capability declaration is complete. A host lifecycle entry point must supply the impending-context signal and invoke the coordinator after the current operation is terminal; skill instructions alone cannot provide that trigger. The five execution skills may become callers only after the host boundary is verified; `ae-handoff` remains the human-readable recovery consumer. The Distribution layer only ships docs/config/schema after source/mirror checks. `AGENTS.md` remains in the Memory layer and provides no trigger or transport.

State transitions are: `disabled` or `unavailable` -> `waiting-for-safe-checkpoint` -> `checkpointed` -> `successor-created` -> `source-archived`. A successor injection/acknowledgement occurs between `successor-created` and `source-archived`; any post-checkpoint error becomes `failed`, except source archive failure after acknowledgement, which becomes `partial`. If the host lifecycle entry point is absent, the state cannot leave `unavailable` for automatic rotation.

## API

### EP-001 - Capability and checkpoint request

- Input: task identifier, declared provider, rotation identifier, safe-point activity snapshot.
- Output: declared state plus either a redacted checkpoint reference or a no-op reason.
- Contract: reject automatic action unless the host entry point and all provider capabilities are verified and activity is terminal. A direct manual command may only produce a local recovery artifact, never an automatic rotation.

### EP-002 - Create successor and inject continuation

- Input: verified provider, rotation identifier, redacted continuation payload, source reference.
- Output: successor reference and acknowledgement proof bound to the same rotation identifier.
- Contract: a provider failure leaves source unarchived and writes `failed` with recovery metadata.

### EP-003 - Archive verified source

- Input: rotation identifier, source reference, successor acknowledgement proof.
- Output: archive result.
- Contract: an archive error writes `partial`; it never rewrites an unverified successor into success.

## Database

### T-001 - Task continuation record

- Lifecycle: mutable aggregate scoped under `docs/00-process/active/<task>/`.
- Primary key and external exposure: `rotation_id` is an opaque local id; no external product API exposure. `task_id + rotation_id` must be unique.
- Audit ownership: local coordinator records timestamp and actor class (`system` or explicit operator), never credentials.
- Deletion and retention: kept with the active task; ordinary process retention controls archival after task completion. Rotation alone is not a retention trigger.
- Concurrency: single active coordinator per task; optimistic compare-and-set on state/revision. A version conflict returns `failed` without lifecycle action.
- Enum representation: stable string states `disabled`, `unavailable`, `waiting-for-safe-checkpoint`, `checkpointed`, `successor-created`, `source-archived`, `partial`, `failed`; unknown state is rejected.
- Constraints/indexes: one active record per task; one successor reference per rotation ID; acknowledgement required before source archive request.
- Migration/rollback: new file/schema is additive; disable provider and retain record for recovery; no database migration or application data rollback applies.

## UI/UX

Explicitly omitted: no graphical interface or browser interaction is part of the design. Status is exposed through task-local structured artifacts and existing workflow output.

## Test Cases

### TC-001 - Default-off provider gate

- Priority: high
- Preconditions: profile missing, disabled, invalid, or provider capabilities incomplete.
- Steps: invoke eligible skill checkpoint boundary.
- Expected result: no conversation lifecycle operation occurs; the state is `disabled` or `unavailable` with a manual recovery reference.
- Covered IDs: R1, R2, R8, NFR1.

### TC-002 - Safe checkpoint waits for terminal work

- Priority: high
- Preconditions: an active command, browser/tool activity, or delegated task is represented as non-terminal.
- Steps: request a rotation, then mark all activity terminal and request/retry at the safe checkpoint.
- Expected result: first request remains `waiting-for-safe-checkpoint`; no cancellation occurs; only the terminal request writes a checkpoint.
- Covered IDs: R3, R6.

### TC-003 - Checkpoint redaction and idempotency

- Priority: high
- Preconditions: active task has progress/ledger/handoff material including an intentionally prohibited field fixture.
- Steps: build a checkpoint twice with the same rotation identifier.
- Expected result: required continuation facts remain, prohibited fixture is absent, and both requests resolve to the same record without duplicate successor action.
- Covered IDs: R4, R5, NFR2, T-001.

### TC-004 - Ordered provider lifecycle

- Priority: high
- Preconditions: test provider declares and simulates all required capabilities; safe checkpoint is terminal.
- Steps: request rotation.
- Expected result: trace is checkpoint, successor creation, injection/acknowledgement, source archive; final state is `source-archived`.
- Covered IDs: R1, R6, EP-001, EP-002, EP-003.

### TC-005 - Source archive partial recovery

- Priority: high
- Preconditions: successor acknowledgement succeeds and source archive fails.
- Steps: request rotation then retry source archive with the same rotation identifier.
- Expected result: initial record is `partial` with successor/source references; retry does not create another successor and may advance only when archive confirmation is observed.
- Covered IDs: R5, R6, R9, NFR2.

### TC-006 - Skill routing boundary

- Priority: medium
- Preconditions: enabled profile and eligible/ineligible skill fixtures.
- Steps: inspect/invoke declared checkpoints.
- Expected result: only `ae-work`, `ae-lfg`, `ae-task-loop`, `ae-debug`, and `ae-tdd` can request automatic continuity; `ae-handoff` only renders or recovers the record; ideation, requirement, design, planning, and ordinary review do not create rotation state.
- Covered IDs: R7, R8.

## Security

- Continuation content follows existing handoff secret rules: no tokens, cookies, credentials, private tool payloads, or full transcripts.
- The absence of a host lifecycle entry point is a capability failure, not a reason to add polling, token estimation, or per-turn script invocation.
- A provider adapter receives only the minimum redacted continuation payload and the provider-specific authorization mechanism must remain outside repository artifacts.
- Source reference, successor reference, and rotation ID are opaque metadata; logs must not expose private conversation contents.
- Capability declarations are allowlisted and verified; a profile value alone cannot authorize lifecycle actions.

## Observability

- Emit structured, sanitized state transitions with task ID, rotation ID, provider name, state, timestamp, and failure category.
- Record provider capability evidence separately from a provider's configured name.
- Track safe-point deferrals, successor acknowledgement failures, archive failures, retries, and manual recovery selection without transcript content.
- A final status must distinguish `source-archived`, `partial`, and `failed`; `partial` is never normalized to success by cleanup.

## Non-Functional

- Default path is a no-op except bounded inspection of explicit profile/task state.
- The record remains compact and references existing artifacts by repository-relative path rather than copying their contents.
- Provider calls are serialized per task and retry only idempotent steps; no polling daemon is permitted.
- Official runtime acceptance is an explicit separate evidence tier; mock tests prove coordinator behavior only.

## Consistency Check

- requiredDimensionsCovered: overview, architecture, api, database, security, observability, non-functional, test-cases
- omittedDimensionsJustified: ui-ux is not triggered
- stableIdsUnique: yes
- mappingTablesComplete: yes
- sourceScopePreserved: yes
- reviewStatus: pending
