---
name: ae-prd
description: Use when the user asks for AE PRD, /ae-prd, product requirement definition, requirement document creation, WHAT-before-HOW clarification, or a durable requirement artifact before planning.
---

# AE PRD

Capture what should be built before implementation planning. This skill answers WHAT; `ae-plan` answers HOW.

## Operating Principles

- Keep the artifact behavior-focused: goals, scope, acceptance criteria, non-goals, constraints, risks, and open questions.
- Do not invent implementation details unless the requirement itself is technical.
- Prefer a concise PRD for small work and a fuller PRD for cross-module or ambiguous work.
- Use repository-relative paths in artifacts.
- Create a durable artifact only when it helps downstream planning or handoff.

## Workflow

1. Read existing project docs and nearby feature context before making claims.
2. Classify the request as quick answer, lightweight requirement, standard PRD, or deep PRD.
3. Ask one focused question only when the answer changes scope, success criteria, risk, or validation.
4. Record goals, users or affected systems, functional requirements, acceptance criteria, non-goals, constraints, validation expectations, and open questions.
5. When creating a PRD artifact, write it under `docs/ae/prds/` with frontmatter:

```yaml
---
type: prd
status: drafted
date: YYYY-MM-DD
topic: kebab-case-topic
---
```

6. Route to `ae-plan` when the PRD is ready, or state the remaining blocker.

## Readiness Gate

Before routing to planning, confirm:

- intended outcome is clear,
- acceptance criteria are testable or explicitly deferred,
- non-goals and boundaries are named,
- unresolved questions are visible,
- validation expectations are known.

## Boundaries

- Do not implement code.
- Do not turn a clear tiny task into an oversized document.
- Do not silently promote assumptions into requirements.
