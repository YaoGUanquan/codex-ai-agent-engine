---
type: plan
status: completed
date: 2026-06-16
title: class-create-drawer-update-detail
origin: docs/ae/prds/2026-06-16-class-create-drawer-update-detail-prd.md
---

# Plan: class-create-drawer-update-detail

## Source

- 用户请求：基于当前 `/api/v1/school/class/create-drawer/save` 接口逻辑，新增对应的修改和详情接口，并创建执行方案。
- 现有方案：`docs/02-design/2026-06-15-class-create-drawer-backend-solution.md`
- 长期记忆：`docs/08-ai-memory/03-key-workflows.md`
- 需求稿：`docs/ae/prds/2026-06-16-class-create-drawer-update-detail-prd.md`

## Scope

- 新增创建抽屉详情接口。
- 新增创建抽屉修改接口。
- 扩展 `ClassCreateService` 和 `ClassCreateServiceImpl`。
- 新增必要 DTO/VO。
- 增补单元测试和编译验证。

不包含 SQL 迁移、旧接口改造、学生关系变更、前端实现。

## Readiness

- Goal: 让班级管理页可用同一创建抽屉完成编辑和详情回显。
- Acceptance criteria: PRD 验收标准均映射到实施单元和验证命令。
- Non-goals: 不改旧接口、不迁移表结构、不变更学生关系。
- Affected areas: `axon-chat` Controller、`axon-common` DTO/VO、Service、单元测试。
- Validation surface: `ClassCreateServiceImplTest`、`axon-chat` 编译、必要的本地接口冒烟。
- Open questions: 无阻塞开放问题。

## Assumptions

- 修改接口采用完整快照语义。
- `subjectTeachers=[]` 表示清空当前有效科任老师；`subjectTeachers=null` 为参数错误。
- 当前有效关系判断沿用 `deleted=0 AND status=1 AND effective_end_date IS NULL`。
- 更新关系保留历史，不物理删除旧的当前有效关系。
- 班级已有当前有效学生关系时，禁止修改入学年份、入学月份、学段类别、所选老师年级、起始年级和目标学年；学生关系同时检查 `class_student_entity` 与 `student_class`。
- 抽屉修改接口只允许把班级状态设置为 `ACTIVE` 或 `DISABLED`。
- 修改成功响应固定为 `ClassCreateSaveResultVO`。

## Alternatives Considered

- Recommended: 新增 `GET /create-drawer/{classId}/detail` 和 `POST /create-drawer/update`，由 `ClassCreateService` 统一承载创建、详情和修改逻辑。契约清晰，规则复用成本低。
- Alternative: 扩展旧 `/api/v1/school/class/update`。风险是旧接口语义只覆盖班级基础字段，加入班主任和科任老师会扩大旧契约影响面。
- Alternative: 让 `/create-drawer/save` 通过可选 `classId` 同时创建和修改。风险是新增/修改双语义混在一个 DTO 中，容易误传 `classId` 造成行为不可预期。
- Rejected because: 旧接口和 save 双语义都会增加兼容风险，且不符合现有创建抽屉专用接口族的隔离原则。

## Decision Drivers

- Driver 1: 保存和修改必须使用同一套学校、老师、学段、学科和重复班级名规则。
- Driver 2: 不能破坏旧班级接口和当前创建抽屉保存契约。
- Driver 3: 关系更新必须可回滚、可审计，并尽量保留历史关系。

## Decisions

### ADR-1 - 修改接口使用独立 DTO

- Decision: 新增 `ClassCreateUpdateDTO`，字段包含 `classId` 和创建保存所需字段；不在 `ClassCreateSaveDTO` 上追加 `classId`。
- Drivers: 防止创建接口出现隐式修改语义；方便对 `subjectTeachers` 做更新专用校验。
- Alternatives: 复用保存 DTO 或继承保存 DTO。
- Why chosen: 独立 DTO 更清晰，后续 Swagger 和前端对接成本低。
- Consequences: 会有字段重复，需要通过私有转换/校验方法避免逻辑重复。
- Follow-ups: 执行时可抽取 `ClassCreateCommand` 这类包内私有辅助方法，但不要新增跨层通用抽象。

