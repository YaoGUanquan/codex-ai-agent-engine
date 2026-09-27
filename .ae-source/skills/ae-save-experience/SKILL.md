---
name: ae-save-experience
description: Use when the user asks for AE save experience, /ae-save-experience, capture lessons learned, save implementation experience, record debugging notes, or create reusable project memory from completed work.
---

# AE Save Experience

For scale-related lessons, use the [scale and distributed engineering contract](../ae-help/references/scale-and-distributed-engineering.md). Retain only explicitly requested, sanitized invariants and measured context, with evidence links and bounded navigation; never turn one workload measurement into a universal capacity claim.

Capture reusable project experience after work lands.

## Workflow

1. Summarize the problem, context, root cause, decision, commands, validation, and final outcome.
2. Separate durable lessons from incidental details.
   Apply the [bounded memory navigation contract](references/memory-navigation.md) when project memory is read or updated; never append the experience body to `00-index.md`.
   For development history, oversized topics or managed pages, apply the [document lifecycle contract](references/document-lifecycle.md); use the bounded writer and run its budget check after updates.
3. Write under `docs/ae/experience/` when the user wants a project artifact.
4. If the user explicitly asks to update Codex memory, write an ad-hoc memory note following the active memory rules.
5. Keep secrets, tokens, and private credentials out of the artifact.
6. When a completed experience may justify a skill change, treat it as candidate evidence, not authorization, and route the proposal through `ae-skill-creator`.

## Memory Placement

Choose the narrowest durable location:

- `AGENTS.md`: durable project rules, operational constraints, and always-on instructions;
- `docs/08-ai-memory`: stable cross-session project decisions and reusable workflows;
- `docs/00-process/active`: in-progress evidence, temporary prompts, command output, and process notes;
- `docs/ae/experience`: reusable lessons from completed work;
- `docs/ae/integrity`: claim corrections, retractions, and methodology fixes that affect public docs, install behavior, benchmark claims, validation claims, or AE workflow guidance;
- `docs/ae/handoffs`: next-session state and continuation context;
- skill `references/`: reusable detail owned by one skill, such as schemas, templates, or long checklists.

Do not move transient process notes into long-term memory. If a lesson is specific to an unfinished task, keep it under `docs/00-process/active` until the durable rule or decision is clear.

## Integrity Ledger Routing

Use `docs/ae/integrity/` when the output is a correction or retraction, not a reusable lesson. Do not bury retractions in ordinary experience notes, memory updates, or handoffs. An integrity entry should name the original claim, affected path, corrected statement, evidence, validation, and any follow-up.

## Rules

- Only update memory when explicitly asked.
- Prefer exact commands and file paths over generic advice.
- Note whether the experience is repo-specific or generally reusable.
