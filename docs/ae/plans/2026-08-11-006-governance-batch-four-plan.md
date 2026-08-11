---
type: plan
status: completed
date: 2026-08-11
title: governance-batch-four
format: human-readable-plan
sharded: false
archive: docs/00-process/archive/2026-08/governance-batch-four/summary.md
experience: docs/ae/experience/2026-08-11-governance-batch-four.md
---

# 知识库治理第四批实施计划（2026-08-11）

依据 `docs/ae/prds/2026-08-11-governance-batch-four-prd.md`。

## Global Constraints

- 纯仓库侧变更：`plugins/**`、`.agents/**` 零改动，不递增 SemVer，不新增 README 版本条目。
- checker 行为变更先红后绿（先改测试，再改脚本，最后迁移内容）。
- 工作区已有未跟踪的批次二/三治理文档，只做增量追加（决策日志、registry），不改写既有内容。
- 交付门槛：`npm run check`、`npm test` 全绿。

## Implementation Units

### U1 - 发布说明契约测试先行（R1，红）
- Files: `tests/contracts.test.mjs`
- 内容：重写 `check-release-notes` 用例为新契约。fixture 增加 `CHANGELOG.md`/`CHANGELOG.en.md`；正例 = 当前版本条目存在于四个文件 + README 含对应 CHANGELOG 链接 + README ≤5 条；反例 ≥4 个：CHANGELOG 缺当前版本条目、README 超 5 条、README 缺 CHANGELOG 链接、README 版本集合不是 CHANGELOG 子集；保留既有"缺摘要 bullet"反例。
- 验证：新用例先红（当前脚本不认识 CHANGELOG）。

### U2 - checker 实现（R1，绿）
- Files: `scripts/check-release-notes.mjs`
- 内容：新增 `changelogPaths = ['CHANGELOG.md', 'CHANGELOG.en.md']` 与常量 `MAX_README_ENTRIES = 5`；当前版本条目校验扩展到四文件；README 追加三项校验：版本条目计数 ≤5（超出时错误信息直接提示"把最旧条目迁移到 CHANGELOG"）、包含对应 CHANGELOG 文件名链接（README.md→CHANGELOG.md，README.en.md→CHANGELOG.en.md）、README 版本集合 ⊆ 对应 CHANGELOG 版本集合；输出 JSON 增加 `changelogs` 字段。
- 验证：U1 用例转绿。

### U3 - 历史迁移与规则文档同步（R1）
- Files: `CHANGELOG.md`、`CHANGELOG.en.md`（新建：前言 + 0.3.24→0.3.7 全部 18 条，声明 0.3.7 之前未维护发布说明）、`README.md`、`README.en.md`（版本节仅留 0.3.24→0.3.20 五条并加 CHANGELOG 链接；「推进原则/Working rule」段补 CHANGELOG；路线图第 8 条标记完成）、`AGENTS.md`（「插件分发版本」规则改为 README+CHANGELOG 双写、README 上限 5 条）、`docs/release-checklist.md`（发布前确认段同步新契约）
- 内容：迁移逐字节保留条目内容；README 版本节标题下加一行完整历史链接说明。
- 验证：`node scripts/check-release-notes.mjs` 通过；迁移无损核对（迁移前 README 条目集合 = 迁移后 README∪CHANGELOG 条目集合）。

### U4 - 过程归档收尾（R2）
- Files: `docs/00-process/active/{api-smoke-fillable-request-config,personal-marketplace-global-plugin}/progress.md` → `docs/00-process/archive/2026-08/<task>/progress.md`（git mv 新建目录移动）；`docs/00-process/active/{fullstack-skill-optimization,knowledge-base-governance}/progress.md` → 并入既有 `docs/00-process/archive/2026-08/<task>/`（无同名冲突）；移除清空后的 active 目录
- 验证：active 仅剩本批 `governance-batch-four/`；`node scripts/ae-tools.mjs tidy`（dry-run）无 done/archived-pointer 残留报告。

### U5 - 策略与评估记录（R3、R4）
- Files: `docs/08-ai-memory/05-decision-log.md`（追加一条 batch-four 决策：版本记录契约 + 归档收尾 + 旧栈按需触发边界 + 前端契约映射暂缓与复评触发）、`docs/ae/experience/2026-08-11-governance-batch-four.md`（评估证据与教训）、README 双语路线图第 7/10 条改写（并入 U3 编辑批次）
- 验证：`node scripts/check-memory-knowledge-contract.mjs --root .` 通过。

### U6 - 批次工件与交付（R5）
- Files: `docs/00-process/active/governance-batch-four/progress.md`（执行中检查点）、`docs/08-ai-memory/00-registry.json`（decision-log → 本批 PRD/经验笔记关系）、收尾时归档为 `docs/00-process/archive/2026-08/governance-batch-four/{progress.md,summary.md}` 并更新 PRD/plan frontmatter 状态
- 验证：`npm run check`、`npm test`、`node scripts/check-ae-artifacts.mjs`；gate 记录（本地）。

## 风险与回滚

- 风险：未来发布者不知道新契约仍只写 README。缓解：checker 错误信息自带迁移指引；AGENTS.md 规则与 release-checklist 同步改写。
- 风险：条目迁移丢失或改写字节。缓解：迁移后做条目集合与内容核对；不通过则 `git restore` 整体回退。
- 风险：归档移动造成引用断链。缓解：已全库 grep，旧 active 路径仅出现在历史归档表述中（不改写历史）；移动用 `git mv` 保留重命名历史。
- 风险：追加决策日志/registry 触碰批次三未提交内容。缓解：只在文件尾部/数组尾部追加；改动前后核对既有条目未变。
- 回滚：全部为仓库侧文本与移动，`git restore`/逆向 `git mv` 即可；无版本、插件、安装面影响。
