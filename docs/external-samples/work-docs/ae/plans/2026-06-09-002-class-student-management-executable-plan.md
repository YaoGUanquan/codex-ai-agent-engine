---
type: plan
status: reviewed
date: 2026-06-09
title: class-student-management-executable-plan
origin: docs/ae/prds/2026-06-09-class-student-management-gap-prd.md
---

# Plan: 班级与学生管理可执行落地计划

## Source

- PRD: `docs/ae/prds/2026-06-09-class-student-management-gap-prd.md`
- 总方案: `docs/ae/plans/2026-06-09-001-class-management-head-teacher-grade-log-plan.md`
- 现状分析: `docs/03-analysis/2026-06-09-班级模型接口与扩展能力分析.md`
- 需求文档: `D:\Downloads\20260609 学生管理与班级管理需求文档.docx`

## Scope

本计划把总方案拆成可以按顺序执行、逐单元验证的工作包。范围包括：

- 班级状态、动态当前年级、班主任、科任老师/学生关系有效期、班级操作日志、年度升学日志。
- 学生管理列表、详情、操作历史。
- 新学生导入接口族，包含上传解析、异常修正、确认导入、导入已修正数据。
- 导入成功后创建学生 `users`、`user_profile`、`sys_user_role`，绑定 `student.user_id`。
- 导入和补录支持 0 到多个家长手机号，创建/复用家长账号，赋予 `STUDENT_PARENT`，写 `parent_student`。
- 默认密码状态只记录，不实现学生登录时的家长手机号验证与强制改密。

不包含：

- 改造旧 `/api/v1/excel/import/school-user`。
- 开放学生登录。
- 家长端完整菜单/页面权限体系。
- 跨学段自动建班、拆班、合班。

## Readiness

- Goal: 让班级管理、学生管理和新学生导入具备可实现、可验证、可回滚的执行路径。
- Acceptance criteria: PRD 中所有班级状态、学生列表详情、导入账号、家长绑定、默认密码记录要求均映射到实施单元和验证步骤。
- Non-goals: 见 Scope。
- Affected areas: `axon-common` 实体/Mapper/Service/枚举/DTO/VO、`axon-chat` Controller、`docs/06-sql`、`docs/04-api`、测试目录。
- Validation surface: 单元测试、模块编译、SQL 结构校验、本地接口冒烟、导入任务行级数据校验。
- Open questions:
  - 学校编码和班级编码最终来源字段仍需产品/数据确认；本计划先通过配置和服务适配保留扩展点。
  - 家长手机号是否允许跨学生复用仍为产品开放点；当前实现按同校手机号复用家长账号，并用 `parent_student` 表达多学生关系。
  - 重复学生合并是否自动执行仍开放；当前只要求返回候选和可处理状态。

## Assumptions

- 当前 `student.user_id` 已在 `StudentPO` 中存在；迁移只需验证生产库是否已有列，并按需补索引。
- `parent_student.parent_id` 与 `parent_student.student_id` 均指向 `users.id`。
- 当前密码加密继续使用 `PasswordUtil.encrypt(...)`。
- 当前登录入口仍拒绝 `STUDENT`，本期不改变。
- `sys_role.role_type` 是整数，新增 `STUDENT_PARENT` 角色沿用现有种子口径 `role_type=1`。

## Alternatives Considered

- Recommended: 新学生导入编排独立账号开通服务和家长绑定服务。
  - Fit: 复用现有 `users/user_profile/parent_student/sys_role`，同时不污染旧用户导入接口。
  - Risk: 事务更复杂，需要明确导入行状态和幂等。
- Alternative: 修改旧 `/api/v1/excel/import/school-user`，让学生导入复用旧用户批量导入。
  - Rejected because: 用户明确要求新接口，不改旧接口；旧接口无法自然承载多阶段异常修正和家长绑定。
- Alternative: 家长手机号只保存在学生扩展字段，不创建家长账号。
  - Rejected because: 不能支撑“学生家长”角色登录和基于绑定关系查看学生信息。

## Decision Drivers

- Driver 1: 不破坏旧导入接口兼容性。
- Driver 2: 所有新增业务写入都能用数据库状态和日志追踪。
- Driver 3: 导入、账号、家长绑定必须可分步测试、可局部回滚。

## Decisions

### ADR-1 - 导入编排与账号开通解耦

- Decision: `StudentImportWorkflowService` 只负责导入任务、行级状态和编排；学生账号创建交给 `StudentAccountProvisionService`。
- Drivers: 降低导入服务复杂度；账号生成、默认密码、角色绑定可独立测试。
- Alternatives: 在导入确认方法内直接写所有表。
- Why chosen: 账号开通规则会被后续手动创建/补绑定复用。
- Consequences: 需要明确服务间事务边界和幂等键。
- Follow-ups: 后续开放学生登录时复用默认密码标记。

