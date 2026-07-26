---
type: plan
status: completed
date: 2026-06-14
title: exam-assignment-grading-result-page-fields
origin: docs/ae/prds/2026-06-14-exam-assignment-grading-result-page-fields-prd.md
originFingerprint: response-json-18618-bytes-2026-06-14
---

# Plan: 批量作业批改结果页级字段透出

## Source

- 用户请求：第三方 `GET /api/v1/batch_assignment_grading/{grading_id}/results` 新增 `essay_layout_pages` 与 `essay_annotation_images`，原 `essay_annotation_image` 已被第三方移除；需要封装新增数组字段到本地相关接口并返回前端，同时保留旧单数字段兼容兜底。
- 第三方样例：`D:/Downloads/response.json`。
- 需求文档：`docs/ae/prds/2026-06-14-exam-assignment-grading-result-page-fields-prd.md`。
- 相关本地接口：
  - `GET /api/v1/exam-assignment-grading/{gradingId}/results`
  - `POST /api/v1/exam-assignment-grading/results-with-layout`

## Scope

本计划只覆盖批量作业批改结果响应字段封装。变更集中在 `axon-common` 的 VO、服务映射、服务单测，以及 `axon-chat` 的控制器 JSON 契约单测；同步更新接口文档和长期记忆。

## Readiness

- Goal: 前端能稳定读取 `essayLayoutPages` 与 `essayAnnotationImages` 两个数组字段，并且旧字段 `essayAnnotationImage` 在第三方未返回时仍得到空对象兜底。
- Acceptance criteria:
  - 旧结果接口和轻量聚合接口都返回两个新增数组字段。
  - 复数字段为空、缺失或为 `null` 时返回空数组。
  - 现有 `essayAnnotationImage` 兼容字段保持可用；第三方有旧字段时解析，没旧字段时返回空对象。
  - 已显式建模字段不重复进入 `extraFields`。
- Non-goals:
  - 不修改第三方调用入口、鉴权、错误处理。
  - 不强类型解析 `layout_analysis` 深层结构。
  - 不改变任务创建参数。
- Affected areas:
  - `axon-common/src/main/java/com/xinxi/axon/common/vo/exam`
  - `axon-common/src/main/java/com/xinxi/axon/common/service/exam/impl/ExamAssignmentGradingServiceImpl.java`
  - `axon-common/src/test/java/com/xinxi/axon/common/service/exam/impl/ExamAssignmentGradingServiceImplTest.java`
  - `axon-chat/src/test/java/com/xinxi/chatservice/controller/exam/ExamAssignmentGradingControllerTest.java`
  - `docs/04-api`
  - `docs/08-ai-memory`
- Validation surface:
  - 服务层字段映射单测。
  - 控制器 JSON path 单测。
  - 文档和记忆内容检查。
- Open questions:
  - 是否必须对外返回 snake_case 字段名。计划默认保持既有驼峰 JSON 风格。

## Assumptions

- 前端接受本地接口既有驼峰字段命名，新增字段为 `essayLayoutPages` 与 `essayAnnotationImages`。
- 第三方新增字段位于学生明细项 `results.files.<section>.data[]`，不是统计分区 `*_stats.data`。
- 数组元素结构后续可能变化，因此本期按 `List<Map<String,Object>>` 透传。
- 复数字段空数组比 `null` 更适合前端直接遍历；缺失、`null`、类型异常统一返回空数组。
- 单数字段 `essayAnnotationImage` 是旧前端兼容对象；第三方缺失、`null`、类型异常时统一返回空对象。

## Alternatives Considered

- Recommended: 在现有 VO 中新增两个 `List<Map<String,Object>>` 字段，并在服务层显式映射；旧单数字段改为对象兜底。优点是契约稳定、影响面小、与现有弱类型透传模式一致。
- Alternative: 继续依赖 `extraFields`。缺点是 `results-with-layout` 不返回 `extraFields`，前端无法稳定依赖。
- Alternative: 新增强类型 `EssayLayoutPageVO` 和 `EssayAnnotationImageVO`。缺点是第三方深层字段仍在演进，当前样例不足以固定长期对象模型。
- Rejected because: 依赖 `extraFields` 不满足两个接口同时返回；强类型建模在当前阶段增加维护成本。

