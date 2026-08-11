---
type: plan
status: completed
date: 2026-08-11
title: fullstack-skill-optimization
format: human-readable-plan
sharded: false
archive: docs/00-process/archive/2026-08/fullstack-skill-optimization/summary.md
experience: docs/ae/experience/2026-08-11-fullstack-skill-optimization.md
---

# 前后端开发技能优化计划（2026-08-11）

## 背景

用户要求：分析当前项目全部 40 个 skill，并优化使其更适合前后端开发（前端 + 后端并重）。用户补充明确：后端主力语言为 Java、Go、Python、C、C++、C#，其他后端语言也必须兼容（不得因缺少专门指导而失效）。

盘点结论（差距分析）：

- 前端实现侧已有 4 套框架指导（`ae-web-app` 的 react/vue/svelte/angular-guidance），而 `ae-backend` 刻意框架无关，references 合计约 26 行，无任何语言级指导，前后端能力严重不对称。
- `ae-debug` 只有 Frontend Failure Quick Map，无后端与前后端边界的对等速查表。
- 前后端契约对齐目前只存在于 `ae-design` 的映射表（设计层）；实现层的 `api-contract-checklist.md` 仅 5 条泛化条目，缺少字段命名、错误包络、鉴权传输、分页、时间/精度序列化、幂等、版本化、CORS 等实际联调高频项。
- `ae-sql` 无 references，缺少危险操作分级与迁移安全检查表。
- `ae-test-api`（验证侧）、`ae-web-forge`（路由侧）结构完好，只需最小接线。

## Global Constraints

- `plugins/ai-agent-engine-codex/skills/` 为源，`.agents/skills/` 为镜像，改动必须双树逐字节一致（`node scripts/check-skill-mirror.mjs`）。
- skill 正文与现有风格一致，使用英文撰写；语言指导采用与前端指导相同的四段结构（Structure And Conventions / Common Defect Traps / 语言特定边界 / Error And Response Contract）。
- 兼容性规则：语言指导只在仓库确实使用该栈时应用；未覆盖的后端语言回退到「沿用仓库既有约定，不发明新结构」，保持 `ae-backend` 框架无关的默认行为不变。
- 不触碰另一会话未提交的结构性重构改动（`plugins/.../scripts/**`、根 `scripts/check-*.mjs`、`tests/**`）；`package.json`、`plugin.json`、`README.md`、`README.en.md` 仅做版本号字段递增与追加 0.3.21 条目的最小编辑。
- 可分发插件内容变化，版本 0.3.20 -> 0.3.21，双处一致；README 双语追加 `### 0.3.21` 条目（摘要、验证命令、证明边界）。

## Implementation Units

### U1 - ae-backend 语言指导与工作流扩充

- Depends on: none
- Files: `plugins/ai-agent-engine-codex/skills/ae-backend/SKILL.md`, `references/backend-workflow.md`, 新增 `references/java-guidance.md`、`references/go-guidance.md`、`references/python-guidance.md`、`references/c-guidance.md`、`references/cpp-guidance.md`、`references/csharp-guidance.md`
- 内容：SKILL.md 工作流加「按仓库栈选读语言指导」步骤（Java/Go/Python/C/C++/C# 六主力 + 其他语言回退规则）；backend-workflow.md 增加栈探测与跨边界升级提示。六份语言指导各约 35-45 行，聚焦后端 API/服务实现的缺陷陷阱（事务、并发、内存/资源、序列化、错误契约、测试挂载点）。
- 验证：`node scripts/check-skill-contract.mjs`、`npm test`。

### U2 - 前后端契约对齐检查表与接线

