# 班级管理扩展 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在现有班级模型上补齐班主任配置、按入学年动态计算当前年级、班级变更日志，并保留已注册学生与学生实体双轨班级成员能力。

**Architecture:** 保留现有 `class` 主表，并明确 `class.grade_id` 表示班级入学/创建时的起始年级，不做年度批量更新。新增 `grade.grade_progression_order` 作为稳定升学序列，`grade.display_order` 只用于界面排序。新增 `class_head_teacher` 表承载班主任，改造 `student_class`、`class_student_entity`、`teacher_class_subject` 增加生效时间与状态，新增 `class_operation_log` 作为前端展示时间线，新增 `class_promotion_run` 记录年度升学日志生成批次。动态年级不再按 `phase_id` 或 `display_order` 推进，而是根据起始年级升学序列、学年差和学制规则计算；分页场景必须通过 SQL 派生当前年级完成筛选和分页，不能先分页再内存过滤。升学日志必须按生效关系快照生成，不使用触发时刻的 current 关系冒充历史。

**Tech Stack:** Java 21, Spring Boot 3, MyBatis-Plus, Maven, MySQL, Jakarta Validation, Swagger/OpenAPI annotations.

---

## Source

- 需求来源：用户在 2026-06-09 明确补充的班级业务规则。
- 需求文档：`D:\Downloads\20260609 学生管理与班级管理需求文档.docx`
- 补充 PRD：`D:\codes\work\docs\ae\prds\2026-06-09-class-student-management-gap-prd.md`
- 现状分析：`D:\codes\work\docs\03-analysis\2026-06-09-班级模型接口与扩展能力分析.md`
- 可执行拆分计划：`D:\codes\work\docs\ae\plans\2026-06-09-002-class-student-management-executable-plan.md`
- 核心入口：
  - `D:\codes\work\axon-chat\src\main\java\com\xinxi\chatservice\controller\school\ClassController.java`
  - `D:\codes\work\axon-chat\src\main\java\com\xinxi\chatservice\controller\student\StudentEntityController.java`
  - `D:\codes\work\axon-common\src\main\java\com\xinxi\axon\common\service\school\impl\ClassServiceImpl.java`
  - `D:\codes\work\axon-common\src\main\java\com\xinxi\axon\common\service\user\impl\TeacherClassSubjectServiceImpl.java`
  - `D:\codes\work\axon-common\src\main\java\com\xinxi\axon\common\service\user\impl\StudentClassServiceImpl.java`
  - `D:\codes\work\axon-common\src\main\java\com\xinxi\axon\common\service\student\impl\ClassStudentEntityServiceImpl.java`

## Requirements Readiness

### Confirmed Rules

- 班主任不一定对应某个学科，不能复用 `teacher_class_subject.subject_id` 表达班主任。
- 一个班级同一时间只能有一个班主任。
- 一个老师可以同时担任多个班级、多个年级的班主任。
- 一个老师也可以通过现有 `teacher_class_subject` 成为多个班级、多个年级、多个学科的任课老师。
- 当前年级按入学年份和起始年级动态计算：刚入学展示起始年级，学年推进后按年级序列展示下一年级。
- 班主任调整、任课老师调整、学生加入/改班/离班、班级基础信息变更需要写日志，供前端展示。
- 学年切换后，原班级从上一年级升到下一年级时，需要为班级、班主任、任课老师、已注册学生、学生实体分别生成升学日志，供前端展示“谁随班升学”。
- 新生插班、校内转班、转学入、转学出、退学、毕业离班等学生变动需要能在日志中区分原因。
- 学生可以是已注册账号 `users.id`，也可以是独立学生实体 `student.id`，后续再通过接口关联账号。
- 班级需要业务状态，至少覆盖有效、停用、已毕业、归档；状态参与列表筛选、详情展示和新业务可选班级过滤。
- 学生列表需要按入学年份、动态当前年级、班级、状态筛选，并支持姓名、系统账号、手机号搜索。
- 学生详情需要展示账号绑定状态和按时间倒序的修改历史。
- 学生批量导入必须使用新的学生导入接口族；旧的批量导入用户接口保持兼容，不在本计划中改造。
- 学生批量导入是“上传解析 -> 确认导入 -> 异常修正 -> 导入已修正数据”的多阶段流程，不再使用同步上传后立即全部入库作为新 UI 的主接口。
- 学生批量导入确认入库时必须同步创建 `users` 学生账号、`user_profile` 学生档案、`sys_user_role` 学生角色，并把 `student` 学生实体绑定到该账号。
- 学生批量导入支持 0 到多个家长手机号；手机号为空不阻断导入，手机号存在时创建或复用家长账号、创建“学生家长”角色绑定，并通过 `parent_student` 建立家长账号与学生账号关系。
- 家长手机号可在导入后通过学生管理接口补录、绑定、更新或解绑。
- 学生导入账号采用不超过 18 位的学校编码 + 班级编码 + 学生序号规则，必须保证全局唯一。
- 导入学生可使用配置化统一默认密码；本期只记录默认密码状态，不开放学生默认密码登录改密流程。

### Assumptions

- 需求文档要求每年 8 月 15 日开始执行新学年自动升级；项目历史逻辑中存在 9 月 1 日切换规则。本计划采用学校学年日历服务统一封装触发日期，本期默认值按需求文档使用 8 月 15 日，保留学校级配置能力，避免业务代码硬编码多个日期。
- 动态年级不依赖 `phase_id`，因为当前项目存在小学/初中可能同属一个 `phase_id` 的历史设计；也不依赖 `grade.display_order`，因为该字段是显示排序字段。正式实现新增 `grade.grade_progression_order` 作为稳定升学序列，普通行政年级填 1..12，非行政年级或教材专用年级保持 NULL。
- 当前计划选择“同一自然学生同一时间在同一学校内只有一个当前行政班级”的规则，因此 `student_class` 和 `class_student_entity` 需要补 `school_id` 冗余字段，并按 `(school_id, 当前有效学生键)` 保证学校内唯一；不同学校允许同一学生同时存在当前班级关系。
- 班主任唯一性以数据库生成列唯一键为主保证；Service 层负责关闭旧关系、插入新关系，并把 `DuplicateKeyException` 转为清晰业务错误。`SELECT ... FOR UPDATE` 是可选并发增强，只有在补齐 mapper SQL 和事务边界后才启用。
- 本期只支持学生实体绑定已有 `userId` 的既有能力；“无账号时一键创建并绑定”作为独立后续接口，不阻塞班级管理扩展。
- 班级成员关系按“当前行政班”处理：同一已注册学生或同一学生实体同一时间在同一学校内只应归属一个当前班级。现有 `student_class` 近似满足该语义；`class_student_entity` 需要在服务层补充校验。
- 升学日志是对动态年级结果的“事件物化”，不会修改 `class.grade_id`；普通同一行政班随年级推进只写日志，跨学段毕业、拆班合班、转学等真实关系流转必须同步关闭/开启关系状态。
- 升学日志默认在学校学年日历的触发日后由管理员手动触发或定时任务触发；本期默认触发日为 8 月 15 日，批次按 `schoolId + promotionAcademicYear` 幂等执行。
- 升学日志生成时以 `promotionDate` 当日有效的班级、班主任、任课老师、学生关系为快照；因此本计划同步为学生/老师班级关系补 `effective_start_date/effective_end_date/status`，不再用触发时刻 current 关系生成历史。
- 旧接口 `/api/v1/excel/import/school-user` 和旧的一步式学生实体导入接口不作为新学生管理导入页的主流程入口；新流程使用独立任务、行明细和异常修正接口。
- 现有 `parent_student.student_id` 关联的是学生 `users.id`，不是 `student.id`；因此新导入的家长绑定必须在学生账号创建完成后执行。
- 当前登录入口仍会拒绝 `STUDENT` 角色登录。本计划创建学生账号用于身份绑定、导入闭环和后续登录能力，不改变当前学生登录拦截行为。
- 默认密码建议先使用配置项，例如 `student.import.default-password`；若配置缺失，采用产品确认的统一初始值。密码加密沿用项目当前 `PasswordUtil.encrypt(...)` 口径，避免在本计划中混用 BCrypt 与现有 MD5 工具。
- 学生账号生成规则以长度和唯一性优先。若“学校编码 + 班级编码 + 两位学生序号”冲突，则递增序号或使用预留短后缀重试；最终结果仍必须小于等于 18 位。
- 本期新增 “学生家长” 角色代码建议为 `STUDENT_PARENT`，角色显示名为“学生家长”；菜单/权限清单先满足“查看绑定学生受限信息”，更细的家长端页面权限可后续细化。

### Acceptance Criteria

- 班级详情、班级分页、按年级分组班级列表返回动态当前年级信息：`currentAcademicYear/startGradeId/currentGradeId/currentGradeName/gradeOffset/gradeProgressionStatus`。
- 班级分页支持按动态当前年级筛选；按年级分组接口默认按动态当前年级分组，避免“显示三年级却挂在一年级分组下”。
- 班级分页的 `currentGradeId` 筛选必须在 SQL 层完成，`total/pages/records` 必须与筛选后的当前年级一致；禁止在 `Page<ClassPO>` 分页后再内存过滤 `currentGradeId`。
- 班主任接口支持绑定、变更、解绑、按班级查询、按老师查询；一个班级同一时间最多一名有效班主任。
- 一个老师可以担任多个班级班主任，不被唯一约束拦截。
- 现有任课老师接口仍按 `teacherId + classId + subjectId` 工作，不被班主任模型污染。
- 班级变更日志覆盖班主任、任课老师、已注册学生、学生实体、班级基础信息变更。
- 班级列表支持按业务状态筛选；班级详情和分页返回业务状态；已毕业、停用、归档班级不出现在新建学生、批量导入、AI 批改新任务的可选班级中。
- 年度升学日志生成接口可按学校和学年生成日志，重复调用不会产生重复日志。
- 最高行政年级进入下一学年后班级状态变更为已毕业，并写入升级/毕业结果日志。
- 升学日志覆盖每个发生年级推进的班级，以及该班在 `promotionDate` 有效的班主任、任课老师、已注册学生、学生实体。
- 学生变动日志可以区分普通加入、新生插班、校内转班、转学入、转学出、退学、毕业离班、随班升学。
- 班主任只能绑定 `RoleCodeEnum.isTeacherAndAbove` 判定通过的教师及以上角色；同校但没有教师及以上角色的用户不能成为班主任。
- 未注册学生实体入班、改班、解绑接口必须补班级修改权限。
- 日志分页接口可按 `classId/schoolId/operationType/targetType/targetId/timeRange` 查询，并返回前端可直接展示的 `displayMessage`。
- 学生列表支持入学年份、动态当前年级、班级、学生状态筛选，支持姓名、系统账号、手机号搜索。
- 学生详情返回账号绑定状态和修改历史；学生新建、修改、状态变更、班级变动、导入入库写入学生操作历史。
- 新学生导入接口支持上传解析、查询解析进度、确认导入、异常行查询、异常行修正并重新校验、导入已修正数据；不修改旧批量导入用户接口。
- 新学生导入确认成功后，每个学生行都写入 `student`、`users`、`user_profile`、`sys_user_role`，并能从学生详情看到系统账号与绑定状态。
- 提供多个家长手机号时，系统为每个有效手机号创建或复用家长账号，赋予 `STUDENT_PARENT` 角色，并在 `parent_student` 建立多条有效关系。
- 未提供家长手机号的学生仍可导入成功；导入行和学生详情能展示家长待补录状态，后续补录接口可补齐关系。
- 学生账号生成结果全局唯一且长度不超过 18 位；并发或重复导入导致的冲突必须被重试或转成可读业务错误。
- 默认密码状态被持久化记录，后续登录改造可据此做家长手机号验证和强制改密；当前计划不修改登录入口。
- 科任老师保存时校验教师有效状态、学校边界、学段/科目权限；后端校验不能只依赖前端选项过滤。
- 所有新增表、实体、DTO、VO、Service、Controller 方法通过 `mvn -pl axon-chat -am -DskipTests compile`。

### Non-Goals

- 不在本计划中重构 `user_profile` 的班级字段。
- 不在本计划中把 `teacher_class_subject` 改成通用角色表。
- 不在本计划中改造所有作业链路以完整支持 `student_entity_id`。
- 不在本计划中实现跨学段自动升学建班。
- 不在本计划中执行数据库迁移；只提供迁移脚本，由用户或部署流程执行。
- 不修改旧批量导入用户接口 `/api/v1/excel/import/school-user`。
- 不把旧的一步式学生实体导入接口作为新学生管理批量导入页面的主流程；旧接口如需保留，只作为兼容入口。
- 不在本计划中最终确定家长手机号是否允许多个学生共用；该规则在新导入异常处理中保持为可配置/待确认校验项。
- 不在本计划中开放学生账号登录；学生角色当前仍按既有登录入口规则拒绝登录。
- 不在本计划中实现“默认密码登录 -> 验证家长手机号 -> 强制修改密码”的完整登录流程；只做账号默认密码状态记录与 AI 记忆沉淀。

## Design Decisions

### ADR-1: 班主任使用独立 `class_head_teacher` 表

选择独立表，而不是在 `teacher_class_subject` 增加 `is_head_teacher`。

理由：

- 班主任不要求学科，现有任课老师关系要求 `subject_id`。
- 班级侧唯一规则和任课老师的多老师规则不同。
- 查询“我担任班主任的班级”和“我任课的班级”应保持语义分离。

### ADR-2: 当前年级动态计算

选择新增 `ClassGradeProgressionService`，不做年度批量更新 `class.grade_id`。

理由：

- `enrollment_year` 是稳定 cohort 字段。
- 批量更新 `class.grade_id` 会让历史考试、作业、统计口径难以解释。
- 当前项目不能只靠 `phase_id` 区分小学、初中、高中；年级推进必须基于稳定的升学序列和学制边界。`grade.display_order` 是显示排序字段，不能作为升学序列。
- 服务计算可以在未来扩展学校自定义学年切换日、五四制/六三制等规则。

### ADR-2.1: `class.grade_id` 定义为起始年级

本方案把 `class.grade_id` 明确定义为班级入学/创建时的起始年级。查询返回：

- `gradeId`: 起始年级 ID，兼容旧字段。
- `startGradeId/startGradeName`: 起始年级显式字段。
- `currentGradeId/currentGradeName`: 按当前学年动态计算后的当前年级。

分页查询中保留 `gradeId` 作为起始年级筛选，并新增 `currentGradeId` 作为动态当前年级筛选。`grade-with-classes` 默认按动态当前年级分组。

### ADR-2.2: 分页查询采用 SQL 派生当前年级

现有 `ClassServiceImpl.pageClass` 使用 MyBatis-Plus `Page<ClassPO>` 在 SQL 层分页。如果在分页后才按 `currentGradeId` 内存过滤，会导致 `total`、页数和返回记录不一致。因此本计划选择生产级方案：新增 `ClassMapper` 自定义分页 SQL，通过 `class.enrollment_year`、起始年级序列和当前学年常量在 SQL 中派生 `current_grade_id/current_grade_name/current_grade_sequence`，并在 SQL `WHERE` 中处理 `currentGradeId`。

要求：

- `gradeId` 继续表示起始年级 `class.grade_id`。
- `currentGradeId` 表示派生当前年级，必须在 SQL 层筛选。
- `pageClass` 不允许使用“先 SQL 分页，再内存过滤 currentGradeId”的实现。
- `grade-with-classes` 如果 `queryAll=true`，可先取全量班级后用 `ClassGradeProgressionService.resolveBatch` 分组；如果未来支持分页分组，也必须复用 SQL 派生当前年级结果。
- `queryGradesByClassGrouping` 需要按 `currentGradeId` 去重集合查询年级数据，分组标题取当前年级，不再按 `class.grade_id` 查询起始年级作为分组标题。
- SQL 派生年级必须使用 `grade.grade_progression_order`，不能使用 `grade.display_order`。

### ADR-3: 使用通用追加型 `class_operation_log`

选择一张通用日志表，而不是为班主任、任课老师、学生关系分别建历史表。

理由：

- 前端展示需要的是统一时间线。
- 日志是展示和审计辅助，不改变主业务表读写语义。
- `before_snapshot/after_snapshot/display_message` 能兼顾结构化追踪和前端快速展示。

### ADR-4: 升学日志使用幂等物化批次

选择新增 `ClassPromotionMaterializationService` 和 `class_promotion_run` 批次表，把动态升年级结果写入 `class_operation_log`。升学日志以 `promotionDate` 当日有效关系为准。

理由：

- 动态年级查询只会改变当前展示值，不会天然产生“从一年级升到二年级”的事件记录。
- 前端时间线需要稳定日志，而不是每次查询临时推导。
- 升学日志可能包含一个班级、一名班主任、多名任课老师、多名学生，必须支持批量生成、重试和去重。
- 用 `event_key` 保证同一学校、同一学年、同一班级、同一对象的升学日志只生成一次。

### ADR-5: 关系有效期优先，日志只是展示副产物

学生、学生实体、任课老师、班主任的加入、离开、转班、转学、毕业等真实状态变化必须落在关系表的有效期和状态字段上。`class_operation_log` 只用于前端时间线和审计展示，不能作为当前关系判断来源。

因此本计划同步扩展：

- `student_class`: 增加 `effective_start_date/effective_end_date/status/join_reason/leave_reason`。
- `class_student_entity`: 增加 `effective_start_date/effective_end_date/status/join_reason/leave_reason`。
- `teacher_class_subject`: 增加 `effective_start_date/effective_end_date/status`。
- `class_head_teacher`: 初始设计已经包含有效期。

所有“当前班级学生/任课老师/班主任”查询都应按 `status=1 AND effective_start_date <= asOfDate AND (effective_end_date IS NULL OR effective_end_date >= asOfDate)` 判断。

### ADR-6: 班级业务状态独立于逻辑删除

新增 `class.class_status` 表示班级业务状态，逻辑删除仍只表示记录删除。状态枚举使用字符串，避免把 `deleted`、关系表 `status` 和班级业务状态混在一起：

- `ACTIVE`: 有效，可用于新建学生、导入、AI 批改新任务。
- `DISABLED`: 停用，历史可查，不进入新业务可选范围。
- `GRADUATED`: 已毕业，历史可查，不进入新业务可选范围。
- `ARCHIVED`: 归档，历史可查，不进入新业务可选范围。

动态当前年级负责展示和筛选；班级状态负责业务可选范围和生命周期。最高年级进入下一学年时，升学流程必须把班级状态变更为 `GRADUATED` 并写日志。

