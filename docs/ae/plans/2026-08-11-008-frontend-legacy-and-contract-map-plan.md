---
type: plan
status: completed
date: 2026-08-11
title: frontend-legacy-and-contract-map
format: human-readable-plan
sharded: false
archive: docs/00-process/archive/2026-08/frontend-legacy-and-contract-map/summary.md
experience: docs/ae/experience/2026-08-11-frontend-legacy-and-contract-map.md
---

# 前端旧栈对照与契约映射实施计划（2026-08-11）

依据 `docs/ae/prds/2026-08-11-frontend-legacy-and-contract-map-prd.md`。

## Global Constraints

- 插件内容变更：`plugins/ai-agent-engine-codex/skills/ae-web-app/references/` 与 `.agents/skills/ae-web-app/references/` 三份指导文件逐字节一致；双 SemVer 同步 0.3.26；四文件版本条目齐备。
- 对照节先红后绿：先加回归用例（红），再补对照节（绿）。
- 对照节最小化：每框架 ≤6 条，只映射既有 trap，不做绝对可用性断言（Svelte runes 除外）。
- 交付门槛：`npm run check`、`npm test`、`npm run check:smoke` 全绿。

## Implementation Units

### U1 - 对照节回归用例先行（R1，红）
- Files: `tests/skills-docs.test.mjs`
- 内容：仿照后端指导用例（1079 行起）新增 `legacy frontend stack counterparts are present in source and mirror skills`：遍历 `svelte/angular/vue-guidance.md` 三份文件，断言插件与镜像逐字节一致、`Apply this guidance only when the repository uses` 保留、对照节标题存在（`## Svelte 4 Counterparts` / `## NgModule-Era Counterparts` / `## Options API Counterparts`）及每份 1-2 个关键短语（如 `derived` stores、`trackBy`、`Vue.set` 类相对表述）。
- 验证：`node --test --test-name-pattern "legacy frontend" tests/skills-docs.test.mjs` 先红。

### U2 - 三份指导补对照节（R1，绿）
- Files: `plugins/ai-agent-engine-codex/skills/ae-web-app/references/{svelte,angular,vue}-guidance.md` 及 `.agents` 镜像（共 6 文件）
- 内容：在 Common Defect Traps 之后各加一节：Svelte 4（stores/`$:`/`createEventDispatcher`、禁混 runes）、NgModule 时代（模块归属、async pipe 或仓库既有 teardown 模式、RxJS 派生、OnPush 引用替换、`*ngFor trackBy`、`loadChildren`）、Options API（`computed:` 优先、`watch` 纪律、props+`$emit` 单向流、既有 store 映射、Vue 2 反应性限制、禁混 `<script setup>`）。
- 验证：U1 用例转绿；`node scripts/check-skill-mirror.mjs` 通过。

### U3 - 契约映射说明（R2）
- Files: `docs/ae/references/frontend-quality-contract-map.md`（新建，`<!-- ae-codex:reference -->` 头）
- 内容：5 组对应关系表（键盘与焦点、可访问性要素、响应式与触控、布局与交互目标稳定、motion/reduced-motion），每组引用三份文件的具体条目号；空档记录（FE 镜头无 motion 查项、browser-acceptance 对 a11y 仅键盘维度）；测试锁现状（skills-docs motion 用例）；相邻面说明（框架指导 defect traps ↔ FE 镜头反应性查项）；边界声明（描述性、不构成第 4 份契约面、不建校验脚本）。
- 验证：`node scripts/check-ae-artifacts.mjs` 通过。

### U4 - 版本与发布记录（R3）
- Files: `package.json`、`plugins/ai-agent-engine-codex/.codex-plugin/plugin.json`（0.3.26）、`README.md`、`README.en.md`（版本节插入 0.3.26、移除 0.3.21 条目）、`CHANGELOG.md`、`CHANGELOG.en.md`（头部插入 0.3.26）
- 验证：`node scripts/check-release-notes.mjs` 通过。

### U5 - 路线图、决策日志与 registry（R4）
- Files: `README.md`、`README.en.md`（第 7/10 条划线改写为完成摘要、引导句收尾）、`docs/08-ai-memory/05-decision-log.md`（追加提前完成决策）、`docs/08-ai-memory/00-registry.json`（decision-log → 本批 PRD、映射说明两条关系）
- 验证：`node scripts/check-memory-knowledge-contract.mjs --root .` 通过。

### U6 - 批次工件与交付（R5）
- Files: `docs/ae/experience/2026-08-11-frontend-legacy-and-contract-map.md`、`docs/00-process/archive/2026-08/frontend-legacy-and-contract-map/summary.md`、PRD/plan frontmatter 状态更新为 completed
- 验证：`npm run check`、`npm test`、`npm run check:smoke`；gate 记录（本地）。

## 风险与回滚

- 风险：对照节写出与事实不符的 API 可用性断言（如 `takeUntilDestroyed` 在 NgModule 应用中其实可用）。缓解：NFR3 只作相对表述；评审时逐条核对。
- 风险：README 版本窗口处理出错（0.3.21 移出后子集校验失败）。缓解：CHANGELOG 为完整历史已含 0.3.21，`check-release-notes` 即时验证。
- 风险：镜像漏改一侧。缓解：`check-skill-mirror` 与 U1 用例双重锁定。
- 风险：映射说明被误读为新契约。缓解：文档首段与边界节明示描述性定位；不进插件目录。
- 回滚：`git restore` 即可整体回退；版本号与四文件条目同批回退，无安装面残留。
