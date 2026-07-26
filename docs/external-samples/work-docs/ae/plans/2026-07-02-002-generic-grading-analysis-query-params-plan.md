---
type: plan
status: completed
date: 2026-07-02
title: generic-grading-analysis-query-params
origin: docs/ae/prds/2026-07-02-generic-grading-analysis-query-params-prd.md
originFingerprint: 2026-07-02-generic-grading-analysis-query-params
depth: standard
format: human-readable-plan
sharded: false
---

# Plan: generic-grading-analysis-query-params

## Source

- Source PRD: `docs/ae/prds/2026-07-02-generic-grading-analysis-query-params-prd.md`
- Prior design source: `docs/04-api/2026-06-16-通用批改第三方封装接口说明.md`
- Prior queue PRD: `docs/ae/prds/2026-06-30-external-manifest-analysis-queue-prd.md`
- Prior queue API doc: `docs/04-api/2026-06-30-external-manifest-analysis-queue-api.md`
- Current code facts:
  - `ExamGenericGradingServiceImpl#invokeThirdPartyTaskAnalysis(...)` builds the `/analysis` endpoint but currently calls `invokeJson(..., null, null)`, so no query params are sent.
  - `ExamAssignmentGradingExternalManifestGatewayServiceImpl#fetchAnalysis(...)` currently sends `do_analyze=false` only.
  - `ExamAssignmentGradingExternalManifestGatewayServiceImpl#triggerAnalysis(...)` currently sends `do_analyze=true` and `essay_json`; this POST trigger contract should remain unchanged.
  - `ExamThirdPartyGatewayServiceImpl#buildUrlWithQueryParams(...)` already appends `ExternalApiInvokeRequestDTO.queryParams`; no HTTP gateway change is needed.

## AI Parse Contract

- canonicalKind: plan
- humanEquivalent: true
- stableIdsRequired: true
- noImplicitScope: true

## Scope

Add fixed third-party analysis request parameters:

- ordinary analysis GET: `do_analyze=false`, `annotation_sync=false`;
- statistics aggregation: inherits the same ordinary analysis GET path;
- external manifest queue analysis POST trigger: keep `do_analyze=true`, `essay_json`, no `essay_json_url`, and do not add `annotation_sync` without a separate third-party POST contract confirmation;
- external manifest queue analysis GET fetch: keep `do_analyze=false`, add `annotation_sync=false`.

No Controller contract, database schema, queue status, scheduler, or frontend changes are in scope.

## Readiness

- Goal: Ensure local third-party generic grading `/analysis` GET queries use `do_analyze=false` and `annotation_sync=false`, while POST trigger keeps the existing `do_analyze=true` and `essay_json` contract.
- Acceptance criteria:
  - A1: ordinary `getTaskAnalysis(...)` sends query params `do_analyze=false` and `annotation_sync=false`.
  - A2: `wrong-question-statistics` is covered through the shared `invokeThirdPartyTaskAnalysis(...)` path.
  - A3: external manifest queue `triggerAnalysis(...)` keeps multipart fields `do_analyze=true` and `essay_json`, and still omits `essay_json_url` and `annotation_sync`.
  - A4: external manifest queue `fetchAnalysis(...)` sends query params `do_analyze=false` and `annotation_sync=false`.
  - A5: docs and AI memory reflect the stable analysis GET query `annotation_sync=false` contract.
- Non-goals:
  - No SQL migration.
  - No new public DTO/controller request field.
  - No queue state machine redesign.
  - No change to `essay_json` or `essay_json_url` behavior.
- Affected areas:
  - `axon-common/src/main/java/com/xinxi/axon/common/service/exam/impl/ExamGenericGradingServiceImpl.java`
  - `axon-common/src/main/java/com/xinxi/axon/common/service/exam/impl/ExamAssignmentGradingExternalManifestGatewayServiceImpl.java`
  - `axon-common/src/main/java/com/xinxi/axon/common/service/exam/ExamAssignmentGradingExternalManifestGatewayService.java`
  - targeted tests under `axon-common/src/test/java/com/xinxi/axon/common/service/exam/impl/`
  - API docs and AI memory docs under `docs/`
