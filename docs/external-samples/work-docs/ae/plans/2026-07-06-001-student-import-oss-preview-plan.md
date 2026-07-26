---
type: plan
status: completed
date: 2026-07-06
title: student-import-oss-preview
origin: docs/ae/prds/2026-07-06-student-import-oss-preview-prd.md
originFingerprint: 2026-07-06-student-import-oss-preview
depth: deep
format: human-readable-plan
sharded: false
---

# Student Import OSS Preview Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 支持学生管理页列表、统计、详情/新建/修改抽屉，并把学生导入改为专用 STS 上传公共桶后解析预览、前端修正或处理重复学生、确认导入的三步式流程。

**Architecture:** Controller 只暴露接口和登录用户解析；`axon-common` 承载 DTO/VO、Service、Mapper、公共桶 STS、OSS 读取、Excel 行映射、学生管理页聚合和操作日志。导入任务继续复用 `student_import_task/student_import_row`，解析阶段只落任务和行，确认阶段复用现有创建学生、开通账号、绑定班级和写日志链路；学生管理页使用专用 VO/DTO，避免低层实体接口被页面字段污染。

**Tech Stack:** Java 21、Spring Boot 3.x、MyBatis-Plus、EasyExcel/ExcelUtils、Aliyun OSS STS/Read Service、Maven focused tests。

---

## Source

- Requirements: `docs/ae/prds/2026-07-06-student-import-oss-preview-prd.md`
- Current code:
  - `axon-chat/src/main/java/com/xinxi/chatservice/controller/student/StudentImportController.java`
  - `axon-common/src/main/java/com/xinxi/axon/common/service/student/impl/StudentImportWorkflowServiceImpl.java`
  - `axon-chat/src/main/java/com/xinxi/chatservice/controller/student/StudentEntityController.java`
  - `axon-common/src/main/java/com/xinxi/axon/common/service/student/impl/StudentEntityServiceImpl.java`
  - `axon-common/src/main/java/com/xinxi/axon/common/service/student/impl/ClassStudentQueryServiceImpl.java`
  - `axon-chat/src/main/java/com/xinxi/chatservice/controller/common/OssUploadStsController.java`
  - `axon-common/src/main/java/com/xinxi/axon/common/service/common/impl/OssUploadStsServiceImpl.java`
  - `axon-common/src/main/java/com/xinxi/axon/common/service/common/AliyunOssReadService.java`
- Current docs and memory:
  - `docs/08-ai-memory/03-key-workflows.md`
  - `docs/08-ai-memory/04-known-pitfalls.md`
  - `docs/ae/prds/2026-06-09-class-student-management-gap-prd.md`
  - `docs/05-reports/2026-06-09-class-student-management-validation-report.md`
- Template inspected: `D:/Downloads/学生导入模版.xlsx`
- UI screenshots inspected: 学生管理列表、详情抽屉、新建抽屉、修改抽屉、批量导入上传/解析/确认/异常修正页面。

## AI Parse Contract

- canonicalKind: plan
- humanEquivalent: true
- stableIdsRequired: true
- noImplicitScope: true

## Scope

In scope:

- 新增班级学生分页查询接口，支持 `classId + keyword + pageNum/pageSize`。
- 新增学生管理页专用分页列表和统计接口，支持截图中的统计卡片、筛选项、搜索和列表字段。
- 新增或收口学生管理详情、新建、修改抽屉接口，支撑操作历史、账号生成、家长手机号和状态修改。
- 新增学生导入专用 STS 接口，前端上传到公共桶 `student-import/{schoolId}/{userId}/...`。
- 新增学生导入 OSS 解析接口，前端传公共桶 OSS 路径后后端读取并解析。
- 适配当前 Excel 模板表头。
- 行明细返回可支撑截图中的统计、预览、异常处理和确认导入。
- 导入任务返回可支撑三步式 UI 的阶段、文件名、解析状态、进度、统计和确认页预览。
- 增加异常明细数据接口，由前端负责导出或下载。
- 增加重复学生处理接口或处理动作，支持合并、忽略、保持待处理。
- 增加导入模板下载接口，确保模板表头和解析字段一致。
- 补充接口文档、测试样例和 focused tests。

Out of scope:

- 不改旧 `/api/v1/excel/import/school-user`。
- 不实现新建班级弹窗。
- 不实现前端页面代码；本方案只定义后端接口和数据契约。
- 不重构学生实体、家长绑定、账号开通主流程。
- 不做生产 SQL 数据修复。
- 不改前端页面代码。

## Readiness

- Goal: 清晰，后端提供学生管理页能力、班级学生分页和 OSS 文件解析导入能力。
- Acceptance criteria: 已在 PRD R1-R29/NFR1-NFR4 定义。
- Non-goals: 已命名。
- Affected areas: `axon-chat` 学生与 OSS Controller，`axon-common` 学生管理 Service/DTO/VO/Mapper、学生导入 Service/DTO/VO/Mapper、OSS STS/读取、文档和测试。
- Validation surface: Maven focused tests、编译、接口契约文档、手工本地冒烟命令。
- Open questions: none.

## Assumptions

- 前端使用学生导入专用 STS，上传到公共桶 `student-import/{schoolId}/{userId}/...` 目录。
- 后端解析请求允许传 `filePath` 或完整 OSS URL，但必须归一成 objectKey 并校验其属于当前登录用户的学生导入前缀。
- 当前模板中的 `班级` 值可能是数字 `2`，后端应规范为 `2班` 后参与匹配和展示。
- 若同年级同名班级在同一学校下匹配多条，后端不猜测，返回待处理行让前端选择 `classId`。
- 学生管理页“手机号”查询同时覆盖学生手机号和家长手机号；列表展示优先使用页面字段命名，不改变底层学生/家长模型。
- 学生管理页“绑定状态”真实业务口径本轮暂不确定；后端先统一返回 `UNBOUND/未绑定`，不要把 `student.user_id`、家长绑定、手机号存在与否提前解释为已绑定。

## Alternatives Considered

- Recommended: 新增学生导入专用 STS + OSS 解析 JSON 接口，复用现有导入任务表和确认导入链路。
  Fit: 与用户确认的公共桶 `student-import/{schoolId}/{userId}/...` 目录一致，保留历史 multipart 入口。
  Risk: 需要新增公共桶前缀级 STS policy、路径归属校验和模板字段适配。
- Alternative: 把现有 `/upload` 改成既支持 multipart 又支持 JSON。
  Trade-off: Controller 参数语义混乱，Swagger 和前端联调容易误用。
  Rejected because: 破坏现有单测和接口清晰度。
- Alternative: 前端解析 Excel 后直接提交行列表给后端。
  Trade-off: 后端少读 OSS，但校验口径分裂，模板变更由前端承担。
  Rejected because: 用户明确要求后端获取 OSS 文件后解析。

## Decision Drivers

- Driver 1: `classId` 是班级唯一定位键，同名班级不能靠名称强推断。
- Driver 2: 解析阶段和确认导入阶段必须解耦，防止用户预览前产生脏学生数据。
- Driver 3: 兼容现有 `/api/v1/student/imports/*`、任务表、行表和 focused tests，控制回归风险。
- Driver 4: 当前登录用户是学校边界来源，前端不传或不能覆盖 `schoolId`。
- Driver 5: UI 截图需要全校学生管理页能力，不能只实现班级内学生列表。
- Driver 6: 导入三步式页面以任务状态和行状态为数据源，前端不应自行计算可导入/需处理数量。

## Decisions

### ADR-1 - 学生导入专用 STS

