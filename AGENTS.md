<!-- ae-codex:init managed -->
# AGENTS.md

## 项目画像

- 项目：ai-agent-engine-codex
- 描述：七个可独立复制的 Codex / Agent Skills 工程技能，参考 https://gitee.com/jiangqiang1996/ai-agent-engine（独立实现）。
- 检测信号：
- Node.js package.json（`type: module`）
- `skills/` 下恰好 7 个 `ae-*` 技能
- `tools/` 校验入口
- README.md / README.en.md
- 重要路径：
- README.md
- README.en.md
- skills/（唯一可分发技能源）
- tools/
- tests/
- docs/release-checklist.md

## 项目命令

- `npm test` — `node tools/run-tests.mjs`
- `npm run check` — `npm run check:syntax && npm run check:contracts`
- `npm run check:syntax` — `node tools/check-syntax.mjs`
- `npm run check:contracts` — `node tools/validate.mjs && node tools/check-repository.mjs && node tools/check-release-notes.mjs && node tools/check-public-content.mjs`
- `npm run check:smoke` — `node tools/check-smoke.mjs`
- `npm run check:all` — `npm test && npm run check && npm run check:smoke`

## 项目规则

- 技能修改以根目录 `skills/<name>/` 为唯一源；不要再创建 `plugins/`、`.ae-source` 或第二份技能树。
- 每个技能资源自闭合：正文不得引用其他技能名、兄弟目录、中央 dispatcher 或仓库 `tools/`。
- 使用标准 skills CLI 安装；不维护项目/全局安装器，不承诺 `none|core|all` 隐式档位。
- 须用户明确点名 `ae-*` / `$ae-*` 后才执行对应技能；不默认全流程或多代理。
- npm `files` 白名单仅为 `skills/`、`LICENSE`、`NOTICE.md`。

## AE 显式调用边界

- 默认不要加载或套用本仓库的 AE 技能。
- 只有用户明确点名 AE、具体 `ae-*`、`/ae-*` 或 `$ae-*`，或明确要求继续已启动的 AE 任务时，才启用。
- 普通语义匹配、仓库名/文件内容中的 AE 字样、历史上下文或任务主题，不构成显式调用。
- 显式调用后仍按用户指定的单个技能与当前任务范围执行，不因「使用 AE」自动扩展为全流程。

## 工程执行

- 修改行为前先阅读已有文档与邻近测试。
- 变更范围保持在当前任务内；优先沿用项目已有模式。
- 不覆盖用户已有工作，不回退无关变更。
- 失败区分产品、测试、规格、环境；禁止放宽断言、无理由跳过或静默降级。
- 本仓库是公开仓库：`docs/` 下只入库公开模板/参考与 `docs/release-checklist.md`。
- AE 过程记录、交接和长期 AI 记忆写入私有外部文档根（由 External Docs Context 解析 `docsRoot`）；拿不到 `docsRoot` 时停止写入并报告，不要退回写进本仓库，也不要在仓库文件里写个人绝对路径。
