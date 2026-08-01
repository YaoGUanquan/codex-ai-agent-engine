---
type: plan
status: drafted
date: 2026-08-01
title: security-scan-remediation-evidence
origin: docs/ae/prds/2026-08-01-001-security-scan-remediation-evidence-prd.md
originFingerprint: 2026-08-01-security-scan-remediation-evidence
depth: deep
format: human-readable-plan
sharded: false
---

# Plan: Security Scan Remediation Evidence

## Source

- `docs/ae/prds/2026-08-01-001-security-scan-remediation-evidence-prd.md`
- `docs/ae/brainstorms/2026-08-01-security-scan-remediation-evidence-requirements.md`

## AI Parse Contract

- canonicalKind: plan
- humanEquivalent: true
- stableIdsRequired: true
- noImplicitScope: true

## Scope

Extend the distributed `ae-security-scan` workflow with a finding-case ledger, a local draft remediation-report approval route, post-remediation reconciliation gate, and sanitized report templates. Preserve the current scanner consent, cost, raw-artifact, source/mirror, and package-distribution boundaries. This plan does not remediate the five currently reported source findings or initiate another scan.

## Readiness

- Goal: make the two delivery reports sufficient to explain each finding's disposition, show a user-approved repair scope before execution, and avoid unsafe count-based conclusions.
- Acceptance criteria: R1-R7 and NFR1-NFR3 from the source PRD.
- Non-goals: automatic fixes, a rescan, CI automation, changes to scanner/provider behavior, or changes to the current application findings.
- Affected areas: distributed skill source/mirror, report templates, scan-record documentation, focused tests, install smoke, package metadata, and lockfile.
- Validation surface: source inspection, focused Node tests, source/mirror and skill-contract checks, AE artifact check, package check, and disposable-target install smoke.
- Open questions: none. The user selected one report lifecycle with a manual draft-approval gate; template tests prove contract shape only.

## Validation Evidence

| Tier | Expected signal | Preconditions / owner | Status | Bounded claim |
| --- | --- | --- | --- | --- |
| Static | Source and mirror contain the same lifecycle, canonical-case, authorization, snapshot, status, and protected-artifact rules. | Implementation worktree / implementer | planned | The guidance expresses the intended policy. |
| Focused automated test | Required template sections and allowed statuses are asserted; mirror/contract checks pass. | Node dependencies / implementer | planned | Distributed files retain the tested contract, not a future populated report's completeness. |
| Package/install | Package checks and disposable install smoke pass with both templates present. | Node toolchain / implementer | planned | The package is internally coherent and installs its templates. |
| User approval | User reviews one populated local draft remediation report and approves its exact scope. | User / future remediation task | unverified | Only the approved cases and planned changes may enter `ae-work`. |
| External service | A future approved scan compares original and new inventories after a source change. | Fresh user consent and cost decision / user | unverified | Only the selected scan outcome and coverage, not repository-wide security. |

## Contract Value Classification

- Canonical protected values: unredacted CLI finding IDs, full text, source excerpts, SARIF, JSON, logs, credentials, and provider configuration remain outside tracked reports.
- Derived tracked values: source-scan finding reference, `canonicalCaseId`, severity, confidence, affected component/path, verification state, remediation disposition, scan configuration fingerprint, non-sensitive snapshot identifier, and evidence references.
- Caller-controlled input: scan scope, output directory, source-sharing consent, cost choice, remediation authorization, and accepted residual risk.
- Source precedence: the protected original artifact supports inspection; local source verification creates the `canonicalCaseId`; user approval authorizes the exact draft scope; code review decides code quality; a later authorized scan contributes post-scan evidence to the same case.
- Trust boundary: scanner output and raw artifact text are untrusted input and never become instructions or automatic code changes.

## Assumptions

- Existing installer behavior copies `docs/ae/templates` into an installed target; this must be confirmed before implementation and covered by smoke tests.
- A source-scan finding reference can be represented without reproducing protected raw content. `canonicalCaseId` is assigned by local human verification rather than inferred automatically.
- A report lifecycle plus user approval is sufficient for the first release; no new CLI command or automatic report parser is needed.