- Validation surface:
  - Mockito argument capture on gateway DTOs.
  - Maven targeted test run for affected test classes.
  - `rg` inspection for `annotation_sync` in implementation and docs.
- Open questions:
  - No blocking open questions. POST trigger support for `annotation_sync` is treated as a deferred third-party contract change, not part of this plan.

## Assumptions

- `annotation_sync=false` is a fixed backend adapter value for analysis GET queries and must not be made configurable unless a future requirement says so.
- `annotation_sync=false` is only confirmed for analysis GET query requests in this plan; POST trigger remains on the existing `do_analyze=true` and `essay_json` form contract.
- Existing `do_analyze` semantics from the June 30 queue PRD remain the source of truth.
- The bottom-level gateway already serializes query and multipart fields correctly.

## Alternatives Considered

- Recommended: Add fixed constants and small query/form builders in the two analysis caller classes.
- Alternative: Add a shared `ExamGenericGradingAnalysisRequestParamBuilder` helper.
- Rejected because: There are only two caller classes and no current need for a new public abstraction; a helper would add ownership without reducing meaningful duplication.
- Alternative: Add `annotation_sync=false` to both GET query and POST multipart trigger.
- Rejected because: Current evidence only requires the query parameter for analysis fetch/query; adding an unconfirmed field to POST trigger could break the queue trigger call.
- Alternative: Hard-code query strings directly in `ExamGenericGradingApiEnum.TASK_ANALYSIS`.
- Rejected because: `do_analyze` differs between trigger and query, `annotation_sync` is a GET request option, and enum URL strings should remain path-only.

## Decision Drivers

- Driver 1: Preserve existing `do_analyze` trigger/query split to prevent repeated analysis.
- Driver 2: Keep third-party adapter details inside Service/Gateway classes, not Controllers or DTOs.
- Driver 3: Minimize blast radius; no queue, SQL, or frontend changes.

## Decisions

### ADR-1 - Fixed analysis GET adapter values stay server-side

- Decision: Hard-code `annotation_sync=false` in backend third-party analysis GET request construction.
- Drivers: User confirmed false is sufficient; frontend should not own third-party adapter toggles.
- Alternatives: Add public request fields or configuration.
- Why chosen: The value is a contract adapter, not product input.
- Consequences: Future changes to annotation sync behavior, including adding it to POST trigger, require a backend code change or a separate explicit requirement.
- Follow-ups: Update docs and AI memory so later work does not reintroduce frontend-owned `annotation_sync`.

### ADR-2 - Preserve do_analyze split

- Decision: Keep `do_analyze=true` only for analysis trigger and `do_analyze=false` for every analysis fetch/query.
- Drivers: Existing PRD and API docs define this behavior; repeated `do_analyze=true` can retrigger analysis.
- Alternatives: Remove `do_analyze` from ordinary query and rely on third-party default.
- Why chosen: Third-party now exposes `do_analyze` as an explicit parameter; relying on defaults is fragile.
- Consequences: Ordinary analysis and statistics queries become deterministic.
- Follow-ups: Add tests that capture request DTO query params.

## Risks

- A future third-party update may require `annotation_sync=false` on POST trigger too. Mitigation: keep this as an explicit deferred contract change instead of preemptively adding an unconfirmed POST field.
- Tests may be brittle if existing test helpers assume `queryParams == null`. Mitigation: assert key-level behavior instead of map identity.
- Docs can drift if only code is changed. Mitigation: include docs and AI memory as explicit implementation unit.

## Pre-Mortem

- Failure scenario 1: Ordinary statistics page still fails because only queue gateway was updated. Mitigation: update `ExamGenericGradingServiceImpl#invokeThirdPartyTaskAnalysis(...)` and capture the normal analysis query DTO in tests.
- Failure scenario 2: Queue fetch sends `annotation_sync=false` but ordinary query omits `do_analyze=false`. Mitigation: make both params part of the same query map in ordinary analysis.
- Failure scenario 3: A future maintainer removes `annotation_sync=false` because it is undocumented. Mitigation: update API docs and AI memory with the stable contract.

## Global Constraints

- Use UTF-8 without BOM for all edited files.
- Preserve existing names and module boundaries; no new Controller or DTO API fields.
- Do not edit SQL migrations, queue status enum, scheduler, or entity schema.
- Do not commit or push unless explicitly requested.

