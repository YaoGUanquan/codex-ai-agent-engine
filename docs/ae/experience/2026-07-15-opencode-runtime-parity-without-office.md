<!-- ae-codex:experience -->
# OpenCode Runtime Parity Without Office Experience

## Context

This branch imported the upstream OpenCode runtime at `a144f785579698190635305fe10784b7deca9e03` while intentionally omitting PDF, DOCX, XLSX, PPTX, and OfficeCLI capabilities.

## Durable Lessons

- A parity manifest is useful only when tests consume it. Verify hooks, tools, retained roots, excluded path fragments, and the installed distribution from the same manifest.
- Office/PDF removal must not widen into unrelated configuration exclusions. The initial removal accidentally hid JSON, YAML, Parquet, and DB review paths; fixed-upstream comparison and focused red-green tests exposed the drift.
- Project-local installers need ownership evidence for both runtime and bridge. Path existence alone is not ownership.
- Validate a staged plugin by importing its entry and checking the default plugin export before activation. On Windows, invoke Node probes without shell wrapping.
- Uninstall has a transaction boundary: preserve an intact runtime until bridge deletion succeeds; after commit, report cleanup failure rather than attempting to recover partial deletion.

## Evidence

```powershell
npm test
npm run test:e2e
npm run test:slow
npm run check
npm run opencode:upstream-check -- --source <upstream-checkout> --since a144f785579698190635305fe10784b7deca9e03
```

On 2026-07-15 these checks passed with 1,103 runtime tests, 8 E2E tests, 23 slow tests, installer smoke coverage, and an upstream-tree comparison.
