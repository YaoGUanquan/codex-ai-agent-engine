---
type: plan
status: drafted
date: 2026-09-04
title: codex-context-continuity
origin: docs/ae/prds/2026-09-04-codex-context-continuity-prd.md
originFingerprint: 2026-09-04-codex-context-continuity
depth: deep
format: human-readable-plan
sharded: false
---

# Plan: Codex Context Continuity

## Source

- `docs/ae/prds/2026-09-04-codex-context-continuity-prd.md`
- `docs/ae/designs/codex-context-continuity-2026-09-04/design.md`

## AI Parse Contract

- canonicalKind: plan
- humanEquivalent: true
- stableIdsRequired: true
- noImplicitScope: true

## Scope

Audit and, only if the host exposes the required lifecycle boundary, add a default-off, provider-neutral task-continuity coordinator and conditional provider adapter. The current repository has no context event or thread-lifecycle entry point, so this plan is ready for U1 only; U2-U4 are gated and must not be started as if they provide automatic behavior.

## Readiness

- Goal: preserve eligible long-running task state at safe checkpoints and automatically continue only through a verified Codex lifecycle provider.
- Acceptance criteria: R1-R10 and NFR1-NFR3 from the source PRD.
- Non-goals: Codex desktop modification, UI automation, transcript persistence, daemon/polling, forced interruption, cross-client transfer, and change to task archival semantics.
- Affected areas: capability evidence first; profile/task tools and execution-oriented skills only after a callable host boundary is proven; source/mirror tests and distribution metadata only for implemented behavior.
- Validation surface: official provider evidence, unit tests, skill/document contract checks, source/mirror checks, optional isolated runtime acceptance.
- Open questions: Q1-Q3; Q1 blocks U2-U4, Q2 blocks source archival, and Q3 blocks the final opt-in surface.

## Validation Evidence

| Acceptance criterion | Applicable tier | Expected signal and bounded claim | Preconditions / owner | Status | Recovery or rollback signal |
| --- | --- | --- | --- | --- | --- |
| R1, R6, R10, NFR3 | official-provider and host audit | Exact Codex interface exposes an impending-context signal, callable safe-point entry, successor creation, injected acknowledgement, and source archive semantics. | U1 evidence: `docs/ae/evidence/artifacts/codex-context-continuity-capability-audit-2026-09-04.md`. | unavailable | Keep all automatic behavior unavailable and default-off. |
| R2-R9, NFR1-NFR2 | static/focused tests | Profile, state machine, redaction, idempotency, safe-point and skill eligibility satisfy deterministic tests after host boundary approval. | U1 positive; U2-U3. | blocked | Do not add trigger-like skill edits; retain existing handoff path. |
| R6 real lifecycle | runtime acceptance | Isolated provider run observes checkpoint, successor acknowledgement, then source archive. | U1 passed; isolated thread; U4. | blocked | Mark partial/failed; retain source/successor references. |

## Verification Gaps

- Affected requirement ID: R1, R6, NFR3
  Required proof and missing check: official Codex desktop lifecycle surface and non-destructive archive semantics.
  Status: unavailable after U1 on 2026-09-04.
  Owner and next action: rerun U1 only after a documented, active Codex Desktop interface exposes the missing lifecycle operations; U2-U4 remain skipped.

- Affected requirement ID: R10
  Required proof and missing check: a host event/invocation boundary that can call the coordinator when context is near exhaustion and after active work is safe.
  Status: unavailable after U1 on 2026-09-04.
  Owner and next action: no implementation is permitted without the host event; do not add polling or per-turn calls.

## Assumptions

- The existing active task directory is the correct local state boundary.
- `ae-handoff` plus progress/ledger reconciliation provides sufficient inputs for a compact redacted checkpoint.
- Current documented API conversation primitives cannot be used as evidence for the Codex desktop thread lifecycle without explicit interface proof.

## Alternatives Considered

- Recommended: provider-gated coordinator plus compact local recovery record.
- Alternative: encode automatic rotation in `AGENTS.md`; rejected because instructions do not run lifecycle code or control Codex threads.
- Alternative: screen-drive Codex desktop; rejected because it is brittle, unsafe, unsupported, and violates NFR1.
- Alternative: manual handoff only; rejected as the sole outcome because it does not provide idempotent safe-checkpoint recovery or a future provider seam.

## Decision Drivers

- Driver 1: prevent loss or duplicate work at a context boundary.
- Driver 2: preserve current skill behavior and existing archive semantics by default.
- Driver 3: make claimed automation falsifiable against the actual Codex provider rather than inferred.

