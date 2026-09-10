---
type: prd
status: drafted
date: 2026-09-04
topic: codex-context-continuity
format: human-readable-requirements
sharded: false
---

# Codex Context Continuity

## AI Parse Contract

- canonicalKind: requirements
- humanEquivalent: true
- stableIdsRequired: true
- noImplicitScope: true

## Problem Frame

Long-running engineering conversations can approach a context limit before a task is complete. Current AE guidance can write task handoffs and recover from an already-compacted conversation, but it cannot itself observe context capacity, create a Codex successor conversation, inject continuation content, or archive the source conversation. The desired outcome is automatic, loss-aware continuation only where the active Codex provider can prove those lifecycle operations are supported.

## Requirements

**Capability And Activation**

- R1. Context continuity must be disabled by default and activate only when an explicitly configured provider verifies an impending-context signal, successor creation, continuation injection with acknowledgement, and source-thread archival.
  Acceptance: an unsupported, absent, invalid, or incomplete provider leaves all current skills and projects on their existing behavior and reports `disabled` or `unavailable` without attempting UI automation.
- R2. The feature must be opt-in per project/profile and must expose its effective state before it attempts a rotation.
  Acceptance: a user or operator can determine whether automatic rotation is unavailable, disabled, waiting for a safe checkpoint, progressing, partial, or failed from the task-local continuity record.

**Safe Continuation**

- R3. A rotation may occur only at a safe checkpoint after active shell command, tool/browser action, and delegated work has reached an observable terminal state.
  Acceptance: the coordinator does not cancel, restart, duplicate, or silently abandon active work merely because context is low.
- R4. The checkpoint must preserve the minimum task continuation state: task goal, current plan/unit, changed-file summary, completed and pending validation, decisions, blockers, next action, relevant repository-relative artifact paths, and a rotation identifier.
  Acceptance: a fresh successor can resume the task from the checkpoint without relying on a full transcript or private reasoning.
- R5. Checkpoint and recovery artifacts must be task-local, redacted, and idempotent.
  Acceptance: they do not contain secrets, raw credential material, private tool payloads, or copied transcripts; retrying the same rotation identifier does not create ambiguous successor or source-archive states.
- R6. The lifecycle order is `checkpoint -> create successor -> inject continuation -> verify successor -> archive source`.
  Acceptance: source archival is attempted only after successor creation and continuation acknowledgement; an archive failure is recorded as `partial`, not `source-archived`.

**Compatibility And Boundaries**

- R7. When enabled, the automatic trigger path applies only to execution-oriented workflows that already own active task state: `ae-work`, `ae-lfg`, `ae-task-loop`, `ae-debug`, and `ae-tdd`; `ae-handoff` is a recovery consumer and manual fallback, not an automatic trigger.
  Acceptance: only the five execution workflows can request a provider rotation at a verified host safe point; `ae-handoff` can render/recover the checkpoint without starting automatic rotation.
- R8. Requirements and review workflows remain unaffected unless they explicitly opt into the continuity contract.
  Acceptance: `ae-ideate`, `ae-brainstorm`, `ae-prd`, `ae-design`, `ae-plan`, and ordinary `ae-review` neither create rotation state nor archive conversations.
- R9. Context rotation must remain distinct from task completion, worktree transfer, and process-note retention.
  Acceptance: `tidy` never archives an active task only because a conversation rotated; existing completed/stale archive rules continue to govern process artifacts.
- R10. Automatic rotation must have a callable host lifecycle entry point that delivers the impending-context signal and invokes the coordinator after the current operation reaches a safe point.
  Acceptance: documentation or a manually runnable AE command alone cannot satisfy automatic-rotation acceptance; without this host entry point the feature remains `unavailable` and no execution-skill edit is treated as an automatic trigger.

## Non-Functional Requirements

- NFR1. The feature must not depend on screen scraping, simulated clicks, a background daemon, forced command interruption, transcript persistence, or claims of cross-client synchronization.
  Acceptance: implementation and documentation contain no unsupported Codex UI-driving mechanism or claim.
- NFR2. Continuity records must be recoverable after a provider/network failure while remaining small enough for an incoming context.
  Acceptance: recovery operates from the structured task-local record plus existing handoff/ledger artifacts; missing provider confirmation produces a bounded failure state and manual recovery instruction.
- NFR3. Capability and lifecycle claims require evidence from the active official Codex interface, not inference from AGENTS.md, skills, or APIs with a different product boundary.
  Acceptance: release documentation labels automatic rotation `unavailable` until capability audit proves the four R1 operations for the actual target interface.

## Must-Haves

- Requirement ID: R1
  Must-have completion condition: no provider adapter or enabled setting can execute automatic rotation without all four verified lifecycle capabilities.
- Requirement ID: R6
  Must-have completion condition: no successful-state record exists until the successor acknowledges continuation; source archive failure is visibly recoverable.

## Success Criteria

- Existing workflows behave identically under the default configuration.
- A supported future provider can continue an eligible task without losing task-local state or archiving the source prematurely.
- An unsupported provider produces a truthful local checkpoint/recovery path rather than a simulated automatic handoff.

## Scope Boundary

### In Scope

