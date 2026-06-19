---
type: plan
status: drafted
date: 2026-06-19
title: claude-code-best-practice-detailed-execution
origin: docs/ae/prds/2026-06-19-003-claude-code-best-practice-adaptation-prd.md
---

# Plan: claude-code-best-practice-detailed-execution

> For agentic workers: implement this plan task-by-task. Use `ae-work` for execution. If using Superpowers execution, use `superpowers:subagent-driven-development` for disjoint units or `superpowers:executing-plans` for inline execution. Keep plugin source and `.agents/skills` mirror synchronized.

## Source

- PRD: `docs/ae/prds/2026-06-19-003-claude-code-best-practice-adaptation-prd.md`
- Audit: `docs/ae/solutions/2026-06-19-claude-code-best-practice-audit.md`
- Prior plan: `docs/ae/plans/2026-06-19-003-claude-code-best-practice-adaptation-plan.md`
- Process evidence: `docs/00-process/active/claude-code-best-practice-audit/progress.md`

## Scope

Implement the first adaptation pass from the audit. This pass updates existing AE skills, focused regression tests, one small Claude delegate diagnostic, and durable memory notes. It does not add new skills, vendor external runtime files, or enable hooks/MCP/schedulers.

## Readiness

- Goal: turn the audit recommendations into enforceable AE guidance and validation.
- Acceptance criteria:
  - regression tests lock the new guidance into plugin source and `.agents/skills` mirror;
  - `ae-skill-audit`, `ae-skill-creator`, `ae-agent-creator`, `ae-claude-code`, `ae-plan`, `ae-review`, and `ae-save-experience` contain the new guidance;
  - `claude-delegate` reports a usable diagnostic when Claude exits successfully with no output;
  - memory docs record the rewrite-only adaptation decision;
  - all validation commands pass.
- Non-goals:
  - no new `ae-extension-router` or `ae-verify` skill;
  - no vendored `.claude` files, hooks, settings, sounds, command catalogs, or prompt text;
  - no broad permission defaults or automatic MCP loading;
  - no dependency installation.
- Affected areas:
  - skill docs under `plugins/ai-agent-engine-codex/skills`;
  - mirrored skill docs under `.agents/skills`;
  - `plugins/ai-agent-engine-codex/scripts/ae-tools.mjs`;
  - `tests/skill-scripts.test.mjs`;
  - `docs/08-ai-memory`.
- Validation surface:
  - targeted node tests;
  - mirror and metadata checks;
  - artifact checks;
  - package check;
  - `task-analyze` plan parsing;
  - whitespace diff check.
- Open questions:
  - none blocking. This plan chooses a minimal script diagnostic plus documentation, not a larger `claude-delegate` CLI flag expansion.

## Assumptions

- The current worktree may already contain the audit/PRD/plan artifacts from the previous step; execution must preserve them.
- The skill mirror is an exact copy of plugin source content for each skill.
- `scripts/ae-tools.mjs` is only a wrapper that imports `plugins/ai-agent-engine-codex/scripts/ae-tools.mjs`; the implementation change belongs in the plugin script.
- The external MIT repository remains reference input only; all wording is rewritten in this project.

## Alternatives Considered

- Recommended: update existing skills, tests, and a small delegate diagnostic.
- Alternative: create a new `ae-extension-router` skill.
- Rejected because: routing guidance belongs in `ae-skill-creator` and `ae-agent-creator` until repeated usage proves a separate entrypoint is needed.

- Alternative: add wrapper support for direct `--add-dir` and read-only tool flags.
- Rejected because: current `--claude-arg` already permits advanced argument passing, and the immediate bug is poor diagnostics when no output is produced.

- Alternative: documentation-only with no script change.
- Rejected because: the previous audit produced a real no-output case; a minimal diagnostic reduces future debugging ambiguity without changing write policy.

## Decision Drivers

- Driver 1: preserve Codex-native skill and approval boundaries.
- Driver 2: make external audit adaptations testable, not just advisory.
- Driver 3: minimize implementation size and avoid runtime feature ports.

