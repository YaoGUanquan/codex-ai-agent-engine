---
type: plan
status: completed
date: 2026-06-29
title: generic-grading-paper-pool-ref
depth: standard
format: human-readable-plan
sharded: false
---

# Plan: generic-grading-paper-pool-ref

## Source

User confirmed the two DB columns were added successfully and asked to finish storing the corresponding fields for `POST /api/v1/exam-generic-grading/exams/{examId}/raw-data/refs`.

## AI Parse Contract

- canonicalKind: plan
- humanEquivalent: true
- stableIdsRequired: true
- noImplicitScope: true

## Scope

Persist the selected generic-grading paper pool reference on raw-data refs registration.

## Readiness

- Goal: `raw-data/refs` internally infers the paper pool from registered student PDF references and saves it to `exam_generic_grading_flow_state.paper_pool_id` and `paper_pool_pdf_url`.
- Acceptance criteria:
  - Request DTO does not expose `paperPoolId`; no new request parameter is added.
  - Service matches built `files.student_answer_pdf` / `files.student_pdf` refs against current-school `exam_composition_paper_pool` / `exam_composition_paper_pool_item`, with `pool_type=1` and `deleted=0`.
  - Service stores the matched `paperPoolId` plus matched PDF URL when saving raw refs registration.
  - Flow state entity and service write both columns for create and update paths.
  - Existing raw refs behavior remains compatible when no PDF ref matches a paper pool; stored paper-pool fields stay null and registration does not fail.
- Non-goals: no new query endpoint, no schema SQL creation because user already executed the two SQL statements, no changes to unrelated `ExamAssignmentGrading*` files.
- Affected areas: generic grading DTO, flow state entity/service, generic grading service, focused tests.
- Validation surface: Maven unit tests for `ExamGenericGradingServiceImplTest` and `ExamGenericGradingFlowStateServiceImplTest`.
- Open questions: none blocking; `paperPoolPdfUrl` resolves from the matched `merged_pdf_oss_path` first, then from the matched item `file_url`.

## Assumptions

- The executed columns are named `paper_pool_id BIGINT NULL` and `paper_pool_pdf_url VARCHAR(1024) NULL`.
- `exam_composition_paper_pool.pool_type=1` is the existing generic-grading pool discriminator.

## Alternatives Considered

- Recommended: add fields to `exam_generic_grading_flow_state`; this is the exam-level resumable flow row and already owns raw refs snapshots.
- Alternative: only store inside `raw_refs_request_json`; rejected because it is not indexable or type-safe.
- Alternative: write the relationship into the paper pool table; rejected because one pool can be reused by many exams.

## Decision Drivers

- Preserve the exam-to-pool relationship at the same boundary that persists raw refs registration.
- Keep historical compatibility when no paper pool is provided.
- Avoid adding a join table before there is a many-to-many requirement.

## Decisions

### ADR-1 - Persist paper pool reference on flow state

- Decision: store `paperPoolId` and resolved PDF snapshot URL on `exam_generic_grading_flow_state`.
- Drivers: raw refs ownership, queryability by `school_id + exam_id`, replay/debug value.
- Alternatives: JSON-only storage, reverse relation on paper pool.
- Why chosen: smallest schema-backed change matching the current workflow.
- Consequences: `raw-data/refs` performs local best-effort paper-pool matching before third-party registration persistence, without changing third-party payload.
- Follow-ups: a future query endpoint can read these two fields directly.

## Risks

- Constructor changes in `ExamGenericGradingServiceImpl` can break tests if dependency injection overloads are not preserved.
- Existing raw refs tests may need verification updates for the expanded `saveRawDataRegistration` signature.
- A paper pool with no PDF path should fail early with a clear parameter error.

## Pre-Mortem

- Failure scenario 1: wrong school pool ID is accepted. Mitigation: query by `id + school_id + deleted=0`.
- Failure scenario 2:作文池 is accepted for generic grading. Mitigation: require `pool_type=1`.
- Failure scenario 3: flow update path forgets new columns. Mitigation: add create/update tests on `ExamGenericGradingFlowStateServiceImpl`.

## Implementation Units

