---
type: prd
status: implemented
date: 2026-07-06
topic: student-import-oss-preview
format: human-readable-requirements
sharded: false
---

# PRD: student-import-oss-preview

## Source

- 用户业务描述：班级学生支持按 `classId` 分页查询并按学生名称模糊搜索；学生导入改为前端先获取学生导入专用 OSS STS、上传 Excel 到公共桶 `student-import/{schoolId}/{userId}/...` 路径、后端按 OSS 路径解析并返回行列表，前端确认后才导入绑定班级。
- 截图流程：学生管理列表 -> 详情/新建/修改抽屉 -> 批量导入上传文件 -> 系统解析 -> 确认导入 -> 异常处理。
- UI 截图新增事实：
  - 学生管理页展示统计卡片：学生总数、已绑定、未绑定、禁用。
  - 学生管理列表支持入学年份、年级、班级、状态筛选，并支持按姓名、系统账号、手机号搜索。
  - 列表字段为系统账号、学生姓名、手机号、年级班级、性别、绑定状态、学生状态、更新时间和操作。
  - 详情抽屉展示学生基础信息和修改历史；新建/修改抽屉只暴露姓名、性别、家长手机号、状态等管理页字段。
  - 批量导入页为三步式：上传文件、系统解析、确认导入；确认页展示识别学生、可导入、需处理计数和学生预览；异常页支持按异常类型筛选、修正、合并和忽略。
- 实际模板：`D:/Downloads/学生导入模版.xlsx`，表头为 `序号、年级、班级、学生姓名、性别、学生学号（可选）、手机号码（可选）`。
- 仓库事实：
  - 新学生导入主入口：`axon-chat/src/main/java/com/xinxi/chatservice/controller/student/StudentImportController.java`，当前为 `POST /api/v1/student/imports/upload` multipart 上传。
  - 导入服务：`axon-common/src/main/java/com/xinxi/axon/common/service/student/impl/StudentImportWorkflowServiceImpl.java`，当前解析 `MultipartFile`，确认阶段才创建学生实体、账号、家长绑定和操作日志。
  - 班级学生列表：`axon-chat/src/main/java/com/xinxi/chatservice/controller/student/StudentEntityController.java`，当前 `GET /api/v1/student/entity/class/{classId}/students` 返回 `List<ClassStudentItemVO>`，无分页和姓名模糊搜索。
  - OSS STS：`axon-chat/src/main/java/com/xinxi/chatservice/controller/common/OssUploadStsController.java` 已有通用 STS 能力；本需求需要新增学生导入专用 STS，目标公共桶路径固定为 `student-import/{schoolId}/{userId}/...`。
  - AI 记忆：`docs/08-ai-memory/03-key-workflows.md` 明确新学生导入使用 `/api/v1/student/imports/*`，确认导入只处理 `IMPORTABLE` 行；`docs/08-ai-memory/04-known-pitfalls.md` 记录历史按班级名匹配存在学段真实值坑点。

## AI Parse Contract

- canonicalKind: requirements
- humanEquivalent: true
- stableIdsRequired: true
- noImplicitScope: true

## Goals

- G1: 班级学生列表支持后端分页，按 `classId` 查询当前有效学生关系，并支持学生姓名模糊查询。
- G2: 学生导入支持“前端 OSS 直传 -> 后端解析 OSS 文件 -> 前端预览/修正 -> 确认导入”的四段式流程。
- G3: 解析阶段只创建导入任务与行明细，不创建学生、不绑定班级、不开通账号。
- G4: 确认导入阶段只导入校验通过的数据，并按行绑定到对应班级。
- G5: 导入模板字段与当前业务模板一致，避免要求前端额外提供历史 `学段/班级名称/家长` 字段。
- G6: 后端所有学生导入接口从当前登录用户解析 `userId/schoolId`，不信任前端传入学校 ID。
- G7: 异常明细由后端以结构化数据返回给前端，前端负责导出或下载文件。
- G8: 重复学生必须提供后端处理接口或处理逻辑，允许前端对重复行执行合并、忽略或继续待处理。
- G9: 学生管理页需要后端提供全校维度的分页列表、统计卡片、详情抽屉、新建和修改能力，不只支持班级内学生查询。
- G10: 批量导入后端返回的数据结构必须直接支撑三步式 UI 状态、确认导入预览和异常处理抽屉。

