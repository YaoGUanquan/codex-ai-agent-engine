# Plan Artifact

## Artifact Contract

Plan artifacts are implementation data documents for humans and downstream AI workflow. Use `plan-template.md` as the canonical structure.

Required frontmatter for new plans:

```yaml
---
type: plan
status: drafted
date: YYYY-MM-DD
title: kebab-case-title
origin: docs/ae/prds/YYYY-MM-DD-topic-prd.md
originFingerprint: YYYY-MM-DD-topic
depth: standard
format: human-readable-plan
sharded: false
---
```

Rules:

- Include `origin` and `originFingerprint` together when a source artifact exists; remove both when there is no source artifact.
- Include `depth: standard` or `depth: deep` for non-lightweight plans; omit `depth` for lightweight plans.
- Use `sharded: true` only when multiple modules require separate plan shards or the user explicitly asks for sharding.
- Include an `AI Parse Contract` section with `canonicalKind: plan`, `humanEquivalent: true`, `stableIdsRequired: true`, and `noImplicitScope: true`.
- Every implementation unit uses a stable `U*` ID, lists requirement IDs covered, acceptance criteria covered, dependencies, files, forbidden files, validation, rollback signals, and deferred implementation notes.
- The plan must not introduce product behavior absent from the source requirements; record such gaps as open questions instead.
- For an applicable evidence boundary, use `validation-evidence-profile.md` and map each high-risk acceptance criterion to a proof, owner, status, and recovery or rollback signal.

When the task may benefit from multi-agent execution, make the plan dependency-aware even if multi-agent config is currently disabled:

- Every implementation unit must include `Depends on:` with either `none` or explicit unit IDs such as `U1`.
- Every implementation unit must list owned files clearly enough for `task-analyze` to detect overlap.
- Carry Role, Read-only files, Shared resources, Acceptance and Data Access Budget from the [plan template](plan-template.md). Use the canonical role catalog from the [adaptive team contract](../../ae-help/references/team-execution.md); do not define a second role/model catalog.
- Do not design units only to reach a worker count. Split by real file ownership and dependency boundaries.
- Inspect shared API, state-machine, schema and config resources even when units own different files. Shared reads may overlap; a shared resource with any writer or a file with any writer must be serialized.
- Legacy plans remain usable; missing new fields are manual checks, not evidence of independent business contracts.
