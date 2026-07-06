---
type: plan
status: implemented
date: 2026-06-16
title: 班级管理列表与统计接口新增方案
origin: docs/ae/prds/2026-06-16-class-management-list-api-prd.md
---

# Plan: 班级管理列表与统计接口新增方案

## Source

- 用户截图页面: 班级管理列表页。
- 用户目标: 查询当前请求用户所属学校下的所有班级，支持按入学年份、状态、年级、班级名称/班主任模糊筛选，并返回班级总数、正常班级、禁用班级等统计数据。
- 已确认实现方式: 新增管理页专用接口，不改造旧 `/api/v1/school/class/page` 的响应契约。
- 需求来源: `docs/ae/prds/2026-06-16-class-management-list-api-prd.md`。
- 本方案仅分析现有接口并设计新增接口，不修改业务代码。

## Scope

### 当前接口搜索结论

- 已存在班级分页接口: `POST /api/v1/school/class/page`，入口在 `axon-chat/src/main/java/com/xinxi/chatservice/controller/school/ClassController.java`；该接口保持兼容，不作为本次管理页聚合数据承载接口。
- 已存在分组查询接口: `POST /api/v1/school/class/grade-with-classes`。
- 已存在班级创建抽屉接口: `/api/v1/school/class/create-drawer/*`，用于新增班级流程。
- 已存在当前年级 SQL 推导查询: `ClassMapper.xml` 中的 `selectClassPageWithCurrentGrade` / `selectClassListWithCurrentGrade`。

### 最终涉及接口

| 类型 | Method | Path | 本次处理 |
|---|---|---|---|
| 新增 | POST | `/api/v1/school/class/management/page` | 新增班级管理页统计 + 列表聚合接口 |
| 回归确认 | POST | `/api/v1/school/class/page` | 保持旧响应契约不变，仅增加回归测试确认 |

### 现有接口不满足点

- `/page` 直接使用请求体 `schoolId`，不是强制使用当前登录用户的 `users.school_id`，不适合作为“请求用户对应学校下所有班级”的管理页接口。
- `/page` 返回 `PageResultVO<ClassVO>`，没有页面顶部统计卡片字段，如 `totalClassCount`、`activeClassCount`、`disabledClassCount`。
- `/page` 的 `ClassVO` 不包含班主任姓名、班主任 ID、学生数等截图列表字段。
- `/page` 只支持 `className` 模糊查询，不支持“班级名称 / 班主任”同一个关键字模糊查询。
- 当前年级筛选已经支持 `currentGradeId`，但现有 DTO 文案仍有 `gradeId` 和 `currentGradeId` 两套概念，新页面应明确使用“当前年级”筛选。

## Readiness

- Goal: 新增一个面向班级管理页面的列表聚合接口，返回当前用户学校范围内的班级统计和分页列表。
- Acceptance criteria:
  - 后端从当前登录用户解析 `userId`，再取 `users.school_id` 作为唯一学校范围；前端不传 `schoolId`。
  - 支持筛选: `enrollmentYear`、`classStatus`、`currentGradeId`、`keyword`。
  - `keyword` 同时匹配 `class.class_name` 与当前有效班主任名称。
  - 返回统计: 班级总数、正常班级数、禁用班级数；统计口径默认随当前筛选条件变化，但不受分页影响。
  - 列表字段覆盖截图: 入学年份、当前年级、班主任、学生数、状态、更新时间、班级 ID、班级名称。
  - 当前年级按既有 `ClassGradeProgressionService` / `ClassMapper.xml` 推导口径，不直接改写 `class.grade_id`。
- Non-goals:
  - 不改新增班级抽屉保存接口。
  - 不改班主任绑定、解绑接口。
  - 不处理“详情”“修改”接口的具体实现。
  - 不做数据库结构迁移，除非实现时发现缺少必要索引且性能不可接受。
- Affected areas:
  - `axon-chat` Controller 暴露接口。
  - `axon-common` DTO/VO、Service、Mapper、XML SQL。
- Validation surface:
  - Mapper SQL 单元或集成测试。
  - Service 权限与学校范围测试。
  - Controller 契约测试。
  - Maven 编译验证。
