# 版本更新记录

本文件是 AI Agent Engine for Codex 的完整发布说明（自 0.3.7 起；更早版本未维护发布说明）。`README.md` 的版本节仅保留最近 5 个版本；每次发布须同时在 README 与本文件追加当前版本条目，超出窗口的 README 条目迁移到这里，由 `node scripts/check-release-notes.mjs` 校验。

English: [CHANGELOG.en.md](CHANGELOG.en.md)

### 0.3.29（2026-08-13）
- 全局安装在发布 Codex personal 插件之后，于当前用户 `~/.cursor/skills/ae-*` 创建指向 `$HOME/plugins/ai-agent-engine-codex/skills/<name>` 的目录联接，使 Cursor 与 Codex 都能发现同一套 AE 技能；不恢复 `~/.agents/skills`，也不写入 `~/.cursor/skills-cursor`。
- 验证：`npm test`、`npm run check`、`npm run check:smoke`、`node scripts/check-release-notes.mjs`。这些检查证明安装器在隔离 home 中创建联接、保留无关 Cursor 技能、回滚失败批次，以及预览/文档契约一致；不代表当前 Cursor 会话的 `/ae` 列表已刷新，新开 Cursor 对话后才能观察 slash 发现。

### 0.3.28（2026-08-13）
- 全局更新：同步根包与插件 manifest 版本，并通过个人 marketplace 的全局安装流程刷新当前用户的 AE 插件与 dispatcher；不改变项目级文档、源码或用户项目数据。
- 验证：`npm test`、`npm run check`、`npm run check:smoke`、`node scripts/check-release-notes.mjs`。这些检查证明版本、技能镜像、安装契约和全局预览/安装流程一致，不代表目标项目运行时验收。

### 0.3.27（2026-08-13）
- `ae-test-api` 与共享本地冒烟门禁改为先构建脱敏 request-context manifest，再按 `项目 runner -> 单请求 curl fallback -> blocked` 选择执行载体；纯函数强制适用 header 必须有 provider、path/query/body same-context 别名一致、动态值不得使用 static lifetime，且非 GET 默认不能走通用 curl。
- 新增纯函数 `plugins/ai-agent-engine-codex/scripts/request-context-contract.mjs`：无网络、无密钥地校验上下文完整性、同进程凭据可见性、runner 的 method/path/assertion 覆盖证据、fallback 资格，以及 `passed/request-context/client-config/transport/auth/business` 分类（2xx 为 passed，5xx 为 transport）；验证记录模板补齐 Request Context、Carrier、Outcome 字段。
- 验证：`npm test`、`npm run check`、`npm run check:smoke`、`node scripts/check-release-notes.mjs`。这些检查证明纯契约逻辑、技能文档、镜像与分发一致，不代表任何目标项目的认证接口、实际 header 值或有状态冒烟已经通过。

### 0.3.26（2026-08-11）
- 前端指导补旧栈最小对照节：`svelte-guidance.md` 增 Svelte 4（stores 与 `$:` 反应语句）对照、`angular-guidance.md` 增 NgModule 时代对照、`vue-guidance.md` 增 Options API 对照，均与现代基线同文件并存，文件首行 stack-conditional 语句与"匹配仓库既有风格"兜底不变；新增回归用例锁定对照节与镜像一致（先红后绿）。
- 新建维护者映射说明 `docs/ae/references/frontend-quality-contract-map.md`：登记 `web-ui-quality.md`、`ae-review` Frontend Components / Styles 镜头、`browser-acceptance.md` 之间 5 组对应关系、两处空档与既有测试锁；映射为描述性文档，不构成第 4 份契约面，不建校验脚本。本批为路线图第 7、10 条的提前收尾（用户决定，原触发条件未命中；见决策日志 2026-08-11 条目）。
- 验证：`npm test`、`npm run check`、`npm run check:smoke`、`node scripts/check-release-notes.mjs`。这些检查证明技能文档、镜像与分发合同一致，不代表任何目标项目对旧栈框架（Svelte 4 / NgModule / Options API）的运行时验收。

