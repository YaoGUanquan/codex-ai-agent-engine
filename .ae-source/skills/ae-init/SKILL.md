---
name: ae-init
description: Use when the user asks for AE init, /ae-init, initialize a project for AI Agent Engine for Codex, create AGENTS.md, create docs/ae, docs/00-process, docs/08-ai-memory, archive rules, or UTF-8 Chinese documentation rules.
---

# AE Init

Initialize the target project with AGENTS.md guidance and a selectable AE documentation scaffold. The command keeps the client-neutral AGENTS.md convention separate from Codex-specific instruction precedence.

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
4. Run a preview first. `ae-core` is the default profile; use `minimal` for only `AGENTS.md` or `full` for the legacy complete directory set:

```powershell
node "$HOME/.agents/ai-agent-engine-codex/bin/ae.mjs" init --dry-run
node "$HOME/.agents/ai-agent-engine-codex/bin/ae.mjs" init --dry-run --profile minimal
node "$HOME/.agents/ai-agent-engine-codex/bin/ae.mjs" init --dry-run --profile full
```

5. Choose language from the user request or existing project language:

```powershell
node "$HOME/.agents/ai-agent-engine-codex/bin/ae.mjs" init --lang zh-CN
node "$HOME/.agents/ai-agent-engine-codex/bin/ae.mjs" init --lang bilingual
```

Use the default only when no project signal or user preference points to Chinese or bilingual templates.

6. When the repository has subprojects or existing instruction files, preview the bounded candidates and Codex-specific precedence before writing:

```powershell
node "$HOME/.agents/ai-agent-engine-codex/bin/ae.mjs" init --dry-run --nested preview --explain-instructions
```

Nested candidates are advisory. Do not create nested `AGENTS.md` files without project-owner judgment.

7. Run the real init only after the target project, profile, and language are clear:

```powershell
node "$HOME/.agents/ai-agent-engine-codex/bin/ae.mjs" init
```

8. Verify the command JSON and the selected profile boundary. `minimal` creates only `AGENTS.md`; `ae-core` also creates canonical `docs/ae`, `docs/00-process`, and `docs/08-ai-memory` paths; `full` adds the legacy numbered documentation directories. Init does not create the legacy `docs/ai-memory` compatibility pointer.
9. Check `conflicted_files`. New files have a bounded AE-managed region; `--force` replaces only that region and preserves surrounding user content. Legacy marker-only files are preserved as conflicts because their user-authored changes cannot be distinguished safely.
10. On Windows, verify Chinese Markdown with explicit UTF-8 reads or Git diff before treating mojibake as file corruption.

## Success Criteria

- The target project is unambiguous.
- Existing non-managed files are preserved.
- The init command reports created, skipped, and updated files clearly.
- The generated `AGENTS.md` includes repository-derived package scripts when available.
- Generated files contain one bounded AE-managed region where regeneration safety depends on it.
- Instruction explanation labels Codex precedence as client-specific and nested discovery as bounded advice.
- A minimal validation command ran, such as `node "$HOME/.agents/ai-agent-engine-codex/bin/ae.mjs" help` or a dry-run/init JSON inspection.

## Rules

- Do not run init from an installer temp directory.
- Existing files are skipped by default.
- Use `--force` only when the user explicitly wants bounded managed regions regenerated.
- Do not convert a legacy marker-only conflict into a whole-file overwrite. Preserve the file and migrate its managed region manually.
- `--nested preview` never authorizes creating nested instruction files.
- Treat PowerShell mojibake as a display issue until UTF-8 reads or Git diff prove file corruption.
- Do not add project-specific policies, architecture claims, or workflow obligations that were not discovered from the repository or requested by the user.
- If the command is unavailable, stop and report the missing script path instead of hand-creating the full scaffold from memory.

## Final Response

Report the target directory, language, profile, created/updated/skipped/conflicted files, nested candidates when requested, validation command, and any files intentionally left untouched.
