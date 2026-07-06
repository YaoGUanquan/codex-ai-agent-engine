---
type: plan
status: implemented
date: 2026-06-30
title: external-manifest-analysis-queue
origin: docs/ae/prds/2026-06-30-external-manifest-analysis-queue-prd.md
originFingerprint: 2026-06-30-external-manifest-analysis-queue
depth: deep
format: human-readable-plan
sharded: false
---

# Plan: external-manifest-analysis-queue

## Source

- PRD: `docs/ae/prds/2026-06-30-external-manifest-analysis-queue-prd.md`
- User correction: `create-from-manifest` existing logic must stay unchanged; queue persistence happens after current business logic completes successfully.
- Confirmed response contract: `data.manifest.manifestId` is the assignment/essay grading side manifest ID, and `data.gradingTask.gradingId` is the essay grading task ID used to poll `/api/v1/batch_assignment_grading/{grading_id}/results`.
- Confirmed exam ID contract: all exam IDs in this flow use `exam_info.id`; third-party generic grading `{exam_id}` also receives the current `exam_info.id`. The queue should not maintain a separate `local_exam_id`.
- Confirmed school ID contract: all school IDs in this flow use `school_data.id`; third-party generic grading `{school_id}` also receives the current `school_data.id`. The queue should not maintain a separate `third_party_school_id`.
- Confirmed manifest contract: generic grading manifest ID and assignment/essay grading manifest ID are different values and must be stored as separate fields.
- Confirmed generic grading ID contract: `generic_grading_id` comes from the `grading_id` field returned by third-party `POST /api/v1/generic_grading`, for example `37aa8aae-f4e8-4776-bbba-513b333ebca8`.
- Confirmed essay detection contract: detect essay questions from `POST /api/v1/exam-generic-grading/json-aggregate/progress` response `strategyJson`; any question strategy with `strategy=essay` means the grading contains essay content.
- Confirmed essay JSON contract: `essay_json` is the complete JSON object returned by `/api/v1/batch_assignment_grading/{grading_id}/results`, matching the sample `D:\Downloads\response.json`; if no essay exists, send `{}`.
- Confirmed queue registration failure contract: after existing `create-from-manifest` logic succeeds, queue registration failure blocks the endpoint success with a business exception.
- Confirmed service boundary preference: 通用批改、作文批改和 analysis 后处理相关第三方调用应新增统一 Service/Adapter 封装，方便后续第三方参数或协议变化时集中修改。
- Confirmed generic results status contract: `/api/v1/generic_grading/{grading_id}/results` returns top-level `grading_id/status/exam_id/results`; `status=completed` means generic grading is complete, `status=analysis_running` means analysis has been triggered with `do_analyze=true` and is still running, and `status=analysis_compeleted` remains the analysis completion terminal state.
- Existing completed plan: `docs/ae/plans/2026-06-29-003-external-manifest-to-assignment-grading-plan.md`
- Existing API doc: `docs/04-api/2026-06-29-external-manifest-assignment-grading-api.md`
- Existing queue reference:
  - `exam_generic_grading_flow_state`
  - `exam_generic_grading_json_generation_snapshot`
  - `exam_generic_grading_queue_lock`
  - `GenericGradingQueueProperties`
  - `ExamGenericGradingTaskQueueTask`

## AI Parse Contract

- canonicalKind: plan
- humanEquivalent: true
- stableIdsRequired: true
- noImplicitScope: true

## Scope

新增“外部 manifest analysis 后处理队列”。关键边界是：`/api/v1/exam-assignment-grading/external/create-from-manifest` 现有同步流程不改，仍同步创建作文批改任务；新增逻辑只在该流程成功后，把已经得到的通用批改和作文批改上下文写入队列表，后台每 30 秒默认轮询推进后续 analysis。

```text
POST /external/create-from-manifest
        |
        | 1. keep existing synchronous logic unchanged
        |    generic manifest -> assignment manual manifest -> essay grading task
        v
existing response: manifest + gradingTask
        |    generic_manifest_id = generic grading manifest ID
        |    assignment_manifest_id = manifest.manifestId
        |    assignment_grading_id = gradingTask.gradingId
        |
        | 2. after success, persist queue row
        v
exam_assignment_grading_external_manifest_queue
        |
        +--> poll /api/v1/batch_assignment_grading/{assignment_grading_id}/results until completed
        |
        +--> if has_essay=true, fetch essay results and save full essay_json
        |
        +--> poll generic results until status=completed
        |
        +--> call analysis with do_analyze=true, essay_json=<full json or {}>
        |
        +--> poll generic results while status=analysis_running
        |
        +--> poll generic results until status=analysis_compeleted
        |
        +--> call analysis with do_analyze=false and save final analysis snapshot
```

## Readiness

- Goal: 在不改变现有外部入口同步创建作文批改任务的前提下，新增队列表和调度器，自动推进作文结果落库、通用批改完成检测、analysis 触发和 analysis 完成查询。
- Acceptance criteria:
  - `create-from-manifest` 现有成功响应仍是 `manifest + gradingTask`；
  - 通用批改 manifest ID 作为 `generic_manifest_id` 落库；
  - `data.manifest.manifestId` 作为作文批改侧 `assignment_manifest_id` 落库；
  - `data.gradingTask.gradingId` 作为作文批改侧 `assignment_grading_id` 落库，并用于轮询 `/api/v1/batch_assignment_grading/{grading_id}/results`；
  - 通用批改 `generic_grading_id` 来源于 `POST /api/v1/generic_grading` 返回 JSON 的 `grading_id`；
  - 从 `json-aggregate/progress.strategyJson` 检测 `strategy=essay` 并保存 `has_essay`；
  - `school_id` 统一保存 `school_data.id`，调用第三方 generic grading analysis/results 相关接口时也使用该值；
  - `exam_id` 统一保存 `exam_info.id`，调用第三方 generic grading analysis/results 相关接口时也使用该值；
  - 当前同步流程成功后才写入队列表；
  - 队列表保存通用批改和作文批改关键参数；
  - 队列全局最多 10 个在途后处理任务，超过后等待下一轮调度；
  - 可重试异常有限重试，终态异常退出活跃队列；
  - 有作文时，作文批改完成后保存 results 完整响应快照和用于 analysis 的完整 `essay_json`；
  - 无作文时，analysis 的 `essay_json` 传 `{}`；
  - `essay_json_url` 只保留字段，不向 analysis 传参；
  - 队列登记时复制 `raw-data/refs` 阶段保存的试卷池和资料引用快照；
  - generic results `status=completed` 时触发 analysis，参数 `do_analyze=true` 和 `essay_json`；
  - generic results `status=analysis_running` 时表示 analysis 已触发且运行中，继续轮询，不重复触发 analysis；
  - generic results `status=analysis_compeleted` 时标记 analysis 完成；
  - 完成后调用 analysis 查询传 `do_analyze=false`；
  - 调度间隔默认 30 秒并可配置；
  - 队列 processor 通过统一 gateway service 调用第三方，不直接拼接第三方 URL、form/body 参数或解析第三方状态。
- Non-goals:
  - 不把 `create-from-manifest` 改成纯入队；
  - 不改变当前同步业务逻辑的创建顺序和返回结构；
  - 不本地实现第三方 analysis 内部逻辑；
  - 不新增前端页面。
