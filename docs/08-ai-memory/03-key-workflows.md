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
  5. 检查 `AGENTS.md`、`docs/ae`、`docs/00-process`、`docs/08-ai-memory` 和 `docs/ai-memory` 是否符合当前项目需求。
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
