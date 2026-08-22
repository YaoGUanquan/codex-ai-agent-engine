# 2026-08-22 mattpocock/skills watch

## Worktree decision

Preserve existing dirty `main` at `ae337da`. No branch, reset, or Git write.

## Units

- U1: watchlist + memory + registry. Live `git ls-remote` and LICENSE re-read recorded `5b15a47f2d7150f545fbcacbfe381787fc0230dc` / MIT.
- U2: TDD for `skill-audit --watch`. Red: tool stayed `skill-audit`. Green: `current` / `stale` / `unavailable`, no skill writes.
- U3: characterization tests lock adapted phrases in source and mirror.
- U4: three identical `npm test` rounds, one `npm run check`, three `skill-audit` runs, live `--watch`.

## Skill audit of changed skills

- ae-debug, ae-review, ae-refactor, ae-tasks: pass
- ae-tdd: defer (static `artifactContract` dimension only; no finding)
- ae-help: defer (existing P2 `verification-guidance-gap`)

## Issue

`AEI-20260822-003` tracks later stale rechecks. `AEI-20260822-002` remains the separate 40-skill rewrite tracker.

## Closeout (docs / install / git)

- Experience: `docs/ae/experience/2026-08-22-codex-orchestration-and-mattpocock-watch.md`
- Graph: `docs/ae/graphs/maintainer-artifact-graph.md` extended through 0.3.34
- Memory/registry: 00-index, 01–05, 16, and relations to PRD/plan/experience/graph/issue
- Apply `c84da2a4-5cff-492d-88ff-8df922371c31` completed: `ai-agent-engine-codex@personal` 0.3.34; 40 Cursor `ae-*` copies, 0 links
- Next: commit/push `main` including the prior 0.3.33 worktree
