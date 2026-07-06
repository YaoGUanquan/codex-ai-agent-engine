---
type: prd
status: drafted
date: 2026-06-16
topic: generic-grading-oss-sts-upload
---

# PRD: 通用批改 OSS STS 直传上传能力

## 背景

当前通用批改第三方接口文档 `D:/Downloads/api.md` 中，上传类接口仍以 `multipart/form-data` 文件字段为主，例如 `exam_file`、`answer_file`、`student_answer_pdf`、`sample_image_files`、`exam_json_file`、`layout_json_file`、`strategy_json_file`、`pdf`。

后续链路会调整为：前端先向本系统获取 OSS STS 上传凭证，再把文件直传到公共桶指定文件夹；文件上传完成后，前端把对应 OSS 路径或 URL 作为参数传给后端封装接口，后端再调用第三方通用批改接口。

现有系统已有公共桶 STS 接口：

- `GET /api/v1/common/oss/upload/public/sts`
- 现有用途偏头像等公开资源，路径为用户维度 `users/{uid}/{date}/{time_uuid}/`。
- 现有权限为 `user:update`，不适合直接复用为通用批改资料上传。

因此需要新增通用批改专用 OSS STS 上传能力，面向公共桶中通用批改固定目录，给前端返回可上传的临时凭证和业务文件路径前缀。

## 目标

- 为通用批改不同文件用途提供专用 OSS STS 凭证接口。
- 前端可按后端返回的目录前缀直传文件到公共桶指定文件夹。
- 前端上传完成后，可把 OSS 路径或 URL 回传给通用批改后续接口。
- 后端通用批改封装接口不再强依赖大文件 multipart 代理，降低 Java 服务转发大 PDF、多图文件的压力。
- 上传路径具备学校、考试、文件用途维度，便于第三方按固定路径读取和后续排查。

## 用户与系统

- 前端：获取 STS 凭证、直传文件、把上传结果提交给后端。
- 后端：生成受控上传目录和临时凭证；接收前端上传后的 OSS 路径参数；调用第三方通用批改接口。
- 第三方通用批改服务：按 OSS URL 或固定路径读取原卷、答案、学生答卷、样张、JSON 配置等文件。
- 学校/用户上下文：上传目录必须与当前登录用户所属学校绑定。

## 已确认决策

- 学生答卷 PDF 第一阶段确认允许上传到公共桶；后续如果合规或权限策略调整，可切换到私有桶或后端代理上传。
- 本地接口路径采用推荐的 `/api/v1/exam-generic-grading` 风格命名，不与第三方 `/api/v1/generic_grading` 下划线路径完全一致。
- 第三方 `school_id` 确认使用本系统 `users.school_id` 的数字字符串。
- 第三方服务地址第一阶段确认使用 `http://8.137.84.239:8040`。

## 文件用途范围

第一阶段需要覆盖附件上传接口中涉及的文件用途：

| 用途 | 原第三方文件字段 | 文件类型 | 建议目录语义 |
|---|---|---|---|
| 原卷 | `exam_file` | `.pdf`, `.docx` | `raw_data/exam/` |
| 标准答案 | `answer_file` | `.pdf`, `.docx` | `raw_data/answer/` |
| 学生答卷 PDF | `student_answer_pdf` / `student_pdf` / `pdf` | `.pdf` | `student_data/answer_cards/` |
| 空白答题卡样张 | `sample_image_files` | `.jpg`, `.jpeg`, `.png`, `.webp`, `.bmp`, `.tif`, `.tiff` | `raw_data/sample_images/` |
| 显式 exam JSON | `exam_json_file` | `.json` | `manifests/{manifestId}/json/` 或 `meta_data/` |
| 显式 layout JSON | `layout_json_file` | `.json` | `manifests/{manifestId}/json/` 或 `meta_data/` |
| 显式 strategy JSON | `strategy_json_file` | `.json` | `manifests/{manifestId}/json/` 或 `meta_data/` |

第二阶段可按前端页面需要继续扩展：

- 学生页图片列表，对应 `student_images_json`。
- 样张图片 URL 列表，对应 `sample_images_json`。
- 学生页分组 manifest JSON，对应 `student_manifest_json`。

## 功能需求

