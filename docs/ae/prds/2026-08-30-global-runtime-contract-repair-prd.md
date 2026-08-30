---
type: prd
status: drafted
date: 2026-08-30
topic: global-runtime-contract-repair
format: human-readable-requirements
sharded: false
---

# Global Runtime Contract Repair

## AI Parse Contract

- canonicalKind: requirements
- humanEquivalent: true
- stableIdsRequired: true
- noImplicitScope: true

## Problem Frame

The global-only installation removes project wrappers, but the capability catalog still advertises those wrappers. Project selection is also ambiguous because `--root` can bypass discovery even though memory and graph commands define it as a repository-relative subdirectory. Finally, strict design validation has no explicit migration-report mode for consumer corpora. Repair these contracts and refresh the current user's Codex and Cursor copies without changing consumer project documents.

## Requirements

**Global command contract**
- R1. Every CLI command advertised by global help must execute through the installed global dispatcher without requiring consumer `scripts/*.mjs` wrappers.  
  Acceptance: isolated global-install smoke executes artifact, design, and memory check commands from the installed dispatcher, and help contains no advertised consumer wrapper path.
- R2. Global update must refresh the current-user runtime, personal plugin, marketplace registration, and Cursor skill copies through the existing transactional installer.  
  Acceptance: an isolated update test proves the updater routes a cloned release through preview/apply, while the real update reports a completed operation and matching installed versions.

**Root semantics**
- R3. `--project-root` is the only option selecting a project for project-aware commands; `--root` remains a repository-relative subdirectory for memory and knowledge commands, while graph helpers retain their documented generic-directory scan mode.  
  Acceptance: nested-CWD and explicit-project tests select the same project, memory absolute `--root` is rejected, and only graph helpers may bypass project discovery.

**Design compatibility**
- R4. Strict design validation remains the default, while an explicit compatibility mode reports all violations without failing migration assessment.  
  Acceptance: malformed legacy fixtures fail normally and return `compatible-with-warnings` with the same diagnostics under `--compat`.
- R5. Consumer corpus feedback is represented by a deterministic repository fixture rather than modifying external project history.  
  Acceptance: the fixture covers a pre-contract/partial design and is exercised in automated tests.

**Distribution**
- R6. The distributable plugin version, bilingual release notes, source/mirror help catalog, and current-user Codex/Cursor installations remain synchronized.  
  Acceptance: release-note, mirror, test, contract, smoke, installed-version, and Cursor fingerprint checks pass.

## Non-Functional Requirements

- NFR1. Preserve transactional rollback and path-containment checks in the global installer.  
  Acceptance: existing rollback and path-security tests continue to pass.
- NFR2. Do not modify `D:/codes/work` documents, project source, `AGENTS.md`, or memory state.  
  Acceptance: the implementation invokes that project only for optional read-only verification, if at all.

## Success Criteria

- Global help is executable as written.
- Project and subdirectory options are unambiguous and tested.
- Strict and migration-report design checks have separate, observable outcomes.
- Current-user Codex and Cursor copies report the new release version and matching skill fingerprints.

## Scope Boundary

### In Scope

- Global dispatcher commands, help catalog, design checker compatibility mode, focused fixtures/tests, release metadata, and current-user installation refresh.

### Out Of Scope

- Rewriting consumer designs, relaxing strict validation by default, centralizing project docs, changing Cursor discovery behavior, commit, or push.

### Constraints

- Preserve unrelated dirty-worktree changes and reuse the existing transactional global installer.

## Perspective Collision

- Critic: a broad compatibility fallback could hide invalid new designs (value disagreement).
- Pragmatist: help must only advertise commands that work after wrapper removal (fact disagreement resolved by reproduction).
- Innovator: version-aware migration is useful, but a new schema migration is larger than this repair (scope disagreement).
- Systems: root selection and subdirectory selection must be separate across every entrypoint (contract disagreement).
- Collision insight: keep strict validation authoritative and make compatibility an explicit report-only mode, so migration visibility does not weaken delivery gates.
- Thinking preservation zone: deciding whether to repair individual consumer documents remains project-owner judgment.

## Key Decisions

- D1. Reuse the dispatcher and transactional global installer rather than recreate checker or distribution logic.
- D2. Keep `--compat` explicit and non-authoritative; default and `--strict` remain failing gates.
- D3. Treat `--project-root` as the sole project selector.

## Dependencies And Assumptions

### Dependencies

- Existing global installer rollback journal and current-user Codex plugin registration command.

### Assumptions

- The configured repository and `main` branch remain reachable during the requested real update.

## Open Questions

### Deferred To Planning

- None.

## Evidence Notes

- Wrapper/help mismatch -> `plugins/ai-agent-engine-codex/skills/ae-help/references/capability-catalog.json` and global-only consumer reproduction.
- Root mismatch -> `plugins/ai-agent-engine-codex/scripts/ae-tools.mjs` and `memory-knowledge-contract.mjs`.
- Design corpus drift -> read-only check against `D:/codes/work`; only two reported violations were introduced by the 0.3.35 UI rule.

## Consistency Check

- requirementsCount: 6
- nonFunctionalRequirementsCount: 2
- decisionsCount: 3
- openQuestionsCount: 0
