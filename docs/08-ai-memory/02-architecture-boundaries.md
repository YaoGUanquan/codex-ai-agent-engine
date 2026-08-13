<!-- ae-codex:init managed -->
# 架构边界

记录长期稳定的模块边界、职责边界、运行边界和集成点。

## 分发与镜像

| 边界 | 职责 | 路径 |
| --- | --- | --- |
| 可分发插件 | SemVer、skills、安装脚本、Codex manifest | `plugins/ai-agent-engine-codex/` |
| 源维护镜像 | 与可分发 skill 一致、但不被 Codex 自动发现的副本 | `.ae-source/skills/` |
| 根薄包装 | 目标项目与开发机统一入口，不含第二份实现 | `scripts/*.mjs` → `plugins/.../scripts/` |

版本递增规则：仅当 `plugins/ai-agent-engine-codex/` 可分发内容变化时同步递增根 `package.json` 与 `plugin.json`，并在 README 与 CHANGELOG 各补版本条目（README 仅保留最近 5 条，超出窗口迁移到 CHANGELOG）；纯仓库侧 `tests/`、过程文档、记忆库更新不升版本。

## CLI 与检查分层（0.3.20+）

| 层 | 命令 | 职责 |
| --- | --- | --- |
| 语法 | `npm run check:syntax` | `scripts/check-syntax.mjs` glob 全部 `.mjs` 做 `node --check` |
| 契约 | `npm run check:contracts` | mirror、skill contract、artifacts、design、memory registry、release-notes、check-claims、knowledge/graph 烟测 |
| 烟测 | `npm run check:smoke` | install-smoke、global-install-smoke（较重，不在默认 `check`） |
| 全量 | `npm run check:all` | syntax + contracts + smoke |

## ae-tools 模块树

- 入口：`plugins/ai-agent-engine-codex/scripts/ae-tools.mjs`（仅分发 + 全局参数）。
- 实现：`plugins/ai-agent-engine-codex/scripts/ae-tools/*.mjs`，严格分层 DAG；`utils.mjs` 为零本地导入基础层。
- Init 模板：`scripts/ae-tools/init-templates/{en,zh-CN}/*.md`，渲染时 CRLF 归一化。
- 共享 artifact 校验：`plugins/ai-agent-engine-codex/scripts/artifact-check-utils.mjs`。
- 维护者参考：`docs/ae/references/ae-tools-module-layout.md`；循环导入由 `tests/ae-tools.test.mjs` 守卫。
- **tidy**（0.3.23+）：`ae-tools/tidy.mjs` 负责过程笔记五态分类、证据超期归档与 memoryBudget 报告；`update-project.mjs`（0.3.24+）安装后自动调用 `tidy --apply`。

## 图谱边界

- **浅层依赖图**：`ae-graph-build` / `ae-graph-query` 只读 JSON，不写入 `docs/ae/graphs/graph.json`。
- **声明式知识图**：`docs/08-ai-memory/00-registry.json` + `ae-knowledge-map` / `ae-knowledge-query`。
- **维护者策展图**：`docs/ae/graphs/maintainer-artifact-graph.md`（人工维护，非运行时）。

## Skill 职责（2026-08-11 全栈优化后）

| Skill | 边界 |
| --- | --- |
| `ae-backend` | 框架无关默认 + 按仓库栈选读六语言指导；未覆盖语言回退仓库约定 |
| `ae-web-app` / `ae-web-forge` | 前端实现与 Web 路由；跨后端步骤引用 `api-contract-checklist.md` |
| `ae-debug` | 前端 / 后端 / 前后端边界三套 Quick Map |
| `ae-sql` | SQL 变更 + `sql-safety-checklist.md` 危险分级 |
| `ae-design` | 设计契约；机器校验 `check-design-contract.mjs` |

## 全局安装 vs 项目数据

- 全局：当前 OS 用户的 dispatcher、personal plugin、journal、backups（`~/.agents/ai-agent-engine-codex`）；Codex 发现面是 `$HOME/plugins/ai-agent-engine-codex`；Cursor 发现面是 `$HOME/.cursor/skills/ae-*` 真实拷贝。
- 项目本地：`AGENTS.md`、`docs/**`、AI memory、过程记录、Git 历史；不因全局安装而迁移。