### ADR-7: 新学生导入使用独立任务接口

学生管理新批量导入不修改旧的批量导入用户接口，也不把旧的一步式学生实体导入作为新页面主流程。新增 `student_import_task` 和 `student_import_row`：

- 上传接口创建任务、解析文件、生成行级结果，不直接完成所有入库。
- 确认导入接口只导入校验通过的行。
- 异常行保留并支持查询、修正、重新校验、忽略或标记待处理。
- 成功入库后写 `student_operation_log`，供学生详情修改历史展示。

### ADR-8: 学生导入内置账号开通，但不复用旧用户导入接口

新学生导入确认入库时调用独立的 `StudentAccountProvisionService`，由该服务负责创建学生账号、档案、角色和学生实体绑定。旧 `/api/v1/excel/import/school-user` 继续作为学校用户导入兼容入口，不承载本次学生导入流程。

账号生成规则：

- 账号基础格式为 `schoolCode + classCode + studentSequence`。
- `schoolCode` 建议为省份编码 + 学校开通序号，例如 `5200001`。
- `classCode` 建议为入学年份 + 班级序号，例如 `202601`。
- `studentSequence` 默认两位，必要时递增扩位或使用短后缀处理冲突。
- 最终 `username` 必须全局唯一且长度不超过 18 位；如果无法在该约束内生成账号，导入行转为 `PENDING/ACCOUNT_GENERATE_FAILED`，不允许截断后静默入库。

导入学生密码使用配置化统一默认密码，入库按现有 `PasswordUtil.encrypt(...)` 写入。账号同时持久化 `default_password_flag/password_reset_required` 或等价字段，用于后续登录强制改密；当前计划不改变 `UserController` 对 `STUDENT` 登录的拒绝规则。

### ADR-9: 家长绑定复用 `parent_student`，新增“学生家长”角色

家长绑定使用现有 `parent_student` 表表达多对多关系，但关系两端都使用 `users.id`：

- `parent_student.parent_id`: 家长账号 `users.id`。
- `parent_student.student_id`: 学生账号 `users.id`。

因此导入事务必须先完成学生账号开通，再执行家长绑定。新增 `StudentParentBindingService` 统一处理：

- 按学校 + 手机号查找或创建家长 `users`。
- 写入或补齐 `user_profile`，`user_type=3`。
- 新增并分配 `RoleCodeEnum.STUDENT_PARENT` / `sys_role.role_code=STUDENT_PARENT`，显示名“学生家长”。
- 支持一个学生绑定多个家长，记录 `relationship/is_primary/status/start_date`。
- 家长手机号为空时不阻断学生导入，只把导入行/学生详情标记为家长待补录。

家长查看学生信息必须以 `parent_student` 有效关系为权限边界，不能只凭同校或手机号匹配放行。

## File Map

### SQL and Docs

- Create: `D:\codes\work\docs\06-sql\migrations\2026-06-09-class-head-teacher-and-operation-log.sql`
  - 新增 `class_head_teacher`、`class_operation_log` 和 `class_promotion_run`。
  - 改造 `grade` 增加稳定升学序列字段。
  - 改造 `class` 增加 `class_status`、毕业时间和升级异常字段。
  - 改造 `student_class`、`class_student_entity` 增加 `school_id`、关系有效期和状态字段。
  - 改造 `teacher_class_subject` 增加关系有效期和状态字段。
- Create: `D:\codes\work\docs\06-sql\migrations\2026-06-09-student-management-import-workflow.sql`
  - 新增 `student_operation_log`、`student_import_task`、`student_import_row`。
  - 为学生导入行保存生成账号、默认密码状态、家长联系人 JSON 和家长绑定结果。
  - 为学生账号默认密码状态补充 `users` 扩展字段或等价结构，并为 `student` 补齐 `user_id` 绑定字段（若当前库缺失）。
  - 新增或幂等写入 `sys_role` 角色 `STUDENT_PARENT`（学生家长）。
- Modify: `D:\codes\work\docs\04-api\班级管理扩展接口说明.md`
  - 新增班主任、日志、动态年级字段接口说明。
- Create: `D:\codes\work\docs\04-api\学生管理新导入与操作历史接口说明.md`
  - 新增学生列表、学生详情历史、新学生导入、学生账号开通、家长补录绑定接口族说明。

### Entity and Mapper

- Create: `D:\codes\work\axon-common\src\main\java\com\xinxi\axon\common\entity\school\ClassHeadTeacherPO.java`
- Create: `D:\codes\work\axon-common\src\main\java\com\xinxi\axon\common\entity\school\ClassOperationLogPO.java`
- Create: `D:\codes\work\axon-common\src\main\java\com\xinxi\axon\common\entity\school\ClassPromotionRunPO.java`
- Create: `D:\codes\work\axon-common\src\main\java\com\xinxi\axon\common\entity\student\StudentOperationLogPO.java`
- Create: `D:\codes\work\axon-common\src\main\java\com\xinxi\axon\common\entity\student\StudentImportTaskPO.java`
- Create: `D:\codes\work\axon-common\src\main\java\com\xinxi\axon\common\entity\student\StudentImportRowPO.java`
- Create: `D:\codes\work\axon-common\src\main\java\com\xinxi\axon\common\mapper\school\ClassHeadTeacherMapper.java`
- Create: `D:\codes\work\axon-common\src\main\java\com\xinxi\axon\common\mapper\school\ClassOperationLogMapper.java`
- Create: `D:\codes\work\axon-common\src\main\java\com\xinxi\axon\common\mapper\school\ClassPromotionRunMapper.java`
- Create: `D:\codes\work\axon-common\src\main\java\com\xinxi\axon\common\mapper\student\StudentOperationLogMapper.java`
- Create: `D:\codes\work\axon-common\src\main\java\com\xinxi\axon\common\mapper\student\StudentImportTaskMapper.java`
- Create: `D:\codes\work\axon-common\src\main\java\com\xinxi\axon\common\mapper\student\StudentImportRowMapper.java`
- Modify: `D:\codes\work\axon-common\src\main\java\com\xinxi\axon\common\mapper\school\ClassMapper.java`
- Create or Modify: `D:\codes\work\axon-common\src\main\resources\mapper\school\ClassMapper.xml`
  - 为 `pageClass` 提供 SQL 级派生当前年级分页查询，保证 `currentGradeId` 筛选、`total` 和分页记录一致。
- Modify: `D:\codes\work\axon-common\src\main\java\com\xinxi\axon\common\entity\textbookcourses\GradePO.java`
  - 新增 `gradeProgressionOrder` 字段，对应 `grade.grade_progression_order`。

### DTO, VO, Enum

- Create: `D:\codes\work\axon-common\src\main\java\com\xinxi\axon\common\dto\school\ClassHeadTeacherBindDTO.java`
- Create: `D:\codes\work\axon-common\src\main\java\com\xinxi\axon\common\dto\school\ClassHeadTeacherDeleteDTO.java`
- Create: `D:\codes\work\axon-common\src\main\java\com\xinxi\axon\common\dto\school\ClassOperationLogPageQueryDTO.java`
- Create: `D:\codes\work\axon-common\src\main\java\com\xinxi\axon\common\dto\school\ClassPromotionMaterializeDTO.java`
- Create: `D:\codes\work\axon-common\src\main\java\com\xinxi\axon\common\vo\school\ClassHeadTeacherVO.java`
- Create: `D:\codes\work\axon-common\src\main\java\com\xinxi\axon\common\vo\school\ClassOperationLogVO.java`
- Create: `D:\codes\work\axon-common\src\main\java\com\xinxi\axon\common\vo\school\ClassGradeProgressionVO.java`
- Create: `D:\codes\work\axon-common\src\main\java\com\xinxi\axon\common\vo\school\ClassPromotionMaterializeResultVO.java`
- Modify: `D:\codes\work\axon-common\src\main\java\com\xinxi\axon\common\vo\school\ClassVO.java`
- Modify: `D:\codes\work\axon-common\src\main\java\com\xinxi\axon\common\vo\school\ClassDetailVO.java`
- Modify: `D:\codes\work\axon-common\src\main\java\com\xinxi\axon\common\dto\school\ClassPageQueryDTO.java`
- Modify: `D:\codes\work\axon-common\src\main\java\com\xinxi\axon\common\dto\school\ClassAddDTO.java`
- Modify: `D:\codes\work\axon-common\src\main\java\com\xinxi\axon\common\dto\school\ClassUpdateDTO.java`
- Modify: `D:\codes\work\axon-common\src\main\java\com\xinxi\axon\common\dto\school\StudentClassBindDTO.java`
- Modify: `D:\codes\work\axon-common\src\main\java\com\xinxi\axon\common\dto\school\TeacherClassSubjectBindDTO.java`
- Modify: `D:\codes\work\axon-common\src\main\java\com\xinxi\axon\common\dto\student\ClassStudentEntityBindDTO.java`
- Modify: `D:\codes\work\axon-common\src\main\java\com\xinxi\axon\common\dto\student\ClassStudentEntityUpdateDTO.java`
- Create: `D:\codes\work\axon-common\src\main\java\com\xinxi\axon\common\enums\ClassOperationTypeEnum.java`
- Create: `D:\codes\work\axon-common\src\main\java\com\xinxi\axon\common\enums\ClassOperationTargetTypeEnum.java`
- Create: `D:\codes\work\axon-common\src\main\java\com\xinxi\axon\common\enums\ClassGradeProgressionStatusEnum.java`
- Create: `D:\codes\work\axon-common\src\main\java\com\xinxi\axon\common\enums\ClassOperationReasonEnum.java`
- Create: `D:\codes\work\axon-common\src\main\java\com\xinxi\axon\common\enums\ClassOperationSourceEnum.java`
- Create: `D:\codes\work\axon-common\src\main\java\com\xinxi\axon\common\enums\ClassStatusEnum.java`
- Create: `D:\codes\work\axon-common\src\main\java\com\xinxi\axon\common\enums\StudentOperationTypeEnum.java`
- Create: `D:\codes\work\axon-common\src\main\java\com\xinxi\axon\common\enums\StudentImportTaskStatusEnum.java`
- Create: `D:\codes\work\axon-common\src\main\java\com\xinxi\axon\common\enums\StudentImportRowStatusEnum.java`
- Create: `D:\codes\work\axon-common\src\main\java\com\xinxi\axon\common\enums\StudentImportExceptionTypeEnum.java`
- Modify: `D:\codes\work\axon-common\src\main\java\com\xinxi\axon\common\enums\RoleCodeEnum.java`
  - 新增 `STUDENT_PARENT("STUDENT_PARENT", "学生家长", "...")`，不要纳入 `getTeacherAndAboveCodes()`。
- Create: `D:\codes\work\axon-common\src\main\java\com\xinxi\axon\common\dto\student\StudentManagementQueryDTO.java`
- Create: `D:\codes\work\axon-common\src\main\java\com\xinxi\axon\common\dto\student\StudentImportUploadDTO.java`
- Create: `D:\codes\work\axon-common\src\main\java\com\xinxi\axon\common\dto\student\StudentImportConfirmDTO.java`
- Create: `D:\codes\work\axon-common\src\main\java\com\xinxi\axon\common\dto\student\StudentImportRowFixDTO.java`
- Create: `D:\codes\work\axon-common\src\main\java\com\xinxi\axon\common\dto\student\StudentImportRowQueryDTO.java`
- Create: `D:\codes\work\axon-common\src\main\java\com\xinxi\axon\common\dto\student\StudentParentSaveDTO.java`
- Create: `D:\codes\work\axon-common\src\main\java\com\xinxi\axon\common\dto\student\StudentParentQueryDTO.java`
- Create: `D:\codes\work\axon-common\src\main\java\com\xinxi\axon\common\dto\student\StudentParentUnbindDTO.java`
- Create: `D:\codes\work\axon-common\src\main\java\com\xinxi\axon\common\dto\student\StudentAccountProvisionCommand.java`
- Create: `D:\codes\work\axon-common\src\main\java\com\xinxi\axon\common\dto\student\StudentParentContactDTO.java`
- Create: `D:\codes\work\axon-common\src\main\java\com\xinxi\axon\common\vo\student\StudentManagementListItemVO.java`
- Create: `D:\codes\work\axon-common\src\main\java\com\xinxi\axon\common\vo\student\StudentManagementDetailVO.java`
- Create: `D:\codes\work\axon-common\src\main\java\com\xinxi\axon\common\vo\student\StudentOperationLogVO.java`
- Create: `D:\codes\work\axon-common\src\main\java\com\xinxi\axon\common\vo\student\StudentImportTaskVO.java`
- Create: `D:\codes\work\axon-common\src\main\java\com\xinxi\axon\common\vo\student\StudentImportRowVO.java`
- Create: `D:\codes\work\axon-common\src\main\java\com\xinxi\axon\common\vo\student\StudentParentVO.java`
- Create: `D:\codes\work\axon-common\src\main\java\com\xinxi\axon\common\vo\student\StudentAccountProvisionResultVO.java`
- Create: `D:\codes\work\axon-common\src\main\java\com\xinxi\axon\common\config\StudentImportProperties.java`
- Modify: environment configuration files only to add non-secret defaults or documented placeholders for:
  - `student.import.default-password`
  - `student.import.account.school-code-source`
  - `student.import.account.max-username-length=18`

### Service

- Create: `D:\codes\work\axon-common\src\main\java\com\xinxi\axon\common\service\school\ClassGradeProgressionService.java`
- Create: `D:\codes\work\axon-common\src\main\java\com\xinxi\axon\common\service\school\impl\ClassGradeProgressionServiceImpl.java`
- Create: `D:\codes\work\axon-common\src\main\java\com\xinxi\axon\common\service\school\ClassHeadTeacherService.java`
- Create: `D:\codes\work\axon-common\src\main\java\com\xinxi\axon\common\service\school\impl\ClassHeadTeacherServiceImpl.java`
- Create: `D:\codes\work\axon-common\src\main\java\com\xinxi\axon\common\service\school\ClassOperationLogService.java`
- Create: `D:\codes\work\axon-common\src\main\java\com\xinxi\axon\common\service\school\impl\ClassOperationLogServiceImpl.java`
- Create: `D:\codes\work\axon-common\src\main\java\com\xinxi\axon\common\service\school\ClassPromotionMaterializationService.java`
- Create: `D:\codes\work\axon-common\src\main\java\com\xinxi\axon\common\service\school\impl\ClassPromotionMaterializationServiceImpl.java`
- Create: `D:\codes\work\axon-common\src\main\java\com\xinxi\axon\common\service\school\SchoolAcademicCalendarService.java`
- Create: `D:\codes\work\axon-common\src\main\java\com\xinxi\axon\common\service\school\impl\SchoolAcademicCalendarServiceImpl.java`
- Create: `D:\codes\work\axon-common\src\main\java\com\xinxi\axon\common\service\student\StudentManagementService.java`
- Create: `D:\codes\work\axon-common\src\main\java\com\xinxi\axon\common\service\student\impl\StudentManagementServiceImpl.java`
- Create: `D:\codes\work\axon-common\src\main\java\com\xinxi\axon\common\service\student\StudentOperationLogService.java`
- Create: `D:\codes\work\axon-common\src\main\java\com\xinxi\axon\common\service\student\impl\StudentOperationLogServiceImpl.java`
- Create: `D:\codes\work\axon-common\src\main\java\com\xinxi\axon\common\service\student\StudentImportWorkflowService.java`
- Create: `D:\codes\work\axon-common\src\main\java\com\xinxi\axon\common\service\student\impl\StudentImportWorkflowServiceImpl.java`
- Create: `D:\codes\work\axon-common\src\main\java\com\xinxi\axon\common\service\student\StudentAccountProvisionService.java`
- Create: `D:\codes\work\axon-common\src\main\java\com\xinxi\axon\common\service\student\impl\StudentAccountProvisionServiceImpl.java`
- Create: `D:\codes\work\axon-common\src\main\java\com\xinxi\axon\common\service\student\StudentParentBindingService.java`
- Create: `D:\codes\work\axon-common\src\main\java\com\xinxi\axon\common\service\student\impl\StudentParentBindingServiceImpl.java`
- Modify: `D:\codes\work\axon-common\src\main\java\com\xinxi\axon\common\service\school\impl\ClassServiceImpl.java`
- Modify: `D:\codes\work\axon-common\src\main\java\com\xinxi\axon\common\service\user\impl\TeacherClassSubjectServiceImpl.java`
- Modify: `D:\codes\work\axon-common\src\main\java\com\xinxi\axon\common\service\user\impl\StudentClassServiceImpl.java`
- Modify: `D:\codes\work\axon-common\src\main\java\com\xinxi\axon\common\service\student\impl\ClassStudentEntityServiceImpl.java`
- Modify: `D:\codes\work\axon-common\src\main\java\com\xinxi\axon\common\service\student\impl\ClassStudentQueryServiceImpl.java`

### Controller

- Modify: `D:\codes\work\axon-chat\src\main\java\com\xinxi\chatservice\controller\school\ClassController.java`
- Modify: `D:\codes\work\axon-chat\src\main\java\com\xinxi\chatservice\controller\student\StudentEntityController.java`
- Create: `D:\codes\work\axon-chat\src\main\java\com\xinxi\chatservice\controller\student\StudentManagementController.java`
- Create: `D:\codes\work\axon-chat\src\main\java\com\xinxi\chatservice\controller\student\StudentImportController.java`
- Create: `D:\codes\work\axon-chat\src\main\java\com\xinxi\chatservice\controller\student\StudentParentController.java`

### Tests

- Create: `D:\codes\work\axon-common\src\test\java\com\xinxi\axon\common\service\school\ClassGradeProgressionServiceImplTest.java`
- Create: `D:\codes\work\axon-common\src\test\java\com\xinxi\axon\common\service\school\ClassHeadTeacherServiceImplTest.java`
- Create: `D:\codes\work\axon-common\src\test\java\com\xinxi\axon\common\service\school\ClassOperationLogServiceImplTest.java`
- Create: `D:\codes\work\axon-common\src\test\java\com\xinxi\axon\common\service\school\ClassPromotionMaterializationServiceImplTest.java`
- Create: `D:\codes\work\axon-common\src\test\java\com\xinxi\axon\common\service\student\StudentManagementServiceImplTest.java`
- Create: `D:\codes\work\axon-common\src\test\java\com\xinxi\axon\common\service\student\StudentImportWorkflowServiceImplTest.java`
- Create: `D:\codes\work\axon-common\src\test\java\com\xinxi\axon\common\service\student\StudentAccountProvisionServiceImplTest.java`
- Create: `D:\codes\work\axon-common\src\test\java\com\xinxi\axon\common\service\student\StudentParentBindingServiceImplTest.java`

