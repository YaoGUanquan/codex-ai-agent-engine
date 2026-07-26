---
type: plan
status: completed
date: 2026-06-29
title: external-manifest-to-assignment-grading
depth: standard
format: human-readable-plan
sharded: false
---

# Plan: external-manifest-to-assignment-grading

## Source

- User request: add a public third-party-facing endpoint with no authentication.
- Input param: `manifest_id`.
- Flow: fetch third-party manifest detail, map returned JSON into a `create-from-manual` payload, then trigger `batch_assignment_grading`.
- Existing reference flow: `POST /api/v1/exam-assignment-grading/create-with-manual-manifest`.
- Existing third-party APIs:
  - `GET /api/v1/generic_grading/manifests/{manifest_id}`
  - `POST /api/v1/manifests/create-from-manual`
  - `POST /api/v1/batch_assignment_grading`

## AI Parse Contract

- canonicalKind: plan
- humanEquivalent: true
- stableIdsRequired: true
- noImplicitScope: true

## Scope

- In scope: design and implement one new public controller entry and one orchestration service method that:
  - accepts `manifest_id`,
  - fetches manifest detail from the third party,
  - builds the third-party manual-manifest payload,
  - calls `create-from-manual`,
  - uses the returned `manifestId` to create the batch grading task,
  - returns the composite result to the caller.
- In scope: security config change to allow the new endpoint without login.
- In scope: tests for request mapping, third-party call ordering, and failure propagation.
- Out of scope: changes to the third-party APIs themselves, unrelated generic grading flows, and any UI work.

## Readiness

- Goal: expose a stable public API for third-party systems to create grading tasks from a manifest ID only.
- Acceptance criteria:
  - public endpoint does not require login or school/user context,
  - manifest detail is fetched before any create call,
  - `questions[].stem` maps to `prompt_requirements`,
  - `layout_json_url` regions `bbox` map to `preset`,
  - `questions[].total_score` maps to `sections[].grading_template.default_total_score`,
  - the batch grading create call uses the newly created manifest id, not the original external manifest id,
  - the successful response reuses the existing `ApiResult<ExamAssignmentGradingCreateWithManualManifestVO>` shape and field names from `POST /api/v1/exam-assignment-grading/create-with-manual-manifest`,
  - batch-create failure is surfaced to the caller while the third party handles orphan manifest cleanup.
- Non-goals:
  - no new business rules for grading field semantics,
  - no generic manifest schema redesign,
  - no direct third-party payload passthrough.
- Affected areas:
  - `axon-chat` controller/security entry,
  - `axon-common` exam assignment grading service and DTO/VO layer,
  - focused unit tests in `axon-common` and `axon-chat`.
- Validation surface:
  - unit tests for payload mapping and call order,
  - controller test for anonymous access and parameter binding.

## Repo Facts

- `ExamAssignmentGradingController` already hosts the internal `create-with-manual-manifest` flow.
- `ExamAssignmentGradingServiceImpl#createManifestFromManual` already compiles `promptRequirements`, `default_total_score`, and deduction/template data from local detail services.
- `ExamAssignmentGradingServiceImpl#createTaskWithManualManifest` already chains manifest creation and batch task creation.
- `ExamGenericGradingApiEnum` already defines `MANIFEST_DETAIL`.
- `ExamAssignmentGradingApiEnum` already defines `MANIFEST_CREATE_FROM_MANUAL` and `CREATE`.
- `SecurityConfig` already has `permitAll()` patterns for specific public endpoints, including the current test-only external endpoints.
- The attached manifest sample shows the third-party detail payload carries:
  - top-level `manifest_id`, `exam_json_url`, `layout_json_url`, `manifest_url`,
  - `exam_json_url` JSON with `questions[].stem` and `questions[].total_score`,
  - `layout_json_url` JSON with `regions[].bbox`,
  - `oss_refs.sample_images` and `oss_refs.exam_json_adjusted/layout_json_adjusted/strategy_json_adjusted`.

## Assumptions

- The new public endpoint is intended to be a third-party integration endpoint, not a user-facing school-authenticated endpoint.
- The third-party `exam_json_url` and `layout_json_url` are fetchable by this backend, either directly via public URLs or through an existing document fetch helper.
- The `create-from-manual` API accepts the same field names already used by the internal flow; this plan only changes how the payload is sourced.
- The `batch_assignment_grading` create call should keep using the existing defaults from `create-with-manual-manifest` unless the new manifest-derived flow requires a direct mapping.
- The public success response should be the same merged manifest + grading-task shape already returned by the internal `/api/v1/exam-assignment-grading/create-with-manual-manifest` flow.
- If `batch_assignment_grading` fails after manifest creation, the provider is assumed to clean the orphan manifest; the local service should not add a second rollback branch.

