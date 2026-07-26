---
type: plan
status: completed
date: 2026-07-06
title: agent-skill-audit-optimization
origin: docs/ae/prds/2026-07-06-001-agent-skill-audit-optimization-prd.md
originFingerprint: 2026-07-06-agent-skill-audit-optimization
depth: standard
format: human-readable-plan
sharded: false
---

# Plan: agent-skill-audit-optimization

## Source

- PRD: `docs/ae/prds/2026-07-06-001-agent-skill-audit-optimization-prd.md`
- Audit report: `docs/ae/solutions/2026-07-06-karpathy-t3mp3st-five-layer-audit.md`
- External source 1: `multica-ai/andrej-karpathy-skills`, observed HEAD `2c606141936f1eeef17fa3043a72095b4765b9c2`.
- External source 2: `elder-plinius/T3MP3ST`, observed HEAD `a5667374bf34601ad87a7a9380b3926847ee3a41`.

## AI Parse Contract

- canonicalKind: plan
- humanEquivalent: true
- stableIdsRequired: true
- noImplicitScope: true

## Scope

Create a first-pass AE-native optimization that improves current skills and docs. The work should not copy external runtime behavior, create a new skill, add a dependency, or reorganize directories.

## Readiness

- Goal: make AE's behavioral invariants, five-layer architecture, evidence expectations, and claim-integrity review easier to apply consistently.
- Acceptance criteria:
  - External audit evidence remains traceable.
  - Five-layer map exists and points to current files.
  - Existing skills gain claim/evidence guidance where needed.
  - No external runtime, offensive tools, or hook enforcement is ported.
  - Mirror and validation checks pass.
- Non-goals:
  - No new `ae-claim-verify` or `ae-integrity-ledger` skill in this pass.
  - No T3MP3ST code, scripts, payloads, benchmark corpus, or MCP server.
  - No Karpathy text copied verbatim into multiple skills.
  - No forced directory migration to match the five-layer names.
- Affected areas:
  - `docs/ae/references/`
  - `plugins/ai-agent-engine-codex/skills/ae-skill-audit/SKILL.md`
  - `.agents/skills/ae-skill-audit/SKILL.md`
  - `plugins/ai-agent-engine-codex/skills/ae-prd/SKILL.md`
  - `.agents/skills/ae-prd/SKILL.md`
  - `plugins/ai-agent-engine-codex/skills/ae-plan/SKILL.md`
  - `.agents/skills/ae-plan/SKILL.md`
  - `plugins/ai-agent-engine-codex/skills/ae-review/SKILL.md`
  - `.agents/skills/ae-review/SKILL.md`
  - `plugins/ai-agent-engine-codex/skills/ae-work/SKILL.md`
  - `.agents/skills/ae-work/SKILL.md`
  - `plugins/ai-agent-engine-codex/skills/ae-save-experience/SKILL.md`
  - `.agents/skills/ae-save-experience/SKILL.md`
  - optional `README.en.md` or `README.md` architecture pointer if documentation discoverability requires it
- Validation surface:
  - mirror checks
  - language metadata checks
  - AE artifact checks
  - focused skill text tests if new invariants are expected to remain stable
  - full package check
- Open questions:
  - none. The PRD resolves the integrity ledger path as `docs/ae/integrity/`, starts claim verification as review guidance, and places behavioral invariants under `docs/ae/references/`.

## Assumptions

- First-pass implementation should optimize existing flows, not add a new public command surface.
- Existing `ponytail-minimality` and `claude-code-best-practice` adaptations already cover much of the Karpathy guidance.
- The highest-value gap from T3MP3ST is claim integrity, not security execution.
- The five-layer model should be an explanatory map for current AE paths.

## Alternatives Considered

- Recommended: add references and update existing skills with claim and architecture guidance.
- Alternative: create `ae-claim-verify` and `ae-integrity-ledger` immediately.
- Rejected because: no repeated local usage yet proves a new entrypoint is worth the catalog and maintenance cost.
- Alternative: install `andrej-karpathy-skills` as a bundled plugin.
- Rejected because: it duplicates AE behavior and creates a second source of truth.
- Alternative: port T3MP3ST's scripts.
- Rejected because: AGPL-3.0-or-later code is not suitable for direct inclusion in this GPL-2.0-only project, and most scripts serve a different security-testing product.

## Decision Drivers

- Driver 1: preserve Codex-native runtime boundaries.
- Driver 2: reduce unsupported claims and evidence gaps.
- Driver 3: improve contributor clarity with minimal catalog growth.

## Decisions

### ADR-1 - Existing Skills First

