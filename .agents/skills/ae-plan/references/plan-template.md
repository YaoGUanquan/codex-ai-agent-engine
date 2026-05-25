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

## Decisions

## Risks

## Implementation Units

### U1 - <unit name>

- Goal:
- Requirements covered:
- Acceptance criteria covered:
- Depends on:
- Files:
- Approach:
- Tests:
- Validation:
- Rollback signals:
- Deferred to implementation:

## Validation Plan

## Rollback / Recovery

## Plan Self-Review

- Placeholder scan:
- Consistency check:
- Scope check:
- Acceptance coverage:
- Validation gaps:

## Handoff
```

All paths must be repository-relative. Do not write code in the plan.
