---
type: plan
status: completed
date: 2026-07-30
title: work-docs-evidence-governance
origin: docs/ae/prds/2026-07-30-work-docs-evidence-governance-prd.md
originFingerprint: 2026-07-30-work-docs-evidence-governance
depth: standard
format: human-readable-plan
sharded: false
---

# Plan: Work Docs Evidence Governance

## Source

- PRD: `docs/ae/prds/2026-07-30-work-docs-evidence-governance-prd.md`
- Cross-project evidence: the user-provided work documentation corpus observed on 2026-07-30, specifically the "Document Thumbnail STS Binding Analysis", "Document Thumbnail STS Binding Validation", and "Document Thumbnail STS Binding" archive index.

## AI Parse Contract

- canonicalKind: plan
- humanEquivalent: true
- stableIdsRequired: true
- noImplicitScope: true

## Scope

Add a conditional evidence-profile contract to existing AE requirement, plan, and review workflows. The profile makes the limit of each validation claim explicit and adds data-contract classification only where a change has a public, persistence, security, or external-service boundary.

## Readiness

- Goal: implement R1-R8 and NFR1-NFR3 without adding a new workflow root or importing target-project business content.
- Acceptance criteria: every validation or delivery claim is tied to an applicable proof tier, its preconditions, result status, and residual risk.
- Non-goals: automatic test execution, browser/deployment automation, a persistent evidence service, or automatic archive/memory updates.
- Affected areas: paired `ae-brainstorm`, `ae-prd`, `ae-plan`, and `ae-review` guidance; the plan template; new plan-owned evidence-profile reference; focused skill-script tests; distribution metadata only when this scope is released.
- Validation surface: focused Node semantic tests, mirror/contract checks, artifact validation, install smoke, package checks, and `git diff --check`.
- Open questions: none. The release version was reconciled during execution from `0.3.4` to `0.3.5` after required validation passed.

## Assumptions

- Existing `ae-work` and `ae-test-browser` already own executing runtime and browser checks; this work only improves how upstream artifacts request and report them.
- The delivered candidate-governance change at `4afb2d7` and its `0.3.4` manifests are the baseline. This plan must neither rewrite that scope nor preselect its next release version.
- The generic proof tiers are useful across backend, frontend, data, and deployment tasks, but task routing must select only tiers relevant to the changed boundary.

## Alternatives Considered

- Recommended: extend the four current skills with one plan-owned evidence profile, an evidence matrix, and review checks.
- Alternative: create `ae-verification` or `ae-evidence-ledger` as a new skill.
  Rejected because: existing ownership is clear and a new entrypoint would not add an enforceable Codex runtime capability.
- Alternative: copy the user-provided source-project corpus's directory conventions and reports into this plugin.
  Rejected because: those artifacts encode target-project paths, conventions, and domain data; only the underlying proof discipline is portable.
- Alternative: require every implementation to reach browser and deployment acceptance.
  Rejected because: it would manufacture irrelevant work and still could not guarantee access to the required environment.

## Decision Drivers

- Driver 1: prevent evidence overclaims without creating bureaucratic mandatory checklists.
- Driver 2: preserve data/API contract semantics across durable, derived, and caller-controlled values.
- Driver 3: keep source/mirror distribution and the delivered candidate-governance scope safe from overlap.

## Decisions

### ADR-1 - Use Conditional Evidence Profiles

- Decision: record only applicable proof tiers: static inspection, focused automated tests, integration/build, runtime health, authenticated service smoke, browser acceptance, and deployment/operations.
- Drivers: R1-R3, NFR3.
- Alternatives: one undifferentiated `validation` field; a mandatory full-stack checklist.
- Why chosen: the profile states both the evidence strength and its boundary, while allowing `not-applicable`, `blocked`, or `unverified` to remain truthful.
- Consequences: plans and reviews become slightly more structured; execution remains with existing skills and tools.
- Follow-ups: add a replay-based skill-behavior evaluator only after Codex has a deterministic trace and scoring boundary.

### ADR-2 - Classify Contract Values At Real Boundaries

