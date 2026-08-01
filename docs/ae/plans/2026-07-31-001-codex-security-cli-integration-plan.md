---
type: plan
status: drafted
date: 2026-07-31
title: codex-security-cli-integration
origin: docs/ae/prds/2026-07-31-001-codex-security-cli-integration-prd.md
originFingerprint: 2026-07-31-codex-security-cli-integration
depth: standard
format: human-readable-plan
sharded: false
---

# Codex Security CLI Integration Plan

## AI Parse Contract

- canonicalKind: plan
- humanEquivalent: true
- stableIdsRequired: true
- noImplicitScope: true

## Decision Record

- Decision: Add an opt-in `ae-security-scan` skill plus a read-only upstream source check; retain approved original artifacts in a Git-ignored local directory with a sanitized index; install or update a project-local CLI only after explicit approval; add a user-owned opaque launcher path with directory-based blank-template initialization for self-hosted Providers; require an explicit cost estimate and user-owned cap choice before every source scan; add only a handoff rule to `ae-review`.
- Drivers: external-service consent, source/artifact privacy and later retrieval, compatible self-hosted provider use without secret extraction or overwrite, coverage integrity, transparent cost control, license compatibility, and upstream change visibility.
- Rejected alternatives: absorb scanning into `ae-review` (overbroad trigger and hidden cost); vendor the OpenAI plugin/SDK (GPL-2.0-only compatibility and runtime-boundary failure); automatic upstream synchronization (unsafe unreviewed mutation).
- Consequence: Users approve project manifest/lockfile changes when installation or update is needed; local skill guidance remains independent and testable without the CLI.

## High-Risk Pre-Mortem

1. A normal review unintentionally sends source code to OpenAI, or a scan request unexpectedly changes dependencies. Recovery: require an explicit `ae-security-scan` trigger, source-sharing consent, and a separate install/update confirmation before every state-changing command.
2. A partial scan with no findings is reported as secure. Recovery: make coverage status mandatory and classify incomplete coverage as `unverified`.
3. An upstream release silently changes behavior or imports incompatible text. Recovery: source-check only reports drift; audit, PRD/plan, review, and explicit authorization are required before adoption.
4. A self-hosted Provider handoff reads, overwrites, or records a private launcher, raw artifacts enter Git, or historic evidence requires an unnecessary rescan. Recovery: bootstrap only a new placeholder launcher in a user-supplied directory when the deterministic destination is absent, treat the edited launcher as opaque, retain original artifacts only in a `git check-ignore`-verified `docs/ae/security-scans/.private/<scan-id>/`, and use the sanitized summary as the tracked index.
5. A default cost cap stops a legitimate full-repository scan before coverage is complete. Recovery: estimate the source-size/token range before each scan, disclose pricing uncertainty, and pass `--max-cost` only when the user explicitly chooses a concrete limit.

## Implementation Units

### U1 - Define the local security-scan contract

- Covers: R1, R2, R3, R3a, R3b, R3c, R3d, R4, R4a, R5, R7, R8, NFR1, NFR2, NFR3, NFR4
- Depends on: none
- Ownership: Knowledge, Guardrail
- Files: `plugins/ai-agent-engine-codex/skills/ae-security-scan/SKILL.md`, `plugins/ai-agent-engine-codex/skills/ae-security-scan/references/cli-boundaries.md`, `plugins/ai-agent-engine-codex/skills/ae-security-scan/references/self-hosted-provider.md`, `plugins/ai-agent-engine-codex/skills/ae-security-scan/templates/self-hosted-provider-launcher.ps1`, matching `.agents/skills/ae-security-scan/**`
- Forbidden files: external source copies, `.env*`, `config.toml`, `auth.json`, populated launchers, credential files
- Work: Write original Codex-native scan routing, separate source-sharing, install/update, and cost-cap consent gates; estimate local source size/token range before every source-analyzing scan (full, path, diff, standard, or deep); project-local executable discovery, documented stored-login versus process-environment versus opaque-launcher selection, directory bootstrap of a non-secret launcher template without enumeration or overwrite, preflight, model-declaration boundary, result interpretation, remediation handoff, original unredacted artifact retention/retrieval, post-remediation-only rescan, local ignored-raw retention, and no-guarantee rules. Put detailed CLI/CI guidance in references.
- Validation: `node scripts/check-skill-mirror.mjs`; `node scripts/check-skill-contract.mjs`; focused assertions added in `tests/skill-scripts.test.mjs`; PowerShell parser check of the distributed template.
- Rollback signal: Any new default scan, implicit install/update, inferred/default `--max-cost`, config/credential or launcher parsing, launcher-directory enumeration, overwrite of an existing launcher, tracked raw artifact persistence, raw artifact echo/copy outside `.private`, missing ignore verification, or missing consent branch blocks release.

