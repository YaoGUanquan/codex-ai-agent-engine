---
type: plan
status: drafted
date: 2026-06-25
title: generic-grading-poll-decision-classifier
origin: docs/02-design/exam-generic-grading-404-poll-optimization.md
originFingerprint: 2026-06-25-exam-generic-grading-404-poll-optimization
depth: deep
format: human-readable-plan
sharded: false
---

# Plan: 通用批改 Poll 决策分类器收敛

## Source

- 设计文档：`docs/02-design/exam-generic-grading-404-poll-optimization.md`
- 接口说明：`docs/04-api/exam-generic-grading-poll-fail-fast.md`
- 当前代码事实：
  - `axon-chat/src/main/java/com/xinxi/chatservice/scheduled/ExamGenericGradingJsonQueueTask.java`
  - `axon-chat/src/main/java/com/xinxi/chatservice/scheduled/ExamGenericGradingTaskQueueTask.java`
  - `axon-common/src/main/java/com/xinxi/axon/common/service/exam/impl/ExamGenericGradingServiceImpl.java`
  - `axon-common/src/main/java/com/xinxi/axon/common/service/exam/support/ExamRecognitionTaskStatusResolver.java`
  - `axon-common/src/main/java/com/xinxi/axon/common/config/GenericGradingQueueProperties.java`
- 当前工作区已经有一版止血修复，能把 404 从无限轮询里截断出来；下一步要做的是把 8010 / 8040 的判定规则收敛到一处，减少后续漂移。

## Source Requirement Map

- SR1: 8010 / 8040 遇到 `404 / No such job / 任务不存在 / 已过期` 时必须终态，不再继续轮询。
- SR2: `5xx / 408 / 429 / 超时 / 连接失败` 仍然是可重试瞬时失败，且受各自队列重试上限约束。
- SR3: 8010 与 8040 必须共享同一套轮询判定规则，避免 queue-local 分支漂移。
- SR4: 对外 `getOmrTaskStatus` / `getTaskStatus` 语义不变，只收敛后台队列路径。

## AI Parse Contract

- canonicalKind: plan
- humanEquivalent: true
- stableIdsRequired: true
- noImplicitScope: true

## Scope

- 新增一个共享的第三方轮询决策模型和分类器，放在 `axon-common` 的 `support` 包内。
- 让 8010 JSON 队列和 8040 批改队列都通过同一个分类器判断 success / retryable / terminal。
- 保留现有配置键和重试上限语义，不新增数据库结构、不改 Controller 入参、不改前端契约。
- 清理当前分散在 service 和 scheduler 中的重复判断逻辑，只保留薄适配层。
- 补齐覆盖矩阵测试，确保 404、400、408、429、5xx、空体、成功态都不会回退到旧行为。

## Readiness

- Goal: 把当前“能工作但有重复”的队列判定，收敛成一套共享、可测、可回滚的轮询决策层。
- Acceptance criteria:
  - 8010 404 不再重复轮询，直接终态失败。
  - 8040 404 不再重复轮询，直接终态失败。
  - 400 等明确的非重试型错误不会被当作瞬时失败继续打点。
  - 5xx / 408 / 429 / 连接失败仍按现有上限退避重试。
  - `getOmrTaskStatus` / `getTaskStatus` 的对外异常语义保持不变。
- Non-goals:
  - 不引入 MQ、Redis 队列或新的调度中间件。
  - 不做数据库迁移，不改 flow / snapshot 表结构。
  - 不把轮询决策暴露给 Controller 或前端。
  - 不把批改结果本地化。
- Affected areas:
  - `axon-common` 的 `support`、`service/exam/impl`、`vo/exam`、单元测试。
  - `axon-chat` 的两个 `@Scheduled` 队列任务和对应测试。
- Validation surface:
  - 单元测试的状态矩阵。
  - 定向 Maven 测试。
  - 编译验证。
  - 复现场景下的日志回归检查。
- Open questions:
  - 无外部开放问题；本计划直接选择“共享决策模型 + 轻适配层”的实现方式。

## Assumptions

- 当前工作区里已有的止血修复会保留为行为基线，后续计划是在不回退语义的前提下做结构收敛。
- `400` 这类明确的非重试型状态在两个队列里都应终态失败，`408 / 429 / 5xx` 才属于可重试瞬时失败。
- `maxTransientPollRetries` 与 `maxTransientRetries` 的队列级配置继续保留，不统一成单一全局重试阈值。
- 新增的共享对象只服务于后台队列，不改变公共查询 API 的返回类型。
- 现有日志格式可以做轻微收敛，但不能丢失 `schoolId / examId / gradingId / jobId / httpStatus` 这些排查要素。

