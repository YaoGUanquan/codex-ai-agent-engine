---
name: ae-brainstorm
description: Use when the user wants AE-style requirement clarification, /ae-brainstorm, feature brainstorming, scope definition, acceptance criteria, or has a fuzzy software idea that should become a durable requirements artifact before planning.
---

# AE Brainstorm

Clarify what should be built. Produce a requirements artifact only when it will help downstream planning.

## Operating Principles

- Understand the current repository context before asking detailed questions.
- Ask one focused question at a time when the answer changes scope, design, or acceptance.
- Prefer 2-3 materially different approaches before converging on design-heavy work.
- Keep the output behavior-focused so `ae-plan` can turn it into implementation units.
- If the request is too large for one plan, decompose it before refining details.

## Workflow

1. Determine whether the request is software-related. For non-software brainstorming, use the same questioning discipline but do not force software sections.
2. Scan the repository lightly for existing related behavior, docs, and conventions before making claims.
3. If the request spans multiple independent systems, decompose it and brainstorm only the first coherent slice.
4. Ask one question at a time when requirements are unclear; prefer multiple choice when the options are known.
5. Identify goals, non-goals, users or systems affected, success criteria, edge cases, validation signals, and open questions.
6. For design-heavy work, compare 2-3 materially different approaches before converging.
7. When a design needs validation, present the smallest useful design slices instead of a full speculative implementation.
8. When durable decisions exist, write a requirements file using `references/requirements-capture.md`.
9. If the behavior is already clear, summarize the confirmed scope and route to ae-plan or ae-work.
10. If the user wants to continue, route to ae-plan with the requirements path.

## Requirements Readiness

Before routing to `ae-plan`, make sure the downstream plan will have:

- the problem frame and intended outcome,
- acceptance criteria or an explicit success signal,
- non-goals and boundaries,
- chosen approach when alternatives were considered,
- validation expectations,
- unresolved questions labeled as open rather than assumed.

## Rules

- Keep requirements behavior-focused.
- Do not invent implementation details, stakeholders, business value, or narrative filler.
- Use repository-relative paths in artifacts.
- If the work is small and already well-scoped, do not force an oversized design artifact.
- Record open questions explicitly instead of silently assuming them away.
- Do not ask for user approval between every normal step; ask when a real decision affects scope, design, or risk.
