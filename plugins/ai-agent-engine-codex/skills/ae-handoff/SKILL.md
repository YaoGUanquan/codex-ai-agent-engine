---
name: ae-handoff
description: Use when the user asks for AE handoff, /ae-handoff, session handoff, continue later, summarize work state, transfer context, or create a durable next-session handoff artifact.
---

# AE Handoff

Create a durable handoff for continuing work later.

## Workflow

1. Inspect current task state, changed files, relevant commands, validation results, and blockers.
2. Record decisions, assumptions, unresolved questions, and next steps.
3. Write a task-scoped handoff to `docs/00-process/active/<task>/handoff.md` when the work has an active process directory; standalone cross-session handoffs without a task directory go to `docs/ae/handoffs/`.
4. Keep paths repository-relative and commands exact.
5. State what is verified, unverified, and risky.

## Rules

- Do not include secrets or credentials.
- Do not imply work is complete unless validation supports it.
- Prefer concise handoffs that a fresh Codex session can execute from.