- Decision: improve `ae-skill-audit`, `ae-prd`, `ae-plan`, `ae-review`, `ae-work`, and `ae-save-experience` instead of adding new skills.
- Drivers: catalog focus, low maintenance overhead, existing responsibilities align.
- Alternatives: new claim-verifier skill; separate Karpathy skill; five-layer skill.
- Why chosen: the requested optimization is cross-cutting guidance, not a new workflow entrypoint.
- Consequences: changes must be small and tested so guidance does not become scattered.
- Follow-ups: revisit a new skill only after two or more future tasks need the same claim-verification workflow.

### ADR-2 - Evidence Mechanics Without Runtime Port

- Decision: adapt evidence, scope, claim, and integrity ledger mechanics as AE process contracts.
- Drivers: T3MP3ST's useful pattern is its proof discipline, not its arsenal.
- Alternatives: copy scripts; add benchmark harness; add hook enforcement.
- Why chosen: process contracts fit Codex skills and avoid license/runtime mismatch.
- Consequences: initial verification may remain manual until a deterministic AE-specific script is justified.
- Follow-ups: a future `scripts/check-claims.mjs` can be planned after the claim schema stabilizes.

### ADR-3 - Five-Layer Map As Documentation

- Decision: document the five layers as a map to current files and validation commands.
- Drivers: current project already has the structure, but users need placement guidance.
- Alternatives: create new layer directories; rename existing paths.
- Why chosen: documentation gives clarity without migration churn.
- Consequences: the map must explicitly mark unsupported hook/runtime assumptions.
- Follow-ups: installer docs may link to the map after it is reviewed.

## Risks

- Risk: claim-integrity guidance becomes too abstract to enforce.
  - Mitigation: require file paths, validation commands, or evidence IDs in affected outputs.
- Risk: five-layer terminology makes users think hooks are enforced.
  - Mitigation: label hooks as optional templates unless Codex support exists.
- Risk: Karpathy guidance duplicates prior minimality work.
  - Mitigation: create a small invariant reference and cross-link existing guidance instead of repeating prose.
- Risk: mirror drift.
  - Mitigation: update plugin source and `.agents` mirror in the same unit.

## Pre-Mortem

- Failure scenario 1: implementation creates a new skill too early and fragments the workflow.
- Failure scenario 2: docs claim deterministic claim verification but only manual review exists.
- Failure scenario 3: a skill update copies AGPL or MIT text directly and creates license ambiguity.
- Mitigations:
  - keep U1-U6 within existing skills and references,
  - mark scripts as deferred unless implemented,
  - rewrite all guidance in AE-native language.

## Global Constraints

- Do not copy T3MP3ST source, prompt text, scripts, payloads, or benchmark data.
- Do not copy Karpathy files verbatim unless a notice/license update is explicitly planned.
- Do not claim unsupported Codex hook enforcement.
- Keep all file paths repository-relative.
- Keep plugin source and `.agents` mirror synchronized.

## Implementation Units

### U1 - Add Five-Layer Architecture Reference

- Goal: document where Memory, Knowledge, Guardrail, Delegation, and Distribution live in this repository.
- Requirements covered: R3, R7, NFR1, NFR2.
- Acceptance criteria covered: contributors can map each layer to existing files; unsupported runtime assumptions are named.
- Depends on: none.
- Files:
  - `docs/ae/references/codex-five-layer-architecture.md`
- Forbidden files:
  - existing directory structure
  - installer scripts
- Approach:
  - Create a concise map of layer to existing paths, ownership, validation command, and unsupported assumptions.
  - Include an ASCII flow from user request to skill, gate, delegation, artifact, and plugin distribution.
- Tests:
  - `node scripts/check-ae-artifacts.mjs`
- Validation:
  - inspect the document for path accuracy
  - `node scripts/check-ae-artifacts.mjs`
- Rollback signals:
  - map suggests unsupported automatic hooks or global rule propagation.
- Deferred to implementation:
  - README link until the reference is reviewed.

### U2 - Add Behavioral Invariant Reference

- Goal: give AE skills a short canonical engineering behavior reference.
- Requirements covered: R2, R7, R8.
- Acceptance criteria covered: no Karpathy-named skill; no verbatim external text; current skills can cite the reference.
- Depends on: U1.
- Files:
  - `docs/ae/references/agent-engineering-invariants.md`
- Forbidden files:
  - `CLAUDE.md`
  - external clone files
- Approach:
  - Write AE-native invariants around assumptions, simplest sufficient path, scoped edits, and verified goals.
  - Cross-reference existing minimality and review behavior conceptually, not by copying external wording.