## Decisions

### ADR-1 - Host evidence precedes automatic implementation

- Decision: U2/U3/U4 are conditional implementation units. They cannot begin merely because a local script and skill text can be added; U1 must first prove a callable host lifecycle boundary.
- Drivers: R1, R4-R10, NFR1-NFR3.
- Alternatives: provider-first implementation or no recovery layer.
- Why chosen: it delivers auditable task continuity without an unsupported product claim.
- Consequences: automatic rotation may remain unavailable after this plan if official capabilities are absent; a manual handoff is not counted as automatic acceptance.
- Follow-ups: rerun U1 after an official Codex lifecycle release.

### ADR-2 - Keep rotation distinct from process archival

- Decision: continuity state is additive in the active task directory; `tidy` process retention does not treat rotation as completion.
- Drivers: R6, R9, NFR2.
- Alternatives: move active task notes into archive when rotation occurs.
- Why chosen: the successor still owns an active task and may need all evidence.
- Consequences: U2 tests must reject archive-on-rotation behavior.
- Follow-ups: none.

## Risks

- A capability audit could conflate a general OpenAI API feature with the installed Codex desktop lifecycle.
- Redaction may omit a material next action or accidentally retain sensitive content.
- A provider timeout after successor creation can cause duplicate successors without rotation-id idempotency.
- An archive failure could be incorrectly displayed as success and leave the source active.
- Broad skill edits can change ordinary planning/review workflows outside the requested boundary.

## Pre-Mortem

- Failure scenario 1: provider adapter is implemented from undocumented UI behavior. Mitigation: U1 requires official, current, exact-interface evidence and blocks U4 otherwise.
- Failure scenario 2: rotation starts while a command or delegated worker is still active. Mitigation: U2 models explicit terminal safe-point facts and tests no-interruption behavior.
- Failure scenario 3: recovery duplicates a successor after partial failure. Mitigation: U2 binds all lifecycle actions to one rotation ID and U4 retries only the remaining idempotent operation.

## Global Constraints

- No implementation code in this planning task; no commit, push, credential access, UI automation, or destructive process-archive move.
- Preserve task-local artifacts, unrelated worktree changes, source/mirror parity, and existing `tidy` semantics.
- Make no automatic-rotation or Codex lifecycle claim without U1 evidence.
- Any new distributable plugin content requires synchronized source/mirror, semver/release-note handling, and install smoke per `AGENTS.md`.

## Implementation Units

### U1 - Official lifecycle capability audit

- Goal: determine whether the exact target Codex interface supports the four lifecycle operations and whether archive semantics are recoverable.
- Requirements covered: R1, R6, NFR3.
- Acceptance criteria covered: provider gate cannot progress without current, official, interface-specific evidence.
- Depends on: none.
- Files: `docs/ae/evidence/artifacts/codex-context-continuity-capability-audit-2026-09-04.md`, `docs/ae/prds/2026-09-04-codex-context-continuity-prd.md` only if evidence changes Q1/Q2 status.
- Forbidden files: `AGENTS.md`, provider implementation files, `.codex/ae-skill-profiles.yaml`, all existing skill files, and any Codex application data.
- Approach: inspect official OpenAI/Codex documentation and active supported interfaces. Record concrete operations, authorization, idempotency, acknowledgement, archive behavior, version/date, and proof boundary. Reject API features that do not control the target Codex thread lifecycle.
- Tests: documentary evidence review; no simulated provider pass.
- Validation: confirm that every R1 operation has direct official evidence; otherwise record `unavailable` and skip U4.
- Rollback signals: missing one lifecycle operation, unsupported archival semantics, undocumented interface, or need for UI automation.
- Execution result (2026-09-04): completed-negative. The active session lacks the required near-context and safe-point interfaces; local bundled declarations do not prove active callable lifecycle behavior, acknowledgement, or archive semantics. Evidence: `docs/ae/evidence/artifacts/codex-context-continuity-capability-audit-2026-09-04.md`.

### U2 - Host integration contract and continuity coordinator (conditional)

