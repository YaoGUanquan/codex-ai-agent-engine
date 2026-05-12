---
type: plan
status: drafted
date: 2026-05-12
title: dev-workflow-skill-enhancement
origin: conversation:/ae-ideate-superpowers-openai-plugins-dev-skills
originFingerprint: 2026-05-12-superpowers-openai-plugins-dev-workflow
---

# Plan: dev-workflow-skill-enhancement

## Source

This plan turns the prior ideation into an implementation path for making this project a stronger Codex development workflow plugin.

Inputs:

- Current AE for Codex repository structure and existing skills under `plugins/ai-agent-engine-codex/skills`.
- Current project-local mirror skills under `.agents/skills`.
- Current capability catalog at `plugins/ai-agent-engine-codex/skills/ae-help/references/capability-catalog.json`.
- Existing installer and metadata language flow in `scripts/install-project.mjs` and `plugins/ai-agent-engine-codex/scripts/set-language.mjs`.
- External reference: `https://github.com/obra/superpowers/tree/main/skills`.
- External reference: `https://github.com/openai/plugins/tree/main/plugins/build-web-apps/skills`.
- External reference: `https://github.com/openai/plugins/tree/main/plugins/build-ios-apps/skills`.
- External reference: `https://github.com/openai/plugins/tree/main/plugins/build-macos-apps/skills`.
- External reference: `https://github.com/openai/plugins/tree/main/plugins/expo/skills`.

## Scope

In scope:

- Strengthen the existing core workflow skills:
  - `ae-brainstorm`
  - `ae-plan`
  - `ae-work`
  - `ae-review`
  - `ae-frontend-design`
  - `ae-test-browser`
  - `ae-sql`
- Add first-phase development skills:
  - `ae-web-app`
  - `ae-backend`
  - `ae-debug`
  - `ae-tdd`
- Update project-local skill metadata, capability catalog, README files, install docs, and plugin manifest prompts so the new skills are discoverable.
- Keep external repositories as references. Reimplement the useful workflow logic in AE wording instead of copying runtime assumptions or vendoring external plugin packages.
- Preserve the existing Codex boundary: skills plus deterministic local scripts, not OpenCode runtime hooks or mandatory automatic slash-command behavior.

Out of scope for this phase:

- Default installation of iOS, macOS, or Expo-specific skills.
- New MCP servers or app integrations.
- Automatic creation of git worktrees, commits, pushes, pull requests, or destructive git operations.
- Direct vendoring of external skill text without explicit license review and attribution.
- Changing global Codex configuration.

Deferred candidates:

- `ae-mobile-expo` for Expo and React Native workflows.
- `ae-apple-dev` for iOS/macOS SwiftUI, AppKit, build, run, debug, and package loops.
- `ae-address-review` for applying review feedback.
- `ae-finish` for branch completion and delivery options.

## Decisions

- Keep `plugins/ai-agent-engine-codex/skills` as the source package that target projects receive during install.
- Keep `.agents/skills` synchronized because this repository uses those mirrored skills as the local Codex entrypoints.
- Prefer enhancing existing skills before adding new ones when the trigger is already clear.
- Add new skills only where the current capability list has a real gap:
  - `ae-web-app` for web/frontend/full-stack implementation workflows.
  - `ae-backend` for API, service, persistence, permissions, and backend test workflows.
  - `ae-debug` for systematic debugging.
  - `ae-tdd` for red-green-refactor work.
- Use `superpowers` mainly for workflow discipline:
  - brainstorm before design-heavy work,
  - isolate high-risk work with explicit user approval,
  - write plans with exact files and validation,
  - execute in small checkpoints,
  - prefer evidence before claiming completion,
  - use review as a gate for serious issues.
- Use `openai/plugins` mainly for domain development guidance:
  - web app implementation and debugging loops,
  - React and shadcn conventions when detected,
  - browser acceptance evidence,
  - Supabase/Postgres considerations when relevant,
  - Stripe/payment guidance only when payment work is in scope.

## Risks

