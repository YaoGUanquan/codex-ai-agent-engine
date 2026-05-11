# AI Agent Engine for Codex

AI Agent Engine for Codex is a project-local Codex plugin that brings AE-style engineering workflows into a Codex workspace. It packages Codex skills and local helper scripts for requirement clarification, planning, implementation, review, validation, Swagger/OpenAPI inspection, handoff, and experience capture.

> Reference project: https://gitee.com/jiangqiang1996/ai-agent-engine<br>
> This repository references the workflow design and capability model of the Gitee AI Agent Engine project above.<br>
> It is not a direct OpenCode runtime port. It uses Codex skills, project-local plugin files, and local scripts.

中文文档: [README.zh-CN.md](README.zh-CN.md)

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
- `ae-ideate`: generate solution directions, tradeoffs, risks, and next questions.
- `ae-brainstorm`: clarify requirements and capture acceptance criteria.
- `ae-lfg`: run the full flow from requirements to verified delivery.
- `ae-plan`: create implementation plans without editing product code.
- `ae-work`: execute plans after Git/worktree safety checks.
- `ae-refactor`: plan behavior-preserving refactors.
- `ae-review`: review code or documents with severity-ordered findings first.
- `ae-doc-humanize`: rewrite structured or stiff notes into readable documents.
- `ae-doc-structure`: turn messy notes into requirements, plans, handoffs, or checklists.
- `ae-frontend-design`: build a usable first frontend version.
- `ae-test-browser`: validate UI flows in a real browser.
- `ae-sql`: generate, review, or execute SQL with explicit safety boundaries.
- `ae-swagger-parser`: summarize or filter Swagger/OpenAPI specs.
- `ae-handoff`: capture task state, evidence, blockers, and next steps.
- `ae-prompt-optimize`: turn vague requests into executable Codex prompts.
- `ae-save-experience`: capture reusable project experience.
- `ae-skill-creator`: create or update Codex skills.
- `ae-agent-creator`: create Codex-compatible agent prompts and delegation templates.
- `ae-update`: update the project-local AE for Codex installation.
- `ae-language`: switch project-local AE skill display language.

The helper CLI is available through:

```bash
node scripts/ae-tools.mjs help
```

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

Install Chinese or bilingual skill metadata:

```bash
node scripts/install-project.mjs --target /path/to/your/codex-project --lang zh-CN
node scripts/install-project.mjs --target /path/to/your/codex-project --lang bilingual
```

Supported metadata languages are `en`, `zh-CN`, and `bilingual`.

The installer writes these paths inside the target project:

- `plugins/ai-agent-engine-codex/`
- `.agents/plugins/marketplace.json`
- `.agents/skills/ae-*`
- `scripts/ae-tools.mjs`
- `scripts/update-ae-codex.mjs`
- `scripts/set-ae-language.mjs`

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

## Daily Usage

Codex does not auto-register OpenCode-style slash commands. Use the skill name in the request:

```text
Use ae-help to show the current AE capabilities.
Use ae-plan to create an implementation plan for adding permission-checked file upload.
Use ae-work to execute docs/ae/plans/2026-05-11-001-file-upload-plan.md.
Use ae-review mode:report-only to review my current changes.
```

Inspect OpenAPI:

```bash
node scripts/ae-tools.mjs swagger openapi.json method:POST keyword:login mode:detail
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

The skill list descriptions shown by Codex come from static metadata. They cannot switch live inside an already-open Codex conversation, but you can rewrite the project-local metadata and then restart or reopen the project conversation.

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

The updater preserves the installed language metadata when possible. To override it:

```bash
node scripts/update-ae-codex.mjs --repo https://github.com/YaoGUanquan/codex-ai-agent-engine.git --branch main --lang bilingual
```

Or ask a Codex agent:

```text
Fetch and follow the update instructions from https://raw.githubusercontent.com/YaoGUanquan/codex-ai-agent-engine/main/INSTALL.md
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

- `/ae-*` names are compatibility labels, not auto-registered Codex slash commands.
- Reliable trigger style is: `Use ae-work ...`, `Use ae-review ...`, `Use ae-plan ...`.
- This MVP does not provide a real MCP server yet. `.mcp.json` is intentionally empty.
- YAML OpenAPI parsing is deferred; JSON OpenAPI works without dependencies.
- Git writes, destructive filesystem actions, network fetches, dependency installs, database writes, and browser setup must use Codex's explicit approval model.

## Development Checks

From this repo:

```bash
npm run check
node --check scripts/ae-tools.mjs
node --check plugins/ai-agent-engine-codex/scripts/ae-tools.mjs
node scripts/ae-tools.mjs help
```

Validate skills with your local Codex skill validator if available.

See [docs/release-checklist.md](docs/release-checklist.md) before publishing a GitHub release.

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
