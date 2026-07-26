---
type: plan
status: completed
date: 2026-06-22
title: generic-grading-layout-contract
origin: docs/ae/prds/2026-06-22-generic-grading-layout-contract-prd.md
completed_at: 2026-06-22
branch: dev522
---

# Plan: 通用批改 layout 字段契约对齐

## Source

- 用户确认：前端应优先读取 `data.questions[].layoutRegion`，不等待顶层 `data.layout`。
- 用户提供新版 layout JSON：`D:/Downloads/layout (4).json`，其中 `regions[].bbox` 为数组，数组元素为 `{x1,y1,x2,y2}` 对象。
- 代码事实：
  - `ExamGenericGradingJsonAggregateProgressVO` 当前返回 `layoutRawJsonUrl/layoutJsonUrl/questions`，没有顶层 `layout`。
  - `ExamGenericGradingMergedQuestionVO.layoutRegion` 是题目级 layout。
  - `ExamGenericGradingJsonAggregateMerger` 当前把 layout region 原样合并到 `layoutRegion`。
  - `ExamGenericGradingServiceImpl.updateManifestJson` 对 JSON body 直接透传第三方。
  - `ExamGenericGradingServiceImpl.updateManifestJsonAutoType` 当前只按 `regions[].bbox` key 存在性识别 layout。
- Requirements: `docs/ae/prds/2026-06-22-generic-grading-layout-contract-prd.md`

## Scope

- 修改通用批改 progress 和 layout 写入契约说明。
- 在 manifest layout JSON 写入前增加 `regions[].bbox` 数组类型校验。
- 补充 Service/Controller/merger 单元测试。
- 更新长期 AI 记忆中已过期的 bbox 约束说明。

不修改 ROI OCR、第三方生成 layout 的调用、OSS 上传、manifest 注册、批改队列和前端代码。

## Readiness

- Goal: 后端接口契约与第三方新版 layout JSON 对齐，前端清楚读取 `questions[].layoutRegion`，后端拒绝旧对象形态 `bbox`。
- Acceptance criteria: PRD 6 条验收标准全部覆盖。
- Non-goals: 不新增顶层 `data.layout`，不强类型建模 bbox 元素，不修改 ROI OCR。
- Affected areas: `axon-common` VO/Service/测试，`axon-chat` Controller/测试，`docs/08-ai-memory`。
- Validation surface: 单元测试、MockMvc 测试、Maven 编译、必要时本地接口冒烟。
- Open questions: 是否需要短期新增 `question.layout` 别名；当前默认不新增。

## Assumptions

- 第三方新版 `bbox` 的硬约束是数组，数组元素字段暂不强校验。
- `bbox=null` 与 `bbox` 对象都应本地拒绝。
- 显式 `jsonType=layout` 与自动识别入口应使用同一校验逻辑。
- `json-aggregate/progress` 不改变字段路径，仍输出 `questions[].layoutRegion`；新版 `bbox` 数组保持原结构，历史 `box` 对象或平铺坐标需在输出时归一化为 `bbox` 数组，无法识别的非数组 `bbox` 值兜底为空数组。
- 前端字段说明通过 Swagger/VO 注释和接口文档即可满足本轮交付。

## Alternatives Considered

- Recommended: 不新增顶层 layout，只强化文档与后端 layout JSON 入参校验。
- Alternative: 新增 `questions[].layout` 作为 `layoutRegion` 别名。
- Rejected because: 当前尚未确认前端存在大规模强依赖；新增别名会扩大接口表面积，后续字段长期并存。
- Alternative: 新增顶层完整 `data.layout`。
- Rejected because: 与轻量 progress 响应设计冲突，响应体可能显著增大，并重复 `layoutRawJsonUrl/layoutJsonUrl` 可下载能力。
- Alternative: 强类型建模 `bbox` 元素为 DTO。
- Rejected because: 第三方 layout 深层结构仍在演进，本轮只需要容器类型约束。

## Decision Drivers

- Driver 1: 对前端最小破坏，明确现有字段路径。
- Driver 2: 在本地阻断旧 `bbox` 对象形态，避免第三方 adjusted JSON 写入失败。
- Driver 3: 保持 layout 深层结构弱类型透传，降低后续第三方变更成本。

## Decisions

### ADR-1 - Progress 不返回顶层完整 layout

