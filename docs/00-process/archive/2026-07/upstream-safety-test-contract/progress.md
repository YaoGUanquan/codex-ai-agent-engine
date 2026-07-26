# Upstream Safety And Test Contract Progress

- Plan: `docs/ae/plans/2026-07-22-001-upstream-safety-test-contract-plan.md`
- Requirements: `docs/ae/prds/2026-07-22-001-upstream-safety-test-contract-prd.md`
- Worktree: user-selected `main`; unrelated untracked `.opencode/` and `ae/` were preserved.
- Consensus gate: requirements and plan reviewed inline with no blocking findings; serial execution was selected because U1 and U2 share `tests/skill-scripts.test.mjs`.

## Checkpoints

- 2026-07-22: baseline `npm.cmd test` passed 78/78 and `npm.cmd run check` passed before this implementation.
- 2026-07-22: U1/U2 RED assertions reproduced symbolic-link traversal and absent risk-scaled guidance.
- 2026-07-22: U1 GREEN confirmed linked artifacts are skipped and linked manifest subdirectories are rejected; U2 GREEN confirmed source/mirror guidance and template parity.
- 2026-07-22: U3 recorded upstream commit `76d832c96a1c810410982bf28b425a3aedb461ab` and the rejected OpenCode/fixed-count scope.
- 2026-07-22: full validation passed 80/80, `npm.cmd run check`, direct contract checks, and diff whitespace checks; reviewer and architect lanes approved.
- 2026-07-22: final review corrected the upstream license record to `GPL-3.0-or-later` from the upstream `package.json` and added the missing direct-file-link assertion where the platform permits it. A fresh graph scan of `plugins/ai-agent-engine-codex/scripts` found 6 nodes and 1 internal import edge; its `store.written=false`, so no graph artifact was persisted.
