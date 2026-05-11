<!-- ae-codex:init managed -->
# 项目上下文

## 项目

- 名称：ai-agent-engine-codex
- 描述：Codex-native AE-style workflow skills referencing https://gitee.com/jiangqiang1996/ai-agent-engine.

## 检测信号

- Node.js package.json
- package type: module
- README.md
- README.zh-CN.md
- project-local Codex agents
- plugin directory
- scripts directory
- docs directory

## 重要路径

- README.md
- README.zh-CN.md
- .agents
- plugins
- scripts
- docs

## 可用脚本

- check: node --check scripts/ae-tools.mjs && node --check scripts/install-project.mjs && node --check scripts/update-project.mjs && node --check scripts/update-ae-codex.mjs && node --check scripts/set-repository.mjs && node --check scripts/set-language.mjs && node --check scripts/set-ae-language.mjs && node --check plugins/ai-agent-engine-codex/scripts/ae-tools.mjs && node --check plugins/ai-agent-engine-codex/scripts/update-project.mjs && node --check plugins/ai-agent-engine-codex/scripts/set-language.mjs
- help: node scripts/ae-tools.mjs help
