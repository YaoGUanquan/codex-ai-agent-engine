# AI Agent Engine for Codex

这是一个面向 Codex 的项目级工程工作流插件，明确参考了 AI Agent Engine OpenCode 插件的工作流思想。

它提供需求澄清、计划、执行、审查、验证、Swagger/OpenAPI 摘要和交付门禁等 AE 风格能力。

> 参考项目：https://gitee.com/jiangqiang1996/ai-agent-engine<br>
> 本项目参考了上面这个 Gitee AI Agent Engine 项目的工作流设计和能力模型。<br>
> 这不是 OpenCode runtime 的直接移植，而是 Codex 原生 skill + 本地脚本的实现方式。

English: [README.md](README.md)

## 能力清单

- `ae-help`：查看当前 AE 能力。
- `ae-ideate`：生成方案方向、取舍和下一步。
- `ae-brainstorm`：澄清需求并沉淀验收标准。
- `ae-lfg`：从需求到交付的完整工程流程。
- `ae-plan`：创建实现计划，不修改业务代码。
- `ae-work`：在 Git/worktree 安全检查之后执行计划。
- `ae-refactor`：规划行为保持型重构。
- `ae-review`：代码或文档的分层审查， findings 优先。
- `ae-doc-humanize`：把结构化或生硬内容改写成更易读的文档。
- `ae-doc-structure`：把散乱内容整理成需求、计划、交接或检查清单。
- `ae-frontend-design`：交付可用的前端初版。
- `ae-test-browser`：用真实浏览器验收 UI 流程。
- `ae-sql`：生成、审查或执行 SQL，并保留安全边界。
- `ae-swagger-parser`：解析 Swagger/OpenAPI 摘要。
- `ae-handoff`：沉淀当前任务状态和下一步。
- `ae-prompt-optimize`：把模糊请求改写成可执行提示词。
- `ae-save-experience`：沉淀可复用项目经验。
- `ae-skill-creator`：创建或更新 Codex skill。
- `ae-agent-creator`：创建 Codex 可用的代理提示或委派模板。
- `ae-update`：更新项目本地 AE for Codex 安装。
- `ae-language`：切换本地 AE skill 显示语言。

本地辅助命令入口：

```bash
node scripts/ae-tools.mjs help
```

## 项目级安装

推荐只安装到目标项目，避免影响全局 Codex 环境。

### 让 Codex 代理辅助安装

仓库发布后，在目标项目的 Codex 对话里把这句话交给代理执行：

```text
Fetch and follow the project-level install instructions from https://raw.githubusercontent.com/YaoGUanquan/codex-ai-agent-engine/main/INSTALL.md
```

在本仓库中运行：

```bash
node scripts/install-project.mjs --target /path/to/your/codex-project
```

Windows PowerShell 示例：

```powershell
node scripts\install-project.mjs --target D:\codes\your-project
```

安装中文技能列表描述：

```powershell
node scripts\install-project.mjs --target D:\codes\your-project --lang zh-CN
```

支持的元数据语言：`en`、`zh-CN`、`bilingual`。

安装脚本只会写入目标项目目录内的这些路径：

- `plugins/ai-agent-engine-codex/`
- `.agents/plugins/marketplace.json`
- `.agents/skills/ae-*`
- `scripts/ae-tools.mjs`
- `scripts/update-ae-codex.mjs`
- `scripts/set-ae-language.mjs`

安装后，重启或重新打开该项目的 Codex 对话。

## 技能列表语言

Codex 技能列表里显示的说明来自静态的 `agents/openai.yaml` 元数据。它不能在 UI 内实时切换，但可以重写当前项目内的元数据，然后重启或重新打开该项目对话。

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

如果不想运行安装脚本：

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

## 快速验证

安装并重启目标项目的 Codex 对话后，可以直接说：

```text
使用 ae-help 看看当前 AE 能力
```

也可以在目标项目终端运行：

```bash
node scripts/ae-tools.mjs help
```

## 使用示例

创建计划：

```text
使用 ae-plan 为“带权限校验的文件上传功能”创建实现计划
```

按计划执行：

```text
使用 ae-work 执行 docs/ae/plans/2026-05-11-001-file-upload-plan.md
```

审查当前变更：

```text
使用 ae-review mode:report-only 审查当前变更
```

解析 OpenAPI：

```bash
node scripts/ae-tools.mjs swagger openapi.json method:POST keyword:login mode:detail
```

## 仓库结构

```text
.agents/                         # 当前仓库自用的项目级安装示例
plugins/ai-agent-engine-codex/   # Codex 插件主体
scripts/ae-tools.mjs             # 根辅助命令入口
scripts/install-project.mjs      # 项目级安装脚本
docs/codex-port-analysis.md      # OpenCode 到 Codex 的迁移分析
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

## 上传到 GitHub

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