## Alternatives Considered

- Recommended: add one dedicated orchestration method and one public controller endpoint that reuses the existing internal create flow primitives.
  - Fit: smallest blast radius, preserves current internal API behavior, and keeps the field mapping in one place.
  - Trade-off: adds a new public entry point and a dedicated mapper method.
  - Risk: duplicate mapping logic if the mapper is not factored cleanly.
- Alternative: extend `create-with-manual-manifest` to accept `manifest_id` and branch internally.
  - Fit: fewer controller methods.
  - Trade-off: mixes local-authenticated and public third-party flows in one contract.
  - Risk: makes an already broad method harder to reason about and test.
- Alternative: add a new gateway service that returns a fully compiled manual-manifest request DTO.
  - Fit: strong separation from controller.
  - Trade-off: extra abstraction before the flow is proven.
  - Risk: over-abstracts a one-off integration and moves the logic away from the existing service that already owns the third-party contract.

## Decision Drivers

- Driver 1: preserve the existing internal `create-with-manual-manifest` behavior.
- Driver 2: keep third-party field mapping explicit and testable.
- Driver 3: avoid leaking school/user authentication concerns into a third-party proxy endpoint.
- Driver 4: keep the public contract narrow enough that failures are traceable to one manifest id.

## Decisions

### ADR-1 - Public Proxy Endpoint Lives Beside Existing Assignment Grading Controller

- Decision: add one new anonymous endpoint under the existing exam assignment grading controller namespace.
- Drivers: reuse the current service boundary, keep API discoverability, and avoid scattering a one-off integration across modules.
- Alternatives: add it to generic grading, or create a new dedicated controller package.
- Why chosen: the flow ends in `batch_assignment_grading`, so the assignment-grading module already owns the downstream task creation.
- Consequences: security config must explicitly permit the new route.
- Follow-ups: decide the final route name before implementation; keep it versioned under `/api/v1/...`.

### ADR-2 - Map Third-Party Detail JSON Into Existing Manifest Builder Semantics

- Decision: convert `generic_grading/manifests/{manifest_id}` payload into the same semantic inputs already used by `create-from-manual`.
- Drivers: the internal flow already compiles `promptRequirements`, `default_total_score`, template criteria, and deduction rules correctly.
- Alternatives: create a brand-new payload contract for the third-party public endpoint.
- Why chosen: reduces mismatch risk and lets the new endpoint reuse proven mapping behavior.
- Consequences: the mapper must clearly document any fields that cannot be derived from the returned JSON.
- Follow-ups: add explicit mapping helpers for `exam_json_url` and `layout_json_url`.

## Pre-Mortem

- Failure scenario 1: the endpoint is public but still blocked by Spring Security. Mitigation: add an explicit `permitAll()` matcher and controller test.
- Failure scenario 2: `manifest_id` detail succeeds, but `create-from-manual` payload is incomplete because `exam_json_url` or `layout_json_url` content is parsed incorrectly. Mitigation: unit test the JSON-to-DTO mapper against the attached sample shape.
- Failure scenario 3: the manifest is created successfully, but batch grading creation fails and the caller cannot tell which step failed. Mitigation: keep the success response identical to the current merged VO and return the service error for the failed stage.
- Failure scenario 4: the flow relies on a field from the manifest sample that is only present in adjusted URLs, not the base JSON. Mitigation: fetch exactly the URLs returned by the detail API and do not infer adjusted paths.
- Failure scenario 5: the public endpoint becomes a hidden auth bypass for unrelated operations. Mitigation: keep it single-purpose and anonymous only for this one route.

## Implementation Units

### U1 - Add Public Controller Entry

- Goal: expose a no-auth endpoint that accepts `manifest_id` and invokes the orchestration service.
- Requirements covered: public access, input binding, endpoint discoverability.
- Acceptance criteria covered: third-party can call the route without login; only `manifest_id` is required at the HTTP layer.
- Depends on: none
- Files:
  - Modify: `axon-chat/src/main/java/com/xinxi/chatservice/controller/exam/ExamAssignmentGradingController.java`
  - Modify: `axon-common/src/main/java/com/xinxi/axon/common/config/SecurityConfig.java`
  - Modify: `axon-chat/src/test/java/com/xinxi/chatservice/controller/exam/ExamAssignmentGradingControllerTest.java`
