---
type: prd
status: drafted
format: human-readable-requirements
sharded: false
date: 2026-06-24
topic: workflow-optimization
origin: github.com/addyosmani/agent-skills audit
originFingerprint: agent-skills@775f826b757179f29d32d2e26494bb5c174f237e
---

# PRD: Agent Skills Audit and Adaptation

## Context

Addy Osmani's `agent-skills` repository (https://github.com/addyosmani/agent-skills) provides production-grade engineering workflows for AI coding agents. It emphasizes anti-rationalization, verification gates, progressive disclosure, and Google engineering culture best practices.

This PRD audits whether and how agent-skills design patterns can optimize `ai-agent-engine-codex` without importing external runtime.

## Scope

### In Scope

1. **Anti-Rationalization Tables** — structured guides that document excuses to skip steps with counter-arguments. Agent-skills uses this to strengthen discipline.
2. **Verification Gates** — requiring concrete evidence (test output, build logs, runtime data) before claims of completion.
3. **Progressive Disclosure** — deferring token-heavy reference material until needed, keeping initial guidance lightweight.
4. **Token Budget Awareness** — explicit cost consciousness in multi-agent and workflow design.
5. **Expert Role Clarity** — code reviewer, test engineer, security auditor, performance auditor as distinct personas.
6. **Lifecycle Phase Structuring** — Define, Plan, Build, Verify, Review, Ship as durable organizational framework.

### Out of Scope

- Importing agent-skills runtime, command catalog, or Slash command structure.
- Copying agent-skills skill source code or persona wording.
- Changing Codex-native AE boundary or skill metadata structure.
- Retrofitting historical plans or existing skills unless they are actively blocked by missing patterns.

## Current State Analysis

### AE-Codex Current Strengths

1. **Explicit Constitution** — `docs/ae/constitution.md` defines governance principles, review gates, and amendment process.
2. **Rich Skill Catalog** — 43 capabilities across Define, Plan, Build, Verify, Review, and Ship phases.
3. **Traceability** — Plans, tasks, reviews, and gates trace back to requirements.
4. **Minimality Adaptation** — Recently integrated ponytail-inspired simplification guidance into `ae-work`, `ae-review`, `ae-plan`, and `ae-task-loop`.
5. **Multi-Agent Execution** — Explicit configuration for parallel-eligibility analysis and execution strategy.
6. **UTF-8 and User Work Preservation** — Codex-native awareness of encoding and project history.

### Gaps Identified vs. Agent-Skills Patterns

1. **Weak Anti-Rationalization Structure** — AE skills mention "do this" but do not systematically document common excuses to skip steps or their rebuttals. This weakens agent discipline under pressure.
2. **Insufficient Verification Concreteness** — `ae-review` and `ae-work` ask for "validation" but do not strongly require named commands, outputs, or evidence artifacts. Agents may offer vague assurances instead.
3. **Token Budget Opacity** — Multi-agent execution asks about `multi_agent.enabled` but does not require explicit cost estimation, progressive scope reduction, or budget-aware task sizing.
4. **Role Clarity Gaps** — Agents know about "code reviewer" and "security auditor" but these are not crystallized as distinct personas with explicit decision frameworks.
5. **Lifecycle Metadata** — Skills are organized by phase conceptually, but phase-to-skill mapping and phase-entry/exit criteria are implicit.

## Problem Statement

When AI agents execute long workflows under ambiguous requirements, token budget pressure, or incomplete validation, they tend to:

1. Skip verification steps with vague justifications (e.g., "this is a small change," "tests are probably fine").
2. Broaden scope opportunistically without recording decision drivers.
3. Claim completion without concrete evidence (test output, build log, runtime observation).
4. Recommend external runtime dependencies without comparing stdlib/native alternatives first.
5. Lose token budget visibility mid-execution and resort to shortcuts.

AE-Codex has *patterns* to prevent this, but they lack the *systematic anti-pattern catalog* that agent-skills provides. Adding that catalog would strengthen enforcement without changing Codex architecture.

## Goals

