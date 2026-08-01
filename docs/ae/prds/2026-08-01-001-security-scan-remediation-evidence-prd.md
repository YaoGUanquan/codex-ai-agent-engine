---
type: prd
status: drafted
date: 2026-08-01
topic: security-scan-remediation-evidence
format: human-readable-requirements
sharded: false
---

# Security Scan Remediation Evidence

## Source

- Requirements: `docs/ae/brainstorms/2026-08-01-security-scan-remediation-evidence-requirements.md`
- Existing scan contract: `plugins/ai-agent-engine-codex/skills/ae-security-scan/SKILL.md`
- Scan evidence: `docs/ae/security-scans/2026-07-31-ae-security-scan-full-retry-summary.md` and `docs/ae/security-scans/2026-07-31-ae-security-scan-post-remediation-full-summary.md`

## AI Parse Contract

- canonicalKind: requirements
- humanEquivalent: true
- stableIdsRequired: true
- noImplicitScope: true

## Problem Frame

`ae-security-scan` currently records a sanitized scan summary and says to verify then remediate findings, but it does not define how to reconcile scans after code changes. A complete post-remediation scan can therefore report a different finding set without a deterministic explanation of whether the original findings were fixed, missed, or replaced by related vulnerabilities.

The feature provides a finding-identity reconciliation contract and a remediation-report template. The user-facing delivery remains two reports: the scan report and one remediation report that progresses from local draft through approved execution to final reconciliation. The workflow remains consent-based and does not automatically modify source code.

## Requirements

- R1. The scan-report contract must record a source-scan reference, comparable source snapshot, and sanitized inventory entry for every reported finding.
  Acceptance: each entry includes a sanitized finding reference, severity, confidence, affected path or component, and local-verification state, while excluding raw finding text, source excerpts, provider information, credentials, JSON, SARIF, and raw logs.
- R2. The remediation-report contract must define one lifecycle: `draft`, `approved-for-execution`, `executed`, and `reconciled`.
  Acceptance: the local `draft` contains every source finding, its `canonicalCaseId`, proposed change, validation, rollback signal, and disposition candidate; execution may begin only after the user explicitly approves that exact draft scope, and later evidence updates the same report.
- R3. The workflow must make human approval and execution boundaries explicit.
  Acceptance: it requires local source verification and user approval of the draft remediation report before routing code changes to `ae-work`; it never treats a scanner recommendation as executable instructions or auto-applies a fix.
- R4. The post-remediation gate must compare inventories through human-verified canonical cases.
  Acceptance: every source finding maps to one `canonicalCaseId`; each case has exactly one status: `fixed`, `still-open`, `superseded-by-related-finding`, `not-applicable`, or `unverified`; a post-scan finding is linked to a case or listed as `new-untriaged`.
- R5. The reconciliation must make scan comparability explicit.
  Acceptance: it records target, include/exclude paths, mode, effort, CLI version, source revision, and non-sensitive snapshot identifier for both source and post-remediation scans. A changed source snapshot is expected; a scan-configuration mismatch or unavailable comparison is `unverified`.
- R6. The final gate must distinguish clean resolution from accepted residual risk.
  Acceptance: `pass` requires every canonical case to be `fixed` and no `new-untriaged` finding; `pass-with-accepted-risk` requires explicit user acceptance for every non-fixed case; otherwise the result is `fail`.
- R7. The distributed plugin must carry the same contract in source and mirror, and its report templates must install into a target project.
  Acceptance: source/mirror, language metadata, artifact, contract, package, and install-smoke checks cover the new contract and templates.

## Non-Functional Requirements

- NFR1. Preserve the protected-artifact boundary.
  Acceptance: raw artifact retrieval remains permitted only for user-requested inspection or remediation, and templates prohibit copying sensitive or raw material into tracked reports.
- NFR2. Preserve normal review and scan behavior.
  Acceptance: ordinary `ae-review` requests remain scanner-free, and no scan, dependency update, authentication action, code edit, commit, or push occurs automatically; template tests prove template shape only, while user approval is the execution gate.
- NFR3. Preserve package compatibility.
  Acceptance: the root package and plugin manifest have identical incremented SemVer versions when distributable plugin content changes.

## Success Criteria

- A user can inspect, approve, and later determine the disposition of every verified scan finding from one remediation report without comparing counts manually.
- A future rescan is recognized as validation evidence only after an approved, changed source snapshot exists.
- The workflow cannot represent a complete or zero-finding scan as a general security guarantee.

## Scope Boundary

### In Scope

- `ae-security-scan` source and mirror guidance, including the draft-report approval route.
- Sanitized scan-report inventory contract and a new remediation-report template.
- Security-scan documentation, contract tests, installation smoke coverage, and distributed version synchronization.

### Out Of Scope

- Automatic remediation code, scanner invocations, changes to the current five application findings, CI rollout, dependency updates, launcher changes, or raw-artifact format changes.

### Constraints

- The current worktree is dirty; only task-owned files may be edited.
- The security scan is an external, source-sharing and cost-bearing operation. Any later rescan requires fresh explicit approval.
- Existing `docs/ae/security-scans/*.md` summaries remain sanitized and must not be retrofitted with raw evidence.

## Validation Evidence

| Requirement | Applicable tier | Expected signal | Status |
| --- | --- | --- | --- |
| R1-R6, NFR1-NFR2 | Static inspection and focused automated tests | Required lifecycle, canonical-case fields, approval boundaries, snapshot fields, statuses, and no-raw-content rules are present in source and mirror. | planned |
| R7, NFR3 | Package and install smoke | Mirror, language metadata, artifact, contract, package, and disposable-install checks pass. | planned |
| R2-R6 | User approval | User inspects and approves a populated local draft remediation report. | unverified; future operational gate |
| R4-R6 | External scan | A later authorized rescan has comparable source/post snapshots and a reconciled report. | unverified; intentionally outside this change |

## Key Decisions

- D1. Use one local draft remediation report as the user approval and final reconciliation record.
  Reason: it replaces the choice between an unproven template-only automation gate and a separate manual report, while preserving two report types.
- D2. Compare human-verified canonical cases, not scanner IDs or counts.
  Reason: the protected-artifact comparison on 2026-07-31 found no common scanner identity across the two completed scans.
- D3. Record source and post-remediation snapshots separately while requiring comparable scan configuration.
  Reason: a fixed source must change snapshot; identical Git baseline alone does not prove identical worktree contents.

## Dependencies And Assumptions

### Dependencies

- Existing source/mirror distribution and template installation mechanisms.
- Existing `ae-work` and `ae-review` skills for authorized code edits and independent review.

### Assumptions

- A source-scan finding reference can be safely represented in sanitized form. `canonicalCaseId` is a human-created local case identifier after source verification; it is not inferred automatically from scanner text.

## Evidence Notes

- Existing workflow says to verify findings, obtain remediation approval, and then rescan: `plugins/ai-agent-engine-codex/skills/ae-security-scan/SKILL.md`.
- The current reports record only severity totals and broad status: `docs/ae/security-scans/2026-07-31-ae-security-scan-*-summary.md`.
- The non-overlap observation is from a user-requested comparison of protected original artifacts on 2026-07-31; the tracked summaries intentionally do not expose identity fields.
- Distribution versions must remain synchronized: `AGENTS.md`.

## Consistency Check

- requirementsCount: 7
- nonFunctionalRequirementsCount: 3
- decisionsCount: 3
- openQuestionsCount: 0
