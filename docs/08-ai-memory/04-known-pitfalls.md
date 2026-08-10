<!-- ae-codex:init managed -->
# 已知坑点

## 中文与编码

- Windows/PowerShell 输出可能把合法 UTF-8 中文显示成乱码。
- 修改生成的 Markdown 前，先用显式 UTF-8 读取验证。
- 不要根据默认 `Get-Content` 或控制台显示判断中文 Markdown 已损坏；优先使用 `Get-Content -Encoding UTF8` 或 Git diff 验证。

## 认证冒烟请求配置

- 给用户填写的 token 配置绝不能是空文件；必须包含方法、路径、填写步骤和 `REPLACE_WITH_LOCAL_TOKEN`。
- 含中文填写说明的请求配置必须用 UTF-8 无 BOM 写入（编辑器 Write 或 Node `writeFileSync(..., 'utf8')`）。
- 不要用 PowerShell `Out-File`、默认 `Set-Content` 或 `>` 重定向写这类配置；它们容易变成 UTF-16 或乱码。
- Agent 交接后不得读取用户已填写的配置；只能按绝对路径引用。

## Init 与 Recovery

- `init` 生成的可续跑过程笔记位于 `docs/00-process/active`，不能只让 `recovery` 扫描 `docs/ae`。
- 安装示例里清理临时目录前后都可以运行 init，但命令必须显式进入 `$target` 或 `"$target"`。

## Phase 2 tooling boundaries

- `ae-graph-build` / `ae-graph-query` are shallow read-only helpers. Do not describe them as a full graph database, MCP server, freshness tracker, shard manager, or preview UI.
- Do not expose `ae-merge-branch` as a skill until Git write authorization, rollback, and evidence requirements are explicitly stronger.
- Do not assume OpenCode dynamic Chrome DevTools MCP registration exists in Codex. Route browser checks through `ae-test-browser` and the browser tools actually available in the session.

## 全局 AE 与项目数据边界

- 全局安装只统一 dispatcher、skills 和 personal Codex plugin；`AGENTS.md`、`docs/**`、AI memory、图谱和 archive 仍按项目根保存，不能迁移到用户目录。
- 默认 global preview 不发现 consumer，也不自动卸载项目级副本；项目退役必须使用显式 manifest，并在 preview/apply 中同时传 `--retire-modified` 才能处理修改或未知的历史 AE 副本。
- 不要直接操作 `.codex/plugins/cache`，也不要手工删除项目级文件。安装器只删除经过归属与指纹验证的 AE 路径，并保留备份和 journal 直到用户显式 purge。
- 在分发源仓库中同时看到本地 `.agents/skills` 与 personal plugin 属于预期开发例外；这不代表 consumer 项目仍有项目级残留。
