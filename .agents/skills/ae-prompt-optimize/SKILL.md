---
name: ae-prompt-optimize
description: Use when the user asks for AE prompt optimize, /ae-prompt-optimize, improve a prompt, make a task prompt clearer for Codex, turn vague instructions into executable prompts, or create reusable agent prompts.
---

# AE Prompt Optimize

Rewrite prompts into executable Codex instructions.

## Workflow

1. Identify the target model or agent, task goal, inputs, outputs, constraints, and validation criteria.
2. Remove ambiguity, hidden assumptions, and conflicting instructions.
3. Add concrete scope, files, commands, output format, and stopping conditions when known.
4. Keep security, approval, and environment boundaries explicit.
5. Return the optimized prompt and a short note on what changed.

## Rules

- Do not add requirements the user did not imply.
- Prefer precise operational language over motivational phrasing.
- For coding prompts, include verification expectations.
