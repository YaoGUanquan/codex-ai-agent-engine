---
type: plan
status: drafted
date: 2026-06-22
title: exam-list-frontend-stage
origin: user-request
---

# Plan: exam-list-frontend-stage

## Source

用户要求优化 `api/v1/exam/list` 返回 VO 中用于前端流程判断的字段。

已确认的产品语义：

- 前端不关心后端“第一步基础考试信息入库”。
- 对前端而言，文件 OSS 登记和后台自动化执行属于同一个节点。
- 后台自动化执行包括排队中、开始执行、执行完成；完成后前端可以跳转到规则/展示页面。
- 规则确认后进入批改节点，批改节点需要返回执行中、完成、失败等状态说明。
- 本次只新增：
  - `frontendStage`
  - `frontendStageName`
  - `frontendStageDescription`
- 继续复用现有 `canContinue` 表达前端当前是否可继续操作。
- 相关前端状态需要封装为枚举，避免字符串散落。

## Scope

### In Scope

- 为通用批改流程增加前端节点枚举。
- 在 `ExamListItemVO` 增加 3 个字段。
- 在 `ExamGenericGradingFlowStateVO` 增加 3 个字段。
- 根据 `ExamGenericGradingFlowStatusEnum` 映射前端节点、节点名称、说明文案和 `canContinue`。
- 让 `api/v1/exam/list` 返回新增字段。
- 保持现有 `thirdPartyTaskStatus`、`canContinue`、`nextAction` 兼容返回。

### Out of Scope

- 不改数据库表结构。
- 不改接口路径、分页结构、权限逻辑。
- 不删除 `thirdPartyTaskStatus`、`canContinue`、`nextAction`。
- 不新增 `targetPage`、`primaryAction` 等字段。
- 不改第三方任务提交、轮询、队列执行逻辑。

## Readiness

- Goal: `api/v1/exam/list` 返回稳定的前端流程节点字段，使前端可基于节点、节点说明和 `canContinue` 判断展示与跳转。
- Acceptance criteria:
  - 列表项新增 `frontendStage`、`frontendStageName`、`frontendStageDescription`。
  - 详情流程快照 `ExamGenericGradingFlowStateVO` 同步具备相同字段，避免列表和详情语义漂移。
  - 前端节点相关固定值由枚举集中维护。
  - 所有现有本地流程状态都有明确映射。
  - 原有字段兼容保留。
- Non-goals: 不调整后台状态机，不改变任务执行行为。
- Affected areas:
  - `axon-common/src/main/java/com/xinxi/axon/common/enums/exam`
  - `axon-common/src/main/java/com/xinxi/axon/common/vo/exam`
  - `axon-common/src/main/java/com/xinxi/axon/common/service/exam/impl/ExamInfoServiceImpl.java`
- Validation surface:
  - 编译验证。
  - 单元测试或现有路由测试。
  - 字段映射快照检查。
- Open questions:
  - 无。`frontendStage` 本轮固定使用 `FILE_REGISTRATION` 和 `GRADING` 两个编码。

## Assumptions

- 前端只需要两个大节点：
  - `FILE_REGISTRATION`: 文件登记与后台规则生成。
  - `GRADING`: 执行批改。
- `canContinue = true` 表示前端可主动进行下一步、进入页面、提交、重试或查看结果。
- `canContinue = false` 表示后台或第三方执行中，前端应等待或轮询。
- `nextAction` 继续保留旧语义，作为兼容字段，不作为本次新设计的主字段。
- 代码核实结果：`GRADING_PENDING_SUBMIT` 由 `registerGradingPending(...)` 写入，语义是“已登记批改任务待提交，由后台队列限流提交第三方”，不是前端可再次提交状态。

## Alternatives Considered

