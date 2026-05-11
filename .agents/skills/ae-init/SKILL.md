---
name: ae-init
description: Use when the user asks for AE init, /ae-init, initialize a project for AI Agent Engine for Codex, create AGENTS.md, create docs/ae, docs/00-process, docs/08-ai-memory, docs/ai-memory, archive rules, or UTF-8 Chinese documentation rules.
---

# AE Init

Initialize the current project with Codex guidance, AE workflow folders, process/archive docs, UTF-8 rules, and durable AI memory.

## Workflow

1. Confirm the current working directory is the target project.
2. Inspect `git status --short` and avoid overwriting user-owned files.
3. For preview, run `node scripts/ae-tools.mjs init --dry-run`.
4. For Chinese templates, run `node scripts/ae-tools.mjs init --lang zh-CN`; for bilingual templates, run `node scripts/ae-tools.mjs init --lang bilingual`.
5. Run `node scripts/ae-tools.mjs init` only after the target project is clear.
6. Verify generated paths and read Chinese Markdown with explicit UTF-8 when on Windows.

## Rules

- Do not run init from an installer temp directory.
- Existing files are skipped by default.
- Use `--force` only when the user explicitly wants managed AE init files regenerated.
- Treat PowerShell mojibake as a display issue until UTF-8 reads or Git diff prove file corruption.
