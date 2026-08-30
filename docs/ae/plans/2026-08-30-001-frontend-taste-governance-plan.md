---
type: plan
status: completed
date: 2026-08-30
title: frontend-taste-governance
origin: docs/ae/prds/2026-08-30-frontend-taste-governance-prd.md
originFingerprint: 2026-08-30-frontend-taste-governance
depth: deep
format: human-readable-plan
sharded: false
---

# Plan: Frontend Taste Governance

## Source

- PRD: `docs/ae/prds/2026-08-30-frontend-taste-governance-prd.md`
- Design: `docs/ae/designs/frontend-taste-governance-2026-08-30/design.md`
- Audit: `docs/ae/solutions/2026-08-30-taste-impeccable-skill-audit.md`

## AI Parse Contract

- canonicalKind: plan
- humanEquivalent: true
- stableIdsRequired: true
- noImplicitScope: true

## Scope

分两个可独立回滚的发布批次增强现有 AE 技能：先修正外部 watch 的影响语义并登记来源，再加入 UI Direction Contract、精修路由、视觉证据有效性和场景回放。不得安装或复制外部 runtime，不新建顶层 design skill，不在首批实现 detector。

## Readiness

- Goal: 让前端设计判断可跨 design/implementation/review/browser 传递，并让 watch 的 affected claim 具备路径证据。
- Acceptance criteria: PRD R1-R11, NFR1-NFR3；design TC-001 至 TC-006。
- Non-goals: 外部技能安装、23 个新技能、detector、像素级全量验收、吸收 experimental retro。
- Affected areas: frontend skill references, design template, review/browser contracts, frontend quality map, external watchlist, skill-audit watch implementation/tests, release metadata.
- Validation surface: static contracts, focused node tests, manual scenario replay, optional runnable browser fixture, full check/test/smoke and release notes.
- Open questions: Q1 选择共享 reference；Q2 选择 CLI 接收 changed-path evidence，均在 ADR 中解决。

## Validation Evidence

| Acceptance criterion | Applicable tier | Expected signal and bounded claim | Preconditions / owner | Status | Recovery or rollback signal |
| --- | --- | --- | --- | --- | --- |
| R8-R10 watch precision and source roles | focused automated test | path/freshness cases plus primary/supplementary role prove output semantics only | local fixtures / implementer | planned | revert watch schema and command together |
| R1-R7 skill contracts | static inspection | source/mirror, links, design and docs tests pass | updated docs / implementer | planned | revert shared reference consumers together |
| R7 contextual behavior | manual replay | four briefs produce distinct direction fields and exclusions | scenario cards / reviewer | unverified | revise guidance; do not claim quality gain |
| R5 visual evidence | browser acceptance | fixture captures are nonblank, framed and state-valid | runnable fixture / browser reviewer | unverified | keep browser claim unverified or drop fixture scope |
| NFR1-NFR3 distribution | integration/build | full check, tests, smoke and release-note checks pass | local Node environment / controller | planned | do not publish version |

## Verification Gaps

- Affected requirement ID: R7
  Required proof and missing check: real target-project comparison or user study.
  Status: unverified
  Owner and next action: maintainer may run scenario replay and later collect real-session evidence; first release must not claim measured design improvement.
- Affected requirement ID: R5
  Required proof and missing check: browser exercise on a runnable fixture.
  Status: unverified
  Owner and next action: U5 runs it only if a stable local fixture already exists; otherwise document the limitation.

## Assumptions

- Current plugin remains version 0.3.34 before implementation begins; implementation must re-read current version and release window rather than hard-code the next number in advance.
- Direct GitHub git access may remain unavailable; changed-path fixtures and explicit inputs must keep watch tests deterministic.
- Existing quality map is descriptive, so tests should lock only material cross-surface phrases rather than duplicate the whole map.

## Alternatives Considered

- Recommended: one shared design-intent/refinement reference consumed by existing skills, plus path-aware watch semantics.
- Alternative: copy Taste/Impeccable skills or install their runtimes.
- Rejected because: duplicate routing, source/mirror drift, Apache-2.0/GPL-2.0-only boundary, hooks and detector maintenance.
- Alternative: add a local detector in the first batch.
- Rejected because: no held-out rule corpus or false-positive budget; Impeccable release history shows nontrivial parsing/path/security cost.

## Decision Drivers

- Driver 1: preserve the existing single frontend route and project design system priority.
- Driver 2: make visual-quality claims inspectable without turning taste into a fixed style.
- Driver 3: preserve claim integrity, license compatibility and offline-explainable watch behavior.

