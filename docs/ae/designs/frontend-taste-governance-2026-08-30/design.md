---
type: design
status: completed
date: 2026-08-30
title: frontend-taste-governance
origin: docs/ae/prds/2026-08-30-frontend-taste-governance-prd.md
originFingerprint: 2026-08-30-frontend-taste-governance
format: human-readable-design
sharded: false
---

# Design: Frontend Taste Governance

## Source

`docs/ae/prds/2026-08-30-frontend-taste-governance-prd.md`

## AI Parse Contract

- canonicalKind: design
- humanEquivalent: true
- stableIdsRequired: true
- noImplicitScope: true

## Split Manifest

- mode: unified
- root: docs/ae/designs/frontend-taste-governance-2026-08-30
- files:
  - design.md

## Overview

- Goal: 在现有 AE 前端主链中加入可传递的设计方向、精修路由、视觉证据有效性和路径级外部更新影响判断。
- Source requirements: R1-R11, NFR1-NFR3.
- Required dimensions: overview, architecture, ui-ux, test-cases, security.
- Explicit omitted dimensions: api: explicitly-omitted（无产品 API）；database: explicitly-omitted（无持久化业务数据）；observability: explicitly-omitted（无运行中服务）；non-functional: explicitly-omitted（NFR 作为实现约束和测试覆盖，不另建运行时指标）。
- Cross-dimension dependencies: UI Direction Contract 被 frontend implementation、review 和 browser evidence 共同读取；watch provenance 影响 security/license 和 tests。

## Existing Project Evidence

- mode: inspected
- bypass reason: N/A

| Evidence category | Repository-relative inputs | Sanitized conclusion | Confidence |
| --- | --- | --- | --- |
| stack and commands | `package.json`, `scripts/check-skill-mirror.mjs`, `scripts/check-skill-contract.mjs` | Node ESM；skill source/mirror、metadata、artifact 和 release checks 已存在 | verified |
| structure and conventions | `ae-web-forge`, `ae-frontend-design`, `ae-design`, `ae-review`, `ae-test-browser` | 已有单一 Q1-Q4 前端路由和三表面质量契约，应扩展而非新增入口 | verified |
| reusable assets | `docs/ae/references/frontend-quality-contract-map.md`, `docs/ae/references/external-skill-watchlist.json` | 质量 map 可承接跨技能同步；watchlist 可承接新增来源和 path mapping | verified |

## Implementation Constraints

- Repository paths: plugin canonical source under `plugins/ai-agent-engine-codex/skills`; maintenance mirror under `.ae-source/skills`; governance under `docs/ae`.
- Runtime/build commands: Node.js package scripts and existing AE tool wrapper.
- Environment variables: none.
- Dependency boundaries: no new npm dependency, external CLI, hook or provider runtime.
- Feature flags/configuration: no runtime feature flag; optional UI Direction Contract only when UI dimension is triggered.
- Rollback constraints: source/mirror/reference/test changes roll back as one unit; version/release notes remain synchronized.

## Decisions

### ADR-001 - Extend the existing frontend route

- Decision: Keep `ae-web-forge` Q1-Q4 as the router and add design-intent/refinement references to its existing destinations.
- Drivers: current ownership is clear; new entrypoints would overlap; project favors narrow changes.
- Alternatives: new `ae-design-taste` skill; install external skills.
- Consequences: changes span several existing references but preserve user-facing skill names.
- Supersedes: none.

### ADR-002 - Use a shared UI Direction Contract

- Decision: Define one compact field set for formal `ae-design` artifacts and lightweight `ae-frontend-design` execution.
- Drivers: design intent must survive handoff; review/browser need a common baseline.
- Alternatives: free-form design prose; numeric Taste defaults.
- Consequences: fields are contextual and may be inferred, but confidence must be visible.
- Supersedes: none.

### ADR-003 - Treat refinement terms as modes, not skills

- Decision: Group the external command vocabulary into audit, visual refinement, direction adjustment, and production hardening modes mapped to existing owners.
- Drivers: avoid 23 new triggers; keep progressive disclosure.
- Alternatives: one skill per command; a single giant SKILL.md.
- Consequences: mode detail belongs in a reference; entry SKILL files remain concise.
- Supersedes: none.

### ADR-004 - Require path evidence for affected skill claims

- Decision: A stale HEAD without changed-path evidence yields candidate/unverified impact; `affectedSkills` requires a path match against adopted `upstreamPaths`.
- Drivers: current mattpocock delta is unrelated to adopted skills; claim integrity.
- Alternatives: always list all adopted skills; fetch and clone every source automatically.
- Consequences: live watch remains offline-explainable and can accept deterministic changed-path input.
- Supersedes: repository-wide affected inference in current `skill-audit --watch`.

### ADR-005 - Defer deterministic visual detection