### U2 - Integrate with existing review and capability discovery

- Covers: R1, R4, R4a, R5
- Depends on: U1
- Ownership: Knowledge, Guardrail, Distribution
- Files: plugin and mirror `ae-review/SKILL.md`, plugin and mirror `ae-help/references/capability-catalog.json`, `tests/skill-scripts.test.mjs`
- Forbidden files: unrelated review personas and generic review behavior
- Work: Add a narrow routing rule: provided scan output is untrusted evidence that must be verified; an explicit scan request routes to `ae-security-scan`. Register the new skill in both catalogs.
- Validation: catalog-focused tests, mirror check, language-metadata check, install smoke.
- Rollback signal: Revert the handoff if ordinary review requests begin triggering scan setup.

### U3 - Add a read-only upstream-drift checker

- Covers: R9, NFR1
- Depends on: U1
- Ownership: Knowledge, Guardrail
- Files: smallest suitable `scripts/` command after source inspection, mirrored plugin script only if distribution requires it, tests, capability catalog command entry if user-facing
- Forbidden files: package dependencies, lockfiles, automated scheduler config, direct source copies
- Work: Query official Git HEAD and npm metadata, compare against declared compatibility baseline, emit structured observations and exit status; default to no writes. Document that a plugin update may revise this advisory baseline but detected drift opens an audit/adoption proposal rather than applying a change.
- Validation: mocked-command or fixture tests for unchanged, changed, and unavailable-network results; `node --check`; no-write assertion.
- Rollback signal: Any network result that changes local skill text, package version, or dependency state is a blocker.

### U4 - Add report-retention template, CI reference, and distribution metadata

- Covers: R6, NFR2, NFR3
- Depends on: U1, U2, U3
- Ownership: Knowledge, Guardrail, Distribution
- Files: `docs/ae/templates/security-scan-report-template.md`, `docs/ae/security-scans/README.md`, `.gitignore`, `ae-security-scan` references, both package manifests, skill language metadata, catalog, `README.md`/`README.zh-CN.md` only if capability lists require it
- Forbidden files: target-project CI workflows, secrets, populated launchers, raw scan result files
- Work: Provide a sanitized-report template that indexes an explicit Git-ignored `.private/<scan-id>/` original-artifact boundary. Define user-requested retrieval without a rescan and post-remediation-only rescan semantics. Provide report-only CI guidance that scopes credentials to the scan step and stores artifacts outside the checkout. Synchronize required source/mirror and distribution metadata; increment both plugin versions only because a distributable skill changes.
- Validation: `npm test`; `npm.cmd run check`; `git diff --check`; install smoke. Do not claim a CI scan passed without a user-authorized target-repository run.
- Rollback signal: Release is blocked if source/mirror/catalog/version metadata diverge, raw retention is trackable, or the documentation claims CI acceptance without a real run.

## Validation Matrix

| Acceptance criterion | Applicable tier | Expected signal | Status before implementation |
| --- | --- | --- | --- |
| Consent, routing, explicit cost estimate/cap choice, opaque launcher directory bootstrap, ignored original artifact retention/retrieval, install/update preview, no-write tracker | Static inspection and focused test | Tests demonstrate no CLI invocation or local mutation without explicit request and confirmation, no inferred cost cap, no configuration/launcher parsing, no overwrite of an existing launcher, retrieval without rescan, and no raw tracked output. | unverified |
| Skill distribution | Integration/build | Mirror, language metadata, install smoke, and package checks pass. | unverified |
| CLI preflight and scan semantics | Authenticated external-service smoke | User-authorized CLI dry-run and scan produce bounded artifacts and coverage. | unverified |
| CI reference | Deployment/operations | A target repository executes the report-only job using a controlled secret. | unverified |

## Handoff

- Do not begin U1 until the user authorizes the staged skill proposal and confirms the project-local install/update plus conservative monitoring model.
- Do not install `@openai/codex-security`, authenticate, scan source, create CI files, commit, or push as part of this plan.