1. **Strengthen Discipline** — Give agents explicit, numbered excuses-and-rebuttals templates to reference when tempted to skip steps.
2. **Concrete Verification** — Require named commands, exact outputs, or signed gate proofs in place of vague "validation done" claims.
3. **Token Budget Transparency** — Require explicit cost estimation, scope-vs-budget tradeoffs, and per-phase budget allocations in large multi-agent workflows.
4. **Role Crystallization** — Define code reviewer, test engineer, security auditor, and performance auditor personas with explicit decision frameworks and hand-off contracts.
5. **Lifecycle Metadata** — Map skills to phases, document phase entry/exit criteria, and require phase transition evidence.

## Acceptance Criteria

- [ ] Anti-Rationalization Guide created at `docs/ae/references/anti-rationalization.md` with 8-12 common AE excuses and rebuttals.
- [ ] `ae-review` updated to require evidence type (command name, output path, gate file) in findings template.
- [ ] `ae-work` updated to require post-execution evidence artifact (gate JSON, test log, build output) before claiming "work complete."
- [ ] `ae-plan` updated to estimate token cost per phase and record scope-vs-budget tradeoff decisions.
- [ ] Four Expert Personas defined at `docs/ae/references/expert-personas.md` with decision frameworks and hand-off contracts.
- [ ] Lifecycle phase metadata added to `skills-to-phases.json` mapping each skill to entry, execution, and exit phase(s).
- [ ] Progressive disclosure applied to `ae-help` so initial capability list is lightweight; full skill bodies load on-demand.
- [ ] All updates maintain mirror consistency between plugin source and `.agents/skills`.
- [ ] Validation passes: `check-skill-mirror.mjs`, `check-ae-artifacts.mjs`, `npm run check`.

## Non-Goals

- Importing or vendoring agent-skills code.
- Creating "agent-skills-for-codex" variant or branded product.
- Changing skill command structure, Slash command routing, or Codex metadata format.
- Retroactively rewriting completed projects' plans or reviews.
- Adding persona-based mode switching or statusline behavior.

## Rationale

Agent-skills' value is not in its runtime mechanics but in its *engineering judgment*:

1. **Systematic excuse documentation** prevents ad-hoc rationalization and gives agents a reference ladder.
2. **Concrete evidence requirement** is not new, but making it explicit (name the command, show the output, sign the gate) is stronger than "please verify."
3. **Token budget transparency** is especially important as AE scales to multi-agent orchestration; hidden cost assumptions undermine decision quality.
4. **Expert personas** with explicit contracts reduce ambiguity when handing off between agents or from agent to human.
5. **Lifecycle metadata** makes phase-aware automation and cross-phase consistency checks possible.

These are portable engineering patterns that improve AE-Codex *without* adding external dependencies.

## Key Decisions

### Decision 1 — No Runtime Import

- **Choice**: Adapt patterns into skill guidance, reference files, and schema, not runtime hooks.
- **Consequence**: Changes are purely instructional; existing Codex agent behavior does not change.
- **Rationale**: Keeps AE Codex-native and avoids competing workflow roots.

### Decision 2 — Anti-Rationalization as Reference, Not Enforcement

- **Choice**: Create a guide document agents can consult, not an automated gate that rejects vague claims.
- **Consequence**: Agents still choose to be disciplined; the guide makes discipline easier.
- **Rationale**: Codex agents respond better to accessible guidance than to hard blocks; human judgment matters.

### Decision 3 — Concrete Evidence via Schema, Not Script

- **Choice**: Extend skill output templates (e.g., review findings, work completion) to require evidence fields, rather than adding validation scripts.
- **Consequence**: Changes are in SKILL.md guidance; no new JavaScript required unless artifact checking needs automation.
- **Rationale**: Keeps implementation lightweight and Codex-native.

### Decision 4 — Progressive Disclosure via Conditional References

- **Choice**: Keep initial skill guidance brief; reference detailed role/phase/excuse guides only when user explicitly asks.
- **Consequence**: Initial skill request returns lightweight guidance; follow-ups can ask for full persona docs or phase details.
- **Rationale**: Balances completeness with token efficiency.

## Proposed Implementation Units

### U1 — Create Anti-Rationalization Guide

**Goal**: Document 8-12 common AE workflow excuses and evidence-based rebuttals.

