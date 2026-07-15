# AI Agent Engine for OpenCode

This branch adds a project-local OpenCode integration to the shared AI Agent
Engine workflow assets.

## Included

- `opencode.json` with the OpenCode schema and `ae-*` skill permissions.
- `.opencode/commands/ae-*.md` for the core native slash commands.
- `.opencode/agents/ae-review.md` for a read-only review subagent.
- `.agents/skills/` as the shared OpenCode-compatible skill directory.
- `scripts/check-opencode.mjs` for deterministic integration checks.
- `scripts/check-opencode-upstream.mjs` for repeatable Gitee upstream comparison.

OpenCode discovers project skills from `.agents/skills`, so no Codex plugin
manifest is required for the OpenCode runtime. The existing Codex manifest and
`agents/openai.yaml` files remain available for the compatible Codex path.

## Usage

From this project, start OpenCode and use commands such as:

```text
/ae-help
/ae-brainstorm clarify the request for a new import workflow
/ae-prd define the import workflow requirements
/ae-plan implement the approved import workflow
/ae-work execute docs/ae/plans/<plan>.md
/ae-review review the current changes
/ae-lfg take this feature from requirements to verified delivery
```

The command layer only selects the corresponding skill. The skill is the
source of truth for artifact paths, validation, permissions, and workflow
boundaries.

## Install into another project

Run the existing installer from this branch. It copies the shared skills,
OpenCode commands, the read-only agent, the OpenCode config, and helper
wrappers. Existing target `opencode.json` content is preserved.

```bash
node scripts/install-project.mjs --target /path/to/project
node /path/to/project/scripts/check-opencode.mjs
```

On Windows, use the equivalent PowerShell paths. OpenCode must be restarted
after installing or updating project-local skills and commands.

## Verification

```bash
node scripts/check-opencode.mjs
npm test
npm run check
```

The check validates the OpenCode config, core command frontmatter, review agent
frontmatter, and the OpenCode skill naming/description constraints.

## Upstream refresh

The branch tracks the upstream Gitee project as a reference source. Inspect a
local upstream checkout and classify changes before adapting them:

```bash
node scripts/check-opencode-upstream.mjs \
  --source /path/to/ai-agent-engine \
  --since b6df46e
```

The current reference was checked at `ff97284db2855e0048820843dd6416fb0f00ab72`.
The upstream review-agent step cap from `a2a0229` is applied locally as
`steps: 15`. The latest Office skill design-system update from `ff97284` is
recorded as deferred because this branch does not ship the upstream
`ae-officecli` runtime/tool boundary; copying those skills alone would expose
unusable commands.
