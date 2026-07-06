---
type: plan
status: archived-paused
date: 2026-06-29
title: paper-pool-pdf-first-pages
origin: docs/ae/prds/2026-06-29-paper-pool-pdf-first-pages-prd.md
originFingerprint: 2026-06-29-paper-pool-pdf-first-pages
depth: standard
format: human-readable-plan
sharded: false
---

# Plan: paper-pool-pdf-first-pages

## Source

- Requirement source: `docs/ae/prds/2026-06-29-paper-pool-pdf-first-pages-prd.md`
- User requested this turn: create an analysis plan first; after confirmation, create the test class.
- Sample PDF URL: `https://coureseprep-user-public.oss-cn-chengdu.aliyuncs.com/testdata/%E9%87%91%E5%8D%8E-%E6%89%B9%E9%87%8F.pdf`
- 2026-06-29 update: after comparing Java vs Python/Go sidecar/script, the selected first production route is Java-in-process. Generated image metadata must include path, width, and height.

## AI Parse Contract

- canonicalKind: plan
- humanEquivalent: true
- stableIdsRequired: true
- noImplicitScope: true

## Scope

- In scope now: analysis and proposed test plan only.
- In scope after approval: add a test class that verifies reading the sample PDF and rendering pages 1 and 2 to PNG.
- Later implementation scope: integrate conversion into `POST /api/v1/exam-capability/composition/paper-pools/save` create flow and persist generated image paths plus width/height after DB field decision is confirmed.
- Out of scope now: Java production changes, SQL migration execution, commit/push.

## Readiness

- Goal: prove the backend can fetch the paper pool PDF using a low-bandwidth-safe path and render the first two pages to PNG before production integration.
- Acceptance criteria:
  - `mergedPdfOssPath` points to a readable PDF object.
  - page count is at least 2.
  - page 1 and page 2 produce valid PNG bytes.
  - test reports image dimensions and byte sizes.
  - production persistence stores each generated page image path together with width and height.
  - the plan does not rely on repeated public Internet download in production.
- Non-goals:
  - Do not change API response/request contract in this approval step.
  - Do not add database columns until field names and bucket choice are confirmed.
- Affected areas:
  - `axon-common/src/test/java/com/xinxi/axon/common/service/exam/impl/`
  - `axon-common/pom.xml` if PDFBox dependency is approved.
  - Later: `ExamCompositionPaperPoolDbStore`, `ExamCompositionPaperPoolPO`, `ExamCompositionPaperPoolVO`, mapper XML, SQL migration under `docs/06-sql/migrations`.
- Validation surface:
  - Maven test for the new test class.
  - Optional OSS integration test gated by a property/profile.
  - Later service unit test around create flow.
- Open questions:
  - OQ1: target DB field names for page image path, width, and height.
  - OQ2: target bucket for generated PNGs.
  - OQ3: fail-open or fail-closed behavior when conversion fails.

## Repo Facts

- `ExamCompositionPaperPoolSaveDTO` already carries `mergedPdfOssPath` for the combined whole-paper PDF.
- `ExamCompositionPaperPoolDbStore#createPaperPool` persists create records and currently sets `coverUrl` and `mergedPdfOssPath`.
- `ExamCompositionPaperPoolPO` maps `exam_composition_paper_pool`; current fields include `cover_url` and `merged_pdf_oss_path`, but no explicit page image columns.
- Existing memory confirms top-level `osskey` is derived from `exam_composition_paper_pool.merged_pdf_oss_path`; item `file_url` must not be reused as the top-level PDF source.
- `axon-common` already has Aliyun OSS SDK and OkHttp dependencies.
- The project has an existing third-party wrapper `ExamRecognitionServiceImpl#invokePdfToImages` for `/api/v1/image/pdf-to-images`, supporting `pdfUrl`, `dpi`, `page_range`, and `sync`.
- No existing PDFBox dependency or local `PDFRenderer` usage was found.
- Local validation has since added `org.apache.pdfbox:pdfbox:3.0.3` as a test-scoped dependency and created `ExamCompositionPaperPoolPdfFirstPagesRenderTest`.
- The local public-URL test rendered page 1 and page 2 to `1192 x 1683` PNGs, with byte sizes `447013` and `122305`.
- Current OSS endpoint config is `https://oss-cn-chengdu.aliyuncs.com`; Alibaba Cloud same-region internal endpoint for Chengdu is `https://oss-cn-chengdu-internal.aliyuncs.com`.