- Decision: 新增学生导入专用 STS，目标公共桶路径为 `student-import/{schoolId}/{userId}/...`，凭证只授权该前缀。
- Drivers: 用户明确要求新 STS 接口和公共桶路径；普通上传目录权限过宽且路径语义不清。
- Alternatives: 复用 `/api/v1/common/oss/upload/sts`；复用通用批改 fixed-key STS。
- Why chosen: 路径边界明确，便于后端解析时做当前用户归属校验。
- Consequences: 需要扩展 `OssUploadStsController/OssUploadStsService/OssUploadStsServiceImpl`，新增前缀级 policy 构造。
- Follow-ups: 公共 OSS Controller 不新增学生导入业务路径；Controller 入口推荐放在 `StudentImportController`。

### ADR-2 - OSS 解析独立接口

- Decision: 新增 `POST /api/v1/student/imports/parse-oss`，请求体使用独立 DTO。
- Drivers: 保留 multipart 入口；让前端 OSS 上传流程有明确后端落点。
- Alternatives: 改造 `/upload`；让前端解析后传行列表。
- Why chosen: 接口职责最清晰，回归面最小。
- Consequences: `StudentImportWorkflowService` 新增 `parseOss` 方法，内部可复用大部分 `upload` 的任务创建、行校验和计数逻辑。
- Follow-ups: 如果前端确认旧 multipart 不再使用，可后续标记废弃。

### ADR-3 - 模板字段适配层

- Decision: 新增或扩展导入行映射层，支持当前模板字段别名，不直接改旧 `StudentImportExcelRowDTO` 的语义到不可兼容。
- Drivers: 当前模板缺少 `学段/班级名称/家长`，现有 DTO 表头不匹配。
- Alternatives: 要求前端改模板；在 Controller 手写字段转换。
- Why chosen: 后端适配更稳定，Controller 保持薄。
- Consequences: 需要新增模板别名常量和单测，确保 `学生姓名/学生学号（可选）/手机号码（可选）/班级` 能映射。
- Follow-ups: 模板下载接口后续应返回同一份表头。

### ADR-4 - 班级解析先辅助匹配，最终保存 classId

- Decision: 文件行初次解析可按年级+班级名匹配，但行明细和确认导入最终以 `classId` 为准。
- Drivers: 同名班级允许存在，AI 记忆已确认 `class.id` 是唯一定位。
- Alternatives: 继续用 `getByClassNameAndGradeName`；强制模板包含 classId。
- Why chosen: 兼顾模板可读性和后端确定性。
- Consequences: 需要支持 `CLASS_NOT_UNIQUE` 或等价异常类型，修正接口要接收 `classId`。
- Follow-ups: 前端异常修正弹窗应调用班级候选查询接口。

### ADR-5 - 班级学生分页使用 Mapper 聚合查询

- Decision: 新增 Mapper 查询分页聚合 `class_student_entity + student` 与 `student_class + users/user_profile`，Service 负责去重和 PageResult 组装。
- Drivers: 当前 Service 先查列表再逐个 resolver，不适合分页和模糊搜索。
- Alternatives: 先全量查询再内存过滤分页。
- Why chosen: 5000 级名单也能稳定分页，姓名模糊交给数据库。
- Consequences: 需要新增 DTO/VO/Mapper XML 或注解 SQL，并补分页单测。
- Follow-ups: 若双轨重复学生需要强规则去重，可后续统一自然学生 key。

### ADR-6 - 异常明细返回数据而不是文件

- Decision: 后端提供异常明细数据接口，前端负责导出 Excel 或下载。
- Drivers: 用户明确要求“将对应的数据返回给前端，前端去执行”。
- Alternatives: 后端实时生成 Excel；后端生成 OSS 临时文件。
- Why chosen: 减少后端文件生成、临时文件生命周期和下载响应复杂度。
- Consequences: 前端要实现导出；后端要保证异常明细字段足够完整。
- Follow-ups: 若前端后续需要服务端导出，可在不影响数据接口的情况下新增导出接口。

### ADR-7 - 重复学生独立处理

- Decision: 为 `DUPLICATE_STUDENT` 行提供处理接口或动作，支持合并、忽略、保持待处理；合并时由前端选择是否覆盖已有学生的姓名、手机号、学号。
- Drivers: 用户明确要求重复学生合并需要对应接口或逻辑修改数据。
- Alternatives: 只提示重复、不处理；确认导入时自动合并。
- Why chosen: 自动合并风险高，独立处理让前端和用户显式确认。
- Consequences: 需要保存或返回合并候选，合并必须校验学校边界；后端只覆盖前端选择的字段，并在处理成功后清理该导入行重复候选 JSON/异常 JSON 中对应的重复数据，避免后续再次按同一候选提示。
- Follow-ups: 若后续要允许覆盖更多字段，应先扩展前端选择项和后端白名单，不能接受任意字段名透传更新。

### ADR-8 - 学生管理页使用专用接口

- Decision: 新增 `POST /api/v1/student/entity/management/page` 和统计接口，不直接改造低层 `/api/v1/student/entity/page` 的响应契约。
- Drivers: 截图列表需要统计、绑定状态占位、学生状态、系统账号、动态年级班级、家长手机号搜索和更新时间；低层实体分页字段不足且当前允许 body schoolId。
- Alternatives: 复用 `/api/v1/student/entity/page` 并扩展大量字段；前端多接口拼装。
- Why chosen: 专用接口能强制从当前用户解析学校，响应字段稳定，减少前端 N+1 请求。
- Consequences: 需要新增管理页 DTO/VO/Mapper 查询，旧实体分页保持兼容。
- Follow-ups: 若旧 `/page` 后续下线，应另开兼容评估，不在本次范围。

### ADR-9 - 绑定状态先统一未绑定

- Decision: 学生管理页 `bindStatus` 本轮先统一返回 `UNBOUND/未绑定`，统计 `boundCount=0`、`unboundCount=totalCount`。
- Drivers: 用户补充确认“绑定状态”业务含义尚未确定，不能提前绑定账号、家长或其他实体关系口径。
- Alternatives: 用 `student.user_id != null` 判断已绑定；用家长关系判断已绑定；用手机号存在判断已绑定。
- Why chosen: 三种替代口径都可能和后续产品定义冲突，提前实现会造成数据展示误导和后续兼容成本。
- Consequences: 前端当前看到的绑定状态全为未绑定；`bindStatus=BOUND` 筛选本轮可返回空结果。
- Follow-ups: 后续产品确认绑定定义后，再新增明确规则并补兼容说明。

### ADR-10 - 新建/修改抽屉走管理页编排服务

- Decision: 新增管理页新建/修改 DTO 和 Service 方法，由后端编排学生实体、学生账号、家长手机号、状态和操作日志。
- Drivers: 截图抽屉字段与低层 `StudentEntityAddDTO/UpdateDTO` 不一致；前端不应传 `schoolId/schoolCode/systemCode`。
- Alternatives: 直接调用旧新增/更新实体接口，再由前端单独开通账号、绑定家长。
- Why chosen: 事务边界清楚，避免新建成功但账号/家长/日志部分失败。
- Consequences: 需要明确遮罩手机号更新规则；修改时只对真实新手机号执行覆盖。
- Follow-ups: 若未来需要编辑班级，单独复用班级候选和改班接口，不塞进基础资料修改抽屉。

### ADR-11 - 导入任务 VO 驱动三步式 UI

- Decision: 导入任务响应新增阶段、进度、文件信息和统计字段，确认页和异常页都从任务/行接口取数。
- Drivers: 截图有上传、系统解析、确认导入、异常处理多个状态和计数；前端不能用本地进度或手工统计替代后端任务状态。
- Alternatives: parse-oss 同步返回行列表，前端自行模拟解析进度和统计。
- Why chosen: 后端任务状态是唯一可信源，便于重试、重新上传、异常处理后刷新计数。
- Consequences: 若第一版仍同步解析，`progressPercent` 可只返回 `100` 或阶段性默认值；异步解析可后续无破坏扩展。
- Follow-ups: 真正长耗时解析时再引入后台解析队列和轮询，不在第一版强制。

