---
name: ae-claude-code
description: Use when the user explicitly requests local Claude Code CLI delegation, patch proposals or a controlled external worker.
---

# AE Claude Code

Codex owns review, application and delivery. Claude output is untrusted advice
until checked against repository evidence.

1. Resolve [runtime-entry](../ae-help/references/runtime-entry.md) before helpers
   and run `node "$aeEntry" claude-delegate --check`.
2. If unavailable (`status: skip`), report it and continue Codex-only work.
3. Define a narrow goal, owned/forbidden files, output and validation.
4. Default to read-only analysis or patch proposals: JSON, no session
   persistence, plan permission, Read/Grep/Glob, disabled slash commands.
5. Independently inspect any proposal, apply only authorized changes, review
   the diff and run relevant validation.

## Task References

Read only the row triggered by the task, not the whole table.

| Trigger | Reference |
| --- | --- |
| Running delegation or preparing an explicit write/cross-directory exception | [Delegation procedure](references/delegation-procedure.md) |
| Claude-to-Codex transfer or official plugin comparison | [Official plugin relationship](references/official-plugin-relationship.md) |

Direct writes require explicit authorization, isolated worktree/temp copy,
allowed/forbidden paths, independent diff review and validation. No automatic
install, login, configuration change or permission bypass. No secrets or
unrelated repository content. Never ask a child to invoke `/codex:*`;
Codex -> Claude -> Codex recursion is prohibited.
For large delegated work, use the [scale contract](../ae-help/references/scale-and-distributed-engineering.md).
Empty successful output is no usable evidence.