## Alternatives Considered

- Recommended: extend the existing skill and templates with a documented case ledger, one draft-to-final remediation-report lifecycle, and explicit user approval.
- Alternative: build a local report parser and status validator now.
- Rejected because: user review of the local draft is the selected execution gate; a parser would add an executable contract and input-sanitization surface without replacing that authorization decision.
- Alternative: make the scanner apply proposed fixes automatically.
- Rejected because: the scanner output is untrusted and remediation requires authorization, source verification, and product/security judgment.

## Decision Drivers

- Preserve the explicit consent and source-sharing boundary.
- Prevent false "fixed" claims when scans report different sets of findings.
- Keep the first change small, installable, and testable using current repository mechanisms.

## Decisions

### ADR-1 - Use human-verified canonical cases

- Decision: record a sanitized source-scan finding reference, then create a human-verified `canonicalCaseId` during local verification and reconcile source and post-scan references against that case.
- Drivers: non-overlapping completed scan results; count-based claims are unsound.
- Alternatives: counts only, raw-report inclusion, automatic ID matching, or a new parser.
- Why chosen: scanner IDs may vary across scans; human verification preserves traceability without publishing protected material or inventing equivalence.
- Consequences: operators must create and approve a local case mapping before any repair claim.
- Follow-ups: consider a non-scanning validator only after real approved reports show recurring structural errors.

### ADR-2 - Use one remediation report as the draft approval gate

- Decision: create the remediation report locally in `draft`, require user approval of its cases, changes, tests, and rollback signals, then transition that same report through execution and reconciliation.
- Drivers: untrusted scanner output, explicit user control, concise two-report delivery, review integrity.
- Alternatives: template-only automated gate, a separate manual report, scanner-driven edits, or a separate remediation skill.
- Why chosen: it combines readable local review with an explicit authorization record without introducing automatic mutation.
- Consequences: a user must approve the exact draft scope; material scope changes invalidate approval and require a new approval record.
- Follow-ups: none for this release.

### ADR-3 - Compare configuration while recording changed snapshots

- Decision: require the same target selection, include/exclude paths, scan mode, effort, and CLI version where possible, while recording distinct before/after revisions and non-sensitive snapshot identifiers.
- Drivers: valid comparison after source changes, scan reproducibility, honest evidence boundaries.
- Alternatives: require identical Git baseline, compare only finding counts, or omit snapshot data.
- Why chosen: remediation necessarily changes source; identical baseline is not the correct post-remediation invariant.
- Consequences: configuration drift or unavailable snapshot comparison yields `unverified`, not a clean result.
- Follow-ups: document report naming and lifecycle in the scan-record README.

## Risks

- A template author could treat a missing post-scan identity as fixed. The case mapping, user-approved draft, and unmatched-new-findings section must prohibit this.
- A scanner ID could change or collide across scans. The template must record source/post references separately and bind them only through human-created `canonicalCaseId`.
- New templates may not be copied into target projects. Install smoke must assert their presence.
- A later scan may have different scanner heuristics or coverage despite a valid fix. The report must record scope, completeness, and unmatched findings rather than infer equivalence.

## Pre-Mortem

- Failure scenario 1: a repair report declares success because the total count fell. Mitigation: require one source-inventory row per canonical case, separate new-untriaged findings, and explicit `pass`, `pass-with-accepted-risk`, or `fail` gate rules.
- Failure scenario 2: a raw finding excerpt or provider detail leaks into a tracked report. Mitigation: explicitly list forbidden content in both templates and test the required prohibition text.
- Failure scenario 3: an agent treats scanner text as a command and edits source before approval. Mitigation: require a user-approved local draft report before `ae-work`, state the untrusted-input boundary in source and mirror, then test the contract phrase.

## Global Constraints

- Preserve all unrelated dirty worktree changes and untracked security-scan artifacts.
- Do not invoke the scanner, inspect credentials or populated launchers, or copy raw artifacts into tracked files.
- Do not add a parser, dependency, CI workflow, or automatic remediation path in this change.
- Any distributable plugin-content update must increment matching root/package-plugin SemVer versions and update `package-lock.json` through the normal package manager path.

