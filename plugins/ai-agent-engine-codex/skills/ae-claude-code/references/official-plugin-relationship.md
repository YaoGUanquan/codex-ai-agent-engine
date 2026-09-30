# Official Plugin Relationship

## Official Codex Plugin Relationship

OpenAI's `codex@openai-codex` Claude Code plugin works in the opposite direction: an interactive Claude Code session can use `/codex:review`, `/codex:rescue`, `/codex:transfer`, `/codex:status`, and related commands to call Codex. It does not allow Codex to control Claude Code.

- For work that began in Claude Code and should continue in Codex, use `/codex:transfer` in that Claude session, then continue the returned `codex resume <session-id>` task in Codex.
- For an independent second opinion from Codex, use the official plugin's `/codex:review` or `/codex:adversarial-review` in Claude Code instead of routing back through this skill.
- Never ask a `claude-delegate` child to invoke `/codex:*`. The default invocation disables slash commands so a Codex -> Claude -> Codex loop cannot spend quota, obscure ownership, or bypass this skill's review boundary.
- The official plugin may perform write-capable Codex rescue work when invoked from Claude Code. That is a separate user-facing workflow and does not relax this skill's read-only default or direct-write gate.
