---
name: ae-ideate
description: Use when the user asks for AE ideation, /ae-ideate, idea generation, solution options, product or technical direction exploration, or wants several feasible approaches before requirements are fixed.
---

# AE Ideate

Generate useful options before requirements are fixed.

## Workflow

1. Identify the goal, constraints, audience, and known non-goals.
2. Generate 3-5 materially different options, not minor wording variants.
3. For each option, state value, cost, risk, validation signal, and when to reject it.
4. Recommend the smallest next step.
5. If the user wants to proceed, route to `ae-brainstorm` for requirements or `ae-plan` when the target is already clear.

## Rules

- Do not invent business facts, stakeholders, or hidden constraints.
- Keep speculation labeled as speculation.
- Prefer repo-grounded options when a codebase is present.