- Decision: Do not implement detector rules in the first release.
- Drivers: no local corpus, high false-positive/path/CSS parsing cost, Impeccable license boundary.
- Alternatives: port Impeccable detector; implement regex checks immediately.
- Consequences: first release proves workflow and evidence, not automated visual linting.
- Supersedes: none.

### ADR-006 - Model primary and supplementary upstream roles

- Decision: Add `sourceRole` and capability/path mappings to the watch contract; Gitee AE is `primary-upstream`, other repositories are `supplementary-research`.
- Drivers: project metadata already declares the primary source; review priority and provenance differ.
- Alternatives: keep every source flat; create a second watch subsystem.
- Consequences: one watch implementation remains, but reporting and recheck priority become explicit.
- Supersedes: implicit source priority outside the watchlist.

### ADR-007 - Treat runnable specs as optional evidence

- Decision: A self-contained static interaction spec may populate design input and browser evidence, but never replaces requirements, security, non-functional or source-code verification.
- Drivers: upstream spec-html offers executable clarity; its deliberately reduced requirement boundary is insufficient for current AE delivery gates.
- Alternatives: port bidirectional spec/code synchronization; ignore runnable specs entirely.
- Consequences: no new runtime in this plan; a later standalone PRD requires repeated real demand.
- Supersedes: none.

## Mapping Tables

### api-field-to-database-column-mapping

N/A when API and database dimensions are explicitly omitted.

### api-error-to-ui-state-mapping

N/A when API dimension is explicitly omitted.

### test-case-to-contract-coverage

| TC ID | Scenario | Covered IDs | Verification signal |
| --- | --- | --- | --- |
| TC-001 | Contextual direction across four UI scenarios | ADR-002, ST-001 | replay fields and exclusions match each scenario |
| TC-002 | Refinement intent routes to an existing owner | ADR-001, ADR-003, ST-002 | route table has one primary owner and validation path |
| TC-003 | Invalid screenshot cannot pass | ST-003 | missing/blank/cropped/blocked evidence returns failed or unverified |
| TC-004 | Unrelated upstream path after stale HEAD | ADR-004, ST-004 | `affectedSkills` empty and impact marked bounded |
| TC-005 | License/runtime boundary | ADR-005 | no external code, CLI, hook or dependency in diff |
| TC-006 | Primary upstream role and runnable-spec boundary | ADR-006, ADR-007, ST-005 | watch role is explicit and static spec is evidence, not authority |

### Test Coverage Matrix

| TC ID | Scenario | Design method | Covered IDs | Automatable verification signal |
| --- | --- | --- | --- | --- |
| TC-001 | marketing, operational, preserve-redesign, mobile | decision-table | ADR-002, ST-001 | static scenario-card assertions plus human review |
| TC-002 | audit/refine/adjust/harden modes | equivalence-class | ADR-003, ST-002 | mapping table contract test |
| TC-003 | valid vs blank/cropped/resource-failed screenshot | boundary-value | ST-003 | browser reference keyword lock; runnable fixture deferred |
| TC-004 | current/stale-no-path/matching/unrelated | decision-table | ADR-004, ST-004 | focused node:test cases |
| TC-005 | copied runtime vs independent guidance | error-guessing | ADR-005 | dependency/diff/license provenance review |
| TC-006 | primary vs supplementary source; spec evidence vs canonical contract | decision-table | ADR-006, ADR-007, ST-005 | static watch and guidance assertions |

### Test-Case Quality Rules

- Every `TC-XXX` references declared contract IDs and an observable outcome.
- Manual visual replay is not promoted to browser acceptance or user preference proof.
- Path evidence tests distinguish candidate impact from verified affected paths.

### ui-component-to-api-endpoint-mapping

N/A when this design changes workflow skills rather than a product UI/API.

## Architecture

The design keeps four layers:

1. Intake: `ae-web-forge` identifies target, design input, app interaction and preserve/redesign baseline.
2. Direction and implementation: `ae-design` records a formal UI Direction Contract when a design artifact exists; `ae-frontend-design` creates the same compact contract inline for smaller work.
3. Refinement and review: a shared reference maps refinement modes to `ae-frontend-design`, `ae-web-app` and `ae-review` without new skill entrypoints.
4. Evidence: `ae-test-browser` validates evidence quality and interaction/browser behavior; watch governance independently verifies external source impact.
5. Upstream governance: the same watch engine handles all sources, while source role controls audit priority and expected mapping completeness.

## API

Explicitly omitted: no public API contract.

## Database

Explicitly omitted: no durable application data.

## UI/UX

### ST-001 - UI Direction Contract

Fields: surface type, audience/main job, baseline and assets, hierarchy, typography, palette, spacing/density, expressiveness, motion purpose, responsive intent, content/assets, preserve/replace boundary, avoid list, confidence/evidence. Existing project tokens and supplied designs override inferred values.

### ST-002 - Refinement Mode Routing

Modes:

- audit: diagnose against direction, baseline, accessibility and browser evidence;
- refine: hierarchy, typesetting, layout, palette, motion and finishing;
- adjust: bolder, quieter, distill or clarify without changing product behavior;
- harden: responsive adaptation, states, i18n/content fit, performance and production readiness.

Each mode selects one owning skill and one verification path. Modes may compose, but do not create new public skill names.

### ST-003 - Visual Evidence State

States: `not-collected -> collected -> valid | invalid -> rerun -> valid | unverified`. Valid requires nonblank visible content, relevant viewport framing, loaded assets or explicit failure, and no critical overlap/overflow. A user-provided discrepancy moves `valid` back to `rerun` for the relevant scope.

### ST-004 - External Watch Impact State

States: `current`, `stale-impact-unverified`, `stale-unrelated`, `stale-affected`, `unavailable`. Only changed-path evidence can produce `stale-unrelated` or `stale-affected`; HEAD-only comparison produces `stale-impact-unverified`.

### ST-005 - Runnable Specification Evidence

States: `absent`, `provided-unverified`, `browser-valid`, `drifted`, `superseded`. A runnable static spec can supply routes, fields, interactions, responsive intent and layout evidence. PRD/design stable IDs remain canonical; security, concurrency, non-functional and production behavior remain separate contracts. When source and spec differ, the workflow lists differences and requires an authority decision rather than silently choosing a sync direction.

## Test Cases

### TC-001 - Contextual direction does not collapse to one aesthetic

- Priority: P1
- Preconditions: four replay briefs exist.
- Steps: apply UI Direction Contract to marketing, operational, preserve-redesign and mobile cases.
- Expected result: each case records distinct density/expressiveness/motion and preserves its explicit baseline; operational and regulated constraints override novelty.
- Covered IDs: R1-R3, ADR-002, ST-001.

### TC-002 - Refinement routes without new skills

- Priority: P1
- Preconditions: refinement routing reference exists.
- Steps: inspect representative audit, typeset, bolder, clarify, adapt and optimize requests.
- Expected result: every request has one primary existing owner and a browser/review validation path; no new top-level skill is required.
- Covered IDs: R4, ADR-001, ADR-003, ST-002.

### TC-003 - Invalid visual evidence reopens verification

- Priority: P1
- Preconditions: browser acceptance reference updated.
- Steps: evaluate blank, cropped, asset-failed and user-contradicted captures.
- Expected result: none can produce a visual pass; each becomes invalid/unverified or rerun with the missing evidence named.
- Covered IDs: R5-R6, ST-003.

### TC-004 - Watch impact follows changed paths

- Priority: P1
- Preconditions: watchlist mappings include upstream paths.
- Steps: run current, stale without paths, stale matching paths and stale unrelated paths fixtures.
- Expected result: only the matching case fills `affectedSkills`; no-path remains unverified and unrelated remains empty.
- Covered IDs: R8-R9, ADR-004, ST-004.

### TC-005 - External runtime and source code remain absent

- Priority: P1
- Preconditions: implementation diff available.
- Steps: inspect dependencies, scripts, hooks, provider manifests and copied source signatures.
- Expected result: no external runtime/dependency/code is added; provenance and independent adaptation boundary are documented.
- Covered IDs: NFR1-NFR2, ADR-005.

### TC-006 - Primary upstream and runnable specification stay bounded

- Priority: P1
- Preconditions: watch source roles and UI direction guidance are updated.
- Steps: inspect one primary-upstream record, one supplementary record and one UI task with a static interaction spec.
- Expected result: the primary source receives priority/mapping fields; the static spec informs direction and browser evidence but cannot erase PRD, security, non-functional or validation requirements.
- Covered IDs: R10-R11, ADR-006, ADR-007, ST-005.

## Security

- Treat external repositories as untrusted research input; do not execute their installers or scripts.
- Preserve path containment and symlink protections in local helpers.
- Do not copy Apache-2.0 Impeccable code into GPL-2.0-only distribution.
- Do not copy GPL-3.0-or-later Gitee upstream code or prompts into GPL-2.0-only distribution.
- Browser evidence must not capture credentials, tokens or private user data.
- Changed-path input is caller-controlled and must be normalized before matching; it cannot authorize file writes.

## Observability

Explicitly omitted: no service runtime. Watch output and test results are delivery evidence, not production telemetry.

## Non-Functional

Explicitly omitted as a separate dimension; NFR1-NFR3 are enforced by implementation constraints and TC-005.

## Consistency Check

- requiredDimensionsCovered: yes
- omittedDimensionsJustified: yes
- stableIdsUnique: yes
- mappingTablesComplete: yes, non-triggered tables explicitly N/A
- sourceScopePreserved: yes
- reviewStatus: self-reviewed with coherence, feasibility, evidence and traceability lenses; no blocking finding remains in the design artifact