- Affected areas:
  - `axon-common` entity/mapper/service/dto/vo/enum/config；
  - `axon-chat` scheduler/application.yml/test；
  - `ExamAssignmentGradingServiceImpl#createTaskFromExternalGenericManifest` 只追加“成功后登记队列”和必要上下文提取；
  - 新增 `ExamAssignmentGradingExternalManifestGatewayService` 统一封装后处理第三方调用、参数组装和状态归一化；
  - `ExamGenericGradingServiceImpl` 只在统一封装层复用现有能力时做最小必要扩展，避免 processor 直接依赖其第三方请求细节；
  - `docs/06-sql/migrations` 新增 migration；
  - `docs/04-api` 更新接口说明。
- Validation surface:
  - 单元测试：入口成功后落库、失败不落有效队列、作文结果 JSON 提取、has_essay 判定、generic results 状态推进、analysis 参数；
  - scheduler 测试：30 秒配置、claim/retry、状态门闩；
  - 编译：`mvn -pl axon-common -DskipTests compile`、`mvn -pl axon-chat -am -DskipTests compile`。
- Open questions:
  - analysis 承载大 `essay_json` 时的最终 HTTP 传输方式；
  - 队列表中资料引用字段是继续 JSON 快照为主，还是部分文件路径独立列化；
  - `analysis_compeleted` 是否为第三方分析完成状态的固定拼写。

## Assumptions

- 现有 `createTaskFromExternalGenericManifest` 成功后已经能拿到作文批改 `gradingTask.gradingId`，可直接落入队列表。
- 现有 `createTaskFromExternalGenericManifest` 成功后已经能拿到作文批改侧 `manifest.manifestId`，可直接落入队列表，字段示例为 `chinese_g7_20260630034222`。
- 学校 ID 已确认统一为 `school_data.id`，第三方通用批改路径中的 `{school_id}` 也传该值；队列表不再设计 `third_party_school_id` 并行字段。
- 考试 ID 已确认统一为 `exam_info.id`，第三方通用批改路径中的 `{exam_id}` 也传该值；队列表不再设计 `local_exam_id` 并行字段。
- 通用批改 manifest ID 与作文批改 manifest ID 已确认不同；前者保存为 `generic_manifest_id`，后者保存为 `assignment_manifest_id`。
- 通用批改 `generic_grading_id` 必须使用第三方 `POST /api/v1/generic_grading` 返回 JSON 的 `grading_id` 字段。
- 是否有作文必须从 `json-aggregate/progress.strategyJson` 检测 `strategy=essay`，并保存为 `has_essay`。
- 没有作文时仍触发 analysis，`essay_json` 传 `{}`，`essay_json_url` 不传参。
- analysis 接口当前代码是 GET 查询；本次新增大体积 `essay_json` 后，实施时应优先改为 body/form 传参，避免 query 超长。业务参数只包含 `do_analyze` 和 `essay_json`，不包含 `essay_json_url`。
- `raw-data/refs` 已经在 `exam_generic_grading_flow_state` 保存 `paper_pool_id`、`paper_pool_pdf_url`、`raw_refs_request_json`、`raw_refs_response_json`；后处理队列登记时复制这些快照，而不是让 `raw-data/refs` 直接创建 analysis 后处理队列。

## Alternatives Considered

- Recommended: 保留同步入口，成功后追加后处理队列。
  - Fit: 完全符合用户修正，不破坏现有调用方和返回结构。
  - Trade-off: 同步入口仍会承担当前作文批改任务创建耗时。
  - Risk: 如果队列登记失败，当前业务已成功；本方案已明确登记失败阻断接口成功。
- Alternative: 改为纯入队后由队列创建作文批改任务。
  - Fit: 更彻底异步。
  - Rejected because: 与用户明确修正相反，会改变现有接口行为。
- Alternative: 不新增队列表，直接扩展 `exam_generic_grading_flow_state`。
  - Fit: 少一张表。
  - Rejected because: 作文批改和 analysis 后处理是跨能力编排，塞入 generic 主流程表会污染职责。

## Decision Drivers

- Driver 1: 现有外部入口兼容性优先。
- Driver 2: 后处理必须可恢复、可重试、可排查。
- Driver 3: 队列表保存的是当前同步流程成功后的事实数据，不是替代同步流程。
- Driver 4: analysis 触发和查询必须通过 `do_analyze` 明确区分，防止重复执行分析。
- Driver 5: 第三方 status `completed`、`analysis_running` 与 `analysis_compeleted` 是三个不同阶段，不能混为最终完成。
- Driver 6: 并发与异常处理应参考 `exam_generic_grading` 现有队列，避免无限制打第三方或无限轮询异常任务。
- Driver 7: 后处理排障需要能追溯 raw-data/refs 时的考试资料来源，尤其试卷池、试卷 PDF、标准答案、空白答题卡和学生答卷 PDF。
- Driver 8: 第三方新增参数和状态仍在变化，应把外部调用、请求参数构造和状态归一化集中在一个后处理 gateway service，降低后续修改面。

## Decisions

### ADR-1 - 成功后追加队列而非替换入口

- Decision: `create-from-manifest` 当前同步创建作文批改任务的逻辑保持不变；只在成功后调用队列登记服务。
- Drivers: 用户明确要求“现有逻辑不变”。
- Alternatives: 入口改纯入队。
- Why chosen: 保持现有调用方行为和当前业务闭环。
- Consequences: 队列登记失败的处理策略必须明确。
- Follow-ups: 队列登记失败按业务异常阻断接口成功，并记录 error log 和第三方任务上下文，避免后处理丢失。

### ADR-2 - 独立后处理队列表

- Decision: 新增 `exam_assignment_grading_external_manifest_queue` 存储外部 manifest 后处理状态。
- Drivers: 该状态跨作文批改、通用批改和 analysis。
- Alternatives: 扩展 `exam_generic_grading_flow_state`。
- Why chosen: 保持 generic 主流程表职责稳定。
- Consequences: 需要新增 migration、entity、mapper、service、scheduler。
- Follow-ups: 索引围绕 `queue_status + next_attempt_at`、`generic_grading_id`、`assignment_grading_id`。

### ADR-3 - analysis 接口通过 do_analyze 区分触发与查询

- Decision: 首次执行 analysis 时传 `do_analyze=true`；analysis 完成后和后续查询统一传 `do_analyze=false`。
- Drivers: 用户明确说明第三方新增参数语义。
- Alternatives: 继续使用无参 GET analysis。
- Why chosen: 无参无法区分“执行分析”和“获取分析”。
- Consequences: `ExamGenericGradingApiEnum.TASK_ANALYSIS` 相关封装需要支持新增参数。
- Follow-ups: 将携带大 JSON 的 analysis 调用封装为 body/form 传参，避免 GET query 超长。

### ADR-4 - 复用 generic grading 队列的并发与异常治理模型

- Decision: 新队列采用全局 `max-in-flight=10`、DB lock claim、`processing_token`、`next_attempt_at`、`retry_count`、终态失败退出队列的模式。
- Drivers: 用户要求参考 `exam_generic_grading` 开头几张表的逻辑，且后处理涉及多个第三方长任务。
- Alternatives: 每轮直接扫描所有待处理记录。
- Why chosen: 限制第三方压力，避免多节点重复推进，异常任务不会无限占用资源。
- Consequences: 队列表和配置类需要包含并发、重试、超时和锁相关字段。
- Follow-ups: 后续如需人工重试，应单独提供重置失败状态的受控入口。

### ADR-5 - 资料引用采用关键字段列化加 JSON 快照

