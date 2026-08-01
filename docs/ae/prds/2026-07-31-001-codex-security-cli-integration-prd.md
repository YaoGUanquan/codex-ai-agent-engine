---
type: prd
status: drafted
date: 2026-07-31
topic: codex-security-cli-integration
format: human-readable-requirements
sharded: false
---

# Codex Security CLI Integration

## AI Parse Contract

- canonicalKind: requirements
- humanEquivalent: true
- stableIdsRequired: true
- noImplicitScope: true

## Problem Frame

Introduce an opt-in, Codex-native workflow for users who explicitly request an OpenAI Codex Security CLI scan, while preserving the existing lightweight AE review path and preventing automatic import of external behavior.

## Requirements

- R1. Offer a dedicated `ae-security-scan` workflow for explicit repository, path, diff, and deep scan requests.
  Acceptance: Ordinary `ae-review` requests remain scanner-free, and explicit scan requests have a defined routing path.
- R2. Obtain explicit source-sharing scope confirmation before scanning and an additional acknowledgement before deep scans.
  Acceptance: Missing consent prevents CLI invocation.
- R3. On an explicit scan request, preflight the project-local CLI, runtime, target, diff baseline, output/state location, and dry-run before scanning.
  Acceptance: Failed preflight provides a bounded diagnostic and creates no scan.
- R3a. When the CLI is absent, propose a project-local installation with the expected package manifest and lockfile changes and wait for explicit authorization.
  Acceptance: Installation never starts without approval, and success is verified by the project-local executable and version.
- R3b. Authenticate through the CLI's documented stored Codex sign-in, a user-supplied `OPENAI_API_KEY`/`CODEX_API_KEY` process environment, or an explicitly approved user-owned opaque launcher for a compatible self-hosted provider.
  Acceptance: The skill never reads, parses, displays, derives, or copies credentials, provider URLs, Codex `config.toml`, `auth.json`, `.env*`, or a populated launcher; it records the launcher-managed model only as a user assertion.
- R3c. When a user supplies an existing external launcher directory rather than a launcher file, initialize a new unpopulated self-hosted-provider launcher from the distributed template and let the user fill its provider URL, key, and model.
  Acceptance: The skill checks only that the supplied path is a directory and that the deterministic `codex-security-newapi-launcher.ps1` destination does not exist; it does not enumerate, read, inspect, validate, or overwrite directory contents. The generated template contains no real provider value or credential and is treated as opaque once the user edits it.
- R3d. Before every source-analyzing scan, including full, scoped-path, Git-diff, standard, and deep scans, estimate the target's local source size and token range, state any provider-pricing uncertainty, and ask the user to choose either no cost cap or an explicit USD cap.
  Acceptance: The scan command omits `--max-cost` when the user chooses no cap and includes it only at the user-selected amount; `$5` is never a default or inferred threshold. A deep-scan acknowledgement remains separate.
- R4. Produce a sanitized scan evidence summary with target, baseline, CLI version, coverage, artifact locations, exit status, and verified/unverified status; when requested, retain it under `docs/ae/security-scans/`.
  Acceptance: Incomplete coverage and zero findings never become a security guarantee; the summary is a sanitized index and raw outputs enter `docs/ae/security-scans/.private/` only after explicit approval, a user-approved ignore-rule change when needed, and `git check-ignore` verification.
- R4a. Retain complete original CLI artifacts in the approved `.private/<scan-id>/` directory so a user can inspect or remediate prior findings without rerunning the scan.
  Acceptance: Original report Markdown, findings JSON, SARIF, coverage, and manifests remain available only in the verified ignored directory; AE reads them only when the user explicitly requests inspection or remediation, and never pastes them into chat, normal documentation, commands, commits, or tracked paths.
- R5. Require source-level finding validation and a same-target rescan after approved remediation.
  Acceptance: Scanner output is treated as untrusted review input until locally verified; artifact retrieval does not trigger a rescan, which is required only to validate the post-remediation state.
- R6. Provide a CI reference that starts report-only and makes a severity gate an explicit repository-owner choice.
  Acceptance: The reference isolates credentials and artifacts from the checkout and explains incomplete-coverage behavior.
- R7. On an explicit scan request, compare the project-local installed CLI against supported/recommended version policy and current npm metadata when available.
  Acceptance: An older or unavailable version produces an update proposal with expected manifest/lockfile changes, not an update.
- R8. Apply a project-local CLI update only after explicit authorization and rerun preflight before scanning.
  Acceptance: A failed update cannot be presented as an available scanner.
- R9. Track official repository HEAD and npm metadata through a read-only deterministic check and require reviewed adoption for changes to local skill guidance or policy.
  Acceptance: No check automatically changes skills, dependencies, CI, or metadata.

## Non-Functional Requirements

- NFR1. Preserve the GPL-2.0-only distribution boundary by writing original local guidance and never vendoring Apache-2.0 source or plugin text.
  Acceptance: Source provenance is retained as metadata only.
- NFR2. Keep credentials outside the repository and raw scan artifacts out of tracked documentation.
  Acceptance: Sanitized outcome evidence is an index in `docs/ae/security-scans/`; explicit user-authorized raw retention is unredacted and limited to the Git-ignored `docs/ae/security-scans/.private/` directory after ignore verification. The external launcher template contains placeholders only. AE never deliberately copies credentials or provider URLs into the template or private artifact directory, echoes raw output, or treats either as a secret manager.
