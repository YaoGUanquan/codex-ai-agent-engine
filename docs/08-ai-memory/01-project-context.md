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

- check: cmd /c npm run check
- help: node scripts/ae-tools.mjs help

## 当前约定

- 项目级安装默认使用双语 skill 列表元数据；`--lang en|zh-CN|bilingual` 仍可显式覆盖。
- 插件源目录 `plugins/ai-agent-engine-codex/skills` 与本项目安装镜像 `.agents/skills` 必须保持一致。
- 外部 agent/skill 仓库研究默认走 `ae-skill-audit`，先审计再决定是否改造为本地 AE skill。
