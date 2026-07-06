---
type: prd
status: completed
date: 2026-07-06
topic: agent-skill-audit-optimization
format: human-readable-requirements
sharded: false
---

# PRD: Agent Skill Audit Optimization

## Source

- User request: create an audit plan and analyze whether `andrej-karpathy-skills`, `T3MP3ST`, and a five-layer Codex configuration template can optimize this project.
- Audit report: `docs/ae/solutions/2026-07-06-karpathy-t3mp3st-five-layer-audit.md`
- External source 1: `https://github.com/multica-ai/andrej-karpathy-skills`, observed HEAD `2c606141936f1eeef17fa3043a72095b4765b9c2`.
- External source 2: `https://github.com/elder-plinius/T3MP3ST`, observed HEAD `a5667374bf34601ad87a7a9380b3926847ee3a41`.
- Architecture source: user-supplied five-layer Codex template.

## AI Parse Contract

- canonicalKind: requirements
- humanEquivalent: true
- stableIdsRequired: true
- noImplicitScope: true

## Problem

The current AE project already has strong Codex-native skill, plugin, mirror, validation, and documentation workflows. The remaining weakness is that several cross-cutting ideas are distributed across many skills and docs:

- behavioral invariants are repeated instead of canonicalized,
- public claims and workflow claims are not uniformly tied to evidence,
- correction/retraction history is not first-class,
- the Memory / Knowledge / Guardrail / Delegation / Distribution architecture is present but not documented as a single operating model.

## Goals

- Improve current AE skills and docs using external patterns without copying external runtime behavior.
- Preserve the current plugin source plus `.agents/skills` mirror model.
- Make claim provenance and evidence expectations clearer for docs, skill changes, and workflow outputs.
- Make the five-layer architecture explicit for contributors and downstream installers.
- Avoid adding new skills unless existing boundaries prove insufficient.

## Requirements

### R1 - External Audit Evidence

`ae-skill-audit` must keep recording external source freshness, license, inspected files, runtime-specific assumptions, and adaptation boundaries.

Acceptance: a future audit report includes `sourceUrl`, `observedCommit`, `refSource`, `inspectedFiles`, license notes, runtime-boundary classification, and a verdict.

### R2 - Canonical Behavioral Invariants

The project should have a concise AE-native reference for coding-agent behavior: think before coding, simplicity first, surgical changes, and verified goals.

Acceptance: existing skills can reference or embed this behavior without copying external text verbatim or creating a separate Karpathy-named skill.

### R3 - Five-Layer Architecture Map

The project should document how existing AE artifacts map to Memory, Knowledge, Guardrail, Delegation, and Distribution layers.

Acceptance: contributors can identify which existing files own each layer and which runtime assumptions are unsupported in Codex.

### R4 - Evidence And Claim Provenance

Workflow outputs that make capability, benchmark, install, or behavior claims should identify their evidence source.

Acceptance: plans, reviews, work reports, or docs that change public claims include either evidence file references, validation commands, or explicitly marked assumptions.

### R5 - Integrity Ledger

The project should have a lightweight place to record corrected claims, retractions, or methodology fixes.

Acceptance: a future correction can be recorded without hiding it in unrelated experience notes or rewriting history.

### R6 - Claim-Integrity Review Lane

`ae-review` should be able to review docs and workflow artifacts for unsupported claims, stale numbers, missing evidence, and runtime-overclaiming.

Acceptance: review findings can flag claims whose evidence is missing, stale, unverifiable, or derived from unsupported runtime behavior.

### R7 - Minimal First Implementation

The first implementation pass should improve existing skills and docs only.

Acceptance: no new skill is created in the first pass; no external scripts, payloads, hooks, or plugin runtime are copied.

### R8 - License-Safe Adaptation

External repositories must be used as reference input, not source text or code to vendor.

Acceptance: implementation uses AE-native wording; any source-derived copying requires a separate notice/license decision before merge.

### R9 - Mirror And Distribution Consistency

Any skill changes must keep plugin source and `.agents/skills` mirror consistent.

Acceptance: `node scripts/check-skill-mirror.mjs` passes after implementation.

## Non-Functional Requirements

### NFR1 - Codex Runtime Compatibility

The project must not claim Codex enforces hooks, slash commands, or subagent registries unless those capabilities exist in the current Codex environment.

Acceptance: unsupported runtime behavior is documented as template, optional guidance, or rejected.

### NFR2 - Low Maintenance Overhead

The optimization should reduce repeated judgment without adding broad catalog sprawl.

Acceptance: the first pass changes a small set of existing files and avoids new dependencies.

### NFR3 - Validation

The change must be validated with project-local checks.

Acceptance: validation includes mirror, metadata, artifact, tests, and full package checks where relevant.

## Decisions

### D1 - Verdict On External Inputs

Decision: adapt all three inputs selectively.

Acceptance: Karpathy contributes behavioral invariants, T3MP3ST contributes evidence and claim-integrity mechanics, and the five-layer model contributes architecture documentation.

### D2 - First-Pass Boundary

Decision: do not create new skills in the first pass.

Acceptance: changes land in existing AE skills, docs, and templates unless implementation proves the workflow cannot fit.

### D3 - License Boundary

Decision: no direct copying from T3MP3ST and no verbatim reuse from Karpathy files without a separate notice pass.

Acceptance: implementation is paraphrased and AE-native.

## Assumptions

- The user wants an audit and implementation plan, not immediate skill implementation.
- Existing AE minimality and Claude best-practice adaptations remain valid and should not be duplicated.
- `T3MP3ST` is useful for integrity mechanics, not for its security-testing runtime.
- Five-layer terms are useful as an explanatory map, not as a forced directory migration.

## Resolved Questions

- RQ1: The integrity ledger starts under `docs/ae/integrity/` because corrections and retractions are neither ordinary reviews nor reusable experience notes.
- RQ2: Claim verification starts as manual review guidance plus evidence requirements. A deterministic `scripts/check-claims.mjs` remains deferred until a stable claim schema exists.
- RQ3: Behavioral invariants start as `docs/ae/references/agent-engineering-invariants.md`, with existing skills referencing the contract through their own AE-native wording.

## Validation Expectations

- `node scripts/check-skill-mirror.mjs`
- `node scripts/check-skill-language-metadata.mjs`
- `node scripts/check-ae-artifacts.mjs`
- `npm run check`
- `git diff --check`

## Consistency Check

- requirementCount: 9
- nonFunctionalRequirementCount: 3
- decisionCount: 3
- openQuestionCount: 0

## Completion

- Completed: 2026-07-06
- Outcome: implemented as a first-pass AE-native optimization without adding new skills, external runtime files, dependencies, or copied external source.
- Implemented artifacts:
  - `docs/ae/references/codex-five-layer-architecture.md`
  - `docs/ae/references/agent-engineering-invariants.md`
  - `docs/ae/integrity/README.md`
  - paired plugin source and `.agents/skills` updates for `ae-skill-audit`, `ae-prd`, `ae-plan`, `ae-work`, `ae-review`, and `ae-save-experience`
  - `tests/skill-scripts.test.mjs`
- Validation evidence:
  - `npm test`
  - `npm run check`
  - `git diff --check`
  - final gate proof: `docs/ae/gates/20260706T063605Z-work-final.json`
