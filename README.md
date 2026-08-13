# AI Agent Engine for Codex

AI Agent Engine for Codex 是一个面向 Codex 的项目级工程工作流插件。它把 AE 风格的需求澄清、设计契约、计划、执行、审查、验证、前端/Web 路由、Swagger/OpenAPI 摘要、交接和经验沉淀能力放到当前项目里，通过 Codex skills 和本地脚本运行。

> 参考项目：https://gitee.com/jiangqiang1996/ai-agent-engine<br>
> 本项目参考了上面这个 Gitee AI Agent Engine 项目的工作流设计和能力模型。<br>
> 也参考了 https://github.com/openai/plugins 和 https://github.com/obra/superpowers 中部分开发技能设计。<br>
> 也参考了 https://github.com/affaan-m/everything-claude-code 中关于外部 skill 仓库治理、持续学习、验证循环和 Codex 适配边界的设计。<br>
> 也参考了 https://github.com/github/spec-kit 中关于 constitution、需求质量清单、任务拆解和跨产物分析的工作流设计，但不引入其 runtime。<br>
> 这不是 OpenCode runtime 的直接移植，而是 Codex 原生 skill、项目级插件文件和本地脚本的实现方式。

English: [README.en.md](README.en.md)

## 适用场景

当你希望一个 Codex 项目自带可复用工程流程时，可以使用本插件：

- 在实现前澄清模糊需求；
- 把需求拆成可执行计划；
- 在 Git/worktree 安全检查后执行实现；
- 以 findings 优先的方式审查代码或文档；
- 把验证证据、交接说明和可复用经验保存在项目文档中；
- 初始化项目说明、归档规则和长期 AI 记忆库。

## 快速开始

把插件安装到目标 Codex 项目：

```bash
node scripts/install-project.mjs --target /path/to/your/codex-project
```

Windows PowerShell：

```powershell
node scripts\install-project.mjs --target D:\codes\your-project
```

重启或重新打开目标项目的 Codex 对话，然后在目标项目根目录初始化 AE 文档、过程归档、UTF-8 规则和 AI 记忆库骨架：

```bash
node scripts/ae-tools.mjs init
```

常用初始化变体：

```bash
node scripts/ae-tools.mjs init --lang zh-CN
node scripts/ae-tools.mjs init --lang bilingual
node scripts/ae-tools.mjs init --dry-run
```

验证辅助命令：

```bash
node scripts/ae-tools.mjs help
```

## 版本更新记录

完整历史见 [CHANGELOG.md](CHANGELOG.md)；本节仅保留最近 5 个版本，发布时超出窗口的条目迁移到 CHANGELOG。

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

## 能力清单

