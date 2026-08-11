---
type: plan
status: active
date: 2026-08-11
title: structural-debt-refactor
format: human-readable-plan
sharded: false
---

# 结构性债务重构计划（2026-08-11）

## 背景

上一轮全库扫描已消除 update-project.mjs 双份拷贝、忽略 .tmp-install-smoke-checks、接入 check-claims --dry-run、归档过期 OPTIMIZATION 文档。本计划处理剩余六项结构性债务。

## Global Constraints

- 涉及 `plugins/ai-agent-engine-codex/` 可分发内容的改动，双份 SemVer（根 `package.json` 与插件 `plugin.json`）同步递增一次（0.3.17 -> 0.3.18），并在 `README.md` / `README.en.md` 追加版本记录。
- 纯仓库侧（根 `scripts/`、`tests/`、文档）重构不升版本。
- 根薄包装路径（`scripts/ae-tools.mjs` 等 import `../plugins/...`）保持不变。
- 交付门槛：`npm run check`（分层后为 syntax+contracts）、`npm run check:smoke`、`npm test` 全绿。
- 不触碰工作区内其他会话未提交的 skill 文档改动（ae-web-app、ae-frontend-design 等）。

## Implementation Units

### U1 - 分层 check 命令与 syntax runner

- Depends on: none
- Files: `package.json`, `scripts/check-syntax.mjs`, `tests/skill-scripts.test.mjs`
- 内容：新增 `scripts/check-syntax.mjs`（glob 扫描 `scripts/`、`plugins/ai-agent-engine-codex/scripts/`、`tests/` 下全部 `.mjs` 并 `node --check`）；`check` 拆为 `check:syntax`/`check:contracts`/`check:smoke` 与 `check:all`；install-smoke 移入 `check:smoke`。
- 同步放宽测试对 check 字符串的整段正则断言，改为"某检查步骤存在于某层"。
- 验证：`npm run check:syntax`、`npm run check:contracts`、`npm test`。

### U2 - 按域拆分巨型测试文件

- Depends on: U1
- Files: `tests/skill-scripts.test.mjs`（删除）, `tests/helpers/test-utils.mjs`, `tests/global-install.test.mjs`, `tests/ae-tools.test.mjs`, `tests/contracts.test.mjs`, `tests/skills-docs.test.mjs`
- 内容：共享辅助函数抽到 `tests/helpers/test-utils.mjs`；用例按域迁移，不改断言语义。
- 验证：`npm test` 用例总数不减少。

### U3 - 插件共享 path 校验模块 + 加强 ensureInsideRepo

- Depends on: none
- Files: `plugins/ai-agent-engine-codex/scripts/artifact-check-utils.mjs`, `plugins/ai-agent-engine-codex/scripts/check-ae-artifacts.mjs`, `plugins/ai-agent-engine-codex/scripts/check-design-contract.mjs`, `scripts/check-install-smoke.mjs`
- 内容：抽取重复的 `readArg`/`isRepositoryRelativePath`/`looksLikePath`/`toPosix`/`hasField`/`parseScalar`/frontmatter 解析；`check-install-smoke.mjs` 的 `ensureInsideRepo` 增加 Windows 跨盘符绝对路径拒绝。
- 验证：`npm test`（contracts 域用例）。

### U4 - 拆分 ae-tools.mjs 单体

- Depends on: U1
- Files: `plugins/ai-agent-engine-codex/scripts/ae-tools.mjs`, `plugins/ai-agent-engine-codex/scripts/ae-tools/*.mjs`, `plugins/ai-agent-engine-codex/templates/init/**`
- 内容：按命令边界拆出 utils/yaml/git/evidence/help/init/recovery/tasks/review/gate/swagger/claude/markitdown/static-server/graph 模块；入口只保留分发与 `--project-root` 处理；init 中英文模板改为外部 UTF-8 文件（`templates/init/en|zh-CN/*.md`）加占位替换。
- 验证：`npm test`、`node scripts/check-install-smoke.mjs`、init dry-run 输出与拆分前一致。

### U5 - 补弱覆盖脚本单测

- Depends on: U2
- Files: `tests/install-scripts.test.mjs`
- 内容：`set-repository.mjs`（临时副本上替换占位并断言 manifest）、`install-project.mjs`（临时目标安装并断言产物）、`update-project.mjs`（本地 file:// git 仓库模拟 clone 更新）。
- 验证：`npm test`。

### U6 - 版本递增与 README 版本记录

- Depends on: U3, U4
- Files: `package.json`, `plugins/ai-agent-engine-codex/.codex-plugin/plugin.json`, `README.md`, `README.en.md`
- 内容：0.3.17 -> 0.3.18；README 双语追加 `### 0.3.18（2026-08-11）` 条目，含摘要、验证命令与证明边界。
- 验证：`node scripts/check-release-notes.mjs`、`npm run check:all`、`npm test`。

## 风险与回滚

- 风险：ae-tools 拆分引入行为回归。缓解：测试通过 CLI 黑盒覆盖大部分命令；拆分保持函数体不改动，仅移动与导入。
- 风险：模板外部化改变生成字节。缓解：占位替换后逐字节对齐原模板（含换行）；用 init dry-run/实际生成对比。
- 回滚：所有改动在工作区内按单元提交前可用 git 恢复；不触碰其他未提交改动。
