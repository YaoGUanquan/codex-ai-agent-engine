# Security Scan Summary

## Scope

- Target: current repository (`D:\codes\ph-AI-Agent-Engine`)
- Scan kind: full repository, standard mode
- Git baseline: none (full tree; no diff restriction)
- Source-sharing approval: explicitly authorized for New API

## Execution

- Local eligible-source estimate: approximately 2.62 MiB across 595 non-ignored text files
- Token estimate range: approximately 685,676-914,235 tokens
- Pricing basis or uncertainty: self-hosted New API pricing was not inferred locally; monetary estimate was unknown before execution
- User cost choice: `no cap`
- CLI-reported estimated/actual cost: `$11.478532` (CLI-reported; not independently confirmed as provider billing)
- CLI version: `@openai/codex-security` `0.1.4`
- Authentication mode: `self-hosted-provider`
- Provider label: New API
- Model declaration: `gpt-5.6-terra`
- Exit status: `0`
- Coverage completeness: `complete`
- Original raw artifacts: protected storage reference `D:\privetadata\codex-security-artifacts\full-retry-20260731-01`
- Artifact retrieval: retained artifacts can be inspected for a user-requested remediation without a rescan; rescan only after remediation validates the changed state.

## Sanitized Findings

- Finding count by severity: 3 total reported by CLI (1 medium, 2 low)
- Verified local findings: none yet; raw findings were not opened in this run
- Remediation status: implemented for all three reported findings; local verification passed
- Rescan status: post-remediation rescan completed with complete coverage; the CLI still reported 5 findings, so remediation is not proven complete. See `2026-07-31-ae-security-scan-post-remediation-full-summary.md`.

## Evidence Boundary

This file is a sanitized index to the original local artifact set. It must not contain API keys, provider URLs, raw CLI logs, report Markdown, JSON, SARIF, source excerpts, full finding text, or embedded raw artifacts. A zero-finding or incomplete scan is not a security guarantee.

The original artifacts are outside the repository in user-controlled protected storage. The private directory is local project memory, not a credential store or shared backup.
