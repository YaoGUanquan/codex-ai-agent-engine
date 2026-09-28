# 版本更新记录

本文件是 AI Agent Engine for Codex 的完整发布说明（自 0.3.7 起；更早版本未维护发布说明）。`README.md` 的版本节仅保留最近 5 个版本；每次发布须同时在 README 与本文件追加当前版本条目，超出窗口的 README 条目迁移到这里，由 `node scripts/check-release-notes.mjs` 校验。

English: [CHANGELOG.en.md](CHANGELOG.en.md)

### 0.3.53（2026-09-28）
- 新增 `micro`、`small`、`standard` 与 `high-risk` 任务规模门禁及有界工作预算：小任务默认走最小流程，显式范围优先，达到验收、真实阻塞或预算上限即停止。
- 收紧 `ae-lfg`、`ae-review`、`ae-task-loop` 与 `ae-web-forge` 的快速路由、审查范围锁定和返工停止条件，减少无关扫描、重复仪式与无界返工；插件源和维护镜像保持同步并补充回归断言。
- 新增测试副作用边界：默认禁止连接用户管理的 MySQL/其他数据源，`single-request-curl` 与项目 smoke carrier 必须证明 disposable/test-only 隔离；共享规模契约补充 token 计量、上下文/输出上限、渐进披露、停止原因及压缩后审查账本续接，缺少隔离时统一报告 `blocked`。
- 验证命令：`node --test tests/skills-docs.test.mjs`、`npm test`、`npm run check`、`npm run check:smoke`、`git diff --check`。

### 0.3.52（2026-09-27）
- 修复审查发现的安装恢复问题：缺失参数在加锁前拒绝，更新失败保留有界脱敏诊断、操作 ID 和 journal 路径，明确区分已回滚与恢复失败。
- 普通正文中的 `ae-doc-pages:v1` 格式名不再误判为损坏路由；外部文档维护在改写前建立报告和持久化逐文件日志，报告失败保留已应用清单、待核验文件和恢复信息并停止后续写入。
- 验证命令：`node --test tests/install-scripts.test.mjs tests/docs-lifecycle.test.mjs`、`npm test`、`npm run check`、`npm run check:smoke`、`git diff --check`。证据限于本地回归、故障注入和隔离安装；全局更新须另核验安装 journal、Codex 注册和 Cursor 副本，不代表当前会话已重新加载或生产验收。

### 0.3.51（2026-09-27）
- 打通规模化扫描与记忆分页：图、任务和审查影响分析默认排除不可变分片，显式纳入后仍只授予只读证据权限；计划模式也不能把分片变为 worker 写入所有权，审查改动清单始终保留真实变更。
- recovery 支持单一绝对外部文档根与类型筛选，明确路径基准、范围和不完整性；错误根/参数不回退到仓库 docs，目录选择不等于已验证项目/分支登记。同步 LFG、工作委派、共享契约和 help 指引。
- 联合记忆任务修复 Windows 文档大小写别名的身份与本地锁一致性，保留旧路由/分片兼容性；POSIX 不以统一小写合并不同文件。
- 验证命令：`node --test tests/scale-memory-integration.test.mjs tests/docs-lifecycle.test.mjs tests/memory-navigation.test.mjs`、`npm test`、`npm run check`、`npm run check:smoke`、`git diff --check`。证据限于本地隔离集成、双进程互斥、字节恢复和安装分发；不代表外部原文已迁移、当前用户安装已升级、跨主机一致性或生产吞吐验收，环境相关跳过以验证记录为准。

### 0.3.50（2026-09-27）
- 全部 40 个技能按职责接入共享规模化/分布式工程契约，覆盖容量、背压、幂等、分区、恢复、混合版本与证据分层；保留既有数据库专项和文档分页契约。
- 图、任务、恢复和 Issue 分析增加遍历/字节/时间预算及不完整诊断，依赖提取消除异常 import/export 文本的重复回溯；任务支持内容匹配，配置/YAML 失败显式阻断并行就绪，转换和 OpenAPI 不再静默截断。gate 区分命令声明与执行记录，阻断返回退出码 1。
- 项目安装增加暂存校验、写入锁、指纹和 journal 恢复；全局安装增加写入锁、预览源内容绑定、失败暂存清理及已校验副本发布；更新区分安装完成与维护失败。逐组件交换不等于跨组件原子事务，也不是跨主机锁。
- 验证命令：`node --test tests/scale-runtime.test.mjs tests/install-scripts.test.mjs tests/global-install.test.mjs`、`npm test`、`npm run check`、`npm run check:smoke`、`git diff --check`。仅证明本地工具、隔离并发/恢复、静态技能和安装分发合同；权限不足的 Windows 文件链接用例明确跳过，不代表真实目标项目容量、跨主机可靠性、生产验收或当前用户安装已升级。

