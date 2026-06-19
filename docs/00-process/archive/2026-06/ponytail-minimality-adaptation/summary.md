# Ponytail Minimality Adaptation Archive

## Status

- Archived: 2026-06-19
- Outcome: completed and pushed
- Commit: `43bb77d feat: adapt minimality review guidance`
- Branch: `main`
- Remote: `origin/main`

## Scope

Adapt selected `DietrichGebert/ponytail` minimality and over-engineering review ideas into AE-native skill instructions without importing Ponytail runtime behavior.

## Delivered

- `ae-work`: added Minimality Gate and cleanup checks for avoidable dependencies, hand-rolled stdlib behavior, native capability duplication, speculative abstractions, and single-use wrappers.
- `ae-review`: added Complexity Lane with `delete`, `stdlib`, `native`, `yagni`, and `shrink` tags, including required expected impact.
- `ae-plan`: added simplest-viable-route consideration and speculative-abstraction self-review check.
- `ae-task-loop`: added smallest plausible fix hypothesis rule.
- `tests/skill-scripts.test.mjs`: added regression coverage for plugin source and `.agents` mirror guidance.
- `README.en.md`: documented the Ponytail reference and updated capability descriptions.
- `docs/08-ai-memory/10-minimality-review.md`: stored durable AI memory for future sessions.
- `docs/ae/experience/2026-06-19-ponytail-minimality-adaptation.md`: stored reusable implementation experience.

## Validation

Passed:

```bash
node --test --test-name-pattern "Ponytail-inspired minimality guidance" tests/skill-scripts.test.mjs
node --test tests/skill-scripts.test.mjs
npm.cmd run check
node scripts/check-skill-mirror.mjs
node scripts/check-ae-artifacts.mjs
```

Final gate proof:

- `docs/ae/gates/20260619T034035Z-work-final.json`

## Notes

- Gate JSON files remain ignored by Git via `docs/ae/gates/*.json`.
- The Chinese README and existing Chinese memory files display as mojibake in the current PowerShell output; they were not rewritten during this archive step except for an earlier small English addendum in `docs/08-ai-memory/00-index.md`.
- Future work: consider a dedicated simplification/debt ledger only after real AE deferred markers accumulate.
