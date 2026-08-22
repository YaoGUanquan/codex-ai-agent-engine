<!-- ae-codex:init managed -->
# 关键工作流

记录需要跨任务复用的稳定流程。

## 模板

- 工作流：
- 使用场景：
- 步骤：
- 验证：
- 已知风险：

## 项目级安装后初始化

- 工作流：安装 AI Agent Engine for Codex 后，使用 `ae-init` 或 `node scripts/ae-tools.mjs init` 创建当前项目的 `AGENTS.md`、AE 产物目录、过程归档目录和长期 AI 记忆库。
- 使用场景：用户希望把 AE 能力落到某个目标项目，并让后续 Codex 会话能读取项目规则、归档规则和长期记忆。
- 步骤：
  1. 先运行项目级安装脚本，把插件文件安装到目标项目。
  2. 明确切换到目标项目目录后执行 `ae-init` 或 `node scripts/ae-tools.mjs init`。
  3. 安装后的 skill 列表元数据默认是双语；如需单一语言，安装或更新时显式传 `--lang en` 或 `--lang zh-CN`。
  4. 如需中文骨架，使用 `node scripts/ae-tools.mjs init --lang zh-CN`；如需先预览，使用 `--dry-run`。
  5. 检查 `AGENTS.md`、`docs/ae`（含需求正典目录 `docs/ae/prds`）、`docs/00-process` 和 `docs/08-ai-memory` 是否符合当前项目需求；0.3.22 起 init 不再创建 `docs/ai-memory` 兼容目录。
- 验证：运行 `cmd /c npm run check`、`node scripts\ae-tools.mjs init --dry-run --lang zh-CN`、`node scripts\ae-tools.mjs recovery` 和 `git diff --check`。
- 已知风险：安装文档中的 `node scripts/...` 必须在目标项目目录执行；如果仍在临时 clone 目录或其他 cwd，会初始化错误项目或找不到脚本。

## AE workflow adaptation from external research

- Workflow: Treat external Codex workflow projects as research input, then rewrite only the durable process contracts that fit AE.
- Use case: A user asks to compare a third-party Codex skill or workflow repository and improve local AE skills.
- Steps:
  1. Use `ae-skill-audit` for read-only external agent/skill repository analysis.
  2. For a tracked source, run `node scripts/ae-tools.mjs skill-audit --watch` before rereading files; `stale` only names affected AE skills.
  3. Identify transferable gates, artifacts, and review rules instead of copying runtime-specific behavior.
  4. Keep local AE entrypoints stable unless the user explicitly asks for new commands.
  5. Record adopted and rejected ideas in `docs/ae/solutions/` or the watchlist; do not vendor the source.
  6. Archive the completed process under `docs/00-process/archive/YYYY-MM/<task>/`.
- Validation: Run `cmd /c npm run check`, `git diff --check`, `node scripts/ae-tools.mjs skill-audit --watch`, and targeted help checks such as `node scripts/ae-tools.mjs help skill`.
- Known risks: External skill prompts may include runtime assumptions, platform assumptions, or naming models that do not fit this project. Do not install or copy them directly.

## 已归档工作流（2026-08-11 蒸馏）

以下适配期工作流全文移至 `docs/99-archive/2026-08/memory-distillation/03-key-workflows-adaptation-era.md`；长期有效边界的正主文件：

- Phase 2 shallow graph and browser routing → `08-phase-two-tooling.md`
- Multi-agent auto config rollout → `09-multi-agent-auto-config.md` 与 README「多 agent auto 配置」
- Minimality and complexity review adaptation → `10-minimality-review.md`
- OCR-style review guidance adaptation → `11-ocr-review-guidance.md`
- Claude Code best-practice adaptation → 本文件「AE workflow adaptation from external research」与 `docs/ae/experience/2026-06-19-claude-code-best-practice-adaptation.md`
- Skill optimization framework audit → `ae-skill-audit` 的 Skill Optimization Pattern Filter
- mattpocock/skills long-term watch → `16-mattpocock-skills-watch.md` 与 `skill-audit --watch`