- Tests:
  - optional focused test if skills later depend on exact phrases.
- Validation:
  - `node scripts/check-ae-artifacts.mjs`
  - `git diff --check`
- Rollback signals:
  - text duplicates external source phrasing too closely or contradicts existing `ae-work` rules.
- Deferred to implementation:
  - exact skill cross-links happen in U3-U5.

### U3 - Strengthen Audit And Requirement Evidence Fields

- Goal: make audits and PRDs record evidence expectations for public or behavioral claims.
- Requirements covered: R1, R4, R8, R9.
- Acceptance criteria covered: audits and requirements separate evidence, assumptions, and unsupported runtime claims.
- Depends on: U1, U2.
- Files:
  - `plugins/ai-agent-engine-codex/skills/ae-skill-audit/SKILL.md`
  - `.agents/skills/ae-skill-audit/SKILL.md`
  - `plugins/ai-agent-engine-codex/skills/ae-prd/SKILL.md`
  - `.agents/skills/ae-prd/SKILL.md`
- Forbidden files:
  - `scripts/**`
  - external clone files
- Approach:
  - Add concise guidance for evidence IDs, observed commits, inspected files, claim provenance, and unsupported runtime assumptions.
  - Keep existing audit template compatible.
- Tests:
  - add focused assertions to `tests/skill-scripts.test.mjs` only if exact guidance should be regression-protected.
- Validation:
  - `node scripts/check-skill-mirror.mjs`
  - `node scripts/check-skill-language-metadata.mjs`
  - `node scripts/check-ae-artifacts.mjs`
- Rollback signals:
  - audit wording allows direct runtime ports or PRD wording promotes assumptions into requirements.
- Deferred to implementation:
  - any script-level claim verification.

### U4 - Add Plan And Work Claim Mapping

- Goal: ensure plans and work reports can show what evidence proves a changed claim.
- Requirements covered: R3, R4, R7, R9.
- Acceptance criteria covered: implementation units can identify layer ownership and evidence/validation surfaces.
- Depends on: U3.
- Files:
  - `plugins/ai-agent-engine-codex/skills/ae-plan/SKILL.md`
  - `.agents/skills/ae-plan/SKILL.md`
  - `plugins/ai-agent-engine-codex/skills/ae-work/SKILL.md`
  - `.agents/skills/ae-work/SKILL.md`
- Forbidden files:
  - historical plans under `docs/ae/plans/`
  - lockfiles
- Approach:
  - Add optional five-layer ownership to plan guidance for cross-cutting skill/plugin work.
  - Add final claim-evidence mapping guidance to `ae-work` when docs, README, installation behavior, or capability claims change.
- Tests:
  - mirror validation.
  - optional focused skill text test.
- Validation:
  - `node scripts/check-skill-mirror.mjs`
  - `npm run check`
- Rollback signals:
  - plan guidance becomes mandatory overhead for tiny tasks.
- Deferred to implementation:
  - adding fields to the plan template unless necessary.

### U5 - Add Claim-Integrity Review And Integrity Ledger Routing

- Goal: let reviews catch unsupported claims and route corrections to a durable ledger.
- Requirements covered: R5, R6, R8, R9.
- Acceptance criteria covered: unsupported claims can be findings; retractions have a home.
- Depends on: U3, U4.
- Files:
  - `plugins/ai-agent-engine-codex/skills/ae-review/SKILL.md`
  - `.agents/skills/ae-review/SKILL.md`
  - `plugins/ai-agent-engine-codex/skills/ae-save-experience/SKILL.md`
  - `.agents/skills/ae-save-experience/SKILL.md`
  - optional `docs/ae/integrity/README.md`
- Forbidden files:
  - `scripts/**` unless U6 explicitly adds a checker
- Approach:
  - Add a claim-integrity lane to `ae-review` for docs, benchmarks, public capabilities, installer behavior, and runtime support claims.
  - Add a routing rule in `ae-save-experience`: corrections and retractions go to an integrity ledger, not ordinary memory notes.
  - Create `docs/ae/integrity/README.md` only if a directory is chosen during implementation.
- Tests:
  - mirror validation.
  - artifact check if a new docs directory/file is added.
- Validation:
  - `node scripts/check-skill-mirror.mjs`
  - `node scripts/check-ae-artifacts.mjs`
- Rollback signals:
  - review lane duplicates security/correctness findings or produces vague style advice.
- Deferred to implementation:
  - deterministic claim checker.

### U6 - Validation And No-New-Skill Gate

