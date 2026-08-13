# Cursor user-level skill discovery

## Consensus Gate

- Classification: S4 installer discovery-surface change.
- Requirements: `docs/ae/prds/2026-08-13-cursor-user-skill-discovery-prd.md`.
- Design: `docs/ae/designs/cursor-user-skill-discovery-2026-08-13/design.md`.
- Plan: `docs/ae/plans/2026-08-13-002-cursor-user-skill-discovery-plan.md`.

## Execution

| Unit | Result | Evidence | Status |
| --- | --- | --- | --- |
| U1 | Cursor paths and link helpers in `global-install-contract.mjs` | isolated-home tests | implemented |
| U2 | Apply publishes `~/.cursor/skills/ae-*` links; rollback unlinks only | `tests/global-install.test.mjs` | implemented |
| U3 | Docs, smoke, 0.3.29 release notes | `npm test` 144/144; `npm run check`; `npm run check:smoke`; `node scripts/check-release-notes.mjs` | implemented |

## Notes

- Codex remains `ai-agent-engine-codex@personal`.
- Cursor links are junctions on Windows; recursive delete through a junction is forbidden.
- Slash-palette refresh requires a new Cursor chat and is outside automated proof.