- NFR3. Keep the CLI optional.
  Acceptance: Users without the CLI or authentication receive a preflight result and may receive an explicit installation proposal, but never an implicit installation or failure claim.
- NFR4. Support self-hosted providers only through a user-owned opaque launcher and explicit source-sharing consent for that named provider.
  Acceptance: AE never extracts current Codex configuration or attempts to auto-discover the active session model; compatibility requires a successful non-sensitive Canary with complete coverage.

## Success Criteria

- Security scans are explicit, bounded, auditable, and usable without weakening existing review behavior.
- Upstream changes are visible but cannot silently change local behavior.

## Scope Boundary

### In Scope

- New skill and original references, opaque self-hosted provider handoff with a directory-initialized launcher template, sanitized-report template, review handoff, read-only source checker, tests, catalog metadata, and distribution-version synchronization.

### Out Of Scope

- Automatic scans, automatic dependency installation/update, automatic upstream sync, automatic remediation, and creating a CI workflow in another repository.

### Constraints

- Evidence source: `https://github.com/openai/codex-security`, observed HEAD `8f4348ea8b7d8d5c05417400b519a72cce24f0fd` on 2026-07-31.
- The external package is an external service and its current scan results require user-provided authentication and consent.

## Validation Evidence

| Requirement | Applicable tier | Expected signal | Status |
| --- | --- | --- | --- |
| R1, R4, R4a, R7, R9 | Static inspection and focused automated test | Skill routing, original artifact retrieval without rescanning, source-check parsing, and no-write behavior are checked. | unverified until implementation |
| R2, R3, R3a, R3b, R3c, R3d, R4, R4a, R8, NFR2, NFR3, NFR4 | Focused automated test | Consent, explicit cost-estimate/cap-choice policy, opaque-launcher directory bootstrap, ignored-unredacted artifact retention, model declaration, install/update preview, and failed-preflight branches prevent invocation and omit sensitive values. | unverified until implementation |
| R6 | Integration/build | Template and checker pass plugin mirror, catalog, and package checks. | unverified until implementation |
| R3-R5 | Authenticated external-service smoke | User-authorized dry-run and scan prove actual CLI behavior. | unverified; credentials and source-sharing consent required |
| R6 | Deployment/operations | Repository owner runs a CI workflow with controlled secret and observes report-only result. | unverified; no target repository authorized |

## Key Decisions

- D1. Use a separate `ae-security-scan` skill with a narrow review handoff.
  Reason: It isolates an external, potentially costly security-scan operation from normal code review.
- D2. Use monitoring plus proposal, not synchronization.
  Reason: Upstream package/version movement, license terms, and runtime behavior need human review before local adoption.
- D3. Use a user-approved project-local development dependency when installation or update is needed.
  Reason: Project manifests record the change and the user controls both installation and upgrade timing.
- D4. Keep stored Codex login and API-key process environment paths, and add an opaque self-hosted provider launcher path; do not extract Codex configuration secrets.
  Reason: A launcher can use a user-managed New API configuration without exposing it to AE or claiming that the active desktop-session model was discovered.
- D5. Retain complete original artifacts in a user-authorized Git-ignored `.private/` documentation directory, with a sanitized summary as the index.
  Reason: It permits local inspection and remediation of historical scan evidence without rerunning a scan or placing sensitive output in the Git index.
- D6. Treat a supplied launcher path as a directory bootstrap request when it names an existing directory, and create the fixed-name empty template only when it does not already exist.
  Reason: It gives users a concrete local configuration surface without probing or overwriting their private launcher files.
- D7. Make cost estimation and the cap choice an explicit pre-scan decision for every source scan.
  Reason: A static default cap can prematurely stop a repository scan and hides the user-owned cost tradeoff.

## Dependencies And Assumptions

### Dependencies

- The scan depends on a user-approved project-local `@openai/codex-security` installation and permitted authentication.
- CI details depend on the target repository and its secret-management policy.
- A compatible self-hosted Provider depends on a user-managed launcher, explicit source-sharing consent, and a successful non-sensitive Canary; it is not inferred from Codex configuration.

### Assumptions

- The existing mirror, language metadata, install smoke, and capability-catalog mechanisms remain the correct distribution path for a new skill.

## Open Questions

### Deferred To Planning

- Q1. [Affects R7][technical] Select the smallest tested home for the external-source check.
- Q2. [Affects R6][product] Decide whether GitHub Actions is the only initial CI reference when a target repository is known.

## Evidence Notes

- Official source/package evidence -> `git ls-remote https://github.com/openai/codex-security.git HEAD`; `npm view @openai/codex-security version license --json`.
- Local distribution constraints -> `AGENTS.md`, `docs/ae/constitution.md`, `package.json`, and `plugins/ai-agent-engine-codex/.codex-plugin/plugin.json`.

## Consistency Check

- requirementsCount: 14
- nonFunctionalRequirementsCount: 4
- decisionsCount: 7
- openQuestionsCount: 2
