# prds-artifact-path-unification 过程记录

- **状态：** done
- **计划：** `docs/ae/plans/2026-08-11-007-prds-artifact-path-unification-plan.md`
- **来源：** 用户 P2 发现（能力目录 ae-brainstorm 仍标 brainstorms；work 项目 docs/ae/README.md 第 8 行沿用旧说明）

## 共识门（2026-08-11）

- 需求：inline 确认（用户方向"在插件后续版本统一目录声明"，本批即为该版本 0.3.25；work 项目 README 为用户点名文件一并修正）。
- 核实：catalog artifactPath 与 artifact-contract、scope-detection 为过时声明；init 模板/顶层 artifactPaths/本仓 README 已于 0.3.22 修正；recovery legacy 扫描有意保留。
- 计划：`2026-08-11-007` 自评审通过（TDD 先红后绿；窗口迁移依赖 CHANGELOG 完整历史；work 项目单文件最小编辑）。
- 开放决策：无需用户裁决项。
- 验证契约：`npm run check`、`npm test`、`npm run check:smoke`、`node scripts/check-release-notes.mjs`。

## Git 安全检查（2026-08-11）

- 本仓 `main`，工作区为批次四未提交交付物（用户待提交）+ 本批新增文件；本批与批次四改动文件集不重叠（README/CHANGELOG 除外，均为追加/删除条目级编辑）。
- work 项目仅计划编辑 `docs/ae/README.md` 单文件。

## 检查点

- 2026-08-11: 核实完成，计划落盘。
- 2026-08-11: U1 断言先红（1 fail）；U2 六处声明统一后转绿（1 pass），`check-skill-mirror` 126 文件一致。
- 2026-08-11: U3 版本 0.3.25 + 四文件条目；README 双语窗口迁移（移除 0.3.20，各恰 5 条），CHANGELOG 双语各 19 条；`check-release-notes` ok（首次实战新契约窗口迁移）。
- 2026-08-11: U4 work 项目 `docs/ae/README.md` 第 8 行改为 prds 正典 + brainstorms 探索两行，回读字节确认。
- 2026-08-11: 验证——`npm run check` exit 0（期间修正计划 frontmatter status: approved→active，`check-ae-artifacts` 仅接受 drafted/ready/active/completed）、`npm test` 125/125、`npm run check:smoke` exit 0。
- 2026-08-11: domain:code 评审——catalog 每份仅 artifactPath 一行变更；三 lane（reviewer/architect/claim-integrity）APPROVE 无阻塞发现。P2 裁定：catalog 与 work README 确认过时并已修复；init 模板与本仓 README 自 0.3.22 已正确（原报告中该部分不成立）。
