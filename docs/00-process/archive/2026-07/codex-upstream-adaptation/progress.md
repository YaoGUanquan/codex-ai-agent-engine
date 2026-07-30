# Codex Upstream Adaptation Progress

## Completed Scope

Adapted two portable upstream ideas into the existing Codex `ae-design` workflow without copying upstream code or prose: bounded existing-project evidence and qualitative test-case quality guards. No runtime dependency, OpenCode behavior, commit, or push was added.

## Evidence

- Upstream research input was `master@4547f7c49a3cbf061739eb9c2a9676ceba674e0f`; its GPL-3.0-or-later and OpenCode runtime were treated as a non-copyable research boundary.
- Canonical plugin source and `.agents/skills` mirror were updated together, with both distribution manifests advanced from `0.3.5` to `0.3.6`.
- Focused `risk-scaled test design guidance` regression passed.
- `npm test` passed: 87/87 tests.
- `npm run check` passed, including mirror, metadata, skill-contract, artifact, design-contract, install-smoke, and read-only graph checks.
- Final report-only code review approved with no findings.

## Evidence Boundaries

- The completed checks prove local skill guidance and distribution consistency only.
- Runtime health, authenticated service, browser, and deployment evidence are not-applicable to this guidance-only change.

## Git State

- No commit, push, reset, clean, rebase, branch, or worktree operation was performed.