## Decisions

### ADR-1 - Existing Skills First

- Decision: improve existing AE skills and defer new skills.
- Drivers: current boundaries already map to audit, creation, delegation, planning, review, and memory workflows.
- Alternatives: add `ae-extension-router`, `ae-verify`, or hook-specific skills.
- Why chosen: fewer entrypoints reduce discovery noise and validation surface.
- Consequences: tests must verify multiple existing skills.
- Follow-ups: split routing into a new skill only if future usage shows repeated standalone demand.

### ADR-2 - Minimal Claude Delegate Diagnostic

- Decision: add a diagnostic field when `claude-delegate` exits `0` with empty stdout and stderr.
- Drivers: observed no-output delegation during the audit; users need a clear retry path.
- Alternatives: add new CLI flags, parse Claude JSON output, or leave behavior unchanged.
- Why chosen: diagnostic-only output does not alter delegation semantics or authorization.
- Consequences: one script test and one skill-doc update are enough.
- Follow-ups: add wrapper flags later only if multiple users need cross-directory Claude audits.

### ADR-3 - Rewrite-Only External Adaptation

- Decision: no source-derived prompt, hook, command, or settings text is copied.
- Drivers: GPL-2.0-only project, MIT notice obligations, runtime mismatch.
- Alternatives: vendor selected examples with attribution.
- Why chosen: workflow ideas are enough for this pass.
- Consequences: implementation text should use AE terminology and local paths.
- Follow-ups: a separate license review is required before any future copied asset/template.

## Risks

- Risk: guidance becomes too verbose and weakens skill trigger clarity.
- Risk: tests assert generic words and fail to protect the actual runtime boundary.
- Risk: `claude-delegate` diagnostic is misread as a failed command even when Claude returned exit code `0`.
- Risk: source/mirror drift appears because several skills are touched in pairs.
- Risk: memory docs are updated with one-off process details instead of durable rules.

## Pre-Mortem

- Failure scenario 1: users read "command", "hook", or "agent team" and think Codex supports Claude runtime features directly.
- Failure scenario 2: future audits copy external `.claude` settings or permission examples because the audit skill lacks a hard runtime filter.
- Failure scenario 3: Claude delegate no-output cases keep looking successful, wasting time during cross-model audits.
- Mitigations:
  - use terms such as `Codex skill`, `helper script`, `agent prompt`, `reference/template`, `defer`, and `reject`;
  - add tests for runtime-boundary phrases;
  - add explicit `diagnostics` output for no-output delegate runs.

## File Structure

- `tests/skill-scripts.test.mjs`
  - Add one regression test for Claude Code best-practice adaptation guidance across source and mirror skills.
  - Add one regression test for `claude-delegate` empty-output diagnostics.
- `plugins/ai-agent-engine-codex/skills/ae-skill-audit/SKILL.md`
  - Add runtime-boundary and source-freshness audit rules.
- `.agents/skills/ae-skill-audit/SKILL.md`
  - Exact mirror of plugin source.
- `plugins/ai-agent-engine-codex/skills/ae-skill-creator/SKILL.md`
  - Add Codex-native extension routing matrix and metadata checklist.
- `.agents/skills/ae-skill-creator/SKILL.md`
  - Exact mirror of plugin source.
- `plugins/ai-agent-engine-codex/skills/ae-agent-creator/SKILL.md`
  - Add agent prompt vs skill vs helper script routing guidance.
- `.agents/skills/ae-agent-creator/SKILL.md`
  - Exact mirror of plugin source.
- `plugins/ai-agent-engine-codex/skills/ae-claude-code/SKILL.md`
  - Add cross-directory read-only delegation and no-output handling guidance.
- `.agents/skills/ae-claude-code/SKILL.md`
  - Exact mirror of plugin source.
- `plugins/ai-agent-engine-codex/scripts/ae-tools.mjs`
  - Add diagnostic metadata to `claudeDelegate` result only.
