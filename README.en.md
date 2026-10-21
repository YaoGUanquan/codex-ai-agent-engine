# AI Agent Engine for Codex

A Codex-native, project-local engineering workflow plugin: requirements clarification, design contracts, planning, execution, review, validation, handoff, and experience capture via `ae-*` skills and local scripts.

> References: [Gitee AI Agent Engine](https://gitee.com/jiangqiang1996/ai-agent-engine), [OpenAI plugins](https://github.com/openai/plugins), [Superpowers](https://github.com/obra/superpowers), [everything-claude-code](https://github.com/affaan-m/everything-claude-code), [Spec Kit](https://github.com/github/spec-kit), [aicoding-cookbook](https://github.com/lili-luo/aicoding-cookbook). This repo is a Codex skill/plugin implementation, not an OpenCode runtime port.

中文: [README.md](README.md) · Install: [INSTALL.md](INSTALL.md) / [INSTALL.zh-CN.md](INSTALL.zh-CN.md) · Repo rules: [AGENTS.md](AGENTS.md)

## Current Mainline Facts

- Current release line: **`0.4.0-beta.3`**; root `package.json` and plugin manifest stay in sync.
- Sole distributable skill source: `plugins/ai-agent-engine-codex/skills`. `.agents/skills` is a consumer install layout only—not a second skill tree here; no `.ae-source`.
- Install / update / language switching support `--implicit none|core|all`; **default is `none`** (fresh installs are explicit-only). `core` allows natural-language implicit for five core skills; `all` restores the previous full implicit set. Existing install settings are preserved (no forced migration).
- Project-level install writes into the target project; global install publishes the current user's personal plugin and dispatcher. Both keep each project's `AGENTS.md`, `docs/**`, AI memory, and archives in the project root.
- `task-analyze` emits candidate worker requests, readiness, and parallel waves; it does not start background agents. The parent owns authorization, integration, and final acceptance.
- `npm test` / `npm run check` / `npm run check:smoke` prove **scripts, contracts, and isolated installs**—not live Codex host/model behavior, target-project runtime, deployment, or production capacity.

Full history: [CHANGELOG.en.md](CHANGELOG.en.md) / [CHANGELOG.md](CHANGELOG.md).

## Quick Start

```bash
node scripts/install-project.mjs --target /path/to/your-codex-project
```

Windows PowerShell:

```powershell
node scripts\install-project.mjs --target D:\codes\your-project
```

Initialize docs in the target project root, then restart/reopen the Codex conversation:

```bash
node scripts/ae-tools.mjs init
node scripts/ae-tools.mjs help
```

Default metadata language is `bilingual` (`--lang zh-CN|en|bilingual`). Default implicit tier is `none`; pass `--implicit core` for the five-skill set.

Agents can follow [INSTALL.md](INSTALL.md).

## Implicit Invocation Tier (`--implicit`)

| Tier | Meaning |
|---|---|
| `none` (**plugin default**) | No skill allows natural-language implicit invocation; use explicit `$ae-*` / named AE |
| `core` | Only `ae-help`, `ae-plan`, `ae-work`, `ae-review`, `ae-debug` allow natural-language implicit |
| `all` | Every skill allows implicit (previous default) |

```bash
node scripts/install-project.mjs --target /path/to/project --implicit core
node scripts/set-ae-language.mjs --lang bilingual --implicit all
```

Without an explicit AE invocation, use ordinary Codex capabilities and non-AE skills; do not auto-start AE workflows.

## Capabilities

One line per category (see each skill for triggers and flow):

| Category | Skills |
|---|---|
| Entry / orchestration | `ae-help`, `ae-lfg`, `ae-init` |
| Requirements & design | `ae-ideate`, `ae-brainstorm`, `ae-design`, `ae-constitution`, `ae-plan`, `ae-tasks` |
| Execution & refactor | `ae-work`, `ae-refactor`, `ae-tdd`, `ae-debug` |
| Review & validation | `ae-review`, `ae-test-browser`, `ae-test-api` |
| Frontend / Web | `ae-frontend-design`, `ae-web-forge`, `ae-web-app` |
| Backend / data | `ae-backend`, `ae-sql`, `ae-swagger-parser` |
| Docs & handoff | `ae-doc-humanize`, `ae-doc-structure`, `ae-handoff`, `ae-save-experience`, `ae-prompt-optimize`, `ae-imagegen-prompt` |
| Meta / maintenance | `ae-skill-creator`, `ae-skill-audit`, `ae-agent-creator`, `ae-language`, `ae-update`, `ae-reverse-engineering` |

Contract blurbs (kept beside the table for discovery and regression asserts):

- `ae-design`: capture architecture, API, data, UI/UX, test, and non-functional design contracts between PRD and plan.
- `ae-frontend-design`: frontend design and UI implementation.
- `ae-web-forge`: unified frontend/web routing entry that selects existing AE skills and closes with browser acceptance.
- `ae-web-app`: implement the Web app, interaction, API, and light full-stack flow after `ae-web-forge` routing.
- `ae-test-api`: verify post-change backend API contracts with risk-path and tiered evidence.
- `ae-reverse-engineering`: analyze authorized artifacts defensively after confirming scope, provenance, and reproducible evidence bounds.

Helpers: `node scripts/ae-tools.mjs help` (init, memory/knowledge queries, shallow dependency graph, `task-analyze`, report, issue, …). `ae-graph-build` / `ae-graph-query` do not write `docs/ae/graphs/graph.json`. Details live in `AGENTS.md` and `ae-tools.mjs help`.

## Project-Level Install And Update

Prefer project-level install (writes only into the target project):

```bash
node scripts/install-project.mjs --target /path/to/your-codex-project
node scripts/install-project.mjs --target /path/to/your-codex-project --lang en --implicit none
```

Update an installed project:

```bash
node scripts/update-ae-codex.mjs --repo https://github.com/YaoGUanquan/codex-ai-agent-engine.git --branch main
```

Skill-list language (restart the conversation afterward):

```bash
node scripts/set-ae-language.mjs --lang en   # or zh-CN / bilingual
```

Paths written into the target: `plugins/ai-agent-engine-codex/`, `.agents/plugins/marketplace.json`, `.agents/skills/ae-*`, `scripts/ae-tools.mjs`, `scripts/update-ae-codex.mjs`, `scripts/set-ae-language.mjs`.

Global install, migration from project-level, and manual copy steps: [INSTALL.md](INSTALL.md). Multi-agent / `task-analyze` template: `docs/ae/templates/ae-skill-profiles.example.yaml` (updates do not overwrite an existing `.codex/ae-skill-profiles.yaml`).

## Version Updates

### 0.4.0-beta.3 (2026-10-21)
- Default implicit tier is now `none`; fix Cursor `none` metadata handling; tighten `ae-debug` hypothesis rules; add offline model-evaluation validation and worker-acceptance counterexamples. Live GPT comparison not run.

### 0.4.0-beta.2 (2026-10-20)
- Install/update/language switch support `--implicit core|all|none`; **plugin default tier is now `core`** (only ae-help / ae-plan / ae-work / ae-review / ae-debug allow natural-language implicit invocation). Non-core skills go through ae-help routing or `$ae-*`; `--implicit all` restores the previous behavior.
- Validation commands: `npm test`, `npm run check`, `npm run check:smoke`, and `git diff --check`. These static and local checks do not prove live Codex host/model behavior.

### 0.4.0-beta.1 (2026-10-15)
- Add reusable team roles and a task-sensitive execution contract: approve complex plans first, keep small tasks inline, and let the parent own native dispatch, integration and evidence-backed acceptance.
- Team-execution write authorization moves from explicit opt-in to a parent-agent gate (`write_requires_explicit_opt_in: false` + `write_requires_parent_gate: true`); write workers still need explicit parent approval, and `can_spawn_write_agents*` stays false.
- Analyze file and business-resource read/write conflicts per wave, with host slots, execution state and automatic concurrency. Preserve explicit off/read-only choices and allow unrelated dirty work.
- Strengthen source-to-output memory, query and concurrency budgets with isolated data fixtures and a five-case real-model comparison specification. Explicitly prefer `gpt-6.1-sol` for the trial without silent model substitution.
- Validation commands: `npm test`, `npm run check`, `npm run check:smoke`, `git diff --check`. Static and isolated-install checks establish helper, instruction and distribution contracts only. Real-model comparison is pending; quality, speed and production capacity gains are unproven.

### 0.3.56 (2026-10-15)
- Share test selection, evidence reuse and invalidation rules: isolate single failures, explain full-suite escalation, and avoid reruns merely for review, shipping or context recovery. Remove fixed execution counts and blanket dirty-worktree confirmations. Narrow skill entry trigger copy to emphasize explicit requests before specialist gates (default `implicit` tier remains `all`, matching the mid-I series plan).
- Make GPT-6.1 the primary behavior acceptance target with eight reusable scenarios and three comparison variants, each repeated twice. Real model evaluation is pending; performance and quality improvements are not yet proven.
- Validation commands: `node --test tests/model-adaptation.test.mjs tests/instruction-audit.test.mjs`, `npm test`, `npm run check`, `npm run check:smoke`, `git diff --check`. Static and isolated-install checks establish written rules, metadata and distribution contracts only; delivery records report actual outcomes and failures.

### 0.3.55 (2026-10-13)
- Remove the `.ae-source` maintenance mirror: plugin `plugins/ai-agent-engine-codex/skills` is the only skill source; delete `check-skill-mirror` and drop mirror roots from contract/language/audit scripts.
- Rewrite regression tests to assert only the plugin `SKILL_ROOT`; scrub ae-source guidance from docs and the release checklist; bump to 0.3.55.
- Validation commands: `npm test`, `npm run check`, `npm run check:smoke`, and `git diff --check`. These static and local checks do not prove live Codex host/model behavior.

README keeps the latest five entries; full history: [CHANGELOG.en.md](CHANGELOG.en.md).

## Repository Layout

```text
plugins/ai-agent-engine-codex/   # distributable plugin; sole skills source
scripts/                         # install / update / ae-tools / checks
tests/                           # regression and install smoke
docs/ae/templates|references     # public templates and references
CHANGELOG*.md / INSTALL*.md      # full release notes and install guides
AGENTS.md                        # repo rules and verification entrypoints
```

`.agents/` is the consumer install layout, not this distribution repo's skill source.

## Important Boundaries

- Reliable triggers: explicitly name AE / `ae-*` / `$ae-*`, or continue an already-started AE workflow; under default `none`, natural language does not implicitly start AE.
- Codex exposes AE via skills (`$ae-*`, named natural language, or `/` / skill search for enabled skills in supported Apps). That is skill-backed discoverability, not OpenCode `config.command` slash registration. `/ae-*` is only a compatibility label.
- No live MCP server yet; `.mcp.json` is intentionally empty.
- `ae-graph-*` are shallow read-only helpers; they do not write `docs/ae/graphs/graph.json` and are not a full graph tool.
- Git writes, destructive file ops, network, dependency installs, DB writes, and browser setup require explicit Codex authorization.
- This public repo's `docs/` only keeps templates/references and the release checklist; process artifacts and long-term AI memory go to the private docs repo (see `AGENTS.md` External Docs Context).

## Development Checks

```bash
npm test
npm run check
npm run check:smoke
node scripts/check-release-notes.mjs
git diff --check
```

See [docs/release-checklist.md](docs/release-checklist.md) before publishing. Docs-only changes that do not alter distributable plugin content do not bump the plugin version by themselves.

## License And Attribution

See [LICENSE](LICENSE) and [NOTICE.md](NOTICE.md). This project references AI Agent Engine and ships under `GPL-2.0-only`.
