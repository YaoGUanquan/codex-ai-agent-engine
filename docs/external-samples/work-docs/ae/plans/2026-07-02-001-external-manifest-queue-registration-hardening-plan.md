---
type: plan
status: drafted
date: 2026-07-02
title: external-manifest-queue-registration-hardening
depth: standard
format: human-readable-plan
sharded: false
---

# Plan: external-manifest-queue-registration-hardening

## Source

- User request: after confirming `/api/v1/exam-assignment-grading/external/create-from-manifest` should register `exam_assignment_grading_external_manifest_queue`, create a detailed execution plan, review it, fix review findings, review again, then execute.
- Repository evidence:
  - `ExamAssignmentGradingServiceImpl#createTaskFromExternalGenericManifest` creates an assignment-side manifest, creates a batch assignment grading task, then calls `registerExternalManifestAnalysisQueue`.
  - `registerExternalManifestAnalysisQueue` requires `flowState.gradingId` after the assignment task has already been created.
  - `ExamAssignmentGradingExternalManifestQueueServiceImpl#registerOrUpdate` requires `genericManifestId`, `schoolId`, `examId`, `genericGradingId`, `assignmentManifestId`, and `assignmentGradingId`.
  - `ExamAssignmentGradingExternalManifestQueueTask` claims `POST_PROCESS_PENDING` and related rows and advances them through essay/generic/analysis polling.

## AI Parse Contract

- canonicalKind: plan
- humanEquivalent: true
- stableIdsRequired: true
- noImplicitScope: true

## Scope

Harden the `external/create-from-manifest` success path so it never creates an assignment-side third-party grading task when the local generic grading prerequisite is not ready, and so successful third-party assignment task creation remains followed by idempotent local queue registration.

The plan does not change the JSON aggregate queue, generic manifest registration, or the external manifest analysis queue state machine semantics.

## Readiness

- Goal: prevent `external/create-from-manifest` from producing assignment-side orphan tasks or missing analysis queue rows when the generic grading task is not ready locally.
- Acceptance criteria:
  - AC1: if the local `exam_generic_grading_flow_state` has no `grading_id`, `external/create-from-manifest` fails before calling assignment-side `create-from-manual` or `batch_assignment_grading`.
  - AC2: if the local `grading_id` exists, the endpoint keeps the existing behavior: create assignment manifest, create assignment grading task, register `exam_assignment_grading_external_manifest_queue`.
  - AC3: if queue registration fails after assignment grading task creation, the endpoint still returns a business error, preserving the current explicit failure behavior.
  - AC4: tests cover the no-generic-grading-id preflight failure and the successful queue registration path.
  - AC5: no row is written to `exam_assignment_grading_external_manifest_queue` at the “3 JSON ready / generic manifest ready” stage alone.
- Non-goals:
  - Do not backfill production rows directly from code.
  - Do not register the external manifest queue during JSON aggregate progress or generic manifest registration.
  - Do not add a public repair API.
  - Do not change third-party API contracts or add new dependencies.
- Affected areas:
  - `axon-common/src/main/java/com/xinxi/axon/common/service/exam/impl/ExamAssignmentGradingServiceImpl.java`
  - `axon-common/src/test/java/com/xinxi/axon/common/service/exam/impl/ExamAssignmentGradingServiceImplTest.java`
  - optional memory/docs updates under `docs/08-ai-memory` only if a durable pitfall is added.
- Validation surface:
  - targeted Maven test for `ExamAssignmentGradingServiceImplTest`.
  - existing queue tests if touched indirectly.
- Open questions:
  - none. User has delegated execution after plan review passes.

## Assumptions

- `flowState.gradingId` is the only reliable local key for generic result polling used by the external analysis queue.
- Calling assignment-side create APIs before `flowState.gradingId` exists is unsafe because queue registration cannot pass validation and the created third-party assignment task may not be locally recoverable without manual identifiers.
- The correct user flow is: JSON ready -> generic manifest ready -> generic grading task submitted and `grading_id` written -> `external/create-from-manifest` creates assignment task and queue row.

## Alternatives Considered

- Recommended: move the generic `grading_id` prerequisite check before assignment-side manifest/task creation and reuse the checked flow state for queue registration.
- Alternative: create assignment task first, then try to recover missing `genericGradingId` by listing generic tasks. Rejected because task matching by manifest/exam is ambiguous, adds external calls, and can register wrong generic grading IDs.
- Alternative: allow queue rows with blank `genericGradingId` and fill later. Rejected because the processor cannot poll generic results or trigger analysis without `genericGradingId`, and it weakens the queue table invariants.

## Decision Drivers

- Driver 1: avoid third-party side effects before local prerequisites are known.
- Driver 2: preserve existing queue table invariants and processor assumptions.
- Driver 3: keep the patch narrow and testable inside `ExamAssignmentGradingServiceImpl`.

## Decisions

### ADR-1 - Preflight generic grading readiness before assignment task creation