- `plugins/ai-agent-engine-codex/skills/ae-plan/SKILL.md`
  - Add optional cross-model planning lane guidance.
- `.agents/skills/ae-plan/SKILL.md`
  - Exact mirror of plugin source.
- `plugins/ai-agent-engine-codex/skills/ae-review/SKILL.md`
  - Add second-model advice vs verified finding review rule.
- `.agents/skills/ae-review/SKILL.md`
  - Exact mirror of plugin source.
- `plugins/ai-agent-engine-codex/skills/ae-save-experience/SKILL.md`
  - Add memory placement guidance.
- `.agents/skills/ae-save-experience/SKILL.md`
  - Exact mirror of plugin source.
- `docs/08-ai-memory/03-key-workflows.md`
  - Add stable workflow note for Claude Code best-practice adaptation.
- `docs/08-ai-memory/05-decision-log.md`
  - Add decision record for rewrite-only Claude Code best-practice adaptation.

## Implementation Units

### U0 - Pre-Edit Gate And Baseline

- Goal: confirm starting state and protect existing user changes.
- Requirements covered: all acceptance criteria indirectly.
- Acceptance criteria covered: execution starts from known state.
- Depends on: none.
- Files:
  - none
- Forbidden files:
  - all files except read-only inspection.
- Approach:
  1. Run `git status --short --branch`.
  2. Confirm untracked audit artifacts are expected:
     - `docs/00-process/active/claude-code-best-practice-audit/`
     - `docs/ae/solutions/2026-06-19-claude-code-best-practice-audit.md`
     - `docs/ae/prds/2026-06-19-003-claude-code-best-practice-adaptation-prd.md`
     - `docs/ae/plans/2026-06-19-003-claude-code-best-practice-adaptation-plan.md`
     - this detailed plan.
  3. Read target skill files before editing.
- Tests:
  - none.
- Validation:
  - `git status --short --branch`
- Rollback signals:
  - unexpected modified tracked files in target paths that are not part of the audit work.
- Deferred to implementation:
  - if unexpected user changes exist in target files, inspect and preserve them; do not revert.

### U1 - Add Failing Regression Tests

- Goal: encode expected guidance and delegate diagnostic before editing implementation.
- Requirements covered: PRD requirements 1, 2, 3, 4, 5, 6.
- Acceptance criteria covered:
  - tests fail if audit/routing/delegation guidance is removed from source or mirror;
  - tests cover `claude-delegate` no-output diagnostics.
- Depends on: U0.
- Files:
  - `tests/skill-scripts.test.mjs`
- Forbidden files:
  - `plugins/**`
  - `.agents/**`
  - `docs/08-ai-memory/**`
- Approach:
  1. Add a test named `Claude Code best practice adaptation guidance is present in source and mirror skills`.
  2. Use the existing helper pattern:
     - `readSkillBody('plugins/ai-agent-engine-codex/skills', skillName)`
     - `readSkillBody('.agents/skills', skillName)`
     - `assert.equal(mirrorBody, sourceBody, '<skill> mirror should match plugin source')`
  3. Assert these expectations:
     - `ae-skill-audit`: `/Runtime Boundary Filter/i`, `/source freshness/i`, `/inspected files/i`, `/runtime-specific behavior/i`, `/license/i`
     - `ae-skill-creator`: `/Extension Routing Matrix/i`, `/Codex skill/i`, `/helper script/i`, `/reference\/template/i`, `/reject/i`
     - `ae-agent-creator`: `/Agent Prompt Routing/i`, `/prompt\/template/i`, `/helper script/i`, `/not an auto-registered/i`
     - `ae-claude-code`: `/Cross-Directory Read-Only Delegation/i`, `/--add-dir/`, `/--tools "Read,Grep,Glob"/`, `/empty stdout/i`
     - `ae-plan`: `/Optional Cross-Model Lane/i`, `/untrusted advice/i`, `/Codex remains the orchestrator/i`
     - `ae-review`: `/Second-Model Evidence/i`, `/verified finding/i`, `/untrusted advice/i`
     - `ae-save-experience`: `/Memory Placement/i`, `/AGENTS\\.md/`, `/docs\\/08-ai-memory/`, `/process notes/i`
  4. Add a test named `claude-delegate reports no-output diagnostics`.
  5. In that test, create a temporary `claude.cmd` shim that prints version for `--version` and exits `0` with no stdout/stderr for prompt mode.
  6. Invoke:
     ```js
     const result = runNodeScriptJson(['scripts/ae-tools.mjs', 'claude-delegate', '--prompt', 'NO_OUTPUT', '--command', shimPath])
     ```
  7. Assert:
     - `result.status === 'ok'`
     - `result.stdout === ''`
     - `result.stderr === ''`
     - `Array.isArray(result.diagnostics)`
     - one diagnostic matches `/no output/i`
     - one diagnostic matches `/--add-dir|--tools|--claude-arg/i`