### 0.3.25（2026-08-11）
- 统一需求产物目录声明：能力目录中 `ae-brainstorm` 的 `artifactPath` 由 `docs/ae/brainstorms` 改为 `docs/ae/prds`；`ae-help` 工件契约的 Requirements 行与需求 frontmatter 示例改用 `docs/ae/prds` 与 `ae-prd` 捕获形状（`type: prd`），计划 `origin` 示例同步，并注明 legacy 需求可保留在 brainstorms；`ae-review` 文档评审默认搜索范围加入 `docs/ae/prds`。顶层 `artifactPaths` 与 init 模板自 0.3.22 已正确，保持不变；`docs/ae/brainstorms` 仍为探索性记录目录（`artifactPaths.ideas`）。
- 新增回归断言锁定目录声明一致性（catalog、工件契约、scope-detection 的源与镜像）；work 参照项目存量 `docs/ae/README.md` 的旧目录说明已同步修正（init 存量文件，插件更新不会自动重写）。
- 验证：`npm test`、`npm run check`、`npm run check:smoke`、`node scripts/check-release-notes.mjs`。这些检查证明技能文档、镜像与分发合同一致，不代表任何目标项目的运行时验收。

### 0.3.24（2026-08-11）
- `tidy` 归档冲突从"跳过"升级为无损按文件合并：目标已存在时缺失文件移入、内容相同去重、同名不同内容带 `.from-active-<日期>` 后缀并入，源目录清空后删除；新增 `memoryBudget` 报告（默认 15KB，`--memory-budget-kb` 可调，仅报告、永不移动记忆文件）。
- 更新后自动维护：`update-project` 安装完成后通过目标项目的 `scripts/ae-tools.mjs` 自动执行 `tidy --apply`（done 记录、空目录、超期证据；永不 stale 归档），摘要并入更新输出 `maintenance` 字段；`--no-tidy` 跳过；CLI 缺失或执行失败降级为 skipped 且不阻断更新。INSTALL 双语、README 更新章节与 `ae-update` skill 同步说明。
- 治理执行：work 参照项目 2 个同名归档冲突目录经合并清零，记忆蒸馏交接（memory-distillation）已放入该项目待其会话收尾后执行；Light Path 与碰撞触发的校准信号补入 0.3.23 经验笔记。
- 验证：`npm test`（新增冲突合并、记忆预算、自动维护共 5 个用例）、`npm run check`、`npm run check:smoke`、`node scripts/check-release-notes.mjs`。这些检查证明 CLI 行为与分发合同一致；更新自动维护以本地 git 仓库模拟为证据边界，不代表真实远端仓库的端到端更新验收。

### 0.3.23（2026-08-11）
- 新增 `tidy` 维护命令：对 `docs/00-process/active/` 过程记录做五态分类（done/empty/stale/archived-pointer/active），对 `docs/ae/gates/` 与 `docs/ae/evidence/artifacts/` 按保留期（默认 3 个月）检测超期证据；默认 dry-run，`--apply` 归档 done 记录、删除空目录、迁移超期证据并同步重写 ledger 引用；`--archive-stale`、`--stale-days`、`--retention-months` 控制口径；归档目标已存在时安全跳过。
- 修整 `parseOptions`：重复 `--key value` 累积为数组，`gate --validation` 多次传参逐条记录验证命令。
- skill 精修四项：`ae-prd` capture 模板新增 `## Perspective Collision (Conditional)` 落点小节，`ae-brainstorm` 碰撞段增加确定性触发条件（S1-S2 单一方向跳过、默认至多四视角）并指明落点；`ae-review` 新增 Light Path 轻量档（≤3 文件、不跨公共 API/数据/安全/依赖边界、非交付门禁时免 review-package/review-contract 单 lane 直审）与 persona 速选提示；`ae-brainstorm`/`ae-prd`/`ae-review` 的证据分层词汇统一指向 `ae-plan/references/validation-evidence-profile.md` 唯一定义；`ae-handoff` 与 `ae-lfg` 统一交接路由（任务内交接进过程目录，跨会话独立交接进 `docs/ae/handoffs/`）。
- 记忆维护规则模板（en/zh-CN）与本仓规则新增体积与蒸馏预算（单文件约 15KB、决策日志按年轮换、季度 reviewStatus 盘点、退役主题归档）。
- 验证：`npm test`（新增 gate 累积与 tidy 用例，共 121 项）、`npm run check`、`npm run check:smoke`、`node scripts/check-release-notes.mjs`。这些检查证明 CLI 行为、技能文档与分发合同一致；tidy 对本仓与 work 参照项目的实际治理以命令 JSON 输出为证据，不代表其他项目的运行时验收。

