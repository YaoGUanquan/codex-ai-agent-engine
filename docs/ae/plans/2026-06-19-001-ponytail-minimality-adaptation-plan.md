---
type: plan
status: completed
date: 2026-06-19
title: ponytail-minimality-adaptation
origin: docs/ae/prds/2026-06-19-001-ponytail-minimality-adaptation-prd.md
originFingerprint: ponytail@ff5d0936bee1f1267f4f4a7c34a2e6c796254f0b
---

# Plan: ponytail-minimality-adaptation

## Source

- PRD: `docs/ae/prds/2026-06-19-001-ponytail-minimality-adaptation-prd.md`
- Prior audit: `DietrichGebert/ponytail` was inspected as a reference-only external skill repository.
- External license: MIT.
- Local constraints: AE skills are maintained in plugin source and mirrored under `.agents/skills`; this project does not import external runtime hooks.
- Pre-edit gate while drafting this plan:
  - `git status --short`: clean
  - `git branch --show-current`: `main`
  - `git log --oneline -1`: `a963261 feat: add AE evidence and utility skills`

## Scope

Adapt Ponytail's minimality and over-engineering review patterns into current AE skills. The implementation should improve existing AE workflows rather than add Ponytail-named skills or runtime behavior.

Primary scope:

- `ae-work`: add implementation-time Minimality Gate and strengthen cleanup rules.
- `ae-review`: add complexity lane taxonomy and boundaries.

Secondary scope:

- `ae-plan`: require simpler existing-capability alternatives before new dependencies or abstractions.
- `ae-task-loop`: require smallest-change repair iterations.
- `ae-help` metadata/catalog: update only if public descriptions need to expose the new behavior.

Out of scope:

- Ponytail hooks, mode persistence, lifecycle activation, statusline, MCP, benchmark display, and `ponytail-*` skill creation.

## Readiness

- Goal: Make AE skills better at preventing and reviewing over-engineering while preserving validation, security, and AE artifact discipline.
- Acceptance criteria:
  - `ae-work` has a Minimality Gate with explicit exceptions for safety, validation, and user-requested behavior.
  - `ae-review` has a complexity-focused lane with `delete`, `stdlib`, `native`, `yagni`, and `shrink` tags.
  - `ae-plan` requires alternatives to consider stdlib/native/existing dependencies before new code or dependencies.
  - `ae-task-loop` requires each iteration to attempt the smallest plausible repair before broadening.
  - Plugin source and `.agents` mirror remain consistent.
  - Validation commands pass or failures are documented with exact blockers.
- Non-goals:
  - No standalone Ponytail skill family.
  - No external runtime scripts from Ponytail.
  - No direct copied Ponytail text.
  - No dependency or lockfile changes.
- Affected areas:
  - `plugins/ai-agent-engine-codex/skills/ae-work/SKILL.md`
  - `plugins/ai-agent-engine-codex/skills/ae-review/SKILL.md`
  - `plugins/ai-agent-engine-codex/skills/ae-plan/SKILL.md`
  - `plugins/ai-agent-engine-codex/skills/ae-task-loop/SKILL.md`
  - `.agents/skills/ae-work/SKILL.md`
  - `.agents/skills/ae-review/SKILL.md`
  - `.agents/skills/ae-plan/SKILL.md`
  - `.agents/skills/ae-task-loop/SKILL.md`
  - Optional: `plugins/ai-agent-engine-codex/skills/ae-review/references/complexity-lane.md`
  - Optional: `.agents/skills/ae-review/references/complexity-lane.md`
  - Optional: `plugins/ai-agent-engine-codex/skills/ae-help/references/capability-catalog.json`
  - Optional: `.agents/skills/ae-help/references/capability-catalog.json`
- Validation surface:
  - `node scripts/check-skill-mirror.mjs`
  - `node scripts/check-skill-language-metadata.mjs`
  - `node scripts/check-install-smoke.mjs`
  - `node scripts/check-ae-artifacts.mjs`
  - `node scripts/ae-tools.mjs help review`
  - `node scripts/ae-tools.mjs help work`
  - `npm run check`
- Open questions:
  - Whether complexity lane should be automatic for significant reviews or explicit only. Recommendation: explicit when requested, available as an internal lens for significant reviews.
  - Whether to create a new reference file for complexity lane. Recommendation: create a small reference only if `ae-review/SKILL.md` becomes too long.

