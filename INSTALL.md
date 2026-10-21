# Install And Migration

中文：[INSTALL.zh-CN.md](INSTALL.zh-CN.md)

## Prerequisites

- Node.js ≥ 20
- A host that supports [Agent Skills](https://www.npmjs.com/package/skills)
- Network access to `YaoGUanquan/codex-ai-agent-engine`

This repository **no longer** ships `install-project.mjs` / `install-global.mjs` / `update-ae-codex.mjs` or language-switch scripts.

## Install With The skills CLI

Confirm the CLI on your machine (`--help` is authoritative):

```bash
npx skills --help
```

Common flags (current `skills` package):

| Flag | Meaning |
| --- | --- |
| `add <package>` | Add a skill package (`owner/repo`, URL, …) |
| `-l, --list` | List skills in the package without installing |
| `-s, --skill` | Skill name(s); `*` means all |
| `-g, --global` | Install at user scope instead of the current project |
| `-y, --yes` | Skip confirmation |
| `-a, --agent` | Target agent directories (`*` for all) |
| `--copy` | Copy files instead of symlinking |

### Install all seven

```bash
npx skills add YaoGUanquan/codex-ai-agent-engine -y -s '*'
```

### Install one skill

```bash
npx skills add YaoGUanquan/codex-ai-agent-engine -y -s ae-backend
```

### User-scope install

```bash
npx skills add YaoGUanquan/codex-ai-agent-engine -g -y -s '*'
```

### Manual copy

Copy `skills/<name>/` (including `SKILL.md` and `references/`) into the host skills root under the same folder name. Keep each skill closed; do not copy a partial tree.

## Invocation

Name the skill explicitly, for example:

```text
$ae-grill …
$ae-frontend mode=fix …
$ae-unit-test …
```

Incidental words like “frontend” or “test” in natural language are **not** an invocation. Do not expect the retired `none|core|all` implicit tiers.

## Migrating From The Old Plugin

1. **Identify**: leftover `plugins/ai-agent-engine-codex`, `.codex-plugin`, old install scripts, or many retired `ae-*` entries (`ae-help`, `ae-plan`, `ae-work`, `ae-lfg`, `ae-prd`, …).
2. **Disable**: remove the old plugin/skills in the host so they do not load beside the new seven.
3. **Reinstall**: use `npx skills add` from this doc for `0.5.0`; do not run the legacy updater path.
4. **Keep personal data**: user docs, memory, config, backups, and journals stay; this release does not auto-scan or uninstall real personal installs.

See [README.en.md](README.en.md) “Migrating From The Old Plugin” and [CHANGELOG.en.md](CHANGELOG.en.md) `0.5.0` for capability mapping.

## Remove And Update

```bash
npx skills remove ae-grill ae-frontend ae-backend ae-unit-test ae-integration-test ae-e2e-test ae-e2e-suite
npx skills update
```

Updates go through the skills CLI, **not** the old plugin updater.

## Optional Developer Checks

After cloning this repository:

```bash
npm install
npm test
npm run check
npm run check:smoke
```

These prove repository contracts and isolated copies; they do not replace real host acceptance.
