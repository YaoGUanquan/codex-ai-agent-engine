---
type: plan
status: drafted
date: 2026-06-20
title: generic-grading-resumable-queue
origin: docs/ae/prds/2026-06-20-generic-grading-resumable-queue-prd.md
---

# Plan: 通用批改可恢复队列化流程

## Source

- 用户描述的 8 步通用批改流程与改造诉求。
- 现有代码事实：
  - Controller: `axon-chat/src/main/java/com/xinxi/chatservice/controller/exam/ExamGenericGradingController.java`
  - Service: `axon-common/src/main/java/com/xinxi/axon/common/service/exam/impl/ExamGenericGradingServiceImpl.java`
  - JSON 快照: `axon-common/src/main/java/com/xinxi/axon/common/entity/exam/ExamGenericGradingJsonGenerationSnapshotPO.java`
  - 考试列表/详情: `axon-chat/src/main/java/com/xinxi/chatservice/controller/exam/ExamInfoController.java`, `axon-common/src/main/java/com/xinxi/axon/common/service/exam/impl/ExamInfoServiceImpl.java`
  - 当前 JSON 快照表: `docs/06-sql/migrations/2026-06-18-exam-generic-grading-json-generation-snapshot.sql`

## Scope

- 新增通用批改流程持久化表和枚举。
- 改造 `raw-data/refs`，保存可恢复材料登记上下文。
- 将 `json-aggregate/progress` 从前端轮询推进升级为后台队列推进，并保持查询接口兼容。
- JSON 全部完成后自动注册 manifest 并保存 `manifestId`。
- 将 `tasks` 改为本地任务登记 + 后台提交第三方 + 轮询终态/超时态。
- 扩展考试列表和详情 VO，返回通用批改流程状态与关键第三方参数。
- 批改完成后的结果明细暂不本地化，前端通过已有第三方封装查询接口读取结果。

## Readiness

- Goal: 后端自动推进通用批改流程，列表/详情可恢复任意中断步骤。
- Acceptance criteria: PRD 验收标准全部可通过接口、DB 和日志验证。
- Non-goals: 不改 OSS 上传链路，不引入外部队列中间件，不重构旧网阅主流程。
- Affected areas: `axon-common` 实体/Mapper/Service/VO/DTO/枚举，`axon-chat` Controller/Scheduled，`docs/06-sql/migrations`。
- Validation surface: Maven 编译、Service 单元测试、SQL DDL 检查、本地接口冒烟。
- Open questions: 批改失败或超时后是否允许同一 manifest 重试。

## Assumptions

- 使用 DB 抢占实现队列并发，定时任务部署在 `axon-chat`。
- JSON 队列并发和批改任务队列并发均默认 10，可通过配置调整。
- 队列实现采用 `@Scheduled` 定时 dispatcher + DB 状态表，不使用长时间阻塞线程等待第三方完成。
- “最多并发 10 组”指第三方 in-flight 任务上限，不等于 JVM 同时开 10 个长生命周期线程。
- 多实例部署下，dispatcher 必须先获取 DB 调度锁；否则多个实例可能同时执行 `count + claim` 并突破全局 in-flight 上限。
- 后台调度必须幂等：同一考试不能重复注册 manifest，不能重复提交第三方批改任务。
- 列表和详情新增字段保持向后兼容，不删除原字段。
- `json-aggregate/progress` 改为只读进度查询，或最多登记待生成状态；不得继续在接口内直接调用 `advanceOneStep` 推进第三方任务。
- 前端修改 manifest JSON 后，本地规则状态进入 `RULE_CONFIRMED`；之后调用 `/tasks` 才进入批改提交队列，manifest 修改本身不触发批改重新入队。
- 第三方批改任务最长运行窗口按配置控制，默认 `600000ms`，允许 5-10 分钟范围；超过窗口标记 `GRADING_TIMEOUT`。
- 批改完成只更新通用批改 flow state，不把批改结果明细写入本地业务表，也不把 `exam_info.main_status` 同步为学情分析状态。

## Alternatives Considered

- Recommended: 新增本地流程表 + DB 抢占 + `@Scheduled` 后台推进。
- Alternative: 继续让前端轮询 `json-aggregate/progress` 和 `tasks` 状态。
- Rejected because: 前端驱动无法保证中断恢复，且高并发时会放大第三方请求。
- Alternative: 引入 MQ/Redis 队列。
- Rejected because: 当前仓库已有定时任务和 DB 快照模式，本次需求不需要新增运行时依赖。