## Alternatives Considered

- Recommended: 新增共享 `PollDecision` 模型和分类器，8010 / 8040 都走同一套内部决策。
- Alternative: 继续保留 queue-local 分支，只加更多单测。
- Rejected because: 规则会继续散落在两个调度器和一个 service 里，后续第三方语义变化时仍会漂移。
- Alternative: 直接把逻辑塞进现有 `ExamRecognitionTaskStatusResolver`，不再新增类型。
- Rejected because: 该类已经承担 task 状态语义，继续叠加队列策略会让职责变宽，后面更难保持清晰边界。
- Alternative: 抽成更重的状态机或框架级策略引擎。
- Rejected because: 现阶段问题是规则重复，不是抽象能力不足；更重的设计会扩大改动面和验证成本。

## Decision Drivers

- Driver 1: 8010 与 8040 必须共享同一套终态 / 瞬时失败判定。
- Driver 2: 变更要尽量局限在 `axon-common` 的 support 层和两个 scheduler 适配层。
- Driver 3: 回滚要简单，最好只需要回退一个 classifier 和两个调用点。

## Decisions

### ADR-1 - 用共享决策模型取代 queue-local 分支

- Decision: 新增 `ExamThirdPartyPollDecision` 和 `ExamThirdPartyPollDecisionResolver` 作为共享内部层，8010 / 8040 都只消费决策结果。
- Drivers: 减少规则漂移、统一日志语义、降低后续第三方状态码变化的维护成本。
- Alternatives: 继续在两个队列里分别写 `if/else`；把全部逻辑堆进现有 resolver。
- Why chosen: 决策层与调度层分离后，测试可以直接覆盖“状态码 -> 决策 -> 动作”的矩阵，不需要重复跑完整队列路径才能验证规则。
- Consequences: 需要调整 `ExamGenericGradingServiceImpl` 的内部返回结构或新增内部 helper；两个 scheduler 会变成薄适配层。
- Follow-ups: 如果未来第三方再加新的终态文案，只改 classifier，不再散改两个队列。

## Risks

- 共享决策模型如果定义过宽，可能把本来只属于 8010 的判断规则带到 8040，或反过来。
- 如果把 `ExamRecognitionTaskStatusResolver` 继续当成“万能工具类”，虽然能少建文件，但职责会越来越宽。
- 如果两个队列没有共同的决策矩阵测试，后续仍可能出现 8010 与 8040 行为不一致。
- 如果决策对象的字段过多，scheduler 会退化成“把对象拆回 if/else”的旧形态。

## Pre-Mortem

- Failure scenario 1: 404 被分类器错误地判成 retryable，日志和第三方请求继续刷屏。
- Failure scenario 2: 400 被误判成 transient，队列开始无限重试明确的非重试型错误。
- Failure scenario 3: 只改了内部 classifier，`getOmrTaskStatus` / `getTaskStatus` 的外部语义被顺手改坏。
- Mitigations: 先补共享 classifier 的矩阵测试，再改两个队列；公共查询 API 仅复用已有 `requireSuccess` 路径，不接入决策对象。

## Implementation Units

### U1 - 新增共享轮询决策模型和分类器

- Goal: 把“状态码 + 响应文案 -> 终态 / 瞬时失败 / 成功”的规则集中到一处。
- Requirements covered: SR1, SR2, SR3, SR4.
- Acceptance criteria covered: 8010/8040 统一判定、对外查询语义不变。
- Depends on: none
- Files:
  - `axon-common/src/main/java/com/xinxi/axon/common/service/exam/support/ExamThirdPartyPollDecision.java`
  - `axon-common/src/main/java/com/xinxi/axon/common/service/exam/support/ExamThirdPartyPollDecisionResolver.java`
  - `axon-common/src/main/java/com/xinxi/axon/common/service/exam/support/ExamRecognitionTaskStatusResolver.java`
  - `axon-common/src/test/java/com/xinxi/axon/common/service/exam/support/ExamThirdPartyPollDecisionResolverTest.java`
  - `axon-common/src/test/java/com/xinxi/axon/common/service/exam/support/ExamRecognitionTaskStatusResolverTest.java`
- Forbidden files:
  - `axon-chat/src/main/java/com/xinxi/chatservice/scheduled/ExamGenericGradingJsonQueueTask.java`
  - `axon-chat/src/main/java/com/xinxi/chatservice/scheduled/ExamGenericGradingTaskQueueTask.java`