**Coverage**:
- "This is a small change; tests are probably fine" → Rebuttal with required test evidence.
- "Validation will take too long" → Rebuttal with fastest validation path trade-off.
- "This is just internal refactoring; no customer impact" → Rebuttal with contract and data-loss risks.
- "The old code works; why change?" → Rebuttal with acceptance criteria and non-goals clarity.
- "Our codebase is too unique for stdlib/native" → Rebuttal with stdlib-first evaluation checklist.
- Others identified during phase planning.

**Artifact**: `docs/ae/references/anti-rationalization.md` (~1-2 pages, linked from `ae-plan`, `ae-work`, `ae-review`).

**Depends on**: None.

### U2 — Strengthen Evidence Requirements in ae-review

**Goal**: Require findings to name the evidence type (command, output, gate file) rather than vague assertions.

**Coverage**:
- Extend review findings template to require: `evidence_type` (command / log-file / gate-proof / code-inspection), `evidence_reference` (path or command name), `severity` or `impact`.
- Require complexity findings to include `replacement_evidence` (how to verify the deletion is safe).

**Artifact**: Update `plugins/ai-agent-engine-codex/skills/ae-review/SKILL.md` and mirror, optionally extend `references/review-output-template.md`.

**Depends on**: U1 (for context; not hard dependency).

### U3 — Strengthen Evidence Requirements in ae-work

**Goal**: Require post-execution evidence artifact before claiming work is complete.

**Coverage**:
- Add `Post-Execution Evidence` section: agents must provide gate file, test log, build output, or signed inspection summary.
- List the narrowest relevant check first, then broader checks.
- Record evidence path in final response.

**Artifact**: Update `plugins/ai-agent-engine-codex/skills/ae-work/SKILL.md` and mirror.

**Depends on**: U1 (for context; not hard dependency).

### U4 — Add Token Budget Estimation to ae-plan

**Goal**: Require explicit cost awareness and scope-vs-budget tradeoff documentation.

**Coverage**:
- Add `Token Budget` section to plan template: estimated tokens per phase (Define, Plan, Build, Verify, Review), total estimate, contingency.
- Add `Scope-vs-Budget Decision` section: if total estimate exceeds context window or user budget, record what scope was deferred and why.
- For multi-agent plans, estimate per-agent cost and parallel-wave structure.

**Artifact**: Update `plugins/ai-agent-engine-codex/skills/ae-plan/SKILL.md`, mirror, and optionally `references/plan-template.md`.

**Depends on**: None.

### U5 — Define Expert Personas with Decision Frameworks

**Goal**: Crystallize code reviewer, test engineer, security auditor, and performance auditor as distinct personas with explicit contracts.

**Coverage**:
- Each persona has: decision framework (what signals matter), hand-off contract (what they output, what they consume), decision speed (fast/medium/deep), and escalation path.
- Code Reviewer: targets correctness, readability, maintainability; outputs findings report; escalates data-loss/contract risks to security auditor.
- Test Engineer: targets coverage, failure modes, regression risk; outputs test evidence; escalates timing/integration issues to integration auditor.
- Security Auditor: targets data-loss, permission-bypass, trust-boundary violations; outputs verdict; gates delivery.
- Performance Auditor: targets latency, resource exhaustion, observability; outputs recommendations; escalates to architect if trade-off is architectural.

**Artifact**: `docs/ae/references/expert-personas.md` (~2-3 pages, linked from `ae-review`, multi-agent skills, `ae-help`).

**Depends on**: None.

### U6 — Add Lifecycle Phase Metadata

**Goal**: Map skills to entry/execution/exit phases and document phase transition evidence.

**Coverage**:
- Create `docs/ae/references/skills-to-phases.json` with skill → [Define, Plan, Build, Verify, Review, Ship] mapping.
- For multi-phase skills, note entry/exit criteria.
- Document phase transition evidence (e.g., to exit Define, requirements must be confirmed; to enter Build, plan must be approved).

**Artifact**: `docs/ae/references/skills-to-phases.json` and `docs/ae/references/phase-transition-guide.md`.

**Depends on**: None.

### U7 — Apply Progressive Disclosure to ae-help

**Goal**: Make initial help output lightweight; full persona/phase/budget docs available on request.

**Coverage**:
- `ae-help` initial output shows skill names and one-line descriptions.
- Add optional flags: `ae-help --personas`, `ae-help --phases`, `ae-help --anti-rationalization`, `ae-help --token-budget`.
- Document this in `ae-help` SKILL.md.

