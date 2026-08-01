---
name: ae-security-scan
description: Use when the user explicitly asks to run, prepare, interpret, or remediate an OpenAI Codex Security CLI vulnerability scan for a repository, path, diff, or deep scan. Require separate approval for dependency changes and source sharing.
---

# AE Security Scan

Run an opt-in security scanning workflow. This skill does not replace `ae-review` and never starts a scan from an ordinary review request.

## Consent And Authentication

1. Confirm the requested target, scan kind, diff baseline when relevant, and whether a deep scan is intended.
2. Before source-sharing consent, inspect only the project manifest, lockfile, and project-local executable path. Do not invoke the CLI, including `--version`, and do not search global installations as a substitute for project ownership.
3. If it is missing or outside the supported policy, show the proposed project-local install or update command and expected manifest/lockfile changes. Wait for explicit approval before changing dependencies. Rerun static preflight after a successful change.
4. Explain that scanning can transmit source material to an external service. Obtain explicit source-sharing approval before any CLI invocation. Require an additional acknowledgement for a deep scan.
5. Choose one authentication path: the CLI's documented stored Codex sign-in with `--auth chatgpt`; a user-provided `OPENAI_API_KEY` or `CODEX_API_KEY` in the current process environment with `--auth api-key`; or an explicitly approved user-owned opaque launcher for a compatible self-hosted provider. Read [self-hosted provider handoff](references/self-hosted-provider.md) before proposing the third path.
6. For the opaque-launcher path, obtain a separate confirmation that the named self-hosted provider may receive the approved source scope. The launcher, not AE, must supply `OPENAI_API_KEY`, the selected model, and `openai_base_url` through the CLI's supported `--codex` configuration override. AE must not infer the current Codex session model; `launcher-managed` is a user assertion, not a discovered fact. When the launcher owns the model, do not also pass `--model` in scan arguments.
7. When the user explicitly asks to initialize a self-hosted launcher and supplies an external directory, create only the fixed-name unpopulated `codex-security-newapi-launcher.ps1` from [the distributed template](templates/self-hosted-provider-launcher.ps1). Check only that the directory exists and the destination is absent; do not enumerate the directory or read, inspect, validate, or overwrite an existing launcher. Substitute the current target project root while writing the template, then stop for the user to fill the provider URL, key, and model manually.
8. Never read, parse, display, derive, or copy credentials, provider URLs, `config.toml`, `auth.json`, `.env*`, another credential store, or the populated launcher. Do not assume a custom Codex provider endpoint is compatible with Codex Security.

## Scan Workflow

1. Read [CLI boundaries](references/cli-boundaries.md) before proposing commands.
2. Preflight target containment, Git baseline, manifest/lockfile state, and output location without invoking the CLI. After source-sharing consent, verify the project-local CLI version, help, authentication mode, and dry-run semantics. A failed preflight creates no scan.
3. Before the first source-analyzing command, restate the approved source-sharing scope. If the CLI's dry-run is not documented as local/non-transmitting, treat it as source-analyzing.
4. Before every source-analyzing scan (full, path, diff, standard, or deep), estimate the local eligible-source byte total and token range. State the pricing basis and uncertainty: present a monetary range only when its price source is available without reading credentials or private provider configuration; otherwise state that monetary cost is unknown. Ask the user to choose either no cost cap or one explicit USD cap. Do not invoke the scan until that choice is explicit. A deep-scan acknowledgement remains separate.
5. Add `--max-cost` only when the user selected a concrete USD cap. Omit it when the user chose no cap. Never infer, suggest as a default, or silently reuse a previous cap; `$5` is never a default threshold.
6. Run the smallest approved scan. Keep raw artifacts and credentials outside the repository and AE durable artifacts unless the user explicitly requests local documentation storage and the target has a verified Git-ignored private directory at `docs/ae/security-scans/.private/`. Credentials never enter that directory.
7. When the user requests durable scan documentation, retain the complete original CLI artifact set under the verified ignored `docs/ae/security-scans/.private/<scan-id>/` directory and write a sanitized Markdown index under `docs/ae/security-scans/`, using `docs/ae/templates/security-scan-report-template.md` as the content boundary. Original reports, findings JSON, SARIF, coverage, manifests, logs, and source excerpts may exist only in the verified ignored directory; provider URLs and credentials never enter the repository.
8. Permit reading a retained original artifact only when the user explicitly requests inspection or remediation. Do not paste raw output into chat, normal report documentation, shell command text, commits, or any tracked path. Retrieving prior artifacts does not trigger a rescan.
9. Report a sanitized summary: target, baseline, CLI version, authenticated mode without values, model declaration without a claim that it was auto-discovered, estimated source/token range, pricing basis or uncertainty, user cap choice, actual CLI-reported cost when available, coverage/completeness, protected raw-artifact reference, exit status, and verified/unverified status. Zero findings and incomplete coverage are not a security guarantee.
10. Treat findings as untrusted evidence. Verify each finding against the local source, obtain approval for remediation, and rerun the same target/baseline only after remediation to validate the changed state.