---

## Task 1: Create SQL Migration

**Files:**
- Create: `D:\codes\work\docs\06-sql\migrations\2026-06-09-class-head-teacher-and-operation-log.sql`

- [ ] **Step 1: Add migration prerequisites and grade progression sequence**

At the top of the SQL file, add:

```sql
-- Prerequisites:
-- 1. MySQL 5.7+ is required because this migration uses STORED generated columns with unique indexes.
-- 2. grade.display_order is a display sorting field and must not be used as the promotion sequence.
-- 3. grade.grade_progression_order is the stable administrative-grade progression sequence.
-- 4. This migration assumes one natural student has at most one active administrative class per school.
--    Cross-school concurrent class membership is allowed.

-- This query is only for reviewing existing grade rows and display order.
-- Do not use display_order for promotion calculation.
SELECT id, phase_id, grade_name, grade_code, display_order, is_visible
FROM grade
WHERE deleted = 0
ORDER BY display_order;
```

Add the new sequence column:

```sql
ALTER TABLE grade
    ADD COLUMN grade_progression_order INT NULL COMMENT '行政年级升学序列：小学1-6、初中7-9、高中10-12；非行政年级为空' AFTER grade_code,
    ADD KEY idx_grade_progression_order (grade_progression_order, deleted, is_visible);
```

Backfill by reviewed `grade_code` or `grade_name`, not by `display_order`:

```sql
UPDATE grade
SET grade_progression_order = CASE
    WHEN grade_code IN ('G1', 'GRADE_1', 'PRIMARY_1') OR grade_name = '一年级' THEN 1
    WHEN grade_code IN ('G2', 'GRADE_2', 'PRIMARY_2') OR grade_name = '二年级' THEN 2
    WHEN grade_code IN ('G3', 'GRADE_3', 'PRIMARY_3') OR grade_name = '三年级' THEN 3
    WHEN grade_code IN ('G4', 'GRADE_4', 'PRIMARY_4') OR grade_name = '四年级' THEN 4
    WHEN grade_code IN ('G5', 'GRADE_5', 'PRIMARY_5') OR grade_name = '五年级' THEN 5
    WHEN grade_code IN ('G6', 'GRADE_6', 'PRIMARY_6') OR grade_name = '六年级' THEN 6
    WHEN grade_code IN ('G7', 'GRADE_7', 'JUNIOR_1') OR grade_name = '七年级' THEN 7
    WHEN grade_code IN ('G8', 'GRADE_8', 'JUNIOR_2') OR grade_name = '八年级' THEN 8
    WHEN grade_code IN ('G9', 'GRADE_9', 'JUNIOR_3') OR grade_name = '九年级' THEN 9
    WHEN grade_code IN ('G10', 'GRADE_10', 'SENIOR_1') OR grade_name IN ('高一', '高一年级') THEN 10
    WHEN grade_code IN ('G11', 'GRADE_11', 'SENIOR_2') OR grade_name IN ('高二', '高二年级') THEN 11
    WHEN grade_code IN ('G12', 'GRADE_12', 'SENIOR_3') OR grade_name IN ('高三', '高三年级') THEN 12
    ELSE grade_progression_order
END
WHERE deleted = 0;
```

Verify that administrative grades have unique non-null progression values:

```sql
SELECT grade_progression_order, COUNT(*) AS cnt
FROM grade
WHERE deleted = 0 AND is_visible = 1 AND grade_progression_order IS NOT NULL
GROUP BY grade_progression_order
HAVING COUNT(*) > 1;

SELECT id, phase_id, grade_name, grade_code, display_order, grade_progression_order, is_visible
FROM grade
WHERE deleted = 0
ORDER BY grade_progression_order, display_order, id;
```

- [ ] **Step 1.5: Add class business status fields**

Use `class_status` rather than overloading `deleted` or relationship `status`:

```sql
ALTER TABLE class
    ADD COLUMN class_status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE' COMMENT '班级业务状态：ACTIVE-有效，DISABLED-停用，GRADUATED-已毕业，ARCHIVED-归档' AFTER enrollment_year,
    ADD COLUMN graduated_at DATETIME NULL COMMENT '毕业状态生效时间' AFTER class_status,
    ADD COLUMN promotion_exception_message VARCHAR(512) NULL COMMENT '最近一次升学异常原因' AFTER graduated_at,
    ADD KEY idx_class_status_school (school_id, class_status, deleted),
    ADD KEY idx_class_enrollment_status (school_id, enrollment_year, class_status, deleted);
```

Backfill current rows:

```sql
UPDATE class
SET class_status = 'ACTIVE'
WHERE deleted = 0 AND (class_status IS NULL OR class_status = '');
```

- [ ] **Step 2: Create `class_head_teacher` DDL**

Use this DDL:

```sql
CREATE TABLE IF NOT EXISTS class_head_teacher (
    id BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    class_id BIGINT NOT NULL COMMENT '班级ID，关联class.id',
    teacher_id BIGINT NOT NULL COMMENT '班主任用户ID，关联users.id',
    effective_start_date DATE NOT NULL COMMENT '生效开始日期',
    effective_end_date DATE NULL COMMENT '生效结束日期，NULL表示当前有效',
    status TINYINT NOT NULL DEFAULT 1 COMMENT '状态：1-有效，0-停用',
    version INT NOT NULL DEFAULT 0 COMMENT '乐观锁版本号',
    deleted INT NOT NULL DEFAULT 0 COMMENT '逻辑删除：0-未删除，1-已删除',
    create_by VARCHAR(64) NULL COMMENT '创建人',
    create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_by VARCHAR(64) NULL COMMENT '更新人',
    update_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    current_active_key BIGINT GENERATED ALWAYS AS (
        CASE WHEN deleted = 0 AND status = 1 AND effective_end_date IS NULL THEN class_id ELSE NULL END
    ) STORED COMMENT '当前有效班主任唯一键',
    PRIMARY KEY (id),
    UNIQUE KEY uk_cht_current_class (current_active_key),
    KEY idx_cht_class_current (class_id, status, effective_end_date, deleted),
    KEY idx_cht_teacher_current (teacher_id, status, effective_end_date, deleted),
    KEY idx_cht_class_teacher (class_id, teacher_id, deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='班级班主任关系表';
```

- [ ] **Step 3: Create `class_operation_log` DDL**

Use this DDL:

```sql
CREATE TABLE IF NOT EXISTS class_operation_log (
    id BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    event_key VARCHAR(191) NULL COMMENT '幂等事件键，同一业务事件只写一次',
    source_type VARCHAR(32) NOT NULL DEFAULT 'MANUAL' COMMENT '事件来源：MANUAL-人工，PROMOTION-升学物化，SYSTEM-系统',
    reason_type VARCHAR(64) NULL COMMENT '变更原因，如 NORMAL_JOIN、NEW_STUDENT_INSERT、TRANSFER_IN、TRANSFER_OUT、PROMOTION',
    school_id BIGINT NOT NULL COMMENT '学校ID',
    class_id BIGINT NOT NULL COMMENT '班级ID',
    operation_type VARCHAR(64) NOT NULL COMMENT '操作类型',
    target_type VARCHAR(64) NOT NULL COMMENT '目标类型',
    target_id BIGINT NULL COMMENT '目标对象ID',
    target_name VARCHAR(128) NULL COMMENT '目标对象展示名快照',
    from_academic_year INT NULL COMMENT '变更前学年起始年',
    to_academic_year INT NULL COMMENT '变更后学年起始年',
    from_grade_id BIGINT NULL COMMENT '变更前年级ID',
    from_grade_name VARCHAR(64) NULL COMMENT '变更前年级名称',
    to_grade_id BIGINT NULL COMMENT '变更后年级ID',
    to_grade_name VARCHAR(64) NULL COMMENT '变更后年级名称',
    from_class_id BIGINT NULL COMMENT '变更前班级ID',
    from_class_name VARCHAR(128) NULL COMMENT '变更前班级名称',
    to_class_id BIGINT NULL COMMENT '变更后班级ID',
    to_class_name VARCHAR(128) NULL COMMENT '变更后班级名称',
    before_snapshot LONGTEXT NULL COMMENT '调整前JSON快照',
    after_snapshot LONGTEXT NULL COMMENT '调整后JSON快照',
    display_message VARCHAR(512) NOT NULL COMMENT '前端展示文案',
    operator_id BIGINT NULL COMMENT '操作人用户ID',
    operator_name VARCHAR(128) NULL COMMENT '操作人名称快照',
    operation_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '操作时间',
    remark VARCHAR(512) NULL COMMENT '备注',
    version INT NOT NULL DEFAULT 0 COMMENT '乐观锁版本号',
    deleted INT NOT NULL DEFAULT 0 COMMENT '保留字段：日志按追加审计设计，不提供业务逻辑删除',
    create_by VARCHAR(64) NULL COMMENT '创建人',
    create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_by VARCHAR(64) NULL COMMENT '更新人',
    update_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (id),
    UNIQUE KEY uk_col_event_key (event_key),
    KEY idx_col_class_time (class_id, operation_time, deleted),
    KEY idx_col_school_time (school_id, operation_time, deleted),
    KEY idx_col_target (target_type, target_id, operation_time, deleted),
    KEY idx_col_operation_type (operation_type, operation_time, deleted),
    KEY idx_col_source_reason (source_type, reason_type, operation_time, deleted),
    KEY idx_col_promotion (school_id, to_academic_year, operation_type, deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='班级操作日志表';
```

- [ ] **Step 4: Create `class_promotion_run` DDL**

Use this DDL:

```sql
CREATE TABLE IF NOT EXISTS class_promotion_run (
    id BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    school_id BIGINT NOT NULL COMMENT '学校ID',
    promotion_academic_year INT NOT NULL COMMENT '升学后的学年起始年',
    from_academic_year INT NOT NULL COMMENT '升学前的学年起始年',
    run_status VARCHAR(32) NOT NULL COMMENT '批次状态：RUNNING/SUCCESS/FAILED',
    class_count INT NOT NULL DEFAULT 0 COMMENT '处理班级数',
    teacher_log_count INT NOT NULL DEFAULT 0 COMMENT '生成老师日志数',
    student_log_count INT NOT NULL DEFAULT 0 COMMENT '生成学生日志数',
    class_log_count INT NOT NULL DEFAULT 0 COMMENT '生成班级日志数',
    skipped_log_count INT NOT NULL DEFAULT 0 COMMENT '幂等跳过日志数',
    error_message VARCHAR(1024) NULL COMMENT '失败原因',
    operator_id BIGINT NULL COMMENT '触发人用户ID',
    operator_name VARCHAR(128) NULL COMMENT '触发人名称快照',
    started_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '开始时间',
    finished_at DATETIME NULL COMMENT '结束时间',
    version INT NOT NULL DEFAULT 0 COMMENT '乐观锁版本号',
    deleted INT NOT NULL DEFAULT 0 COMMENT '逻辑删除：0-未删除，1-已删除',
    create_by VARCHAR(64) NULL COMMENT '创建人',
    create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_by VARCHAR(64) NULL COMMENT '更新人',
    update_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (id),
    UNIQUE KEY uk_cpr_school_year (school_id, promotion_academic_year),
    KEY idx_cpr_status (run_status, started_at, deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='班级年度升学日志生成批次表';
```

- [ ] **Step 5: Add nullable relationship effective-period columns first**

Do not add generated unique keys in the same `ALTER TABLE` that introduces the new state columns. First add nullable fields and indexes:

```sql
ALTER TABLE student_class
    ADD COLUMN school_id BIGINT NULL COMMENT '学校ID，冗余class.school_id，用于学校内当前班级唯一约束' AFTER class_id,
    ADD COLUMN effective_start_date DATE NULL COMMENT '生效开始日期' AFTER school_id,
    ADD COLUMN effective_end_date DATE NULL COMMENT '生效结束日期，NULL表示当前有效' AFTER effective_start_date,
    ADD COLUMN status TINYINT NOT NULL DEFAULT 1 COMMENT '状态：1-有效，0-停用' AFTER effective_end_date,
    ADD COLUMN join_reason VARCHAR(64) NULL COMMENT '加入原因' AFTER status,
    ADD COLUMN leave_reason VARCHAR(64) NULL COMMENT '离开原因' AFTER join_reason,
    ADD KEY idx_sc_class_effective (class_id, status, effective_start_date, effective_end_date, deleted);

ALTER TABLE class_student_entity
    ADD COLUMN school_id BIGINT NULL COMMENT '学校ID，冗余class.school_id，用于学校内当前班级唯一约束' AFTER class_id,
    ADD COLUMN effective_start_date DATE NULL COMMENT '生效开始日期' AFTER school_id,
    ADD COLUMN effective_end_date DATE NULL COMMENT '生效结束日期，NULL表示当前有效' AFTER effective_start_date,
    ADD COLUMN status TINYINT NOT NULL DEFAULT 1 COMMENT '状态：1-有效，0-停用' AFTER effective_end_date,
    ADD COLUMN join_reason VARCHAR(64) NULL COMMENT '加入原因' AFTER status,
    ADD COLUMN leave_reason VARCHAR(64) NULL COMMENT '离开原因' AFTER join_reason,
    ADD KEY idx_cse_class_effective (class_id, status, effective_start_date, effective_end_date, deleted);

ALTER TABLE teacher_class_subject
    ADD COLUMN effective_start_date DATE NULL COMMENT '生效开始日期' AFTER subject_id,
    ADD COLUMN effective_end_date DATE NULL COMMENT '生效结束日期，NULL表示当前有效' AFTER effective_start_date,
    ADD COLUMN status TINYINT NOT NULL DEFAULT 1 COMMENT '状态：1-有效，0-停用' AFTER effective_end_date,
    ADD KEY idx_tcs_class_effective (class_id, status, effective_start_date, effective_end_date, deleted),
    ADD KEY idx_tcs_teacher_effective (teacher_id, status, effective_start_date, effective_end_date, deleted);

UPDATE student_class
JOIN class c ON c.id = student_class.class_id AND c.deleted = 0
SET student_class.school_id = c.school_id,
    student_class.effective_start_date = DATE(student_class.create_time),
    student_class.status = 1
WHERE student_class.effective_start_date IS NULL AND student_class.deleted = 0;

UPDATE class_student_entity
JOIN class c ON c.id = class_student_entity.class_id AND c.deleted = 0
SET class_student_entity.school_id = c.school_id,
    class_student_entity.effective_start_date = DATE(class_student_entity.create_time),
    class_student_entity.status = 1
WHERE class_student_entity.effective_start_date IS NULL AND class_student_entity.deleted = 0;

UPDATE teacher_class_subject
SET effective_start_date = DATE(create_time), status = 1
WHERE effective_start_date IS NULL AND deleted = 0;
```

Verify `school_id` is fully backfilled, then make it required:

```sql
SELECT COUNT(*) AS missing_student_class_school
FROM student_class
WHERE deleted = 0 AND school_id IS NULL;

SELECT COUNT(*) AS missing_class_student_entity_school
FROM class_student_entity
WHERE deleted = 0 AND school_id IS NULL;

ALTER TABLE student_class
    MODIFY COLUMN school_id BIGINT NOT NULL COMMENT '学校ID，冗余class.school_id，用于学校内当前班级唯一约束';

ALTER TABLE class_student_entity
    MODIFY COLUMN school_id BIGINT NOT NULL COMMENT '学校ID，冗余class.school_id，用于学校内当前班级唯一约束';
```

- [ ] **Step 6: Normalize historical duplicates before adding active unique keys**

Run duplicate checks:

```sql
SELECT school_id, student_id, COUNT(*) AS cnt FROM student_class
WHERE deleted = 0 AND status = 1 AND effective_end_date IS NULL
GROUP BY school_id, student_id HAVING COUNT(*) > 1;

SELECT school_id, student_entity_id, COUNT(*) AS cnt FROM class_student_entity
WHERE deleted = 0 AND status = 1 AND effective_end_date IS NULL
GROUP BY school_id, student_entity_id HAVING COUNT(*) > 1;
```

If duplicates exist in the same school, close all but the latest relation before adding unique keys. Use latest row by `COALESCE(update_time, create_time)` then `id`. The following SQL is MySQL 5.7-compatible and does not rely on window functions:

```sql
UPDATE student_class sc
JOIN (
    SELECT old_sc.id
    FROM student_class old_sc
    JOIN student_class latest_sc
      ON latest_sc.school_id = old_sc.school_id
     AND latest_sc.student_id = old_sc.student_id
     AND latest_sc.deleted = 0
     AND latest_sc.status = 1
     AND latest_sc.effective_end_date IS NULL
     AND (
         COALESCE(latest_sc.update_time, latest_sc.create_time) > COALESCE(old_sc.update_time, old_sc.create_time)
         OR (
             COALESCE(latest_sc.update_time, latest_sc.create_time) = COALESCE(old_sc.update_time, old_sc.create_time)
             AND latest_sc.id > old_sc.id
         )
     )
    WHERE old_sc.deleted = 0
      AND old_sc.status = 1
      AND old_sc.effective_end_date IS NULL
) duplicated_sc ON duplicated_sc.id = sc.id
SET sc.status = 0,
    sc.effective_end_date = DATE(COALESCE(sc.update_time, sc.create_time)),
    sc.leave_reason = 'HISTORICAL_DEDUP',
    sc.update_time = NOW()
WHERE sc.deleted = 0;

UPDATE class_student_entity cse
JOIN (
    SELECT old_cse.id
    FROM class_student_entity old_cse
    JOIN class_student_entity latest_cse
      ON latest_cse.school_id = old_cse.school_id
     AND latest_cse.student_entity_id = old_cse.student_entity_id
     AND latest_cse.deleted = 0
     AND latest_cse.status = 1
     AND latest_cse.effective_end_date IS NULL
     AND (
         COALESCE(latest_cse.update_time, latest_cse.create_time) > COALESCE(old_cse.update_time, old_cse.create_time)
         OR (
             COALESCE(latest_cse.update_time, latest_cse.create_time) = COALESCE(old_cse.update_time, old_cse.create_time)
             AND latest_cse.id > old_cse.id
         )
     )
    WHERE old_cse.deleted = 0
      AND old_cse.status = 1
      AND old_cse.effective_end_date IS NULL
) duplicated_cse ON duplicated_cse.id = cse.id
SET cse.status = 0,
    cse.effective_end_date = DATE(COALESCE(cse.update_time, cse.create_time)),
    cse.leave_reason = 'HISTORICAL_DEDUP',
    cse.update_time = NOW()
WHERE cse.deleted = 0;
```

