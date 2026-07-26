---
type: plan
status: drafted
date: 2026-07-06
title: exam-93-assignment-trigger-replay
depth: standard
format: human-readable-plan
sharded: false
---

# Exam 93 Assignment Trigger Replay Plan

## AI Parse Contract
- canonicalKind: plan
- humanEquivalent: true
- stableIdsRequired: true
- noImplicitScope: true

## Goal

对 `examId=93` 执行最稳恢复方案：在已修复 generic timeout 误判逻辑的前提下，使用业务入口重放 `create-from-manifest`，补建 assignment manifest / assignment grading / downstream analysis queue，而不是直接靠 SQL 改终态。

## Scope

- 包含：
  - 确认运行环境已具备 generic heartbeat-timeout 修复的恢复前提
  - 通过 `POST /api/v1/exam-assignment-grading/external/create-from-manifest` 重放 `manifest_id=gg-1-93`
  - 校验 `exam_assignment_grading_external_manifest_queue` 是否生成
  - 准备 SQL 兜底校验与必要时的恢复建议
- 不包含：
  - 再次修改生产/测试业务代码
  - 直接用 SQL 伪造 downstream 成功状态
  - 未经确认直接删除/覆盖历史第三方任务

## Known Facts

- `exam_generic_grading_flow_state.exam_id=93` 当前已到 `GRADING_COMPLETED`
- 上游 `exam_generic_grading_assignment_trigger_queue.id=3` 已在 `2026-07-06 09:09:55` 进入 `SKIPPED`
- `SKIPPED` 为终态，自动调度不会再补跑 assignment trigger
- 公开入口 `POST /api/v1/exam-assignment-grading/external/create-from-manifest` 仅要求 `manifest_id`
- 当 `generic-grading.assignment-trigger.enabled=true` 时，公开入口会收紧为要求 generic flow 已经 `GRADING_COMPLETED`
- 当前仓库配置中 `generic-grading.assignment-trigger.enabled=true`

## Decision

### Chosen Approach

优先走业务重放接口，而不是先改 SQL。

### Decision Drivers

1. 业务入口具备现成的幂等/partial-success-resume 语义，风险低于手改多张队列表。
2. 当前 `exam 93` 的根因不是 downstream queue 处理器故障，而是 upstream trigger 被误终止。
3. 直接 SQL 改终态容易绕过 `create-from-manifest` 内部的 manifest/task 复用、队列登记和一致性校验。

### Rejected Alternatives

- 方案 A：直接把 upstream `SKIPPED` 改回 `WAITING_GRADING_COMPLETED`
  - 风险：依赖 scheduler 再消费，恢复路径更长，且仍需依赖运行时版本与锁/轮询节奏。
- 方案 B：直接插入/修改 `exam_assignment_grading_external_manifest_queue`
  - 风险：绕过 create-from-manifest 的 assignment manifest/task 创建与 resume 逻辑，最不稳。

## Validation Contract

- 业务重放接口返回成功，且响应中带有 `manifest.manifestId` 和 `gradingTask.gradingId`
- `exam_assignment_grading_external_manifest_queue` 生成 `exam_id=93` 的有效记录
- 如有需要，继续看到该队列后续状态从初始态向 `essay_grading` / `generic_results` / `analysis` 推进

## Implementation Units

### U1. 确认恢复前提
- Depends on: none
- Requirement IDs covered: inline-goal
- Acceptance criteria covered:
  - 运行环境对 `exam 93` 不再继续误写 `GRADING_TIMEOUT`
  - 公开重放入口满足 `GRADING_COMPLETED` 前提
- Files:
  - `axon-chat/src/main/resources/application.yml`
  - `docs/00-process/archive/2026-07/generic-grading-timeout-heartbeat/progress.md`
- Forbidden files:
  - `axon-common/src/main/java/**`
  - `axon-chat/src/main/java/**`
- Validation:
  - 检查配置 `generic-grading.assignment-trigger.enabled=true`
  - 复核 `exam 93` 当前 generic flow 为 `GRADING_COMPLETED`
- Rollback signals:
  - 若当前环境仍会把运行中任务误写 `GRADING_TIMEOUT`，暂停业务重放
- Deferred implementation notes:
  - 环境发布/重启由用户本地完成

### U2. 通过公开接口重放 assignment trigger
- Depends on: U1
- Requirement IDs covered: inline-goal
- Acceptance criteria covered:
  - 成功执行 `POST /api/v1/exam-assignment-grading/external/create-from-manifest`
  - 返回 assignment manifest / grading ids
- Files:
  - `docs/04-api/2026-06-29-external-manifest-assignment-grading-api.md`
  - `axon-chat/src/main/java/com/xinxi/chatservice/controller/exam/ExamAssignmentGradingController.java`
  - `axon-common/src/main/java/com/xinxi/axon/common/service/exam/impl/ExamAssignmentGradingServiceImpl.java`
- Forbidden files:
  - `docs/06-sql/**` 之外的 SQL 文件
- Validation:
  - `POST /api/v1/exam-assignment-grading/external/create-from-manifest`
  - 请求体：`{"manifest_id":"gg-1-93"}`
- Rollback signals:
  - 若接口返回 4xx/5xx 或业务异常，停止继续下游判断，转入日志/SQL复核
- Deferred implementation notes:
  - 若接口失败，不直接手改 downstream queue

### U3. 校验 downstream queue 与准备兜底
- Depends on: U2
- Requirement IDs covered: inline-goal
- Acceptance criteria covered:
  - `exam_assignment_grading_external_manifest_queue` 出现 `exam_id=93` 记录
  - 能看到 assignment ids 与后续状态推进
- Files:
  - `docs/00-process/active/exam-93-assignment-trigger-replay/progress.md`
- Forbidden files:
  - `axon-common/src/main/java/**`
  - `axon-chat/src/main/java/**`
- Validation:
  - 查询 `exam_assignment_grading_external_manifest_queue`
  - 查询 `exam_generic_grading_assignment_trigger_queue`
  - 必要时查询 preview JSON 字段
- Rollback signals:
  - 若公开接口已成功但队列表未登记，按 create-from-manifest 注册失败路径处理，不做静默补表
- Deferred implementation notes:
  - SQL 兜底仅作为验证与最后手工恢复方案，不作为首选执行路径

## Risks

1. 当前运行环境若未实际部署 heartbeat-timeout 修复，重放后仍可能再次误判 generic 相关状态。
2. `create-from-manifest` 若命中缺 PDF、缺 section、上下文不一致等确定性前置失败，会直接返回业务异常。
3. 若用户本地服务并非当前仓库版本，代码已修复但运行态未修复，会造成“仓库正确、环境仍错”的假象。

## Recovery / Rollback

- 不回写伪造 downstream 成功状态。
- 若重放失败：
  - 保留接口响应
  - 复核 flow state / trigger queue / downstream queue
  - 再决定是否进入 SQL 兜底恢复

## Plan Self Review

- 计划未引入新的产品行为，仅围绕已确认的恢复链路执行。
- 每个单元都有明确验证方式。
- 已显式排除“直接手改 downstream 成功态”这类高风险恢复。
