---
type: prd
status: completed
date: 2026-06-15
topic: class-create-drawer-backend
originFingerprint: 019ec8a4-23d0-7803-b59f-acc42a26ca79
completedDate: 2026-06-15
archive: docs/00-process/archive/2026-06/class-create-drawer-backend/
---

# PRD: 班级创建抽屉后端接口补齐

## 1. 背景

当前前端班级创建抽屉需要先选择班主任，再根据班主任配置推导学段、入学年份、当前年级和后续科任老师候选。现有接口已经有基础班级创建、班主任绑定、任课老师绑定能力，但缺少面向该 UI 流程的前置选项接口、聚合保存接口和完整校验口径。

相关现状：

- 班级主入口：`/api/v1/school/class`
- 学校教师列表：`/api/v1/school/teachers`
- 班主任关系：`class_head_teacher`
- 任课老师关系：`teacher_class_subject`
- 老师年级/学科配置：`user_subject`
- 年级和学段：`grade.phase_id -> phase.id`
- 班级动态年级推导已有 `ClassGradeProgressionService`
- 现有 `/api/v1/school/teachers` 是通用学校教师列表，不满足班级创建抽屉对年级、标准化学段和科目权限的返回要求；本次不修改该旧接口。

## 2. 目标

为创建班级抽屉补齐后端能力：

1. 前端可以通过新增的班级创建老师列表接口分页搜索当前学校下有效老师+，并拿到老师的年级、标准化学段和科目权限。
2. 前端可以通过新增的学年/入学年份候选接口，根据老师所选年级对应的标准化学段获取候选年份和月份。
3. 前端可以根据老师所选年级、标准化学段和入学年份获取不可编辑的当前年级推导结果。
4. 后端保存班级时强制校验入学年份、学段、班级名称、班主任、重复班级名和班主任有效性。
5. 初中/高中可配置科任老师，候选老师必须具备对应学段/科目权限。
6. 保存成功后返回新班级 ID 和关键展示字段，失败时返回明确错误信息。

## 3. 用户和系统

- 使用者：学校管理员、学段管理员、具备班级管理权限的学校侧人员。
- 前端系统：班级管理页面创建班级抽屉。
- 后端系统：`axon-chat` 暴露 Controller，`axon-common` 承载 DTO/VO、Service、Mapper 和业务校验。

## 4. 功能需求

### FR-1 班主任候选列表

新增班级创建专用班主任候选接口。

能力要求：

- 必须新增接口，不修改、不复用旧的 `/api/v1/school/teachers` 返回契约。
- 查询当前登录用户所属学校下的老师+人员。
- 支持分页。
- 支持手机号搜索；可以兼容姓名/昵称搜索，但手机号搜索必须可用。
- 不返回学生、家长、已删除用户。
- 班主任候选有效口径为 `users.deleted=0`、当前用户学校下、具备有效老师+角色；`user_profile` 与 `user_subject` 只作为姓名、年级、学科展示信息来源，不作为候选准入条件。
- 班主任候选按 `users.create_time DESC, u.id DESC` 排序。
- 返回每个老师的：
  - 用户 ID
  - 姓名/昵称
  - 手机号
  - 角色摘要
  - 已配置年级列表
  - 年级所属原始学段列表
  - 标准化学段类别：`PRIMARY`/`JUNIOR`/`SENIOR`，展示文案为小学/初中/高中
  - 已配置科目列表

### FR-2 学年/入学年份候选

新增班级创建专用学年/入学年份候选接口。

输入：

- `selectedTeacherGradeId`：前端从老师列表返回的年级配置中选择，推荐必传。
- `phaseCategory`：标准化学段类别 `PRIMARY`/`JUNIOR`/`SENIOR`，推荐必传。
- `phaseId`：原始 `phase.id`，可选，仅用于回显或一致性校验，不能作为唯一学段判断依据。
- 可选 `targetAcademicYear`。

规则：

- 后端优先按 `phaseCategory` 生成候选；2026-06-17 起，入学年份选项接口中 `phaseCategory` 未传、为空字符串或空白字符串时，直接返回 `2015` 到服务端当前自然年的全部入学年份选项，不再根据 `selectedTeacherGradeId -> grade.grade_progression_order` 推导标准化学段。
- 若同时传入 `phaseCategory` 和 `selectedTeacherGradeId`，两者推导结果必须一致，否则返回参数错误。
- 小学返回 6 个入学年份选项。
- 初中返回 3 个入学年份选项。
- 高中返回 3 个入学年份选项。
- 空 `phaseCategory` 返回从 2015 到当前自然年的全部入学年份选项，按年份升序返回，`enrollmentMonth` 固定为 9。
- 后端不拼接展示文案；每个选项分开返回 `enrollmentYear` 和 `enrollmentMonth`。
- `enrollmentMonth` 当前固定为 9，前端自行拼接为 `YYYY年9月` 或其他展示文案。
- 值建议使用 `enrollmentYear=YYYY`、`enrollmentMonth=9` 作为接口契约字段。
- 默认目标学年按创建页面语义使用“即将到来的 9 月学年”，而不是简单使用后端当前运行中学年。若当前日期在当年 9 月前，默认 `targetAcademicYear=当前自然年`；若在 9 月后，默认仍为当前自然年。