## Decision Drivers

- Driver 1: 保持 API 契约稳定，前端无需从未知字段中取值。
- Driver 2: 保持兼容，第三方移除 `essay_annotation_image` 后仍不影响继续读取 `essayAnnotationImage` 的前端和学生聚合逻辑。
- Driver 3: 避免过度建模第三方深层结构，降低后续第三方字段变化风险。

## Decisions

### ADR-1 - 新增字段按数组弱类型透传

- Decision: `essayLayoutPages` 与 `essayAnnotationImages` 使用 `List<Map<String,Object>>`。
- Drivers: 第三方数组元素结构包含深层 `layout_analysis`，后续可能变化；项目已有多个 `Map<String,Object>` 承接第三方可变结构。
- Alternatives: 强类型 VO；只放 `extraFields`。
- Why chosen: 能稳定给前端数组，又不把未稳定的深层字段过早固化。
- Consequences: OpenAPI 文档只能描述数组对象，不能提供深层强类型 schema。
- Follow-ups: 若第三方字段结构稳定且前端需要类型提示，可后续新增专门 VO。

### ADR-2 - 空值统一返回空数组

- Decision: 两个新增复数字段缺失、`null`、空数组、非数组输入统一映射为空数组。
- Drivers: 前端可直接遍历；用户明确说明有的为空、有的有参数。
- Alternatives: 缺失时返回 `null`，有空数组时返回 `[]`。
- Why chosen: 响应形态更稳定，测试更容易覆盖。
- Consequences: 前端无法仅通过 `null` 区分第三方缺失字段和空数组；如需排查可看第三方原始日志或旧响应样例。
- Follow-ups: 若业务需要区分缺失与空数组，再新增状态字段，不在本期实现。

### ADR-3 - 旧单数字段保留为空对象兜底

- Decision: `essayAnnotationImage` 继续作为对象字段返回；第三方返回 `essay_annotation_image` / `essayAnnotationImage` 时解析对象，缺失、`null` 或非对象时返回空对象。
- Drivers: 第三方已移除旧单数字段，但前端可能仍读取该对象属性。
- Alternatives: 返回 `null`；删除字段；用 `essayAnnotationImages[0]` 自动回填旧字段。
- Why chosen: 空对象最能降低旧前端报错风险；不从复数字段自动回填可避免把多页数组错误压缩成单页语义。
- Consequences: 前端不能通过 `essayAnnotationImage == null` 判断第三方是否返回旧字段。
- Follow-ups: 前端完成迁移后，可只读取 `essayAnnotationImages`，但后端不主动删除兼容字段。

## Risks

- 字段名风险：若前端要求 snake_case，对外驼峰命名需要调整为 `@JsonProperty`。
- 兼容风险：如果误删单数 `essayAnnotationImage` 或缺失时返回 `null`，已联调页面可能回归。
- 映射风险：如果只改 `results.files[].data[]` 而漏改 `studentResults.students[].sections[]`，`results-with-layout` 仍拿不到字段。
- 统计分区风险：`essay_stats.data` 是对象，不能被当作学生明细数组处理。

## Pre-Mortem

- Failure scenario 1: 实现只在 `ExamBatchAssignmentGradingResultItemVO` 增字段，漏掉 `StudentSectionResultVO`，导致轻量接口缺字段。
- Failure scenario 2: 新字段仍留在 `extraFields` 中造成前端看到重复数据，增加契约歧义。
- Failure scenario 3: 复数字段空值返回 `null`，前端按数组遍历时报错；旧单数字段缺失时返回 `null`，旧前端取属性时报错。
- Mitigations:
  - 服务测试同时断言旧结果结构和学生聚合结构。
  - `removeKnownKeys` 加入新增 snake/camel key。
  - 复数字段提取方法统一返回空数组。
  - 旧单数字段提取方法统一返回空对象。

## Implementation Units

### U1 - 扩展结果 VO 契约

