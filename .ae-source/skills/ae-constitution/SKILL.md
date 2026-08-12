---
name: ae-constitution
description: Use when the user asks for AE constitution, project governance, durable engineering principles, workflow rules, amendment notes, or wants plans and reviews checked against project-level principles before implementation.
---

# AE Constitution

Create or update durable project governance that later AE plans, reviews, and work gates can check.

## Workflow

1. Read existing `AGENTS.md`, `docs/08-ai-memory`, relevant plans, and any existing constitution before proposing changes.
2. Decide whether the request needs a new constitution, an amendment, or a consistency review.
3. Use `references/constitution-workflow.md` for the full governance workflow.
4. Keep principles testable. A principle that cannot affect review, validation, rollback, or file ownership is too vague.
5. Write durable governance to `docs/ae/constitution.md` unless the project already has a clear governance path.
6. When changing existing governance, add amendment notes: date, changed principle, reason, impacted skills or docs, and migration action.
7. Route significant implementation work back through `ae-plan` or `ae-review` so the constitution is checked against the plan.

## Rules

- Do not invent policy that contradicts `AGENTS.md` or user instructions.
- Do not copy external constitution templates verbatim; rewrite in AE terms and local paths.
- Do not block small fixes with heavy governance unless the user explicitly asks for it.
- Make every principle inspectable by a future reviewer.
