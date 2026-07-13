---
type: plan
status: completed
date: 2026-07-13
title: upstream-workflow-optimization
depth: standard
format: human-readable-plan
sharded: false
---

# Plan: upstream-workflow-optimization

## Source

- User request: execute the recommendations from the 2026-07-13 upstream audit.
- Upstream repository: `https://gitee.com/jiangqiang1996/ai-agent-engine`.
- Freshness method: `git ls-remote https://gitee.com/jiangqiang1996/ai-agent-engine.git refs/heads/master` plus a local shallow clone for inspected files.
- Observed upstream commit: `00d7e9ca7594945ac26a46fffc43ccd679cd461b`.
- Prior local catalog baseline: `f0cb655ca76fc5e32b5179e155c84f857a9ec289`.
- Inspected upstream evidence: `src/services/ae-catalog.ts`, `src/services/help-catalog-service.ts`, `src/assets/skills/ae-design/**`, `src/assets/skills/ae-task-loop/SKILL.md`, `src/assets/skills/ae-project-explore/SKILL.md`, `src/assets/rules/persistent-resource-rules.md`, and `tests/e2e/**`.
- Requirements status: confirmed inline by the prior audit and the user's instruction to execute its recommendations.

## AI Parse Contract

- canonicalKind: plan
- humanEquivalent: true
- stableIdsRequired: true
- noImplicitScope: true

## Scope

In scope:

- Add `core`, `docs`, `tools`, and `meta` tiers to all capability catalog skill entries and render filtered help output grouped in deterministic tier order.
- Update the recorded upstream observation to `00d7e9ca7594945ac26a46fffc43ccd679cd461b` with provenance notes.
- Extend design-contract validation so mapping references resolve to declared stable IDs and split manifest paths are safe, local, and present.
- Strengthen `ae-task-loop` so successful verification and a non-blocking review are independent completion requirements when the loop changed files.
- Keep plugin source and `.agents/skills` mirrors synchronized and cover behavior with regression tests.

Out of scope:

- No `ae-project-explore` skill in this pass.
- No Codex runtime registration E2E until a stable headless Codex registry/query surface exists.
- No OpenCode sessions, hooks, dynamic MCP registration, async bash, media fallback, graph telemetry, or UI-design agent runtime.
- No dependency, lockfile, plugin manifest, Git branch, commit, or push changes.

## Readiness

- Goal: implement the three prioritized Codex-native improvements from the upstream audit.
- Acceptance criteria:
  - Every catalog skill has exactly one supported tier and unfiltered help groups entries as core, docs, tools, then meta.
  - Filtered help shows only non-empty matching tier groups and continues to search existing skill fields.
  - Source and mirror catalogs remain identical and record upstream commit `00d7e9ca...`.
  - Design validation rejects mapping references to undeclared stable IDs.
  - Design validation rejects unsafe, missing, or out-of-design-directory Split Manifest files while accepting an updated canonical unified fixture with explicit stable-ID declarations.
  - `ae-task-loop` states that file-changing loops complete only when success criteria pass and review has no blocking findings; review failures return to the loop or produce a blocked/unverified exit.
  - Focused tests, `npm.cmd test`, `npm.cmd run check`, and `git diff --check` pass.
- Non-goals: runtime parity, new skill proliferation, telemetry, or automatic agent enforcement.
- Affected areas: Knowledge, Guardrail, Distribution, and durable upstream provenance memory.
- Validation surface: focused Node tests, full Node tests/checks, help output inspection, mirror/metadata/install checks, artifact checks, and final AE gate.
- Open questions: none.

## Assumptions

- The four tiers are catalog presentation metadata, not runtime permissions or automatic routing.
- Existing catalog order is preserved inside each tier.
- Tier assignment is fixed for this pass:
  - `core`: `ae-ideate`, `ae-brainstorm`, `ae-prd`, `ae-design`, `ae-lfg`, `ae-plan`, `ae-constitution`, `ae-tasks`, `ae-work`, `ae-refactor`, `ae-review`, `ae-frontend-design`, `ae-web-app`, `ae-web-forge`, `ae-backend`, `ae-debug`, `ae-task-loop`, `ae-tdd`, `ae-test-browser`, `ae-handoff`.
  - `docs`: `ae-doc-humanize`, `ae-doc-structure`, `ae-markitdown`, `ae-work-report`.
  - `tools`: `ae-claude-code`, `ae-sql`, `ae-swagger-parser`, `ae-static-server`, `ae-prompt-optimize`, `ae-save-experience`.
  - `meta`: `ae-help`, `ae-init`, `ae-skill-creator`, `ae-skill-audit`, `ae-agent-creator`, `ae-update`, `ae-language`.