- Decision: high-risk plans distinguish canonical persisted values, derived or ephemeral output, caller-controlled input, and compatibility fallback/source precedence.
- Drivers: R4, R5, NFR1.
- Alternatives: a global data-governance checklist for every plan; leaving this solely to backend implementation judgment.
- Why chosen: this catches durable-versus-signed/derived confusion without forcing data modeling into document-only or isolated UI work.
- Consequences: plan authors must explain intentional fallbacks; reviewers gain a concrete basis for contract findings.
- Follow-ups: keep exact framework and storage validation in `ae-backend` or target-project rules, not this generic profile.

### ADR-3 - Preserve Evidence And Archive Promotion As Separate States

- Decision: plans name the intended active evidence, final delivery evidence, and optional archive/memory promotion decision; they never promote transient results automatically.
- Drivers: R3, R5, R6, NFR3.
- Alternatives: automatically archive every command result; omit archive obligations entirely.
- Why chosen: it retains the useful index discipline observed in the user-provided source-project corpus without turning logs or sensitive runtime output into durable knowledge.
- Consequences: execution handoffs state what was archived and why; secrets and private response material remain excluded.
- Follow-ups: assess whether `ae-save-experience` needs a separate archive-routing change only after this profile has real task evidence.

## Risks

- The evidence profile may be treated as a full mandatory checklist.
- A generic data-contract section may bloat small plans.
- Focused static tests can protect wording but cannot prove model compliance under every natural-language prompt.
- Coordinated release work may collide with the user-owned candidate-governance change.

## Pre-Mortem

- Failure scenario 1: a plan says browser acceptance passed because its unit tests passed.
  Mitigation: enforce tier, precondition, result status, and bounded claim in the plan and review contracts.
- Failure scenario 2: a durable field is populated with an expiring URL or caller-supplied identity.
  Mitigation: require canonical/derived/trust-boundary classification whenever a data/API/security boundary exists.
- Failure scenario 3: the evidence profile becomes a generic compliance document for trivial fixes.
  Mitigation: state `not-applicable` selection rules and keep the reference owned by `ae-plan`.
- Failure scenario 4: implementation regresses delivered candidate-governance behavior or releases a mismatched version.
  Mitigation: mark that file set forbidden, retain serial execution, and read the execution-time manifest pair before any version edit.

## Global Constraints

- Use generic category names; do not copy source-project code, paths, sample identifiers, credentials, or source prose.
- Do not add a skill directory, runtime dependency, hook, scheduler, automatic browser/deployment action, or automatic memory write.
- Update plugin source and `.agents/skills` mirrors together; do not modify candidate-governance source or tests, and read current manifests before selecting a release version.
- Preserve user-owned dirty files and stage only task-owned files when execution is separately authorized.

## Implementation Units

### U1 - Define The Plan-Owned Evidence Profile

- Goal: create one concise, conditional evidence vocabulary that later skill bodies can reference without duplicating tier definitions.
- Requirements covered: R1, R2, R3, NFR1, NFR3.
- Acceptance criteria covered: tier selection, exact preconditions, result status, bounded claims, and explicit unverified evidence.
- Depends on: none.
- Files: `plugins/ai-agent-engine-codex/skills/ae-plan/references/validation-evidence-profile.md`, `.agents/skills/ae-plan/references/validation-evidence-profile.md`, `tests/skill-scripts.test.mjs`.
- Forbidden files: `package.json`, `plugins/ai-agent-engine-codex/.codex-plugin/plugin.json`, all `ae-skill-creator/**` and `ae-save-experience/**` files, lockfiles.
- Approach: define tier selection rules, statuses (`passed`, `failed`, `blocked`, `not-applicable`, `unverified`), preconditions, prohibited inference, and a compact acceptance-to-proof matrix. Include an archive/memory promotion decision field but no automatic action.
- Tests: add a narrowly named semantic test for source/mirror equivalence and profile sections; avoid snapshots and external text assertions.
- Validation: `node --test --test-name-pattern "validation evidence governance" tests/skill-scripts.test.mjs`; `node scripts/check-skill-mirror.mjs`; `node scripts/check-skill-contract.mjs`.
- Rollback signals: profile requires all tiers for all plans, contains target-project business language, or overlaps the candidate-governance scope.
- Deferred to implementation: choose exact headings after checking current skill-reference naming conventions.

