# Requirement Readiness

## Workflow

1. Determine whether the request is software-related. For non-software brainstorming, use the same questioning discipline but do not force software sections.
2. Scan the repository lightly for existing related behavior, docs, and conventions before making claims.
3. If the request spans multiple independent systems, decompose it and brainstorm only the first coherent slice.
4. Ask one question at a time when requirements are unclear; prefer multiple choice when the options are known.
5. Identify goals, non-goals, users or systems affected, success criteria, edge cases, validation signals, and open questions. When behavior crosses a public API, persisted data, external service, deployment, or browser boundary, identify the smallest applicable validation-evidence tiers and what remains `unverified`. For a new durable table, read `../../ae-backend/references/persistence-contract.md`; use repository evidence or ask the required primary-key question before allowing implementation. Tier definitions and status vocabulary live in `../../ae-plan/references/validation-evidence-profile.md`.
6. Track material ambiguity explicitly. Continue clarifying until the remaining ambiguity is low enough that a plan can name files, risks, validation, and rollback without inventing behavior.
7. Ask at most three clarification questions before recording explicit assumptions; ask fewer when repository evidence is enough.
8. For design-heavy work, compare 2-3 materially different approaches before converging.
9. When a design needs validation, present the smallest useful design slices instead of a full speculative implementation.
10. When the request benefits from multiple roles, run the Perspective Collision Pass before choosing or recording the scope.
11. When durable decisions exist, write a requirements file under `docs/ae/prds/` using `../../ae-prd/references/requirements-capture.md`.
12. If the behavior is already clear, summarize the confirmed scope and route to ae-plan or ae-work.
13. If the user wants to continue, route to ae-plan with the requirements path.

## Requirements Readiness

Before routing to `ae-plan`, make sure the downstream plan will have:

- the problem frame and intended outcome,
- acceptance criteria or an explicit success signal,
- non-goals and boundaries,
- chosen approach when alternatives were considered,
- validation expectations,
- applicable validation-evidence tiers and any proof that must remain `unverified` when a boundary requires it,
- unresolved questions labeled as open rather than assumed.
- a requirement-quality checklist when the work is S4, externally visible, or likely to be delegated.
- collision insights, blind spots, and thinking preservation zone notes when those shaped the chosen approach.

If any missing item would change architecture, data shape, public behavior, security posture, or validation strategy, do not route to implementation. Ask the next highest-leverage question or record the blocker.