- Approach:
  - 用一个轻量 `decision` 对象承载动作结果，例如 `SUCCESS / RETRYABLE / TERMINAL`，并附带终态原因和可日志化 detail。
  - 把 404、No such job、任务不存在、已过期、4xx、5xx、408、429 的规则收敛到 resolver。
  - `ExamRecognitionTaskStatusResolver` 保留 task 状态归一与文本判定基础能力，决策层负责把这些判断拼成最终动作。
- Tests:
  - 404 / No such job / 任务不存在 / 已过期 -> terminal。
  - 400 -> terminal non-retriable。
  - 408 / 429 / 5xx / 连接失败 -> retryable。
  - 成功态 -> success。
  - 空 body、空 message、null httpStatus -> 行为明确且可预期。
- Validation:
  - `mvn -pl axon-common -Dtest=ExamThirdPartyPollDecisionResolverTest,ExamRecognitionTaskStatusResolverTest test`
- Rollback signals:
  - 分类器单测的状态矩阵出现反向分类。
- Deferred to implementation:
  - `PollDecision` 具体用 `enum + record` 还是 `sealed interface`，以代码可读性优先，不提前锁死实现形态。

### U2 - 让 8010 JSON 队列消费共享决策

- Goal: 消除 `advanceJsonAggregateFromQueue` 和 JSON scheduler 中的重复判定分支。
- Requirements covered: SR1, SR2, SR3, SR4.
- Acceptance criteria covered: 8010 404 立即失败、瞬时失败按上限重试。
- Depends on: U1
- Files:
  - `axon-common/src/main/java/com/xinxi/axon/common/service/exam/impl/ExamGenericGradingServiceImpl.java`
  - `axon-common/src/main/java/com/xinxi/axon/common/service/exam/ExamGenericGradingJsonGenerationSnapshotService.java`
  - `axon-common/src/main/java/com/xinxi/axon/common/service/exam/impl/ExamGenericGradingJsonGenerationSnapshotServiceImpl.java`
  - `axon-chat/src/main/java/com/xinxi/chatservice/scheduled/ExamGenericGradingJsonQueueTask.java`
  - `axon-common/src/test/java/com/xinxi/axon/common/service/exam/impl/ExamGenericGradingServiceImplTest.java`
- Forbidden files:
  - `axon-chat/src/main/java/com/xinxi/chatservice/scheduled/ExamGenericGradingTaskQueueTask.java`
- Approach:
  - `pollOmrJsonFromQueue` 只负责拿到第三方响应并把它交给共享 classifier。
  - `handleTransientOmrPollFailure` 只执行 classifier 的动作，不再自己判断 404 / 400 / 5xx。
  - 保留 `poll_retry_count`、`mark*Failed`、`resetPollRetryCount`、`releaseProcessing` 的既有语义。
- Tests:
  - 404 -> snapshot FAILED。
  - 400 -> snapshot FAILED。
  - 5xx / 超时 -> `poll_retry_count` 增加，未超限继续 release。
  - 成功后 `poll_retry_count` 清零。
- Validation:
  - `mvn -pl axon-common -Dtest=ExamGenericGradingServiceImplTest test`
- Rollback signals:
  - 8010 仍然对同一 jobId 重复请求。
  - 成功路径意外不再清零 retry 计数。
- Deferred to implementation:
  - 若日志过长，再决定是否把 `detail` 和 `rawBody` 拆开输出，避免污染终态日志。

### U3 - 让 8040 批改队列消费共享决策

- Goal: 消除 `pollTaskStatusFromQueue` 和批改 scheduler 中的重复判定分支。
- Requirements covered: SR1, SR2, SR3, SR4.
- Acceptance criteria covered: 8040 404 立即失败、瞬时失败按上限重试。
- Depends on: U1, U2
- Files:
  - `axon-common/src/main/java/com/xinxi/axon/common/service/exam/impl/ExamGenericGradingServiceImpl.java`
  - `axon-chat/src/main/java/com/xinxi/chatservice/scheduled/ExamGenericGradingTaskQueueTask.java`
  - `axon-chat/src/test/java/com/xinxi/chatservice/scheduled/ExamGenericGradingTaskQueueTaskTest.java`
- Forbidden files:
  - `axon-chat/src/main/java/com/xinxi/chatservice/scheduled/ExamGenericGradingJsonQueueTask.java`
- Approach:
  - 队列任务只消费 classifier 的动作，不再自己判断 `404` 或 `non-retriable status`。
  - 保持 `notFoundFailFast` 与 `maxTransientRetries` 的现有配置语义。
  - 公共 `getTaskStatus` 继续走原有查询语义，不接入队列 classifier。
