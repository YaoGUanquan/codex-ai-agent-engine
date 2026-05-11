---
name: ae-agent-creator
description: Use when the user asks for AE agent creator, /ae-agent-creator, create an agent prompt, subagent template, reviewer persona, delegated worker profile, or Codex-compatible agent guidance.
---

# AE Agent Creator

Create Codex-compatible agent prompts and delegation templates.

## Workflow

1. Clarify the agent's job, inputs, outputs, boundaries, tools, and failure behavior.
2. Decide whether the result should be a prompt, reviewer persona, worker template, or skill metadata.
3. Write concise reusable guidance with explicit ownership and validation expectations.
4. Store templates under an appropriate `references/` file when part of a skill.
5. State clearly when behavior is only a Codex prompt/template and not an auto-registered OpenCode agent.

## Rules

- Do not imply automatic agent registration unless a real registry exists.
- Keep delegated coding templates disjoint in file ownership.
- Include read-only constraints for reviewer agents.