- `ae-help`：查看当前 AE 能力和边界。
- `ae-init`：初始化项目文档、归档规则、UTF-8 规则和长期 AI 记忆库。
- `ae-ideate`：生成方案方向、取舍、风险和下一步问题。
- `ae-brainstorm`：通过多视角碰撞澄清需求并沉淀验收标准。
- `ae-design`：在 PRD 和计划之间沉淀架构、接口、数据、UI/UX、测试与非功能设计契约。
- `ae-lfg`：从需求到已验证交付的完整流程。
- `ae-plan`：创建实现计划，不修改业务代码。
- `ae-constitution`：创建或更新可被计划和审查检查的项目治理原则。
- `ae-tasks`：把已批准计划拆成带依赖顺序、文件路径和验证项的任务产物。
- `ae-work`：在 Git/worktree 安全检查后执行计划。
- `ae-refactor`：规划行为保持型重构。
- `ae-review`：按严重度优先审查代码或文档。
- `ae-doc-humanize`：把结构化或生硬内容改写成更易读的文档。
- `ae-doc-structure`：把散乱内容整理成需求、计划、交接或检查清单。
- `ae-frontend-design`：前端设计与界面实现。
- `ae-web-forge`：统一前端/Web 路由入口，选择现有 AE skill 并以浏览器验收收尾。
- `ae-web-app`：实现由 `ae-web-forge` 路由后的 Web 应用、交互、API 和轻量全栈流程。
- `ae-backend`：基于仓库契约实现接口、服务、数据和权限逻辑。
- `ae-debug`：系统化排查构建失败、运行时异常、UI 问题和接口故障。
- `ae-reverse-engineering`：对已授权工件执行防御性逆向分析，先确认范围、工件来源和可复现证据边界。
- `ae-tdd`：围绕明确行为执行红绿重构式测试驱动开发。
- `ae-test-browser`：用真实浏览器验收 UI 流程。
- `ae-test-api`：在后端改动后执行接口冒泡测试，验证契约、风险路径和分级证据，并记录脱敏 API Verification Record；认证冒烟缺 token 时生成非空 UTF-8 可填写请求配置模板（`REPLACE_WITH_LOCAL_TOKEN`），由用户本地替换后按路径引用。
- `ae-imagegen-prompt`：把视觉想法优化成图片生成提示词，支持参考图角色、生成预算和视频分镜素材；提示词-only 不强制 hooks。
- `ae-sql`：生成、审查或执行 SQL，并保留安全边界。
- `ae-swagger-parser`：摘要或过滤 Swagger/OpenAPI 规格。
- `ae-handoff`：沉淀任务状态、证据、阻塞点和下一步。
- `ae-prompt-optimize`：把模糊请求改写成可执行 Codex 提示词。
- `ae-save-experience`：沉淀可复用项目经验。
- `ae-skill-creator`：创建或更新 Codex skill。
- `ae-skill-audit`：审计外部 agent/skill 仓库并提炼可适配的 AE 改进。
- `ae-agent-creator`：创建 Codex 可用的代理提示和委派模板。
- `ae-update`：更新项目本地 AE for Codex 安装。
- `ae-language`：高级入口，切换项目本地 AE skill 显示语言。

本地辅助命令入口：

```bash
node scripts/ae-tools.mjs help
```

设计契约校验：

```bash
node scripts/check-design-contract.mjs
```

记忆与声明式关系校验：

```bash
node scripts/check-memory-knowledge-contract.mjs
node scripts/ae-tools.mjs ae-memory-query --topic graph
node scripts/ae-tools.mjs ae-knowledge-map --limit 20
node scripts/ae-tools.mjs ae-knowledge-query --path docs/08-ai-memory/08-phase-two-tooling.md --direction outgoing
```

记忆查询只读取 `docs/08-ai-memory/00-registry.json` 中已登记的 Markdown 和关系；没有命中时只返回 `no declared match`，不会扫描未登记文档。`ae-knowledge-map` 与 `ae-knowledge-query` 仅返回 `declared` 文档关系及其证据。它们不会创建缓存、数据库、图谱文件或 CodeGraph 状态。

所有需要取值的选项必须显式提供非空值，例如 `--limit 20` 和 `--direction outgoing`；缺少值会返回结构化诊断并以非零状态退出。`--root` 仅接受当前工作区内的普通目录，命令会逐段拒绝符号链接或 junction，并验证解析后的路径不离开工作区。

浅层依赖图辅助命令：

```bash
node scripts/ae-tools.mjs ae-graph-build --root scripts
node scripts/ae-tools.mjs ae-graph-query --root scripts --path ae-tools.mjs
```

`ae-graph-build` 和 `ae-graph-query` 是只读浅层依赖图脚本，用于快速预览源码文件、静态导入边和外部依赖。输出的 `limits` 会标明文件和边的请求值、有效值、返回数量和截断状态；默认保持 500 文件、无边数上限，只有 `--edge-limit` 才截断边。它们不会写入 `docs/ae/graphs/graph.json` 或 `.ae/graph.db`，也不提供完整图谱 schema、分片、freshness 或预览页。

## 项目级安装

推荐使用项目级安装。它只写入目标项目目录，不修改全局 Codex 配置。

仓库发布后，可以在目标项目的 Codex 对话里让代理辅助安装：

```text
Fetch and follow the project-level install instructions from https://raw.githubusercontent.com/YaoGUanquan/codex-ai-agent-engine/main/INSTALL.md
```

在本仓库中直接安装：

```bash
node scripts/install-project.mjs --target /path/to/your/codex-project
```

