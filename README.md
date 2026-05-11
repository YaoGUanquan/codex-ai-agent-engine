# AI Agent Engine for Codex

AI Agent Engine for Codex 是一个面向 Codex 的项目级工程工作流插件。它把 AE 风格的需求澄清、计划、执行、审查、验证、Swagger/OpenAPI 摘要、交接和经验沉淀能力放到当前项目里，通过 Codex skills 和本地脚本运行。

> 参考项目：https://gitee.com/jiangqiang1996/ai-agent-engine<br>
> 本项目参考了上面这个 Gitee AI Agent Engine 项目的工作流设计和能力模型。<br>
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

## 能力清单

- `ae-help`：查看当前 AE 能力和边界。
- `ae-init`：初始化项目文档、归档规则、UTF-8 规则和长期 AI 记忆库。
- `ae-ideate`：生成方案方向、取舍、风险和下一步问题。
- `ae-brainstorm`：澄清需求并沉淀验收标准。
- `ae-lfg`：从需求到已验证交付的完整流程。
- `ae-plan`：创建实现计划，不修改业务代码。
- `ae-work`：在 Git/worktree 安全检查后执行计划。
- `ae-refactor`：规划行为保持型重构。
- `ae-review`：按严重度优先审查代码或文档。
- `ae-doc-humanize`：把结构化或生硬内容改写成更易读的文档。
- `ae-doc-structure`：把散乱内容整理成需求、计划、交接或检查清单。
- `ae-frontend-design`：交付可用的前端初版。
- `ae-test-browser`：用真实浏览器验收 UI 流程。
- `ae-sql`：生成、审查或执行 SQL，并保留安全边界。
- `ae-swagger-parser`：摘要或过滤 Swagger/OpenAPI 规格。
- `ae-handoff`：沉淀任务状态、证据、阻塞点和下一步。
- `ae-prompt-optimize`：把模糊请求改写成可执行 Codex 提示词。
- `ae-save-experience`：沉淀可复用项目经验。
- `ae-skill-creator`：创建或更新 Codex skill。
- `ae-agent-creator`：创建 Codex 可用的代理提示和委派模板。
- `ae-update`：更新项目本地 AE for Codex 安装。
- `ae-language`：切换项目本地 AE skill 显示语言。

本地辅助命令入口：

```bash
node scripts/ae-tools.mjs help
```

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

安装中文或双语技能元数据：

```bash
node scripts/install-project.mjs --target /path/to/your/codex-project --lang zh-CN
node scripts/install-project.mjs --target /path/to/your/codex-project --lang bilingual
```

支持的元数据语言：`en`、`zh-CN`、`bilingual`。

安装脚本只会写入目标项目内的这些路径：

- `plugins/ai-agent-engine-codex/`
- `.agents/plugins/marketplace.json`
- `.agents/skills/ae-*`
- `scripts/ae-tools.mjs`
- `scripts/update-ae-codex.mjs`
- `scripts/set-ae-language.mjs`

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

## 日常使用

Codex 不会自动注册 OpenCode 风格的 slash command。更可靠的方式是在请求中直接写 skill 名称：

```text
使用 ae-help 查看当前 AE 能力。
使用 ae-init 初始化 AGENTS.md、docs/ae、docs/00-process 和 docs/08-ai-memory。
使用 ae-plan 为“带权限校验的文件上传功能”创建实现计划。
使用 ae-work 执行 docs/ae/plans/2026-05-11-001-file-upload-plan.md。
使用 ae-review mode:report-only 审查当前变更。
```

解析 OpenAPI：

```bash
node scripts/ae-tools.mjs swagger openapi.json method:POST keyword:login mode:detail
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

Codex 技能列表里显示的说明来自静态元数据。它不能在已经打开的 Codex 对话中实时切换，但可以重写项目本地元数据，然后重启或重新打开项目对话。

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

更新脚本会尽量保留当前项目已经设置的语言。也可以显式覆盖：

```bash
node scripts/update-ae-codex.mjs --repo https://github.com/YaoGUanquan/codex-ai-agent-engine.git --branch main --lang bilingual
```

也可以让 Codex 代理执行：

```text
Fetch and follow the update instructions from https://raw.githubusercontent.com/YaoGUanquan/codex-ai-agent-engine/main/INSTALL.md
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

- `/ae-*` 是兼容标签，不是自动注册的 Codex slash command。
- 可靠触发方式是直接说：`使用 ae-work ...`、`使用 ae-review ...`、`使用 ae-plan ...`。
- 当前 MVP 还没有真实 MCP server，`.mcp.json` 有意保持为空。
- OpenAPI YAML 解析暂缓，JSON OpenAPI 不需要依赖即可使用。
- Git 写操作、破坏性文件操作、网络请求、依赖安装、数据库写入、浏览器环境 setup 都必须遵循 Codex 显式授权机制。

## 开发检查

在本仓库运行：

```bash
npm run check
node --check scripts/ae-tools.mjs
node --check plugins/ai-agent-engine-codex/scripts/ae-tools.mjs
node scripts/ae-tools.mjs help
```

如果本机有 Codex skill validator，也建议验证 `plugins/ai-agent-engine-codex/skills/*` 和 `.agents/skills/*`。

发布前可参考 [docs/release-checklist.md](docs/release-checklist.md)。

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