## Requirements

### R1 - 班级学生分页查询

系统必须提供按 `classId` 查询班级学生的分页接口，入参至少包含 `classId`、`keyword`、`pageNum`、`pageSize`。

Acceptance: 前端传入 `classId=70,pageNum=1,pageSize=20,keyword=张` 时，响应返回该班当前有效学生关系中姓名包含“张”的分页结果和 `pageInfo.total/totalPages`。

### R2 - 当前有效关系口径

班级学生分页必须同时覆盖学生实体关系 `class_student_entity` 与兼容旧链路 `student_class`，并限定当前有效关系。

Acceptance: 查询条件对 `class_student_entity` 使用 `deleted=0,status=1,effective_end_date IS NULL`，对 `student_class` 使用同等当前有效口径；同一自然学生双轨同时存在时按既有服务的学生实体优先规则处理。

### R3 - 学生导入专用 OSS STS

系统必须提供学生导入专用 STS 凭证接口，目标为公共桶，上传路径固定收敛到 `student-import/{schoolId}/{userId}/...`。

Acceptance: 当前用户调用专用 STS 接口后，响应中的 `bucket/domain/uploadPath` 指向公共桶和 `student-import/{当前用户schoolId}/{当前userId}/...`；STS policy 只允许该路径前缀下的上传和读取，不授予公共桶全桶写权限。

### R4 - OSS 解析入口

学生导入必须新增或扩展后端接口，接收前端已上传到 OSS 的文件路径或 objectKey，而不是只接收 `MultipartFile`。

Acceptance: 前端上传 `学生导入模版.xlsx` 到专用 STS 返回的 `uploadPath` 下后，调用学生导入解析接口传入 `filePath/objectKey/originalFileName`，后端能读取公共桶文件并创建导入任务。

### R5 - 保留兼容入口

现有 multipart 上传入口不得被破坏，除非前端确认完全下线旧入口。

Acceptance: `POST /api/v1/student/imports/upload` 的现有单测仍通过；新增 OSS 解析入口使用独立 DTO 和方法，避免把 `MultipartFile` 与 OSS 路径混在同一个字段里。

### R6 - 模板字段适配

解析逻辑必须支持当前模板字段：`序号、年级、班级、学生姓名、性别、学生学号（可选）、手机号码（可选）`。

Acceptance: 使用 `D:/Downloads/学生导入模版.xlsx` 的表头时，后端能映射出 `gradeName/className/realName/gender/studentNo/phone`，不因缺少 `学段` 或 `班级名称` 把整行判为必填缺失。

### R7 - 班级绑定目标

导入文件中的班级定位应优先转换为明确的 `classId`，最终确认导入时使用 `classId` 绑定学生到班级。

Acceptance: 行明细返回 `classId/className/currentGradeName`；确认导入调用 `StudentEntityService.add` 时传入行明细中的 `classId`，不在确认阶段重新用班级名称做非确定性匹配。

### R8 - 班级匹配策略

如果文件只包含年级和班级，后端应在解析阶段按当前学校、当前有效班级、动态当前年级和班级名称定位；存在 0 个或多个候选时返回异常行，由前端修正为明确班级。

Acceptance: 0 个候选返回 `CLASS_NOT_FOUND`；多个候选返回新的明确异常类型或错误信息，行状态为 `PENDING`，前端可在修正时选择 `classId`。

### R9 - 解析结果预览

解析成功后必须返回任务统计，并支持分页查询行明细、异常类型筛选和行状态筛选。

Acceptance: 上传解析后前端能展示识别学生数、可导入数、需处理数、异常分类数量，并能分页展示全部行、可导入行、异常行。

### R10 - 前端修正后重校验

异常行必须支持前端修正姓名、性别、学号、手机号、班级 ID 或班级显示字段后重新校验。

Acceptance: 修正手机号错误后行状态可从 `PENDING` 变为 `IMPORTABLE`；修正班级时如果传 `classId`，后端按 `classId` 校验学校归属和有效状态。

