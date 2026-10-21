# AI Agent Engine for Codex

AI Agent Engine for Codex 是一个面向 Codex 的项目级工程工作流插件。它把 AE 风格的需求澄清、设计契约、计划、执行、审查、验证、前端/Web 路由、Swagger/OpenAPI 摘要、交接和经验沉淀能力放到当前项目里，通过 Codex skills 和本地脚本运行。

> 参考项目：https://gitee.com/jiangqiang1996/ai-agent-engine<br>
> 本项目参考了上面这个 Gitee AI Agent Engine 项目的工作流设计和能力模型。<br>
> 也参考了 https://github.com/openai/plugins 和 https://github.com/obra/superpowers 中部分开发技能设计。<br>
> 也参考了 https://github.com/affaan-m/everything-claude-code 中关于外部 skill 仓库治理、持续学习、验证循环和 Codex 适配边界的设计。<br>
> 也参考了 https://github.com/github/spec-kit 中关于 constitution、需求质量清单、任务拆解和跨产物分析的工作流设计，但不引入其 runtime。<br>
> 也参考了 https://github.com/lili-luo/aicoding-cookbook 中关于失败可见、结构性修复、分层验证和停止条件的方法；仅重写可移植方法，不复制其未声明仓库级许可证的文本。<br>
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

### AE 调用边界

