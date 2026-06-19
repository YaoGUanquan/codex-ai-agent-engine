---
name: ae-skill-creator
description: Use when the user asks for AE skill creator, /ae-skill-creator, create a Codex skill, update a skill, scaffold a workflow skill, or convert a repeated workflow into a reusable Codex skill.
---

# AE Skill Creator

Create or update Codex skills using the local skill-creator standard.

## Operating Principles

- A skill should encode repeatable judgment, not a README summary.
- Keep mandatory workflow in `SKILL.md`; move examples, templates, and long checklists into `references/`.
- Make triggers specific enough to fire when useful and narrow enough to avoid hijacking unrelated work.
- Include verification expectations whenever the skill can change files or external state.

## Workflow

1. Use the built-in `skill-creator` guidance when available.
2. Define trigger examples, scope, reusable resources, and validation.
3. Create a skill folder with `SKILL.md` and `agents/openai.yaml`.
4. Keep `SKILL.md` concise and move optional detail into `references/`.
5. Run the skill validator when available.

## Extension Routing Matrix

Before creating or updating an extension, route the request to the smallest Codex-native artifact that can enforce the behavior:

| Request shape | Use | Reject or defer when |
| --- | --- | --- |
| Repeatable workflow judgment with clear triggers, boundaries, and validation | Codex skill | An existing skill already covers it without a boundary improvement |
| Deterministic local parsing, validation, transformation, or evidence generation | helper script | It needs external credentials, network writes, or runtime hooks by default |
| Optional examples, long checklists, schemas, prompt contracts, or reusable snippets | reference/template | The detail is source-derived, license-incompatible, or too volatile |
| One-time requirement, plan, review, handoff, or execution evidence | process artifact | The artifact would become hidden behavior users must remember |
| Hook, scheduler, permission, auto-MCP, sound, statusline, or registry behavior Codex cannot enforce | reject/defer | A rewritten process contract can fit an existing AE skill instead |

Metadata checklist:

- trigger clarity and examples;
- scope, non-goals, and forbidden behavior;
- arguments or expected inputs;
- artifact outputs and storage path;
- validation command;
- plugin source plus `.agents/skills` mirror sync.

## Rules

- Do not create extra README-style files inside the skill unless required.
- Keep frontmatter to `name` and `description`.
- Make UI metadata match the skill behavior and local display language.
- Do not copy external skill text verbatim; adapt the method to Codex tools, local permissions, and this plugin's artifact paths.
