# AI Agent Engine for Codex

A project-local Codex engineering-workflow plugin: requirement clarification, design contracts, planning, implementation, review, validation, frontend/web routing, OpenAPI summaries, handoff, and experience capture—packaged as installable `ae-*` skills and local scripts.

> References: [Gitee AI Agent Engine](https://gitee.com/jiangqiang1996/ai-agent-engine), [openai/plugins](https://github.com/openai/plugins), [obra/superpowers](https://github.com/obra/superpowers), [everything-claude-code](https://github.com/affaan-m/everything-claude-code), [spec-kit](https://github.com/github/spec-kit), [aicoding-cookbook](https://github.com/lili-luo/aicoding-cookbook). This is not an OpenCode runtime port; it uses native Codex skills, project-local plugin files, and local scripts. See [NOTICE.md](NOTICE.md) and [LICENSE](LICENSE).

中文文档: [README.md](README.md)

## When To Use It

- Clarify fuzzy requirements before implementation and turn them into executable plans;
- Implement after Git/worktree safety checks, then review by severity;
- Keep verification evidence, handoff notes, and reusable lessons in project docs;
- Bootstrap `AGENTS.md`, process archives, and a long-lived AI memory skeleton.

### AE Invocation Boundary

AE skills are **off by default** (implicit tier defaults to `none`). They turn on only for explicit `AE`, `ae-*`, `/ae-*`, `$ae-*`, or a request to continue an existing AE flow. Ordinary semantic matches, repo names, file contents, or the word “AE” in context do not auto-start AE.

## Quick Start

```bash
node scripts/install-project.mjs --target /path/to/your-codex-project
```

Windows PowerShell:

```powershell
node scripts\install-project.mjs --target D:\codes\your-project
```

Restart or reopen the target project's Codex session, then initialize docs and memory at the project root:

```bash
node scripts/ae-tools.mjs init
# Common flags: --lang zh-CN|en|bilingual  --profile minimal|full  --dry-run
node scripts/ae-tools.mjs help
```

Default skill-list metadata language is `bilingual`. Implicit tier defaults to `none` (explicit-only). Pass `--implicit core` for the five-core natural-language set, or `--implicit all` for the old full implicit set.

Full install, update, and language-switch steps: [INSTALL.md](INSTALL.md) / [INSTALL.zh-CN.md](INSTALL.zh-CN.md).

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

## Current Mainline Facts

- The current release line is `0.4.0-beta.3`; the root `package.json` and plugin manifest stay on the same version.
- The only distributable skill source is `plugins/ai-agent-engine-codex/skills`. `.agents/skills` is a consumer-project installation layout, not a second source tree in this repository.
- Project-level installation writes into the target project. Global installation publishes the current user's personal plugin and dispatcher. Both modes keep each project's `AGENTS.md`, `docs/**`, AI memory, graph, and archive in the project root.
- Install, update, and language switching support `--implicit none|core|all`. The default is `none`: fresh installs are explicit-only; `core` allows natural-language implicit invocation for five core skills; `all` restores the previous full implicit set.
- `task-analyze` emits candidate worker requests, readiness, and parallel waves. It does not start background agents; the parent owns authorization, integration, and final acceptance.
- Repository checks prove scripts, contracts, installation distribution, and isolated fixtures. They do not prove live Codex host/model behavior or production acceptance.

Full history: [CHANGELOG.en.md](CHANGELOG.en.md) / [CHANGELOG.md](CHANGELOG.md). The README keeps only the latest five release-window entries.

## Capabilities Overview

Use `$ae-help` or “use ae-help” in Codex for the installed capability list. Common groups:

| Group | Skills |
|---|---|
| Entry & governance | `ae-help`, `ae-init`, `ae-constitution`, `ae-update`, `ae-language` |
| Clarify & design | `ae-ideate`, `ae-brainstorm`, `ae-design`, `ae-plan`, `ae-tasks`, `ae-prompt-optimize` |
| Execute & quality | `ae-lfg`, `ae-work`, `ae-refactor`, `ae-tdd`, `ae-review`, `ae-debug` |
| Frontend / backend / web | `ae-frontend-design`, `ae-web-forge`, `ae-web-app`, `ae-backend`, `ae-test-browser`, `ae-test-api` |
| Docs & data | `ae-doc-humanize`, `ae-doc-structure`, `ae-sql`, `ae-swagger-parser`, `ae-imagegen-prompt` |
| Handoff & extension | `ae-handoff`, `ae-save-experience`, `ae-skill-creator`, `ae-skill-audit`, `ae-agent-creator`, `ae-reverse-engineering` |

Local helpers:

```bash
node scripts/ae-tools.mjs help
node scripts/check-design-contract.mjs
node scripts/ae-tools.mjs task-analyze --mode plan --plan docs/ae/plans/example.md
```

Memory search, shallow dependency graphs, report/issue helpers: see `ae-tools.mjs help` and project docs. They are read-oriented with explicit limits and do not replace PRD/plan/gate evidence.

## Implicit Invocation Tier (`--implicit`)

| Tier | Meaning |
|---|---|
| `none` (**plugin default**) | No skill allows natural-language implicit invocation; use `$ae-*` / name AE explicitly |
| `core` | Only five core skills allow natural-language implicit: `ae-help`, `ae-plan`, `ae-work`, `ae-review`, `ae-debug` |
| `all` | All skills allow implicit invocation (legacy default) |

```bash
node scripts/install-project.mjs --target /path/to/project --implicit core
node scripts/set-ae-language.mjs --lang bilingual --implicit all
```

Global `install-global` / `update-global` also forward `--implicit`.

## Install And Update

**Recommended: project-level install** (writes only the target project):

```bash
node scripts/install-project.mjs --target /path/to/your-codex-project
node scripts/install-project.mjs --target /path/to/your-codex-project --lang zh-CN
```

Paths written: `plugins/ai-agent-engine-codex/`, `.agents/plugins/marketplace.json`, `.agents/skills/ae-*`, plus `scripts/ae-tools.mjs`, `scripts/update-ae-codex.mjs`, `scripts/set-ae-language.mjs`. Do not use this distribution repository as an install target.

**Update an installed project:**

```bash
node scripts/update-ae-codex.mjs --repo https://github.com/YaoGUanquan/codex-ai-agent-engine.git --branch main
```

Language is preserved when possible; a conservative `tidy --apply` runs by default (`--no-tidy` to skip).

**Switch skill-list language** (restart the session after rewriting metadata):

```bash
node scripts/set-ae-language.mjs --lang en|zh-CN|bilingual
```

**Per-user global install / migrate from project-level**: run `install-global.mjs preview`, then `apply` only after confirmation. Project data (`AGENTS.md`, `docs/**`, memory, archives) always stays in each project root. Steps and safety gates: [INSTALL.md](INSTALL.md).

**Manual install**: only when scripts cannot run—copy the plugin tree, entry scripts, and `.agents/skills`, then write `marketplace.json`. Details in INSTALL.

## Initialize Project Docs

```bash
node scripts/ae-tools.mjs init
```

Default `ae-core` profile creates:

- `AGENTS.md` — Codex-oriented project notes (commands discovered from `package.json`, never guessed);
- `docs/ae` — AE workflow artifacts (canonical PRDs under `docs/ae/prds`);
- `docs/00-process` — process notes, archive rules, templates;
- `docs/08-ai-memory` — long-lived AI memory library.

`--profile minimal` creates only `AGENTS.md`; `--profile full` keeps the older full numbered doc set. Existing files are not overwritten by default; `--force` replaces only AE-managed blocks. Since 0.3.22, init no longer creates a `docs/ai-memory` compatibility directory.

## Daily Usage

Codex exposes AE via skills (`$ae-plan`, etc.), not OpenCode-style dynamic slash registration. With default `none`, name skills explicitly:

```text
Use ae-help to list current AE capabilities.
Use ae-plan to create an implementation plan for “file upload with permission checks”.
Use ae-work to execute docs/ae/plans/<plan>.md.
Use ae-review mode:report-only to review the current changes.
```

OpenAPI parse / recovery examples:

```bash
node scripts/ae-tools.mjs swagger openapi.json method:POST keyword:login mode:detail
node scripts/ae-tools.mjs recovery
```

## Multi-Agent Config (Optional)

`multi_agent.enabled` accepts `auto` (default) | `true` | `false`. `auto`/`true` only analyze parallelism and candidate waves—they do **not** authorize write workers by themselves; `false` forces serial work.

New-install templates prefer `preferred_model: gpt-6.1-sol`. Copy `docs/ae/templates/ae-skill-profiles.example.yaml` to `.codex/ae-skill-profiles.yaml` and edit fields as needed; updates never overwrite an existing local file. Verify with:

```bash
node scripts/ae-tools.mjs task-analyze --mode plan --plan docs/ae/plans/<your-plan>.md
```

## Repository Layout

```text
plugins/ai-agent-engine-codex/   # plugin body; only skill source
scripts/                         # install, update, ae-tools, …
CHANGELOG.md / CHANGELOG.en.md   # full version history
docs/                            # this repo’s docs; consumers also get docs/ae after init
.agents/                         # consumer install layout only; not a skill source here
```

## Important Boundaries

- `/ae-*` is a compatibility label, not a Codex command registered by this repo; name the skill explicitly, or pick it from the skill list in supported Apps.
- Local checks ≠ live Codex host/model behavior, deployment, or production capacity.
- No real MCP server yet; `.mcp.json` is intentionally empty.
- `ae-graph-*` is a shallow read-only preview, not a persisted full graph.
- `ae-merge-branch` is deferred; browser verification goes through `ae-test-browser` (Codex Browser / Playwright / available DevTools).
- Git writes, destructive file ops, network, dependency installs, and database writes require Codex explicit authorization.

## Development Checks And Publishing

```bash
npm run check
npm test
npm run check:smoke
node scripts/check-release-notes.mjs
git diff --check
```

Before release, see [docs/release-checklist.md](docs/release-checklist.md).

- Distributable changes under `plugins/ai-agent-engine-codex/` must sync the root `package.json`, plugin manifest, README, and CHANGELOG, and pass release checks.
- Fixes only in root `scripts/`, `tests/`, or public docs do not auto-bump the version, but still need the affected tests and checks above.
- Read repository `AGENTS.md` before contributing.

## License

See [LICENSE](LICENSE) and [NOTICE.md](NOTICE.md). Plugin metadata retains `GPL-2.0-only`.