## Assumptions

- Ponytail's useful value is its engineering decision ladder and deletion-oriented review taxonomy, not its persona or multi-harness runtime.
- AE should continue to prefer correctness and validation over smallest possible diff when they conflict.
- This change is documentation/instruction-level skill work; no JavaScript helper script is required unless validation exposes metadata/catalog drift.
- Because current branch is `main`, implementation should either remain very narrow or first create a feature branch if the user wants Git branch isolation.

## Alternatives Considered

- Recommended: Improve existing AE skills with an AE-native minimality gate and complexity lane.
- Alternative: Create new `ae-minimality` or `ae-overengineering-review` skill.
- Rejected because: It would add catalog noise and duplicate `ae-work`/`ae-review` responsibilities.
- Alternative: Import Ponytail plugin or copy its skills under this project.
- Rejected because: It would bring hooks, mode semantics, persona wording, and command assumptions that do not match AE.
- Alternative: Do nothing and rely on current "smallest patch" wording.
- Rejected because: Current wording is too general and does not give agents a concrete decision sequence or finding taxonomy.

## Decision Drivers

- Driver 1: Preserve AE's small, explicit skill catalog.
- Driver 2: Make minimality actionable at implementation and review time.
- Driver 3: Keep safety, validation, and maintainability stronger than code-size reduction.

## Decisions

### ADR-1 - Adapt Minimality as a Gate, Not a Persona

- Decision: Add an AE Minimality Gate to `ae-work` and related skills using neutral engineering language.
- Drivers: AE skills are workflow instructions, not personality modes.
- Alternatives: copy Ponytail mode text; create a separate always-on skill; leave current wording unchanged.
- Why chosen: A gate is enforceable inside AE's existing pre-edit and cleanup structure.
- Consequences: The wording must explicitly protect validation, security, accessibility, and user-requested behavior.
- Follow-ups: If real projects accumulate deliberate simplification notes, consider a future ledger workflow.

### ADR-2 - Add Complexity Review as an Optional Lane

- Decision: Extend `ae-review` with a complexity lane using a small tag taxonomy.
- Drivers: Over-engineering findings are different from correctness/security findings and should be scoped.
- Alternatives: mix complexity notes into architect lane; create separate skill; skip review-side changes.
- Why chosen: A lane keeps `ae-review` findings-first structure while allowing precise deletion recommendations.
- Consequences: The lane must not suppress correctness findings or mark necessary tests as bloat.
- Follow-ups: Add `references/complexity-lane.md` if the inline SKILL section becomes too large.

### ADR-3 - No External Runtime Adoption

- Decision: Do not bring Ponytail hooks, mode tracker, statusline, MCP, or benchmark commands into AE.
- Drivers: AE is Codex-native and project-local; runtime hooks would change behavior outside explicit skill usage.
- Alternatives: install Ponytail alongside AE; add hooks as optional plugin capability.
- Why chosen: Runtime adoption would blur boundaries and create maintenance cost unrelated to the requested optimization.
- Consequences: Users who want Ponytail itself can install it separately; AE only absorbs compatible workflow methods.
- Follow-ups: Mention Ponytail only as a reference in a future audit note if implementation docs need attribution.

## Risks

- Risk: Agents interpret minimality as permission to skip necessary validation.
  - Mitigation: State non-negotiable exceptions in `ae-work`, `ae-review`, and `ae-task-loop`.
- Risk: Complexity lane produces style-only noise.
  - Mitigation: Require concrete replacement or deletion and suppress vague preferences.
- Risk: Mirror drift between plugin source and `.agents/skills`.
  - Mitigation: Edit both copies and run `check-skill-mirror`.
- Risk: Help metadata still describes old behavior if descriptions change.
  - Mitigation: Only update catalog if public description changes; otherwise rely on skill body updates.
- Risk: Creating reference files increases maintenance.
  - Mitigation: Keep initial changes inline unless the skill body becomes hard to scan.

## Pre-Mortem

- Failure scenario 1: `ae-work` Minimality Gate is too aggressive and discourages tests.
  - Mitigations: Add explicit "non-trivial logic still needs narrow validation" and "do not remove safety gates" language.