- Decision: 队列表列化保存 `paper_pool_id`、`paper_pool_pdf_url` 等高频排障和关联字段，同时保存 `raw_refs_request_json`、`raw_refs_response_json`、`raw_refs_files_json` 等完整资料快照；原卷、答案、空白答题卡、学生答卷 PDF 这类数组型路径不默认拆成大量固定列。
- Drivers: `raw-data/refs` 的 files 字段天然支持多文件数组，后续资料类型也可能扩展。
- Alternatives: 把每类文件路径都拆成独立列。
- Why chosen: 保持查询关键字段可索引，避免 schema 频繁随文件类型变化。
- Consequences: 如果后续需要按答案文件或样张文件高频检索，再补充独立列或派生索引。
- Follow-ups: 实施时可增加 `raw_refs_files_json` 的规范化结构，字段名对齐 `ExamGenericGradingRawDataRefsRequestDTO.FilesDTO`。

### ADR-6 - 考试 ID 使用 exam_info.id 单口径

- Decision: 队列表、Service 入参和第三方 generic grading 路径中的 `{exam_id}` 统一使用 `exam_info.id`，不再保存并行的 `local_exam_id` 字段。
- Drivers: 用户确认第三方也使用当前 `exam_info.id`。
- Alternatives: 同时保存 `exam_id` 字符串和 `local_exam_id`。
- Why chosen: 双字段会制造同步和误用风险，且当前业务没有两套 ID 的需求。
- Consequences: SQL 字段 `exam_id` 可设计为 `BIGINT NOT NULL`；所有第三方调用组装时应从该字段转字符串传参。
- Follow-ups: 实施时检查现有 flow state 若仍有 `local_exam_id`，本队列只复制 `exam_id=exam_info.id`，不继承双口径命名。

### ADR-7 - 学校 ID 使用 school_data.id 单口径

- Decision: 队列表、Service 入参和第三方 generic grading 路径中的 `{school_id}` 统一使用 `school_data.id`，不再保存并行的 `third_party_school_id` 字段。
- Drivers: 用户确认第三方和本地都使用 `school_data.id`。
- Alternatives: 同时保存 `school_id` 和 `third_party_school_id`。
- Why chosen: 双字段会制造同步和误用风险，且当前业务没有两套 ID 的需求。
- Consequences: SQL 字段 `school_id` 可设计为 `BIGINT NOT NULL`；所有第三方调用组装时应从该字段转字符串传参。
- Follow-ups: 实施时检查所有新增 DTO/PO/Mapper 不出现 `thirdPartySchoolId`。

### ADR-8 - 通用批改与作文批改 manifest ID 分字段保存

- Decision: 通用批改 manifest ID 保存为 `generic_manifest_id`，作文批改 manifest ID 保存为 `assignment_manifest_id`。
- Drivers: 用户确认二者不是同一个 manifest。
- Alternatives: 使用一个泛化 `manifest_id` 或旧名 `external_manifest_id`。
- Why chosen: 单字段命名会导致轮询、analysis 和排障时混用 manifest 来源。
- Consequences: 幂等键、日志、VO 和测试都必须使用明确字段名。
- Follow-ups: 实施时禁止把 `data.manifest.manifestId` 写入 `generic_manifest_id`。

### ADR-9 - 第三方后处理调用集中到统一 Gateway Service

- Decision: 新增 `ExamAssignmentGradingExternalManifestGatewayService`，集中封装本队列需要的第三方调用、请求参数组装、响应字段提取、第三方状态归一化和异常分类；队列 processor 不直接拼接 URL、form/body 参数或调用多个第三方 client。
- Drivers: 用户要求相关业务使用新的 service 统一封装，便于后续修改；analysis 新增 `do_analyze`、`essay_json`，作文 results 和 generic results 状态也需要统一判断。
- Alternatives: 在 `ExamAssignmentGradingExternalManifestQueueProcessorImpl` 中直接调用现有 service 并分散拼参。
- Why chosen: processor 的职责应保持为状态机编排和队列表落库，第三方协议变化应集中在一个适配层内。
- Consequences: 需要新增 gateway interface/impl 和 focused tests；现有 `ExamGenericGradingServiceImpl` 如需扩展，只暴露可复用低层能力或保持原用户接口语义，不让队列逻辑散落进其中。
- Follow-ups: gateway service 必须覆盖 `essay_json_url` 不传参、无作文传 `{}`、`do_analyze=true/false` 和 `completed/analysis_running/analysis_compeleted` 状态判断测试。

## Risks

- 队列登记失败发生在现有业务成功之后，会出现“作文任务已创建但后处理未登记”的孤儿后处理状态。
- 队列登记失败发生在现有业务成功之后，接口将按业务异常失败；仍需日志记录作文任务和通用批改任务上下文，方便人工补偿。
- 如果实现中误把 manifest 内其他 source exam id 当成 `{exam_id}`，analysis 会查询或触发到错误考试；本方案要求只使用 `exam_info.id`。
- 如果实现中误把其他学校字段当成 `{school_id}`，analysis 会查询或触发到错误学校；本方案要求只使用 `school_data.id`。
- 通用批改 manifest ID 和作文批改 manifest ID 如果混用，会导致通过错误 manifest 上下文排查或幂等去重。
- `essay_json` 若通过 GET query 传递，可能超过 URL 长度限制或被网关截断。
- 如果第三方调用细节散落在 processor、入口 service 和 generic service 多处，后续第三方参数变化会造成不一致；本方案要求统一 gateway service 收口。
- 资料引用如果只保存 flow state 外键而不复制快照，后续 flow state 被修复/覆盖时会丢失队列创建当时的排障上下文。
- 第三方拼写 `analysis_compeleted` 不符合常规英文，后续可能又改为 `analysis_completed`；`analysis_running` 是已触发分析后的运行态，本地应保留第三方 raw status 并做本地状态归一化。
- 没有在途上限会导致积压任务一次性打满第三方 batch/generic results 和 analysis 接口。
- 异常任务若不退出队列，会在 30 秒调度下持续打第三方并污染日志。
- 当前工作区已有 `ExamAssignmentGradingServiceImpl` 和测试的未提交改动，实施时必须先读 diff，避免覆盖用户改动。

## Pre-Mortem

- Failure scenario 1: 当前同步业务成功，但队列插入失败。Mitigation: 将队列登记纳入同一 service 成功路径，失败时抛业务异常阻断接口成功，并记录作文任务和通用批改任务上下文。
- Failure scenario 2: status=`completed` 或 `analysis_running` 被误认为全流程完成。Mitigation: 队列状态机明确 `GENERIC_COMPLETED_ANALYSIS_PENDING` 和 `ANALYSIS_RUNNING`，只有 `analysis_compeleted` 才终态。
- Failure scenario 3: analysis 查询忘记传 `do_analyze=false` 导致重复分析。Mitigation: 封装专用 `fetchTaskAnalysisFromQueue(..., false)`，禁止队列直接拼参数。
- Failure scenario 4: 无作文时漏传 `essay_json` 字段。Mitigation: analysis trigger DTO 显式包含字段，空作文传 `{}`，`essay_json_url` 不传参。
- Failure scenario 5: 重复调用 external create 生成多个队列行。Mitigation: 用 `generic_manifest_id + generic_grading_id + assignment_grading_id` 幂等，或按 assignment `assignment_grading_id` 唯一。
- Failure scenario 6: 队列积压后一次性推进过多任务。Mitigation: 调度器先 count in-flight，默认最多 10 个在途，剩余待处理行保持等待。
- Failure scenario 7: 第三方 404/非可重试错误被当成瞬时异常无限重试。Mitigation: 复用 `ExamThirdPartyPollDecisionResolver` 风格分类，not-found 和 non-retriable 直接失败退出队列。

## Global Constraints

