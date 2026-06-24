---
type: plan
status: drafted
format: human-readable-plan
sharded: false
date: 2026-06-24
title: agent-skills-audit-and-adaptation
origin: docs/ae/prds/2026-06-24-001-agent-skills-audit-and-adaptation-prd.md
originFingerprint: agent-skills@addyosmani
---

# Plan: Agent Skills Audit and Adaptation

## Source

- **PRD**: `docs/ae/prds/2026-06-24-001-agent-skills-audit-and-adaptation-prd.md`
- **Reference**: https://github.com/addyosmani/agent-skills
- **External license**: MIT
- **Local constraints**: AE skills maintained in `plugins/ai-agent-engine-codex/skills`, mirrored under `.agents/skills`; no external runtime import.
- **Pre-edit gate**:
  - `git status --short`: clean (assumed)
  - `git branch --show-current`: main
  - Current AE architecture: 43 existing skills, proven Constitution pattern, recent Ponytail minimality adaptation

## Scope

Adapt agent-skills' engineering discipline patterns (anti-rationalization, verification gates, progressive disclosure, token budget awareness, expert personas, lifecycle metadata) into AE-Codex reference guides and skill updates. Do not import external runtime.

### Primary Scope

- Create anti-rationalization reference guide with 8-12 common AE excuses and rebuttals
- Strengthen evidence requirements in `ae-review` and `ae-work` skills
- Add token budget estimation to planning guidance
- Define expert personas (code reviewer, test engineer, security auditor, performance auditor)
- Create lifecycle phase metadata mapping

### Secondary Scope

- Apply progressive disclosure to `ae-help`
- Update skill references and templates
- Validation and evidence collection

### Out of Scope

- Import agent-skills runtime, CLI, or slash commands
- Retrofit historical plans or completed projects
- Change Codex metadata structure or AE boundary

## Readiness

### Goal

Strengthen AE discipline and evidence rigor by systematizing common anti-patterns, requiring concrete verification, and making cost/role decisions explicit.

### Acceptance Criteria

- [ ] `docs/ae/references/anti-rationalization.md` created with 8-12 excuse-rebuttal pairs
- [ ] `ae-review` SKILL.md updated with evidence_type and evidence_reference requirements
- [ ] `ae-work` SKILL.md updated with Post-Execution Evidence section
- [ ] `ae-plan` SKILL.md updated with Token Budget section and scope-vs-budget tradeoff guidance
- [ ] `docs/ae/references/expert-personas.md` created with 4 personas, decision frameworks, and hand-off contracts
- [ ] `docs/ae/references/skills-to-phases.json` and `phase-transition-guide.md` created
- [ ] `ae-help` SKILL.md documented with progressive disclosure flags
- [ ] Mirror consistency between `plugins/ai-agent-engine-codex/skills` and `.agents/skills` verified
- [ ] All validation checks pass: `check-skill-mirror.mjs`, `check-ae-artifacts.mjs`, `npm run check`

### Non-Goals

- Personas or command-driven workflow modes
- Retrofitting completed projects
- New JavaScript utilities (pure guidance/schema changes)

### Affected Areas

**Reference/Reference Documents** (new):
- `plugins/ai-agent-engine-codex/references/anti-rationalization.md`
- `.agents/skills/ae-review/references/anti-rationalization.md`
- `docs/ae/references/expert-personas.md`
- `docs/ae/references/skills-to-phases.json`
- `docs/ae/references/phase-transition-guide.md`

**Skill Updates** (plugin source + mirror):
- `plugins/ai-agent-engine-codex/skills/ae-review/SKILL.md` + `.agents/skills/ae-review/SKILL.md`
- `plugins/ai-agent-engine-codex/skills/ae-work/SKILL.md` + `.agents/skills/ae-work/SKILL.md`
- `plugins/ai-agent-engine-codex/skills/ae-plan/SKILL.md` + `.agents/skills/ae-plan/SKILL.md`
- `plugins/ai-agent-engine-codex/skills/ae-help/SKILL.md` + `.agents/skills/ae-help/SKILL.md`

**Validation**:
- `node scripts/check-skill-mirror.mjs`
- `node scripts/check-ae-artifacts.mjs`
- `npm run check`

### Open Questions