### ADR-2 - 科任老师更新采用快照替换

- Decision: 修改接口把请求中的 `subjectTeachers` 当作目标快照，先完成全部校验，再关闭被移除或被替换的当前有效关系，保留未变化关系，新增新关系。
- Drivers: 与抽屉表单编辑体验一致；避免残留已删除科任老师；保留历史。
- Alternatives: 增量 add/remove/update 接口；物理删除后全量插入。
- Why chosen: 快照替换对前端最简单，关闭旧关系比物理删除更符合现有有效期模型。
- Consequences: 需要实现关系 diff，测试覆盖要包含清空、替换、未变化三类路径。
- Follow-ups: 若业务确认不需要历史，可再考虑简化为逻辑删除重建，但本计划不采用。

### ADR-3 - 详情 VO 专用于抽屉回显

- Decision: 新增 `ClassCreateDrawerDetailVO` 和 `ClassCreateDrawerSubjectTeacherVO`。
- Drivers: 现有 `ClassCreateSaveResultVO` 只包含摘要，`ClassDetailVO` 不包含班主任和科任老师列表。
- Alternatives: 复用管理页列表 VO 或旧详情 VO。
- Why chosen: 专用 VO 能稳定表达抽屉表单所需字段，不被列表展示字段牵动。
- Consequences: 需要在 Service 中聚合班级、动态年级、班主任、科任老师、学科名和老师名。
- Follow-ups: 若未来更多页面需要同样详情，再评估是否沉淀为管理详情服务。

## Risks

- 修改入学年份或学段可能改变已有学生所在班级的动态年级展示；本方案通过“已有当前有效学生关系时禁止修改年级口径字段”规避。
- 科任老师全量替换若前端漏传字段会影响关系，因此计划要求 `subjectTeachers` 不允许为 `null`。
- 现有 `ClassCreateServiceImpl` 已有较多私有方法，继续追加逻辑可能触发 Sonar 认知复杂度，需要拆分小方法。
- 关系 diff 在事务内执行，必须先校验全部输入，避免半更新。

## Pre-Mortem

- Failure scenario 1: 重复班级名校验没有排除当前班级，导致用户不改班名也无法保存。
- Failure scenario 2: 科任老师更新先关闭旧关系后校验新老师失败，产生部分更新。
- Failure scenario 3: 详情接口未校验当前用户学校，造成跨校班级信息泄露。
- Mitigations: 增加 `excludeClassId` 参数、先校验后写入、统一 `requireClassInOperatorSchool`、已有学生时禁止修改年级口径字段、状态白名单限制为 `ACTIVE/DISABLED`。

## Implementation Units

### U1 - 接口契约与 DTO/VO

- Goal: 定义修改入参和详情回显对象。
- Requirements covered: R1, R2, R3, R10。
- Acceptance criteria covered: 详情字段完整、修改接口接收班级 ID、旧接口不变。
- Depends on: none
- Files:
  - `axon-common/src/main/java/com/xinxi/axon/common/dto/school/ClassCreateUpdateDTO.java`
  - `axon-common/src/main/java/com/xinxi/axon/common/vo/school/ClassCreateDrawerDetailVO.java`
  - `axon-common/src/main/java/com/xinxi/axon/common/vo/school/ClassCreateDrawerSubjectTeacherVO.java`
  - `axon-common/src/main/java/com/xinxi/axon/common/service/school/ClassCreateService.java`
- Forbidden files:
  - `axon-common/src/main/java/com/xinxi/axon/common/dto/school/ClassCreateSaveDTO.java`，除非执行时发现必须加注解或注释，不应改变已有字段语义。
