---
name: ae-handoff
description: Use when the user asks for AE handoff, /ae-handoff, session handoff, continue later, summarize work state, transfer context, or create a durable next-session handoff artifact.
---

# AE Handoff

Create a durable handoff for continuing work later.

## Workflow

1. Inspect current task state, changed files, relevant commands, validation results, and blockers.
2. Record decisions, assumptions, unresolved questions, and next steps.
3. Write a handoff under `docs/ae/handoffs/` when the user wants an artifact.
4. Keep paths repository-relative and commands exact.
5. State what is verified, unverified, and risky.

## Rules

- Do not include secrets or credentials.
- Do not imply work is complete unless validation supports it.
- Prefer concise handoffs that a fresh Codex session can execute from.