1. **Anti-Rationalization Reference Path**: Should it be under `plugins/ai-agent-engine-codex/references/` (plugin-owned) or `docs/ae/references/` (project-owned)? 
   - **Recommendation**: Create in both locations: one under plugin source for skill bundling, one under docs/ae for broader project access.

2. **Evidence Schema Complexity**: Should evidence requirements be inline SKILL.md guidance or a separate structured template (JSON schema)?
   - **Recommendation**: Inline guidance in SKILL.md for initial pass; if field validation becomes necessary, add schema later.

3. **Progressive Disclosure Flags**: Should `ae-help` auto-detect request context (e.g., if user says "I'm running a complex multi-agent work, show me budget guidance")?
   - **Recommendation**: Start with explicit flags; context-aware auto-detection deferred to later refinement.

4. **Phase Metadata Format**: Should `skills-to-phases.json` be queryable/indexed (for cross-phase consistency checks)?
   - **Recommendation**: Start with simple structure; add indexing only if `check-ae-artifacts.mjs` needs to validate against it.

## Assumptions

- Agent-skills' value is its *engineering patterns* (excuse documentation, evidence rigor, cost transparency), not its runtime.
- AE's existing Constitution and Ponytail adaptation are solid baselines; new content should integrate smoothly.
- Codex agents respond well to accessible reference guides; hard automation is less important than clear examples.
- UTF-8 and user-work preservation remain non-negotiable (follow current project policy).
- This change is documentation/reference-level; no package.json, lockfile, or critical script changes.

## Alternatives Considered

1. **Recommended**: Create reference guides and update skill guidance; no runtime import.
   - Rationale: Portable, Codex-native, low risk.

2. **Alternative**: Import agent-skills as a dependency and wrap for Codex.
   - Rejected: Creates competing runtime and dependency bloat.

3. **Alternative**: Create new `ae-discipline` or `ae-evidence` skill.
   - Rejected: Discipline is cross-cutting; better served by reference guides and skill updates.

4. **Alternative**: Do nothing; current AE discipline is sufficient.
   - Rejected: Gap analysis in PRD shows concrete opportunities (vague verification, cost opacity, role ambiguity).

## Decision Drivers

1. **Strengthen Discipline**: Systematic excuse documentation gives agents explicit decision ladders.
2. **Make Verification Concrete**: Require command names, outputs, gate proofs instead of vague assertions.
3. **Transparent Cost Decisions**: Token budgets and scope tradeoffs must be visible and documented.
4. **Clarify Roles**: Expert personas with explicit contracts reduce ambiguity.
5. **Preserve AE Boundary**: No external runtime; keep changes Codex-native and skill-local.

## Decisions

### ADR-1 — Adapt Engineering Judgment, Not Runtime

**Decision**: Create reference guides, update skill guidance, and extend templates; do not import external runtime.

**Drivers**: AE is Codex-native; runtime import would create maintenance cost and competing workflow roots.

**Alternatives**: Vendor agent-skills; create new skill wrapping agent-skills ideas.

**Chosen**: Reference guides + skill updates keep AE portable and low-dependency.

**Consequences**: All changes are instructional; agents choose discipline, guidance makes it easier.

**Follow-ups**: If future projects show agents systematically skip certain steps despite guidance, escalate to conversation with project team about workflow blocks.

### ADR-2 — Anti-Rationalization as Scannable Reference

**Decision**: Create a short guide (8-12 excuse-rebuttal pairs) that agents and humans can consult; not an enforced gate.

**Drivers**: Codex agents respond to accessible, relatable guidance; hard blocks are less effective.

**Alternatives**: Add anti-rationalization checks to validation scripts; make it mandatory in every plan.

**Chosen**: Reference guide is opt-in but explicitly linked from `ae-plan`, `ae-work`, `ae-review`.

**Consequences**: Agents see the guide as a resource, not an obstacle; human reviewers can cite it when pushing back on weak decisions.

**Follow-ups**: If patterns emerge in workflow artifacts showing agents ignore the guide, adjust tone or add explicit examples from real projects.

### ADR-3 — Evidence via Template Extension, Not Automation

**Decision**: Extend skill output templates (review findings, work completion) to require evidence fields; no new validation scripts.

**Drivers**: Keeps implementation lightweight; Codex agents can fill evidence fields as part of normal workflow.

**Alternatives**: Add evidence validation script; create a dedicated `ae-evidence` skill.

