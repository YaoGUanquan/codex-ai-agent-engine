# Ponytail Minimality Adaptation

## Context

The project audited `DietrichGebert/ponytail` as an external skill repository and found useful workflow mechanics around simplest-correct implementation, standard library/native platform preference, and over-engineering review.

## Problem

AE already asked agents to keep work scoped, but the implementation and review skills lacked a concrete decision sequence for avoiding over-engineering. Review also lacked a stable tag set for complexity findings.

## Decision

Adapt the method, not the runtime:

- `ae-work` now has a Minimality Gate before behavior edits.
- `ae-review` now has a Complexity Lane with `delete`, `stdlib`, `native`, `yagni`, and `shrink` tags.
- `ae-plan` now asks implementation-heavy plans to compare the simplest viable route before adding dependencies, abstractions, broad refactors, or extra files.
- `ae-task-loop` now requires each iteration to state the smallest plausible fix hypothesis and broaden only after evidence rules out smaller fixes.

The project intentionally did not import Ponytail skills, lifecycle hooks, mode persistence, statusline behavior, MCP, benchmark display, or persona mode.

## TDD Note

A regression test was added for the skill guidance. The first valid red run failed because `ae-review` did not require complexity findings to include `expected impact`. The green change added that requirement to plugin source and mirror.

## Validation

Commands used:

```bash
node --test --test-name-pattern "Ponytail-inspired minimality guidance" tests/skill-scripts.test.mjs
node --test tests/skill-scripts.test.mjs
npm.cmd run check
node scripts/check-skill-mirror.mjs
node scripts/check-ae-artifacts.mjs
```

Final gate proof:

- `docs/ae/gates/20260619T034035Z-work-final.json`

Git delivery:

- Commit: `43bb77d feat: adapt minimality review guidance`
- Push: `main -> origin/main`
- Archive: `docs/00-process/archive/2026-06/ponytail-minimality-adaptation/summary.md`

## Reusable Lesson

When adapting external skill repositories, prefer portable engineering judgment over importing command catalogs or runtime hooks. For minimality patterns, explicitly protect validation, security, accessibility, data-loss handling, and user-requested behavior so "less code" does not become "less correctness."