- Forbidden files:
  - `axon-common/src/main/java/com/xinxi/axon/common/service/exam/support/**`
  - unrelated controller modules
- Approach:
  - Add a dedicated `POST` endpoint, for example `/api/v1/exam-assignment-grading/external/create-from-manifest`.
  - Bind `manifest_id` from request body or query parameter, but keep one shape only.
  - Bypass `getUserIdFromRequest` and `getSchoolIdByUserId` for this route.
  - Return the composite VO directly from service.
- Tests:
  - Controller test for anonymous access pattern and request binding.
  - Controller test that the service is invoked with just `manifest_id`.
- Validation:
  - `mvn -pl axon-chat -Dtest=ExamAssignmentGradingControllerTest test`
- Rollback signals:
  - route still requires login,
  - controller tries to resolve user context,
  - security matcher accidentally opens a broader surface.
- Deferred to implementation:
  - final endpoint path and request body shape.

### U2 - Add Third-Party Manifest Proxy Orchestration

- Goal: fetch third-party manifest detail, build `create-from-manual`, then create the batch grading task in one service method.
- Requirements covered: call ordering, field mapping, batch task creation.
- Acceptance criteria covered: `manifest_id` detail is fetched first; `questions[].stem` maps to prompt requirements; layout bbox maps to preset; total score maps to grading template default total score.
- Depends on: U1
- Files:
  - Modify: `axon-common/src/main/java/com/xinxi/axon/common/service/exam/ExamAssignmentGradingService.java`
  - Modify: `axon-common/src/main/java/com/xinxi/axon/common/service/exam/impl/ExamAssignmentGradingServiceImpl.java`
  - Modify: `axon-common/src/main/java/com/xinxi/axon/common/dto/exam/ExamAssignmentGradingCreateWithManualManifestRequestDTO.java`
  - Modify: `axon-common/src/main/java/com/xinxi/axon/common/vo/exam/ExamAssignmentGradingCreateWithManualManifestVO.java`
  - Modify: `axon-common/src/main/java/com/xinxi/axon/common/service/exam/ExamThirdPartyGatewayService.java`
  - Modify: `axon-common/src/main/java/com/xinxi/axon/common/enums/exam/ExamGenericGradingApiEnum.java`
- Forbidden files:
  - generic grading JSON generation services unrelated to this flow
  - DB/entity migration files
- Approach:
  - Add a dedicated public orchestration method, separate from `createTaskWithManualManifest`.
  - Reuse the existing `createManifestFromManual` and `createTask` primitives where possible.
  - Introduce a small mapper that converts the third-party manifest detail response into `ExamAssignmentGradingManualManifestCreateRequestDTO`.
  - Add a helper for reading `exam_json_url` and `layout_json_url` JSON payloads and extracting:
    - `questions[].stem -> sections[].prompt_requirements`,
    - `questions[].total_score -> sections[].max_score + sections[].grading_template.default_total_score`,
    - `layout_json_url.regions[].bbox[0] -> sections[].preset` (not `grading_template.preset`).
  - Keep `name_rotate` fixed at `0` and `name_preset` fixed to the provided constant shape.
  - Keep `preset.id` fixed as `manual_roi_test_essay` and map `bbox` coordinates into `ref_w`, `ref_h`, `roi_x`, `roi_y`, `roi_w`, `roi_h`, `shrink`.
  - Use the newly created manifest id from the first call when creating the grading task.
- Tests:
  - Service test for happy path call order.
  - Service test for empty/invalid manifest detail response.
  - Service test for field mapping from the attached JSON sample shape.
- Validation:
  - `mvn -pl axon-common -Dtest=ExamAssignmentGradingServiceImplTest test`
- Rollback signals:
  - mapping omits `prompt_requirements` or `default_total_score`,
  - layout bbox is applied to the wrong level,
  - batch task uses the original external manifest id instead of the created manifest id.
- Deferred to implementation:
  - exact helper names and whether the mapper should live in the service or a small support class.

### U3 - Align Success Response With Existing Merged VO

