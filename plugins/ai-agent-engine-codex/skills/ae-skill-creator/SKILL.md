---
name: ae-skill-creator
description: Use when the user asks for AE skill creator, /ae-skill-creator, create a Codex skill, update a skill, scaffold a workflow skill, or convert a repeated workflow into a reusable Codex skill.
---

# AE Skill Creator

Create or update Codex skills using the local skill-creator standard.

## Workflow

1. Use the built-in `skill-creator` guidance when available.
2. Define trigger examples, scope, reusable resources, and validation.
3. Create a skill folder with `SKILL.md` and `agents/openai.yaml`.
4. Keep `SKILL.md` concise and move optional detail into `references/`.
5. Run the skill validator when available.

## Rules

- Do not create extra README-style files inside the skill unless required.
- Keep frontmatter to `name` and `description`.
- Make UI metadata match the skill behavior and local display language.
