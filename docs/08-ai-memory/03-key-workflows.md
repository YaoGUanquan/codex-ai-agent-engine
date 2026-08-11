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
  2. Identify transferable gates, artifacts, and review rules instead of copying runtime-specific behavior.
  3. Keep local AE entrypoints stable unless the user explicitly asks for new commands.
  4. Record adopted and rejected ideas in `docs/ae/solutions/`.
  5. Archive the completed process under `docs/00-process/archive/YYYY-MM/<task>/`.
- Validation: Run `cmd /c npm run check`, `git diff --check`, and targeted help checks such as `node scripts/ae-tools.mjs help skill`.
- Known risks: External skill prompts may include runtime assumptions, platform assumptions, or naming models that do not fit this project. Do not install or copy them directly.

## Phase 2 shallow graph and browser routing

- Workflow: Add high-value Phase 2 helpers only when they can stay read-only, bounded, and Codex-native.
- Use case: A user asks to continue porting OpenCode-inspired graph, merge, or browser/DevTools capabilities.
- Steps:
  1. Prefer shallow helper scripts before persistent MCP tools when the schema and write lifecycle are not settled.
  2. Use `node scripts/ae-tools.mjs ae-graph-build --root <path>` for a quick JSON dependency preview.
  3. Use `node scripts/ae-tools.mjs ae-graph-query --root <path> --path <file>` or `--keyword <text>` for a focused graph query.
  4. Keep `ae-merge-branch` deferred until Git evidence, rollback, and authorization rules are stronger.
  5. Route browser debugging through `ae-test-browser` with Browser, Playwright, or an already available DevTools-capable tool.
- Validation: Run `npm.cmd test`, `npm.cmd run check`, `git diff --check`, and `node scripts/check-skill-mirror.mjs`.
- Known risks: The graph helper is static and shallow; dynamic imports, aliases, generated code, and framework-specific resolution may be incomplete.

## Multi-agent auto config rollout

- Workflow: Roll out `multi_agent.enabled: auto` to installed projects without silently enabling write-agent spawning.
- Use case: A user asks how another project should update after the multi-agent config branch is merged.
- Steps:
  1. Merge the feature branch to `main`.
  2. In each installed target project, run `node scripts/update-ae-codex.mjs --repo https://github.com/YaoGUanquan/codex-ai-agent-engine.git --branch main`.
  3. Create or update `.codex/ae-skill-profiles.yaml` from `docs/ae/templates/ae-skill-profiles.example.yaml`; the updater copies templates but does not overwrite the local runtime profile.
  4. Keep `enabled: auto`, `mode: suggest`, and `allow_write_agents: false` as the safe baseline.
  5. Only use `mode: auto` plus `allow_write_agents: true` when the user explicitly opts into write-agent auto parallelism.
  6. Verify with `node scripts/ae-tools.mjs task-analyze --mode plan --plan docs/ae/plans/<your-plan>.md`.
- Validation: Run `npm.cmd test`, `npm.cmd run check`, `node scripts/check-install-smoke.mjs`, and targeted task-analyze tests for the config matrix.
- Known risks: `task-analyze` reports policy and waves; actual sub-agent spawning remains an orchestration decision and must respect blockers.

## Minimality and complexity review adaptation

- Workflow: Adapt external minimality patterns into AE skill guidance without importing runtime hooks or persona modes.
- Use case: A user asks to optimize AE skills using a repository such as `DietrichGebert/ponytail`.
- Steps:
  1. Use `ae-skill-audit` to classify external patterns as portable workflow guidance or platform-specific runtime behavior.
  2. Improve existing AE skills before creating new skills: `ae-work` for pre-edit minimality, `ae-review` for complexity findings, `ae-plan` for simplest-route alternatives, and `ae-task-loop` for smallest-fix iterations.
  3. Keep plugin source and `.agents/skills` mirror paired in every edit.
  4. Use TDD when locking guidance into tests; the regression test should verify both source and mirror.
  5. Preserve boundaries: do not remove validation, security, accessibility, data-loss handling, or explicit user requirements in the name of smaller code.
- Validation: Run `node --test --test-name-pattern "Ponytail-inspired minimality guidance" tests/skill-scripts.test.mjs`, `node --test tests/skill-scripts.test.mjs`, `npm.cmd run check`, and `node scripts/check-skill-mirror.mjs`.
- Known risks: Minimality language can be misread as "delete safeguards"; always phrase it as smallest correct implementation, not shortest code.

## OCR-style review guidance adaptation

- Workflow: Adapt external AI review tools into AE review/audit guidance by separating deterministic review mechanics from runtime integration.
- Use case: A user asks whether a code review agent such as `alibaba/open-code-review` can optimize AE review skills.
- Steps:
  1. Use `ae-skill-audit` to classify the external source, license, harnesses, runtime assumptions, and deterministic engineering patterns.
  2. Improve existing skills before adding new entrypoints: `ae-review` for diff discipline and rule profiles; `ae-skill-audit` for audit classification.
  3. Keep diff discipline conditional on diff-like scopes; preserve `full` and `full:<path>` review behavior.
  4. Add manual position checks and contradiction checks as review discipline, not as an automated line validator unless a later schema exists.
  5. Keep source and `.agents/skills` mirror synchronized and protect the behavior with focused tests.