默认安装双语技能列表元数据。也可以显式切换为中文或英文：

```bash
node scripts/install-project.mjs --target /path/to/your/codex-project --lang zh-CN
node scripts/install-project.mjs --target /path/to/your/codex-project --lang en
```

默认元数据语言为 `bilingual`。支持的元数据语言：`en`、`zh-CN`、`bilingual`。

安装脚本只会写入目标项目内的这些路径：

- `plugins/ai-agent-engine-codex/`
- `.agents/plugins/marketplace.json`
- `.agents/skills/ae-*`
- `scripts/ae-tools.mjs`
- `scripts/update-ae-codex.mjs`
- `scripts/set-ae-language.mjs`

分发源仓库本身不支持作为安装目标；它使用用户级 personal 插件，并将维护镜像放在 `.ae-source/skills`，以避免重复发现。

## 从项目级安装迁移到用户级全局安装

全局安装只集中 AE 运行时和 skills，不迁移项目数据。每个项目的 `AGENTS.md`、`docs/**`、AI 记忆、图谱和 archive 均保留在项目根目录。

在分发仓库中先生成只读预览。该命令不会写入、删除或移动任何文件：

```powershell
Set-Location 'D:\codes\ph-AI-Agent-Engine'
$preview = node scripts\install-global.mjs preview | ConvertFrom-Json
$preview.projects | Format-Table root, role, components
```

只安装或更新当前用户的全局插件时，直接使用上述默认 preview 的 operation ID 与 confirmation：

```powershell
node scripts\install-global.mjs apply --apply --operation $preview.operationId --confirm $preview.confirmation
```

默认 preview 只安装当前用户的全局插件，不会扫描或删除项目级副本。若要把项目级安装切换为全局安装，先创建显式 manifest；manifest 可以指向任意当前用户有权访问的项目根，不依赖本机 `D:\codes` 或固定项目名。确认 preview 中目标项目的每个组件都标记为 `owned: true` 后，才执行同一份 manifest 的 apply：

```json
{
  "projects": [
    { "root": "D:\\codes\\work", "role": "consumer" }
  ]
}
```

```powershell
$manifest = 'C:\temp\ae-consumers.json'
$preview = node scripts\install-global.mjs preview --manifest $manifest --retire-modified | ConvertFrom-Json
$preview.projects | Format-Table root, role, components
node scripts\install-global.mjs apply --manifest $manifest --retire-modified --apply --operation $preview.operationId --confirm $preview.confirmation
```

默认情况下，任何 `owned: false`、`deferred` 或未知组件都会阻止 apply；不要手工删除项目级文件。`--retire-modified` 必须同时出现在 preview 和 apply 中，它表示“先完整备份，再退役已修改或无法指纹确认的历史 AE 副本”。迁移只处理 manifest 中的 consumer；分发源仓库和 deferred 项目必须排除。`docs/**`、`AGENTS.md`、AI memory、图谱和 archive 始终留在各自项目根目录。备份与 journal 默认保留，只有显式 `purge --operation <id> --apply` 才删除。

成功后，从任意项目根运行用户级 dispatcher，并在新的 Codex 会话和新的 Cursor 对话中检查技能：

```powershell
node "$HOME\.agents\ai-agent-engine-codex\bin\ae.mjs" help
node "$HOME\.agents\ai-agent-engine-codex\bin\ae.mjs" init --project-root (Get-Location).Path
codex plugin list
```

每个操作系统用户都有自己的 `$HOME`、dispatcher、备份和 personal marketplace；安装器不会扫描或修改其他用户的目录，也不会直接修改 `.codex/plugins/cache`。Codex 通过 personal 插件发现 AE 技能；Cursor 通过 `~/.cursor/skills/ae-*` 联接到同一插件 skill 目录。分发源仓库将维护镜像保存在 `.ae-source/skills`，避免与个人插件重复发现；consumer 项目迁移后只应使用用户级分发。已打开的对话不会自动刷新技能目录。

## 初始化项目文档和记忆库

安装完成后，在目标项目根目录执行：

```bash
node scripts/ae-tools.mjs init
```

这个命令会创建：

