---
name: ae-brainstorm
description: Use when the user wants AE-style requirement clarification, /ae-brainstorm, feature brainstorming, scope definition, acceptance criteria, or has a fuzzy software idea that should become a durable requirements artifact before planning.
---

# AE Brainstorm

Clarify what should be built. Produce a requirements artifact only when it will help downstream planning.

## Workflow

1. Determine whether the request is software-related. For non-software brainstorming, use the same questioning discipline but do not force software sections.
2. Scan the repository lightly for existing related behavior before making claims.
3. Ask one question at a time when requirements are unclear.
4. Identify goals, non-goals, users or systems affected, success criteria, edge cases, and open questions.
5. When durable decisions exist, write a requirements file using `references/requirements-capture.md`.
6. If the user wants to continue, route to ae-plan with the requirements path.

## Rules

- Keep requirements behavior-focused.
- Do not invent implementation details, stakeholders, business value, or narrative filler.
- Use repository-relative paths in artifacts.
- If requirements are already clear and no durable artifact is needed, summarize alignment and recommend ae-plan or ae-work.
