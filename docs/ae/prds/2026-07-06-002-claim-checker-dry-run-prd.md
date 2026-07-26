---
type: prd
status: completed
date: 2026-07-06
topic: claim-checker-dry-run
format: human-readable-requirements
sharded: false
---

# PRD: claim-checker-dry-run

## AI Parse Contract

- canonicalKind: requirements
- humanEquivalent: true
- stableIdsRequired: true
- noImplicitScope: true

## Problem Frame

The previous AE optimization added manual claim-integrity review guidance and an integrity ledger path. The deferred automation can now start as a dry-run checker because the first stable boundary is narrow: validate only explicit machine-readable claim blocks and evidence paths, without trying to infer claims from prose or enforce the checker in `npm run check`.

## Requirements

- R1: Provide a repository-local `scripts/check-claims.mjs` command that accepts `--dry-run` and returns deterministic JSON. Acceptance: running the command prints JSON with `status`, `dryRun`, `claimsChecked`, `warnings`, `errors`, and `unverifiable`.
- R2: Recognize only explicit fenced `ae-claim` blocks in Markdown files. Acceptance: prose without a claim block is ignored, and malformed claim blocks report schema errors with file and line evidence.
- R3: Validate a minimal stable claim schema. Acceptance: each claim requires `id`, `claim`, `source`, `layer`, `status`, `evidenceType`, and `evidence`, with invalid values reported as errors.
- R4: Verify path evidence deterministically. Acceptance: `evidenceType: path` requires a repository-relative existing path and fails when the path is missing or escapes the repository.
- R5: Preserve dry-run boundaries for command, assumption, and deferred evidence. Acceptance: command evidence is not executed; command, assumption, and deferred claims appear in `unverifiable` or `warnings` rather than being silently treated as verified.
- R6: Add regression tests for valid, invalid, legacy/no-claim, and deferred/unverifiable cases. Acceptance: `npm test` covers the new checker without network access or external dependencies.
- R7: Document the claim block schema in the existing integrity README. Acceptance: `docs/ae/integrity/README.md` names the supported fields and dry-run limitation.

## Success Criteria

- `node scripts/check-claims.mjs --dry-run` exits successfully on the current repository.
- `node scripts/check-claims.mjs --dry-run --include <fixture>` reports deterministic failures for invalid claim fixtures.
- The first version is not added to `npm run check`; users can run it manually while the schema proves itself.
- Existing AE artifact, mirror, install, and package checks still pass.

## Scope Boundary

- In scope: new dry-run script, tests, integrity README schema documentation, process evidence.
- Out of scope: natural-language claim extraction, command execution, network verification, CI/package-check wiring, new public skill, new dependency, Git commit, PR creation.

## Key Decisions

- D1: Use explicit fenced `ae-claim` blocks instead of NLP. Acceptance: the checker ignores unsupported prose and reports only block-level findings.
- D2: Treat command evidence as unverifiable in dry-run. Acceptance: output records command claims without executing them.
- D3: Keep the command manual-only in this pass. Acceptance: `package.json` remains unchanged unless a syntax check later requires adding the script to `npm run check`, which is currently a non-goal.

## Dependencies / Assumptions

- NFR1: The implementation must use Node.js standard library only. Acceptance: no lockfile or dependency file changes are required.
- NFR2: The output must be stable for downstream tooling. Acceptance: arrays use deterministic file and claim order.
- Assumption A1: The schema is stable enough for first automation when it supports at least path, command, assumption, and deferred evidence types.
- Assumption A2: The checker may scan zero claim blocks in the current repository and still be useful, because fixtures prove behavior while production claim adoption starts incrementally.

## Open Questions

- None blocking. Future work may decide whether `scripts/check-claims.mjs` should become part of `npm run check` after real repository claims use the schema.

## Consistency Check

- requirementsCount: 7
- nonFunctionalRequirementsCount: 2
- decisionsCount: 3
- openQuestionsCount: 0

## Self-Review

- Placeholder scan: pass.
- Scope check: pass; this is a dry-run checker only.
- Acceptance criteria: pass; every requirement has an inspectable or command-based signal.
- Assumption separation: pass; future CI wiring and NLP extraction are not implied.

## Completion

- Completed: 2026-07-06.
- Result: `scripts/check-claims.mjs --dry-run` now validates explicit `ae-claim` blocks, repository-relative path evidence, and dry-run unverifiable evidence classes.
- Manual-only boundary preserved: `package.json` was not changed and command evidence is not executed.
