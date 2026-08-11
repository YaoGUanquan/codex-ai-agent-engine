<!-- ae-codex:experience -->
# Structural Debt Refactor Experience

## Context

The repository accumulated structural debt: a ~2860-line `ae-tools.mjs` monolith, a 2000+ character `package.json` check string, a 3447-line unified test file, duplicated artifact-check helpers, and weak direct coverage for installer scripts. A prior scan had already removed duplicate `update-project.mjs`, ignored `.tmp-install-smoke-checks/`, wired `check-claims --dry-run`, and archived stale OPTIMIZATION plans.

## Decision

Split by command boundaries without changing CLI behavior:

1. Keep the root thin wrapper importing `plugins/ai-agent-engine-codex/scripts/ae-tools.mjs`; the plugin entry becomes a dispatcher only.
2. Externalize init templates to UTF-8 files under `scripts/ae-tools/init-templates/{en,zh-CN}/` with `{{placeholder}}` substitution; bilingual output composes zh + en.
3. Layer `npm run check` into `check:syntax`, `check:contracts`, `check:smoke`, and `check:all`; move install-smoke to `check:smoke`.
4. Split tests by domain and add an acyclic import-graph regression guard instead of introducing DI/barrel indirection for the existing DAG.
5. Bump distributable version to **0.3.20** (0.3.19 was already taken by a parallel frontend-guidance release).

## Implementation

- Plan: `docs/ae/plans/2026-08-11-001-structural-debt-refactor-plan.md`
- Process archive: `docs/00-process/archive/2026-08/structural-debt-refactor/summary.md`
- Modules: `plugins/ai-agent-engine-codex/scripts/ae-tools/*.mjs` (15 command modules + 30 template files)
- Shared helpers: `plugins/ai-agent-engine-codex/scripts/artifact-check-utils.mjs`
- Syntax runner: `scripts/check-syntax.mjs`
- Tests: `tests/global-install.test.mjs`, `tests/contracts.test.mjs`, `tests/ae-tools.test.mjs`, `tests/skills-docs.test.mjs`, `tests/install-scripts.test.mjs`, `tests/helpers/skill-test-utils.mjs`
- Module layout reference: `docs/ae/references/ae-tools-module-layout.md`
- Commit: `315db38` on `main`

## Validation

```powershell
npm run check:all
npm test
node scripts/check-release-notes.mjs
```

Behavior equivalence evidence:

- Trilingual init output: 48 baseline files byte-identical before vs after split.
- Eight key CLI golden outputs differ only in timestamps or git fingerprints.
- Import-cycle guard verified with a temporary fixture injecting `utils.mjs -> git.mjs -> utils.mjs`.

These checks prove CLI and install contracts; they do not prove runtime acceptance in consumer projects.

## Reusable Lessons

- Mechanical template extraction with sentinel placeholders preserves byte-identical init output better than hand-rewriting templates during a split.
- `node --check` does not detect ESM circular imports; guard the module DAG in tests when command code lives in many sibling modules.
- Named exports along a strict layered DAG are acceptable; do not add barrels or DI unless a second consumer or cycle appears.