## Decisions

### ADR-1 - Shared reference with narrow consumers

- Decision: add one progressive-disclosure reference under `ae-frontend-design/references` for UI Direction Contract and refinement modes; `ae-design`, `ae-web-forge`, `ae-review` and `ae-test-browser` keep only the fields/routing/evidence they own.
- Drivers: minimize duplicated prose and preserve ownership.
- Alternatives: separate full copies; one giant entry SKILL.
- Why chosen: matches local reference pattern and existing frontend quality map.
- Consequences: cross-skill reference links and mirror tests must be updated.
- Follow-ups: split only if a real consumer divergence appears.

### ADR-2 - Explicit changed-path evidence

- Decision: extend watchlist adopted rows with `upstreamPaths`; add an explicit, deterministic changed-path input to `skill-audit --watch`. Without that evidence, report stale source and unverified impact.
- Drivers: network compare is unreliable; HEAD alone cannot prove affected paths.
- Alternatives: automatic clone/API compare; continue all-skill affected output.
- Why chosen: deterministic fixtures, no dependency, truthful claims.
- Consequences: CLI/help/schema/tests change; backward-compatible output should preserve source freshness while tightening `affectedSkills` semantics.
- Follow-ups: a future API adapter may produce the same changed-path input without changing the core contract.

### ADR-2A - Primary upstream uses the same engine with stronger metadata

- Decision: register Gitee AE in the same watchlist with `sourceRole: primary-upstream`, capability domains and upstream paths; supplementary sources use `sourceRole: supplementary-research`.
- Drivers: one deterministic implementation; project-declared priority; no parallel governance system.
- Alternatives: separate primary-upstream command; leave priority in README only.
- Why chosen: keeps freshness and path-impact semantics uniform while preserving priority.
- Consequences: watch schema tests must cover old rows or migrate all records atomically.
- Follow-ups: inspect primary-upstream diffs before supplementary sources when both are stale.

### ADR-3 - One release with independently gated batches

- Decision: implement watch precision before design guidance, validate both batches independently, and ship them together as version 0.3.35 only after U1 and U2-U5 pass their own gates.
- Drivers: watch bug is deterministic; visual guidance requires broader document review.
- Alternatives: one broad mixed patch.
- Why chosen: smaller rollback and clearer proof.
- Consequences: one SemVer patch release contains both batches, while focused validation and rollback boundaries remain separate.
- Follow-ups: never bump for this planning-only artifact set.

## Risks

- Contextual guidance grows into a large, frequently loaded prompt.
- “Anti-slop” bans become aesthetic dogma and harm operational UI.
- Browser checks overclaim visual fidelity from a single screenshot.
- Watch changed-path input accepts unsafe or inconsistent path forms.
- Source/mirror/release metadata drift across a multi-skill edit.

## Pre-Mortem

- Failure scenario 1: every replay outputs the same trendy landing-page direction. Signal: operational/preserve cases receive high expressiveness or gratuitous motion. Mitigation: scenario-card negative assertions and existing-baseline precedence.
- Failure scenario 2: stale watch still fills all adopted skills when no paths are known. Signal: focused no-path test returns non-empty `affectedSkills`. Mitigation: make unverified impact a first-class state.
- Failure scenario 3: plugin changes pass docs checks but installed package misses a mirror/reference. Signal: install smoke or mirror check fails. Mitigation: source/mirror atomic edits, smoke before delivery, no publish on failure.

## Global Constraints

- No external code/prose copy, installer, hook, provider runtime or dependency.
- No skill/body edits before re-reading current Git status and version files.
- Every plugin content release updates both versions and four release-note files, retaining the README five-entry window.

## Implementation Units

### U1 - Path-aware external watch semantics