- Goal: implement T-001 state schema, redaction, idempotency, terminal-work gating, and coordinator invocation only after U1 proves a callable host lifecycle entry point.
- Requirements covered: R2-R6, R9-R10, NFR1-NFR2.
- Acceptance criteria covered: explicit states, host-delivered context signal, safe checkpoint, compact continuation record, idempotent recovery, successor-first state prerequisites, and no archive-on-rotation.
- Depends on: U1.
- Files: `plugins/ai-agent-engine-codex/scripts/ae-tools/continuity.mjs`, `plugins/ai-agent-engine-codex/scripts/ae-tools.mjs`, `plugins/ai-agent-engine-codex/scripts/ae-tools/tasks.mjs`, `tests/continuity.test.mjs`, matching `.ae-source` files when those paths are mirrored, and task-artifact contract documentation.
- Forbidden files: `plugins/ai-agent-engine-codex/scripts/ae-tools/tidy.mjs`, Codex desktop binaries, external service clients, and package lockfiles.
- Approach: first bind the coordinator to the verified host event and safe invocation contract. Then expose only state calculation/checkpoint/recovery, read known task artifacts, redact to the defined continuation fields, and write one revisioned local record. If U1 finds no host entry point, do not create a per-turn trigger, token estimator, polling loop, or claim of automatic behavior.
- Tests: TC-001, TC-002, TC-003, TC-005.
- Validation: focused Node tests; `node scripts/check-ae-artifacts.mjs`; `git diff --check`.
- Rollback signals: any active task is archived/moved, record contains secret fixture, non-terminal work gets stopped, or repeated ID generates more than one record.
- Deferred to implementation: provider calls remain deferred; the host signal is a hard precondition, not an implementation detail to invent.

### U3 - Eligible execution-skill routing and distribution parity (conditional)

- Goal: add default-off continuity checkpoints only to eligible execution flows after the host boundary is verified, while retaining inert behavior in ideation, requirements, design, planning, and ordinary review.
- Requirements covered: R1, R2, R7-R10, NFR1, NFR3.
- Acceptance criteria covered: the five execution skills share the recovery contract; `ae-handoff` only consumes/recovers the record; excluded skills do not create state or archive threads; profile controls are explicit.
- Depends on: U2.
- Files: `.codex/ae-skill-profiles.yaml`, `plugins/ai-agent-engine-codex/skills/ae-work/SKILL.md`, `plugins/ai-agent-engine-codex/skills/ae-lfg/SKILL.md`, `plugins/ai-agent-engine-codex/skills/ae-task-loop/SKILL.md`, `plugins/ai-agent-engine-codex/skills/ae-debug/SKILL.md`, `plugins/ai-agent-engine-codex/skills/ae-tdd/SKILL.md`, `plugins/ai-agent-engine-codex/skills/ae-handoff/SKILL.md`, `tests/skills-docs.test.mjs`, and any profile parser fixture. A `.ae-source` mirror is not present in this checkout; if one is introduced later, parity is a separate release gate.
- Forbidden files: `plugins/ai-agent-engine-codex/skills/ae-ideate/SKILL.md`, `skills/ae-brainstorm/SKILL.md`, `skills/ae-prd/SKILL.md`, `skills/ae-design/SKILL.md`, `skills/ae-plan/SKILL.md`, `skills/ae-review/SKILL.md`, `tidy.mjs`, and plugin version/release files unless U5 is approved.
- Approach: use the existing profile parser convention to define an explicit default-off continuity section only after U2 supplies the host invocation. Add compact routing instructions to the five execution skills; keep `ae-handoff` as manual recovery only. Do not modify excluded skills or imply that skill text itself is a lifecycle trigger.
- Tests: TC-001, TC-002, TC-006; source/mirror contract checks.
- Validation: focused skill docs tests, `node scripts/check-skill-mirror.mjs`, `node scripts/check-skill-contract.mjs`, `git diff --check`.
- Rollback signals: an excluded skill gains continuity side effects, enabled state is defaulted, or source/mirror diverges.
- Deferred to implementation: provider-specific create/inject/archive wording remains conditional on U1.

### U4 - Conditional provider adapter and isolated lifecycle acceptance

- Goal: implement automatic successor creation, continuation injection/acknowledgement, and source archive only if U1 documents all supported operations and Q1/Q2 are resolved.
- Requirements covered: R1, R3-R6, R10, NFR1-NFR3.
- Acceptance criteria covered: provider gate, safe lifecycle order, acknowledged continuation, `partial` archive failure, and real runtime evidence.
- Depends on: U1, U2, U3.
- Files: `plugins/ai-agent-engine-codex/scripts/ae-tools/continuity-provider-<verified-provider>.mjs`, `tests/continuity-provider.test.mjs`, matching `.ae-source` files, `docs/ae/evidence/artifacts/codex-context-continuity-runtime-acceptance-2026-09-04.md`.
- Forbidden files: any desktop UI automation script, browser-control script, scheduled daemon, `tidy.mjs`, credential files, package lockfiles, and release notes before runtime acceptance passes.
- Approach: implement only the official interface found by U1. Bind every call to T-001's rotation ID, create successor before injection/acknowledgement, verify acknowledgement before archiving source, and preserve `partial`/`failed` recovery records. If U1 cannot prove one operation, write no adapter and close this unit as blocked.
- Tests: TC-004, TC-005 plus official isolated runtime acceptance.
- Validation: provider contract tests; source/mirror checks; one isolated real lifecycle run with sanitized evidence; no claim beyond the observed interface/version.
- Rollback signals: unsupported provider call, missing acknowledgement proof, source archive before successor verification, duplicate successor, archive result ambiguity, or any need for simulated UI input.
- Deferred to implementation: account retention implications not specified by the official provider remain a release blocker.