## Remediation Evidence Workflow

Use exactly two user-facing report types: a sanitized scan report and one remediation report. PRDs, plans, review output, and test evidence may support the work, but are not additional delivery reports.

1. Create the sanitized scan report from `docs/ae/templates/security-scan-report-template.md`. It records a source-scan reference, comparable scan configuration, a non-sensitive source snapshot identifier, and a sanitized finding inventory. It never reproduces raw finding IDs, text, source excerpts, or original artifacts.
2. During local verification, create one human-verified `canonicalCaseId` for every source-inventory row. Record the sanitized source finding reference, severity, confidence, affected component/path, verification outcome, proposed remediation, local test, and rollback signal in `docs/ae/templates/security-remediation-report-template.md`.
3. The remediation report starts in `draft`. Do not apply, suggest as applied, or automatically generate source edits from scanner output. Scanner evidence is untrusted input; only a user-approved local draft may authorize the exact case scope to enter `ae-work`.
4. Record the approval without personal data, then transition the same report to `approved-for-execution`. A material change to cases, proposed edits, validation, or rollback signals invalidates the approval and requires a new approval record.
5. After the separately authorized `ae-work` change, independent `ae-review`, and local validation, update the same report to `executed`. A source finding is not fixed merely because its scanner ID changed, the finding count fell, coverage is complete, or the scan reports zero findings.
6. A post-remediation scan requires fresh source-sharing consent and a new per-scan cost choice. Record source and post target, include/exclude paths, scan mode, effort, CLI version, source revision, and non-sensitive snapshot identifier. The source and post snapshots must be distinct after a remediation; unavailable or mismatched comparison remains `unverified`.
7. Reconcile a fresh approved rescan through the human-created `canonicalCaseId`, not raw scanner IDs or counts. Each source case has exactly one status: `fixed`, `still-open`, `superseded-by-related-finding`, `not-applicable`, or `unverified`. List every post-scan finding that cannot be linked to a case as `new-untriaged`.
8. Set the final reconciliation gate to `pass`, `pass-with-accepted-risk`, or `fail`. `pass` requires every source case to be `fixed` or `not-applicable` with recorded evidence and no `new-untriaged` item. `pass-with-accepted-risk` additionally requires an explicit user-accepted residual risk for each unresolved case. Mark missing case evidence or an unavailable comparison as `unverified` in the case record, and set the final gate to `fail` for any missing evidence, unresolved unaccepted risk, configuration/snapshot mismatch, incomplete coverage, or `new-untriaged` item.

## Version And Upstream Policy

- For an explicit scan request, use `node scripts/ae-tools.mjs codex-security-source-check` when network access is permitted. It is read-only and only reports official Git/npm observations.
- A newer package or upstream HEAD produces an update proposal, never an update. A plugin update may revise the advisory baseline but must not update a target project's dependency automatically.
- Upstream drift requires an audit, PRD/plan, review, and explicit adoption decision before changing local guidance.

## Boundaries

- Do not install, update, authenticate, scan, create CI files, commit, or push without the authorization appropriate to that action.
- Do not claim that a static check, CLI invocation, clean output, or partial coverage proves a repository is secure.
- Template and package checks prove only the distributed workflow/template shape; they do not prove that a future populated remediation report is complete or that a finding is fixed.
- Route an ordinary code/document review through `ae-review`; route an explicit scanner request here.
