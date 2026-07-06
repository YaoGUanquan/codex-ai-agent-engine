---
type: prd
status: archived-paused
date: 2026-06-29
topic: paper-pool-pdf-first-pages
format: human-readable-requirements
sharded: false
---

# PRD: paper-pool-pdf-first-pages

## Source

- User request: when `POST /api/v1/exam-capability/composition/paper-pools/save` creates a paper pool, fetch the first 2 pages of the submitted PDF, convert each page to a PNG, and store the generated image paths in database fields. Before implementation, create an analysis plan and then, after approval, create a test class to verify the PDF first-page and second-page extraction.
- Sample PDF: `https://coureseprep-user-public.oss-cn-chengdu.aliyuncs.com/testdata/%E9%87%91%E5%8D%8E-%E6%89%B9%E9%87%8F.pdf`
- 2026-06-29 follow-up decision: first production route stays in Java instead of a Python/Go sidecar service; when storing generated page images, also store width and height for API consumers.

## AI Parse Contract

- canonicalKind: requirements
- humanEquivalent: true
- stableIdsRequired: true
- noImplicitScope: true

## Goals

- Verify that the sample OSS PDF can be read from the backend environment and that pages 1 and 2 can be converted to PNG.
- Avoid consuming the deployment server's limited 2 Mbps public bandwidth when the PDF is in the same-region OSS bucket.
- Prepare a safe path for later saving generated PNG OSS paths and dimensions with the paper pool create flow.

## Requirements

- R1: A test class must verify that the target PDF can be opened and page count is at least 2. Acceptance: the test fails clearly when the PDF is unreachable, not a PDF, encrypted, corrupt, or has fewer than 2 pages.
- R2: The test class must render PDF page 1 and page 2 as PNG images. Acceptance: the test asserts both PNG byte arrays are non-empty and have `image/png` format.
- R3: The preferred read path must avoid public egress when deployed on same-region Alibaba Cloud infrastructure. Acceptance: the plan uses OSS SDK object read or the OSS internal endpoint for `coureseprep-user-public` instead of fetching the public HTTPS URL through Internet bandwidth.
- R4: The generated PNG files must be suitable for later storage in OSS and database fields. Acceptance: the test reports candidate filenames/object keys and image sizes; the later implementation stores stable OSS paths rather than raw image bytes in table columns.
- R5: The save API integration must only run for create flow when `mergedPdfOssPath` is present. Acceptance: update flow and paper item semantics remain unchanged unless a later requirement explicitly expands scope.
- R6: Each generated page image record must include path, width, and height. Acceptance: the save flow persists page 1 and page 2 image path plus numeric width/height fields, and detail/query responses expose those values for front-end layout usage.

## Non-Functional Requirements

- NFR1: The PDF read path must enforce timeouts and bounded memory. Acceptance: the planned implementation avoids loading unbounded remote streams into memory and names a maximum PDF size / page render DPI.
- NFR2: Rendering must be deterministic enough for tests. Acceptance: the test validates page count, PNG dimensions/bytes, and upload result shape rather than brittle pixel-perfect output.
- NFR3: The design must fit existing module boundaries. Acceptance: service logic stays in `axon-common`; `axon-chat` controller remains API orchestration only.
- NFR4: The first production version must keep the conversion in Java. Acceptance: production code uses a focused Java service around PDFBox/OSS and does not introduce a Python/Go runtime or script mount for the online save path.

## Non-Goals

- NG1: This phase does not implement the production save API change until the analysis plan is approved.
- NG2: This phase does not execute SQL migrations or alter database schema.
- NG3: This phase does not download the sample PDF repeatedly through the public network during normal production operation.
- NG4: This phase does not change third-party generic grading raw-data behavior.

## Constraints

- C1: Current paper pool create path is `ExamCompositionPaperPoolDbStore#createPaperPool`.
- C2: Current main table `exam_composition_paper_pool` has `cover_url` and `merged_pdf_oss_path`, but no dedicated fields for page 1 and page 2 PNG paths or dimensions.
- C3: Existing OSS config uses Chengdu public endpoint `https://oss-cn-chengdu.aliyuncs.com`; same-region ECS can use internal OSS endpoint `https://oss-cn-chengdu-internal.aliyuncs.com`.
- C4: Existing project has Aliyun OSS SDK and OkHttp dependencies. A local validation test has introduced PDFBox as a test dependency; production implementation may promote or add the dependency as needed.

## Assumptions

- A1: The sample PDF is in bucket `coureseprep-user-public`, object key `testdata/金华-批量.pdf`.
- A2: The generated page PNGs should be uploaded to an OSS bucket and only OSS paths/URLs plus dimensions should be persisted in database fields.
- A3: For the first test class, writing temporary PNG files under test output is acceptable; production upload and DB persistence are separate follow-up work.
- A4: Python/Go sidecar or mounted script execution is deferred; it remains a future escape hatch only if Java rendering becomes a measurable bottleneck or compatibility risk.

## Open Questions

- OQ1: Which exact database column names should store page 1 and page 2 image metadata? Recommended names are `first_page_image_url`, `first_page_image_width`, `first_page_image_height`, `second_page_image_url`, `second_page_image_width`, and `second_page_image_height`.
- OQ2: Should generated PNGs be stored in the public bucket, user-upload private bucket, or generated-files private bucket?
- OQ3: Should conversion failure block paper pool creation, or should the pool be created with image fields empty and a warning/async retry?

## Validation Expectations

- A JUnit test can be run with Maven against `axon-common`.
- Optional integration mode may require OSS credentials and therefore should be disabled by default unless profile/property is provided.
- Test output should include page count, rendered PNG dimensions, byte sizes, and candidate object key paths.

## Consistency Check

- requirementCount: 6
- nonFunctionalRequirementCount: 4
- decisionCount: 0
- openQuestionCount: 3

## 2026-06-29 Archive Note

- This requirement is paused and archived after local verification; no production code remains in the working tree.
- Verified result: the sample PDF could be rendered locally with Java/PDFBox for pages 1 and 2, and both pages produced PNG output.
- Stable decision retained: the first production implementation should stay in Java, generated images should be stored as OSS paths plus width/height, and same-region ECS should prefer OSS internal endpoint/object reads instead of repeated public URL downloads.
- Related archive: `docs/00-process/archive/2026-06/paper-pool-pdf-first-pages-paused/`.
- Re-open conditions:
  - Confirm DB column names for page 1/page 2 path, width, and height.
  - Confirm target OSS bucket for generated PNGs.
  - Confirm fail-open or fail-closed behavior when PDF conversion/upload fails.