### 0.3.22（2026-08-11）
- 知识库治理第一批：`docs/ae/prds/` 为需求正典目录；`ae-brainstorm` 持久化需求时复用 `ae-prd` 捕获契约并写入 `docs/ae/prds/`，删除重复的 `requirements-capture.md`；`recovery` 扫描 PRD 产物；init 创建 `docs/ae/prds` 且不再创建 `docs/ai-memory` 兼容指针（存量项目不动）。
- `review-package` 改为指纹产物（提交列表、diffstat、清单、base/head SHA 与 `git diff -U10` 重建命令），不再嵌入全量 diff 正文；init/archive 模板与 `docs/00-process/templates/archive-rules.md` 新增 gate/evidence 3 个月保留策略。
- 新增 `docs/external-samples/README.md` 登记样本语料用途与保留条件。
- 验证：`node scripts/check-skill-mirror.mjs`、`node scripts/check-release-notes.mjs`、`npm test`、`npm run check`、`npm run check:smoke`。这些检查只证明 CLI、技能文档与分发合同一致，不代表目标项目 init 或审查工作流的运行时验收。

### 0.3.21（2026-08-11）
- 全栈技能对称优化：`ae-backend` 新增 Java/Go/Python/C/C++/C# 六份语言指导，工作流增加按仓库技术栈选读步骤，其他后端语言仍回退仓库既有约定。
- 契约与边界：`api-contract-checklist.md` 扩充 Frontend-Backend Alignment 章节；`ae-web-app` 与 `ae-web-forge` 路由至共享契约检查表；`ae-debug` 新增 Backend Failure Quick Map 与 Frontend-Backend Boundary Quick Map。
- `ae-sql` 新增 `sql-safety-checklist.md`（操作风险分级与安全约束），SKILL 工作流挂载该清单。
- 验证：`node scripts/check-skill-mirror.mjs`、`node scripts/check-skill-contract.mjs`、`node scripts/check-release-notes.mjs`、`node scripts/check-install-smoke.mjs`、`npm test`。这些检查只证明技能文档、镜像与分发合同一致，不代表任何目标项目的 API、数据库或部署验收。

### 0.3.20（2026-08-11）
- 结构性重构：插件 `scripts/ae-tools.mjs`（约 2860 行单体）拆分为 `scripts/ae-tools/` 下 15 个命令模块（utils、yaml、git、evidence、graph、help、recovery、gate、tasks、review、swagger、claude、markitdown、static-server、init），入口只保留命令分发与全局参数解析；目标项目的根薄包装 `scripts/ae-tools.mjs` 导入路径不变。
- init 三语模板外置为 `scripts/ae-tools/init-templates/{en,zh-CN}/*.md` UTF-8 模板文件加 `{{placeholder}}` 占位替换，bilingual 输出由中英模板拼接生成；渲染时归一化 CRLF，防止换行符污染生成文件。
- 新增插件内共享模块 `scripts/artifact-check-utils.mjs`，`check-ae-artifacts.mjs` 与 `check-design-contract.mjs` 复用 readArg / isRepositoryRelativePath / toPosix / parseFrontmatter 等 helper，消除双份拷贝。
- 新增模块依赖回归守卫：`tests/ae-tools.test.mjs` 静态扫描 `scripts/ae-tools/*.mjs` 本地导入构图并做 DFS 断环，断言 `utils.mjs` 保持零本地导入的基础层；引入循环导入时 `npm test` 直接失败并打印循环链。
- 验证：`node scripts/check-syntax.mjs`、拆分前后关键命令金样输出对比（help/recovery/graph-build/graph-query/review-contract/evidence/gate/claude-delegate，仅时间戳与 git 指纹差异）、三语 init 输出与拆分前逐字节一致（48 个基线文件）、`npm test`（112 项）、`npm run check`、`node scripts/check-install-smoke.mjs`、`node scripts/check-global-install-smoke.mjs`。这些检查证明模块拆分后 CLI 行为与安装合同不变，不代表目标项目的运行时验收。

