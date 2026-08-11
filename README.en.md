# AI Agent Engine for Codex

AI Agent Engine for Codex is a project-local Codex plugin that brings AE-style engineering workflows into a Codex workspace. It packages Codex skills and local helper scripts for requirement clarification, design contracts, planning, implementation, review, validation, frontend/web routing, Swagger/OpenAPI inspection, handoff, and experience capture.

> Reference project: https://gitee.com/jiangqiang1996/ai-agent-engine<br>
> This repository references the workflow design and capability model of the Gitee AI Agent Engine project above.<br>
> It also draws on selected development-skill ideas from https://github.com/openai/plugins and https://github.com/obra/superpowers.<br>
> It also draws on external skill repository governance, continuous learning, verification-loop, and Codex adaptation boundary ideas from https://github.com/affaan-m/everything-claude-code.<br>
> It also adapts selected Spec Kit workflow ideas from https://github.com/github/spec-kit without vendoring its runtime.<br>
> It also adapts selected minimality and over-engineering review ideas from https://github.com/DietrichGebert/ponytail without importing its runtime, hooks, or persona mode.<br>
> It is not a direct OpenCode runtime port. It uses Codex skills, project-local plugin files, and local scripts.

中文文档: [README.md](README.md)

## When To Use It

Use this plugin when you want a Codex project to keep repeatable engineering workflows close to the repository:

- clarify fuzzy requirements before implementation;
- turn requirements into executable plans;
- run implementation with Git/worktree safety checks;
- review code or documents with findings first;
- keep validation evidence, handoffs, and reusable experience in project docs;
- initialize project guidance, archive rules, and durable AI memory.

## Quick Start

Install the plugin into a target Codex project:

```bash
node scripts/install-project.mjs --target /path/to/your/codex-project
```

Windows PowerShell:

```powershell
node scripts\install-project.mjs --target D:\codes\your-project
```

Restart or reopen the Codex conversation for that target project, then initialize its AE docs, process archive, UTF-8 rules, and AI memory scaffold from the target project root:

```bash
node scripts/ae-tools.mjs init
```

Useful init variants:

```bash
node scripts/ae-tools.mjs init --lang zh-CN
node scripts/ae-tools.mjs init --lang bilingual
node scripts/ae-tools.mjs init --dry-run
```

Verify the installed helper:

```bash
node scripts/ae-tools.mjs help
```

## Capabilities

- `ae-help`: list installed AE capabilities and boundaries.
- `ae-init`: initialize project docs, archive rules, UTF-8 rules, and durable AI memory.
- `ae-ideate`: generate solution directions, tradeoffs, risks, and next questions.
- `ae-brainstorm`: clarify requirements with multi-perspective collision insights and capture acceptance criteria.
- `ae-design`: create a design contract between PRD and plan for architecture, API, data, UI/UX, tests, and non-functional constraints.
- `ae-lfg`: run the full flow from requirements to verified delivery.
- `ae-plan`: create implementation plans without editing product code, including simplest-viable-route checks for implementation-heavy work.
- `ae-constitution`: create or update durable project governance for plans and reviews.
- `ae-tasks`: turn approved plans into dependency-ordered implementation task artifacts.
- `ae-work`: execute plans after Git/worktree safety checks, using a Minimality Gate before behavior edits.
- `ae-refactor`: plan behavior-preserving refactors.
- `ae-review`: review code or documents with severity-ordered findings first; complexity reviews can use delete, stdlib, native, yagni, and shrink tags.
- `ae-doc-humanize`: rewrite structured or stiff notes into readable documents.
- `ae-doc-structure`: turn messy notes into requirements, plans, handoffs, or checklists.
- `ae-frontend-design`: design and implement frontend UI.
- `ae-web-forge`: unified frontend/web routing entrypoint that selects existing AE skills and closes with browser acceptance.
- `ae-web-app`: implement Web app interaction, API, and light full-stack flows after `ae-web-forge` routing.
- `ae-backend`: implement API, service, data, and permission behavior from repository contracts.
- `ae-debug`: investigate build failures, runtime errors, UI issues, and API incidents systematically.
- `ae-reverse-engineering`: analyze authorized artifacts defensively with scope, provenance, and reproducible evidence boundaries.
- `ae-tdd`: run a red-green-refactor loop when behavior is precise enough for test-first work.
- `ae-task-loop`: iterate on exploratory fixes with smallest plausible fix hypotheses before broadening scope.
- `ae-test-browser`: validate UI flows in a real browser.
- `ae-test-api`: verify post-change backend API contracts, risk paths, and tiered evidence while recording a sanitized API Verification Record. When an authenticated smoke lacks a local secret reference, create a non-empty UTF-8 fillable request-config template with `REPLACE_WITH_LOCAL_TOKEN` for the user to edit locally.
- `ae-imagegen-prompt`: turn visual ideas into image-generation prompts with reference roles, generation budgets, and storyboard assets; prompt-only work does not require hooks.
- `ae-sql`: generate, review, or execute SQL with explicit safety boundaries.
- `ae-swagger-parser`: summarize or filter Swagger/OpenAPI specs.
- `ae-handoff`: capture task state, evidence, blockers, and next steps.
- `ae-prompt-optimize`: turn vague requests into executable Codex prompts.
- `ae-save-experience`: capture reusable project experience.
- `ae-skill-creator`: create or update Codex skills.
- `ae-skill-audit`: audit external agent/skill repositories and extract AE-fit improvements.
- `ae-agent-creator`: create Codex-compatible agent prompts and delegation templates.
- `ae-update`: update the project-local AE for Codex installation.
- `ae-language`: advanced entrypoint for switching project-local AE skill display language.

