# Security Scan Summary

## Scope

- Source-scan reference:
- Target:
- Scan kind:
- Git baseline:
- Source-sharing approval:
- Source revision:
- Non-sensitive source snapshot identifier:

## Comparable Scan Configuration

- Include paths:
- Exclude paths:
- Scan mode:
- Effort:
- CLI version:

## Execution

- Local eligible-source estimate:
- Token estimate range:
- Pricing basis or uncertainty:
- User cost choice: `no cap` | explicit USD cap
- CLI-reported estimated/actual cost: unavailable | value (not self-hosted provider billing unless independently confirmed)
- Authentication mode: `chatgpt` | `api-key` | `self-hosted-provider`
- Provider label: omit for OpenAI; never include a URL.
- Model declaration: explicit model ID | `launcher-managed`
- Exit status:
- Coverage completeness:
- Original raw artifacts: verified ignored `docs/ae/security-scans/.private/<scan-id>/` retention record or protected-storage reference; never a tracked repository path.
- Artifact retrieval: retained artifacts can be inspected for a user-requested remediation without a rescan; rescan only after remediation validates the changed state.

## Sanitized Finding Inventory

| Source finding reference | Severity | Confidence | Affected component/path | Local verification | Canonical case reference | Remediation state |
| --- | --- | --- | --- | --- | --- | --- |
| | | | | `verified` | assigned in remediation report | `untriaged` |

Do not place raw scanner IDs or full finding titles/text in this table. The human-created canonical case reference belongs to the remediation report and is not inferred from scanner identifiers.

## Evidence Boundary

This file is a sanitized index to the original local artifact set. It must not contain API keys, provider URLs, raw CLI logs, report Markdown, JSON, SARIF, source excerpts, full finding text, or embedded raw artifacts; raw scanner IDs are also forbidden. A zero-finding or incomplete scan is not a security guarantee.

For local original unredacted artifact retention, the target project's `.gitignore` must explicitly ignore `docs/ae/security-scans/.private/`; the plugin does not add that rule automatically. The private directory is local project memory, not a credential store or shared backup.