## Risks

- RISK1: 模板字段别名不全导致线上模板解析为空行或必填缺失。
- RISK2: OSS 路径归属校验过松会形成任意对象读取风险。
- RISK3: 班级名称匹配不唯一时如果后端猜测，会把学生绑定到错误班级。
- RISK4: 公共桶 STS policy 若授权全桶写，会让前端越权覆盖非学生导入对象。
- RISK5: 重复学生合并如果不校验学校和候选来源，会跨校或误合并学生。
- RISK6: 确认导入阶段仍要求前端 `schoolId`，会与用户确认的当前用户学校口径冲突。
- RISK7: 复用低层学生分页会让前端拿不到绑定状态、统计卡片和动态年级班级，导致页面二次拼装和口径不一致。
- RISK8: 修改抽屉若把遮罩手机号当真实值保存，会污染学生或家长手机号。
- RISK9: 导入解析计数如果由前端推断，异常修正或忽略后会和后端确认导入数量不一致。

## Pre-Mortem

- Failure scenario 1: 前端上传到公共桶后传完整 URL，后端只按 objectKey 处理导致文件不存在。
  Mitigation: 复用 `AliyunOssReadService` 的 URL 路径提取能力，并单测覆盖 URL/objectKey 两类输入。
- Failure scenario 2: `班级=2` 与库内 `2班` 不匹配，全部变成 `CLASS_NOT_FOUND`。
  Mitigation: 班级名称规范化，纯数字或数字字符串补 `班`。
- Failure scenario 3: 班级学生分页 union 查询重复返回已绑定账号的同一学生。
  Mitigation: 学生实体 track 优先；旧 `student_class` 结果中若 userId 已被 `student.user_id` 覆盖，则 Service 去重。
- Failure scenario 4: 恶意用户传入 `student-import/其他学校/其他用户/名单.xlsx` 触发解析。
  Mitigation: 解析接口按当前登录用户重新计算允许前缀，只允许 `student-import/{currentSchoolId}/{currentUserId}/`。
- Failure scenario 5: 管理列表统计卡片与列表筛选口径不一致，同一页面显示总数和 records 对不上。
  Mitigation: 明确统计跟随入学年份、年级、班级、关键词基础筛选，不受状态/绑定状态筛选影响；列表受全部筛选影响。
- Failure scenario 6: 新建学生只写 student 表但未开通账号，列表系统账号为空，UI 显示“未绑定”与“新建学生账号”文案冲突。
  Mitigation: 管理页新建接口编排学生实体创建、账号开通、可选家长绑定和操作日志；失败时事务回滚。

## Global Constraints

- 不改旧 `/api/v1/excel/import/school-user`。
- 不把业务逻辑塞进 Controller。
- 新增文档、SQL、测试样例只放 `docs` 下。
- 文件路径和 OSS URL 入库前要归一化，不能保存带签名 query 的临时 URL。
- 学生导入接口的 `schoolId` 只能来自当前登录用户，前端字段不能覆盖。
- 学生导入确认不要求前端传 `schoolCode`；若 DTO 仍保留兼容字段，后端应忽略该字段或仅作为旧逻辑内部兼容，不允许它成为导入成功的必要条件。
- 学生管理页新增和修改接口不接收前端 `schoolId`，学校边界统一来自当前登录用户。
- 列表/详情的手机号展示可以返回遮罩字段；修改接口只接受真实手机号，手机号未传或空值表示不变，不接受 `138****2368` 这类遮罩值作为覆盖数据；本轮不实现清空家长手机号动作。
- 新增异常类型、DTO、VO 命名必须表达业务语义，避免 `data/result/item/temp` 泛化命名。

## Implementation Units

### U1 - 班级学生分页接口

- Goal: 新增按班级分页查询学生接口，支持姓名模糊搜索。
- Requirements covered: R1, R2
- Acceptance criteria covered: classId 分页、keyword 模糊、当前有效关系双轨合并。
- Depends on: none
- Files:
  - Modify: `axon-chat/src/main/java/com/xinxi/chatservice/controller/student/StudentEntityController.java`
  - Modify: `axon-common/src/main/java/com/xinxi/axon/common/service/student/ClassStudentQueryService.java`
  - Modify: `axon-common/src/main/java/com/xinxi/axon/common/service/student/impl/ClassStudentQueryServiceImpl.java`
  - Modify: `axon-common/src/main/java/com/xinxi/axon/common/mapper/student/ClassStudentEntityMapper.java`
  - Create: `axon-common/src/main/java/com/xinxi/axon/common/dto/student/ClassStudentPageQueryDTO.java`
  - Create: `axon-common/src/main/java/com/xinxi/axon/common/dto/student/ClassStudentPageQueryMapperDTO.java`
  - Create or modify: `axon-common/src/main/resources/mapper/student/ClassStudentEntityMapper.xml`
  - Test: `axon-common/src/test/java/com/xinxi/axon/common/service/student/ClassStudentQueryServiceImplTest.java`
- Forbidden files:
  - `axon-chat/src/main/java/com/xinxi/chatservice/controller/school/ClassController.java`
  - `axon-common/src/main/java/com/xinxi/axon/common/service/user/impl/StudentClassServiceImpl.java`
- Approach:
  - 新增 `POST /api/v1/student/entity/class/{classId}/students/page`，沿用现有班级学生接口的 `classId` 路径风格。
  - 入参：`classId` 路径必填，`keyword` 可选，`pageNum/pageSize` 默认沿用项目分页口径。
  - Mapper 查询优先从 `class_student_entity -> student -> class` 查学生实体，再从 `student_class -> users/user_profile -> class` 查旧已注册学生。
  - Service 对返回记录做学生实体优先去重，组装 `PageResultVO<ClassStudentItemVO>`。
- Tests:
  - classId 为空抛参数错误。
  - keyword 命中学生实体姓名。
  - keyword 命中已注册学生 profile 姓名。
  - `effective_end_date IS NOT NULL/status=0/deleted=1` 关系不返回。
- Validation:
  - `mvn -pl axon-common '-Dtest=ClassStudentQueryServiceImplTest' test`
  - `mvn -pl axon-chat -am '-Dtest=StudentEntityControllerTest' '-Dsurefire.failIfNoSpecifiedTests=false' test`，若当前无该测试类则新增 focused Controller test。
- Rollback signals:
  - 原 `GET /class/{classId}/students` 或 `/for-exam` 返回结构变化。
  - 分页 total 与 records 明显不一致。
- Deferred to implementation:
  - 是否新增自然学生去重 key，第一阶段只做学生实体 userId 覆盖旧 user 关系的基础去重。

### U10 - 学生管理页列表与统计接口

- Goal: 支持截图中的学生管理页统计卡片、筛选、搜索和分页列表。
- Requirements covered: R20, R21
- Acceptance criteria covered: 全校当前用户学校范围、统计卡片、入学年份/年级/班级/状态/绑定状态筛选、姓名/系统账号/手机号搜索。
- Depends on: none
- Files:
  - Modify: `axon-chat/src/main/java/com/xinxi/chatservice/controller/student/StudentEntityController.java`
  - Modify: `axon-common/src/main/java/com/xinxi/axon/common/service/student/StudentEntityService.java`
  - Modify: `axon-common/src/main/java/com/xinxi/axon/common/service/student/impl/StudentEntityServiceImpl.java`
  - Modify: `axon-common/src/main/java/com/xinxi/axon/common/mapper/student/StudentMapper.java`
  - Create or modify: `axon-common/src/main/resources/mapper/student/StudentMapper.xml` if XML mapper is used in this project path.
  - Create: `axon-common/src/main/java/com/xinxi/axon/common/dto/student/StudentManagementPageQueryDTO.java`
  - Create: `axon-common/src/main/java/com/xinxi/axon/common/vo/student/StudentManagementListItemVO.java`
  - Create: `axon-common/src/main/java/com/xinxi/axon/common/vo/student/StudentManagementSummaryVO.java`
  - Test: `axon-common/src/test/java/com/xinxi/axon/common/service/student/StudentEntityServiceImplTest.java`
  - Test: `axon-chat/src/test/java/com/xinxi/chatservice/controller/student/StudentEntityControllerTest.java`
