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
4. Run the project installer with `--target` pointing to the current project. The default skill list metadata is bilingual; add `--lang en` or `--lang zh-CN` only when the user wants a single language.
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

Single-language metadata variants:

```powershell
node (Join-Path $tmp 'scripts\install-project.mjs') --target $target --lang zh-CN
node (Join-Path $tmp 'scripts\install-project.mjs') --target $target --lang en
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

Single-language metadata variants:

```bash
node "$tmp/scripts/install-project.mjs" --target "$target" --lang zh-CN
node "$tmp/scripts/install-project.mjs" --target "$target" --lang en
```

The default metadata language is `bilingual`. Supported metadata languages are `en`, `zh-CN`, and `bilingual`.

## Initialize Project Docs and AI Memory

After install, run this inside the target project:

```bash
node scripts/ae-tools.mjs init
```

This creates `AGENTS.md`, AE workflow artifact folders under `docs/ae` (including the canonical requirements directory `docs/ae/prds`), process/archive folders under `docs/00-process`, and durable project memory files under `docs/08-ai-memory`. Since 0.3.22, init no longer creates the legacy `docs/ai-memory` compatibility pointer; existing projects keep theirs unchanged.

Generated text files are written as UTF-8. On Windows, PowerShell can render valid UTF-8 Chinese text as garbled output, so verify with explicit UTF-8 reads or Git diff before rewriting files.

Useful variants:

```bash
node scripts/ae-tools.mjs init --lang zh-CN
node scripts/ae-tools.mjs init --dry-run
node scripts/ae-tools.mjs init --force
```

Existing files are skipped by default. `--force` only overwrites files that contain the AE init marker.

## Global Install

Global distribution keeps project data local. It maintains the current user's `$HOME/.agents/ai-agent-engine-codex` dispatcher, publishes `$HOME/plugins/ai-agent-engine-codex`, then asks the Codex CLI to install it from `$HOME/.agents/plugins/marketplace.json`; it does not centralize `docs`, AI memory, graph, archive, or `AGENTS.md`.

From a clone of this repository, preview before changing anything:

```powershell
node scripts\install-global.mjs preview
```

The default preview lists only the source-repository exclusion. Consumers come from an explicit manifest, and preview performs no writes. Apply is deliberately separate and requires the preview's operation ID and confirmation value:

```powershell
node scripts\install-global.mjs apply --apply --operation <preview-id> --confirm <preview-confirmation>
```

The default apply installs the personal plugin for the current user; it does not discover or retire project copies. To switch a project-level install to the global install, use an explicit manifest. The manifest is portable and may contain any project roots owned by the current user; it is not derived from a fixed `D:\\codes` list:

```json
{
  "projects": [
    { "root": "D:\\codes\\work", "role": "consumer" }
  ]
}
```

```powershell
$manifest = 'C:\temp\ae-consumers.json'
$preview = node scripts\install-global.mjs preview --manifest $manifest --retire-modified | ConvertFrom-Json
$preview.projects | Format-Table root, role, components
node scripts\install-global.mjs apply --manifest $manifest --retire-modified --apply --operation $preview.operationId --confirm $preview.confirmation
```

`--retire-modified` must be present in both preview and apply. It is the explicit authorization to make a complete backup before retiring modified or unknown historical AE components. The installer backs up verified project AE components and legacy user-level AE skills, publishes the personal plugin, creates `~/.cursor/skills/ae-*` links to that plugin's skills, explicitly registers the current user's marketplace with `codex plugin marketplace add $HOME --json`, then calls `codex plugin add ai-agent-engine-codex@personal --json`. It never patches the Codex cache, never writes `~/.cursor/skills-cursor`, and never moves `docs/**`, `AGENTS.md`, AI memory, graph, or archive. Backups and journals remain until an explicit terminal-operation purge:

```powershell
node scripts\install-global.mjs purge --operation <operation-id>
node scripts\install-global.mjs purge --operation <operation-id> --apply
```

An operation recorded as `recovery-failed` is not purgeable. Run `recover --operation <operation-id>` until it reaches `rolled-back` before purging its backup.

Once installed, invoke the user-level dispatcher from a project directory. Reopen Codex and Cursor chats so `/ae-*` can appear:

```powershell
node "$HOME\.agents\ai-agent-engine-codex\bin\ae.mjs" help
node "$HOME\.agents\ai-agent-engine-codex\bin\ae.mjs" init --project-root (Get-Location).Path
codex plugin list
```

## Update Existing Project Install

If this plugin is already installed in the current project, update it with:

```powershell
node scripts\update-ae-codex.mjs --repo https://github.com/YaoGUanquan/codex-ai-agent-engine.git --branch main
```

or:

```bash
node scripts/update-ae-codex.mjs --repo https://github.com/YaoGUanquan/codex-ai-agent-engine.git --branch main
```

The updater preserves the existing installed metadata language when possible; if it cannot detect one, it defaults to bilingual metadata. To override it, add `--lang en`, `--lang zh-CN`, or `--lang bilingual`.

After the files are updated, the updater automatically runs a conservative maintenance pass through the freshly installed CLI (`tidy --apply`: archive done process notes, remove empty task directories, move expired gate/evidence files per the retention policy, and report oversized memory files). It never archives merely stale notes. Add `--no-tidy` to skip maintenance; the result appears in the update output as `maintenance` and a failed pass never blocks the update itself.

After the files are updated, the updater automatically runs a conservative maintenance pass through the freshly installed CLI (`tidy --apply`: archive done process notes, remove empty task directories, move expired gate/evidence files per the retention policy, and report oversized memory files). It never archives merely stale notes. Add `--no-tidy` to skip maintenance; the result appears in the update output as `maintenance` and a failed pass never blocks the update itself.

## Configure Multi-Agent Auto Mode

After updating from the merged `main` branch, the latest profile template is available at `docs/ae/templates/ae-skill-profiles.example.yaml`. The updater does not overwrite `.codex/ae-skill-profiles.yaml`, because that file is a local runtime policy.

To use the safe auto analysis default in the target project:

```powershell
New-Item -ItemType Directory -Force -Path .codex | Out-Null
Copy-Item docs\ae\templates\ae-skill-profiles.example.yaml .codex\ae-skill-profiles.yaml
```

or:

```bash
mkdir -p .codex
cp docs/ae/templates/ae-skill-profiles.example.yaml .codex/ae-skill-profiles.yaml
```

Keep this baseline unless the user explicitly wants write-agent auto parallelism:

```yaml
multi_agent:
  enabled: auto
  mode: suggest
  allow_write_agents: false
```

`enabled: auto` lets `task-analyze` recommend parallel waves. It does not spawn write agents. Write-agent auto parallelism requires `mode: auto`, `allow_write_agents: true`, clean Git state, dependency-aware plan mode, and disjoint files.

Verify the effective policy against a real plan:

```bash
node scripts/ae-tools.mjs task-analyze --mode plan --plan docs/ae/plans/<your-plan>.md
```

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

Expected result: a capability list containing `ae-help`, `ae-lfg`, `ae-brainstorm`, `ae-plan`, `ae-constitution`, `ae-tasks`, `ae-work`, `ae-web-app`, `ae-backend`, `ae-debug`, `ae-tdd`, `ae-review`, and `ae-swagger-parser`.