## Assumptions

- The server is deployed in the same Alibaba Cloud region as the bucket, or can be configured to use the Chengdu internal OSS endpoint.
- The sample object key is `testdata/金华-批量.pdf` in bucket key `public`.
- The first executable test should avoid depending on production DB and should not insert paper pool records.
- A production converter should upload PNGs to OSS and persist paths plus dimensions, not store BLOBs in MySQL.
- Java remains the first implementation target; Python/Go service extraction is deferred until there is concrete performance, compatibility, or operational evidence.

## Alternatives Considered

- Recommended / selected first route: Java service with OSS SDK/internal endpoint read + PDFBox render + OSS upload.
  - Fit: avoids public egress on same-region ECS, keeps conversion under backend control, can be unit/integration tested without third-party service availability.
  - Trade-off: adds PDFBox dependency and CPU/memory work to the backend.
  - Risk: large or malformed PDFs can consume memory/CPU unless size, page count, DPI, and timeout bounds are enforced.
- Alternative: Python/PyMuPDF or Go/pdfium internal service, called by Java before insert.
  - Fit: isolates rendering CPU/memory from the Spring Boot process and can become a general document-preview service.
  - Trade-off: adds deployment, auth, retries, observability, and idempotency contracts.
  - Risk: a mounted script or per-request process spawn is not suitable for online save flow; if this route is needed later, it should be a long-running internal HTTP/RPC service.
- Alternative: call existing third-party `/image/pdf-to-images` wrapper with `page_range=1-2`.
  - Fit: no local PDF renderer dependency; wrapper already exists.
  - Trade-off: if third-party pulls the public URL, public bandwidth or external dependency behavior may still be a problem; result shape and storage location are controlled by the provider.
  - Risk: synchronous save API becomes coupled to third-party availability and latency.
- Rejected: download the public HTTPS URL directly with `HttpClient` in the save path.
  - Rejected because: it uses public network bandwidth, repeats full-file download, and ignores existing OSS SDK/read-client infrastructure.

## Decision Drivers

- Driver 1: Avoid consuming a 2 Mbps public bandwidth bottleneck for same-region OSS objects.
- Driver 2: Keep the first test small and decisive: readable PDF, first two pages, valid PNG bytes.
- Driver 3: Preserve existing paper pool table semantics while adding explicit image metadata fields.
- Driver 4: Keep the first production implementation operationally simple by staying in Java.

## Decisions

### ADR-1 - Use OSS Object Read For Source PDF

- Decision: Read `mergedPdfOssPath` through OSS object APIs or an internal OSS endpoint rather than through the public URL in production.
- Drivers: bandwidth, timeout control, existing OSS config, object-key semantics.
- Alternatives: public HTTPS download; third-party pull by URL.
- Why chosen: same-region internal OSS traffic avoids public egress and is easier to bound with existing OSS SDK timeouts.
- Consequences: environment config should support `oss-cn-chengdu-internal.aliyuncs.com` for backend OSS clients while external/public URLs can remain public for front-end access.
- Follow-ups: add an internal endpoint property or deployment override if current single `aliyun.oss.endpoint` cannot differ by environment.

### ADR-2 - Render Locally For The Verification Test

- Decision: Use Java/PDFBox for the first production route; keep Python/Go service extraction as a later optimization path only.
- Drivers: deterministic test, no extra runtime deployment, direct byte-level assertions, easiest integration with existing Java service and OSS utilities.
- Alternatives: Python/PyMuPDF internal service; Go/pdfium service; third-party `pdf-to-images`; mounted command-line script.
- Why chosen: the current volume and requirement are better served by a focused Java service, and the local test has already proven PDFBox can render the target sample.
- Consequences: production code must isolate rendering behind `ExamCompositionPaperPreviewService` and enforce file size, timeout, DPI, and page-count bounds so the web service does not absorb unbounded PDF work.
- Follow-ups: promote PDFBox dependency from test scope if production code uses it.

### ADR-3 - Persist Paths And Dimensions, Not Image Bytes

- Decision: Later production implementation should upload PNGs to OSS and store URL/object path fields plus width and height in DB.
- Drivers: database size, cacheability, existing OSS file model, front-end layout needs.
- Alternatives: BLOB columns; JSON blob in description; overloading item preview fields; storing path only and requiring clients to inspect image metadata.
- Why chosen: aligns with current OSS path-based file architecture, avoids corrupting `exam_composition_paper_pool_item` semantics, and lets API consumers render placeholders/layouts without fetching each PNG first.
- Consequences: migration should add explicit metadata fields for page 1 and page 2.
- Follow-ups: confirm exact column names and target bucket.

