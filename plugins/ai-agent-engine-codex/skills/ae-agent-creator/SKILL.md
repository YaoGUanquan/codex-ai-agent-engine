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

## Agent Prompt Routing

Route agent-like requests by the mechanism Codex can actually enforce:

- prompt/template: use for reviewer personas, worker instructions, handoff prompts, and bounded delegation contracts that a human or orchestrating Codex session will paste or dispatch;
- helper script: use only when the behavior is deterministic local parsing, validation, or evidence generation, and the script can be tested directly;
- Codex skill: use when the agent guidance is really a repeatable workflow entrypoint with clear triggers and validation;
- process artifact: use for one-time work plans, review reports, or subagent handoff notes.

Do not describe a prompt/template as an auto-registered Claude, OpenCode, or Codex agent unless a real local registry and loading path exists. If the source repository relies on agents that auto-load by name, rewrite the reusable job contract and record the missing registry as a boundary.

## Rules

- Do not imply automatic agent registration unless a real registry exists.
- Keep delegated coding templates disjoint in file ownership.
- Include read-only constraints for reviewer agents.