- Forbidden files:
  - `axon-chat/src/main/java/com/xinxi/chatservice/controller/common/ExcelController.java`
  - Existing low-level `/api/v1/student/entity/page` behavior must not be broken.
- Approach:
  - 新增 `POST /api/v1/student/entity/management/page`。
  - 新增 `POST /api/v1/student/entity/management/summary`，作为统计卡片独立接口，便于前端筛选变化时单独刷新。
  - Query DTO 字段：`enrollmentYear`、`currentGradeId`、`classId`、`status`、`bindStatus`、`keyword`、`pageNum`、`pageSize`。
  - `keyword` 匹配学生姓名、系统账号、学生手机号、家长手机号；手机号查询必须走参数绑定，禁止拼 SQL。
  - 响应列表字段：`studentEntityId`、`systemCode/generatedUsername`、`realName`、`phoneMasked`、`currentGradeName`、`className`、`gender`、`bindStatus`、`studentStatus`、`updateTime`。
  - `bindStatus` 本轮固定返回 `UNBOUND`；`bindStatus=BOUND` 筛选返回空列表，`bindStatus=UNBOUND` 或未传返回当前基础筛选下学生。
  - 统计卡片基础筛选跟随 `enrollmentYear/currentGradeId/classId/keyword`，不受 `status/bindStatus` 影响；列表受全部筛选影响。
  - 统计卡片本轮固定 `boundCount=0`，`unboundCount=totalCount`；不要用 `student.user_id` 或家长关系计算已绑定。
  - 学校范围通过当前用户 `schoolId` 注入，忽略请求体历史 `schoolId`。
- Tests:
  - 当前用户学校为 1 时，不返回学校 2 学生。
  - keyword 命中姓名、系统账号、学生手机号、家长手机号。
  - status=禁用 只影响列表，不影响 summary 的 total/bound/unbound 基础口径。
  - bindStatus=UNBOUND 返回当前基础筛选下学生，bindStatus=BOUND 返回空列表。
  - summary 返回 total/bound/unbound/disabled，其中 boundCount=0、unboundCount=totalCount。
- Validation:
  - `mvn -pl axon-common '-Dtest=StudentEntityServiceImplTest' test`
  - `mvn -pl axon-chat -am '-Dtest=StudentEntityControllerTest' '-Dsurefire.failIfNoSpecifiedTests=false' test`
- Rollback signals:
  - 旧 `/api/v1/student/entity/page` 响应字段或分页参数变化。
  - summary 与 page 使用相同状态筛选导致卡片数字跟随“状态”下拉变化。
- Deferred to implementation:
  - 如 `StudentMapper.xml` 目录不存在，应按项目现有 mapper 组织方式选择注解 SQL 或对应 XML 目录，不能新建不被 MyBatis 扫描的资源路径。

### U11 - 学生详情、新建和修改管理抽屉

- Goal: 支持截图中的详情、新建学生、修改学生抽屉，并写入修改历史。
- Requirements covered: R22, R23, R24, R25, R19
- Acceptance criteria covered: 详情字段完整，新建不传 schoolId/schoolCode/systemCode，修改姓名/性别/家长手机号/状态，操作历史可见。
- Depends on: U10
- Files:
  - Modify: `axon-chat/src/main/java/com/xinxi/chatservice/controller/student/StudentEntityController.java`
  - Modify: `axon-common/src/main/java/com/xinxi/axon/common/service/student/StudentEntityService.java`
  - Modify: `axon-common/src/main/java/com/xinxi/axon/common/service/student/impl/StudentEntityServiceImpl.java`
  - Use existing: `axon-common/src/main/java/com/xinxi/axon/common/service/student/StudentAccountProvisionService.java`
  - Use existing: `axon-common/src/main/java/com/xinxi/axon/common/service/student/StudentParentBindingService.java`
  - Use existing: `axon-common/src/main/java/com/xinxi/axon/common/service/student/StudentOperationLogService.java`
  - Create: `axon-common/src/main/java/com/xinxi/axon/common/dto/student/StudentManagementCreateDTO.java`
  - Create: `axon-common/src/main/java/com/xinxi/axon/common/dto/student/StudentManagementUpdateDTO.java`
  - Create: `axon-common/src/main/java/com/xinxi/axon/common/vo/student/StudentManagementSaveResultVO.java`
  - Test: `axon-common/src/test/java/com/xinxi/axon/common/service/student/StudentEntityServiceImplTest.java`
- Forbidden files:
  - Do not repurpose `StudentEntityAddDTO` for the page drawer contract if it would require frontend to send `schoolId/systemCode`.
- Approach:
  - 详情继续使用或扩展 `GET /api/v1/student/entity/{id}/management-detail`，补齐截图字段和操作历史。
  - 新增 `POST /api/v1/student/entity/management/create`，DTO 字段：`realName`、`gender`、`parentPhone`、`status`。
  - 新增 `POST /api/v1/student/entity/management/update`，DTO 字段：`studentEntityId`、`realName`、`gender`、`parentPhone`、`status`。
  - 新建时 Service 从当前用户解析 `schoolId`，创建学生实体，调用账号开通服务生成账号；`parentPhone` 为空时不阻断，绑定状态占位值仍返回未绑定。
  - 修改时 `status` 仅允许 `NORMAL/DISABLED` 或项目既有数值映射；不要把旧注释“0=离校”直接暴露为页面文案。
  - 修改手机号时，`parentPhone` 为 `null/blank` 表示不变；若值包含 `****`，返回参数错误，防止遮罩值入库；本轮不实现清空家长手机号动作。
  - 新建、修改、启用/禁用均调用 `StudentOperationLogService.appendLog` 写历史，详情按倒序返回。
- Tests:
  - 新建不传 `schoolId/schoolCode/systemCode` 成功，返回系统账号不为空。
  - 新建 parentPhone 为空时成功，绑定状态为未绑定。
  - 修改姓名后详情和列表展示新姓名，历史新增“资料”类记录。
  - 修改状态为禁用后列表学生状态为禁用，summary disabledCount 增加。
  - 修改 parentPhone=`138****2368` 返回参数错误，不覆盖真实手机号。
  - 修改 parentPhone 为空时不改变原有家长手机号或绑定关系。
  - 其他学校用户修改学生返回 FORBIDDEN。
- Validation:
  - `mvn -pl axon-common '-Dtest=StudentEntityServiceImplTest,StudentOperationLogServiceImplTest' test`
  - `mvn -pl axon-chat -am '-Dtest=StudentEntityControllerTest' '-Dsurefire.failIfNoSpecifiedTests=false' test`
- Rollback signals:
  - 新建学生成功但 `users/user_profile/sys_user_role` 未创建，导致系统账号为空。
  - 修改家长手机号只改 `users.user_phone` 不改 `user_profile/parent_student` 关系，详情和列表显示不一致。
- Deferred to implementation:
  - 若现有家长绑定服务无法表达“替换唯一家长手机号”，先实现追加或更新 primary 家长的明确规则，并在 API 文档中写清。

### U2 - 学生导入专用 STS