- Skill list bloat: adding too many top-level skills can make `ae-help` harder to use.
- Runtime mismatch: `superpowers` contains mandatory workflow and platform assumptions that should not override Codex approval and delegation rules.
- Domain overreach: iOS, macOS, Expo, Stripe, Supabase, and shadcn are valuable only when the target project uses them.
- Drift between `plugins/ai-agent-engine-codex/skills` and `.agents/skills` can make local behavior differ from installed behavior.
- Metadata drift: new skills must be represented in `agents/openai.yaml`, `set-language.mjs`, capability catalog, README files, and install docs.
- Attribution risk: external references should be named in docs and NOTICE if their logic materially influences the implementation.

## Implementation Units

### U1 - Define reference and attribution policy

- Goal: Make external-reference usage explicit before changing skills.
- Requirements covered: external references are used as inspiration, not runtime dependencies.
- Depends on: none.
- Files:
  - `NOTICE.md`
  - `README.md`
  - `README.en.md`
  - `README.zh-CN.md`
  - `plugins/ai-agent-engine-codex/.codex-plugin/plugin.json`
- Approach:
  - Add a concise note that this project remains an AE for Codex package and may incorporate reimplemented workflow ideas inspired by `obra/superpowers` and selected `openai/plugins` development skill patterns.
  - Avoid claiming runtime compatibility with either external project.
  - Keep the Gitee AE reference as the primary upstream reference.
  - Record that external skill text should not be copied wholesale without a license check.
- Tests:
  - None beyond documentation review.
- Validation:
  - Confirm the modified docs still state the Codex boundary clearly.
  - Confirm no new doc says slash commands, hooks, or external app integrations are automatically available.
- Deferred to implementation:
  - Exact wording and whether references live in README, NOTICE, or both.

### U2 - Strengthen core planning workflow skills from `superpowers`

- Goal: Improve the existing AE main chain before adding domain-specific skills.
- Requirements covered: brainstorm, planning, work execution, review, verification-before-completion, and worktree discipline.
- Depends on: U1.
- Files:
  - `plugins/ai-agent-engine-codex/skills/ae-brainstorm/SKILL.md`
  - `plugins/ai-agent-engine-codex/skills/ae-plan/SKILL.md`
  - `plugins/ai-agent-engine-codex/skills/ae-plan/references/plan-template.md`
  - `plugins/ai-agent-engine-codex/skills/ae-work/SKILL.md`
  - `plugins/ai-agent-engine-codex/skills/ae-work/references/shipping-workflow.md`
  - `plugins/ai-agent-engine-codex/skills/ae-review/SKILL.md`
  - `.agents/skills/ae-brainstorm/SKILL.md`
  - `.agents/skills/ae-plan/SKILL.md`
  - `.agents/skills/ae-plan/references/plan-template.md`
  - `.agents/skills/ae-work/SKILL.md`
  - `.agents/skills/ae-work/references/shipping-workflow.md`
  - `.agents/skills/ae-review/SKILL.md`
- Approach:
  - Add `ae-brainstorm` guidance for design-heavy work: ask focused questions, explore options, show proposed design slices, and capture durable design decisions when useful.
  - Add `ae-plan` requirements for task quality: stable unit IDs, exact file paths, dependencies, validation commands, rollback signals, and open questions.
  - Add `ae-work` execution discipline: baseline check, small checkpoints, blocker handling, validation evidence, and final gate proof.
  - Add worktree guidance to `ae-work` as a risk decision, while preserving user approval for actual worktree creation.
  - Add `ae-review` review gates: severity-first findings, spec compliance before code polish, and serious issues blocking continued execution.
  - Keep all wording compatible with Codex rules on sub-agents, git writes, destructive commands, network, and approvals.
- Tests:
  - Review-only; this unit updates skill instructions and references.
- Validation:
  - `node scripts/ae-tools.mjs help plan`
  - `node scripts/ae-tools.mjs help work`
  - Manual check that the skill text does not mandate automatic sub-agent spawning or git writes.
- Deferred to implementation:
  - Whether to add new reference files for worktree discipline and verification evidence, or keep the first phase inside existing SKILL/reference files.

### U3 - Strengthen frontend and browser validation skills from `openai/plugins`

