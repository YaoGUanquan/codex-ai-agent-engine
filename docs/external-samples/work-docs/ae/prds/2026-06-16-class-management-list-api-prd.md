---
type: prd
status: implemented
date: 2026-06-16
topic: class-management-list-api
---

# PRD: 班级管理列表与统计新增接口

## 背景

前端班级管理页当前使用 `POST /api/v1/school/class/page` 获取班级分页数据。该接口是通用班级分页接口，返回 `PageResultVO<ClassVO>`，无法直接承载页面顶部统计卡片，也缺少班主任、学生数、班级名称/班主任统一模糊搜索等管理页字段。

本次确认采用新增接口方式，不改造旧 `/api/v1/school/class/page` 的响应契约。

## 实现状态

- 状态: 已实现。
- 落地接口: `POST /api/v1/school/class/management/page`。
- 兼容接口: `POST /api/v1/school/class/page` 保持原 `ApiResult<PageResultVO<ClassVO>>` 响应结构。
- 实现模块:
  - `axon-chat`: `ClassController` 新增管理页接口入口。
  - `axon-common`: 新增 `ClassManagementService`、管理页 DTO/VO、`ClassMapper` 查询和 XML SQL。
- 文档入口:
  - 接口文档: `docs/04-api/class-management-page-api.md`
  - 请求样例: `docs/07-test-data/class-management-page-request.json`
  - 执行归档: `docs/00-process/archive/2026-06/class-management-list-api/progress.md`

## 目标

- 新增班级管理页专用列表接口，按当前请求用户所属学校查询班级。
- 支持入学年份、状态、当前年级、班级名称/班主任关键字筛选。
- 同一次响应返回统计卡片和分页列表。
- 保持旧 `/api/v1/school/class/page` 兼容，避免影响历史调用方。

## 功能需求

1. 新增接口 `POST /api/v1/school/class/management/page`。
2. 接口权限沿用班级查看权限 `class:read`。
3. 学校范围由后端根据当前登录用户 `users.school_id` 确定，前端不传 `schoolId`。
4. 请求支持 `pageNum/pageSize/enrollmentYear/classStatus/currentGradeId/keyword`。
5. `keyword` 同时模糊匹配班级名称和当前有效班主任名称。
6. 响应包含 `totalClassCount/activeClassCount/disabledClassCount`。
7. 响应分页列表包含班级 ID、班级名称、入学年份、当前年级、班主任、学生数、班级状态、更新时间。

## 非目标

- 不修改旧 `POST /api/v1/school/class/page` 响应结构。
- 不改新增班级抽屉保存接口。
- 不改班主任绑定、解绑接口。
- 不实现详情、修改、禁用、启用等操作接口。
- 不主动做数据库结构迁移。

## 口径确认

- 新页面使用新增接口，不复用旧 `/page` 承载聚合数据。
- 统计卡片跟随 `enrollmentYear/currentGradeId/keyword` 等查询范围变化，不受分页影响。
- `classStatus` 用于筛选列表；统计状态分布默认不被单个 `classStatus` 收窄，便于页面切换状态卡片。
- `disabledClassCount` 仅统计 `class_status = DISABLED`。
- 学生数使用当前有效 `class_student_entity` 和旧 `student_class` 合并口径。
- 页面年级筛选指动态当前年级，即 `currentGradeId`，不是 `class.grade_id` 起始年级。

## 验收标准

- 未登录请求返回未授权错误。
- 当前用户未绑定学校时，不返回全局班级。
- 同校班级可按入学年份、状态、当前年级筛选。
- 关键字能匹配班级名称，也能匹配班主任名称。
- 异校班级不会出现在列表或统计中。
- 统计数量与同一筛选范围下的班级数据一致，且不受分页页码影响。
- 学生数与现有班级学生列表的合并关系口径一致。
- 旧 `/api/v1/school/class/page` 保持原响应结构。

## 风险

- 当前有效班主任历史脏数据可能导致 join 后重复行，需要 SQL 子查询收敛为每个班级一条。
- 学生数合并两张关系表时可能重复或性能较差，需要按 `class_id` 先聚合再关联。
- 当前年级筛选和展示必须复用既有推导口径，避免筛选结果与返回字段不一致。

## 验证期望

- Service 单测覆盖学校范围、分页参数、用户无学校、状态统计口径。
- SQL 通过代码审查和编译解析验证覆盖班主任关键字、学生数合并、同校/异校隔离口径；当前未新增数据库集成 Mapper 测试。
- Controller 测试覆盖接口路径、权限上下文、异常响应。
- 编译验证覆盖 `axon-common` 和 `axon-chat`。

## 最终验证记录

- `mvn -pl axon-common -Dtest=ClassManagementServiceImplTest test`: 通过。
- `mvn -pl axon-chat -am '-Dtest=ClassControllerTest' '-Dsurefire.failIfNoSpecifiedTests=false' test`: 通过。
- `mvn -pl axon-chat -am -DskipTests compile`: 通过。
- `git diff --check`: 通过，仅有 Git CRLF 提示。
