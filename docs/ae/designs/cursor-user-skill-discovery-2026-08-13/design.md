---
type: design
status: completed
date: 2026-08-13
title: cursor-user-skill-discovery
origin: docs/ae/prds/2026-08-13-cursor-user-skill-discovery-prd.md
originFingerprint: 2026-08-13-cursor-user-skill-discovery
format: human-readable-design
sharded: false
---

# Design: Cursor User-Level AE Skill Discovery

## Source

`docs/ae/prds/2026-08-13-cursor-user-skill-discovery-prd.md`

## AI Parse Contract

- canonicalKind: design
- humanEquivalent: true
- stableIdsRequired: true
- noImplicitScope: true

## Split Manifest

- mode: unified
- root: docs/ae/designs/cursor-user-skill-discovery-2026-08-13
- files:
  - design.md

## Overview

- Goal: extend the current-user global installer so one apply leaves Codex on the personal marketplace plugin and Cursor on user-level skill copies, without restoring a Codex-visible duplicate mirror.
- Source requirements: R1-R7, NFR1-NFR4.
- Required dimensions: overview, architecture, security, observability, non-functional, test-cases.
- Explicit omitted dimensions: api: explicitly-omitted (no service endpoint); database: explicitly-omitted (no durable data model); ui-ux: explicitly-omitted (no browser UI).
- Cross-dimension dependencies: personal plugin publication supplies copy sources; preview classification and `--retire-modified` gate Cursor replacements; rollback restores installer-owned Cursor entries with the rest of the file batch.

## Existing Project Evidence (Conditional)

- mode: inspected

| Evidence category | Repository-relative inputs | Sanitized conclusion | Confidence |
| --- | --- | --- | --- |
| stack and commands | `package.json`, `tests/global-install.test.mjs` | Isolated-home installer tests already cover preview, apply, marketplace, and rollback | verified |
| structure and conventions | `plugins/ai-agent-engine-codex/scripts/global-install.mjs`, `plugins/ai-agent-engine-codex/scripts/global-install-contract.mjs` | User paths, fingerprints, journals, and `--retire-modified` should be extended rather than replaced | verified |
| reusable assets | `docs/ae/references/global-ae-install-contract.md` | Discovery-surface documentation is the contract home for the Cursor path | verified |

## Implementation Constraints

- Repository paths: extend global-install contract and installer; update the install contract doc, README/CHANGELOG, and installer tests. Do not restore `.agents/skills` in the distribution source.
- Runtime/build commands: existing Node tests plus `check-global-install-smoke` remain the installer proof surface.
- Environment variables: none.
- Dependency boundaries: Node standard library only; Cursor skills are copied with `fs.cpSync`. Leftover 0.3.29 links still use unlink-only deletion.
- Feature flags/configuration: none beyond existing `--retire-modified` and apply confirmations.
- Rollback constraints: Cursor copies and leftover links are installer-owned files in the same journaled batch as the personal plugin source.

## Decisions

### ADR-001 - Independent discovery surfaces

- Decision: Codex continues to load `ai-agent-engine-codex@personal`. Cursor loads `$HOME/.cursor/skills/ae-*`. Apply does not recreate `$HOME/.agents/skills/ae-*` and does not move `.ae-source/skills` back to `.agents/skills`.
- Drivers: R1, R2, D1.
- Alternatives: restore `.agents/skills` as a shared tree; rejected because Codex would duplicate the personal plugin.
- Consequences: documentation must say Cursor uses a different root from Codex, and both clients need a new session after apply.
- Supersedes: the implication that `$HOME/.agents/skills` is the user-level discovery path for every client.

### ADR-002 - Links instead of a third copy

- Decision: each managed Cursor skill directory is a Windows junction or a POSIX directory symlink to `$HOME/plugins/ai-agent-engine-codex/skills/<name>`. Skill payloads are not copied into `~/.cursor/skills`.
- Drivers: original R3, D2, NFR3.
- Alternatives: copy skill trees into `~/.cursor/skills`; originally rejected to avoid a third hashed tree. Package a Cursor marketplace plugin; deferred as out of scope.
- Consequences: superseded after the 0.3.29 probe showed Cursor does not track skill-directory links.
- Supersedes: none. The existing ban on symbolic links inside hashed plugin content remains.
- Superseded by: ADR-005.

