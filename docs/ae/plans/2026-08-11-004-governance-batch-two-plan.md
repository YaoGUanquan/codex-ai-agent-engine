---
type: plan
status: completed
date: 2026-08-11
title: governance-batch-two
format: human-readable-plan
sharded: false
archive: docs/00-process/archive/2026-08/governance-batch-two/summary.md
---

# 知识库治理第二批实施计划（2026-08-11）

## 背景

依据 `docs/ae/prds/2026-08-11-governance-batch-two-prd.md`（R1-R9、NFR1-NFR3、D1-D4）。

## Global Constraints

- skill 源树与 `.agents/skills/` 镜像逐字节一致。
- 行为变更按 TDD：先加测试看红，再实现转绿。
- 双 SemVer 0.3.22 -> 0.3.23；README 双语追加条目。
- tidy 对真实仓库执行前必须 dry-run 复核；work 项目只动 docs。
- 交付门槛：`npm run check`、`npm test`、`npm run check:smoke` 全绿。

## Implementation Units

### U1 - parseOptions 重复传参累积 + gate 验证记录（R1）

- Depends on: none
- Files: `plugins/ai-agent-engine-codex/scripts/ae-tools/utils.mjs`、`tests/ae-tools.test.mjs`
- 内容：parseOptions 中重复 `--key` 累积为数组；gate 的 `validation_commands` 逐条记录。
- 验证：新单测先红后绿；`npm test`。

### U2 - tidy 命令（R2）

- Depends on: U1
- Files: `plugins/ai-agent-engine-codex/scripts/ae-tools/tidy.mjs`（新增）、`plugins/ai-agent-engine-codex/scripts/ae-tools.mjs`（dispatch）、`plugins/ai-agent-engine-codex/scripts/ae-tools/help.mjs`、`tests/ae-tools.test.mjs`
- 内容：过程记录五态分类（done/empty/stale/archived-pointer/active）；gates 与 evidence artifacts 超期检测（文件名时间戳优先、mtime 兜底）；`--apply`（done 归档、empty 删除、超期证据迁移 + ledger 路径重写）；`--archive-stale`、`--stale-days`、`--retention-months`。
- 验证：fixture 单测（dry-run 分类、apply 移动、ledger 重写、幂等）先红后绿。

### U3 - 本仓与 work 项目治理执行（R3、R4）

- Depends on: U2
- Files: `docs/00-process/active/**`（归档移动）、`docs/00-process/archive/2026-08/**`、work 项目 docs（经 --project-root）
- 内容：本仓 tidy dry-run -> apply（含 --archive-stale 治理七月滞留）；work 项目 dry-run 复核 -> apply；输出计入过程笔记。
- 验证：tidy JSON 前后计数；`node scripts/ae-tools.mjs recovery` 候选不再包含已归档任务。

### U4 - skill 精修四项（R5、R6、R7、R8）

- Depends on: none
- Files: `plugins/ai-agent-engine-codex/skills/{ae-prd/references/requirements-capture.md, ae-brainstorm/SKILL.md, ae-ideate/SKILL.md, ae-review/SKILL.md, ae-handoff/SKILL.md, ae-lfg/SKILL.md}` 与全部镜像、`tests/skills-docs.test.mjs`
- 内容：capture 模板加 `## Perspective Collision (Conditional)`；brainstorm 碰撞触发条件与落点；ideate 路由句；review Light Path 段 + persona 速选；三个 skill 的 evidence 词汇指针；handoff/lfg 统一路由句。
- 验证：skills-docs 新断言先红后绿；`node scripts/check-skill-mirror.mjs`、`node scripts/check-skill-contract.mjs`。

### U5 - 记忆预算（R9）

- Depends on: none
- Files: `plugins/ai-agent-engine-codex/scripts/ae-tools/init-templates/{en,zh-CN}/memoryMaintenanceRules.md`、`docs/08-ai-memory/06-agent-maintenance-rules.md`
- 内容：新增体积与蒸馏预算章节（15KB 预算、决策日志按年轮换、季度 reviewStatus 盘点、退役主题归档）。
- 验证：`npm run check:contracts`（memory 契约检查不回归）。

### U6 - 版本递增与 README 条目（NFR1）

- Depends on: U1、U2、U4、U5
- Files: `package.json`、`plugins/ai-agent-engine-codex/.codex-plugin/plugin.json`、`README.md`、`README.en.md`
- 内容：0.3.22 -> 0.3.23；双语 `### 0.3.23` 条目（摘要、验证命令、证明边界）。
- 验证：`node scripts/check-release-notes.mjs`。

### U7 - 终验与交付（NFR2、NFR3）

- Depends on: U3、U6
- Files: `docs/00-process/active/governance-batch-two/progress.md`（完成后归档）
- 内容：全量验证、双 lane 自审、gate 证据、过程记录归档（用 tidy 自身完成，作为 R2 的真实验证）。
- 验证：`npm run check`、`npm test`、`npm run check:smoke`、gate JSON。

## 风险与回滚

- 风险：parseOptions 累积语义影响既有命令对重复 flag 的隐含依赖。缓解：全量测试 + 契约检查兜底；重复传参此前即属未定义用法。
- 风险：tidy --apply 误归档仍活跃的任务。缓解：默认 dry-run；stale 需显式 `--archive-stale`；指针目录保留；apply 前人工复核清单。
- 风险：ledger 路径重写破坏 JSONL。缓解：逐行字符串替换并在测试中断言重写后仍可逐行 JSON.parse。
- 回滚：本仓改动基线已提交，可按文件 `git restore`；work 项目治理前记录 dry-run 清单，误移可按清单逆向移回。
