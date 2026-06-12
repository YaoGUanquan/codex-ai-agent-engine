# Requirements Capture

Write a requirements artifact only when durable product decisions or scope boundaries need to flow into planning.

Filename pattern:

`docs/ae/brainstorms/YYYY-MM-DD-<short-topic>-requirements.md`

Required sections:

1. Problem Frame
2. Goals
3. Non-Goals
4. Users or Systems Affected
5. Requirements
6. Acceptance Criteria
7. Alternatives Considered
8. Chosen Approach
9. Validation Signals
10. Open Questions
11. Requirement Quality Checklist
12. Planning Notes
13. Self-Review

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

Keep it behavior-focused. Do not invent stakeholders, market narrative, or implementation details unless they are real constraints from the user or repository.