- Confirmed product decisions:
  - 使用新增接口 `POST /api/v1/school/class/management/page`，旧 `/api/v1/school/class/page` 不改响应结构。
  - 统计卡片跟随 `enrollmentYear/currentGradeId/keyword` 等查询范围变化，不受分页影响。
  - `classStatus` 用于筛选列表；统计状态分布默认不被单个 `classStatus` 收窄，便于页面切换状态卡片。
  - “禁用班级”仅统计 `class_status = DISABLED`。
  - 学生数按“当前有效班级关系”合并统计 `class_student_entity` 与旧 `student_class`。
  - 页面“年级”筛选指动态当前年级，对应 `currentGradeId`。

## Assumptions

- 若未登录或 token 无效，返回 `UNAUTHORIZED_TOKEN_INVALID`。
- 当前用户必须绑定学校；未绑定学校时返回参数错误或权限错误，不返回全局班级。
- 班级状态使用既有字符串口径: `ACTIVE`、`DISABLED`、`GRADUATED`、`ARCHIVED`。
- 页面“年级”筛选指动态当前年级，对应 `currentGradeId`，不是 `class.grade_id` 起始年级。
- 截图中的“待配置”班主任展示对应当前有效班主任为空，由前端按空值展示或后端返回展示名；执行时优先保持空值并在接口文档中说明。

## Alternatives Considered

- Chosen: 新增管理页专用聚合接口 `POST /api/v1/school/class/management/page`。
  - Fit: 不破坏旧 `/page` 契约，可一次返回统计和列表，前端接入简单。
  - Trade-off: 新增一组 DTO/VO/Mapper 查询，但契约清晰。
  - Risk: SQL 聚合需要控制学生数、班主任关联的重复计数。
- Alternative: 扩展旧 `/api/v1/school/class/page`。
  - Fit: URL 少一个。
  - Trade-off: 返回结构从 `PageResultVO<ClassVO>` 变成聚合对象会破坏现有调用方；若兼容新增字段，则统计卡片不好表达。
  - Rejected because: 用户已确认采用新增接口方式；旧接口保持历史兼容。
- Alternative: 前端分别调用旧 `/page`、班主任查询、学生数统计、状态统计多个接口。
  - Fit: 后端改动小。
  - Trade-off: N+1 请求明显，统计和列表筛选口径容易漂移。
  - Rejected because: 页面首屏数据应由一个稳定聚合接口提供。

## Decision Drivers

- Driver 1: 学校范围必须以后端当前用户为准，避免前端传 `schoolId` 越权。
- Driver 2: 统计卡片和列表必须使用同一筛选口径，避免数量与列表不一致。
- Driver 3: 保持旧班级接口兼容，新增页面能力不影响历史链路。

## Decisions

### ADR-1 - 新增管理页聚合接口

- Decision: 新增 `POST /api/v1/school/class/management/page`，返回 `ClassManagementPageVO`。
- Drivers: 保持旧接口兼容；管理页需要统计和列表；学校范围需要后端强制收敛。
- Alternatives: 扩展旧 `/page`；前端组合多个接口。
- Why chosen: 新接口契约最清晰，权限边界最容易验证。
- Consequences: 需要新增 DTO/VO/Service/Mapper 方法和测试。
- Follow-ups: 前端班级管理页切换到新接口后，旧 `/page` 继续保留给历史功能和回退展示。

### ADR-2 - 统计随筛选变化但不受分页影响

- Decision: 顶部统计应用 `enrollmentYear`、`currentGradeId`、`keyword` 等筛选条件，但统计各状态时不应用单个 `classStatus` 筛选。
- Drivers: 用户筛选“2025 + 一年级”时，统计卡片展示这个范围内的总数/正常/禁用更符合页面上下文；选择“状态=正常”时仍能看到同一范围内禁用数量，便于切换。
- Alternatives: 统计完全不跟随筛选；统计完全跟随所有筛选包括 `classStatus`。
- Why chosen: 兼顾页面上下文和状态卡片可用性。
- Consequences: Mapper 需要分别处理列表条件和统计条件，统计条件排除 `classStatus`。
- Follow-ups: 若后续产品改为统计完全跟随状态筛选，只调整 `selectManagementSummary` 条件，不影响接口路径和列表契约。

### ADR-3 - 学生数使用合并关系口径

- Decision: 学生数按当前有效 `class_student_entity` 加旧 `student_class` 合并统计。
- Drivers: 现有 `ClassStudentQueryService` 已说明班级学生列表是合并口径；只统计一张表会导致列表学生数和详情学生列表不一致。
- Alternatives: 仅统计 `class_student_entity`；仅统计 `student_class`。
- Why chosen: 与当前班级学生列表、网阅学生列表口径一致。
- Consequences: SQL 需要分别聚合两张关系表并相加，限定 `deleted=0/status=1/effective_end_date IS NULL`。
- Follow-ups: 若后续旧 `student_class` 下线，可收敛为单表统计。