- Goal: Make existing frontend skills useful for real web product work, not only first-screen UI creation.
- Requirements covered: frontend implementation, UI quality, browser debugging, responsive verification, and evidence reporting.
- Depends on: U1.
- Files:
  - `plugins/ai-agent-engine-codex/skills/ae-frontend-design/SKILL.md`
  - `plugins/ai-agent-engine-codex/skills/ae-frontend-design/references/web-ui-quality.md`
  - `plugins/ai-agent-engine-codex/skills/ae-test-browser/SKILL.md`
  - `plugins/ai-agent-engine-codex/skills/ae-test-browser/references/browser-acceptance.md`
  - `.agents/skills/ae-frontend-design/SKILL.md`
  - `.agents/skills/ae-frontend-design/references/web-ui-quality.md`
  - `.agents/skills/ae-test-browser/SKILL.md`
  - `.agents/skills/ae-test-browser/references/browser-acceptance.md`
- Approach:
  - Expand `ae-frontend-design` to inspect stack, routing, design system, component library, state/data flow, and existing UX conventions.
  - Add guidance for expected frontend states: loading, empty, error, disabled, validation errors, optimistic states, destructive confirmations, and responsive behavior.
  - Add React/Next/Vite-specific guidance only as conditional rules when those stacks are detected.
  - Add shadcn guidance only when `components.json` or local shadcn patterns exist.
  - Expand `ae-test-browser` to require target route, acceptance flow, nonblank page check, console health, network failures, screenshot evidence, and at least one meaningful interaction.
  - Require desktop and mobile viewport checks when layout or responsive behavior matters.
- Tests:
  - None directly; instructions only.
- Validation:
  - `node scripts/ae-tools.mjs help frontend`
  - `node scripts/ae-tools.mjs help browser`
  - Manual check that browser acceptance requires actual tool execution before claiming pass.
- Deferred to implementation:
  - Exact browser evidence template format.

### U4 - Add `ae-web-app`

- Goal: Add a web development entrypoint that covers frontend and web full-stack work better than `ae-frontend-design` alone.
- Requirements covered: web app implementation, UI workflow, React/Next/Vite stack awareness, browser QA, deployment-readiness checks, optional payment/database concerns.
- Depends on: U2, U3.
- Files:
  - `plugins/ai-agent-engine-codex/skills/ae-web-app/SKILL.md`
  - `plugins/ai-agent-engine-codex/skills/ae-web-app/agents/openai.yaml`
  - `plugins/ai-agent-engine-codex/skills/ae-web-app/references/web-app-workflow.md`
  - `plugins/ai-agent-engine-codex/skills/ae-web-app/references/react-guidance.md`
  - `plugins/ai-agent-engine-codex/skills/ae-web-app/references/deployment-readiness.md`
  - `.agents/skills/ae-web-app/SKILL.md`
  - `.agents/skills/ae-web-app/agents/openai.yaml`
  - `.agents/skills/ae-web-app/references/web-app-workflow.md`
  - `.agents/skills/ae-web-app/references/react-guidance.md`
  - `.agents/skills/ae-web-app/references/deployment-readiness.md`
- Approach:
  - Position `ae-web-app` as the main entrypoint for web pages, dashboards, admin tools, frontend features, and simple web full-stack tasks.
  - Route pure first-version UI work to `ae-frontend-design` when appropriate.
  - Route browser acceptance to `ae-test-browser`.
  - Route backend-only API work to `ae-backend`.
  - Include conditional guidance for React, Next.js, Vite, shadcn, Supabase, Stripe, and deployment only when detected or requested.
  - Require dev server and browser verification when the web app cannot be validated by static file inspection.
- Tests:
  - None directly; instruction package only.
- Validation:
  - Confirm skill appears in local `.agents/skills`.
  - Confirm `node scripts/ae-tools.mjs help web` includes the new skill after U8.
  - Confirm `node scripts/set-ae-language.mjs --lang en`, `--lang zh-CN`, and `--lang bilingual` can update the metadata after U8.
- Deferred to implementation:
  - Whether the default prompt says "web app" or "frontend/full-stack web".

