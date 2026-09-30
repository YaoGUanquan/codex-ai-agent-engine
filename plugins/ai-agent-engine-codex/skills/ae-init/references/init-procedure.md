# Init Procedure

Before helper commands, resolve `aeEntry` using the [runtime entry contract](../../ae-help/references/runtime-entry.md).

## Workflow

1. Confirm the current working directory is the target project.
2. Read existing project guidance first: `AGENTS.md`, `README*`, package or build metadata, and existing `docs/` conventions when present.
3. Inspect `git status --short` when the target is a Git repository and avoid overwriting user-owned files.
4. Run a preview first. `ae-core` is the default profile; use `minimal` for only `AGENTS.md` or `full` for the legacy complete directory set:

```powershell
node "$aeEntry" init --dry-run
node "$aeEntry" init --dry-run --profile minimal
node "$aeEntry" init --dry-run --profile full
```

5. Choose language from the user request or existing project language:

```powershell
node "$aeEntry" init --lang zh-CN
node "$aeEntry" init --lang bilingual
```

Use the default only when no project signal or user preference points to Chinese or bilingual templates.

6. When the repository has subprojects or existing instruction files, preview the bounded candidates and Codex-specific precedence before writing:

```powershell
node "$aeEntry" init --dry-run --nested preview --explain-instructions
```

Nested candidates are advisory. Do not create nested `AGENTS.md` files without project-owner judgment.

7. Run the real init only after the target project, profile, and language are clear:

```powershell
node "$aeEntry" init
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
- A minimal validation command ran, such as `node "$aeEntry" help` or a dry-run/init JSON inspection.