## Implementation Units

### U1 - Add failing tests for ordinary analysis query params

- Goal: Prove ordinary third-party analysis query now must carry both fixed query params.
- Requirements covered: R1, R2, R3
- Acceptance criteria covered: A1, A2
- Depends on: none
- Files:
  - Modify: `axon-common/src/test/java/com/xinxi/axon/common/service/exam/impl/ExamGenericGradingServiceImplTest.java`
- Forbidden files:
  - `axon-chat/src/main/java/com/xinxi/chatservice/controller/exam/ExamGenericGradingController.java`
  - `docs/06-sql/**`
- Approach:
  - Extend `getTaskAnalysis_usesSchoolExamGradingPathAndPreservesDynamicAnalysis`.
  - Keep the existing endpoint assertion.
  - Capture `ExternalApiInvokeRequestDTO`.
  - Add assertions:
    - `captor.getValue().getQueryParams().get("do_analyze")` equals `"false"`.
    - `captor.getValue().getQueryParams().get("annotation_sync")` equals `"false"`.
    - request payload remains `null`.
  - This single test covers `wrong-question-statistics` because both paths call `invokeThirdPartyTaskAnalysis(...)`; do not duplicate a full statistics fixture unless implementation later splits the call path.
- Tests:
  - Expected pre-implementation result: test fails because `queryParams` is currently null.
- Validation:
  - `mvn -pl axon-common "-Dtest=ExamGenericGradingServiceImplTest#getTaskAnalysis_usesSchoolExamGradingPathAndPreservesDynamicAnalysis" test`
- Rollback signals:
  - Test cannot capture exactly one `invokeJson(...)` call due to unrelated behavior change.
- Deferred to implementation:
  - If the existing method has multiple gateway calls after future edits, narrow the captor to the `/analysis` endpoint URL before asserting params.

### U2 - Implement ordinary analysis query params

- Goal: Make ordinary analysis and statistics aggregation use explicit third-party query params.
- Requirements covered: R1, R2, R3, R5, R6
- Acceptance criteria covered: A1, A2
- Depends on: U1
- Files:
  - Modify: `axon-common/src/main/java/com/xinxi/axon/common/service/exam/impl/ExamGenericGradingServiceImpl.java`
- Forbidden files:
  - `axon-chat/src/main/java/com/xinxi/chatservice/controller/exam/ExamGenericGradingController.java`
  - `axon-common/src/main/java/com/xinxi/axon/common/service/exam/ExamGenericGradingService.java`
  - `docs/06-sql/**`
- Approach:
  - Add private constants near existing field constants:
    - `FIELD_DO_ANALYZE = "do_analyze"`
    - `FIELD_ANNOTATION_SYNC = "annotation_sync"`
    - `BOOLEAN_FALSE = "false"` if no equivalent exists locally.
  - In `invokeThirdPartyTaskAnalysis(...)`, build a `LinkedHashMap<String, String>` query map.
  - Put `do_analyze=false` and `annotation_sync=false`.
  - Pass that query map to `invokeJson("getTaskAnalysis", endpoint, "GET", null, queryParams)`.
  - Do not alter `getTaskAnalysis(...)`, controller signature, response mapping, source enrichment, or statistics mapping.
- Tests:
  - Re-run U1 validation.
- Validation:
  - `mvn -pl axon-common "-Dtest=ExamGenericGradingServiceImplTest#getTaskAnalysis_usesSchoolExamGradingPathAndPreservesDynamicAnalysis" test`
- Rollback signals:
  - Third-party logs show ordinary analysis URL still lacks query params.
  - Test reveals the wrong argument position was used for `invokeJson(...)`.
- Deferred to implementation:
  - If the local `invokeJson` helper signature is confusing, inspect its definition before editing and preserve argument order.

### U3 - Add failing tests for external manifest gateway analysis params

- Goal: Prove the queue gateway sends `annotation_sync=false` on fetch analysis calls and keeps trigger analysis params unchanged.
- Requirements covered: R3, R4, R6
- Acceptance criteria covered: A3, A4
- Depends on: none
- Files:
  - Modify: `axon-common/src/test/java/com/xinxi/axon/common/service/exam/impl/ExamAssignmentGradingExternalManifestGatewayServiceImplTest.java`