## Risks

- RISK1: PDFBox rendering can be memory-heavy if DPI is too high or files are large.
- RISK2: Changing global `aliyun.oss.endpoint` to internal endpoint may break clients outside Alibaba Cloud if applied in local/dev environments without override.
- RISK3: Saving image paths into `cover_url` plus another new field may create unclear semantics if page 1 is not intended as the visual cover.
- RISK4: Synchronous conversion inside `savePaperPool` can make API latency and transaction duration worse.
- RISK5: Persisted width/height can drift if the OSS image is later overwritten without updating the DB; generated object keys should be immutable or content-addressed enough to avoid replacement drift.

## Pre-Mortem

- Failure scenario 1: The test passes locally using public HTTPS but production still consumes public bandwidth.
  - Mitigation: test should include an OSS SDK/internal endpoint mode and the implementation should use object key reads.
- Failure scenario 2: Rendering succeeds for sample PDF but fails for encrypted/scanned/huge PDFs in production.
  - Mitigation: validate PDF page count, encryption state, max content length, render DPI, and conversion timeout.
- Failure scenario 3: The save API inserts the paper pool but PNG upload fails, leaving inconsistent fields.
  - Mitigation: decide fail-open/fail-closed behavior before production code; if fail-closed, run conversion before DB insert or in one controlled transaction boundary with cleanup.
- Failure scenario 4: API consumers rely on stored width/height but the stored values are null or stale.
  - Mitigation: generate dimensions from the same `BufferedImage` that is encoded and uploaded, persist dimensions in the same DB write as the path, and avoid overwriting generated OSS objects.

## Implementation Units

### U1 - Add PDF Source Parsing And Render Test

- Goal: create a test class that proves pages 1 and 2 render to PNG bytes from the sample PDF.
- Requirements covered: R1, R2, R3, NFR1, NFR2
- Acceptance criteria covered: PDF readable, page count >= 2, PNG bytes non-empty, dimensions and sizes logged/reported.
- Depends on: none
- Files:
  - Modify: `axon-common/pom.xml` only if PDFBox is not already transitively available.
  - Create: `axon-common/src/test/java/com/xinxi/axon/common/service/exam/impl/ExamCompositionPaperPoolPdfFirstPagesRenderTest.java`
- Forbidden files:
  - `axon-common/src/main/java/**`
  - `axon-chat/src/main/java/**`
  - `docs/06-sql/**`
- Approach:
  - Add PDFBox as a test/runtime dependency if approved.
  - In the test, resolve source as object key `testdata/金华-批量.pdf`.
  - Prefer OSS SDK read when credentials/profile are present; otherwise mark integration test disabled unless a property such as `-DpaperPoolPdfRender.integration=true` is set.
  - Render `PDFRenderer.renderImageWithDPI(0, 144, ImageType.RGB)` and page `1`.
  - Encode each image with `ImageIO.write(image, "png", outputStream)`.
  - Assert each PNG byte array has a valid PNG signature, positive dimensions, and byte length > 0.
- Tests:
  - New JUnit test method: `renderFirstTwoPagesFromSamplePdfToPng()`.
  - Optional helper assertions: `assertPng(byte[] bytes)`, `assertHasAtLeastTwoPages(PDDocument document)`.
- Validation:
  - `mvn -pl axon-common -Dtest=ExamCompositionPaperPoolPdfFirstPagesRenderTest test`
  - If external integration is gated: `mvn -pl axon-common -Dtest=ExamCompositionPaperPoolPdfFirstPagesRenderTest -DpaperPoolPdfRender.integration=true test`
- Rollback signals:
  - Maven cannot resolve PDFBox.
  - Test requires real credentials in default unit-test path.
  - Rendered PNG memory usage is excessive for the sample.
- Deferred to implementation:
  - Exact PDFBox version.
  - Whether to write rendered PNGs to `target/paper-pool-pdf-render/` for manual inspection.

### U2 - Verify OSS Internal Endpoint Strategy

- Goal: prove the production read path can avoid public bandwidth.
- Requirements covered: R3, NFR1
- Acceptance criteria covered: plan names internal endpoint and object-key read path.
- Depends on: U1
- Files:
  - Create or update test-only configuration if needed under `axon-common/src/test/resources/`.
  - Later production config may use `axon-chat/src/main/resources/application-*.yml`.