- Decision: `json-aggregate/progress` 继续不返回顶层 `data.layout`；前端读取 `data.questions[].layoutRegion`。
- Drivers: 当前后端已经按题号合并题目、策略、layout；完整 layout 可通过 URL 排查。
- Alternatives: 顶层返回完整 layout。
- Why chosen: 保持响应轻量，避免重复大 JSON。
- Consequences: 必须把 Swagger/字段注释写清楚，减少前端误读。
- Follow-ups: 若前端确认强依赖 `question.layout`，可另起兼容别名小改。

### ADR-1 补充 - Progress layoutRegion 输出归一化

- Date: 2026-06-22
- Decision: `json-aggregate/progress` 保持 `questions[].layoutRegion` 字段路径不变，但对历史 `box` 对象和平铺坐标输出归一化为 `bbox` 数组；新版 `bbox` 数组继续保留原结构，无法识别的非数组 `bbox` 值兜底输出为空数组。
- Drivers: 前端反馈进度接口返回的 `bbox` 不是数组，实际根因是聚合层把旧 layout region 结构原样透传。
- Consequences: progress 响应不再输出旧 `box` 字段，前端统一读取 `layoutRegion.bbox`。
- Review follow-up: 归一化必须限定在 layout region 索引；`questions[].strategy` 继续保留 strategy JSON 原始对象，不能因为 strategy 中存在 `box/bbox` 扩展字段而触发布局坐标归一化。

### ADR-2 - bbox 只校验数组容器，不校验元素结构

- Decision: `regions[].bbox` 必须是 `List<?>`，但数组元素保持弱类型透传。
- Drivers: 用户明确限制 bbox 是数组、不是对象；第三方元素结构可能继续变化。
- Alternatives: 校验每个元素必须包含 `x1/y1/x2/y2` 数字。
- Why chosen: 当前最小满足第三方容器契约，不把可变结构过早写死。
- Consequences: 后端会接受数组元素为空或字段不全的情况，由第三方或后续更细需求处理。
- Follow-ups: 如果第三方确认元素 schema 稳定，再补元素级校验。

### ADR-3 - 自动识别和显式写入共用 layout 校验

- Decision: `updateManifestJsonAutoType` 推断出 layout 后，与显式 `jsonType=layout` 调同一校验方法。
- Drivers: 两个入口对外都是 manifest layout JSON 写入，不能出现一个入口放过对象 bbox。
- Alternatives: 只改自动识别或只改显式入口。
- Why chosen: 统一校验避免绕过。
- Consequences: 旧测试里 `bbox=null` 应更新为参数错误。
- Follow-ups: 同步更新 AI 记忆和接口说明。
- Review follow-up: manifest adjusted JSON 修改入口接收前端提交的完整 JSON body，不从 progress 聚合后的 `questions[].layoutRegion` 反向生成第三方 layout JSON；自动识别入口识别为 layout 后仍复用显式写入链路的 `regions[].bbox` 数组校验。

## Risks

- 如果第三方允许空 `regions` 表示清空 layout，当前建议的非空校验会偏严。
- 如果前端已经大量读取 `question.layout`，只改文档会无法立即消除联调问题。
- 如果错误信息不够明确，前端定位 `bbox` 对象形态问题会仍然困难。
- 如果把 ROI OCR 的 `BboxDTO` 一并改掉，会误伤另一个能力接口。

## Pre-Mortem

- Failure scenario 1: 只更新 Swagger，不加后端校验，旧 `bbox` 对象仍被转发第三方。
- Failure scenario 2: 只改自动识别入口，显式 `/json/layout` 仍可绕过。
- Failure scenario 3: 把 `layoutRegion` 重命名或新增顶层 layout，导致现有前端和测试不兼容或响应膨胀。
- Mitigations: 单元测试分别覆盖显式和自动入口；merger 测试覆盖新版 bbox 数组原样透传；文档明确不提供顶层 layout。

## Implementation Units

### U1 - 更新 progress 和题目级 layout 字段说明

- Goal: 让前端和 Swagger 明确读取 `data.questions[].layoutRegion`。
- Requirements covered: FR-1, FR-2。
- Acceptance criteria covered: AC-1。
- Depends on: none。
- Files:
  - `axon-chat/src/main/java/com/xinxi/chatservice/controller/exam/ExamGenericGradingController.java`
  - `axon-common/src/main/java/com/xinxi/axon/common/vo/exam/ExamGenericGradingJsonAggregateProgressVO.java`
  - `axon-common/src/main/java/com/xinxi/axon/common/vo/exam/ExamGenericGradingMergedQuestionVO.java`