- 所有 SQL 放到 `docs/06-sql/migrations`。
- 文件编码使用 UTF-8。
- 不移动或删除现有外部入口逻辑。
- 不在日志中打印大体积学生结果、token、STS。
- 新增方法避免 Sonar cognitive complexity，后处理状态机提取到独立 processor，第三方调用和参数构造提取到统一 gateway service。
- processor 不直接拼接第三方 analysis/essay/generic 请求，不直接决定 `essay_json_url` 是否传参；这些协议细节由 gateway service 统一约束。

## Proposed Data Model

新增表建议：

```sql
CREATE TABLE exam_assignment_grading_external_manifest_queue (
    id BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键',
    generic_manifest_id VARCHAR(128) NOT NULL COMMENT '通用批改 manifest_id',
    school_id BIGINT NOT NULL COMMENT '学校ID，统一使用 school_data.id，第三方 {school_id} 同值',
    exam_id BIGINT NOT NULL COMMENT '考试ID，统一使用 exam_info.id，第三方 {exam_id} 同值',
    paper_pool_id BIGINT NULL COMMENT 'raw-data/refs 匹配到的试卷池ID快照',
    paper_pool_pdf_url VARCHAR(1024) NULL COMMENT 'raw-data/refs 匹配到的试卷池PDF路径快照',
    raw_refs_request_json LONGTEXT NULL COMMENT 'raw-data/refs 本地请求快照',
    raw_refs_response_json LONGTEXT NULL COMMENT 'raw-data/refs 第三方响应快照',
    raw_refs_files_json LONGTEXT NULL COMMENT 'raw-data/refs files 规范化快照，包含 exam/answer/sampleImages/studentAnswerPdf/studentPdf',
    strategy_json LONGTEXT NULL COMMENT 'json-aggregate/progress 返回的 strategyJson 快照，用于判断是否包含作文',
    has_essay TINYINT NOT NULL DEFAULT 0 COMMENT '是否包含作文题，strategyJson 中存在 strategy=essay 时为1',
    exam_pdf_refs_json LONGTEXT NULL COMMENT '原卷/试卷文件引用快照，对应 files.exam',
    answer_refs_json LONGTEXT NULL COMMENT '标准答案文件引用快照，对应 files.answer',
    sample_image_refs_json LONGTEXT NULL COMMENT '空白答题卡样张引用快照，对应 files.sampleImages',
    student_answer_pdf_refs_json LONGTEXT NULL COMMENT '学生答卷PDF引用快照，对应 files.studentAnswerPdf/studentPdf',
    generic_grading_id VARCHAR(128) NOT NULL COMMENT '通用批改 grading_id，来源第三方 POST /api/v1/generic_grading 返回 grading_id',
    generic_results_status VARCHAR(64) NULL COMMENT '通用批改 results.status 快照',
    generic_manifest_detail_json LONGTEXT NULL COMMENT '通用批改 manifest detail 快照',
    assignment_manifest_id VARCHAR(128) NOT NULL COMMENT '作文批改侧 manifest_id，来源 create-from-manifest 返回 data.manifest.manifestId',
    assignment_manifest_response_json LONGTEXT NULL COMMENT '作文 manual manifest 响应快照',
    assignment_grading_id VARCHAR(128) NOT NULL COMMENT '作文批改 grading_id，来源 create-from-manifest 返回 data.gradingTask.gradingId',
    essay_rq_job_id VARCHAR(128) NULL COMMENT '作文批改 rqJobId，来源 data.gradingTask.rqJobId',
    essay_grading_status VARCHAR(64) NULL COMMENT '作文批改状态',
    essay_grading_response_json LONGTEXT NULL COMMENT '作文批改创建/状态响应快照',
    essay_results_response_json LONGTEXT NULL COMMENT '作文批改 results 摘要快照',
    essay_json LONGTEXT NULL COMMENT '作文批改完成后传给 analysis 的完整 JSON 对象；无作文时传 {}',
    essay_json_url VARCHAR(1024) NULL COMMENT '预留字段；当前不向 analysis 传参',
    analysis_status VARCHAR(64) NULL COMMENT 'analysis 后处理状态',
    analysis_trigger_request_json LONGTEXT NULL COMMENT 'do_analyze=true 请求快照',
    analysis_trigger_response_json LONGTEXT NULL COMMENT 'do_analyze=true 响应快照',
    analysis_fetch_request_json LONGTEXT NULL COMMENT 'do_analyze=false 查询请求快照',
    analysis_fetch_response_json LONGTEXT NULL COMMENT 'analysis 完成后查询响应快照',
    queue_status VARCHAR(64) NOT NULL COMMENT '队列状态',
    last_error_message VARCHAR(2048) NULL COMMENT '最近失败原因',
    failure_stage VARCHAR(64) NULL COMMENT '失败阶段',
    failure_response_json LONGTEXT NULL COMMENT '失败时第三方响应或摘要',
    version INT NOT NULL DEFAULT 0 COMMENT '乐观锁版本',
    processing_stage VARCHAR(64) NULL,
    processing_token VARCHAR(64) NULL,
    processing_started_at DATETIME NULL,
    next_attempt_at DATETIME NULL,
    retry_count INT NOT NULL DEFAULT 0,
    create_by BIGINT NULL,
    update_by BIGINT NULL,
    create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    update_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted TINYINT NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    KEY idx_queue_status_next (queue_status, next_attempt_at, deleted),
    KEY idx_generic_manifest (generic_manifest_id, deleted),
    KEY idx_generic_grading (generic_grading_id, deleted),
    KEY idx_assignment_grading (assignment_grading_id, deleted),
    KEY idx_paper_pool (paper_pool_id, deleted),
    KEY idx_school_exam (school_id, exam_id, deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='外部manifest批改analysis后处理队列';
```

推荐唯一约束：`uk_assignment_grading_id(assignment_grading_id, deleted)` 或 `uk_generic_manifest_grading_assignment(generic_manifest_id, generic_grading_id, assignment_grading_id, deleted)`。调度 claim 需要依赖 `idx_queue_status_next`，多节点互斥需要复用或扩展 `exam_generic_grading_queue_lock`，新增锁名建议为 `ASSIGNMENT_EXTERNAL_MANIFEST_ANALYSIS_QUEUE`。

## Proposed Status Machine

```text
POST_PROCESS_PENDING
  -> ESSAY_GRADING_RUNNING
  -> ESSAY_RESULT_READY
  -> GENERIC_GRADING_WAITING
  -> GENERIC_COMPLETED_ANALYSIS_PENDING   (results.status=completed)
  -> ANALYSIS_TRIGGERED                   (called analysis do_analyze=true)
  -> ANALYSIS_RUNNING                     (results.status=analysis_running)
  -> ANALYSIS_COMPLETED                   (results.status=analysis_compeleted)
  -> ANALYSIS_FETCHED                     (called analysis do_analyze=false)

failure:
  FAILED with failure_stage / last_error_message / failure_response_json
  RETRY_LATER with retry_count / next_attempt_at
```

状态判断：

- 作文批改 completed/success：保存 results 完整响应快照，并直接作为 `essay_json`。
- 无作文：`has_essay=false`，不等待作文结果，analysis 传 `essay_json={}`。
- 作文批改 results 轮询路径固定使用 `assignment_grading_id` 组装 `/api/v1/batch_assignment_grading/{grading_id}/results`。
- Generic results `completed`：只表示通用批改完成，应触发 analysis。
- Generic results `analysis_running`：表示 `do_analyze=true` 已触发 analysis 且仍在分析中，应继续轮询 results，不重复触发 analysis。
- Generic results `analysis_compeleted`：表示 analysis 完成，应查询 analysis，且 `do_analyze=false`。
- In-flight statuses should include `ESSAY_GRADING_RUNNING`、`GENERIC_GRADING_WAITING`、`GENERIC_COMPLETED_ANALYSIS_PENDING`、`ANALYSIS_TRIGGERED`、`ANALYSIS_RUNNING`；默认最多 10 个。
- `FAILED`、`ANALYSIS_FETCHED` 不再进入普通调度 claim；人工重试应单独重置状态和 retry count。