## Decision Drivers

- Driver 1: 中断恢复必须由数据库事实驱动，不能依赖前端内存状态。
- Driver 2: 第三方异步任务必须限流并幂等，避免重复生成 JSON 或重复提交批改。
- Driver 3: 列表/详情要能直接告诉前端下一步，减少前端对多个第三方接口状态的拼装。

## Decisions

### ADR-1 - 通用批改流程状态独立于 exam_info.main_status

- Decision: 新增通用批改流程状态，不扩大 `ExamMainStatusEnum` 语义；本次批改完成后也不自动同步 `exam_info.main_status=5`。
- Drivers: `main_status` 已承载传统网阅流程；通用批改中间态更多，直接复用会污染旧列表语义。
- Alternatives: 给 `ExamMainStatusEnum` 增加大量通用批改状态。
- Why chosen: 独立流程状态可表达第三方材料、JSON、manifest、批改任务的细粒度阶段，同时保持旧接口兼容。
- Consequences: 列表/详情需要新增 `genericGradingStatus` 等字段。
- Follow-ups: 如果后续要把第三方批改结果转入本地学情分析，再单独设计结果落库和 `main_status` 流转。

### ADR-2 - 使用 DB 抢占而不是内存队列

- Decision: 后台任务按数据库状态查询待处理记录，用 `version + processing_token + processing_started_at` 抢占。
- Drivers: 服务重启可恢复，多实例下不重复处理，已与 JSON 快照表现有设计一致。
- Alternatives: JVM 内存 `BlockingQueue`。
- Why chosen: 内存队列重启丢任务，无法覆盖用户中断恢复。
- Consequences: 需要补齐索引、状态字段和超时回收逻辑。
- Follow-ups: 若后续任务量升高，再评估 MQ。

### ADR-3 - manifest 自动注册由 JSON 完成事件触发

- Decision: 三类 JSON `READY` 后，后台调度自动注册 manifest，并保存 `manifestId` 和 manifest 详情。
- Drivers: 用户要求第 4 步完成后默认先执行第 5 步注册并把 ID 返回前端。
- Alternatives: 仍由前端手动调用 `/manifests`。
- Why chosen: 自动注册减少前端分支，也让规则编辑入口稳定依赖本地状态。
- Consequences: 需要定义默认 `manifestId/name/description/overwrite` 的生成规则。
- Follow-ups: 前端仍可调用详情与 JSON 修改接口进行规则调整。

### ADR-4 - 后台队列采用定时 dispatcher 和 DB 限流

- Decision: 使用 Spring `@Scheduled(fixedDelayString=...)` 作为轻量 dispatcher；dispatcher 每轮按配置从 DB claim 小批量任务，发起第三方异步调用或轮询状态后立即释放本地线程。
- Drivers: 任务必须可恢复，不能因为服务重启丢失；不能一次性加载大量待处理记录压垮第三方；不能用大量本地线程阻塞等待第三方完成。
- Alternatives: 为每个考试创建一个本地异步线程循环等待第三方完成；使用内存队列；引入 MQ。
- Why chosen: DB dispatcher 可以用 `next_attempt_at`、`in-flight count`、`batch size`、`retry_count` 做背压，且不引入新依赖。
- Consequences: 表结构需要增加 `next_attempt_at`、`retry_count`、`last_checked_at`、`processing_*` 字段；调度任务需要严格幂等。
- Follow-ups: 如果后续跨实例压力变大，可只替换 dispatcher 为 MQ 消费者，状态表和幂等逻辑保持不变。

### ADR-5 - 多实例调度锁保护全局 in-flight 额度

- Decision: 为 JSON、manifest、grading 三类 dispatcher 增加 DB 调度锁，锁粒度分别为 `GENERIC_GRADING_JSON_QUEUE`、`GENERIC_GRADING_MANIFEST_QUEUE`、`GENERIC_GRADING_TASK_QUEUE`。
- Drivers: 多实例部署时每个实例都会触发 `@Scheduled`；如果没有全局锁，多个实例可能同时看到相同剩余额度并各自 claim 一批任务。
- Alternatives: 只依赖单条记录 `version + processing_token` 抢占；把 in-flight 上限改成单实例局部上限。
- Why chosen: 单条抢占能防止同一任务重复处理，但不能保证“全局最多 10 个第三方任务”；DB 锁可以串行化 `count + claim` 这一小段关键区。
- Consequences: 需要新增轻量锁表或使用 MySQL `GET_LOCK`；获取锁失败直接跳过本轮，不阻塞调度线程。
- Follow-ups: 如果未来引入 MQ，锁可替换为单消费者分区或分布式限流器。