- `AGENTS.md`：面向 Codex 的项目说明；
- `docs/ae`：计划、审查、交接、经验等 AE 工作流产物；
- `docs/00-process`：执行中的过程笔记、归档规则和过程模板；
- `docs/08-ai-memory`：标准长期项目 AI 记忆库。

需求正典目录为 `docs/ae/prds`。自 0.3.22 起，init 不再创建 `docs/ai-memory` 兼容目录；存量项目中已有的该目录保持原样。

默认不会覆盖已有文件。只有在使用 `--force` 且文件包含 AE init marker 时，才会覆盖受管文件。

生成的文本文件统一按 UTF-8 写入。Windows 上 PowerShell 可能把合法 UTF-8 中文显示成乱码；改写文件前，先用显式 UTF-8 读取或 Git diff 验证。

## 外部参考

当前仓库保留了清晰的 Codex 边界：

- `https://gitee.com/jiangqiang1996/ai-agent-engine` 主要提供 AE 风格工作流能力模型；
- `https://github.com/obra/superpowers` 主要提供计划、调试、TDD、验证和交付门禁方面的方法论参考；
- `https://github.com/openai/plugins` 主要提供前后端开发、Web 应用、平台技能打包方式和部分领域技能设计参考。
- `https://github.com/github/spec-kit` 主要提供 constitution、需求质量清单、任务拆解和跨产物分析方面的方法论参考。

这些外部项目都作为参考输入。本仓库不会直接复用它们的 runtime，而是把适合 Codex 的部分重写为本地 `ae-*` skills 和辅助脚本。

## 日常使用

Codex 不提供 OpenCode `config.command` 风格的动态 slash command 注册。当前项目通过 Codex skills 暴露 AE 入口：可以显式写 `$ae-plan`、`$ae-review` 这类 skill 名称，也可以用自然语言触发；在支持的 Codex App 版本中，已启用的 skills 也可能出现在 `/` 命令或 skill 搜索列表中。不要把这种 skill-backed discoverability 理解为本仓库实现了 OpenCode 式命令注入。

```text
使用 ae-help 查看当前 AE 能力。
使用 ae-init 初始化 AGENTS.md、docs/ae、docs/00-process 和 docs/08-ai-memory。
使用 ae-plan 为“带权限校验的文件上传功能”创建实现计划。
使用 ae-work 执行 docs/ae/plans/2026-05-11-001-file-upload-plan.md。
使用 ae-review mode:report-only 审查当前变更。
```

多视角碰撞示例：

```text
使用 ae-brainstorm，对下面这段观点运行 Perspective Collision Pass，不要急着给结论。

请输出：
1. 批评者、务实者、创新者、系统视角的 perspective matrix
2. 事实分歧、价值分歧、假设分歧
3. 最有价值的 collision insights
4. blind spots
5. thinking preservation zone
6. 1-2 个 deepening directions

观点：
AI 编程让缺陷静默问题倒逼“验证工程”成为新学科；短期链路压缩和长期总量爆发之间存在投资取舍；“停止思考”和“消灭编程快感”是同一现象的不同价值判断，需要主动设计思考保留区。
```

解析 OpenAPI：

```bash
node scripts/ae-tools.mjs swagger openapi.json method:POST keyword:login mode:detail
```

查看浅层依赖图：

```bash
node scripts/ae-tools.mjs ae-graph-build --root scripts
node scripts/ae-tools.mjs ae-graph-query --root scripts --path ae-tools.mjs
```

初始化当前项目的文档和记忆骨架：

```bash
node scripts/ae-tools.mjs init --lang zh-CN
```

恢复可能需要继续的过程产物：

```bash
node scripts/ae-tools.mjs recovery
```

## 技能列表语言

Codex 技能列表里显示的说明来自静态元数据。默认安装为双语元数据。它不能在已经打开的 Codex 对话中实时切换，但可以重写项目本地元数据，然后重启或重新打开项目对话。

也可以像项目级安装一样，在目标项目的 Codex 对话里让代理辅助切换。

切换为中文：

```text
Fetch and follow the AE skill language switch instructions from https://raw.githubusercontent.com/YaoGUanquan/codex-ai-agent-engine/main/INSTALL.zh-CN.md and switch this project to zh-CN.
```