- Depends on: none
- Files: `plugins/ai-agent-engine-codex/skills/ae-backend/references/api-contract-checklist.md`, `plugins/ai-agent-engine-codex/skills/ae-web-app/SKILL.md`, `plugins/ai-agent-engine-codex/skills/ae-web-forge/SKILL.md`
- 内容：checklist 扩充为语言无关的 FE/BE 契约对齐检查表（字段命名/大小写、错误包络与 UI 状态映射、状态码语义、鉴权传输与 CORS、分页/排序、日期时间与数字精度序列化、幂等与重试、版本化与破坏性变更、上传下载、OpenAPI 同步指向 `ae-swagger-parser`/`ae-test-api`）。`ae-web-app` 在跨后端协调步骤引用该检查表；`ae-web-forge` 在 Q3 路由与返工循环提示契约对齐。
- 验证：`npm test`（skills-docs 断言不回归，特别是 ae-web-app 的 doesNotMatch 断言）。

### U3 - ae-debug 后端与边界故障速查表

- Depends on: none
- Files: `plugins/ai-agent-engine-codex/skills/ae-debug/references/debugging-workflow.md`
- 内容：新增 `## Backend Failure Quick Map`（5xx/栈追踪、401/403 鉴权、404/405 路由与代理、400/422 校验与 DTO 失配、超时与慢查询（N+1、连接池）、数据错误（序列化/时区/精度/事务隔离/缓存）、本地好线上坏（环境/配置/迁移漂移））与 `## Frontend-Backend Boundary Quick Map`（CORS 预检、Cookie/SameSite、Content-Type、字段大小写失配、时区序列化、base URL/代理改写、401 刷新循环、上传大小限制）。
- 验证：`npm test`。

### U4 - ae-sql 安全检查表

- Depends on: none
- Files: `plugins/ai-agent-engine-codex/skills/ae-sql/SKILL.md`, 新增 `references/sql-safety-checklist.md`
- 内容：危险操作分级（读 / 可逆写 / 不可逆写 / 锁风险 DDL）、迁移前后向配对与部署顺序、索引与锁影响、跨引擎方言差异提示（Postgres/MySQL/SQLite/SQL Server）；SKILL.md 工作流引用。
- 验证：`node scripts/check-skill-contract.mjs`、`npm test`。

### U5 - 镜像同步与全量验证

- Depends on: U1, U2, U3, U4
- Files: `.agents/skills/**`（与源树对应的全部改动文件）
- 内容：将源树改动逐文件同步到镜像树，保证逐字节一致。
- 验证：`node scripts/check-skill-mirror.mjs`。

### U6 - 版本递增与 README 版本记录

- Depends on: U5
- Files: `package.json`, `plugins/ai-agent-engine-codex/.codex-plugin/plugin.json`, `README.md`, `README.en.md`
- 内容：0.3.20 -> 0.3.21；README 双语追加 `### 0.3.21（2026-08-11）` / `### 0.3.21 (2026-08-11)` 条目，含修改摘要、验证命令与证明边界（技能文档与分发合同一致性，不代表目标项目运行时验收）。
- 验证：`node scripts/check-release-notes.mjs`、`npm run check`、`npm run check:smoke`、`npm test`。

## 风险与回滚

- 风险：与在途 structural-debt-refactor 会话共享工作区，`package.json`/`README` 存在并发编辑可能。缓解：对共享文件只做字段级/追加式最小编辑；技能文件与该会话的文件集合零交集。
- 风险：新增指导内容与既有测试断言冲突。缓解：已核查 `tests/*.test.mjs` 对 `ae-backend`/`ae-sql`/`debugging-workflow`/`api-contract-checklist` 无内容级断言；对 `ae-web-app`/`ae-web-forge` 的断言（含 doesNotMatch）在编辑时规避。
- 回滚：全部为文档与版本字段改动，可用 git 按文件恢复；不影响脚本与安装行为。

## 完成记录（2026-08-11）

- 经验：`docs/ae/experience/2026-08-11-fullstack-skill-optimization.md`
- 归档：`docs/00-process/archive/2026-08/fullstack-skill-optimization/summary.md`
- 验证：mirror 127 文件、`npm test`、`npm run check`、`npm run check:smoke` 全绿