- Forbidden files:
  - Production YAML unless user explicitly approves implementation.
- Approach:
  - In test documentation/logging, distinguish these addresses:
    - public object URL for browsers: `https://coureseprep-user-public.oss-cn-chengdu.aliyuncs.com/testdata/金华-批量.pdf`
    - OSS internal endpoint for backend clients: `https://oss-cn-chengdu-internal.aliyuncs.com`
    - possible internal bucket domain: `https://coureseprep-user-public.oss-cn-chengdu-internal.aliyuncs.com/testdata/金华-批量.pdf`
  - Prefer SDK `getObject(bucket, key)` with endpoint override instead of direct URL fetch.
  - Add timeout and content-length checks before render.
- Tests:
  - If credentials exist, read the object metadata/content through the configured internal endpoint and assert content type or object size.
- Validation:
  - Test logs show `bucket=coureseprep-user-public`, `key=testdata/金华-批量.pdf`, `endpoint=oss-cn-chengdu-internal.aliyuncs.com` when internal mode is enabled.
- Rollback signals:
  - Endpoint override causes local environment failures.
  - Deployment environment is not same-region ECS/VPC and cannot reach the internal endpoint.
- Deferred to implementation:
  - Separate config property name, for example `aliyun.oss.internal-endpoint`.

### U3 - Design Later Save-Flow Integration

- Goal: after the render test is approved and passing, add production services and persistence without overloading existing fields.
- Requirements covered: R4, R5, R6, NFR3, NFR4
- Acceptance criteria covered: create flow gets PNG paths plus dimensions; update and item semantics remain unchanged.
- Depends on: U1, U2, DB field decision
- Files:
  - Later modify: `axon-common/src/main/java/com/xinxi/axon/common/service/exam/impl/ExamCompositionPaperPoolDbStore.java`
  - Later create: `axon-common/src/main/java/com/xinxi/axon/common/service/exam/ExamCompositionPaperPreviewService.java`
  - Later create: `axon-common/src/main/java/com/xinxi/axon/common/service/exam/impl/ExamCompositionPaperPreviewServiceImpl.java`
  - Later modify: `axon-common/src/main/java/com/xinxi/axon/common/entity/exam/ExamCompositionPaperPoolPO.java`
  - Later modify: `axon-common/src/main/java/com/xinxi/axon/common/vo/exam/ExamCompositionPaperPoolVO.java`
  - Later modify: `axon-common/src/main/resources/mapper/exam/ExamCompositionPaperPoolMapper.xml`
  - Later create: `docs/06-sql/migrations/YYYY-MM-DD-add-paper-pool-preview-image-metadata.sql`
- Forbidden files:
  - `axon-chat/src/main/java/com/xinxi/chatservice/controller/exam/ExamCapabilityController.java` unless API contract changes.
- Approach:
  - Add a small Java service that accepts `mergedPdfOssPath`, reads the object, renders pages 1 and 2, uploads PNGs to the chosen bucket, and returns two page image metadata objects.
  - Recommended return type: `ExamCompositionPaperPreviewImages` with page 1 and page 2 entries; each entry carries `imageUrl`, `width`, and `height`.
  - In `createPaperPool`, call the service only when `dto.getPaperPoolId() == null` and `mergedPdfOssPath` has text.
  - Store returned paths and dimensions in explicit DB fields after migration.
  - Recommended columns: `first_page_image_url`, `first_page_image_width`, `first_page_image_height`, `second_page_image_url`, `second_page_image_width`, `second_page_image_height`.
  - Keep `exam_composition_paper_pool_item.file_url/preview_url` untouched because those represent paper item files.
- Tests:
  - Unit test create flow with mocked preview service returning two paths and dimensions.
  - Unit test no conversion when `mergedPdfOssPath` is blank.
  - Unit test conversion failure behavior after OQ3 is decided.
- Validation:
  - `mvn -pl axon-common -Dtest=ExamCompositionPaperPoolDbStoreTest,ExamCompositionPaperPoolPdfFirstPagesRenderTest test`
- Rollback signals:
  - DB migration not applied but entity expects columns.
  - Create API latency exceeds acceptable threshold.
  - Generated PNG paths are inaccessible through expected preview URL flow.
  - Stored width/height are zero, null, or inconsistent with the rendered PNG.
