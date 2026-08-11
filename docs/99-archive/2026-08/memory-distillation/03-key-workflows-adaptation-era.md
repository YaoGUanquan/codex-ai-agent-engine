# 关键工作流归档分片（适配期工作流，2026-08-11 蒸馏）

来源：`docs/08-ai-memory/03-key-workflows.md`。以下六个适配期工作流全文逐字节移动、未删改；其长期有效边界由对应主题记忆文件或 skill 正文承载（映射见源文件「已归档工作流」小节）。

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
