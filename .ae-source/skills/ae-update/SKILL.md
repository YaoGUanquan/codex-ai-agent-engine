---
name: ae-update
description: Use when the user asks for AE update, /ae-update, update the current user's global AI Agent Engine for Codex installation, pull from a configured repository, or refresh Codex and Cursor AE skills.
---

# AE Update

Update the current user's global AE for Codex installation.

## Workflow

1. Inspect the current user's global installation and repository setting.
2. Explain that update uses Git/network operations and may replace the current user's private runtime, personal plugin, marketplace entry, and `~/.cursor/skills/ae-*` copies; it does not alter consumer project documents or source.
3. Request approval before network fetch, clone, pull, or destructive replacement when required by Codex rules.
4. Run `node "$HOME/.agents/ai-agent-engine-codex/bin/ae.mjs" ae-update --repo <url> --branch <branch>` after approval.
5. The updater previews and then applies the cloned release through the transactional global installer; it preserves backups and reports the operation ID.
6. Start a new Codex or Cursor chat after apply so skill discovery reloads.
7. Validate with installed help plus the narrowest equivalent checks available.

## Rules

- Do not run update against placeholder repository URLs.
- Preserve the current-user rollback journal and report operation status, changed paths, and validation results.