切换为英文：

```text
Fetch and follow the AE skill language switch instructions from https://raw.githubusercontent.com/YaoGUanquan/codex-ai-agent-engine/main/INSTALL.zh-CN.md and switch this project to en.
```

如需双语，把最后的 `zh-CN` 或 `en` 改成 `bilingual`。

在已安装的目标项目中运行：

```bash
node scripts/set-ae-language.mjs --lang en
node scripts/set-ae-language.mjs --lang zh-CN
node scripts/set-ae-language.mjs --lang bilingual
```

在本仓库中给指定项目切换：

```bash
node scripts/set-language.mjs --target /path/to/your/codex-project --lang zh-CN
```

## 更新

在已经安装过的目标项目中运行：

```bash
node scripts/update-ae-codex.mjs --repo https://github.com/YaoGUanquan/codex-ai-agent-engine.git --branch main
```

更新脚本会尽量保留当前项目已经设置的语言；如果无法识别，默认使用双语元数据。也可以显式覆盖：

```bash
node scripts/update-ae-codex.mjs --repo https://github.com/YaoGUanquan/codex-ai-agent-engine.git --branch main --lang bilingual
```

文件更新完成后，更新脚本会自动执行一次保守维护（`tidy --apply`：归档 done 过程记录、删除空任务目录、迁移超期 gate/evidence 证据、报告超预算记忆文件，不归档仅"陈旧"的记录）。追加 `--no-tidy` 可跳过；结果在更新输出的 `maintenance` 字段中。

也可以让 Codex 代理执行：

```text
Fetch and follow the update instructions from https://raw.githubusercontent.com/YaoGUanquan/codex-ai-agent-engine/main/INSTALL.md
```

## 多 agent auto 配置

`multi_agent.enabled` 支持三种值：

- `auto`：默认值。`task-analyze` 会自动分析是否适合并行、输出 `execution_strategy`、`parallel_eligibility` 和 `parallel_waves`，但不会直接授权写入型子代理。
- `true`：显式开启多 agent 分析，行为与 `auto` 一样仍需满足安全门禁。
- `false`：硬关闭，强制串行。

推荐先使用安全默认配置：

```yaml
multi_agent:
  enabled: auto
  mode: suggest
  max_workers: 3
  min_parallel_units: 2
  require_clean_git: true
  require_plan_dependencies: true
  require_disjoint_files: true
  allow_write_agents: false
  review_lanes_parallel: true
```

更新脚本会复制最新模板到 `docs/ae/templates/ae-skill-profiles.example.yaml`，但不会自动覆盖项目本地运行配置。要在目标项目启用或调整本地配置：

```bash
mkdir -p .codex
cp docs/ae/templates/ae-skill-profiles.example.yaml .codex/ae-skill-profiles.yaml
```

Windows PowerShell：

```powershell
New-Item -ItemType Directory -Force -Path .codex | Out-Null
Copy-Item docs\ae\templates\ae-skill-profiles.example.yaml .codex\ae-skill-profiles.yaml
```

如需允许写入型子代理自动并行，必须额外显式设置 `mode: auto` 和 `allow_write_agents: true`。即便如此，`task-analyze` 仍会要求计划依赖清晰、文件不冲突、并满足 Git 清洁状态等前置条件。合并到主分支后，其他项目应先运行更新命令，再复制或编辑 `.codex/ae-skill-profiles.yaml`，最后用实际计划验证：

```bash
node scripts/ae-tools.mjs task-analyze --mode plan --plan docs/ae/plans/<your-plan>.md
```

## 手动安装

如果不想运行安装脚本，再使用手动安装。

1. 将 `plugins/ai-agent-engine-codex/` 复制到目标项目的 `plugins/` 目录下。
2. 将根入口脚本复制到目标项目：

```bash
mkdir -p scripts
cp scripts/ae-tools.mjs /path/to/project/scripts/ae-tools.mjs
```

Windows PowerShell：

```powershell
New-Item -ItemType Directory -Force -Path D:\codes\your-project\scripts | Out-Null
Copy-Item scripts\ae-tools.mjs D:\codes\your-project\scripts\ae-tools.mjs
```

