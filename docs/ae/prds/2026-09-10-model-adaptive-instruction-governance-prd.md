---
type: prd
status: review-passed
date: 2026-09-10
topic: model-adaptive-instruction-governance
format: human-readable-requirements
sharded: false
---

# Model-Adaptive Instruction Governance

## AI Parse Contract

- canonicalKind: requirements
- humanEquivalent: true
- stableIdsRequired: true
- noImplicitScope: true

## Problem Frame

The AE plugin has strong safety and evidence contracts, but its generated `AGENTS.md` is thin on failure handling, structural-fix decisions, validation order, and final diff review. The wider skill set also repeats orchestration rules without one explicit model-neutral contract. Newer high-capability models can therefore over-follow ceremony, infer unsupported runtime capabilities, or miss the intended stop and evidence boundaries.

The desired outcome is a concise capability-driven instruction layer that works across GPT-5.6, GPT-6, and later Codex models without branching on model names, private reasoning, context size, or hard-coded reasoning-effort values.

## Requirements

- R1. Generated `AGENTS.md` must add fail-visible guidance: no fabricated success, swallowed errors, or silent fallback added merely to pass a task.
- R2. Generated `AGENTS.md` must distinguish local fixes from structural fixes when shared contracts, duplicated business logic, state synchronization, permissions, schemas, or data-integrity boundaries are involved.
- R3. Generated validation guidance must order repository-confirmed checks from focused behavior through static/type checks, affected builds, and smoke checks when those commands exist; it must not invent commands.
- R4. Generated guidance must require a final scoped diff review for duplicate logic, hidden fallback, second sources of truth, unmentioned behavior changes, weak tests, and security regressions.
- R5. Core AE orchestration skills must use task risk, acceptance criteria, active tool schemas, and observed capability as execution inputs. They must not branch behavior on a model label or assume a reasoning-effort value.
- R6. Core skills must preserve progressive disclosure: read only references triggered by the current task, avoid repeating effective higher-priority instructions, and stop when the requested acceptance and evidence boundary are satisfied.
- R7. Context continuity must remain artifact-based and truthful. No model-adaptation rule may claim automatic context rotation, thread lifecycle control, hidden token visibility, or unsupported tool availability.
- R8. External `aicoding-cookbook` material may support method selection, but text must be rewritten under the local GPL-2.0-only contract because the external repository exposes no repository-wide license.
- R9. Distributable changes must keep plugin source and `.ae-source` mirrors identical, update both version manifests to `0.3.43`, and add synchronized English and Chinese release notes dated 2026-09-10.

## Non-Goals

- Do not modify Codex global configuration, provider model catalogs, generated model caches, or supported reasoning-level metadata.
- Do not create GPT-5.6-specific and GPT-6-specific copies of skills.
- Do not add hard code metrics, universal test timeouts, compulsory sub-agent use, or compulsory task-tracking artifacts.
- Do not implement automatic context rotation or desktop thread lifecycle automation.
- Do not rewrite all skills when a shared contract plus core integration is sufficient.

## Acceptance Criteria

- AC1. English, Chinese, and bilingual init output contains the new guidance while preserving managed-region and profile behavior.
- AC2. Init output lists only validation commands discovered from the repository and orders recognized commands deterministically.
- AC3. The shared contract rejects model-name and reasoning-effort assumptions, unsupported capability claims, repeated ceremony, and transcript-style context persistence.
- AC4. `ae-brainstorm`, `ae-lfg`, `ae-plan`, `ae-work`, `ae-review`, `ae-init`, and `ae-help` route through the shared contract without duplicating its full body.
- AC5. Relative Markdown references used by skills are checked deterministically.
- AC6. Focused tests, full tests, contract checks, installation smoke checks, release-note checks, and `git diff --check` pass, or failures retain their exact evidence boundary.

## Perspective Collision

- Critic: adding global instructions may increase context cost and conflicts.
- Pragmatist: one short shared contract plus selective links is safer than repeated model-specific advice.
- Innovator: capability-driven behavior lets future models use stronger autonomy without another model-name migration.
- Systems: init templates, core skills, mirrors, contract checks, release notes, and context-continuity boundaries must move together.
- Collision insight: add explicit decision inputs and stop conditions while reducing model-specific and duplicated wording.
- Thinking preservation zone: the active model and host retain freedom over internal reasoning; AE governs observable scope, evidence, safety, and completion.

## Decisions

- D1. Use a model-neutral shared reference owned by `ae-help`, with concise routing clauses in core skills.
- D2. Keep `minimal` init concise, while `ae-core` and `full` add the complete evidence and structural-fix rules.
- D3. Derive recommended validation commands only from discovered `package.json` scripts.
- D4. Treat provider/model metadata mismatches as runtime configuration defects outside this plugin's instruction scope.

## Validation Evidence

- Static/focused: init rendering tests, source/mirror tests, skill-link checks, and release mapping.
- Distribution smoke: local and global install smoke scripts.
- Runtime model acceptance: unverified. Repository checks do not prove identical behavior across every GPT-5.6/GPT-6 provider or Codex host.

## Consistency Check

- requirementsCount: 9
- acceptanceCriteriaCount: 6
- decisionsCount: 4
- openQuestionsCount: 0