### ADR-2 - 家长绑定以 `parent_student` 为唯一关系源

- Decision: 家长账号与学生账号通过 `parent_student` 建立关系，权限判断只认有效关系。
- Drivers: 当前表已支持多对多；能支撑多个家长、一个家长多个学生。
- Alternatives: 在 `user_profile` 家长字段中内嵌学生列表。
- Why chosen: 结构化关系更适合权限校验和补录/解绑。
- Consequences: 学生必须先有 `users.id` 才能绑定家长。
- Follow-ups: 家长端完整菜单权限另行细化。

### ADR-3 - 分阶段验证

- Decision: 每个实施单元必须先有单元测试或 SQL 校验，再进入下一个依赖单元。
- Drivers: 涉及迁移、权限、导入幂等和跨模块 API。
- Alternatives: 一次性完成后统一测试。
- Why chosen: 失败定位更快，便于回滚。
- Consequences: 初期测试文件较多，但风险更可控。
- Follow-ups: 冒烟测试需要用户提供本地 token 和已执行 SQL 的环境。

## Risks

- 数据迁移重复执行导致重复列、重复索引或重复角色。
- 账号生成在并发导入下冲突，导致同一个学生行部分成功。
- 家长手机号复用规则不清晰，导致错误合并家长账号。
- 默认密码配置泄露到日志。
- 班级动态年级筛选如果在内存中过滤，会导致分页 total 错误。

## Pre-Mortem

- Failure scenario 1: SQL 迁移在生产已有 `student.user_id` 或索引时失败。
  - Mitigation: 迁移脚本先做结构检查；真实执行前输出待执行 DDL；回滚前确认新增表为空。
- Failure scenario 2: 导入确认创建了学生账号但家长绑定失败，行状态无法追踪。
  - Mitigation: 同一行导入使用事务；失败时整行回滚并写 `FAILED/PARENT_FAILED` 可读错误。
- Failure scenario 3: 家长接口只按手机号查学生，绕过 `parent_student`。
  - Mitigation: `canParentReadStudent(parentUserId, studentEntityId)` 单元测试覆盖未绑定拒绝。

## Implementation Units

### U0 - 工作区与基线检查

- Goal: 确认当前工作区、分支、用户改动和基础命令可用。
- Requirements covered: 执行安全。
- Acceptance criteria covered: 无。
- Depends on: none
- Files:
  - Read: `pom.xml`
  - Read: `axon-common/pom.xml`
  - Read: `axon-chat/pom.xml`
- Forbidden files:
  - 不修改任何业务文件。
- Execution steps:
  1. 运行 `git status --short --untracked-files=all`，记录已有用户改动。
  2. 运行 `mvn -version`，确认 Maven 和 Java 版本。
  3. 运行 `mvn -pl axon-common -am -DskipTests compile`，确认基线可编译。
- Tests:
  - 无新增测试。
- Validation:
  - `git status` 输出中现有用户改动不被回滚。
  - `mvn -version` 显示 Java 21 或项目可接受版本。
  - `axon-common` 基线编译成功；若失败，先记录为环境/基线问题。
- Rollback signals:
  - 基线编译失败且与本次任务无关时，暂停编码，只记录失败输出。
- Deferred to implementation:
  - 是否创建新分支由执行者按项目协作规则决定。

### U1 - 数据库迁移脚本

- Goal: 写出全部新增表、字段、索引和角色种子。
- Requirements covered: 班级状态、日志、导入任务、学生账号默认密码状态、家长角色。
- Acceptance criteria covered: SQL verification 全部通过。
- Depends on: U0
- Files:
  - Create: `docs/06-sql/migrations/2026-06-09-class-head-teacher-and-operation-log.sql`
  - Create: `docs/06-sql/migrations/2026-06-09-student-management-import-workflow.sql`
- Forbidden files:
  - 不修改旧 `sql/` 根目录。
  - 不修改生产数据库。
- Execution steps:
  1. 在班级迁移脚本中新增 `class_head_teacher`、`class_operation_log`、`class_promotion_run`。
  2. 改造 `class`，新增 `class_status/graduated_at/promotion_exception_message`。
  3. 改造 `grade`，新增 `grade_progression_order`。
  4. 改造 `student_class/class_student_entity/teacher_class_subject`，新增关系有效期、状态和必要索引。
  5. 在学生迁移脚本中新增 `student_operation_log/student_import_task/student_import_row`。
  6. 对 `users` 增加 `default_password_flag/password_reset_required`，脚本必须先检查列是否存在。
  7. 验证 `student.user_id` 已存在；缺列才补列，缺索引才补 `idx_student_user_id`。
  8. 幂等写入 `sys_role` 的 `STUDENT_PARENT/学生家长`，`role_type=1`。
  9. 增加执行后验证 SQL 块。