### U5 - Add `ae-backend`

- Goal: Add a backend development entrypoint for API, service, persistence, security boundary, and backend validation work.
- Requirements covered: backend implementation, API contracts, DTO/VO shape, database access, permissions, tests, and rollout risk.
- Depends on: U2.
- Files:
  - `plugins/ai-agent-engine-codex/skills/ae-backend/SKILL.md`
  - `plugins/ai-agent-engine-codex/skills/ae-backend/agents/openai.yaml`
  - `plugins/ai-agent-engine-codex/skills/ae-backend/references/backend-workflow.md`
  - `plugins/ai-agent-engine-codex/skills/ae-backend/references/api-contract-checklist.md`
  - `.agents/skills/ae-backend/SKILL.md`
  - `.agents/skills/ae-backend/agents/openai.yaml`
  - `.agents/skills/ae-backend/references/backend-workflow.md`
  - `.agents/skills/ae-backend/references/api-contract-checklist.md`
- Approach:
  - Position `ae-backend` as the entrypoint for endpoints, services, repositories, jobs, permissions, migrations, and backend bug fixes.
  - Require repository-grounded contract discovery before changing DTOs, routes, permissions, or schema behavior.
  - Require narrow tests for behavior changes and broader validation for shared service or persistence changes.
  - Integrate with `ae-sql` for SQL generation/review and with `ae-swagger-parser` for OpenAPI inspection.
  - Include Supabase/Postgres guidance only when the project uses Supabase/Postgres or the user asks for it.
- Tests:
  - None directly; instruction package only.
- Validation:
  - Confirm `node scripts/ae-tools.mjs help backend` includes the new skill after U8.
  - Manual review that the skill does not assume a specific backend framework.
- Deferred to implementation:
  - Whether to add separate framework references later for Java/Spring, Node, Go, Python, or .NET.

### U6 - Add `ae-debug`

- Goal: Add a systematic debugging entrypoint for failing tests, broken builds, runtime errors, UI failures, and API incidents.
- Requirements covered: reproduce, observe, form hypotheses, inspect data/control flow, apply minimal fix, verify.
- Depends on: U2.
- Files:
  - `plugins/ai-agent-engine-codex/skills/ae-debug/SKILL.md`
  - `plugins/ai-agent-engine-codex/skills/ae-debug/agents/openai.yaml`
  - `plugins/ai-agent-engine-codex/skills/ae-debug/references/debugging-workflow.md`
  - `.agents/skills/ae-debug/SKILL.md`
  - `.agents/skills/ae-debug/agents/openai.yaml`
  - `.agents/skills/ae-debug/references/debugging-workflow.md`
- Approach:
  - Require reproduction or a concrete observed failure before editing.
  - Capture exact error text, command, route, request, user action, or screenshot evidence.
  - Inspect recent changes and nearest failing path before proposing a broad redesign.
  - Use hypotheses with disconfirming checks.
  - Prefer the smallest behavior-preserving fix and add regression tests when practical.
  - Route UI debugging through `ae-test-browser` when a real browser is needed.
- Tests:
  - None directly; instruction package only.
- Validation:
  - Confirm `node scripts/ae-tools.mjs help debug` includes the new skill after U8.
  - Manual review that the skill requires evidence before claiming root cause.
- Deferred to implementation:
  - Whether to include a reusable failure report template.

### U7 - Add `ae-tdd`

- Goal: Add an explicit red-green-refactor workflow for high-confidence behavior changes and bug fixes.
- Requirements covered: failing test first, minimal implementation, refactor, regression protection, validation evidence.
- Depends on: U2.
- Files:
  - `plugins/ai-agent-engine-codex/skills/ae-tdd/SKILL.md`
  - `plugins/ai-agent-engine-codex/skills/ae-tdd/agents/openai.yaml`
  - `plugins/ai-agent-engine-codex/skills/ae-tdd/references/tdd-workflow.md`
  - `.agents/skills/ae-tdd/SKILL.md`
  - `.agents/skills/ae-tdd/agents/openai.yaml`
  - `.agents/skills/ae-tdd/references/tdd-workflow.md`