- Recommended: 新增 `ExamGenericGradingFrontendStageEnum`，集中维护前端节点编码和中文名；说明文案由状态映射方法生成。
- Alternative: 直接在 `ExamGenericGradingFlowStateVO` 中用 `switch` 返回字符串。
- Rejected because: 直接写字符串会让节点编码、节点名、文案散落在 VO 中，后续 Sonar 和维护风险更高。

- Alternative: 新增嵌套对象 `frontendFlow`，把 3 个字段和 `canContinue` 包在一起。
- Rejected because: 当前需求只要求列表 VO 字段增强，新增对象会改变前端取值路径，兼容成本更高。

## Decision Drivers

- Driver 1: API 兼容性优先，避免破坏现有前端字段。
- Driver 2: 前端节点语义必须和后端内部状态解耦。
- Driver 3: 固定字符串要枚举化，符合项目 Sonar 和阿里 Java 手册约束。

## Decisions

### ADR-1 - 用枚举封装前端节点

- Decision: 新增 `ExamGenericGradingFrontendStageEnum`，本轮固定包含 `FILE_REGISTRATION` 和 `GRADING`。
- Drivers: 避免硬编码，集中维护节点编码和中文名。
- Alternatives: 在 VO 私有方法中写字符串常量。
- Why chosen: 枚举更适合固定状态集合，并且与现有 `ExamGenericGradingFlowStatusEnum` 风格一致。
- Consequences: 新增一个枚举文件，但后续新增前端节点时维护点清晰。
- Follow-ups: 若未来需要前端动作码，可再新增独立枚举，不复用本次节点枚举。

### ADR-2 - 说明文案按后端流程状态映射

- Decision: `frontendStageDescription` 由 `ExamGenericGradingFlowStatusEnum` 映射生成。
- Drivers: 同一个前端节点下有排队、执行、完成、失败等不同展示文案。
- Alternatives: 只返回节点名称，由前端自行翻译。
- Why chosen: 用户明确要求返回对应文字说明，后端已有完整状态上下文。
- Consequences: 中文文案变成 API 契约的一部分，修改需考虑前端展示。
- Follow-ups: 若后续做国际化，可新增描述码而不是替换当前字段。

### ADR-3 - 复用 canContinue，不新增动作字段

- Decision: 本次不新增 `targetPage`、`primaryAction`，继续用 `canContinue` 控制前端是否可继续操作。
- Drivers: 用户已确认 3 个新字段配合 `canContinue` 可以达到预期。
- Alternatives: 增加 `targetPage`、`primaryAction`。
- Why chosen: 当前范围更小，兼容风险更低。
- Consequences: 前端仍需要结合 `frontendStage` 和 `genericGradingStatus`/`nextAction` 判断具体按钮文案或页面路由。
- Follow-ups: 如果前端后续希望完全后端驱动跳转，再单独扩展动作字段。

## Risks

- `canContinue` 旧逻辑当前未包含 `GRADING_COMPLETED`，如果完成后前端需要“查看结果”，本次应把 `GRADING_COMPLETED` 加入可继续状态。
- `GRADING_PENDING_SUBMIT` 是后台提交队列等待态，不应被前端当作可再次点击提交状态；本次应保持 `canContinue = false`。
- 列表和详情如果分别写映射，后续会漂移；必须在 `ExamGenericGradingFlowStateVO` 中统一生成，再由列表复用。
- 中文说明文案应简短稳定，避免携带后台实现细节。

## Pre-Mortem

- Failure scenario 1: 某个 `ExamGenericGradingFlowStatusEnum` 未映射，导致新字段为空。
- Failure scenario 2: `canContinue` 仍沿用旧集合，导致批改完成后前端不能进入结果页面。
- Failure scenario 3: `GRADING_PENDING_SUBMIT` 被误判为可前端继续操作，导致重复提交批改任务。
- Failure scenario 4: 列表 VO 加字段但 `applyGenericGradingFlow` 未赋值，接口实际返回为空。
- Mitigations:
  - 使用 switch expression 覆盖所有 enum 分支。
  - 更新并集中维护可继续状态集合。
  - 将 `RULE_CONFIRMED` 和 `GRADING_PENDING_SUBMIT` 拆开映射：前者可提交，后者等待后台队列。
  - 增加针对 `ExamGenericGradingFlowStateVO.empty/from` 的映射测试，或至少执行编译和接口返回字段检查。