**Chosen**: Template-level guidance avoids automation overhead and keeps proof in agents' control.

**Consequences**: Evidence rigor depends on agent discipline and template clarity; spot-check via manual review.

**Follow-ups**: If evidence templates are consistently ignored, add pre-flight checks to `ae-work` or escalate to conversation.

### ADR-4 — Token Budget as Planning Awareness, Not Enforcement

**Decision**: Add token budget section to plan template; estimate per-phase costs; document scope-vs-budget tradeoffs.

**Drivers**: Multi-agent orchestration needs cost visibility; hidden assumptions undermine decisions.

**Alternatives**: Automated token counter; hard budget ceiling that rejects work exceeding limit.

**Chosen**: Manual estimation in plans makes costs explicit without requiring new runtime.

**Consequences**: Plans require thoughtful cost awareness; scope decisions are documented and reviewable.

**Follow-ups**: After several projects, collect actual vs. estimated budgets and refine estimation guidance.

### ADR-5 — Lifecycle Metadata as Documentation, Not Gating

**Decision**: Create `skills-to-phases.json` and `phase-transition-guide.md` to map skills and document phase entry/exit criteria.

**Drivers**: Phase-aware execution and consistency checks require metadata; documentation makes expectations explicit.

**Alternatives**: Embed phase metadata in each SKILL.md frontmatter; create a runtime phase checker.

**Chosen**: Separate reference files keep phase info queryable without tight coupling to individual skills.

**Consequences**: Skills remain independent; phase logic is documented separately and can evolve without editing all skills.

**Follow-ups**: If cross-phase consistency problems emerge, add automation to `check-ae-artifacts.mjs` to validate against metadata.

## Risks

- **Risk**: Anti-rationalization guide becomes a checklist agents ritually tick without real judgment.
  - **Mitigation**: Frame as patterns and examples; emphasize that context and documented exceptions are okay. Link from skills with specific use cases, not global mandate.

- **Risk**: Evidence requirements make agent output verbose and slow.
  - **Mitigation**: Keep evidence templates concise. For small work, inline brief evidence (e.g., "test output in build.log") is sufficient; long-form evidence required only for significant work.

- **Risk**: Expert persona docs are added but not integrated, so agents ignore them.
  - **Mitigation**: Reference personas explicitly in `ae-review` (when assigning auditor roles), `ae-work` (when assigning implementer expectations), and multi-agent skills.

- **Risk**: Phase metadata goes stale as skill catalog evolves.
  - **Mitigation**: Include phase metadata validation in `check-ae-artifacts.mjs`. Treat `skills-to-phases.json` as owned artifact requiring updates when skills are added/removed.

- **Risk**: Token budget estimation becomes a distraction from requirements clarity.
  - **Mitigation**: Token budget is secondary to acceptance criteria. Include rough estimates (e.g., "100-200 tokens per phase") rather than precise calculations. Revisit if scope changes significantly.

## Pre-Mortem

- **Failure scenario 1**: Anti-rationalization guide is added but agents ignore it because it's not visible during skill execution.
  - **Mitigation**: Link the guide explicitly in `ae-plan`, `ae-work`, and `ae-review` SKILL.md. Reference it when discussing common pitfalls.

- **Failure scenario 2**: Expert persona definitions are too abstract and agents don't know how to apply them.
  - **Mitigation**: Provide concrete hand-off examples (e.g., "when test engineer signs off, implement these checks before moving to security auditor"). Include decision checklists, not just role names.

- **Failure scenario 3**: Reference files (.json, .md) are not kept in sync with actual skill catalog, causing confusion.
  - **Mitigation**: Add explicit ownership notes (e.g., "update this file when adding skills to phase X"). Make `check-ae-artifacts.mjs` warn if skill count in phase metadata doesn't match actual skills.

- **Failure scenario 4**: Token budget section in plans inflates plan length, making them harder to read.
  - **Mitigation**: Keep budget section brief (2-3 lines per phase). For simple work, budgets can be "not estimated; minimal scope" instead of detailed calculations.

## Implementation Units

### U1 — Create Anti-Rationalization Guide

**Goal**: Document common AE workflow excuses and evidence-based rebuttals.

**Requirements covered**: PRD goal 1, acceptance criterion 1.