Run duplicate checks again. They must return zero rows before continuing.

- [ ] **Step 7: Add generated active unique keys after duplicates are closed**

Use this DDL only after Step 6 passes:

```sql
ALTER TABLE student_class
    ADD COLUMN current_active_student_key BIGINT GENERATED ALWAYS AS (
        CASE WHEN deleted = 0 AND status = 1 AND effective_end_date IS NULL THEN student_id ELSE NULL END
    ) STORED COMMENT '当前有效学生唯一键',
    ADD UNIQUE KEY uk_sc_current_school_student (school_id, current_active_student_key);

ALTER TABLE class_student_entity
    ADD COLUMN current_active_student_entity_key BIGINT GENERATED ALWAYS AS (
        CASE WHEN deleted = 0 AND status = 1 AND effective_end_date IS NULL THEN student_entity_id ELSE NULL END
    ) STORED COMMENT '当前有效学生实体唯一键',
    ADD UNIQUE KEY uk_cse_current_school_student_entity (school_id, current_active_student_entity_key);
```

- [ ] **Step 8: Add verification SQL to the same file**

Append:

```sql
SHOW CREATE TABLE class_head_teacher;
SHOW CREATE TABLE class_operation_log;
SHOW CREATE TABLE class_promotion_run;

SELECT COUNT(*) AS class_head_teacher_count FROM class_head_teacher WHERE deleted = 0;
SELECT COUNT(*) AS class_operation_log_count FROM class_operation_log WHERE deleted = 0;
SELECT COUNT(*) AS class_promotion_run_count FROM class_promotion_run WHERE deleted = 0;
```

- [ ] **Step 9: Review uniqueness strategy**

Record this note in the SQL file comments:

```sql
-- 当前班主任唯一性由 class_head_teacher.current_active_key 生成列 + uk_cht_current_class 保证。
-- Service 以数据库唯一键作为最终并发保证；DuplicateKeyException 必须转换为业务错误。
-- SELECT class WHERE id = ? FOR UPDATE 仅作为可选增强。若启用，必须放在 @Transactional(rollbackFor = Exception.class) 的班主任变更方法内。
-- class_operation_log 为追加型审计日志，不提供业务逻辑删除。event_key 全局唯一。
-- 升学批次按 school_id + promotion_academic_year 复用同一行重置状态，不通过软删除重建批次。
-- event_key 生成格式建议：
-- PROMOTION:{schoolId}:{toAcademicYear}:{classId}:{targetType}:{targetId}
-- 班级自身 targetId 使用 classId。
```

---

## Task 1B: Create Student Management Import Migration

**Files:**
- Create: `D:\codes\work\docs\06-sql\migrations\2026-06-09-student-management-import-workflow.sql`

- [ ] **Step 0: Add account and parent prerequisites**

Add the migration pieces required by student account provisioning and parent binding. Use idempotent guards in the actual SQL script according to the project's migration style.

Required schema/seed changes:

```sql
-- Current StudentPO already maps student.user_id. Verify the column exists first.
-- If the production schema lacks it, add the column; otherwise only add the index if missing.
SHOW COLUMNS FROM student LIKE 'user_id';
ALTER TABLE student
    ADD KEY idx_student_user_id (user_id);

-- If users does not already have explicit default-password flags, add them.
ALTER TABLE users
    ADD COLUMN default_password_flag TINYINT NOT NULL DEFAULT 0 COMMENT '是否仍使用导入默认密码：0-否，1-是',
    ADD COLUMN password_reset_required TINYINT NOT NULL DEFAULT 0 COMMENT '是否需要强制修改密码：0-否，1-是';

-- Seed the parent role. The actual script should use INSERT ... SELECT ... WHERE NOT EXISTS.
-- Existing SysRolePO.role_type is Integer; follow existing role seed convention where 1 means system/built-in role.
INSERT INTO sys_role (role_name, role_code, role_type, description, permissions, status, sort_order, version, deleted)
SELECT '学生家长', 'STUDENT_PARENT', 1, '学生家长，可查看已绑定学生的受限信息', NULL, 1, 50, 0, 0
WHERE NOT EXISTS (
    SELECT 1 FROM sys_role WHERE role_code = 'STUDENT_PARENT' AND deleted = 0
);
```

If the current production schema already contains equivalent fields or indexes, do not add duplicates; update entity mapping and SQL verification to match the real column names. If the parent-facing page is implemented in the same release, seed the minimal `sys_role_permission` rows for `STUDENT_PARENT`; otherwise document that the role exists for binding and the precise menu/permission grant is deferred to the parent-side page plan.

- [ ] **Step 1: Create `student_operation_log`**

Use an append-only log for student detail history. This is separate from `class_operation_log` because student name, phone, status, account binding, and import events are not always class-scoped.

```sql
CREATE TABLE IF NOT EXISTS student_operation_log (
    id BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    event_key VARCHAR(191) NULL COMMENT '幂等事件键',
    school_id BIGINT NOT NULL COMMENT '学校ID',
    student_entity_id BIGINT NULL COMMENT '学生实体ID，关联student.id',
    user_id BIGINT NULL COMMENT '绑定用户ID，关联users.id',
    class_id BIGINT NULL COMMENT '发生时班级ID，可为空',
    operation_type VARCHAR(64) NOT NULL COMMENT '操作类型：CREATE/UPDATE/STATUS_CHANGE/BIND_ACCOUNT/IMPORT_CREATE等',
    target_field VARCHAR(64) NULL COMMENT '变更字段',
    before_value VARCHAR(512) NULL COMMENT '变更前展示值',
    after_value VARCHAR(512) NULL COMMENT '变更后展示值',
    before_snapshot LONGTEXT NULL COMMENT '变更前JSON快照',
    after_snapshot LONGTEXT NULL COMMENT '变更后JSON快照',
    display_message VARCHAR(512) NOT NULL COMMENT '前端展示文案',
    operator_id BIGINT NULL COMMENT '操作人用户ID',
    operator_name VARCHAR(128) NULL COMMENT '操作人名称快照',
    operation_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '操作时间',
    remark VARCHAR(512) NULL COMMENT '备注',
    deleted INT NOT NULL DEFAULT 0 COMMENT '保留字段：日志按追加审计设计，不提供业务逻辑删除',
    create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (id),
    UNIQUE KEY uk_sol_event_key (event_key),
    KEY idx_sol_student_time (student_entity_id, operation_time, deleted),
    KEY idx_sol_user_time (user_id, operation_time, deleted),
    KEY idx_sol_school_time (school_id, operation_time, deleted),
    KEY idx_sol_class_time (class_id, operation_time, deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='学生操作历史日志表';
```

- [ ] **Step 2: Create `student_import_task`**

```sql
CREATE TABLE IF NOT EXISTS student_import_task (
    id BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    task_no VARCHAR(64) NOT NULL COMMENT '导入任务编号',
    school_id BIGINT NOT NULL COMMENT '学校ID',
    original_file_name VARCHAR(255) NOT NULL COMMENT '原始文件名',
    file_oss_path VARCHAR(512) NULL COMMENT '上传文件OSS路径或文件记录引用',
    task_status VARCHAR(32) NOT NULL COMMENT 'PARSING/PARSED/IMPORTING/COMPLETED/FAILED/CANCELLED',
    total_count INT NOT NULL DEFAULT 0 COMMENT '识别学生数',
    importable_count INT NOT NULL DEFAULT 0 COMMENT '可导入数',
    pending_count INT NOT NULL DEFAULT 0 COMMENT '需处理数',
    imported_count INT NOT NULL DEFAULT 0 COMMENT '已导入数',
    ignored_count INT NOT NULL DEFAULT 0 COMMENT '已忽略数',
    failed_count INT NOT NULL DEFAULT 0 COMMENT '失败数',
    progress_percent INT NOT NULL DEFAULT 0 COMMENT '解析或导入进度0-100',
    error_message VARCHAR(1024) NULL COMMENT '任务级错误',
    operator_id BIGINT NULL COMMENT '操作人ID',
    operator_name VARCHAR(128) NULL COMMENT '操作人名称快照',
    started_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '开始时间',
    finished_at DATETIME NULL COMMENT '完成时间',
    deleted INT NOT NULL DEFAULT 0 COMMENT '逻辑删除：0-未删除，1-已删除',
    create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (id),
    UNIQUE KEY uk_sit_task_no (task_no),
    KEY idx_sit_school_status (school_id, task_status, create_time, deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='学生批量导入任务表';
```

- [ ] **Step 3: Create `student_import_row`**

```sql
CREATE TABLE IF NOT EXISTS student_import_row (
    id BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    task_id BIGINT NOT NULL COMMENT '导入任务ID',
    row_no INT NOT NULL COMMENT 'Excel/CSV行号',
    row_status VARCHAR(32) NOT NULL COMMENT 'IMPORTABLE/PENDING/IMPORTED/IGNORED/FAILED',
    exception_type VARCHAR(64) NULL COMMENT '异常类型：CLASS_NOT_FOUND/PHONE_INVALID/DUPLICATE_STUDENT等',
    exception_message VARCHAR(1024) NULL COMMENT '异常说明',
    raw_snapshot LONGTEXT NULL COMMENT '原始行JSON',
    fixed_snapshot LONGTEXT NULL COMMENT '修正后JSON',
    school_id BIGINT NULL COMMENT '解析后的学校ID',
    class_id BIGINT NULL COMMENT '解析或修正后的班级ID',
    matched_student_entity_id BIGINT NULL COMMENT '重复或合并候选学生实体ID',
    imported_student_entity_id BIGINT NULL COMMENT '最终导入学生实体ID',
    imported_user_id BIGINT NULL COMMENT '最终创建或绑定的学生账号ID，关联users.id',
    generated_username VARCHAR(32) NULL COMMENT '导入生成的学生账号',
    default_password_flag TINYINT NOT NULL DEFAULT 0 COMMENT '学生账号是否使用默认密码',
    student_name VARCHAR(128) NULL COMMENT '学生姓名',
    gender VARCHAR(16) NULL COMMENT '性别',
    grade_name VARCHAR(64) NULL COMMENT '年级名称',
    class_name VARCHAR(128) NULL COMMENT '班级名称',
    parent_phone VARCHAR(32) NULL COMMENT '兼容字段：首个家长手机号',
    parent_contacts_json LONGTEXT NULL COMMENT '家长联系人JSON数组，支持多个手机号、关系、主监护人标记',
    parent_binding_status VARCHAR(32) NULL COMMENT 'PARENT_MISSING/PARENT_BOUND/PARENT_PARTIAL/PARENT_FAILED',
    parent_binding_message VARCHAR(1024) NULL COMMENT '家长绑定结果说明',
    student_status VARCHAR(32) NULL COMMENT '学生状态',
    handler_action VARCHAR(32) NULL COMMENT 'MERGE/IGNORE/MARK_PENDING/FIX_AND_IMPORT',
    handler_id BIGINT NULL COMMENT '处理人ID',
    handler_name VARCHAR(128) NULL COMMENT '处理人名称快照',
    handled_at DATETIME NULL COMMENT '处理时间',
    deleted INT NOT NULL DEFAULT 0 COMMENT '逻辑删除：0-未删除，1-已删除',
    create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (id),
    UNIQUE KEY uk_sir_task_row (task_id, row_no),
    KEY idx_sir_task_status (task_id, row_status, deleted),
    KEY idx_sir_exception (task_id, exception_type, deleted),
    KEY idx_sir_student_entity (imported_student_entity_id, deleted),
    KEY idx_sir_imported_user (imported_user_id, deleted),
    KEY idx_sir_generated_username (generated_username, deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='学生批量导入行明细表';
```

- [ ] **Step 4: Add verification SQL**

```sql
SHOW CREATE TABLE student_operation_log;
SHOW CREATE TABLE student_import_task;
SHOW CREATE TABLE student_import_row;
SHOW COLUMNS FROM users LIKE 'default_password_flag';
SHOW COLUMNS FROM users LIKE 'password_reset_required';
SHOW COLUMNS FROM student LIKE 'user_id';
SELECT role_code, role_name FROM sys_role WHERE role_code = 'STUDENT_PARENT' AND deleted = 0;

SELECT COUNT(*) AS student_operation_log_count FROM student_operation_log WHERE deleted = 0;
SELECT COUNT(*) AS student_import_task_count FROM student_import_task WHERE deleted = 0;
SELECT COUNT(*) AS student_import_row_count FROM student_import_row WHERE deleted = 0;
```

---

## Task 2: Add Entities and Mappers

**Files:**
- Create: `D:\codes\work\axon-common\src\main\java\com\xinxi\axon\common\entity\school\ClassHeadTeacherPO.java`
- Create: `D:\codes\work\axon-common\src\main\java\com\xinxi\axon\common\entity\school\ClassOperationLogPO.java`
- Create: `D:\codes\work\axon-common\src\main\java\com\xinxi\axon\common\entity\school\ClassPromotionRunPO.java`
- Create: `D:\codes\work\axon-common\src\main\java\com\xinxi\axon\common\mapper\school\ClassHeadTeacherMapper.java`
- Create: `D:\codes\work\axon-common\src\main\java\com\xinxi\axon\common\mapper\school\ClassOperationLogMapper.java`
- Create: `D:\codes\work\axon-common\src\main\java\com\xinxi\axon\common\mapper\school\ClassPromotionRunMapper.java`

- [ ] **Step 1: Create `ClassHeadTeacherPO`**

```java
package com.xinxi.axon.common.entity.school;

import com.baomidou.mybatisplus.annotation.FieldFill;
import com.baomidou.mybatisplus.annotation.FieldStrategy;
import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableLogic;
import com.baomidou.mybatisplus.annotation.TableName;
import com.baomidou.mybatisplus.annotation.Version;
import com.xinxi.axon.common.base.BaseModel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.experimental.Accessors;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@EqualsAndHashCode(callSuper = false)
@Accessors(chain = true)
@TableName("class_head_teacher")
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class ClassHeadTeacherPO extends BaseModel {
    @TableId(value = "id", type = IdType.AUTO)
    private Long id;

    @TableField("class_id")
    private Long classId;

    @TableField("teacher_id")
    private Long teacherId;

    @TableField("effective_start_date")
    private LocalDate effectiveStartDate;

    @TableField("effective_end_date")
    private LocalDate effectiveEndDate;

    @TableField("status")
    private Integer status;

    @Version
    @TableField("version")
    private Integer version;

    @TableLogic
    @TableField("deleted")
    private Integer deleted;

    @TableField("create_by")
    private String createBy;

    @TableField(value = "create_time", fill = FieldFill.INSERT)
    private LocalDateTime createTime;

    @TableField("update_by")
    private String updateBy;

    @TableField(value = "update_time", fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;

    @TableField(value = "current_active_key", insertStrategy = FieldStrategy.NEVER, updateStrategy = FieldStrategy.NEVER)
    private Long currentActiveKey;
}
```

- [ ] **Step 2: Create `ClassOperationLogPO`**

```java
package com.xinxi.axon.common.entity.school;

import com.baomidou.mybatisplus.annotation.FieldFill;
import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.baomidou.mybatisplus.annotation.Version;
import com.xinxi.axon.common.base.BaseModel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.experimental.Accessors;

import java.time.LocalDateTime;

@Data
@EqualsAndHashCode(callSuper = false)
@Accessors(chain = true)
@TableName("class_operation_log")
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class ClassOperationLogPO extends BaseModel {
    /**
     * Append-only audit table.
     * Do not add @TableLogic to deleted, otherwise event_key idempotency queries may miss audit rows.
     */
    @TableId(value = "id", type = IdType.AUTO)
    private Long id;

    @TableField("event_key")
    private String eventKey;

    @TableField("source_type")
    private String sourceType;

    @TableField("reason_type")
    private String reasonType;

    @TableField("school_id")
    private Long schoolId;

    @TableField("class_id")
    private Long classId;

    @TableField("operation_type")
    private String operationType;

    @TableField("target_type")
    private String targetType;

    @TableField("target_id")
    private Long targetId;

    @TableField("target_name")
    private String targetName;

    @TableField("from_academic_year")
    private Integer fromAcademicYear;

    @TableField("to_academic_year")
    private Integer toAcademicYear;

    @TableField("from_grade_id")
    private Long fromGradeId;

    @TableField("from_grade_name")
    private String fromGradeName;

    @TableField("to_grade_id")
    private Long toGradeId;

    @TableField("to_grade_name")
    private String toGradeName;

    @TableField("from_class_id")
    private Long fromClassId;

    @TableField("from_class_name")
    private String fromClassName;

    @TableField("to_class_id")
    private Long toClassId;

    @TableField("to_class_name")
    private String toClassName;

    @TableField("before_snapshot")
    private String beforeSnapshot;

    @TableField("after_snapshot")
    private String afterSnapshot;

    @TableField("display_message")
    private String displayMessage;

    @TableField("operator_id")
    private Long operatorId;

    @TableField("operator_name")
    private String operatorName;

    @TableField("operation_time")
    private LocalDateTime operationTime;

    @TableField("remark")
    private String remark;

    @Version
    @TableField("version")
    private Integer version;

    @TableField("deleted")
    private Integer deleted;

    @TableField("create_by")
    private String createBy;

    @TableField(value = "create_time", fill = FieldFill.INSERT)
    private LocalDateTime createTime;

    @TableField("update_by")
    private String updateBy;

    @TableField(value = "update_time", fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;
}
```

- [ ] **Step 3: Create `ClassPromotionRunPO`**

