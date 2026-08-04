<!-- ae-codex:init managed -->
# Memory Knowledge Graph Optimization Summary

## Completed U1-U4

- Added a curated `docs/08-ai-memory/00-registry.json` and a versioned contract. Markdown memory remains canonical.
- Added read-only registry validation, memory query, declared knowledge map/query, and explicit graph provenance/limit metadata without a database, network call, cache, daemon, or CodeGraph dependency.
- Added path-component `lstat` and realpath containment checks, bounded registry/document reads, structured invalid diagnostics, and regression fixtures for malformed data, no-match behavior, link rejection, no-write behavior, and graph truncation.
- Updated installation wrappers, install smoke, help catalog mirror, README documentation, release notes, and distribution version to `0.3.8`.

## Initial Validation

- `npm.cmd test`: passed, 95 tests.
- `npm.cmd run check`: passed, including mirror, metadata, skill, install-smoke, artifact, design, release-note, registry, query, and source-graph checks.
- `rg -n "codegraph" scripts/install-project.mjs scripts/update-project.mjs plugins/ai-agent-engine-codex/.mcp.json`: no default CodeGraph integration found.

## Post-Review Corrections

- P1: `--root` now checks every worktree-relative component with `lstat` and verifies the resolved directory remains within the original worktree. A linked ancestor fixture proves that the registry is rejected before it can be read.
- P2: value-taking memory, knowledge, and source-graph options now reject missing values instead of accepting a boolean parser sentinel as a number or default. Regression cases cover `--path`, `--relation`, `--direction`, `--limit`, `--excerpt`, and `--edge-limit`.
- Post-correction validation: `node --test --test-name-pattern "memory registry|missing values|graph helpers" tests/skill-scripts.test.mjs` passed (8 tests); `npm.cmd test` passed (97 tests); `npm.cmd run check` passed.

## Completed U5

- The user authorized a controlled pilot on this repository's existing `main` branch.
- Tested CodeGraph `v1.5.0` from the official Windows x64 release after SHA-256 verification; upstream `main` was `49c11fc2e0c02170742be8411e66a31af611f4b7` under MIT.
- With telemetry, update checks, and shared-daemon behavior disabled by environment variables, `codegraph init .` indexed 103 files into a 2.69 MB local `.codegraph/` directory in 2.78 seconds.
- Three comparable source-discovery/impact tasks showed no net benefit: `rg` completed in 24-28 ms, while CodeGraph exploration took 411-458 ms and omitted required results in every task, including a false missing-test warning.
- `codegraph uninit --force .` removed the local index in 339 ms. No MCP registration, global installation, user-home Codex or CodeGraph directory mutation, or lingering CodeGraph process occurred.
- Decision: reject an optional CodeGraph adapter. Detailed pilot evidence is in `docs/ae/experience/codegraph-pilot.md`.
