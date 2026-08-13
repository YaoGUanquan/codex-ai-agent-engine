<!-- ae-codex:experience -->
# Cursor User-Level Skill Discovery Experience (0.3.29–0.3.30)

## Context

After the distribution source moved skills from `.agents/skills` to `.ae-source/skills`, Cursor lost its project-local discovery path. Codex still loads `ai-agent-engine-codex@personal`; Cursor does not read that plugin. One current-user global apply had to leave both clients able to invoke the same AE skills.

## What shipped

| Version | Surface | Result |
| --- | --- | --- |
| 0.3.29 | `~/.cursor/skills/ae-*` junctions or directory symlinks to the personal plugin | Isolated-home tests passed; live `/ae` listed nothing |
| 0.3.30 | Real directory copies of each personal-plugin `ae-*` skill | Isolated-home tests passed; a new Cursor chat listed the AE skills |

Codex discovery stayed on the personal marketplace plugin. Apply still does not recreate `$HOME/.agents/skills` or write `$HOME/.cursor/skills-cursor`. Leftover 0.3.29 links that still resolve to the personal plugin are classified historical-release verified and replaced with matching copies without `--retire-modified`.

## Root cause

Cursor does not track skill-directory symbolic links or Windows junctions. Replacing only `ae-help` with a real copy made `/ae` list that one skill. The 0.3.29 ADR that avoided a third hashed tree was therefore invalid for slash discovery.

## Reusable lessons

- **Prove Cursor skill discovery with a real directory, not a resolved link.** Isolated-home `realpath` checks cannot stand in for a fresh Cursor chat.
- **Unlink leftover junctions; never recursive-delete through them.** Recursive delete follows the personal plugin tree. Copies from 0.3.30 onward may be removed as ordinary directories.
- **Keep Codex and Cursor on independent roots.** Restoring `.agents/skills` in the distribution source would duplicate Codex discovery beside the personal plugin.

## Verification

- `npm test` — 145/145, including copy publication, leftover-link upgrade, foreign-skill retention, and rollback
- `npm run check` — ok at 0.3.30
- `npm run check:smoke` — install + global smoke ok, `verifiedPluginVersion` 0.3.30
- Current-user apply `4e3ef0f4-05fe-4d1c-9f5a-a504e176e084` completed; `codex plugin list` reports `ai-agent-engine-codex@personal` installed, enabled, 0.3.30; 40 Cursor `ae-*` entries are non-link directories
- Live slash: the user confirmed a new Cursor chat lists `/ae-*`

Proof boundary: installer filesystem contract, Codex plugin registration, and one fresh Cursor thread on this machine. Already-open chats keep their startup catalog.