- Approach:
  - Use `ae-tdd` when the user requests TDD, when a regression test is the safest path, or when behavior is precise enough to test first.
  - Require the failing test to fail for the expected reason before implementation.
  - Require the smallest production change needed to pass.
  - Require refactor only after tests pass.
  - Allow explicit fallback when the repository lacks a usable test harness, but record the reason and substitute the narrowest practical verification.
- Tests:
  - None directly; instruction package only.
- Validation:
  - Confirm `node scripts/ae-tools.mjs help tdd` includes the new skill after U8.
  - Manual review that the workflow does not force TDD on every task.
- Deferred to implementation:
  - Whether `ae-work` should explicitly route bugfixes to `ae-tdd` by default or only recommend it.

### U8 - Update discovery, metadata, docs, and install surface

- Goal: Make enhanced and new skills visible, installable, and language-switchable.
- Requirements covered: capability catalog, skill metadata, README/install docs, local mirror consistency.
- Depends on: U2, U3, U4, U5, U6, U7.
- Files:
  - `plugins/ai-agent-engine-codex/skills/ae-help/references/capability-catalog.json`
  - `.agents/skills/ae-help/references/capability-catalog.json`
  - `plugins/ai-agent-engine-codex/scripts/set-language.mjs`
  - `README.md`
  - `README.en.md`
  - `README.zh-CN.md`
  - `INSTALL.md`
  - `INSTALL.zh-CN.md`
  - `plugins/ai-agent-engine-codex/.codex-plugin/plugin.json`
- Approach:
  - Add catalog entries for `ae-web-app`, `ae-backend`, `ae-debug`, and `ae-tdd`.
  - Add language metadata entries for the new skills in `set-language.mjs`.
  - Update README capability lists in Chinese and English.
  - Update install docs only where they list capabilities or example prompts.
  - Add one or two default prompts in the plugin manifest for web/backend/debug flows if the manifest remains concise.
  - Preserve current install behavior: the installer copies all directories under `plugins/ai-agent-engine-codex/skills`.
- Tests:
  - Script syntax validation.
- Validation:
  - `npm run check`
  - `node plugins/ai-agent-engine-codex/scripts/ae-tools.mjs help web`
  - `node plugins/ai-agent-engine-codex/scripts/ae-tools.mjs help backend`
  - `node plugins/ai-agent-engine-codex/scripts/ae-tools.mjs help debug`
  - `node plugins/ai-agent-engine-codex/scripts/ae-tools.mjs help tdd`
  - `node scripts/set-ae-language.mjs --lang en`
  - `node scripts/set-ae-language.mjs --lang zh-CN`
  - `node scripts/set-ae-language.mjs --lang bilingual`
- Deferred to implementation:
  - Whether to add a small sync helper for `.agents/skills` mirrors or continue updating both trees explicitly.

### U9 - Validate install and local behavior

- Goal: Prove the new skills survive the same project-local installation path as existing skills.
- Requirements covered: install safety, mirror correctness, metadata language behavior, helper CLI discovery.
- Depends on: U8.
- Files:
  - No source files expected unless validation reveals a bug.
- Approach:
  - Run syntax validation first.
  - Run helper discovery from the repository.
  - Install into a temporary target outside the repository workspace only if permitted by the environment; otherwise use a temporary directory inside the workspace and delete it after validation with explicit path checks.
  - Verify installed target contains:
    - `plugins/ai-agent-engine-codex/skills/ae-web-app`
    - `plugins/ai-agent-engine-codex/skills/ae-backend`
    - `plugins/ai-agent-engine-codex/skills/ae-debug`
    - `plugins/ai-agent-engine-codex/skills/ae-tdd`
    - `.agents/skills/ae-web-app`
    - `.agents/skills/ae-backend`
    - `.agents/skills/ae-debug`
    - `.agents/skills/ae-tdd`
  - Verify language setter updates the new `agents/openai.yaml` files.
- Tests:
  - `npm run check`
  - Install smoke test into a temporary target.