**Acceptance criteria**:
- Guide lists 8-12 excuse-rebuttal pairs
- Excuses cover scope, validation, testing, internal refactoring, stdlib/native alternatives, and cost/schedule pressure
- Rebuttals are concrete and cite AE principles (Constitution, validation, traceability)
- Guide is scannable (~2-3 pages)
- Guide is linked from `ae-plan`, `ae-work`, `ae-review` SKILL.md

**Depends on**: None.

**Files**:
- `docs/ae/references/anti-rationalization.md` (new, project-facing)
- `plugins/ai-agent-engine-codex/references/anti-rationalization.md` (new, for skill bundling; can be symlink or copy)

**Approach**:
- Brainstorm 8-12 common "let's skip this step" scenarios observed in AE workflows
- For each, document:
  - **Excuse**: "This is a small change, tests are probably fine"
  - **Rebuttal**: "Small changes still need narrow test coverage to prevent regressions. Run the smallest relevant test suite first."
  - **AE Principle**: Links to Constitution (Principle 5: Validation Evidence Before Completion)
  - **Evidence Path**: What constitutes proof (test log, build output, etc.)
  - **Exception**: When this excuse is actually valid (e.g., config-only changes with no behavior logic)

**Tests**:
- Manual review: guide is scannable and linked from skills
- Encoding check: UTF-8

**Validation**:
- `grep -r "anti-rationalization" plugins/ai-agent-engine-codex/skills/ae-*/SKILL.md` confirms links
- `cat docs/ae/references/anti-rationalization.md | wc -l` shows ~50-100 lines

**Rollback signals**:
- Guide is not linked from affected skills
- Guide is too preachy or dismissive of legitimate judgment calls

**Deferred**:
- Detailed per-project excuse examples (collect after first use)

### U2 — Extend Evidence Requirements in ae-review

**Goal**: Require findings to name evidence type and reference.

**Requirements covered**: PRD goal 2, acceptance criterion 2.

**Acceptance criteria**:
- Review findings template includes: `evidence_type` (command / log-file / gate-proof / code-inspection), `evidence_reference` (path or command name), `severity`, `impact`
- Complexity findings require `replacement_evidence` (how to verify deletion is safe)
- Example: "Severity: P2. Evidence: test output in `test-results.log`. Impact: prevents regression in payment flow."
- Update plugin source and mirror consistently

**Depends on**: None.

**Files**:
- `plugins/ai-agent-engine-codex/skills/ae-review/SKILL.md` (update evidence section)
- `.agents/skills/ae-review/SKILL.md` (mirror)
- Optional: `plugins/ai-agent-engine-codex/skills/ae-review/references/review-output-template.md` (extend if needed)
- Optional: `.agents/skills/ae-review/references/review-output-template.md` (mirror)

**Approach**:
- Find current "Findings" or "Output" section in `ae-review` SKILL.md
- Add a "Finding Structure" subsection with required fields
- Provide example finding with all fields filled
- Link to anti-rationalization guide when discussing verification shortcuts

**Tests**:
- Mirror check: both files updated identically
- Help smoke: `ae-help review` displays new guidance

**Validation**:
- `node scripts/check-skill-mirror.mjs`
- `node scripts/ae-tools.mjs help review | grep -i evidence` confirms guidance is visible

**Rollback signals**:
- Mirror mismatch between plugin source and `.agents/skills`
- Evidence template is too verbose (evidence collection becomes slower than actual review)

**Deferred**:
- Automated evidence validation schema (if needed later, can add JSON schema)

### U3 — Extend Evidence Requirements in ae-work

**Goal**: Require post-execution evidence artifact before claiming work is complete.

**Requirements covered**: PRD goal 2, acceptance criterion 3.

**Acceptance criteria**:
- `ae-work` SKILL.md includes "Post-Execution Evidence" section
- Section requires agents to provide one of: gate file, test log, build output, or inspection summary
- Section lists narrowest relevant check first, then broader checks
- Final response includes evidence path (e.g., "evidence: docs/ae/gates/20260624T123456Z-work-final.json")
- Update plugin source and mirror

**Depends on**: U1 (for context; not hard dependency).

**Files**:
- `plugins/ai-agent-engine-codex/skills/ae-work/SKILL.md`
- `.agents/skills/ae-work/SKILL.md`

