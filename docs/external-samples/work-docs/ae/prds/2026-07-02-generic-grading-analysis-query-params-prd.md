---
type: prd
status: completed
date: 2026-07-02
topic: generic-grading-analysis-query-params
format: human-readable-requirements
sharded: false
---

# PRD: generic-grading-analysis-query-params

## Source

- 用户确认：第三方 `/api/v1/generic_grading/{school_id}/{exam_id}/{grading_id}/analysis` 新增参数 `annotation_sync`，本地固定传 `false` 即可。
- 用户提示：`do_analyze` 已有设计，应按此前文档执行，不重新设计 analysis 状态机。
- 既有文档 `docs/04-api/2026-06-16-通用批改第三方封装接口说明.md` 已说明：
  - analysis 触发：`POST /api/v1/generic_grading/{school_id}/{exam_id}/{grading_id}/analysis`，`do_analyze=true`、`essay_json`，不传 `essay_json_url`。
  - analysis 查询：`GET /api/v1/generic_grading/{school_id}/{exam_id}/{grading_id}/analysis`，`do_analyze=false`。
  - 本地透传入口 `GET /api/v1/exam-generic-grading/exams/{examId}/tasks/{gradingId}/analysis` 是查询语义。
- 既有 PRD `docs/ae/prds/2026-06-30-external-manifest-analysis-queue-prd.md` 已说明：
  - 队列首次触发 analysis 时 `do_analyze=true`。
  - analysis 完成后和后续所有查询必须 `do_analyze=false`，避免重复触发分析。

## AI Parse Contract

- canonicalKind: requirements
- humanEquivalent: true
- stableIdsRequired: true
- noImplicitScope: true

## Problem

当前普通通用批改 analysis 查询链路未向第三方传递 `do_analyze=false`，外部 manifest 后处理队列的 analysis 查询链路只传递了 `do_analyze=false`，两条 GET 查询链路都没有传递第三方新增的 query 参数 `annotation_sync=false`。如果第三方按新契约校验必填 query 参数，统计页或后处理队列会出现第三方调用失败，或使用第三方默认行为造成同步批注等待等不可控结果。

## Requirements

### R1 - 普通 analysis 查询显式传递查询语义

本地普通通用批改 analysis 查询必须继续保持查询语义，不触发第三方重新分析。

Acceptance: `GET /api/v1/exam-generic-grading/exams/{examId}/tasks/{gradingId}/analysis` 调用第三方 `GET /api/v1/generic_grading/{school_id}/{exam_id}/{grading_id}/analysis` 时，query 参数包含 `do_analyze=false`。

### R2 - 普通统计聚合复用同一查询参数

本地统计聚合入口复用第三方 analysis 数据时，必须与普通 analysis 查询保持相同第三方参数口径。

Acceptance: `GET /api/v1/exam-generic-grading/exams/{examId}/tasks/{gradingId}/analysis/wrong-question-statistics` 间接调用第三方 analysis 时，同样发送 `do_analyze=false` 和 `annotation_sync=false`，不额外触发 analysis。

### R3 - analysis 查询固定传 annotation_sync=false

所有本地查询第三方 analysis 结果的 GET 请求必须显式传递 `annotation_sync=false`。

Acceptance: 普通通用批改 analysis 查询与外部 manifest 后处理队列 `fetchAnalysis(...)` 的第三方请求 query 参数均包含 `annotation_sync=false`。

### R4 - analysis 触发保持既有参数边界

本次不把 `annotation_sync` 加入第三方 analysis 的 POST multipart 触发请求。触发请求继续保持此前设计：`do_analyze=true` 与 `essay_json`，且不传 `essay_json_url`。

Acceptance: 外部 manifest 后处理队列 `triggerAnalysis(...)` 的第三方 multipart form 字段包含 `do_analyze=true` 与 `essay_json`，不包含 `essay_json_url`，也不新增 `annotation_sync`。若后续第三方明确要求 POST 触发也传 `annotation_sync`，另起需求调整。