- Tests:
  - SQL 文件静态检查：表名、索引名、枚举值与计划一致。
- Validation:
  - 用户执行 SQL 后运行：
    ```sql
    SHOW TABLES LIKE 'class_head_teacher';
    SHOW TABLES LIKE 'class_operation_log';
    SHOW TABLES LIKE 'class_promotion_run';
    SHOW TABLES LIKE 'student_operation_log';
    SHOW TABLES LIKE 'student_import_task';
    SHOW TABLES LIKE 'student_import_row';
    SHOW COLUMNS FROM class LIKE 'class_status';
    SHOW COLUMNS FROM users LIKE 'default_password_flag';
    SHOW COLUMNS FROM users LIKE 'password_reset_required';
    SHOW COLUMNS FROM student LIKE 'user_id';
    SELECT role_code, role_name FROM sys_role WHERE role_code = 'STUDENT_PARENT' AND deleted = 0;
    ```
- Rollback signals:
  - 新增表为空时可删除新增表。
  - 若已有导入数据，不删除 `users` 默认密码字段、`student.user_id` 或 `STUDENT_PARENT` 角色。
- Deferred to implementation:
  - 若项目已有迁移框架，按框架改写 idempotent guard。

### U2 - 枚举、配置和常量

- Goal: 建立后续服务可复用的稳定枚举和配置入口。
- Requirements covered: 班级状态、导入行状态、异常类型、学生家长角色、默认密码配置。
- Acceptance criteria covered: 编译通过，角色不会误归入教师及以上。
- Depends on: U1
- Files:
  - Create: `axon-common/src/main/java/com/xinxi/axon/common/enums/ClassStatusEnum.java`
  - Create: `axon-common/src/main/java/com/xinxi/axon/common/enums/ClassGradeProgressionStatusEnum.java`
  - Create: `axon-common/src/main/java/com/xinxi/axon/common/enums/StudentImportTaskStatusEnum.java`
  - Create: `axon-common/src/main/java/com/xinxi/axon/common/enums/StudentImportRowStatusEnum.java`
  - Create: `axon-common/src/main/java/com/xinxi/axon/common/enums/StudentImportExceptionTypeEnum.java`
  - Modify: `axon-common/src/main/java/com/xinxi/axon/common/enums/RoleCodeEnum.java`
  - Create: `axon-common/src/main/java/com/xinxi/axon/common/config/StudentImportProperties.java`
- Forbidden files:
  - 不把 `STUDENT_PARENT` 加入 `getTeacherAndAboveCodes()`。
  - 不把默认密码写成日志输出。
- Execution steps:
  1. 新增班级状态和动态年级状态枚举。
  2. 新增导入任务状态、导入行状态、异常类型枚举。
  3. 在 `RoleCodeEnum` 增加 `STUDENT_PARENT`。
  4. 新增 `StudentImportProperties`，配置项包括 `default-password`、`account.max-username-length`、`account.school-code-source`。
  5. 编写枚举单元测试，断言 `STUDENT_PARENT` 不是教师及以上角色。
- Tests:
  - Create: `axon-common/src/test/java/com/xinxi/axon/common/enums/RoleCodeEnumTest.java`
  - Create: `axon-common/src/test/java/com/xinxi/axon/common/config/StudentImportPropertiesTest.java`
- Validation:
  - `mvn -pl axon-common -Dtest=RoleCodeEnumTest,StudentImportPropertiesTest test`
- Rollback signals:
  - 编译失败或角色判定错误时先回滚 U2，不进入 Service。
- Deferred to implementation:
  - 家长角色具体权限种子可随家长端页面另行补充。

### U3 - 实体、DTO、VO 和 Mapper 壳

- Goal: 补齐数据库结构到 Java 类型和接口契约的映射。
- Requirements covered: 学生详情、导入任务、导入行、多家长、账号绑定状态。
- Acceptance criteria covered: DTO/VO 可被 Controller 和 Service 使用，编译通过。
- Depends on: U1, U2
- Files:
  - Create: `axon-common/src/main/java/com/xinxi/axon/common/entity/school/ClassHeadTeacherPO.java`
  - Create: `axon-common/src/main/java/com/xinxi/axon/common/entity/school/ClassOperationLogPO.java`
  - Create: `axon-common/src/main/java/com/xinxi/axon/common/entity/school/ClassPromotionRunPO.java`
  - Create: `axon-common/src/main/java/com/xinxi/axon/common/entity/student/StudentOperationLogPO.java`
  - Create: `axon-common/src/main/java/com/xinxi/axon/common/entity/student/StudentImportTaskPO.java`
  - Create: `axon-common/src/main/java/com/xinxi/axon/common/entity/student/StudentImportRowPO.java`
  - Create: `axon-common/src/main/java/com/xinxi/axon/common/mapper/student/StudentImportTaskMapper.java`
  - Create: `axon-common/src/main/java/com/xinxi/axon/common/mapper/student/StudentImportRowMapper.java`
  - Create: `axon-common/src/main/java/com/xinxi/axon/common/dto/student/StudentParentContactDTO.java`
  - Create: `axon-common/src/main/java/com/xinxi/axon/common/dto/student/StudentAccountProvisionCommand.java`
  - Create: `axon-common/src/main/java/com/xinxi/axon/common/dto/student/StudentParentSaveDTO.java`
  - Create: `axon-common/src/main/java/com/xinxi/axon/common/vo/student/StudentParentVO.java`
  - Create: `axon-common/src/main/java/com/xinxi/axon/common/vo/student/StudentAccountProvisionResultVO.java`