## Implementation Units

### U1 - Document Analysis And Essay Result Contracts

- Goal: 把已确认的第三方参数、作文识别规则和结果字段写入接口文档。
- Requirements covered: R5, R7, R8, R9, R15
- Acceptance criteria covered: 明确 `do_analyze`、`essay_json`、不传 `essay_json_url`、has_essay 判定、results status 拼写和 raw-data/refs 材料快照范围。
- Depends on: none
- Files:
  - Add: `docs/04-api/2026-06-30-external-manifest-analysis-queue-api.md`
  - Modify: `docs/04-api/2026-06-16-通用批改第三方封装接口说明.md`
- Forbidden files:
  - Java production files
- Approach:
  - 记录 analysis 接口业务参数为 `do_analyze` 和 `essay_json`，`essay_json_url` 不传参。
  - 记录 `essay_json` 使用作文批改 results 完整 JSON 对象，无作文时传 `{}`。
  - 记录 `has_essay` 来源：`json-aggregate/progress.strategyJson` 中存在 `strategy=essay`。
  - 明确携带大 JSON 时不得使用 GET query 承载 `essay_json`；优先采用 body/form。
  - 确认 raw-data/refs 的 files 快照是否只需 JSON 化保存，还是需要对某些路径新增独立列。
  - 确认 status 包含 `completed`、`analysis_running`、`analysis_compeleted` 三阶段。
- Tests:
  - 文档审阅。
- Validation:
  - `rg -n "do_analyze|essay_json|essay_json_url|analysis_running|analysis_compeleted|raw-data/refs" docs/04-api`
- Rollback signals:
  - 文档仍写 `essay_json_url` 会传给 analysis；
  - 文档未明确 `essay_json` 使用完整作文 results JSON。
- Deferred to implementation:
  - 若第三方临时要求不同传输格式，只调整请求封装，不改变业务字段语义。

### U2 - Add Queue Table, Entity, Mapper, Enum, Service

- Goal: 新增现有入口成功后的后处理队列持久化能力。
- Requirements covered: R2, R3, R4, R10, R11, R12, R13, R14, R15
- Acceptance criteria covered: 成功后可保存所有关键上下文。
- Depends on: none
- Files:
  - Add: `docs/06-sql/migrations/2026-06-30-exam-assignment-grading-external-manifest-queue.sql`
  - Add: `axon-common/src/main/java/com/xinxi/axon/common/entity/exam/ExamAssignmentGradingExternalManifestQueuePO.java`
  - Add: `axon-common/src/main/java/com/xinxi/axon/common/mapper/exam/ExamAssignmentGradingExternalManifestQueueMapper.java`
  - Add: `axon-common/src/main/java/com/xinxi/axon/common/enums/exam/ExamAssignmentGradingExternalManifestQueueStatusEnum.java`
  - Add: `axon-common/src/main/java/com/xinxi/axon/common/service/exam/ExamAssignmentGradingExternalManifestQueueService.java`
  - Add: `axon-common/src/main/java/com/xinxi/axon/common/service/exam/impl/ExamAssignmentGradingExternalManifestQueueServiceImpl.java`
  - Modify: `axon-common/src/main/java/com/xinxi/axon/common/service/exam/ExamGenericGradingQueueLockService.java`
- Forbidden files:
  - Existing generic grading JSON snapshot schema.
- Approach:
  - 参考 `ExamGenericGradingFlowStateServiceImpl` 实现 find/upsert/claim/retry/mark。
  - 新增 lock name，例如 `ASSIGNMENT_EXTERNAL_MANIFEST_ANALYSIS_QUEUE`。
  - upsert 使用 essay gradingId 或 generic manifest + generic grading + essay grading 组合保证幂等。
  - 从 `exam_generic_grading_flow_state` 或登记上下文复制 `paper_pool_id`、`paper_pool_pdf_url`、`raw_refs_request_json`、`raw_refs_response_json`。
  - 从 raw refs request 的 `files` 中规范化保存 `raw_refs_files_json`，并按需要拆出 `exam_pdf_refs_json`、`answer_refs_json`、`sample_image_refs_json`、`student_answer_pdf_refs_json`。
  - 保存 `strategy_json` 快照，并从中派生 `has_essay`。
  - 实现 `countInFlight(statuses)`，用于调度前计算剩余名额。
  - 实现 `claimDueRows(pendingStatuses, processingStage, token, limit, reclaimBefore)`，使用乐观锁版本和 processing token 防重复推进。
  - 实现 `retryLater(id, stage, error, nextAttemptAt)` 和 `markFailed(id, stage, error, responseSummary)`。
- Tests:
  - upsert happy path；
  - duplicate call returns existing active row；
  - claim due row；
  - in-flight count excludes `FAILED/ANALYSIS_FETCHED`；
  - raw-data/refs 快照字段完整保存；
  - strategy_json 保存，has_essay 能识别 `strategy=essay`；
  - `generic_manifest_id`、`generic_grading_id`、`assignment_manifest_id`、`assignment_grading_id` 均按来源字段保存且不能为空；
  - exam_id stores `exam_info.id` and no `local_exam_id` field is introduced；
  - retryLater increments retry_count。
  - markFailed clears processing fields and stops future claim。
- Validation:
  - `mvn -pl axon-common "-Dtest=ExamAssignmentGradingExternalManifestQueueServiceImplTest" test`
- Rollback signals:
  - 无法按 `queue_status + next_attempt_at` 高效 claim；
  - 重复调用生成多条 active row。
- Deferred to implementation:
  - 优先使用 `uk_generic_manifest_grading_assignment` 保证同一通用批改和作文批改组合不重复；也可保留 `uk_assignment_grading_id` 作为作文任务唯一兜底。

### U3 - Append Queue Registration After Existing create-from-manifest Success

- Goal: 在不改变现有业务逻辑前提下，把成功结果写入队列表。
- Requirements covered: R1, R2, R3, R4, R15
- Acceptance criteria covered: 现有流程先完成，之后登记队列。
- Depends on: U2
- Files:
  - Modify: `axon-common/src/main/java/com/xinxi/axon/common/service/exam/impl/ExamAssignmentGradingServiceImpl.java`
  - Modify: `axon-common/src/main/java/com/xinxi/axon/common/service/exam/ExamAssignmentGradingService.java` only if exposing internal registration method is needed
  - Modify: `axon-common/src/test/java/com/xinxi/axon/common/service/exam/impl/ExamAssignmentGradingServiceImplTest.java`
- Forbidden files:
  - `axon-chat/src/main/java/com/xinxi/chatservice/controller/exam/ExamAssignmentGradingController.java` unless response adds non-breaking queue fields; default no controller change.
  - `SecurityConfig`
- Approach:
  - Keep current method order:
    - fetch generic manifest detail；
    - fetch JSON；
    - create assignment manual manifest；
    - create assignment task；
    - build existing VO；
    - then register queue row with gathered context, raw-data/refs material snapshot, `generic_manifest_id`, assignment `manifest.manifestId`, `gradingTask.gradingId`, and `gradingTask.rqJobId`。
  - Extract local context and generic gradingId resolver if needed。
  - Queue registration failure behavior is fixed: throw BusinessException so caller knows 后处理未登记，并记录上下文日志。