## Implementation Units

### U1 - 新增前端节点枚举

- Goal: 集中封装前端流程节点编码和中文名。
- Requirements covered:
  - 相关状态封装为枚举。
  - 避免固定字符串散落。
- Acceptance criteria covered:
  - 新增枚举包含 `FILE_REGISTRATION` 和 `GRADING`。
  - 枚举提供 `getCode()`、`getDisplayName()` 或直接使用 `name()` + `getDisplayName()`。
- Depends on: none
- Files:
  - `axon-common/src/main/java/com/xinxi/axon/common/enums/exam/ExamGenericGradingFrontendStageEnum.java`
- Forbidden files:
  - 数据库迁移文件
  - Controller 路由文件
- Approach:
  - 新建枚举：
    - `FILE_REGISTRATION("文件登记与规则生成")`
    - `GRADING("执行批改")`
  - 保持包路径与 `ExamGenericGradingFlowStatusEnum` 同级。
- Tests:
  - 编译验证枚举可被 VO 引用。
- Validation:
  - `mvn -pl axon-common -am test -DskipTests`
- Rollback signals:
  - 枚举命名与已有类冲突。
  - 编译失败。
- Deferred to implementation:
  - 是否提供 `getCode()` 由现有枚举风格决定；若前端直接使用枚举名，优先用 `name()`。

### U2 - 扩展列表和详情 VO 字段

- Goal: 在列表项和流程快照中增加前端节点字段。
- Requirements covered:
  - `api/v1/exam/list` 返回 `frontendStage`、`frontendStageName`、`frontendStageDescription`。
  - 详情流程快照字段口径一致。
- Acceptance criteria covered:
  - `ExamListItemVO` 新增 3 个字段并带 `@Schema`。
  - `ExamGenericGradingFlowStateVO` 新增 3 个字段并带 `@Schema`。
- Depends on: U1
- Files:
  - `axon-common/src/main/java/com/xinxi/axon/common/vo/exam/ExamListItemVO.java`
  - `axon-common/src/main/java/com/xinxi/axon/common/vo/exam/ExamGenericGradingFlowStateVO.java`
- Forbidden files:
  - Controller 路由文件
  - Mapper XML
  - 数据库迁移文件
- Approach:
  - 在 `thirdPartyTaskStatus` 与 `canContinue` 附近新增字段，保持字段语义集中。
  - Schema 描述：
    - `frontendStage`: `前端流程节点：FILE_REGISTRATION-文件登记与规则生成，GRADING-执行批改`
    - `frontendStageName`: `前端流程节点中文名`
    - `frontendStageDescription`: `当前节点说明文案`
- Tests:
  - 编译验证 Lombok getter/setter 生成正常。
- Validation:
  - `mvn -pl axon-common -am test -DskipTests`
- Rollback signals:
  - OpenAPI 生成或序列化出现字段冲突。
- Deferred to implementation:
  - 不引入嵌套 VO。

### U3 - 统一状态到前端节点映射

- Goal: 在 `ExamGenericGradingFlowStateVO` 中统一计算前端节点字段和 `canContinue`。
- Requirements covered:
  - 所有本地流程状态都有前端节点和说明文案。
  - `canContinue` 与前端可操作语义一致。
- Acceptance criteria covered:
  - `empty(...)` 返回 `BASIC_CREATED` 的前端节点字段。
  - `from(...)` 返回所有状态对应的前端节点字段。
  - `USER_CONTINUE_STATUSES` 覆盖 `BASIC_CREATED`、`MANIFEST_READY`、`RULE_CONFIRMED`、`GRADING_COMPLETED`、`JSON_FAILED`、`MANIFEST_FAILED`、`GRADING_FAILED`、`GRADING_TIMEOUT`。
  - `GRADING_PENDING_SUBMIT` 不进入 `USER_CONTINUE_STATUSES`，返回 `canContinue=false`。