### 0.3.49（2026-09-27）
- 将增长治理扩展到记忆专题、开发历史、导航和滚动台账：新增 `ae-docs-maintain` 分类审计/无损分页、`ae-docs-append` 自动分页写入与 `ae-docs-search` 有界续查，入口固定预算，历史原字节可恢复。
- 新增已登记外部 docs 的显式批量维护工具，绑定 context manifest 和预览哈希，逐文件核验；更新中英文生成模板、收尾门禁和维护镜像。正式合同、SQL、结构化 registry、JSONL 证据链和归档不自动拆改，不创建后台任务或删除历史。
- 验证命令：`node --test tests/docs-lifecycle.test.mjs tests/memory-navigation.test.mjs`、`npm test`、`npm run check`、`npm run check:smoke`、`git diff --check`。证明本地分页/检索、字节恢复及隔离分发合同；实际外部应用以逐文件报告为准，不代表全局安装已更新、任意手工写入受阻或模型 token/延迟收益。

### 0.3.48（2026-09-27）
- 记忆入口改为最多 4096 UTF-8 字节/80 行的短导航，专题预算 15KiB；新增 `ae-memory-index` 审计/门禁及带源哈希校验的无损整理，历史分片保留原字节，不自动删除或蒸馏其他专题。
- 新增 `ae-memory-search` 有界字面检索，默认返回 5 个短摘录及路径/行号；历史显式选择，扫描截断明确报告，外部 docs 由调用方先解析分支后显式传入。原声明式关系查询不变，读写模板禁止入口追加日期流水。
- 验证命令：`node --test tests/memory-navigation.test.mjs`、`npm test`、`npm run check`、`npm run check:smoke`、`git diff --check`。仅证明本地文件/CLI、镜像与隔离安装合同；Axon 隔离样本不代表原目录已迁移，全局安装和模型 token/延迟收益未验证。

### 0.3.47（2026-09-24）
- 后端大数据量设计新增按需加载的数据访问契约，贯穿 14 个需求、设计、实现、重构、诊断与验收技能：明确查询预算、逻辑分页对象、独立 count 验收、批量执行与事务提交边界，避免无依据的逐条查询/提交。
- 增加辅助查询表、业务扩展表、预计算读模型的方案比较与一致性、回填、重建约束；异步批量保存覆盖持久化接收、背压、分块事务、幂等、检查点、失败恢复和完成核验。MyBatis-Plus 按实际版本选择 count 与批处理方案，不全局关闭优化或强制新增表/队列。
- 验证命令：`node --test tests/data-access-contract.test.mjs`、`npm test`、`npm run check`、`npm run check:smoke`、`git diff --check`。仅验证指令结构、评审选择器、镜像及隔离安装分发；不证明模型遵循率、业务数据库性能、真实异步恢复或当前用户安装已更新。

### 0.3.46（2026-09-13）
- 统一运行时命令入口：共享只读解析器优先选择项目 wrapper，仅路径缺失时选择当前用户全局 dispatcher；无效路径、损坏链接和执行失败明确报错，不静默切换安装版本或自动重试命令。
- 活跃技能与 capability catalog 使用 `node "$aeEntry"` 模板，沿共享 reference 完成初始化；help 输出实际启动入口的 PowerShell/POSIX 安全变量赋值，保留原命令参数与权限边界。
- 验证命令：`node --test tests/runtime-entry.test.mjs tests/instruction-audit.test.mjs tests/skills-docs.test.mjs`、`npm test`、`npm run check`、`npm run check:smoke`、`git diff --check`。专项测试包含双 shell、consumer 安装与隔离全局 dispatcher；不证明真实全局安装更新、宿主发现或 GPT-6 Astra 路由/token 收益，完整测试结果以交付审查记录为准。