## Frontend motion governance

- Workflow: Add motion-related guidance through the existing design, Web routing, and browser-acceptance skills, with a static-first decision and evidence loop.
- Use case: A user asks to improve frontend visual motion, animation-library choices, interaction effects, or reduced-motion handling in a Codex-native AE workflow.
- Steps:
  1. Preserve the target application's design system and use static UI or minimal state feedback unless material motion has a task-relevant purpose.
  2. When motion is justified, specify the user-facing purpose, the usable completion state, and the `prefers-reduced-motion` or equivalent fallback.
  3. Keep libraries, exported animation assets, particles, and 3D as target-project choices; do not add them to the AE plugin merely because they were cited as references.
  4. Route the decision through `ae-web-forge` and record both the motion decision and reduced-motion evidence.
  5. Use `ae-test-browser` on a real target route to prove interaction, completion state, reduced-motion behavior, and existing console/network checks; report `unverified` when that route or capability is unavailable.
- Validation: Run the focused source/mirror regression test, `npm.cmd test`, `npm.cmd run check`, install smoke, artifact/mirror/skill-contract checks, and `git diff --check`.
- Known risks: A static graph helper is not dynamic runtime proof, and this repository cannot replace target-project browser acceptance for an actual motion-bearing UI.

## Authenticated API smoke request-config handoff

- Workflow: When `ae-test-api` or another smoke-gate consumer needs an authenticated local request and no secret reference exists, create a fillable token-free request config first.
- Use case: Backend bubble testing needs a short-lived local token without pasting it into chat.
- Steps:
  1. Read `ae-work/references/local-runtime-smoke-gate.md` and `ae-work/references/request-config-template.md`.
  2. Write a non-empty UTF-8 without BOM config at a verified ignored path or OS temp directory; include method, URL/path, non-secret headers, numbered fill steps, and `REPLACE_WITH_LOCAL_TOKEN`.
  3. Never create an empty file or write non-ASCII config text through PowerShell `Out-File`, default `Set-Content`, or shell redirection.
  4. Report the absolute path once and wait for the user to replace the placeholder locally, then confirm readiness in chat without pasting the token.
  5. Invoke the client by absolute path only; do not open, read, print, validate, archive, move, or delete the populated reference.
- Validation: `node --test --test-name-pattern "API bubble testing|local runtime smoke gate" tests/skill-scripts.test.mjs`, `node scripts/check-skill-mirror.mjs`, `node scripts/check-release-notes.mjs`.
- Known risks: Local checks prove the workflow contract only; they do not prove a target-project authenticated smoke succeeded.

## 从项目级安装切换到用户级全局 AE

- 工作流：将当前用户的 AE 运行时和 Codex 插件注册为单一全局分发，同时退役指定项目中的项目级运行时副本。
- 使用场景：多个项目已经运行过项目级 AE，用户希望所有 consumer 项目复用同一版本，而不搬迁项目文档和知识。
- 步骤：
  1. 在分发源仓库创建只包含当前用户项目根的 manifest；不要让安装器扫描 `D:\codes` 或猜测项目名。
  2. 用同一份 manifest 运行 `preview --retire-modified`，审阅每个 consumer 的组件、归属和 `owned` 状态。
  3. 用 preview 返回的 operation ID、confirmation 和同样的 `--retire-modified` 执行显式 apply；该选项表示先完整备份，再退役修改过或未知的历史副本。
  4. 迁移成功后从目标项目根运行用户级 dispatcher；新开 Codex 任务用 `codex plugin list` 检查 `ai-agent-engine-codex@personal`；新开 Cursor 对话检查 `~/.cursor/skills/ae-*` 真实拷贝是否出现在 `/ae`。
  5. 保留项目根中的 `AGENTS.md`、`docs/**`、AI memory、图谱和 archive；备份/journal 也默认保留，只有显式 purge 才删除。