- Forbidden files:
  - 不在 Controller 或 Service 内部临时定义长期 DTO/VO。
- Execution steps:
  1. 为新增表创建 PO 和 Mapper。
  2. 为学生导入、账号开通、家长联系人创建 DTO/VO。
  3. `StudentImportRowPO` 必须包含 `parentContactsJson/generatedUsername/importedUserId/parentBindingStatus`。
  4. `StudentManagementDetailVO` 增加 `defaultPasswordFlag/passwordResetRequired/parentBindingStatus/parentSummaries`。
  5. 编译 `axon-common`。
- Tests:
  - 类型层不强制单测，后续 Service 测试覆盖字段。
- Validation:
  - `mvn -pl axon-common -am -DskipTests compile`
- Rollback signals:
  - DTO/VO 与后续服务命名不一致导致编译失败，先修类型，不改业务逻辑。
- Deferred to implementation:
  - Swagger 示例可在 U11 补齐。

### U4 - 班级动态年级、状态和可选班级规则

- Goal: 让班级列表/详情和新业务可选范围使用同一套动态年级与状态规则。
- Requirements covered: 班级状态筛选、毕业后不可选、动态当前年级不可编辑。
- Acceptance criteria covered: 班级分页、详情、可选班级过滤准确。
- Depends on: U1, U2, U3
- Files:
  - Create: `axon-common/src/main/java/com/xinxi/axon/common/service/school/ClassGradeProgressionService.java`
  - Create: `axon-common/src/main/java/com/xinxi/axon/common/service/school/impl/ClassGradeProgressionServiceImpl.java`
  - Create: `axon-common/src/main/java/com/xinxi/axon/common/service/school/SchoolAcademicCalendarService.java`
  - Create: `axon-common/src/main/java/com/xinxi/axon/common/service/school/impl/SchoolAcademicCalendarServiceImpl.java`
  - Modify: `axon-common/src/main/java/com/xinxi/axon/common/service/school/impl/ClassServiceImpl.java`
  - Modify: `axon-common/src/main/resources/mapper/school/ClassMapper.xml`
  - Modify: `axon-common/src/main/java/com/xinxi/axon/common/vo/school/ClassVO.java`
  - Modify: `axon-common/src/main/java/com/xinxi/axon/common/vo/school/ClassDetailVO.java`
- Forbidden files:
  - 不在分页后按 `currentGradeId` 内存过滤。
  - 不使用 `grade.display_order` 做升学序列。
- Execution steps:
  1. 写 `ClassGradeProgressionServiceImplTest` 覆盖起始年级、缺失序列、毕业状态。
  2. 实现学校学年日历默认 8 月 15 日。
  3. 实现动态年级解析，使用 `grade_progression_order`。
  4. 改造班级分页 SQL，SQL 层派生并筛选当前年级。
  5. 增加 `isClassSelectableForNewBusiness`。
  6. 编译并运行测试。
- Tests:
  - Create: `axon-common/src/test/java/com/xinxi/axon/common/service/school/ClassGradeProgressionServiceImplTest.java`
- Validation:
  - `mvn -pl axon-common -Dtest=ClassGradeProgressionServiceImplTest test`
  - `mvn -pl axon-common -am -DskipTests compile`
- Rollback signals:
  - 分页 total 与 records 不一致，必须回退 ClassMapper 改造。
- Deferred to implementation:
  - 学校级自定义日期 UI 不在本期。

### U5 - 班主任、任课老师和班级日志