示例：

- 当前自然年 2026，学段初中：返回 `{ enrollmentYear: 2026, enrollmentMonth: 9 }`、`{ enrollmentYear: 2025, enrollmentMonth: 9 }`、`{ enrollmentYear: 2024, enrollmentMonth: 9 }`。
- 当前自然年 2026，学段小学：返回 `{ enrollmentYear: 2026, enrollmentMonth: 9 }` 到 `{ enrollmentYear: 2020, enrollmentMonth: 9 }`。

### FR-3 当前年级推导

新增当前年级推导接口，或在入学年份候选接口中同时返回每个年份对应的当前年级。

输入：

- `selectedTeacherGradeId`
- `phaseCategory`
- `enrollmentYear`
- `enrollmentMonth`，当前固定为 9
- 可选 `targetAcademicYear`

输出：

- `startGradeId/startGradeName`
- `currentGradeId/currentGradeName`
- `phaseId/phaseName`
- `phaseCategory/phaseCategoryName`
- `targetAcademicYear`
- `gradeOffset`

规则：

- 小学起始为一年级。
- 初中起始为七年级或初一，具体取 `grade.grade_progression_order=7` 的年级记录。
- 高中起始为高一，具体取 `grade.grade_progression_order=10` 的年级记录。
- 当前年级 = 起始年级升学序列 + `targetAcademicYear - enrollmentYear`。
- 前端只展示当前年级，不允许手动改写。
- `phaseId` 不能单独决定小学/初中/高中，因为现有数据中可能存在“义务教育（六三学制）”这类包含多个标准化学段的原始学段。

### FR-4 班级名称候选与重复校验

提供 1 班到 20 班候选。

保存时校验：

- 同一学校。
- 同一入学年份。
- 同一推导当前年级。
- 同一班级名称。
- 未删除班级。

上述范围内班级名称不可重复。

说明：

- 现有 `class.grade_id` 是起始年级，不直接等同当前年级。
- 因此重复校验不能只按 `class.grade_id` 做简单等值；应按 `enrollment_year + startGrade + targetAcademicYear` 推导当前年级后比较，或使用等价 SQL。

### FR-5 聚合保存班级

新增创建班级抽屉专用保存接口。不得增强或修改现有 `/api/v1/school/class/add` 的契约，避免破坏老调用方。

入参至少包含：

- `schoolId`，可选；后端优先使用当前登录用户学校。
- `headTeacherId`
- `selectedTeacherGradeId`
- `phaseCategory`
- `phaseId`，可选，仅回显或一致性校验
- `enrollmentYear`
- `enrollmentMonth`
- `className`
- `classStatus`
- `targetAcademicYear`
- 可选科任老师列表：
  - `teacherId`
  - `subjectId`
  - `academicYear`

保存流程：

1. 校验必填项。
2. 校验班主任存在、未删除、老师+、同校、有效。
3. 根据 `phaseCategory` 或 `selectedTeacherGradeId` 推导标准化学段、起始年级与当前年级。
4. 校验班级名称重复。
5. 创建 `class`：
   - `grade_id` 写起始年级。
   - `enrollment_year` 写入学年份。
   - `academic_year` 建议写 `targetAcademicYear` 或按现有兼容字段规则写入，方案阶段需明确。
   - `semester` 建议固定 `秋季`。
   - `class_status` 写入状态，默认 `ACTIVE`。
6. 创建当前班主任关系 `class_head_teacher`。
7. 如传科任老师，创建当前有效 `teacher_class_subject`。
8. 返回新班级 ID 与班级展示摘要。

事务要求：

- 班级、班主任、科任老师任一关键步骤失败，整体回滚。

### FR-6 科任老师候选

初中、高中配置科任老师时，需要候选老师接口。

能力要求：

- 必须新增接口，不修改、不复用旧的 `/api/v1/school/teachers` 返回契约。
- 入参包含 `phaseCategory`、`selectedTeacherGradeId`、`subjectId`、可选 `academicYear`、分页、手机号/姓名搜索。
- 只返回当前学校老师+。
- 排除无效或停用老师。
- 只返回具备该学段、该科目权限的老师。
- 返回老师 ID、姓名、手机号、匹配的年级/学段/科目摘要。
- 科目摘要只包含本次请求的 `subjectId`，不展开老师其他已配置学科。