### R11 - 确认导入

确认导入只处理 `IMPORTABLE` 行，跳过 `PENDING/IMPORTED/IGNORED/FAILED` 行。

Acceptance: 486 行中 481 行 `IMPORTABLE`、5 行 `PENDING` 时，确认导入结果为导入 481、跳过 5；5 行异常保留在任务中供后续处理。

### R12 - 异常处理

系统必须支持异常行列表按异常类型筛选，至少覆盖班级不存在/不唯一、手机号格式异常、重复学生。

Acceptance: 异常页能按 `CLASS_NOT_FOUND`、`PHONE_INVALID`、`DUPLICATE_STUDENT` 等类型筛选，并返回每类数量。

### R13 - 异常明细数据返回

系统应提供异常明细数据接口，后端返回结构化异常行数据，前端负责执行下载或导出。

Acceptance: 当存在异常行时，前端可调用接口获取包含行号、原始字段、修正字段、异常类型、异常原因和重复候选信息的数据列表；无异常时返回空列表和统计为 0。

### R14 - 重复学生处理

系统必须为重复学生提供处理接口或处理逻辑，支持前端对重复行执行合并、忽略或保持待处理；合并时由前端显式选择是否覆盖已有学生的姓名、手机号、学号。

Acceptance: 对 `DUPLICATE_STUDENT` 行，后端返回可合并候选；前端选择合并后调用处理接口并提交覆盖字段列表，后端校验候选学生属于当前学校，只按前端选择覆盖已有学生的姓名、手机号、学号，并清理该导入行中重复候选 JSON/异常 JSON 的对应数据，不允许跨校合并。

### R15 - 安全与归属

OSS 文件解析必须校验文件路径归属当前用户和当前学校，不能解析任意 OSS URL。

Acceptance: 当前用户传入不属于 `student-import/{当前用户schoolId}/{当前userId}/` 前缀的 `filePath/objectKey` 时返回 403；服务端读取固定使用公共桶配置，不直接拉取任意公网 URL。

### R16 - 当前用户学校口径

学生导入 STS、解析、行查询、行修正、确认导入和重复处理接口必须从当前登录用户解析 `userId/schoolId`，不要求前端传 `schoolId`。

Acceptance: 前端不传 `schoolId` 也能完成导入流程；如果历史兼容字段仍存在，后端忽略或校验其与当前用户学校一致，不能用它覆盖当前登录学校。

### R19 - 学生导入不依赖 schoolCode

学生导入确认和账号开通不得要求前端提供 `schoolCode`；学校归属和权限边界只使用当前登录用户解析出的 `schoolId`。

Acceptance: 前端调用确认导入时不传 `schoolCode`，后端仍可完成学生实体创建、学生账号开通、角色绑定和班级绑定；账号名生成不得因 `schoolCode` 缺失而失败，可使用已有 `systemCode/studentNo/STU{id}` fallback，或由后端内部基于 `schoolId` 派生账号名前缀。

### R17 - 文件限制

导入文件继续限制 `csv/xls/xlsx`，单次最多 5000 行。

Acceptance: 超过 5000 条有效数据返回参数错误；非 Excel/CSV 后缀返回文件格式错误。

### R18 - 旧接口非目标

旧 `/api/v1/excel/import/school-user` 不纳入本次改造。

Acceptance: 本计划不修改旧 ExcelController 学校用户导入链路。

### R20 - 学生管理页分页列表

系统必须提供学生管理页专用分页列表，学校范围来自当前登录用户，支持入学年份、当前年级、班级、学生状态、绑定状态和关键词筛选。

Acceptance: 前端传入 `enrollmentYear/currentGradeId/classId/status/bindStatus/keyword/pageNum/pageSize` 后，响应返回 `records + pageInfo`；`keyword` 同时模糊匹配学生姓名、系统账号、家长或学生手机号；响应字段至少包含系统账号、学生姓名、手机号展示值、年级班级、性别、绑定状态、学生状态、更新时间。绑定状态的真实业务口径本轮暂不确定，接口默认全部返回 `UNBOUND/未绑定`；若前端筛选 `bindStatus=BOUND`，本轮可返回空列表。