### 0.3.45（2026-09-13）
- 审计优化第一批：明确插件源、维护镜像、consumer 安装和生成物边界；清理 README 旧版条目，完整历史保留在 CHANGELOG。
- 收窄前端三个技能的触发元数据，复用已有路由决策，按需加载视觉参考；新增六组路由正反例，保留安全与浏览器证据门禁。运行时入口统一仍待处理。
- 验证命令：`node --test tests/instruction-audit.test.mjs tests/skills-docs.test.mjs`、`npm test`、`npm run check`、`npm run check:smoke`、`git diff --check`。仅证明静态指令、镜像和隔离安装分发合同；不证明 GPT-6 Astra 实测路由准确率、token 节省或真实模型兼容性。

### 0.3.44（2026-09-10）
- 修复 Cursor 已索引 `ae-reverse-engineering`、但 `SKILL.md` 英文 frontmatter 导致中文“授权逆向”难以发现的问题；新增中英文能力词及 `/ae-reverse-engineering`、`$ae-reverse-engineering` 显式调用词。
- 原有授权确认、静态优先和防御性安全边界保持不变；新增回归断言锁定 Cursor 实际读取的 frontmatter 与 source/mirror 一致性。
- 验证覆盖聚焦测试、全量测试、合同检查、安装烟测、发布说明、diff 格式与当前用户全局安装；静态证据不替代 Cursor 重新加载后的 UI 人工确认。

### 0.3.43（2026-09-10）
- 新增模型中立适配合同，核心工作流按任务风险、验收标准、当前工具 schema 与实测能力调整深度，不按模型标签或固定 `reasoning_effort` 推断运行时能力。
- `ae-init` 生成规则新增失败可见、根因与结构性修复、渐进式指令加载、仓库脚本验证排序、diff 复核和证据分层；`minimal` 与 `ae-core/full` 保持不同深度。
- 技能契约检查扩展到相对 Markdown 链接；验证覆盖聚焦测试、全量测试、合同检查、安装烟测、发布说明和 diff 格式。证明边界不包含所有 GPT-5.6/GPT-6 供应商或 Codex host 的运行时等同行为。

### 0.3.42（2026-09-08）
- Java/Spring Controller 测试新增结构边界：测试源码不得继承带 Spring MVC 映射或 OpenAPI 接口注解的生产 Controller，避免静态扫描器将继承映射发布为重复接口。受保护认证或请求上下文 seam 使用既有 MVC slice、直接实例化加 mocks 或 Mockito spy/proxy；`@Hidden` 与 Javadoc ignore 不作为保障。
- `ae-tdd` 新增 JVM Web Controller 测试段；回归测试同时锁定规则文本与 source/mirror 一致性。
- 验证命令：`node --test --test-name-pattern "backend language guidance and fullstack contract alignment|mattpocock-adapted guidance" tests/skills-docs.test.mjs`、`npm test`、`npm run check`、`npm run check:smoke`、`node scripts/check-release-notes.mjs` 与 `git diff --check`。证明边界仅为本地 skill、镜像与安装分发合同，不包含目标项目运行时或第三方 IDE 插件行为。

### 0.3.41（2026-09-03）
- 新增 `ae-frontend-design` 归属的组件与数据访问契约，并让 `ae-web-app`、`ae-web-forge`、`ae-design`、`ae-review` 与 `ae-lfg` 在弹窗、抽屉、列表、表格、表单、样式、API 请求、query 或 mutation 变更时共享复用与所有权边界。
- 统一 token/primitives、共享语义组件、feature 组件、route 编排的层级；新增弹窗/抽屉、列表/表格、表单状态契约，以及“第三次同类实现前抽取审查”规则。已有本地 owner 时，渲染组件不得重复实现原始 HTTP、认证、响应包、字段转换、分页、取消、重试或错误归一化。
- 验证命令：`node --test --test-name-pattern "frontend component and data-access governance" tests/skills-docs.test.mjs`、`npm test`、`npm run check`、`npm run check:smoke`、`node scripts/check-release-notes.mjs` 与 `git diff --check`；证明边界仅为本地 skill/镜像/安装分发合同，不包含目标项目运行时。

