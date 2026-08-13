# Cursor user-level skill discovery

## Consensus Gate

- Classification: S4 installer discovery-surface change.
- Requirements: `docs/ae/prds/2026-08-13-cursor-user-skill-discovery-prd.md`.
- Design: `docs/ae/designs/cursor-user-skill-discovery-2026-08-13/design.md`.
- Plan: `docs/ae/plans/2026-08-13-002-cursor-user-skill-discovery-plan.md`.

## Execution

| Unit | Result | Evidence | Status |
| --- | --- | --- | --- |
| U1 | Cursor paths and link/copy helpers in `global-install-contract.mjs` | isolated-home tests | implemented |
| U2 | Apply publishes `~/.cursor/skills/ae-*`; rollback is installer-owned | `tests/global-install.test.mjs` | implemented |
| U3 | Docs, smoke, 0.3.29 release notes | 0.3.29 shipped; superseded by U4 | implemented |
| U4 | Replace unpublished Cursor links with real copies (0.3.30) | `npm test` 145/145; `npm run check`; `npm run check:smoke`; `node scripts/check-release-notes.mjs` | implemented |

## Notes

- Codex remains `ai-agent-engine-codex@personal`.
- Cursor does not track skill-directory symlinks or junctions. 0.3.30 copies real skill directories into `~/.cursor/skills`.
- Leftover 0.3.29 links must be unlinked only; recursive delete through a junction is forbidden.
- Slash-palette refresh requires a new Cursor chat and is outside automated proof.