- Validation:
  - `node scripts/install-project.mjs --target <temp-target> --lang bilingual`
  - `node <temp-target>/scripts/ae-tools.mjs help web`
  - `node <temp-target>/scripts/ae-tools.mjs help backend`
  - `node <temp-target>/scripts/ae-tools.mjs help debug`
  - `node <temp-target>/scripts/ae-tools.mjs help tdd`
- Deferred to implementation:
  - Exact temporary target path and cleanup command, subject to current sandbox and approval rules.

### U10 - Document phase-two platform extensions

- Goal: Preserve iOS, macOS, and Expo ideas without adding default platform assumptions.
- Requirements covered: user asked to evaluate `build-ios-apps`, `build-macos-apps`, and `expo`.
- Depends on: U8.
- Files:
  - `docs/ae/solutions/2026-05-12-platform-extension-candidates.md`
  - `README.md`
  - `README.en.md`
  - `README.zh-CN.md`
- Approach:
  - Document `ae-mobile-expo` as a candidate for Expo/React Native, SDK upgrades, EAS, and mobile browser/device validation.
  - Document `ae-apple-dev` as a candidate for iOS/macOS SwiftUI/AppKit workflows, Xcode build/run/debug loops, and packaging.
  - State that these are optional because they depend on platform tooling that many projects do not have.
  - Do not add them to the default capability catalog in phase one.
- Tests:
  - None.
- Validation:
  - Manual review that the docs describe them as candidates, not installed skills.
- Deferred to implementation:
  - Whether phase two should be a separate plugin bundle or new default AE skills.

## Validation Plan

Minimum validation for the full implementation:

```powershell
npm run check
node plugins/ai-agent-engine-codex/scripts/ae-tools.mjs help web
node plugins/ai-agent-engine-codex/scripts/ae-tools.mjs help backend
node plugins/ai-agent-engine-codex/scripts/ae-tools.mjs help debug
node plugins/ai-agent-engine-codex/scripts/ae-tools.mjs help tdd
node scripts/set-ae-language.mjs --lang en
node scripts/set-ae-language.mjs --lang zh-CN
node scripts/set-ae-language.mjs --lang bilingual
node scripts/install-project.mjs --target <temp-target> --lang bilingual
node <temp-target>/scripts/ae-tools.mjs help web
```

Manual validation:

- Confirm all new skills exist in both `plugins/ai-agent-engine-codex/skills` and `.agents/skills`.
- Confirm new skills have `SKILL.md` and `agents/openai.yaml`.
- Confirm the capability catalog and README files list the same first-phase skills.
- Confirm no skill claims automatic slash-command registration, automatic sub-agent spawning, or automatic git writes.
- Confirm references to `superpowers` and `openai/plugins` are attribution/reference notes, not runtime dependency claims.

## Rollback / Recovery

- If the new skills make the capability set too noisy, keep the strengthened existing skills and remove `ae-web-app`, `ae-backend`, `ae-debug`, and `ae-tdd` from:
  - `plugins/ai-agent-engine-codex/skills`
  - `.agents/skills`
  - `plugins/ai-agent-engine-codex/skills/ae-help/references/capability-catalog.json`
  - `.agents/skills/ae-help/references/capability-catalog.json`
  - `plugins/ai-agent-engine-codex/scripts/set-language.mjs`
  - README and install docs
- If language switching breaks, revert the `set-language.mjs` metadata changes first and keep the raw skill folders for manual repair.
- If install smoke tests fail, inspect `scripts/install-project.mjs` and the copied target tree before changing skill content.
- If external-reference wording creates attribution risk, remove source-specific language from user-facing docs and keep a conservative NOTICE-only reference.

## Handoff

Recommended execution order:

1. Run `ae-review domain:document mode:report-only` on this plan.
2. Execute U1 through U3 first to strengthen existing skills without changing the capability count.
3. Execute U4 through U7 to add the four new development skills.
4. Execute U8 to make the new skills discoverable and language-switchable.
5. Execute U9 validation before touching optional platform-extension docs.
6. Execute U10 only after the core skills pass validation.

Recommended next command:

```text
Use ae-review domain:document mode:report-only to review docs/ae/plans/2026-05-12-001-dev-workflow-skill-enhancement-plan.md
```
