# Runtime Entry Contract

Apply once before running an AE helper command. Reuse the selected entry while the target project and installation are unchanged. This contract does not grant permission to run the selected command.

## Bootstrap

Locate the [read-only resolver](../scripts/resolve-runtime-entry.mjs) relative to this reference in the active `ae-help` skill. Set `aeResolver` to that file's inspected absolute path using the available file tools. Do not guess a Codex cache version, use another user's home, or search generated `dist` trees. Source, consumer `.agents/skills`, and global skill copies contain the same resolver. If the resolver itself is missing, report an incomplete installation; do not download or install anything automatically.

Run from the target project root, not the skill directory. The resolver accepts `--project-root <directory>` when inspecting another root, but it does not change the working directory for subsequent commands. Establish the correct cwd before execution.

`aeResolver` and `aeEntry` are shell-local variables; they do not persist across separate tool calls or new shell processes. Keep initialization and execution in the same call, or explicitly rebind the previously inspected absolute path in each new shell. Reusing a resolution result does not mean assuming a variable still exists.

PowerShell, after setting `$aeResolver`:

```powershell
$aeEntry = & node "$aeResolver"
if ($LASTEXITCODE -ne 0) { throw 'AE runtime entry resolution failed' }
node "$aeEntry" help
if ($LASTEXITCODE -ne 0) { throw 'AE helper failed; do not retry with another entry' }
```

POSIX shell, after setting `aeResolver`:

```sh
aeEntry="$(node "$aeResolver")" || exit "$?"
node "$aeEntry" help || exit "$?"
```

Replace `help` with the task's existing command and arguments. Keep paths quoted and pass arguments separately; do not use `eval`, `Invoke-Expression`, shell string concatenation, or a command string as the entry variable. Check the exit status after every command.

## Selection And Failure

1. Prefer the target root's `scripts/ae-tools.mjs`.
2. Only when that entry is absent, select the current user's `$HOME/.agents/ai-agent-engine-codex/bin/ae.mjs` (home is resolved by Node's OS API, not shell expansion inside a quoted catalog string).
3. A directory in place of an entry, an invalid parent, a dangling link, or a filesystem access error is a failure. Stop instead of changing versions.
4. If both entries are absent, stop with the missing-installation error. Installing, updating or changing the project is a separate authorized action.
5. Resolution only checks paths. Missing imports, unsupported commands, nonzero exit codes, runtime exceptions and business failures after selection stay failures. Never retry a write against the other installation.

Both entries expose the AE command family; installed versions may differ. This contract does not claim identical version capabilities, alter argument parsing, or change existing project-root discovery. Use the selected entry's `help` and report a version mismatch rather than silently changing entry.

## Help And Evidence

The capability catalog uses `node "$aeEntry"` as a command template. Actual `help` output includes separate PowerShell and POSIX assignments for the entry that successfully produced that output, preserving explicit invocation. Use the assignment for the current shell, not both. An explicitly invoked global dispatcher can therefore describe itself even when a project wrapper exists; this does not change default bootstrap priority.

Record the selected kind (project or global), command, exit result, and validation boundary when relevant. Local resolver and isolated installation tests do not prove host skill discovery, production acceptance, real-model routing accuracy, or token savings.