### FR-1 获取通用批改上传凭证

后端需要提供一个或多个通用批改专用 STS 凭证接口，用于返回公共桶上传凭证和限定目录。

接口行为要求：

- 请求必须登录。
- 后端从当前用户解析 `userId` 和 `schoolId`。
- 当前用户没有学校 ID 时，返回参数错误。
- 请求需包含考试标识 `examId`。
- OSS 路径中的业务 ID 必须来自本系统可信数据：`schoolId` 来自当前登录用户 `users.school_id` 并转为数字字符串传给第三方，`examId` 来自本地接口路径并完成考试归属校验；不允许前端提交任意学校、考试或项目目录片段。
- 第三方 `school_id` 第一阶段固定使用本系统 `users.school_id` 的数字字符串；后续如第三方改用学校编码或外部租户 ID，再新增映射来源。
- 请求需包含文件用途 `type`。`type` 由后端枚举统一管理，不允许前端传任意目录或文件名。
- 对需要 manifest 目录的用途，可额外传 `manifestId`。
- STS 凭证必须优先采用通用批改专用最小权限策略，只允许写入当前考试需要的公共桶对象 key 或考试目录前缀；不得直接复用现有全桶级公共 STS 作为默认实现。
- 响应返回：
  - `region`
  - `authorizationV4`
  - `accessKeyId`
  - `accessKeySecret`
  - `stsToken`
  - `bucket`
  - `domain`
  - `uploadPath`
  - `objectKeyPrefix`
  - `objectKey`
  - `fileName`：后端生成的 OSS 存储文件名，也是第三方识别的固定文件名，例如 `exam.pdf`、`answer.pdf`、`student_answer.pdf`、`sample_001.png`
  - `url`
  - `ossUri`
  - `allowedExtensions`
  - `maxFileSize`
  - `expireSeconds` 或 `expiration`
  - `type`

多文件类型（例如空白答题卡样张）必须支持按 `count` 一次性返回多个上传目标，每个目标包含独立的 `objectKey/fileName/url/ossUri/index`。样张文件名必须按三位补零连续生成：`count=2` 时返回 `sample_001.{ext}`、`sample_002.{ext}`；`count=12` 时返回 `sample_001.{ext}` 到 `sample_012.{ext}`。

推荐本地接口：

```http
POST /api/v1/exam-generic-grading/exams/{examId}/upload-targets
Content-Type: application/json
```

请求示例：

```json
{
  "type": "SAMPLE_IMAGE",
  "count": 2
}
```

响应示例：

```json
{
  "bucket": "coureseprep-user-public",
  "domain": "https://coureseprep-user-public.oss-cn-chengdu.aliyuncs.com",
  "type": "SAMPLE_IMAGE",
  "credentials": {
    "region": "oss-cn-chengdu",
    "accessKeyId": "...",
    "accessKeySecret": "...",
    "securityToken": "...",
    "expiration": "2026-06-16T10:00:00Z"
  },
  "targets": [
    {
      "index": 1,
      "fileName": "sample_001.png",
      "objectKey": "omrservice/1/grading/10001/raw_data/sample_images/sample_001.png",
      "url": "https://.../omrservice/1/grading/10001/raw_data/sample_images/sample_001.png",
      "ossUri": "oss://coureseprep-user-public/omrservice/1/grading/10001/raw_data/sample_images/sample_001.png",
      "allowedExtensions": [".jpg", ".jpeg", ".png", ".webp", ".bmp", ".tif", ".tiff"]
    }
  ]
}
```

### FR-2 上传目录规则

上传目录必须由后端生成，不允许前端自由传完整目录。

阿里云 OSS 使用公共桶承载通用批改文件。第三方文档中的路径需要拼接到公共桶的 `omrservice` 业务目录下：

- 逻辑目录可表述为公共桶 `/omrservice`。
- 实际 OSS `objectKey` 不带前导 `/`，必须形如 `omrservice/{schoolId}/grading/{examId}/...`。
- 不允许生成 ` /omrservice`、`/omrservice` 或包含空格前缀的 objectKey。

附件中的“通用批改外部 URL 登记”要求 URL 解析出的 OSS key 符合固定命名规则，且第三方只识别文档中约定的文件名，因此第一阶段优先采用 `fixed-key`。后端按 `type` 和本系统业务 ID 生成稳定对象 key：

