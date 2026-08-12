# Codex Port Notes

This plugin is a Codex-native adaptation of the AI Agent Engine workflow model.
It intentionally does not try to run the upstream OpenCode plugin entrypoint.

## What Was Portable

- Skill prompts and workflow contracts.
- Review and research persona concepts.
- Artifact path conventions under docs/ae.
- Gate, recovery, task analysis, and Swagger parsing as deterministic helpers.

## What Was Not Portable

- OpenCode config.command and slash command injection.
- OpenCode config.agent and mode subagent/primary/all.
- OpenCode experimental.chat.system.transform.
- OpenCode ctx.ask permission prompts and OpencodeClient session creation.
- OpenCode-specific paths such as .opencode/skills and ~/.config/opencode.

## Codex Replacement Model

- Use explicit skills for workflow entrypoints.
- Use Codex shell/filesystem/browser/sub-agent tools for execution.
- Use local scripts for deterministic checks.
- Keep all Git writes, destructive filesystem actions, network fetches, database writes, and browser setup behind Codex approval and user confirmation.

## MVP Definition

The first usable version is successful when Codex can:

1. Pick an AE entrypoint with ae-help.
2. Recover existing docs/ae artifacts.
3. Clarify requirements and write a requirements artifact when needed.
4. Create a plan before implementation.
5. Execute only after Git/worktree checks.
6. Review with explicit scope.
7. Run validation commands.
8. Produce a final gate proof or an explicit blocked result.
