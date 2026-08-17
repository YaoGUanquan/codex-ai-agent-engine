---
type: prd
status: drafted
date: 2026-08-17
topic: interface-safety-reliability
format: human-readable-requirements
sharded: false
---

# Interface Safety And Reliability PRD

## AI Parse Contract

- canonicalKind: requirements
- humanEquivalent: true
- stableIdsRequired: true
- noImplicitScope: true

## Problem Frame

The authorized source review recorded five defects in project installation, static preview serving, evidence persistence, delimited-file conversion, and review-contract validation. The required outcome is to remove the identified data-loss, workspace-escape, concurrency, parsing, and invalid-input risks without broadening the plugin's runtime surface or overwriting consumer-owned content.

## Requirements

**Installation Safety**
- R1. Project installation must refuse an omitted `--target`, a distribution-source target, overlapping source/target paths, and reparse-point targets.
  Acceptance: focused installer tests prove each unsafe target form exits non-zero before installation state is changed.
- R2. Re-installation may replace only components previously recorded as installer-owned and unchanged; unknown or changed managed components require explicit replacement authorization, are backed up before mutation, and are restored if an installation step fails.
  Acceptance: focused tests prove clean owned upgrades, rejection of changed components by default, explicit authorized replacement, backup creation, and injected-failure recovery.
- R3. Project installation must not delete retired skills or scripts unless they are recognized as installer-owned.
  Acceptance: a fixture containing user-owned retired paths survives installation while a matching previously installed retired component is safely removed.

**Local Static Serving**
- R4. The static server must serve only canonical paths contained by the canonical workspace and must bind only to loopback hosts.
  Acceptance: dry-run tests accept `127.0.0.1`, `::1`, and `localhost`, reject non-loopback hosts, and reject a symlink or junction resolving outside the workspace.

**Evidence Integrity**
- R5. Concurrent evidence writes must append a complete, ordered JSONL ledger without lost records or broken hash-chain links.
  Acceptance: a multi-process fixture produces one readable ledger event per writer, with `readEvidenceLedger` reporting `passed`.

**Delimited Conversion**
- R6. CSV and TSV conversion must preserve quoted delimiters, escaped quotes, CRLF, and quoted multiline fields, while malformed quoting returns a stable location-bearing error.
  Acceptance: table-driven tests verify the supported forms and malformed-input diagnostic without exceeding the existing 5,000 data-row limit.

**Review Contract Validation**
- R7. `review-contract` must reject unsupported `kind`, `mode`, and target values before selecting reviewers or writing evidence.
  Acceptance: table-driven tests prove documented allowed values remain accepted and each unsupported value exits with a stable error.

## Non-Functional Requirements

- NFR1. The repair must use Node.js built-ins and established repository patterns; it must add no dependency, network listener mode, background process, or persistent service.
  Acceptance: `package.json` dependency surface is unchanged and static source inspection confirms loopback-only binding.
- NFR2. All modified distributable plugin content, mirrors, versions, and release notes must remain synchronized.
  Acceptance: mirror, release-note, install-smoke, package test, and package contract commands pass after both manifests report the same patch version.
- NFR3. Existing user worktree changes and consumer-owned files outside verified installer ownership remain preserved.
  Acceptance: task tests preserve intentional user-owned fixture files and final review inventories unrelated worktree changes as excluded.

## Must-Haves

- Requirement ID: R2
  Must-have completion condition: no ordinary project-install invocation can recursively delete an unknown or modified managed component.
- Requirement ID: R4
  Must-have completion condition: no static-server invocation can expose a canonical path outside the workspace or bind a non-loopback host.
- Requirement ID: R5
  Must-have completion condition: parallel writers cannot silently replace another writer's ledger event.

## Success Criteria

- All five review findings are covered by regression tests and pass the repository's release validation.
- The installer has a concrete recovery path for failures after the first mutation.
- No unsupported runtime capability is claimed by documentation or release notes.

## Scope Boundary

### In Scope

- `scripts/install-project.mjs` and its project-install test and smoke coverage.
- Static-server, evidence, markitdown, and review-contract helper behavior and tests.
- Required static-server skill mirror, release version metadata, release notes, process evidence, PRD, design, plan, and reviews.

### Out Of Scope

- Global installer migration behavior, external network serving, production deployment, automatic repair of prior consumer installations, new dependencies, commits, and pushes.

### Constraints

- Preserve all existing user changes in the dirty `main` worktree.
- Use repository-relative paths and UTF-8 text.
- Keep `docs/08-ai-memory` entries from the original audit as evidence, rather than duplicating them.

## Validation Evidence

| Requirement | Tier | Expected bounded evidence | Preconditions | Status |
| --- | --- | --- | --- | --- |
| R1-R3 | focused integration | temporary project fixture exercises installer behavior | local filesystem | planned |
| R4 | focused integration | dry-run and symlink/junction fixture exercise host and canonical containment | local filesystem | planned |
| R5 | focused integration | concurrent local child processes produce a verifiable ledger | local filesystem | planned |
| R6-R7 | focused unit | command fixtures assert parser and validation errors | Node.js test runner | planned |
| NFR2 | package/distribution | package checks and isolated install smoke pass | repository toolchain | planned |

No browser, authenticated service, deployment, or external-host proof is applicable; those tiers remain not-applicable.

## Perspective Collision

| Perspective | Position | Disagreement type |
| --- | --- | --- |
| Critic | Reject unowned installer content by default, even if migration is less convenient. | value |
| Pragmatist | Permit seamless updates when the prior installer can prove ownership. | assumption |
| Innovator | Offer an opt-in replacement path rather than a permanent upgrade dead end. | value |
| Systems | Treat symlink resolution, rollback, and concurrent persistence as state-boundary contracts. | fact |

- Collision insight: provenance converts the safety/convenience conflict into a deterministic ownership rule.
- Blind spot: Windows junction coverage varies with local privileges; tests must report skips only where the platform cannot create one.
- Thinking preservation zone: whether to introduce a future interactive consumer-migration UX remains a maintainer product decision and is out of scope.

## Key Decisions

- D1. Use installer ownership metadata and explicit `--replace-modified` authorization instead of blindly deleting target components.
  Reason: it preserves consumer changes while permitting deterministic updates.
- D2. Restrict static serving to loopback rather than adding a network-exposure confirmation flag.
  Reason: network serving is outside the skill's documented preview purpose.
- D3. Use bounded, standard-library locking and atomic replacement for ledger writes.
  Reason: it fixes the read-modify-write race without a dependency or daemon.

## Dependencies And Assumptions

### Dependencies

- The reviewed defect evidence in `docs/ae/solutions/2026-08-17-interface-optimization-roadmap.md`.
- Existing Node.js filesystem and test APIs.

### Assumptions

- Project installer targets are local, writable filesystem paths.
- Existing test fixtures can create symbolic links; junction-specific behavior may be platform-gated.

## Open Questions

### Deferred To Planning

- Q1. [Affects R2][technical] The exact state-file layout and confirmation syntax should reuse the smallest compatible local convention.
- Q2. [Affects R5][technical] The lock retry ceiling should be finite and testable without claiming cross-filesystem distributed locking.

## Evidence Notes

- Defect scope -> `docs/ae/solutions/2026-08-17-interface-optimization-roadmap.md`.
- Existing distribution hardening patterns -> `plugins/ai-agent-engine-codex/scripts/global-install-contract.mjs` and `plugins/ai-agent-engine-codex/scripts/global-install.mjs`.

## Consistency Check

- requirementsCount: 7
- nonFunctionalRequirementsCount: 3
- decisionsCount: 3
- openQuestionsCount: 2
