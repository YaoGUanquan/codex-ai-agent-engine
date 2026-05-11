# AE Artifact Contract

Use these paths in target repositories. They are AE workflow conventions, not Codex built-ins.

| Artifact | Path | Notes |
| --- | --- | --- |
| Requirements | docs/ae/brainstorms/*-requirements.md | Product behavior, scope, success criteria, unresolved questions. |
| Plans | docs/ae/plans/*-plan.md | Implementation units, dependencies, files, validation, risks. |
| Reviews | docs/ae/reviews/<run-id>/ | Findings, reviewer outputs, synthesis, metadata. |
| Gates | docs/ae/gates/*.json | Delivery proof or blocked gate result. |
| Handoffs | docs/ae/handoffs/*.md | Worktree or session transfer context. |
| Solutions | docs/ae/solutions/ | Durable experience notes and patterns. |

## Frontmatter

Requirements files should include:

```yaml
---
type: brainstorm
status: drafted
date: YYYY-MM-DD
topic: short-kebab-topic
---
```

Plan files should include:

```yaml
---
type: plan
status: drafted
date: YYYY-MM-DD
title: short-kebab-title
origin: docs/ae/brainstorms/example-requirements.md
originFingerprint: YYYY-MM-DD-topic
---
```

Use repository-relative paths inside artifacts. Do not write absolute local paths into durable docs unless the artifact is explicitly local-only.