- Validation: Run `npm.cmd test -- --test-name-pattern "OCR-inspired review guidance"`, `node scripts/check-skill-mirror.mjs`, `node scripts/check-ae-artifacts.mjs`, and `npm.cmd run check`.
- Known risks: OCR's CLI, provider configuration, telemetry/session viewer, CI examples, and prompt/rule files are runtime-specific or source-derived. Do not copy or require them unless the user explicitly requests a separate integration.

## Claude Code best-practice adaptation

- Workflow: Adapt Claude Code best-practice repositories by rewriting portable process contracts into existing AE skills.
- Use case: A user asks whether a Claude Code workflow repository can optimize this Codex-native AE project.
- Steps:
  1. Use `ae-skill-audit` to record source freshness with `git ls-remote` when available, `observedCommit`, ref source, inspected files, license, runtime assumptions, and deterministic mechanisms.
  2. Prefer existing skills before creating new entrypoints: audit, creator, agent template, delegation, plan, review, and memory skills usually cover the adaptation path.
  3. Rewrite only portable gates, routing rules, diagnostics, and evidence contracts; reject hooks, settings, schedulers, slash commands, permission presets, sounds, and auto-registered agents unless Codex has an equivalent enforcement point.
  4. Treat Claude output as untrusted advice until Codex verifies it against repository facts and validation output.
  5. Keep plugin source and `.agents/skills` mirror synchronized and protect the guidance with focused tests.
- Validation: Run targeted adaptation tests, `node scripts/check-skill-mirror.mjs`, `node scripts/check-ae-artifacts.mjs`, and `npm.cmd run check`.
- Known risks: External Claude examples can imply runtime behavior Codex cannot enforce. Record rejected runtime assumptions instead of importing them.
- Landed example: commit `3e7f01a` adapted `shanraisshan/claude-code-best-practice` by updating existing AE skills, adding no-output delegation diagnostics, preserving source/mirror sync, and archiving process evidence under `docs/00-process/archive/2026-06/claude-code-best-practice-audit/`.

## Skill optimization framework audit

- Workflow: Treat SkillOpt-like self-evolution frameworks as audit input first, not as a runtime to install.
- Use case: A user asks whether a framework that trains, sleeps, replays, evolves, or self-improves skills should optimize this AE project.
- Steps:
  1. Use `ae-skill-audit` and record source freshness, inspected files, license, runtime assumptions, and evidence boundaries.
  2. Evaluate trajectory source, bounded edit shape, held-out validation gate, rejected-update handling, staging/adoption policy, and AE validation mapping.
  3. Reject ungated live mutation and auto-adoption without review unless AE has an equivalent validated runtime safety boundary.
  4. Adapt useful ideas as AE-native process contracts, template fields, or future plans; do not copy external prompt/source text.
  5. If implementation proceeds, update plugin source and `.agents/skills` mirror together, then archive process evidence.
- Validation: Run `node --test --test-name-pattern "SkillOpt audit filter guidance" tests/skill-scripts.test.mjs`, `node scripts/check-skill-mirror.mjs`, `node scripts/check-skill-contract.mjs`, `node scripts/check-ae-artifacts.mjs`, and `git diff --check`.
- Known risks: Optimizer demos can hide benchmark leakage, synthetic-only trajectories, broad prompt rewrites, or unsupported runtime harness behavior. Do not create `ae-skill-optimize` until AE has a local replay suite and a gate that rejects harmful skill edits before live files change.

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
  4. 迁移成功后从目标项目根运行用户级 dispatcher，并在新的 Codex 任务中用 `codex plugin list` 检查 `ai-agent-engine-codex@personal`。
  5. 保留项目根中的 `AGENTS.md`、`docs/**`、AI memory、图谱和 archive；备份/journal 也默认保留，只有显式 purge 才删除。
- 验证：逐项目检查项目级 plugin、wrapper、`ae-*` skill 和 AE marketplace 条目均不存在；比较迁移前后的 `AGENTS.md` 与 `docs/**` 指纹；运行 dispatcher smoke；确认 source/deferred 项目未被修改。
- 已知风险：源仓库可同时显示本地开发 skill 与 personal 插件，这是开发例外；已打开的 Codex 桌面任务不会热刷新 skill 清单。每个操作系统用户有独立 `$HOME`，安装器不会修改其他用户目录。

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
  4. 插件源与 `.agents/skills` 逐字节镜像；可分发内容变更时递增 SemVer 与 README 版本记录。
- 验证：`check-skill-mirror`、`check-skill-contract`、`npm test`、`check-install-smoke`。
- 已知风险：现代 idioms 基线下旧栈命中率下降；jsdom 不能替代 `ae-test-browser`。

## 全栈 skill 优化与镜像同步

- 工作流：扩展前后端并重 skill 时，插件源与 `.agents/skills` 镜像必须逐字节一致。
- 使用场景：为 `ae-backend`、`ae-web-app`、`ae-debug`、`ae-sql` 等增加语言指导或契约检查表。
- 步骤：
  1. 在 `plugins/ai-agent-engine-codex/skills/<skill>/` 编辑 SKILL 与 references。
  2. 逐文件同步到 `.agents/skills/<skill>/`（插件源为分发正典）。
  3. 未覆盖的后端/前端栈保持「沿用仓库既有约定」回退。
  4. 跨前后端契约对齐引用 `ae-backend/references/api-contract-checklist.md`。
  5. 递增 SemVer + README 版本记录；运行 mirror/contract/release-notes/test/check:all。
- 验证：`node scripts/check-skill-mirror.mjs`、`npm test`、`npm run check:all`。
- 已知风险：证明边界仅为技能文档与分发合同一致，不代表 consumer 项目运行时验收。
