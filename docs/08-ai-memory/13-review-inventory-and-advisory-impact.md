# Review Inventory And Advisory Impact

## Stable Decision

- For branch or commit review, use `node scripts/ae-tools.mjs review-package --base <base-ref> --head <head-ref>` as the deterministic changed-file inventory.
- Add `--with-impact` only when shallow static dependency context is useful. It reports affected local files up to a bounded depth and is advisory, not a completeness proof.
- Every selected changed file must be reviewed or explicitly excluded with a reason in the review result.

## Boundaries

- `--with-impact` is a read-only shallow scan. It does not persist a graph, configure MCP, enable hooks, install external CLIs, or resolve dynamic imports, aliases, generated code, or framework-specific dependencies.
- Keep the impact depth in the 0-4 range and source scan limit in the 1-5000 range.
- Treat graph output as review context. Runtime behavior, public contracts, and framework resolution still require direct inspection and appropriate tests.

## Provenance

- This contract selectively adapts methods inspected from `tirth8205/code-review-graph`, `alibaba/open-code-review`, and `github/spec-kit` on 2026-07-26. The project vendors none of their source or runtime behavior.