- Depends on: U1, U2
- Files:
  - `axon-common/src/main/java/com/xinxi/axon/common/vo/exam/ExamGenericGradingFlowStateVO.java`
- Forbidden files:
  - 后台任务执行 Service
  - 第三方客户端
  - 数据库迁移文件
- Approach:
  - 增加私有方法：
    - `resolveFrontendStage(status)`
    - `resolveFrontendStageName(status)`
    - `resolveFrontendStageDescription(status)`
    - `canContinue(status)` 或维护更新后的 `USER_CONTINUE_STATUSES`
  - 推荐映射：
    - `BASIC_CREATED` -> `FILE_REGISTRATION`, `请完成 OSS 文件登记`, `true`
    - `RAW_DATA_REGISTERED`, `JSON_PENDING`, `JSON_STARTING`, `JSON_GENERATING` -> `FILE_REGISTRATION`, `文件已登记，后台正在生成批改所需 JSON`, `false`
    - `JSON_READY`, `MANIFEST_PENDING_REGISTER`, `MANIFEST_REGISTERING` -> `FILE_REGISTRATION`, `批改规则正在生成，请稍后`, `false`
    - `MANIFEST_READY` -> `FILE_REGISTRATION`, `批改规则已生成，可以进入规则展示页面`, `true`
    - `JSON_FAILED`, `MANIFEST_FAILED` -> `FILE_REGISTRATION`, `资料处理失败，请重试`, `true`
    - `RULE_CONFIRMED` -> `GRADING`, `规则已确认，可以提交批改`, `true`
    - `GRADING_PENDING_SUBMIT` -> `GRADING`, `批改任务已进入后台提交队列，请等待`, `false`
    - `GRADING_SUBMITTING`, `GRADING_RUNNING` -> `GRADING`, `批改任务执行中，请等待`, `false`
    - `GRADING_COMPLETED` -> `GRADING`, `批改完成，可以查看结果`, `true`
    - `GRADING_FAILED`, `GRADING_TIMEOUT` -> `GRADING`, `批改失败或超时，可以重新提交`, `true`
- Tests:
  - 可新增或补充 VO 映射单元测试，至少覆盖：
    - `BASIC_CREATED`
    - `JSON_GENERATING`
    - `MANIFEST_READY`
    - `GRADING_PENDING_SUBMIT`
    - `RULE_CONFIRMED`
    - `GRADING_RUNNING`
    - `GRADING_COMPLETED`
    - `GRADING_FAILED`
- Validation:
  - `mvn -pl axon-common -am test`
- Rollback signals:
  - 某状态 `canContinue` 与前端确认语义不一致。
  - 现有测试断言旧 `canContinue` 行为并失败。
- Deferred to implementation:
  - 如果当前测试环境过慢，可先运行目标测试和编译，再按需全量验证。

### U4 - 列表接口装配新增字段

- Goal: 让 `api/v1/exam/list` 的 `ExamListItemVO` 返回新增字段。
- Requirements covered:
  - 列表接口可直接消费前端节点字段。
- Acceptance criteria covered:
  - `ExamInfoServiceImpl.applyGenericGradingFlow(...)` 将 `flow.frontendStage`、`flow.frontendStageName`、`flow.frontendStageDescription` 复制到列表项。
  - 无流程记录时，`ExamGenericGradingFlowStateVO.empty(...)` 也能提供默认字段。
- Depends on: U2, U3
- Files:
  - `axon-common/src/main/java/com/xinxi/axon/common/service/exam/impl/ExamInfoServiceImpl.java`
- Forbidden files:
  - Controller 路由文件
  - Mapper XML
  - 数据库迁移文件
