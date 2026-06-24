# Requirements Capture

Write a requirements artifact only when durable product decisions or scope boundaries need to flow into planning.

Filename pattern:

`docs/ae/brainstorms/YYYY-MM-DD-<short-topic>-requirements.md`

Required frontmatter for durable requirement data documents:

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

Use `sharded: true` only when multiple modules need separate shard files or the user explicitly asks for sharding. If an upstream AE artifact is the source, include `origin` and `originFingerprint` together; do not write only one.

Required sections:

1. AI Parse Contract
2. Problem Frame
3. Requirements
4. Success Criteria
5. Scope Boundary
6. Key Decisions
7. Dependencies / Assumptions
8. Open Questions
9. Consistency Check
10. Self-Review

Stable ID rules:

- Functional requirements use `R1`, `R2`, `R3`.
- Non-functional requirements use `NFR1`, `NFR2`.
- Product or workflow decisions use `D1`, `D2`.
- Every requirement line includes a concrete `Acceptance:` condition.
- Open questions name the affected requirement ID and whether the question blocks planning or is deferred to planning.

AI Parse Contract:

```markdown
## AI Parse Contract
- canonicalKind: requirements
- humanEquivalent: true
- stableIdsRequired: true
- noImplicitScope: true
```

Consistency Check:

```markdown
## Consistency Check
- requirementsCount: <number of R* items>
- nonFunctionalRequirementsCount: <number of NFR* items>
- decisionsCount: <number of D* items>
- openQuestionsCount: <number of open questions>
```

Self-Review checks:

- No placeholder sections remain.
- Requirements do not contradict goals or non-goals.
- Acceptance criteria are testable or inspectable.
- WHAT and WHY are clear before HOW.
- Technology choices are constraints only when they came from the user, repository, or accepted approach.
- Critical ambiguities are either answered, limited to three clarification questions, or recorded as assumptions.
- Each acceptance criterion has a validation signal.
- Open questions are explicit and not hidden in assumptions.
- The scope is small enough for one `ae-plan`; otherwise split it.
- Stable IDs are unique and referenced consistently.
- The consistency check counts match the body.
- The artifact contains `format: human-readable-requirements` and `sharded`.

Keep it behavior-focused. Do not invent stakeholders, market narrative, or implementation details unless they are real constraints from the user or repository.
