---
description: 卸载当前项目的 AE OpenCode 运行时，一次授权后删除项目内文件
model: $standard
subtask: false
---

卸载当前项目的 AI Agent Engine OpenCode 运行时。

1. 在项目根目录运行 `node .opencode/ai-agent-engine/scripts/uninstall.js --detect` 检测安装状态。
2. 展示将删除的项目内插件源码安装目录 `.opencode/ai-agent-engine` 和桥接文件 `.opencode/plugins/ae-server.js`。
3. 使用 question 工具请求一次明确授权。
4. 用户授权后执行：

```bash
node .opencode/ai-agent-engine/scripts/uninstall.js --scope project --yes
```

完成后提示用户重启 OpenCode。本专用分支不处理全局安装。