### 0.3.19（2026-08-11）
- 补齐前端技术栈覆盖：`ae-web-app` 新增 `svelte-guidance.md`（Svelte 5 runes/SvelteKit：`$derived` 优先、`$effect` 清理、keyed each、load 函数与 `$lib/server` 边界）与 `angular-guidance.md`（standalone/signals：async pipe 或 `takeUntilDestroyed` 订阅治理、OnPush 可见性、`@for` track、typed forms、`switchMap` 竞态取消、SSR 守卫），SKILL 工作流按 React/Vue/Svelte/Angular 四栈选读，其他栈回退到沿用仓库既有约定。
- 非前端 skill 的前端适配：`ae-review` 评审规则画像新增「Frontend Components / Styles」镜头（Vue/Svelte/Angular 响应性错误、列表 key/track、非交互元素点击无键盘等效、diff 削弱可访问性、样式全局泄漏、`innerHTML` 类注入点），并保留"以仓库实际框架为准"的抑制规则；`ae-tdd` 工作流新增前端测试挂载点指引（沿用既有 runner 与组件测试库、断言用户可见行为、jsdom 不证明真实浏览器行为并路由到 `ae-test-browser`）。
- 经评估未改动：`local-runtime-smoke-gate` 已覆盖 UI 面；`ae-plan` 的浏览器验收要求由 `ae-lfg`/`ae-web-forge` 管道承担，不重复内联。
- 验证：`node scripts/check-skill-mirror.mjs`、`node scripts/check-skill-contract.mjs`、`node scripts/check-skill-language-metadata.mjs`、`node scripts/check-release-notes.mjs`、`node scripts/check-install-smoke.mjs`、`npm test`。这些检查只证明技能文档、镜像与分发合同一致，不代表任何目标前端项目的运行时或浏览器验收。

### 0.3.18（2026-08-11）
- 面向前端开发强化技能参考：`ae-web-app` 的 React 指引扩充为结构约定、常见缺陷（派生状态、effect 纪律、列表 key、请求竞态、受控输入、按需 memo）、Next.js/SSR 边界、用户可见状态四部分，并新增同构的 `vue-guidance.md`（Vue 3/Nuxt：响应性丢失、computed 优先、`v-for` key、props 单向流、SSR 边界）；SKILL 工作流按仓库技术栈选读对应指引。
- `ae-frontend-design` 质量清单与设计规则补充可访问性基线（语义结构、控件标签、键盘可达与焦点可见、对比度、alt 文本）、响应式断点验证与异步加载布局稳定性；`ae-web-app` 部署就绪清单新增前端性能不回退项；`ae-debug` 新增前端故障速查表（空白页、hydration、CORS/认证、缓存、样式、环境差异）；`ae-test-browser` 最低验收证据新增主控件键盘可操作性。
- 验证：`node scripts/check-skill-mirror.mjs`、`node scripts/check-skill-contract.mjs`、`node scripts/check-skill-language-metadata.mjs`、`node scripts/check-release-notes.mjs`、`node scripts/check-install-smoke.mjs`、`npm test`。这些检查只证明技能文档、镜像与分发合同一致，不代表任何目标前端项目的运行时、浏览器或部署验收。