### U1 - Extend contracts and persistence

- Goal: add flow-state fields without adding a raw refs DTO request field.
- Requirements covered: entity stores an internally inferred paper pool reference.
- Acceptance criteria covered: DTO/entity/service signatures compile.
- Depends on: none
- Files: `axon-common/src/main/java/com/xinxi/axon/common/entity/exam/ExamGenericGradingFlowStatePO.java`, `axon-common/src/main/java/com/xinxi/axon/common/service/exam/ExamGenericGradingFlowStateService.java`, `axon-common/src/main/java/com/xinxi/axon/common/service/exam/impl/ExamGenericGradingFlowStateServiceImpl.java`
- Forbidden files: unrelated assignment grading files.
- Approach: add `paperPoolId` and `paperPoolPdfUrl` to flow state persistence, persist in create and update wrappers.
- Tests: flow state service tests.
- Validation: targeted Maven test.
- Rollback signals: compile failure or missing SQL columns in deployment DB.
- Deferred to implementation: none.

### U2 - Infer pool PDF during refs registration

- Goal: infer `paperPoolId` from registered student PDF refs and persist it with the matched PDF URL.
- Requirements covered: current-school/type/deleted matching and URL snapshot.
- Acceptance criteria covered: unmatched PDF remains compatible; matching pool persists; no request DTO change.
- Depends on: U1
- Files: `axon-common/src/main/java/com/xinxi/axon/common/service/exam/impl/ExamGenericGradingServiceImpl.java`, `axon-common/src/test/java/com/xinxi/axon/common/service/exam/impl/ExamGenericGradingServiceImplTest.java`
- Forbidden files: unrelated assignment grading files.
- Approach: inject paper pool mappers, load current-school `pool_type=1` active pools, match `student_answer_pdf` / `student_pdf` URL/key/ossUri against `merged_pdf_oss_path` first and active item `file_url` second, then pass matched values to flow state service.
- Tests: generic grading service tests.
- Validation: targeted Maven test.
- Rollback signals: existing raw refs tests fail for no-paper-pool or external PDF path.
- Deferred to implementation: none.

## Consistency Check

- implementationUnitCount: 2
- sourceRequirementsCovered: raw refs field storage
- sourceRequirementsDeferred: query endpoint
- openQuestionsCount: 0

## Validation Plan

- Unit: `mvn -pl axon-common "-Dtest=ExamGenericGradingServiceImplTest,ExamGenericGradingFlowStateServiceImplTest" test`
- Integration: not run unless user provides local service context.
- User flow: not applicable in this backend-only storage patch.
- Data / operations: user already executed SQL; code assumes those columns exist.
- Observability: final response reports validation command and status.

## Rollback / Recovery

Revert code changes and, only if no production data uses them, drop `paper_pool_id` and `paper_pool_pdf_url`.

## Plan Self-Review

- Placeholder scan: no placeholders.
- Consistency check: units map to the requested storage behavior.
- Scope check: no query endpoint or unrelated refactor included.
- Acceptance coverage: all acceptance criteria map to U1/U2 and tests.
- Validation gaps: no live DB/API smoke without user-provided running service.
- Alternatives and ADR check: included.
- High-risk pre-mortem check: included because this touches schema-backed persistence.

## Handoff

Proceed serially in the current worktree, preserving unrelated existing changes.

## Completion Update - 2026-06-29

- User correction applied: `ExamGenericGradingRawDataRefsRequestDTO` does not add `paperPoolId`.
- `raw-data/refs` now derives paper-pool storage from built third-party refs only: `student_answer_pdf` and `student_pdf` `url/key/ossUri`.
- Match order: active current-school `exam_composition_paper_pool.merged_pdf_oss_path` first, then active `exam_composition_paper_pool_item.file_url`; comparisons support exact URL/OSS URI and normalized objectKey.
- No match is non-blocking; `paper_pool_id` and `paper_pool_pdf_url` are saved as null while raw-data/refs continues.
- Validation: `mvn -pl axon-common "-Dtest=ExamGenericGradingServiceImplTest,ExamGenericGradingFlowStateServiceImplTest" test` passed with 99 tests.