The helper CLI is available through:

```bash
node scripts/ae-tools.mjs help
```

Validate design contracts:

```bash
node scripts/check-design-contract.mjs
```

Validate declared memory and documentation relations:

```bash
node scripts/check-memory-knowledge-contract.mjs
node scripts/ae-tools.mjs ae-memory-query --topic graph
node scripts/ae-tools.mjs ae-knowledge-map --limit 20
node scripts/ae-tools.mjs ae-knowledge-query --path docs/08-ai-memory/08-phase-two-tooling.md --direction outgoing
```

Memory queries only read registered Markdown and relations from `docs/08-ai-memory/00-registry.json`. A no-match returns only `no declared match`; unregistered documents are not searched. `ae-knowledge-map` and `ae-knowledge-query` return only `declared` relationships with their evidence. None of these commands creates a cache, database, graph file, or CodeGraph state.

Additional helper commands:

```bash
node scripts/ae-tools.mjs ae-graph-build --root scripts
node scripts/ae-tools.mjs ae-graph-query --root scripts --path ae-tools.mjs
```

`ae-graph-build` and `ae-graph-query` are shallow, read-only dependency graph helpers. Their additive `limits` object reports requested/effective file and edge limits, returned counts, and truncation. The default remains a 500-file scan with uncapped edges; only `--edge-limit` truncates edges. They do not write `docs/ae/graphs/graph.json` or `.ae/graph.db`, maintain graph freshness, shard a graph schema, or render a preview page.

## Project-Level Installation

Project-level installation is the recommended path. It writes only inside the target project and avoids changing global Codex configuration.

After this repository is published, you can ask a Codex agent inside the target project to install it:

```text
Fetch and follow the project-level install instructions from https://raw.githubusercontent.com/YaoGUanquan/codex-ai-agent-engine/main/INSTALL.md
```

From this repository, install directly with:

```bash
node scripts/install-project.mjs --target /path/to/your/codex-project
```

The default install uses bilingual skill-list metadata. You can explicitly switch to Chinese or English:

```bash
node scripts/install-project.mjs --target /path/to/your/codex-project --lang zh-CN
node scripts/install-project.mjs --target /path/to/your/codex-project --lang en
```

The default metadata language is `bilingual`. Supported metadata languages are `en`, `zh-CN`, and `bilingual`.

The installer writes these paths inside the target project:

- `plugins/ai-agent-engine-codex/`
- `.agents/plugins/marketplace.json`
- `.agents/skills/ae-*`
- `scripts/ae-tools.mjs`
- `scripts/update-ae-codex.mjs`
- `scripts/set-ae-language.mjs`

## Migrate From Project-Level To Per-User Global Installation

Global installation publishes the AE skills as one current-user personal Codex plugin while retaining a private dispatcher. Each project's `AGENTS.md`, `docs/**`, AI memory, graph, and archive remain in that project root.

Generate a read-only preview from the distribution repository. It does not write, delete, or move files:

```powershell
Set-Location 'D:\codes\ph-AI-Agent-Engine'
$preview = node scripts\install-global.mjs preview | ConvertFrom-Json
$preview.projects | Format-Table root, role, components
```

To install or update only the current user's global plugin, apply that default preview directly:

```powershell
node scripts\install-global.mjs apply --apply --operation $preview.operationId --confirm $preview.confirmation
```

The default preview/apply installs the global plugin for the current user and never scans project roots. To switch a project-level install to the global install, create an explicit manifest. Manifest roots are caller-supplied paths for the current user; the installer does not infer `D:\\codes` or fixed project names. Inspect the preview, then use that same manifest for apply:

```json
{
  "projects": [
    { "root": "D:\\codes\\work", "role": "consumer" }
  ]
}
```

