---
type: prd
status: implemented
date: 2026-06-30
topic: external-manifest-analysis-queue
format: human-readable-requirements
sharded: false
---

# PRD: external-manifest-analysis-queue

## Source

- 用户补充后的准确信息：`POST /api/v1/exam-assignment-grading/external/create-from-manifest` 现有同步业务逻辑保持不变。该接口仍先完成当前“通用批改 manifest -> 作文批改 manual manifest -> 作文批改任务创建”的既有流程；只在现有业务逻辑成功走完之后，把通用批改、作文批改和后续 analysis 所需数据写入新增队列表。
- 用户确认：考试 ID 统一使用 `exam_info.id`。本地接口、队列表字段和第三方通用批改路径中的 `{exam_id}` 都使用当前 `exam_info.id`，不再区分“第三方 exam_id”和“本地 local_exam_id”两套口径。
- 用户确认：学校 ID 统一使用 `school_data.id`。本地接口、队列表字段和第三方通用批改路径中的 `{school_id}` 都使用当前 `school_data.id`，不再区分“第三方 school_id”和“本地 school_id”两套口径。
- 用户确认：通用批改 manifest ID 和作文批改 manifest ID 不是同一个值，队列表和代码命名必须拆分保存，不能共用一个 `manifest_id` 字段。
- 用户确认：通用批改 `generic_grading_id` 来源于触发第三方 `POST /api/v1/generic_grading` 返回 JSON 中的 `grading_id` 字段，例如 `37aa8aae-f4e8-4776-bbba-513b333ebca8`。
- 用户确认：是否有作文由 `POST /api/v1/exam-generic-grading/json-aggregate/progress` 返回内容中的 `strategyJson` 判断；只要识别到题目策略字段 `strategy` 的值为 `essay`，即表示该批改包含作文。
- 用户确认：`essay_json` 使用 `/api/v1/batch_assignment_grading/{grading_id}/results` 返回的完整作文结果 JSON 对象，格式参考 `D:\Downloads\response.json`；无作文时 analysis 传空对象 `{}`。
- 用户确认：`essay_json_url` 当前只作为预留字段，不向 analysis 传递任何参数。
- 用户确认：`create-from-manifest` 现有业务成功后，如果新增队列表登记失败，应阻断接口成功并返回业务异常，避免作文任务已创建但后处理丢失。
- 用户补充：`/api/v1/generic_grading/{grading_id}/results` 顶层对象包含 `grading_id`、`status`、`exam_id`、`results`；`status=completed` 表示通用批改完成。调用 analysis 且 `do_analyze=true` 后，results 会新增/进入 `analysis_running` 状态，队列应继续轮询直到分析完成终态。
- 现有上下文：
  - 外部入口：`/api/v1/exam-assignment-grading/external/create-from-manifest`
  - 当前外部入口返回：`ExamAssignmentGradingCreateWithManualManifestVO`，包含作文批改 manual manifest 和作文批改任务创建结果。
  - 当前外部入口成功响应中，`data.manifest.manifestId` 是作文批改侧后续使用的 manifest ID，例如 `chinese_g7_20260630034222`，不能当作通用批改 manifest ID 使用。
  - 当前外部入口成功响应中，`data.gradingTask.gradingId` 是作文批改侧 `assignment_grading_id`，例如 `8b5a48e0-bd77-4e05-90d1-629da506c44a`，后续用它轮询 `/api/v1/batch_assignment_grading/{grading_id}/results` 获取作文批改结果。
  - 通用批改 results：`/api/v1/generic_grading/{grading_id}/results`
  - 通用批改 analysis：`/api/v1/generic_grading/{school_id}/{exam_id}/{grading_id}/analysis`
  - 现有可恢复队列参考：`exam_generic_grading_flow_state`、`exam_generic_grading_json_generation_snapshot`、`exam_generic_grading_queue_lock`

## AI Parse Contract

- canonicalKind: requirements
- humanEquivalent: true
- stableIdsRequired: true
- noImplicitScope: true

## Problem

外部入口当前能同步创建作文批改任务，但后续“等待作文批改完成 -> 等待通用批改完成 -> 触发 analysis -> 轮询 analysis 完成 -> 后续只查询 analysis”缺少本地可恢复状态。新需求要求在不改变现有入口主逻辑的前提下，追加队列表，把现有接口已经拿到的通用批改和作文批改相关数据保存起来，再由后台队列继续推进后处理。

