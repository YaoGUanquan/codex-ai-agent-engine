---
name: ae-plan
description: Use when the user asks for AE plan, /ae-plan, technical plan, implementation plan, design plan, break down requirements, plan before coding, or convert a requirements artifact into implementation units. This skill writes plans and must not implement code.
---

# AE Plan

Create a durable implementation plan. Planning answers how to build; it does not edit product code.

## Workflow

1. If the input references a requirements file, read it fully and treat it as the source of truth.
2. If no requirements file exists, gather enough context from the repo and user request to plan safely.
3. Use `references/plan-template.md` for structure.
4. Break the work into implementation units that are small enough to validate independently.
5. For each unit, name exact files, dependencies, tests, validation commands, risks, rollback signals, and deferred implementation notes.
6. Write the plan to `docs/ae/plans/` before presenting next-step options.
7. Recommend ae-review domain:document for significant plans, then ae-work when the user wants execution.

## Rules

- Do not write implementation code.
- Do not run tests as part of planning unless needed for read-only discovery and explicitly safe.
- Keep all file paths repository-relative.
- Do not invent product behavior missing from the requirements; record open questions instead.
- For refactors, include behavior-preservation requirements and rollback signals.
- Replace vague tasks such as "implement", "wire up", or "handle edge cases" with concrete file-level work.
- When validation is unclear, name the missing proof instead of pretending the plan is executable.