- Stable IDs are declared by their canonical headings: `ADR-XXX` decision headings, `TC-XXX` test headings, and explicit `EP-XXX`, `T-XXX`, or `ST-XXX` declaration headings or labels in their owning dimension sections. Mapping-table references alone do not declare an ID.
- Split Manifest validation applies only to listed Markdown files other than the root `design.md`; unified contracts remain valid.
- `ae-task-loop` review is a process contract using available `ae-review`, not an unsupported automatic hook.

## Alternatives Considered

- Recommended: extend the existing catalog, checker, and task-loop skill with focused tests. This uses existing ownership boundaries and adds no dependencies.
- Alternative: add new tier, design, or loop helper modules. Rejected because each behavior is small and already has a clear owner.
- Alternative: copy upstream catalog services, designer-agent registry, or loop runtime. Rejected because those depend on OpenCode runtime behavior and would contradict the Codex-native boundary.

## Decision Drivers

- Driver 1: deterministic evidence should back workflow claims.
- Driver 2: changes must preserve the plugin-source and installed-mirror contract.
- Driver 3: improve discoverability and completion rigor without importing unsupported runtime machinery.

## Decisions

### ADR-1 - Keep tiers as presentation metadata

- Decision: store a `tier` on each skill catalog entry and group only help rendering.
- Drivers: the local catalog is the existing help source of truth; no routing behavior is requested.
- Alternatives: infer tiers from names or create separate catalog arrays.
- Why chosen: explicit metadata is stable, reviewable, and easy to validate.
- Consequences: every future skill entry must select one supported tier.
- Follow-ups: none in this pass.

### ADR-2 - Validate semantic references without parsing arbitrary Markdown semantics

- Decision: resolve stable IDs from canonical declarations and validate mapping references plus split paths using deterministic Markdown conventions.
- Drivers: current checker verifies shape but can accept dangling references.
- Alternatives: full Markdown AST or free-form semantic inference.
- Why chosen: standard-library parsing matches the repository's dependency policy and keeps failure messages deterministic.
- Consequences: the template and tests must make declaration conventions explicit.
- Follow-ups: broaden declaration forms only when a real design artifact demonstrates a supported missing form.

### ADR-3 - Review only gates a candidate successful loop exit

- Decision: invoke review after success criteria first pass, and return blocking findings to the loop instead of reviewing every iteration unconditionally.
- Drivers: completion must include quality evidence without multiplying review cost on obviously failing iterations.
- Alternatives: upstream-style review after every change or no review gate.
- Why chosen: preserves dual independent gates with lower workflow overhead.
- Consequences: unavailable review evidence prevents a success claim for file-changing loops.
- Follow-ups: none.

## Risks

- Catalog tier omissions could make help output incomplete or reorder skills unexpectedly.
- Stable-ID extraction could mistake mapping-table references for declarations or reject valid legacy designs.
- Split-path validation could escape the target design directory if path normalization is incomplete.
- Task-loop wording could overclaim automatic review execution rather than state an orchestrated process contract.

## Pre-Mortem

- Failure scenario 1: full help silently drops a skill with an invalid tier.
- Failure scenario 2: a malformed design passes because its dangling ID appears elsewhere only in a mapping table.
- Failure scenario 3: the task-loop reports success when review was unavailable or returned a blocking result.
- Mitigations: reject invalid/missing tiers in tests, use declaration-only ID extraction fixtures, test path traversal/missing split files, and assert explicit dual-gate language in source and mirror skills.

## Global Constraints

- Plugin source is canonical; every changed skill/reference/catalog file must match its `.agents/skills` mirror.
- Use Node.js standard library only; do not add dependencies or modify lockfiles.
- Preserve existing catalog entry order within tiers and existing legacy design compatibility outside the new semantic checks.
- Do not claim OpenCode hooks, automatic subagents, dynamic MCP registration, or runtime-enforced review.
- Use TDD for every behavior change: add a focused failing test, observe the expected failure, then implement the minimum passing behavior.