- Forbidden files:
  - `axon-common/src/main/java/com/xinxi/axon/common/service/exam/impl/ExamAssignmentGradingExternalManifestQueueProcessorImpl.java`
  - `docs/06-sql/**`
- Approach:
  - In `triggerAnalysis_usesMultipartWithDoAnalyzeTrue`, add assertion:
    - `request.getFormFields().containsKey("annotation_sync")` is `false`.
  - Keep existing assertions for `do_analyze=true`, `essay_json`, and absence of `essay_json_url`.
  - In `fetchAnalysis_usesDoAnalyzeFalse`, add assertion:
    - `request.getQueryParams().get("annotation_sync")` equals `"false"`.
  - Keep existing `do_analyze=false` and absence of `essay_json_url` assertions.
- Tests:
  - Expected pre-implementation result: fetch test fails because `annotation_sync` is absent from query params; trigger test should continue passing because POST does not add `annotation_sync`.
- Validation:
  - `mvn -pl axon-common "-Dtest=ExamAssignmentGradingExternalManifestGatewayServiceImplTest" test`
- Rollback signals:
  - Fetch test passes without `annotation_sync=false`, indicating the assertion did not target the captured request.
- Deferred to implementation:
  - Keep class-level test run to avoid method-name drift between display names and Java method names.

### U4 - Implement queue gateway fetch annotation_sync

- Goal: Add the fixed third-party query parameter to external manifest analysis fetch without changing trigger analysis or queue state behavior.
- Requirements covered: R3, R4, R5, R6
- Acceptance criteria covered: A3, A4
- Depends on: U3
- Files:
  - Modify: `axon-common/src/main/java/com/xinxi/axon/common/service/exam/impl/ExamAssignmentGradingExternalManifestGatewayServiceImpl.java`
  - Modify: `axon-common/src/main/java/com/xinxi/axon/common/service/exam/ExamAssignmentGradingExternalManifestGatewayService.java`
- Forbidden files:
  - `axon-common/src/main/java/com/xinxi/axon/common/service/exam/impl/ExamAssignmentGradingExternalManifestQueueProcessorImpl.java`
  - `axon-common/src/main/java/com/xinxi/axon/common/entity/exam/ExamAssignmentGradingExternalManifestQueuePO.java`
  - `docs/06-sql/**`
- Approach:
  - Add `FIELD_ANNOTATION_SYNC = "annotation_sync"` and a `FALSE_VALUE = "false"` constant in `ExamAssignmentGradingExternalManifestGatewayServiceImpl`.
  - In `fetchAnalysis(...)`, add `annotation_sync=false` to query params together with `do_analyze=false`.
  - Do not change `buildAnalysisFormFields(...)`; POST trigger remains `do_analyze=true` + `essay_json`.
  - Update interface Javadoc analysis query bullet to mention `annotation_sync=false`; keep trigger bullet unchanged.
  - Do not change `buildAnalysisRequestOptions(...)` unless implementation decides persisted request snapshots must include `annotationSync`; current queue snapshots only model `doAnalyze` and `essayJson`, so this plan does not require schema or DTO expansion.
- Tests:
  - Re-run U3 validation.
- Validation:
  - `mvn -pl axon-common "-Dtest=ExamAssignmentGradingExternalManifestGatewayServiceImplTest" test`
- Rollback signals:
  - Third-party logs show queue fetch URL still lacks `annotation_sync=false`.
- Deferred to implementation:
  - Do not alter processor state transitions while adding request fields.

### U5 - Update API docs and AI memory

- Goal: Preserve the third-party analysis query parameter contract for future work.
- Requirements covered: R1, R2, R3, R4, R5, R6
- Acceptance criteria covered: A5
- Depends on: U2, U4
- Files:
  - Modify: `docs/04-api/2026-06-16-通用批改第三方封装接口说明.md`
  - Modify: `docs/04-api/2026-06-30-external-manifest-analysis-queue-api.md`
  - Modify: `docs/08-ai-memory/00-index.md`
  - Modify: `docs/08-ai-memory/03-key-workflows.md`
  - Modify: `docs/08-ai-memory/04-known-pitfalls.md`
  - Modify: `docs/08-ai-memory/05-decision-log.md`