```java
package com.xinxi.axon.common.entity.school;

import com.baomidou.mybatisplus.annotation.FieldFill;
import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableLogic;
import com.baomidou.mybatisplus.annotation.TableName;
import com.baomidou.mybatisplus.annotation.Version;
import com.xinxi.axon.common.base.BaseModel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.experimental.Accessors;

import java.time.LocalDateTime;

@Data
@EqualsAndHashCode(callSuper = false)
@Accessors(chain = true)
@TableName("class_promotion_run")
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class ClassPromotionRunPO extends BaseModel {
    @TableId(value = "id", type = IdType.AUTO)
    private Long id;

    @TableField("school_id")
    private Long schoolId;

    @TableField("promotion_academic_year")
    private Integer promotionAcademicYear;

    @TableField("from_academic_year")
    private Integer fromAcademicYear;

    @TableField("run_status")
    private String runStatus;

    @TableField("class_count")
    private Integer classCount;

    @TableField("teacher_log_count")
    private Integer teacherLogCount;

    @TableField("student_log_count")
    private Integer studentLogCount;

    @TableField("class_log_count")
    private Integer classLogCount;

    @TableField("skipped_log_count")
    private Integer skippedLogCount;

    @TableField("error_message")
    private String errorMessage;

    @TableField("operator_id")
    private Long operatorId;

    @TableField("operator_name")
    private String operatorName;

    @TableField("started_at")
    private LocalDateTime startedAt;

    @TableField("finished_at")
    private LocalDateTime finishedAt;

    @Version
    @TableField("version")
    private Integer version;

    @TableLogic
    @TableField("deleted")
    private Integer deleted;

    @TableField("create_by")
    private String createBy;

    @TableField(value = "create_time", fill = FieldFill.INSERT)
    private LocalDateTime createTime;

    @TableField("update_by")
    private String updateBy;

    @TableField(value = "update_time", fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;
}
```

- [ ] **Step 4: Create mapper interfaces**

```java
package com.xinxi.axon.common.mapper.school;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.xinxi.axon.common.entity.school.ClassHeadTeacherPO;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface ClassHeadTeacherMapper extends BaseMapper<ClassHeadTeacherPO> {
}
```

```java
package com.xinxi.axon.common.mapper.school;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.xinxi.axon.common.entity.school.ClassOperationLogPO;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface ClassOperationLogMapper extends BaseMapper<ClassOperationLogPO> {
}
```

```java
package com.xinxi.axon.common.mapper.school;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.xinxi.axon.common.entity.school.ClassPromotionRunPO;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface ClassPromotionRunMapper extends BaseMapper<ClassPromotionRunPO> {
}
```

- [ ] **Step 5: Compile mapper/entity layer**

Run:

```powershell
mvn -pl axon-common -am -DskipTests compile
```

Expected: compile succeeds or only fails on not-yet-created service references if later tasks have already been partially edited.

---

## Task 3: Add DTO, VO, and Enum Contracts

**Files:**
- Create DTO/VO/enum files listed in File Map.
- Modify: `ClassVO.java`, `ClassDetailVO.java`.

- [ ] **Step 1: Create operation enums**

`ClassOperationTypeEnum` values:

```java
CLASS_CREATE,
CLASS_UPDATE,
CLASS_DELETE,
CLASS_PROMOTION,
HEAD_TEACHER_BIND,
HEAD_TEACHER_CHANGE,
HEAD_TEACHER_UNBIND,
HEAD_TEACHER_PROMOTION,
SUBJECT_TEACHER_BIND,
SUBJECT_TEACHER_UPDATE,
SUBJECT_TEACHER_UNBIND,
SUBJECT_TEACHER_PROMOTION,
REGISTERED_STUDENT_JOIN,
REGISTERED_STUDENT_TRANSFER,
REGISTERED_STUDENT_LEAVE,
REGISTERED_STUDENT_PROMOTION,
STUDENT_ENTITY_JOIN,
STUDENT_ENTITY_TRANSFER,
STUDENT_ENTITY_LEAVE,
STUDENT_ENTITY_PROMOTION
```

`ClassOperationTargetTypeEnum` values:

```java
CLASS,
HEAD_TEACHER,
SUBJECT_TEACHER,
REGISTERED_STUDENT,
STUDENT_ENTITY
```

`ClassOperationReasonEnum` values:

```java
NORMAL_JOIN,
NEW_STUDENT_INSERT,
TRANSFER_IN,
TRANSFER_OUT,
SCHOOL_TRANSFER_IN,
SCHOOL_TRANSFER_OUT,
DROPOUT,
GRADUATION,
PROMOTION,
MANUAL_ADJUSTMENT
```

`ClassOperationSourceEnum` values:

```java
MANUAL,
PROMOTION,
SYSTEM
```

`ClassGradeProgressionStatusEnum` values:

```java
IN_PROGRESS,
GRADUATED,
MISSING_ENROLLMENT_YEAR,
MISSING_GRADE,
MISSING_GRADE_SEQUENCE,
OUT_OF_SCHOOL_STAGE
```

- [ ] **Step 2: Create head teacher DTOs**

`ClassHeadTeacherBindDTO` fields:

```java
@NotNull
private Long classId;

@NotNull
private Long teacherId;

private LocalDate effectiveStartDate;

private String remark;
```

`ClassHeadTeacherDeleteDTO` fields:

```java
@NotNull
private Long classId;

private Long teacherId;

private LocalDate effectiveEndDate;

private String remark;
```

- [ ] **Step 3: Create log query DTO**

`ClassOperationLogPageQueryDTO` fields:

```java
@NotNull
private Long schoolId;

private Long classId;

private String operationType;

private String targetType;

private Long targetId;

private String sourceType;

private String reasonType;

private Integer academicYear;

private LocalDateTime startTime;

private LocalDateTime endTime;

private Integer pageNum = 1;

private Integer pageSize = 20;
```

Modify existing `ClassPageQueryDTO`:

```java
@Schema(description = "起始年级ID，兼容旧gradeId语义")
private Long gradeId;

@Schema(description = "动态计算后的当前年级ID")
private Long currentGradeId;
```

Modify existing movement DTOs in-place, do not create duplicate DTO classes:

```java
// com.xinxi.axon.common.dto.school.StudentClassBindDTO
// com.xinxi.axon.common.dto.student.ClassStudentEntityBindDTO
// com.xinxi.axon.common.dto.student.ClassStudentEntityUpdateDTO
@Schema(description = "变更原因，见ClassOperationReasonEnum")
private String reasonType;

@Size(max = 512)
@Schema(description = "备注")
private String remark;
```

`reasonType` must be validated against `ClassOperationReasonEnum`; invalid values return `PARAM_ERROR`.

- [ ] **Step 4: Create VO fields**

`ClassHeadTeacherVO` fields:

```java
private Long id;
private Long classId;
private Long teacherId;
private String teacherName;
private LocalDate effectiveStartDate;
private LocalDate effectiveEndDate;
private Integer status;
```

`ClassOperationLogVO` fields:

```java
private Long id;
private Long schoolId;
private Long classId;
private String className;
private String operationType;
private String operationTypeName;
private String targetType;
private String targetTypeName;
private Long targetId;
private String targetName;
private String sourceType;
private String reasonType;
private Integer fromAcademicYear;
private Integer toAcademicYear;
private Long fromGradeId;
private String fromGradeName;
private Long toGradeId;
private String toGradeName;
private Long fromClassId;
private String fromClassName;
private Long toClassId;
private String toClassName;
private String displayMessage;
private Long operatorId;
private String operatorName;
private LocalDateTime operationTime;
private String remark;
```

`ClassGradeProgressionVO` fields:

```java
private Integer enrollmentYear;
private Integer currentAcademicYear;
private Long startGradeId;
private String startGradeName;
private Integer startGradeProgressionOrder;
private Long currentGradeId;
private String currentGradeName;
private Integer currentGradeProgressionOrder;
private Integer gradeOffset;
private String gradeProgressionStatus;
private String gradeProgressionStatusName;
```

`ClassPromotionMaterializeDTO` fields:

```java
@NotNull
private Long schoolId;

@NotNull
private Integer promotionAcademicYear;

private List<Long> classIds;

private Boolean dryRun = false;

private String remark;
```

`ClassPromotionMaterializeResultVO` fields:

```java
private Long runId;
private Long schoolId;
private Integer fromAcademicYear;
private Integer promotionAcademicYear;
private Integer classCount;
private Integer classLogCount;
private Integer teacherLogCount;
private Integer studentLogCount;
private Integer skippedLogCount;
private String runStatus;
private String errorMessage;
```

- [ ] **Step 5: Extend class list/detail VOs**

Add fields to `ClassVO` and `ClassDetailVO`:

```java
@Schema(description = "当前学年起始年")
private Integer currentAcademicYear;

@Schema(description = "起始年级ID")
private Long startGradeId;

@Schema(description = "起始年级名称")
private String startGradeName;

@Schema(description = "动态计算后的当前年级ID")
private Long currentGradeId;

@Schema(description = "动态计算后的当前年级名称")
private String currentGradeName;

@Schema(description = "入学后第几年，一年级为1")
private Integer gradeOffset;

@Schema(description = "年级推进状态")
private String gradeProgressionStatus;

@Schema(description = "当前班主任")
private ClassHeadTeacherVO headTeacher;
```

- [ ] **Step 6: Compile DTO/VO contracts**

Run:

```powershell
mvn -pl axon-common -am -DskipTests compile
```

Expected: compile succeeds before service references are wired.

---

## Task 4: Implement Dynamic Grade Progression

**Files:**
- Create: `ClassGradeProgressionService.java`
- Create: `ClassGradeProgressionServiceImpl.java`
- Modify: `ClassMapper.java`
- Create or Modify: `ClassMapper.xml`
- Modify: `ClassServiceImpl.java`
- Test: `ClassGradeProgressionServiceImplTest.java`

- [ ] **Step 1: Write service contract**

Contract:

```java
public interface ClassGradeProgressionService {
    ClassGradeProgressionVO resolve(ClassPO classPO);

    ClassGradeProgressionVO resolve(ClassPO classPO, LocalDate asOfDate);

    Map<Long, ClassGradeProgressionVO> resolveBatch(List<ClassPO> classes, LocalDate asOfDate);
}
```

- [ ] **Step 2: Implement academic year helper**

Use this exact rule:

```java
private int resolveAcademicYear(LocalDate asOfDate) {
    LocalDate schoolYearStart = LocalDate.of(asOfDate.getYear(), 9, 1);
    if (asOfDate.isBefore(schoolYearStart)) {
        return asOfDate.getYear() - 1;
    }
    return asOfDate.getYear();
}
```

- [ ] **Step 3: Implement grade offset**

Use:

```java
private int resolveGradeOffset(int currentAcademicYear, int enrollmentYear) {
    return currentAcademicYear - enrollmentYear + 1;
}
```

Guard:

```java
if (classPO.getEnrollmentYear() == null) {
    return missingStatus(classPO, currentAcademicYear, ClassGradeProgressionStatusEnum.MISSING_ENROLLMENT_YEAR);
}
```

- [ ] **Step 4: Resolve current grade from `grade_progression_order`**

Before coding this step, complete Task 1 grade migration and verify `grade_progression_order`:

```text
grade.display_order remains a UI display-sort field.
grade.grade_progression_order is the only field used for administrative promotion.
Ordinary administrative grades should map to 1..12.
Textbook-only or non-administrative grade rows should keep grade_progression_order NULL.
```

Algorithm:

```java
GradePO startGrade = gradeMapper.selectById(classPO.getGradeId());
if (startGrade == null || Objects.equals(startGrade.getDeleted(), 1)) {
    return missingStatus(classPO, currentAcademicYear, ClassGradeProgressionStatusEnum.MISSING_GRADE);
}
int academicYearDelta = currentAcademicYear - classPO.getEnrollmentYear();
if (startGrade.getGradeProgressionOrder() == null) {
    return missingStatus(classPO, currentAcademicYear, ClassGradeProgressionStatusEnum.MISSING_GRADE_SEQUENCE);
}
int targetProgressionOrder = startGrade.getGradeProgressionOrder() + academicYearDelta;
List<GradePO> visibleGrades = gradeMapper.selectList(
    new LambdaQueryWrapper<GradePO>()
        .eq(GradePO::getDeleted, 0)
        .eq(GradePO::getIsVisible, 1)
        .isNotNull(GradePO::getGradeProgressionOrder)
        .orderByAsc(GradePO::getGradeProgressionOrder)
);
GradePO currentGrade = visibleGrades.stream()
    .filter(grade -> Objects.equals(grade.getGradeProgressionOrder(), targetProgressionOrder))
    .findFirst()
    .orElse(null);
if (currentGrade == null) {
    return graduatedStatus(classPO, currentAcademicYear, gradeOffset);
}
```

- [ ] **Step 5: Apply school-stage boundary rules by progression order**

Do not use `phase_id` alone to determine promotion scope. Add a small internal stage resolver based on `grade_progression_order`:

```java
private SchoolStage resolveStage(Integer progressionOrder) {
    if (progressionOrder == null) {
        return SchoolStage.UNKNOWN;
    }
    if (progressionOrder >= 1 && progressionOrder <= 6) {
        return SchoolStage.PRIMARY;
    }
    if (progressionOrder >= 7 && progressionOrder <= 9) {
        return SchoolStage.JUNIOR;
    }
    if (progressionOrder >= 10 && progressionOrder <= 12) {
        return SchoolStage.SENIOR;
    }
    return SchoolStage.UNKNOWN;
}
```

If `resolveStage(startGrade.gradeProgressionOrder) != resolveStage(targetProgressionOrder)`, return `GRADUATED` for this class and do not silently cross into the next stage. This keeps ordinary same-stage promotion separate from cross-stage graduation/new-class creation.

- [ ] **Step 6: Batch integration to avoid N+1**

In `resolveBatch`, load all start grade records by `gradeId` once, load all visible administrative grade records ordered by `gradeProgressionOrder` once, and compute `Map<classId, ClassGradeProgressionVO>` in memory. Do not group by `phaseId` or `displayOrder`.

- [ ] **Step 7: Enrich `ClassServiceImpl.convertToClassVO`**

Change converter to accept precomputed progression:

```java
private ClassVO convertToClassVO(ClassPO classPO, ClassGradeProgressionVO progression) {
    ClassVO vo = new ClassVO();
    vo.setId(classPO.getId());
    vo.setClassName(classPO.getClassName());
    vo.setGradeId(classPO.getGradeId());
    vo.setSchoolId(classPO.getSchoolId());
    vo.setAcademicYear(classPO.getAcademicYear());
    vo.setSemester(classPO.getSemester());
    vo.setEnrollmentYear(classPO.getEnrollmentYear());
    vo.setCreateTime(classPO.getCreateTime());
    vo.setUpdateTime(classPO.getUpdateTime());
    applyGradeProgression(vo, progression);
    return vo;
}
```

- [ ] **Step 8: Add SQL-level current grade pagination**

For `pageClass`:

- `gradeId` keeps the old meaning: filter by starting grade `class.grade_id`.
- `currentGradeId` is a SQL-level dynamic filter. Do not filter it after `Page<ClassPO>` has already paginated.
- Add a mapper query such as `selectClassPageWithCurrentGrade(Page<?> page, ClassPageQueryDTO dto, Integer currentAcademicYear)` returning rows that include `current_grade_id/current_grade_name/current_grade_sequence/start_grade_name`.
- The SQL must join `grade` twice:
  - `start_grade.id = c.grade_id`
  - `current_grade.grade_progression_order = start_grade.grade_progression_order + (#{currentAcademicYear} - c.enrollment_year)`.
- The SQL `WHERE` must include `current_grade.id = #{dto.currentGradeId}` when `currentGradeId` is present.
- The returned `IPage` total must be the database total after the `currentGradeId` predicate.

Example mapper SQL shape:

```xml
<select id="selectClassPageWithCurrentGrade" resultMap="ClassWithCurrentGradeResultMap">
    SELECT
        c.*,
        start_grade.grade_name AS start_grade_name,
        current_grade.id AS current_grade_id,
        current_grade.grade_name AS current_grade_name,
        current_grade.grade_progression_order AS current_grade_sequence
    FROM class c
    LEFT JOIN grade start_grade
      ON start_grade.id = c.grade_id
     AND start_grade.deleted = 0
    LEFT JOIN grade current_grade
      ON current_grade.deleted = 0
     AND current_grade.is_visible = 1
     AND current_grade.grade_progression_order = start_grade.grade_progression_order + (#{currentAcademicYear} - c.enrollment_year)
    WHERE c.deleted = 0
      <if test="dto.schoolId != null">AND c.school_id = #{dto.schoolId}</if>
      <if test="dto.gradeId != null">AND c.grade_id = #{dto.gradeId}</if>
      <if test="dto.currentGradeId != null">AND current_grade.id = #{dto.currentGradeId}</if>
      <if test="dto.className != null and dto.className != ''">AND c.class_name LIKE CONCAT('%', #{dto.className}, '%')</if>
      <if test="dto.academicYear != null">AND c.academic_year = #{dto.academicYear}</if>
      <if test="dto.semester != null">AND c.semester = #{dto.semester}</if>
      <if test="dto.enrollmentYear != null">AND c.enrollment_year = #{dto.enrollmentYear}</if>
    ORDER BY c.create_time DESC
</select>
```

Rows whose start grade has no `grade_progression_order` must return `MISSING_GRADE_SEQUENCE` in service enrichment and should not match `currentGradeId` filtering.

- [ ] **Step 9: Update grouped query semantics**

For `getGradeWithClasses`:

- build groups by `progression.currentGradeId`, not by `classPO.gradeId`;
- group label uses `currentGradeName`;
- update `queryGradesByClassGrouping` to accept the grouped `currentGradeId` set, query grade rows by that set, and sort by the current grade sequence;
- each `ClassDetailVO` still returns `startGradeId/startGradeName` and `currentGradeId/currentGradeName`.

This avoids a class displaying “三年级” while still being grouped under “一年级”.

- [ ] **Step 10: Test Aug 31 and Sep 1 boundaries**

Test cases:

```java
// enrollmentYear=2024, asOfDate=2025-08-31 => currentAcademicYear=2024, gradeOffset=1
// enrollmentYear=2024, asOfDate=2025-09-01 => currentAcademicYear=2025, gradeOffset=2
// startGrade gradeProgressionOrder=7, enrollmentYear=2024, asOfDate=2024-09-01 => currentGradeName=七年级
// startGrade gradeProgressionOrder=7, enrollmentYear=2024, asOfDate=2025-09-01 => currentGradeName=八年级
// startGrade gradeProgressionOrder=7, enrollmentYear=2024, asOfDate=2027-09-01 => GRADUATED
// enrollmentYear=null => MISSING_ENROLLMENT_YEAR
// currentGradeId filter returns classes whose dynamic current grade matches the filter, with SQL total matching returned records
// grade-with-classes groups by dynamic current grade, not class.gradeId
// queryGradesByClassGrouping queries grade metadata by currentGradeId, not start gradeId
```

- [ ] **Step 11: Run tests**

Run:

