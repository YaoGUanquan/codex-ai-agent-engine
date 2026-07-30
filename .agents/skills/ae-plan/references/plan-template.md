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
depth: <standard|deep>
format: human-readable-plan
sharded: false
---

# Plan: <title>

## Source

## AI Parse Contract

- canonicalKind: plan
- humanEquivalent: true
- stableIdsRequired: true
- noImplicitScope: true

## Scope

## Readiness

- Goal:
- Acceptance criteria:
- Non-goals:
- Affected areas:
- Validation surface:
- Open questions:

## Validation Evidence (Conditional)

When a public API, persisted data, external service, deployment, or browser boundary exists, use `references/validation-evidence-profile.md`. Record only applicable tiers, their expected signals, preconditions, owner, status, and bounded claim. State `blocked`, `not-applicable`, or `unverified` evidence truthfully; a lower tier cannot prove a higher-tier outcome.

## Contract Value Classification (Conditional)

When a persisted data, public API, security, or external-service boundary exists, identify canonical persisted values, derived or ephemeral representations, caller-controlled input, compatibility fallback or source precedence, and the trust boundary.

## Evidence Matrix (Conditional)

| Acceptance criterion | Applicable tier | Expected signal and bounded claim | Preconditions / owner | Status | Recovery or rollback signal |
| --- | --- | --- | --- | --- | --- |
| <criterion> | <tier> | <signal and only what it proves> | <environment or actor> | <status> | <safe stop or recovery signal> |

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

## Global Constraints

- Constraint 1:
- Constraint 2:
- Constraint 3:

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

## Consistency Check

- implementationUnitCount:
- sourceRequirementsCovered:
- sourceRequirementsDeferred:
- openQuestionsCount:

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

Remove `origin` and `originFingerprint` together when there is no source artifact. If either field is present, both must be present and `origin` must be repository-relative. Omit `depth` for lightweight plans; use `standard` or `deep` for larger plans. Use `sharded: true` only when multiple modules require separate plan shards or the user explicitly asks for sharding.

For multi-agent readiness, every implementation unit must keep `Depends on:` explicit. Use `none` for independent units or comma-separated unit IDs such as `U1, U2`. Use `Forbidden files:` to name shared files, lockfiles, generated outputs, or public contracts that a delegated worker must not edit. `task-analyze` parses `Files:` as owned files and `Forbidden files:` as a separate forbidden boundary, so do not duplicate forbidden paths under `Files:`.