- Tests:
  - success path creates queue row after assignment task create；
  - queue row stores generic grading manifest ID as `generic_manifest_id`；
  - queue row stores `data.manifest.manifestId` as `assignment_manifest_id`；
  - queue row stores `data.gradingTask.gradingId` as `assignment_grading_id`；
  - queue row stores third-party generic grading response `grading_id` as `generic_grading_id`；
  - queue row stores `strategy_json` and derived `has_essay`；
  - queue row stores `school_id=school_data.id` and third-party analysis calls use the same value；
  - queue row stores `exam_id=exam_info.id` and third-party analysis calls use the same value；
  - queue row stores `paper_pool_id`、`paper_pool_pdf_url` and raw refs files snapshot；
  - assignment task create failure does not create queue row；
  - queue registration failure throws BusinessException and existing response is not returned；
  - existing response JSON remains unchanged。
- Validation:
  - `mvn -pl axon-common "-Dtest=ExamAssignmentGradingServiceImplTest#createTaskFromExternalGenericManifest*" test`
- Rollback signals:
  - 当前同步流程顺序被改变；
  - controller 开始返回纯队列语义；
  - 作文任务创建失败却写入 active queue。
- Deferred to implementation:
  - 无。

### U4 - Add Queue Properties And Scheduler

- Goal: 新增 30 秒默认调度器。
- Requirements covered: R10, R11, R12, R13, R14
- Acceptance criteria covered: 调度间隔可配置。
- Depends on: U2
- Files:
  - Add or modify: `axon-common/src/main/java/com/xinxi/axon/common/config/AssignmentGradingExternalManifestQueueProperties.java`
  - Add: `axon-chat/src/main/java/com/xinxi/chatservice/scheduled/ExamAssignmentGradingExternalManifestQueueTask.java`
  - Modify: `axon-chat/src/main/resources/application.yml`
  - Add: `axon-chat/src/test/java/com/xinxi/chatservice/scheduled/ExamAssignmentGradingExternalManifestQueueTaskTest.java`
- Forbidden files:
  - Existing generic grading scheduler classes.
- Approach:
  - 推荐独立配置前缀：
    - `exam-assignment-grading.external-manifest.queue.enabled=true`
    - `fixed-delay-ms=30000`
    - `max-in-flight=10`
    - `poll-batch-size`
    - `min-poll-interval-ms=30000`
    - `max-transient-retries=5`
    - `reclaim-timeout-ms=300000`
    - `lock-ttl-ms=30000`
  - Scheduler 每轮先用 DB lock 保护 count + claim。
  - 若当前在途数 >= 10，本轮 claim 0 条，待处理任务保持等待，不增加 retry。
  - Scheduler 只 claim due rows，然后交给 processor 推进一步。
  - Processor 抛异常时由 scheduler 按可重试/不可重试分类处理。
- Tests:
  - disabled 时直接 return；
  - in-flight 达到 10 时不 claim；
  - in-flight 为 8 且 batch size 为 5 时最多 claim 2；
  - enabled 时 claim due rows；
  - processor 可重试异常后 retryLater；
  - processor 不可重试异常后 markFailed。
- Validation:
  - `mvn -pl axon-chat -am "-Dtest=ExamAssignmentGradingExternalManifestQueueTaskTest" test`
- Rollback signals:
  - 默认不是 30 秒；
  - 超过 10 个在途任务仍继续 claim；
  - 终态异常仍反复调度；
  - 多节点重复处理同一 row。
- Deferred to implementation:
  - 是否复用现有 `GenericGradingQueueProperties` 取决于配置命名偏好；推荐独立 properties。

### U5 - Implement Essay Detection, Poll, And essay_json Storage

- Goal: 根据 `has_essay` 决定是否轮询作文结果；有作文时使用 `assignment_grading_id` 轮询 `/api/v1/batch_assignment_grading/{grading_id}/results`，完成后保存完整 results JSON 作为 `essay_json`。
- Requirements covered: R5, R16
- Acceptance criteria covered: 作文完成后相关数据写入队列表。
- Depends on: U2, U4
- Files:
  - Add: `axon-common/src/main/java/com/xinxi/axon/common/service/exam/ExamAssignmentGradingExternalManifestGatewayService.java`
  - Add: `axon-common/src/main/java/com/xinxi/axon/common/service/exam/impl/ExamAssignmentGradingExternalManifestGatewayServiceImpl.java`
  - Add: `axon-common/src/main/java/com/xinxi/axon/common/dto/exam/ExamAssignmentGradingExternalManifestPollResultDTO.java`
  - Add: `axon-common/src/main/java/com/xinxi/axon/common/service/exam/ExamAssignmentGradingExternalManifestQueueProcessor.java`
  - Add: `axon-common/src/main/java/com/xinxi/axon/common/service/exam/impl/ExamAssignmentGradingExternalManifestQueueProcessorImpl.java`
  - Modify: `axon-common/src/main/java/com/xinxi/axon/common/service/exam/impl/ExamAssignmentGradingServiceImpl.java` if helper methods need public/package access
  - Add tests under `axon-common/src/test/java/com/xinxi/axon/common/service/exam/impl/`
- Forbidden files:
  - Generic grading analysis mapping.
- Approach:
  - 新增 gateway service，封装作文 results 调用和状态归一化，例如 `pollEssayResult(assignmentGradingId)` 返回标准化的 running/completed/failed、raw status、raw response、完整 `essay_json`。
  - Processor 不直接调用 `/api/v1/batch_assignment_grading/{grading_id}/results`，也不直接解析第三方作文 results 响应结构；只消费 gateway 返回的标准化结果并落库。
  - For queued row with essay gradingId:
    - if `has_essay=false`, set `essay_json={}` and move to generic waiting；
    - if `has_essay=true`, call `ExamAssignmentGradingExternalManifestGatewayService#pollEssayResult` with `assignment_grading_id`；
    - if running, release next attempt；
    - save the complete results JSON object as `essay_json`；
    - save results summary and move to generic waiting。
    - if not found/non-retriable failure, mark failed and exit queue。
  - Keep `essay_json_url` as reserved field only; do not pass it to analysis。
- Tests:
  - gateway pollEssayResult uses `assignment_grading_id` and maps queued/running/completed/failed；
  - gateway returns the complete raw essay results JSON as `essay_json` when completed；
  - queued/running essay results does not move forward；
  - has_essay false skips essay polling and stores `essay_json={}`；
  - completed essay results saves response snapshot and complete JSON as `essay_json`；
  - results call uses `assignment_grading_id` from `data.gradingTask.gradingId`；
  - 404/not-found marks queue failed；
  - 5xx/timeout retries up to max-transient-retries；
  - missing/invalid essay result fails/retries according to policy only when `has_essay=true`。
- Validation:
  - `mvn -pl axon-common "-Dtest=ExamAssignmentGradingExternalManifestGatewayServiceImplTest" test`
  - `mvn -pl axon-common "-Dtest=ExamAssignmentGradingExternalManifestQueueProcessorImplTest" test`
- Rollback signals:
  - 未完成作文就触发 generic analysis；
  - `has_essay=true` 时缺 `essay_json` 却继续触发 analysis；
  - `has_essay=false` 时未传 `{}`。
- Deferred to implementation:
  - 无。

### U6 - Implement Generic Results Poll And Analysis Trigger