### 0.3.17（2026-08-10）
- 强化 `ae-test-api` 与共享 local-runtime smoke gate 的认证冒烟交接：必须生成非空、可填写的 UTF-8（无 BOM）请求配置模板，包含方法、路径、填写步骤和 `REPLACE_WITH_LOCAL_TOKEN`，禁止空文件与不安全的 PowerShell 重定向写中文配置。
- 新增 `request-config-template` 参考作为唯一模板形状；agent 只交付路径，不读取用户填好的 token。验证：`node --test --test-name-pattern "API bubble testing|local runtime smoke gate" tests/skill-scripts.test.mjs`、`node scripts/check-skill-mirror.mjs`、`node scripts/check-release-notes.mjs`。这些检查只证明技能与分发合同，不代表目标项目的真实认证接口验收。

### 0.3.16（2026-08-10）
- `recovery-failed` 操作不可执行 purge，必须先通过 `recover --operation <id>` 恢复到 `rolled-back`；避免尚未恢复的备份被提前删除。验证新增此恢复生命周期回归用例。

### 0.3.15（2026-08-10）
- Windows 全局 apply 通过 `cmd.exe` 安全调用 Codex CLI，并先执行 `codex plugin marketplace add $HOME --json`，再执行插件安装；两个 CLI 步骤均写入 journal，任一步失败都会回滚安装器拥有的文件。

### 0.3.14（2026-08-10）
- 全局 apply 现在会通过当前用户的 personal marketplace 发布 `ai-agent-engine-codex`，并调用 `codex plugin add ai-agent-engine-codex@personal --json`；不会修改 Codex cache 或客户端私有注册表。
- 安装器会备份旧的用户级 AE skill 副本而不重新激活重复 skill；confirmation digest 同时绑定 `--retire-modified`。验证覆盖个人插件发布、保留第三方 marketplace 条目和 CLI 注册失败后的安装器文件回滚；真实客户端可见性须以 `codex plugin list` 单独确认。

### 0.3.13（2026-08-10）

- 全局迁移改为显式 manifest，不再根据本机路径或项目名推导 consumer；项目级组件默认通过指纹验证后才会备份并退役。
- 新增 `--retire-modified`：在 apply 的 operation ID 与 confirmation 之外，单独授权完整备份后退役修改过或未知的 AE 组件；由安装器 journal 创建的全局 runtime 可事务式升级。

### 0.3.12（2026-08-10）

- 新增每用户全局 AE 分发：用户级 dispatcher 以确定的项目根运行，项目 `docs`、记忆、图谱和 archive 保持原位。
- 验证使用 `npm.cmd test`、`npm.cmd run check`、全局 preview smoke 与隔离 apply fixture。它们证明本地分发合同，不授权或证明真实 consumer 的 apply 结果。
- 已在新的 `codex-cli 0.146.1` 会话中验证 `$HOME/.agents/skills` 的发现与探针调用；已打开的 Codex 桌面任务不会热刷新其启动时的 skill 清单。

### 0.3.11（2026-08-06）

- 在安装 OpenAI 的 `codex@openai-codex` Claude Code 插件后，加固 `ae-claude-code`：默认委派子进程输出 JSON、不持久化会话、使用 `plan` 权限、仅允许 `Read,Grep,Glob`，并禁用 slash commands。
- 明确调用方向：官方插件让交互式 Claude Code 通过 `/codex:*` 调用 Codex，并不让 Codex 控制 Claude Code。Claude 到 Codex 的转移和审查使用官方插件；Codex 到 Claude 的委派仍是独立、只读的第二意见通道。
- 分发验证使用 `npm.cmd test`、`npm.cmd run check`、`node scripts/check-install-smoke.mjs`、`node scripts/check-release-notes.mjs` 和 `git diff --check`。这些检查只证明本地技能和分发合同，不证明未来 Claude/Codex 交互运行、认证状态、配额或目标项目验收。

### 0.3.10（2026-08-05）