- Goal: prove the first pass stayed within the approved scope.
- Requirements covered: R7, R8, R9, NFR2, NFR3.
- Acceptance criteria covered: validation commands pass; no new skill or external runtime is added.
- Depends on: U1, U2, U3, U4, U5.
- Files:
  - `tests/skill-scripts.test.mjs` only if focused assertions are added.
  - no planned production source files.
- Forbidden files:
  - `package-lock.json`
  - external clone files
  - T3MP3ST runtime files
- Approach:
  - Check that no new `.agents/skills/ae-*` directory was created.
  - Run targeted checks, then `npm run check`.
  - Record validation evidence in the final work report.
- Tests:
  - `node scripts/check-skill-mirror.mjs`
  - `node scripts/check-skill-language-metadata.mjs`
  - `node scripts/check-ae-artifacts.mjs`
  - `npm test`
  - `npm run check`
  - `git diff --check`
- Validation:
  - same as tests.
- Rollback signals:
  - any validation failure caused by the new guidance and not fixed in scope.
- Deferred to implementation:
  - `scripts/check-claims.mjs` as a separate future plan.

## Consistency Check

- implementationUnitCount: 6
- sourceRequirementsCovered: R1, R2, R3, R4, R5, R6, R7, R8, R9, NFR1, NFR2, NFR3
- sourceRequirementsDeferred: none
- openQuestionsCount: 0

## Validation Plan

- Unit:
  - focused `node --test` assertions if skill wording becomes a contract.
- Integration:
  - `node scripts/check-skill-mirror.mjs`
  - `node scripts/check-skill-language-metadata.mjs`
  - `node scripts/check-ae-artifacts.mjs`
- User flow:
  - run `node scripts/ae-tools.mjs help audit`
  - run `node scripts/ae-tools.mjs help review`
  - inspect that guidance remains discoverable without claiming unsupported runtime behavior.
- Data / operations:
  - no database, network, dependency, lockfile, or production-state operation.
- Observability:
  - final report lists changed files, validation commands, and any unverified claim.

## Rollback / Recovery

- Revert only the new reference docs and paired skill edits from the implementation pass.
- If claim-integrity guidance is too heavy, keep it in `ae-review` only and remove it from `ae-work`.
- If five-layer wording confuses runtime support, keep the path map but remove hook terminology.
- If a future deterministic checker is desired, write a separate PRD and plan for `scripts/check-claims.mjs`.

## Plan Self-Review

- Placeholder scan: pass; no `TBD` or placeholder sections remain.
- Consistency check: pass; every requirement maps to at least one unit.
- Scope check: pass; plan is documentation and skill-guidance only.
- Acceptance coverage: pass; no new skill is proposed in first pass.
- Validation gaps: deterministic claim verification is intentionally deferred.
- Alternatives and ADR check: pass.
- High-risk pre-mortem check: pass; runtime and license mismatch risks are addressed.

## Completion Record

- Completed: 2026-07-06.
- Execution route: `ae-lfg` with `ae-work` execution and `ae-review` follow-up.
- U1 result: added `docs/ae/references/codex-five-layer-architecture.md`.
- U2 result: added `docs/ae/references/agent-engineering-invariants.md`.
- U3 result: added evidence and claim provenance guidance to `ae-skill-audit` and evidence expectations to `ae-prd`, with `.agents/skills` mirror updates.
- U4 result: added five-layer ownership guidance to `ae-plan` and claim-evidence mapping to `ae-work`, with `.agents/skills` mirror updates.
- U5 result: added claim-integrity review guidance to `ae-review`, integrity ledger routing to `ae-save-experience`, and `docs/ae/integrity/README.md`.
- U6 result: added regression coverage in `tests/skill-scripts.test.mjs`; no new skill directory, dependency, lockfile, external runtime, or copied external source was added.
- Validation passed:
  - `node --test --test-name-pattern "agent skill audit optimization guidance" tests/skill-scripts.test.mjs`
  - `node scripts/check-skill-mirror.mjs`
  - `node scripts/check-skill-language-metadata.mjs`
  - `node scripts/check-skill-contract.mjs`
  - `node scripts/check-install-smoke.mjs`
  - `node scripts/check-ae-artifacts.mjs`
  - `npm test`
  - `npm run check`
  - `git diff --check`
- Review result: follow-up review found one lifecycle-state issue; this completion record and completed frontmatter resolve it.
- Final gate proof: `docs/ae/gates/20260706T063605Z-work-final.json`.
- Deferred work: deterministic `scripts/check-claims.mjs` remains intentionally deferred until an AE claim schema is stable.