### 0.3.40（2026-09-03）
- 新增 `ae-backend` 持久化契约，并让需求、设计、后端、SQL、审查和全流程技能对新表统一确认主键策略、表生命周期、审计、删除、并发、枚举、异常与迁移边界；未确认时必须询问自增 BIGINT 或 UUID，不能默认。
- Java/MyBatis-Plus 指引将 `@Version`、`@TableLogic`、`FieldFill` 审计字段示例限制为已确认框架和适用表类型，并补充软删除、乐观锁、枚举和统一异常映射约束。
- 验证命令：`node --test --test-name-pattern "backend language guidance and fullstack contract alignment" tests/skills-docs.test.mjs`、`npm test`、`npm run check`、`npm run check:smoke`、`node scripts/check-release-notes.mjs` 与 `git diff --check`；证明边界仅为本地 skill/镜像/安装分发合同，不包含目标项目运行时。

### 0.3.39（2026-09-01）
- `ae-init` 新增 `minimal`、默认 `ae-core` 与兼容旧完整目录集的 `full` profile；生成的 `AGENTS.md` 纳入实际 package scripts，并提供 `--nested preview` 与 `--explain-instructions` 只读诊断。
- 新生成文件改用单一受管起止区块；`--force` 只替换区块并保留外部用户内容，legacy marker-only 文件报告冲突而不覆盖。登记 MIT 许可的 `agentsmd/agents.md` 开放格式来源，并将 Codex override 行为限定为 OpenAI 客户端语义。
- 验证：init 聚焦测试 4/4 通过，`npm run check`、`npm run check:smoke`、`node scripts/check-release-notes.mjs` 与 `git diff --check` 通过；`npm test` 共 167 项，165 项通过，2 项因当前 Windows 主机禁止创建测试 symlink 而在产品断言前 `EPERM`。这些检查不证明所有 AGENTS.md 客户端采用相同优先级，也不证明建议的嵌套候选需要创建。

### 0.3.38（2026-08-31）
- 审计 `greensock/gsap-skills` 并吸收可移植动效方法：transform/opacity 优先、协调式时间线、生命周期清理、布局刷新节流与最低设备验证；将 GSAP 纳入外部 freshness watch，但不引入运行时或复制示例。
- 验证：`npm run check`、`npm run check:smoke`、`node scripts/check-release-notes.mjs`、`git diff --check`。

### 0.3.37（2026-08-30）
- 修复全局更新器失败时的退出码传播与临时 clone 清理，新增本地 Git fixture 回归测试，并统一 ae-update 的全局安装说明。
- 验证：`npm run check`、`npm run check:smoke`、`node --test tests/ae-tools.test.mjs --test-name-pattern="global updater"`；全量测试的两个 Windows 符号链接 fixture 仍受 `EPERM` 环境限制。

### 0.3.36（2026-08-30）
- 修复全局命令契约：help 中的更新、语言和检查命令改为用户级 dispatcher；`ae-update` 从 cloned release 执行全局安装器 preview/apply 事务。
- 明确 `--project-root` 与仓库内相对 `--root` 的边界，graph 保留无项目只读扫描；设计检查新增不削弱默认严格门禁的 `--compat` 报告模式。
- 验证：聚焦测试、`npm run check`、`npm run check:smoke`、发布说明和安装后 Codex/Cursor 指纹检查。

### 0.3.35（2026-08-30）
- 外部 skill watch 升级为路径证据语义：Gitee AE 登记为 `primary-upstream`，Taste、Impeccable 与 mattpocock 登记为补充研究源；仅在重复 `--changed-path` 与 `upstreamPaths` 匹配时填充 `affectedSkills`，HEAD 变化本身只产生 `stale-impact-unverified` 候选；显式 remote commit 必须是唯一的 40 位十六进制值，drive-relative/URI-like 路径会被拒绝。
- 前端链新增共享 UI Direction Contract、`audit` / `refine` / `adjust` / `harden` 精修路由、设计模板集成、证据化视觉 review 与截图有效性/反例重开门禁；四类场景回放明确保留 operational UI、既有基线与移动端约束，不复制外部 prompt、detector 或 runtime。
- 验证：两组聚焦测试、`npm run check`、`npm run check:smoke`、`node scripts/check-release-notes.mjs` 与 `git diff --check` 通过；`npm test` 共 160 项，158 项通过，2 项因当前 Windows 主机禁止创建测试 symlink 而在产品断言前返回 `EPERM`。已通过的检查证明路径匹配输出、条件式 UI Direction Contract、skill/source mirror、契约与安装分发一致性；不证明 symlink 逃逸用例、真实项目中的用户审美提升、像素级一致性或未执行的浏览器验收。