## Risks

- 第三方状态字段不稳定会导致本地误判终态，需要集中归一状态。
- 后台调度频率过高会压第三方服务，需要配置轮询间隔和单批上限。
- 如果 dispatcher 每轮查询不加 `LIMIT` 或不按 `next_attempt_at` 过滤，会一次性加载过多任务并放大第三方请求。
- 如果把第三方异步任务当成本地同步任务等待，会占满调度线程或业务线程池。
- `raw-data/refs` 如果使用 replace 模式，必须重置 JSON、manifest 和 grading 任务，避免旧规则混用新资料。
- 多实例部署时，DB 抢占条件必须覆盖 version 和超时回收，否则会重复提交第三方。
- 如果 `json-aggregate/progress` 继续执行现有 `advanceOneStep`，会绕过后台队列限流并导致前端刷新触发第三方任务。
- 如果 in-flight 统计依赖 `next_attempt_at` 时间窗口，会漏算长时间运行或退避中的任务，导致实际第三方并发超过上限。
- 如果批改任务超过 10 分钟仍按 running 无限轮询，会让列表展示长期卡住且浪费第三方状态查询额度。

## Pre-Mortem

- Failure scenario 1: 用户重新登记材料后仍复用旧 manifest，导致批改使用旧 JSON。
- Failure scenario 2: 定时任务重复提交 `/tasks`，第三方产生多个 gradingId。
- Failure scenario 3: 列表逐条查询第三方状态造成 N+1 和接口超时。
- Failure scenario 4: 调度器一次性扫描 1000 条待处理记录，第三方被突发请求压垮。
- Failure scenario 5: 多实例同时执行 `count + claim`，每个实例都认为有剩余额度，导致全局第三方 in-flight 超过 10。
- Failure scenario 6: 批改 completed 后错误写入 `exam_info.main_status=5`，让未落库的第三方结果被误认为本地学情已就绪。
- Failure scenario 7: 批改任务第三方长期 running，超过第三方最长运行窗口后仍不进入终态。
- Mitigations: sourceFingerprint 变化时重置下游状态；任务提交前检查本地 `gradingId` 是否存在；列表只读本地快照，不实时请求第三方；所有待处理查询必须带 `LIMIT`、`next_attempt_at <= now` 和 in-flight 剩余额度；dispatcher 入口使用 DB 调度锁串行化每个队列的 `count + claim`；批改 completed 只更新 flow state；`grading_started_at + timeout` 到期后写 `GRADING_TIMEOUT`。

## Flow Status Model

| 状态码 | 阶段 | 含义 | 可进入条件 |
|---|---|---|---|
| `BASIC_CREATED` | 基础信息 | 考试基础信息已创建 | `/exam/create` 成功 |
| `RAW_DATA_REGISTERED` | 材料 | OSS 路径和第三方 raw refs 已登记 | `raw-data/refs` 成功 |
| `JSON_PENDING` | JSON | 等待后台生成 JSON | raw refs 保存完成或下游重置 |
| `JSON_STARTING` | JSON | dispatcher 已 claim，准备启动第三方 JSON 任务 | 调度锁内从 pending 转入 |
| `JSON_GENERATING` | JSON | 第三方 JSON 任务运行中 | 已保存 JSON jobId |
| `JSON_READY` | JSON | 三类 JSON 全部完成 | snapshot 全部 READY |
| `JSON_FAILED` | JSON | JSON 生成失败 | 第三方 failed 或重试耗尽 |
| `MANIFEST_PENDING_REGISTER` | manifest | 等待自动注册规则 | JSON_READY 且无 manifestId |
| `MANIFEST_REGISTERING` | manifest | dispatcher 已 claim，准备注册 manifest | 调度锁内从 pending 转入 |
| `MANIFEST_READY` | manifest | 规则注册完成 | 已保存 manifestId |
| `MANIFEST_FAILED` | manifest | 规则注册失败 | 第三方失败或重试耗尽 |
| `RULE_CONFIRMED` | rule | 前端已修改或确认 manifest JSON | `updateManifestJson` 成功 |
| `GRADING_PENDING_SUBMIT` | grading | 等待后台提交批改 | `/tasks` 登记成功 |
| `GRADING_SUBMITTING` | grading | dispatcher 已 claim，准备提交第三方 | 调度锁内从 pending 转入 |
| `GRADING_RUNNING` | grading | 第三方批改任务运行中 | 已保存 gradingId |
| `GRADING_COMPLETED` | grading | 第三方批改完成 | 第三方状态 completed |
| `GRADING_FAILED` | grading | 第三方批改失败 | 第三方状态 failed 或重试耗尽 |
| `GRADING_TIMEOUT` | grading | 第三方批改超时 | running 超过 5-10 分钟配置窗口 |