## Requirements

### R1 - 保持外部入口现有业务逻辑不变

`POST /api/v1/exam-assignment-grading/external/create-from-manifest` 仍按当前实现同步执行既有流程，并保持现有成功响应语义。

Acceptance: 接口仍先完成当前 manifest detail 拉取、assignment manual manifest 创建、作文批改任务创建，并返回现有 `manifest + gradingTask` 结构；新增队列表写入不得替代或前置这段业务逻辑。

### R2 - 现有业务成功后追加落库

当 `create-from-manifest` 当前业务逻辑成功后，后端应将通用批改和作文批改后续推进所需数据写入新增队列表。

Acceptance: 只有在现有同步流程成功拿到作文批改任务返回参数后，才新增或更新队列表；若同步流程失败，不创建“等待后处理”的有效队列记录；若现有同步流程成功但队列登记失败，本接口按业务异常返回失败。

### R3 - 队列表保存关键上下文

新增队列表必须保存通用批改和作文批改的关键参数，以及作文批改创建后返回的相关参数。

Acceptance: 队列表至少保存通用批改 `generic_manifest_id`、作文批改 `assignment_manifest_id`、`school_id`、`exam_id`、通用批改 `generic_grading_id`、`data.gradingTask.gradingId` 对应的作文批改 `assignment_grading_id`、`data.gradingTask.rqJobId`、是否包含作文、作文批改创建请求/响应快照、下一次轮询时间、当前队列状态和失败原因。其中 `assignment_manifest_id` 必须来自 `create-from-manifest` 返回 VO 的 `data.manifest.manifestId`，`assignment_grading_id` 必须来自返回 VO 的 `data.gradingTask.gradingId`；`school_id` 必须等于 `school_data.id`，`exam_id` 必须等于 `exam_info.id`；第三方接口路径中的 `{school_id}`、`{exam_id}` 也传这两个值。通用批改 manifest ID 与作文批改 manifest ID、通用批改 grading ID 与作文批改 grading ID 都必须用不同字段保存。

### R4 - 预留项目内部驱动位置

后续该接口可能不再由第三方触发，而由当前项目内部流程驱动；设计必须预留 Service 层登记入口。

Acceptance: 队列登记能力不只绑定公开 controller；内部业务可在完成同等作文批改创建逻辑后，调用同一个 Service 方法写入队列表。

### R5 - 作文批改完成后保存作文结果参数

后台队列应先基于 `strategyJson` 是否包含 `strategy=essay` 判断是否有作文。有作文时，用 `data.gradingTask.gradingId` 轮询 `/api/v1/batch_assignment_grading/{grading_id}/results`。作文批改完成后，应保存作文批改 results 返回的完整 JSON 对象，并作为后续 analysis 需要传递的 `essay_json`。

Acceptance: 当 `strategyJson` 中存在 `strategy=essay` 时，队列表写入 `has_essay=true` 并轮询作文批改结果；作文批改状态为 completed/success 后，队列表写入作文 results 响应快照和用于 analysis 的完整 `essay_json`。当未识别到作文时，队列表写入 `has_essay=false`，不等待作文结果，analysis 触发时 `essay_json` 传 `{}`。`essay_json_url` 字段只保留，不参与 analysis 请求。

### R6 - 通用批改完成后触发 analysis

后台队列在作文批改完成或确认无作文后，继续轮询通用批改 results。`/api/v1/generic_grading/{grading_id}/results` 返回对象中的 `"status": "completed"` 表示通用批改完成但 analysis 尚未完成，此时应触发 analysis。

Acceptance: 只有在 generic results 状态为 `completed` 后，才调用 `/api/v1/generic_grading/{school_id}/{exam_id}/{grading_id}/analysis` 触发第三方分析。

### R7 - analysis 首次触发参数

首次触发 analysis 时，应调用 `/api/v1/generic_grading/{school_id}/{exam_id}/{grading_id}/analysis`，传递第三方新增参数：`do_analyze=true` 和 `essay_json`。`essay_json_url` 保留为本地预留字段，不向第三方 analysis 传递。