- Goal: 新增学生导入专用 STS，上传目标为公共桶 `student-import/{schoolId}/{userId}/...`。
- Requirements covered: R3, R15, R16
- Acceptance criteria covered: STS 返回公共桶、固定前缀、最小权限 policy；schoolId 来自当前用户。
- Depends on: none
- Files:
  - Modify: `axon-chat/src/main/java/com/xinxi/chatservice/controller/student/StudentImportController.java`
  - Modify: `axon-common/src/main/java/com/xinxi/axon/common/service/common/OssUploadStsService.java`
  - Modify: `axon-common/src/main/java/com/xinxi/axon/common/service/common/impl/OssUploadStsServiceImpl.java`
  - Test: `axon-common/src/test/java/com/xinxi/axon/common/service/common/impl/OssUploadStsServiceImplTest.java`
- Forbidden files:
  - `axon-common/src/main/java/com/xinxi/axon/common/service/common/impl/StsServiceImpl.java`
- Approach:
  - 新增 `getStudentImportUploadSts(Long userId)`。
  - 通过 `UserService` 读取当前用户和 `schoolId`，无学校归属时返回参数错误。
  - 构造上传前缀：`student-import/{schoolId}/{userId}/{yyyyMMdd}/{HHmmss}_{uuid}/`。
  - 使用公共桶配置和 `stsService.getStsCredentials(policy)` 签发前缀级 policy，允许 `oss:PutObject/oss:GetObject` 到 `acs:oss:*:*:{bucket}/student-import/{schoolId}/{userId}/{sessionPrefix}*`。
  - 返回 `OssUploadStsVO`，`uploadPath` 即该前缀。
- Tests:
  - 返回前缀包含当前用户 `schoolId/userId`。
  - policy 不包含公共桶 `/*` 全桶资源。
  - 用户无 `schoolId` 时返回业务错误。
- Validation:
  - `mvn -pl axon-common '-Dtest=OssUploadStsServiceImplTest' test`
  - `mvn -pl axon-chat -am '-Dtest=StudentImportControllerTest' '-Dsurefire.failIfNoSpecifiedTests=false' test`
- Rollback signals:
  - 普通 `/api/v1/common/oss/upload/sts` 行为变化。
  - STS policy 允许写入非 `student-import` 路径。
- Deferred to implementation:
  - 接口路径固定为 `GET /api/v1/student/imports/oss/sts`。

### U3 - OSS 解析请求契约与 Controller

- Goal: 新增学生导入 OSS 解析入口，接收公共桶文件路径并返回导入任务统计。
- Requirements covered: R4, R5, R15, R16, R17, R19
- Acceptance criteria covered: 前端 OSS 直传后可请求解析；旧 multipart 入口不破坏；schoolId 来自当前用户。
- Depends on: U2
- Files:
  - Modify: `axon-chat/src/main/java/com/xinxi/chatservice/controller/student/StudentImportController.java`
  - Modify: `axon-common/src/main/java/com/xinxi/axon/common/service/student/StudentImportWorkflowService.java`
  - Create: `axon-common/src/main/java/com/xinxi/axon/common/dto/student/StudentImportOssParseCommand.java`
  - Test: `axon-chat/src/test/java/com/xinxi/chatservice/controller/student/StudentImportControllerTest.java`
- Forbidden files:
  - `axon-chat/src/main/java/com/xinxi/chatservice/controller/common/ExcelController.java`
- Approach:
  - Controller 新增 `POST /api/v1/student/imports/parse-oss`。
  - DTO 字段建议：`filePath`、`objectKey`、`originalFileName`；不要求 `schoolId`。
  - Controller 从请求用户解析 `operatorUserId`，Service 内部通过用户读取 `schoolId`。
  - Service 新增 `parseOss(StudentImportOssParseCommand command)`。
- Tests:
  - 请求体为空返回参数错误。
  - filePath/objectKey 均为空返回参数错误。
  - Controller 调用 Service 时传入 operatorUserId。
  - 请求体带历史 `schoolId` 字段时不能覆盖当前用户学校。
  - 旧 `/upload` Controller test 保持通过。
- Validation:
  - `mvn -pl axon-chat -am '-Dtest=StudentImportControllerTest' '-Dsurefire.failIfNoSpecifiedTests=false' test`
- Rollback signals:
  - `/api/v1/student/imports/upload` Swagger 或 multipart 参数失效。
  - `parse-oss` 允许未登录用户解析文件。
- Deferred to implementation:
  - `schoolCode` 不再作为新导入链路的前端入参或必填项，账号名生成由 U7 在后端收口。

### U4 - 公共桶文件读取与路径归属校验

- Goal: 后端从公共桶读取 Excel/CSV 文件流，并阻止越权路径。
- Requirements covered: R4, R15, R16, R17, NFR1
- Acceptance criteria covered: objectKey/完整 URL 均可读取；非当前用户 `student-import` 前缀 403；流及时关闭。
- Depends on: U3
- Files:
  - Modify: `axon-common/src/main/java/com/xinxi/axon/common/service/student/impl/StudentImportWorkflowServiceImpl.java`
  - Possibly create: `axon-common/src/main/java/com/xinxi/axon/common/service/student/StudentImportOssFileResolver.java`
  - Possibly create: `axon-common/src/main/java/com/xinxi/axon/common/service/student/impl/StudentImportOssFileResolverImpl.java`
  - Use existing: `axon-common/src/main/java/com/xinxi/axon/common/service/common/AliyunOssReadService.java`
  - Test: `axon-common/src/test/java/com/xinxi/axon/common/service/student/StudentImportWorkflowServiceImplTest.java`
- Forbidden files:
  - `axon-common/src/main/java/com/xinxi/axon/common/service/common/impl/AliyunOssReadServiceImpl.java` unless an existing public method is insufficient.
- Approach:
  - 归一化 `filePath/objectKey`，剥离 query 和 fragment。
  - 通过当前用户重新计算允许前缀：`student-import/{schoolId}/{userId}/`。
  - 校验 objectKey 必须以允许前缀开头，学校管理员也不放宽到其他用户目录，减少导入文件串用风险。
  - 使用 `aliyunOssReadService.downloadFromPublicBucket(normalizedPath)` 获取 `InputStream`。
  - 将 `InputStream` 和原始文件名交给统一解析方法。
- Tests:
  - objectKey 包含 query 时能剥离。
  - 不属于当前用户 `student-import` 前缀时抛 `FORBIDDEN`。
  - 公共桶读取异常映射为业务错误且任务不进入已解析状态。
- Validation:
  - `mvn -pl axon-common '-Dtest=StudentImportWorkflowServiceImplTest' test`
- Rollback signals:
  - 可以解析任意公网 URL。
  - 可以解析其他用户 `student-import` 路径。
  - OSS 流未关闭导致连接泄漏或测试出现 resource leak。
- Deferred to implementation:
  - 若需要记录 OSS 源路径，优先新增任务字段；不复用 `file_upload_record_id` 表达未登记记录。

### U5 - 模板字段映射与班级解析

- Goal: 让当前学生导入模板能被解析成导入行，并在解析阶段确定或提示班级。
- Requirements covered: R6, R7, R8, R9, R12, R17
- Acceptance criteria covered: 当前 Excel 表头可解析；班级 2 规范为 2班；不唯一返回待处理。
- Depends on: U4
- Files:
  - Modify: `axon-common/src/main/java/com/xinxi/axon/common/dto/student/StudentImportExcelRowDTO.java`
  - Modify: `axon-common/src/main/java/com/xinxi/axon/common/service/student/impl/StudentImportWorkflowServiceImpl.java`
  - Modify: `axon-common/src/main/java/com/xinxi/axon/common/enums/StudentImportExceptionTypeEnum.java`
  - Modify: `axon-common/src/main/java/com/xinxi/axon/common/vo/student/StudentImportRowVO.java`
  - Possibly create: `axon-common/src/main/java/com/xinxi/axon/common/service/student/StudentImportClassMatcher.java`
  - Test: `axon-common/src/test/java/com/xinxi/axon/common/service/student/StudentImportWorkflowServiceImplTest.java`
  - Test data: `docs/07-test-data/student-import-template-current-sample.xlsx` or CSV equivalent if binary test assets are not desired.
