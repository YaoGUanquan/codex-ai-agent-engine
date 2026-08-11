<!-- ae-codex:init managed -->
# Structural Debt Refactor — Archive Summary

- **Status:** done
- **Plan:** `docs/ae/plans/2026-08-11-001-structural-debt-refactor-plan.md`
- **Experience:** `docs/ae/experience/2026-08-11-structural-debt-refactor.md`
- **Version:** 0.3.20
- **Commit:** `315db38` (`refactor: split ae-tools monolith and layer repo checks to 0.3.20`)

## Delivered

| Unit | Outcome |
| --- | --- |
| U1 | Layered `check` / `check:syntax` / `check:contracts` / `check:smoke` / `check:all`; `scripts/check-syntax.mjs` |
| U2 | Split `tests/skill-scripts.test.mjs` → domain files + `tests/helpers/skill-test-utils.mjs` |
| U3 | `artifact-check-utils.mjs`; cross-drive `ensureInsideRepo` hardening |
| U4 | 15 `ae-tools/*.mjs` modules + external init templates; dispatcher-only entry |
| U5 | `tests/install-scripts.test.mjs` (6 cases) |
| U6 | SemVer 0.3.20 + README bilingual release notes |
| Follow-up | Import-cycle regression guard in `tests/ae-tools.test.mjs` (112 tests total) |

## Validation (2026-08-11)

- `npm run check:all` — pass
- `npm test` — 112 pass
- Init byte baseline — 48 files identical
- Pushed to `origin/main`

## Archive note

Active checkpoint file superseded by this summary: former path `docs/00-process/active/structural-debt-refactor/progress.md`.