实现时可以拆成 `flow_status + json_status + manifest_status + rule_status + grading_status`，也可以用一个主状态表达当前阶段；无论采用哪种字段结构，列表/详情需要能映射出上表状态。

## Queue Runtime Model

```text
Spring @Scheduled dispatcher
  |
  |-- read config: enabled, maxInFlight, startBatchSize, pollBatchSize, fixedDelay, minPollInterval
  |
  |-- try acquire DB queue lock by atomic update / MySQL GET_LOCK
  |
  |-- count current in-flight rows by active statuses
  |     JSON: JSON_STARTING, JSON_GENERATING
  |     grading: GRADING_SUBMITTING, GRADING_RUNNING
  |
  |-- claim <= min(startBatchSize, maxInFlight - currentInFlight) rows
  |     where status in pending statuses
  |       and next_attempt_at <= now
  |       and processing_stage is null or stale
  |     using version + processing_token
  |     set status to STARTING/SUBMITTING inside this lock
  |
  |-- release DB queue lock before third-party HTTP
  |
  |-- for each claimed active row:
  |     call third-party async start API
  |     save jobId/gradingId and status
  |     set next_attempt_at = now + minPollInterval
  |     release processing token
  |
  |-- claim <= pollBatchSize in-flight rows due for status check
  |     call third-party status API
  |     if queued/running and not timeout: set next_attempt_at with backoff
  |     if completed: mark READY/COMPLETED and trigger next stage
  |     if failed: mark FAILED and save reason
  |     if grading runtime > timeout window: mark GRADING_TIMEOUT
```

本地线程模型：

- `@Scheduled` 方法只做短周期调度，不在 while 循环里等待第三方完成。
- 第三方 JSON 生成和批改都按异步任务处理，第三方运行期间本地没有占用线程。
- 第一阶段建议单 dispatcher 线程顺序处理 claim 到的小批量记录；若后续单次 HTTP 延迟过高，再引入专用 `ThreadPoolTaskExecutor`，核心线程 2、最大线程 4、队列 20、拒绝策略不再启动新任务。

第三方保护参数：

| 参数 | 默认值 | 作用 |
|---|---:|---|
| `generic-grading.queue.enabled` | `true` | 总开关，异常时可关闭后台推进 |
| `generic-grading.queue.json.fixed-delay-ms` | `10000` | JSON dispatcher 周期 |
| `generic-grading.queue.json.max-in-flight` | `10` | JSON 第三方 in-flight 上限 |
| `generic-grading.queue.json.start-batch-size` | `2` | 单轮最多新启动 JSON 组数 |
| `generic-grading.queue.json.poll-batch-size` | `10` | 单轮最多轮询 JSON 组数 |
| `generic-grading.queue.json.min-poll-interval-ms` | `30000` | 同一 JSON 任务最小轮询间隔 |
| `generic-grading.queue.grading.fixed-delay-ms` | `15000` | 批改 dispatcher 周期 |
| `generic-grading.queue.grading.max-in-flight` | `10` | 批改第三方 in-flight 上限 |
| `generic-grading.queue.grading.submit-batch-size` | `2` | 单轮最多新提交批改任务数 |
| `generic-grading.queue.grading.poll-batch-size` | `10` | 单轮最多轮询批改任务数 |
| `generic-grading.queue.grading.min-poll-interval-ms` | `60000` | 同一批改任务最小轮询间隔 |
| `generic-grading.queue.grading.task-timeout-ms` | `600000` | 第三方批改最长运行窗口，建议 5-10 分钟 |
| `generic-grading.queue.reclaim-timeout-ms` | `300000` | processing token 超时回收 |
| `generic-grading.queue.circuit-breaker-failure-threshold` | `5` | 连续失败后暂停新启动 |
| `generic-grading.queue.circuit-breaker-cooldown-ms` | `120000` | 熔断冷却时间 |
| `generic-grading.queue.lock-ttl-ms` | `30000` | DB 调度锁过期时间 |