- Failure scenario 2: `ae-review` complexity lane conflicts with normal findings order.
  - Mitigations: Keep correctness/security findings first; complexity lane is secondary unless user explicitly asks only for over-engineering review.
- Failure scenario 3: Implementation updates only `.agents/skills`, leaving plugin source stale.
  - Mitigations: Treat plugin source and mirror files as paired owned files in every implementation unit.

## Implementation Units

### U1 - Add Minimality Gate to ae-work

- Goal: Give implementation agents a concrete pre-edit decision sequence and post-edit cleanup checks.
- Requirements covered: PRD functional requirements 1, 2, 7, 8.
- Acceptance criteria covered:
  - `ae-work` includes a Minimality Gate before execution rules or inside execution rules.
  - Gate checks need, stdlib, native platform, existing dependency, one-file/smallest patch, and justified abstraction/dependency additions.
  - Gate explicitly protects validation, security, accessibility, error handling that prevents data loss, trust-boundary checks, and user-requested behavior.
  - Cleanup Gate includes overbuilt artifacts and dependency/abstraction drift.
- Depends on: none.
- Files:
  - `plugins/ai-agent-engine-codex/skills/ae-work/SKILL.md`
  - `.agents/skills/ae-work/SKILL.md`
- Forbidden files:
  - `package.json`
  - `package-lock.json`
  - runtime scripts under `scripts/`
- Approach:
  - Insert a concise `Minimality Gate` section after `Task Analysis` and before `Execution Rules`.
  - Add two or three cleanup bullets for speculative abstractions, avoidable dependencies, and unnecessary wrappers.
  - Use AE terminology such as "deferred implementation note" rather than `ponytail:` markers.
- Tests:
  - Mirror validation.
  - Help smoke for `ae-work` if descriptions are unchanged.
- Validation:
  - `node scripts/check-skill-mirror.mjs`
  - `node scripts/ae-tools.mjs help work`
- Rollback signals:
  - Mirror check fails.
  - Gate text contradicts existing `ae-work` rules about validation or safety.
- Deferred to implementation:
  - Exact wording of the deliberate simplification marker.

### U2 - Add Complexity Lane to ae-review

- Goal: Make over-engineering review precise and separable from correctness/security review.
- Requirements covered: PRD functional requirements 3, 4, 8, 9.
- Acceptance criteria covered:
  - `ae-review` documents when to apply a complexity lane.
  - Tags are defined: `delete`, `stdlib`, `native`, `yagni`, `shrink`.
  - Complexity findings require location, evidence, what to cut, replacement, and expected impact.
  - Complexity lane cannot hide P0/P1 correctness, security, data-loss, or contract findings.
- Depends on: none.
- Files:
  - `plugins/ai-agent-engine-codex/skills/ae-review/SKILL.md`
  - `.agents/skills/ae-review/SKILL.md`
  - Optional: `plugins/ai-agent-engine-codex/skills/ae-review/references/complexity-lane.md`
  - Optional: `.agents/skills/ae-review/references/complexity-lane.md`
- Forbidden files:
  - Review contract script unless later automation is explicitly needed.
- Approach:
  - Add a `Complexity Lane` section after current two-lane reviewer/architect guidance.
  - Define the tag taxonomy inline unless the section becomes too long.
  - Keep findings-first output and strictest verdict rules unchanged.
- Tests:
  - Mirror validation.
  - Help smoke for `ae-review`.
- Validation:
  - `node scripts/check-skill-mirror.mjs`
  - `node scripts/ae-tools.mjs help review`
- Rollback signals:
  - Review output template becomes inconsistent with new lane requirements.
  - Complexity lane reads as style advice rather than concrete risk/cut recommendations.
- Deferred to implementation:
  - Whether to update `references/review-output-template.md` with an optional complexity subsection.

### U3 - Strengthen ae-plan Alternatives and Decision Drivers

- Goal: Ensure plans consider simpler existing capabilities before introducing dependencies or abstractions.
- Requirements covered: PRD functional requirements 5, 8.
- Acceptance criteria covered:
  - `ae-plan` alternatives guidance names stdlib/native/existing dependency as required considerations for implementation-heavy work.
  - Plan self-review checks for unjustified dependencies, abstractions, broad refactors, or extra files.
  - Existing high-risk planning rules remain intact.