3. 如果需要手动安装后继续切换技能列表语言，将 `scripts/set-language.mjs` 复制为目标项目的 `scripts/set-ae-language.mjs`。
4. 将 `plugins/ai-agent-engine-codex/skills/*` 复制到目标项目的 `.agents/skills/`。
5. 在目标项目 `.agents/plugins/marketplace.json` 中加入项目级插件记录：

```json
{
  "name": "ai-agent-engine-codex",
  "source": {
    "source": "local",
    "path": "./plugins/ai-agent-engine-codex"
  },
  "policy": {
    "installation": "INSTALLED_BY_DEFAULT",
    "authentication": "ON_INSTALL"
  },
  "category": "Coding"
}
```

## 仓库结构

```text
.agents/                         # 当前仓库自用的项目级安装示例
plugins/ai-agent-engine-codex/   # Codex 插件主体
scripts/ae-tools.mjs             # 根辅助命令入口
scripts/install-project.mjs      # 项目级安装脚本
scripts/update-ae-codex.mjs      # 目标项目更新脚本
CHANGELOG.md                     # 完整版本更新历史（中文；英文见 CHANGELOG.en.md）
docs/codex-port-analysis.md      # OpenCode 到 Codex 的迁移分析
docs/ae/                         # init 后的 AE 工作流产物
docs/00-process/                 # init 后的过程笔记、模板和归档规则
docs/08-ai-memory/               # init 后的标准长期 AI 记忆库
```

自 0.3.22 起 init 不再创建 `docs/ai-memory/`；历史项目可能仍保留该兼容入口。

## 重要边界

- `/ae-*` 是兼容标签，不是本仓库注册出的 Codex 命令。
- 可靠触发方式是直接说：`使用 ae-work ...`、`使用 ae-review ...`、`使用 ae-plan ...`，或在支持的 Codex App 版本中通过 `/` / skill 搜索选择已启用的 AE skill。
- slash 列表可见性属于 Codex skill discoverability，需要在当前 Codex App 中手工验证；本仓库不声明 OpenCode `config.command` 等价能力。
- 当前 MVP 还没有真实 MCP server，`.mcp.json` 有意保持为空。
- 本地 JSON/YAML OpenAPI 可在常见结构下无额外依赖解析；复杂 YAML 仍受轻量 parser 边界限制。
- `ae-graph-build` 和 `ae-graph-query` 是浅层只读脚本，不会持久化 `docs/ae/graphs/graph.json`，也不是完整 OpenCode 图谱工具。
- `ae-merge-branch` 暂缓，等待 `ae-work` 的 Git 证据链、回滚说明和授权边界增强。
- `ae-chrome-devtools` 不照搬动态 MCP 注册；浏览器验证通过 `ae-test-browser` 路由到 Codex Browser、Playwright 或当前会话已可用的 DevTools 工具。
- Git 写操作、破坏性文件操作、网络请求、依赖安装、数据库写入、浏览器环境 setup 都必须遵循 Codex 显式授权机制。

## 开发检查

在本仓库运行：

```bash
npm run check
node --check scripts/ae-tools.mjs
node --check plugins/ai-agent-engine-codex/scripts/ae-tools.mjs
node scripts/check-release-notes.mjs
node scripts/check-design-contract.mjs
node scripts/ae-tools.mjs help
node scripts/ae-tools.mjs ae-graph-build --root scripts
```

如果本机有 Codex skill validator，也建议验证 `plugins/ai-agent-engine-codex/skills/*` 和 `.ae-source/skills/*`。

发布前可参考 [docs/release-checklist.md](docs/release-checklist.md)。

## 后续持续优化方向

2026-08-11 的一轮全库扫描已经消除了根/插件 `update-project.mjs` 双份拷贝、把 `.tmp-install-smoke-checks/` 纳入 `.gitignore`、将 `scripts/check-claims.mjs --dry-run` 接入 `npm run check`，并把过期的三份 OPTIMIZATION 规划文档归档到 `docs/99-archive/2026-08/skill-optimization-roadmap/`。剩余的结构性债务按优先级持续推进：