多实例调度锁：

- 新增 `exam_generic_grading_queue_lock` 或复用 MySQL `GET_LOCK` 实现同一队列同一时刻只有一个 dispatcher 执行 `count + claim`。
- 获取锁失败直接跳过本轮，不阻塞等待。
- 锁只覆盖 `count in-flight -> claim due rows -> pending 改为 STARTING/SUBMITTING` 的短临界区；第三方 HTTP 调用前应释放锁，避免慢请求阻塞其它队列。
- 即使有调度锁，每条记录仍保留 `version + processing_token` 抢占，作为第二道幂等保护。
- 锁获取必须是原子语义，例如 `UPDATE ... WHERE lock_name = ? AND expires_at < NOW()` 成功行数为 1，或 MySQL `GET_LOCK(lockName, 0)` 返回 1；不能用先查后改的非原子逻辑。

## Implementation Units

### U1 - 新增本地流程状态与持久化模型

- Goal: 保存通用批改全链路可恢复状态。
- Requirements covered: raw-data refs 持久化、状态展示、队列幂等。
- Acceptance criteria covered: 中断恢复、状态展示、并发控制。
- Depends on: none
- Files:
  - `docs/06-sql/migrations/2026-06-20-exam-generic-grading-flow-state.sql`
  - `axon-common/src/main/java/com/xinxi/axon/common/entity/exam/ExamGenericGradingFlowStatePO.java`
  - `axon-common/src/main/java/com/xinxi/axon/common/mapper/exam/ExamGenericGradingFlowStateMapper.java`
  - `axon-common/src/main/java/com/xinxi/axon/common/enums/exam/ExamGenericGradingFlowStatusEnum.java`
  - `axon-common/src/main/java/com/xinxi/axon/common/service/exam/ExamGenericGradingFlowStateService.java`
  - `axon-common/src/main/java/com/xinxi/axon/common/service/exam/impl/ExamGenericGradingFlowStateServiceImpl.java`
  - `axon-common/src/main/java/com/xinxi/axon/common/entity/exam/ExamGenericGradingQueueLockPO.java`
  - `axon-common/src/main/java/com/xinxi/axon/common/mapper/exam/ExamGenericGradingQueueLockMapper.java`
  - `axon-common/src/main/java/com/xinxi/axon/common/service/exam/ExamGenericGradingQueueLockService.java`
- Forbidden files: none
- Approach: 新表按 `school_id + exam_id` 唯一，保存 raw refs 请求/响应、manifest、grading、流程状态、错误、version、processing 字段；批改结果明细不进入该表，只保存第三方任务引用和状态。
- Queue fields: 增加 `next_attempt_at`、`retry_count`、`last_checked_at`、`last_started_at`、`grading_started_at`、`processing_stage`、`processing_token`、`processing_started_at`；所有队列查询依赖这些字段限流。另建队列锁表或服务，保证多实例下每类 dispatcher 的 `count + claim + 状态转 active` 串行。
- Tests: FlowStateService 创建、更新、抢占、重置下游状态单元测试。
- Validation: `mvn -pl axon-common -DskipTests compile`
- Rollback signals: DDL 无法兼容已有数据；同一考试出现多条 active flow state。
- Deferred to implementation: 字段长度按第三方响应实际大小微调。

### U2 - raw-data/refs 成功后保存材料登记明细

- Goal: 第三步成功后，列表/详情可恢复材料路径和第三方登记响应。
- Requirements covered: raw-data refs 持久化、重新进入继续注册。
- Acceptance criteria covered: 中断恢复。
- Depends on: U1
- Files:
  - `axon-common/src/main/java/com/xinxi/axon/common/service/exam/impl/ExamGenericGradingServiceImpl.java`
  - `axon-common/src/main/java/com/xinxi/axon/common/service/exam/ExamGenericGradingService.java`
  - `axon-common/src/main/java/com/xinxi/axon/common/vo/exam/ExamGenericGradingRawDataRefsVO.java`