- Tests:
  - Run targeted tests and expect failure before implementation:
    ```powershell
    npm.cmd test -- --test-name-pattern "Claude Code best practice adaptation|no-output diagnostics"
    ```
- Validation:
  - Expected result before U2-U3: failure due missing guidance and missing diagnostics.
- Rollback signals:
  - test requires exact long prose instead of stable boundary phrases.
- Deferred to implementation:
  - keep assertions phrase-based and behavior-based, not paragraph-based.

### U2 - Add Audit And Creation Routing Guidance

- Goal: improve audit and artifact creation workflows with deterministic routing rules.
- Requirements covered: PRD requirements 1, 2, 3, 7.
- Acceptance criteria covered:
  - existing AE skills receive the first adaptation pass;
  - source and mirror stay synchronized.
- Depends on: U1.
- Files:
  - `plugins/ai-agent-engine-codex/skills/ae-skill-audit/SKILL.md`
  - `.agents/skills/ae-skill-audit/SKILL.md`
  - `plugins/ai-agent-engine-codex/skills/ae-skill-creator/SKILL.md`
  - `.agents/skills/ae-skill-creator/SKILL.md`
  - `plugins/ai-agent-engine-codex/skills/ae-agent-creator/SKILL.md`
  - `.agents/skills/ae-agent-creator/SKILL.md`
- Forbidden files:
  - `plugins/ai-agent-engine-codex/skills/ae-help/references/capability-catalog.json`
  - external clone files
  - `.claude/**`
- Approach:
  1. In `ae-skill-audit`, add a `## Runtime Boundary Filter` section after `Workflow` or before `Fit Criteria`.
  2. Include these rules in rewritten AE wording:
     - record source URL, license, observed date or commit when available, and inspected files;
     - classify portable method separately from runtime-specific behavior;
     - reject direct porting of hooks, slash commands, MCP auto-loading, scheduler, permission, sound, or settings behavior unless Codex has an equivalent enforcement mechanism;
     - classify deterministic mechanisms such as source freshness, routing contracts, evidence capture, schema validation, dry-run previews, and bounded tool access.
  3. In `ae-skill-creator`, add `## Extension Routing Matrix`.
  4. The matrix must route requests to:
     - Codex skill: repeatable workflow judgment with clear trigger;
     - helper script: deterministic local parsing or validation;
     - reference/template: optional detail too long for `SKILL.md`;
     - process artifact: one-time PRD, plan, review, or handoff output;
     - reject/defer: runtime behavior Codex cannot enforce.
  5. In `ae-skill-creator`, add a concise metadata checklist:
     - trigger clarity;
     - scope and non-goals;
     - arguments or expected inputs;
     - artifact outputs;
     - forbidden behavior;
     - validation command;
     - mirror sync.
  6. In `ae-agent-creator`, add `## Agent Prompt Routing`.
  7. State that Codex agent guidance is a prompt/template unless a real registry exists, not an auto-registered OpenCode or Claude agent.
  8. Mirror each edited plugin skill file exactly to the corresponding `.agents/skills` file.
- Tests:
  - Run:
    ```powershell
    npm.cmd test -- --test-name-pattern "Claude Code best practice adaptation"
    ```