```powershell
$manifest = 'C:\temp\ae-consumers.json'
$preview = node scripts\install-global.mjs preview --manifest $manifest --retire-modified | ConvertFrom-Json
$preview.projects | Format-Table root, role, components
node scripts\install-global.mjs apply --manifest $manifest --retire-modified --apply --operation $preview.operationId --confirm $preview.confirmation
```

By default, an `owned: false`, `deferred`, or unknown component blocks apply. Do not manually delete project-level files. Pass `--retire-modified` to both preview and apply only when you explicitly accept complete backup before retiring modified or unknown historical AE components. Migration only touches declared `consumer` roots; project `docs/**`, `AGENTS.md`, AI memory, graph, and archive stay in place. Backups and journals remain until an explicit `purge --operation <id> --apply`. The distribution source and deferred roots are always excluded. After a successful migration, invoke the per-user dispatcher from any project root:

```powershell
node "$HOME\.agents\ai-agent-engine-codex\bin\ae.mjs" help
node "$HOME\.agents\ai-agent-engine-codex\bin\ae.mjs" init --project-root (Get-Location).Path
codex plugin list
```

Each operating-system user has an independent `$HOME`, dispatcher, backup area, and personal marketplace. The distribution source may intentionally show both its local development skills and the personal plugin; migrated consumer projects should use only the personal plugin. The installer never edits `.codex/plugins/cache`.

## Initialize Project Docs And Memory

After installation, run init from the target project root:

```bash
node scripts/ae-tools.mjs init
```

This creates:

- `AGENTS.md`: project-facing Codex guidance;
- `docs/ae`: AE workflow artifacts such as plans, reviews, handoffs, and experience notes;
- `docs/00-process`: active process notes, archive rules, and reusable process templates;
- `docs/08-ai-memory`: durable project AI memory;
- `docs/ai-memory`: compatibility pointer for earlier scaffolds.

Existing files are skipped by default. `--force` only overwrites files that contain the AE init marker.

Generated text files are written as UTF-8. On Windows, PowerShell can render valid UTF-8 Chinese text as garbled output, so verify with explicit UTF-8 reads or Git diff before rewriting files.

## External References

This repository keeps a clear Codex-native boundary:

- `https://gitee.com/jiangqiang1996/ai-agent-engine` is the main AE workflow reference.
- `https://github.com/obra/superpowers` informs parts of the planning, debugging, TDD, verification, and delivery-gate workflow design.
- `https://github.com/openai/plugins` informs parts of the frontend, backend, web-app, and skill-packaging design.
- `https://github.com/github/spec-kit` informs constitution, requirement checklist, task breakdown, and cross-artifact analysis patterns.
- `https://github.com/DietrichGebert/ponytail` informs minimality gates, complexity review tags, and deliberate simplification tracking. AE adapts the method only; it does not vendor Ponytail runtime hooks, mode persistence, statusline behavior, MCP, or benchmark display.

Those repositories are reference inputs. This project rewrites the relevant parts into local `ae-*` skills and helper scripts instead of reusing their runtimes.

## Daily Usage

Codex does not provide OpenCode `config.command`-style dynamic slash command registration. This project exposes AE entrypoints as Codex skills: you can invoke names such as `$ae-plan` and `$ae-review` explicitly, or use natural-language requests; in supported Codex App versions, enabled skills may also appear in the `/` command or skill search list. Treat that as skill-backed discoverability, not as OpenCode-style command injection implemented by this repository.

```text
Use ae-help to show the current AE capabilities.
Use ae-init to initialize AGENTS.md, docs/ae, docs/00-process, and docs/08-ai-memory.
Use ae-plan to create an implementation plan for adding permission-checked file upload.
Use ae-work to execute docs/ae/plans/2026-05-11-001-file-upload-plan.md.
Use ae-review mode:report-only to review my current changes.
```

Inspect OpenAPI:

```bash
node scripts/ae-tools.mjs swagger openapi.json method:POST keyword:login mode:detail
```

Inspect a shallow dependency graph:

```bash
node scripts/ae-tools.mjs ae-graph-build --root scripts
node scripts/ae-tools.mjs ae-graph-query --root scripts --path ae-tools.mjs
```

Initialize a project memory and archive scaffold:

```bash
node scripts/ae-tools.mjs init --lang zh-CN
```

Recover likely continuation artifacts:

```bash
node scripts/ae-tools.mjs recovery
```

## Skill List Language

The skill list descriptions shown by Codex come from static metadata. The default install uses bilingual metadata. They cannot switch live inside an already-open Codex conversation, but you can rewrite the project-local metadata and then restart or reopen the project conversation.

You can also ask a Codex agent in the target project to switch the language for you.

Switch to Chinese:

```text
Fetch and follow the AE skill language switch instructions from https://raw.githubusercontent.com/YaoGUanquan/codex-ai-agent-engine/main/INSTALL.md and switch this project to zh-CN.
```