## Proposed API Contract

### Endpoint

- Method: `POST`
- Path: `/api/v1/school/class/management/page`
- Permission: `class:read`
- Request body: `ClassManagementPageQueryDTO`
- Response: `ApiResult<ClassManagementPageVO>`
- Compatibility: 旧 `POST /api/v1/school/class/page` 保持 `ApiResult<PageResultVO<ClassVO>>`。

### Request DTO

```json
{
  "pageNum": 1,
  "pageSize": 10,
  "enrollmentYear": 2025,
  "currentGradeId": 11,
  "classStatus": "ACTIVE",
  "keyword": "一班"
}
```

### Response VO

```json
{
  "summary": {
    "totalClassCount": 25,
    "activeClassCount": 10,
    "disabledClassCount": 0
  },
  "page": {
    "records": [
      {
        "classId": 1001,
        "className": "一班",
        "enrollmentYear": 2025,
        "currentGradeId": 11,
        "currentGradeName": "一年级",
        "headTeacherId": 2001,
        "headTeacherName": "张老师",
        "studentCount": 0,
        "classStatus": "ACTIVE",
        "classStatusName": "正常",
        "updateTime": "2026-06-10T09:30:00"
      }
    ],
    "pageInfo": {
      "pageNum": 1,
      "pageSize": 10,
      "total": 25,
      "totalPages": 3
    }
  }
}
```

## Risks

- SQL join 当前班主任时，如果历史数据出现多条当前有效班主任关系，列表可能重复。需要在 SQL 中先按 `class_id` 聚合出唯一当前班主任，或依赖现有唯一约束并在测试里覆盖异常数据。
- 统计查询如果直接 join 学生关系表，会因一对多关系导致班级数被放大。统计班级数必须基于班级主表或 `COUNT(DISTINCT c.id)`。
- 当前年级推导 SQL 与 `ClassGradeProgressionService` 双口径并存，必须复用或保持表达式一致，避免筛选结果和返回展示不一致。
- `keyword` 匹配班主任名称需要确认用户展示名优先级，建议按 `users.nick_name` 优先，空时回退 `users.username`。

## Pre-Mortem

- Failure scenario 1: 前端传入 `schoolId` 查询其他学校班级。
  - Mitigation: 新 DTO 不包含 `schoolId`，Service 只使用当前用户 `users.school_id`；旧 `/page` 不作为新页面数据源。
- Failure scenario 2: 学生数统计慢或重复。
  - Mitigation: 通过两个子查询按 `class_id` 聚合学生数，再 join 到班级列表；必要时检查 `class_student_entity(class_id,status,effective_end_date,deleted)` 和 `student_class(class_id,status,effective_end_date,deleted)` 索引。
- Failure scenario 3: 状态统计和列表筛选口径不一致。
  - Mitigation: 抽取统一查询条件片段，列表查询使用完整条件，统计查询复用基础条件但排除 `classStatus`。

## Implementation Units

### U1 - 新增管理页 DTO/VO 契约

- Goal: 定义请求和响应结构，不影响旧接口。
- Requirements covered: 筛选条件、统计、截图列表字段。
- Acceptance criteria covered: 新 DTO 无 `schoolId`；VO 包含 `summary` 和分页 `page`。
- Depends on: none
- Files:
  - `axon-common/src/main/java/com/xinxi/axon/common/dto/school/ClassManagementPageQueryDTO.java`
  - `axon-common/src/main/java/com/xinxi/axon/common/vo/school/ClassManagementPageVO.java`
  - `axon-common/src/main/java/com/xinxi/axon/common/vo/school/ClassManagementSummaryVO.java`
  - `axon-common/src/main/java/com/xinxi/axon/common/vo/school/ClassManagementListItemVO.java`
- Forbidden files:
  - `axon-common/src/main/java/com/xinxi/axon/common/vo/school/ClassVO.java`