- Forbidden files: `axon-chat/src/main/java/com/xinxi/chatservice/controller/exam/ExamGenericGradingController.java`
- Approach: 在第三方 `raw-data/refs` 成功后调用 FlowStateService 保存请求 files、payload、响应、raw/student manifest URL、capabilities；sourceFingerprint 变化时重置 JSON/manifest/grading 下游状态。
- Tests: registerRawDataRefs 保存 flow state；相同 fingerprint 不重置；不同 fingerprint 重置下游。
- Validation: `mvn -pl axon-common -Dtest=ExamGenericGradingServiceImplTest test`
- Rollback signals: 第三方登记失败但本地写入成功。
- Deferred to implementation: 是否将 file_upload_record id 反写到 flow state。

### U3 - JSON 生成后台队列化

- Goal: 不依赖前端多次请求，后台自动推进三类 JSON。
- Requirements covered: 后台队列最多 10 组、自动执行完成。
- Acceptance criteria covered: 自动推进、并发控制。
- Depends on: U1, U2
- Files:
  - `axon-common/src/main/java/com/xinxi/axon/common/service/exam/impl/ExamGenericGradingServiceImpl.java`
  - `axon-common/src/main/java/com/xinxi/axon/common/service/exam/ExamGenericGradingJsonGenerationSnapshotService.java`
  - `axon-common/src/main/java/com/xinxi/axon/common/service/exam/impl/ExamGenericGradingJsonGenerationSnapshotServiceImpl.java`
  - `axon-chat/src/main/java/com/xinxi/chatservice/scheduled/ExamGenericGradingJsonQueueTask.java`
  - `axon-chat/src/main/resources/application.yml`
- Forbidden files: none
- Approach: 将 `json-aggregate/progress` 改为只读查询或登记待生成状态，不能继续调用当前 `advanceOneStep` 绕过限流；新增 `ExamGenericGradingJsonQueueTask` 使用 `@Scheduled(fixedDelayString=...)`，在调度锁内按 active 状态统计 JSON in-flight 数，再按 `start-batch-size` 和剩余额度 claim `JSON_PENDING` 记录并置为 `JSON_STARTING`，释放锁后启动第三方任务并保存 jobId、`JSON_GENERATING` 和 `next_attempt_at`；轮询记录按 `poll-batch-size` 和 `next_attempt_at` 分批处理。若历史快照已出现 `strategy GENERATING/READY + layout PENDING/GENERATING`，状态机要先清空旧 `strategy` job/url/content，再优先补齐或轮询 `layout`，待 `layout READY` 后重新按固定 `options_json` 启动 `strategy`。
- Tests: 并发 claim 只允许一个 worker；`json-aggregate/progress` 不再触发 `advanceOneStep`；READY 后不再重复生成；100 条待处理记录时单轮最多启动配置数量；未到 `next_attempt_at` 不轮询；历史快照中已提前启动的 `strategy` 不得继续沿用旧 job，必须在 `layout READY` 后重新启动。
- Validation: `mvn -pl axon-chat -am -DskipTests compile`；补充回归验证 `.\mvnw.cmd -pl axon-chat -am "-Dtest=ExamGenericGradingServiceImplTest,ExamGenericGradingControllerTest,ExamGenericGradingJsonQueueTaskTest" "-Dsurefire.failIfNoSpecifiedTests=false" "-Djacoco.skip=true" test`
- Rollback signals: 日志出现同一 stage 同一 exam 重复启动第三方任务，或旧 `strategy` job 在 `layout` 未 READY 时继续被轮询/复用。
- Deferred to implementation: 调度间隔默认值，例如 10s 或 30s。

### U4 - JSON 完成后自动注册 manifest

- Goal: 第四步完成后自动执行第五步，并返回 manifestId。
- Requirements covered: 自动注册规则、详情可查、前端可继续修改规则。
- Acceptance criteria covered: 自动注册。
- Depends on: U3
- Files:
  - `axon-common/src/main/java/com/xinxi/axon/common/service/exam/impl/ExamGenericGradingServiceImpl.java`
  - `axon-common/src/main/java/com/xinxi/axon/common/dto/exam/ExamGenericGradingManifestRegisterRequestDTO.java`
  - `axon-common/src/main/java/com/xinxi/axon/common/vo/exam/ExamGenericGradingManifestVO.java`
  - `axon-chat/src/main/java/com/xinxi/chatservice/scheduled/ExamGenericGradingManifestQueueTask.java`
