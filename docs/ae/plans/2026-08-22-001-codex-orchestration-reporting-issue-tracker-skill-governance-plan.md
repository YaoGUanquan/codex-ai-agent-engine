---
type: plan
status: drafted
date: 2026-08-22
title: codex-orchestration-reporting-issue-tracker-skill-governance
origin: docs/ae/prds/2026-08-22-codex-orchestration-reporting-issue-tracker-skill-governance-prd.md
originFingerprint: 2026-08-22-codex-orchestration-reporting-issue-tracker-skill-governance
depth: deep
format: human-readable-plan
sharded: false
---

# Implementation Plan

## Readiness

- Requirements: `docs/ae/prds/2026-08-22-codex-orchestration-reporting-issue-tracker-skill-governance-prd.md`
- Requirements state: confirmed from user direction; explicit non-goals and evidence boundaries recorded.
- Worktree state: existing user changes under `docs/08-ai-memory` and `docs/ae` must be preserved; no reset or checkout.
- Distribution rule: any change under `plugins/ai-agent-engine-codex/` or `.ae-source/skills/` requires synchronized version and README/CHANGELOG entries.
- Implementation gate: no production/plugin edits until the plan review and Git pre-edit check are complete.

## Approach Comparison

| Approach | Fit | Trade-off | Decision |
| --- | --- | --- | --- |
| Copy external skills and add wrappers | Fast initial surface, but duplicates runtime assumptions and creates two governance systems | High license/runtime drift and maintenance cost | Reject |
| Build three independent new skills plus a separate tracker database | Feature-rich, but duplicates existing task/evidence/static-server paths and adds persistence risk | Large surface and unclear authority | Reject |
| Extend existing `ae-tools` contracts, add thin Codex-native report/issue modules, and audit skills through one evidence index | Reuses current boundaries, supports offline operation, and makes each addition testable | Requires careful staged migration and versioned plugin metadata | Choose |

## High-Risk Pre-Mortem

1. Parallel write agents edit shared skill mirrors or package metadata concurrently. Signal: conflict matrix is non-empty or Git status changes outside owned files. Recovery: stop wave, retain each worker report, revert no user changes, and rerun serially after ownership correction.
2. Issue status becomes a second source of truth. Signal: issue claims a state not supported by plan/task/gate evidence. Recovery: mark issue `blocked`, link the contradictory artifact, and keep PRD/plan/gate authoritative for behavior/proof.
3. HTML report silently depends on CDN or leaks sensitive evidence. Signal: offline load failure, external URL in default output, or secret-like content in rendered fixtures. Recovery: fail report generation, remove external asset, redact input, and retain a failed evidence record.

## Implementation Units

### U1 - Codex orchestration execution contract

- Covers: AC-1, AC-5
- Depends on: none
- Ownership: `plugins/ai-agent-engine-codex/scripts/ae-tools/tasks.mjs`, `plugins/ai-agent-engine-codex/scripts/ae-tools.mjs`, `plugins/ai-agent-engine-codex/skills/ae-work/references/work-subagent-template.md`, `.ae-source` mirrors, focused tests.
- Work: extend the existing task analysis output with a stable worker request envelope, wave readiness, execution result schema, conflict/abort evidence and explicit read/write authorization checks. Keep orchestration decision with the Codex parent agent; no background daemon or implicit write permission.
- Forbidden files: unrelated business code, global user directories, lockfiles.
- Validation: focused task-analysis tests, dependency/conflict negative cases, `npm test`, mirror and contract checks.
- Rollback: remove the new envelope/adapter while preserving existing task-analyze fields; any changed output must be additive.

### U2 - Self-contained HTML report renderer

- Covers: AC-2, AC-5
- Depends on: U1
- Ownership: new `plugins/ai-agent-engine-codex/scripts/ae-tools/report.mjs`, dispatcher/help/catalog entries, `ae-work-report` reference or skill guidance, report tests, `.ae-source` mirror.
- Work: define a bounded report input schema and generate escaped self-contained HTML with summary, findings, evidence links, validation commands, limitations and unverified states. Reuse `static-server` for loopback preview; CDN/remote assets are opt-in and disclosed.
- Forbidden files: external network integrations, browser automation, user home data.
- Validation: schema/escaping tests, offline file inspection, dry-run preview and path containment negative tests.
- Rollback: report command remains additive; remove renderer and catalog entry without altering existing evidence records.

