# governance-batch-two 过程记录

- PRD：`docs/ae/prds/2026-08-11-governance-batch-two-prd.md`
- 计划：`docs/ae/plans/2026-08-11-004-governance-batch-two-plan.md`
- 经验：`docs/ae/experience/2026-08-11-governance-batch-two.md`
- 状态：`done`
- 版本：0.3.22 -> 0.3.23

## 检查点

- [x] 残余修复：`.tmp-test-output.txt` 已删除
- [x] U1 parseOptions 重复传参累积 + gate 验证逐条记录（TDD 先红后绿）
- [x] U2 tidy 命令（五态分类、保留期检测、ledger 重写、apply 幂等；4 个新用例）
- [x] U3 本仓与 work 项目治理执行（记录见下）
- [x] U4 skill 精修（S2 碰撞落点、S3 Light Path、S4 词汇指针、S5 handoff 归一；镜像 126 文件一致）
- [x] U5 记忆预算（模板 en/zh + 本仓 06 规则）
- [x] U6 版本 0.3.23 + README 双语条目（check-release-notes 通过）
- [x] U7 终验：`npm test` 121/121、`npm run check`、`npm run check:smoke` 显式退出码复核

## 治理执行记录

- 本仓（`tidy --apply --archive-stale --stale-days 11`）：归档 `agent-skill-audit-optimization`、`claim-checker-dry-run`、`upstream-workflow-optimization`、`work-docs-evidence-governance`（2026-07 月份目录）；`structural-debt-refactor` 因归档目标已存在被 tidy 安全跳过，随后手工将 `progress.md` 并入 `docs/00-process/archive/2026-08/structural-debt-refactor/`；无空目录、无超期证据。
- work 项目（`tidy --project-root D:\codes\work --apply --archive-stale`，经用户批准）：删除 23 个空任务目录；归档 `2026-06-12-class-page-student-count-head-teacher`、`generic-grading-json-self-heal`；保留 4 个活跃任务；`class-create-drawer-backend`（done）与 `class-create-drawer-subject-options`（stale）因归档目标同名已存在被安全跳过，留待该项目会话自行合并；无超期 gate（最早 2026-05-12，在 3 个月保留期内）。