### U2 - Add Evidence Selection To Requirements And Plans

- Goal: make evidence limits visible before code execution, while keeping small work lightweight.
- Requirements covered: R1, R2, R3, R4, R8, NFR1, NFR2, NFR3.
- Acceptance criteria covered: selected evidence profile, data-contract classification where applicable, matrix coverage for high-risk acceptance criteria, and no forced irrelevant validation.
- Depends on: U1.
- Files: `plugins/ai-agent-engine-codex/skills/ae-brainstorm/SKILL.md`, `.agents/skills/ae-brainstorm/SKILL.md`, `plugins/ai-agent-engine-codex/skills/ae-prd/SKILL.md`, `.agents/skills/ae-prd/SKILL.md`, `plugins/ai-agent-engine-codex/skills/ae-prd/references/requirements-capture.md`, `.agents/skills/ae-prd/references/requirements-capture.md`, `plugins/ai-agent-engine-codex/skills/ae-plan/SKILL.md`, `.agents/skills/ae-plan/SKILL.md`, `plugins/ai-agent-engine-codex/skills/ae-plan/references/plan-template.md`, `.agents/skills/ae-plan/references/plan-template.md`, `tests/skill-scripts.test.mjs`.
- Forbidden files: `plugins/ai-agent-engine-codex/skills/ae-skill-creator/**`, `.agents/skills/ae-skill-creator/**`, `package.json`, `plugins/ai-agent-engine-codex/.codex-plugin/plugin.json`, lockfiles.
- Approach: add a short readiness decision to brainstorm and PRD guidance; reference the profile from planning guidance; extend only the PRD and plan templates with conditional sections for validation profile, contract-value classification, and an evidence matrix. Explicitly mark the sections optional when their trigger is absent.
- Tests: extend U1's focused semantic test to assert the trigger, no-tier-promotion boundary, and source/mirror parity for every touched resource.
- Validation: U1 validation plus `node scripts/check-ae-artifacts.mjs` to validate any added artifact contract examples.
- Rollback signals: small plan examples now require unnecessary data/API sections, cross-skill references break installed mirror paths, or the language claims execution happened automatically.
- Deferred to implementation: place the repository-relative reference link and one-sentence tier-selection summary using the existing `ae-plan` naming convention.

### U3 - Add Evidence-Promotion Review Checks

- Goal: let document and code reviews detect overclaims, canonical/derived contract confusion, and silently omitted unrelated failures.
- Requirements covered: R4, R5, R6, R8, NFR2, NFR3.
- Acceptance criteria covered: evidence-tier integrity, contract classification, bounded residual risk, and disclosed unrelated failures.
- Depends on: U1, U2.
- Files: `plugins/ai-agent-engine-codex/skills/ae-review/SKILL.md`, `.agents/skills/ae-review/SKILL.md`, `plugins/ai-agent-engine-codex/skills/ae-review/references/review-output-template.md`, `.agents/skills/ae-review/references/review-output-template.md`, `tests/skill-scripts.test.mjs`.
- Forbidden files: `plugins/ai-agent-engine-codex/skills/ae-skill-creator/**`, `.agents/skills/ae-skill-creator/**`, `package.json`, `plugins/ai-agent-engine-codex/.codex-plugin/plugin.json`, lockfiles.
- Approach: extend the existing claim-integrity lane instead of creating a new reviewer persona. Require evidence-tier labels only for material validation claims, require an explicit reason for scoped unrelated failures, and produce an `unverified` or residual-risk entry when no higher-tier proof exists.
- Tests: extend the focused semantic test for wording, source/mirror equality, and the review-template evidence fields.
- Validation: U1 validation; `node scripts/check-skill-mirror.mjs`; `node scripts/check-skill-contract.mjs`; `node scripts/check-ae-artifacts.mjs`.
- Rollback signals: review converts known unrelated failures into a silent exclusion, flags a missing non-applicable tier as a defect, or makes unchecked claims look passed.
- Deferred to implementation: exact review-template field names, provided the output remains concise for report-only reviews.