- Approach:
  - 在现有 `applyGenericGradingFlow` 中增加 3 行 setter。
  - 不改变查询逻辑和分页逻辑。
- Tests:
  - 如已有列表服务测试，补充字段断言。
  - 若仅有路由测试，不强行扩大为集成测试。
- Validation:
  - `mvn -pl axon-common -am test`
  - `mvn -pl axon-chat -am test -Dtest=ExamInfoControllerRouteTest`
- Rollback signals:
  - 列表接口出现空字段。
  - 路由测试或 Spring 上下文失败。
- Deferred to implementation:
  - 是否补充 Controller 层 JSON 字段断言取决于现有测试夹具成本。

### U5 - 文档和兼容说明

- Goal: 记录新字段语义，避免前后端对节点含义误读。
- Requirements covered:
  - 字段契约明确。
  - 保留旧字段兼容说明。
- Acceptance criteria covered:
  - Swagger `@Schema` 描述清楚。
  - 最终交付说明包含字段映射和验证命令。
- Depends on: U2, U3, U4
- Files:
  - `axon-common/src/main/java/com/xinxi/axon/common/vo/exam/ExamListItemVO.java`
  - `axon-common/src/main/java/com/xinxi/axon/common/vo/exam/ExamGenericGradingFlowStateVO.java`
- Forbidden files:
  - 无关业务文档
- Approach:
  - 不单独新增接口文档，优先通过 VO Schema 表达契约。
  - 最终说明中列出 `nextAction` 保留兼容、前端新逻辑优先看 `frontendStage + canContinue`。
- Tests:
  - 人工检查字段描述。
- Validation:
  - 文件检查。
- Rollback signals:
  - 字段说明与实际映射不一致。
- Deferred to implementation:
  - 如用户需要，可后续补充 `docs/04-api` 接口说明。

## Validation Plan

- Unit:
  - 优先为 `ExamGenericGradingFlowStateVO` 的状态映射增加测试。
- Integration:
  - 执行 `mvn -pl axon-common -am test`。
  - 执行 `mvn -pl axon-chat -am test -Dtest=ExamInfoControllerRouteTest`。
- User flow:
  - 检查 `api/v1/exam/list` 返回记录中存在：
    - `frontendStage`
    - `frontendStageName`
    - `frontendStageDescription`
    - `canContinue`
- Data / operations:
  - 无数据库变更，无数据修复。
- Observability:
  - 不新增日志。

## Rollback / Recovery

- 回滚新增枚举文件。
- 从 `ExamListItemVO` 和 `ExamGenericGradingFlowStateVO` 移除新增字段。
- 从 `ExamInfoServiceImpl.applyGenericGradingFlow(...)` 移除新增 setter。
- 保留原有 `thirdPartyTaskStatus`、`canContinue`、`nextAction` 后，旧前端行为可恢复。

## Plan Self-Review

- Placeholder scan: 未保留 TBD/TODO/占位步骤。
- Consistency check: 字段范围与用户确认一致，只新增 3 个字段并复用 `canContinue`；`GRADING_PENDING_SUBMIT` 已按后台队列等待态处理。
- Scope check: 不涉及数据库、接口路径、任务执行逻辑。
- Acceptance coverage: 每个验收点均映射到 U1-U5。
- Validation gaps: 真实接口冒烟需要服务运行和 token；本计划仅要求代码侧编译/测试，接口冒烟可在用户确认后按项目规则继续。
- Alternatives and ADR check: 已记录枚举、嵌套对象、动作字段的取舍；`FILE_REGISTRATION` 编码已固定为本轮决策。
- High-risk pre-mortem check: 已覆盖状态漏映射、`canContinue` 语义偏差、列表未赋值三类主要风险。

## Handoff

确认本方案后，进入代码修改阶段。建议按 U1 -> U2 -> U3 -> U4 -> U5 顺序执行，完成后运行验证命令并汇报结果。
