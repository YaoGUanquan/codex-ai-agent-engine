---
type: plan
status: completed
date: 2026-08-11
title: prds-artifact-path-unification
format: human-readable-plan
sharded: false
archive: docs/00-process/archive/2026-08/prds-artifact-path-unification/summary.md
---

# 需求产物目录声明统一计划（2026-08-11，0.3.25）

依据：用户 P2 发现（能力目录仍把 `ae-brainstorm` 标注为 `docs/ae/brainstorms`；work 参照项目 `docs/ae/README.md` 第 8 行沿用旧目录说明）。

## 核实结论（需求 inline）

- 确认过时（本批修）：能力目录 `ae-brainstorm.artifactPath`（源+镜像）；`ae-help/references/artifact-contract.md` 的 Requirements 行、需求 frontmatter 示例（`type: brainstorm`）与计划 `origin` 示例；`ae-review/references/scope-detection.md` 文档评审搜索不含 `docs/ae/prds`；work 项目 `docs/ae/README.md` 第 8 行（init 存量文件，更新不会重写）。
- 已在 0.3.22 修正（不动）：顶层 `artifactPaths`（requirements→prds、ideas→brainstorms）、init 模板 aeReadme（en/zh）、本仓 `docs/ae/README.md`、`ae-brainstorm` SKILL 本体。
- 有意保留（不动）：init 继续创建 `docs/ae/brainstorms`（探索性记录）；recovery 对 brainstorms legacy 需求的扫描与测试断言；历史工件中的 brainstorms 路径。

## Global Constraints

- 插件内容变更 → 版本 0.3.24 → 0.3.25（双 manifest），发布条目按新契约写入 README 双语 + CHANGELOG 双语，README 窗口保持 5 条（移除 0.3.20 条目，CHANGELOG 已含）。
- 行为断言先红后绿；镜像逐字节一致。
- 交付门槛：`npm run check`、`npm test`、`npm run check:smoke`、`node scripts/check-release-notes.mjs` 全绿。

## Implementation Units

### U1 - 回归断言先行（红）
- Files: `tests/skills-docs.test.mjs`
- 内容：扩展 594 行测试：双份 capability-catalog 的 `ae-brainstorm.artifactPath === 'docs/ae/prds'`；artifact-contract（源+镜像）Requirements 行指向 `docs/ae/prds`、计划 origin 示例不再指向 brainstorms；scope-detection（源+镜像）文档评审搜索含 `docs/ae/prds`。

### U2 - 目录声明统一（绿）
- Files: `plugins/ai-agent-engine-codex/skills/ae-help/references/capability-catalog.json` 与镜像、`.../ae-help/references/artifact-contract.md` 与镜像、`.../ae-review/references/scope-detection.md` 与镜像
- 内容：artifactPath → `docs/ae/prds`；Requirements 行 → `docs/ae/prds/*-prd.md`（注明 legacy brainstorms 通道仍可读）；需求 frontmatter 示例对齐 `ae-prd` 捕获契约（type: prd + format/sharded）；plan origin 示例 → prds 路径；scope-detection 搜索列表加 `docs/ae/prds`。

### U3 - 版本与发布记录
- Files: `package.json`、`plugins/ai-agent-engine-codex/.codex-plugin/plugin.json`、`README.md`、`README.en.md`、`CHANGELOG.md`、`CHANGELOG.en.md`
- 内容：0.3.25；四文件新条目；两个 README 移除 0.3.20 条目（首次实战窗口迁移，CHANGELOG 为完整历史不动）。

### U4 - work 参照项目 README 修正
- Files: `D:\codes\work\docs\ae\README.md`
- 内容：第 8 行 `- brainstorms/：需求澄清和验收标准。` 替换为当前模板措辞的两行（prds 正典 + brainstorms 探索性）；不触碰该项目其他文件，Git 提交由用户在该项目内自行处理。

### U5 - 验证与交付
- `npm run check`、`npm test`、`npm run check:smoke`、`node scripts/check-release-notes.mjs`；domain:code 评审；gate `--write-proof`；进程记录归档至 `docs/00-process/archive/2026-08/prds-artifact-path-unification/`。

## 风险与回滚

- 风险：catalog 消费者依赖旧 artifactPath。核实：仓内消费者为 ae-help 展示与测试，无路径解析逻辑依赖该字段；目标项目仅展示。回滚：`git restore`。
- 风险：README 窗口迁移误删条目。缓解：0.3.20 条目在两份 CHANGELOG 中已存在（0.3.24 批次核对过），删除仅影响 README 窗口；checker 子集校验兜底。
- 风险：work 项目并发会话。缓解：仅改单个非记忆文档文件，编辑前后核对内容；可逆。
