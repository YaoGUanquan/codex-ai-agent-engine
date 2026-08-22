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

## ae-tools 模块与 ESM 导入

- `node --check` 与 `check:syntax` 只做单文件语法解析，**不能**发现 `ae-tools/*.mjs` 之间的循环 import；必须在 `npm test` 中保留 DAG 守卫。
- 新增命令模块时禁止 `utils.mjs` import 任何同级模块；`utils` 是基础层。
- Init 模板文件若带 UTF-8 BOM，循环导入守卫的正则可能漏读首行 import；模板与测试读取时应剥离 BOM。
- 不要在未验证行为基线前删除 `review.mjs` 对 `graph.mjs` 的共享 import（如 `buildShallowGraph`）；当前 DAG 是有意设计，不是待消除耦合。

## 全局 AE 与项目数据边界

- 全局安装只统一 dispatcher、skills 和 personal Codex plugin；`AGENTS.md`、`docs/**`、AI memory、图谱和 archive 仍按项目根保存，不能迁移到用户目录。
- 默认 global preview 不发现 consumer，也不自动卸载项目级副本；项目退役必须使用显式 manifest，并在 preview/apply 中同时传 `--retire-modified` 才能处理修改或未知的历史 AE 副本。
- 不要直接操作 `.codex/plugins/cache`，也不要手工删除项目级文件。安装器只删除经过归属与指纹验证的 AE 路径，并保留备份和 journal 直到用户显式 purge。
- 分发源仓库的维护镜像位于 `.ae-source/skills`，不得放回 `.agents/skills`；否则会与 personal plugin 重复发现。
- Cursor 发现 AE 技能靠 `~/.cursor/skills/ae-*` 真实拷贝，不靠 Codex plugin list，也不靠技能目录上的 symlink/junction（Cursor 不跟踪这些链接）。全局 apply 之后必须新开 Cursor 对话；不要把技能拷进 `~/.cursor/skills-cursor`。
- 删除 0.3.29 遗留 Cursor 联接时只能 unlink 联接节点，禁止 recursive 删除，否则会顺着 junction 删掉 personal 插件文件。对 0.3.30 起的真实拷贝可以按普通目录递归删除。

## 并行会话与版本协调

- 多个 agent 会话可能同时修改同一仓库；`package.json`、README/CHANGELOG 双语版本记录和 check 脚本分层是常见冲突点。
- 只暂存本会话拥有的文件集；对共享文件使用字段级或追加式编辑（版本号、README/CHANGELOG 条目），不要覆盖另一会话的 check 分层或脚本拆分。
- 结构性重构与技能文档优化应使用零交集文件集；若另一会话已占用版本号，顺延 SemVer 并同步 README/CHANGELOG 条目。
- 推送前在隔离 worktree 中检出待发布 commit 跑 `npm test`，避免工作区中未提交的另一会话改动污染验证结论。

## 框架指导与旧栈命中率

- 前端 `react/vue/svelte/angular-guidance` 与后端六语言指导以现代 idioms 为基线；Svelte 4 stores、NgModule、Options API 或 niche 后端栈依赖 SKILL 中的「匹配仓库既有约定」兜底，细则命中率会下降。
- 不要在未遇到真实项目缺口前预先堆满每个旧栈变体；在 experience 或 roadmap 中记录按需补充策略。

## 结构性重构与 check 分层

- 默认 `npm run check` 不含 install-smoke；发布前必须额外跑 `npm run check:smoke` 或 `npm run check:all`。
- `ae-tools/` 模块之间禁止循环导入；`node --check` 无法检测 ESM 循环，依赖 `tests/ae-tools.test.mjs` 守卫。
- 根 `scripts/update-project.mjs` 必须是薄包装；若在根目录复制完整实现，将与 `install-project.mjs` 写入目标项目的包装路径漂移。
- install-smoke 临时目录 `.tmp-install-smoke-checks/` 已 gitignore；异常中断可能留下 UUID 子目录，可安全删除。

## 记忆蒸馏与 registry 边界

- `00-registry.json` 的关系目标只接受 `AGENTS.md` 或 `docs/ae/**` 下的 Markdown；指向 `docs/99-archive/**` 分片或 JSON watchlist 的关系会被 `check-memory-knowledge-contract` 直接拒绝。归档指针写在正典 Markdown（源文件索引节、`00-index.md`），不要写进 registry。
- `05-decision-log.md` 蒸馏后约 14.5KB，贴近 15KB 预算；追加前先确认是长期决策，执行类知识写 `03-key-workflows.md`、本文件或 `docs/ae/experience/`。
- `skill-audit --watch` 的 `unavailable` 是新鲜度失败，不是“源未变”。`stale` 只列出 `affectedSkills`，不能直接改写 skill。
- 本机 Windows 上 `report`/`issue` 与 `static-server` 的 symlink-escape 测试可能因 `EPERM` 失败；这是隔离临时目录权限问题，不否定 `--watch` 或 skill 文本锁。

## 全栈 skill 与并行会话

- 多会话共享工作区时，对 `package.json`、`README` 仅做字段级或追加式编辑；skill 文件集合应零交集或明确归属。
- `check-skill-mirror` 失败通常因只改了插件源或 `.ae-source/skills` 维护镜像之一。
- 语言指导按仓库栈选读；对未覆盖语言强行套用 Java/Go 等指导会发明与仓库不一致的结构。
