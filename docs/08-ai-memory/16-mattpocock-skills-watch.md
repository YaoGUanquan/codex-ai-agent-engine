# mattpocock/skills Long-Term Watch

## Stable Decision

AE tracks `https://github.com/mattpocock/skills` as a research input. Recheck freshness with `skill-audit --watch` before adapting new methods. Do not vendor the repository, install its Claude plugin, run `npx skills`, or copy skill text verbatim.

Pinned baseline on 2026-08-22: `5b15a47f2d7150f545fbcacbfe381787fc0230dc` (`HEAD` / `main`), MIT license text re-read from the upstream LICENSE file.

## Recheck Workflow

1. Run `node scripts/ae-tools.mjs skill-audit --watch`.
2. If freshness is `current`, no skill edit is implied.
3. If freshness is `stale`, inspect only the `affectedSkills` listed from adopted mappings.
4. If freshness is `unavailable`, record the freshness method and reason; do not claim the source is unchanged.
5. Any later skill edit still needs a finding, plan or explicit user adoption, source/mirror sync, and validation.

Machine record: `docs/ae/references/external-skill-watchlist.json`. Delivery remainder: `docs/ae/experience/2026-08-22-codex-orchestration-and-mattpocock-watch.md`. Human map: `docs/ae/graphs/maintainer-artifact-graph.md`. Later stale results: `docs/ae/issues/AEI-20260822-003.md`.

## Adopted Method Map

- `diagnosing-bugs` → `ae-debug`: red-capable loop, minimise, 3-5 falsifiable hypotheses, tagged diagnostics.
- `tdd` → `ae-tdd`: public seam, independent oracle, vertical tracer-bullet slices.
- `code-review` → `ae-review`: Standards and Spec lenses on a pinned base/head.
- `codebase-design` → `ae-refactor`: deep-module vocabulary and the deletion test.
- `to-tickets` → `ae-tasks`: tracer-bullet outcomes and explicit blocking edges.

## Rejected Runtime

Claude plugin auto-update, `npx skills`, GitHub/Linear adapters, background research agents, popularity metrics, and wholesale skill-file copies stay rejected.

## Validation Pattern

`tests/ae-tools.test.mjs` locks `--watch` to `current` / `stale` / `unavailable` and forbids skill writes. `tests/skills-docs.test.mjs` locks the adopted phrases in plugin source and `.ae-source` mirrors.
