---
type: plan
status: drafted
date: 2026-06-29
title: assignment-grading-options-json
depth: standard
format: human-readable-plan
sharded: false
---

# Plan: assignment-grading-options-json

## Source

User request: for third-party `POST /api/v1/batch_assignment_grading`, set transmitted `options_json.pdf_dpi` to `110`.

## AI Parse Contract

- canonicalKind: plan
- humanEquivalent: true
- stableIdsRequired: true
- noImplicitScope: true

## Scope

Update only the batch assignment grading create-task `options_json` built by the backend for the third-party create API.

## Readiness

- Goal: third-party create multipart field `options_json` includes fixed `max_workers=8`, `paired_input=true`, and `pdf_dpi=110` on the default create path.
- Acceptance criteria: existing create-task tests assert the multipart payload contains those fields; frontend `optionsJson` remains a compatibility field and does not override backend fixed options.
- Non-goals: no frontend contract change, no generic grading change, no third-party list/result API change.
- Affected areas: `axon-common` batch assignment grading service and unit tests.
- Validation surface: focused Maven test for `ExamAssignmentGradingServiceImplTest`.
- Open questions: none for the requested fixed payload.

## Assumptions

- `paired_input:true` refers to the default batch assignment grading mode already used when `gradingModeId` is blank.
- `pdf_dpi:110` is the current fixed third-party runtime option for batch assignment grading create tasks.

## Alternatives Considered

- Recommended: keep `pdf_dpi=110` in the existing backend-owned `buildGradingOptionsJson` builder and test it in the existing create-task unit test.
- Alternative: accept these values from DTO `optionsJson`; rejected because project memory and DTO docs state frontend `optionsJson` must not override third-party create `options_json`.
- Alternative: add a separate configuration property; rejected because the request asks for fixed parameters and the existing options are hard-coded constants.

## Decision Drivers

- Preserve existing backend ownership of third-party create options.
- Keep change localized to the current external API integration.
- Avoid expanding public API behavior or user-controlled overrides.

## Decisions

### ADR-1 - Fixed Backend Options

- Decision: maintain fixed create-task options in `ExamAssignmentGradingServiceImpl#buildGradingOptionsJson`.
- Drivers: existing pattern, third-party contract stability, no frontend contract expansion.
- Alternatives: DTO merge or external config.
- Why chosen: it changes the exact payload requested with the smallest blast radius.
- Consequences: later option changes still require backend code/test updates.
- Follow-ups: update AI memory if this becomes a stable long-term contract.

## Risks

- A non-default grading mode can still override `paired_input` through mode-specific options. This plan only guarantees the default mode sends `paired_input:true`.

## Pre-Mortem

- Failure scenario 1: `pdf_dpi` is accidentally added to the wrong integration. Mitigation: only touch `ExamAssignmentGradingServiceImpl`.
- Failure scenario 2: frontend `optionsJson` starts overriding backend options. Mitigation: keep builder ignoring DTO `optionsJson` and assert fixed payload.
- Failure scenario 3: test validates Java map but not multipart field. Mitigation: parse `request.getFormFields().get("options_json")` captured from the gateway call.

## Implementation Units

### U1 - Batch Assignment Grading Options JSON

- Goal: keep `pdf_dpi=110` in backend fixed create-task `options_json` and assert requested fixed values.
- Requirements covered: fixed `max_workers:8`, `paired_input:true`, `pdf_dpi:110` in third-party create options.
- Acceptance criteria covered: captured multipart `options_json` contains all requested fields.
- Depends on: none
- Files: `axon-common/src/main/java/com/xinxi/axon/common/service/exam/impl/ExamAssignmentGradingServiceImpl.java`, `axon-common/src/test/java/com/xinxi/axon/common/service/exam/impl/ExamAssignmentGradingServiceImplTest.java`
- Forbidden files: `axon-common/src/main/java/com/xinxi/axon/common/service/exam/support/ExamGenericGradingAnalysisSourceEnricher.java`, `axon-common/src/test/java/com/xinxi/axon/common/service/exam/support/ExamGenericGradingAnalysisSourceEnricherTest.java`
- Approach: update the existing create-task default `pdf_dpi` constant to `110` and extend the existing create-task test.
- Tests: focused unit test method `createTask_usesMultipartTextFieldsOnly`.
- Validation: `mvn -pl axon-common -Dtest=ExamAssignmentGradingServiceImplTest#createTask_usesMultipartTextFieldsOnly test`
- Rollback signals: focused test fails, or captured `options_json` omits requested fields.
- Deferred to implementation: none.

## Consistency Check

- implementationUnitCount: 1
- sourceRequirementsCovered: all requested fixed fields
- sourceRequirementsDeferred: none
- openQuestionsCount: 0

## Validation Plan

- Unit: run focused `ExamAssignmentGradingServiceImplTest` method.
- Integration: not run unless local service/token details are provided.
- User flow: not applicable for backend-only fixed payload change.
- Data / operations: no database or SQL changes.
- Observability: no log or metric changes.

## Rollback / Recovery

Revert the two code/test hunks if third-party rejects `pdf_dpi=110`.

## Plan Self-Review

- Placeholder scan: no placeholders.
- Consistency check: scope, files, tests, and risk all target batch assignment grading create options.
- Scope check: no unrelated refactor or generic grading change.
- Acceptance coverage: all requested fields are covered by U1.
- Validation gaps: no live third-party smoke test without running service/token.
- Alternatives and ADR check: alternatives recorded and rejected based on existing contract.
- High-risk pre-mortem check: external API payload risk addressed with narrow captured-payload test.

## Handoff

Proceed with U1 in the current worktree, preserving unrelated dirty files.
