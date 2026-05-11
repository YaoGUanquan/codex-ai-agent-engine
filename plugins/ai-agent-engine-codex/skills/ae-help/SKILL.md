---
name: ae-help
description: Use when the user asks what AI Agent Engine or AE capabilities are available in Codex, how to run AE-style workflows, which AE entrypoint to use, or asks for /ae-help, ae help, AE commands, AE skills, AE 中文入口, or AI Agent Engine usage.
---

# AE Help

List and explain the Codex-native AI Agent Engine entrypoints in the local display language.

## Workflow

1. Run `node scripts/ae-tools.mjs help` from the repository that contains this plugin. If the user gave a query, append it as plain arguments.
2. Return the script output directly unless the user asked for a tailored recommendation.
3. If the script is unavailable, read `references/capability-catalog.json` and summarize the matching capability in Chinese when the local metadata is Chinese.

## Boundaries

- Do not claim OpenCode slash commands are installed in Codex.
- Explain that `/ae-*` names are compatibility labels; in Codex the reliable trigger is the installed skill name or an explicit request such as "use ae-work" / "使用 ae-work".
- For migration questions, read `references/codex-port-notes.md`.
- For artifact path questions, read `references/artifact-contract.md`.
