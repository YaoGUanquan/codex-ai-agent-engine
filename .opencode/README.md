# OpenCode Integration

This directory contains the project-local OpenCode integration for AI Agent
Engine.

- `commands/` exposes the core AE workflows as native `/ae-*` commands.
- `agents/` contains narrowly scoped OpenCode agents.
- `../opencode.json` allows the `ae-*` skills to be loaded by OpenCode.
- `.agents/skills/` is the shared skill directory discovered by OpenCode.

The OpenCode skill directory excludes the Codex-only computer-control,
image-generation-prompt, and video-editing skills.

The command templates delegate to the matching skill. The skill remains the
source of truth for workflow rules, artifact paths, validation, and safety
boundaries. The command layer is intentionally thin so Codex and OpenCode can
share the same workflow content.

OpenCode does not need the Codex plugin manifest to discover these skills. The
manifest and `openai.yaml` files are retained only for the compatible Codex
installation path.