- Goal: 班主任独立建模，任课老师保持原语义，所有变更写班级日志。
- Requirements covered: 班主任、科任老师校验、班级操作历史。
- Acceptance criteria covered: 一个班当前一个班主任，一个老师可任多个班主任；日志可分页展示。
- Depends on: U1, U2, U3, U4
- Files:
  - Create: `axon-common/src/main/java/com/xinxi/axon/common/service/school/ClassHeadTeacherService.java`
  - Create: `axon-common/src/main/java/com/xinxi/axon/common/service/school/impl/ClassHeadTeacherServiceImpl.java`
  - Create: `axon-common/src/main/java/com/xinxi/axon/common/service/school/ClassOperationLogService.java`
  - Create: `axon-common/src/main/java/com/xinxi/axon/common/service/school/impl/ClassOperationLogServiceImpl.java`
  - Modify: `axon-common/src/main/java/com/xinxi/axon/common/service/user/impl/TeacherClassSubjectServiceImpl.java`
  - Modify: `axon-chat/src/main/java/com/xinxi/chatservice/controller/school/ClassController.java`
- Forbidden files:
  - 不把班主任塞进 `teacher_class_subject.subject_id`。
  - 不吞掉日志写入异常。
- Execution steps:
  1. 写班主任绑定/变更/解绑测试。
  2. 写日志幂等和展示文案测试。
  3. 实现班主任服务，校验同校、有效用户、教师及以上角色。
  4. 任课老师保存补齐学校、状态、学段/科目权限校验。
  5. Controller 增加班主任和日志接口。
  6. 编译并运行测试。
- Tests:
  - Create: `axon-common/src/test/java/com/xinxi/axon/common/service/school/ClassHeadTeacherServiceImplTest.java`
  - Create: `axon-common/src/test/java/com/xinxi/axon/common/service/school/ClassOperationLogServiceImplTest.java`
- Validation:
  - `mvn -pl axon-common -Dtest=ClassHeadTeacherServiceImplTest,ClassOperationLogServiceImplTest test`
  - `mvn -pl axon-chat -am -DskipTests compile`
- Rollback signals:
  - 绑定班主任影响任课老师查询结果时回滚 U5。
- Deferred to implementation:
  - 日志展示文案可先覆盖核心操作，后续再细化多语言。

### U6 - 年度升学日志物化

- Goal: 生成班级、班主任、任课老师、学生随班升学日志，并对最高年级自动毕业。
- Requirements covered: 升学日志、毕业状态流转。
- Acceptance criteria covered: 重复生成幂等；毕业班不再可选。
- Depends on: U4, U5
- Files:
  - Create: `axon-common/src/main/java/com/xinxi/axon/common/service/school/ClassPromotionMaterializationService.java`
  - Create: `axon-common/src/main/java/com/xinxi/axon/common/service/school/impl/ClassPromotionMaterializationServiceImpl.java`
  - Modify: `axon-chat/src/main/java/com/xinxi/chatservice/controller/school/ClassController.java`
- Forbidden files:
  - 不修改 `class.grade_id` 表示当前年级。
- Execution steps:
  1. 写升学 dryRun、正式执行、重复执行测试。
  2. 以 `promotionDate` 当日有效关系生成快照。
  3. 对最高行政年级设置 `class_status=GRADUATED`。
  4. 写 `class_promotion_run` 统计。
  5. 增加 Controller endpoint。
- Tests:
  - Create: `axon-common/src/test/java/com/xinxi/axon/common/service/school/ClassPromotionMaterializationServiceImplTest.java`
- Validation:
  - `mvn -pl axon-common -Dtest=ClassPromotionMaterializationServiceImplTest test`
- Rollback signals:
  - 重复执行产生重复日志，停止发布并修复 `event_key` 或唯一键。
- Deferred to implementation:
  - 自动定时任务可后置，先提供手动触发接口。

### U7 - 学生管理列表、详情和操作历史

- Goal: 提供学生管理列表、详情和学生操作历史。
- Requirements covered: 学生筛选、搜索、详情、历史、账号绑定状态、家长摘要。
- Acceptance criteria covered: 学生详情按时间倒序展示历史。
- Depends on: U3, U4, U5
- Files:
  - Create: `axon-common/src/main/java/com/xinxi/axon/common/service/student/StudentManagementService.java`
  - Create: `axon-common/src/main/java/com/xinxi/axon/common/service/student/impl/StudentManagementServiceImpl.java`
  - Create: `axon-common/src/main/java/com/xinxi/axon/common/service/student/StudentOperationLogService.java`
  - Create: `axon-common/src/main/java/com/xinxi/axon/common/service/student/impl/StudentOperationLogServiceImpl.java`
  - Modify: `axon-common/src/main/java/com/xinxi/axon/common/service/student/impl/StudentEntityServiceImpl.java`
  - Create: `axon-chat/src/main/java/com/xinxi/chatservice/controller/student/StudentManagementController.java`
- Forbidden files:
  - 不用 `student.grade_level` 作为当前年级筛选事实源。
- Execution steps:
  1. 写学生列表筛选和关键词测试。
  2. 写详情历史倒序测试。
  3. 实现学生操作日志服务。
  4. 改造学生实体增改绑账号时写历史。
  5. 增加列表和详情 Controller。
