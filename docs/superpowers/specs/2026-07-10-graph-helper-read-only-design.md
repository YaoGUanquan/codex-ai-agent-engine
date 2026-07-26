# Graph Helper Read-Only Contract Design

## Outcome

Make `ae-graph-build` and `ae-graph-query` genuinely read-only. Their normal commands must return a shallow dependency graph without creating `docs/ae/graphs/graph.json` or any other project file.

## Scope

The change is limited to the packaged `ae-tools` implementation, graph-helper regression tests, and the Chinese and English README contract. The root `scripts/ae-tools.mjs` wrapper remains unchanged.

## Chosen Design

`graphBuild()` will always build the graph in memory. It will return the same `store` shape currently returned by `--no-write`:

```json
{
  "path": "docs/ae/graphs/graph.json",
  "schemaVersion": 1,
  "written": false
}
```

Keeping this shape avoids an unnecessary JSON-output compatibility break while accurately reporting that no snapshot exists. `--no-write` remains accepted as a compatibility no-op. `graphQuery()` continues to call `graphBuild()`, so it inherits the same no-write behavior.

The unused snapshot-writing helper is deleted. This removes the behavior that contradicted the published read-only contract instead of adding a new persistence flag or a second lifecycle.

## Data Flow

```text
CLI command
  -> parseOptions
  -> safeResolve root
  -> collectSourceFiles
  -> buildShallowGraph
  -> JSON response (store.written = false)
```

No branch in this flow calls `mkdirSync` or `writeFileSync` for graph output. Existing path validation, source-file exclusions, graph limits, and JSON response fields remain unchanged.

## Error Handling

Invalid roots and missing query selectors retain their current errors. The change removes only the implicit write side effect; it does not conceal scan, filesystem-read, or argument errors.

## Validation

- Add build and query regression assertions in isolated temporary worktrees that `docs/ae/graphs/graph.json` does not exist after default execution.
- Preserve existing graph node, edge, external-dependency, and output-shape assertions.
- Run the targeted graph tests, then `npm.cmd test`, `npm.cmd run check`, and `git diff --check`.

## Non-Goals

- No persistent graph snapshot or new `--write` option.
- No graph database, freshness store, sharding, preview UI, dependency, or schema expansion.
- No unrelated refactor of graph extraction logic.

## Rollback

If downstream consumers require persisted graph data, restore the prior behavior only through a separately approved persistence design with explicit write authorization and documentation. Do not silently reintroduce default writes.