- Approach:
  - `ClassManagementPageQueryDTO`: `pageNum/pageSize/enrollmentYear/currentGradeId/classStatus/keyword`。
  - `ClassManagementPageVO`: `summary` + `PageResultVO<ClassManagementListItemVO> page`。
  - `ClassManagementListItemVO`: 覆盖 `classId/className/enrollmentYear/currentGradeId/currentGradeName/headTeacherId/headTeacherName/studentCount/classStatus/classStatusName/updateTime`。
  - 不修改 `ClassPageQueryDTO`、`ClassVO`、`PageResultVO` 的既有字段和语义。
- Tests:
  - DTO/VO 本身不需要复杂单测，契约由 Controller 测试覆盖。
- Validation:
  - `mvn -pl axon-common -am -DskipTests compile`
- Rollback signals:
  - 编译失败或与已有类名冲突。
- Deferred to implementation:
  - 根据项目 Lombok 和 Swagger 注解风格补齐 `@Data`、`@Schema`。

### U2 - 新增 Mapper 查询与统计 SQL

- Goal: 一次分页查询管理页列表，并查询同筛选范围内统计卡片。
- Requirements covered: 当前年级、入学年份、状态、班级名称/班主任关键字、学生数、班主任。
- Acceptance criteria covered: 列表不跨学校；统计不受分页影响；学生数合并当前有效关系。
- Depends on: U1
- Files:
  - `axon-common/src/main/java/com/xinxi/axon/common/mapper/school/ClassMapper.java`
  - `axon-common/src/main/resources/mapper/school/ClassMapper.xml`
  - `axon-common/src/main/java/com/xinxi/axon/common/dto/school/ClassManagementMapperQuery.java`
- Forbidden files:
  - `axon-common/src/main/resources/mapper/user/UserSubjectMapper.xml`
- Approach:
  - 在 `ClassMapper` 新增:
    - `IPage<ClassManagementListItemVO> selectManagementPage(Page<?> page, @Param("query") ClassManagementMapperQuery query)`
    - `ClassManagementSummaryVO selectManagementSummary(@Param("query") ClassManagementMapperQuery query)`
  - SQL 以 `class c` 为主表，强制 `c.school_id = #{query.schoolId}`、`c.deleted = 0`。
  - 当前年级沿用 `ClassMapper.xml` 现有 `CurrentAcademicYearExpression` 和 `current_g` join。
  - 当前有效班主任子查询限定 `class_head_teacher.deleted=0/status=1/effective_end_date IS NULL`，join `users` 获取 `nick_name/username`。
  - 学生数使用两个按 `class_id` 聚合的子查询:
    - `class_student_entity`: `deleted=0/status=1/effective_end_date IS NULL`
    - `student_class`: `deleted=0/status=1/effective_end_date IS NULL`
  - `keyword` 条件: `c.class_name LIKE ... OR teacher display name LIKE ...`。
  - 列表状态筛选应用 `classStatus`；统计查询排除 `classStatus`，通过 `SUM(CASE WHEN c.class_status = 'ACTIVE' THEN 1 ELSE 0 END)` 统计状态。
  - `disabledClassCount` 仅统计 `class_status = 'DISABLED'`，不包含 `GRADUATED/ARCHIVED`。
- Tests:
  - Mapper 层准备同校/异校、不同状态、不同当前年级、班主任关键字、学生关系双表数据。
  - 断言分页 total、统计数量、学生数、班主任名称均正确。
- Validation:
  - `mvn -pl axon-common -Dtest=ClassManagementMapperTest test`
- Rollback signals:
  - SQL 出现重复班级行、统计被学生关系放大、关键字无法匹配班主任。
- Deferred to implementation:
  - 如果当前项目没有 Mapper 集成测试基座，可退化为 Service 单测 mock Mapper，并补充 SQL 人工检查。

### U3 - 新增 Service 聚合逻辑

- Goal: 从当前用户解析学校，调用 Mapper 返回管理页聚合结果。
- Requirements covered: 当前请求用户学校范围；未登录/未绑定学校错误；状态中文名。
- Acceptance criteria covered: 前端不传 `schoolId`；返回 `summary` 与 `page`。
- Depends on: U1, U2
- Files:
  - `axon-common/src/main/java/com/xinxi/axon/common/service/school/ClassManagementService.java`
  - `axon-common/src/main/java/com/xinxi/axon/common/service/school/impl/ClassManagementServiceImpl.java`
  - `axon-common/src/main/java/com/xinxi/axon/common/enums/school/ClassStatusEnum.java`
- Forbidden files:
  - `axon-common/src/main/java/com/xinxi/axon/common/service/school/impl/ClassServiceImpl.java`