- Depends on: U1.
- Files:
  - `plugins/ai-agent-engine-codex/skills/ae-plan/SKILL.md`
  - `.agents/skills/ae-plan/SKILL.md`
  - Optional: `plugins/ai-agent-engine-codex/skills/ae-plan/references/plan-template.md`
  - Optional: `.agents/skills/ae-plan/references/plan-template.md`
- Forbidden files:
  - Existing historical plans under `docs/ae/plans/`
- Approach:
  - Add a short sentence to alternatives comparison and Plan Self-Review.
  - Do not expand the plan template unless implementation requires durable per-unit fields.
- Tests:
  - Mirror validation.
  - Artifact check to ensure current plan documents still parse.
- Validation:
  - `node scripts/check-skill-mirror.mjs`
  - `node scripts/check-ae-artifacts.mjs`
- Rollback signals:
  - Planning guidance becomes too heavyweight for small tasks.
- Deferred to implementation:
  - Whether to update `plan-template.md` with a `Minimality check:` field per unit.

### U4 - Add Smallest-Change Rule to ae-task-loop

- Goal: Keep iterative repair loops from broadening into speculative rewrites.
- Requirements covered: PRD functional requirements 6, 8.
- Acceptance criteria covered:
  - Each task-loop iteration must state the smallest plausible fix hypothesis.
  - Scope may broaden only after evidence invalidates smaller fixes.
  - Validation and success criteria cannot be reduced to match the implementation.
- Depends on: U1.
- Files:
  - `plugins/ai-agent-engine-codex/skills/ae-task-loop/SKILL.md`
  - `.agents/skills/ae-task-loop/SKILL.md`
- Forbidden files:
  - `ae-debug` and `ae-tdd` unless a later review finds a routing contradiction.
- Approach:
  - Add one operating principle and one workflow step.
  - Keep the existing stop conditions unchanged.
- Tests:
  - Mirror validation.
- Validation:
  - `node scripts/check-skill-mirror.mjs`
- Rollback signals:
  - New wording conflicts with `ae-debug` or `ae-tdd` routing.
- Deferred to implementation:
  - None.

### U5 - Conditional Help Catalog and Metadata Check

- Goal: Decide whether discoverability artifacts need changes, and update them only if skill descriptions or public help behavior changed.
- Requirements covered: PRD functional requirements 9, 10.
- Acceptance criteria covered:
  - The executor explicitly records whether frontmatter descriptions, help text, or public catalog behavior changed.
  - If public descriptions are updated, capability catalog and language metadata match.
  - If public descriptions are not updated, U5 completes as a no-op with no catalog or metadata edits.
- Depends on: U1, U2, U3, U4.
- Files:
  - `plugins/ai-agent-engine-codex/skills/ae-help/references/capability-catalog.json`
  - `.agents/skills/ae-help/references/capability-catalog.json`
  - `plugins/ai-agent-engine-codex/scripts/skill-language-metadata.mjs`
- Forbidden files:
  - README files unless the implementation intentionally changes public capability wording.
- Approach:
  - Prefer no metadata changes for this first landing if `name` and frontmatter `description` stay stable.
  - If changed, update source metadata and mirror catalog together.
- Tests:
  - Metadata check.
  - Install smoke.
- Validation:
  - `node scripts/check-skill-language-metadata.mjs`
  - `node scripts/check-install-smoke.mjs`
- Rollback signals:
  - Encoding issues in current catalog JSON.
  - Help output displays stale or garbled capability text beyond current known file encoding state.
- Deferred to implementation:
  - Whether to normalize existing catalog encoding is out of scope.

### U6 - Final Validation and Evidence

- Goal: Prove the skill instruction change is internally consistent and shippable.
- Requirements covered: PRD validation expectations.
- Acceptance criteria covered:
  - All selected validation commands are run.
  - Final response includes changed files, commands, results, unverified areas, and residual risks.
  - Optional AE gate proof is written if the implementation uses `ae-work` final gate.
- Depends on: U1, U2, U3, U4.
- Files:
  - No planned source edits.
  - Optional: `docs/ae/gates/*` if a final gate command writes proof.
- Forbidden files:
  - None.
- Approach:
  - First record the U5 decision: no-op if no public descriptions or help/catalog behavior changed; otherwise run U5 before final validation.
  - Run narrow checks first, then `npm run check`.
  - If a command fails due to pre-existing encoding or environment state, capture exact output and decide whether it blocks the implementation.
