# Requirements Capture

This reference is loaded when `ae-prd` creates or updates a durable PRD artifact.

The artifact is a requirements data document for humans and downstream AI workflow. It is not a presentation PRD. Keep only the product behavior, scope boundary, acceptance criteria, decisions, assumptions, and open questions that planning needs.

Do not include implementation details such as library choices, schemas, endpoint layouts, file paths, or code structure unless the requirement itself is explicitly technical and those details are the decision being captured.

## Required Content

For non-trivial work, include:

- problem frame,
- stable requirement IDs,
- concrete acceptance conditions,
- scope boundary,
- success criteria.

Include these only when they materially affect planning:

- key decisions and reasons,
- dependencies or assumptions,
- open questions,
- alternatives considered.

## Template

Omit optional subsections that do not contain real information. Do not write placeholder text.

```markdown
---
type: prd
status: drafted
date: YYYY-MM-DD
topic: <kebab-case-topic>
format: human-readable-requirements
sharded: false
---

# <Topic Title>

## AI Parse Contract

- canonicalKind: requirements
- humanEquivalent: true
- stableIdsRequired: true
- noImplicitScope: true

## Problem Frame

<Current problem, desired outcome, success signal, and scope context.>

## Requirements

**<Group Name>**
- R1. <Requirement statement>  
  Acceptance: <Concrete condition that proves the behavior is satisfied.>
- R2. <Requirement statement>  
  Acceptance: <Concrete condition that proves the behavior is satisfied.>

## Non-Functional Requirements

- NFR1. <Performance, security, compatibility, usability, or operational requirement>  
  Acceptance: <How this is checked.>

## Success Criteria

- <How to know the right problem was solved.>

## Scope Boundary

### In Scope

- <Included behavior or artifact.>

### Out Of Scope

- <Explicit non-goal.>

### Constraints

- <Business, technical, timing, or resource constraint.>

## Key Decisions

- D1. <Decision>  
  Reason: <Why this is the chosen requirement direction.>

## Dependencies And Assumptions

### Dependencies

- <External input, artifact, system, or decision this depends on.>

### Assumptions

- <Unverified premise that affects planning.>

## Open Questions

### Must Resolve Before Planning

- Q1. [Affects R1][user decision] <Question that blocks planning.>

### Deferred To Planning

- Q2. [Affects R2][technical] <Question better answered during planning.>

## Evidence Notes

- <Claim> -> Evidence: <path, command, observed external ref, inspected file, or explicit assumption.>

## Consistency Check

- requirementsCount: <number of R* entries>
- nonFunctionalRequirementsCount: <number of NFR* entries>
- decisionsCount: <number of D* entries>
- openQuestionsCount: <number of Q* entries>
```

## Field Rules

| Field | Rule |
| --- | --- |
| `type` | Always `prd`. |
| `status` | Start as `drafted`; later workflow may update it after review. |
| `date` | Current date in `YYYY-MM-DD`. |
| `topic` | Kebab-case topic. |
| `format` | Always `human-readable-requirements`. |
| `sharded` | `true` only when multiple modules need separate shard files or the user explicitly asks for sharding. |
| `origin` and `originFingerprint` | Include both or neither. `origin` must be repository-relative. |

## Sharding Rules

Use `sharded: true` only when separate module shards are needed. The root PRD remains the entrypoint and must retain global problem frame, shared scope, cross-module behavior, and shard index.

Shard files use:

- `type: prd-shard`,
- `parent: <root PRD path>`,
- `module: <module name>`.

Do not shard because a document is long. Shard only for real module ownership.

## Quality Checks

Before writing the artifact, check:

- Does `ae-plan` still need to invent product behavior, success criteria, or scope?
- Does every requirement have an `Acceptance:` condition?
- Are assumptions separated from confirmed facts?
- Are product blockers separated from planning-time technical questions?
- Are implementation details absent unless explicitly required?
- Are capability, benchmark, installation, or behavior claims tied to evidence or marked as assumptions?
- Does the consistency check match the actual IDs in the document?

If planning still needs to invent behavior, requirements capture is not complete.