- Approach:
  - `ClassCreateUpdateDTO` 包含 `classId`、`schoolId`、`headTeacherId`、`selectedTeacherGradeId`、`phaseCategory`、`phaseId`、`enrollmentYear`、`enrollmentMonth`、`className`、`classStatus`、`targetAcademicYear`、`subjectTeachers`。
  - `ClassCreateDrawerDetailVO` 包含班级基础字段、动态年级字段、班主任字段和科任老师列表。
  - `ClassCreateService` 新增 `ClassCreateSaveResultVO updateFromDrawer(ClassCreateUpdateDTO dto, Long operatorUserId)` 与 `ClassCreateDrawerDetailVO getDrawerDetail(Long classId, Long operatorUserId)`。
- Tests:
  - DTO/VO 无复杂逻辑，不单独测试。
- Validation:
  - `mvn -pl axon-common -DskipTests compile`
- Rollback signals:
  - 编译出现循环依赖或 VO 字段与现有命名严重冲突。
- Deferred to implementation:
  - 字段 Swagger 文案可按前端最终字段名微调。

### U2 - 详情查询实现

- Goal: 按班级 ID 返回抽屉编辑快照。
- Requirements covered: R1, R2。
- Acceptance criteria covered: 详情成功、跨校/不存在/已删除失败。
- Depends on: U1
- Files:
  - `axon-common/src/main/java/com/xinxi/axon/common/service/school/impl/ClassCreateServiceImpl.java`
  - `axon-chat/src/main/java/com/xinxi/chatservice/controller/school/ClassController.java`
- Forbidden files:
  - `axon-common/src/main/resources/mapper/school/ClassMapper.xml`，除非 Service 层聚合性能不足；本次优先不新增 XML。
- Approach:
  - 在 `ClassCreateServiceImpl` 中新增 `requireClassInOperatorSchool(classId, operatorUserId)`。
  - 复用 `classCreateOptionService.deriveGrade` 推导动态年级，入参来自 `ClassPO.gradeId/enrollmentYear/academicYear`。
  - 查询当前班主任可复用 `classHeadTeacherService.getCurrentByClass`。
  - 查询当前有效科任关系使用 `teacherClassSubjectService.list` 或注入 Mapper，条件为 `classId/deleted=0/status=1/effective_end_date IS NULL`。
  - 批量读取老师和学科名称，组装 `ClassCreateDrawerSubjectTeacherVO`。
  - Controller 新增 `GET /create-drawer/{classId}/detail`，权限 `class:read`。
- Tests:
  - `getDrawerDetail` 成功返回班级、动态年级、班主任、科任老师。
  - 跨学校 operator 查询失败。
  - 已删除班级或不存在班级失败。
- Validation:
  - `mvn -pl axon-common -Dtest=ClassCreateServiceImplTest test`
- Rollback signals:
  - 详情查询需要大量重复列表逻辑，超出抽屉范围时应暂停重新评估是否归入 `ClassManagementService`。
- Deferred to implementation:
  - 若科任老师列表需要展示老师头像、手机号等字段，另行扩展 VO。

### U3 - 修改保存实现

- Goal: 复用创建保存规则完成班级抽屉编辑。
- Requirements covered: R3, R4, R5, R6, R7, R8, R9, R10。
- Acceptance criteria covered: 修改成功、重复校验、科任老师校验、清空科任老师、事务回滚。
- Depends on: U1
- Files:
  - `axon-common/src/main/java/com/xinxi/axon/common/service/school/impl/ClassCreateServiceImpl.java`
  - `axon-chat/src/main/java/com/xinxi/chatservice/controller/school/ClassController.java`
- Forbidden files:
  - `axon-common/src/main/java/com/xinxi/axon/common/service/school/impl/ClassServiceImpl.java`
  - `axon-common/src/main/java/com/xinxi/axon/common/service/user/impl/TeacherClassSubjectServiceImpl.java`，除非执行时决定把关系 diff 下沉为专用方法。
