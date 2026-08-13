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

The distribution source itself is not an installation target. It uses the user-level personal plugin and keeps its maintenance mirror in `.ae-source/skills` to avoid duplicate discovery.

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

By default, an `owned: false`, `deferred`, or unknown component blocks apply. Do not manually delete project-level files. Pass `--retire-modified` to both preview and apply only when you explicitly accept complete backup before retiring modified or unknown historical AE components. Migration only touches declared `consumer` roots; project `docs/**`, `AGENTS.md`, AI memory, graph, and archive stay in place. Backups and journals remain until an explicit `purge --operation <id> --apply`. The distribution source and deferred roots are always excluded. After a successful migration, invoke the per-user dispatcher from any project root, then reopen Codex and Cursor chats:

```powershell
node "$HOME\.agents\ai-agent-engine-codex\bin\ae.mjs" help
node "$HOME\.agents\ai-agent-engine-codex\bin\ae.mjs" init --project-root (Get-Location).Path
codex plugin list
```

Each operating-system user has an independent `$HOME`, dispatcher, backup area, and personal marketplace. Codex discovers AE skills through the personal plugin; Cursor discovers the same skills through `~/.cursor/skills/ae-*` links to that plugin. The distribution source keeps its maintenance mirror in `.ae-source/skills` so Codex does not discover a duplicate beside the personal plugin; migrated consumer projects should use only the user-level distribution. The installer never edits `.codex/plugins/cache`. Already-open chats keep their startup skill catalog.

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

The canonical requirements directory is `docs/ae/prds`. Starting in 0.3.22, init no longer creates the legacy `docs/ai-memory` compatibility directory; existing projects keep that directory if it is already present.

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