- Forbidden files:
  - `axon-common/src/main/java/com/xinxi/axon/common/vo/exam/RecognizeRegionVO.java`
- Approach:
  - 调整 `json-aggregate/progress` 的 `@Operation.description`，明确不返回顶层完整 `data.layout`。
  - 调整 `questions` 字段说明，明确最终题目列表内含 `layoutRegion`。
  - 调整 `layoutRegion` 字段说明，明确它是题目级 layout region；新版 `bbox` 数组保持原结构，历史 `box` 对象或平铺坐标在 progress 输出中归一化为 `bbox` 数组。
- Tests:
  - 无需新增行为测试；通过 Controller 现有测试确保路由不受影响。
- Validation:
  - `mvn -pl axon-chat -am "-Dtest=ExamGenericGradingControllerTest" test`
- Rollback signals:
  - Swagger 生成失败或注解字符串出现乱码。
- Deferred to implementation:
  - 是否另补 `docs/04-api` 接口文档，由执行时按项目当前文档维护状态决定。

### U2 - 增加 manifest layout JSON bbox 数组校验

- Goal: 在转发第三方前拒绝旧对象形态或 null 的 `regions[].bbox`。
- Requirements covered: FR-3, FR-4。
- Acceptance criteria covered: AC-2, AC-3, AC-4。
- Depends on: none。
- Files:
  - `axon-common/src/main/java/com/xinxi/axon/common/service/exam/impl/ExamGenericGradingServiceImpl.java`
  - `axon-common/src/test/java/com/xinxi/axon/common/service/exam/impl/ExamGenericGradingServiceImplTest.java`
- Forbidden files:
  - `axon-common/src/main/java/com/xinxi/axon/common/service/exam/impl/ExamRecognitionServiceImpl.java`
  - `axon-common/src/main/java/com/xinxi/axon/common/vo/exam/RecognizeRegionVO.java`
- Approach:
  - 在 `updateManifestJson` 中，`jsonType` normalize 后、gateway 调用前，如果 `JSON_TYPE_LAYOUT.equals(jsonType)`，调用新的私有方法校验 `jsonBody`。
  - 建议新增私有方法：
    - `validateLayoutJsonBody(Map<String,Object> jsonBody)`
    - `requireObjectRows(Object arrayValue, String fieldName)`
    - `validateLayoutRegionBbox(Map<?,?> region, int index)`
  - 校验规则：
    - `regions` 必须是 `List<?>` 且非空。
    - 每个元素必须是 `Map<?,?>`。
    - 每个 region 必须包含 `bbox`。
    - `bbox` 必须是 `List<?>`。
    - `bbox` 为 `Map<?,?>`、`null`、字符串、数字时报 `BusinessException(ApiResultCode.PARAM_ERROR, "...bbox must be an array")`。
  - `updateManifestJsonAutoType` 不单独校验；它推断 `jsonType=layout` 后复用 `updateManifestJson`。
- Tests:
  - 修改 `updateManifestJsonAutoType_detectsLayoutFromBboxKey`，使用 `bbox=List.of(Map.of("x1", 1, "y1", 2, "x2", 3, "y2", 4))`。
  - 新增 `updateManifestJson_rejectsLayoutBboxObject`：显式 `jsonType=layout` + `bbox=Map.of(...)`，断言参数错误且 `examThirdPartyGatewayService.invokeJson` 未调用。
  - 新增 `updateManifestJsonAutoType_rejectsLayoutBboxNull`：自动识别入口 + `bbox=null`，断言参数错误且 gateway 未调用。
  - 新增 `updateManifestJson_acceptsLayoutBboxArrayAndPreservesPayload`：显式 layout + 新版数组结构，断言 payload 与输入对象相同。
- Validation:
  - `mvn -pl axon-common "-Dtest=ExamGenericGradingServiceImplTest" test`
- Rollback signals:
  - 现有合法 layout PUT 因校验过严失败。
- Deferred to implementation:
  - 若业务确认 `regions=[]` 是合法清空操作，可将非空校验放宽为“显式入口允许空数组，自动识别入口不允许空数组”。当前计划默认不允许空数组。