- Approach:
  - `updateFromDrawer` 加 `@Transactional(rollbackFor = Exception.class)`。
  - 先校验 `classId`、`subjectTeachers != null`、学校边界、创建保存必填项。
  - 校验 `classStatus` 只允许为空、`ACTIVE` 或 `DISABLED`；为空时沿用现有班级状态或默认 `ACTIVE`，不允许写入毕业、归档等状态。
  - 将更新 DTO 转为内部命令或保存 DTO 形态，复用 `deriveGrade`、`requireEffectiveTeacher`、`resolveAllowedSubjectIds`、`validateSubjectTeacher`。
  - 查询当前班级是否存在当前有效学生关系：`class_student_entity` 与 `student_class` 均按 `classId/deleted=0/status=1/effective_end_date IS NULL` 判断；存在学生时，若入学年份、入学月份、学段类别、所选老师年级、推导起始年级或目标学年发生变化，则返回业务错误。
  - 修改 `ensureClassNameNotDuplicated` 支持 `excludeClassId`，创建调用传 `null`，修改调用传当前班级 ID。
  - 校验全部通过后更新 `class`：`class_name`、`grade_id`、`enrollment_year`、`academic_year`、`class_status`、固定 `semester` 仍沿用秋季。
  - 班主任调用 `classHeadTeacherService.bindOrChangeHeadTeacher`，保持当前关系关闭与日志逻辑一致。
  - 科任老师按目标快照 diff：同 `subjectId + teacherId` 保留；同 `subjectId` 换老师则关闭旧关系并插入新关系；请求未包含的旧关系关闭；新增学科插入新关系。
  - 返回 `ClassCreateSaveResultVO`，`subjectTeacherCount` 为更新后当前有效科任老师数量。
  - Controller 新增 `POST /create-drawer/update`，权限 `class:update`。
- Tests:
  - 更新成功并回传动态年级和科任老师数量。
  - 重复班级名排除自身。
  - 与其他班级冲突时失败。
  - `subjectTeachers=null` 失败，`subjectTeachers=[]` 关闭全部当前有效关系。
  - 有当前有效学生关系时，修改入学年份、入学月份、学段类别、所选老师年级、推导起始年级或目标学年失败。
  - 无当前有效学生关系时，允许修改上述年级口径字段。
  - `classStatus` 为 `ACTIVE/DISABLED` 成功，其他值失败。
  - 老师校验失败时不更新班级、不关闭旧科任关系。
  - 替换科任老师关闭旧关系并插入新关系。
- Validation:
  - `mvn -pl axon-common -Dtest=ClassCreateServiceImplTest test`
  - `mvn -pl axon-chat -am -DskipTests compile`
- Rollback signals:
  - 任一失败测试显示部分更新；立即回滚 U3 并先拆出校验阶段。
- Deferred to implementation:
  - 是否记录“班级基础信息修改”操作日志，本计划不强制新增；若已有班级操作日志规范要求，可在实施时补充。

### U4 - 验证、文档和冒烟协作

- Goal: 给出可复现验证证据和接口调用样例。
- Requirements covered: 全部。
- Acceptance criteria covered: 全部。
- Depends on: U2, U3
- Files:
  - `docs/00-process/archive/2026-06/class-create-drawer-update-detail/2026-06-16-class-create-drawer-update-detail-api.md`
  - `docs/00-process/archive/2026-06/class-create-drawer-update-detail/2026-06-16-class-create-drawer-update-detail-validation-report.md`
  - `docs/00-process/archive/2026-06/class-create-drawer-update-detail/2026-06-16-class-create-drawer-update-detail-执行方案.md`
- Forbidden files:
  - 仓库根目录文档。
- Approach:
  - API 文档记录请求/响应样例、错误场景和权限。
  - 验证报告记录 Maven 命令输出摘要。
  - 如用户要求自动本地冒烟，再按 AGENTS 本地冒烟规则由用户提供 token 和重启确认。
- Tests:
  - 不新增测试代码，记录 U2/U3 的测试结果。
- Validation:
  - `mvn -pl axon-common -Dtest=ClassCreateServiceImplTest test`
  - `mvn -pl axon-chat -am -DskipTests compile`
  - 可选接口冒烟：
    - `GET /api/v1/school/class/create-drawer/{classId}/detail`
    - `POST /api/v1/school/class/create-drawer/update`
