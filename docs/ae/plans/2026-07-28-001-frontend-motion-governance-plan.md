---
type: plan
status: completed
date: 2026-07-28
title: frontend-motion-governance
origin: docs/ae/prds/2026-07-28-001-frontend-motion-governance-prd.md
originFingerprint: 2026-07-28-frontend-motion-governance
depth: standard
format: human-readable-plan
sharded: false
---

# Plan: Frontend Motion Governance

## Source

- Requirements: `docs/ae/prds/2026-07-28-001-frontend-motion-governance-prd.md`.
- External-audit evidence: user-supplied GitHub repositories were refreshed with `git ls-remote` on 2026-07-28; provenance and constraints are retained in the source PRD.
- Current baseline: `main` at `1446622139d8a3b40228b52d4289589c394a8e01`.
- Relevant local files inspected: existing `ae-frontend-design`, `ae-test-browser`, and `ae-web-forge` skill bodies and references; `tests/skill-scripts.test.mjs`; validation and distribution scripts named in `package.json`.

## AI Parse Contract

- canonicalKind: plan
- humanEquivalent: true
- stableIdsRequired: true
- noImplicitScope: true

## Scope

Extend the three existing frontend workflow skills with intentional-motion, reduced-motion, and final-state evidence rules. Protect the rules with focused tests, synchronize all source/mirror changes, and release the completed plugin content as one patch-version update.

## Readiness

- Goal: make material UI motion a deliberate, accessible, and browser-verifiable decision in existing AE frontend workflows.
- Acceptance criteria: R1-R7 and NFR1-NFR3 in the source PRD.
- Non-goals: no target app implementation, dependency installation, visual redesign, standalone motion skill, or external-source vendoring.
- Affected areas: Knowledge (skill instructions and references), Guardrail (regression tests and browser evidence), Distribution (mirrors and version pair).
- Validation surface: focused Node tests; `npm.cmd test`; `npm.cmd run check`; `node scripts/check-skill-mirror.mjs`; `node scripts/check-skill-contract.mjs`; `node scripts/check-install-smoke.mjs`; `node scripts/check-ae-artifacts.mjs`; `git diff --check`.
- Open questions: none blocking.

## Assumptions

- The baseline remains a clean `main` worktree when implementation starts; any user changes discovered then will be preserved.
- Plugin content still has synchronized `0.3.2` root and manifest versions before the patch-version unit begins. Recheck rather than overwrite a concurrent version update.
- The repository test suite can assert skill text and mirror parity without needing a runnable target frontend.

## Alternatives Considered

- Recommended: add concise governance to the existing three skills and their references, then encode it in existing tests.
- Alternative: create `ae-motion-design` as a dedicated skill.
  Rejected because: it duplicates Web Forge routing and adds catalogue, metadata, install, and maintenance surface without a distinct workflow owner.
- Alternative: add one preferred animation dependency to this plugin.
  Rejected because: this repository distributes Codex workflows, while dependency choice belongs to each target application and its license/performance constraints.
- Alternative: make Apple HIG patterns the default visual system.
  Rejected because: target repository baseline and platform conventions must remain controlling constraints.

## Decision Drivers

- Driver 1: preserve existing visual baselines and avoid decorative default behavior.
- Driver 2: make accessibility and final-state behavior observable through the existing browser acceptance lane.
- Driver 3: preserve plugin source/mirror/version integrity with a narrow change set.

## Decisions

### ADR-1 - Govern motion within existing frontend workflow ownership

- Decision: update `ae-frontend-design`, `ae-test-browser`, and `ae-web-forge`; do not add an entrypoint.
- Drivers: existing skills already own UI intent, browser evidence, and routing reports.
- Alternatives: standalone motion skill or a generic animation-library catalog.
- Why chosen: it keeps the decision adjacent to the route and acceptance evidence that already exist.
- Consequences: guidance must remain concise and conditional; every change must be mirrored in both skill roots.
- Follow-ups: validate a concrete target project later before adding performance-budget guidance.