- Goal: keep success output identical to the existing merged flow.
- Requirements covered: response compatibility, failure propagation, integration traceability.
- Acceptance criteria covered: the caller receives the same merged success payload as the current internal endpoint; if batch creation fails after manifest creation, the service returns the failure without changing the success schema.
- Depends on: U2
- Files:
  - Modify: `axon-common/src/main/java/com/xinxi/axon/common/service/exam/impl/ExamAssignmentGradingServiceImpl.java`
  - Modify: `axon-chat/src/test/java/com/xinxi/chatservice/controller/exam/ExamAssignmentGradingControllerTest.java`
- Forbidden files:
  - public docs outside `docs/ae`
- Approach:
  - Return the same `manifest` + `gradingTask` success payload as the existing merged endpoint so callers do not need a new response parser.
  - On failure after manifest creation, surface the batch-create failure directly; the third party owns orphan cleanup.
- Tests:
  - Service test for manifest-create success / batch-create failure.
  - Controller test that the success JSON matches the current merged endpoint shape.
  - Controller test for error code passthrough on batch-create failure.
- Validation:
  - `mvn -pl axon-common -Dtest=ExamAssignmentGradingServiceImplTest test`
  - `mvn -pl axon-chat -Dtest=ExamAssignmentGradingControllerTest test`
- Rollback signals:
  - success JSON diverges from `POST /api/v1/exam-assignment-grading/create-with-manual-manifest`,
  - failure path mutates or hides the merged success schema.
- Deferred to implementation:
  - none.

## Consistency Check

- implementationUnitCount: 3
- sourceRequirementsCovered: all requested flow steps
- sourceRequirementsDeferred: exact endpoint path and request body shape
- openQuestionsCount: 0

## Validation Plan

- Unit:
  - verify field mapping from the attached sample JSON,
  - verify manifest-create happens before batch-create,
  - verify the created manifest id is reused.
- Integration:
  - controller test with anonymous access path,
  - gateway test for the manifest detail endpoint if a lightweight fixture is available.
- User flow:
  - call the new public endpoint with a known `manifest_id` and confirm the returned composite result contains both steps.
- Data / operations:
  - no DB migration is required for the first pass.
- Observability:
  - log manifest id, third-party endpoint names, and stage timing; do not log payload secrets or raw third-party tokens.

## Rollback / Recovery

- Remove the new controller route and service method.
- Restore `SecurityConfig` matcher if the public path is too broad.
- Keep the existing internal `create-with-manual-manifest` flow untouched so rollback does not affect authenticated users.

## Plan Self-Review

- Placeholder scan: no TBD/TODO sections.
- Consistency check: controller, service, security, and tests all target the same public third-party flow.
- Scope check: no unrelated refactor, no UI work, no generic grading redesign.
- Acceptance coverage: every mapping rule named by the user is tied to one implementation unit.
- Validation gaps: none beyond the normal third-party fixture and error-path testing.
- Alternatives and ADR check: the recommended path is the smallest change that reuses existing manifest/task creation logic.
- High-risk pre-mortem check: security bypass, payload mismatch, and partial-failure ambiguity are explicitly addressed.

## Handoff

Completed in the current worktree.

## Implementation Result

- Public endpoint: `POST /api/v1/exam-assignment-grading/external/create-from-manifest`.
- Request contract: JSON body only contains `manifest_id`.
- Success response: reuses `ExamAssignmentGradingCreateWithManualManifestVO`, the same merged shape used by `/api/v1/exam-assignment-grading/create-with-manual-manifest`. Response does not include layout or preset details.
- Failure behavior: if `batch_assignment_grading` fails after manual manifest creation, the local service surfaces the failure and does not delete the created manifest; orphan manifest cleanup is owned by the third party.
- PDF URL resolution:
  - first reads `exam_generic_grading_flow_state.paper_pool_pdf_url` by numeric `school_id` and returned `exam_id`;
  - if no flow-state snapshot is available, falls back to local paper pool lookup by `exam_composition_paper_pool.source_exam_id`, `pool_type=1`, `deleted=0`, then `merged_pdf_oss_path`, then first non-deleted item `file_url`.
- Third-party test data may use string `school_id`; real data is numeric. The public flow keeps the original third-party `school_id` string for the final batch create form field, while only numeric values participate in local flow-state lookup and local manifest-create context.

### Field mapping fixes (2026-06-29 follow-up)