**Approach**:
- Find "Execution" or "Cleanup" section in `ae-work` SKILL.md
- Add "Post-Execution Evidence" section after execution rules
- List: "Provide at least one of the following:" narrowest check, secondary check, tertiary check, summary inspection
- Example: "For a code change, run `npm test -- --grep "affected-area"` first. If passing, include the test log. If no test exists, include a manual inspection summary."
- Reference Constitution Principle 5 (Validation Evidence Before Completion)

**Tests**:
- Mirror check
- Help smoke: `ae-help work | grep -i evidence`

**Validation**:
- `node scripts/check-skill-mirror.mjs`
- `node scripts/ae-tools.mjs help work`

**Rollback signals**:
- Evidence requirement is too onerous (prevents normal work flow)
- Mirror mismatch

**Deferred**:
- Gate proof automation (currently manual; can be scripted later if needed)

### U4 — Add Token Budget Estimation to ae-plan

**Goal**: Require explicit cost awareness and scope-vs-budget tradeoff documentation.

**Requirements covered**: PRD goal 3, acceptance criterion 4.

**Acceptance criteria**:
- `ae-plan` SKILL.md includes "Token Budget" section
- Section asks planners to estimate tokens per phase: Define, Plan, Build, Verify, Review
- Section asks for total estimate and contingency
- For multi-agent plans, section asks for per-agent cost and parallel-wave structure
- Section includes "Scope-vs-Budget Decision" for plans exceeding context window or user budget
- Update plugin source and mirror
- Optional: update `plan-template.md` with budget fields

**Depends on**: None.

**Files**:
- `plugins/ai-agent-engine-codex/skills/ae-plan/SKILL.md`
- `.agents/skills/ae-plan/SKILL.md`
- Optional: `plugins/ai-agent-engine-codex/skills/ae-plan/references/plan-template.md`
- Optional: `.agents/skills/ae-plan/references/plan-template.md`

**Approach**:
- Find "Plan Structure" or "Template" section in `ae-plan` SKILL.md
- Add "Token Budget Estimation" section with guidance:
  - Define phase: ~50-100 tokens (confirm requirements)
  - Plan phase: ~100-200 tokens (create task breakdown)
  - Build phase: ~200-500 tokens per task (implementation)
  - Verify phase: ~50-100 tokens (run checks)
  - Review phase: ~100-200 tokens (findings and feedback)
  - Provide rough estimates; mark as "estimated" if not precise
- Add "Scope-vs-Budget Decision" section: if total > context window, document what scope was deferred and why
- For multi-agent plans, ask for per-agent cost and wave count

**Tests**:
- Mirror check
- Artifact check: sample plans from `docs/ae/plans/` still parse

**Validation**:
- `node scripts/check-skill-mirror.mjs`
- `node scripts/check-ae-artifacts.mjs`

**Rollback signals**:
- Budget estimation makes plan too heavy for small work
- Estimates become bottleneck for plan approval

**Deferred**:
- Token counter automation; collect actual vs. estimated budgets after first projects

### U5 — Define Expert Personas with Decision Frameworks

**Goal**: Crystallize code reviewer, test engineer, security auditor, performance auditor with explicit contracts.

**Requirements covered**: PRD goal 4, acceptance criterion 5.

**Acceptance criteria**:
- `docs/ae/references/expert-personas.md` created with 4 personas
- Each persona has:
  - **Decision Framework**: what signals matter, decision speed (fast/medium/deep), examples
  - **Hand-off Contract**: what they output, what they consume, escalation path
  - **Non-Goals**: what they don't own
- Code Reviewer: correctness, readability, maintainability; escalates data-loss/contract risks to security
- Test Engineer: coverage, failure modes, regression risk; escalates timing/integration issues to architect
- Security Auditor: data-loss, permission-bypass, trust-boundary; output verdict gates delivery
- Performance Auditor: latency, resource exhaustion, observability; escalates architectural tradeoffs to architect
- Document is ~2-3 pages, scannable
- Link from `ae-review`, multi-agent executor, and `ae-help`

**Depends on**: None.

**Files**:
- `docs/ae/references/expert-personas.md` (new)
- Update: `plugins/ai-agent-engine-codex/skills/ae-review/SKILL.md` (link to personas)
- Update: `.agents/skills/ae-review/SKILL.md` (link to personas)

