# AI Agent Engine for Codex

面向 Codex 的项目级工程工作流插件：把需求澄清、设计契约、计划、执行、审查、验证、前后端/Web 路由、OpenAPI 摘要、交接与经验沉淀，做成可安装的 `ae-*` skills 与本地脚本。

> 参考：[Gitee AI Agent Engine](https://gitee.com/jiangqiang1996/ai-agent-engine)、[openai/plugins](https://github.com/openai/plugins)、[obra/superpowers](https://github.com/obra/superpowers)、[everything-claude-code](https://github.com/affaan-m/everything-claude-code)、[spec-kit](https://github.com/github/spec-kit)、[aicoding-cookbook](https://github.com/lili-luo/aicoding-cookbook)。这不是 OpenCode runtime 移植，而是 Codex 原生 skills + 项目级插件文件 + 本地脚本。致谢与许可证见 [NOTICE.md](NOTICE.md)、[LICENSE](LICENSE)。

English: [README.en.md](README.en.md)

## 适用场景

- 实现前澄清模糊需求，并拆成可执行计划；
- 在 Git/worktree 安全检查后落地实现，再按严重度审查；
- 把验证证据、交接说明和可复用经验留在项目文档里；
- 初始化 `AGENTS.md`、过程归档与长期 AI 记忆库骨架。

### AE 调用边界

AE skill **默认关闭**（隐式档位默认 `none`）。只有明确使用 `AE`、`ae-*`、`/ae-*`、`$ae-*`，或要求继续已有 AE 流程时才启用。普通语义匹配、仓库名、文件内容或上下文里的 “AE” 不会自动启动。

## 快速开始

```bash
node scripts/install-project.mjs --target /path/to/your-codex-project
```

Windows PowerShell：

```powershell
node scripts\install-project.mjs --target D:\codes\your-project
```

重启或重新打开目标项目的 Codex 对话，再在目标项目根目录初始化文档与记忆骨架：

```bash
node scripts/ae-tools.mjs init
# 常用：--lang zh-CN|en|bilingual  --profile minimal|full  --dry-run
node scripts/ae-tools.mjs help
```

默认元数据语言为 `bilingual`。隐式档位默认 `none`（仅显式调用）；需要五核心自然语言触发时加 `--implicit core`，全量隐式用 `--implicit all`。

更完整的安装、更新与语言切换说明见 [INSTALL.md](INSTALL.md) / [INSTALL.zh-CN.md](INSTALL.zh-CN.md)。

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

- 当前发布线是 `0.4.0-beta.3`；根 `package.json` 与插件 manifest 版本保持一致。
- 可分发技能的唯一源是 `plugins/ai-agent-engine-codex/skills`。`.agents/skills` 只属于 consumer 项目的安装布局，不是本仓库的第二份技能树。
- 项目级安装写入目标项目；全局安装发布当前用户的 personal plugin 和 dispatcher。两种安装都保留项目自己的 `AGENTS.md`、`docs/**`、AI memory、图谱和归档。
- 安装、更新和语言切换支持 `--implicit none|core|all`，默认是 `none`：新安装仅显式调用；`core` 仅五核心可自然语言隐式触发；`all` 恢复旧的全量隐式。
- `task-analyze` 只生成候选 worker request、就绪状态和并行波次；它不会自行启动后台代理。父代理负责授权、集成和最终验收。
- 本仓库检查证明脚本、契约、安装分发和隔离 fixture；它们不等同于真实 Codex host/model 行为或生产验收。

完整历史见 [CHANGELOG.md](CHANGELOG.md) / [CHANGELOG.en.md](CHANGELOG.en.md)；README 只保留最近 5 条版本窗口。

## 能力概览

在 Codex 中用 `$ae-help` 或「使用 ae-help」查看当前安装的完整能力。常用分组：

| 分组 | 技能 |
|---|---|
| 入口与治理 | `ae-help`、`ae-init`、`ae-constitution`、`ae-update`、`ae-language` |
| 澄清与设计 | `ae-ideate`、`ae-brainstorm`、`ae-design`、`ae-plan`、`ae-tasks`、`ae-prompt-optimize` |
| 执行与质量 | `ae-lfg`、`ae-work`、`ae-refactor`、`ae-tdd`、`ae-review`、`ae-debug` |
| 前后端 / Web | `ae-frontend-design`、`ae-web-forge`、`ae-web-app`、`ae-backend`、`ae-test-browser`、`ae-test-api` |
| 文档与数据 | `ae-doc-humanize`、`ae-doc-structure`、`ae-sql`、`ae-swagger-parser`、`ae-imagegen-prompt` |
| 交接与扩展 | `ae-handoff`、`ae-save-experience`、`ae-skill-creator`、`ae-skill-audit`、`ae-agent-creator`、`ae-reverse-engineering` |

本地辅助入口：

```bash
node scripts/ae-tools.mjs help
node scripts/check-design-contract.mjs
node scripts/ae-tools.mjs task-analyze --mode plan --plan docs/ae/plans/example.md
```

记忆检索、浅层依赖图、report/issue 等命令细节见 `ae-tools.mjs help` 与目标项目内文档；它们默认只读、有明确边界，不会替代 PRD/plan/gate 证据。

## 隐式调用档位（`--implicit`）

| 档位 | 含义 |
|---|---|
| `none`（**插件默认**） | 全部技能均不允许自然语言隐式触发；请显式 `$ae-*` / 指名 AE |
| `core` | 仅五核心允许自然语言隐式：`ae-help`、`ae-plan`、`ae-work`、`ae-review`、`ae-debug` |
| `all` | 全部技能允许隐式调用（旧默认） |

```bash
node scripts/install-project.mjs --target /path/to/project --implicit core
node scripts/set-ae-language.mjs --lang bilingual --implicit all
```

全局安装的 `install-global` / `update-global` 同样透传 `--implicit`。

## 安装与更新

**推荐：项目级安装**（只写目标项目，不改全局 Codex 配置）：

```bash
node scripts/install-project.mjs --target /path/to/your-codex-project
node scripts/install-project.mjs --target /path/to/your-codex-project --lang zh-CN
```

写入路径：`plugins/ai-agent-engine-codex/`、`.agents/plugins/marketplace.json`、`.agents/skills/ae-*`、以及 `scripts/ae-tools.mjs`、`scripts/update-ae-codex.mjs`、`scripts/set-ae-language.mjs`。分发源仓库本身不要当作安装目标。

**更新已安装项目：**

```bash
node scripts/update-ae-codex.mjs --repo https://github.com/YaoGUanquan/codex-ai-agent-engine.git --branch main
```

更新会尽量保留已选语言，并默认跑一次保守 `tidy --apply`（可用 `--no-tidy` 跳过）。

**切换技能列表语言**（改元数据后需重启对话）：

```bash
node scripts/set-ae-language.mjs --lang en|zh-CN|bilingual
```

**用户级全局安装 / 从项目级迁移**：先 `install-global.mjs preview`，确认后再 `apply`；项目数据（`AGENTS.md`、`docs/**`、记忆与归档）始终留在各项目根。步骤与安全门禁见 [INSTALL.md](INSTALL.md)。

**手动安装**：仅在不能跑安装脚本时使用——复制插件目录、入口脚本与 `.agents/skills`，并写好 `marketplace.json`；细节见 INSTALL。

## 初始化项目文档

```bash
node scripts/ae-tools.mjs init
```

默认 `ae-core` profile 创建：

- `AGENTS.md` — 面向 Codex 的项目说明（按 `package.json` 实际发现命令，不猜测）；
- `docs/ae` — 计划、审查、交接等 AE 产物（需求正典目录为 `docs/ae/prds`）；
- `docs/00-process` — 过程笔记、归档规则与模板；
- `docs/08-ai-memory` — 长期 AI 记忆库。

`--profile minimal` 只建 `AGENTS.md`；`--profile full` 保留旧版完整编号目录。默认不覆盖已有文件；`--force` 只替换 AE 受管区块。自 0.3.22 起不再创建 `docs/ai-memory` 兼容目录。

## 日常使用

Codex 通过 skills 暴露入口（`$ae-plan` 等），不是 OpenCode 式动态 slash 注册。默认 `none` 档下请显式点名技能：

```text
使用 ae-help 查看当前 AE 能力。
使用 ae-plan 为「带权限校验的文件上传」创建实现计划。
使用 ae-work 执行 docs/ae/plans/<plan>.md。
使用 ae-review mode:report-only 审查当前变更。
```

解析 OpenAPI / 恢复过程产物示例：

```bash
node scripts/ae-tools.mjs swagger openapi.json method:POST keyword:login mode:detail
node scripts/ae-tools.mjs recovery
```

## 多 agent 配置（可选）

`multi_agent.enabled` 支持 `auto`（默认）| `true` | `false`。`auto`/`true` 只做并行分析与候选波次，**不会**自行授权写入型子代理；`false` 强制串行。

新安装模板偏好 `preferred_model: gpt-6.1-sol`。把 `docs/ae/templates/ae-skill-profiles.example.yaml` 复制为 `.codex/ae-skill-profiles.yaml` 后按需改字段；更新脚本不覆盖已有本地配置。验证：

```bash
node scripts/ae-tools.mjs task-analyze --mode plan --plan docs/ae/plans/<your-plan>.md
```

## 仓库结构

```text
plugins/ai-agent-engine-codex/   # 插件主体；skills 唯一源
scripts/                         # 安装、更新、ae-tools 等
CHANGELOG.md / CHANGELOG.en.md   # 完整版本历史
docs/                            # 本仓库文档；init 后目标项目还有 docs/ae 等
.agents/                         # 仅 consumer 安装布局；本仓库不以之为技能源
```

## 重要边界

- `/ae-*` 是兼容标签，不是本仓库注册的 Codex 命令；可靠方式是显式点名 skill，或在支持的 App 里从 skill 列表选择。
- 本地检查 ≠ 真实 Codex host/model 行为、部署或生产容量验收。
- 当前无真实 MCP server；`.mcp.json` 有意为空。
- `ae-graph-*` 为浅层只读预览，不持久化完整图谱。
- `ae-merge-branch` 暂缓；浏览器验证走 `ae-test-browser`（Codex Browser / Playwright / 已有 DevTools）。
- Git 写操作、破坏性文件操作、网络、依赖安装、数据库写入等须遵循 Codex 显式授权。

## 开发检查与发布

```bash
npm run check
npm test
npm run check:smoke
node scripts/check-release-notes.mjs
git diff --check
```

发布前参考 [docs/release-checklist.md](docs/release-checklist.md)。

- 触及 `plugins/ai-agent-engine-codex/` 的可分发变更须同步根 `package.json`、插件 manifest、README 与 CHANGELOG，并通过发布检查。
- 仅根 `scripts/`、`tests/` 或公共文档的修复不自动升版本，但仍须通过受影响测试与上述检查。
- 贡献前阅读仓库 `AGENTS.md`。

## 许可

见 [LICENSE](LICENSE) 与 [NOTICE.md](NOTICE.md)。插件元数据保留 `GPL-2.0-only`。