### ADR-2 - Static-first, category-based motion decision

- Decision: default to no added motion or minimal CSS state feedback; use JS timelines, exported assets, or 3D only for a documented task purpose.
- Drivers: usability, accessibility, dependency restraint, and maintainability.
- Alternatives: library-first recommendations or unbounded visual-effect examples.
- Why chosen: it makes behavior and fallback testable while leaving target apps free to select appropriate tools.
- Consequences: skill text must say that dependencies are local target-project choices and particles are not ordinary application decoration.
- Follow-ups: none in this implementation pass.

## Risks

- Skill source and mirror can drift when multiple references are changed.
- A text-only test can become too prescriptive and block legitimate wording improvements.
- Version metadata can conflict with a concurrent distribution update.
- Browser guidance may imply tests that a particular target environment cannot run; it must permit explicit unverified reporting.

## Pre-Mortem

- Failure scenario 1: a new rule recommends a library as a default and violates the no-dependency boundary.
  Mitigation: assert static-first and target-project-only dependency language; review the diff for lockfile and package changes.
- Failure scenario 2: reduced-motion is named in design guidance but omitted from browser evidence.
  Mitigation: add paired assertions for the design and browser references and require Web Forge to report its status.
- Failure scenario 3: plugin source passes locally while the installed `.agents` mirror differs.
  Mitigation: edit paired files in the same unit, run mirror validation first, then broader checks.

## Global Constraints

- Use UTF-8 and do not rewrite unrelated text because terminal rendering looks incorrect.
- Preserve unrelated work; do not reset, clean, or modify external sources.
- Do not add packages, lockfile changes, assets, external runtime behavior, or new skill directories.
- Do not claim browser acceptance for this workflow-only change; validate a real UI only when a target application uses the guidance.
- Version source and manifest together only after confirming the current pair.

## Implementation Units

### U1 - Establish a focused regression contract

- Goal: make the new workflow rules observable before skill content changes.
- Requirements covered: R1, R3, R4, R5, R6, R7; NFR1, NFR2.
- Acceptance criteria covered: purpose/static alternative, category choices, reduced motion, final state, Web Forge report fields, source/mirror parity.
- Depends on: none.
- Five-layer ownership: Guardrail.
- Files:
  - `tests/skill-scripts.test.mjs`
- Forbidden files:
  - `package-lock.json`
  - `plugins/ai-agent-engine-codex/.codex-plugin/plugin.json`
  - `package.json`
- Approach: add narrowly named assertions that read canonical plugin skills, compare their mirrors, and check for behavior-level phrases rather than a brittle full-document snapshot. Include a negative assertion that the workflow does not prescribe a runtime animation dependency.
- Tests: run the focused test file before and after the skill updates; preserve unrelated existing test expectations.
- Validation: `node --test tests/skill-scripts.test.mjs`.
- Rollback signals: assertions require a specific library, unsupported browser API, or exact prose unrelated to the requirement.
- Deferred to implementation: exact test names and regex wording may follow current test conventions.

### U2 - Add intentional-motion and accessibility guidance to frontend design

- Goal: make motion an explicit, static-first design decision while preserving local visual systems.
- Requirements covered: R1, R2, R3, R4; NFR1, NFR2, NFR3.
- Acceptance criteria covered: purpose, baseline preservation, reduced-motion fallback, usable final state, category distinction, no mandatory dependency.
- Depends on: U1.
- Five-layer ownership: Knowledge.
- Files:
  - `plugins/ai-agent-engine-codex/skills/ae-frontend-design/SKILL.md`
  - `plugins/ai-agent-engine-codex/skills/ae-frontend-design/references/web-ui-quality.md`
  - `.agents/skills/ae-frontend-design/SKILL.md`
  - `.agents/skills/ae-frontend-design/references/web-ui-quality.md`
