# AI Agent Engine for Codex

面向 Codex 的项目级工程工作流插件：把需求澄清、设计契约、计划、执行、审查、验证、交接与经验沉淀，以 `ae-*` skills 和本地脚本落到当前项目。

> 参考：[Gitee AI Agent Engine](https://gitee.com/jiangqiang1996/ai-agent-engine)、[OpenAI plugins](https://github.com/openai/plugins)、[Superpowers](https://github.com/obra/superpowers)、[everything-claude-code](https://github.com/affaan-m/everything-claude-code)、[Spec Kit](https://github.com/github/spec-kit)、[aicoding-cookbook](https://github.com/lili-luo/aicoding-cookbook) 等方法论；本仓库是 Codex 原生 skill/插件实现，不是 OpenCode runtime 移植。

English: [README.en.md](README.en.md) · 安装步骤：[INSTALL.md](INSTALL.md) / [INSTALL.zh-CN.md](INSTALL.zh-CN.md) · 仓规：[AGENTS.md](AGENTS.md)

## 当前主线事实

- 当前发布线 **`0.4.0-beta.3`**；根 `package.json` 与插件 manifest 版本一致。
- 可分发技能**唯一源**：`plugins/ai-agent-engine-codex/skills`。`.agents/skills` 只属于 consumer 安装布局，不是本仓库第二份技能树；无 `.ae-source`。
- 安装 / 更新 / 语言切换支持 `--implicit none|core|all`；**默认 `none`**（新安装仅显式调用 AE）。`core` 仅五核心可自然语言隐式；`all` 为旧全量隐式。已有安装设置会被保留，不强制迁移。
- 项目级安装写入目标项目；全局安装发布当前用户 personal plugin 与 dispatcher。两种方式都保留各项目自己的 `AGENTS.md`、`docs/**`、AI 记忆与归档。
- `task-analyze` 只产出候选 worker request / 就绪状态 / 并行波次，不自行启动后台代理；父代理负责授权、集成与最终验收。
- `npm test` / `npm run check` / `npm run check:smoke` 等**本地检查证明脚本、契约与隔离安装**，不等于真实 Codex host/model、目标项目运行时、部署或生产容量。

完整发布说明见 [CHANGELOG.md](CHANGELOG.md) / [CHANGELOG.en.md](CHANGELOG.en.md)。

## 快速开始

```bash
node scripts/install-project.mjs --target /path/to/your-codex-project
```

Windows PowerShell：

```powershell
node scripts\install-project.mjs --target D:\codes\your-project
```

在目标项目根目录初始化文档骨架，并重启/重开 Codex 对话：

```bash
node scripts/ae-tools.mjs init
node scripts/ae-tools.mjs help
```

默认元数据语言为 `bilingual`；可用 `--lang zh-CN|en|bilingual`。默认隐式档为 `none`；需要五核心隐式时加 `--implicit core`。

代理可按 [INSTALL.md](INSTALL.md) / [INSTALL.zh-CN.md](INSTALL.zh-CN.md) 拉取执行安装。

## 隐式调用档位（`--implicit`）

| 档位 | 含义 |
|---|---|
| `none`（**插件默认**） | 全部技能不允许自然语言隐式触发；请显式 `$ae-*` / 指名 AE |
| `core` | 仅 `ae-help`、`ae-plan`、`ae-work`、`ae-review`、`ae-debug` 可自然语言隐式 |
| `all` | 全部技能允许隐式（旧默认） |

```bash
node scripts/install-project.mjs --target /path/to/project --implicit core
node scripts/set-ae-language.mjs --lang bilingual --implicit all
```

未显式调用 AE 时，使用普通 Codex 能力与非 AE skill，不要自动启动 AE 流程。

## 能力清单

按类一览（完整触发与流程见各 skill）：

| 类别 | Skills |
|---|---|
| 入口 / 编排 | `ae-help`、`ae-lfg`、`ae-init` |
| 需求与设计 | `ae-ideate`、`ae-brainstorm`、`ae-design`、`ae-constitution`、`ae-plan`、`ae-tasks` |
| 执行与重构 | `ae-work`、`ae-refactor`、`ae-tdd`、`ae-debug` |
| 审查与验证 | `ae-review`、`ae-test-browser`、`ae-test-api` |
| 前端 / Web | `ae-frontend-design`、`ae-web-forge`、`ae-web-app` |
| 后端 / 数据 | `ae-backend`、`ae-sql`、`ae-swagger-parser` |
| 文档与交接 | `ae-doc-humanize`、`ae-doc-structure`、`ae-handoff`、`ae-save-experience`、`ae-prompt-optimize`、`ae-imagegen-prompt` |
| 元能力 / 维护 | `ae-skill-creator`、`ae-skill-audit`、`ae-agent-creator`、`ae-language`、`ae-update`、`ae-reverse-engineering` |

本地辅助：`node scripts/ae-tools.mjs help`（含 init、memory/knowledge 查询、浅层依赖图、`task-analyze`、report、issue 等）。细节与参数边界见 `AGENTS.md` 与 `ae-tools.mjs help`。

## 项目级安装与更新

推荐项目级安装（只写目标项目，不改全局 Codex 配置）：

```bash
node scripts/install-project.mjs --target /path/to/your-codex-project
node scripts/install-project.mjs --target /path/to/your-codex-project --lang zh-CN --implicit none
```

已安装项目中更新：

```bash
node scripts/update-ae-codex.mjs --repo https://github.com/YaoGUanquan/codex-ai-agent-engine.git --branch main
```

技能列表语言（需重启对话后生效）：

```bash
node scripts/set-ae-language.mjs --lang zh-CN   # 或 en / bilingual
```

安装写入目标项目的主要路径：`plugins/ai-agent-engine-codex/`、`.agents/plugins/marketplace.json`、`.agents/skills/ae-*`、`scripts/ae-tools.mjs`、`scripts/update-ae-codex.mjs`、`scripts/set-ae-language.mjs`。

全局安装、从项目级迁移、手动复制步骤见 [INSTALL.md](INSTALL.md)。多 agent / `task-analyze` 配置模板见 `docs/ae/templates/ae-skill-profiles.example.yaml`（更新不会覆盖已有 `.codex/ae-skill-profiles.yaml`）。

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

README 仅保留最近 5 条；完整历史见 [CHANGELOG.md](CHANGELOG.md)。

## 仓库结构

```text
plugins/ai-agent-engine-codex/   # 可分发插件；skills 唯一源
scripts/                         # install / update / ae-tools / 检查脚本
tests/                           # 回归与安装烟测
docs/ae/templates|references     # 入库模板与参考（公开仓）
CHANGELOG.md / INSTALL*.md       # 完整发布说明与安装指引
AGENTS.md                        # 仓规与验证入口
```

`.agents/` 是 consumer 安装布局，不是本分发源仓库的技能源。

## 重要边界

- 可靠触发：明确点名 AE / `ae-*` / `$ae-*`，或继续已启动的 AE 流程；默认 `none` 下自然语言不会隐式拉起 AE。
- `/ae-*` 是兼容标签，不是本仓库注册出的 Codex slash command。
- 当前无真实 MCP server；`.mcp.json` 有意保持为空。
- `ae-graph-*` 为浅层只读脚本，不持久化完整图谱。
- Git 写操作、破坏性文件操作、网络、依赖安装、数据库写入、浏览器 setup 均需 Codex 显式授权。
- 本公开仓 `docs/` 只入库模板/参考与发布清单；过程产物与长期 AI 记忆写入私有 docs 仓（见 `AGENTS.md` External Docs Context）。

## 开发检查

```bash
npm test
npm run check
npm run check:smoke
node scripts/check-release-notes.mjs
git diff --check
```

发布前可参考 [docs/release-checklist.md](docs/release-checklist.md)。只改文档、不改可分发插件内容时不单独 bump 版本。

## 许可和致谢

见 [LICENSE](LICENSE) 与 [NOTICE.md](NOTICE.md)。本项目参考 AI Agent Engine，插件与仓库授权为 `GPL-2.0-only`。