- Forbidden files:
  - `AGENTS.md`
  - `.cursorrules`
  - `docs/06-sql/**`
- Approach:
  - In the June 16 API doc table, update:
    - trigger business params remain `do_analyze=true`、`essay_json`;
    - query business params to `do_analyze=false`、`annotation_sync=false`.
  - In the June 30 queue API doc:
    - update query sample to `?do_analyze=false&annotation_sync=false`;
    - add one reliability rule that all analysis fetches must keep both false values.
  - In AI memory:
    - add stable note that third-party analysis GET query requests carry `annotation_sync=false`;
    - keep `do_analyze=true` trigger and `do_analyze=false` query warning;
    - state no frontend parameter is expected.
- Tests:
  - Documentation inspection only.
- Validation:
  - `rg -n "annotation_sync|do_analyze=false|do_analyze=true" docs/04-api docs/08-ai-memory`
- Rollback signals:
  - Docs imply frontend must pass `annotation_sync`; that contradicts PRD R5 and must be corrected.
- Deferred to implementation:
  - Do not create a new long-form API doc unless existing docs cannot be patched cleanly.

### U6 - Run focused validation and inspect final diff

- Goal: Verify the implementation is behaviorally scoped and test-backed.
- Requirements covered: R1, R2, R3, R4, R5, R6
- Acceptance criteria covered: A1, A2, A3, A4, A5
- Depends on: U1, U2, U3, U4, U5
- Files:
  - Read: `git diff -- axon-common/src/main/java/com/xinxi/axon/common/service/exam/impl/ExamGenericGradingServiceImpl.java`
  - Read: `git diff -- axon-common/src/main/java/com/xinxi/axon/common/service/exam/impl/ExamAssignmentGradingExternalManifestGatewayServiceImpl.java`
  - Read: `git diff -- axon-common/src/test/java/com/xinxi/axon/common/service/exam/impl/ExamGenericGradingServiceImplTest.java`
  - Read: `git diff -- axon-common/src/test/java/com/xinxi/axon/common/service/exam/impl/ExamAssignmentGradingExternalManifestGatewayServiceImplTest.java`
- Forbidden files:
  - `docs/06-sql/**`
- Approach:
  - Run targeted tests:
    - `mvn -pl axon-common "-Dtest=ExamGenericGradingServiceImplTest#getTaskAnalysis_usesSchoolExamGradingPathAndPreservesDynamicAnalysis" test`
    - `mvn -pl axon-common "-Dtest=ExamAssignmentGradingExternalManifestGatewayServiceImplTest" test`
  - If method-level test selection is unstable, run:
    - `mvn -pl axon-common "-Dtest=ExamGenericGradingServiceImplTest,ExamAssignmentGradingExternalManifestGatewayServiceImplTest" test`
  - Inspect diff to ensure:
    - no Controller changes;
    - no SQL changes;
    - no queue state enum or processor state transition changes;
    - no public DTO additions for `annotation_sync`.
  - Search final code and docs:
    - `rg -n "annotation_sync|FIELD_ANNOTATION_SYNC|do_analyze" axon-common/src/main/java axon-common/src/test/java docs/04-api docs/08-ai-memory`
- Tests:
  - Targeted Maven tests above.
- Validation:
  - Tests pass.
  - `rg` output shows `annotation_sync` only in analysis GET query construction, tests, and docs.
- Rollback signals:
  - Any public Controller/DTO now accepts `annotation_sync`.
  - Any SQL migration appears in diff.
  - Any queue processor status transition changes appear without requirement coverage.
- Deferred to implementation:
  - If full module tests are slow, targeted class tests are sufficient for this scoped adapter change; record unrun broader tests in final delivery.

## Consistency Check

- implementationUnitCount: 6
- sourceRequirementsCovered: R1, R2, R3, R4, R5, R6
- sourceRequirementsDeferred: none
- openQuestionsCount: 0

## Validation Plan

- Unit:
  - `mvn -pl axon-common "-Dtest=ExamGenericGradingServiceImplTest#getTaskAnalysis_usesSchoolExamGradingPathAndPreservesDynamicAnalysis" test`
  - `mvn -pl axon-common "-Dtest=ExamAssignmentGradingExternalManifestGatewayServiceImplTest" test`
