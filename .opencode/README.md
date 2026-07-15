# OpenCode Integration

This directory contains the project-local OpenCode integration for AI Agent
Engine.

This integration belongs to the dedicated `codex/opencode-mode` branch. The
branch is maintained independently for OpenCode development and will not be
merged back into `main`, following the same policy as the `codebuddy` branch.

- `commands/` exposes the core AE workflows as native `/ae-*` commands.
- `agents/` contains narrowly scoped OpenCode agents.
- `../opencode.json` allows the `ae-*` skills to be loaded by OpenCode.
- `.agents/skills/` is the shared skill directory discovered by OpenCode.

The OpenCode skill directory excludes the Codex-only computer-control,
image-generation-prompt, and video-editing skills.

## Install And Use

Install the project-local OpenCode files from the dedicated branch:

```bash
git clone --depth 1 --branch codex/opencode-mode https://github.com/YaoGUanquan/codex-ai-agent-engine.git /tmp/ae-opencode
node /tmp/ae-opencode/scripts/install-project.mjs --target /path/to/your/project
cd /path/to/your/project
node scripts/check-opencode.mjs
opencode
```

Then use `/ae-help` to list workflows. Typical entrypoints are `/ae-plan`,
`/ae-work`, and `/ae-review`. Restart OpenCode after installing or updating
project-local skills and commands.

The command templates delegate to the matching skill. The skill remains the
source of truth for workflow rules, artifact paths, validation, and safety
boundaries. The command layer is intentionally thin so Codex and OpenCode can
share the same workflow content.

OpenCode does not need the Codex plugin manifest to discover these skills. The
manifest and `openai.yaml` files are retained only for the compatible Codex
installation path.