- Tests:
  - Create: `axon-common/src/test/java/com/xinxi/axon/common/service/student/StudentManagementServiceImplTest.java`
- Validation:
  - `mvn -pl axon-common -Dtest=StudentManagementServiceImplTest test`
  - `mvn -pl axon-chat -am -DskipTests compile`
- Rollback signals:
  - 新列表查询影响旧 `StudentEntityController` 行为时回滚 Controller 暴露，不回滚日志表。
- Deferred to implementation:
  - 复杂失败明细文件下载后置。

### U8 - 学生账号开通服务

- Goal: 独立创建学生账号、档案、角色和 `student.user_id` 绑定。
- Requirements covered: 导入创建 `users/user_profile/sys_user_role`、账号 18 位内唯一、默认密码状态。
- Acceptance criteria covered: 导入成功学生必有账号和档案。
- Depends on: U2, U3, U7
- Files:
  - Create: `axon-common/src/main/java/com/xinxi/axon/common/service/student/StudentAccountProvisionService.java`
  - Create: `axon-common/src/main/java/com/xinxi/axon/common/service/student/impl/StudentAccountProvisionServiceImpl.java`
  - Modify: `axon-common/src/main/java/com/xinxi/axon/common/service/student/impl/StudentEntityServiceImpl.java`
- Forbidden files:
  - 不修改 `/api/v1/excel/import/school-user` 相关实现。
  - 不开放学生登录。
- Execution steps:
  1. 写账号生成长度和冲突重试测试。
  2. 写默认密码加密和标记测试。
  3. 写 `users/user_profile/sys_user_role/student.user_id` 全链路测试。
  4. 实现账号生成器，最终长度检查必须在服务层执行。
  5. 实现账号、档案、角色、学生实体绑定事务。
  6. 对无法生成账号的情况抛出可识别业务错误。
- Tests:
  - Create: `axon-common/src/test/java/com/xinxi/axon/common/service/student/StudentAccountProvisionServiceImplTest.java`
- Validation:
  - `mvn -pl axon-common -Dtest=StudentAccountProvisionServiceImplTest test`
- Rollback signals:
  - 账号冲突导致部分表写入，必须回滚 U8 事务实现。
- Deferred to implementation:
  - 学生首次登录改密流程后续单独计划。

### U9 - 家长绑定服务

- Goal: 创建或复用家长账号，并建立有效 `parent_student` 关系。
- Requirements covered: 多个家长手机号、家长手机号为空不阻断、补录、`STUDENT_PARENT`。
- Acceptance criteria covered: 多家长、多学生关系可查，越权拒绝。
- Depends on: U2, U3, U8
- Files:
  - Create: `axon-common/src/main/java/com/xinxi/axon/common/service/student/StudentParentBindingService.java`
  - Create: `axon-common/src/main/java/com/xinxi/axon/common/service/student/impl/StudentParentBindingServiceImpl.java`
  - Modify: `axon-common/src/main/java/com/xinxi/axon/common/service/user/ParentStudentService.java`
  - Modify: `axon-common/src/main/java/com/xinxi/axon/common/service/user/impl/ParentStudentServiceImpl.java`
- Forbidden files:
  - 不按手机号直接授权查看学生。
- Execution steps:
  1. 写空家长联系人测试，结果为 `PARENT_MISSING`。
  2. 写多个家长联系人测试。
  3. 写同校手机号复用家长账号测试。
  4. 写跨校绑定拒绝测试。
  5. 写 `canParentReadStudent` 未绑定拒绝测试。
  6. 实现创建/复用家长 `users`、家长 `user_profile`、`STUDENT_PARENT` 角色和 `parent_student`。
- Tests:
  - Create: `axon-common/src/test/java/com/xinxi/axon/common/service/student/StudentParentBindingServiceImplTest.java`
- Validation:
  - `mvn -pl axon-common -Dtest=StudentParentBindingServiceImplTest test`
- Rollback signals:
  - `parent_student.student_id` 写成 `student.id` 时测试必须失败，修正前不得继续。
- Deferred to implementation:
  - 家长完整可见字段清单后续随家长端页面补充。

### U10 - 新学生导入工作流

- Goal: 实现上传解析、任务查询、行修正、确认导入和导入已修正数据。
- Requirements covered: 新导入接口族、异常行处理、账号开通、家长绑定。
- Acceptance criteria covered: 新导入不改旧接口；成功行创建账号和家长关系。
- Depends on: U7, U8, U9
- Files:
  - Create: `axon-common/src/main/java/com/xinxi/axon/common/service/student/StudentImportWorkflowService.java`
  - Create: `axon-common/src/main/java/com/xinxi/axon/common/service/student/impl/StudentImportWorkflowServiceImpl.java`
  - Create: `axon-chat/src/main/java/com/xinxi/chatservice/controller/student/StudentImportController.java`
  - Modify: `axon-chat/src/main/java/com/xinxi/chatservice/controller/common/ExcelController.java` only if template download needs new student import template route; do not alter old import behavior.