- Validation:
  - `node scripts/check-skill-mirror.mjs`
- Rollback signals:
  - creator guidance recommends a new skill before checking existing skill fit;
  - audit guidance permits copying external runtime behavior.
- Deferred to implementation:
  - no new reference file unless `SKILL.md` becomes materially too long.

### U3 - Add Claude Delegate Guidance And No-Output Diagnostic

- Goal: make Claude delegation failures diagnosable without changing write policy.
- Requirements covered: PRD requirements 4, 5.
- Acceptance criteria covered:
  - Claude output is treated as untrusted advice;
  - no-output runs produce diagnostic evidence.
- Depends on: U1.
- Files:
  - `plugins/ai-agent-engine-codex/skills/ae-claude-code/SKILL.md`
  - `.agents/skills/ae-claude-code/SKILL.md`
  - `plugins/ai-agent-engine-codex/scripts/ae-tools.mjs`
- Forbidden files:
  - `scripts/ae-tools.mjs`
  - `tests/skill-scripts.test.mjs`
  - lockfiles
  - external clone files
- Approach:
  1. In `ae-claude-code`, add `## Cross-Directory Read-Only Delegation`.
  2. Document that cross-directory audits may need direct Claude CLI invocation with explicit read-only scope, for example:
     ```powershell
     claude -p --output-format json --no-session-persistence --permission-mode plan --tools "Read,Grep,Glob" --allowedTools "Read,Grep,Glob" --add-dir "<external-repo-path>"
     ```
  3. Document that `node scripts/ae-tools.mjs claude-delegate --prompt-file <path>` remains the preferred simple project-root delegation path.
  4. Document that empty stdout/stderr is not usable advice; retry with narrower prompt, summary-only review, or direct CLI arguments.
  5. In `plugins/ai-agent-engine-codex/scripts/ae-tools.mjs`, update `claudeDelegate` result construction so it satisfies the no-output test added in U1:
     - compute `stdout` and `stderr` strings once;
     - add `diagnostics` only when `result.status === 0 && !stdout.trim() && !stderr.trim()`;
     - diagnostic text should mention no output and retry options such as `--claude-arg`, `--add-dir`, and read-only tools.
  6. Keep `status: 'ok'` for exit code `0`; the diagnostic must not convert success into failure.
  7. Mirror `ae-claude-code` plugin source exactly to `.agents/skills/ae-claude-code/SKILL.md`.
- Tests:
  - Run:
    ```powershell
    npm.cmd test -- --test-name-pattern "no-output diagnostics|Claude Code best practice adaptation"
    ```
- Validation:
  - `node scripts/ae-tools.mjs claude-delegate --check`
  - `node scripts/check-skill-mirror.mjs`
- Rollback signals:
  - delegate starts allowing write-capable Claude execution by default;
  - diagnostics appear for normal non-empty Claude output.
- Deferred to implementation:
  - no new wrapper flags in this pass.

### U4 - Add Cross-Model Planning And Review Evidence Rules

- Goal: define when second-model review is useful and how to treat its output.
- Requirements covered: PRD requirement 5.
- Acceptance criteria covered:
  - Claude advice is untrusted until Codex reviews it;
  - planning and review guidance stays optional and bounded.
- Depends on: U3.
- Files:
  - `plugins/ai-agent-engine-codex/skills/ae-plan/SKILL.md`
  - `.agents/skills/ae-plan/SKILL.md`
  - `plugins/ai-agent-engine-codex/skills/ae-review/SKILL.md`
  - `.agents/skills/ae-review/SKILL.md`
- Forbidden files:
  - `plugins/ai-agent-engine-codex/scripts/**`
  - `scripts/**`