```text
omrservice/{schoolId}/grading/{examId}/raw_data/exam.{ext}
omrservice/{schoolId}/grading/{examId}/raw_data/answer.{ext}
omrservice/{schoolId}/grading/{examId}/student_data/answer_cards/student_answer.pdf
omrservice/{schoolId}/grading/{examId}/raw_data/sample_images/sample_001.{ext}
```

样张多文件命名必须从 `sample_001` 开始连续递增。前端不负责拼接编号，只按后端返回的 `targets[]` 上传。
`objectKey` 的最后一段必须等于响应中的 `fileName`，并且 `fileName` 必须等于第三方固定识别名。前端上传时不得使用本地原始文件名覆盖后端返回的存储文件名。

后续若第三方允许任意 URL，可再扩展 `unique-prefix` 模式；当前 PRD 不把随机目录作为主链路。

### FR-3 文件类型限制

后端返回凭证时必须返回该用途允许的扩展名，前端上传前做校验。

后端后续接收上传结果时也必须校验：

- `exam_file`: `.pdf`, `.docx`
- `answer_file`: `.pdf`, `.docx`
- `student_answer_pdf` / `student_pdf` / `pdf`: `.pdf`
- `sample_image_files`: `.jpg`, `.jpeg`, `.png`, `.webp`, `.bmp`, `.tif`, `.tiff`
- `exam_json_file` / `layout_json_file` / `strategy_json_file`: `.json`

### FR-4 前端上传后回传参数

前端上传成功后，需要把上传结果提交给后端通用批改封装接口。

对原始资料类文件，推荐前端上传完成后调用本地“外部 URL 登记”接口，由本地后端代理第三方：

```http
POST /api/v1/exam-generic-grading/exams/{examId}/raw-data/refs
```

该接口对应第三方：

```http
POST /api/v1/generic_grading/exams/{school_id}/{exam_id}/raw-data/refs
```

本地请求体应接收附件定义的 `asset_profile/student_sheet_question_mode/mode/verify_exists/files`，但 `school_id` 仍由后端登录态注入。后端必须按 `type` 枚举和固定 key 规则校验每个文件引用。

后端需要支持接收以下形态之一：

- objectKey：例如 `omrservice/1/grading/exam-1/raw_data/exam.pdf`
- publicUrl：例如 `https://.../omrservice/1/grading/exam-1/raw_data/exam.pdf`
- ossUri：例如 `oss://bucket/omrservice/1/grading/exam-1/raw_data/exam.pdf`

默认推荐后端接收 objectKey 和 publicUrl 两个字段：

- objectKey 用于权限和路径归属校验。
- publicUrl 用于传给第三方或前端展示。

具体材料字段与附件一致：`exam`、`answer`、`sample_images`、`student_answer_pdf`，兼容 `student_pdf`。

### FR-5 上传结果归属校验

后端接收上传后的 OSS 路径时，必须校验：

- 路径属于公共桶。
- 路径前缀属于当前用户学校和当前 `examId`。
- 文件用途和目录匹配。
- 文件后缀在用途白名单内。
- 如果传入 `manifestId`，路径中的 manifest 目录必须与请求一致。

### FR-6 通用批改上传接口调整

原计划中的通用批改上传封装需要调整为优先接收 OSS 路径参数，而不是大文件 multipart。

受影响的第三方链路包括：

- 原始资料上传：由文件字段改为 OSS 路径或 URL 字段。
- manifest 注册：显式 JSON 和样张文件可由 OSS 路径或 URL 传入。
- 提交通用批改任务：学生 PDF、样张、学生页图片、JSON 配置可由 OSS 路径或 URL 传入。

后端仍可保留 multipart 兼容，但不作为主推荐链路。

### FR-7 文件用途枚举统一管理

文件用途、第三方字段名、固定 key 模板、默认文件名、允许后缀、MIME 类型、是否多文件、最大文件数量和最大文件大小应由后端枚举统一管理，避免 Controller、Service 和文档各自硬编码。

推荐枚举项：