- A provider-neutral continuity contract, profile/configuration shape, task-local checkpoint/recovery record, selected execution-skill integration, deterministic tests, and capability evidence requirements.

### Out Of Scope

- Modifying Codex desktop, its service, account-level thread history, or context limits.
- UI automation, transcript backups, background monitoring, forcing a tool to stop, and automatic transfer across Codex clients/accounts.
- Replacing existing handoff, process archive, memory, worktree, or task-completion rules.

### Constraints

- `AGENTS.md` remains instruction context, not a lifecycle hook.
- The target repository's plugin source and `.ae-source` maintenance mirror must remain synchronized for any later distributable change; no matching `.ae-source` mirror is currently present in this checkout.
- No automatic behavior is released until Q1 and Q2 have evidence.

## Validation Evidence

| Requirement | Applicable tier | Expected signal and bounded claim | Preconditions | Status |
| --- | --- | --- | --- | --- |
| R1, R6, NFR3 | official-provider capability | Official current interface documents and exposes all four operations for the target Codex surface. | U1 audit: `docs/ae/evidence/artifacts/codex-context-continuity-capability-audit-2026-09-04.md`. | unavailable |
| R2-R10, NFR1-NFR2 | static/focused integration | Profile parsing, state transitions, redaction, safe-point logic, and eligible-skill routing pass deterministic tests. | Repository implementation and callable host boundary exist. | pending |
| Real thread rotation | runtime acceptance | A real supported provider creates, acknowledges, and archives in the declared order. | Q1/Q2 resolved; isolated test thread. | blocked |

## Perspective Collision

- Critic: automatic lifecycle control can lose work or make unsupported behavior look reliable.
- Pragmatist: task-local handoff and recovery reduce loss even before true automatic rotation exists.
- Innovator: a provider-neutral adapter permits future platform support without binding the workflow to UI automation.
- Systems: safe points, idempotency, archive ordering, and source-of-truth artifacts must agree across skills and process retention.
- Disagreements: operation availability is a fact question; automatic versus manual fallback is a value/risk decision; source archival before successor acknowledgement is an unsafe assumption.
- Collision insight: provider gating turns the reliability objection into a release gate while preserving a useful local recovery improvement.
- Blind spot: account/team retention policy and future official API scope may alter whether source archival is permitted.
- Thinking preservation zone: operators decide when to opt in, trusted provider scopes, and partial-archive retry policy.

## Key Decisions

- D1. Automatic rotation is conditional on a verified provider; the baseline release is default-off and must not impersonate Codex UI control.
  Reason: AGENTS.md and skills cannot invoke conversation lifecycle operations.
- D2. Preserve a compact, task-local continuation record rather than the full conversation transcript.
  Reason: it bounds incoming-context cost and reduces privacy and secret-retention risk.
- D3. Successor verification precedes source archival.
  Reason: a source thread is recoverable until a successor proves it received the continuation.

## Dependencies And Assumptions

### Dependencies

- A current official Codex lifecycle surface or provider adapter that can demonstrate R1 operations.
- Existing task artifacts: `docs/00-process/active/<task>/progress.md`, `ledger.jsonl`, and `handoff.md` when present.
- Existing source/mirror, artifact, and release validation tools.

### Assumptions

- The current Codex desktop session does not expose a verified public interface for programmatic successor creation and source archival.
- Existing `ae-handoff` content is sufficient as a source for a compact continuation summary after redaction and task-state reconciliation.

## Open Questions

### Must Resolve Before Planning

- None. The plan may implement provider-independent local recovery while U1 blocks provider-specific automation.

### Must Resolve Before Automatic Implementation

- Q1. [Affects R1, R6, R10, NFR3][official capability] Which official Codex interface, version, and authorization model exposes an impending-context signal, a callable coordinator entry point, successor creation, continuation acknowledgement, and non-destructive source archival?
- Q2. [Affects R6, R9][official semantics] Does source archival preserve recoverable conversation history and how does it behave under retries, account retention, and failure?

### Deferred To Planning

- Q3. [Affects R2, R5][configuration] Is the project profile the final opt-in surface, or is a separate task-scoped flag needed for an operator to enable a verified provider?

## Evidence Notes

- `AGENTS.md` defines instruction and task-mode rules but no callable lifecycle hook.
- `plugins/ai-agent-engine-codex/skills/ae-handoff/SKILL.md` already defines durable continuation handoffs.
- `plugins/ai-agent-engine-codex/skills/ae-work/SKILL.md` already requires ledger reconciliation after context compaction.
- `plugins/ai-agent-engine-codex/scripts/ae-tools/tidy.mjs` archives completed/stale process notes conservatively and has no conversation lifecycle behavior.
- U1 on 2026-09-04 found only a local bundled declaration of several thread-operation names; the current session did not expose the declared creation/injection operations, and no official evidence established a near-context signal, safe-point callback, acknowledgement, or recoverable archive semantics. Automatic rotation is therefore unavailable. See docs/ae/evidence/artifacts/codex-context-continuity-capability-audit-2026-09-04.md.

## Consistency Check

- requirementsCount: 10
- nonFunctionalRequirementsCount: 3
- decisionsCount: 3
- openQuestionsCount: 3