- Forbidden files:
  - `axon-common/src/main/java/com/xinxi/axon/common/service/school/impl/ClassServiceImpl.java` unless a reusable class match query already exists and only needs a new method.
- Approach:
  - 给 `StudentImportExcelRowDTO` 增加 EasyExcel 表头别名，或新增当前模板 DTO 后转换到内部标准行。
  - 字段映射：
    - `学生姓名` -> `realName`
    - `学生学号（可选）` -> `studentNo`
    - `手机号码（可选）` -> `phone`
    - `班级` -> `className`
  - 必填改为 `realName/gradeName/className`，不再要求 `phaseName`。
  - 班级匹配使用当前学校 + 动态当前年级名称 + 规范化班级名；无结果或多结果返回 `PENDING`。
  - `StudentImportRowVO` 增补 `gradeName/className/currentGradeName` 或从快照中解析供前端展示，避免前端只看到 `classId`。
- Tests:
  - 当前模板表头可读出一行 `李明`。
  - `班级=2` 匹配库内 `2班`。
  - 缺少姓名返回必填缺失。
  - 手机号为 10 位返回 `PHONE_INVALID`。
  - 同年级同班级名多候选返回待处理。
- Validation:
  - `mvn -pl axon-common '-Dtest=StudentImportWorkflowServiceImplTest' test`
- Rollback signals:
  - 历史 CSV 样例不再能导入。
  - 导入行 `rawSnapshot` 丢失原始模板字段。
- Deferred to implementation:
  - 家长字段本次保持兼容旧模板，不作为当前模板必填。

### U6 - 行修正、异常聚合与重复学生处理

- Goal: 前端可修正异常行、查看异常分类，并对重复学生执行合并、忽略或保持待处理。
- Requirements covered: R9, R10, R12, R14, R29
- Acceptance criteria covered: 修正 classId 后可导入；异常分类数量可展示；重复学生候选可处理；异常抽屉支持保存并校验、忽略此条、保持待处理。
- Depends on: U5
- Files:
  - Modify: `axon-common/src/main/java/com/xinxi/axon/common/dto/student/StudentImportRowFixDTO.java`
  - Modify: `axon-common/src/main/java/com/xinxi/axon/common/dto/student/StudentImportRowsQueryDTO.java`
  - Create: `axon-common/src/main/java/com/xinxi/axon/common/dto/student/StudentImportDuplicateHandleDTO.java`
  - Create: `axon-common/src/main/java/com/xinxi/axon/common/dto/student/StudentImportRowHandleDTO.java`
  - Modify: `axon-common/src/main/java/com/xinxi/axon/common/vo/student/StudentImportTaskVO.java`
  - Modify: `axon-common/src/main/java/com/xinxi/axon/common/service/student/impl/StudentImportWorkflowServiceImpl.java`
  - Modify: `axon-common/src/main/java/com/xinxi/axon/common/service/student/StudentImportWorkflowService.java`
  - Modify: `axon-chat/src/main/java/com/xinxi/chatservice/controller/student/StudentImportController.java`
  - Test: `axon-common/src/test/java/com/xinxi/axon/common/service/student/StudentImportWorkflowServiceImplTest.java`
- Forbidden files:
  - none
- Approach:
  - `StudentImportRowFixDTO` 增加 `classId`。
  - 校验顺序：必填 -> 手机号 -> `classId` 明确校验或模板字段辅助匹配 -> 重复学生。
  - `StudentImportTaskVO` 增加异常统计 Map 或列表，例如 `exceptionSummaries`，每项含 `exceptionType/count/displayName`。
  - `getTaskDetail` 和解析返回都填充异常统计。
  - 新增通用行处理接口，例如 `POST /api/v1/student/imports/{taskId}/rows/{rowId}/handle`，支持 `IGNORE_ROW`、`KEEP_PENDING`；修正并重校验继续使用 `fixRow` 或 `SAVE_FIX` 动作。
  - 新增重复学生处理接口，例如 `POST /api/v1/student/imports/{taskId}/rows/{rowId}/duplicate/handle`。
  - 处理动作建议枚举：`MERGE_EXISTING`、`IGNORE_ROW`、`KEEP_PENDING`。
  - `StudentImportDuplicateHandleDTO` 包含 `action`、`candidateStudentId`、`overwriteFields`，其中 `overwriteFields` 只允许 `REAL_NAME`、`PHONE`、`STUDENT_NO` 三类白名单值。
  - `MERGE_EXISTING` 校验候选学生属于当前学校，只按 `overwriteFields` 从导入行修正快照或原始快照读取对应字段并更新已有学生；未选择字段保持已有学生原值。
  - `MERGE_EXISTING` 处理成功后，清理当前导入行中重复候选 JSON/异常 JSON 的对应数据，清空 `DUPLICATE_STUDENT` 异常标记，并把行状态更新为已处理或可跳过状态，确认导入阶段不得再为该行创建新学生。
  - 异常行修正抽屉中班级字段必须提交 `classId`；仅提交班级名称时只作为展示或辅助匹配，不能在保存并校验时猜测唯一班级。
- Tests:
  - PENDING 行修正为有效 `classId` 后变为 `IMPORTABLE`。
  - `classId` 不属于当前学校返回参数错误或待处理。
  - 任务详情返回异常分类统计。
  - 通用 `IGNORE_ROW` 后行状态为 `IGNORED`，确认导入跳过该行。
  - 通用 `KEEP_PENDING` 后行保持 `PENDING` 且异常详情仍可查询。
  - 重复行合并时仅覆盖前端选择的姓名、手机号、学号，未选择字段保持已有学生原值。
  - 重复行合并成功后，该行重复候选 JSON/异常 JSON 的对应数据被清理，后续异常明细不再返回同一重复候选。
  - 重复行合并到跨校候选时返回 403 或参数错误。
  - 忽略重复行后确认导入不会创建新学生。
- Validation:
  - `mvn -pl axon-common '-Dtest=StudentImportWorkflowServiceImplTest' test`
- Rollback signals:
  - 修正行成功后 `exception_type/error_message` 残留旧值。历史坑点已记录，必须继续用 `FieldStrategy.ALWAYS`。
- Deferred to implementation:
  - 若当前学生实体字段和账号/profile 字段存在双写关系，执行前需确认姓名、手机号、学号分别落在哪个已有更新方法中，避免只改一侧造成展示不一致。

### U7 - 确认导入和当前用户学校收口

- Goal: 确认导入继续只处理 `IMPORTABLE` 行，并统一从当前用户解析学校。
- Requirements covered: R7, R11, R16, R19
- Acceptance criteria covered: 481 可导入则导入 481；前端不传 schoolId/schoolCode 也能确认导入。
- Depends on: U5, U6
- Files:
  - Modify: `axon-common/src/main/java/com/xinxi/axon/common/dto/student/StudentImportConfirmCommand.java`
  - Modify: `axon-common/src/main/java/com/xinxi/axon/common/entity/student/StudentImportTaskPO.java` only if adding existing columns is needed in VO mapping
  - Modify: `axon-common/src/main/java/com/xinxi/axon/common/service/student/impl/StudentImportWorkflowServiceImpl.java`
  - Possibly modify: `docs/06-sql/migrations/...` only if a new column is required
  - Test: `axon-common/src/test/java/com/xinxi/axon/common/service/student/StudentImportWorkflowServiceImplTest.java`
- Forbidden files:
  - Existing migration files should not be edited after applied; create a new migration if DB changes are necessary.