| type | 第三方 refs 字段 | 固定 key 模板 | 默认文件名 | 后缀 |
| --- | --- | --- | --- | --- |
| `EXAM` | `exam` | `omrservice/{schoolId}/grading/{examId}/raw_data/exam.{ext}` | `exam.{ext}` | `.pdf`, `.docx` |
| `ANSWER` | `answer` | `omrservice/{schoolId}/grading/{examId}/raw_data/answer.{ext}` | `answer.{ext}` | `.pdf`, `.docx` |
| `STUDENT_ANSWER_PDF` | `student_answer_pdf` | `omrservice/{schoolId}/grading/{examId}/student_data/answer_cards/student_answer.pdf` | `student_answer.pdf` | `.pdf` |
| `SAMPLE_IMAGE` | `sample_images` | `omrservice/{schoolId}/grading/{examId}/raw_data/sample_images/sample_{index:000}.{ext}` | `sample_{index:000}.{ext}` | `.jpg`, `.jpeg`, `.png`, `.webp`, `.bmp`, `.tif`, `.tiff` |

JSON 文件用途可作为第二阶段扩展枚举项：`EXAM_JSON`、`LAYOUT_JSON`、`STRATEGY_JSON`。

### FR-8 上传记录登记

前端直传 OSS 后调用本地 `raw-data/refs` 登记成功时，后端需要创建或复用项目内 `file_upload_record` 记录，形成项目内文件管理、删除、审计和第三方登记结果之间的闭环。

登记规则：

- 以 `objectKey + uploadUserId + deleted=0` 优先查找已有记录，避免 fixed-key 重复上传产生多条有效记录。
- 找不到记录时创建 `file_upload_record`。
- `fileName` 使用后端生成的第三方固定识别文件名，不使用前端原始文件名。
- `filePath` 第一阶段固定使用 OSS objectKey，并与 refs 校验使用的 objectKey 保持一致；如后续改为项目既有可解析路径格式，必须同步调整路径校验和删除/预览逻辑。
- `uploadUserId` 使用当前登录用户。
- `businessId` 使用当前 `examId` 对应的本系统考试 ID。
- `businessType` 第一阶段固定使用执行方案中的既有网阅/文档上传值 `3`，并在代码常量中说明该值用于通用批改资料登记；后续是否新增专用枚举作为独立优化项处理。
- `fileCategory` 必须由上传类型枚举统一映射到已有考试文件类别；没有精确类别时使用普通附件或其他类别，但必须通过具名常量表达，不允许在业务代码中散落数字。
- `processStatus=2` 表示本地登记已完成。
- `forwardStatus` 在第三方 `raw-data/refs` 成功后置为已转发或已登记；若第三方失败，不创建成功态记录。

### FR-9 第三方 JSON PUT 能力

通用第三方 JSON 网关需要支持 `PUT` 请求。`PUT /api/v1/generic_grading/manifests/{school_id}/{exam_id}/{manifest_id}/json/{json_type}` 必须以 JSON object body 调用第三方，不能退化为 `POST`。

### FR-10 第三方接口契约摘录

附件 `D:/Downloads/api.md` 中的请求 JSON、返回 JSON、字段说明和错误情况需要进入项目文档，但不应把附件全文复制进执行方案正文。

要求：

- 在 `docs/04-api` 新增第三方通用批改接口契约摘要，按接口列出请求字段、响应字段、关键 JSON 示例和错误码。
- 执行方案正文只保留实现决策、任务拆分、字段映射原则和验收标准。
- DTO/VO、Service 映射和单元测试必须引用契约摘要中的字段，不允许只凭口头记忆实现。
- 契约摘要需要覆盖：`raw-data/refs`、生成 `exam.json`、生成 `strategy.json`、生成 `layout.json`、manifest 注册/列表/详情/JSON PUT、任务提交、任务状态和结果查询。

## 非目标

- 本需求不实现实际代码。
- 不设计前端上传组件 UI。
- 不修改 OSS 桶权限本身。
- 不在 PRD 阶段确定最终 Java 类名和方法名。
- 不把用户 token 或真实文件样例写入文档。
- 不改变第三方服务内部如何读取 OSS 文件。

## 约束