### ADR-005 - Real copies because Cursor does not follow skill-directory links

- Decision: each managed Cursor skill directory is a real copy of `$HOME/plugins/ai-agent-engine-codex/skills/<name>`. Matching copies are current-release verified. 0.3.29 junctions or symlinks that still resolve to the personal plugin skill are historical-release verified and may be replaced with copies without `--retire-modified`.
- Drivers: amended R3, live probe 2026-08-13 (`/ae` listed only `ae-help` after that one link was replaced with a copy).
- Alternatives: keep junctions from 0.3.29; rejected because Cursor does not track skill-directory symlinks or junctions.
- Consequences: Cursor skill trees are a third hashed copy; plugin upgrades rewrite copies; leftover links are unlinked without recursive delete through the target.
- Supersedes: ADR-002.

### ADR-003 - Own only current-release ae-* names

- Decision: the installer may create, replace, or delete only `ae-*` entries under `$HOME/.cursor/skills` that match current-release skill names or were created by a completed installer journal. All other Cursor skills are foreign.
- Drivers: R5, R6, D3, NFR1.
- Alternatives: replace the entire `~/.cursor/skills` tree; rejected because users keep unrelated personal skills. Write `~/.cursor/skills-cursor`; forbidden.
- Consequences: preview must classify Cursor `ae-*` entries the same way it classifies other user AE components.
- Supersedes: none.

### ADR-004 - Same transaction and retire-modified gate

- Decision: publish Cursor copies after personal plugin activation and before Codex CLI registration, still inside the installer-owned batch. Unknown or modified Cursor `ae-*` entries block apply unless `--retire-modified` is digest-bound. Codex CLI failure rolls back the copies. Leftover personal-plugin links are historical-release verified and may be replaced without that flag.
- Drivers: R4, R6, R7, D4, NFR2.
- Alternatives: treat Cursor publication as a best-effort step after Codex registration; rejected because a Codex CLI failure would leave a half-applied Cursor surface, and a later rollback would be incomplete.
- Consequences: journals record copy sources, leftover-link backups, and classification. Recovery uses that journal.
- Supersedes: none.

## Mapping Tables

### api-field-to-database-column-mapping

N/A: no API or database dimension.

### api-error-to-ui-state-mapping

N/A: no UI dimension.

### test-case-to-contract-coverage

| TC ID | Scenario | Covered IDs | Verification signal |
| --- | --- | --- | --- |
| TC-001 | Copy publication | R2, R3, ADR-005 | non-link directory fingerprint matches personal plugin skill |
| TC-002 | Foreign Cursor skill retention | R5, R6, ADR-003 | unrelated skill hash unchanged |
| TC-003 | Modified Cursor ae-* rejection | R6, ADR-004 | preflight fails with no home mutation |
| TC-004 | Transactional rollback | R7, ADR-004 | injected failure restores prior Cursor skill state |
| TC-005 | Preview classification | R4, NFR2 | missing/current/historical/modified distinguishable without writes |
| TC-006 | Codex duplicate avoidance | R1, ADR-001, NFR1 | no `$HOME/.agents/skills/ae-*`; no writes under skills-cursor |

### ui-component-to-api-endpoint-mapping

N/A: no UI/API dimension.

## Architecture

Canonical skill files remain `plugins/ai-agent-engine-codex/skills`. Global apply still stages the private dispatcher and publishes `$HOME/plugins/ai-agent-engine-codex`. After that directory exists, the installer ensures `$HOME/.cursor/skills` exists, then for each current `ae-*` skill copies `skills/<name>` from the personal plugin root into `$HOME/.cursor/skills/<name>` as a real directory. Leftover 0.3.29 links that still resolve to those plugin skills are classified historical-release verified, unlinked, and replaced with copies. Codex registration is unchanged. `$HOME/.agents/skills` stays a legacy path that apply may back up and retire but does not recreate.