### U3 - Local Issue Tracker

- Covers: AC-3, AC-5
- Depends on: none
- Ownership: new `plugins/ai-agent-engine-codex/scripts/ae-tools/issues.mjs`, dispatcher/help/catalog, `docs/ae/issues` templates/README, issue tests, `.ae-source` mirror.
- Work: implement Markdown issue records plus a bounded JSON index or deterministic directory scan; support create/list/show/update/transition/link/close/dependency query. Validate stable IDs, allowed states, close reasons, worktree-contained paths, and references to existing AE artifacts.
- Forbidden files: external tracker credentials, network clients, database migrations, raw request/response storage.
- Validation: command contract tests, path/symlink/unknown-state/invalid-transition tests, recovery and index consistency checks.
- Rollback: retain issue files as ordinary Markdown; disable CLI dispatch without deleting records.

### U4 - Full skill logic audit and evidence index

- Covers: AC-4, AC-5
- Depends on: U1, U2, U3
- Ownership: `docs/ae/solutions/2026-08-22-*`, audit index/template, `plugins/ai-agent-engine-codex/skills/ae-skill-audit` references, focused audit tests, mirror and metadata files as needed.
- Work: inspect all 40 source skills and 40 mirrors; classify each as pass, finding, defer or reject across trigger, routing, runtime boundary, artifact, validation, metadata and license provenance. Create one machine-readable index and a human report. Do not modify a skill without a finding and acceptance mapping.
- Forbidden files: broad speculative rewrites, copied external runtime code, unrelated user documents.
- Validation: count and path coverage assertions, source/mirror parity, language metadata, skill contract, claim checker, HTML audit report generation.
- Rollback: each skill change is independently revertible; audit records remain even when a proposed fix is rejected.

### U5 - Evidence, documentation and release integration

- Covers: AC-1 through AC-5
- Depends on: U1, U2, U3, U4
- Ownership: `plugins/ai-agent-engine-codex/skills/ae-help/references/capability-catalog.json`, language metadata, README/README.en.md/CHANGELOG files, package manifests, install smoke tests, docs/ae evidence and gate records.
- Work: connect new commands and artifacts to help, installer, mirror checks, release notes, and final gate. Bump synchronized SemVer only for distributable content. Record known unverified runtime/browser boundaries.
- Forbidden files: user-owned unrelated docs, global plugin cache, forced Git operations.
- Validation: `npm test`, `npm run check`, `npm run check:smoke`, `git diff --check`, final `ae-tools gate`, report and issue smoke tests.
- Rollback: package version and docs entries revert together with plugin content; repository-side audit records remain available.

## Five-Layer Ownership

| Unit | Memory | Knowledge | Guardrail | Delegation | Distribution |
| --- | --- | --- | --- | --- | --- |
| U1 | evidence summary | task plan references | Git/file ownership | Codex worker envelope | plugin scripts and skill mirror |
| U2 | report evidence | report links | escaping/offline/CDN boundary | none | report command and help |
| U3 | issue history | artifact links | path/state/secret guards | none | issue command and templates |
| U4 | audit ledger | skill provenance | claim/license/runtime checks | reviewer routing | skill source/mirror changes |
| U5 | final gate | catalog/docs | release/install contracts | orchestration handoff | package/version/install smoke |

## Validation Contract

1. Before implementation: review requirements and plan; confirm clean/understood Git state without reverting existing changes.
2. Per unit: run focused tests and record exact result in `docs/00-process/active/2026-08-22-codex-orchestration-reporting-issue-tracker-skill-governance/progress.md`.
3. Final: run `npm test`, `npm run check`, `npm run check:smoke` where environment permits, `git diff --check`, generated HTML offline inspection, issue CLI smoke, and `ae-tools gate --workflow lfg --checkpoint final` with review status and validation commands.
4. Review: run `ae-review domain:code mode:report-only` for implementation and a claim-integrity/document lane for requirements, plan, reports and release claims.

## Defer List

- GitHub/Linear tracker adapters.
- Persistent SQLite issue database or background indexer.
- Automatic subagent spawning without parent orchestration and explicit approval.
- CDN-hosted visualizations as a default.
- Automatic skill evolution or benchmark-driven live mutation.

## AI Parse Contract

- canonicalKind: plan
- humanEquivalent: true
- stableIdsRequired: true
- noImplicitScope: true