### U4 - Reconcile, Validate, And Release The Combined Scope

- Goal: validate the evidence-governance change without regressing the delivered candidate-governance baseline.
- Requirements covered: R7, R8, NFR1, NFR2, NFR3.
- Acceptance criteria covered: mirrors and contracts are verified; no external/project-specific content is added; distribution version consistency is decided after scope reconciliation.
- Depends on: U1, U2, U3.
- Files: task-owned PRD and plan artifacts under `docs/ae/prds/` and `docs/ae/plans/`; local review evidence under the ignored `docs/ae/reviews/`; a tracked process/archive summary under `docs/00-process/active/` then `docs/00-process/archive/` only when the task or user requires durable delivery evidence; plus `package.json` and `plugins/ai-agent-engine-codex/.codex-plugin/plugin.json` only if the reconciled release decision authorizes a version update.
- Forbidden files: the user-provided source-project corpus, external clones, lockfiles, secret references, candidate-governance files unless the user explicitly merges the scopes.
- Approach: review the scoped changed-file inventory against the `4afb2d7` baseline; verify each manifest's current SemVer before choosing a single release bump; retain focused test output separately from full package validation; archive only sanitized durable outcome records when required. Do not force-stage ignored review evidence; adding it with `git add -f` requires explicit user authorization.
- Tests: `npm.cmd test`; `npm.cmd run check`; focused evidence-governance test; `git diff --check`.
- Validation: mirror, language metadata, skill contract, install smoke, artifact checks, and a document review of the final PRD/plan/evidence record.
- Rollback signals: manifest versions differ, install smoke fails, the review finds cross-scope overlap, or any artifact claims runtime/browser acceptance without evidence.
- Execution result: version `0.3.5` was selected from the `0.3.4` execution-time baseline. The final gate uses its generated UTC path; commit and push remain user-controlled Git operations.

## Consistency Check

- implementationUnitCount: 4
- sourceRequirementsCovered: R1, R2, R3, R4, R5, R6, R7, R8, NFR1, NFR2, NFR3
- sourceRequirementsDeferred: none
- openQuestionsCount: 0

## Validation Plan

- Unit: focused semantic tests and direct source/mirror comparisons for the evidence profile and each changed instruction/reference.
- Integration: `npm.cmd test`, `npm.cmd run check`, mirror/contract/install/artifact checks, and `git diff --check`.
- User flow: inspect a representative high-risk plan and review output to confirm a focused test does not become a browser/deployment claim.
- Data / operations: no target-project data, external service, deployment, credential, or browser run is performed by this skill-package change.
- Observability: preserve exact sanitized command results, document review outcome, final gate status, and an archive/promotion decision without persisting secret-bearing runtime artifacts.

## Rollback / Recovery

- Revert only the U1-U4 task-owned skill/reference/template/test/document changes as one coherent guidance update.
- If the profile proves too heavy, retain existing validation guidance and remove the new conditional reference rather than splitting verification into a new skill.
- If later work changes the same release state, stop before metadata edits and reconcile scope, test inventory, and version in a new reviewed plan revision.

## Plan Self-Review

- Placeholder scan: pass; the execution-time version is `0.3.5`, the final gate uses its generated UTC path, and commit/push remain unselected user-controlled operations.
- Consistency check: pass; each R/NFR has an implementation owner and validation surface.
- Scope check: pass; no product repository, runtime automation, or new skill is introduced.
- Acceptance coverage: pass; validation evidence, contract classification, review integrity, and mirror safety are all mapped.
- Validation gaps: static skill tests cannot prove every future model follows the guidance; a deterministic trace-replay runner remains out of scope.
- Alternatives and ADR check: pass; a new skill and mandatory full-stack checklist are explicitly rejected.
- High-risk pre-mortem check: pass; cross-scope release collision is a named stop condition.

## Handoff

The `4afb2d7` candidate-governance delivery remained an immutable scope boundary. Execution used serial ownership for U1-U4, selected version `0.3.5` from the execution-time manifest pair, and performed no Git writes.
