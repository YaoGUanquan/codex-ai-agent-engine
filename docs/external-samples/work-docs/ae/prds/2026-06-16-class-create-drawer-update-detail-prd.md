---
type: prd
status: completed
date: 2026-06-16
topic: class-create-drawer-update-detail
---

# PRD: 班级创建抽屉修改与详情接口

## Problem Frame

当前班级创建抽屉已提供 `/api/v1/school/class/create-drawer/save`，可一次性创建班级、绑定班主任并可选配置科任老师。班级管理页后续需要以同一套抽屉表单承载编辑场景，因此需要补齐与保存逻辑对应的详情回显接口和修改接口。

## Goals

- 新增抽屉详情接口，按班级 ID 返回可直接回填抽屉表单的数据。
- 新增抽屉修改接口，复用创建保存的学校边界、学段年级推导、班主任校验、科任老师校验和重复班级名校验规则。
- 保持旧接口 `/api/v1/school/class/add`、`/api/v1/school/class/update`、`/api/v1/school/class/page` 契约不变。

## Non-Goals

- 不新增数据库表或字段。
- 不改学生升班、毕业、学生班级关系逻辑。
- 不改旧班级新增/修改接口语义。
- 不把班主任关系写入 `teacher_class_subject`。
- 不调整候选老师分页和学段学科选项的既有契约。

## Users or Systems Affected

- 前端班级管理页的创建/编辑抽屉。
- `axon-chat` 班级 Controller。
- `axon-common` 班级创建聚合服务、班主任关系、科任老师关系、班级管理查询。

## Requirements

1. 详情接口必须按当前登录用户所属学校校验班级归属，禁止跨学校读取。
2. 详情响应必须包含创建抽屉保存所需的核心字段：班级 ID、班级名称、班级状态、入学年份、入学月份、目标学年、起始年级、当前年级、学段类别、班主任、科任老师列表。
3. 修改接口必须接收班级 ID，并按完整抽屉表单快照更新班级基础信息、当前班主任和当前有效科任老师关系。
4. 修改接口的科任老师列表应显式传递；空列表表示清空当前科任老师，`null` 应作为参数错误处理，避免前端漏字段导致误清空或语义不明。
5. 修改接口必须复用保存接口的老师有效性规则：同校、未删除、有效教师档案、教师及以上角色、学段权限；科任老师还必须匹配当前学段和学科权限。
6. 修改接口必须复用保存接口的学科规则：`subjectId` 属于当前学段学科选项，同一次请求不允许重复学科，`academicYear` 与目标学年一致。
7. 修改接口重复班级名校验必须排除当前班级自身，但仍阻止同学校、同入学年份、同当前年级、同班级名称的其他班级。
8. 当班级存在当前有效学生关系时，修改接口禁止变更入学年份、入学月份、学段类别、所选老师年级、起始年级和目标学年；当前有效学生关系同时检查 `class_student_entity` 与兼容旧链路 `student_class`。
9. 修改接口的班级状态可为空；为空表示保持原状态，不为空时只允许 `ACTIVE` 与 `DISABLED`，不允许通过抽屉编辑切换为毕业、归档等生命周期状态。
10. 修改成功后固定返回 `ClassCreateSaveResultVO`，便于前端刷新列表或展示保存结果。

## Acceptance Criteria

- `GET /api/v1/school/class/create-drawer/{classId}/detail` 可返回当前用户学校内班级的抽屉详情。
- 详情接口访问不存在、已删除或跨学校班级时返回业务错误。
- `POST /api/v1/school/class/create-drawer/update` 可成功修改班级名称、班级状态、班主任和科任老师快照；当班级没有当前有效学生关系时，可同步修改入学年份和学段推导相关字段。
- 修改接口重复班级名只与其他班级冲突，不与当前班级自身冲突。
- 修改接口在科任老师重复学科、学年不一致、学段不支持学科、老师权限不匹配时失败，且不产生部分更新。
- 修改接口 `subjectTeachers=[]` 会关闭当前有效科任老师关系；`subjectTeachers=null` 返回参数错误。
- 班级已有当前有效学生关系时，修改入学年份、入学月份、学段类别、所选老师年级、起始年级或目标学年会返回业务错误。
- 修改接口传入 `ACTIVE/DISABLED` 以外的非空班级状态会返回参数错误；`classStatus=null` 时保持原状态。
- 修改接口成功响应类型固定为 `ClassCreateSaveResultVO`。
- 旧接口行为不变。

## Assumptions

- 修改接口采用完整快照语义，不做 PATCH 局部更新。
- 详情接口路径采用 REST 风格 `GET /create-drawer/{classId}/detail`，修改接口沿用项目写操作习惯采用 `POST /create-drawer/update`。
- 目标学年继续由请求值或现有推导逻辑决定，不新增前端可传学校学年切换规则。
- 当前有效科任老师关系更新采用关闭旧关系并插入新关系或保留未变化关系的方式，不物理删除历史关系。

## Open Questions

- 无阻塞开放问题。若后续产品需要支持已有学生班级调整入学年份或学段，应另立迁移方案并明确学生关系影响。

## Validation Expectations

- 新增/扩展 `ClassCreateServiceImplTest` 覆盖成功更新、详情、跨校拒绝、重复班级名、科任老师替换、清空科任老师、已有学生时禁止改年级口径、状态白名单和参数错误。
- 执行 `mvn -pl axon-common -Dtest=ClassCreateServiceImplTest test`。
- 执行 `mvn -pl axon-chat -am -DskipTests compile`。

## Completion

- 完成时间: 2026-06-16。
- 实现状态: 已完成详情接口与修改接口，旧接口契约未变。
- 验证结果:
  - `mvn -pl axon-common -Dtest=ClassCreateServiceImplTest test`: `Tests run: 13, Failures: 0, Errors: 0, Skipped: 0`。
  - `mvn -pl axon-chat -am -DskipTests compile`: `BUILD SUCCESS`。
- Gate proof: `docs/ae/gates/20260616T085618Z-work-final.json`。
- 归档目录: `docs/00-process/archive/2026-06/class-create-drawer-update-detail/`。