### R21 - 学生管理页统计卡片

系统必须提供学生管理页统计数据，支撑学生总数、已绑定、未绑定、禁用四个卡片。

Acceptance: 统计口径跟随入学年份、当前年级、班级和关键词筛选，不受当前列表的学生状态或绑定状态筛选影响；绑定状态真实口径确认前，`boundCount` 固定返回 0，`unboundCount` 等于同一基础筛选下的学生总数，`disabledCount` 为同一基础筛选下学生状态为禁用的数量。

### R22 - 学生详情抽屉

系统必须提供学生详情接口，返回截图中详情抽屉所需基础字段、账号绑定状态、学生状态和修改历史。

Acceptance: 点击“详情”时，前端可获取姓名、学号/系统账号、手机号展示值、性别、年级、班级、学生状态、绑定状态、修改历史；绑定状态真实口径确认前，详情统一返回 `UNBOUND/未绑定`；其他学校用户查询返回 403 或不存在。

### R23 - 新建学生抽屉

系统必须提供管理页新建学生能力，前端只提交姓名、性别、家长手机号、学生状态等页面字段，学校 ID 和系统账号由后端生成或推导。

Acceptance: 新建成功后返回学生实体 ID、系统账号、绑定状态和学生状态；前端不传 `schoolId/schoolCode/systemCode` 也能创建；绑定状态真实口径确认前，新建响应统一返回 `UNBOUND/未绑定`，该占位值不影响学生账号创建、家长手机号保存或后续导入确认。

### R24 - 修改学生抽屉

系统必须提供管理页修改学生能力，支持修改姓名、性别、家长手机号和学生状态。

Acceptance: 修改成功后列表和详情返回最新字段；学生状态仅支持正常、禁用；修改请求中家长手机号未传或为空时表示不变；若手机号输入为遮罩值，后端必须返回参数错误，不得把遮罩字符串覆盖为真实手机号；本轮不提供清空家长手机号动作。

### R25 - 学生修改历史

学生管理页的新建、修改、启用/禁用、导入、账号绑定和重复学生合并处理必须写入学生操作历史。

Acceptance: 详情抽屉的修改历史按时间倒序返回，至少包含操作时间、操作类型、摘要、操作人；导入和重复合并产生的历史能在同一学生详情中看到。

### R26 - 导入三步式任务状态

学生导入任务数据必须支撑“上传文件、系统解析、确认导入”的三步式 UI 展示。

Acceptance: 后端返回任务阶段、文件名、解析状态、识别数量、可导入数量、需处理数量和错误摘要；若解析采用同步实现，可在解析完成后返回 `progressPercent=100`，但不能让前端必须依赖本地伪造计数。

### R27 - 学生导入模板下载

系统必须提供与当前解析表头一致的学生导入模板下载能力。

Acceptance: 前端点击“下载模板”获取的模板表头与后端解析支持字段一致，至少包含 `序号、年级、班级、学生姓名、性别、学生学号（可选）、手机号码（可选）`。

### R28 - 确认导入页预览

确认导入页必须能展示解析结果概览和学生预览，并允许只确认导入可导入数据。

Acceptance: 解析完成后前端能展示识别学生、可导入、需处理计数；学生预览至少返回姓名、性别、年级、班级、家长手机号、状态、解析结果；确认按钮使用 `importableCount` 显示“确认导入 N 人”。

### R29 - 异常修正抽屉

异常处理页必须支持按异常类型筛选异常学生，并对单行执行修正、忽略、保持待处理或重复学生合并。

Acceptance: 前端按 `ALL/CLASS_NOT_FOUND/PHONE_INVALID/DUPLICATE_STUDENT` 筛选异常；修正班级时后端返回或校验明确 `classId`；点击“保存并校验”后重新执行单行校验，校验通过则进入可导入列表；点击“忽略此条”后确认导入不会创建该学生。

## Non-Functional Requirements

- NFR1: 解析 5000 行 Excel 的内存占用应保持在可控范围，不把 OSS 文件永久落本地临时目录。
  Acceptance: 后端从 OSS `InputStream` 读取，处理结束及时关闭流。