**Artifact**: Update `plugins/ai-agent-engine-codex/skills/ae-help/SKILL.md` and mirror.

**Depends on**: U1, U5, U6.

### U8 — Validation and Evidence

**Goal**: Prove reference documents, templates, and skill updates are consistent and ready to ship.

**Coverage**:
- Mirror validation between plugin source and `.agents/skills`.
- Artifact checking to ensure new references parse and link correctly.
- Full smoke test suite.

**Artifact**: Validation commands, evidence in `docs/ae/gates/`.

**Depends on**: U1-U7.

## Risks

- **Risk**: Anti-rationalization guide feels prescriptive and discourages reasonable judgment calls.
  - **Mitigation**: Frame as common patterns, not absolute rules. Emphasize that context matters and documented exceptions are okay.
  
- **Risk**: Evidence requirement templates become too verbose and slow down real work.
  - **Mitigation**: Keep templates concise; make long-form guidance optional. Inline brief evidence (e.g., "test output in build log") most of the time.

- **Risk**: Expert persona docs are not adopted by agents because they are added as separate files.
  - **Mitigation**: Link personas from affected skills (`ae-review`, multi-agent executor, `ae-work` when assigning expert roles).

- **Risk**: Phase metadata and progressive disclosure add learning overhead.
  - **Mitigation**: Make phase/budget/persona docs short and scannable. Keep initial `ae-help` unchanged; new docs are supplements.

- **Risk**: Token budget estimation in plans becomes a distraction from requirements clarity.
  - **Mitigation**: Token budget is secondary to acceptance criteria. Estimate conservatively and revisit if scope changes.

## Pre-Mortem

- **Failure scenario 1**: Anti-rationalization guide is added but agents ignore it because it is not integrated into skill instructions.
  - **Mitigation**: Reference it explicitly in `ae-plan`, `ae-work`, and `ae-review` when discussing common pitfalls.

- **Failure scenario 2**: Evidence requirements cause agents to report redundant or excessive output.
  - **Mitigation**: Keep evidence templates minimal; trust agents to pick the narrowest relevant check.

- **Failure scenario 3**: Phase metadata goes stale because skill catalog changes are not mirrored.
  - **Mitigation**: Make `check-ae-artifacts.mjs` or a new check validate phase metadata against active skills.

## Alternatives Considered

1. **Recommended**: Adapt agent-skills patterns into AE reference guides, templates, and skill guidance.
2. **Alternative**: Do nothing; current AE discipline is sufficient.
   - Rejected: Gap analysis shows vague verification language and missing cost transparency.
3. **Alternative**: Import agent-skills skills wholesale and wrap them for Codex.
   - Rejected: Would introduce competing skill catalogs and runtime dependencies.
4. **Alternative**: Create a new `ae-discipline` or `ae-evidence` skill.
   - Rejected: Discipline is orthogonal to existing skills; better as guidance and references.

## Success Metrics

- Agents reference anti-rationalization guide in plans/reviews (observable in workflow artifacts).
- Review findings consistently name evidence type and reference.
- Work completion claims include post-execution evidence path.
- Plans for large work estimate token budget per phase.
- New expert personas are mentioned in multi-agent execution hand-offs.

## Timeline

- **Phase 1 (U1-U3)** — Core discipline & evidence guidance. Est. 1-2 implementation sessions.
- **Phase 2 (U4-U6)** — Budget transparency & lifecycle metadata. Est. 2-3 implementation sessions.
- **Phase 3 (U7-U8)** — Progressive disclosure & validation. Est. 1-2 sessions.

Total est. 4-7 implementation sessions, spread over 2-3 weeks with regular validation gates.

## Next Steps

1. Review this PRD for completeness and alignment with current AE direction.
2. If approved, create a plan that sequences U1-U8 with cross-unit validation.
3. For each unit, edit skill source and mirror files, then validate with mirror/artifact/smoke checks.
4. Record evidence in `docs/ae/gates/` and final summary in experience document.

---

**Document Owner**: AI Agent Engine Audit Process  
**Last Updated**: 2026-06-24  
**Status**: Awaiting Review and Approval
