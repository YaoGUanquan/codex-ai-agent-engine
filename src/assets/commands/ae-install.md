---
description: 安装或更新当前项目的 AE OpenCode 运行时，一次授权后执行原子更新
model: $standard
subtask: false
---

安装或更新当前项目的 AI Agent Engine OpenCode 运行时。

1. 明确展示目标路径：`<项目根目录>/.opencode/ai-agent-engine` 和 `<项目根目录>/.opencode/plugins/ae-server.js`。
2. 使用 question 工具请求一次明确授权。说明操作会覆盖当前项目内的旧插件运行时，存在本地构建失败风险；不执行 `git reset`、`git clean`、`git pull` 或写入全局配置。用户未授权时停止。
3. 用户授权后，在项目根目录执行：

```bash
node .opencode/ai-agent-engine/scripts/install.js --yes project
```

安装器先在暂存目录构建，验证成功后才激活运行时和桥接；失败会恢复原有安装。完成后提示用户重启 OpenCode。

本专用分支仅支持项目级安装，不支持 `global`。
