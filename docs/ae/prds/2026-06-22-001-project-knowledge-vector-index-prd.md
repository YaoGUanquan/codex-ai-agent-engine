---
type: prd
status: drafted
date: 2026-06-22
topic: project-knowledge-vector-index
executionStatus: archived-for-later
archive: docs/00-process/archive/2026-06/sqlite-vec-knowledge-index/README.md
---

# PRD: Project Knowledge Vector Index

## Goal

Add a local, project-level knowledge retrieval layer so agents can find relevant AE memory, plans, decisions, experience notes, and process documents without repeatedly scanning the whole documentation tree.

## Background

The project already keeps durable memory under `docs/08-ai-memory`, AE workflow artifacts under `docs/ae`, and process state under `docs/00-process`. That structure is Git-friendly and must remain the source of truth. As the number and size of Markdown and JSON artifacts grows, agents increasingly need a deterministic way to discover relevant prior work before planning, reviewing, or implementing.

The first implementation should use SQLite FTS5 plus `sqlite-vec` as the default local backend. The design must remain replaceable so a later adapter can use LanceDB, Zvec, Qdrant, Chroma, or another backend without changing AE skill behavior.

## Users And Affected Systems

- Primary user: Codex agents working inside this repository or target projects that install this AE plugin.
- Secondary user: maintainers inspecting retrieval evidence, index freshness, and generated query results.
- Affected systems:
  - `plugins/ai-agent-engine-codex/scripts/ae-tools.mjs`
  - supporting script modules under `plugins/ai-agent-engine-codex/scripts/`
  - root wrapper scripts under `scripts/`
  - AE capability catalog and user-facing documentation
  - tests under `tests/`

## Functional Requirements

1. Provide a local index build command that scans selected project documentation paths and writes a derived SQLite index under `.ae/index/`.
2. Preserve Markdown and JSON source files as the only durable source of truth.
3. Store enough metadata per indexed chunk to return exact source paths, headings, hashes, timestamps, document type, tags, and freshness status.
4. Support hybrid retrieval using SQLite FTS5 keyword ranking and `sqlite-vec` vector similarity.
5. Provide a query command that returns stable JSON suitable for agent consumption.
6. Provide a stale-check or doctor command that reports whether an index can be trusted for the current filesystem state.
7. Keep the vector backend behind a small adapter boundary so later backends can replace SQLite without changing command output contracts.
8. Keep the first version local-only. It must not require a hosted database, cloud sync, or remote vector service.
9. Provide deterministic tests that do not require network access or a proprietary embedding provider.
10. Define dependency distribution for target projects before implementing build/query behavior.
11. Support a file-based embedding input path for offline tests and future provider replacement, even if no remote embedding provider ships in phase one.
12. Document platform and dependency limitations, especially Node runtime, Windows npm invocation, native package behavior, and `sqlite-vec` pre-v1 status.

## Acceptance Criteria

- Running the build command on a fixture project creates `.ae/index/ae-docs.sqlite` or a configured output path.
- Running the query command against that index returns JSON with `status`, `query`, `hits`, `freshness`, `backend`, and `limitations`.
- Every hit includes `path`, `heading`, `chunkId`, `score`, `rankSignals`, `sha256`, and a bounded text excerpt.
- Deleting or editing a source file causes stale-check to report the affected path as stale or missing.
- `npm run check` still validates existing behavior and includes the new command checks.
- Install smoke tests confirm the commands work from a target project through `scripts/ae-tools.mjs`.
- Target-project install smoke either proves the index backend works when the dependency is present or proves `ae-index-doctor` returns a clear opt-in dependency diagnostic when it is absent.
- A runtime compatibility probe can open SQLite, load or initialize `sqlite-vec`, create a vector table, insert a vector, and query it before later implementation units proceed.
- The root `scripts/ae-tools.mjs` wrapper remains thin and continues to import the plugin script.
- The implementation does not write indexed data outside `.ae/index/` unless a user explicitly passes an output path inside the worktree.

## Non-Goals

- Do not replace `docs/08-ai-memory`, `docs/ae`, or `docs/00-process`.
- Do not implement LanceDB, Zvec, Qdrant, Chroma, or cloud vector store adapters in the first phase.
- Do not add a UI or Obsidian dependency.
- Do not build a full MCP server in this phase.
- Do not automatically rewrite existing memory or AE artifacts as part of indexing.
- Do not claim high-quality semantic retrieval when only deterministic local hash embeddings are configured.

## Constraints

- The repository is licensed `GPL-2.0-only`; dependency choices and distribution notes must be reviewed before release.
- Runtime artifacts under `.ae/` are already ignored by Git and should remain derived, rebuildable state.
- Target projects install the plugin by copying `plugins/ai-agent-engine-codex/` and wrapper scripts; any new runtime modules must live inside the plugin directory or be copied by the installer.
- Target projects must not receive implicit network dependency installs from `install-project.mjs`; index backend dependencies are opt-in and must be detected or documented by `ae-index-doctor`.
- Existing checks run through Node scripts and `node --test`; new validation should follow that pattern.
- Windows PowerShell can block `npm.ps1`; documentation and validation examples should prefer `npm.cmd` or `cmd /c npm` when needed.

## Assumptions

- The first production-quality backend can use the current local Node v24 runtime capabilities plus an npm-distributed `sqlite-vec` package.
- The repository should not raise the package-wide Node engine requirement in this phase; index commands should perform their own runtime capability checks.
- Deterministic local embeddings are acceptable for tests and offline fallback, while stronger embedding providers can be added later behind the same provider interface.
- Target projects enable the sqlite-vec backend by installing the required dependency in the target project or by running from this repository after dependencies are installed.
- Hybrid search is required because AE documents contain exact command names, file paths, skill names, and semantic concepts.

## Open Questions

- Whether the first non-deterministic embedding provider should be Ollama, OpenAI-compatible HTTP, or user-supplied JSONL embeddings.
- Whether index build should default to `docs/08-ai-memory` and selected `docs/ae` subdirectories only, or include all Markdown files under `docs/`.

## Validation Expectations

- Unit tests for chunking, metadata extraction, hash embeddings, adapter contract behavior, stale detection, and query ranking.
- Integration tests that build and query a temporary fixture index.
- Install smoke checks that run the commands from a copied target project.
- Documentation inspection for command help, limitations, and source-of-truth warnings.
