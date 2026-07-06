---
type: prd
status: drafted
date: 2026-06-20
topic: generic-grading-resumable-queue
---

# PRD: 通用批改可恢复队列化流程

## 背景

当前通用批改主流程由前端串联多个接口完成：

```text
POST /api/v1/exam/create
POST /api/v1/exam/list
POST /api/v1/exam-generic-grading/exams/{examId}/raw-data/refs
POST /api/v1/exam-generic-grading/json-aggregate/progress
POST /api/v1/exam-generic-grading/manifests
GET  /api/v1/exam-generic-grading/manifests/{manifestId}
PUT  /api/v1/exam-generic-grading/exams/{examId}/manifests/{manifestId}/json/{jsonType}
POST /api/v1/exam-generic-grading/tasks
```

已确认问题：

- `raw-data/refs` 成功后应持久化本次考试的材料登记明细，保证用户中断后可继续。
- `json-aggregate/progress` 当前由前端多次请求推进，目标是后端自动队列化推进，最多同时处理 10 组。
- 三类 JSON 生成完成后应自动注册 manifest，并把 `manifestId` 返回给前端。
- `tasks` 提交第三方批改也应后端队列化执行和轮询终态。
- 第三方批改完成后，暂时只更新通用批改流程状态；批改结果不落本地存储，结果数据通过已有第三方封装查询接口实时返回。
- 考试列表和详情需要返回第三方相关参数及通用批改流程状态，方便前端恢复流程。

## 目标

- 通用批改从“前端驱动多次调用”改为“后端持久化状态 + 后台队列推进”。
- 用户在任意步骤中断后，考试列表和详情可提供继续执行所需的 `rawDataRefs/json/manifest/grading` 状态与关键 ID。
- 服务端控制 JSON 生成与批改提交的并发，单类队列默认最多并发 10 组，避免前端轮询造成并发失控。
- 保留现有接口兼容性，前端可继续调用原接口，但核心状态以数据库快照为准。
- 后台队列不能长期占用大量 JVM 线程；第三方任务运行期间本地只保存 jobId/gradingId 和下次检查时间。

## 功能需求

1. 创建考试基本信息后，考试处于 `BASIC_CREATED` 或等价通用批改流程状态。
2. `raw-data/refs` 成功后，后端保存材料登记请求、第三方响应、`rawManifestUrl`、`studentManifestUrl`、`filesPresent`、`capabilities`、`registered`、`meta`。
3. `raw-data/refs` 成功后，考试通用批改流程状态进入 `RAW_DATA_REGISTERED`，并自动创建或重置 JSON 生成快照。
4. JSON 生成由后台队列自动推进：先生成 `exam.json`，成功后并行或连续生成 `strategy.json`、`layout.json`。
5. JSON 全部完成后，后端自动注册 manifest，记录 `manifestId`、manifest 详情、注册请求和第三方响应。
6. 前端获取 manifestId 后，可继续调用 manifest 详情与 JSON 修改接口。
7. 前端修改 manifest JSON 后，后端记录规则已确认状态；之后前端调用 `tasks`，提交动作改为登记“待提交批改任务”，由后台队列提交第三方并轮询任务状态。
8. 第三方批改完成后，记录 `gradingId`、任务状态、完成时间和第三方任务引用；暂不保存学生维度批改结果或分析结果到本地业务表。
9. 考试列表新增通用批改流程状态字段，区分：创建基本信息、提交文件路径、等待生成 JSON、开始生成 JSON、生成完成 JSON、规则生成完成、规则已修改确认、等待提交批改、提交批改、批改完成、批改失败、批改超时。
10. 考试详情返回可恢复上下文：材料登记明细、JSON 状态和 URL、manifestId、gradingId、第三方任务状态、失败原因、下一步建议动作。

## 非功能需求