### 0.3.34（2026-08-22）
- 将 `mattpocock/skills` 纳入可复检跟踪：`skill-audit --watch` 比较钉提交与远程观察，只报告 `current` / `stale` / `unavailable` 和受影响 AE skill，不自动改写 skill 或记忆。
- 验证：`npm test`、`npm run check`、`npm run check:smoke`、`node scripts/check-release-notes.mjs`、`git diff --check`。这些检查证明跟踪清单、复检命令和已改 skill 的源/镜像锁定；不证明上游后续提交的内容，也不证明真实项目中的 skill 效果。

### 0.3.33（2026-08-22）
- 报告生成现在支持 Git 友好的 Markdown 输出，同时保留现有离线自包含 HTML 视图；技能审计计数改为统计每条 finding，包括 defer 记录中的 finding。
- 验证：`npm test`、`npm run check`、`npm run check:smoke`、`node scripts/check-release-notes.mjs`、`git diff --check`。

### 0.3.32（2026-08-22）
- 新增 Codex 原生的并行 worker 请求契约、自包含离线 HTML 报告、本地 Markdown Issue Tracker 和 40 项技能组合静态审计；外部 Claude/OpenCode runtime、后台代理、自动提交和外部 tracker 仍不属于 AE 运行时能力。
- 强化 `ae-debug`、`ae-tdd`、`ae-tasks`、`ae-review` 与 `ae-refactor` 的可证伪诊断、独立 oracle、tracer-bullet、Standards/Spec 双轴审查和 deep-module 判断；Issue 拒绝非法状态转换、环依赖及解析后越界路径，报告默认无 CDN 并转义输入。
- 验证：`npm test`、`npm run check`、`npm run check:smoke`、`node scripts/check-release-notes.mjs` 与 `git diff --check`。这些检查证明本地脚本、技能镜像和安装分发契约；不证明 Codex 父代理一定采用 worker 建议、外部 tracker 同步、浏览器视觉验收或真实项目中的技能效果。

### 0.3.31（2026-08-17）
- Project installation now requires an explicit target and uses recorded component ownership, staging backups, recovery, and explicit `--replace-modified` authorization before replacing changed or unknown managed content. Local static previews are loopback-only and reject canonical link escapes; evidence writes are serialized; quoted CSV/TSV input and review-contract selector validation are hardened.
- Verification: `npm.cmd test`, `npm.cmd run check`, `npm.cmd run check:smoke`, `node scripts/check-release-notes.mjs`, and `git diff --check`. These checks prove local installer, helper, mirror, and distribution contracts only; they do not prove target-project deployment, external network serving, or browser acceptance.

### 0.3.30（2026-08-13）
- 全局安装改为把 personal 插件的 `ae-*` 技能真实拷贝到当前用户 `~/.cursor/skills/<name>`（普通目录，不是符号链接或 junction）。Cursor 不跟踪技能目录上的 symlink，0.3.29 联接因此不会出现在 `/ae`。无 `--retire-modified` 时会把仍指向 personal 插件的遗留联接替换为匹配拷贝；用户私改的 `ae-*` 仍需授权。不恢复 `~/.agents/skills`，也不写入 `~/.cursor/skills-cursor`。
- 验证：`npm test`、`npm run check`、`npm run check:smoke`、`node scripts/check-release-notes.mjs`。这些检查证明安装器在隔离 home 中创建真实拷贝、升级遗留联接、保留无关 Cursor 技能、回滚失败批次，以及预览/文档契约一致；不代表当前 Cursor 会话的 `/ae` 列表已刷新，新开 Cursor 对话后才能观察 slash 发现。

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