## Implementation Units

### U1 - Define scan-to-remediation evidence workflow

- Goal: make the draft-report approval handoff, canonical-case reconciliation, and comparable-rescan gate explicit in source and mirror skill guidance.
- Requirements covered: R1, R2, R3, R4, R5, R6, NFR1, NFR2.
- Acceptance criteria covered: all source references become approved canonical cases before execution; no automatic repair; rescan requires fresh consent/cost decision and records distinct snapshots.
- Depends on: none.
- Files: `plugins/ai-agent-engine-codex/skills/ae-security-scan/SKILL.md`, `plugins/ai-agent-engine-codex/skills/ae-security-scan/references/cli-boundaries.md`, matching `.agents/skills/ae-security-scan/SKILL.md`, matching `.agents/skills/ae-security-scan/references/cli-boundaries.md`.
- Forbidden files: populated launchers, `.env*`, credential stores, raw scan artifacts, source application files.
- Approach: add one remediation-report lifecycle: `draft` case mapping and proposed changes, user approval, `ae-work`, `ae-review`, validation, fresh approved rescan, and `reconciled` case evidence. Define source/post scan reference fields, configuration/snapshot comparison, allowed dispositions, unmatched-new findings, and final gate states. Preserve current consent and raw-artifact language.
- Tests: extend source/mirror contract assertions for lifecycle vocabulary, canonical-case fields, explicit user approval, no automatic mutation, fresh rescan consent/cost choice, snapshot comparison, and count-only prohibition.
- Validation: `node scripts/check-skill-mirror.mjs`; `node scripts/check-skill-contract.mjs`; focused `node --test tests/skill-scripts.test.mjs`.
- Rollback signals: any wording that permits automatic source edits, raw report inclusion, consent reuse, draft execution without user approval, or a fixed claim without canonical-case evidence blocks delivery.
- Deferred to implementation: choose exact bilingual wording for the user approval record without including personal data.

### U2 - Add the two-report output contracts

- Goal: make the scan report inventory and one draft-to-final remediation report deterministic, sanitized, and concise.
- Requirements covered: R1, R2, R4, R5, R6, NFR1.
- Acceptance criteria covered: each source finding becomes one canonical case; the draft requires user approval before execution; new and unmatched findings cannot be hidden; templates prohibit raw content.
- Depends on: U1.
- Files: `docs/ae/templates/security-scan-report-template.md`, new `docs/ae/templates/security-remediation-report-template.md`, `docs/ae/security-scans/README.md`.
- Forbidden files: existing historical scan summaries, `docs/ae/security-scans/.private/**`, provider/credential files.
- Approach: extend the scan template with source-scan reference, configuration fingerprint, non-sensitive snapshot identifier, and inventory fields. Create a remediation template with lifecycle state, explicit user approval record, source/post finding references, canonical-case mapping, proposed changes/tests/rollback, unmatched-new-findings section, validation evidence, final gate, and residual-risk section. Explain that it is the same report before and after execution, preserving two report types.
- Tests: assert both templates have lifecycle, approval, canonical-case, snapshot, allowed-disposition, protected-artifact, reconciliation, and gate fields; assert the README documents the two-report lifecycle.
- Validation: focused tests plus `node scripts/check-ae-artifacts.mjs`.
- Rollback signals: a template permits raw artifacts in tracked files, execution without approval, raw-ID matching as a fixed claim, omits an unresolved status, or has no unmatched-new-findings field.
- Deferred to implementation: decide whether a concise security finding title may be retained as sanitized data; default to component/path rather than title if uncertain.

### U3 - Extend distributed artifact checks and install smoke