| Issue | Fix |
|-------|-----|
| ROI placed under `grading_template.preset` | Moved to **`sections[].preset`**; third party reads ROI from section preset only |
| `bbox` single-element `{x1,y1,x2,y2}` parse failure | Dedicated **`bbox[0]`** parser in `extractBbox` |
| Missing `ref_w/ref_h` fallback to x2/y2 | Prefer layout top-level `width/height`, else **`image_info[page_index]`**; fail if still missing |
| `total_score=0` silently accepted | **`total_score <= 0` throws** before create-from-manual |
| Missing `grading_mode` on create-from-manual | DTO adds **`grading_mode`**; external entry fixed to **`paired_standard`** |
| Missing `grading_type` | Prefer question `type`, default **`essay`** |

### Fixed external-entry constants

- `name_rotate=0`
- `name_preset`: 优先 layout 姓名 region ROI；找不到时回退小模板（100×100 ref，10×10 roi，shrink=4）
- `sections[].preset.shrink=8`（不再固定 `preset.id`）
- `grading_mode=paired_standard` via `ExamAssignmentGradingModeEnum.defaultMode()`
- batch `options_json` via `buildGradingOptionsJson(null)` (unchanged from internal create flow)

### Payload alignment (2026-06-30 follow-up)

| Issue | Fix |
|-------|-----|
| 生产报错 `paper pool subject must not be blank` | **subject** 优先 `flow_state.paper_pool_id` → `exam_composition_paper_pool.subject`（转小写）；仅无 `paper_pool_id` 时回退 `source_exam_id` |
| 第三方 payload 缺 `subject`/`grade` | **grade** 优先 `flow_state.local_exam_id` → `exam_info.grade_id` |
| `fill_blank` section（如 section1 读拼音写词语）暂不支持 | **`grading_type=fill_blank` 过滤**，保留原题序号（仅传 section2 等） |
| `name_preset` 固定小模板不够准确 | 优先 layout 姓名 **region** ROI |

## Validation Result

### Unit tests (ExamAssignmentGradingServiceImplTest)

- Passed: `createTaskFromExternalGenericManifest_mapsExternalManifestAndCreatesTask` — preset on `sections[].preset`, `grading_mode=paired_standard`, `grading_template` has no preset
- Passed: `createTaskFromExternalGenericManifest_usesFlowStatePaperPoolPdfUrlFirst`
- Passed: `createTaskFromExternalGenericManifest_resolvesPaperPoolFromFlowStateId` — subject via `paper_pool_id`, not `source_exam_id`
- Passed: `createTaskFromExternalGenericManifest_resolvesSubjectAndGradeFromLocalData`
- Passed: `createTaskFromExternalGenericManifest_skipsFillBlankSections`
- Passed: `createTaskFromExternalGenericManifest_acceptsSingleRectangleBboxList` — `bbox[0]` single rectangle
- Passed: `createTaskFromExternalGenericManifest_rejectsZeroTotalScore`
- Passed: `createTaskFromExternalGenericManifest_rejectsMissingPaperPoolPdfBeforeManifestCreate`
- Passed: `createTaskFromExternalGenericManifest_surfacesBatchCreateFailureWithoutCleanup`

### Compile

- Passed: `mvn -pl axon-common -DskipTests compile`
- Passed: `mvn -pl axon-chat -am -DskipTests compile`

### Local smoke (2026-06-29)

- Input: `manifest_id=jinhua-chinese-v4`
- Created manifestId: `english_g12_20260629154602`
- create-from-manual files include `manual_roi_test_essay.json`
- layout check (must use **new** manifestId, not `jinhua-chinese-v4`): `input.grading_mode=paired_standard`, `tasks[0].roi` matches source layout (ref 1822×1287, roi 963/113/753/1091, shrink 8)

## Archive

- API document: `docs/04-api/2026-06-29-external-manifest-assignment-grading-api.md`
- Gates:
  - `docs/ae/gates/20260629T221132Z-external-manifest-flow-state-pdf-url.json`
  - `docs/ae/gates/20260629T223000Z-external-manifest-preset-grading-mode-smoke.json`
  - `docs/ae/gates/20260630T113700Z-external-manifest-flow-state-subject-grade-fill-blank.json`
- Process archive: `docs/00-process/archive/2026-06/external-manifest-to-assignment-grading/`
- AI memory: `docs/08-ai-memory/03-key-workflows.md`, `04-known-pitfalls.md`, `05-decision-log.md`, `00-index.md`
