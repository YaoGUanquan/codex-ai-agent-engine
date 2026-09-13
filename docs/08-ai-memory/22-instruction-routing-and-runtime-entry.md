# 指令路由与运行时入口

## 稳定决策

- 插件唯一源为 `plugins/ai-agent-engine-codex/skills`；`.ae-source/skills` 是维护镜像，consumer `.agents/skills` 与 Cursor 用户技能是安装副本。能力盘点排除生成目录。
- 三个前端技能分别负责视觉实现、Web 行为和宽泛需求分流；已有决策不重复 intake。按需加载参考资料，保留安全与浏览器证据门禁。
- `ae-help/scripts/resolve-runtime-entry.mjs` 随技能分发，只读解析项目 wrapper，缺失时才选当前用户 dispatcher。损坏链接、无效文件类型及非 ENOENT 错误不触发版本切换。
- `node "$aeEntry"` 为统一命令模板。解析器不执行目标命令、不改变 cwd、不重试失败写入；变量仅在当前 shell 有效。help 为实际启动入口输出 shell-safe 赋值。
- 模型适配按能力、风险和验收边界，不以模型名称假设工具或 token 收益。

## 验证与安装边界

- Windows 文件符号链接 fixture 的 EPERM 是环境能力问题，不用删除安全断言或安装全局插件掩盖。管理员与普通进程的能力可不同。
- PowerShell 测试探测 `pwsh`；Windows PowerShell 终端存在不等于 `pwsh` 可用。统计必须保留 skipped，并区分用户提交日志和代理执行结果。
- Cursor 单独同步不等于 Codex personal plugin 或全局 dispatcher 更新；三者可处于不同版本。下次完整安装若将 Cursor 判为 modified，应先比对已知源版本和备份，不自动使用 retire-modified。
- 文件哈希一致不证明当前 Cursor 窗口已加载；须新对话或重载后确认。

## 证据入口

- 原审计：`docs/ae/solutions/2026-09-05-current-plugin-instruction-audit.md`。
- 优化第一批：`docs/ae/solutions/2026-09-13-instruction-audit-optimization.md`。
- 入口计划：`docs/ae/plans/2026-09-13-001-runtime-entry-unification-plan.md`。
- 交付汇总：`docs/ae/experience/2026-09-13-instruction-runtime-delivery.md`。
- 图谱：`docs/ae/graphs/maintainer-artifact-graph.md`。
- 回归：`tests/instruction-audit.test.mjs`、`tests/runtime-entry.test.mjs`。