- Forbidden files:
  - 不修改旧 `/api/v1/excel/import/school-user` 入库逻辑。
  - 不把上传接口做成同步全部入库。
- Execution steps:
  1. 写上传解析测试：文件类型、5000 行限制、空家长联系人可导入。
  2. 写行修正测试：班级不存在、学生手机号错误、家长手机号错误、重复学生。
  3. 写确认导入测试：只导入 `IMPORTABLE` 行，`PENDING` 保持不变。
  4. 写导入已修正数据测试：跳过 `IMPORTED/IGNORED`。
  5. 实现 `upload`、`task detail`、`rows/page`、`fix`、`confirm`、`import-fixed`。
  6. 确认导入逐行调用 U8 和 U9，成功后写 `student_operation_log`。
  7. 导入结果回写 `generatedUsername/importedUserId/parentBindingStatus`。
- Tests:
  - Create: `axon-common/src/test/java/com/xinxi/axon/common/service/student/StudentImportWorkflowServiceImplTest.java`
  - Create: `axon-chat/src/test/java/com/xinxi/chatservice/controller/student/StudentImportControllerTest.java`
- Validation:
  - `mvn -pl axon-common -Dtest=StudentImportWorkflowServiceImplTest test`
  - `mvn -pl axon-chat -Dtest=StudentImportControllerTest test`
- Rollback signals:
  - 旧导入接口行为变化，立即回滚 U10 中对旧 Controller 的任何改动。
- Deferred to implementation:
  - 失败明细文件下载可后续实现。

### U11 - 家长补录 API

- Goal: 支持导入后新增、更新、解绑家长，并提供家长读权限判断入口。
- Requirements covered: 家长手机号可后补、学生家长角色、绑定学生受限查看。
- Acceptance criteria covered: 未提供家长手机号的学生可以后续补录。
- Depends on: U9
- Files:
  - Create: `axon-chat/src/main/java/com/xinxi/chatservice/controller/student/StudentParentController.java`
  - Create: `axon-chat/src/test/java/com/xinxi/chatservice/controller/student/StudentParentControllerTest.java`
- Forbidden files:
  - 不实现家长端完整页面。
- Execution steps:
  1. 写新增家长 Controller 测试。
  2. 写查询家长列表 Controller 测试。
  3. 写更新关系和解绑 Controller 测试。
  4. 实现 `GET/POST/PUT/DELETE /api/v1/student/management/{studentEntityId}/parents` 系列接口。
  5. 接口统一调用 `StudentParentBindingService`。
- Tests:
  - Create: `axon-chat/src/test/java/com/xinxi/chatservice/controller/student/StudentParentControllerTest.java`
- Validation:
  - `mvn -pl axon-chat -Dtest=StudentParentControllerTest test`
- Rollback signals:
  - 跨校学生可被绑定家长，必须阻断发布。
- Deferred to implementation:
  - 家长登录后的学生详情入口另行计划。

### U12 - 接口文档、测试数据和冒烟脚本

- Goal: 让前端和联调人员能按文档直接调用。
- Requirements covered: 可验证交付。
- Acceptance criteria covered: 文档列出请求、响应、错误和冒烟命令。
- Depends on: U4, U5, U6, U7, U10, U11
- Files:
  - Create: `docs/04-api/班级管理扩展接口说明.md`
  - Create: `docs/04-api/学生管理新导入与操作历史接口说明.md`
  - Create: `docs/07-test-data/student-import-sample.csv`
  - Create: `docs/05-reports/2026-06-09-class-student-management-validation-report.md`
- Forbidden files:
  - 不把 token、真实手机号或真实学生隐私写入测试数据。
- Execution steps:
  1. 写班级接口文档：动态年级、班主任、日志、升学。
  2. 写学生接口文档：列表、详情、导入、家长补录。
  3. 写导入样例数据：一个无家长、一个单家长、一个多家长、一个异常班级。
  4. 写 PowerShell 冒烟命令。
  5. 写验证报告模板并在执行后补结果。
- Tests:
  - 文档静态检查。
- Validation:
  - `rg -n "STUDENT_PARENT|parent_contacts|default_password|/api/v1/student/imports" docs/04-api docs/07-test-data`
- Rollback signals:
  - 文档与实际 Controller 路径不一致时，先修文档或 Controller，不能交付含冲突契约。
- Deferred to implementation:
  - 前端交互截图不在本计划。

### U13 - 最终集成验证

