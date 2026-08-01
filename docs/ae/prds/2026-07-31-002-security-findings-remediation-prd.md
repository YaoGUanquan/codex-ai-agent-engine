---
type: prd
status: drafted
date: 2026-07-31
topic: security-findings-remediation
format: human-readable-requirements
sharded: false
---

# PRD: Security Findings Remediation

## Source

- Requirements: `docs/ae/brainstorms/2026-07-31-security-findings-remediation-requirements.md`
- Evidence index: `docs/ae/security-scans/2026-07-31-ae-security-scan-full-retry-summary.md`

## AI Parse Contract
- canonicalKind: requirements
- humanEquivalent: true
- stableIdsRequired: true
- noImplicitScope: true

## Problem Frame

The full scan completed with complete coverage and reported one medium and two low findings. Local source verification confirmed three concrete boundaries requiring remediation: unauthenticated static preview path exposure, installer writes through target-tree junctions, and untrusted package metadata rendered as durable agent instructions.

## Requirements

- R1 - Harden static preview path handling. Acceptance: hidden/VCS components, traversal, symlinked files, and canonical paths outside the selected root return a rejection; a normal file under the root still returns successfully; non-loopback host selection is rejected.
- R2 - Harden installer target handling. Acceptance: any existing symlink or junction in the selected target path causes a nonzero failure before a write/delete/copy/spawn operation can cross it; a normal disposable target completes installation.
- R3 - Bound project metadata in generated instructions. Acceptance: newline-delimited or Markdown-heading package descriptions are normalized into one quoted metadata value in every generated language variant and cannot add a new normative section.
- R4 - Preserve and prove behavior. Acceptance: focused regression tests cover R1-R3 and `npm test`, `npm run check`, mirror/contract checks, and install smoke remain passing.

## Non-Goals

- No scanner package upgrade or provider configuration change.
- No broad redesign of the installer or preview server.
- No claim that the repository is secure beyond the verified findings and tests.

## Constraints and Risks

- Existing user changes and untracked scan artifacts remain untouched.
- Symlink/junction checks reduce the demonstrated race and link escape but do not claim kernel-level atomicity against an adversary who can mutate the filesystem between every check and operation.
- Static preview remains an unauthenticated local developer tool; remote authenticated exposure is deferred.

## Validation Expectations

- Static inspection: source guards and generated metadata templates.
- Focused automated tests: preview rejection, installer junction rejection, and init metadata isolation.
- Integration/build checks: existing package, mirror, contract, artifact, and install-smoke checks.

## Assumptions

- The target project passed to the installer exists and is a directory.
- The protected scan findings remain available for later user-requested inspection without rescanning.

## Open Questions

- None for this remediation slice.

## Consistency Check
- requirementsCount: 4
- nonFunctionalRequirementsCount: 0
- decisionsCount: 0
- openQuestionsCount: 0