### R5 - 不暴露新前端参数

`annotation_sync` 是后端对第三方契约的固定适配参数，不新增本地 Controller 入参，不要求前端传递。

Acceptance: 本地公开 DTO、Controller 方法签名和前端调用契约不新增 `annotationSync` / `annotation_sync` 字段。

### R6 - 保持 existing do_analyze 状态机

本次只补齐第三方请求参数，不改变外部 manifest analysis 后处理队列的状态推进规则。

Acceptance: `completed -> do_analyze=true -> analysis_running -> analysis_compeleted -> do_analyze=false` 的既有设计保持不变；不改队列表结构，不新增 SQL。

## Non-Goals

- 不重新设计通用批改或作文批改队列状态机。
- 不新增数据库字段或迁移脚本。
- 不新增前端参数、页面或交互。
- 不改变 `essay_json` 来源、`essay_json_url` 不传参的既有决策。
- 不本地生成或同步第三方批注文件；本次只在 analysis GET 查询中固定传 `annotation_sync=false`。

## Assumptions

- 第三方接受 `annotation_sync=false` 作为 analysis 查询的普通 query 参数；本次不假设 POST multipart 触发请求也接受该字段。
- `annotation_sync=false` 不影响第三方返回 analysis 主体，只避免同步批注相关副作用或等待。
- `ExamThirdPartyGatewayServiceImpl` 已支持 `queryParams` 拼接和 multipart form 字段发送，本次无需改底层 HTTP 网关。
- `wrong-question-statistics` 当前通过 `ExamGenericGradingServiceImpl#invokeThirdPartyTaskAnalysis` 复用第三方 analysis 查询，因此修复该方法即可覆盖统计聚合入口。

## Open Questions

- 无阻塞开放问题。若后续第三方明确要求 POST 触发也传 `annotation_sync=false`，作为独立契约变更处理。

## Validation Expectations

- 单测验证普通 analysis 查询的 `queryParams` 包含 `do_analyze=false`、`annotation_sync=false`。
- 单测验证外部 manifest 队列 `triggerAnalysis(...)` 的 multipart form 保持既有参数边界：包含 `do_analyze=true` 与 `essay_json`，不传 `essay_json_url`，也不传 `annotation_sync`。
- 单测验证外部 manifest 队列 `fetchAnalysis(...)` 的 query 参数包含 `do_analyze=false`、`annotation_sync=false`。
- Maven 针对性测试通过。

## Delivery Result

- Completed on 2026-07-02.
- 普通 analysis 查询与 `wrong-question-statistics` 共享的第三方 GET `/analysis` 请求已固定追加 `do_analyze=false`、`annotation_sync=false`。
- 外部 manifest 后处理队列 `fetchAnalysis(...)` 的第三方 GET `/analysis` 请求已固定追加 `do_analyze=false`、`annotation_sync=false`。
- 外部 manifest 后处理队列 `triggerAnalysis(...)` POST multipart 仍只传 `do_analyze=true` 与 `essay_json`，不传 `essay_json_url` 和 `annotation_sync`。
- 未新增 Controller 入参、前端参数、SQL、队列状态字段或状态机。
- 验证命令：`mvn -pl axon-common "-Dtest=ExamGenericGradingServiceImplTest#getTaskAnalysis_usesSchoolExamGradingPathAndPreservesDynamicAnalysis,ExamAssignmentGradingExternalManifestGatewayServiceImplTest" test`，结果 7 tests / 0 failures。
- `git diff --check` 通过，仅有 Windows LF/CRLF 转换提示。
- 归档记录：`docs/00-process/archive/2026-07/generic-grading-analysis-query-params/progress.md`。

## Consistency Check

- requirementCount: 6
- nonFunctionalRequirementCount: 0
- decisionCount: 0
- openQuestionCount: 0