### FR-7 错误信息

保存失败时返回明确错误，例如：

- `班主任不能为空`
- `入学年份不能为空`
- `学段不能为空`
- `班级名称不能为空`
- `该入学年份和当前年级下已存在同名班级`
- `班主任不存在或已停用`
- `班主任不属于当前学校`
- `科任老师不具备该学段或科目权限`

## 5. 非目标

- 不改前端 UI。
- 不迁移历史班级数据。
- 不改变 `class.grade_id` 的长期语义；仍按起始年级处理。
- 不修改 `/api/v1/school/teachers`。
- 不修改 `/api/v1/school/class/add`。
- 不把班主任塞进 `teacher_class_subject`。
- 不把考试阅卷关系 `exam_class_teacher` 与长期任课关系混用。
- 不重构现有 `/api/v1/school/teachers` 的返回契约。

## 6. 验收标准

1. 新增的班主任候选接口可分页返回当前学校老师+，支持手机号搜索，按创建时间倒序；若用户配置了年级/学科，则返回年级、原始学段、标准化学段、科目信息；旧 `/api/v1/school/teachers` 不变。
2. 入学年份接口对小学返回 6 个年份，对初中/高中返回 3 个年份；当 `phaseCategory` 为空时返回 2015 到当前自然年的全部年份；所有场景均将年份和月份分开返回。
3. 2026 目标学年下，`phaseCategory=JUNIOR` 且入学年份 2025 可推导到八年级。
4. 创建班级时缺少入学年份、学段、班级名称、班主任任一字段均失败，并返回明确错误。
5. 同一学校、同一入学年份、同一推导当前年级下创建同名班级失败。
6. 有效班主任保存成功后，`class` 和 `class_head_teacher` 同时生成。
7. 初中/高中科任老师不满足学段/科目权限时保存失败并回滚。
8. 老接口 `/api/v1/school/class/add` 和 `/api/v1/school/teachers` 既有调用不被修改、不被破坏。

## 7. 假设

- 原始学段仍以 `phase` 表为准，但班级创建抽屉使用的“小学/初中/高中”必须由后端按年级升学序列归一化返回，不能只依赖 `phaseId`。
- 小学、初中、高中的行政年级可通过 `grade.grade_progression_order` 判定，分别是 1-6、7-9、10-12。
- 科任老师年级/科目权限以 `user_subject` 当前有效记录为准：`deleted=0/status=1`，必要时兼容 `status IS NULL` 需在实施前确认。
- 班主任候选用户有效状态以 `users.deleted=0`、当前用户学校、有效教师及以上角色为准；缺少 `user_profile` 或 `user_subject` 不阻断候选返回。
- 创建页面默认面向即将到来的 9 月学年，所以默认目标学年使用当前自然年。

## 8. 开放问题

1. `class.academic_year` 保存 `targetAcademicYear` 还是保存现有运行中学年？推荐保存 `targetAcademicYear`，但需要确认是否影响旧链路。
2. 小学/初中如果项目内某些学校使用五四制，是否仍固定小学 6 年、初中 3 年？当前需求按 6+3+3 处理。
3. 科任老师是否在第一步保存班级时一起提交，还是第二步单独保存？当前 UI 显示为“下一步设置科任老师”，推荐先保存班级和班主任，再单独保存科任老师草稿或最终配置。

## 9. 验证期望

- 单元测试覆盖年级推导、年份候选、重复校验、老师权限过滤。
- Service 测试覆盖聚合保存事务和失败回滚。
- Controller 层测试覆盖必填校验和接口响应结构。
- 编译验证至少执行 `mvn -pl axon-common,axon-chat -am test` 或按模块执行关键测试。

## 10. 完成状态

- 状态: 已完成并归档。
- 归档目录: `docs/00-process/archive/2026-06/class-create-drawer-backend/`
- 最终 Gate: `docs/ae/gates/20260615T015909Z-work-final.json`
- 已验证命令:
  - `mvn -pl axon-common '-Dtest=ClassCreateOptionServiceImplTest,ClassCreateServiceImplTest,TeacherClassSubjectServiceImplTest' test`
  - `mvn -pl axon-chat -am -DskipTests compile`
- 补充修复验证:
  - `mvn -pl axon-common -Dtest=ClassCreateOptionServiceImplTest test`
- 稳定结论: 本需求通过新增 `/api/v1/school/class/create-drawer/*` 专用接口完成，不修改旧 `/api/v1/school/teachers` 与 `/api/v1/school/class/add` 契约。