- Forbidden files:
  - `package-lock.json`
  - `plugins/ai-agent-engine-codex/skills/ae-web-forge/SKILL.md`
  - `.agents/skills/ae-web-forge/SKILL.md`
- Approach: add a compact motion decision gate: explain the task purpose or select static UI; prefer CSS state feedback; classify JS timelines, exported animation assets, and 3D/data scenes as conditional target-project choices; require reduced-motion and stable completion states; explicitly reject decorative particle backgrounds for ordinary application surfaces. Preserve existing state, responsive, and design-baseline rules.
- Tests: U1 focused assertions.
- Validation: `node --test tests/skill-scripts.test.mjs`; `node scripts/check-skill-mirror.mjs`; `node scripts/check-skill-contract.mjs`.
- Rollback signals: wording changes the default visual baseline, makes Apple/HIG rules universal, or grows into a library-selection catalogue.
- Deferred to implementation: target-project performance thresholds remain out of scope.

### U3 - Extend browser evidence and Web Forge reporting

- Goal: ensure material motion has acceptance evidence through the existing browser route.
- Requirements covered: R3, R5, R6, R7; NFR1, NFR2.
- Acceptance criteria covered: exercised interaction, completion state, reduced-motion evidence or explicit gap, existing console/network checks, visible routing decision.
- Depends on: U1, U2.
- Five-layer ownership: Knowledge, Guardrail.
- Files:
  - `plugins/ai-agent-engine-codex/skills/ae-test-browser/SKILL.md`
  - `plugins/ai-agent-engine-codex/skills/ae-test-browser/references/browser-acceptance.md`
  - `.agents/skills/ae-test-browser/SKILL.md`
  - `.agents/skills/ae-test-browser/references/browser-acceptance.md`
  - `plugins/ai-agent-engine-codex/skills/ae-web-forge/SKILL.md`
  - `.agents/skills/ae-web-forge/SKILL.md`
- Forbidden files:
  - `package-lock.json`
  - `plugins/ai-agent-engine-codex/skills/ae-frontend-design/SKILL.md`
  - `.agents/skills/ae-frontend-design/SKILL.md`
- Approach: retain current browser-tool selection. Add conditional evidence rules only when material motion is in scope: interaction trigger, final state, reduced-motion mode where tool and app support it, and a clear unverified explanation otherwise. Add `Motion decision` and `Reduced-motion evidence` fields to the existing Web Forge report format; do not add a new browser-runtime claim.
- Tests: U1 focused assertions.
- Validation: `node --test tests/skill-scripts.test.mjs`; `node scripts/check-skill-mirror.mjs`; `node scripts/check-skill-contract.mjs`.
- Rollback signals: guidance claims every browser tool can emulate reduced motion, or makes browser acceptance mandatory for documentation-only changes.
- Deferred to implementation: a target-project Playwright helper is not part of this plugin change.

### U4 - Synchronize distribution metadata and document validation evidence

- Goal: publish the changed plugin content coherently and prove its distributable integrity.
- Requirements covered: R7; NFR1, NFR3.
- Acceptance criteria covered: identical source/mirror behavior, matching patch version, no dependency change, comprehensive validation.
- Depends on: U1, U2, U3.
- Five-layer ownership: Distribution, Guardrail.
- Files:
  - `package.json`
  - `plugins/ai-agent-engine-codex/.codex-plugin/plugin.json`
- Forbidden files:
  - `package-lock.json`
  - `README.md`
  - `README.en.md`
  - `README.zh-CN.md`
