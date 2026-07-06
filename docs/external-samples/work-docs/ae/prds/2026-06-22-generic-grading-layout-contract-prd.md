---
type: prd
status: completed
date: 2026-06-22
topic: generic-grading-layout-contract
completed_at: 2026-06-22
---

# PRD: 通用批改 layout 字段契约对齐

## Background

前端反馈 `POST /api/v1/exam-generic-grading/json-aggregate/progress` 没有返回顶层 `layout`。排查确认当前响应中题目级布局已经存在于 `data.questions[].layoutRegion`，并且接口设计本身只返回 `layoutRawJsonUrl/layoutJsonUrl` 与合并后的 `questions`，不返回完整顶层 `layout`。

同时，第三方新版 layout JSON 将 `regions[].bbox` 调整为数组形态，例如：

```json
{
  "question_number": "3",
  "bbox": [
    {"x1": 480, "y1": 718, "x2": 530, "y2": 745},
    {"x1": 735, "y1": 718, "x2": 770, "y2": 745}
  ]
}
```

当前后端对 manifest layout JSON 写入使用 `Map<String,Object>` 透传，自动类型识别只判断是否存在 `bbox` key，尚未固化 `bbox` 必须是数组、不允许对象的约束。

## Goal

统一通用批改 layout 相关接口契约：

- 前端进度展示读取 `data.questions[].layoutRegion`，不等待顶层 `data.layout`。
- 后端 Swagger/API 说明明确 `layoutRegion` 是题目级 layout 区域。
- 后端在接收和转发 manifest layout JSON 前校验 `regions[].bbox` 必须是数组，拒绝对象或其它非数组形态。

## Affected Users / Systems

- 前端通用批改流程：JSON 聚合进度页、规则调整页、题目区域展示。
- 后端通用批改接口：`ExamGenericGradingController` 与 `ExamGenericGradingServiceImpl`。
- 第三方通用批改 manifest adjusted JSON 写入接口。

## Functional Requirements

1. `json-aggregate/progress` 响应说明必须明确：
   - 不返回顶层完整 `data.layout`。
   - 题目级 layout 位于 `data.questions[].layoutRegion`。
   - `data.layoutRawJsonUrl` / `data.layoutJsonUrl` 仅表示 layout 文件地址。
2. `ExamGenericGradingMergedQuestionVO.layoutRegion` 字段说明必须明确：
   - 来源是 layout JSON 中按 `question_number` 匹配到的 `regions[]` 条目。
   - 其中 `bbox` 采用第三方新版数组形态，后端不强类型拆解元素。
3. 显式写入接口 `PUT /api/v1/exam-generic-grading/exams/{examId}/manifests/{manifestId}/json/{jsonType}` 在 `jsonType=layout` 时必须校验：
   - 顶层 `regions` 必须是非空数组。
   - 每个 `regions[]` 元素必须是 object。
   - 每个 region 若包含 `bbox`，`bbox` 必须是数组。
   - `bbox` 不能是 object、字符串、数字或 null。
4. 自动识别写入接口 `PUT /api/v1/exam-generic-grading/exams/{examId}/manifests/{manifestId}/json` 必须：
   - 仍按 `regions[].bbox` 识别 layout。
   - 识别为 layout 后复用同一套 `bbox` 数组校验。
   - 对 `bbox` 为对象或 null 的请求返回参数错误，不调用第三方。
5. `json-aggregate/progress` 合并 layout 时继续弱类型透传 `layoutRegion`，不得把新版 `bbox` 数组转换成旧对象或四数字数组。
6. 不修改 `ExamCapabilityController` / ROI OCR 相关 `RecognizeRegionVO.BboxDTO`，该链路不是本次通用批改 layout manifest 契约。

## Acceptance Criteria

1. Swagger 或字段注释中能直接看到前端应读取 `data.questions[].layoutRegion`，且说明不提供顶层 `data.layout`。
2. 使用新版 layout JSON 样例的 `regions[].bbox` 数组调用 manifest JSON 写入时，后端允许转发，payload 保持原样。
3. `bbox` 为对象的 layout JSON 写入请求返回参数错误，且第三方 gateway 未被调用。
4. `bbox` 为 null 的自动识别 layout JSON 请求返回参数错误，且第三方 gateway 未被调用。
5. 聚合进度中 `questions[].layoutRegion.bbox` 能原样保留数组结构。
6. 相关单元测试覆盖显式 `jsonType=layout` 和自动识别两条入口。

## Non-Goals

- 不新增顶层完整 `data.layout`。
- 不新增 `question.layout` 兼容别名，除非后续前端确认已有大规模代码强依赖。
- 不把 `bbox` 元素强类型建模为 DTO。
- 不修改第三方 JSON 生成、OSS 上传、manifest 注册和批改任务队列。
- 不修改 ROI OCR 的 `RecognizeRegionVO.BboxDTO`。

## Constraints

- 保持当前轻量响应设计，避免在 progress 响应中塞完整 layout JSON。
- 对第三方 layout 深层结构继续使用 `Map<String,Object>` / `List<?>` 承接，避免过早固化。
- 参数错误必须在本地拦截，避免把明显不符合新版契约的 body 转发给第三方。
- 变更范围应限制在通用批改 Controller/VO/Service/测试/文档。

## Validation Expectations

- 定向单测：
  - `mvn -pl axon-common "-Dtest=ExamGenericGradingServiceImplTest,ExamGenericGradingJsonAggregateMergerTest" test`
  - `mvn -pl axon-chat -am "-Dtest=ExamGenericGradingControllerTest" test`
- 编译验证：
  - `mvn -pl axon-chat -am -DskipTests compile`
- 如需要本地冒烟，由用户提供 token 并确认服务已重启后，再调用通用批改 manifest JSON 写入与 progress 查询接口。

## Assumptions

- 前端可以按本次结论改读 `data.questions[].layoutRegion`。
- 第三方新版 layout `bbox` 的稳定要求是“数组”，数组元素结构可能继续变化，因此后端只校验容器类型，不校验元素字段完整性。
- 当前 `bbox` 缺失应视为无法识别 layout 或不完整 layout；如果后续第三方允许无 bbox region，需要另行确认。

## Open Questions

- 是否需要为了短期兼容前端新增 `question.layout` 别名？当前建议不加，除非前端确认强依赖。
- `regions` 是否允许空数组用于清空 layout？当前建议不允许自动识别空数组；显式 `jsonType=layout` 也建议不允许，避免把无效 adjusted JSON 写入第三方。

## Final Decisions

- 前端读取路径固定为 `data.questions[].layoutRegion`，不新增顶层 `data.layout`。
- 本次不新增 `question.layout` 兼容别名。
- `regions[].bbox` 只校验容器类型为数组，不强校验数组元素字段。
- `bbox` 为对象、字符串、数字或 `null` 时，本地返回参数错误且不调用第三方。
- 自动识别入口和显式 `jsonType=layout` 入口复用同一套 layout 校验。

## Delivery Summary

- 已更新后端代码、Swagger/VO 描述、接口文档和 AI 记忆。
- 已覆盖单元测试、MockMvc 测试和编译验证。
- 未做真实第三方/本地接口冒烟；需要 token、服务重启和可用业务数据后另行验证。