- Tests:
  - `node scripts/check-skill-mirror.mjs`
  - `node scripts/check-skill-language-metadata.mjs`
  - `node scripts/check-install-smoke.mjs`
  - `node scripts/check-ae-artifacts.mjs`
  - `npm run check`
- Validation:
  - Same as tests.
- Rollback signals:
  - Any required check fails because of the change and cannot be fixed within scope.
- Deferred to implementation:
  - Whether to run a final `node scripts/ae-tools.mjs gate --workflow work --checkpoint final ... --write-proof`.

## Validation Plan

- Unit:
  - `node scripts/check-skill-mirror.mjs`
  - `node scripts/ae-tools.mjs help work`
  - `node scripts/ae-tools.mjs help review`
- Integration:
  - `node scripts/check-skill-language-metadata.mjs`
  - `node scripts/check-install-smoke.mjs`
  - `node scripts/check-ae-artifacts.mjs`
- User flow:
  - Ask `ae-work` to execute a narrow change and verify the new Minimality Gate is visible in the skill instructions.
  - Ask `ae-review mode:report-only` for an over-engineering review and verify complexity tags are available.
- Data / operations:
  - No database, network, lockfile, dependency, or production-state operations.
- Observability:
  - Final implementation report should list exact command results.
  - Optional gate proof may be written under `docs/ae/gates`.

## Rollback / Recovery

- Revert the paired skill files for any unit that introduces confusing behavior.
- If `ae-review` complexity lane proves too noisy, keep only the taxonomy in a reference file and make invocation explicit.
- If `ae-plan` becomes too heavy, remove per-plan minimality requirements and keep the gate only in `ae-work`.
- If metadata/catalog changes cause encoding or display issues, revert metadata changes and keep behavior in skill bodies only.

## Plan Self-Review

- Placeholder scan: pass. No unresolved placeholder sections remain.
- Consistency check: pass. PRD goals map to U1-U6.
- Scope check: pass. The plan adapts workflow instructions only and excludes Ponytail runtime import.
- Acceptance coverage: pass. Each PRD acceptance criterion maps to at least one implementation unit or validation command.
- Validation gaps: no runtime tests are needed unless implementation touches scripts; current plan covers mirror, metadata, install, artifact, help, and full checks.
- Alternatives and ADR check: pass.
- High-risk pre-mortem check: pass. Main risk is weakening validation; mitigation is explicit in U1 and U2.

## Handoff

Recommended execution sequence:

1. Run `git status --short`, `git branch --show-current`, and `git log --oneline -1` again before implementation.
2. If staying on `main`, keep edits limited to the planned skill files and optional references; otherwise create a feature branch such as `codex/ponytail-minimality-adaptation`.
3. Execute U1 and U2 first; these deliver the main value.
4. Execute U3 and U4 as small consistency refinements.
5. Record the U5 metadata/catalog decision; edit catalog or metadata only if public descriptions or help behavior changed.
6. Run U6 validation and report exact evidence.

## Completion Record

- Completed: 2026-06-19
- Commit: `43bb77d feat: adapt minimality review guidance`
- Pushed: `main -> origin/main`
- U1 result: `ae-work` plugin source and mirror gained a Minimality Gate and stronger cleanup checks.
- U2 result: `ae-review` plugin source and mirror gained a Complexity Lane with `delete`, `stdlib`, `native`, `yagni`, and `shrink` tags. TDD added `expected impact` after the first valid red run exposed the omission.
- U3 result: `ae-plan` plugin source and mirror gained simplest-viable-route guidance and a speculative-abstraction self-review check.
- U4 result: `ae-task-loop` plugin source and mirror gained smallest plausible fix hypothesis guidance.
- U5 result: no help catalog or language metadata edit was needed because skill frontmatter descriptions and public help catalog behavior did not change.
- U6 result: validation passed and final gate proof was written at `docs/ae/gates/20260619T034035Z-work-final.json` (ignored by Git per project policy).
- Documentation result: `README.en.md`, `docs/ae/experience/2026-06-19-ponytail-minimality-adaptation.md`, and `docs/08-ai-memory/10-minimality-review.md` document the outcome.
- Archive: `docs/00-process/archive/2026-06/ponytail-minimality-adaptation/summary.md`