1. ~~**拆分 `ae-tools.mjs` 单体**~~（**已完成 0.3.20**，`315db38`）：15 个命令模块 + 外置 init 模板；见 `docs/ae/experience/2026-08-11-structural-debt-refactor.md`。
2. ~~**重组 `package.json` 的 `check` 命令串**~~（**已完成 0.3.20**）：`check:syntax` / `check:contracts` / `check:smoke` / `check:all`；测试断言改为分层存在性检查。
3. ~~**按域拆分巨型测试文件**~~（**已完成 0.3.20**）：`tests/global-install.test.mjs`、`contracts.test.mjs`、`ae-tools.test.mjs`、`skills-docs.test.mjs`、`install-scripts.test.mjs`。
4. ~~**抽取共享 path 校验工具**~~（**已完成 0.3.20**）：`artifact-check-utils.mjs`；install-smoke 跨盘符拒绝已加强。
5. ~~**补齐弱覆盖脚本的测试**~~（**已完成 0.3.20**）：`tests/install-scripts.test.mjs`（6 例，覆盖 set-repository / install-project / update-project）。
6. ~~**控制默认 check 的耗时**~~（**已完成 0.3.20**）：install-smoke 移入 `check:smoke`，日常 `npm run check` 为轻量层。

2026-08-11 **前后端技能对称优化（0.3.21）** 已落地：后端六语言指导、FE/BE 契约检查表、debug 边界速查、`ae-sql` 安全清单；见 `docs/ae/experience/2026-08-11-fullstack-skill-optimization.md`。2026-08-11 **前端技能优化（0.3.18 / 0.3.19）** 见 `docs/ae/experience/2026-08-11-frontend-skill-optimization.md`。剩余第 7、10 两项原为按需触发的挂起项；2026-08-11 复核触发未命中后，用户决定提前收尾，两项已随 **0.3.26** 完成：

7. ~~**旧版本前端栈适配**~~（**已完成 0.3.26**）：`svelte-guidance.md`、`angular-guidance.md`、`vue-guidance.md` 各补最小旧栈对照节（Svelte 4 stores、NgModule 时代、Options API），与现代基线同文件并存，"匹配仓库既有风格"兜底与首行 stack-conditional 语句不变；回归用例锁定对照节与镜像。原按需触发策略由用户于 2026-08-11 决定提前执行（触发条件未命中），见 `docs/08-ai-memory/05-decision-log.md`。残余风险：对照条目为无真实缺陷驱动的预写，粒度是否够用待首个真实旧栈项目检验；不足时按决策日志仅为受影响框架扩展。
8. ~~**版本记录拆分**~~（**已完成，2026-08-11 本批**）：历史条目迁移至 `CHANGELOG.md` / `CHANGELOG.en.md`（完整历史），README 仅保留最近 5 条，`scripts/check-release-notes.mjs` 锁定窗口上限、CHANGELOG 链接与子集关系；见 `docs/ae/plans/2026-08-11-006-governance-batch-four-plan.md`。
9. ~~**过程文档归档纪律**~~（**已完成，2026-08-11 本批**）：4 个已完成或指针任务目录并入 `docs/00-process/archive/2026-08/`，active 目录只保留真正进行中的工作；tidy 对 archived-pointer 的保守保留策略未变，本仓收尾为一次性手动归档。
10. ~~**前端质量契约的交叉一致性**~~（**已完成 0.3.26 批，仓库侧**）：轻量映射说明落地 `docs/ae/references/frontend-quality-contract-map.md`，登记 `web-ui-quality.md`、`ae-review` Frontend Components / Styles 镜头、`browser-acceptance.md` 之间 5 组对应关系、两处空档与既有测试锁；映射为描述性文档，不构成第 4 份契约面，仍不建校验脚本。评估与提前收尾记录见 `docs/08-ai-memory/05-decision-log.md`。残余风险：映射依赖人工维护——编辑三份契约文件时须按图核对对应组，这是不建校验脚本决策的已接受成本。
11. ~~**知识库治理（下一批 0.3.22）**~~（**已完成 0.3.22**）：见 `docs/ae/prds/2026-08-11-knowledge-base-governance-prd.md` 与 `docs/ae/experience/`（维护者知识图谱见 `docs/ae/graphs/maintainer-artifact-graph.md`）。