- Approach:
  - 新建独立 `ClassManagementService`，避免继续扩大 `ClassServiceImpl` 复杂度。
  - 根据 `userId` 查询 `UserPO`，校验 `schoolId` 非空。
  - 校验分页参数: `pageNum >= 1`，`pageSize` 默认 10，最大建议 100。
  - 构造内部 `ClassManagementMapperQuery`，设置 `schoolId` 和筛选字段。
  - 调用 Mapper 查询列表和统计，组装 `ClassManagementPageVO`。
  - 通过 `ClassStatusEnum` 将 `ACTIVE` 映射为 `正常`，`DISABLED` 映射为 `禁用`，其他状态保留稳定中文名。
  - 不复用 `ClassService#pageClass` 作为管理页主链路，避免旧接口 `schoolId` 入参和返回结构影响新页面。
- Tests:
  - `ClassManagementServiceImplTest`
  - 用例: 未登录 userId 为空、用户不存在、用户无学校、正常查询、状态筛选不影响 summary 状态分布、keyword trim 后生效。
- Validation:
  - `mvn -pl axon-common -Dtest=ClassManagementServiceImplTest test`
- Rollback signals:
  - 旧 `ClassServiceImpl` 被无关改动。
- Deferred to implementation:
  - 若项目已有班级状态枚举，优先复用，不重复新增 `ClassStatusEnum`。

### U4 - 新增 Controller 接口

- Goal: 暴露管理页接口给前端。
- Requirements covered: `POST /api/v1/school/class/management/page`，权限 `class:read`。
- Acceptance criteria covered: 当前登录用户上下文传入 Service。
- Depends on: U3
- Files:
  - `axon-chat/src/main/java/com/xinxi/chatservice/controller/school/ClassController.java`
- Forbidden files:
  - `axon-chat/src/main/java/com/xinxi/chatservice/controller/student/StudentEntityController.java`
- Approach:
  - 注入 `ClassManagementService`。
  - 新增方法:
    - `@PostMapping("/management/page")`
    - `@RequirePermission(value = "class:read", description = "班级查看权限")`
    - `ApiResult<ClassManagementPageVO> pageClassManagement(@RequestBody @Valid ClassManagementPageQueryDTO dto, HttpServletRequest request)`
  - 使用 `getUserIdFromRequest(request)`，未登录返回既有未授权错误。
  - 捕获 `BusinessException` 时保留业务错误码；未知异常返回系统错误并记录日志。
  - 保留原 `@PostMapping("/page")` 方法，不改变其路由、入参和返回类型。
- Tests:
  - `ClassControllerTest` 或项目现有 Controller 测试风格。
  - 用例: 成功返回、未登录、Service 抛业务异常。
- Validation:
  - `mvn -pl axon-chat -Dtest=ClassControllerTest test`
- Rollback signals:
  - Controller 方法影响旧 `/page`、`/grade-with-classes` 路由。
- Deferred to implementation:
  - 如果测试类过大，可新增专门的 `ClassManagementControllerTest`。

### U5 - 接口文档与联调样例

- Goal: 给前端提供稳定调用说明。
- Requirements covered: 请求/响应字段、状态枚举、统计口径。
- Acceptance criteria covered: 前端能据文档直接替换页面数据源。
- Depends on: U4
- Files:
  - `docs/04-api/class-management-page-api.md`
  - `docs/07-test-data/class-management-page-request.json`
- Forbidden files:
  - repository root
- Approach:
  - 文档说明接口路径、权限、筛选字段、统计口径、字段含义、错误码。
  - 样例 JSON 使用截图场景字段。
- Tests:
  - 文档检查字段名与 DTO/VO 一致。
- Validation:
  - `rg -n "ClassManagementPageQueryDTO|ClassManagementPageVO|/management/page" axon-chat axon-common docs/04-api`
- Rollback signals:
  - 文档字段与代码字段不一致。
- Deferred to implementation:
  - 若前端已有接口文档模板，按模板调整。

## Validation Plan

- Unit:
  - `mvn -pl axon-common -Dtest=ClassManagementServiceImplTest test`
- Integration:
  - `mvn -pl axon-common -Dtest=ClassManagementMapperTest test`，若无数据库测试基座则执行 SQL review 和 Service mock 测试。
