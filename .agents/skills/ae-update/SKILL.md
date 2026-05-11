---
name: ae-update
description: Use when the user asks for AE update, /ae-update, update AI Agent Engine for Codex, refresh the project-local AE plugin, pull from a configured repository, or reinstall local AE skills.
---

# AE Update

Update the project-local AE for Codex installation.

## Workflow

1. Inspect the current installation and repository setting.
2. Explain that update uses Git/network operations and may replace project-local `plugins/ai-agent-engine-codex`, `.agents/skills/ae-*`, and AE wrapper scripts.
3. Request approval before network fetch, clone, pull, or destructive replacement when required by Codex rules.
4. Run `node scripts/update-ae-codex.mjs --repo <url> --branch <branch> --lang <lang>` after approval.
5. Validate with `npm run check` or the narrowest equivalent available.

## Rules

- Do not run update against placeholder repository URLs.
- Preserve the user's selected display language when possible.
- Report changed paths and validation results.
