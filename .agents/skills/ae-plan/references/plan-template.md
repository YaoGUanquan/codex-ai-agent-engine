# Plan Template

Filename pattern:

`docs/ae/plans/YYYY-MM-DD-NNN-<short-topic>-plan.md`

Required structure:

```markdown
---
type: plan
status: drafted
date: YYYY-MM-DD
title: <short-topic>
origin: <optional requirements path>
originFingerprint: <optional fingerprint>
---

# Plan: <title>

## Source

## Scope

## Readiness

- Goal:
- Acceptance criteria:
- Non-goals:
- Affected areas:
- Validation surface:
- Open questions:

## Assumptions

## Alternatives Considered

- Recommended:
- Alternative:
- Rejected because:

## Decision Drivers

- Driver 1:
- Driver 2:
- Driver 3:

## Decisions

### ADR-1 - <decision title>

- Decision:
- Drivers:
- Alternatives:
- Why chosen:
- Consequences:
- Follow-ups:

## Risks

## Pre-Mortem

- Failure scenario 1:
- Failure scenario 2:
- Failure scenario 3:
- Mitigations:

## Implementation Units

### U1 - <unit name>

- Goal:
- Requirements covered:
- Acceptance criteria covered:
- Depends on:
- Files:
- Forbidden files:
- Approach:
- Tests:
- Validation:
- Rollback signals:
- Deferred to implementation:

## Validation Plan

- Unit:
- Integration:
- User flow:
- Data / operations:
- Observability:

## Rollback / Recovery

## Plan Self-Review

- Placeholder scan:
- Consistency check:
- Scope check:
- Acceptance coverage:
- Validation gaps:
- Alternatives and ADR check:
- High-risk pre-mortem check:

## Handoff
```

All paths must be repository-relative. Do not write code in the plan.

For multi-agent readiness, every implementation unit must keep `Depends on:` explicit. Use `none` for independent units or comma-separated unit IDs such as `U1, U2`. Use `Forbidden files:` to name shared files, lockfiles, generated outputs, or public contracts that a delegated worker must not edit.