- Goal: fix F1 and make affected claims evidence-backed.
- Requirements covered: R8-R10, NFR1-NFR3.
- Acceptance criteria covered: watch four-case matrix; primary/supplementary roles; source provenance for Gitee AE, Taste and Impeccable.
- Depends on: none.
- Files: `docs/ae/references/external-skill-watchlist.json`, `plugins/ai-agent-engine-codex/scripts/ae-tools/skill-audit.mjs`, `plugins/ai-agent-engine-codex/skills/ae-skill-audit/SKILL.md`, matching `.ae-source` mirror, help/catalog only if CLI arguments are user-visible, `tests/ae-tools.test.mjs`, `tests/skills-docs.test.mjs`.
- Forbidden files: frontend skill bodies, external repository contents, lockfiles, global Codex config.
- Approach: add `sourceRole`, capability domains and `upstreamPaths`; parse normalized repo-relative changed paths from an explicit option; expose `impactStatus`, `candidateSkills`, and evidence-backed `affectedSkills`; keep current/unavailable semantics. Register Gitee AE at verified `8ef17fbc...` baseline after inspecting its GPL-3.0-or-later license and changed paths.
- Tests: current, stale-no-path, stale-matching, stale-unrelated; primary/supplementary role; path traversal/absolute path rejection; no-write assertion.
- Validation: focused `node --test` patterns, `skill-audit --watch --remote-commit ...` fixtures, mirror/contract checks.
- Rollback signals: output breaks existing default audit, path validation accepts absolute/traversal values, or source/mirror differs.
- Deferred to implementation: exact backward-compatible field deprecation wording.

### U2 - UI Direction Contract and refinement reference

- Goal: encode contextual design judgment once and keep public entry skills concise.
- Requirements covered: R1-R4, R11, NFR1-NFR2.
- Acceptance criteria covered: shared field set, precedence rule, grouped refinement modes, optional runnable-spec evidence boundary.
- Depends on: none.
- Files: `plugins/ai-agent-engine-codex/skills/ae-frontend-design/references/ui-direction-contract.md`, `ae-frontend-design/SKILL.md`, `ae-web-forge/SKILL.md`, matching `.ae-source` files, `tests/skills-docs.test.mjs`.
- Forbidden files: framework guidance, backend/API skills, external prompt files, package dependencies.
- Approach: concise entrypoint references; design direction fields and mode routing live in one reference; preserve Q1-Q4 and add no new top-level skill. A static interaction spec may be a design input, but canonical requirements/security/NFR remain separate.
- Tests: source/mirror equality, link resolution, key precedence and mode mapping assertions.
- Validation: mirror, skill contract, language metadata, focused docs tests.
- Rollback signals: reference exceeds a maintainable progressive-disclosure size, conflicts with operational UI rules, or creates ambiguous owners.
- Deferred to implementation: exact filename if a nearer existing reference is a better owner.

### U3 - Formal design contract integration

- Goal: let significant UI designs carry the same direction into planning and review.
- Requirements covered: R1-R3, R6.
- Acceptance criteria covered: optional UI Direction Contract in design template with confidence/evidence and stable mapping.
- Depends on: U2.
- Files: `plugins/ai-agent-engine-codex/skills/ae-design/SKILL.md`, `plugins/ai-agent-engine-codex/skills/ae-design/references/design-contract-template.md`, matching `.ae-source` files, `scripts/check-design-contract.mjs` and tests only if a deterministic optional-section check is justified.
- Forbidden files: existing historical designs, PRD template, product code.
- Approach: require the section only when UI/UX dimension is triggered; use fields from U2; keep lightweight design omission valid for non-UI work.
- Tests: design fixture with UI dimension passes only with direction section; non-UI fixture remains valid.
- Validation: design contract check, artifact check, focused tests.
- Rollback signals: all existing designs become invalid without migration, or the template duplicates U2 prose.
- Deferred to implementation: whether deterministic checker validates section presence or docs test locks the contract.

### U4 - Review and browser evidence closure

- Goal: make refinement findings evidence-based and screenshots trustworthy.
- Requirements covered: R5-R6, NFR1.
- Acceptance criteria covered: evidence validity, rerun on contradiction, suppression of taste-only findings.
- Depends on: U2.
- Files: `plugins/ai-agent-engine-codex/skills/ae-review/references/code-review-rule-profiles.md`, `plugins/ai-agent-engine-codex/skills/ae-test-browser/references/browser-acceptance.md`, matching `.ae-source` files, `docs/ae/references/frontend-quality-contract-map.md`, `tests/skills-docs.test.mjs`.
- Forbidden files: browser tooling implementation, Playwright dependencies, external detector code.
- Approach: add a visual-quality sub-lens and evidence-validity state rules; update the descriptive quality map; require bounded findings tied to direction/baseline/browser evidence.
- Tests: keyword/contract locks for valid evidence, rerun and evidence-backed visual finding.
- Validation: mirror, skill contract, focused docs tests.
- Rollback signals: every UI diff is forced into visual review, or screenshots are promoted to pixel-perfect proof.
- Deferred to implementation: no detector rules.

### U5 - Scenario replay and optional browser fixture