- Decision: validate local context contains a nonblank generic `gradingId` before calling assignment-side `create-from-manual` and `batch_assignment_grading`.
- Drivers: side-effect safety, queue registration correctness, simpler recovery.
- Alternatives: post-create retry, queue row with missing IDs, external task-list reconciliation.
- Why chosen: it prevents the only unrecoverable local inconsistency in this flow without changing public API contracts.
- Consequences: callers that invoke `external/create-from-manifest` too early will receive a business error before any assignment-side third-party resources are created.
- Follow-ups: if product wants one-click automatic generic task submission before assignment task creation, that should be a separate planned workflow because it changes user-visible task sequencing.

### ADR-2 - Keep queue registration tied to assignment grading task creation

- Decision: do not register `exam_assignment_grading_external_manifest_queue` at the 3-JSON-ready or generic-manifest-ready stage.
- Drivers: queue requires `assignmentGradingId`; state machine polls assignment results and generic results.
- Alternatives: early queue rows with pending assignment IDs.
- Why chosen: early rows cannot be processed and would blur generic vs assignment manifest semantics.
- Consequences: DB checks must continue to treat `exam_generic_grading_flow_state.manifest_id` and `exam_assignment_grading_external_manifest_queue.assignment_grading_id` as different lifecycle milestones.
- Follow-ups: document the milestone distinction if implementation confirms the pitfall.

## Risks

- The main class is large; edits must avoid broad refactoring and Sonar cognitive complexity regressions.
- Some tests use broad mocks for gateway calls; new test must assert no assignment-side side effects happen on missing `gradingId`.
- Error message changes may affect callers if they assert exact text. Keep message specific but aligned with existing `generic gradingId must not be blank`.

## Pre-Mortem

- Failure scenario 1: the preflight check is added too late and still allows `create-from-manual`.
- Failure scenario 2: successful path re-fetches a different flow state than the preflight, causing queue registration to use stale or missing `gradingId`.
- Failure scenario 3: tests assert only exception type and miss side-effect prevention.
- Mitigations:
  - Add a test that verifies `invokeJson` is called only for generic manifest detail and JSON fetch happens as expected, while assignment-side `invokeMultipart` and queue registration are never called.
  - Pass or reuse the checked flow state in queue registration, avoiding an extra unguarded lookup.
  - Keep the success-path queue registration test intact.

## Global Constraints

- Do not modify controller contract or request/response DTOs.
- Do not create queue rows without `genericGradingId`, `assignmentManifestId`, and `assignmentGradingId`.
- Do not touch unrelated assignment grading task listing/result mapping logic.
- Preserve existing registration failure behavior after assignment task creation.
- Use UTF-8 and keep docs under `docs/`.

## Implementation Units

### U1 - Add preflight test for missing generic grading id

- Goal: prove `external/create-from-manifest` fails before assignment-side side effects when local `flowState.gradingId` is blank.
- Requirements covered: AC1, AC5.
- Acceptance criteria covered: AC1, AC5.
- Depends on: none.
- Files:
  - `axon-common/src/test/java/com/xinxi/axon/common/service/exam/impl/ExamAssignmentGradingServiceImplTest.java`
- Forbidden files:
  - `axon-chat/src/main/java`
  - `axon-common/src/main/java`
- Approach:
  - Add a test near existing `createTaskFromExternalGenericManifest_*` tests.
  - Stub generic manifest detail and JSON document fetch as needed to resolve local context.
  - Return a `flowState` with `manifestId` but blank `gradingId`.
  - Assert `BusinessException` contains `generic gradingId must not be blank`.
  - Verify no assignment-side `create-from-manual` call, no `invokeMultipart`, and no queue registration.
- Tests:
  - Run `mvn -pl axon-common -Dtest=ExamAssignmentGradingServiceImplTest#createTaskFromExternalGenericManifest_rejectsMissingGenericGradingIdBeforeAssignmentSideEffects test`.
- Validation:
  - The test should fail before implementation because current code creates assignment-side manifest/task before checking `gradingId`.
- Rollback signals:
  - If the test cannot distinguish generic detail GET from assignment manifest POST, inspect captured `invokeJson` endpoints instead of only call count.
- Deferred to implementation:
  - Keep the test method name exactly `createTaskFromExternalGenericManifest_rejectsMissingGenericGradingIdBeforeAssignmentSideEffects` so the narrow validation command remains executable.

### U2 - Move generic grading readiness check before assignment-side side effects

- Goal: make `createTaskFromExternalGenericManifest` validate generic grading readiness before `createManifestFromManual` and `createExternalGenericManifestTask`.
- Requirements covered: AC1, AC2, AC3, AC5.
- Acceptance criteria covered: AC1, AC2, AC3, AC5.
- Depends on: U1.
- Files:
  - `axon-common/src/main/java/com/xinxi/axon/common/service/exam/impl/ExamAssignmentGradingServiceImpl.java`
- Forbidden files:
  - `axon-chat/src/main/java`
  - DTO/entity/table definitions