- Forbidden files: none
- Approach: 检测三类 JSON READY 且无 manifestId 时，按小批量 claim 注册任务，生成稳定 manifestId，调用现有 `registerManifest`，保存响应并置 `MANIFEST_READY`；失败按 retry/backoff 写 `next_attempt_at`，超过上限写 `MANIFEST_FAILED`。
- Tests: 同一考试多次调度只注册一次；第三方 414/已存在时按可复用详情处理。
- Validation: `mvn -pl axon-common -Dtest=ExamGenericGradingManifestQueueTest test`
- Rollback signals: 同一考试产生多个 manifestId 或 manifest 指向旧 JSON URL。
- Deferred to implementation: 默认 manifest name/description 文案。

### U5 - manifest JSON 修改确认与批改任务队列化

- Goal: 前端修改 manifest JSON 后才能提交批改；第八步提交批改由后端自动执行、轮询到完成/失败/超时。
- Requirements covered: 规则确认状态、批改提交队列、批改完成状态展示、批改结果不本地化。
- Acceptance criteria covered: 批改队列、状态展示。
- Depends on: U1, U4
- Files:
  - `axon-common/src/main/java/com/xinxi/axon/common/service/exam/impl/ExamGenericGradingServiceImpl.java`
  - `axon-common/src/main/java/com/xinxi/axon/common/dto/exam/ExamGenericGradingCreateTaskRequestDTO.java`
  - `axon-common/src/main/java/com/xinxi/axon/common/vo/exam/ExamGenericGradingCreateTaskVO.java`
  - `axon-common/src/main/java/com/xinxi/axon/common/vo/exam/ExamGenericGradingManifestJsonUpdateVO.java`
  - `axon-common/src/main/java/com/xinxi/axon/common/service/exam/impl/ExamInfoServiceImpl.java`
  - `axon-chat/src/main/java/com/xinxi/chatservice/scheduled/ExamGenericGradingTaskQueueTask.java`
- Forbidden files: none
- Approach: `updateManifestJson` 成功后把 flow state 置为 `RULE_CONFIRMED` 并记录规则版本/确认时间；`POST /tasks` 只允许在 `RULE_CONFIRMED` 或已有 `GRADING_*` 状态下幂等登记，首次登记写 `GRADING_PENDING_SUBMIT` 并快速返回；`ExamGenericGradingTaskQueueTask` 在调度锁内按 `GRADING_SUBMITTING/GRADING_RUNNING` 统计 in-flight，claim 待提交记录并置为 `GRADING_SUBMITTING`，释放锁后提交第三方；已有 `gradingId` 的记录只按 `next_attempt_at` 轮询 `getTaskStatus`；completed 后只更新 flow state 为 `GRADING_COMPLETED`，不写 `exam_info.main_status=5`，不本地保存学生批改结果；超过 `grading.task-timeout-ms` 写 `GRADING_TIMEOUT`。
- Tests: manifest JSON 修改成功后进入 RULE_CONFIRMED；提交接口幂等返回已有 gradingId；100 条待提交记录时单轮最多提交配置数量；running 未到轮询时间不请求第三方；completed 只同步 flow state；failed 保留错误原因；超过 5-10 分钟窗口进入 GRADING_TIMEOUT。
- Validation: `mvn -pl axon-common -Dtest=ExamGenericGradingTaskQueueTest test`
- Rollback signals: 第三方已创建 gradingId 但本地仍是待提交；本地完成但第三方未 completed。
- Deferred to implementation: 批改结果本地化和学情主状态流转另起方案。

### U6 - 扩展考试列表和详情返回

- Goal: 前端从列表/详情恢复通用批改流程。
- Requirements covered: 列表返回第三方参数、详情返回第三方参数和数据状态。
- Acceptance criteria covered: 状态展示、中断恢复。
- Depends on: U1, U2, U4, U5
- Files:
  - `axon-common/src/main/java/com/xinxi/axon/common/vo/exam/ExamGenericGradingFlowStateVO.java`
  - `axon-common/src/main/java/com/xinxi/axon/common/vo/exam/ExamListItemVO.java`
  - `axon-common/src/main/java/com/xinxi/axon/common/vo/exam/ExamInfoVO.java`
  - `axon-common/src/main/java/com/xinxi/axon/common/service/exam/impl/ExamInfoServiceImpl.java`
  - `axon-chat/src/main/java/com/xinxi/chatservice/controller/exam/ExamInfoController.java`