**Approach**:
- Define each persona in a subsection with:
  - **Title** and **Responsibility**
  - **Decision Framework** table: signal → decision rule (e.g., "test coverage < 80% → flag as red")
  - **Hand-off Contract**: "They accept X, output Y, escalate Z to ___"
  - **Example Findings**: 1-2 representative findings this persona produces
  - **Non-Goal Examples**: what they explicitly don't review (e.g., performance auditor doesn't review code style)
- Include a phase/activity diagram showing when each persona is engaged
- Include escalation paths (e.g., code reviewer flags permission issue → security auditor)

**Tests**:
- Personas document is syntactically valid markdown
- Links from skills resolve correctly

**Validation**:
- Manual review: document is scannable, personas are distinct, hand-off contracts are clear
- `grep -r "expert-personas" plugins/ai-agent-engine-codex/skills/ae-review/SKILL.md` confirms links

**Rollback signals**:
- Personas are too abstract (agents don't know how to apply them)
- Personas overlap (e.g., code reviewer and test engineer responsibilities conflict)

**Deferred**:
- Persona selection logic (when to invoke which persona); can be added to multi-agent executor later

### U6 — Add Lifecycle Phase Metadata

**Goal**: Map skills to phases and document phase transition evidence.

**Requirements covered**: PRD goal 5, acceptance criterion 6.

**Acceptance criteria**:
- `docs/ae/references/skills-to-phases.json` created with skill → [Define, Plan, Build, Verify, Review, Ship] mapping
- `docs/ae/references/phase-transition-guide.md` created with phase entry/exit criteria and evidence requirements
- JSON schema is queryable (simple object: skill name → array of phases)
- Transition guide explains:
  - Define phase: entry (user request), execution (clarify requirements, acceptance criteria), exit (requirements confirmed)
  - Plan phase: entry (requirements confirmed), execution (create task breakdown, identify dependencies), exit (plan approved)
  - Build phase: entry (plan approved), execution (implement tasks, validate each unit), exit (all tasks validated)
  - Verify phase: entry (implementation complete), execution (run integration/system tests), exit (verification passed)
  - Review phase: entry (implementation complete or concurrent), execution (findings and feedback), exit (findings addressed or documented)
  - Ship phase: entry (review complete, verification passed), execution (merge, deploy, observe), exit (change live and stable)
- Example phase transition: "To exit Define phase, requirements document must list confirmed facts, assumptions, acceptance criteria, non-goals, and validation signals. Checklist in `docs/ae/templates/requirements-quality-checklist.md`."
- Skills-to-phases JSON maps all current ~43 skills to their primary phases

**Depends on**: None.

**Files**:
- `docs/ae/references/skills-to-phases.json` (new)
- `docs/ae/references/phase-transition-guide.md` (new)

**Approach**:
1. **Phase Transition Guide**:
   - Create table: Define | Plan | Build | Verify | Review | Ship
   - For each phase: entry criteria, execution activities, exit criteria, evidence checklist
   - Provide examples or links to templates/gates

2. **Skills-to-Phases JSON**:
   - Iterate through `plugins/ai-agent-engine-codex/skills/ae-*/` directories
   - Read each SKILL.md and extract skill name from frontmatter or filename
   - Map each skill to its primary phase(s) based on SKILL.md description or categorization
   - Example:
     ```json
     {
       "ae-ideate": ["Define"],
       "ae-brainstorm": ["Define"],
       "ae-plan": ["Plan"],
       "ae-work": ["Build"],
       "ae-review": ["Review"],
       "ae-ship": ["Ship"],
       "ae-test-browser": ["Verify", "Build"]
     }
     ```

**Tests**:
- JSON schema validation: file parses as valid JSON
- Markdown validation: transition guide has no broken links

**Validation**:
- `node -e "console.log(JSON.parse(require('fs').readFileSync('docs/ae/references/skills-to-phases.json')))"` confirms valid JSON
- `cat docs/ae/references/phase-transition-guide.md | wc -l` shows ~100-150 lines
- Cross-check: phase metadata count matches actual skill count (if `check-ae-artifacts.mjs` is updated)

**Rollback signals**:
- Phase metadata goes stale after skill catalog changes
- Phases don't map clearly to actual skill usage patterns

**Deferred**:
- Automation to validate phase metadata against actual skills; can add to `check-ae-artifacts.mjs` later

### U7 — Apply Progressive Disclosure to ae-help

**Goal**: Make initial help output lightweight; full persona/phase/budget docs available on request.

**Requirements covered**: PRD goal 3, acceptance criterion 7.

**Acceptance criteria**:
- `ae-help` initial output lists skill names and one-line descriptions (no change to current output)
- Document optional flags:
  - `ae-help --personas`: display expert-personas.md excerpt
  - `ae-help --phases`: display skills-to-phases.json and phase-transition-guide
  - `ae-help --anti-rationalization`: display anti-rationalization.md excerpt
  - `ae-help --budget`: display token budget estimation guidance from ae-plan
  - `ae-help --full`: display all supplementary docs
- Update `ae-help` SKILL.md to document these flags
- Update plugin source and mirror

**Depends on**: U1, U4, U5, U6.

**Files**:
- `plugins/ai-agent-engine-codex/skills/ae-help/SKILL.md`
- `.agents/skills/ae-help/SKILL.md`

**Approach**:
- Find current `ae-help` command/usage section
- Add "Progressive Disclosure Flags" subsection documenting each flag and its output
- Example:
  ```
  ae-help --personas
    → Displays expert-personas.md (code reviewer, test engineer, security auditor, performance auditor)
  ae-help --phases
    → Displays phase-transition-guide.md and skills-to-phases.json mapping
  ae-help --budget
    → Displays token budget estimation section from ae-plan SKILL.md
  ```
- Note that initial `ae-help` (no flags) shows lightweight skill list as before
- Note that flags can be combined: `ae-help --personas --budget` shows both

**Tests**:
- Mirror check
- Help smoke: `ae-help --personas` succeeds and displays reasonable output

**Validation**:
- `node scripts/check-skill-mirror.mjs`
- `node scripts/ae-tools.mjs help ae-help | grep -i "progressive\|--personas\|--phases"` confirms flags are documented

**Rollback signals**:
- Flags are not documented or are broken
- Initial `ae-help` output is too long (progressive disclosure didn't work)

**Deferred**:
- Auto-detection of context (e.g., if user says "I'm running a multi-agent project", auto-include budget guidance); start with explicit flags

### U8 — Validation and Evidence

**Goal**: Prove reference documents, templates, and skill updates are consistent and ready to ship.

**Requirements covered**: PRD validation expectations, acceptance criterion 8.

**Acceptance criteria**:
- All modified SKILL.md files have matching mirrors under `.agents/skills`
- New reference files (anti-rationalization.md, expert-personas.md, skills-to-phases.json, phase-transition-guide.md) are present and syntactically valid
- Links from skills to reference files are verified
- Validation commands pass or failures are documented with exact blockers
- Gate evidence is written (optional, but recommended)

**Depends on**: U1-U7.

**Files**:
- No new source edits; only validation
- Optional: `docs/ae/gates/20260624T<timestamp>-agent-skills-final.json` (gate proof)

**Approach**:
1. Run mirror validation:
   ```bash
   node scripts/check-skill-mirror.mjs
   ```
2. Run artifact check:
   ```bash
   node scripts/check-ae-artifacts.mjs
   ```
3. Verify reference files:
   ```bash
   # Check anti-rationalization
   cat docs/ae/references/anti-rationalization.md | wc -l
   
   # Check expert personas
   cat docs/ae/references/expert-personas.md | wc -l
   
   # Check JSON schema
   node -e "console.log(JSON.parse(require('fs').readFileSync('docs/ae/references/skills-to-phases.json')))"
   ```
4. Run full test suite:
   ```bash
   npm run check
   ```
5. Optional: write gate proof:
   ```bash
   node scripts/ae-tools.mjs gate --workflow agent-skills-adaptation --checkpoint final --write-proof
   ```

**Validation**:
- All commands above pass or failures are documented
- Final response lists exact command results, skipped checks, and residual risks

**Rollback signals**:
- Mirror check fails
- Artifact validation fails
- Reference files are missing or malformed

**Deferred**:
- None; this unit is final validation

## Validation Plan

**Unit**:
- Mirror check: `node scripts/check-skill-mirror.mjs`
- Artifact check: `node scripts/check-ae-artifacts.mjs`
- Help smoke: `node scripts/ae-tools.mjs help review`, `ae-help work`, `ae-help ae-help`

**Integration**:
- Full test: `npm run check`
- Reference file validation: JSON parsing, markdown syntax

**User Flow**:
- Ask `ae-plan` to create a plan for a real task; verify budget section is present
- Ask `ae-review` to review code; verify evidence_type and evidence_reference fields are requested
- Ask `ae-work` to execute a change; verify Post-Execution Evidence is requested
- Consult `ae-help --personas --anti-rationalization` to verify progressive disclosure works

**Data/Operations**:
- No database, network, lockfile, or dependency changes
- No production-state changes

**Observability**:
- Final response lists exact command names and results
- Gate proof (if written) is saved to `docs/ae/gates/` and referenced in closing summary

## Rollback / Recovery

- Revert any SKILL.md changes and mirrors if evidence requirements become too onerous
- Remove reference files (anti-rationalization.md, expert-personas.md, etc.) if they are not adopted within 2-3 projects
- If token budget estimation becomes a distraction, simplify to "not estimated" as a default option
- If phase metadata goes stale, update `check-ae-artifacts.mjs` to validate against actual skill catalog and warn on drift

## Plan Self-Review

- **Placeholder scan**: pass. No unresolved placeholders remain.
- **Consistency check**: pass. PRD goals map to U1-U8.
- **Scope check**: pass. The plan adapts engineering patterns only; no runtime import or external dependencies.
- **Acceptance coverage**: pass. Each PRD acceptance criterion maps to implementation units or validation commands.
- **Validation gaps**: No runtime tests needed beyond mirror/artifact/smoke checks.
- **Risks and pre-mortems**: Documented. Main risks are adoption (guides are ignored), adoption overhead (too much new content), and staleness (phase metadata drifts). Mitigations are integration into skills, progressive disclosure, and automated checks.
- **Alternatives and ADR check**: pass. Five ADRs document key decisions.
- **High-risk decisions**: ADR-1 (adapt patterns, not runtime) is central; ADR-4 (token budget as awareness, not enforcement) is important. Both have clear mitigation strategies.

## Handoff

**Recommended execution sequence**:

1. **Pre-flight**:
   - Run `git status --short`, `git branch --show-current`, `git log --oneline -1` to confirm clean state
   - Review this plan and PRD with project stakeholders (if applicable)

2. **Phase 1 — Core Discipline & Evidence (U1-U3)**:
   - Execute U1 (anti-rationalization guide): create `docs/ae/references/anti-rationalization.md` and link from skills
   - Execute U2 (ae-review evidence): update SKILL.md for evidence_type/reference
   - Execute U3 (ae-work evidence): update SKILL.md for Post-Execution Evidence
   - Validate: `node scripts/check-skill-mirror.mjs`

3. **Phase 2 — Budget & Lifecycle (U4-U6)**:
   - Execute U4 (token budget in ae-plan): add estimation section
   - Execute U5 (expert personas): create expert-personas.md with 4 personas
   - Execute U6 (lifecycle metadata): create skills-to-phases.json and phase-transition-guide.md
   - Validate: `node scripts/check-ae-artifacts.mjs`, JSON schema check

4. **Phase 3 — Progressive Disclosure & Final (U7-U8)**:
   - Execute U7 (ae-help flags): document progressive disclosure flags
   - Execute U8 (validation): run all checks, collect evidence, write gate proof (optional)
   - Final response: list command results, skipped checks, residual risks

**Git branching** (recommended):
- If staying on `main`, keep edits to skill files and new reference files; no runtime changes.
- If longer or more experimental: create feature branch `codex/agent-skills-adaptation` and merge after validation.

**Timeline**:
- Phase 1: 1-2 implementation sessions (~2-4 hours)
- Phase 2: 2-3 implementation sessions (~4-6 hours)
- Phase 3: 1-2 implementation sessions (~2-4 hours)
- Total: 4-7 implementation sessions over 2-3 weeks with validation gates between phases

## Completion Record

*(To be filled after implementation)*

- **Completed**: [date]
- **Commits**: [git commits applied]
- **Phase 1 result**: [U1-U3 summary]
- **Phase 2 result**: [U4-U6 summary]
- **Phase 3 result**: [U7-U8 summary]
- **Validation result**: [command results and pass/fail status]
- **Documentation result**: [experience document or summary]
- **Archive**: [process archive path]

---

**Document Owner**: Agent Skills Audit and Adaptation  
**Last Updated**: 2026-06-24  
**Status**: Awaiting Review and Execution