## Implementation Units

### U1 - Tiered capability catalog and help rendering

- Goal: make the flat capability list scannable while preserving filtering and entry details.
- Requirements covered: R1 catalog tiers, R2 deterministic tier order, R3 upstream freshness provenance.
- Acceptance criteria covered: every skill has a supported tier; full and filtered help group correctly; source/mirror and observed commit agree.
- Depends on: none.
- Files:
  - `tests/skill-scripts.test.mjs`
  - `plugins/ai-agent-engine-codex/skills/ae-help/references/capability-catalog.json`
  - `.agents/skills/ae-help/references/capability-catalog.json`
  - `plugins/ai-agent-engine-codex/scripts/ae-tools.mjs`
  - `docs/codex-port-analysis.md`
  - `docs/08-ai-memory/05-decision-log.md`
- Forbidden files:
  - `package-lock.json`
  - `plugins/ai-agent-engine-codex/.codex-plugin/plugin.json`
- Approach: add focused tests for allowed tiers, deterministic section order, filtered empty-section suppression, and the refreshed source commit; then add explicit tier fields and group the existing output loop.
- Tests: `node --test --test-name-pattern "tiered capability help" tests/skill-scripts.test.mjs`.
- Validation: `node scripts/ae-tools.mjs help`; `node scripts/ae-tools.mjs help design`; `node scripts/check-skill-mirror.mjs`.
- Rollback signals: any skill disappears, filters stop matching existing fields, or source/mirror catalogs diverge.
- Deferred to implementation: none.

### U2 - Design contract semantic reference and split validation

- Goal: reject internally inconsistent design contracts that currently satisfy only structural checks.
- Requirements covered: R4 stable-ID resolution, R5 split-path containment/existence, R6 legacy unified compatibility.
- Acceptance criteria covered: dangling mapping references and unsafe/missing split files fail with structured errors; updated canonical unified and sharded fixtures with explicit declarations pass.
- Depends on: none.
- Files:
  - `tests/skill-scripts.test.mjs`
  - `plugins/ai-agent-engine-codex/scripts/check-design-contract.mjs`
  - `plugins/ai-agent-engine-codex/skills/ae-design/SKILL.md`
  - `.agents/skills/ae-design/SKILL.md`
  - `plugins/ai-agent-engine-codex/skills/ae-design/references/design-contract-template.md`
  - `.agents/skills/ae-design/references/design-contract-template.md`
- Forbidden files:
  - `scripts/check-design-contract.mjs`
  - `package-lock.json`
- Approach: add isolated temporary-design fixtures for dangling IDs, traversal, missing files, and valid sibling shards; implement declaration extraction and safe manifest validation in the canonical plugin checker; document the enforced convention.
- Tests: `node --test --test-name-pattern "design contract semantic" tests/skill-scripts.test.mjs`.
- Validation: `node scripts/check-design-contract.mjs`; `node scripts/check-skill-mirror.mjs`.
- Rollback signals: the updated canonical valid fixture fails, historical artifacts outside `docs/ae/designs/**/design.md` are affected, or validation accepts a path outside its design directory.
- Deferred to implementation: support only declaration forms represented by the canonical design template and focused fixtures.

### U3 - Task-loop dual completion gate

- Goal: prevent file-changing exploratory loops from claiming success without both verification and review evidence.
- Requirements covered: R7 independent success and review gates, R8 blocking-review feedback, R9 unsupported-runtime boundary.
- Acceptance criteria covered: source and mirror describe the candidate-success review point, blocking feedback path, and unavailable-review outcome without claiming hooks or automatic agents.
- Depends on: none.
- Files:
  - `tests/skill-scripts.test.mjs`
  - `plugins/ai-agent-engine-codex/skills/ae-task-loop/SKILL.md`
  - `.agents/skills/ae-task-loop/SKILL.md`
- Forbidden files:
  - `plugins/ai-agent-engine-codex/skills/ae-review/**`
  - `package-lock.json`
- Approach: add focused source/mirror contract assertions first, then minimally extend workflow, loop state, exit rules, and boundaries.
- Tests: `node --test --test-name-pattern "task loop dual completion gate" tests/skill-scripts.test.mjs`.
- Validation: `node scripts/check-skill-mirror.mjs`; `node scripts/check-skill-contract.mjs`.
- Rollback signals: wording requires OpenCode-only `mode=autofix`, changes locked success criteria, or allows review to replace objective verification.
- Deferred to implementation: no deterministic review runner is added; orchestration remains skill-driven.

