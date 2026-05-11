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
5. Remove the temporary directory.
6. Tell the user to restart/reopen the Codex conversation for this project.

PowerShell implementation:

```powershell
$repo = 'https://github.com/YaoGUanquan/codex-ai-agent-engine.git'
$target = (Get-Location).Path
$tmp = Join-Path $env:TEMP ('ae-codex-install-' + [guid]::NewGuid().ToString('N'))
git clone --depth 1 $repo $tmp
node (Join-Path $tmp 'scripts\install-project.mjs') --target $target
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
rm -rf "$tmp"
```

Chinese metadata variant:

```bash
node "$tmp/scripts/install-project.mjs" --target "$target" --lang zh-CN
```

Supported metadata languages are `en`, `zh-CN`, and `bilingual`.

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

```powershell
node scripts\set-ae-language.mjs --lang zh-CN
```

or:

```bash
node scripts/set-ae-language.mjs --lang bilingual
```

## Verify

After install/update, run:

```bash
node scripts/ae-tools.mjs help
```

Expected result: a capability list containing `ae-help`, `ae-lfg`, `ae-brainstorm`, `ae-plan`, `ae-work`, `ae-review`, and `ae-swagger-parser`.