- Goal: prove that the new contract ships intact and installs into a disposable target.
- Requirements covered: R7, NFR3.
- Acceptance criteria covered: source/mirror, contract, metadata, artifact, package, and install smoke recognize the remediation template.
- Depends on: U1, U2.
- Files: `tests/skill-scripts.test.mjs`, `scripts/check-install-smoke.mjs`, and only any directly required metadata/template copy list discovered during implementation.
- Forbidden files: scanner dependency manifests, external launcher templates, source application findings.
- Approach: add focused assertions for required workflow phrases and template sections. Extend install smoke to confirm the remediation template is installed and remains sanitized. Tests explicitly state that they validate template shape, while a future user approval validates a populated draft report; do not add executable report parsing.
- Tests: `npm.cmd test`; `npm.cmd run check`; `node scripts/check-install-smoke.mjs`.
- Validation: inspect disposable install output for both report templates and verify existing skill discovery remains unchanged.
- Rollback signals: an installed target lacks either template, source/mirror contract diverges, or an existing scan/launcher assertion regresses.
- Deferred to implementation: no external-service test is required; external scan behavior remains unverified.

### U4 - Synchronize release metadata and delivery documentation

- Goal: ship the contract as a coherent plugin patch release.
- Requirements covered: R7, NFR3.
- Acceptance criteria covered: root and plugin manifest versions match and package lock state is correct.
- Depends on: U3.
- Files: `package.json`, `package-lock.json`, `plugins/ai-agent-engine-codex/.codex-plugin/plugin.json`, and only release/discoverability documentation that materially describes the new remediation-report capability.
- Forbidden files: unrelated skills, external upstream code, raw scan artifacts.
- Approach: increment the patch SemVer in both required manifests after distributable content is complete; update the lockfile with the repository package manager only if package metadata changes it; document the feature only where existing security-scan discovery needs the new user-facing behavior.
- Tests: existing version-synchronization test and full package checks.
- Validation: `npm.cmd test`; `npm.cmd run check`; `node scripts/check-install-smoke.mjs`; inspect `git diff --check` and changed-file inventory.
- Rollback signals: version mismatch, lockfile drift unrelated to the package manifest, or unrelated documentation churn.
- Deferred to implementation: exact patch number is read from the current matching manifests immediately before editing.

## Consistency Check

- implementationUnitCount: 4
- sourceRequirementsCovered: R1, R2, R3, R4, R5, R6, R7, NFR1, NFR2, NFR3
- sourceRequirementsDeferred: none
- openQuestionsCount: 0

## Validation Plan

- Unit: contract assertions for lifecycle, draft approval, canonical-case mapping, before/after snapshot fields, allowed dispositions, fresh rescan consent, and protected-artifact exclusions.
- Integration: source/mirror, skill contract, language metadata, AE artifact, and package checks.
- User flow: disposable install contains both templates; simulated workflow language demonstrates scan report, locally reviewed draft remediation report, explicit approval, then authorized remediation without invoking a scanner.
- Data / operations: no raw artifact, credential, provider, or launcher content enters tracked files; no scanner run occurs.
- Observability: final remediation report has a `pass`, `pass-with-accepted-risk`, or `fail` gate status, comparable snapshot fields, and a visible unmatched-new-findings section.

## Rollback / Recovery

- Revert only the task-owned guidance, templates, tests, and matching version files as one release unit if contract validation fails.
- Keep existing protected scan artifacts and historical summaries untouched.
- Do not attempt a scan to validate this documentation/package change; schedule a rescan only after an authorized source-finding remediation changes the target snapshot.

## Plan Self-Review

- Placeholder scan: no placeholder content retained.
- Consistency check: all PRD requirements and NFRs map to U1-U4.
- Scope check: excludes automatic remediation, current vulnerability fixes, scanning, provider changes, and CI; includes the user-selected local draft approval gate.
- Acceptance coverage: each unit has explicit acceptance, files, tests, validation, and rollback signals.
- Validation gaps: authenticated external scan remains intentionally unverified and is not promoted from local checks.
- Alternatives and ADR check: template-first approach and no-auto-fix boundary are explicit.
- High-risk pre-mortem check: count-only success, raw-artifact leakage, and unauthorized mutation have mitigations.

## Handoff

Before implementation, run `ae-review domain:document` on this PRD and plan. Only after it has no blocking findings should `ae-work` modify distributed plugin files. No scanner invocation is authorized by this plan.
