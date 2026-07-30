---
type: prd
status: completed
date: 2026-07-30
topic: work-docs-evidence-governance
format: human-readable-requirements
sharded: false
---

# Work Docs Evidence Governance

## AI Parse Contract

- canonicalKind: requirements
- humanEquivalent: true
- stableIdsRequired: true
- noImplicitScope: true

## Problem Frame

The user-provided work documentation corpus observed on 2026-07-30 contains repeated, production-relevant lessons that the current AE workflow expresses only partially: a focused test, build, static check, health check, authenticated API smoke, browser acceptance, and deployment acceptance prove different claims. It also records durable versus derived data contracts, source precedence, security ownership checks, and an archive index that preserves what was proved and what remains unverified.

The outcome is a compact, Codex-native evidence-governance extension to the existing requirement, plan, and review skills. It must improve the quality of future plans and reviews without importing source-project business rules, adding a new skill, or treating every validation tier as mandatory.

## Requirements

**Evidence Profile**

- R1. `ae-brainstorm`, `ae-prd`, and `ae-plan` must select the smallest applicable validation-evidence profile for behavior that crosses a public API, data, external-service, deployment, or browser boundary.
  Acceptance: A significant requirement and its implementation plan identify applicable proof tiers, exact expected signal, environment preconditions, and a separately named `unverified` tier when a credible proof cannot run.
- R2. The evidence profile must distinguish static inspection, focused automated tests, integration or build checks, runtime health, authenticated API or service smoke, browser acceptance, and deployment or operational checks.
  Acceptance: Skill guidance says that a lower tier cannot imply a higher tier, and does not require irrelevant tiers for a scoped change.
- R3. `ae-plan` must map each high-risk acceptance criterion to a proof, an owning environment or actor, and a recovery or rollback signal.
  Acceptance: The plan template provides a concise evidence matrix; it supports a blocked or deferred proof without changing the success criterion.

**Contract And Review Integrity**

- R4. When a plan or review changes a durable data or API contract, it must identify canonical persisted values, derived or ephemeral representations, trust boundaries, and any intentional source-precedence or compatibility fallback.
  Acceptance: The plan guidance requires this classification only when data/API/security boundaries exist, and the review guidance can flag a claim that mistakes a derived value, signed URL, cache, or test fixture for the canonical contract.
- R5. `ae-review` must classify evidence claims by their proven tier and flag an invalid promotion, such as treating a focused test as browser acceptance or a graph snapshot as a persisted dependency graph.
  Acceptance: The claim-integrity lane includes evidence-tier checks and requires residual risk or an `unverified` status for missing higher-tier proof.
- R6. Reviews must keep pre-existing unrelated failures separate from scoped validation, including the reason they do not invalidate the reported targeted result.
  Acceptance: The review output contract provides an explicit place for known unrelated failures and prevents them from being silently omitted.

**Distribution Safety**

- R7. Every changed skill or reference must remain byte-equivalent between `plugins/ai-agent-engine-codex/skills` and `.agents/skills` after line-ending normalization.
  Acceptance: Mirror, contract, artifact, and focused semantic tests pass before a release is claimed.
- R8. This initiative must remain independent from the delivered `ecc-skill-candidate-governance` change.
  Acceptance: No candidate-governance file or test assertion is modified solely by this initiative; any version bump is selected from the execution-time manifest baseline and reviewed as part of this scope.

## Non-Functional Requirements

- NFR1. The guidance must be stack-neutral and must not import business names, OSS paths, credentials, tokens, URLs, database samples, or environment details from the source-project corpus.
  Acceptance: The implementation uses generic evidence tiers and abstract contract categories only.
- NFR2. The change must not add a new skill, dependency, hook, external runtime, automatic browser runner, automatic deployment action, or automatic memory update.
  Acceptance: The diff is limited to existing skill guidance/references, mirrors, focused tests, required distribution metadata, and AE delivery evidence.
- NFR3. The evidence profile must make absent evidence visible instead of fabricating pass status or forcing a broad test suite with known unrelated failures.
  Acceptance: Every profile entry has one of `passed`, `failed`, `blocked`, `not-applicable`, or `unverified` status and a bounded claim.

