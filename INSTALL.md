# Install AI Agent Engine for Codex

This file is intended to be fetched and followed by a Codex agent.

Repository URL placeholder: `https://github.com/YaoGUanquan/codex-ai-agent-engine`

Reference project: https://gitee.com/jiangqiang1996/ai-agent-engine

This Codex plugin references the workflow design and capability model of the Gitee AI Agent Engine project above. It does not install or run the upstream OpenCode runtime plugin.

## Recommended: Project-Level Install

Install only into the current project. Do not write global Codex configuration.

Steps for the Codex agent:

1. Confirm the current working directory is the target project.
2. Create a temporary directory outside the target project.
3. Clone this repository into the temporary directory.
4. Run the project installer with `--target` pointing to the current project. Add `--lang zh-CN` or `--lang bilingual` if the user wants non-English skill list metadata.
5. Run `node scripts/ae-tools.mjs init` from the target project if the user wants the target project to get `AGENTS.md`, `docs/ae`, `docs/00-process`, `docs/08-ai-memory`, archive rules, and UTF-8 Chinese handling rules.
6. Remove the temporary directory.
7. Tell the user to restart/reopen the Codex conversation for this project.

PowerShell implementation:

```powershell
$repo = 'https://github.com/YaoGUanquan/codex-ai-agent-engine.git'
$target = (Get-Location).Path
$tmp = Join-Path $env:TEMP ('ae-codex-install-' + [guid]::NewGuid().ToString('N'))
git clone --depth 1 $repo $tmp
node (Join-Path $tmp 'scripts\install-project.mjs') --target $target
Push-Location $target
node scripts\ae-tools.mjs init
Pop-Location
Remove-Item -Recurse -Force $tmp
```

Chinese metadata variant:

```powershell
node (Join-Path $tmp 'scripts\install-project.mjs') --target $target --lang zh-CN
```

Unix shell implementation:

```bash
repo='https://github.com/YaoGUanquan/codex-ai-agent-engine.git'
target="$PWD"
tmp="$(mktemp -d)"
git clone --depth 1 "$repo" "$tmp"
node "$tmp/scripts/install-project.mjs" --target "$target"
(cd "$target" && node scripts/ae-tools.mjs init)
rm -rf "$tmp"
```

Chinese metadata variant:

```bash
node "$tmp/scripts/install-project.mjs" --target "$target" --lang zh-CN
```

Supported metadata languages are `en`, `zh-CN`, and `bilingual`.

## Initialize Project Docs and AI Memory

After install, run this inside the target project:

```bash
node scripts/ae-tools.mjs init
```

This creates `AGENTS.md`, AE workflow artifact folders under `docs/ae`, process/archive folders under `docs/00-process`, and durable project memory files under `docs/08-ai-memory`. It also keeps `docs/ai-memory` as a compatibility pointer for earlier scaffolds.

Generated text files are written as UTF-8. On Windows, PowerShell can render valid UTF-8 Chinese text as garbled output, so verify with explicit UTF-8 reads or Git diff before rewriting files.

Useful variants:

```bash
node scripts/ae-tools.mjs init --lang zh-CN
node scripts/ae-tools.mjs init --dry-run
node scripts/ae-tools.mjs init --force
```

Existing files are skipped by default. `--force` only overwrites files that contain the AE init marker.

## Global Install

Global install is not recommended by default because Codex project skill loading and marketplace behavior may vary by environment. Prefer project-level install.

If the user explicitly asks for global install, stop and ask which Codex global plugin directory they want to use. Do not guess or write to global paths without confirmation.

## Update Existing Project Install

If this plugin is already installed in the current project, update it with:

```powershell
node scripts\update-ae-codex.mjs --repo https://github.com/YaoGUanquan/codex-ai-agent-engine.git --branch main
```

or:

```bash
node scripts/update-ae-codex.mjs --repo https://github.com/YaoGUanquan/codex-ai-agent-engine.git --branch main
```

The updater preserves the existing installed metadata language when possible. To override it, add `--lang en`, `--lang zh-CN`, or `--lang bilingual`.

## Switch Skill List Language

The skill list descriptions in Codex are static metadata files. Switch them in the installed project, then restart or reopen the Codex conversation:

Agent-assisted switch from the target project:

```text
Fetch and follow the AE skill language switch instructions from https://raw.githubusercontent.com/YaoGUanquan/codex-ai-agent-engine/main/INSTALL.md and switch this project to zh-CN.
```

Switch to English:

```text
Fetch and follow the AE skill language switch instructions from https://raw.githubusercontent.com/YaoGUanquan/codex-ai-agent-engine/main/INSTALL.md and switch this project to en.
```

For bilingual metadata, replace the final `zh-CN` or `en` with `bilingual`.

```powershell
node scripts\set-ae-language.mjs --lang zh-CN
node scripts\set-ae-language.mjs --lang en
node scripts\set-ae-language.mjs --lang bilingual
```

## Verify

After install/update, run:

```bash
node scripts/ae-tools.mjs help
node scripts/ae-tools.mjs init --dry-run
```

Expected result: a capability list containing `ae-help`, `ae-lfg`, `ae-brainstorm`, `ae-plan`, `ae-work`, `ae-review`, and `ae-swagger-parser`.