- Goal: 轮询 generic results，`completed` 时触发 analysis。
- Requirements covered: R6, R7, R16
- Acceptance criteria covered: `completed` 触发 `do_analyze=true`。
- Depends on: U1, U5
- Files:
  - Modify: `axon-common/src/main/java/com/xinxi/axon/common/enums/exam/ExamGenericGradingApiEnum.java`
  - Add: `axon-common/src/main/java/com/xinxi/axon/common/dto/exam/ExamGenericGradingAnalysisRequestOptionsDTO.java`
  - Modify: `axon-common/src/main/java/com/xinxi/axon/common/service/exam/ExamAssignmentGradingExternalManifestGatewayService.java`
  - Modify: `axon-common/src/main/java/com/xinxi/axon/common/service/exam/impl/ExamAssignmentGradingExternalManifestGatewayServiceImpl.java`
  - Modify: `axon-common/src/main/java/com/xinxi/axon/common/service/exam/ExamGenericGradingService.java` only if the gateway reuses a lower-level generic grading method
  - Modify: `axon-common/src/main/java/com/xinxi/axon/common/service/exam/impl/ExamGenericGradingServiceImpl.java` only if the gateway reuses a lower-level generic grading method
  - Modify: `ExamAssignmentGradingExternalManifestQueueProcessorImpl`
- Forbidden files:
  - Analysis mock provider; mock 已废弃，不恢复。
- Approach:
  - Gateway service 增加 `pollGenericResult(genericGradingId)` 和 `triggerAnalysis(schoolId, examId, genericGradingId, essayJson)` 两类方法。
  - Gateway 内部扩展 generic results status 读取，保存 raw status，并把第三方状态映射为 queue processor 可消费的标准结果。
  - Gateway 内部组装 analysis 请求参数，统一保证 `do_analyze=true`、`essay_json` 必填、无作文时传 `{}`、不传 `essay_json_url`。
  - Processor 调用 gateway，不直接调用 `ExamGenericGradingServiceImpl` 或自己组装 analysis 请求。
  - 当 status=`completed`：
    - call gateway triggerAnalysis with `do_analyze=true`;
    - gateway includes full `essay_json` object when `has_essay=true`;
    - gateway includes `{}` when `has_essay=false`;
    - gateway does not include `essay_json_url`;
    - save request/response;
    - move queue to `ANALYSIS_TRIGGERED` and wait for generic results `analysis_running` / `analysis_compeleted`。
  - 若 status 为 running/queued，继续 poll。
  - generic results non-retriable failure marks queue failed；transient failure retryLater。
- Tests:
  - gateway pollGenericResult maps raw `completed` to analysis-pending decision；
  - gateway pollGenericResult maps raw `analysis_running` to analysis-running decision；
  - gateway triggerAnalysis assembles `do_analyze=true` and body/form payload；
  - status completed triggers analysis once；
  - do_analyze true and full essay_json present when has_essay=true；
  - no essay sends `essay_json={}`；
  - essay_json_url is not sent；
  - analysis trigger failure retries。
  - generic results 404 exits queue with failed status。
- Validation:
  - `mvn -pl axon-common "-Dtest=ExamAssignmentGradingExternalManifestGatewayServiceImplTest" test`
  - `mvn -pl axon-common "-Dtest=ExamGenericGradingServiceImplTest#*Analysis*" test`
  - `mvn -pl axon-common "-Dtest=ExamAssignmentGradingExternalManifestQueueProcessorImplTest" test`
- Rollback signals:
  - status completed 被当作最终完成；
  - analysis 请求缺少 `do_analyze=true`；
  - 无作文时省略 `essay_json` 而不是传 `{}`；
  - analysis 请求仍传递 `essay_json_url`。
- Deferred to implementation:
  - 传输格式按接口实现选择 body/form，但业务参数不可变。

### U7 - Poll Analysis Running/Completion And Fetch Final Analysis With do_analyze=false

- Goal: analysis 触发后继续轮询 results，识别 `analysis_running` 为运行中，直到 `analysis_compeleted`，再查询 analysis。
- Requirements covered: R8, R9, R16
- Acceptance criteria covered: 后续 analysis 查询均不重复执行分析。
- Depends on: U6
- Files:
  - Modify: `ExamAssignmentGradingExternalManifestQueueProcessorImpl`
  - Modify: `axon-common/src/main/java/com/xinxi/axon/common/service/exam/ExamAssignmentGradingExternalManifestGatewayService.java`
  - Modify: `axon-common/src/main/java/com/xinxi/axon/common/service/exam/impl/ExamAssignmentGradingExternalManifestGatewayServiceImpl.java`
  - Modify: `axon-common/src/main/java/com/xinxi/axon/common/service/exam/impl/ExamGenericGradingServiceImpl.java` only if existing user-facing analysis retrieval should delegate to the same false-query helper
  - Modify tests: `ExamAssignmentGradingExternalManifestGatewayServiceImplTest`, `ExamGenericGradingServiceImplTest`, `ExamAssignmentGradingExternalManifestQueueProcessorImplTest`
- Forbidden files:
  - Existing wrong-question-statistics mapping unless adding a shared false-query helper requires it.
- Approach:
  - In `ANALYSIS_TRIGGERED` or `ANALYSIS_RUNNING`, processor calls gateway `pollGenericResult(genericGradingId)`；gateway handles `/generic_grading/{grading_id}/results` and status normalization。
  - If status=`analysis_running`, mark or keep queue `ANALYSIS_RUNNING` and release next attempt；do not call analysis with `do_analyze=true` again。
  - If status=`analysis_compeleted`, processor calls gateway `fetchAnalysis(schoolId, examId, genericGradingId)`；gateway always sends `do_analyze=false` for this method。
  - Save final analysis response and mark queue `ANALYSIS_FETCHED` or `ANALYSIS_COMPLETED`。
  - Existing user-facing analysis retrieval should use the same false-query helper after this change。
  - Analysis running poll follows the same retry/not-found/non-retriable failure classifier。
- Tests:
  - gateway fetchAnalysis always sends `do_analyze=false`；
  - gateway does not send `essay_json_url` in false-query path；
  - status completed after trigger keeps polling；
  - status analysis_running keeps polling and does not trigger analysis again；
  - status analysis_compeleted calls analysis false；
  - subsequent analysis helper defaults do_analyze=false；
  - compatible spelling `analysis_completed` if desired。
  - repeated transient failure exits after max retries。
- Validation:
  - `mvn -pl axon-common "-Dtest=ExamAssignmentGradingExternalManifestGatewayServiceImplTest" test`
  - `mvn -pl axon-common "-Dtest=ExamAssignmentGradingExternalManifestQueueProcessorImplTest" test`
- Rollback signals:
  - `do_analyze=false` not passed after completion；
  - repeated true calls after analysis already completed。
- Deferred to implementation:
  - Final local queue status name可定为 `ANALYSIS_COMPLETED`，但 raw status 保留 `analysis_compeleted`。

### U8 - Documentation And Smoke Plan

- Goal: 更新接口文档、SQL 执行说明和冒烟流程。
- Requirements covered: R1-R16
- Acceptance criteria covered: 后续实施和联调有明确步骤。
- Depends on: U2-U7
- Files:
  - Add: `docs/04-api/2026-06-30-external-manifest-analysis-queue-api.md`
  - Add: `docs/05-reports/2026-06-30-external-manifest-analysis-queue-validation-report.md`
  - Update after implementation: `docs/08-ai-memory/03-key-workflows.md`
  - Update after implementation if needed: `docs/08-ai-memory/04-known-pitfalls.md`
- Forbidden files:
  - `docs/08-ai-memory` before behavior is implemented and verified.
