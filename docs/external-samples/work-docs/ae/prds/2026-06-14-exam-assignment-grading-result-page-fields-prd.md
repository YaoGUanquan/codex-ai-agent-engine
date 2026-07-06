---
type: prd
status: completed
date: 2026-06-14
topic: exam-assignment-grading-result-page-fields
---

# 批量作业批改结果页级字段透出 PRD

## Problem Frame

第三方 `GET /api/v1/batch_assignment_grading/{grading_id}/results` 响应在学生作文明细项中新增了 `essay_layout_pages` 与 `essay_annotation_images`，原单数字段 `essay_annotation_image` 已被第三方移除。附件 `D:/Downloads/response.json` 显示两个新增字段位于 `results.files.<section>.data[]` 的单条明细内，字段值为数组；部分任务或明细可能为空数组、缺失或无有效元素。

当前本地 `ExamAssignmentGradingController` 相关结果接口只显式封装旧单数字段 `essay_annotation_image`，并在旧结果接口中通过 `extraFields` 间接保留未知字段；轻量聚合接口不会返回未知字段。因此前端无法稳定通过明确字段获取新增页级布局和多页批注图片。为避免前端仍读取旧字段时报错，旧字段对应的本地 `essayAnnotationImage` 需要继续保留：拿到旧字段就解析，拿不到就返回空对象。

## Goals

- 本地结果接口稳定返回第三方新增的页级布局数组和多页批注图片数组，并以这两个复数字段作为主展示字段。
- 保持现有单数字段 `essayAnnotationImage` 的兼容返回：第三方仍返回旧字段时解析；第三方不返回旧字段时返回空对象，避免已联调前端空指针或取属性报错。
- 对空数组、缺失字段、空值字段给出稳定、可预测的响应形态。
- 覆盖两个现有本地结果入口：
  - `GET /api/v1/exam-assignment-grading/{gradingId}/results`
  - `POST /api/v1/exam-assignment-grading/results-with-layout`
- 更新接口文档、测试和长期记忆，避免后续维护继续只按单数字段处理。

## Non-Goals

- 不修改第三方接口调用地址、鉴权、错误码或重试策略。
- 不修改创建批改任务时 `annotate_image`、`result_stats` 等选项。
- 不解析 `essay_layout_pages[].layout_analysis` 内部结构为强类型对象，本期按 `Map<String,Object>` 保留第三方结构。
- 不移除或重命名现有 `essayAnnotationImage`，但它只作为旧前端兼容字段，不作为新增多页批注图片的主字段。
- 不把 `essay_stats.data` 当作学生明细数组处理。

## Users or Systems Affected

- 前端批改结果展示页：需要读取多页布局和多页批注图片。
- `axon-chat` 控制器入口：继续只负责请求编排。
- `axon-common` 批改服务和 VO：负责第三方响应字段映射与对外契约。
- 接口文档与 AI 记忆：记录新增字段的长期维护规则。

## Requirements

1. `results.files[].data[]` 明细项返回 `essayLayoutPages`，来源为第三方 `essay_layout_pages`，兼容本地驼峰输入 `essayLayoutPages`。
2. `results.files[].data[]` 明细项返回 `essayAnnotationImages`，来源为第三方 `essay_annotation_images`，兼容本地驼峰输入 `essayAnnotationImages`。
3. `studentResults.students[].sections[]` 同步返回 `essayLayoutPages` 与 `essayAnnotationImages`，保证 `results-with-layout` 轻量接口也能给前端使用。
4. 两个新增字段对外均为数组；第三方字段缺失、为 `null`、为空数组或不是数组时，本地返回空数组。
5. 数组元素不做强类型拆分，按 `List<Map<String,Object>>` 保留第三方对象字段：
   - `essayLayoutPages[]` 当前样例含 `image/full_text/layout_analysis`。
   - `essayAnnotationImages[]` 当前样例含 `image/annotatedImageUrl/annotatedJsonUrl`。
6. 旧结果接口中新增字段被显式建模后，不再重复出现在 `extraFields`。
7. 现有 `essayAnnotationImage` 继续从 `essay_annotation_image` / `essayAnnotationImage` 读取；如果第三方未返回旧单数字段，本地返回空对象 `{}`，不返回 `null`。
8. 所有新增字段命名遵循本项目 Java VO 与前端响应的驼峰 JSON 约定，对外字段为 `essayLayoutPages` 和 `essayAnnotationImages`。

## Acceptance Criteria