Switch to English:

```text
Fetch and follow the AE skill language switch instructions from https://raw.githubusercontent.com/YaoGUanquan/codex-ai-agent-engine/main/INSTALL.md and switch this project to en.
```

For bilingual metadata, replace the final `zh-CN` or `en` with `bilingual`.

From an installed target project:

```bash
node scripts/set-ae-language.mjs --lang en
node scripts/set-ae-language.mjs --lang zh-CN
node scripts/set-ae-language.mjs --lang bilingual
```

From this repository, use an explicit target:

```bash
node scripts/set-language.mjs --target /path/to/your/codex-project --lang zh-CN
```

## Update

From an installed target project:

```bash
node scripts/update-ae-codex.mjs --repo https://github.com/YaoGUanquan/codex-ai-agent-engine.git --branch main
```

The updater preserves the installed language metadata when possible; if it cannot detect one, it defaults to bilingual metadata. To override it:

```bash
node scripts/update-ae-codex.mjs --repo https://github.com/YaoGUanquan/codex-ai-agent-engine.git --branch main --lang bilingual
```

Or ask a Codex agent:

```text
Fetch and follow the update instructions from https://raw.githubusercontent.com/YaoGUanquan/codex-ai-agent-engine/main/INSTALL.md
```

## Multi-Agent Auto Configuration

`multi_agent.enabled` supports three values:

- `auto`: the default. `task-analyze` analyzes safe parallelism and reports `execution_strategy`, `read_parallel_eligibility`, `write_parallel_eligibility`, and `parallel_waves`, but it does not authorize write-worker agents by itself.
- `true`: explicitly enables multi-agent analysis. Safety gates still apply.
- `false`: hard off switch that forces serial execution.

Recommended safe default:

```yaml
multi_agent:
  enabled: auto
  mode: suggest
  max_workers: 3
  min_parallel_units: 2
  require_clean_git: true
  require_plan_dependencies: true
  require_disjoint_files: true
  allow_write_agents: false
  review_lanes_parallel: true
```

The updater copies the latest template to `docs/ae/templates/ae-skill-profiles.example.yaml`, but it does not overwrite the local runtime profile. To enable or adjust the profile in a target project:

```bash
mkdir -p .codex
cp docs/ae/templates/ae-skill-profiles.example.yaml .codex/ae-skill-profiles.yaml
```

Windows PowerShell:

```powershell
New-Item -ItemType Directory -Force -Path .codex | Out-Null
Copy-Item docs\ae\templates\ae-skill-profiles.example.yaml .codex\ae-skill-profiles.yaml
```

Read-only review lanes use `read_parallel_eligibility`; write workers use `write_parallel_eligibility`. Write-agent auto parallelism requires additional explicit opt-in with `mode: auto` and `allow_write_agents: true`. Even then, `task-analyze` only reports config readiness; the orchestrating agent must complete the Git Pre-Edit Gate before any write-worker spawn. After merging this branch to `main`, other projects should update first, copy or edit `.codex/ae-skill-profiles.yaml`, then verify against a real plan:

```bash
node scripts/ae-tools.mjs task-analyze --mode plan --plan docs/ae/plans/<your-plan>.md
```

## Manual Installation

Use manual installation only when you do not want to run the installer.

1. Copy `plugins/ai-agent-engine-codex/` into the target project under `plugins/`.
2. Copy the root helper into the target project:

```bash
mkdir -p scripts
cp scripts/ae-tools.mjs /path/to/project/scripts/ae-tools.mjs
```

Windows PowerShell:

```powershell
New-Item -ItemType Directory -Force -Path D:\codes\your-project\scripts | Out-Null
Copy-Item scripts\ae-tools.mjs D:\codes\your-project\scripts\ae-tools.mjs
```

3. Copy `scripts/set-language.mjs` as `/path/to/project/scripts/set-ae-language.mjs` if you want metadata language switching after manual install.
4. Copy `plugins/ai-agent-engine-codex/skills/*` into `/path/to/project/.agents/skills/`.
5. Add this project-level marketplace entry to `/path/to/project/.agents/plugins/marketplace.json`:

```json
{
  "name": "ai-agent-engine-codex",
  "source": {
    "source": "local",
    "path": "./plugins/ai-agent-engine-codex"
  },
  "policy": {
    "installation": "INSTALLED_BY_DEFAULT",
    "authentication": "ON_INSTALL"
  },
  "category": "Coding"
}
```

## Repository Layout

```text
.agents/                         # Project-local self-install for this repo
plugins/ai-agent-engine-codex/   # Codex plugin package
scripts/ae-tools.mjs             # Root helper wrapper
scripts/install-project.mjs      # Project-level installer
scripts/update-ae-codex.mjs      # Target-project updater
docs/codex-port-analysis.md      # Migration analysis from OpenCode to Codex
docs/ae/                         # AE workflow artifacts after init
docs/00-process/                 # Active process notes, templates, and archive rules after init
docs/08-ai-memory/               # Durable project AI memory after init
docs/ai-memory/                  # Compatibility pointer after init
```

