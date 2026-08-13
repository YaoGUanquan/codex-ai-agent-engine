---
type: experience
date: 2026-08-10
topic: global-project-install-migration
status: verified-with-runtime-evidence
---

# Per-user global AE migration

## Outcome

The AE runtime is distributed per operating-system user through a private dispatcher and a personal Codex marketplace plugin. Project knowledge remains project-local. Migration removes only declared project-level AE runtime files after ownership/fingerprint checks and retains recovery material.

## Runtime layout

- Dispatcher and operation state: `$HOME/.agents/ai-agent-engine-codex`.
- Official user-level skill discovery: `$HOME/.agents/skills`.
- Personal plugin source: `$HOME/plugins/ai-agent-engine-codex`.
- Personal marketplace manifest: `$HOME/.agents/plugins/marketplace.json`.
- Codex registration: `codex plugin marketplace add $HOME --json`, then `codex plugin add ai-agent-engine-codex@personal --json`.
- The installer does not edit `.codex/plugins/cache` or another user's home directory.

## Migration evidence

- `D:\codes\ph-ustyle\ustyle`: operation `977ed487-153b-4fc2-aa54-613d8e9947d5`, 54 backed-up changes.
- Approved consumers `ph-92wailian`, `ph-AionUi`, `ph-centent`, `ph-fromour`, `ph-Lingcard`, `ph-tranform`, and `ph-uumit`: operation `39b29a4a-426f-447c-b16b-abac891e6820`, 312 backed-up changes.
- All eight migrated projects have no project-level AE plugin, wrapper, `ae-*` skill, or AE marketplace entry. Their `AGENTS.md` and `docs/**` fingerprints match preflight, and dispatcher smoke passed.
- The distribution source `D:\codes\ph-AI-Agent-Engine` keeps `plugins/` and `.agents/skills` by design. `D:\codes\work` remains excluded/deferred and was not modified.

## Knowledge and recovery boundary

`docs/**`, `AGENTS.md`, `docs/08-ai-memory`, declared relations, shallow graph output, and archive files are not migration inputs and are not moved. Backups and journals remain after a terminal operation. Only an explicit `purge --operation <id> --apply` can remove them; `recovery-failed` must first be recovered to `rolled-back`.

## Verification boundary

The repository smoke and Codex CLI list prove the local distribution and registration contract. At this documentation checkpoint Codex reports the installed personal plugin as `0.3.16` while the repository source is `0.3.17`; run a new global apply after publishing this version to close that upgrade gap. A newly opened Codex task is required to observe the refreshed skill catalog; an already-open desktop task may retain its startup catalog. Consumer dispatcher smoke proves project-root routing, not authenticated target-project API, browser, or deployment acceptance.

## Later change (0.3.30)

`$HOME/.agents/skills` is no longer the Cursor discovery path. Global apply copies personal-plugin `ae-*` skills into `$HOME/.cursor/skills/<name>` as real directories. See `docs/ae/experience/2026-08-13-cursor-user-skill-discovery.md`.
