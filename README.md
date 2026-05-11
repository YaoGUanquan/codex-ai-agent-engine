# AI Agent Engine for Codex

Codex-native engineering workflow skills inspired by and explicitly referencing the AI Agent Engine OpenCode plugin.

This repository packages a project-local Codex plugin with AE-style workflows for requirement clarification, planning, implementation, review, validation, Swagger/OpenAPI inspection, and delivery gates.

> Reference project: https://gitee.com/jiangqiang1996/ai-agent-engine<br>
> This project references the workflow design and capability model of the Gitee AI Agent Engine project above.<br>
> This is not a direct OpenCode runtime port. It uses explicit Codex skills and local scripts.

中文文档: [README.zh-CN.md](README.zh-CN.md)

## What You Get

- `ae-help`: list available AE capabilities.
- `ae-ideate`: generate solution directions and tradeoffs.
- `ae-brainstorm`: clarify requirements and capture acceptance criteria.
- `ae-lfg`: full workflow from requirement to verified delivery.
- `ae-plan`: create implementation plans without editing product code.
- `ae-work`: execute plans after Git/worktree safety checks.
- `ae-refactor`: plan behavior-preserving refactors.
- `ae-review`: layered code or document review with findings first.
- `ae-doc-humanize`: rewrite structured notes into readable documents.
- `ae-doc-structure`: structure messy notes into requirements, plans, handoffs, or checklists.
- `ae-frontend-design`: build a usable first frontend version.
- `ae-test-browser`: validate UI flows in a real browser.
- `ae-sql`: generate, review, or execute SQL with explicit safety boundaries.
- `ae-swagger-parser`: summarize Swagger/OpenAPI specs.
- `ae-handoff`: capture current task state and next steps.
- `ae-prompt-optimize`: rewrite vague requests into executable Codex prompts.
- `ae-save-experience`: capture reusable project experience.
- `ae-skill-creator`: create or update Codex skills.
- `ae-agent-creator`: create Codex-compatible agent prompts and delegation templates.
- `ae-update`: update the project-local AE for Codex installation.
- `ae-language`: switch local AE skill display language.

The helper CLI is available through:

```bash
node scripts/ae-tools.mjs help
```

## Project-Local Installation

Recommended: install into a target Codex project only. This avoids changing global Codex state.

### Agent-Assisted Install

After this repository is published, give this sentence to a Codex agent inside the target project:

```text
Fetch and follow the project-level install instructions from https://raw.githubusercontent.com/YaoGUanquan/codex-ai-agent-engine/main/INSTALL.md
```

From this repository:

```bash
node scripts/install-project.mjs --target /path/to/your/codex-project
```

On Windows PowerShell:

```powershell
node scripts\install-project.mjs --target D:\codes\your-project
```

Install Chinese UI metadata:

```powershell
node scripts\install-project.mjs --target D:\codes\your-project --lang zh-CN
```

Supported metadata languages: `en`, `zh-CN`, `bilingual`.

The installer writes only inside the target project:

- `plugins/ai-agent-engine-codex/`
- `.agents/plugins/marketplace.json`
- `.agents/skills/ae-*`
- `scripts/ae-tools.mjs`
- `scripts/update-ae-codex.mjs`
- `scripts/set-ae-language.mjs`

Then restart or reopen the Codex conversation for that project.

## Skill List Language

The skill list descriptions shown by Codex come from static `agents/openai.yaml` metadata. They cannot switch live inside the UI, but you can rewrite the project-local metadata and restart/reopen the project conversation.

```bash
node scripts/set-ae-language.mjs --lang en
node scripts/set-ae-language.mjs --lang zh-CN
node scripts/set-ae-language.mjs --lang bilingual
```

From this repository, use the source helper with an explicit target:

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

If you do not want to run the installer:

1. Copy `plugins/ai-agent-engine-codex/` into your target project under `plugins/`.
2. Copy this root wrapper into the target project:

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

## Quick Test

After installing and restarting Codex in the target project, ask:

```text
Use ae-help to show the current AE capabilities.
```

Or run from the target project terminal:

```bash
node scripts/ae-tools.mjs help
```

## Usage Examples

Create a plan:

```text
Use ae-plan to create an implementation plan for adding permission-checked file upload.
```

Run implementation from an existing plan:

```text
Use ae-work to execute docs/ae/plans/2026-05-11-001-file-upload-plan.md.
```

Review current changes:

```text
Use ae-review mode:report-only to review my current changes.
```

Inspect OpenAPI:

```bash
node scripts/ae-tools.mjs swagger openapi.json method:POST keyword:login mode:detail
```

## Repository Layout

```text
.agents/                         # Project-local self-install for this repo
plugins/ai-agent-engine-codex/   # Codex plugin package
scripts/ae-tools.mjs             # Root helper wrapper
scripts/install-project.mjs      # Project-local installer
docs/codex-port-analysis.md      # Migration analysis from OpenCode to Codex
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

## Publishing to GitHub

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

## License and Attribution

See [LICENSE](LICENSE) and [NOTICE.md](NOTICE.md).

This project is inspired by AI Agent Engine and keeps `GPL-2.0-only` metadata for the adaptation.