- Deferred to implementation:
  - Final field names, target bucket, and failure behavior.

## Consistency Check

- implementationUnitCount: 3
- sourceRequirementsCovered: R1, R2, R3, R4, R5, R6, NFR1, NFR2, NFR3, NFR4
- sourceRequirementsDeferred: production persistence details for R4, R5, and R6 are deferred until OQ1, OQ2, and OQ3 are answered.
- openQuestionsCount: 3

## Validation Plan

- Unit:
  - Add PDF render assertions for page count and PNG bytes.
  - Later add `ExamCompositionPaperPoolDbStoreTest` cases for create-flow service invocation.
- Integration:
  - Gated OSS read test using `paperPoolPdfRender.integration=true`.
  - Verify same-region internal endpoint mode from an Alibaba Cloud environment before production rollout.
- User flow:
  - After implementation, call `POST /api/v1/exam-capability/composition/paper-pools/save` with `mergedPdfOssPath` and verify returned detail includes generated image path, width, and height fields.
- Data / operations:
  - SQL migration adds page image path and dimension columns only after field decision.
  - Confirm object paths exist in the selected OSS bucket.
- Observability:
  - Log conversion timing, source bucket/key, page count, image byte sizes, upload object keys, and failure reason without logging credentials.

## Rollback / Recovery

- Test-only phase rollback: delete the new test class and remove PDFBox dependency if added.
- Production rollback later:
  - Disable conversion through a feature flag or config property.
  - Stop writing preview image metadata fields while preserving `merged_pdf_oss_path`.
  - If migration was applied, leave nullable columns in place until cleanup is explicitly planned.

## Plan Self-Review

- Placeholder scan: no placeholder sections or implementation TODOs remain.
- Consistency check: requirements map to U1-U3.
- Scope check: current turn is document-only; test creation is gated by user confirmation; production persistence is gated by DB field, bucket, and failure-policy decisions.
- Acceptance coverage: PDF readability, two-page rendering, low-bandwidth read path, Java first route, and later image metadata persistence are covered.
- Validation gaps: real internal endpoint proof requires Alibaba Cloud same-region environment or credentials and is intentionally gated.
- Alternatives and ADR check: Java local render, Python/Go service, third-party render, and public download paths are compared.
- High-risk pre-mortem check: bandwidth, rendering resource use, and save-flow consistency are covered.

## Handoff

- Recommended next step after user approval: implement U1 only, then run the gated Maven test.
- Do not implement U3 until OQ1, OQ2, and OQ3 are answered; U3 should store both image paths and image dimensions.

## 2026-06-29 Pause Note

- Current status: paused by user request after local verification; related code changes are being rolled back from the working tree.
- Verified before rollback:
  - Local PDFBox test rendered the sample PDF first two pages to PNG.
  - Generated files were under `axon-common/target/paper-pool-pdf-first-pages/`.
  - Page 1 and page 2 dimensions were both `1192 x 1683`.
  - Page byte sizes observed: page 1 `447013`, page 2 `122305`.
  - Temporary OSS diagnostic API compiled and its service unit test passed before removal.
- Temporary files created during exploration and then selected for rollback:
  - `axon-common/pom.xml` PDFBox test dependency.
  - `axon-common/src/test/java/com/xinxi/axon/common/service/exam/impl/ExamCompositionPaperPoolPdfFirstPagesRenderTest.java`
  - `axon-chat/src/main/java/com/xinxi/chatservice/controller/common/OssDiagnosticsController.java`
  - `axon-common/src/main/java/com/xinxi/axon/common/dto/common/OssPublicBucketRoundtripDiagnosticsDTO.java`
  - `axon-common/src/main/java/com/xinxi/axon/common/service/common/OssDiagnosticsService.java`
  - `axon-common/src/main/java/com/xinxi/axon/common/service/common/impl/OssDiagnosticsServiceImpl.java`
  - `axon-common/src/main/java/com/xinxi/axon/common/vo/common/OssPublicBucketRoundtripDiagnosticsVO.java`
  - `axon-common/src/test/java/com/xinxi/axon/common/service/common/impl/OssDiagnosticsServiceImplTest.java`
- Future recovery note: if this work resumes, restore from the archived handoff at `docs/00-process/archive/2026-06/paper-pool-pdf-first-pages-paused/handoff.md` and re-apply only the needed subset.
- Archive path: `docs/00-process/archive/2026-06/paper-pool-pdf-first-pages-paused/`.