## Important Boundaries

- `/ae-*` names are compatibility labels, not Codex commands registered by this repository.
- Reliable trigger style is: `Use ae-work ...`, `Use ae-review ...`, `Use ae-plan ...`, or selecting an enabled AE skill through `/` / skill search in Codex App versions that surface enabled skills there.
- Slash-list visibility is Codex skill discoverability and must be verified in the active Codex App; this repository does not claim OpenCode `config.command` parity.
- This MVP does not provide a real MCP server yet. `.mcp.json` is intentionally empty.
- Local JSON/YAML OpenAPI parsing works without extra dependencies for common spec structures; complex YAML remains bounded by the lightweight parser.
- `ae-graph-build` and `ae-graph-query` are shallow read-only scripts; they do not persist `docs/ae/graphs/graph.json` and are not the full OpenCode graph tool.
- `ae-merge-branch` is intentionally deferred until `ae-work` has stronger Git evidence and authorization boundaries.
- Chrome DevTools behavior is routed through existing Browser, Playwright, or available DevTools tools in `ae-test-browser`; this project does not dynamically register OpenCode MCP tools.
- Git writes, destructive filesystem actions, network fetches, dependency installs, database writes, and browser setup must use Codex's explicit approval model.

## Development Checks

From this repo:

```bash
npm run check
node --check scripts/ae-tools.mjs
node --check plugins/ai-agent-engine-codex/scripts/ae-tools.mjs
node scripts/check-release-notes.mjs
node scripts/check-design-contract.mjs
node scripts/ae-tools.mjs help
node scripts/ae-tools.mjs ae-graph-build --root scripts
```

Validate skills with your local Codex skill validator if available.

See [docs/release-checklist.md](docs/release-checklist.md) before publishing a GitHub release.

## Ongoing Optimization Roadmap

A repository-wide scan on 2026-08-11 already removed the duplicated root/plugin `update-project.mjs` copy, added `.tmp-install-smoke-checks/` to `.gitignore`, wired `scripts/check-claims.mjs --dry-run` into `npm run check`, and archived the three stale OPTIMIZATION planning documents to `docs/99-archive/2026-08/skill-optimization-roadmap/`. The remaining structural debt, in priority order:

1. **Split the `ae-tools.mjs` monolith** (~2700+ lines): extract `init-templates`, `graph`, `swagger`, and `evidence` modules along command boundaries, keeping only dispatch in the entry file; move the bilingual init templates into external UTF-8 files with placeholder substitution. Every split must keep the root thin-wrapper paths stable and be regressed with `npm test` plus the install smoke checks.
2. **Reorganize the `package.json` `check` chain** (2000+ characters): split into layered `check:syntax` / `check:contracts` / `check:smoke` scripts or a runner script that globs script paths, so new scripts cannot be silently missed; relax the full-string regex assertions on the check chain in `tests/skill-scripts.test.mjs` into "this check step exists" assertions.
3. **Split the giant test file by domain**: break `tests/skill-scripts.test.mjs` (~3400 lines) into global-install, ae-tools, contracts, and skills-docs test files to reduce maintenance and triage cost.
4. **Extract shared path-guard helpers**: deduplicate `readArg` / `isRepositoryRelativePath` / `toPosix` between `check-ae-artifacts.mjs` and `check-design-contract.mjs` into a shared plugin module; also harden `ensureInsideRepo` in `check-install-smoke.mjs` against Windows cross-drive absolute paths.
5. **Cover weakly tested scripts**: add direct tests for `set-repository.mjs`, `update-project.mjs` (clone can be simulated with a local file:// repository), and `install-project.mjs`.
6. **Keep the default check fast**: the full install smoke is heavy; move it into a `check:smoke` layer so daily development runs the light layers and releases run everything.

Items 1-6 above are structural debt currently being executed in a dedicated structural-debt-refactor stream; they will land with their own release notes and validation evidence. After the 2026-08-11 frontend skill optimization (0.3.18 / 0.3.19), the following directions were added:

7. **Older frontend stack adaptation**: `svelte-guidance.md` and `angular-guidance.md` baseline on Svelte 5 runes and Angular standalone/signals, and the Vue guidance centers on the Composition API; repositories on Svelte 4 stores, NgModules, or the Options API fall back to the "match existing repository style" rule with lower checklist hit rates. Direction: add legacy-style counterpart entries on demand when a real legacy-stack project exposes the gap, instead of pre-filling every variant.
8. **Release-notes extraction**: README version entries keep growing (nearly 20 under 0.3.x) and are maintained bilingually, making the README long. Direction: move historical entries to `CHANGELOG.md` or `docs/`, keep only the latest few versions in the README, and adjust the `scripts/check-release-notes.mjs` validation target and matching test assertions accordingly.
9. **Process-document archiving discipline**: `docs/00-process/active/` contains finished or stalled task directories (such as personal-marketplace-global-plugin). Direction: archive them into `docs/00-process/archive/YYYY-MM/<task>` or `docs/99-archive/` per the AGENTS.md rules so the active directory only reflects genuinely in-flight work.
10. **Cross-consistency of frontend quality contracts** (evaluation item): the accessibility baseline in `web-ui-quality.md`, the Frontend Components / Styles lens in `ae-review`, and the keyboard-operability item in `browser-acceptance.md` are currently kept aligned manually. Direction: if frontend entries keep growing, first evaluate whether a lightweight mapping note or contract check pays for itself before implementing one, to avoid a permanent validation burden for a one-off mapping.

Working rule: any change that touches distributable plugin content (`plugins/ai-agent-engine-codex/`) must bump both SemVer versions and add README release notes; repository-side refactors (root `scripts/`, `tests/`, docs) do not bump the version but must ship with `npm run check` and `npm test` fully green.

## Version Updates

### 0.3.20 (2026-08-11)
- Structural refactor: the plugin's `scripts/ae-tools.mjs` (a ~2860-line monolith) is split into 15 command modules under `scripts/ae-tools/` (utils, yaml, git, evidence, graph, help, recovery, gate, tasks, review, swagger, claude, markitdown, static-server, init); the entry file keeps only command dispatch and global argument parsing, and the thin root wrapper `scripts/ae-tools.mjs` import path in target projects is unchanged.
- The trilingual init templates are externalized to UTF-8 files under `scripts/ae-tools/init-templates/{en,zh-CN}/*.md` with `{{placeholder}}` substitution; bilingual output is composed from the two languages, and CRLF is normalized at render time so checkout line endings cannot leak into generated files.
- Added the shared in-plugin module `scripts/artifact-check-utils.mjs`; `check-ae-artifacts.mjs` and `check-design-contract.mjs` now reuse readArg / isRepositoryRelativePath / toPosix / parseFrontmatter and related helpers instead of keeping duplicate copies.
- Added a module-dependency regression guard: `tests/ae-tools.test.mjs` statically builds the local-import graph of `scripts/ae-tools/*.mjs`, DFS-checks it for cycles, and asserts `utils.mjs` stays a zero-local-import foundation layer; introducing a circular import now fails `npm test` with the printed cycle chain.
- Validation: `node scripts/check-syntax.mjs`, before/after golden-output comparison of key commands (help/recovery/graph-build/graph-query/review-contract/evidence/gate/claude-delegate, differing only in timestamps and git fingerprints), byte-identical trilingual init output against the pre-split baseline (48 baseline files), `npm test` (112 tests), `npm run check`, `node scripts/check-install-smoke.mjs`, and `node scripts/check-global-install-smoke.mjs`. These checks prove the CLI behavior and install contract are unchanged after the split; they do not prove runtime acceptance in any target project.

### 0.3.19 (2026-08-11)
- Completed frontend stack coverage: `ae-web-app` adds `svelte-guidance.md` (Svelte 5 runes/SvelteKit: `$derived` first, `$effect` cleanup, keyed each blocks, load functions, `$lib/server` boundary) and `angular-guidance.md` (standalone/signals: async pipe or `takeUntilDestroyed` subscription hygiene, OnPush visibility, `@for` track, typed forms, `switchMap` race cancellation, SSR guards); the skill workflow now selects among React/Vue/Svelte/Angular guidance, with other stacks falling back to existing repository conventions.
- Frontend adaptation of non-frontend skills: the `ae-review` rule profiles add a "Frontend Components / Styles" lens (Vue/Svelte/Angular reactivity mistakes, list keys/track expressions, click handlers without keyboard equivalents, diff-weakened accessibility, style leakage, `innerHTML`-style sinks) with a framework-anchored suppression rule; the `ae-tdd` workflow adds frontend test-harness guidance (reuse the existing runner and component-testing library, assert user-visible behavior, jsdom does not prove real-browser behavior and routes to `ae-test-browser`).
- Evaluated and intentionally unchanged: the local-runtime smoke gate already covers UI surfaces; browser acceptance for plans stays owned by the `ae-lfg`/`ae-web-forge` pipeline instead of being duplicated inline.
- Validation: `node scripts/check-skill-mirror.mjs`, `node scripts/check-skill-contract.mjs`, `node scripts/check-skill-language-metadata.mjs`, `node scripts/check-release-notes.mjs`, `node scripts/check-install-smoke.mjs`, and `npm test`. These checks prove skill docs, mirror, and distribution contracts only, not runtime or browser acceptance in any target frontend project.

### 0.3.18 (2026-08-11)
- Strengthened the frontend-facing skill references: `ae-web-app` React guidance now covers structure conventions, common defect traps (derived state, effect discipline, list keys, async races, controlled inputs, measured memoization), Next.js/SSR boundaries, and user-facing states, plus a new parallel `vue-guidance.md` (Vue 3/Nuxt: reactivity loss, computed-first, `v-for` keys, one-way props flow, SSR boundaries); the skill workflow now selects the guidance matching the repository stack.
- `ae-frontend-design` quality checklist and design rules add an accessibility baseline (semantic structure, labeled controls, keyboard reachability with visible focus, contrast, alt text), responsive breakpoint verification, and async-loading layout stability; `ae-web-app` deployment readiness adds a frontend-performance non-regression item; `ae-debug` adds a frontend failure quick map (blank page, hydration, CORS/auth, cache, styles, environment differences); `ae-test-browser` minimum acceptance evidence adds keyboard operability of the primary control.
- Validation: `node scripts/check-skill-mirror.mjs`, `node scripts/check-skill-contract.mjs`, `node scripts/check-skill-language-metadata.mjs`, `node scripts/check-release-notes.mjs`, `node scripts/check-install-smoke.mjs`, and `npm test`. These checks prove skill docs, mirror, and distribution contracts only, not runtime, browser, or deployment acceptance in any target frontend project.

### 0.3.17 (2026-08-10)
- Hardened `ae-test-api` and the shared local-runtime smoke gate credential handoff: agents must create a non-empty UTF-8 (no BOM) fillable request-config template with method, path, fill steps, and `REPLACE_WITH_LOCAL_TOKEN`, and must not leave empty files or write non-ASCII configs through unsafe PowerShell redirection.
- Added the `request-config-template` reference as the canonical template shape; agents hand off only the absolute path and never read the user-populated token. Validation: `node --test --test-name-pattern "API bubble testing|local runtime smoke gate" tests/skill-scripts.test.mjs`, `node scripts/check-skill-mirror.mjs`, and `node scripts/check-release-notes.mjs`. These checks prove skill and distribution contracts only, not target-project authenticated API acceptance.

### 0.3.16 (2026-08-10)
- A `recovery-failed` operation cannot be purged until `recover --operation <id>` reaches `rolled-back`, preventing deletion of the only backup before recovery succeeds. Validation adds this recovery-lifecycle regression case.

### 0.3.15 (2026-08-10)
- On Windows, global apply invokes the Codex CLI through `cmd.exe`, explicitly registers the user marketplace with `codex plugin marketplace add $HOME --json`, then installs the plugin. Both CLI steps are journaled and installer-owned files roll back if either step fails.

### 0.3.14 (2026-08-10)

- Global apply now publishes `ai-agent-engine-codex` through the current user's personal marketplace and calls `codex plugin add ai-agent-engine-codex@personal --json`; it does not patch the Codex cache or client registry.
- The installer backs up legacy user-level AE skill copies rather than reactivating duplicate skills, and its confirmation digest now binds `--retire-modified`. Validation covers successful personal publication, retained marketplace entries, and installer-owned file rollback after a CLI-registration failure; real client visibility is verified separately with `codex plugin list`.

### 0.3.13 (2026-08-10)

- Global migration now uses an explicit manifest instead of deriving consumers from local paths or project names; project components are backed up and retired only after fingerprint verification by default.
- Added `--retire-modified`, a separate authorization in addition to apply operation ID and confirmation for full-backup retirement of modified or unknown AE components. A global runtime created by an installer journal can upgrade transactionally.

### 0.3.12 (2026-08-10)

- Added per-user global AE distribution with a deterministic dispatcher while keeping project docs, memory, graph, and archives in their original project roots.
- Validation uses `npm.cmd test`, `npm.cmd run check`, a global preview smoke, and an isolated apply fixture. These prove the local distribution contract only; they neither authorize nor prove an actual consumer apply.
- Verified `$HOME/.agents/skills` discovery and probe invocation in a fresh `codex-cli 0.146.1` session. An already-open Codex desktop task does not hot-reload its startup skill catalog.

### 0.3.11 (2026-08-06)

- Hardened `ae-claude-code` after installing OpenAI's `codex@openai-codex` Claude Code plugin: its default delegated child now emits JSON without session persistence, runs in `plan` mode with `Read,Grep,Glob` only, and disables slash commands.
- Documented the directional boundary: the official plugin lets an interactive Claude Code session invoke Codex through `/codex:*`; it does not let Codex control Claude Code. Claude-to-Codex transfer and review use the official plugin, while Codex-to-Claude delegation remains a separate read-only second-opinion lane.
- Distribution validation uses `npm.cmd test`, `npm.cmd run check`, `node scripts/check-install-smoke.mjs`, `node scripts/check-release-notes.mjs`, and `git diff --check`. These checks prove local skill and distribution contracts only; they do not prove a future Claude/Codex interactive run, authentication state, quota, or target-project acceptance.

### 0.3.10 (2026-08-05)

- Added `ae-test-api` for post-change backend API bubble testing. It selects endpoints, success/error paths, and conditional contract risks, while keeping static tests, runtime health, authenticated API smoke, browser acceptance, and deployment evidence distinct.
- Each completed verification writes one sanitized API Verification Record with field provenance, assertion summaries, and unverified boundaries. It excludes bodies, tokens, cookies, private command material, and concrete resource identifiers; long-term knowledge relations require an explicit user request.
- The skill reuses the existing local-runtime smoke gate as the sole owner of local-call safety. It adds no default HTTP client, generated scripts, lifecycle manager, MCP runtime, external runner, or automatic repair. Distribution validation uses `npm.cmd test`, `npm.cmd run check`, `node scripts/check-install-smoke.mjs`, `node scripts/check-release-notes.mjs`, `node scripts/check-ae-artifacts.mjs`, and `git diff --check`; these checks prove local skill and distribution contracts only, not target-project authenticated API, browser, or deployment acceptance.

### 0.3.9 (2026-08-04)

- Added `ae-reverse-engineering` for user-owned or explicitly authorized binary, mobile, forensic, compatibility, and local training artifacts. It requires authorization, provenance, a static baseline, and evidence boundaries; it excludes license bypass, credential theft, evasion, active exploitation, scanning, and unauthorized target interaction.
- The skill does not install tools, register MCP servers, change global configuration, or automatically retain experience. Missing tools or isolation are controlled recommendations that require explicit authorization, and the report template separates observed, inferred, and unverified conclusions.
- Distribution validation uses `npm.cmd test`, `npm.cmd run check`, `node scripts/check-install-smoke.mjs`, `node scripts/check-release-notes.mjs`, `node scripts/check-ae-artifacts.mjs`, and `git diff --check`. These checks prove local skill and distribution contracts only, not real-artifact, toolchain, authorized-environment, or future-model-adherence acceptance.

### 0.3.8 (2026-08-04)

- Added the declared `docs/08-ai-memory/00-registry.json` contract, path-safe validator, `ae-memory-query`, `ae-knowledge-map`, and `ae-knowledge-query`. Markdown memory remains canonical; commands return only registered metadata and evidence-backed declared relations.
- `ae-graph-build` and `ae-graph-query` now expose additive `limits` metadata while retaining the default 500-file scan and uncapped edge behavior. Edge truncation requires explicit `--edge-limit`.
- The installer now ships the memory-contract checker, and install smoke verifies that an absent registry produces a structured non-zero diagnostic without creating state. This adds no CodeGraph, MCP auto-registration, network request, database, or background service.

### 0.3.7 (2026-08-03)

- Retired `ae-computer-use-guard` and `ae-video-edit-computer`, including their active mirrors, language metadata, installation expectations, and Computer Use hook templates. The installer removes these stale skill directories from target projects; this change adds neither compatibility aliases nor a desktop or video runtime.
- `ae-test-browser` now requires reconnaissance before action, `networkidle` when applicable, and black-box treatment for helper scripts. `ae-review` now requires a behavior baseline, call-path evidence, and a local design reason before recommending `delete` or `shrink`.
- `ae-prd`, `ae-plan`, and `ae-review` templates now offer optional must-have, deviation, and verification-gap records. Existing requirement IDs connect delivery criteria, approved variance, and missing proof; the templates do not add automatic judging, background loops, hooks, or runtime registration.
- Image-prompt work retains prompt-first general capability without depending on the retired Computer Use configuration.
- Distribution versions are synchronized at `0.3.7`. The change passed `npm test`, `npm run check`, `node scripts/check-install-smoke.mjs`, and `git diff --check`. These checks establish local distribution and static contracts only, not browser, deployment, or future-model-adherence acceptance.

## Publishing To GitHub

Create an empty GitHub repository, then from this directory:

```bash
node scripts/set-repository.mjs --repo https://github.com/YaoGUanquan/codex-ai-agent-engine
git init
git add .
git commit -m "feat: add Codex AI Agent Engine plugin"
git branch -M main
git remote add origin https://github.com/YaoGUanquan/codex-ai-agent-engine.git
git push -u origin main
```

## License And Attribution

See [LICENSE](LICENSE) and [NOTICE.md](NOTICE.md).

This project is inspired by AI Agent Engine and keeps `GPL-2.0-only` metadata for the adaptation.