- 文件必须上传到公共桶对应文件夹。
- 学生答卷 PDF 第一阶段允许上传到公共桶；后续可按合规要求迁移到私有桶或后端代理上传。
- STS 凭证必须有过期时间。
- 上传目录必须由后端生成。
- 不允许前端自定义任意 OSS 路径。
- 不允许跨学校读取或提交 OSS 路径。
- 文档、测试样例必须放在 `docs` 下。
- 第三方请求/响应参数以 `D:/Downloads/api.md` 和项目内 `docs/04-api` 契约摘要为准；附件变更时先更新契约摘要，再调整实现计划。

## 验收标准

- 前端可为每种通用批改文件用途获取专用 STS 凭证。
- STS 响应包含上传所需凭证、bucket、domain、uploadPath、允许后缀和用途信息。
- STS 凭证默认按通用批改考试路径或目标 objectKey 限制 OSS 写入权限；若当前基础设施暂不支持细粒度 policy，上传目标接口不得按全桶级 STS 上线，必须停在骨架实现或改为后端代理上传/专用受限角色方案。
- STS 响应必须返回后端生成的 `fileName`，且 `objectKey` 必须以该 `fileName` 结尾；`EXAM/ANSWER/STUDENT_ANSWER_PDF` 分别生成 `exam.{ext}`、`answer.{ext}`、`student_answer.pdf`，`SAMPLE_IMAGE` 按 `sample_001.{ext}` 起连续三位补零生成。
- 同一用户不同请求返回的上传目录不会互相覆盖，除非用途明确要求固定对象 key。
- 当前用户无学校 ID 时，无法获取通用批改上传凭证。
- 后端后续接收 OSS 路径时，能拒绝不属于当前学校、考试或用途的路径。
- `raw-data/refs` 登记成功后，项目内能通过 `file_upload_record` 追踪对应 objectKey、fileName、examId 和上传用户。
- 第三方 manifest JSON 修改接口必须通过 JSON `PUT` 调用。
- 第三方请求/响应字段已沉淀为 `docs/04-api` 契约摘要，执行方案和测试引用该契约摘要。
- 原始资料上传链路可不经 Java 服务转发文件，改为前端直传 OSS 后提交路径。
- 通用批改执行方案需要更新，明确 multipart 文件代理降级为兼容方案。

## 风险

- 第三方固定路径和前端唯一目录上传模式可能冲突，需要确认第三方是否必须固定文件名。
- 公共桶意味着 URL 可能可公开访问；学生答卷 PDF 第一阶段已确认允许放公共桶，但后续可能切换到私有桶或后端代理上传。
- STS policy 如果过宽，可能允许前端上传到非目标目录。
- 多个样张文件需要稳定排序和文件名规则，否则 layout 分析可能顺序不一致。
- 同一考试重复上传原卷/答案时，固定 key 会覆盖旧文件，需要产品确认是否允许覆盖。
- 如果前端只回传 publicUrl，后端做路径归属校验会更脆弱；推荐同时回传 objectKey。

## 开放问题

1. 同一考试重复上传原卷/答案时，固定 key 覆盖旧文件是否符合产品预期？

## Readiness Gate

- Intended outcome: 清楚。前端直传 OSS，后端后续使用 OSS 路径封装第三方通用批改接口。
- Acceptance criteria: 已列出，可测试。
- Non-goals and boundaries: 已列出。
- Assumptions vs requirements: 已分离，第三方请求/响应字段来自附件并需沉淀到 `docs/04-api` 契约摘要；`school_id`、本地路径、公共桶策略和第三方 baseUrl 已确认。
- WHAT/WHY before HOW: 当前文档聚焦行为和约束，未进入实现细节。
- Validation expectations: 已列出 STS、路径归属、文件类型和后续上传接口调整。

## 下一步

- 复核 `docs/04-api/2026-06-16-通用批改第三方接口契约摘要.md` 是否覆盖本轮 DTO/VO、Service 映射和测试需要；附件变更时先更新契约摘要。
- 基于已确认的 `school_id=users.school_id` 数字字符串、公共桶策略和 `http://8.137.84.239:8040` 第三方地址继续执行方案。
- 复审 `docs/00-process/active/generic-grading-third-party-wrapper/2026-06-16-generic-grading-third-party-wrapper-plan.md`，通过后可先进入 U1-U4a；U5 及以后必须满足执行 Gate。
