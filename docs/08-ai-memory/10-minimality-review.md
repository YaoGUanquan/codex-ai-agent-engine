# Minimality And Complexity Review Adaptation

## Stable Decision

AE adapts selected ideas from `https://github.com/DietrichGebert/ponytail` as workflow guidance only. Do not vendor Ponytail runtime hooks, mode persistence, statusline behavior, MCP, benchmark display, or persona mode into this project.

## Skill Contracts

- `ae-work`: run a Minimality Gate before behavior edits. Prefer no-code/config/deletion, standard library, framework/native platform capability, or existing dependency before new custom code or new dependencies.
- `ae-review`: use a Complexity Lane when reviewing over-engineering, bloat, deletion, dependency, or simplification concerns. Tags are `delete`, `stdlib`, `native`, `yagni`, and `shrink`.
- `ae-plan`: implementation-heavy plans must include the simplest viable route in alternatives and justify new dependencies, abstractions, broad refactors, wrappers, or extra files.
- `ae-task-loop`: each repair iteration should state the smallest plausible fix hypothesis and broaden only after evidence invalidates smaller fixes.

## Non-Negotiable Boundaries

Minimality must not remove or discourage:

- trust-boundary validation,
- security controls,
- accessibility basics,
- data-loss prevention,
- explicit user requirements,
- narrow validation for non-trivial logic.

## Validation Pattern

The regression test `Ponytail-inspired minimality guidance is present in source and mirror skills` in `tests/skill-scripts.test.mjs` locks the guidance into both plugin source and `.agents/skills` mirror. It should fail if source/mirror drift or if the key minimality/complexity language is removed.

## Delivery Record

- First landed in commit `43bb77d feat: adapt minimality review guidance`.
- Process archive: `docs/00-process/archive/2026-06/ponytail-minimality-adaptation/summary.md`.
- Related durable artifacts:
  - `docs/ae/prds/2026-06-19-001-ponytail-minimality-adaptation-prd.md`
  - `docs/ae/plans/2026-06-19-001-ponytail-minimality-adaptation-plan.md`
  - `docs/ae/experience/2026-06-19-ponytail-minimality-adaptation.md`