After the files are updated, the updater automatically runs a conservative maintenance pass (`tidy --apply`: archive done process notes, remove empty task directories, move expired gate/evidence files, report oversized memory files; never stale archiving). Add `--no-tidy` to skip it; the result appears in the update output as `maintenance`.

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
CHANGELOG.md                     # Full release history (Chinese; English in CHANGELOG.en.md)
docs/codex-port-analysis.md      # Migration analysis from OpenCode to Codex
docs/ae/                         # AE workflow artifacts after init
docs/00-process/                 # Active process notes, templates, and archive rules after init
docs/08-ai-memory/               # Durable project AI memory after init
```

Starting in 0.3.22, init no longer creates `docs/ai-memory/`; older projects may still retain that compatibility entry.

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

1. ~~**Split the `ae-tools.mjs` monolith**~~ (**done in 0.3.20**, `315db38`): 15 command modules + external init templates; see `docs/ae/experience/2026-08-11-structural-debt-refactor.md`.
2. ~~**Reorganize the `package.json` `check` chain**~~ (**done in 0.3.20**): layered `check:syntax` / `check:contracts` / `check:smoke` / `check:all`; tests assert step presence instead of full-string regex.
3. ~~**Split the giant test file by domain**~~ (**done in 0.3.20**): `tests/global-install.test.mjs`, `contracts.test.mjs`, `ae-tools.test.mjs`, `skills-docs.test.mjs`, `install-scripts.test.mjs`.
4. ~~**Extract shared path-guard helpers**~~ (**done in 0.3.20**): `artifact-check-utils.mjs`; install-smoke cross-drive rejection hardened.
5. ~~**Cover weakly tested scripts**~~ (**done in 0.3.20**): `tests/install-scripts.test.mjs` (6 cases covering set-repository / install-project / update-project).
6. ~~**Keep the default check fast**~~ (**done in 0.3.20**): install-smoke moved to `check:smoke`; daily `npm run check` stays light.

The **2026-08-11 fullstack skill symmetry release (0.3.21)** landed backend language guidance, FE/BE contract checklist, debug boundary maps, and SQL safety checklist; see `docs/ae/experience/2026-08-11-fullstack-skill-optimization.md`. The **2026-08-11 frontend skill releases (0.3.18 / 0.3.19)** are documented in `docs/ae/experience/2026-08-11-frontend-skill-optimization.md`. Items 7 and 10 below were on-demand dormant items; after the 2026-08-11 re-check showed no trigger had fired, the user chose to close them early, and both shipped with **0.3.26**:

7. ~~**Older frontend stack adaptation**~~ (**done, 0.3.26**): `svelte-guidance.md`, `angular-guidance.md`, and `vue-guidance.md` each gained a minimal legacy counterpart section (Svelte 4 stores, the NgModule era, the Options API) beside the modern baseline; the stack-conditional first line and the "match existing repository style" fallback are unchanged, and a regression test locks the sections and mirrors. The on-demand policy was executed early at the user's direction on 2026-08-11 (triggers had not fired); see `docs/08-ai-memory/05-decision-log.md`. Residual risk: the counterpart entries were pre-written without a real defect driving them, so whether the granularity suffices awaits the first real legacy-stack project; any gap is extended for the affected framework only, per the decision log.
8. ~~**Release-notes extraction**~~ (**done in the 2026-08-11 batch**): historical entries moved to `CHANGELOG.md` / `CHANGELOG.en.md` (the complete history); each README keeps only the latest five entries, and `scripts/check-release-notes.mjs` enforces the window limit, the changelog link, and the subset relation; see `docs/ae/plans/2026-08-11-006-governance-batch-four-plan.md`.
9. ~~**Process-document archiving discipline**~~ (**done in the 2026-08-11 batch**): the four finished or pointer task directories were merged into `docs/00-process/archive/2026-08/`, so the active directory only reflects genuinely in-flight work; the conservative archived-pointer retention in `tidy` is unchanged, and this repository's closeout was a one-time manual archive pass.
10. ~~**Cross-consistency of frontend quality contracts**~~ (**done with the 0.3.26 batch, repository-side**): the lightweight map landed as `docs/ae/references/frontend-quality-contract-map.md`, recording the five correspondence groups, two coverage gaps, and existing test locks across `web-ui-quality.md`, the `ae-review` Frontend Components / Styles lens, and `browser-acceptance.md`; the map is descriptive, is not a fourth contract surface, and still adds no checker. The evaluation and early closeout are recorded in `docs/08-ai-memory/05-decision-log.md`. Residual risk: the map relies on manual upkeep — editors of the three contract files walk the correspondence groups by hand, the accepted cost of the no-checker decision.
11. ~~**Knowledge-base governance (next batch 0.3.22)**~~ (**completed in 0.3.22**): see `docs/ae/prds/2026-08-11-knowledge-base-governance-prd.md` and `docs/ae/experience/` (maintainer knowledge graph at `docs/ae/graphs/maintainer-artifact-graph.md`).

The **2026-08-11 full skill-portfolio audit (all 40 skills read one by one)** is complete: the five-layer structure (workflow spine 10 / implementation lanes 9 / verification lanes 2 / standalone tools 8 / meta-governance 11) is healthy overall, routing boundaries, evidence-tier wording, and handoff routing re-checked consistent, with no regression in prior governance items; full evidence, findings, and batch trade-offs live in `docs/ae/solutions/2026-08-11-skill-portfolio-optimization-audit.md`. New items below (12 first, 13-14 as one version-bump batch, 15 on-demand):

12. **Extend cross-skill reference link checking** (repository-side, no version bump, do first): `scripts/check-skill-contract.mjs` currently validates only links that target `SKILL.md`; references consumed across skill directories by 8+ skills (`local-runtime-smoke-gate.md`, `api-contract-checklist.md`, `validation-evidence-profile.md`, and others) have no link guard, so a rename or move breaks them silently. Extend validation to every relative `.md` link in SKILL.md and references (optionally backtick-quoted paths), and add a name-set assertion across the README capability list, the capability catalog, and the skill directories, with TDD-covered positive and negative cases.
13. **Unify the runtime entry story** (distributable content, version bump): 12 skill files plus the capability catalog hardcode the global dispatcher path `$HOME/.agents/ai-agent-engine-codex/bin/ae.mjs` in 46 command examples, while the README-recommended project-level install only provides the `scripts/ae-tools.mjs` entry, and skill docs mention that fallback in just 2 places. Add one shared "runtime entry resolution" note (project wrapper first, global dispatcher fallback, identical CLI contract), unify all command examples, and lock the form with a contract test.
14. **Complete the ae-help artifact contract table** (distributable content, same batch as 13): the path table in `artifact-contract.md` is missing rows for seven artifact families in active use - `docs/ae/designs`, `docs/ae/tasks`, `docs/ae/evidence`, `docs/ae/integrity`, `docs/ae/experience`, `docs/ae/work-reports`, and `docs/ae/constitution.md`; complete the table, document the boundary between `solutions` (external audits / solution research) and `experience` (retrospectives of completed work), and fold the rows into the directory-declaration regression assertions established in 0.3.25.
15. **On-demand items** (policy set, no active to-do until a trigger fires): move the seven lane-level sections of `ae-review` into references (trigger: another lane is added, or one real defect traces to a skipped lane); add a refactoring-methodology reference to `ae-refactor` - behavior baseline, characterization tests, seam analysis, incremental strategy (trigger: one attributable methodology miss in a real refactor task; a distributable change that bumps the version at that time); add one minimal "scenario card" replay checklist per workflow-spine skill under `docs/ae/templates/` (trigger: before a 0.4.x major version, or one delivery defect caused by skipped skill guidance).

Working rule: any change that touches distributable plugin content (`plugins/ai-agent-engine-codex/`) must bump both SemVer versions and add the release entry to both the README and the CHANGELOG (each README keeps only the latest five entries; older entries move to the changelog); repository-side refactors (root `scripts/`, `tests/`, docs) do not bump the version but must ship with `npm run check` and `npm test` fully green.

## Version Updates

Full history lives in [CHANGELOG.en.md](CHANGELOG.en.md); this section keeps only the latest five versions, and entries beyond that window move to the changelog on each release.

### 0.3.29 (2026-08-13)
- After publishing the Codex personal plugin, global apply creates current-user `~/.cursor/skills/ae-*` directory junctions (or POSIX directory symlinks) pointing at `$HOME/plugins/ai-agent-engine-codex/skills/<name>`, so Cursor and Codex discover the same AE skills. It does not recreate `~/.agents/skills` and never writes `~/.cursor/skills-cursor`.
- Verification: `npm test`, `npm run check`, `npm run check:smoke`, `node scripts/check-release-notes.mjs`. These checks prove isolated-home link creation, foreign Cursor skill retention, failed-batch rollback, and preview/doc contract consistency. They do not prove the current Cursor chat's `/ae` palette refreshed; open a new Cursor thread to observe slash discovery.

### 0.3.28 (2026-08-13)
- Global refresh: synchronize the root package and plugin manifest versions, then refresh the current user's AE plugin and dispatcher through the personal marketplace global-install flow; project-level docs, source, and user project data are unchanged.
- Verification: `npm test`, `npm run check`, `npm run check:smoke`, `node scripts/check-release-notes.mjs`. These checks prove version, skill mirror, install contracts, and global preview/install flow consistency; they do not represent runtime acceptance in target projects.

### 0.3.27 (2026-08-13)
- `ae-test-api` and the shared local smoke gate now build a sanitized request-context manifest before resolving `project runner -> single-request curl fallback -> blocked`. The pure contract requires an input provider for every applicable header, matching path/query/body same-context aliases, non-static lifetimes for derived values, and a project runner for non-GET methods unless the contract proves they are read-only.
- Add `plugins/ai-agent-engine-codex/scripts/request-context-contract.mjs` to validate context completeness, same-process credential visibility, runner method/path/assertion coverage, fallback eligibility, and `passed/request-context/client-config/transport/auth/business` outcomes (2xx is `passed`, 5xx is `transport`) without network access or secrets. The API verification record template now includes Request Context, Carrier, and Outcome fields.
- Verification: `npm test`, `npm run check`, `npm run check:smoke`, `node scripts/check-release-notes.mjs`. These checks prove pure contract behavior, skill docs, mirror, and distribution consistency; they do not prove authenticated target APIs, real header values, or state-changing smoke acceptance.

### 0.3.26 (2026-08-11)
- Add minimal legacy counterpart sections to the frontend guidance: `svelte-guidance.md` gains Svelte 4 (stores and `$:` reactive statements) counterparts, `angular-guidance.md` gains NgModule-era counterparts, and `vue-guidance.md` gains Options API counterparts; each sits beside the modern baseline with the stack-conditional first line and the "match existing repository style" fallback unchanged. A new regression test locks the sections and mirror equality (red first, then green).
- Add the maintainer map `docs/ae/references/frontend-quality-contract-map.md` recording the five correspondence groups, two coverage gaps, and existing test locks across `web-ui-quality.md`, the `ae-review` Frontend Components / Styles lens, and `browser-acceptance.md`; the map is descriptive, is not a fourth contract surface, and adds no checker. This batch closes roadmap items 7 and 10 early at the user's direction (the recorded triggers had not fired; see the 2026-08-11 decision-log entry).
- Verification: `npm test`, `npm run check`, `npm run check:smoke`, `node scripts/check-release-notes.mjs`. These checks prove skill docs, mirror, and distribution contracts only, not runtime acceptance of legacy stacks (Svelte 4 / NgModule / Options API) in any target project.

### 0.3.25 (2026-08-11)
- Unify the requirements-artifact directory declarations: the capability catalog's `ae-brainstorm` `artifactPath` moves from `docs/ae/brainstorms` to `docs/ae/prds`; the `ae-help` artifact contract's Requirements row and requirements frontmatter example now use `docs/ae/prds` with the `ae-prd` capture shape (`type: prd`), the plan `origin` example follows, and legacy requirements may remain under brainstorms; the `ae-review` document-review default search now includes `docs/ae/prds`. The top-level `artifactPaths` map and the init templates have been correct since 0.3.22 and are unchanged; `docs/ae/brainstorms` remains the exploratory-notes directory (`artifactPaths.ideas`).
- Add regression assertions locking the directory declarations (catalog, artifact contract, and scope detection in source and mirror); the stale directory note in the work reference project's existing `docs/ae/README.md` was fixed alongside (an init-managed legacy file that plugin updates do not rewrite).
- Verification: `npm test`, `npm run check`, `npm run check:smoke`, `node scripts/check-release-notes.mjs`. These checks prove skill docs, mirror, and distribution contracts only, not runtime acceptance in any target project.

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
