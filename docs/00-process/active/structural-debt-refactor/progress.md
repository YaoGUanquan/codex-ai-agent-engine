# structural-debt-refactor 过程记录

- 计划：`docs/ae/plans/2026-08-11-001-structural-debt-refactor-plan.md`
- 状态：`done`
- 约束：不触碰工作区其他会话的未提交 skill 文档改动（ae-web-app、ae-frontend-design、ae-debug/ae-test-browser references 等）。该会话在执行期间已将版本推进到 0.3.19；本任务的插件侧改动最终使用 0.3.20。

## 检查点

- [x] U1 分层 check 命令 + check-syntax runner + 放宽测试断言
  - `package.json` scripts 拆为 `check` / `check:syntax` / `check:contracts` / `check:smoke` / `check:all`；新增 `scripts/check-syntax.mjs`（glob 扫描 scripts、plugins/*/scripts、tests 下全部 .mjs 做 `node --check`）。
  - install-smoke 移入 `check:smoke`，默认 `check` 只跑轻量层。
- [x] U2 拆分 tests/skill-scripts.test.mjs
  - 拆为 `tests/global-install.test.mjs`、`tests/contracts.test.mjs`、`tests/ae-tools.test.mjs`、`tests/skills-docs.test.mjs`；共享 helper 收敛到 `tests/helpers/skill-test-utils.mjs`；原 3447 行文件删除。
  - check 字符串整段正则断言放宽为"检查步骤存在于某层"。
- [x] U3 插件共享 path 校验模块 + ensureInsideRepo 跨盘符拒绝
  - 新增 `plugins/ai-agent-engine-codex/scripts/artifact-check-utils.mjs`；`check-ae-artifacts.mjs`、`check-design-contract.mjs` 改为复用。
  - `scripts/check-install-smoke.mjs` 的 `ensureInsideRepo` 增加 Windows 跨盘符绝对路径拒绝。
- [x] U4 拆分 ae-tools.mjs + init 模板外部化
  - 单体（约 2860 行）拆为 `scripts/ae-tools/` 下 15 个模块；入口仅保留 `main`/`globalInvocation` 分发。
  - init 三语模板外置为 `scripts/ae-tools/init-templates/{en,zh-CN}/*.md`（UTF-8 + `{{placeholder}}` 占位；模板用哨兵上下文从原单体机械提取，保证字节一致）。
  - 回归证据：三语 init 输出与拆分前基线 48 个文件逐字节一致；8 个关键命令金样输出对比仅时间戳/git 指纹差异。
- [x] U5 set-repository/install-project/update-project 单测
  - 新增 `tests/install-scripts.test.mjs`（6 例）：set-repository 占位替换与非 GitHub URL 拒绝、install-project 安装面与退役 skill 清理与非法 lang 拒绝、update-project 本地 git 仓库模拟 clone 委派与占位仓库拒绝。
- [x] U6 版本 0.3.20 + README 版本记录
  - 双份 SemVer 同步 0.3.19 → 0.3.20（0.3.19 已被并行前端指南会话占用）；README.md 与 README.en.md 追加 0.3.20 条目（摘要 + 验证命令 + 证明边界）。
- [x] 终验（2026-08-11）
  - `npm run check` 通过（syntax + contracts，含 check-release-notes、check-claims --dry-run）。
  - `npm test` 111 项全过（含新增 6 项安装脚本单测）。
  - `npm run check:smoke` 通过：install-smoke 校验版本 0.3.20，验证 recovery/claude-delegate/markitdown/static-server 等命令经拆分后模块执行；global-install-smoke 通过。

## 遗留

- 无阻塞项。基线/金样临时目录位于 `.tmp-install-smoke-checks/`（已 gitignore），可随时清理。
- 模块循环导入风险已收敛为回归契约：`tests/ae-tools.test.mjs` 新增 "acyclic layered import graph" 守卫，静态扫描 `scripts/ae-tools/*.mjs` 的本地导入构图并做 DFS 断环，同时断言 `utils.mjs` 保持零本地导入的基础层；检测能力已用临时夹具注入 `utils.mjs -> git.mjs -> utils.mjs` 循环反证（能准确报出循环链）。纯 tests/ 侧改动，不升版本。