2026-08-11 **全量技能盘点（40 个 skill 逐一审查）** 完成：五层结构（工作流主链 10 / 实现车道 9 / 验证车道 2 / 独立工具 8 / 元治理 11）整体健康，路由边界、证据分层词汇与交接路由复核一致，既有治理项无回退；完整证据、发现与批次对比见 `docs/ae/solutions/2026-08-11-skill-portfolio-optimization-audit.md`。新增事项如下（12 先行、13-14 同批升版本、15 按需触发）：

12. **跨技能引用链接校验扩展**（仓库侧，不升版本，建议先行）：`scripts/check-skill-contract.mjs` 目前只校验指向 `SKILL.md` 的链接；`local-runtime-smoke-gate.md`、`api-contract-checklist.md`、`validation-evidence-profile.md` 等被 8+ 个技能跨目录引用的 references 无链接守护，重命名或移动即静默断链。扩展校验到 SKILL.md 与 references 中全部相对 `.md` 链接（可选覆盖反引号引用路径），并补 README 能力清单 ↔ capability-catalog ↔ 技能目录的名称集合级断言，TDD 覆盖正反例。
13. **运行时入口口径统一**（插件内容，升版本）：12 个技能文件与 capability-catalog 共 46 处命令示例硬编码全局 dispatcher 路径 `$HOME/.agents/ai-agent-engine-codex/bin/ae.mjs`，而 README 推荐的项目级安装只提供 `scripts/ae-tools.mjs` 入口，技能文档仅 2 处提到该回退。新增一条共享「运行时入口解析」说明（项目 wrapper 优先、全局 dispatcher 回退，两者 CLI 契约一致），统一全部命令示例并以 contract 测试锁定形式。
14. **ae-help 工件契约表补全**（插件内容，与 13 同批）：`artifact-contract.md` 路径表缺 `docs/ae/designs`、`docs/ae/tasks`、`docs/ae/evidence`、`docs/ae/integrity`、`docs/ae/experience`、`docs/ae/work-reports`、`docs/ae/constitution.md` 七类实际在用产物的行；补全并写明 `solutions`（外部审计/方案研究）与 `experience`（自身工作复盘）的目录边界，纳入 0.3.25 已建立的目录声明回归断言。
15. **按需触发项**（策略已定，命中前无主动待办）：`ae-review` 七段 lane 细则外移 references（触发：再新增 lane 或出现一次 lane 指引被跳过的实际缺陷）；`ae-refactor` 补重构方法论 reference——行为基线、特征化测试、接缝分析、增量策略（触发：真实重构任务出现一次可归因的方法论缺口，届时属插件内容变更须升版本）；工作流主链技能各 1 张「场景卡」最小回放清单落 `docs/ae/templates/`（触发：0.4.x 大版本前，或出现一次技能指引被跳过导致的交付缺陷）。

推进原则：涉及可分发插件内容（`plugins/ai-agent-engine-codex/`）的改动必须同步递增双份 SemVer 版本，并在 README 与 CHANGELOG 各追加版本条目（README 仅保留最近 5 条，超出窗口的条目迁移到 CHANGELOG）；纯仓库侧（根 `scripts/`、`tests/`、文档）的重构不升版本，但必须以 `npm run check` 加 `npm test` 全绿为交付门槛。

## 发布到 GitHub

先在 GitHub 创建一个空仓库，然后在当前目录执行：

```bash
node scripts/set-repository.mjs --repo https://github.com/YaoGUanquan/codex-ai-agent-engine
git init
git add .
git commit -m "feat: add Codex AI Agent Engine plugin"
git branch -M main
git remote add origin https://github.com/YaoGUanquan/codex-ai-agent-engine.git
git push -u origin main
```

## 许可和致谢

见 [LICENSE](LICENSE) 和 [NOTICE.md](NOTICE.md)。

本项目参考 AI Agent Engine，并在插件元数据和仓库授权中保留 `GPL-2.0-only`。
