# Agent Skills Optimization Summary

## Overview

This document summarizes the optimization analysis and proposed improvements to `ph-AI-Agent-Engine` based on the `agent-skills` repository audit (https://github.com/addyosmani/agent-skills).

## Analysis Summary

### What is Agent-Skills?

Agent-Skills is a production-grade engineering workflow framework that emphasizes:
- **Anti-rationalization tables** — systematic documentation of excuses to skip steps with counter-arguments
- **Verification gates** — requiring concrete evidence (test output, build logs, runtime data)
- **Progressive disclosure** — deferring token-heavy material until needed
- **Token budget awareness** — explicit cost consciousness in multi-agent workflows
- **Expert role clarity** — distinct personas (code reviewer, test engineer, security auditor, performance auditor)
- **Lifecycle structuring** — Define, Plan, Build, Verify, Review, Ship phases

### How Can It Optimize ph-AI-Agent-Engine?

The analysis identified **5 key gaps** in the current AE-Codex project that agent-skills patterns address:

1. **Weak Anti-Rationalization Structure** 
   - Current state: AE skills mention "do this" but lack systematic documentation of common excuses
   - Improvement: Create a reference guide with 8-12 excuse-rebuttal pairs

2. **Insufficient Verification Concreteness**
   - Current state: `ae-review` and `ae-work` ask for "validation" without requiring named commands or evidence artifacts
   - Improvement: Extend review/work findings templates to require evidence_type, evidence_reference, and post-execution evidence artifacts

3. **Token Budget Opacity**
   - Current state: Multi-agent execution lacks explicit cost estimation
   - Improvement: Add token budget estimation section to planning guidance with per-phase estimates

4. **Role Clarity Gaps**
   - Current state: Agent personas (code reviewer, security auditor) exist conceptually but lack explicit decision frameworks
   - Improvement: Define 4 expert personas with decision frameworks and hand-off contracts

5. **Lifecycle Metadata Gaps**
   - Current state: Skills are organized by phase conceptually, but phase-to-skill mapping is implicit
   - Improvement: Create lifecycle phase metadata mapping all skills to Define/Plan/Build/Verify/Review/Ship phases

## Optimization Plan

Two comprehensive documents have been created:

### 1. **Product Requirements Document (PRD)**
**Path**: `docs/ae/prds/2026-06-24-001-agent-skills-audit-and-adaptation-prd.md`

**Contains**:
- Problem statement and current state analysis
- Goals and acceptance criteria
- Proposed implementation units (U1-U8)
- Non-goals and rationale
- Key decisions and alternatives

**Key acceptance criteria**:
- Anti-rationalization guide (8-12 pairs)
- Enhanced evidence requirements in ae-review and ae-work
- Token budget estimation in ae-plan
- Expert personas definition with decision frameworks
- Lifecycle phase metadata
- Progressive disclosure in ae-help
- All artifacts validated and mirrors consistent

### 2. **Implementation Plan**
**Path**: `docs/ae/plans/2026-06-24-001-agent-skills-audit-and-adaptation-plan.md`

**Contains**:
- Detailed implementation units (U1-U8) with:
  - Goal and acceptance criteria
  - Files to be modified
  - Implementation approach
  - Validation strategy
  - Rollback signals
  - Deferred work

**Implementation units**:
- **U1**: Create anti-rationalization guide
- **U2**: Extend evidence requirements in ae-review
- **U3**: Extend evidence requirements in ae-work
- **U4**: Add token budget estimation to ae-plan
- **U5**: Define expert personas with decision frameworks
- **U6**: Create lifecycle phase metadata
- **U7**: Apply progressive disclosure to ae-help
- **U8**: Validation and evidence collection

**Execution sequence**:
1. Phase 1 (U1-U3): Core discipline & evidence (1-2 sessions)
2. Phase 2 (U4-U6): Budget & lifecycle (2-3 sessions)
3. Phase 3 (U7-U8): Progressive disclosure & final (1-2 sessions)

Total: 4-7 implementation sessions over 2-3 weeks

## Key Principles

### Decision 1: Adapt Patterns, Not Runtime
✓ Create reference guides and skill updates, not external runtime dependencies
✓ Keep AE Codex-native and boundary-respecting

### Decision 2: Anti-Rationalization as Reference
✓ Create a guide agents can consult
✓ Not enforced; but explicitly linked from skills
✓ Makes discipline easier without hard blocks

### Decision 3: Evidence via Template Extension
✓ Extend output templates rather than adding validation scripts
✓ Keep implementation lightweight
✓ Leverage Codex agents' existing workflow

### Decision 4: Token Budget as Awareness
✓ Manual estimation in plans makes costs explicit
✓ Supports multi-agent orchestration decisions
✓ No hard enforcement; emphasis on visibility

### Decision 5: Lifecycle Metadata as Documentation
✓ Map skills to phases without tight coupling
✓ Enable phase-aware execution and consistency checks
✓ Allow future automation without changing skills

## Alignment with Current AE

This optimization builds on existing strengths:

✓ **Leverages Constitution** — references Principle 5 (Validation Evidence Before Completion)
✓ **Extends Ponytail Adaptation** — complements recent minimality/complexity review work
✓ **Respects Source/Mirror Consistency** — all skill changes maintain plugin/agents mirror equivalence
✓ **Uses Proven Patterns** — anti-rationalization, expert personas follow Google engineering culture (already valued in AE)

## Success Metrics

After implementation:
- Agents reference anti-rationalization guide in plans/reviews
- Review findings consistently name evidence type and reference
- Work completion claims include post-execution evidence path
- Plans for large work estimate token budget per phase
- Expert personas mentioned in multi-agent execution hand-offs
- Phase metadata queryable for cross-phase consistency checks

## No External Dependencies

This optimization:
- ✓ Does NOT import agent-skills runtime or CLI
- ✓ Does NOT add new package dependencies
- ✓ Does NOT change Codex metadata structure
- ✓ Does NOT require global configuration changes
- ✓ Remains fully project-local and Codex-native

## Next Steps

To proceed with implementation:

1. **Review** the PRD and Plan documents for completeness and alignment
2. **Approve** the proposed optimization direction
3. **Execute** implementation units sequentially (U1-U8 across 3 phases)
4. **Validate** at each phase with mirror/artifact/smoke checks
5. **Document** experience and lessons in experience archive

## Document References

| Document | Path | Purpose |
|----------|------|---------|
| **PRD** | `docs/ae/prds/2026-06-24-001-agent-skills-audit-and-adaptation-prd.md` | Problem analysis, goals, acceptance criteria |
| **Plan** | `docs/ae/plans/2026-06-24-001-agent-skills-audit-and-adaptation-plan.md` | Detailed implementation units and validation |
| **Constitution** | `docs/ae/constitution.md` | Current AE governance principles |
| **Ponytail Experience** | `docs/ae/experience/2026-06-19-ponytail-minimality-adaptation.md` | Recent audit/adaptation pattern example |

---

**Document Owner**: AI Agent Engine Optimization Audit  
**Created**: 2026-06-24  
**Status**: Ready for Review and Implementation  
**Impact**: Core discipline, verification rigor, cost transparency across all AE workflows
