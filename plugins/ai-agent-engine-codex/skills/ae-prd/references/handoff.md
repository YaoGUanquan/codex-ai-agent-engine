# PRD Handoff

This reference is loaded after `ae-prd` creates or updates a requirements artifact.

Use a Codex-native handoff: present the saved PRD path, the remaining blockers if any, and the next workflow that can consume the artifact. Do not claim automatic slash-command execution or runtime tool behavior. The user can continue by naming the target skill and PRD path.

## Readiness Routing

If `Must Resolve Before Planning` contains unresolved product decisions:

- do not route to implementation;
- ask the next blocking question or stop with the blocker list;
- keep technical questions that can be answered during planning under `Deferred To Planning`.

If no planning blockers remain:

- recommend `ae-plan <prd-path>` for multi-step work;
- recommend `ae-refactor <prd-path>` only for behavior-preserving refactor work;
- recommend `ae-work <prd-path or task>` only when the requirement is small, acceptance criteria are clear, and no implementation plan is needed.

## End Summary Shape

Use this compact shape when stopping after requirements capture:

```text
Requirements captured.

PRD: docs/ae/prds/YYYY-MM-DD-topic-prd.md
Key decisions:
- D1 ...

Planning blockers:
- none

Recommended next step: ae-plan docs/ae/prds/YYYY-MM-DD-topic-prd.md
```

When blockers remain:

```text
Requirements paused.

PRD: docs/ae/prds/YYYY-MM-DD-topic-prd.md
Planning blockers:
- Q1 ...

Resume with ae-prd and resolve the blockers before planning.
```

## Review Loop

For significant PRDs, run or recommend `ae-review domain:document <prd-path>`.

Auto-fix only deterministic document issues:

- frontmatter omissions,
- missing stable IDs,
- count mismatches,
- ambiguous section placement,
- unverifiable acceptance wording that can be tightened from existing text.

Do not add new product goals, scope, or architecture decisions during review without explicit user input.