Acceptance: analysis 首次触发请求快照落库，`do_analyze` 为 true；有作文时，`essay_json` 使用作文批改完成后保存的完整 JSON 对象；没有作文时，`essay_json` 传 `{}`；analysis 请求中不传递 `essay_json_url`。

### R8 - analysis 运行状态轮询

触发 analysis 后，后台队列继续轮询 `/api/v1/generic_grading/{grading_id}/results`。当返回对象中的 `"status": "analysis_running"` 时，表示 analysis 已触发且仍在运行；队列应继续等待，直到返回分析完成终态。

Acceptance: `status=completed` 不视为最终完成，只表示通用批改完成；调用 `do_analyze=true` 后出现 `status=analysis_running` 时继续轮询，不重复触发 analysis；`status=analysis_compeleted` 才把队列标记为 analysis 完成。

### R9 - analysis 完成后的查询口径

当 results 状态达到 `analysis_compeleted` 后，再调用 `/api/v1/generic_grading/{school_id}/{exam_id}/{grading_id}/analysis` 获取分析结果，此时及后续所有获取批改分析的调用都必须传递 `do_analyze=false`。

Acceptance: 队列在 analysis 完成后保存最终 analysis 查询响应；后续分析查询路径使用 `do_analyze=false`，不重复触发分析。

### R10 - 定时任务节奏可配置

新增队列轮询间隔必须可配置，默认暂定 30 秒。

Acceptance: 配置项默认 `30000ms`，可在 `application*.yml` 中调整，不需要改代码。

### R11 - 最多 10 个在途任务

新增队列应参考 `exam_generic_grading` 现有队列模型，限制全局最多同时运行 10 个后处理任务。超过上限时，新队列记录保持等待状态，不应继续 claim 或推进。

Acceptance: 队列配置提供 `max-in-flight=10` 默认值；调度器每轮先统计 `PROCESSING/ESSAY_GRADING_RUNNING/ANALYSIS_RUNNING` 等在途状态，只有剩余名额大于 0 时才 claim 待处理记录。

### R12 - 超出上限等待与下次调度

当当前在途任务数达到 10 个时，调度器不得把新的待处理记录标记为处理中；待处理记录应保留原状态和 `next_attempt_at`，等待下一轮调度。

Acceptance: 在途数达到上限时，本轮 claim 数为 0；待处理行不增加 retry，不写失败，不改变业务状态。

### R13 - 异常处理与退出队列

队列推进过程中出现第三方非可重试错误、任务不存在、达到最大重试次数、缺少必要字段或状态终态失败时，应写入失败状态并退出活跃队列，不再继续轮询。

Acceptance: 队列表保存 `last_error_message`、错误阶段、第三方响应摘要和终态失败状态；终态失败记录不再被普通调度器 claim，除非后续提供人工重试或重置入口。

### R14 - 可重试异常有限重试

网络超时、408、429、5xx、连接失败等瞬时异常应按现有 `exam_generic_grading` 队列风格有限重试，达到上限后退出队列。

Acceptance: 队列配置提供 `max-transient-retries` 默认值，建议与现有通用批改队列一致为 5；每次可重试异常增加 `retry_count` 并写入 `next_attempt_at`，达到上限后标记 `FAILED`。

### R15 - 保存 raw-data/refs 材料快照

新增队列表应保存 `POST /api/v1/exam-generic-grading/exams/{examId}/raw-data/refs` 登记阶段产生的关键材料快照，便于后续 analysis、排障和能力扩展追溯考试资料来源。

Acceptance: `raw-data/refs` 阶段继续作为通用批改原始资料的登记源；队列登记时从 `exam_generic_grading_flow_state` 或等价上下文复制 `paper_pool_id`、`paper_pool_pdf_url`、原卷 PDF/文件引用、标准答案引用、空白答题卡样张引用、学生答卷 PDF 引用、`raw_refs_request_json`、`raw_refs_response_json` 等材料快照。数组型资料优先保存为 JSON 快照，不强制拆成大量列。

### R16 - 第三方后处理调用统一封装

通用批改、作文批改和 analysis 后处理相关第三方调用，应通过新增的统一 Service/Adapter 封装，避免调度器、队列处理器或入口 Service 分散拼接请求参数和判断第三方状态。