AE skill 默认是**关闭的**。只有明确使用 `AE`、`ae-*`、`/ae-*`、`$ae-*`，或要求继续已有 AE 流程时才启用；普通语义匹配、仓库名称、文件内容或历史上下文中的 “AE” 不会自动启动 AE。

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
node scripts/ae-tools.mjs init --profile minimal
node scripts/ae-tools.mjs init --profile full
node scripts/ae-tools.mjs init --dry-run --nested preview --explain-instructions
node scripts/ae-tools.mjs init --dry-run
```

验证辅助命令：

```bash
node scripts/ae-tools.mjs help
```

## 版本更新记录

### 0.4.0-beta.3（2026-10-21）
- 默认隐式档位改为 `none`；修复 Cursor `none` 档元数据兼容；收紧 `ae-debug` 假设规则；补充离线模型评测校验与 worker 验收反例。真实 GPT 对照未跑。

### 0.4.0-beta.2（2026-10-20）
- 安装/更新/语言切换支持 `--implicit core|all|none`；**插件默认档位改为 `core`**（仅 ae-help / ae-plan / ae-work / ae-review / ae-debug 可自然语言隐式触发）。非 core 请走 ae-help 路由或 `$ae-*`；`--implicit all` 可恢复旧行为。
- 验证命令：`npm test`、`npm run check`、`npm run check:smoke`、`git diff --check`。这些静态和本地检查不能证明真实 Codex host/model 行为。
### 0.4.0-beta.1（2026-10-15）
- 新增按任务选择角色的团队合同与角色模板：复杂任务先确认方案，主代理负责原生调度、集成和实际验收，小任务继续直接执行。
- 团队执行写权限由「显式 opt-in」改为「父代理门禁」（`write_requires_explicit_opt_in: false` + `write_requires_parent_gate: true`）；写 worker 仍需父代理显式批准，`can_spawn_write_agents*` 保持 false。
- 并行分析区分文件与业务资源的读写冲突，局部冲突按波次串行；新增宿主名额、执行状态和自动并发配置，保留显式关闭及只读选择，无关脏改动不再一律阻塞委派。
- 强化从数据来源到输出的内存、查询与并发边界，补充隔离数据夹具及五类真实模型对照规范；首轮明确偏好 `gpt-6.1-sol`，不静默替换模型。
- 验证命令：`npm test`、`npm run check`、`npm run check:smoke`、`git diff --check`。静态与隔离安装仅证明辅助工具、规则和分发合同；真实模型对照尚未完成，不宣称质量、耗时或生产容量已提升。
### 0.3.56（2026-10-15）
- 统一测试范围、通过结果复用和失效规则：单点失败先聚焦验证，扩大到全量前说明依据，审查、交付和上下文恢复不自动重跑；移除固定执行次数及脏工作区一律确认。收紧技能入口触发文案，强调明确请求后再加载专项门禁（默认 `implicit` 档位仍为 `all`，与 I 中期约定一致）。
- GPT-6.1 为首要行为验收目标，提供后续模型可复用的八类评测场景及三组对照、每组两次的执行规范；尚未完成真实模型行为评测，不宣称性能或质量提升已获证明。
- 验证命令：`node --test tests/model-adaptation.test.mjs tests/instruction-audit.test.mjs`、`npm test`、`npm run check`、`npm run check:smoke`、`git diff --check`。静态及隔离安装检查仅证明规则、元数据与分发合同，实际结果和未通过项以交付记录为准。
### 0.3.55（2026-10-13）
- 移除 `.ae-source` 维护镜像：插件 `plugins/ai-agent-engine-codex/skills` 成为唯一技能源；删除 `check-skill-mirror` 并清理合同/语言/审计脚本中的镜像根。
- 回归测试改为只断言插件 `SKILL_ROOT`；文档与发布清单去掉 ae-source 指引；版本升至 0.3.55。
- 验证命令：`npm test`、`npm run check`、`npm run check:smoke`、`git diff --check`。这些静态和本地检查不能证明真实 Codex host/model 行为。
## 当前主线事实

- 当前发布线是 `0.4.0-beta.3`；根 `package.json` 与插件 manifest 的版本保持一致。
- 可分发技能的唯一源是 `plugins/ai-agent-engine-codex/skills`。`.agents/skills` 只属于 consumer 项目的安装布局，不是本仓库的第二份技能树。
- 项目级安装写入目标项目；全局安装发布当前用户的 personal plugin 和 dispatcher。两种安装都保留项目自己的 `AGENTS.md`、`docs/**`、AI memory、图谱和归档。
- 安装、更新和语言切换支持 `--implicit none|core|all`，默认是 `none`：新安装仅显式调用；`core` 仅五核心可自然语言隐式触发；`all` 恢复旧的全量隐式。
- `task-analyze` 只生成候选 worker request、就绪状态和并行波次；它不会自行启动后台代理，也不把候选波次当作完成证据。父代理负责授权、集成和最终验收。
- 本仓库的检查证明脚本、契约、安装分发和隔离 fixture；它们不等同于真实 Codex host/model 行为、目标项目运行时、部署或生产容量验收。

主线变更以 [CHANGELOG.md](CHANGELOG.md) 和 [CHANGELOG.en.md](CHANGELOG.en.md) 为完整记录；README 只保留当前版本窗口。

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
- `ae-update`：更新当前用户的全局 AE for Codex runtime、personal plugin 与 Cursor skill 副本。
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

入口体积与关键词检索使用独立命令，不改变上述声明式关系合同：

```powershell
node scripts/ae-tools.mjs ae-memory-index --check
node scripts/ae-tools.mjs ae-memory-search --query "裁剪" --limit 5
node scripts/ae-tools.mjs ae-memory-search --query "超时" --path 03-key-workflows.md
node scripts/ae-tools.mjs ae-memory-index --compact
```

`00-index.md` 仅作短导航（4096 字节/80 行），不再写日期流水；专题最多 15KiB。关键词检索默认最多 5 条、每条 240 字符，扫描根层 Markdown 至多 128 文件/8MiB，单文件最多 512KiB；嵌套专题用 `--path`。`--history` 只查旧入口分片；`scan.complete=false` 不是无匹配证据。外部文档须先解析当前项目/分支，再传 `--docs-root <绝对docs路径>`，不自动合并根目录。整理默认预览，显式写入还需 `--apply --expect-sha256 <预览哈希>`；先核验同目录分片再替换入口，按序拼接和源哈希可恢复。分片不重写跨页锚点/引用定义，不代表历史结论仍有效。

所有需要取值的选项必须显式提供非空值，例如 `--limit 20` 和 `--direction outgoing`；缺少值会返回结构化诊断并以非零状态退出。`--root` 仅接受当前工作区内的普通目录，命令会逐段拒绝符号链接或 junction，并验证解析后的路径不离开工作区。

浅层依赖图辅助命令：

```bash
node scripts/ae-tools.mjs ae-graph-build --root scripts
node scripts/ae-tools.mjs ae-graph-query --root scripts --path ae-tools.mjs
```

`ae-graph-build` 和 `ae-graph-query` 是只读浅层依赖图脚本，用于快速预览源码文件、静态导入边和外部依赖。输出的 `limits` 会标明文件和边的请求值、有效值、返回数量和截断状态；默认保持 500 文件、无边数上限，只有 `--edge-limit` 才截断边。它们不会写入 `docs/ae/graphs/graph.json` 或 `.ae/graph.db`，也不提供完整图谱 schema、分片、freshness 或预览页。

Codex 原生编排、报告和 Issue 辅助命令：

```bash
node scripts/ae-tools.mjs task-analyze --mode plan --plan docs/ae/plans/example.md
node scripts/ae-tools.mjs report --input docs/ae/reports/audit.json --out docs/ae/reports/audit.html
node scripts/ae-tools.mjs issue create --title "跟踪项"
node scripts/ae-tools.mjs issue list
node scripts/ae-tools.mjs skill-audit --out docs/ae/reports/skill-audit.json
```

`task-analyze` 只生成供 Codex 主代理判断的 worker request、就绪状态和候选波次，不会自行启动后台代理；写入 worker 要求授权、可安全共存的工作区、已核验依赖和独占写入所有权。`report` 默认生成无外部依赖的转义 HTML，只有同时提供 `--cdn --cdn-url https://...` 才启用 CDN。Issue 只跟踪状态、优先级、依赖和工件引用，不替代 PRD、plan、task、review、gate 或 evidence。

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

## 隐式调用档位（`--implicit`）

安装与更新支持三档：`core` | `all` | `none`。

| 档位 | 含义 |
|---|---|
| `none`（**插件默认**） | 全部技能均不允许自然语言隐式触发；请显式 `$ae-*` / 指名 AE |
| `core` | 仅五个核心技能允许自然语言隐式触发：`ae-help`、`ae-plan`、`ae-work`、`ae-review`、`ae-debug` |
| `all` | 全部技能允许隐式调用（旧默认） |

不带 `--implicit` 安装时默认写入 `none`（安装后 `allow_implicit_invocation: true` 为 0）。需要五核心隐式时传 `--implicit core`；需要旧全量隐式时传 `--implicit all`：

```bash
node scripts/install-project.mjs --target /path/to/your/codex-project --implicit all
node scripts/set-ae-language.mjs --lang bilingual --implicit all
```

全局安装同样支持 `--implicit core|all|none`（`install-global` / `update-global` 透传）。

安装脚本只会写入目标项目内的这些路径：

- `plugins/ai-agent-engine-codex/`
- `.agents/plugins/marketplace.json`
- `.agents/skills/ae-*`
- `scripts/ae-tools.mjs`
- `scripts/update-ae-codex.mjs`
- `scripts/set-ae-language.mjs`

分发源仓库本身不支持作为安装目标；它使用用户级 personal 插件，技能唯一源为 `plugins/ai-agent-engine-codex/skills`。

## 从项目级安装迁移到用户级全局安装

全局安装只集中 AE 运行时和 skills，不迁移项目数据。每个项目的 `AGENTS.md`、`docs/**`、AI 记忆、图谱和 archive 均保留在项目根目录。

在分发仓库中先生成只读预览。该命令不会写入、删除或移动任何文件：

```powershell
Set-Location '<path-to-cloned-repository>'
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
    { "root": "D:\\codes\\your-project", "role": "consumer" }
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

每个操作系统用户都有自己的 `$HOME`、dispatcher、备份和 personal marketplace；安装器不会扫描或修改其他用户的目录，也不会直接修改 `.codex/plugins/cache`。Codex 通过 personal 插件发现 AE 技能；Cursor 通过 `~/.cursor/skills/ae-*` 真实拷贝发现同一套技能（Cursor 不跟踪技能目录上的 symlink）。分发源仓库仅以 `plugins/ai-agent-engine-codex/skills` 为技能源；consumer 项目迁移后只应使用用户级分发。已打开的对话不会自动刷新技能目录。

## 初始化项目文档和记忆库

安装完成后，在目标项目根目录执行：

```bash
node scripts/ae-tools.mjs init
```

默认 `ae-core` profile 会创建：

- `AGENTS.md`：面向 Codex 的项目说明；
- `docs/ae`：计划、审查、交接、经验等 AE 工作流产物；
- `docs/00-process`：执行中的过程笔记、归档规则和过程模板；
- `docs/08-ai-memory`：标准长期项目 AI 记忆库。

需求正典目录为 `docs/ae/prds`。自 0.3.22 起，init 不再创建 `docs/ai-memory` 兼容目录；存量项目中已有的该目录保持原样。

`--profile minimal` 只创建 `AGENTS.md`；`--profile full` 额外保留旧版完整编号文档目录集合。生成的 `AGENTS.md` 会列出从 `package.json` 实际发现的命令，不会猜测缺失命令。

使用 `--dry-run --nested preview --explain-instructions` 可查看有界子项目候选、现有 `AGENTS.md` / `AGENTS.override.md` 和 Codex 专属优先级。嵌套候选只是建议，不会自动创建文件；其他客户端可能采用不同的加载语义。

默认不会覆盖已有文件。新生成文件包含明确的 AE 受管起止区块；`--force` 只替换该区块并保留区块外内容。旧版 marker-only 文件无法可靠区分用户修改，会出现在 `conflicted_files` 中并保持原样。

生成的文本文件统一按 UTF-8 写入。Windows 上 PowerShell 可能把合法 UTF-8 中文显示成乱码；改写文件前，先用显式 UTF-8 读取或 Git diff 验证。

## 外部参考

当前仓库保留了清晰的 Codex 边界：

- `https://gitee.com/jiangqiang1996/ai-agent-engine` 主要提供 AE 风格工作流能力模型；
- `https://agents.md/` 与 `https://github.com/agentsmd/agents.md` 提供 AGENTS.md 开放格式和嵌套指导参考；Codex 的 override 与合并顺序以 OpenAI 官方文档为准，不推广为所有客户端的统一运行时行为；
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

新安装的团队默认配置如下。只在显式调用 AE 后使用，复杂任务先确认方案；原有本地配置保留：

```yaml
multi_agent:
  enabled: auto
  mode: auto
  max_workers: auto
  fallback_max_workers: 3
  preferred_model: gpt-6.1-sol
  min_parallel_units: 2
  require_clean_git: false
  require_plan_dependencies: true
  require_disjoint_files: true
  allow_write_agents: true
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

`false` 硬关闭、`suggest`、`review_only` 与显式 `allow_write_agents: false` 继续生效。更新不覆盖现有 `.codex/ae-skill-profiles.yaml`；已有文件时只编辑所需字段，不用模板覆盖自定义内容。主代理按角色模板调用当前可用原生工具；没有工具时说明采用串行执行，不声称实际运行了团队。

分析器按独占写入、共同读取、共享业务资源与依赖安排候选波次；主代理核对改动和验收证据后才能释放后继任务。`--host-slots 3` 表示实际观察到的空闲 worker 名额，不包含主代理；未知时使用并披露 `fallback_max_workers`。`--execution-state <relative.json>` 可提供 `{"units":{"U1":"passed","U2":"failed"}}`，候选波次不代表任务已经通过。实际计划验证：

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
.agents/                         # consumer 项目安装布局；本仓库不以此为技能源
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

如果本机有 Codex skill validator，也建议验证 `plugins/ai-agent-engine-codex/skills/*`。

发布前可参考 [docs/release-checklist.md](docs/release-checklist.md)。

## 维护与发布边界

- 任何触及 `plugins/ai-agent-engine-codex/` 的可分发变更，都必须同步更新根 `package.json`、插件 manifest、README 和 CHANGELOG，并通过发布检查。
- 根 `scripts/`、`tests/` 和公共文档的仓库侧修复不自动升版本，但必须通过受影响的测试、`npm run check`、`npm run check:smoke` 和 `git diff --check`。
- Git 提交、推送、分支合并、外部文档归并、真实 API/数据库写入和部署验收是独立授权与证据层，不由 README 中的本地检查替代。
- 贡献前请先阅读仓库 `AGENTS.md`；完整版本历史见 [CHANGELOG.md](CHANGELOG.md)。

## 许可和致谢

见 [LICENSE](LICENSE) 和 [NOTICE.md](NOTICE.md)。

本项目参考 AI Agent Engine，并在插件元数据和仓库授权中保留 `GPL-2.0-only`。