### U3 - 补充 layout 合并测试覆盖新版 bbox 数组

- Goal: 确认 `json-aggregate/progress` 合并后的 `questions[].layoutRegion.bbox` 原样保留新版数组结构。
- Requirements covered: FR-5。
- Acceptance criteria covered: AC-5。
- Depends on: none。
- Files:
  - `axon-common/src/test/java/com/xinxi/axon/common/service/exam/support/ExamGenericGradingJsonAggregateMergerTest.java`
- Forbidden files:
  - `axon-common/src/main/java/com/xinxi/axon/common/service/exam/support/ExamGenericGradingJsonAggregateMerger.java`，除非测试暴露真实缺陷。
- Approach:
  - 将现有 layout 测试中的 `bbox: [1, 2, 3, 4]` 替换或新增为新版结构：
    - `bbox: [{"x1": 480, "y1": 718, "x2": 530, "y2": 745}, {"x1": 735, "y1": 718, "x2": 770, "y2": 745}]`
  - 断言 `layoutRegion.get("bbox") instanceof List`，并断言数组长度为 2。
  - 不修改 merger 实现，因为当前 Map/List 弱类型逻辑已能透传。
- Tests:
  - `merge_preservesLayoutBboxArray`
- Validation:
  - `mvn -pl axon-common "-Dtest=ExamGenericGradingJsonAggregateMergerTest" test`
- Rollback signals:
  - 测试需要修改生产代码才能通过时，先确认是否是 merge 逻辑真实丢字段。
- Deferred to implementation:
  - 不把 `bbox` 元素转成 DTO。

### U4 - 补充 Controller 层契约测试

- Goal: 验证无 `jsonType` 的自动识别路由仍原样传递新版 layout JSON body 到 Service。
- Requirements covered: FR-4。
- Acceptance criteria covered: AC-6。
- Depends on: U2。
- Files:
  - `axon-chat/src/test/java/com/xinxi/chatservice/controller/exam/ExamGenericGradingControllerTest.java`
- Forbidden files:
  - none。
- Approach:
  - 在 `updateManifestJsonAutoType_routesBodyAndCurrentUserContext` 中将请求样例调整为新版 `regions[].bbox` 数组。
  - 或新增独立测试 `updateManifestJsonAutoType_acceptsLayoutBboxArrayBody`，Mock Service 返回成功，Captor 断言传入 DTO 的 `jsonBody.regions[0].bbox` 是数组。
  - Controller 不做深度校验；深度校验留在 Service，避免重复规则。
- Tests:
  - MockMvc PUT `/api/v1/exam-generic-grading/exams/{examId}/manifests/{manifestId}/json`
- Validation:
  - `mvn -pl axon-chat -am "-Dtest=ExamGenericGradingControllerTest" test`
- Rollback signals:
  - JSON 样例在 PowerShell/测试字符串中转义错误导致请求体不是合法 JSON。
- Deferred to implementation:
  - 不在 Controller 手写 bbox 校验。

### U5 - 更新长期记忆和必要接口说明

- Goal: 防止后续继续按“bbox 值可空或对象”理解。
- Requirements covered: FR-1, FR-2, FR-3, FR-4。
- Acceptance criteria covered: AC-1, AC-6。
- Depends on: U1, U2。
- Files:
  - `docs/08-ai-memory/02-architecture-boundaries.md`
  - 可选：`docs/04-api/2026-06-22-generic-grading-layout-contract.md`
- Forbidden files:
  - 仓库根目录文档。
- Approach:
  - 将 `regions[].bbox -> layout，字段值可为空` 更新为：
    - 自动识别仍使用 `regions[].bbox` 特征。
    - layout JSON 写入时 `regions[].bbox` 必须是数组，不允许对象或 null。
    - progress 不返回顶层 layout，题目级 layout 读取 `questions[].layoutRegion`。
  - 如果执行时需要给前端可直接查看的接口说明，新建 `docs/04-api/2026-06-22-generic-grading-layout-contract.md`，放请求/响应片段。
- Tests:
  - 文档无需自动测试。
- Validation:
  - `rg -n "bbox|layoutRegion|data\\.layout" docs/08-ai-memory docs/04-api`
- Rollback signals:
  - 记忆文件与实际代码行为不一致。
