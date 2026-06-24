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
- Keep success criteria technology-agnostic unless the product requirement is explicitly technical.

## Workflow

1. Recover only an explicitly referenced PRD or one created in the current session; do not scan for similar files and accidentally resume stale work.
2. Read existing project docs and nearby feature context before making claims.
3. Classify the request as quick answer, lightweight requirement, standard PRD, or deep PRD.
4. Ask one focused question only when the answer changes scope, success criteria, risk, or validation; use no more than three clarification questions before recording explicit assumptions.
5. Pressure-test the request before writing: confirm the real problem, success signal, scope boundary, non-goals, and whether any product decision is still missing.
6. Record goals, affected users or systems, requirements with stable IDs, acceptance criteria, non-goals, constraints, validation expectations, assumptions, and open questions.
7. Keep implementation details out of the PRD unless the requirement itself is technical. Technical choices belong in `ae-plan`.
8. When creating or updating a PRD artifact, use `references/requirements-capture.md` as the output contract and write it under `docs/ae/prds/` with frontmatter:

```yaml
---
type: prd
status: drafted
date: YYYY-MM-DD
topic: kebab-case-topic
format: human-readable-requirements
sharded: false
---
```

9. Use repository-relative paths in all file references. If the PRD comes from an upstream AE artifact, include `origin` and `originFingerprint` together; never write only one of them.
10. Recommend `ae-review domain:document` for significant PRDs, then route to `ae-plan` when ready or state the remaining blocker.

## Artifact Contract

PRD artifacts are requirement data documents for humans and downstream AI workflow. They must be self-contained and machine-extractable:

- Include an `AI Parse Contract` section with `canonicalKind: requirements`, `humanEquivalent: true`, `stableIdsRequired: true`, and `noImplicitScope: true`.
- Use stable requirement IDs such as `R1`, non-functional IDs such as `NFR1`, and decision IDs such as `D1`.
- Each requirement must include a concrete acceptance condition using a consistent `Acceptance:` phrase.
- Separate confirmed facts, assumptions, open questions, and deferred planning questions.
- Include a consistency check with requirement, non-functional requirement, decision, and open-question counts.
- Use `sharded: true` only when multiple modules require separate shard files or the user explicitly asks for sharding.

## Readiness Gate

Before routing to planning, confirm:

- intended outcome is clear,
- acceptance criteria are testable or explicitly deferred,
- non-goals and boundaries are named,
- assumptions are separated from confirmed requirements,
- WHAT/WHY are clear before HOW,
- unresolved questions are visible,
- validation expectations are known,
- stable IDs and the consistency check are present when a durable artifact is created.

## Boundaries

- Do not implement code.
- Do not turn a clear tiny task into an oversized document.
- Do not silently promote assumptions into requirements.
