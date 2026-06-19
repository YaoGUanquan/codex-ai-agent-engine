---
type: prd
status: completed
date: 2026-06-19
topic: ponytail-minimality-adaptation
---

# PRD: Ponytail Minimality Adaptation for AE Skills

## Source

- User request: combine the prior `ae-skill-audit` analysis of `https://github.com/DietrichGebert/ponytail` with the current AE project and create an executable landing plan.
- External repository inspected: `DietrichGebert/ponytail`, observed HEAD `ff5d0936bee1f1267f4f4a7c34a2e6c796254f0b`.
- External license: MIT.
- Local repository: `ai-agent-engine-codex`, GPL-2.0-only, Codex-native AE workflow skills.

## Problem

Current AE skills already encourage scoped, validated work, but the implementation and review flows do not yet have an explicit, reusable gate for avoiding over-engineering before code is written or during review. The `ponytail` repository contains useful workflow patterns for:

- choosing the smallest correct implementation,
- preferring stdlib, native platform features, and already-installed dependencies,
- rejecting speculative abstractions,
- reviewing diffs and repositories specifically for deletable complexity,
- tracking deliberate simplifications with a ceiling and revisit trigger.

The useful parts should be adapted into AE-native skills without importing Ponytail's always-on persona, lifecycle hooks, benchmark marketing, mode persistence, or separate command catalog.

## Goals

- Add an explicit minimality decision gate to AE implementation workflows.
- Add an optional complexity-review lane to AE review workflows.
- Improve plan/task-loop guidance so agents consider stdlib/native/existing dependency options before adding abstractions or dependencies.
- Preserve AE's current artifact model, plugin source plus `.agents/skills` mirror, bilingual metadata checks, and Codex approval model.
- Keep the active skill catalog focused by improving existing AE skills instead of adding `ponytail-*` skills.

## Affected Users and Systems

- Codex agents using this repository's AE skills.
- Maintainers updating `plugins/ai-agent-engine-codex/skills/*` and `.agents/skills/*`.
- Downstream projects installing the AE plugin and relying on `ae-work`, `ae-review`, `ae-plan`, and `ae-task-loop`.

## Functional Requirements

1. `ae-work` must instruct implementation agents to run a minimality gate before editing behavior:
   - ask whether the requested behavior needs to exist as code,
   - check whether stdlib covers it,
   - check whether platform/native capability covers it,
   - check whether an already-installed dependency covers it,
   - reject new dependencies or abstractions unless justified by the request or repo constraints,
   - keep necessary validation, security, accessibility, and trust-boundary checks.
2. `ae-work` cleanup must detect overbuilt implementation artifacts:
   - speculative abstractions,
   - single-use wrappers,
   - dependency additions for trivial behavior,
   - duplicate helpers,
   - placeholder flexibility,
   - broad formatting churn.
3. `ae-review` must support a complexity-focused lane or mode without replacing its correctness/security/validation review.
4. `ae-review` complexity findings must use a small taxonomy:
   - `delete`: dead or speculative code,
   - `stdlib`: hand-rolled standard-library behavior,
   - `native`: platform feature should replace code or dependency,
   - `yagni`: abstraction/configuration/flexibility without current need,
   - `shrink`: same behavior with materially less code.
5. `ae-plan` must require alternatives to consider stdlib/native/existing dependency options for implementation-heavy plans.
6. `ae-task-loop` must keep each repair iteration to the smallest plausible change before broadening scope.
7. Any deliberate simplification convention must be AE-native and must name both:
   - the known ceiling,
   - the trigger for revisiting the shortcut.
8. The implementation must update plugin source and `.agents/skills` mirror consistently.
9. The implementation must update help catalog and language metadata only if descriptions or discoverability change.
10. The implementation must include validation commands proving mirror, metadata, artifact, and syntax consistency.

## Non-Goals

- Do not import Ponytail as a dependency.
- Do not create `ponytail`, `ponytail-review`, `ponytail-audit`, `ponytail-debt`, `ponytail-gain`, or `ponytail-help` skills.
- Do not add Ponytail lifecycle hooks, mode tracker, default mode config, or always-on session injection.
- Do not copy Ponytail skill text verbatim.
- Do not add benchmark scoreboard output or per-repo savings claims.
- Do not weaken correctness, security, validation, data-loss handling, accessibility, or user-explicit requirements in the name of minimality.
- Do not change unrelated AE skills or docs outside the landing scope.

## Acceptance Criteria

- `ae-work` contains a clear Minimality Gate that can be followed before code edits.
- `ae-review` contains a clear complexity review lane with tags and boundaries.
- `ae-plan` contains a planning-time check for simpler existing capabilities before introducing new code, abstractions, or dependencies.
- `ae-task-loop` contains a smallest-change iteration rule.
- The plugin source and `.agents` mirror remain consistent.
- No Ponytail runtime hook, command adapter, benchmark card, or persona-specific mode is added.
- Validation passes:
  - `node scripts/check-skill-mirror.mjs`
  - `node scripts/check-skill-language-metadata.mjs`
  - `node scripts/check-install-smoke.mjs`
  - `node scripts/check-ae-artifacts.mjs`
  - `npm run check`

## Constraints

- Current project license is `GPL-2.0-only`; Ponytail is MIT. Prefer method adaptation over copied text to avoid adding license boilerplate to skill files.
- Codex skills are triggered by skill metadata and user wording; slash commands and hooks must not be assumed.
- Current project convention requires skill changes in both:
  - `plugins/ai-agent-engine-codex/skills/*`
  - `.agents/skills/*`
- Documentation and generated text should remain UTF-8.
- Work should be narrow and avoid broad catalog redesign.

## Assumptions

- The prior audit conclusion is accepted: verdict `ADAPT`, not `ADOPT`.
- The highest value landing path is improving existing skills, not creating new Ponytail-named skills.
- `ae-work` and `ae-review` are the primary targets; `ae-plan` and `ae-task-loop` are secondary refinements.
- No sub-agent execution is required for this small cross-skill documentation change.

## Risks

- Minimality wording could be misread as permission to remove validation or security checks.
- A complexity lane could dilute `ae-review`'s findings-first correctness focus if not clearly scoped.
- Updating only `.agents/skills` or only plugin source would create mirror drift.
- Help catalog and metadata could become stale if public descriptions change.

## Validation Expectations

- Static artifact validation for PRD and plan frontmatter.
- Skill mirror validation after implementation.
- Skill language metadata validation after implementation.
- Install smoke validation after implementation.
- Full project check before delivery.

## Open Questions

- Should the complexity lane be invoked automatically for every significant `ae-review`, or only when the user asks for over-engineering/minimality review?
- Should deliberate simplification markers use a standard comment token such as `AE deferred:` or remain plain plan/review notes?
- Should a future `ae-debt-ledger` skill be created to harvest simplification markers, or should that remain out of scope until real markers accumulate?

## Completion

- Completed: 2026-06-19
- Commit: `43bb77d feat: adapt minimality review guidance`
- Outcome: accepted as an AE-native adaptation. Existing skills were improved instead of adding Ponytail-named skills or importing runtime hooks.
- Validation evidence:
  - `node --test --test-name-pattern "Ponytail-inspired minimality guidance" tests/skill-scripts.test.mjs`
  - `node --test tests/skill-scripts.test.mjs`
  - `npm.cmd run check`
  - `node scripts/check-skill-mirror.mjs`
  - `node scripts/check-ae-artifacts.mjs`
- Archive: `docs/00-process/archive/2026-06/ponytail-minimality-adaptation/summary.md`