## Success Criteria

- A future plan can state exactly what a focused test proves, what requires a running environment, and what remains unverified.
- A future review can reject an evidence overclaim without demanding irrelevant validation.
- Data/API plans preserve the distinction between canonical stored state and derived, temporary, or caller-controlled values.
- The upgrade remains a small extension to existing AE skills and preserves plugin/mirror distribution safety.

## Scope Boundary

### In Scope

- Existing `ae-brainstorm`, `ae-prd`, `ae-plan`, and `ae-review` skill source, mirrors, and their directly owned references/templates.
- Focused regression tests for evidence-tier language and source/mirror parity.
- A release-safe documentation and validation plan for the distributable skill update.

### Out Of Scope

- Product code or documentation changes in the user-provided source-project corpus.
- A universal test runner, external-service emulator, browser/deployment automation, or evidence database.
- New workflow skill names, automatic archive promotion, automatic memory updates, or semantic grading of arbitrary model tool traces.
- Changes to the active `ecc-skill-candidate-governance` implementation.

### Constraints

- Each evidence tier is conditional on the changed behavior; no fixed checklist may imply all tiers apply.
- Secrets, private responses, signed URLs, production host details, and real data identifiers must remain outside plans, reviews, and evidence artifacts.
- The plugin source remains canonical; mirrors and distributable version metadata are updated only as one reviewed delivery.

## Key Decisions

- D1. `ae-plan` owns the conditional evidence profile; its plan template provides the evidence-matrix entry point, rather than creating a new verification skill.
  Reason: The existing skills already own requirement discovery, planning, and review; a plan-local reference centralizes the vocabulary while the template makes its use discoverable without a new entrypoint.
- D2. Treat the user-provided source-project corpus as evidence for reusable failure modes, not as a template to copy.
  Reason: Its Java, STS, OSS, and project documentation conventions are not universal, while the proof-boundary method is portable.
- D3. Make archive and memory promotion a planned handoff output, not an automatic side effect.
  Reason: Durable knowledge needs human judgment; active evidence and one-off command output must not become permanent policy automatically.

## Dependencies And Assumptions

### Dependencies

- `scripts/check-skill-mirror.mjs`, `scripts/check-skill-contract.mjs`, `scripts/check-ae-artifacts.mjs`, and `tests/skill-scripts.test.mjs` remain the validation foundation.
- Existing `ae-work` local runtime smoke and `ae-test-browser` references remain the execution path for runtime and browser proof.

### Assumptions

- The user-provided source-project corpus remains reference material; the plan needs no write access outside this repository.
- The delivered candidate-governance change at `4afb2d7` remains outside this scope; its `0.3.4` manifests are the current baseline.

## Open Questions

### Must Resolve Before Planning

- None.

### Resolved During Execution

- R7 release resolution: the execution-time `0.3.4` manifest baseline was incremented consistently to `0.3.5` after the focused test, full suite, package check, mirror, contract, artifact, and install-smoke validations passed.

## Evidence Notes

- Proof-tier separation -> Evidence: the user-provided corpus's "Document Thumbnail STS Binding Validation" report records focused service/controller checks separately from the still-unverified authenticated browser direct-upload flow.
- Canonical versus derived value -> Evidence: the user-provided corpus's "Document Thumbnail STS Binding Analysis" distinguishes persisted bucket-relative object keys from generated signed preview URLs.
- Durable archive index -> Evidence: the user-provided corpus's "Document Thumbnail STS Binding" archive index separates PRD, plan, review, analysis, API contract, validation, and graph limitations.
- Current AE boundaries -> Evidence: `docs/ae/constitution.md`, `plugins/ai-agent-engine-codex/skills/ae-work/SKILL.md`, and `plugins/ai-agent-engine-codex/skills/ae-review/SKILL.md`.

## Consistency Check

- requirementsCount: 8
- nonFunctionalRequirementsCount: 3
- decisionsCount: 3
- openQuestionsCount: 0