```powershell
mvn -pl axon-common -Dtest=ClassGradeProgressionServiceImplTest test
```

Expected: all grade progression tests pass.

---

## Task 5: Implement Operation Log Service

**Files:**
- Create: `ClassOperationLogService.java`
- Create: `ClassOperationLogServiceImpl.java`
- Test: `ClassOperationLogServiceImplTest.java`

- [ ] **Step 1: Define service contract**

```java
public interface ClassOperationLogService extends IService<ClassOperationLogPO> {
    Long appendLog(ClassOperationLogPO log);

    Long appendLogIfAbsent(ClassOperationLogPO log);

    PageResultVO<ClassOperationLogVO> pageLogs(ClassOperationLogPageQueryDTO dto);

    Long appendClassLog(Long classId, String operationType, String beforeSnapshot, String afterSnapshot,
                        Long operatorId, String operatorName, String remark);

    Long appendTargetLog(Long classId, String operationType, String targetType, Long targetId, String targetName,
                         String beforeSnapshot, String afterSnapshot, Long operatorId, String operatorName, String remark);
}
```

- [ ] **Step 2: Build display messages centrally**

Use deterministic messages:

```java
HEAD_TEACHER_BIND -> "设置班主任：{targetName}"
HEAD_TEACHER_CHANGE -> "变更班主任：{beforeName} -> {targetName}"
HEAD_TEACHER_UNBIND -> "移除班主任：{targetName}"
SUBJECT_TEACHER_BIND -> "添加任课老师：{targetName}"
SUBJECT_TEACHER_UPDATE -> "调整任课老师：{targetName}"
SUBJECT_TEACHER_UNBIND -> "移除任课老师：{targetName}"
REGISTERED_STUDENT_JOIN -> "学生加入班级：{targetName}"
REGISTERED_STUDENT_TRANSFER -> "学生改班：{targetName}"
REGISTERED_STUDENT_LEAVE -> "学生离开班级：{targetName}"
REGISTERED_STUDENT_PROMOTION -> "学生随班升学：{targetName}，{fromGradeName} -> {toGradeName}"
STUDENT_ENTITY_JOIN -> "学生实体加入班级：{targetName}"
STUDENT_ENTITY_TRANSFER -> "学生实体改班：{targetName}"
STUDENT_ENTITY_LEAVE -> "学生实体离开班级：{targetName}"
STUDENT_ENTITY_PROMOTION -> "学生实体随班升学：{targetName}，{fromGradeName} -> {toGradeName}"
CLASS_PROMOTION -> "班级升学：{fromGradeName} -> {toGradeName}"
HEAD_TEACHER_PROMOTION -> "班主任随班升学：{targetName}，{fromGradeName} -> {toGradeName}"
SUBJECT_TEACHER_PROMOTION -> "任课老师随班升学：{targetName}，{fromGradeName} -> {toGradeName}"
CLASS_UPDATE -> "修改班级信息"
```

For student reason text, append reason label when available:

```java
NEW_STUDENT_INSERT -> "新生插班"
TRANSFER_IN -> "校内转入"
TRANSFER_OUT -> "校内转出"
SCHOOL_TRANSFER_IN -> "转学入"
SCHOOL_TRANSFER_OUT -> "转学出"
DROPOUT -> "退学"
GRADUATION -> "毕业离班"
PROMOTION -> "随班升学"
```

- [ ] **Step 3: Implement page query**

Filters:

```java
wrapper.eq(ClassOperationLogPO::getDeleted, 0)
    .eq(dto.getSchoolId() != null, ClassOperationLogPO::getSchoolId, dto.getSchoolId())
    .eq(dto.getClassId() != null, ClassOperationLogPO::getClassId, dto.getClassId())
    .eq(StringUtils.hasText(dto.getOperationType()), ClassOperationLogPO::getOperationType, dto.getOperationType())
    .eq(StringUtils.hasText(dto.getTargetType()), ClassOperationLogPO::getTargetType, dto.getTargetType())
    .eq(dto.getTargetId() != null, ClassOperationLogPO::getTargetId, dto.getTargetId())
    .eq(StringUtils.hasText(dto.getSourceType()), ClassOperationLogPO::getSourceType, dto.getSourceType())
    .eq(StringUtils.hasText(dto.getReasonType()), ClassOperationLogPO::getReasonType, dto.getReasonType())
    .eq(dto.getAcademicYear() != null, ClassOperationLogPO::getToAcademicYear, dto.getAcademicYear())
    .ge(dto.getStartTime() != null, ClassOperationLogPO::getOperationTime, dto.getStartTime())
    .le(dto.getEndTime() != null, ClassOperationLogPO::getOperationTime, dto.getEndTime())
    .orderByDesc(ClassOperationLogPO::getOperationTime);
```

- [ ] **Step 4: Implement idempotent append**

Use `eventKey` for promotion and other generated events:

```java
public Long appendLogIfAbsent(ClassOperationLogPO log) {
    if (!StringUtils.hasText(log.getEventKey())) {
        return appendLog(log);
    }
    try {
        return appendLog(log);
    } catch (DuplicateKeyException e) {
        return getIdByEventKeyIncludingAuditRows(log.getEventKey());
    }
}
```

Implement `getIdByEventKeyIncludingAuditRows` without relying on `deleted=0`, because `class_operation_log` is append-only audit data and `event_key` is globally unique. If MyBatis-Plus table logic is not used on `ClassOperationLogPO`, a normal `LambdaQueryWrapper` by `eventKey` is sufficient.

For stricter database-level idempotency, add mapper SQL in `ClassOperationLogMapper`:

```sql
INSERT INTO class_operation_log (...) VALUES (...)
ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id)
```

Then return `LAST_INSERT_ID()`.

- [ ] **Step 5: Add tests**

Test:

```java
appendTargetLog(classId, HEAD_TEACHER_BIND, HEAD_TEACHER, teacherId, "张老师", null, afterJson, operatorId, "管理员", "初始化")
```

Expected:

```text
log.schoolId is resolved from class.schoolId
log.displayMessage = 设置班主任：张老师
log.operationTime is not null
pageLogs can filter by classId and operationType
appendLogIfAbsent with same eventKey returns existing id and does not insert duplicate
two concurrent appendLogIfAbsent calls for same eventKey return one persisted row
```

---

## Task 6: Implement Promotion Log Materialization Service

**Files:**
- Create: `ClassPromotionMaterializationService.java`
- Create: `ClassPromotionMaterializationServiceImpl.java`
- Create: `ClassPromotionRunMapper.java`
- Test: `ClassPromotionMaterializationServiceImplTest.java`

- [ ] **Step 1: Define service contract**

```java
public interface ClassPromotionMaterializationService {
    ClassPromotionMaterializeResultVO materializePromotionLogs(ClassPromotionMaterializeDTO dto,
                                                               Long operatorId,
                                                               String operatorName);
}
```

- [ ] **Step 2: Resolve promotion window**

For `promotionAcademicYear = 2026`:

```java
int fromAcademicYear = promotionAcademicYear - 1;
LocalDate promotionDate = schoolAcademicCalendarService.resolvePromotionDate(dto.getSchoolId(), promotionAcademicYear);
LocalDate fromDate = promotionDate.minusDays(1);
LocalDate toDate = promotionDate;
```

Use `ClassGradeProgressionService.resolve(classPO, fromDate)` and `resolve(classPO, toDate)` to produce `fromGrade` and `toGrade`.

Skip a class when:

```text
from status is not IN_PROGRESS
to status is not IN_PROGRESS
fromGradeId equals toGradeId
```

- [ ] **Step 3: Create or reuse promotion run**

Before generating logs:

```java
ClassPromotionRunPO existing = promotionRunMapper.selectOne(new LambdaQueryWrapper<ClassPromotionRunPO>()
    .eq(ClassPromotionRunPO::getSchoolId, dto.getSchoolId())
    .eq(ClassPromotionRunPO::getPromotionAcademicYear, dto.getPromotionAcademicYear())
    .last("LIMIT 1"));
```

If existing status is `SUCCESS` and `dryRun` is not true, return counts from existing; do not insert duplicate logs. If existing status is `FAILED`, reuse the same row by resetting status to `RUNNING`, clearing `errorMessage`, and recomputing counts. Do not soft-delete and recreate promotion run rows.

- [ ] **Step 4: Generate class promotion log**

For each promoted class, write one `CLASS_PROMOTION` log:

```text
eventKey = PROMOTION:{schoolId}:{promotionAcademicYear}:{classId}:CLASS:{classId}
sourceType = PROMOTION
reasonType = PROMOTION
operationType = CLASS_PROMOTION
targetType = CLASS
targetId = classId
targetName = className
fromAcademicYear = promotionAcademicYear - 1
toAcademicYear = promotionAcademicYear
fromGradeId/fromGradeName from previous resolve result
toGradeId/toGradeName from current resolve result
fromClassId/toClassId = classId
fromClassName/toClassName = className
displayMessage = 班级升学：{className}，{fromGradeName} -> {toGradeName}
```

- [ ] **Step 5: Generate head teacher promotion log**

For head teacher active on `promotionDate`:

```text
eventKey = PROMOTION:{schoolId}:{promotionAcademicYear}:{classId}:HEAD_TEACHER:{teacherId}
operationType = HEAD_TEACHER_PROMOTION
targetType = HEAD_TEACHER
targetId = teacherId
targetName = teacherName
displayMessage = 班主任随班升学：{teacherName}，{className} {fromGradeName} -> {toGradeName}
```

If no head teacher is active on `promotionDate`, do not generate a head teacher log. The absence itself can be found by class detail; do not create synthetic “无班主任” logs.

- [ ] **Step 6: Generate subject teacher promotion logs**

For each `teacher_class_subject` row effective on `promotionDate`:

```text
eventKey = PROMOTION:{schoolId}:{promotionAcademicYear}:{classId}:SUBJECT_TEACHER:{teacherId}:{subjectId}
operationType = SUBJECT_TEACHER_PROMOTION
targetType = SUBJECT_TEACHER
targetId = teacherId
targetName = teacherName + optional subjectName
displayMessage = 任课老师随班升学：{teacherName}，{subjectName}，{fromGradeName} -> {toGradeName}
```

Do not close or recreate teacher-subject relations during ordinary same-stage promotion; this service only records the event. Cross-stage graduation/new-class creation must be handled by a separate class transition flow that closes and opens relation records.

- [ ] **Step 7: Generate registered student promotion logs**

For each `student_class` row effective on `promotionDate`:

```text
eventKey = PROMOTION:{schoolId}:{promotionAcademicYear}:{classId}:REGISTERED_STUDENT:{studentId}
operationType = REGISTERED_STUDENT_PROMOTION
targetType = REGISTERED_STUDENT
targetId = studentId
targetName = user nickname/profile realName or studentId string
displayMessage = 学生随班升学：{targetName}，{className} {fromGradeName} -> {toGradeName}
```

- [ ] **Step 8: Generate student entity promotion logs**

For each `class_student_entity` row effective on `promotionDate`:

```text
eventKey = PROMOTION:{schoolId}:{promotionAcademicYear}:{classId}:STUDENT_ENTITY:{studentEntityId}
operationType = STUDENT_ENTITY_PROMOTION
targetType = STUDENT_ENTITY
targetId = studentEntityId
targetName = student.realName or studentEntityId string
displayMessage = 学生实体随班升学：{targetName}，{className} {fromGradeName} -> {toGradeName}
```

- [ ] **Step 9: Support dry run**

When `dto.getDryRun()` is true:

```text
Do not insert class_promotion_run.
Do not insert class_operation_log.
Return computed class/teacher/student log counts and skippedLogCount.
```

- [ ] **Step 10: Add tests**

Test cases:

```text
promotionAcademicYear=2026 with class enrollmentYear=2025 creates CLASS_PROMOTION from 一年级 to 二年级
same materialize request twice creates no duplicate logs because eventKey is stable
teacher in two classes receives one promotion log per class
class with head teacher, subject teacher, registered student, student entity creates all four target categories
dryRun returns counts and inserts no logs
```

---

## Task 7: Implement Head Teacher Service

**Files:**
- Create: `ClassHeadTeacherService.java`
- Create: `ClassHeadTeacherServiceImpl.java`
- Test: `ClassHeadTeacherServiceImplTest.java`
- Modify: `ClassServiceImpl.java`

- [ ] **Step 1: Define service contract**

```java
public interface ClassHeadTeacherService extends IService<ClassHeadTeacherPO> {
    Long bindHeadTeacher(ClassHeadTeacherBindDTO dto, Long operatorId, String operatorName);

    Boolean unbindHeadTeacher(ClassHeadTeacherDeleteDTO dto, Long operatorId, String operatorName);

    ClassHeadTeacherVO getCurrentByClassId(Long classId);

    List<ClassHeadTeacherVO> listCurrentByClassIds(List<Long> classIds);

    List<ClassHeadTeacherVO> listCurrentByTeacherId(Long teacherId);
}
```

- [ ] **Step 2: Implement one-current-head-teacher rule**

Inside `@Transactional(rollbackFor = Exception.class)`:

```java
ClassHeadTeacherPO current = getOne(new LambdaQueryWrapper<ClassHeadTeacherPO>()
    .eq(ClassHeadTeacherPO::getClassId, dto.getClassId())
    .eq(ClassHeadTeacherPO::getStatus, 1)
    .isNull(ClassHeadTeacherPO::getEffectiveEndDate)
    .eq(ClassHeadTeacherPO::getDeleted, 0)
    .last("LIMIT 1"));
```

If `current == null`, insert a new current row and log `HEAD_TEACHER_BIND`.

If `current.getTeacherId().equals(dto.getTeacherId())`, return `current.getId()` without inserting duplicate log.

If current teacher differs:

```java
current.setEffectiveEndDate(resolveStartDate(dto).minusDays(1));
current.setStatus(0);
updateById(current);
save(newHeadTeacher);
append HEAD_TEACHER_CHANGE log with before and after snapshots.
```

If a duplicate-current insert/update still hits `DuplicateKeyException` from `uk_cht_current_class`, translate it to a clear business error and ask the caller to retry.

The required concurrency guarantee is the generated unique key `uk_cht_current_class`. `FOR UPDATE` is optional. If enabling it, add this mapper method and call it before reading current head teacher, inside the same transaction:

```java
@Select("SELECT * FROM class WHERE id = #{id} AND deleted = 0 FOR UPDATE")
ClassPO selectByIdForUpdate(@Param("id") Long id);
```

Do not introduce `selectByIdForUpdate` as an undocumented convention; keep the SQL on `ClassMapper` or in `ClassMapper.xml`, and verify no other transaction locks tables in the opposite order.

- [ ] **Step 3: Validate school boundary and teacher identity**

Before insert/change:

```java
ClassPO classPO = classService.getById(dto.getClassId());
UserPO teacher = userService.getById(dto.getTeacherId());
if (classPO == null || classPO.getDeleted() == 1) throw BusinessException;
if (teacher == null || teacher.getDeleted() == 1) throw BusinessException;
if (!Objects.equals(classPO.getSchoolId(), teacher.getSchoolId())) throw BusinessException;
if (!isTeacherAndAbove(teacher.getId())) throw BusinessException;
```

Use existing role infrastructure, not a newly invented teacher identity abstraction.

Implementation rule:

```java
private boolean isTeacherAndAbove(Long userId) {
    List<RoleVO> roles = sysUserRoleService.getUserRoles(userId);
    if (roles == null || roles.isEmpty()) {
        return false;
    }
    return roles.stream()
        .map(RoleVO::getRoleCode)
        .filter(StringUtils::hasText)
        .map(code -> code.trim().toUpperCase(Locale.ROOT))
        .anyMatch(RoleCodeEnum::isTeacherAndAbove);
}
```

This plan chooses `RoleCodeEnum.isTeacherAndAbove` as the permitted range for班主任, matching existing project conventions in teacher-capable features. Therefore `TEACHER`、教研/备课组长、学校/学段管理员、系统管理员 can be bound only if they also pass the same-school check where applicable. `STUDENT` and ordinary accounts without a teacher-and-above role must be rejected.

- [ ] **Step 4: Allow teacher multi-class**

Do not query or reject existing rows by `teacher_id` except for read APIs. A teacher can have multiple current `class_head_teacher` rows.

- [ ] **Step 5: Enrich class list/detail with head teacher**

In `ClassServiceImpl.pageClass` and `getGradeWithClasses`, after class records are loaded:

```java
Map<Long, ClassHeadTeacherVO> headTeacherMap = classHeadTeacherService.listCurrentByClassIds(classIds)
    .stream()
    .collect(Collectors.toMap(ClassHeadTeacherVO::getClassId, Function.identity(), (left, right) -> left));
```

Set `vo.setHeadTeacher(headTeacherMap.get(classPO.getId()))`.

- [ ] **Step 6: Add tests**

Test cases:

```text
bind class A to teacher 1 => one active row
bind class A to teacher 2 => teacher 1 row closed, teacher 2 active
bind class B to teacher 2 => teacher 2 has two active class rows
bind class A to teacher 2 again => no duplicate active row
two concurrent bind requests for same class cannot create two active head teachers
non-teacher user cannot be bound as head teacher
```

---

## Task 8: Add Controller Endpoints and Operator Context

**Files:**
- Modify: `ClassController.java`

- [ ] **Step 1: Add dependencies**

```java
@Resource
private ClassHeadTeacherService classHeadTeacherService;

@Resource
private ClassOperationLogService classOperationLogService;
```

- [ ] **Step 2: Extract operator for mutating endpoints**

Add `HttpServletRequest request` to mutating methods:

```java
public ApiResult<Long> addClass(@RequestBody @Valid ClassAddDTO dto, HttpServletRequest request)
```

Use:

```java
OperatorContext operator = operatorContextResolver.resolve(request);
Long operatorId = operator.getOperatorId();
String operatorName = operator.getOperatorName();
```

Create `OperatorContextResolver` in common service/support code. It should call `getUserIdFromRequest(request)` through controller code or accept the resolved userId, then load `UserPO` and optional profile data. Name priority:

```text
UserProfilePO.realName -> UserPO.nickName -> UserPO.username -> String.valueOf(userId)
```

`operatorName` may fall back to userId string only when no display name exists; do not make ID string the default path.

- [ ] **Step 3: Add head teacher endpoints**

Routes:

```java
POST /api/v1/school/class/head-teacher/bind
POST /api/v1/school/class/head-teacher/delete
GET  /api/v1/school/class/{classId}/head-teacher
GET  /api/v1/school/class/head-teacher/teacher/{teacherId}/classes
```