- Approach:
  - 保持 `importAvailableRows` 的 IMPORTABLE-only 行为。
  - 确认导入请求不要求前端传 `schoolId`；Service 通过 `operatorUserId` 查询当前用户学校，并要求与 task.schoolId 一致。
  - 确认导入请求不要求前端传 `schoolCode`；`StudentImportConfirmCommand.schoolCode` 在新链路中应删除、废弃或忽略，不能因为缺少学校编码阻断导入。
  - `StudentAccountProvisionServiceImpl.buildConfiguredUsername` 当前只在 `schoolCode/classCode/studentSequence` 都存在时生成 `schoolCode + classCode + 4位序号`；新导入链路应允许其走现有 fallback：`systemCode -> studentNo -> STU{id}`。
  - 如果业务仍要求账号名前缀体现学校，后端内部可用 `schoolId` 派生前缀传给账号开通服务，但必须先校验账号最大长度和全局唯一性，不能重新要求前端传 `schoolCode`。
  - 任务 `fileName/fileType` 存原始文件名和解析类型；如要保存 OSS 路径，可新增 `source_file_path`，需要新迁移。
  - 确认阶段不再按班级名称重新匹配，直接使用行的 `classId`。
- Tests:
  - IMPORTABLE/PENDING 混合时只导入 IMPORTABLE。
  - 已 IMPORTED 行再次确认会被跳过。
  - 行 classId 为空但状态误为 IMPORTABLE 时防御失败并标记 FAILED。
  - 前端不传 `schoolId` 时确认导入成功。
  - 前端不传 `schoolCode` 时确认导入成功，且生成账号名不为空。
  - 请求体带 `schoolCode` 时不改变学校边界；新导入链路不依赖该值。
  - operatorUserId 对应学校与任务学校不一致时返回 FORBIDDEN。
- Validation:
  - `mvn -pl axon-common '-Dtest=StudentImportWorkflowServiceImplTest' test`
- Rollback signals:
  - 确认导入重复创建学生。
  - PENDING 行被导入。
- Deferred to implementation:
  - 是否新增 `student_import_task.source_file_path` 需要执行前确认 DB 可迁移窗口。

### U8 - 异常明细数据接口

- Goal: 支持截图中的“下载失败明细”，但后端返回结构化数据，由前端导出文件。
- Requirements covered: R13
- Acceptance criteria covered: 存在异常行时可获取明细数据；无异常返回空列表。
- Depends on: U6
- Files:
  - Modify: `axon-chat/src/main/java/com/xinxi/chatservice/controller/student/StudentImportController.java`
  - Modify: `axon-common/src/main/java/com/xinxi/axon/common/service/student/StudentImportWorkflowService.java`
  - Modify: `axon-common/src/main/java/com/xinxi/axon/common/service/student/impl/StudentImportWorkflowServiceImpl.java`
  - Create: `axon-common/src/main/java/com/xinxi/axon/common/vo/student/StudentImportExceptionDetailVO.java`
  - Test: `axon-chat/src/test/java/com/xinxi/chatservice/controller/student/StudentImportControllerTest.java`
- Forbidden files:
  - none
- Approach:
  - 新增 `GET /api/v1/student/imports/{taskId}/exception-details`。
  - 响应 `List<StudentImportExceptionDetailVO>`，字段包含：行号、年级、班级、学生姓名、性别、学号、手机号、异常类型、异常原因、重复候选摘要、原始快照、修正快照。
  - 不生成 Excel，不写 OSS 临时文件，不返回二进制流。
- Tests:
  - 无异常行返回空列表。
  - 有异常行返回字段完整的结构化列表。
  - 其他学校用户查询任务异常明细返回 FORBIDDEN。
- Validation:
  - `mvn -pl axon-chat -am '-Dtest=StudentImportControllerTest' '-Dsurefire.failIfNoSpecifiedTests=false' test`
- Rollback signals:
  - 异常明细接口触发确认导入副作用。
  - 接口返回二进制或临时 URL，偏离前端导出决策。
- Deferred to implementation:
  - 前端导出文件名和 Excel 样式不由后端控制。

### U12 - 导入三步 UI 状态、模板下载与确认页预览

- Goal: 支持截图中的下载模板、上传文件、系统解析进度、确认导入页统计和学生预览。
- Requirements covered: R9, R11, R26, R27, R28
- Acceptance criteria covered: 三步状态、文件名、解析进度、识别/可导入/需处理计数、确认导入预览、模板表头一致。
- Depends on: U2, U3, U5, U6, U7
- Files:
  - Modify: `axon-chat/src/main/java/com/xinxi/chatservice/controller/student/StudentImportController.java`
  - Modify: `axon-common/src/main/java/com/xinxi/axon/common/service/student/StudentImportWorkflowService.java`
  - Modify: `axon-common/src/main/java/com/xinxi/axon/common/service/student/impl/StudentImportWorkflowServiceImpl.java`
  - Modify: `axon-common/src/main/java/com/xinxi/axon/common/vo/student/StudentImportTaskVO.java`
  - Modify: `axon-common/src/main/java/com/xinxi/axon/common/vo/student/StudentImportRowVO.java`
  - Create: `axon-common/src/main/java/com/xinxi/axon/common/vo/student/StudentImportPreviewRowVO.java` if existing row VO is too broad for confirm page.
  - Test: `axon-chat/src/test/java/com/xinxi/chatservice/controller/student/StudentImportControllerTest.java`
  - Test data: `docs/07-test-data/student-import-current-template-sample.csv`
- Forbidden files:
  - `axon-chat/src/main/java/com/xinxi/chatservice/controller/common/ExcelController.java`
- Approach:
  - 新增 `GET /api/v1/student/imports/template`，返回当前模板文件或可下载资源；模板表头必须与 R27 一致。
  - `StudentImportTaskVO` 增加：`step`、`progressPercent`、`fileName`、`parseStatus`、`recognizedCount`、`importableCount`、`pendingCount`、`failedCount`、`ignoredCount`、`exceptionSummaries`。
  - 第一版若解析仍同步执行，`parse-oss` 可在解析完成后返回 `progressPercent=100` 和完整统计；若后续改异步，增加 `GET /api/v1/student/imports/{taskId}/status` 兼容前端轮询。
  - 行预览接口复用 `POST /api/v1/student/imports/{taskId}/rows/page`，确认页使用 `rowStatus` 和 `exceptionType` 展示“可导入/需处理”。
  - `confirm` 响应返回 `importedCount/skippedCount/failedCount`，前端按钮文案使用任务的 `importableCount`。
  - 重新上传文件创建新导入任务；旧任务不物理删除，状态和历史保留，避免误删用户已处理异常。
- Tests:
  - 下载模板表头包含 `序号、年级、班级、学生姓名、性别、学生学号（可选）、手机号码（可选）`。
  - parse-oss 返回 taskId、fileName、recognizedCount、importableCount、pendingCount、progressPercent。
  - rows/page 返回确认页所需字段：姓名、性别、年级、班级、家长手机号、状态、解析结果。
  - 重新上传创建新 taskId，不覆盖旧任务行明细。
  - confirm 只导入 IMPORTABLE，返回数量与任务统计一致。
- Validation:
  - `mvn -pl axon-chat -am '-Dtest=StudentImportControllerTest' '-Dsurefire.failIfNoSpecifiedTests=false' test`
  - `mvn -pl axon-common '-Dtest=StudentImportWorkflowServiceImplTest' test`
- Rollback signals:
  - 前端确认页显示可导入数量与 confirm 实际导入数量不一致。
  - 下载模板表头与解析 DTO 表头别名不一致。
- Deferred to implementation:
  - 真正按百分比展示解析进度需要异步解析或阶段性落库；第一版可先返回同步完成态，但接口字段预留 `progressPercent`。

### U9 - API 文档、样例和同步方案