- Deferred to implementation:
  - 若本轮只改 Swagger，不创建 `docs/04-api`，最终说明需明确。

## Validation Plan

- Unit:
  - `mvn -pl axon-common "-Dtest=ExamGenericGradingServiceImplTest,ExamGenericGradingJsonAggregateMergerTest" test`
- Integration:
  - `mvn -pl axon-chat -am "-Dtest=ExamGenericGradingControllerTest" test`
- Compile:
  - `mvn -pl axon-chat -am -DskipTests compile`
- User flow:
  - 前端 progress 读取 `data.questions[0].layoutRegion.bbox`，应看到新版数组结构。
  - 前端 manifest layout JSON PUT 传 `bbox` 数组应成功；传对象应返回参数错误。
- Data / operations:
  - 不涉及 SQL 或数据迁移。
- Observability:
  - 参数错误 message 应包含 `regions[index].bbox` 和 `array`，便于前端定位。

## Rollback / Recovery

- 代码回滚：撤销 Service 校验与 Swagger/测试修改即可恢复旧透传行为。
- 运行时回退：如果第三方临时仍接受对象 bbox 但数组校验阻断联调，可临时改为仅 warn 不拒绝；当前不推荐。
- 前端回退：如果短期无法切换到 `layoutRegion`，可单独增加 `question.layout` 兼容别名，不纳入本计划默认实现。

## Plan Self-Review

- Placeholder scan: 无 TBD/TODO。
- Consistency check: PRD、ADR、实施单元均保持“不返回顶层 layout、bbox 必须数组”的同一口径。
- Scope check: 未扩大到 ROI OCR、OSS、队列、manifest 注册。
- Acceptance coverage: AC-1 由 U1/U5 覆盖；AC-2/3/4/6 由 U2/U4 覆盖；AC-5 由 U3 覆盖。
- Validation gaps: 未包含真实第三方冒烟，需用户提供 token、服务重启确认和可用 manifest 后执行。
- Alternatives and ADR check: 已记录顶层 layout、question.layout 别名、强类型 bbox DTO 的取舍。
- High-risk pre-mortem check: 覆盖了绕过入口、响应膨胀和误改 ROI OCR 三类主要风险。

## Execution Result

- 执行分支：`dev522`。误创建的本地分支 `codex/exam-list-frontend-stage` 已删除，本次修改已迁移到 `dev522` 的未提交工作区。
- 代码落地：
  - `POST /api/v1/exam-generic-grading/json-aggregate/progress` 明确不返回顶层 `data.layout`，题目级 layout 读取 `data.questions[].layoutRegion`。
  - `PUT /api/v1/exam-generic-grading/exams/{examId}/manifests/{manifestId}/json/{jsonType}` 在 `jsonType=layout` 时校验 `regions[].bbox` 必须是数组。
  - `PUT /api/v1/exam-generic-grading/exams/{examId}/manifests/{manifestId}/json` 新增无 `jsonType` 自动识别入口，识别为 layout 后复用同一套 bbox 数组校验。
  - 未新增顶层 `data.layout`，未新增 `question.layout` 兼容别名，未修改 ROI OCR 链路。
- 文档落地：
  - 更新 Swagger/VO 字段说明。
  - 更新 `docs/04-api/2026-06-22-generic-grading-layout-contract.md`。
  - 更新 `docs/08-ai-memory/02-architecture-boundaries.md` 中通用批改 layout 契约。
- 验证结果：
  - `mvn -pl axon-common "-Dtest=ExamGenericGradingServiceImplTest,ExamGenericGradingJsonAggregateMergerTest" test` 通过，58 tests, 0 failures。
  - `mvn -pl axon-chat -am "-Dtest=ExamGenericGradingControllerTest" "-Dsurefire.failIfNoSpecifiedTests=false" test` 通过，9 tests, 0 failures。
  - `mvn -pl axon-chat -am -DskipTests compile` 通过。
  - `git diff --check` 通过，仅有 LF/CRLF warning。
- 未验证项：
  - 未做真实第三方/本地接口冒烟；需要 token、服务重启和可用 `examId/manifestId` 后再执行。

## Handoff

已完成执行并进入归档。后续如前端确认短期强依赖 `question.layout`，应另起小方案评估兼容别名，不纳入本次默认契约。