- Approach: re-read both versions immediately before this unit. If both remain `0.3.2`, increment both to `0.3.3`; otherwise select the next mutually valid patch version and record the observed pair. Do not change help catalog, language metadata, or README because no skill name or public description changes. Run the full validation suite and record actual results in the execution handoff or gate artifact when the user authorizes implementation.
- Tests: U1 assertions plus the existing `root package and plugin manifest keep synchronized distribution versions` test in `tests/skill-scripts.test.mjs`; the existing install-smoke test also checks the installed manifest version against the source manifest.
- Validation: `node --test tests/skill-scripts.test.mjs`; `npm.cmd test`; `npm.cmd run check`; `node scripts/check-install-smoke.mjs`; `node scripts/check-ae-artifacts.mjs`; `git diff --check`.
- Rollback signals: version pair mismatch, install smoke failure, a package/lockfile change outside this plan, or failing artifact validation.
- Deferred to implementation: no release, commit, push, or target-project browser run is authorized by this plan alone.

## Consistency Check

- implementationUnitCount: 4
- sourceRequirementsCovered: R1-R7, NFR1-NFR3
- sourceRequirementsDeferred: target-project performance budgets and concrete UI/browser runs
- openQuestionsCount: 0

## Validation Plan

- Unit: `node --test tests/skill-scripts.test.mjs` after U1 and after each affected skill unit.
- Integration: `npm.cmd test` after all source, mirror, and version changes.
- User flow: no runnable product UI changes in this repository; use a target project's actual route only in later adoption work.
- Data / operations: `node scripts/check-install-smoke.mjs` validates project-level distribution without remote mutation.
- Observability: `node scripts/check-skill-mirror.mjs`, `node scripts/check-skill-contract.mjs`, `node scripts/check-ae-artifacts.mjs`, and `git diff --check` provide the required implementation evidence.

## Rollback / Recovery

- Before versioning, revert only the affected source/mirror/test files if focused tests reveal an over-broad contract.
- After versioning, restore the previous matching version pair only together and only as part of an authorized corrective change; never leave root and manifest divergent.
- If a mirror check fails, use the plugin source as canonical, reconcile the paired mirror files, and rerun focused tests before broader validation.
- If target-project browser tooling cannot exercise reduced motion, record the exact limitation as unverified instead of weakening the static-first or fallback requirement.

## Plan Self-Review

- Placeholder scan: no placeholders or unbounded implementation verbs remain.
- Consistency check: every PRD requirement maps to U1-U4; no behavior is introduced beyond the PRD.
- Scope check: no dependency, new skill, external asset, or target application change is planned.
- Acceptance coverage: motion purpose, baseline preservation, reduced motion, final state, report traceability, mirror integrity, and versioning all have owning units and validations.
- Validation gaps: browser behavior cannot be demonstrated until a target project uses the guidance; this is explicitly deferred.
- Alternatives and ADR check: a separate skill, library adoption, and Apple-default styling were considered and rejected.
- High-risk pre-mortem check: mirror drift, dependency creep, missing reduced-motion evidence, and version mismatch have concrete mitigations.

## Handoff

Document review completed on 2026-07-28. U1 -> U2 -> U3 -> U4 completed serially on 2026-07-28; no write delegation was used. Validation passed: `npm.cmd test` (85 tests), `npm.cmd run check`, `node scripts/check-install-smoke.mjs` (installed plugin version `0.3.3`), `node scripts/check-ae-artifacts.mjs`, `node scripts/check-skill-mirror.mjs`, `node scripts/check-skill-contract.mjs`, and `git diff --check`. The `ae-review` contract is at `docs/ae/evidence/artifacts/review-contract/20260728T065614734Z-634ace824fe7.json`; the work report, experience graph, and process archive are recorded under `docs/ae/work-reports/2026-07-28-frontend-motion-governance-work-report.md`, `docs/ae/experience/2026-07-28-frontend-motion-governance.md`, and `docs/00-process/archive/2026-07/frontend-motion-governance/summary.md`. No target UI exists in this repository, so browser acceptance remains deferred to a target project that applies the guidance. The advertised `ae-tools.mjs gate` command is not present in the current CLI; equivalent checks were run and no proof artifact was written.