- Approach:
  1. In `ae-plan`, add `## Optional Cross-Model Lane`.
  2. State that the lane is optional and should be used only when risk or ambiguity justifies second-model review.
  3. Require a prompt contract that names scope, forbidden files, expected output, validation expectations, and assumptions.
  4. State that Codex remains the orchestrator and that Claude output is untrusted advice until reviewed against repo facts.
  5. In `ae-review`, add `## Second-Model Evidence`.
  6. State that second-model findings must be rechecked before becoming verified findings.
  7. Require labeling rejected second-model advice when it is contradicted by files, scope, or validation evidence.
  8. Mirror both plugin files exactly to `.agents/skills`.
- Tests:
  - Run:
    ```powershell
    npm.cmd test -- --test-name-pattern "Claude Code best practice adaptation"
    ```
- Validation:
  - `node scripts/check-skill-mirror.mjs`
- Rollback signals:
  - plan requires Claude by default;
  - review presents Claude advice as verified without Codex evidence.
- Deferred to implementation:
  - no standalone `ae-verify` skill.

### U5 - Add Memory Placement And Durable Decision Notes

- Goal: capture stable learning without bloating active skill text or help output.
- Requirements covered: PRD requirements 6, 7.
- Acceptance criteria covered:
  - memory guidance distinguishes durable memory from process notes;
  - documentation records license compatibility and rejected runtime assumptions.
- Depends on: U2, U3, U4.
- Files:
  - `plugins/ai-agent-engine-codex/skills/ae-save-experience/SKILL.md`
  - `.agents/skills/ae-save-experience/SKILL.md`
  - `docs/08-ai-memory/03-key-workflows.md`
  - `docs/08-ai-memory/05-decision-log.md`
- Forbidden files:
  - `plugins/ai-agent-engine-codex/skills/ae-help/references/capability-catalog.json`
  - README files
  - generated metadata files
- Approach:
  1. In `ae-save-experience`, add `## Memory Placement`.
  2. Define the placement rule:
     - `AGENTS.md`: durable project rules and operational constraints;
     - `docs/08-ai-memory`: stable cross-session project decisions and reusable workflows;
     - `docs/00-process/active`: in-progress evidence and temporary prompts;
     - `docs/ae/experience`: reusable lessons from completed work;
     - `docs/ae/handoffs`: next-session state;
     - skill `references/`: reusable detail owned by a skill.
  3. In `docs/08-ai-memory/03-key-workflows.md`, add a workflow note for Claude Code best-practice adaptation:
     - use `ae-skill-audit`;
     - rewrite only portable process contracts;
     - prefer existing skills;
     - record rejected runtime assumptions;
     - validate mirror and tests.
  4. In `docs/08-ai-memory/05-decision-log.md`, add a 2026-06-19 decision:
     - adapt `shanraisshan/claude-code-best-practice` as taxonomy and deterministic checks;
     - do not vendor Claude runtime files;
     - impact on audit, creator, delegation, plan, review, and memory guidance;
     - re-evaluate when Codex exposes stable project hooks, scheduler, or agent registry.
  5. Mirror `ae-save-experience` plugin source exactly to `.agents/skills/ae-save-experience/SKILL.md`.
- Tests:
  - Run:
    ```powershell
    npm.cmd test -- --test-name-pattern "Claude Code best practice adaptation"
    ```
- Validation:
  - `node scripts/check-skill-mirror.mjs`
  - `node scripts/check-ae-artifacts.mjs`
- Rollback signals:
  - memory docs include transient command outputs or task-specific prompts as long-term rules.
- Deferred to implementation:
  - no help catalog update in this pass. The guidance remains discoverable through existing skill descriptions.

### U6 - Final Verification And Execution Evidence

- Goal: prove the implementation is consistent, install-safe, and plan-parseable.
- Requirements covered: all.
- Acceptance criteria covered: all validation commands pass.
- Depends on: U1, U2, U3, U4, U5.
- Files:
  - `docs/00-process/active/claude-code-best-practice-audit/progress.md`
- Forbidden files:
  - external clone files
