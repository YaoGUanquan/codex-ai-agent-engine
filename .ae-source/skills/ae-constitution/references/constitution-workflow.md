# Constitution Workflow

Use this reference when creating, amending, or reviewing project governance.

## Artifact Shape

Recommended path: `docs/ae/constitution.md`

Recommended sections:

1. Purpose
2. Scope
3. Principles
4. Required Gates
5. Artifact Ownership
6. Amendment Process
7. Sync Impact

Each principle should include:

- name,
- rule,
- rationale,
- how reviewers verify it,
- examples of violations.

## Amendment Flow

1. Identify the source of change: user instruction, repeated project failure, external audit, or repository evolution.
2. Compare the proposed rule with `AGENTS.md`, existing memory logs, and active AE skills.
3. Record the smallest governance change that would alter future behavior.
4. List impacted artifacts: plans, reviews, templates, skills, tests, or release checklist.
5. Add a dated amendment note.
6. Run document review when the change affects implementation gates.

## Quality Bar

- Governance must be concrete enough for `ae-review` to flag a violation.
- Required gates must name observable evidence, not intent.
- Principles should be stable across multiple tasks, not one-off task preferences.
- Local project instructions and direct user decisions outrank inherited templates.
