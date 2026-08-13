<!-- ae-codex:init managed -->
# Cursor User-Level Skill Discovery — Archive Summary

- **Status:** done
- **PRD:** `docs/ae/prds/2026-08-13-cursor-user-skill-discovery-prd.md`
- **Design:** `docs/ae/designs/cursor-user-skill-discovery-2026-08-13/design.md`
- **Plan:** `docs/ae/plans/2026-08-13-002-cursor-user-skill-discovery-plan.md`
- **Experience:** `docs/ae/experience/2026-08-13-cursor-user-skill-discovery.md`
- **Version:** 0.3.29 (links, superseded) → 0.3.30 (real copies)
- **Commits:** `8236fa6`, `cd20d47`

## Delivered

| Unit | Outcome |
| --- | --- |
| U1 | Cursor roots, copy/link inspection, and confined copy-source helpers in `global-install-contract.mjs` |
| U2 | Apply publishes `~/.cursor/skills/ae-*` after personal plugin activation; rollback stays installer-owned |
| U3 | Install contract, INSTALL, README/CHANGELOG, and 0.3.29 release notes |
| U4 | 0.3.30 copies replace unpublished 0.3.29 links after the live probe showed Cursor does not track skill-directory symlinks |

## Validation (2026-08-13)

- `npm test` — 145/145
- `npm run check` — pass (release-notes ok at 0.3.30)
- `npm run check:smoke` — install smoke `verifiedPluginVersion` 0.3.30; global smoke ok
- Current-user apply `4e3ef0f4-05fe-4d1c-9f5a-a504e176e084` completed
- `codex plugin list` — `ai-agent-engine-codex@personal` installed, enabled, 0.3.30
- Live Cursor `/ae` — user confirmed after opening a new chat

## Boundaries

- Codex stays on the personal plugin. Cursor uses real copies under `~/.cursor/skills`. Do not restore `.agents/skills` in the distribution source. Do not write `~/.cursor/skills-cursor`.
- Leftover 0.3.29 links must be unlinked only. Recursive delete through a junction can destroy personal plugin files.
- Automated tests prove isolated-home filesystem behavior. Slash-palette refresh requires a new Cursor chat.
