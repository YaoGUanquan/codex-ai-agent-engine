---
type: prd
status: completed
date: 2026-08-10
topic: global-project-install-migration
format: human-readable-requirements
sharded: false
---

# Portable Global AE Migration

## AI Parse Contract

- canonicalKind: requirements
- humanEquivalent: true
- stableIdsRequired: true
- noImplicitScope: true

## Problem Frame

The existing global installer can stage a private runtime and skills, but it does not register the distribution as a Codex plugin. As a result, users cannot see or manage it through Codex's plugin surface. The required outcome is one user-level AE runtime plus a user-level personal marketplace entry installed through the official Codex CLI, while project-local data remains in each project.

## Requirements

**Portable discovery and migration**
- R1. The installer shall accept an explicit migration manifest containing candidate project roots for any operating-system user and shall not derive consumer eligibility from a fixed local drive or project-name list.
  Acceptance: a fixture using a non-`D:/codes` root previews and applies only its declared consumer roots.
- R2. Preview shall report, per component, whether it is current-release verified, historical-release verified, modified, missing, or excluded.
  Acceptance: a current fixture and a cataloged historical fixture are distinguishable from a changed fixture without writes.
- R3. Apply shall remove only verified AE-owned project components, retain each project's `AGENTS.md` and `docs/**`, and retain backups/journal until explicit purge.
  Acceptance: success and injected-failure fixtures prove protected hashes unchanged and recoverability.
- R4. The installer shall install or upgrade the current user's global runtime and skills transactionally.
  Acceptance: an existing prior global runtime upgrades to the new runtime without leaving partial runtime or skills.
- R5. A modified, unknown, or unlisted legacy component shall block apply before any project cleanup.
  Acceptance: an altered legacy fixture fails preflight with no project or global-runtime mutation.
- R6. Apply shall publish a copy of the distribution plugin under the current user's personal plugin root, maintain exactly one valid `ai-agent-engine-codex` entry in the personal marketplace, explicitly register that marketplace root, and invoke the official Codex plugin installation command.
  Acceptance: a controlled runner receives `codex plugin marketplace add $HOME --json` followed by `codex plugin add ai-agent-engine-codex@personal --json`; the published plugin fingerprint equals the staged distribution; the marketplace retains unrelated entries.
- R7. A successful current-user install shall be observable through `codex plugin list`, with `ai-agent-engine-codex@personal` shown as installed and enabled.
  Acceptance: the real current-user command reports the expected plugin selector and version after apply.

## Non-Functional Requirements

- NFR1. The migration must never scan, modify, or infer another operating-system user's home directory.
  Acceptance: foreign-home fixtures fail before writes.
- NFR2. Default behavior must be preview-only; destructive actions require an explicit apply operation ID and confirmation digest.
  Acceptance: invocation without all apply confirmations performs no mutation.
- NFR3. The installer shall not write, patch, or infer the Codex private cache or configuration format.
  Acceptance: all registration is performed by the supported `codex plugin marketplace add` and `codex plugin add` commands and the installer only owns its personal marketplace and user plugin source.

## Success Criteria

- A user can migrate `D:/codes/work`, `D:/codes/ph-ustyle/ustyle`, or an equivalent arbitrary root through a reviewed manifest without project-level AE runtime remaining afterward.
- Projects retain their own docs, memory, graphs, archives, and `AGENTS.md`.
- A user can see and manage `ai-agent-engine-codex` as a personal Codex plugin without adding project-local marketplace entries.

## Scope Boundary

### In Scope

- Portable manifest handling, historical release verification, safe component cleanup, global-runtime upgrade, documentation, and fixture coverage.

### Out Of Scope

- Moving or merging project documentation into a shared directory.
- Deleting user backups automatically.
- Auto-discovering or deleting project-local copies outside an explicit manifest.
- Writing directly to `~/.codex/plugins/cache` or any undocumented Codex client registry.

### Constraints

- Existing global/apply recovery and user-home protections remain mandatory.
- A project root may be nested beneath a non-project container directory.

## Key Decisions

- D1. Explicit manifest roots are the portable source of truth; automatic filesystem project discovery is not required.
  Reason: it avoids machine-specific assumptions and unexpected cleanup.
- D2. Historical release fingerprints, not version text alone, authorize automatic cleanup.
  Reason: version text can be edited while preserving untrusted component changes.
- D3. Modified legacy components remain a hard preflight block.
  Reason: normal apply must not silently retire user changes; the user selected the separate `--retire-modified` path, which requires complete backup before retirement.
- D4. The personal marketplace is the sole Codex-plugin registration boundary.
  Reason: Codex CLI owns installation state and cache layout; the installer must not emulate client internals.

## Dependencies And Assumptions

### Dependencies

- Release-owned historical fingerprints must be reconstructed from trusted release artifacts or source commits.

### Assumptions

- The desired end state is no project-local AE plugin, wrapper, managed skills, or marketplace entry for migrated roots.

## Open Questions

### Must Resolve Before Planning

- None. The user selected `--retire-modified` for complete-backup retirement, and approved the personal marketplace installation model.

### Deferred To Planning

- Q2. [Affects R4][technical] Choose atomic replacement mechanics for Windows runtime upgrades.

## Evidence Notes

- Current default preview -> Evidence: `node scripts/install-global.mjs preview` lists only the distribution source.
- Supported Codex registration -> Evidence: `codex plugin add --help`, local `plugin-creator` installation contract, and `codex plugin list`.

## Consistency Check

- requirementsCount: 7
- nonFunctionalRequirementsCount: 3
- decisionsCount: 4
- openQuestionsCount: 1