- Approach:
  1. Run the focused test:
     ```powershell
     npm.cmd test -- --test-name-pattern "Claude Code best practice adaptation|no-output diagnostics"
     ```
  2. Run the full test suite:
     ```powershell
     npm.cmd test
     ```
  3. Run mirror and metadata checks:
     ```powershell
     node scripts/check-skill-mirror.mjs
     node scripts/check-skill-language-metadata.mjs
     ```
  4. Run artifact validation:
     ```powershell
     node scripts/check-ae-artifacts.mjs
     ```
  5. Run package check:
     ```powershell
     npm.cmd run check
     ```
  6. Run plan analysis on this plan:
     ```powershell
     node scripts/ae-tools.mjs task-analyze --mode plan --plan docs/ae/plans/2026-06-19-004-claude-code-best-practice-detailed-execution-plan.md
     ```
  7. Run whitespace check:
     ```powershell
     git diff --check
     ```
  8. Append concise validation evidence to `docs/00-process/active/claude-code-best-practice-audit/progress.md`.
- Tests:
  - all tests above.
- Validation:
  - all commands exit `0`.
- Rollback signals:
  - `check-skill-mirror` reports drift;
  - `task-analyze` cannot parse dependencies or files;
  - `npm.cmd run check` fails after docs-only guidance changes.
- Deferred to implementation:
  - if full `npm.cmd run check` fails for unrelated pre-existing reasons, record the exact failure and run the narrow passing commands.

## Parallelization Notes

- Suggested execution strategy: serial preflight and test creation, then U2 and U3 can proceed in the same wave because their owned files are disjoint.
- U4 depends on U3 because it references the delegation evidence contract.
- U5 depends on U2, U3, and U4 because memory notes should reflect the final adapted guidance.
- Safe read-only review parallelism:
  - one reviewer can inspect U2 guidance wording;
  - one reviewer can inspect U3 delegate semantics;
  - one reviewer can inspect U4/U5 documentation boundaries.
- Write-worker parallelism remains disabled unless the executing agent completes the normal Git pre-edit gate and the user explicitly opts into write-worker delegation.

## Validation Plan

- Unit:
  - targeted Node tests for adaptation guidance and delegate diagnostics.
- Integration:
  - mirror check, language metadata check, artifact check, full test suite, full package check.
- User flow:
  - `node scripts/ae-tools.mjs claude-delegate --check`
  - `node scripts/ae-tools.mjs task-analyze --mode plan --plan docs/ae/plans/2026-06-19-004-claude-code-best-practice-detailed-execution-plan.md`
- Data / operations:
  - no database, network write, package install, or external runtime setup.
- Observability:
  - process note records commands and outcomes.

## Rollback / Recovery

- If U1 tests are wrong, revert only the added tests before changing implementation.
- If U2/U4/U5 wording is too broad, revert the specific skill sections and mirror copies, then rerun `node scripts/check-skill-mirror.mjs`.
- If U3 script diagnostic breaks delegate behavior, revert only `plugins/ai-agent-engine-codex/scripts/ae-tools.mjs` and its no-output test, while keeping `ae-claude-code` documentation if still accurate.
- If memory docs become noisy, move one-off evidence back to `docs/00-process/active/claude-code-best-practice-audit/progress.md` and keep only durable decisions in `docs/08-ai-memory`.

## Plan Self-Review

- Placeholder scan: no placeholder tokens are present.
- Consistency check: all implementation units map to the PRD and audit findings.
- Scope check: no new skill, dependency, hook runtime, MCP runtime, or external file vendoring is planned.
- Acceptance coverage:
  - PRD 1: U2;
  - PRD 2: U2;
  - PRD 3: U2;
  - PRD 4: U3;
  - PRD 5: U3 and U4;
  - PRD 6: U5;
  - PRD 7: U5, with no help catalog change by default.
- Validation gaps: none blocking; full `npm.cmd run check` remains the final proof.
- Alternatives and ADR check: existing-skills-first and diagnostic-only choices are recorded.
- High-risk pre-mortem check: runtime-port confusion, source/mirror drift, and Claude output trust boundaries are covered.

## Handoff

When the user approves execution, run `ae-work` against this plan. Do not implement from the older `003` plan unless explicitly requested; this `004` plan is the detailed execution source of truth.
