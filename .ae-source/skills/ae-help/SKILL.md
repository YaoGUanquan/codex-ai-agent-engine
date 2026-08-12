---
name: ae-help
description: Use when the user asks what AI Agent Engine or AE capabilities are available in Codex, how to run AE-style workflows, which AE entrypoint to use, or asks for /ae-help, ae help, AE commands, AE skills, AE 中文入口, or AI Agent Engine usage.
---

# AE Help

List and explain the Codex-native AI Agent Engine entrypoints in the local display language.

## Workflow

1. Run `node "$HOME/.agents/ai-agent-engine-codex/bin/ae.mjs" help` from the repository that contains this plugin. If the user gave a query, append it as plain arguments.
2. Return the script output directly unless the user asked for a tailored recommendation.
3. If the script is unavailable, read `references/capability-catalog.json` and summarize the matching capability in Chinese when the local metadata is Chinese.

## Boundaries

- Do not claim OpenCode `config.command` slash commands are installed in Codex.
- Explain that `/ae-*` names are compatibility labels. In Codex, reliable triggers are installed skill names, explicit `$ae-*` invocation, natural-language requests such as "use ae-work" / "使用 ae-work", and any enabled-skill search surfaces exposed by the active Codex App.
- When mentioning `/` visibility, phrase it as Codex skill-backed discoverability that must be verified in the active app, not as command registration implemented by this project.
- For migration questions, read `references/codex-port-notes.md`.
- For artifact path questions, read `references/artifact-contract.md`.