- Goal: 在代码和 SQL 均完成后验证全链路。
- Requirements covered: 所有 acceptance criteria。
- Acceptance criteria covered: 编译、测试、SQL、API 冒烟。
- Depends on: U1, U2, U3, U4, U5, U6, U7, U8, U9, U10, U11, U12
- Files:
  - Update: `docs/05-reports/2026-06-09-class-student-management-validation-report.md`
- Forbidden files:
  - 不在未确认服务已重启时执行接口结论。
- Execution steps:
  1. 运行 `mvn -pl axon-common -am -DskipTests compile`。
  2. 运行 `mvn -pl axon-chat -am -DskipTests compile`。
  3. 运行 focused tests。
  4. 请用户执行 SQL 后回传 SQL verification 输出。
  5. 用户确认后端已重启并提供 token。
  6. 执行本地接口冒烟。
  7. 把验证结果写入报告。
- Tests:
  - Focused tests:
    ```powershell
    mvn -pl axon-common -Dtest=ClassGradeProgressionServiceImplTest,ClassHeadTeacherServiceImplTest,ClassOperationLogServiceImplTest,ClassPromotionMaterializationServiceImplTest,StudentManagementServiceImplTest,StudentAccountProvisionServiceImplTest,StudentParentBindingServiceImplTest,StudentImportWorkflowServiceImplTest test
    mvn -pl axon-chat -Dtest=ClassControllerTest,StudentManagementControllerTest,StudentImportControllerTest,StudentParentControllerTest test
    ```
- Validation:
  - 编译成功。
  - 所有 focused tests 成功。
  - SQL verification 结果符合 U1。
  - 冒烟接口能完成：班主任绑定、日志查询、学生列表、学生导入任务查询、家长补录查询。
- Rollback signals:
  - 任意 5xx 或权限越权结果，停止发布并回到对应实施单元修复。
- Deferred to implementation:
  - 真实 xlsx 上传冒烟需要准备本地文件和 token。

## Validation Plan

- Unit:
  - 每个 Service 都有 focused unit tests。
  - 枚举和配置有单元测试。
- Integration:
  - `StudentImportWorkflowServiceImplTest` 覆盖导入确认跨 `student/users/user_profile/sys_user_role/parent_student`。
  - `ClassPromotionMaterializationServiceImplTest` 覆盖升学日志和毕业状态。
- User flow:
  - 管理端学生导入：上传解析 -> 修正异常 -> 确认导入 -> 查看详情 -> 补录家长。
  - 班级管理：查询动态年级 -> 绑定班主任 -> 查看日志 -> dryRun 升学。
- Data / operations:
  - SQL verification 必须检查新增表、索引、默认密码字段、`STUDENT_PARENT`。
  - 导入任务行必须保留原始快照、修正快照和导入结果。
- Observability:
  - 导入失败写入行级错误。
  - 升学失败写入 `class_promotion_run.error_message`。

## Rollback / Recovery

- 代码回滚：回滚当前功能分支，不回滚用户已有改动。
- SQL 回滚：
  - 新增表为空时可删除新增表。
  - 已有学生导入数据后，不自动删除 `users.default_password_flag`、`users.password_reset_required`、`student.user_id`、`STUDENT_PARENT`。
- 数据恢复：
  - 导入行失败时按 `student_import_row` 查询行级错误并重试。
  - 升学日志错误时按 `class_promotion_run` 和 `class_operation_log.event_key` 定位。

## Plan Self-Review

- Placeholder scan: 无占位符，开放产品问题已列入 Open questions。
- Consistency check: `STUDENT_PARENT` 不归入教师及以上；`parent_student.student_id` 明确为学生 `users.id`。
- Scope check: 本计划覆盖总方案完整执行顺序，但默认密码登录改造和家长端完整页面明确排除。
- Acceptance coverage: PRD 中班级状态、学生列表详情、导入账号、多家长、补录接口、默认密码记录均有对应 U 单元。
- Validation gaps: 真实接口冒烟依赖用户提供 token、执行 SQL、确认后端重启。
- Alternatives and ADR check: 已记录旧导入接口复用、家长不建账号等被拒绝方案。
- High-risk pre-mortem check: 迁移、并发账号、家长越权三个风险均有缓解和验证。

## Handoff

推荐执行顺序：

```text
U0 -> U1 -> U2 -> U3 -> U4 -> U5 -> U6 -> U7 -> U8 -> U9 -> U10 -> U11 -> U12 -> U13
```

并行建议：

- U4、U5、U7 在 U1-U3 完成后可以分支并行，但合并前必须统一执行 U13。
- U8 和 U9 不能早于 U7；U10 不能早于 U8/U9。
- U12 可在 Controller 路径稳定后提前编写，最终以 U13 验证结果校准。