Classification fingerprints compare the copied tree hash to the personal-plugin skill hash. Link detection remains only so leftover junctions and symlinks can be unlinked without following the target. The plugin-content walker continues to reject symbolic links inside plugin source, runtime, and personal plugin trees.

## API

Explicitly omitted: no network/API contract.

## Database

Explicitly omitted: operation journals remain existing JSON files.

## UI/UX

Explicitly omitted: CLI JSON output is the installer surface. Cursor and Codex slash palettes are client startup catalogs, not installer-owned UI.

## Test Cases

### TC-001 - Cursor copy publication

- Priority: P1
- Preconditions: isolated home; personal plugin source will be published by apply.
- Steps: apply with a successful Codex runner; inspect each `$HOME/.cursor/skills/ae-*` path.
- Expected result: one managed entry per current plugin skill; each entry is a non-link directory whose fingerprint matches `$HOME/plugins/ai-agent-engine-codex/skills/<name>`.
- Covered IDs: R2, R3, ADR-005

### TC-002 - Unrelated Cursor skill retention

- Priority: P1
- Preconditions: isolated home containing `~/.cursor/skills/other-skill/SKILL.md`.
- Steps: apply.
- Expected result: `other-skill` hash unchanged; only `ae-*` entries are created.
- Covered IDs: R5, R6, ADR-003

### TC-003 - Modified Cursor skill rejection

- Priority: P1
- Preconditions: an `ae-*` Cursor path exists as a content directory whose fingerprint does not match the personal plugin skill, or a link to a non-plugin target.
- Steps: apply without `--retire-modified`.
- Expected result: preflight fails; home Cursor skills and global runtime are unchanged.
- Covered IDs: R6, ADR-004

### TC-004 - Rollback of Cursor copies

- Priority: P1
- Preconditions: prior installer-owned Cursor copies or empty Cursor skill root.
- Steps: inject failure after copy creation, then inject Codex CLI failure on a separate apply.
- Expected result: both cases restore the journaled pre-apply Cursor skill state.
- Covered IDs: R7, ADR-004

### TC-005 - Preview reports Cursor surface

- Priority: P1
- Preconditions: fixtures for missing, current, and modified Cursor `ae-*` entries.
- Steps: preview only.
- Expected result: classification and confirmation digest include the Cursor surface; no writes.
- Covered IDs: R4, NFR2

### TC-006 - No Codex duplicate and no reserved Cursor root

- Priority: P1
- Preconditions: isolated home; optional pre-existing `$HOME/.cursor/skills-cursor` fixture.
- Steps: apply.
- Expected result: no installer-created `$HOME/.agents/skills/ae-*`; `skills-cursor` hash unchanged; distribution source still uses `.ae-source/skills`.
- Covered IDs: R1, ADR-001, NFR1

## Security

`$HOME/.cursor/skills` must canonicalize inside the current user home. Copy sources must be `guardedChild(personalPluginRoot, 'skills/' + name)`. Escaping sources, foreign homes, and writes to `skills-cursor` are rejected before mutation. Unknown `ae-*` replacements require digest-bound `--retire-modified`. Plugin trees still reject embedded symbolic links. Leftover junctions and symlinks are recorded and unlinked without following the target.

## Observability

Preview JSON includes a Cursor-skill component class per `ae-*` name. Journals record phase `publish-cursor-skills`, copy or leftover-link kind, source path, backup location, and rollback status. User-facing docs state that slash discovery needs a new Codex task and a new Cursor chat.

## Non-Functional

No new dependencies. Cursor skills are copied with `fs.cpSync`. Leftover 0.3.29 links are unlinked only. Automated proof is isolated-home filesystem behavior; Cursor palette refresh is a manual fresh-thread check and must be labeled as such in release notes.

## Consistency Check

- requiredDimensionsCovered: overview, architecture, security, observability, non-functional, test-cases
- omittedDimensionsJustified: api, database, ui-ux
- stableIdsUnique: true
- mappingTablesComplete: true
- sourceScopePreserved: true
- reviewStatus: passed
- deliveryStatus: completed
- processArchive: docs/00-process/archive/2026-08/cursor-user-skill-discovery/