- Goal: 在旧结果明细和学生聚合 Section 中新增两个数组字段，并保留旧单数字段对象兼容。
- Requirements covered: R1, R2, R3, R4, R5, R8。
- Acceptance criteria covered: 旧结果接口和轻量聚合接口都能序列化两个数组字段。
- Depends on: none
- Files:
  - Modify: `axon-common/src/main/java/com/xinxi/axon/common/vo/exam/ExamBatchAssignmentGradingResultItemVO.java`
  - Modify: `axon-common/src/main/java/com/xinxi/axon/common/vo/exam/ExamBatchAssignmentGradingStudentResultsVO.java`
- Forbidden files:
  - `axon-chat/src/main/java/com/xinxi/chatservice/controller/exam/ExamAssignmentGradingController.java`
- Approach:
  - 在 `ExamBatchAssignmentGradingResultItemVO` 增加 `private List<Map<String, Object>> essayLayoutPages;`。
  - 在 `ExamBatchAssignmentGradingResultItemVO` 增加 `private List<Map<String, Object>> essayAnnotationImages;`。
  - 在 `StudentSectionResultVO` 增加同名同类型字段。
  - 保留已有 `essayAnnotationImage` 字段，字段类型仍为 `Map<String,Object>`。
  - 补充 `java.util.List` import，避免未使用或重复 import。
- Tests:
  - 本单元不单独运行测试，后续 U3/U4 覆盖序列化与映射。
- Validation:
  - 编译通过。
  - IDE 或 Maven 不出现 Lombok builder 字段缺失错误。
- Rollback signals:
  - 前端明确要求 snake_case 且不能接受驼峰字段名。
  - 编译期发现字段命名与现有 VO 冲突。
- Deferred to implementation:
  - 不新增强类型页对象。

### U2 - 扩展服务映射逻辑

- Goal: 从第三方响应 item 中提取新增字段，写入旧结果明细和学生聚合 Section，并让旧单数字段缺失时返回空对象。
- Requirements covered: R1, R2, R3, R4, R6, R7。
- Acceptance criteria covered: 数组字段正常返回、复数字段空值返回空数组、旧单数字段缺失返回空对象、`extraFields` 不重复。
- Depends on: U1
- Files:
  - Modify: `axon-common/src/main/java/com/xinxi/axon/common/service/exam/impl/ExamAssignmentGradingServiceImpl.java`
- Forbidden files:
  - `axon-chat/src/main/java/com/xinxi/chatservice/controller/exam/ExamAssignmentGradingController.java`
  - `axon-common/src/main/java/com/xinxi/axon/common/service/exam/ExamAssignmentGradingService.java`
- Approach:
  - 新增常量：
    - `KEY_ESSAY_LAYOUT_PAGES_SNAKE = "essay_layout_pages"`
    - `KEY_ESSAY_LAYOUT_PAGES_CAMEL = "essayLayoutPages"`
    - `KEY_ESSAY_ANNOTATION_IMAGES_SNAKE = "essay_annotation_images"`
    - `KEY_ESSAY_ANNOTATION_IMAGES_CAMEL = "essayAnnotationImages"`
  - 新增私有方法 `extractEssayLayoutPages(Map<String,Object> itemMap)`，内部复用 `extractMapList(firstPresentValue(...))`。
  - 新增私有方法 `extractEssayAnnotationImages(Map<String,Object> itemMap)`，内部复用 `extractMapList(firstPresentValue(...))`。
  - 在 `mapStudentSectionResult` builder 中设置 `essayLayoutPages` 与 `essayAnnotationImages`。
  - 在 `mapResultItems` builder 中设置 `essayLayoutPages` 与 `essayAnnotationImages`。
  - 在 `removeKnownKeys` 参数列表中加入新增 snake/camel key，避免进入 `extraFields`。
  - 调整 `extractEssayAnnotationImage` 单数字段逻辑：有旧字段对象时返回对象；缺失、`null`、非对象或空对象时返回 `Collections.emptyMap()`。
- Tests:
  - U3 服务测试覆盖。
- Validation:
  - `mvn -pl axon-common -Dtest=ExamAssignmentGradingServiceImplTest test`
- Rollback signals:
  - 第三方返回复数字段实际不是数组且前端要求原样透传非数组。
  - 前端明确要求旧单数字段缺失时返回 `null` 而不是空对象。
  - 新增字段导致现有测试中 JSON 契约发生不可接受变化。