- NFR2: 新增代码必须遵循现有 Controller 在 `axon-chat`、DTO/VO/Service/Mapper 在 `axon-common` 的边界。
  Acceptance: Controller 不承载解析、校验、OSS 读取或导入业务逻辑。
- NFR3: 新增方法认知复杂度应可控，模板字段映射、班级匹配、异常聚合、OSS 读取应拆成小方法或小组件。
  Acceptance: 新增/修改方法不引入明显 Sonar Cognitive Complexity 超标风险。
- NFR4: 所有新增文档、SQL、测试样例放在 `docs` 下属目录。
  Acceptance: 不在仓库根目录或 `sql/` 根目录新增文档、SQL、样例。

## Decisions

- D1: 学生导入主链路继续使用 `/api/v1/student/imports/*`，不回退到旧 `/api/v1/excel/import/school-user`。
- D2: 新增学生导入专用 STS 接口，目标公共桶路径固定为 `student-import/{schoolId}/{userId}/...`，不复用普通用户上传目录。
- D3: 解析阶段生成任务和行明细，确认导入阶段才创建学生实体、学生账号、家长关系和操作日志。
- D4: 新模板不要求 `学段`，班级匹配改为基于当前学校、动态当前年级和班级名称；不唯一时要求前端修正为 `classId`。
- D5: 异常明细下载不由后端生成文件；后端返回结构化异常明细数据，前端负责导出。
- D6: 重复学生提供独立处理接口或处理动作，合并必须校验当前学校边界；覆盖字段由前端选择，后端按选择更新已有学生并清理该导入行的重复候选 JSON/异常 JSON 对应数据。
- D7: 导入流程统一从当前登录用户解析 `schoolId`，不信任前端学校参数。
- D8: 学生导入专用 STS 接口放在学生导入业务入口下，推荐路径为 `GET /api/v1/student/imports/oss/sts`，公共 OSS Controller 只保留通用能力。
- D9: 学生导入新链路不要求前端传 `schoolCode`；`schoolId` 是唯一学校边界，`schoolCode` 只作为旧账号命名策略的可选内部参数或兼容字段。
- D10: 学生管理页使用专用管理列表/统计契约，不直接复用低层 `StudentEntityVO` 分页，避免页面字段、筛选口径和学校边界漂移。
- D11: 新建/修改学生抽屉使用管理页专用 DTO，后端从当前用户解析学校并负责编排学生实体、账号、家长关系和操作日志；旧实体增删改接口保持兼容。
- D12: 导入三步式 UI 以导入任务 VO 为状态源；后端返回任务阶段、进度和统计，前端不自行推断可导入数量或异常数量。
- D13: 学生管理页“绑定状态”的真实业务口径本轮暂不确定，后端响应先统一返回未绑定；该字段仅作为 UI 占位，不参与账号创建、导入确认或学校权限边界。

## Assumptions

- A1: 学生导入页面将改为调用学生导入专用 STS 接口，上传到公共桶 `student-import/{schoolId}/{userId}/...`。
- A2: 当前前端模板以截图和 `D:/Downloads/学生导入模版.xlsx` 为准，家长字段本次不是第一阶段必填范围。
- A3: `classId` 是班级稳定定位键，班级名称只用于展示和初次解析辅助匹配。
- A4: 当前学校边界可从登录用户解析；若历史请求 DTO 仍带 `schoolId`，后端只能用于兼容校验，不能作为真实学校边界。
- A5: 截图中的“手机号”优先理解为管理页展示手机号；新建和修改抽屉中的“家长手机号”用于家长绑定，列表可按已有学生手机号或家长手机号检索，具体落库由现有学生/家长绑定模型承载。
- A6: “绑定状态”后续可能改为账号绑定、家长绑定、设备绑定或其他业务定义；本轮不提前绑定具体含义。

## Open Questions

- None.

## Consistency Check

- requirementCount: 29
- nonFunctionalRequirementCount: 4
- decisionCount: 13
- assumptionCount: 6
- openQuestionCount: 0
