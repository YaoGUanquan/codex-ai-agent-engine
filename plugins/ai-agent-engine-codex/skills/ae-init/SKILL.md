---
name: ae-init
description: Use when the user asks for AE init, /ae-init, initialize a project for AI Agent Engine for Codex, create AGENTS.md, create docs/ae, docs/00-process, docs/08-ai-memory, docs/ai-memory, archive rules, or UTF-8 Chinese documentation rules.
---

# AE Init

Initialize the target project with Codex guidance, AE workflow folders, process/archive docs, UTF-8 rules, and durable AI memory.

This skill is intentionally conservative. It turns "initialize this project" into a verified project setup, not a broad documentation rewrite.

## Operating Principles

- State assumptions before acting when the target directory, language, or overwrite intent is unclear.
- Prefer the smallest initialization that makes AE workflows usable; do not add speculative project process docs.
- Touch only AE init-managed files and directories unless the user explicitly asks for broader cleanup.
- Define success as generated paths plus verification evidence, not merely a completed command.

## Workflow

1. Confirm the current working directory is the target project.
2. Read existing project guidance first: `AGENTS.md`, `README*`, package or build metadata, and existing `docs/` conventions when present.
3. Inspect `git status --short` when the target is a Git repository and avoid overwriting user-owned files.
4. Run a preview first:

```powershell
node scripts/ae-tools.mjs init --dry-run
```

5. Choose language from the user request or existing project language:

```powershell
node scripts/ae-tools.mjs init --lang zh-CN
node scripts/ae-tools.mjs init --lang bilingual
```

Use the default only when no project signal or user preference points to Chinese or bilingual templates.

6. Run the real init only after the target project and language are clear:

```powershell
node scripts/ae-tools.mjs init
```

7. Verify the result by checking the command JSON plus the expected core paths: `AGENTS.md`, `docs/ae`, `docs/00-process`, `docs/08-ai-memory`, and `docs/ai-memory`.
8. On Windows, verify Chinese Markdown with explicit UTF-8 reads or Git diff before treating mojibake as file corruption.

## Success Criteria

- The target project is unambiguous.
- Existing non-managed files are preserved.
- The init command reports created, skipped, and updated files clearly.
- The generated `AGENTS.md` and docs contain the AE init marker where overwrite safety depends on it.
- A minimal validation command ran, such as `node scripts/ae-tools.mjs help` or a dry-run/init JSON inspection.

## Rules

- Do not run init from an installer temp directory.
- Existing files are skipped by default.
- Use `--force` only when the user explicitly wants managed AE init files regenerated.
- If `--force` is used, confirm the target files contain the AE init marker before relying on overwrite behavior.
- Treat PowerShell mojibake as a display issue until UTF-8 reads or Git diff prove file corruption.
- Do not add project-specific policies, architecture claims, or workflow obligations that were not discovered from the repository or requested by the user.
- If the command is unavailable, stop and report the missing script path instead of hand-creating the full scaffold from memory.

## Final Response

Report the target directory, language, created files, skipped files, validation command, and any files intentionally left untouched.
