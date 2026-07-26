---
type: plan
status: completed
date: 2026-06-30
title: task-options-manifest-layout-fault-tolerance
depth: standard
format: human-readable-plan
sharded: false
---

# Plan: task-options manifest layout 部分失败容错

## Source

User request: `GET /api/v1/exam-assignment-grading/task-options` 在按 `manifestId` 查询 layout 时，若部分 manifest layout 获取异常，不应阻断其他任务选项返回。

## Scope

- 仅调整 `ExamAssignmentGradingServiceImpl#resolveTaskManifestLayout` 与 `listTaskOptions` 相关单测。
- 非目标：不改 Controller 契约、不改 `GET /manifests/{manifestId}/layout` 独立入口、不改 `scoreSummary` 既有容错。

## Readiness

- Goal: 单个 manifest layout 第三方失败时，当前任务选项降级返回，其余任务正常返回。
- Acceptance criteria:
  - layout 404/业务失败时捕获 `BusinessException`，记录 warn，缓存失败结果避免同 manifest 重复调用。
  - 失败任务仍返回 `taskId/templateId/status`；`grade/subject` 为空；`name` 退化为 `createdAt` 或 `taskId`。
  - 新增单测 `listTaskOptions_continuesWhenPartialManifestLayoutFails` 通过。
- Validation: `mvn -pl axon-common "-Dtest=ExamAssignmentGradingServiceImplTest#listTaskOptions_*" test`

## Decisions

### ADR-1 - 与 scoreSummary 对齐的条目级容错

- Decision: layout 查询失败采用与 `resolveTaskOptionScoreSummary` 相同的 `BusinessException` 捕获 + warn + 降级模式。
- Why: 同一聚合接口已确认「部分第三方子查询失败不阻断列表」的产品口径；避免一次坏 manifest 拖垮整页任务选择器。
- Consequences: layout 失败时前端可能只看到时间戳名称，需接受降级展示。

## Implementation

- `resolveTaskManifestLayout`: 使用 `layoutCache.containsKey(manifestId)` 判断缓存（含失败 null）；try/catch `getManifestLayout`。
- Test: 两任务、一 layout 成功、一 layout 404，断言返回 2 条且失败项字段降级。

## Archive

- `docs/00-process/archive/2026-06/task-options-manifest-layout-fault-tolerance/`
- API: `docs/04-api/2026-06-04-批量作业批改任务选项接口.md`
- AI memory: `03-key-workflows.md`, `04-known-pitfalls.md`, `05-decision-log.md`
