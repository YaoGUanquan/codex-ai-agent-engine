# Security Remediation Report

## Report Lifecycle

- State: `draft` | `approved-for-execution` | `executed` | `reconciled`
- Report identifier:
- Source scan reference:
- This is the same report throughout approval, execution, and reconciliation; do not create a third user-facing approval report.

## Source Scan Configuration And Snapshot

- Target:
- Include paths:
- Exclude paths:
- Scan mode:
- Effort:
- CLI version:
- Source revision:
- Non-sensitive source snapshot identifier:
- Coverage completeness:

## Draft Approval Record

- Exact approved case scope:
- Proposed changes, validation, and rollback signals reviewed:
- Approval decision: `approved` | `not-approved` | `invalidated-by-scope-change`
- Approval record: record the decision and date only; do not record personal data.

No `ae-work` source mutation may begin until this report is in `approved-for-execution` with an explicit approved decision. A material change to the case scope, proposed change, validation, or rollback signal invalidates approval and requires a new approval record.

## Canonical Case Ledger

| Source finding reference | `canonicalCaseId` | Local verification | Proposed change | Validation | Rollback signal | Status | Residual risk | Post-scan finding reference |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| sanitized reference | human-verified ID | `verified` | | | | `unverified` | | |

Each source finding has one human-verified `canonicalCaseId` and exactly one status: `fixed`, `still-open`, `superseded-by-related-finding`, `not-applicable`, or `unverified`. Do not map cases by raw scanner ID, count reduction, zero findings, or complete coverage alone.

## Execution And Review Evidence

- Authorized `ae-work` change reference:
- Independent `ae-review` result:
- Local validation commands and results:
- Changed source revision:
- Non-sensitive changed source snapshot identifier:

## Post-Remediation Scan Configuration And Snapshot

- Fresh source-sharing approval:
- New per-scan cost choice: `no cap` | explicit USD cap
- Target:
- Include paths:
- Exclude paths:
- Scan mode:
- Effort:
- CLI version:
- Source revision:
- Non-sensitive source snapshot identifier:
- Coverage completeness:
- Configuration comparison: `comparable` | `mismatch` | `unverified`
- Snapshot comparison: `distinct-after-change` | `mismatch` | `unverified`

The post-remediation scan requires fresh source-sharing consent and a new cost choice. A configuration mismatch, unavailable comparison, or incomplete coverage cannot be treated as clean reconciliation.

## New-Untriaged Findings

| Post-scan finding reference | Severity | Confidence | Affected component/path | Triage state | Owner/next action |
| --- | --- | --- | --- | --- |
| | | | | `new-untriaged` | |

Every post-scan finding without a human-verified canonical-case mapping remains `new-untriaged` and is visible in the final gate.

## Reconciliation Gate

- Gate: `pass` | `pass-with-accepted-risk` | `fail`
- Case reconciliation summary:
- User-accepted residual risks (required for `pass-with-accepted-risk`):
- Unresolved evidence or mismatch:

`pass` requires every source case to be `fixed` or `not-applicable` with recorded evidence, no `new-untriaged` finding, comparable configuration, distinct snapshots after a source change, and complete coverage. `pass-with-accepted-risk` additionally requires explicit user acceptance for every unresolved residual risk. Record missing case evidence or an unavailable comparison as `unverified`; missing evidence, incomplete coverage, a mismatch, unaccepted residual risk, or any `new-untriaged` finding sets the final gate to `fail`.

## Protected-Artifact Boundary

This tracked report must not contain credentials, provider URLs, raw CLI logs, report Markdown, JSON, SARIF, raw scanner IDs, source excerpts, full finding text, or embedded original artifacts. Protected originals remain outside tracked reports in the verified ignored retention record or another user-controlled protected location. Automated checks validate this template's shape only; they do not prove that a populated report is complete or that a finding is fixed.