- Approach:
  - Introduce a small private helper such as `requireExternalManifestGenericGradingReady(ExternalManifestLocalContext localContext)` that:
    - reads `localContext.flowState()`,
    - throws `queueRegistrationBusinessException("generic gradingId must not be blank")` if missing,
    - returns the valid `ExamGenericGradingFlowStatePO`.
  - Call this helper immediately after `resolveExternalManifestLocalContext(...)` and before building/calling assignment-side manifest creation.
  - Adjust `registerExternalManifestAnalysisQueue` to accept the checked `flowState` or ensure it does not re-check after side effects unnecessarily.
  - Preserve current behavior when `externalManifestQueueService.registerOrUpdate` fails after assignment task creation.
- Tests:
  - Run U1 test and existing success/failure tests around `createTaskFromExternalGenericManifest`.
- Validation:
  - `mvn -pl axon-common -Dtest=ExamAssignmentGradingServiceImplTest test`
- Rollback signals:
  - Any existing successful create-from-manifest test fails because the helper rejects valid `gradingId`.
  - Existing queue registration failure test stops throwing the expected business error.
- Deferred to implementation:
  - If passing checked `flowState` creates a large signature churn, keep a helper that is called both preflight and registration, but ensure it runs before side effects.

### U3 - Update durable docs if the pitfall is confirmed

- Goal: document the lifecycle distinction and the preflight guarantee for future incident triage.
- Requirements covered: AC5.
- Acceptance criteria covered: AC5.
- Depends on: U2.
- Files:
  - `docs/08-ai-memory/03-key-workflows.md`
  - `docs/08-ai-memory/04-known-pitfalls.md`
- Forbidden files:
  - production Java files
- Approach:
  - Add one concise note that `external/create-from-manifest` must only be called after generic `grading_id` exists.
  - Add a pitfall note that `MANIFEST_READY` is not enough for external analysis queue registration; queue rows require assignment grading task IDs.
- Tests:
  - No Maven test required for docs.
- Validation:
  - Manual read for accuracy and brevity.
- Rollback signals:
  - If implementation takes a different shape and no durable behavior changes, skip memory update and record that in final response.
- Deferred to implementation:
  - Keep docs short; do not duplicate full flow diagrams.

## Consistency Check

- implementationUnitCount: 3
- sourceRequirementsCovered:
  - user asked for plan -> U1/U2/U3
  - review and fix plan findings -> document review stage before implementation
  - execute after clean second review -> ae-work stage after review pass
- sourceRequirementsDeferred:
  - none
- openQuestionsCount: 0

## Validation Plan

- Unit:
  - `mvn -pl axon-common -Dtest=ExamAssignmentGradingServiceImplTest#createTaskFromExternalGenericManifest_rejectsMissingGenericGradingIdBeforeAssignmentSideEffects test`
  - `mvn -pl axon-common -Dtest=ExamAssignmentGradingServiceImplTest test`
- Integration:
  - Existing `createTaskFromExternalGenericManifest` tests validate success mapping and queue registration.
- User flow:
  - SQL/runtime verification remains manual: before calling `external/create-from-manifest`, `exam_generic_grading_flow_state.grading_id` must be nonblank; after success, `exam_assignment_grading_external_manifest_queue.assignment_grading_id` should exist.
- Data / operations:
  - No schema migration.
  - No automatic production backfill.
- Observability:
  - Existing business exception and logs remain the signal for premature call or queue registration failure.

## Rollback / Recovery

- Rollback is a normal code revert of the helper/test changes.
- Runtime recovery for already-created orphan assignment tasks remains manual because this plan intentionally avoids unsafe third-party task matching.
- If users hit the new preflight error, the recovery is to submit the generic grading task first and wait for `flow_state.grading_id` to be written, then call `external/create-from-manifest`.

## Plan Self-Review

- Placeholder scan: no `TBD`, `TODO`, or empty implementation units.
- Consistency check: scope, decisions, and units all preserve the queue lifecycle distinction.
- Scope check: focused on `create-from-manifest` preflight and tests; no API redesign or schema change.
- Acceptance coverage: AC1-AC5 map to U1-U3 and validation commands.
- Validation gaps: no live third-party smoke test planned because user did not provide runtime token or request local smoke; unit tests cover local side-effect ordering.
- Alternatives and ADR check: alternatives are recorded and rejected with concrete reasons.
- High-risk pre-mortem check: side-effect ordering and queue registration failure are explicitly covered.

## Post-Execution Clarification

- 2026-07-02 follow-up review confirmed that JSON self-healing is intentionally limited to the generic grading lifecycle.
- If `/api/v1/exam-generic-grading/json-aggregate/progress` starts only the first JSON and the third party later completes the remaining JSON files, the JSON queue may reconcile those files and advance the generic flow through JSON READY / manifest registration / generic grading submission.
- That reconciliation does not call `/api/v1/exam-assignment-grading/external/create-from-manifest` and does not insert `exam_assignment_grading_external_manifest_queue`.
- The queue row still requires assignment-side IDs: `assignment_manifest_id` and `assignment_grading_id`. Those IDs are created only by a successful `external/create-from-manifest` call after `exam_generic_grading_flow_state.grading_id` exists.

## Handoff

1. Review this plan as a document.
2. Fix any review findings in the plan.
3. Re-review the plan.
4. Execute U1-U3 serially after the pre-edit gate.
5. Run validation and final code review.
