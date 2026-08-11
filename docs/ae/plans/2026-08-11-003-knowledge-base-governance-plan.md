---
type: plan
status: completed
date: 2026-08-11
title: knowledge-base-governance
format: human-readable-plan
sharded: false
archive: docs/00-process/archive/2026-08/knowledge-base-governance/summary.md
experience: docs/ae/experience/2026-08-11-knowledge-base-governance.md
---

# 知识库治理第一批实施计划（2026-08-11）

## 背景

依据 `docs/ae/prds/2026-08-11-knowledge-base-governance-prd.md`（R1-R8、NFR1-NFR3、D1-D4）。四项用户已确认的决策：需求正典目录 = `docs/ae/prds/`；init 对新项目停建 `docs/ai-memory`；`external-samples/` 登记保留；gate/evidence 保留 3 个月 + review-package 指纹化。

## Global Constraints

- 不触碰 fullstack 并行会话文件集（`ae-backend`、`ae-sql`、`ae-web-app`、`ae-web-forge`、`ae-debug` references 及其过程记录）；共享文件（`package.json`、`plugin.json`、README 双语）仅字段级/追加式编辑。
- 双 SemVer 0.3.21 -> 0.3.22 同步；README 双语追加 `### 0.3.22` 条目。
- skill 源树 `plugins/ai-agent-engine-codex/skills/` 与镜像 `.agents/skills/` 逐字节一致。
- 历史文档不改写；存量项目的 `docs/ai-memory` 不删除、不迁移。
- 行为变更按 TDD：先改/加测试看失败，再实现转绿。
- 交付门槛：`npm run check`、`npm test`、`npm run check:smoke` 全绿。

## Implementation Units

### U1 - 需求单通道（R1、R2、R3）

- Depends on: none
- Files: `plugins/ai-agent-engine-codex/skills/ae-brainstorm/SKILL.md` 与镜像；删除 `plugins/ai-agent-engine-codex/skills/ae-brainstorm/references/requirements-capture.md` 与镜像；`plugins/ai-agent-engine-codex/scripts/ae-tools/recovery.mjs`；`plugins/ai-agent-engine-codex/scripts/ae-tools/init.mjs`（directories 增加 `docs/ae/prds`）；`plugins/ai-agent-engine-codex/scripts/ae-tools/init-templates/{en,zh-CN}/aeReadme.md`；`docs/ae/README.md`；`tests/skills-docs.test.mjs`；`tests/ae-tools.test.mjs`（recovery 覆盖 prds 的新用例）
- 内容：ae-brainstorm 第 11 步改为"持久化需求写入 `docs/ae/prds/`，输出契约复用 `../ae-prd/references/requirements-capture.md`；探索性记录（视角碰撞、选项对比）可留在 `docs/ae/brainstorms/`"；recovery specs 增加 `['requirements', docs/ae/prds, /prd\.md$/]`，brainstorms 旧通道保留；aeReadme 模板与本仓 README 更新目录说明（prds 为需求正典、brainstorms 为探索记录、其余子目录按需创建、证据保留见归档规则）。
- 验证：`npm test`（先红后绿）、`node scripts/check-skill-mirror.mjs`、`node scripts/check-skill-contract.mjs`。

### U2 - init 停建 docs/ai-memory（R4、R5）

- Depends on: U1（共享 init.mjs 与 aeReadme 编辑，避免交叉冲突）
- Files: `plugins/ai-agent-engine-codex/scripts/ae-tools/init.mjs`；删除 `init-templates/{en,zh-CN}/memoryReadme.md`；`plugins/ai-agent-engine-codex/skills/ae-init/SKILL.md` 与镜像；`plugins/ai-agent-engine-codex/skills/ae-help/references/capability-catalog.json` 与镜像；`INSTALL.md`；`INSTALL.zh-CN.md`；`README.md` / `README.en.md` 结构说明段；`docs/ae/references/codex-five-layer-architecture.md`；`docs/08-ai-memory/03-key-workflows.md`；`docs/08-ai-memory/05-decision-log.md`（追加条目）；`tests/ae-tools.test.mjs`（init 输出契约新用例）
- 内容：init 的 directories/files/templateKeys 移除 ai-memory 项；新用例在临时目录断言 dry-run 输出含 `docs/ae/prds` 且不含 `docs/ai-memory`；现行契约文档改为"0.3.22 起 init 不再创建；存量项目目录保留"；决策日志追加 D2 决策。
- 验证：`npm test`（先红后绿）、临时目录 `init --dry-run` JSON 检查、`npm run check:contracts`。