- Forbidden files: none
- Approach: 列表批量查询 flow state，避免 N+1 第三方请求；新增 `genericGradingStatus/statusName/manifestId/gradingId/thirdPartyTaskStatus/rawDataRegistered/jsonReady/canContinue/nextAction` 等字段；详情返回完整 flow state。
- Tests: 列表批量映射；无 flow state 时字段为空或 BASIC_CREATED；详情包含 JSON URL 和错误。
- Validation: `mvn -pl axon-common -Dtest=ExamInfoServiceImplTest test`
- Rollback signals: 列表响应变慢或旧字段缺失。
- Deferred to implementation: 前端展示字段命名可按联调反馈微调。

### U7 - 文档、SQL 与冒烟脚本

- Goal: 提供数据库变更和接口验证闭环。
- Requirements covered: 全链路验证。
- Acceptance criteria covered: 所有验收标准。
- Depends on: U1, U2, U3, U4, U5, U6
- Files:
  - `docs/06-sql/migrations/2026-06-20-exam-generic-grading-flow-state.sql`
  - `docs/04-api/2026-06-20-generic-grading-resumable-flow-api.md`
  - `docs/05-reports/2026-06-20-generic-grading-resumable-flow-smoke.md`
  - `docs/07-test-data/generic-grading-resumable-flow/*.json`
- Forbidden files: repository root
- Approach: SQL 放 migrations；请求样例放 test-data；冒烟结果放 reports。
- Tests: SQL dry-run、接口请求样例。
- Validation: `mvn -pl axon-chat -am -DskipTests compile`
- Rollback signals: SQL 与 PO 字段不一致。
- Deferred to implementation: 真实 token 和本地服务由用户提供后再自动冒烟。

## Validation Plan

- Unit: FlowStateService、JSON queue、manifest auto register、task queue、ExamInfoService VO 映射。
- Integration: `mvn -pl axon-chat -am test`，如测试过重则先执行相关模块定向测试。
- User flow: 创建考试 -> 登记 raw refs -> 等后台生成 JSON -> 自动 manifest -> 修改规则并进入 RULE_CONFIRMED -> 提交批改 -> 等 completed/failed/timeout -> 列表/详情状态检查 -> 结果展示走第三方封装查询接口。
- Data / operations: 执行 migration 后检查唯一键、状态索引、processing 超时回收、grading 超时窗口。
- Load / throttling: 构造 100 条待处理 flow state，验证单轮启动数、轮询数和第三方调用数均不超过配置。
- Observability: 后台任务日志包含 schoolId、examId、manifestId、gradingId、status、requestId、claimedCount、startedCount、polledCount、inFlightCount，不打印完整 JSON 大字段。

## Rollback / Recovery

- DDL 回滚：新增表可先停用调度后逻辑删除或 drop；不影响 `exam_info` 主表。
- 功能回滚：关闭调度配置，恢复前端轮询 `json-aggregate/progress` 与手动 `/tasks` 行为。
- 数据恢复：sourceFingerprint 变化可重置下游 JSON/manifest/grading 状态；失败态保留错误原因并允许重新入队。

## Plan Self-Review

- Placeholder scan: 无 TBD/TODO。
- Consistency check: PRD、Scope、实施单元均围绕通用批改可恢复队列化。
- Scope check: 未改 OSS 上传链路，未引入 MQ。
- Acceptance coverage: 每条验收标准映射到 U1-U7。
- Validation gaps: 真实第三方状态值需联调确认；批改失败/超时重试策略需产品确认；调度参数需压测后调整。
- Alternatives and ADR check: 已记录 DB 抢占、独立状态、自动 manifest 的选择原因。
- High-risk pre-mortem check: 覆盖重复提交、旧 manifest 混用、列表 N+1、批改超时、错误主状态同步。

## Handoff

建议先执行 U1-U2，确认数据模型和 raw-data 恢复语义；再做 U3-U4 自动 JSON/manifest；最后做 U5-U6 批改队列与列表详情展示。实现前建议用 `ae-review domain:document` 评审本计划。