- Goal: 给前端和后续执行者留下稳定接口说明、样例和验证命令。
- Requirements covered: R1-R29, NFR4
- Acceptance criteria covered: 文档可检索学生管理页接口、导入接口、字段、流程、错误码和冒烟命令。
- Depends on: U1-U8, U10-U12
- Files:
  - Create: `docs/04-api/2026-07-06-student-import-oss-preview-api.md`
  - Create: `docs/07-test-data/student-import-current-template-sample.csv`
  - Create: `docs/05-reports/2026-07-06-student-import-oss-preview-validation-report.md`
  - Possibly create: `docs/06-sql/migrations/2026-07-06-student-import-oss-source-file.sql` only if U7 needs DB columns
  - Update only if stable new knowledge is confirmed: `docs/08-ai-memory/03-key-workflows.md`, `docs/08-ai-memory/04-known-pitfalls.md`
- Forbidden files:
  - repository root
  - `sql/`
- Approach:
  - API 文档列出学生管理页接口：management/page、management/summary、management-detail、management/create、management/update。
  - API 文档列出前端导入顺序：下载模板 -> 获取学生导入专用 STS -> 上传公共桶 -> parse-oss -> rows/page -> fix row/handle duplicate/handle row -> confirm -> exception-details -> 前端导出。
  - 样例 CSV 使用当前模板同名字段，便于非二进制测试。
  - 验证报告先写待执行命令，执行后补结果。
- Tests:
  - `rg -n "management/page|management/summary|management/create|management/update|parse-oss|student-import/.+schoolId|class/students/page|exception-details|duplicate|学生导入|下载模板" docs/04-api docs/07-test-data`
- Validation:
  - `rg -n "management/page|management/summary|management/create|management/update|parse-oss|student-import/.+schoolId|class/students/page|exception-details|duplicate|学生导入|下载模板" docs/04-api docs/07-test-data`
- Rollback signals:
  - 文档接口路径和代码不一致。
- Deferred to implementation:
  - AI 记忆只在实现和验证后形成稳定结论时更新。

## Consistency Check

- implementationUnitCount: 12
- sourceRequirementsCovered: R1-R29, NFR1-NFR4
- sourceRequirementsDeferred: none
- openQuestionsCount: 0

## Validation Plan

- Unit:
  - `mvn -pl axon-common '-Dtest=StudentImportWorkflowServiceImplTest,ClassStudentQueryServiceImplTest,OssUploadStsServiceImplTest' test`
  - `mvn -pl axon-common '-Dtest=StudentEntityServiceImplTest,StudentOperationLogServiceImplTest' test`
  - `mvn -pl axon-chat -am '-Dtest=StudentImportControllerTest,StudentEntityControllerTest' '-Dsurefire.failIfNoSpecifiedTests=false' test`
- Integration:
  - `mvn -pl axon-common -am -DskipTests compile`
  - `mvn -pl axon-chat -am -DskipTests compile`
- User flow:
  - 调学生管理页 summary/page，确认统计卡片和列表筛选与截图一致
  - 调学生详情、新建、修改接口，确认系统账号生成、状态更新、家长手机号处理和操作历史
  - 获取学生导入专用 STS，确认 `uploadPath=student-import/{schoolId}/{userId}/...`
  - 前端或脚本上传 `学生导入模版.xlsx` 到公共桶该路径
  - 调 `POST /api/v1/student/imports/parse-oss`
  - 调 `POST /api/v1/student/imports/{taskId}/rows/page`
  - 修正异常行或调用重复学生处理接口
  - 调 `POST /api/v1/student/imports/{taskId}/confirm`
  - 调异常明细数据接口，由前端导出失败明细
  - 调班级学生分页确认新增学生出现
- Data / operations:
  - SQL 检查学生管理页列表涉及 `student/users/user_profile/class_student_entity/parent_student` 的学校边界和当前有效关系。
  - SQL 检查 `student_import_task/student_import_row` 行状态计数。
  - 检查 `student/class_student_entity/users/user_profile/sys_user_role/student_operation_log` 是否按确认导入产生。
- Observability:
  - 日志必须包含 taskId、fileName、normalized objectKey、rowCount 和 student-import 前缀校验结果，但不打印 STS secret/token。

## Rollback / Recovery

- 若学生导入专用 STS 异常，只回退新增 STS 入口；旧普通 STS 不受影响。
- 若学生管理页专用接口异常，只回退新增 management 接口；旧 `/api/v1/student/entity/page`、`/management-detail` 兼容入口按既有行为保留。
- 若 OSS 解析接口异常，只回退新增 `parse-oss` 入口；旧 multipart `/upload` 保持可用。
- 若模板字段适配导致历史模板失败，保留旧字段映射并新增别名，不删除旧表头。
- 若新增 DB 字段上线失败，服务可先不保存 OSS 源文件路径，只保留任务和行明细。
- 若重复学生处理接口风险过高，可先保留候选返回和 `KEEP_PENDING/IGNORE_ROW`，但 `MERGE_EXISTING` 一旦开放就必须执行字段白名单、同校校验和重复候选 JSON/异常 JSON 清理。
- 若班级学生分页 union 结果异常，保留旧 `GET /class/{classId}/students` 给依赖方兜底。

## Plan Self-Review

- Placeholder scan: 无未决占位内容。
- Consistency check: U1-U12 覆盖 PRD R1-R29/NFR1-NFR4。
- Scope check: 不包含前端实现、不改旧 school-user 导入、不做无关班级重构。
- Acceptance coverage: 每个需求至少映射到一个实施单元和验证项。
- Validation gaps: 真实公共桶 OSS 冒烟需要用户提供 token、确认服务已重启，并确认公共桶配置可用于 `student-import` 上传读取；计划中已列为 user flow。
- Alternatives and ADR check: 已记录 11 个关键决策和替代方案。
- High-risk pre-mortem check: 已覆盖 OSS 越权、模板不匹配、班级误绑定、统计口径漂移、遮罩手机号误保存五类失败。

## Handoff

推荐执行顺序：

- 第一批：U10 学生管理页列表统计、U11 学生详情/新建/修改抽屉。
- 第二批：U1 班级学生分页、U2 学生导入专用 STS。
- 第三批：U3 OSS 解析契约、U4 公共桶读取校验。
- 第四批：U5 模板字段和班级解析、U6 行修正与重复学生处理。
- 第五批：U7 确认导入收口、U8 异常明细数据接口、U12 导入三步 UI 状态与模板/预览。
- 第六批：U9 文档样例和验证报告。

执行前建议先做 `ae-review domain:document` 审阅本 PRD 和计划；确认后用 `ae-work` 或普通实现流程按 U1-U12 小步落地。

---

## Completion Record（2026-07-06）

- **状态**: 全部 U1–U12 已实现；active 方案已归档至 `docs/00-process/archive/2026-07/student-import-oss-preview/`。
- **单元测试**: axon-common focused 33+ 通过；axon-chat `StudentImportControllerTest` + `StudentEntityControllerTest` 11 通过。
- **本地冒烟**: `docs/05-reports/2026-07-06-student-import-oss-preview-smoke-report.md`（8081，22 项通过）。
- **冒烟期缺陷修复**:
  - F1: `StudentAccountProvisionServiceImpl.generateUsername` — `systemCode` 超过 `maxUsernameLength(18)` 时依次回退 `studentNo`、`STU{id}`。
  - F2: `AliyunOssReadServiceImpl.downloadFromBucket` — OSS 客户端关闭前先 `readAllBytes()`，避免大文件流截断。
- **遗留观察**: 公共桶 `shcool/1/学生导入模版.xlsx` parse 后 `recognizedCount=0`（表头/Sheet 与 `StudentImportExcelRowDTO` 可能不一致）；标准 CSV/API 模板链路正常。
