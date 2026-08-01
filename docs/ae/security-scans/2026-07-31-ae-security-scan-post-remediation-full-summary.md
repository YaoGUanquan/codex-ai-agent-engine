# Security Scan Summary

## Scope

- Target: current repository (`D:\codes\ph-AI-Agent-Engine`)
- Scan kind: full repository, standard mode, `--effort xhigh`
- Git baseline: `6b0fbda084dc5bc7f2ff9265750cc11f4d403a03` (full tree; no diff restriction)
- Source-sharing approval: explicitly authorized for New API

## Execution

- Local eligible-source estimate: approximately 2.62 MiB across 595 non-ignored text files
- Token estimate range: approximately 685,676-914,235 tokens
- Pricing basis or uncertainty: self-hosted New API pricing was not inferred locally; monetary estimate was unknown before execution
- User cost choice: `no cap`
- CLI-reported estimated/actual cost: `$15.8168465` (CLI-reported; not independently confirmed as provider billing)
- CLI version: `@openai/codex-security` `0.1.4`
- Authentication mode: `self-hosted-provider`
- Provider label: New API
- Model declaration: `gpt-5.6-terra`
- Exit status: `0`
- Elapsed time: 2621 seconds
- Reported tokens: 36,568,235 input; 34,713,856 cached; 166,829 output
- Coverage completeness: `complete`
- Original raw artifacts: protected storage reference `D:\privetadata\codex-security-artifacts\post-remediation-full-20260731-01`
- Artifact retrieval: retained artifacts can be inspected for a user-requested remediation without a rescan; rescan only after remediation validates the changed state.

## Sanitized Findings

- Finding count by severity: 5 total reported by CLI (1 high, 2 medium, 2 low)
- Verified local findings: not inspected in this rescan; finding identity and local applicability remain unverified
- Remediation status: **not proven complete**; the CLI still reports findings after the prior remediation
- Rescan status: coverage and process completion passed; remediation gate failed pending finding-by-finding verification

## Evidence Boundary

This file is a sanitized index to the original local artifact set. It must not contain API keys, provider URLs, raw CLI logs, report Markdown, JSON, SARIF, source excerpts, full finding text, or embedded raw artifacts. A zero-finding or incomplete scan is not a security guarantee.

The original artifacts are outside the repository in user-controlled protected storage. The private directory is local project memory, not a credential store or shared backup.