- Approach:
  - 文档必须明确：入口现有逻辑不变，队列是成功后后处理。
  - 冒烟步骤：
    - 调 `external/create-from-manifest`；
    - 确认返回仍有 `manifest + gradingTask`；
    - 查队列表；
    - 等作文 completed 和 `essay_json`；
    - 等 generic results completed；
    - 确认 analysis true 触发；
    - 等 results `analysis_running` 后继续轮询；
    - 等 results `analysis_compeleted`；
    - 确认 analysis false 查询。
- Tests:
  - 文档 review。
- Validation:
  - `rg -n "现有逻辑不变|do_analyze|essay_json|essay_json_url|analysis_running|analysis_compeleted|raw-data/refs" docs/04-api docs/ae`
- Rollback signals:
  - 文档仍写“入口改纯入队”；
  - AI memory 写入未验证结论。
- Deferred to implementation:
  - 本轮只修改方案，不更新 AI memory。

## Consistency Check

- implementationUnitCount: 8
- sourceRequirementsCovered: R1-R16
- sourceRequirementsDeferred: OQ1-OQ3 需实施前确认或在实现中按假设落地并标注
- openQuestionsCount: 3

## Validation Plan

- Unit:
  - existing create-from-manifest response unchanged；
  - success after queue registration；
  - failure before assignment task create does not write active queue；
  - unified gateway service assembles third-party requests and normalizes generic/essay/analysis statuses；
  - essay poll and `essay_json` extraction；
  - generic results `completed` triggers analysis true；
  - generic results `analysis_running` keeps polling without duplicate analysis trigger；
  - generic results `analysis_compeleted` triggers analysis false fetch。
- Integration:
  - scheduler enabled/disabled；
  - queue claim/retry；
  - gateway call order with mocked third-party。
- User flow:
  - `POST /api/v1/exam-assignment-grading/external/create-from-manifest`
  - verify existing `manifest + gradingTask` response；
  - verify queue persisted `generic_manifest_id`, `generic_grading_id`, `assignment_manifest_id`, and `assignment_grading_id`；
  - wait queue stores essay result JSON content；
  - verify queue stores raw-data/refs material snapshot including paper pool and file refs；
  - wait generic results completed；
  - verify analysis true request；
  - wait results analysis_running and confirm no repeated true request；
  - wait results analysis_compeleted；
  - verify analysis false query snapshot。
- Data / operations:
  - execute migration；
  - inspect indexes；
  - inspect duplicate handling；
  - confirm `school_id` is `school_data.id` and no `third_party_school_id` queue column exists；
  - confirm `exam_id` is `exam_info.id` and no `local_exam_id` queue column exists；
  - confirm 30s scheduler setting。
  - confirm `max-in-flight=10`；
  - confirm failed terminal rows are not claimed again。
- Observability:
  - log queueId, genericManifestId, assignmentManifestId, genericGradingId, assignmentGradingId, rawGenericStatus, stage, retryCount；
  - avoid full student result payloads and credentials。

## Rollback / Recovery

- Disable scheduler: `exam-assignment-grading.external-manifest.queue.enabled=false`。
- Keep existing create-from-manifest logic untouched, so disabling queue only stops后处理。
- If queue registration is made blocking and causes issues, temporary rollback can change registration failure to non-blocking with high-severity log, but this risks losing automatic analysis.
- SQL rollback should first confirm no active rows; prefer logical disable over drop table.

## Plan Self-Review

- Placeholder scan: 无 TBD/TODO。
- Consistency check: 文档已移除“入口改纯入队”的旧误解。
- Scope check: 只追加成功后队列与 analysis 后处理，不重写现有外部入口业务。
- Acceptance coverage: R1-R16 均映射到 U1-U8。
- Validation gaps: analysis 大 JSON 传输格式、raw refs 数组资料是否需要独立列、`analysis_compeleted` 拼写兼容仍需实现阶段确认。`generic_grading_id` 来源、`essay_json` 内容范围、无作文规则和队列登记失败策略已确认。
- Alternatives and ADR check: 推荐方案与用户修正一致，旧纯入队方案已标记 rejected。
- High-risk pre-mortem check: 成功后队列登记失败、状态误判、重复 do_analyze=true、重复队列、超并发和异常无限轮询均有缓解。

## Handoff

- 本方案只修改文档，不实施代码。
- 可以从 U1 文档更新和 U2/U3 开始实施；U6/U7 需要在实现时确定 analysis 大 JSON 的具体传输格式，但业务字段语义已确认。

## Implementation Result（2026-06-30）

- **状态**：代码与单测已完成；SQL 已在目标库执行；端到端冒烟计划次日执行。
- **表**：`exam_assignment_grading_external_manifest_queue`（migration：`docs/06-sql/migrations/2026-06-30-exam-assignment-grading-external-manifest-queue.sql`）。
- **入口**：`create-from-manifest` 同步逻辑不变，成功后登记队列；登记失败抛业务异常。
- **调度**：`ExamAssignmentGradingExternalManifestQueueTask`，默认 30s、`max-in-flight=10`，锁名 `ASSIGNMENT_EXTERNAL_MANIFEST_ANALYSIS_QUEUE`。
- **Gateway**：`ExamAssignmentGradingExternalManifestGatewayService`；analysis 触发 `POST multipart` + `do_analyze=true` + `essay_json`；查询 `GET` + `do_analyze=false`。
- **文档**：`docs/04-api/2026-06-30-external-manifest-analysis-queue-api.md`；验证报告 `docs/05-reports/2026-06-30-external-manifest-analysis-queue-validation-report.md`。
- **归档**：`docs/00-process/archive/2026-06/external-manifest-analysis-queue/`。
- **待办**：服务重启 + 端到端冒烟（create-from-manifest → 队列表 → analysis 终态）。

## Post-Review Fix Result（2026-06-30）

代码审查后已补齐 3 个阻断问题，并以回归测试固化：

- `ExamAssignmentGradingExternalManifestQueueServiceImpl#saveProgress/updateRow`：状态推进保存时必须清空 `processing_stage`、`processing_token`、`processing_started_at`，避免 claim 后的队列行被保存成“processing_stage 非空但 processing_started_at 为空”，导致后续永远无法再次 claim。
- `ExamAssignmentGradingExternalManifestQueueProcessorImpl`：generic results 或 analysis 轮询拿到标准化 `FAILED` 时必须 `markFailed` 退出活跃队列，不能继续 `releaseForNextPoll` 无限轮询。
- `ExamAssignmentGradingExternalManifestQueueProcessorImpl`：只保留一个带 `AssignmentGradingExternalManifestQueueProperties` 的 public 构造器，避免 Spring 构造器选择歧义和配置失效风险。

补充验证：

```bash
mvn -pl axon-common "-Dtest=ExamAssignmentGradingExternalManifestQueueProcessorImplTest,ExamAssignmentGradingExternalManifestQueueServiceImplTest" test
mvn -pl axon-common "-Dtest=ExamAssignmentGradingExternalManifestGatewayServiceImplTest,ExamAssignmentGradingExternalManifestQueueProcessorImplTest,ExamAssignmentGradingExternalManifestQueueServiceImplTest,ExamAssignmentGradingServiceImplTest" test
mvn -pl axon-chat -am "-Dtest=ExamAssignmentGradingExternalManifestQueueTaskTest" "-Dsurefire.failIfNoSpecifiedTests=false" test
```

结果：相关测试分别为 19、66、6 个用例通过。`javap` 已确认 Processor 编译产物仅剩一个 public 构造器。
