---
type: plan
status: completed
date: 2026-08-10
title: personal-marketplace-global-plugin
origin: docs/ae/prds/2026-08-10-global-project-install-migration.md
originFingerprint: 2026-08-10-global-project-install-migration
depth: standard
format: human-readable-plan
sharded: false
---

# Plan: Personal Marketplace Global Plugin

## Source

- Requirements: `docs/ae/prds/2026-08-10-global-project-install-migration.md`
- Design: `docs/ae/designs/global-project-install-migration-2026-08-10/design.md`
- Governing rules: `AGENTS.md`

## AI Parse Contract

- canonicalKind: plan
- humanEquivalent: true
- stableIdsRequired: true
- noImplicitScope: true

## Scope

Publish the existing global AE distribution as a personal Codex plugin for the current OS user. Preserve the private dispatcher because installed skills invoke it. Keep project migration opt-in through `--manifest`; no default consumer scan or cleanup is introduced.

## Global Constraints

- Never modify `C:\\Users\\<user>\\.codex\\plugins\\cache` or other private Codex registry paths.
- `preview` remains read-only. `apply` retains operation ID, confirmation, backup, recovery, and `--retire-modified` safeguards.
- Do not migrate `docs/**`, `AGENTS.md`, source repositories, or undeclared consumer projects.
- The plugin registry refresh must explicitly use `codex plugin marketplace add $HOME --json`, followed by `codex plugin add ai-agent-engine-codex@personal --json`.
- The CLI runner is injectable for isolated tests; real CLI execution is limited to the current user's explicit apply.

## Alternatives

| Approach | Fit | Risk | Decision |
| --- | --- | --- | --- |
| Copy only `$HOME/.agents/skills` | Existing behavior | Invisible in the Codex plugin UI | Rejected |
| Patch Codex cache/config | Would appear locally | Private, brittle, unsafe across client versions | Rejected |
| Personal marketplace plus official CLI | Supported user-level plugin workflow | CLI registry remains an external operation boundary | Chosen |

## Decision Drivers

1. Codex must display the AE plugin for the installing user.
2. All projects for that user must use one global distribution without project enumeration.
3. Existing project copies must be retired only with manifest-bound authority and recoverable backups.

## Pre-Mortem

- The CLI fails after file publication: retain journal/backup, restore installer-owned files, report the unverified plugin state, and do not claim activation.
- An existing personal marketplace contains third-party entries: only replace the one AE entry; test exact retention.
- An older global install has user skill copies: back them up and do not recreate them, so the plugin is the sole discovery source.

## Validation Evidence

| Requirement | Tier | Signal | Owner | Status | Recovery signal |
| --- | --- | --- | --- | --- | --- |
| R6 | focused integration + current-user operations | fake CLI and real CLI receive marketplace registration followed by selector; published files hash-match source | maintainer | passed | failed runner rolls back owned files |
| R1-R5 | focused integration | existing manifest/backup fixture stays green | maintainer | passed | docs and `AGENTS.md` fingerprints persist |
| R7 | current-user operations | `codex plugin list --marketplace personal` shows installed, enabled selector/version | current user | passed | command output does not show expected plugin |

## Implementation Units

### U1 - Define personal marketplace paths and transaction rules

- Requirements covered: R4, R6, NFR1, NFR2, NFR3.
- Acceptance criteria covered: private runtime, personal plugin source, and personal marketplace have verified current-user paths and are journaled/backed up.
- Depends on: none.
- Files:
  - `plugins/ai-agent-engine-codex/scripts/global-install-contract.mjs`
  - `plugins/ai-agent-engine-codex/scripts/global-install.mjs`
- Forbidden files:
  - `.codex/**`
  - real consumer projects
- Layer ownership: Distribution, Guardrail.
- Validation: focused `tests/skill-scripts.test.mjs` fixture.
- Rollback signals: a target escapes the selected home or a marketplace third-party entry changes.
- Deferred implementation notes: no client-cache handling.

### U2 - Register through the official Codex CLI

- Requirements covered: R6, R7, NFR3.
- Acceptance criteria covered: apply invokes the expected selector after file activation and reports an actionable failure without exposing CLI internals.
- Depends on: U1.
- Files:
  - `plugins/ai-agent-engine-codex/scripts/global-install.mjs`
  - `tests/skill-scripts.test.mjs`
- Forbidden files:
  - `.codex/**`
  - `C:\\Users\\<user>\\.codex\\plugins\\cache/**`
- Layer ownership: Distribution.
- Validation: fake-runner fixture; current-user `codex plugin list` after explicit apply.
- Rollback signals: runner non-zero or plugin selector absent from list.
- Deferred implementation notes: no cross-user client validation.

### U3 - Align documentation, smoke checks, and release metadata

- Requirements covered: R1, R6, R7, NFR2, NFR3.
- Acceptance criteria covered: docs present the personal marketplace behavior and make manifest cleanup optional; smoke checks prove preview and current-user plugin state only after apply.
- Depends on: U1, U2.
- Files:
  - `README.md`
  - `README.en.md`
  - `INSTALL.md`
  - `INSTALL.zh-CN.md`
  - `docs/ae/references/global-ae-install-contract.md`
  - `scripts/check-global-install-smoke.mjs`
  - `package.json`
  - `plugins/ai-agent-engine-codex/.codex-plugin/plugin.json`
- Forbidden files:
  - real consumer projects
- Layer ownership: Distribution, Knowledge, Guardrail.
- Validation: `npm.cmd test`, `npm.cmd run check`, `node scripts/check-release-notes.mjs`, and current-user CLI list.
- Rollback signals: release-note validation fails or docs claim cache manipulation.
- Deferred implementation notes: Git commit/push is outside this request.

## Plan Self-Review

- Requirements mapped: R1-R7 and NFR1-NFR3 are covered by U1-U3.
- No automatic project scan, source-cache edit, or undocumented runtime claim is introduced.
- The external Codex CLI operation is explicitly separated from fixture proof and client-session discovery.