- 验证：逐项目检查项目级 plugin、wrapper、`ae-*` skill 和 AE marketplace 条目均不存在；比较迁移前后的 `AGENTS.md` 与 `docs/**` 指纹；运行 dispatcher smoke；确认 source/deferred 项目未被修改；确认 Cursor 技能是非链接目录而不是 junction。
- 已知风险：源仓库可同时显示本地开发 skill 与 personal 插件，这是开发例外；已打开的 Codex 或 Cursor 对话不会热刷新 skill 清单。Cursor 不跟踪技能目录上的 symlink/junction，全局 apply 必须发布真实拷贝。每个操作系统用户有独立 `$HOME`，安装器不会修改其他用户目录。

## 分层 check 与 ae-tools 模块维护

- 工作流：日常开发跑轻量 check，发布前跑全量烟测；向 `ae-tools/` 新增命令时保持分层 DAG 并通过循环导入守卫。
- 使用场景：修改 `plugins/ai-agent-engine-codex/scripts/`、根 `scripts/` 或 `tests/` 后需要快速语法/契约/安装回归。
- 步骤：
  1. 日常：`npm run check`（`check:syntax` glob 扫描全部 `.mjs` + `check:contracts` 镜像/契约/记忆/图谱预览）。
  2. 发布或插件分发前：`npm run check:all`（追加 `check:smoke` 项目级与全局安装烟测）。
  3. 新增 `ae-tools` 命令模块时，只从更低层 import；共享 helper 放 `utils.mjs` 或 `artifact-check-utils.mjs`；维护者布局见 `docs/ae/references/ae-tools-module-layout.md`。
  4. Init 模板变更走 `ae-tools/init-templates/` 外部 UTF-8 文件 + 占位替换；对比三语 init 基线或 dry-run 验证字节一致。
  5. 测试按域维护：`tests/ae-tools.test.mjs`、`tests/contracts.test.mjs`、`tests/global-install.test.mjs`、`tests/skills-docs.test.mjs`、`tests/install-scripts.test.mjs`。
- 验证：`npm run check:all`、`npm test`（含 `acyclic layered import graph` 守卫）、`node scripts/check-release-notes.mjs`。
- 已知风险：`node --check` 不检测 ESM 循环导入；仅靠语法扫描无法发现模块 DAG 破坏。

## 前端 stack skill 优化

- 工作流：通过扩展现有 skill 的 references 与可选镜头强化前端交付，不新增入口 skill。
- 使用场景：用户要求优化 React/Vue/Svelte/Angular 或前端可访问性、浏览器验收边界。
- 步骤：
  1. 保持 `ae-web-forge` 四问题路由；视觉-only 走 `ae-frontend-design`，含 API/状态走 `ae-web-app`。
  2. 在 `ae-web-app/references/` 按四段结构维护框架指导（structure / defect traps / SSR boundary / user-facing states）。
  3. 扩展 `web-ui-quality.md`（可访问性、响应式、布局稳定性）；必要时更新 `ae-review`、`ae-tdd`、`ae-debug` 镜头。
  4. 插件源与 `.ae-source/skills` 逐字节镜像；consumer 安装后由安装器写入 `.agents/skills`；可分发内容变更时递增 SemVer 与 README/CHANGELOG 版本条目。
- 验证：`check-skill-mirror`、`check-skill-contract`、`npm test`、`check-install-smoke`。
- 已知风险：现代 idioms 基线下旧栈命中率下降；jsdom 不能替代 `ae-test-browser`。

## 全栈 skill 优化与镜像同步

- 工作流：扩展前后端并重 skill 时，插件源与 `.ae-source/skills` 维护镜像必须逐字节一致。
- 使用场景：为 `ae-backend`、`ae-web-app`、`ae-debug`、`ae-sql` 等增加语言指导或契约检查表。
- 步骤：
  1. 在 `plugins/ai-agent-engine-codex/skills/<skill>/` 编辑 SKILL 与 references。
  2. 逐文件同步到 `.ae-source/skills/<skill>/`（插件源为分发正典）；consumer 安装器负责写入目标项目的 `.agents/skills/<skill>/`。
  3. 未覆盖的后端/前端栈保持「沿用仓库既有约定」回退。
  4. 跨前后端契约对齐引用 `ae-backend/references/api-contract-checklist.md`。
  5. 递增 SemVer + README/CHANGELOG 版本条目（README 窗口 5 条）；运行 mirror/contract/release-notes/test/check:all。