- Rollback signals:
  - 文档样例与实际 Swagger 字段不一致时，以代码契约修正文档。
- Deferred to implementation:
  - 已归档到 `docs/00-process/archive/2026-06/class-create-drawer-update-detail/`。

## Validation Plan

- Unit:
  - `mvn -pl axon-common -Dtest=ClassCreateServiceImplTest test`
- Integration:
  - `mvn -pl axon-chat -am -DskipTests compile`
- User flow:
  - 打开编辑抽屉前调用详情接口。
  - 修改班主任、班名、科任老师后调用更新接口。
  - 刷新管理页确认列表字段变化。
- Data / operations:
  - 校验 `class` 当前记录更新。
  - 校验 `class_head_teacher` 当前关系唯一。
  - 校验 `teacher_class_subject` 当前有效关系与请求快照一致，历史关系保留。
  - 校验已有学生班级修改年级口径字段被拒绝；学生关系检查覆盖 `class_student_entity` 与 `student_class`。
- Observability:
  - Controller 异常日志应包含 dto 或 classId。
  - 业务异常返回明确参数错误或权限错误信息。

## Rollback / Recovery

- 代码回滚范围为 U1-U3 新增 DTO/VO、Service 方法、Controller 入口和测试。
- 若上线后修改接口语义有争议，可临时下线前端入口，保留详情接口只读能力。
- 若科任老师关系更新异常，使用 `teacher_class_subject` 当前有效关系条件恢复：关闭错误新增关系，重新开启或补插正确关系；执行前必须由用户确认 SQL。

## Plan Self-Review

- Placeholder scan: 无 `TBD`、`TODO` 占位。
- Consistency check: 接口路径、权限、DTO/VO、Service 单元一致。
- Scope check: 未扩展旧接口、未引入 SQL 迁移、未改学生关系。
- Acceptance coverage: PRD 验收标准均覆盖到 U2/U3/U4。
- Validation gaps: 实际接口冒烟依赖用户提供 token 和确认服务重启。
- Alternatives and ADR check: 已记录 3 个关键决策。
- High-risk pre-mortem check: 已覆盖跨校读取、重复校验、部分更新、已有学生年级口径变更和状态越权切换风险。

## Handoff

已按 U1 到 U4 串行完成执行。U2 和 U3 均落在 `ClassCreateServiceImpl` 与 `ClassController`，最终未并行拆分写入。实现后验证通过，执行证据已归档到 `docs/00-process/archive/2026-06/class-create-drawer-update-detail/`。

## Completion

- 完成时间: 2026-06-16。
- 新增接口:
  - `GET /api/v1/school/class/create-drawer/{classId}/detail`
  - `POST /api/v1/school/class/create-drawer/update`
- 新增/扩展核心文件:
  - `axon-common/src/main/java/com/xinxi/axon/common/dto/school/ClassCreateUpdateDTO.java`
  - `axon-common/src/main/java/com/xinxi/axon/common/vo/school/ClassCreateDrawerDetailVO.java`
  - `axon-common/src/main/java/com/xinxi/axon/common/vo/school/ClassCreateDrawerSubjectTeacherVO.java`
  - `axon-common/src/main/java/com/xinxi/axon/common/service/school/ClassCreateService.java`
  - `axon-common/src/main/java/com/xinxi/axon/common/service/school/impl/ClassCreateServiceImpl.java`
  - `axon-chat/src/main/java/com/xinxi/chatservice/controller/school/ClassController.java`
  - `axon-common/src/test/java/com/xinxi/axon/common/service/school/ClassCreateServiceImplTest.java`
- 验证:
  - `mvn -pl axon-common -Dtest=ClassCreateServiceImplTest test`: `Tests run: 13, Failures: 0, Errors: 0, Skipped: 0`。
  - `mvn -pl axon-chat -am -DskipTests compile`: `BUILD SUCCESS`。
- Review: `APPROVE`。
- Final gate: `docs/ae/gates/20260616T085618Z-work-final.json`。