- User flow:
  - 使用当前登录用户 token 调 `POST http://127.0.0.1:<port>/api/v1/school/class/management/page`，验证列表、筛选、统计。
  - 同时抽查旧 `POST /api/v1/school/class/page` 仍返回 `PageResultVO<ClassVO>`，确认兼容性未破坏。
- Data / operations:
  - 用 SQL 准备或选择同校多状态班级、当前有效班主任、两张学生关系表样本。
- Observability:
  - Controller 记录请求参数摘要和异常日志；Service 不打印 token 或敏感信息。

## Rollback / Recovery

- 新接口独立于旧 `/api/v1/school/class/page`，如上线后异常，前端可回退旧接口临时展示基础班级列表，但统计卡片和班主任/学生数字段会降级。
- 后端回滚可删除新增 Controller 方法、Service、DTO/VO、Mapper 方法和 XML SQL，不需要数据库回滚。
- 若仅统计口径争议，优先调整 `selectManagementSummary` 查询条件，不影响列表契约。

## Plan Self-Review

- Placeholder scan: 未保留未完成占位或未定义任务。
- Consistency check: 接口路径、DTO、VO、Service、Mapper 在各章节保持一致。
- Scope check: 仅覆盖班级管理列表与统计，不扩展详情、修改、新增保存。
- Acceptance coverage: 用户提出的新增接口方式、学校范围、筛选、统计、截图列表字段均映射到实施单元。
- Validation gaps: Mapper 集成测试依赖项目是否已有数据库测试基座；若没有，已记录降级验证方式。
- Alternatives and ADR check: 已比较新增接口、扩展旧接口、前端组合接口三种方案。
- High-risk pre-mortem check: 已覆盖越权、重复计数、口径漂移三类主要失败场景。

## Handoff

- 当前方案已按“新增接口方式”完成实现。
- 实际执行顺序: `U1 -> U2 -> U3 -> U4 -> U5`，并补充旧 `/api/v1/school/class/page` 契约回归测试。
- 旧 `/api/v1/school/class/page` 的响应结构未修改；新页面应接入 `/api/v1/school/class/management/page`。

## Implementation Result

### 已完成

- 新增 `ClassManagementPageQueryDTO`，请求字段为 `pageNum/pageSize/enrollmentYear/currentGradeId/classStatus/keyword`，不包含 `schoolId`。
- 新增 `ClassManagementPageVO`、`ClassManagementSummaryVO`、`ClassManagementListItemVO`。
- 新增 `ClassManagementService` 与 `ClassManagementServiceImpl`，从当前登录用户读取 `users.school_id` 作为唯一学校范围。
- `ClassMapper` 新增 `selectManagementPage` 和 `selectManagementSummary`。
- `ClassMapper.xml` 新增管理页 SQL:
  - 当前年级复用既有学年切换表达式。
  - 班主任按当前有效 `class_head_teacher` 关系关联教师用户。
  - 学生数合并 `class_student_entity` 与旧 `student_class` 当前有效关系。
  - `summary` 排除 `classStatus` 筛选，列表应用全部筛选。
- `ClassController` 新增 `POST /api/v1/school/class/management/page`。
- 新增 Service 和 Controller 测试。
- 新增接口文档和请求样例。
- AI 记忆已补充班级管理页新接口长期约定。

### 实施偏差

- 原计划保留 Mapper 集成测试作为优选验证，但当前仓库没有为该 SQL 准备专用数据库测试基座；本次采用 Service mock 测试、Controller 契约测试、XML/SQL 代码审查和模块编译验证替代。
- 自检阶段发现班主任子查询存在 `headTeacherId/headTeacherName` 可能来自不同聚合记录的风险，已改为先选定一条当前有效班主任关系，再关联同一条关系上的教师用户。

## Final Validation

- `mvn -pl axon-common -Dtest=ClassManagementServiceImplTest test`: 通过，5 tests。
- `mvn -pl axon-chat -am '-Dtest=ClassControllerTest' '-Dsurefire.failIfNoSpecifiedTests=false' test`: 通过，2 tests。
- `mvn -pl axon-chat -am -DskipTests compile`: 通过。
- `git diff --check`: 通过，仅有 Git CRLF 提示。

## Archive

- 执行进度: `docs/00-process/archive/2026-06/class-management-list-api/progress.md`
- Final gate proof: `docs/ae/gates/20260616T072615Z-work-final.json`
- 关联文档归档副本保存在 `docs/00-process/archive/2026-06/class-management-list-api/`。