Permissions:

```java
@RequirePermission(value = "class:update", description = "班级修改权限")
```

Read endpoints use:

```java
@RequirePermission(value = "class:read", description = "班级查看权限")
```

- [ ] **Step 4: Add log endpoints**

Routes:

```java
POST /api/v1/school/class/logs/page
GET  /api/v1/school/class/{classId}/logs/recent
```

For recent logs, internally call `pageLogs` with:

```java
pageNum = 1
pageSize = 10
classId = path classId
```

- [ ] **Step 5: Add promotion materialization endpoint**

Route:

```java
POST /api/v1/school/class/promotion/materialize-logs
```

Permission:

```java
@RequirePermission(value = "class:update", description = "班级修改权限")
```

Request:

```json
{
  "schoolId": 1,
  "promotionAcademicYear": 2026,
  "classIds": [1001, 1002],
  "dryRun": false,
  "remark": "2026学年升学日志生成"
}
```

Response:

```json
{
  "runId": 1,
  "schoolId": 1,
  "fromAcademicYear": 2025,
  "promotionAcademicYear": 2026,
  "classCount": 2,
  "classLogCount": 2,
  "teacherLogCount": 8,
  "studentLogCount": 96,
  "skippedLogCount": 0,
  "runStatus": "SUCCESS"
}
```

- [ ] **Step 6: Add permissions to student entity class mutation endpoints**

Modify `StudentEntityController`:

```java
@RequirePermission(value = "class:update", description = "班级修改权限")
@PostMapping("/class/bind")
public ApiResult<Long> classBind(...)

@RequirePermission(value = "class:update", description = "班级修改权限")
@PostMapping("/class/update")
public ApiResult<Boolean> classUpdate(...)

@RequirePermission(value = "class:update", description = "班级修改权限")
@PostMapping("/class/delete")
public ApiResult<Boolean> classDelete(...)
```

- [ ] **Step 7: Compile controller**

Run:

```powershell
mvn -pl axon-chat -am -DskipTests compile
```

Expected: compile succeeds.

---

## Task 9: Integrate Logs into Existing Mutations

**Files:**
- Modify: `ClassServiceImpl.java`
- Modify: `TeacherClassSubjectServiceImpl.java`
- Modify: `StudentClassServiceImpl.java`
- Modify: `ClassStudentEntityServiceImpl.java`
- Modify: `StudentEntityController.java`

- [ ] **Step 1: Add operator-aware overloads**

For existing service methods that are called by controllers, add overloads instead of breaking old callers:

```java
Long addClass(ClassAddDTO dto, Long operatorId, String operatorName);
Boolean updateClass(ClassUpdateDTO dto, Long operatorId, String operatorName);
Boolean deleteClass(ClassDeleteDTO dto, Long operatorId, String operatorName);

Long bindStudentClass(StudentClassBindDTO dto, Long operatorId, String operatorName);
Boolean updateStudentClass(StudentClassBindDTO dto, Long operatorId, String operatorName);
Boolean deleteStudentClass(StudentClassBindDTO dto, Long operatorId, String operatorName);

Long bindTeacherClassSubject(TeacherClassSubjectBindDTO dto, Long operatorId, String operatorName);
Boolean updateTeacherClassSubject(TeacherClassSubjectBindDTO dto, Long operatorId, String operatorName);
Boolean deleteTeacherClassSubject(TeacherClassSubjectBindDTO dto, Long operatorId, String operatorName);

Long bind(ClassStudentEntityBindDTO dto, Long operatorId, String operatorName);
Boolean updateClass(ClassStudentEntityUpdateDTO dto, Long operatorId, String operatorName);
Boolean deleteBind(ClassStudentEntityBindDTO dto, Long operatorId, String operatorName);
```

Keep existing methods delegating:

```java
return bindStudentClass(dto, null, null);
```

Modify the existing DTO classes in their current packages. Do not create duplicate DTOs:

```text
com.xinxi.axon.common.dto.school.StudentClassBindDTO
com.xinxi.axon.common.dto.school.TeacherClassSubjectBindDTO
com.xinxi.axon.common.dto.student.ClassStudentEntityBindDTO
com.xinxi.axon.common.dto.student.ClassStudentEntityUpdateDTO
```

- [ ] **Step 2: Log class base changes**

In `ClassServiceImpl.updateClass`, capture before and after snapshots:

```java
ClassPO before = getById(dto.getId());
// perform existing validation and update
ClassPO after = getById(dto.getId());
classOperationLogService.appendClassLog(dto.getId(), CLASS_UPDATE.name(), toJson(before), toJson(after), operatorId, operatorName, dto.getRemark());
```

If `ClassUpdateDTO` has no `remark`, pass `null`.

- [ ] **Step 3: Log registered student changes**

In `StudentClassServiceImpl`:

```text
bind + NORMAL_JOIN => create active relation, REGISTERED_STUDENT_JOIN
bind + NEW_STUDENT_INSERT => create active relation, REGISTERED_STUDENT_JOIN, reasonType=NEW_STUDENT_INSERT
bind + SCHOOL_TRANSFER_IN => create active relation, REGISTERED_STUDENT_JOIN, reasonType=SCHOOL_TRANSFER_IN
update oldClassId -> newClassId => close old active relation, create new active relation, write REGISTERED_STUDENT_TRANSFER on old and new class
delete + SCHOOL_TRANSFER_OUT => close active relation, REGISTERED_STUDENT_LEAVE, reasonType=SCHOOL_TRANSFER_OUT
delete + DROPOUT => close active relation, REGISTERED_STUDENT_LEAVE, reasonType=DROPOUT
delete + GRADUATION => close active relation, REGISTERED_STUDENT_LEAVE, reasonType=GRADUATION
```

Target:

```text
targetType = REGISTERED_STUDENT
targetId = studentId
targetName = user nickName or userId string
fromClassId/fromClassName and toClassId/toClassName must be filled for transfer logs
effective_end_date must be set when leaving/transferring; removeById must not be the primary state transition for normal leave/transfer.
```

If current DTOs do not expose reason, add optional field to `StudentClassBindDTO`:

```java
private String reasonType;
private String remark;
```

Validate `reasonType` against `ClassOperationReasonEnum` and reject invalid values.

- [ ] **Step 4: Log student entity changes**

In `ClassStudentEntityServiceImpl`:

```text
bind + NORMAL_JOIN => create active relation, STUDENT_ENTITY_JOIN
bind + NEW_STUDENT_INSERT => create active relation, STUDENT_ENTITY_JOIN, reasonType=NEW_STUDENT_INSERT
bind + SCHOOL_TRANSFER_IN => create active relation, STUDENT_ENTITY_JOIN, reasonType=SCHOOL_TRANSFER_IN
update oldClassId -> newClassId => close old active relation, create new active relation, write STUDENT_ENTITY_TRANSFER on old and new class
delete + SCHOOL_TRANSFER_OUT => close active relation and update student status if needed, STUDENT_ENTITY_LEAVE, reasonType=SCHOOL_TRANSFER_OUT
delete + DROPOUT => close active relation and update student status, STUDENT_ENTITY_LEAVE, reasonType=DROPOUT
delete + GRADUATION => close active relation and update graduationDate/status, STUDENT_ENTITY_LEAVE, reasonType=GRADUATION
```

Target:

```text
targetType = STUDENT_ENTITY
targetId = studentEntityId
targetName = student.realName or studentEntityId string
fromClassId/fromClassName and toClassId/toClassName must be filled for transfer logs
effective_end_date must be set when leaving/transferring; removeById must not be the primary state transition for normal leave/transfer.
```

If current DTOs do not expose reason, add optional fields to `ClassStudentEntityBindDTO` and `ClassStudentEntityUpdateDTO`:

```java
private String reasonType;
private String remark;
```

Validate `reasonType` against `ClassOperationReasonEnum` and reject invalid values.

- [ ] **Step 5: Enforce current class uniqueness for student entities**

Before binding a student entity:

```java
ClassStudentEntityPO existing = getOne(new LambdaQueryWrapper<ClassStudentEntityPO>()
    .eq(ClassStudentEntityPO::getStudentEntityId, dto.getStudentEntityId())
    .eq(ClassStudentEntityPO::getDeleted, 0)
    .eq(ClassStudentEntityPO::getStatus, 1)
    .isNull(ClassStudentEntityPO::getEffectiveEndDate)
    .last("LIMIT 1"));
if (existing != null && !Objects.equals(existing.getClassId(), dto.getClassId())) {
    throw new BusinessException(ApiResultCode.PARAM_ERROR, "学生实体已绑定其他班级，请使用改班接口");
}
```

- [ ] **Step 6: Prevent registered/student-entity duplicate identity**

When a `StudentPO` has `userId != null`, class student queries and promotion materialization must de-duplicate by that `userId`:

```text
If student entity with userId is active in class_student_entity and the same userId is active in student_class, return/log only one natural student.
Preferred rule for this increment: student entity remains the canonical track until an explicit migration closes class_student_entity.
```

`StudentEntityService.bindAccount` should not silently create a second active `student_class` relation. If migration to registered track is required later, implement an explicit endpoint that closes the entity relation, creates `student_class`, and writes both relation logs.

- [ ] **Step 7: Log subject teacher changes**

In `TeacherClassSubjectServiceImpl`:

```text
bind => SUBJECT_TEACHER_BIND
update => close old relation or update subject according to existing behavior, SUBJECT_TEACHER_UPDATE
delete => close active relation with effective_end_date/status, SUBJECT_TEACHER_UNBIND
```

Target:

```text
targetType = SUBJECT_TEACHER
targetId = teacherId
targetName = teacher nickName or teacherId string
afterSnapshot includes classId and subjectId
For querying promotion snapshots, add `getEffectiveByClassId(Long classId, LocalDate asOfDate)` to return all subject teacher relations effective on that date.
```

- [ ] **Step 8: Keep logs transactional**

Add `@Transactional(rollbackFor = Exception.class)` to mutation methods that write a business table and a log table in the same call. The service method must either commit both changes or roll back both changes.

Do not catch and swallow `classOperationLogService` exceptions inside business mutation methods. If a log insert/update fails, let the exception propagate through the transactional service boundary so the related business write rolls back. Controller-level `catch (Exception e)` may translate the exception into `ApiResult.fail(...)` only after the transaction has already rolled back.

---

## Task 10: API Documentation

**Files:**
- Create: `D:\codes\work\docs\04-api\班级管理扩展接口说明.md`

- [ ] **Step 1: Document head teacher endpoints**

Include request:

```json
{
  "classId": 1001,
  "teacherId": 2001,
  "effectiveStartDate": "2026-09-01",
  "remark": "新学年班主任调整"
}
```

Include response:

```json
{
  "code": 200,
  "message": "success",
  "data": 3001
}
```

- [ ] **Step 2: Document log page endpoint**

Include request:

```json
{
  "schoolId": 1,
  "classId": 1001,
  "operationType": "HEAD_TEACHER_CHANGE",
  "targetType": "HEAD_TEACHER",
  "targetId": 2001,
  "sourceType": "MANUAL",
  "reasonType": "MANUAL_ADJUSTMENT",
  "startTime": "2026-09-01T00:00:00",
  "endTime": "2026-09-30T23:59:59",
  "pageNum": 1,
  "pageSize": 20
}
```

Include response fields:

```json
{
  "id": 1,
  "classId": 1001,
  "operationType": "HEAD_TEACHER_CHANGE",
  "targetType": "HEAD_TEACHER",
  "targetId": 2001,
  "targetName": "张老师",
  "sourceType": "MANUAL",
  "reasonType": "MANUAL_ADJUSTMENT",
  "fromAcademicYear": 2025,
  "toAcademicYear": 2026,
  "fromGradeName": "一年级",
  "toGradeName": "二年级",
  "displayMessage": "变更班主任：李老师 -> 张老师",
  "operatorId": 9001,
  "operatorName": "张管理员",
  "operationTime": "2026-09-01T10:00:00",
  "remark": "新学年班主任调整"
}
```

- [ ] **Step 3: Document dynamic grade fields**

Document fields:

```text
currentAcademicYear: 当前学年起始年，例如 2026 表示 2026-2027 学年
startGradeId/startGradeName: 班级起始年级，来自class.grade_id
currentGradeId: 按入学年动态计算后的当前年级ID
currentGradeName: 按入学年动态计算后的当前年级名称
gradeOffset: 入学后的第几年，一年级为1
gradeProgressionStatus: IN_PROGRESS/GRADUATED/MISSING_ENROLLMENT_YEAR/MISSING_GRADE/MISSING_GRADE_SEQUENCE/OUT_OF_SCHOOL_STAGE
```

Document list query semantics:

```text
gradeId: 起始年级筛选，兼容旧接口
currentGradeId: 动态当前年级筛选
grade-with-classes: 默认按currentGradeId/currentGradeName分组
```

- [ ] **Step 4: Document promotion materialization endpoint**

Include request:

```json
{
  "schoolId": 1,
  "promotionAcademicYear": 2026,
  "classIds": [1001, 1002],
  "dryRun": false,
  "remark": "2026学年升学日志生成"
}
```

Include response:

```json
{
  "runId": 1,
  "schoolId": 1,
  "fromAcademicYear": 2025,
  "promotionAcademicYear": 2026,
  "classCount": 2,
  "classLogCount": 2,
  "teacherLogCount": 8,
  "studentLogCount": 96,
  "skippedLogCount": 0,
  "runStatus": "SUCCESS"
}
```

- [ ] **Step 5: Document student movement reasons**

Document reason values:

```text
NORMAL_JOIN: 普通加入
NEW_STUDENT_INSERT: 新生插班
TRANSFER_IN: 校内转入
TRANSFER_OUT: 校内转出
SCHOOL_TRANSFER_IN: 转学入
SCHOOL_TRANSFER_OUT: 转学出
DROPOUT: 退学
GRADUATION: 毕业离班
PROMOTION: 随班升学
MANUAL_ADJUSTMENT: 人工调整
```

---

## Task 10B: Class Status and Business Eligibility

**Files:**
- Modify: `ClassPO.java`
- Modify: `ClassAddDTO.java`
- Modify: `ClassUpdateDTO.java`
- Modify: `ClassPageQueryDTO.java`
- Modify: `ClassVO.java`
- Modify: `ClassDetailVO.java`
- Modify: `ClassServiceImpl.java`
- Modify: `ClassMapper.xml`
- Create: `ClassStatusEnum.java`
- Create: `SchoolAcademicCalendarService.java`
- Create: `SchoolAcademicCalendarServiceImpl.java`

- [ ] **Step 1: Add class status contract**

Add `classStatus` to `ClassPO`, add optional `classStatus` to update/page query DTOs, and return it in list/detail VOs.

Allowed values:

```text
ACTIVE
DISABLED
GRADUATED
ARCHIVED
```

Default for create is `ACTIVE`. Do not expose `currentGradeId` as an editable field.

- [ ] **Step 2: Filter business-eligible classes**

Add a reusable service method:

```java
boolean isClassSelectableForNewBusiness(ClassPO classPO);
```

It must return true only for:

```text
deleted = 0
classStatus = ACTIVE
gradeProgressionStatus = IN_PROGRESS
```

Use this rule when:

- selecting classes for new student creation,
- resolving classes during new student import,
- exposing class dropdown options for AI correction task creation or future task assignment endpoints touched by this plan.

- [ ] **Step 3: Use school academic calendar service**

Create `SchoolAcademicCalendarService`:

```java
LocalDate resolvePromotionDate(Long schoolId, Integer promotionAcademicYear);
int resolveAcademicYear(Long schoolId, LocalDate asOfDate);
```

Default rule:

```text
promotionDate = August 15 of promotionAcademicYear
```

Do not keep new hardcoded `9月1日` or `8月15日` logic inside `ClassGradeProgressionServiceImpl` or `ClassPromotionMaterializationServiceImpl`; both must call the calendar service.

- [ ] **Step 4: Graduate terminal grades**

When promotion resolution changes a class from `IN_PROGRESS` to terminal graduated status:

- update `class.class_status = GRADUATED`,
- set `class.graduated_at`,
- write `CLASS_GRADUATED` or `CLASS_PROMOTION_TO_GRADUATED` log,
- skip already `DISABLED/GRADUATED/ARCHIVED` classes,
- write failure reason into `class.promotion_exception_message` and `class_promotion_run.error_message` when a class cannot be evaluated.

- [ ] **Step 5: Tests**

Cover:

- active class is selectable,
- disabled/graduated/archived class is not selectable,
- terminal grade promotion sets `GRADUATED`,
- missing enrollment year or grade sequence does not graduate silently and creates an exception result,
- no code path uses 9月1日 directly for the new promotion workflow.

---

## Task 10C: Student Management List, Detail, and History

**Files:**
- Create: `StudentManagementController.java`
- Create: `StudentManagementService.java`
- Create: `StudentManagementServiceImpl.java`
- Create: `StudentOperationLogService.java`
- Create: `StudentOperationLogServiceImpl.java`
- Create: `StudentOperationLogPO.java`
- Create: `StudentOperationLogMapper.java`
- Create: `StudentManagementQueryDTO.java`
- Create: `StudentManagementListItemVO.java`
- Create: `StudentManagementDetailVO.java`
- Create: `StudentOperationLogVO.java`
- Modify: `StudentEntityServiceImpl.java`
- Modify: `ClassStudentQueryServiceImpl.java`

- [ ] **Step 1: Add student management query endpoint**

Add endpoint:

```text
POST /api/v1/student/management/page
```

Query fields:

```text
schoolId
enrollmentYear
currentGradeId
classId
studentStatus
keyword
pageNum
pageSize
```

`keyword` searches:

```text
realName
systemCode
phone
bound user username or phone when available
```

The query must use dynamic current grade resolution consistently with class management. Do not use stale `student.grade_level` as the source of truth for current grade filtering.

- [ ] **Step 2: Add student detail endpoint**

Add endpoint:

```text
GET /api/v1/student/management/{studentEntityId}
```

Return:

```text
basic fields
systemCode
bound userId
accountBindStatus
generated username
defaultPasswordFlag/passwordResetRequired
parentBindingStatus
parent summaries
studentStatus
currentGradeId/currentGradeName
classId/className
operationHistory
```

History is loaded from `student_operation_log` ordered by `operation_time DESC`.

- [ ] **Step 3: Write history for mutations**

When `StudentEntityServiceImpl.add/updateEntity/deleteEntity/bindAccount` changes user-visible fields, append logs:

```text
STUDENT_CREATE
STUDENT_UPDATE
STUDENT_STATUS_CHANGE
STUDENT_BIND_ACCOUNT
STUDENT_DELETE
```

For class changes, keep `class_operation_log` for class timeline and also write `student_operation_log` for student detail history.

- [ ] **Step 4: Validate status and phone**

Add server-side validation:

- student status values are `NORMAL/DISABLED` or mapped explicitly from existing `1/0`,
- phone uses the project's existing mobile-phone validation convention if one exists; otherwise use a small local validator,
- invalid phone blocks manual save and marks import row as `PHONE_INVALID`.

- [ ] **Step 5: Tests**

Cover list filtering by current grade, class and status; keyword search by name/systemCode/phone; detail history order; mutation log insertion.

---

## Task 10D: New Student Import Workflow APIs

**Files:**
- Create: `StudentImportController.java`
- Create: `StudentImportWorkflowService.java`
- Create: `StudentImportWorkflowServiceImpl.java`
- Create: `StudentAccountProvisionService.java`
- Create: `StudentAccountProvisionServiceImpl.java`
- Create: `StudentParentBindingService.java`
- Create: `StudentParentBindingServiceImpl.java`
- Create: `StudentImportTaskPO.java`
- Create: `StudentImportRowPO.java`
- Create: `StudentImportTaskMapper.java`
- Create: `StudentImportRowMapper.java`
- Create: `StudentImportUploadDTO.java`
- Create: `StudentImportConfirmDTO.java`
- Create: `StudentImportRowQueryDTO.java`
- Create: `StudentImportRowFixDTO.java`
- Create: `StudentImportTaskVO.java`
- Create: `StudentImportRowVO.java`
- Create: `StudentImportProperties.java`

- [ ] **Step 1: Keep legacy imports untouched**

Do not modify these existing endpoints for the new UI flow:

```text
/api/v1/excel/import/school-user
/api/v1/excel/import/student-entity
```

The new workflow must be implemented under:

```text
/api/v1/student/imports
```

- [ ] **Step 1B: Add import configuration**

Add typed configuration for:

```text
student.import.default-password
student.import.account.max-username-length=18
student.import.account.school-code-source
```

Rules:

- do not hardcode the default password inside the controller or row parser,
- mask the configured default password in logs,
- fail startup or import confirmation with a clear message if required account-code configuration is missing,
- keep the final generated username length check in service code even if configuration says 18.

- [ ] **Step 2: Add upload-and-parse endpoint**

Endpoint:

```text
POST /api/v1/student/imports/upload
```

Behavior:

- accept `xlsx` and `csv`,
- reject more than 5000 rows,
- create `student_import_task`,
- parse rows into `student_import_row`,
- parse parent contacts as 0..N entries and preserve them in `parent_contacts_json`,
- allow empty parent contacts without making the row invalid,
- classify malformed non-empty parent phones as `PENDING/PARENT_PHONE_INVALID`,
- classify each row as `IMPORTABLE` or `PENDING`,
- return task summary with counts and progress.

- [ ] **Step 3: Add task query endpoint**

Endpoints:

```text
GET /api/v1/student/imports/{taskId}
POST /api/v1/student/imports/{taskId}/rows/page
```

Rows page supports filters:

```text
rowStatus
exceptionType
keyword
```

- [ ] **Step 4: Add confirm import endpoint**

Endpoint:

```text
POST /api/v1/student/imports/{taskId}/confirm
```

Behavior:

- imports only `IMPORTABLE` rows,
- creates `student` and `class_student_entity` records in one transaction per row or controlled batch,
- calls `StudentAccountProvisionService` to create `users` student account, `user_profile` student profile, `sys_user_role` student role, and bind `student.user_id`,
- generates `username` using school code + class code + student sequence, with global uniqueness and max 18-character enforcement,
- stores generated username and default-password flags back to `student_import_row`,
- calls `StudentParentBindingService` for each parsed valid parent contact; empty parent contacts set `parent_binding_status=PARENT_MISSING` and do not block import,
- creates or reuses parent `users`, writes `user_profile` userType=3, assigns `STUDENT_PARENT`, and creates `parent_student` relations using student `users.id`,
- writes `student_operation_log`,
- updates row status to `IMPORTED`,
- leaves `PENDING` rows unchanged for later correction.

- [ ] **Step 5: Add fix and revalidate endpoint**

Endpoint:

```text
POST /api/v1/student/imports/{taskId}/rows/{rowId}/fix
```

Behavior:

- validates corrected name/gender/parentContacts/classId/status,
- `CLASS_NOT_FOUND` rows must be fixed by selecting an existing eligible class,
- `PHONE_INVALID` rows must return field-level error if still invalid,
- `PARENT_PHONE_INVALID` rows must return the invalid parent contact index and field-level reason,
- parent contacts may be cleared to an empty list; this changes the row back to `IMPORTABLE` with `PARENT_MISSING` warning semantics,
- `DUPLICATE_STUDENT` rows return merge candidates and allow `MERGE`, `IGNORE`, or `MARK_PENDING`,
- `ACCOUNT_GENERATE_FAILED` rows can be retried after class/student sequence correction,
- valid fixed rows become `IMPORTABLE`.

- [ ] **Step 6: Add import-fixed endpoint**

Endpoint:

```text
POST /api/v1/student/imports/{taskId}/import-fixed
```

Imports currently `IMPORTABLE` rows that were previously fixed. It must be idempotent: already `IMPORTED/IGNORED` rows are skipped.

- [ ] **Step 7: Tests**

Cover:

- unsupported file type is rejected,
- >5000 rows is rejected,
- class not found becomes `PENDING/CLASS_NOT_FOUND`,
- invalid phone becomes `PENDING/PHONE_INVALID`,
- malformed provided parent phone becomes `PENDING/PARENT_PHONE_INVALID`,
- empty parent contacts are accepted and imported with `PARENT_MISSING`,
- multiple parent contacts create or reuse multiple parent users and `parent_student` rows,
- import creates student `users`, `user_profile`, `sys_user_role`, and `student.user_id` binding,
- generated usernames are unique and no longer than 18 characters,
- duplicate username collision retries or returns `PENDING/ACCOUNT_GENERATE_FAILED`,
- imported student default password is encrypted and default-password flags are set,
- `STUDENT_PARENT` role is seeded and assigned to parent users,
- duplicate student becomes `PENDING/DUPLICATE_STUDENT`,
- confirm imports only valid rows,
- fixed row can be revalidated and imported,
- legacy `/api/v1/excel/import/school-user` is not changed.

---

## Task 10E: Student Parent Binding APIs

**Files:**
- Create: `StudentParentController.java`
- Create: `StudentParentBindingService.java`
- Create: `StudentParentBindingServiceImpl.java`
- Create: `StudentParentSaveDTO.java`
- Create: `StudentParentQueryDTO.java`
- Create: `StudentParentUnbindDTO.java`
- Create: `StudentParentVO.java`

- [ ] **Step 1: Add management endpoints**

Endpoints:

```text
GET /api/v1/student/management/{studentEntityId}/parents
POST /api/v1/student/management/{studentEntityId}/parents
PUT /api/v1/student/management/{studentEntityId}/parents/{relationId}
DELETE /api/v1/student/management/{studentEntityId}/parents/{relationId}
```

Behavior:

- require student management permission and same-school boundary,
- resolve `studentEntityId -> student.user_id` before touching `parent_student`,
- create or reuse parent user by school + phone,
- write or update parent `user_profile` with `user_type=3`,
- assign `STUDENT_PARENT` if missing,
- create, update, or close `parent_student` relation,
- support multiple active parents for one student,
- reject malformed phone numbers with field-level errors.

- [ ] **Step 2: Add parent read scope**

Add a service-level method for parent-side reads:

```java
boolean canParentReadStudent(Long parentUserId, Long studentEntityId);
```

It must return true only when an effective `parent_student` relation exists between `parentUserId` and the student's bound `users.id`.

Current API documentation should state the scope even if the parent-facing page endpoint is implemented later.

- [ ] **Step 3: Tests**

Cover:

- adding a first parent to a student imported without parent phone,
- adding multiple parents to one student,
- reusing an existing parent account in the same school,
- assigning `STUDENT_PARENT` only when missing,
- preventing cross-school parent binding,
- parent read scope rejects unbound students.

---

## Task 11: Validation and Smoke Checks

**Files:**
- No new files unless failures require report notes under `D:\codes\work\docs\05-reports`.

- [ ] **Step 1: Compile common module**

Run:

```powershell
mvn -pl axon-common -am -DskipTests compile
```

Expected: `BUILD SUCCESS`.

- [ ] **Step 2: Compile chat module with controllers**

Run:

```powershell
mvn -pl axon-chat -am -DskipTests compile
```

Expected: `BUILD SUCCESS`.

- [ ] **Step 3: Run focused tests**

Run:

```powershell
mvn -pl axon-common -Dtest=ClassGradeProgressionServiceImplTest,ClassHeadTeacherServiceImplTest,ClassOperationLogServiceImplTest,ClassPromotionMaterializationServiceImplTest,StudentManagementServiceImplTest,StudentImportWorkflowServiceImplTest,StudentAccountProvisionServiceImplTest,StudentParentBindingServiceImplTest test
mvn -pl axon-chat -Dtest=ClassControllerTest,StudentEntityControllerTest,StudentManagementControllerTest,StudentImportControllerTest,StudentParentControllerTest test
```

Expected: all tests pass.

- [ ] **Step 4: SQL verification after user executes migration**

Ask user to execute the migration SQL, then run:

```sql
SHOW TABLES LIKE 'class_head_teacher';
SHOW TABLES LIKE 'class_operation_log';
SHOW TABLES LIKE 'class_promotion_run';
SHOW TABLES LIKE 'student_operation_log';
SHOW TABLES LIKE 'student_import_task';
SHOW TABLES LIKE 'student_import_row';
SHOW COLUMNS FROM users LIKE 'default_password_flag';
SHOW COLUMNS FROM users LIKE 'password_reset_required';
SHOW COLUMNS FROM student LIKE 'user_id';
SELECT role_code, role_name FROM sys_role WHERE role_code = 'STUDENT_PARENT' AND deleted = 0;
SHOW INDEX FROM class_head_teacher;
SHOW INDEX FROM class_operation_log;
SHOW INDEX FROM class_promotion_run;
SHOW INDEX FROM student_operation_log;
SHOW INDEX FROM student_import_task;
SHOW INDEX FROM student_import_row;
SHOW COLUMNS FROM class LIKE 'class_status';
```

Expected:

```text
All class extension tables exist.
All student import workflow tables exist.
class has class_status.
class_head_teacher has idx_cht_class_current and idx_cht_teacher_current.
class_head_teacher has uk_cht_current_class.
class_operation_log has idx_col_class_time and idx_col_school_time.
class_operation_log has uk_col_event_key.
class_promotion_run has uk_cpr_school_year.
student_operation_log has uk_sol_event_key and idx_sol_student_time.
student_import_task has uk_sit_task_no and idx_sit_school_status.
student_import_row has uk_sir_task_row and idx_sir_task_status.
users has default_password_flag and password_reset_required or documented equivalent fields.
student has user_id binding field or documented equivalent relation.
sys_role has STUDENT_PARENT / 学生家长.
student_class has uk_sc_current_school_student and idx_sc_class_effective.
class_student_entity has uk_cse_current_school_student_entity and idx_cse_class_effective.
teacher_class_subject has idx_tcs_class_effective.
```

- [ ] **Step 5: Local API smoke commands**

After user confirms backend restarted and provides a valid token:

```powershell
$token = "<USER_PROVIDED_TOKEN>"
$base = "http://127.0.0.1:8080"

Invoke-RestMethod -Method Post -Uri "$base/api/v1/school/class/head-teacher/bind" `
  -Headers @{ Authorization = "Bearer $token"; "Content-Type" = "application/json" } `
  -Body '{"classId":1001,"teacherId":2001,"effectiveStartDate":"2026-09-01","remark":"接口冒烟"}'

Invoke-RestMethod -Method Get -Uri "$base/api/v1/school/class/1001/head-teacher" `
  -Headers @{ Authorization = "Bearer $token" }

Invoke-RestMethod -Method Post -Uri "$base/api/v1/school/class/logs/page" `
  -Headers @{ Authorization = "Bearer $token"; "Content-Type" = "application/json" } `
  -Body '{"schoolId":1,"classId":1001,"pageNum":1,"pageSize":10}'

Invoke-RestMethod -Method Post -Uri "$base/api/v1/school/class/promotion/materialize-logs" `
  -Headers @{ Authorization = "Bearer $token"; "Content-Type" = "application/json" } `
  -Body '{"schoolId":1,"promotionAcademicYear":2026,"classIds":[1001],"dryRun":true,"remark":"升学日志试算"}'

Invoke-RestMethod -Method Post -Uri "$base/api/v1/student/management/page" `
  -Headers @{ Authorization = "Bearer $token"; "Content-Type" = "application/json" } `
  -Body '{"schoolId":1,"currentGradeId":1,"classId":1001,"studentStatus":"NORMAL","keyword":"","pageNum":1,"pageSize":10}'

Invoke-RestMethod -Method Get -Uri "$base/api/v1/student/management/3001" `
  -Headers @{ Authorization = "Bearer $token" }

Invoke-RestMethod -Method Get -Uri "$base/api/v1/student/imports/1" `
  -Headers @{ Authorization = "Bearer $token" }

Invoke-RestMethod -Method Post -Uri "$base/api/v1/student/management/3001/parents" `
  -Headers @{ Authorization = "Bearer $token"; "Content-Type" = "application/json" } `
  -Body '{"phone":"13800000000","parentName":"测试家长","relationship":"父亲","primary":true}'

Invoke-RestMethod -Method Get -Uri "$base/api/v1/student/management/3001/parents" `
  -Headers @{ Authorization = "Bearer $token" }
```

Expected:

```text
bind returns a relation id.
head-teacher query returns teacherId=2001.
logs/page returns at least one HEAD_TEACHER_BIND log for classId=1001.
promotion dryRun returns class/teacher/student log counts and inserts no logs.
student management page returns records with currentGradeId/currentGradeName and accountBindStatus.
student detail returns operationHistory sorted desc.
student import task query returns task status and counts for an existing task; upload smoke requires a local xlsx/csv fixture and is run only after test data is prepared.
parent add returns relation id or parent binding result.
parent query returns the newly bound parent and relationship.
```

---

## Rollback Plan

- If SQL migration has been executed but application rollout is cancelled:
  - Keep tables in place if no production data issue exists; unused tables do not affect existing logic.
  - If rollback must remove schema, only after confirming both tables are empty:

```sql
SELECT COUNT(*) FROM class_head_teacher;
SELECT COUNT(*) FROM class_operation_log;
SELECT COUNT(*) FROM class_promotion_run;
SELECT COUNT(*) FROM student_operation_log;
SELECT COUNT(*) FROM student_import_task;
SELECT COUNT(*) FROM student_import_row;
DROP TABLE class_head_teacher;
DROP TABLE class_operation_log;
DROP TABLE class_promotion_run;
DROP TABLE student_operation_log;
DROP TABLE student_import_task;
DROP TABLE student_import_row;
```

  - Do not drop `users.default_password_flag`、`users.password_reset_required`、`student.user_id` or the `STUDENT_PARENT` role automatically during rollback if any production data has been written. These fields and role seed are backward-compatible; removing them after account provisioning may orphan student/parent identity data.

- If code rollout fails:
  - Revert code changes from the feature branch.
  - Do not alter existing `class/student_class/class_student_entity/teacher_class_subject/student` data.

## Self-Review

- Spec coverage: 班主任独立建模、一个班级一个当前班主任、老师多班班主任、动态年级、班级业务状态、毕业状态流转、年度升学日志、老师/学生调整日志、学生管理列表与详情历史、新学生导入工作流、导入创建学生账号与档案、学生账号 18 位内唯一生成、默认密码状态记录、多个家长绑定、家长补录接口、插班/转学/退学/毕业原因、学生实体双轨均有对应任务。
- Review finding coverage: 修正了动态年级 phase 误用、动态分组/筛选冲突、SQL 分页与当前年级过滤冲突、`display_order` 不参与升学、改用 `grade_progression_order`、关系表历史重复迁移、升学触发时刻快照风险、班主任并发唯一性、日志幂等并发、升学批次唯一键、学生实体权限、教师身份校验、operatorName 展示名、双轨重复、关系状态流转、班级状态缺失、自动毕业缺失、学生列表详情历史缺失、学生批量导入多阶段流程缺失、旧批量导入用户接口误改风险、学生导入未建 `users/user_profile` 风险、家长手机号单值建模风险、`parent_student` 依赖学生账号 ID 的顺序风险、默认密码登录改造误入本期范围风险。
- Placeholder scan: 本计划没有依赖未命名的文件或空白实现项；需要业务确认的内容已写成假设，不阻塞实现。
- Type consistency: DTO、VO、枚举、Service 方法名在后续任务中保持一致。
- Validation coverage: 包含编译、单元测试、SQL 验证、本地接口冒烟。

## Consensus Gate Before Implementation

- Requirements status: 已由用户补充确认，并写入本计划。
- Plan status: 本文件为实施计划。
- Document review status: 本计划已做自检；正式编码前可再执行一次 `ae-review domain:document`。
- Open decisions: 家长手机号是否允许多个学生共用、重复学生合并是否由后端直接执行、学校编码/班级编码的最终来源字段仍待产品/数据确认；接口先返回可处理异常和候选信息。本轮已确认：`display_order` 仅为显示排序，升学使用新增 `grade_progression_order`；学生当前班级唯一为学校内唯一；班主任允许教师及以上角色；学生批量导入使用新接口族，不改旧批量导入用户接口；导入成功必须创建学生账号、学生档案和学生角色；家长手机号可为空且可后续补录；多个家长手机号需要绑定多个家长账号；新增 `STUDENT_PARENT` / “学生家长”角色；默认密码登录验证与强制改密只记录为后续登录改造，不在本期实现。已采用学校学年日历服务统一触发日，本期默认 8 月 15 日；稳定年级序列 + 学制边界动态推进；SQL 派生当前年级分页；关系有效期快照；数据库唯一键作为班主任唯一性的最终保证；`FOR UPDATE` 仅作为可选增强。
- Validation contract: 至少执行 `mvn -pl axon-chat -am -DskipTests compile`；若新增测试落地，执行 Task 11 的 focused tests。
