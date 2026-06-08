---
name: ae-plan
description: Use when the user asks for AE plan, /ae-plan, technical plan, implementation plan, design plan, break down requirements, plan before coding, or convert a requirements artifact into implementation units. This skill writes plans and must not implement code.
---

# AE Plan

Create a durable implementation plan. Planning answers how to build; it does not edit product code.

## Operating Principles

- Keep the plan as small as the requested outcome allows.
- Prefer repo-grounded facts over generic architecture advice.
- Separate known facts, assumptions, open questions, and deferred work.
- Make every implementation unit verifiable by a concrete command, file inspection, or user-flow check.
- Treat planning as design compression: explore viable approaches, choose one, then turn it into executable units.
- For non-trivial decisions, record the decision drivers, rejected alternatives, and consequences so downstream execution can preserve intent.

## Plan Readiness Gate

Before writing a plan, verify that these inputs are clear enough:

- goal and user-visible outcome,
- acceptance criteria or success signal,
- known non-goals or scope boundary,
- affected system area and likely file ownership,
- validation surface.

If any item is materially unclear, ask one focused question or route to `ae-brainstorm`. Do not fill gaps with invented product behavior.

For tasks with multiple plausible designs, compare 2-3 approaches before selecting one. Keep the comparison short: fit, trade-off, risk, and why the recommended approach wins. When only one viable approach exists, state why the alternatives collapse instead of pretending there was a meaningful choice.

For high-risk plans, add a deliberate planning pass before implementation units:

- list the top 3 decision drivers,
- name 3 pre-mortem failure scenarios,
- include validation across the relevant levels: unit, integration, user flow, data/ops, or observability,
- record rollback or recovery signals that would prove the plan is unsafe to continue.

High-risk includes auth, permissions, public API contracts, migrations, data deletion, billing, concurrency, background jobs, security-sensitive flows, cross-module refactors, or broad behavior changes.

## Workflow

1. If the input references a requirements file, read it fully and treat it as the source of truth.
2. If no requirements file exists, gather enough context from the repo and user request to plan safely.
3. Run the Plan Readiness Gate.
4. For design-heavy work, compare 2-3 materially different approaches and record the chosen approach.
5. Use `references/plan-template.md` for structure.
6. Break the work into implementation units that are small enough to validate independently.
7. Add ADR-style decision records for material choices: decision, drivers, alternatives, why chosen, consequences, and follow-ups.
8. For each unit, name exact files, dependencies, tests, validation commands, risks, rollback signals, and deferred implementation notes.
9. Run Plan Self-Review before presenting the plan.
10. Write the plan to `docs/ae/plans/` before presenting next-step options.
11. Recommend ae-review domain:document for significant plans, then ae-work when the user wants execution.

When the task may benefit from multi-agent execution, make the plan dependency-aware even if multi-agent config is currently disabled:

- Every implementation unit must include `Depends on:` with either `none` or explicit unit IDs such as `U1`.
- Every implementation unit must list owned files clearly enough for `task-analyze` to detect overlap.
- Do not design units only to reach a worker count. Split by real file ownership and dependency boundaries.
- Shared config, public contracts, migrations, auth, lockfiles, and cross-cutting abstractions should usually stay serial unless a later plan proves disjoint ownership.

## Plan Self-Review

Before finalizing, check and fix the plan inline:

- no `TBD`, `TODO`, placeholder sections, or vague verbs such as "wire up" without file-level detail,
- no contradiction between scope, decisions, implementation units, and validation,
- assumptions are explicit and do not masquerade as requirements,
- alternatives and decision records explain why the selected approach is preferable,
- every acceptance criterion maps to at least one implementation unit or validation step,
- high-risk plans include pre-mortem failures and layered validation,
- rollback and recovery signals are credible for the changed area,
- the plan is still focused enough for one execution pass; otherwise split it.

## Rules

- Do not write implementation code.
- Do not run tests as part of planning unless needed for read-only discovery and explicitly safe.
- Keep all file paths repository-relative.
- Do not invent product behavior missing from the requirements; record open questions instead.
- For refactors, include behavior-preservation requirements and rollback signals.
- Replace vague tasks such as "implement", "wire up", or "handle edge cases" with concrete file-level work.
- When validation is unclear, name the missing proof instead of pretending the plan is executable.
- Do not expand a narrow request into platform redesign, migration, or process overhaul unless the user asked for that scope.
- Do not route directly from an unclear request to implementation. Clarify, brainstorm, or record the blocker first.
