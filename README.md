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

成功后，从任意项目根运行用户级 dispatcher，并在新的 Codex 会话中检查个人插件：

```powershell
node "$HOME\.agents\ai-agent-engine-codex\bin\ae.mjs" help
node "$HOME\.agents\ai-agent-engine-codex\bin\ae.mjs" init --project-root (Get-Location).Path
codex plugin list
```

每个操作系统用户都有自己的 `$HOME`、dispatcher、备份和 personal marketplace；安装器不会扫描或修改其他用户的目录，也不会直接修改 `.codex/plugins/cache`。开发源仓库可同时看到本地 `.agents/skills` 与“个人”插件，这是有意保留的开发例外；consumer 项目迁移后只应使用用户级个人插件。

## 初始化项目文档和记忆库

安装完成后，在目标项目根目录执行：

```bash
node scripts/ae-tools.mjs init
```

这个命令会创建：

- `AGENTS.md`：面向 Codex 的项目说明；
- `docs/ae`：计划、审查、交接、经验等 AE 工作流产物；
- `docs/00-process`：执行中的过程笔记、归档规则和过程模板；
- `docs/08-ai-memory`：标准长期项目 AI 记忆库；
- `docs/ai-memory`：兼容旧骨架的说明入口。

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
docs/codex-port-analysis.md      # OpenCode 到 Codex 的迁移分析
docs/ae/                         # init 后的 AE 工作流产物
docs/00-process/                 # init 后的过程笔记、模板和归档规则
docs/08-ai-memory/               # init 后的标准长期 AI 记忆库
docs/ai-memory/                  # init 后的兼容说明入口
```

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

如果本机有 Codex skill validator，也建议验证 `plugins/ai-agent-engine-codex/skills/*` 和 `.agents/skills/*`。

发布前可参考 [docs/release-checklist.md](docs/release-checklist.md)。

## 后续持续优化方向

2026-08-11 的一轮全库扫描已经消除了根/插件 `update-project.mjs` 双份拷贝、把 `.tmp-install-smoke-checks/` 纳入 `.gitignore`、将 `scripts/check-claims.mjs --dry-run` 接入 `npm run check`，并把过期的三份 OPTIMIZATION 规划文档归档到 `docs/99-archive/2026-08/skill-optimization-roadmap/`。剩余的结构性债务按优先级持续推进：

1. **拆分 `ae-tools.mjs` 单体**（约 2700+ 行）：按命令边界抽出 `init-templates`、`graph`、`swagger`、`evidence` 等模块，入口只保留分发逻辑；init 中英文模板改为外部 UTF-8 文件加占位替换。每次拆分必须保持根薄包装路径不变，并用 `npm test` 与安装烟测回归。
2. **重组 `package.json` 的 `check` 命令串**（2000+ 字符）：拆为 `check:syntax` / `check:contracts` / `check:smoke` 分层脚本或用 runner 脚本 glob 扫描，避免新增脚本时漏改；同步放宽 `tests/skill-scripts.test.mjs` 对 check 字符串的整段正则断言，改为断言"某检查步骤存在"。
3. **按域拆分巨型测试文件**：`tests/skill-scripts.test.mjs`（约 3400 行）拆为 global-install、ae-tools、contracts、skills-docs 等独立测试文件，降低维护和定位成本。
4. **抽取共享 path 校验工具**：`check-ae-artifacts.mjs` 与 `check-design-contract.mjs` 中重复的 `readArg` / `isRepositoryRelativePath` / `toPosix` 等 helper 抽到插件内共享模块；同时加强 `check-install-smoke.mjs` 的 `ensureInsideRepo` 对 Windows 跨盘符绝对路径的拒绝。
5. **补齐弱覆盖脚本的测试**：`set-repository.mjs`、`update-project.mjs`（可用本地 file:// 仓库模拟 clone）、`install-project.mjs` 的直接单测。
6. **控制默认 check 的耗时**：完整 install-smoke 较重，可移入 `check:smoke` 层，日常开发跑轻量层，发布前跑全量。

推进原则：涉及可分发插件内容（`plugins/ai-agent-engine-codex/`）的改动必须同步递增双份 SemVer 版本并补 README 版本记录；纯仓库侧（根 `scripts/`、`tests/`、文档）的重构不升版本，但必须以 `npm run check` 加 `npm test` 全绿为交付门槛。

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