### U3 - 证据保留策略（R6、R7）

- Depends on: none（与 U1/U2 无共享文件冲突面）
- Files: `plugins/ai-agent-engine-codex/scripts/ae-tools/review.mjs`；`tests/ae-tools.test.mjs`（3 个 review-package 用例调整 + 指纹断言）；`plugins/ai-agent-engine-codex/scripts/ae-tools/init-templates/{en,zh-CN}/archiveRules.md`；`docs/00-process/templates/archive-rules.md`
- 内容：review-package 产物移除 `## Diff` 全文段，新增 base/head 短哈希与逐字节重建命令（`git diff -U10 <base>..<head>`）；返回结构 `inventory`/`artifact` 字段语义不变；归档规则三处新增"证据保留"章节（gates 与 evidence artifacts 3 个月、超期移入 `docs/ae/archive/` 对应月份、review-package 仅指纹、历史全量 .diff 确认无引用后可删）。
- 验证：`npm test`（先红后绿）。

### U4 - external-samples 登记（R8）

- Depends on: none
- Files: `docs/external-samples/README.md`（新增）
- 内容：登记用途（claim checker 样本语料）、来源（work 项目拷贝、源项目未修改）、引用方（`docs/ae/integrity/work-docs-*.md`）、保留条件（integrity 引用期间不移动不改写）。
- 验证：`node scripts/check-claims.mjs --dry-run`。

### U5 - 版本递增与 README 版本记录（NFR1）

- Depends on: U1、U2、U3
- Files: `package.json`、`plugins/ai-agent-engine-codex/.codex-plugin/plugin.json`、`README.md`、`README.en.md`
- 内容：0.3.21 -> 0.3.22；README 双语追加 `### 0.3.22（2026-08-11）` / `### 0.3.22 (2026-08-11)`，含摘要、验证命令与证明边界（分发合同与安装面一致性，不代表目标项目运行时验收）。
- 验证：`node scripts/check-release-notes.mjs`。

### U6 - 终验、自审与归档（NFR2）

- Depends on: U4、U5
- Files: `docs/00-process/active/knowledge-base-governance/progress.md`（过程记录，完成后移至 `docs/00-process/archive/2026-08/knowledge-base-governance/`）
- 内容：全量验证；对本批 diff 做双 lane 自审（reviewer + architect）；生成最终 gate 证据；按归档规则把本任务过程记录归档（以身作则验证 A1 规则可执行）。
- 验证：`npm run check`、`npm test`、`npm run check:smoke`、gate JSON 落盘。

## 风险与回滚

- 风险：并行 fullstack 会话同时编辑 `package.json`/README。缓解：本批仅做版本字段与追加条目的最小编辑，实施 U5 前重新 `git status`/读取确认基线；若版本 0.3.22 被占用则顺延到 0.3.23 并同步 README 条目。
- 风险：删除 brainstorm capture 模板导致未知引用悬空。缓解：实施前全库 grep `requirements-capture` 清点引用面；`check-skill-contract.mjs` 与 `npm test` 兜底。
- 风险：review-package 产物变更破坏依赖其内容的消费方。缓解：`ae-review` skill 只依赖返回 JSON 的 `inventory`/`artifact.path`（已核对 SKILL 文本），产物内文仅供人读；测试同步更新。
- 回滚：基线已提交（结构性重构与 fullstack 版本字段除外），所有改动可按文件 `git restore`；删除的模板文件可从 HEAD 恢复。