- Deferred to implementation:
  - 不对数组元素字段做值清洗或 URL 校验。

### U3 - 补充服务层回归测试

- Goal: 用第三方样例同形态数据验证服务映射。
- Requirements covered: R1, R2, R3, R4, R6, R7。
- Acceptance criteria covered: 所有服务层验收项。
- Depends on: U2
- Files:
  - Modify: `axon-common/src/test/java/com/xinxi/axon/common/service/exam/impl/ExamAssignmentGradingServiceImplTest.java`
- Forbidden files:
  - `D:/Downloads/response.json`
- Approach:
  - 在现有构造第三方 item 的测试辅助方法中加入：
    - `essay_layout_pages`，包含至少两个对象，每个对象含 `image/full_text/layout_analysis`。
    - `essay_annotation_images`，包含至少两个对象，每个对象含 `image/annotatedImageUrl/annotatedJsonUrl`。
  - 在 `getTaskResults` 相关测试中断言：
    - `vo.getResults().getFiles().get(0).getData().get(0).getEssayLayoutPages().size()` 为期望长度。
    - `vo.getResults().getFiles().get(0).getData().get(0).getEssayAnnotationImages().size()` 为期望长度。
    - `extraFields` 不包含 `essay_layout_pages` 与 `essay_annotation_images`。
    - `studentResults.students[].sections[]` 中两个新增字段也有同样长度。
  - 新增或扩展一个空值测试，覆盖复数字段缺失、`null`、空数组时返回空数组。
  - 新增或扩展旧单数字段兼容测试，覆盖 `essay_annotation_image` 存在时解析对象、缺失时返回空对象。
- Tests:
  - `mvn -pl axon-common -Dtest=ExamAssignmentGradingServiceImplTest test`
- Validation:
  - 服务测试通过。
  - 失败时优先检查字段名、builder 字段、`removeKnownKeys`。
- Rollback signals:
  - 测试显示当前 ObjectMapper 或 Jackson 配置不序列化空集合，需重新评估空数组验收。
- Deferred to implementation:
  - 不把附件 JSON 复制进测试资源，避免样例文件过大且包含临时 URL。

### U4 - 补充控制器 JSON 契约测试

- Goal: 验证两个本地接口对前端返回数组字段。
- Requirements covered: R3, R4, R8。
- Acceptance criteria covered: 控制器响应 JSON 中新增字段是数组。
- Depends on: U1
- Files:
  - Modify: `axon-chat/src/test/java/com/xinxi/chatservice/controller/exam/ExamAssignmentGradingControllerTest.java`
- Forbidden files:
  - `axon-chat/src/main/java/com/xinxi/chatservice/controller/exam/ExamAssignmentGradingController.java`
- Approach:
  - 在 `getTaskResults_returnsStudentEssayImageUrl` 或新增测试中，让 mock service 返回含 `essayLayoutPages`、`essayAnnotationImages`、空对象 `essayAnnotationImage` 的 `StudentSectionResultVO`。
  - 对 `GET /api/v1/exam-assignment-grading/gid-1/results` 断言：
    - `$.data.studentResults.students[0].sections[0].essayLayoutPages` 是数组。
    - `$.data.studentResults.students[0].sections[0].essayAnnotationImages` 是数组。
    - `$.data.studentResults.students[0].sections[0].essayAnnotationImage` 是对象。
  - 在 `getResultsWithLayout_passesRequestAndReturnsCombinedPayload` 中增加同样断言，确保轻量聚合接口不漏字段。
- Tests:
  - `mvn -pl axon-chat -Dtest=ExamAssignmentGradingControllerTest test`
- Validation:
  - 控制器测试通过。
  - 不需要改控制器源码。
- Rollback signals:
  - MockMvc JSON path 显示字段缺失，说明 VO 或 mock 构造漏设字段。
- Deferred to implementation:
  - 不做本地接口冒烟，除非用户明确提供 token 并要求自动本地冒烟。

### U5 - 更新接口文档和长期记忆