- Integration:
  - If local service and third-party environment are available, inspect outgoing logs for:
    - ordinary GET `/analysis?...do_analyze=false&annotation_sync=false`;
    - queue POST form fields containing `do_analyze=true`, `essay_json`, and no `annotation_sync`;
    - queue GET `/analysis?...do_analyze=false&annotation_sync=false`.
- User flow:
  - Open generic grading statistics page for a completed grading task; confirm no third-party missing-param error.
  - For external manifest queue, confirm `analysis_fetch_request_json` or logs indicate fetch with `do_analyze=false`; if snapshots do not include `annotation_sync`, rely on gateway logs/tests.
- Data / operations:
  - No schema changes.
  - No data migration.
- Observability:
  - `ExamThirdPartyGatewayServiceImpl` logs sanitized multipart form fields and final query URL; use those logs for local smoke verification.

## Rollback / Recovery

- If third-party later requires POST `annotation_sync=false`, add it to `buildAnalysisFormFields(...)` in a separate contract change with a focused test and doc update.
- If ordinary analysis GET fails because the third-party expects `annotation_sync` in a different spelling, change the constant in one place and rerun targeted tests.
- If the statistics page still fails after code change, verify it still uses `invokeThirdPartyTaskAnalysis(...)`; if not, add the same fixed query map to the new analysis call site.

## Plan Self-Review

- Placeholder scan: no unresolved placeholder marker or vague implementation-only task remains.
- Consistency check: every PRD requirement R1-R6 maps to at least one implementation unit.
- Scope check: plan does not include SQL, frontend, queue status, or controller changes.
- Acceptance coverage: A1-A5 map to U1-U6 validation.
- Validation gaps: live third-party smoke depends on local service/token availability and is listed as optional integration validation.
- Alternatives and ADR check: plan records why no new abstraction/config/public DTO is introduced.
- High-risk pre-mortem check: duplicate analysis trigger, missing ordinary query params, and doc drift are covered.

## Execution Result

- Completed on 2026-07-02.
- U1/U3 TDD red tests were observed before implementation:
  - ordinary analysis test failed because request `queryParams` was `null`;
  - external manifest gateway fetch test failed because `annotation_sync` was absent.
- U2/U4 implementation completed:
  - ordinary `invokeThirdPartyTaskAnalysis(...)` now passes `do_analyze=false` and `annotation_sync=false` in `ExternalApiInvokeRequestDTO.queryParams`;
  - external manifest `fetchAnalysis(...)` now passes `do_analyze=false` and `annotation_sync=false` in query params;
  - `triggerAnalysis(...)` multipart form remains `do_analyze=true` plus `essay_json`, with no `annotation_sync`.
- U5 documentation and AI memory updates completed:
  - API docs under `docs/04-api`;
  - long-term memory under `docs/08-ai-memory`;
  - process evidence under `docs/00-process/archive/2026-07/generic-grading-analysis-query-params/`.
- U6 validation completed:
  - `mvn -pl axon-common "-Dtest=ExamGenericGradingServiceImplTest#getTaskAnalysis_usesSchoolExamGradingPathAndPreservesDynamicAnalysis,ExamAssignmentGradingExternalManifestGatewayServiceImplTest" test` passed with 7 tests and 0 failures.
  - `git diff --check` passed; Git only reported Windows LF/CRLF conversion warnings.
  - `rg` inspection confirmed `annotation_sync` is present in GET query construction, tests, API docs, and AI memory, not in Controller or SQL changes.
- Review fix completed:
  - `analysis_fetch_request_json` remains the existing local request-options snapshot (`doAnalyze=false`) and is not treated as a full third-party URL/query log.
  - The authoritative evidence for `annotation_sync=false` on queue fetch is the Gateway request DTO, third-party gateway final URL logs, and `ExamAssignmentGradingExternalManifestGatewayServiceImplTest`.
- AE final gate proof: `docs/ae/gates/20260702T024406Z-work-final.json`.

## Handoff

Implementation is complete. Do not add `annotation_sync` to POST trigger unless a future third-party contract explicitly requires it. Do not expose `annotation_sync` as a frontend/controller parameter.
