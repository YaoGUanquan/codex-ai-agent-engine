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
| Process notes | docs/00-process/active/*.md | Active execution notes that need resume or later archive. |
| Process archive | docs/00-process/archive/YYYY-MM/<task-name>/ | Completed task archives. |
| Topic archive | docs/99-archive/YYYY-MM/<topic>/ | Larger topic or incident archives. |
| AI memory | docs/08-ai-memory/*.md | Stable cross-session project memory. |

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

## Encoding

Generated Markdown, JSON, YAML, SQL, and script files must be written as UTF-8, preferably UTF-8 without BOM.

On Windows, PowerShell output can render valid UTF-8 Chinese text as garbled text. Verify with explicit UTF-8 reads or Git diff before rewriting content only because the terminal preview looks wrong.

## Archive and Memory Rules

- Keep active process notes in `docs/00-process/active`.
- Archive completed process notes to `docs/00-process/archive/YYYY-MM/<task-name>/`.
- Use `docs/99-archive/YYYY-MM/<topic>/` for broader topic archives.
- Store durable project memory in `docs/08-ai-memory`.
- Do not write raw one-off logs, transient command output, or unconfirmed guesses into AI memory.