- Goal: 把新增字段契约写入项目文档和 AI 记忆。
- Requirements covered: R1, R2, R3, R4, R8。
- Acceptance criteria covered: 后续维护者能从文档得知新增字段类型和来源。
- Depends on: U1, U2
- Files:
  - Modify: `docs/04-api/2026-06-03-批量作业批改结果与布局聚合接口.md`
  - Modify: `docs/08-ai-memory/03-key-workflows.md`
  - Modify: `docs/08-ai-memory/05-decision-log.md`
- Forbidden files:
  - Repository root files.
  - `sql/`
- Approach:
  - 在接口文档字段表中补充：
    - `data.studentResults.students[].sections[].essayLayoutPages`，类型 `array`。
    - `data.studentResults.students[].sections[].essayAnnotationImages`，类型 `array`。
  - 补充说明旧结果接口的 `results.files[].data[].essayLayoutPages` 与 `essayAnnotationImages` 同步返回。
  - 更新 AI 记忆中批量作业批改结果链路，说明新增复数字段为数组、空值返回空数组、单数 `essayAnnotationImage` 保留并在缺失时返回空对象。
  - 在决策日志新增 2026-06-14 条目，记录第三方新增字段的本地返回策略。
- Tests:
  - 文档检查：确认没有把字段写成带前导空格的 `" essay_annotation_images"`。
- Validation:
  - `rg -n "essayLayoutPages|essayAnnotationImages|essay_layout_pages|essay_annotation_images" docs/04-api docs/08-ai-memory`
- Rollback signals:
  - 用户确认这不是长期稳定契约，只是一次性临时字段；则不更新 AI 记忆。
- Deferred to implementation:
  - 不改 Swagger 注解以外的 OpenAPI 生成配置。

## Validation Plan

- Unit:
  - `mvn -pl axon-common -Dtest=ExamAssignmentGradingServiceImplTest test`
- Integration:
  - `mvn -pl axon-chat -Dtest=ExamAssignmentGradingControllerTest test`
- User flow:
  - 如用户后续要求本地冒烟，等待用户提供 token、确认项目已重启，再调用 `127.0.0.1` 本地接口验证 JSON path。
- Data / operations:
  - 无数据库变更，无 SQL。
- Observability:
  - 无新增日志要求；若复数字段缺失，返回空数组而不是报错；若旧单数字段缺失，返回空对象而不是报错。

## Rollback / Recovery

- 回滚源码改动即可恢复旧契约；无数据库或配置回滚。
- 若前端要求 snake_case 字段名，保留服务映射，调整 VO Jackson 注解作为后续小补丁。
- 若第三方字段结构稳定后需要强类型，可在后续版本新增专门 VO，保持现有数组字段兼容。

## Plan Self-Review

- Placeholder scan: 无 `TBD`、`TODO` 或未定义占位内容。
- Consistency check: PRD、范围、实施单元均围绕两个新增数组字段。
- Scope check: 不修改第三方调用、任务创建、数据库或控制器逻辑。
- Acceptance coverage: 每条验收标准均映射到 U2、U3、U4 或 U5。
- Validation gaps: 未包含真实本地冒烟，原因是需要用户 token 和服务重启确认。
- Alternatives and ADR check: 已记录弱类型数组透传、复数字段空数组策略和旧单数字段空对象兜底策略。
- High-risk pre-mortem check: 已覆盖漏改轻量接口、重复 extraFields、复数字段空值遍历、旧单数字段空值取属性四类风险。

## Handoff

- 推荐先执行 U1-U3，确保服务层字段契约正确。
- 再执行 U4，验证控制器响应。
- 最后执行 U5，同步文档和长期记忆。
- 实施完成后按项目规则报告验证命令与结果；未经用户明确要求，不创建 commit、不 push。

## Execution Result

- U1-U5 已完成。
- 验证通过：
  - `mvn -pl axon-common -Dtest=ExamAssignmentGradingServiceImplTest test`
  - `mvn -pl axon-chat -am -Dtest=ExamAssignmentGradingControllerTest '-Dsurefire.failIfNoSpecifiedTests=false' test`
- 测试环境冒烟通过：
  - `GET /api/v1/exam-assignment-grading/{gradingId}/results`
  - `POST /api/v1/exam-assignment-grading/results-with-layout`
- 归档目录：`docs/00-process/archive/2026-06/exam-assignment-grading-result-page-fields/`
