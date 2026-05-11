<!-- ae-codex:experience -->
# Init Project Scaffold Experience

## Scope

This note is repo-specific to AI Agent Engine for Codex, but the workflow is reusable when adding project initialization behavior to another Codex plugin.

## Problem

The project needed an `init` command that can be run after project-level install to create a target project's `AGENTS.md`, AE workflow folders, process archive folders, and long-term AI memory folders. The command also needed to handle Chinese Markdown safely on Windows.

## Decision

- Add initialization behavior to `scripts/ae-tools.mjs` and the plugin copy under `plugins/ai-agent-engine-codex/scripts/ae-tools.mjs`.
- Create both AE-compatible workflow paths and the current project's long-term docs layout:
  - `docs/ae`
  - `docs/00-process`
  - `docs/08-ai-memory`
  - `docs/ai-memory` as a compatibility pointer
- Write generated files as UTF-8 and include explicit rules warning agents not to trust garbled PowerShell rendering.
- Preserve existing user files by default; only overwrite managed files when `--force` is used and the file contains the AE init marker.
- Extend `recovery` to inspect `docs/00-process/active/*.md`, because initialized projects may store resumable execution notes there instead of only in `docs/ae`.
- Expose init as an `ae-init` skill as well as a CLI command, so it appears in AE capability lists instead of only under helper CLI commands.

## Implementation Notes

- The init command should run from the target project directory, not from the installer temp directory.
- Installer documentation must make the target-directory context explicit for both PowerShell and Unix shell examples:
  - PowerShell: `Push-Location $target`, run `node scripts\ae-tools.mjs init`, then `Pop-Location`.
  - Unix shell: `(cd "$target" && node scripts/ae-tools.mjs init)`.
- Recovery candidates should include process notes with type `process-note` and recommendation `resume_with_process_note`.
- `ae-init` should stay a thin skill wrapper around `node scripts/ae-tools.mjs init`; the deterministic file creation remains in the CLI.
- Generated Chinese files should be verified with explicit UTF-8 reads, for example `Get-Content -Encoding UTF8`, before editing.

## Validation

Commands used for acceptance:

```powershell
cmd /c npm run check
node scripts\ae-tools.mjs init --dry-run --lang zh-CN
node scripts\ae-tools.mjs recovery
git diff --check
```

A smoke test also created a temporary file under `docs/00-process/active/` and confirmed that `recovery` returned `resume_with_process_note`; the temporary file was removed after validation.

## Durable Lessons

- Keep project install and project init as separate steps, but document them together so a fresh target project can be made usable in one flow.
- Use explicit target-directory execution in install docs. Relative `node scripts/...` commands are fragile after temp clone cleanup.
- Treat `docs/00-process/active` as a first-class recovery source after init scaffolding is introduced.
- On Windows, visible console mojibake is not proof that a UTF-8 file is corrupt. Verify encoding before rewriting Chinese documentation.