- 给定附件同形态第三方响应，`GET /api/v1/exam-assignment-grading/{gradingId}/results` 返回：
  - `data.results.files[0].data[0].essayLayoutPages` 是数组，长度与第三方 `essay_layout_pages` 一致。
  - `data.results.files[0].data[0].essayAnnotationImages` 是数组，长度与第三方 `essay_annotation_images` 一致。
  - `data.studentResults.students[0].sections[0].essayLayoutPages` 是数组。
  - `data.studentResults.students[0].sections[0].essayAnnotationImages` 是数组。
- 给定同一第三方响应，`POST /api/v1/exam-assignment-grading/results-with-layout` 返回：
  - `data.studentResults.students[0].sections[0].essayLayoutPages` 是数组。
  - `data.studentResults.students[0].sections[0].essayAnnotationImages` 是数组。
- 当第三方新增字段为空数组、缺失或为 `null` 时，本地对应字段返回空数组，不抛异常。
- `essayAnnotationImage` 原有对象字段仍可返回，不因新增复数字段被删除；当第三方未返回旧单数字段时，本地返回空对象 `{}`。
- `essay_layout_pages` 与 `essay_annotation_images` 不再作为未知一级字段重复进入 `results.files[].data[].extraFields`。

## Alternatives Considered

- 只依赖旧结果接口 `extraFields` 透传未知字段：实现最少，但 `results-with-layout` 不返回 `extraFields`，前端契约不稳定。
- 在 VO 中新增强类型页对象：类型更清晰，但第三方 `layout_analysis` 深层结构可能继续变化，本期容易过度建模。
- 推荐方案：在现有 VO 中新增 `List<Map<String,Object>>` 字段并统一映射；同时调整旧单数字段兼容逻辑，缺失时返回空对象。该方案与现有 `scoreV2`、`essayLayoutAnalysis`、`layoutRaw` 的弱类型保留策略一致，影响面小。

## Chosen Approach

沿用现有服务层映射模式，在 `axon-common` 的结果明细 VO 与学生聚合 Section VO 上新增两个数组字段；在 `ExamAssignmentGradingServiceImpl` 中新增常量和提取方法，统一兼容 snake_case 与 camelCase 输入。旧单数字段 `essayAnnotationImage` 保留为对象字段，第三方有值时解析，无值时返回空对象。控制器不新增逻辑，只通过已有服务结果自然返回。

## Validation Signals

- `axon-common` 服务测试覆盖：
  - 第三方响应中两个新增字段为数组时完整返回。
  - 复数字段为空或缺失时返回空数组。
  - 旧单数字段为空或缺失时返回空对象。
  - `extraFields` 不重复包含已建模字段。
- `axon-chat` 控制器测试覆盖两个本地接口的 JSON 响应字段是数组。
- Maven 单测命令：
  - `mvn -pl axon-common -Dtest=ExamAssignmentGradingServiceImplTest test`
  - `mvn -pl axon-chat -Dtest=ExamAssignmentGradingControllerTest test`
- 文档检查确认接口文档和 AI 记忆同步更新。

## Open Questions

- 前端是否强制要求 snake_case 字段名。当前方案按项目既有 VO 约定返回驼峰字段名；若前端必须原样读取 `essay_layout_pages` / `essay_annotation_images`，需要在 VO 上增加 Jackson `@JsonProperty`，这会偏离现有接口风格。

## Requirement Quality Checklist

- 目标和用户可见结果清晰。
- 非目标已排除第三方调用、任务创建配置和深层强类型建模。
- 验收标准可通过单测和 JSON path 检查验证。
- 复数字段空值、缺失和空数组行为已明确；旧单数字段缺失时返回空对象。
- 关键开放问题已单独列出，没有混入默认需求。

## Planning Notes

- 主要实现位于 `axon-common`，`axon-chat` 只需控制器测试补充。
- 文档更新建议覆盖 `docs/04-api/2026-06-03-批量作业批改结果与布局聚合接口.md` 与 `docs/08-ai-memory/03-key-workflows.md`、`docs/08-ai-memory/05-decision-log.md`。

## Self-Review

- 未留下占位章节。
- 需求与非目标没有冲突。
- 验收标准均可检查。
- 范围足够小，适合一个实施计划闭环完成。

## Outcome

- 2026-06-14 已完成实现、单测与测试环境冒烟。
- `GET /api/v1/exam-assignment-grading/{gradingId}/results` 与 `POST /api/v1/exam-assignment-grading/results-with-layout` 均已验证返回：
  - `essayLayoutPages`
  - `essayAnnotationImages`
  - 兼容字段 `essayAnnotationImage`
- 归档执行记录见 `docs/00-process/archive/2026-06/exam-assignment-grading-result-page-fields/`。
