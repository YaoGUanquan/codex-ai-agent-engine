# 指令优化与运行时入口交付

## 范围

0.3.45 整理目录与前端路由；0.3.46 统一运行时入口。本次按用户要求将当前未提交成果分为实现/发布与知识/证据两批提交到 main。提交和推送实际结果以 Git 历史与最终响应为准，不预先声称已推送。

## 验证来源

| 来源 | 命令 / 检查 | 结果 | 边界 |
| --- | --- | --- | --- |
| 代理当前进程，前序运行 | `npm.cmd test` | 185 pass、2 fail、0 skipped | 两项文件符号链接创建 EPERM |
| 代理当前进程，前序运行 | 聚焦三文件测试 | 55 pass、0 fail、0 skipped | 包含 PowerShell 和 Bash |
| 用户提供的管理员终端完整输出 | `npm.cmd test`，配置 `AE_TEST_POSIX_SHELL` | 185 pass、0 fail、2 skipped，约 49 秒 | 两项原符号链接安全测试通过；两项 pwsh 测试跳过 |
| 代理前序运行 | `npm.cmd run check`、`npm.cmd run check:smoke` | 通过 | claims dry-run 警告不等于声明运行验证 |
| Cursor 定向更新 | 文件 SHA-256 对比 | 更新 14 技能，40 技能/133 文件一致 | 非桌面 UI 加载证明 |

用户提供的完整输出显示 PowerShell 环境变量拼写正确。两项跳过分别为 documented bootstrap 和 help assignment 的 PowerShell 测试；不能将这次完整运行写成 187/187、零跳过。结合此前专项通过，可覆盖功能检查，但仍保留单次完整零跳过运行缺口。

## Cursor 更新与恢复

Cursor 用户技能使用当前项目 0.3.46 内容，更新前确认与旧安装基线一致，无自定义漂移，并备份受影响技能。未更新 Codex personal plugin 或全局 dispatcher，未修改其他 Cursor 技能。备份位于用户级 `.cursor/ae-skill-backups/`，具体机器路径不保留到仓库。

后续完整全局安装可能将独立更新过的 Cursor 副本与旧 personal plugin 比较而报告 modified；先检查源版本和哈希，不自动覆盖未知修改。恢复仅针对已备份的任务技能，不递归删除链接目标。

## 状态与剩余工作

本次 Git 交付前重跑：聚焦测试 55/55、0 skipped；`npm.cmd run check`、`npm.cmd run check:smoke`、`git diff --check` 通过。注册表初次检查拒绝插件路径关系目标，改为关联 `docs/ae` 计划后通过，当前 22 个记忆文档、87 条声明关系。浅层图谱命令只读执行，未生成持久化 `graph.json`。

本地功能、指令镜像和安装合同验证通过；用户运行补充证明符号链接安全断言通过。完整零跳过运行、当前 Cursor 窗口加载、真实模型路由/token、认证 API 和部署未验证。未为这些知识更新升级插件版本，因为本轮仅补充文档和证据。

入口解析不执行命令、项目优先且失败不换版本、shell 变量生命周期均应由后续改动继续保持。原审计 F-005 的反引号引用检查与 F-006 的统一扫描器不属于已完成范围。
