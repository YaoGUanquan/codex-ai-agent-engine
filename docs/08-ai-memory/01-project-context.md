<!-- ae-codex:init managed -->
# 项目上下文

## 项目

- 名称：ai-agent-engine-codex
- 描述：Codex-native AE-style workflow skills referencing https://gitee.com/jiangqiang1996/ai-agent-engine.

## 检测信号

- Node.js package.json
- package type: module
- README.md
- README.en.md
- README.zh-CN.md
- INSTALL.md
- INSTALL.zh-CN.md
- project-local Codex agents
- plugin directory
- scripts directory
- docs directory

## 重要路径

- README.md
- README.en.md
- README.zh-CN.md
- INSTALL.md
- INSTALL.zh-CN.md
- .agents
- plugins
- scripts
- docs

## 可用脚本

- check: `npm run check`（轻量：syntax + contracts）
- check:all: `npm run check:all`（含 install/global-install 烟测）
- test: `npm test`（域拆分测试：`global-install`, `contracts`, `ae-tools`, `skills-docs`, `install-scripts`）
- help: `node scripts/ae-tools.mjs help`

## 当前约定

- 项目级安装默认使用双语 skill 列表元数据；`--lang en|zh-CN|bilingual` 仍可显式覆盖。
- 插件源目录 `plugins/ai-agent-engine-codex/skills` 与本项目安装镜像 `.agents/skills` 必须保持一致。
- 外部 agent/skill 仓库研究默认走 `ae-skill-audit`，先审计再决定是否改造为本地 AE skill。
- `ae-tools` 命令实现位于 `plugins/ai-agent-engine-codex/scripts/ae-tools/`；根 `scripts/ae-tools.mjs` 仅为薄包装。
- 可分发插件改动必须同步递增根 `package.json` 与 `plugin.json` 的 SemVer，并在 README 双语与 CHANGELOG 双语各追加版本条目（README 仅保留最近 5 条，完整历史在 `CHANGELOG.md`/`CHANGELOG.en.md`；当前分发版本以根 `package.json` 为准）。
- 根 `scripts/update-project.mjs` 等为薄包装；`update-project` 唯一实现位于 `plugins/ai-agent-engine-codex/scripts/`。
- 声明式知识图谱：`docs/08-ai-memory/00-registry.json`；维护者策展图：`docs/ae/graphs/maintainer-artifact-graph.md`；浅层依赖图 CLI 不持久化 `docs/ae/graphs/graph.json`。