Acceptance: 新增统一封装层集中处理通用批改 create 返回中 `grading_id` 的提取、通用批改 results 轮询、作文批改 results 轮询、analysis 触发/查询请求参数组装、`do_analyze=true/false` 语义、`essay_json` 大 JSON 传递、`essay_json_url` 不传参、无作文传 `{}`、第三方状态归一化和可重试/不可重试判断；队列 processor 只负责编排状态流转和落库，不直接散落第三方请求细节。

## Non-Goals

- 不改变 `create-from-manifest` 当前同步业务逻辑和成功响应主语义。
- 不把外部入口改为“只入队不创建作文批改任务”。
- 不在本地实现 analysis 内部的结果合并、批注生成、数据分析。
- 不本地伪造或反算第三方 analysis 结果。
- 不新增前端页面。
- 不把 `raw-data/refs` 改造成 analysis 后处理队列创建入口；该接口只保存资料源快照，真正队列登记仍发生在 `create-from-manifest` 当前业务成功之后。

## Assumptions

- 通用批改 `generic_grading_id` 的稳定来源是触发第三方 `POST /api/v1/generic_grading` 返回 JSON 中的 `grading_id` 字段；队列表登记必须使用该值。
- `school_id` 已确认统一使用 `school_data.id`，第三方也使用当前 `school_data.id`；后续设计和实现不再新增 `third_party_school_id` 作为并行字段。
- `exam_id` 已确认统一使用 `exam_info.id`，第三方也使用当前 `exam_info.id`；后续设计和实现不再新增 `local_exam_id` 作为并行字段。
- 作文批改侧 `assignment_manifest_id` 的稳定来源是 `create-from-manifest` 成功响应的 `data.manifest.manifestId`；作文批改侧 `assignment_grading_id` 的稳定来源是 `data.gradingTask.gradingId`；通用批改侧 `generic_manifest_id` 仍来自触发 `create-from-manifest` 的通用批改 manifest 上下文，通用批改侧 `generic_grading_id` 来自第三方 `POST /api/v1/generic_grading` 返回。
- 是否有作文的稳定来源是 `json-aggregate/progress` 返回内容中的 `strategyJson`；只要存在 `strategy=essay` 即 `has_essay=true`。
- 作文批改完成后第三方不会额外提供稳定的 JSON 存储路径，因此本地需要从 `/api/v1/batch_assignment_grading/{grading_id}/results` 响应中保存完整作文结果 JSON 对象，并作为 `essay_json` 传给 analysis。
- 通用批改材料来源的稳定快照优先来自 `exam_generic_grading_flow_state`，其中已保存 `raw_refs_request_json`、`raw_refs_response_json`、`paper_pool_id`、`paper_pool_pdf_url` 等 raw-data/refs 登记结果；实施时可在该阶段补充更结构化的 refs summary 字段。
- 后处理第三方调用属于可变外部契约，实施时应收敛到新增统一 Service/Adapter 中；队列 processor 不直接拼接第三方 URL、form/body 参数或解析第三方状态。
- 用户描述中的 `analysis_running` 是 analysis 触发后的运行中状态，`analysis_compeleted` 是第三方 results 的分析完成状态拼写；本地应按该拼写兼容，是否另行规范化为 `analysis_completed` 属于对外展示决策。
- “没有作文”时仍进入 analysis 触发，`essay_json` 传空对象 `{}`，`essay_json_url` 不传参。

## Open Questions

- OQ1: analysis 接口承载 `essay_json` 大 JSON 时的最终传输方式需要在接口文档中落定为请求体/form，避免 GET query 超长；当前业务语义已确认为只传 `do_analyze` 和 `essay_json`，不传 `essay_json_url`。
- OQ2: 第三方分析完成状态是否固定拼写为 `analysis_compeleted`，本地对外是否需要同时兼容 `analysis_completed`？
- OQ3: 队列表中除 `paper_pool_id/paper_pool_pdf_url` 外，原卷、答案、空白答题卡、学生答卷 PDF 是否需要独立列用于查询，还是保存 `raw_refs_files_json` 快照即可？当前推荐关键单值列化、数组资料 JSON 化。

## Consistency Check

- requirementCount: 16
- nonFunctionalRequirementCount: 5
- decisionCount: 0
- openQuestionCount: 3