- Tests:
  - 404 -> `GRADING_FAILED`。
  - 400 -> `GRADING_FAILED`，不走 retryLater。
  - 5xx / timeout / connection failure -> 按 retry 上限退避。
  - completed / failed / running 的状态映射不变。
- Validation:
  - `mvn -pl axon-chat -am -Dtest=ExamGenericGradingTaskQueueTaskTest test`
- Rollback signals:
  - 8040 仍然对 404 持续轮询。
  - 公共 `getTaskStatus` 返回行为发生变化。
- Deferred to implementation:
  - 若后续要把 429 细分成限流告警，可在 classifier 中再加终态原因，不改调度器。

### U4 - 更新设计说明、接口说明和回归说明

- Goal: 让后续维护者知道“规则只在一处”，避免再长出第二套判定。
- Requirements covered: SR1, SR2, SR3, SR4.
- Acceptance criteria covered: 文档口径与代码实现一致。
- Depends on: U2, U3
- Files:
  - `docs/02-design/exam-generic-grading-404-poll-optimization.md`
  - `docs/04-api/exam-generic-grading-poll-fail-fast.md`
  - `docs/08-ai-memory/02-architecture-boundaries.md` 视是否形成稳定长期知识再决定
- Forbidden files:
  - 仓库根目录其他说明文档
- Approach:
  - 在设计文档里把“共享 classifier + 轻适配层”写成下一阶段目标，而不是继续把规则散落在两个队列里。
  - 在接口说明里明确：公共查询 API 保持原语义，后台队列才使用共享决策对象。
  - 若本轮执行后形成稳定长期约束，再补 AI 记忆。
- Tests:
  - 文档无需单元测试，但需要路径和术语一致性检查。
- Validation:
  - `rg -n "PollDecision|classifier|404 fail-fast|non-retriable" docs/02-design docs/04-api`
- Rollback signals:
  - 文档与代码行为不一致，导致下次维护继续复制判断逻辑。
- Deferred to implementation:
  - 是否新增独立 `docs/04-api` 小文档，按执行时是否需要前端/联调直接查看决定。

## Consistency Check

- implementationUnitCount: 4
- sourceRequirementsCovered: 4
- sourceRequirementsDeferred: 0
- openQuestionsCount: 0

## Validation Plan

- Unit:
  - `mvn -pl axon-common -Dtest=ExamThirdPartyPollDecisionResolverTest,ExamRecognitionTaskStatusResolverTest test`
  - `mvn -pl axon-common -Dtest=ExamGenericGradingServiceImplTest test`
  - `mvn -pl axon-chat -am -Dtest=ExamGenericGradingTaskQueueTaskTest test`
- Integration:
  - `mvn -pl axon-chat -am -DskipTests compile`
  - 如需要更宽验证，再跑 `mvn -pl axon-common,axon-chat test`
- User flow:
  - 用测试环境复现一次 8010 404 和一次 8040 404，确认每个任务只产生一次终态失败日志，不再反复轮询。
- Data / operations:
  - 无数据库迁移、无回填、无删除。
- Observability:
  - 终态失败应只打一条 WARN，且日志里保留 `schoolId / examId / gradingId / jobId / httpStatus / reason`。

## Rollback / Recovery

- 如果 classifier 误判，直接回退到当前 queue-local 分支版本即可，数据库和接口都不需要回滚。
- 如果只在 8010 或 8040 其中一侧出现偏差，先回退该侧适配层，保留另一侧已验证的共享 classifier。
- 因为本计划不改 schema、不改公共 API，回滚边界只在 `axon-common` / `axon-chat` 代码层。

## Plan Self-Review

- Placeholder scan: 无 `TBD` / `TODO` / 空洞描述。
- Consistency check: 共享 classifier、队列适配层、测试和文档的口径一致。
- Scope check: 未扩大到 MQ、数据库、前端或公共 API contract 变更。
- Acceptance coverage: SR1-SR4 都映射到至少一个实施单元和验证命令。
- Validation gaps: 仍需要测试环境里复现一次真实 404 终态，以确认日志不再重复。
- Alternatives and ADR check: 已记录 inline branching、过度抽象和万能 resolver 三类备选。
- High-risk pre-mortem check: 已覆盖误判终态、误判重试、误改公共查询语义三种主要失败模式。

## Handoff

- 推荐执行顺序：U1 -> U2 -> U3 -> U4。
- 若要继续落地实现，先对本计划做一次 `ae-review domain:document`，再进入 `ae-work`。