- Goal: validate that the guidance changes behavior without overclaiming user preference.
- Requirements covered: R7, R5.
- Acceptance criteria covered: four scenario cards; optional valid/invalid capture exercise.
- Depends on: U2, U3, U4.
- Files: `docs/ae/templates/frontend-design-quality-replay.md`, focused test fixture paths only if an existing local pattern supports them, process evidence under `docs/00-process/active/<task>/` during execution.
- Forbidden files: production UI, generated image assets, external websites, benchmark claims.
- Approach: define expected fields and negative assertions for four scenarios; run manually with captured results; browser fixture only if already available and stable.
- Tests: scenario completeness and no-implicit-style checklist; browser exercise when feasible.
- Validation: document review plus optional Playwright/Browser evidence; mark real quality outcome unverified.
- Rollback signals: replay requires subjective numeric scoring or cannot distinguish dashboard from landing page behavior.
- Deferred to implementation: target fixture selection.

### U6 - Release integration and delivery review

- Goal: ship each authorized plugin batch with complete distribution evidence.
- Requirements covered: NFR3 and all implemented requirements.
- Acceptance criteria covered: version parity, release notes, mirrors, tests, checks and smoke.
- Depends on: U1, U5.
- Files: `package.json`, `plugins/ai-agent-engine-codex/.codex-plugin/plugin.json`, `README.md`, `README.en.md`, `CHANGELOG.md`, `CHANGELOG.en.md`, relevant tests/process archive.
- Forbidden files: unrelated roadmap/history, package lock unless a real dependency change occurs, user global installation before smoke passes.
- Approach: determine next SemVer from current tree, update synchronized metadata, keep README five-entry window, review all changed files, archive process evidence after completion.
- Tests: focused tests, `npm test`, `npm run check`, `npm run check:smoke`, `node scripts/check-release-notes.mjs`, `git diff --check`.
- Validation: all commands must complete successfully; document/browser outcome gaps remain explicit.
- Rollback signals: any mirror/version/release mismatch, smoke failure, or P0/P1 review finding.
- Deferred to implementation: none; this authorized execution ships U1 and U2-U5 together as 0.3.35 if every release gate passes.

## Five-Layer Ownership

| Unit | Memory | Knowledge | Guardrail | Delegation | Distribution |
| --- | --- | --- | --- | --- | --- |
| U1 | optional watch note only | source/path mappings | bounded affected claims | none | tool + audit skill |
| U2 | none | shared UI direction reference | precedence and no-runtime rules | route to existing skills | frontend/web-forge skills |
| U3 | none | design contract fields | optional UI dimension check | none | design skill/template |
| U4 | none | visual evidence rules | review/browser gates | existing review lanes | review/test-browser references |
| U5 | no long-term promotion by default | replay scenarios | negative assertions | none | docs/test fixtures |
| U6 | completed experience only if requested | release evidence | full gates | none | versioned plugin |

## Consistency Check

- implementationUnitCount: 6
- sourceRequirementsCovered: R1-R11, NFR1-NFR3
- sourceRequirementsDeferred: detector and retro are out of scope, not source requirements
- openQuestionsCount: 0 blocking; two PRD technical questions resolved by ADR-1 and ADR-2

## Validation Plan

- Unit: focused watch and docs/contract tests.
- Integration: source/mirror, language metadata, artifact, design contract and full npm tests.
- User flow: four manual design-guidance scenarios; optional browser fixture for visual evidence state.
- Data / operations: N/A; watchlist JSON parse and path normalization only.
- Observability: exact command results in process ledger; no runtime telemetry claim.

## Rollback / Recovery

- U1 can roll back independently if output compatibility or path matching is unsafe.
- U2-U4 must roll back with their mirror and cross-surface map counterparts.
- Do not publish or apply globally until U6 passes; a failed release keeps all claims in planned/unverified state.
- Detector and retro remain deferred, so no runtime cleanup is required.

## Plan Self-Review

- Placeholder scan: no TBD/TODO or placeholder sections.
- Consistency check: six units cover all requirements; dependency order is explicit.
- Scope check: no new skill, detector, runtime, product UI or external install.
- Acceptance coverage: R1-R11 and NFR1-NFR3 map to units and validation.
- Validation gaps: real user-perceived quality and optional browser fixture remain explicitly unverified.
- Alternatives and ADR check: import/new-skill/detector alternatives are rejected with evidence.
- High-risk pre-mortem check: style overfit, watch overclaim and distribution drift have signals and recovery.

## Handoff

Route to `ae-review domain:document` for the audit, PRD, design and plan. After resolving blocking findings, use `ae-work` or `ae-skill-creator` only when the user explicitly authorizes implementation.