1. 后台推进使用 Spring 定时调度作为轻量 dispatcher，数据库状态表作为持久化队列，不使用内存队列保存核心任务。
2. 调度器每次只 claim 有限记录，默认每类队列最多启动 10 组第三方 in-flight 任务；单轮新增启动数需要小于或等于 in-flight 剩余额度。
3. 本地线程只负责发起第三方异步任务、登记 jobId/gradingId、轮询状态和写库；不得阻塞等待第三方批改或 JSON 生成完成。
4. 每条任务需要有 `next_attempt_at` 或等价字段控制下次处理时间，避免高频轮询第三方。
5. 第三方连续失败或超时时，调度器需要降速或暂停启动新任务，只保留低频状态检查，防止雪崩。
6. 列表和详情只读本地快照，不在列表接口中实时请求第三方，避免用户刷新列表造成第三方放大流量。
7. 第三方批改任务最长运行窗口按 5-10 分钟配置，默认建议 10 分钟；超过窗口仍未终态的任务标记为 `GRADING_TIMEOUT`，不继续高频轮询。

## 非目标

- 不改前端 OSS 直传方式。
- 不改第三方接口协议，只在本地持久化和队列化封装。
- 不把通用批改所有中间状态塞进 `exam_info.main_status`；`main_status` 只在关键业务完成点同步。
- 不在本次方案中设计分布式任务中间件；优先使用数据库抢占 + Spring `@Scheduled`。
- 不在本次方案中落库批改结果明细；批改完成后的结果查询继续走第三方封装接口。
- 暂不在批改完成后把 `exam_info.main_status` 同步为学情分析相关状态。

## 验收标准

- 中断恢复：用户完成 `raw-data/refs` 后不继续操作，重新打开考试详情能看到已登记材料和可继续生成 JSON 的状态。
- 自动推进：`raw-data/refs` 后不需要前端循环调用 `json-aggregate/progress`，后台可自动把三类 JSON 推到完成或失败。
- 自动注册：三类 JSON 完成后数据库中有 manifest 记录，列表/详情返回 `manifestId`。
- 批改队列：前端完成 manifest JSON 修改后调用 `POST /tasks`，接口快速返回本地队列状态，后台提交第三方并轮询到终态。
- 状态展示：考试列表和详情能返回通用批改流程状态与第三方关键参数。
- 并发控制：JSON 队列和批改任务队列均可配置并发数，默认 10，重复调度不会重复提交第三方。
- 资源控制：在 100 条待处理记录存在时，单次调度只加载配置允许的记录数，本地不会创建 100 个工作线程，也不会一次性向第三方提交 100 个任务。
- 超时控制：批改任务运行超过配置窗口后进入 `GRADING_TIMEOUT`，列表/详情可展示超时原因和第三方任务引用。

## 假设

- 本地考试 ID 可作为第三方 `exam_id` 字符串使用。
- 第三方任务终态按 `completed` 和 `failed` 判断，`queued/running/processing` 继续轮询。
- manifestId 若前端未指定，由后端按 `schoolId + examId` 生成稳定值，例如 `gg-{schoolId}-{examId}`。
- `PUT /manifests/{manifestId}/json/{jsonType}` 成功后即可把本地规则状态置为 `RULE_CONFIRMED`；再次修改只更新规则版本/确认时间，不触发重新入队。
- 批改完成后暂不更新 `exam_info.main_status` 为 `LEARNING_ANALYSIS_PENDING(5)`，只更新 `exam_generic_grading_flow_state` 的通用批改状态。
- 批改结果明细不本地化；前端需要展示结果时调用现有第三方封装查询接口。
- 批改任务超时窗口默认 10 分钟，可配置为 5-10 分钟。
- 默认调度参数：JSON 启动 in-flight 上限 10、单轮新增启动 2、JSON 状态轮询间隔 15-30 秒；批改 in-flight 上限 10、单轮新增提交 2、批改状态轮询间隔 30-60 秒，最终值落在配置文件。

## Open Questions

- 批改失败或超时后是否允许前端用同一 manifest 直接重试，还是必须重新登记材料。