- 验证：`node scripts/check-skill-mirror.mjs`、`npm test`、`npm run check:all`。
- 已知风险：证明边界仅为技能文档与分发合同一致，不代表 consumer 项目运行时验收。

## 知识库 tidy 与过程归档

- 工作流：用 `tidy` 执行保守的过程笔记分类、done 归档、空目录清理与 gate/evidence 超期迁移；默认 dry-run，显式 `--apply` 才写入。
- 使用场景：治理批次收尾、`docs/00-process/active/` 堆积、gate/evidence 超三个月保留期、或更新插件后自动维护。
- 步骤：
  1. 预览：`node scripts/ae-tools.mjs tidy --root <project>`（五态分类 + memoryBudget 报告）。
  2. 应用：`node scripts/ae-tools.mjs tidy --root <project> --apply`（可选 `--archive-stale --stale-days N`）。
  3. 归档目标已存在时按文件合并（缺失移入、相同去重、冲突 `.from-active-<日期>` 后缀）。
  4. 证据保留策略见 `docs/00-process/templates/archive-rules.md`；ledger 在 apply 时重写。
- 验证：`npm test --test-name-pattern tidy`、`npm run check`。
- 已知风险：memoryBudget 仅报告不移动；活跃会话中的记忆文件应通过 handoff 蒸馏而非跨仓强制改写。

## 记忆蒸馏轮换

- 工作流：`tidy` memoryBudget 报告超预算（约 15KB）后，对记忆文件做只移动不删除的轮换或拆分。
- 使用场景：`05-decision-log.md` 条目积累、主题文件膨胀、tidy 报告 `oversized` 非空。
- 步骤：
  1. `node scripts/ae-tools.mjs tidy` 查看最新 memoryBudget 报告。
  2. `05` 按时间窗轮换：保留窗口以预算为准（非固定月数），更早条目全文移入 `docs/99-archive/YYYY-MM/memory-distillation/`，原位留日期+标题索引。
  3. `03/04` 按主题领域判断（不机械按体积切）：已由专题记忆文件或 skill 正文承载的适配期小节归档，原位留指针映射。
  4. 用一次性脚本逐字节搬移，内置断言：标题集合守恒、无跨期泄漏、分片包含核对；用完删除脚本。
  5. 同步 `00-index.md` 导航；registry 关系目标仅限 `AGENTS.md` 与 `docs/ae/**`，分片指针留在正典 Markdown，不进 registry。
  6. 再跑 `tidy` 确认 `oversized` 清空。
- 验证：`node scripts/ae-tools.mjs tidy`、`node scripts/check-memory-knowledge-contract.mjs --root .`、`npm run check`。
- 已知风险：活跃会话正在写入的记忆文件走 handoff 蒸馏，不跨仓并发改写；蒸馏本身不要往 `05` 追加非决策条目。

## 插件更新后自动维护

- 工作流：消费项目执行 `update-ae-codex` 后，安装脚本自动跑保守 `tidy --apply` 并将结果写入 JSON 的 `maintenance` 字段。
- 使用场景：用户升级 AE 插件后希望 done 笔记、空目录与过期证据自动收敛，无需单独记命令。
- 步骤：
  1. 运行 `node scripts/update-ae-codex.mjs`（或项目包装脚本）。
  2. 检查输出 JSON 的 `maintenance`：`status`（applied/skipped/failed）、`tidySummary`、`memoryBudget`。
  3. 跳过自动维护：传 `--no-tidy`；维护失败不阻断更新本身。
- 验证：`tests/install-scripts.test.mjs` 中 auto-maintenance 用例；`INSTALL.md` / `ae-update` skill 说明。
- 已知风险：自动 apply 不会开 `--archive-stale`；超期 active 笔记需人工审阅后单独 tidy。