### U5 - Review, release decision, and evidence closure

- Goal: review task-owned changes, run validations, and release only the behavior that evidence proves.
- Requirements covered: R1-R10, NFR1-NFR3.
- Acceptance criteria covered: documents, tests, mirrors, configuration, and claims agree; unavailable automatic rotation is not advertised as implemented.
- Depends on: U1.
- Files: task process record under `docs/00-process/active/`, review artifact under `docs/ae/evidence/artifacts/`, `README.md`, `README.en.md`, `CHANGELOG.md`, `CHANGELOG.en.md`, `package.json`, and `plugins/ai-agent-engine-codex/.codex-plugin/plugin.json` only if distributable plugin behavior changes and validations pass.
- Forbidden files: user credential references, Codex desktop data, unrelated project documentation, and `docs/08-ai-memory/**`.
- Approach: run document/code review with exact scope. Close U1 as the current executable slice. If U2-U4 are blocked, describe only the missing host/provider boundary and keep automatic rotation `unavailable`; do not bump a release for a design-only task. If later distributable plugin contents change, follow the version/note/install-smoke rules in `AGENTS.md`.
- Tests: document review and all relevant U2-U4 validation commands.
- Validation: `node scripts/check-design-contract.mjs`, `node scripts/check-ae-artifacts.mjs`, focused tests, `node scripts/check-skill-mirror.mjs`, `node scripts/check-skill-contract.mjs`, `git diff --check`, then `npm run check` and install smoke when distribution changes.
- Rollback signals: P0/P1 review finding, mirror mismatch, unverified runtime claim, missing source archive evidence, or failed release check.
- Deferred to implementation: commit/push requires separate explicit user request.

## Consistency Check

- implementationUnitCount: 5
- sourceRequirementsCovered: R1, R2, R3, R4, R5, R6, R7, R8, R9, R10, NFR1, NFR2, NFR3
- sourceRequirementsDeferred: automatic R2-R10 execution remains conditionally blocked by the host/provider evidence; U1 is executable now
- openQuestionsCount: 3

## Validation Plan

- Unit: redaction, state transitions, idempotency, profile parsing, and eligible-skill routing tests only after U1 proves the host boundary.
- Integration: source/mirror, artifact, and skill contract checks plus `npm run check` when code changes.
- User flow: current scope is capability-audit evidence and existing manual handoff; real automatic rotation only under U4's isolated official-provider acceptance.
- Data / operations: active task records survive partial failure; `tidy` classification remains unchanged for rotating active tasks.
- Observability: sanitized state/event trace proves exact order and explicitly distinguishes unavailable, failed, and partial.

## Rollback / Recovery

Disable the profile flag first. Retain the task-local record, handoff, ledger, source reference, and any acknowledged successor reference. Retry only the incomplete idempotent operation. Do not archive or delete active task artifacts because a rotation was attempted. Revert source/mirror/config/test changes as one task-owned set if static validation fails; no conversation mutation is attempted without U4 evidence.

## Plan Self-Review

- Placeholder scan: passed; `<verified-provider>` is a conditional filename token, not a planned concrete provider or implementation claim.
- Consistency check: passed; all source IDs map to U1-U5.
- Scope check: passed; no desktop modification, UI automation, daemon, or transcript store is planned.
- Acceptance coverage: passed; real lifecycle acceptance remains explicitly blocked pending U1.
- Validation gaps: Q1/Q2 official lifecycle and archive semantics.
- Alternatives and ADR check: passed.
- High-risk pre-mortem check: passed.

## Handoff

Execute serially. U1 is the only currently executable unit. Do not begin U2 or U3 until U1 proves a callable host lifecycle entry point; do not begin U4 until U1 also proves provider lifecycle and archive semantics.