- 新增 `ae-test-api`：用于后端改动后的接口冒泡测试，按变更契约选择端点、成功/错误路径和风险维度，并将静态测试、本地运行、认证接口、浏览器和部署证据严格分级。
- 每次完成验证写入一份脱敏 API Verification Record，保留字段来源、断言摘要和未验证边界，不保留请求/响应体、令牌、Cookie、私有命令参数或具体资源标识；长期知识图谱关系仅在用户显式要求时写入。
- 该 skill 复用既有 local-runtime smoke gate 作为唯一的本地请求安全所有者，不引入默认 HTTP 客户端、脚本生成、服务生命周期控制、MCP、外部运行时或自动修复。分发验证使用 `npm.cmd test`、`npm.cmd run check`、`node scripts/check-install-smoke.mjs`、`node scripts/check-release-notes.mjs`、`node scripts/check-ae-artifacts.mjs` 和 `git diff --check`；它们只证明本地技能与分发合同，不代表目标项目的认证 API、浏览器或部署验收。
- 补充诊断复测：API 冒泡测试定向回归及完整 `npm.cmd test` 均通过（99/99），镜像、语言元数据、技能契约、安装烟测、AE 产物、设计契约和发行说明检查均通过；未调用任何目标项目的真实后端接口。

### 0.3.9（2026-08-04）

- 新增 `ae-reverse-engineering`：面向用户自有或明确授权的二进制、移动端、取证、兼容性和本地训练工件，先确认授权、来源、静态基线和证据边界；禁止许可证绕过、凭据提取、规避、防护绕过、主动利用、扫描以及未经授权的目标交互。
- 该 skill 不安装工具、不注册 MCP、不写入全局配置、不自动沉淀经验；缺少工具或隔离环境时只给出受控建议并等待显式授权。报告模板区分 observed、inferred 和 unverified 结论。
- 分发验证使用 `npm.cmd test`、`npm.cmd run check`、`node scripts/check-install-smoke.mjs`、`node scripts/check-release-notes.mjs`、`node scripts/check-ae-artifacts.mjs` 和 `git diff --check`。这些检查只证明本地技能和分发合同；真实工件、工具链、授权环境和未来模型遵循度仍需单独验收。

### 0.3.8（2026-08-04）

- 新增 `docs/08-ai-memory/00-registry.json` 的声明式记忆合同、路径安全校验、`ae-memory-query`、`ae-knowledge-map` 和 `ae-knowledge-query`。Markdown 记忆仍是唯一权威来源；查询只返回已登记元数据和带证据的 declared 关系，不扫描未登记文档。
- `ae-graph-build` 与 `ae-graph-query` 在保持默认 500 文件、无边数上限行为的同时，新增 `limits` 元数据；只有显式 `--edge-limit` 才截断边。
- 记忆、知识关系和浅层图命令会拒绝缺少值的取值型参数；`--root` 必须是工作区内不经由符号链接或 junction 的目录，防止读取越界。
- 安装器会分发记忆合同检查器，安装烟测验证缺失注册表返回结构化非零诊断且不创建状态。未引入 CodeGraph、MCP 自动注册、网络请求、数据库或后台服务。

### 0.3.7（2026-08-03）

- 退役 `ae-computer-use-guard` 和 `ae-video-edit-computer`，并移除它们的活动镜像、语言元数据、安装期望和 Computer Use hook 模板。更新安装脚本会清理目标项目中这两个旧 skill 目录；本次不提供兼容别名，也不引入新的桌面或视频运行时。
- `ae-test-browser` 增加“先侦察再操作”、适用时等待 `networkidle`、以及将辅助脚本视为黑盒调用边界的规则。`ae-review` 在提出 `delete` 或 `shrink` 建议前，要求确认行为基线、调用关系和当前设计原因。
- `ae-prd`、`ae-plan` 和 `ae-review` 模板增加可选的 must-have、deviation 和 verification gap 记录，用既有需求 ID 串联交付条件、批准的偏差与缺失证明；它们不创建自动判定器、后台循环、hook 或运行时注册。
- 图片提示词流程保留提示词优先的通用能力，不再依赖已退役的 Computer Use 配置。
- 分发版本同步为 `0.3.7`。该变更已通过 `npm test`、`npm run check`、`node scripts/check-install-smoke.mjs` 和 `git diff --check`；这些检查证明本地分发和静态合同，不代表浏览器、部署或未来模型遵循度的验收。