### U4 - Integrated review, validation, and delivery evidence

- Goal: prove the combined change preserves contracts and record the delivery gate.
- Requirements covered: R1-R9.
- Acceptance criteria covered: focused and full validation pass; review has no blocking findings; final gate proof records exact commands.
- Depends on: U1, U2, U3.
- Files:
  - `docs/00-process/active/upstream-workflow-optimization/progress.md`
  - `docs/ae/gates/<timestamp>-work-final.json`
- Forbidden files:
  - `package-lock.json`
- Approach: run cleanup inspection, session diff review with correctness/testing/standards/maintainability and architect lenses, fix deterministic in-scope findings, then run full verification and final gate.
- Tests: `npm.cmd test`; `npm.cmd run check`.
- Validation: `node scripts/check-skill-mirror.mjs`; `node scripts/check-skill-language-metadata.mjs`; `node scripts/check-skill-contract.mjs`; `node scripts/check-install-smoke.mjs`; `node scripts/check-ae-artifacts.mjs`; `node scripts/check-design-contract.mjs`; `git diff --check`.
- Rollback signals: any full check fails, a P0/P1 review finding remains, or catalog/help claims lack evidence.
- Deferred to implementation: no browser validation because no UI/runtime browser behavior changes.

## Consistency Check

- implementationUnitCount: 4
- sourceRequirementsCovered: R1-R9
- sourceRequirementsDeferred: none; audit-deferred features are explicit non-goals rather than requirements
- openQuestionsCount: 0

## Validation Plan

- Unit: three focused `node:test` patterns, each executed red then green.
- Integration: full `npm.cmd test` and `npm.cmd run check`.
- User flow: unfiltered and filtered `ae-tools.mjs help` output inspection.
- Data / operations: JSON parsing, catalog mirror equality, design path containment, and no persistent runtime operations.
- Observability: progress note, exact command results, review verdict, and final gate proof.

## Rollback / Recovery

- Revert U1 independently by removing tier metadata and restoring the flat help loop; keep source freshness notes only if still accurate.
- Revert U2 independently by restoring the prior checker and design guidance; focused fixtures identify the removed behavior.
- Revert U3 independently by restoring the prior task-loop source and mirror.
- If combined validation fails, isolate by the focused test names before changing another unit.

## Plan Self-Review

- Placeholder scan: no TBD, TODO, or unspecified implementation placeholder remains.
- Consistency check: units own disjoint production files except the shared test file; execution will therefore be serial in one worktree.
- Scope check: only the three prioritized recommendations and required provenance/validation artifacts are included.
- Acceptance coverage: R1-R9 map to U1-U4 and exact validation commands.
- Validation gaps: actual Codex registry E2E is intentionally out of scope because no stable headless surface was verified.
- Alternatives and ADR check: existing-owner changes were selected over new modules, dependencies, or upstream runtime ports.
- High-risk pre-mortem check: catalog loss, dangling-reference false negatives, path escape, and false-success loop exits have explicit tests and rollback signals.
- Document review: `APPROVE` after resolving explicit tier ownership and canonical fixture declaration consistency; no P0/P1 findings remain.

## Handoff

Implementation completed serially under `ae-work` with focused TDD cycles, session code review, full validation, and an AE final gate proof.

## Completion Record

- U1: added explicit `core/docs/tools/meta` catalog tiers, deterministic grouped help output, filtered empty-group suppression, and upstream source freshness `00d7e9ca...`.
- U2: added mapping-reference declaration checks, Split Manifest containment/existence/root checks, canonical declaration guidance, and traversal/missing/dangling regression coverage.
- U3: added the independent task-loop candidate-success review gate without runtime-hook claims.
- Review: document plan review `APPROVE`; code reviewer and architect lanes `APPROVE` after two deterministic checker boundary fixes; no blocking findings remain.
- Validation: focused red/green tests completed; `npm.cmd test` passed 78/78; `npm.cmd run check` passed; `git diff --check` passed; remote upstream ref remained `00d7e9ca7594945ac26a46fffc43ccd679cd461b`.
- Git operations: none.
