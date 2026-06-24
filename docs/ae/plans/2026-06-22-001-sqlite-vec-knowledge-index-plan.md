---
type: plan
status: drafted
date: 2026-06-22
title: sqlite-vec knowledge index
origin: docs/ae/prds/2026-06-22-001-project-knowledge-vector-index-prd.md
originFingerprint: sha256:b1cf02eb2623f10f29606771891ef7a3b5f5230c4c4b2d748a33055d13d4919d
executionStatus: archived-for-later
archive: docs/00-process/archive/2026-06/sqlite-vec-knowledge-index/README.md
---

# Plan: sqlite-vec knowledge index

## Source

- User request: create a detailed execution plan for first implementing a project-level knowledge retrieval backend with SQLite FTS5 plus `sqlite-vec`.
- Requirements artifact: `docs/ae/prds/2026-06-22-001-project-knowledge-vector-index-prd.md`.
- Existing project facts:
  - Root `scripts/ae-tools.mjs` is a thin wrapper that imports `plugins/ai-agent-engine-codex/scripts/ae-tools.mjs`.
  - Target project installation copies `plugins/ai-agent-engine-codex/` and creates wrapper scripts.
  - Runtime artifacts under `.ae/` are already ignored by Git.
  - Existing graph helpers are shallow JSON tools and intentionally do not provide persistent graph or vector storage.
  - Tests use `node:test` in `tests/skill-scripts.test.mjs`.
- External facts checked on 2026-06-22:
  - `sqlite-vec` npm package reports version `0.1.9`, license `MIT OR Apache`, repository `https://github.com/asg017/sqlite-vec.git`.
  - `better-sqlite3` npm package reports version `12.11.1`, license `MIT`.
  - Local Node is `v24.14.0`.
- Review findings addressed before archive:
  - Target-project installs do not receive npm dependencies automatically, so sqlite-vec backend enablement must be opt-in and diagnosable.
  - SQLite extension loading must be proven before implementing scanner, chunker, and query behavior.
  - `hash-v1` embeddings are only a deterministic fallback, so phase one must also validate a file-based external embedding ingestion path.

## Scope

Build the first local retrieval backend for AE documents:

- Add local index commands:
  - `ae-index-doctor`
  - `ae-index-build`
  - `ae-index-query`
  - `ae-index-stale`
  - optional alias group: `index-doctor`, `index-build`, `index-query`, `index-stale`
- Store derived index data under `.ae/index/ae-docs.sqlite` by default.
- Index Markdown and JSON-like AE artifacts from controlled roots.
- Support hybrid retrieval:
  - SQLite FTS5 for exact terms, file paths, skill names, and commands.
  - `sqlite-vec` for vector similarity using a deterministic default embedding provider.
- Support dependency/runtime diagnosis before build/query.
- Support deterministic `hash-v1` embeddings and a file-based JSONL embedding input for offline provider-contract tests.
- Return stable JSON suitable for agents.
- Keep source files as the only durable truth.

Out of scope:

- No LanceDB, Zvec, Qdrant, Chroma, or cloud adapter implementation.
- No UI, browser preview, or Obsidian dependency.
- No MCP server.
- No automatic memory rewriting.
- No remote embedding service as a default.

## Readiness

- Goal: agents can build and query a local, rebuildable index of project knowledge with stable JSON results and freshness evidence.
- Acceptance criteria:
  - Build command writes an index to `.ae/index/ae-docs.sqlite` or a configured in-worktree path.
  - Query command returns ranked hits with source path, heading, chunk id, score, rank signals, hash, timestamp, and excerpt.
  - Stale command reports modified, missing, or unindexed source files.
  - Doctor command proves sqlite-vec backend readiness or returns an actionable opt-in dependency diagnostic.
  - Tests cover command behavior without network access.
  - Install smoke validates index command discovery and diagnostic behavior in a target project; backend-enabled smoke runs only when dependencies are present.
- Non-goals:
  - Replacing Markdown source files.
  - Adding non-SQLite vector adapters in this phase.
  - Claiming high-quality semantic recall without a configured semantic embedding provider.
- Affected areas:
  - `plugins/ai-agent-engine-codex/scripts/`
  - `scripts/`
  - `tests/skill-scripts.test.mjs`
  - `package.json`
  - `README.md`
  - `README.en.md`
  - `docs/08-ai-memory/`
  - `docs/ae/templates/`
  - `plugins/ai-agent-engine-codex/skills/ae-help/references/capability-catalog.json`
- Validation surface:
  - `node --check`
  - `node --test tests/*.test.mjs`
  - `npm.cmd run check` on Windows
  - `node scripts/ae-tools.mjs ae-index-doctor`
  - fixture command runs for build/query/stale
  - install smoke command path through copied plugin
- Open questions:
  - Whether the next real semantic embedding provider should be Ollama, OpenAI-compatible HTTP, or user-supplied JSONL.
  - Whether default indexing roots should include all `docs/**/*.md` or only curated AE paths.

## Assumptions

- First implementation can use a deterministic hash embedding provider for offline tests and baseline local recall.
- FTS5 is the primary relevance signal for exact AE terms in the first version.
- `sqlite-vec` is isolated behind an adapter because it is pre-v1 and may change.
- `.ae/index/` is the correct default output location because `.ae/` is already ignored and treated as derived runtime state.
- For target project installs, any new imported modules must live under `plugins/ai-agent-engine-codex/scripts/` so the existing installer copies them.
- `install-project.mjs` must not run network dependency installs. Target projects enable the SQLite vector backend by installing `sqlite-vec` in their own dependency tree or by running inside this repository after dependencies are installed.

## Alternatives Considered

- Recommended: SQLite FTS5 plus `sqlite-vec` behind a local adapter.
  - Fit: local, single-file index, no service process, compatible with project-level usage.
  - Trade-off: native/runtime capability checks are required.
  - Risk: `sqlite-vec` pre-v1 churn.
  - Why selected: smallest useful backend that still supports hybrid retrieval and future replacement.
- Alternative: LanceDB first.
  - Fit: stronger vector/search product surface and better future large-scale path.
  - Trade-off: larger dependency and more behavior to own immediately.
  - Rejected for phase one because the user asked to start with sqlite-vec plus FTS5 and the current repository favors small deterministic scripts first.
- Alternative: FTS5 only with no vector table.
  - Fit: simplest, no vector dependency.
  - Trade-off: fails the vector database requirement and does not exercise future adapter boundary.
  - Rejected because it would only solve keyword search.
- Alternative: external service backend such as Qdrant or Chroma.
  - Fit: strong retrieval features.
  - Trade-off: service lifecycle, Docker/local server, more setup friction.
  - Rejected for first phase because AE plugin installs should remain local and low ceremony.

## Decision Drivers

- Driver 1: Preserve Markdown and JSON artifacts as source-of-truth with Git diff visibility.
- Driver 2: Keep the retrieval backend replaceable through a narrow adapter contract.
- Driver 3: Provide useful local query results without requiring cloud services or a long-running database server.

## Decisions

### ADR-1 - Derived index, not source storage

- Decision: Store the SQLite index under `.ae/index/` and treat it as rebuildable derived state.
- Drivers: Git auditability, rollback safety, existing `.ae/` runtime-artifact convention.
- Alternatives: Commit the index, store it under `docs/ae`, or replace Markdown with database records.
- Why chosen: It keeps project knowledge reviewable and prevents binary index churn in Git.
- Consequences: Build/stale commands must be reliable because the index may be deleted and rebuilt at any time.
- Follow-ups: Document that `.ae/index/` should not be committed.

### ADR-2 - Hybrid search contract

- Decision: Query combines FTS5 rank and vector distance, then returns explicit rank signals.
- Drivers: AE documents contain exact command/file names and broader semantic concepts.
- Alternatives: pure vector search or pure keyword search.
- Why chosen: Hybrid retrieval reduces false negatives for exact terms and false positives for loose semantic matches.
- Consequences: Tests must assert both lexical and vector ranking behavior.
- Follow-ups: Add reranking only after baseline hybrid output is stable.

### ADR-3 - Adapter boundary before backend expansion

- Decision: Define a `VectorStore` style boundary before implementing SQLite-specific details.
- Drivers: user requirement for upgradeability and arbitrary backend replacement.
- Alternatives: implement direct SQLite calls inside command handlers.
- Why chosen: It localizes sqlite-vec churn and enables LanceDB/Zvec later.
- Consequences: A small amount of interface code is owned now.
- Follow-ups: Add a second adapter only after the SQLite contract has stable tests.

### ADR-4 - Deterministic default embeddings

- Decision: First version includes a deterministic local embedding provider for tests and offline use.
- Drivers: no network dependency, reproducible tests, stable fixture outputs.
- Alternatives: require Ollama, OpenAI-compatible HTTP, or user-supplied embeddings from day one.
- Why chosen: It makes the index commands testable in CI and target install smoke tests.
- Consequences: Default vector recall is lexical-feature-like, not high-grade semantic retrieval.
- Follow-ups: Add real embedding provider adapters after command contracts are stable.

### ADR-5 - Index-only runtime guard

- Decision: Do not raise the package-wide Node engine requirement in phase one; index commands perform runtime capability checks and fail with index-specific diagnostics if local SQLite or `sqlite-vec` cannot load.
- Drivers: existing AE commands should remain usable in target projects that do not need indexing.
- Alternatives: require Node v24 for the whole package, or add `better-sqlite3` as an immediate fallback driver.
- Why chosen: It keeps the default plugin install lighter and avoids expanding native dependency ownership before the SQLite path is proven.
- Consequences: Index build/query can be unavailable on runtimes that still support other AE commands.
- Follow-ups: Revisit package engines or a `better-sqlite3` fallback only after cross-platform index command validation.

### ADR-6 - Opt-in target-project backend dependency

- Decision: Treat sqlite-vec as an opt-in backend dependency for installed target projects. `install-project.mjs` copies plugin files and wrappers but does not install npm dependencies into the target project.
- Drivers: current installer is copy-only, target projects own their own dependency graph, and implicit network installs would be surprising.
- Alternatives: plugin-local `package.json`, installer-managed npm install, vendored native artifacts, or copying repository `node_modules`.
- Why chosen: It preserves the current installer boundary and makes dependency ownership explicit.
- Consequences: `ae-index-doctor` becomes a required first command; target projects without sqlite-vec get an actionable diagnostic instead of a broken import.
- Follow-ups: If users want zero-step target enablement later, design plugin-local dependency packaging as a separate PRD.

### ADR-7 - File-based external embedding contract

- Decision: Keep `hash-v1` as the default deterministic provider, and add a JSONL embedding input path for offline tests and future provider replacement.
- Drivers: hash vectors prove storage mechanics but do not prove real semantic retrieval quality.
- Alternatives: require Ollama/OpenAI-compatible HTTP in phase one or defer external embeddings entirely.
- Why chosen: JSONL validates the provider boundary without network, secrets, or local model setup.
- Consequences: Build/query commands need stable validation for dimension, chunk id, and vector length mismatches.
- Follow-ups: Add Ollama or OpenAI-compatible provider only after this contract is stable.

## Risks

- `sqlite-vec` is pre-v1, so package APIs or extension loading can change.
- Node SQLite extension loading may behave differently by Node version and platform.
- Native packages can make install smoke slower or platform-sensitive.
- Deterministic hash embeddings can create a false impression of semantic quality.
- Target projects may not have sqlite-vec installed after normal AE installation.
- Index freshness bugs can cause agents to rely on stale or deleted source content.
- Adding too much code to `ae-tools.mjs` would make the CLI harder to maintain.

## Pre-Mortem

- Failure scenario 1: The build command works locally but fails in target projects because helper modules were not copied by the installer.
  - Mitigation: place helper modules under `plugins/ai-agent-engine-codex/scripts/` and extend install smoke to execute copied commands.
- Failure scenario 2: Query results return stale snippets after source files change.
  - Mitigation: store `sha256`, `mtimeMs`, and source size per indexed file; stale command must compare current filesystem state before reporting `canUseAsEvidence: true`.
- Failure scenario 3: `sqlite-vec` cannot load on a supported user platform.
  - Mitigation: add `ae-index-doctor` behavior inside stale/build error output, keep FTS-only diagnostics, and document runtime requirements. Do not break unrelated AE commands when the vector package is unavailable.
- Failure scenario 4: Installed target projects fail because the plugin was copied but sqlite-vec was never installed.
  - Mitigation: make target dependency opt-in, document the enablement command, and require install smoke to verify a clean diagnostic when dependencies are absent.

## Implementation Units

### U0 - Backend dependency distribution and sqlite-vec spike

- Goal: Prove the selected backend can be enabled and diagnosed before implementing indexing behavior.
- Requirements covered: functional requirements 8, 10, 12.
- Acceptance criteria covered: doctor command proves backend readiness or clear opt-in dependency diagnostics; runtime compatibility probe succeeds before later units proceed.
- Depends on: none.
- Files:
  - `package.json`
  - `plugins/ai-agent-engine-codex/scripts/ae-tools.mjs`
  - `plugins/ai-agent-engine-codex/scripts/ae-index/index-commands.mjs`
  - `plugins/ai-agent-engine-codex/scripts/ae-index/errors.mjs`
  - `tests/skill-scripts.test.mjs`
  - `README.md`
  - `README.en.md`
- Forbidden files:
  - `.ae/**`
  - `docs/08-ai-memory/*.md`
- Approach:
  - Add `ae-index-doctor` and `index-doctor` command routing before build/query/stale.
  - Keep sqlite-vec loading lazy and index-command scoped.
  - Resolve backend dependencies from the current project dependency tree; do not have `install-project.mjs` install packages into target projects.
  - Doctor output must distinguish:
    - local SQLite unavailable,
    - sqlite-vec package unavailable,
    - sqlite-vec package available but extension loading failed,
    - vector probe succeeded.
  - The vector probe must open a temporary SQLite database, initialize or load sqlite-vec, create a vector table, insert one vector, and query it.
  - Stop execution after U0 if this probe cannot pass on the supported local runtime.
- Tests:
  - Doctor returns stable JSON when sqlite-vec is absent in a copied target project.
  - Doctor returns stable JSON when backend probe succeeds in this repository after dependencies are installed.
  - Non-index commands still work when doctor reports backend unavailable.
- Validation:
  - `node scripts/ae-tools.mjs ae-index-doctor`
  - `node scripts/ae-tools.mjs help index`
  - `node scripts/check-install-smoke.mjs`
  - `npm.cmd run check`
- Rollback signals:
  - Any non-index command fails because sqlite-vec is absent.
  - Doctor cannot explain the missing dependency or failed extension load.
  - The vector probe cannot create and query a sqlite-vec table.
- Deferred to implementation:
  - Exact sqlite-vec initialization code depends on the selected package API and must be proven by this unit before U1 starts.

### U1 - Dependency and runtime gate

- Goal: Add dependency and capability checks without breaking unrelated commands.
- Requirements covered: functional requirements 8, 10.
- Acceptance criteria covered: package checks continue; unsupported runtime reports a precise index-only error.
- Depends on: U0.
- Files:
  - `package.json`
  - `README.md`
  - `README.en.md`
  - `plugins/ai-agent-engine-codex/skills/ae-help/references/capability-catalog.json`
- Forbidden files:
  - `.ae/**`
  - `docs/08-ai-memory/*.md`
  - existing skill behavior files unrelated to index commands
- Approach:
  - Add runtime dependency on `sqlite-vec`.
  - Use Node's local SQLite capability when available.
  - If local SQLite or `sqlite-vec` loading fails, return an index-specific runtime diagnostic rather than breaking unrelated commands.
  - Do not add `better-sqlite3` in phase one unless U1 proves the local SQLite route is non-viable on the supported runtime.
  - Keep index command dependency loading lazy so `help`, `init`, `swagger`, `task-analyze`, and other commands still work if the index backend is unavailable.
  - Add help/catalog entries for `ae-index-doctor`, `ae-index-build`, `ae-index-query`, and `ae-index-stale`.
  - Document Windows usage with `npm.cmd` where PowerShell blocks `npm.ps1`.
- Tests:
  - Existing `package check script` test must be updated only if the check command list changes.
  - Add a test that `node scripts/ae-tools.mjs help index` lists all index commands.
- Validation:
  - `node --check plugins/ai-agent-engine-codex/scripts/ae-tools.mjs`
  - `node scripts/ae-tools.mjs help index`
  - `npm.cmd run check`
- Rollback signals:
  - Non-index commands fail because a SQLite dependency is missing.
  - Install smoke fails before any index command runs.
- Deferred to implementation:
  - Exact package-lock updates are generated by `npm.cmd install` during implementation.

### U2 - Index module structure and command routing

- Goal: Add maintainable command routing without growing the main CLI script into the indexing implementation.
- Requirements covered: functional requirements 1, 5, 7.
- Acceptance criteria covered: command names exist and return stable JSON/error shapes.
- Depends on: U1.
- Files:
  - `plugins/ai-agent-engine-codex/scripts/ae-tools.mjs`
  - `plugins/ai-agent-engine-codex/scripts/ae-index/index-commands.mjs`
  - `plugins/ai-agent-engine-codex/scripts/ae-index/errors.mjs`
  - `tests/skill-scripts.test.mjs`
- Forbidden files:
  - `scripts/ae-tools.mjs` except confirming it remains a wrapper
  - `.agents/skills/**`
- Approach:
  - Add switch cases for `ae-index-build`, `index-build`, `ae-index-query`, `index-query`, `ae-index-stale`, and `index-stale`.
  - Route each case to a helper module under `plugins/ai-agent-engine-codex/scripts/ae-index/`.
  - Standardize JSON output fields: `status`, `mode`, `backend`, `generatedAt`, `freshness`, `warnings`, and command-specific payload.
  - Standardize index-only failures with a diagnostic that names the missing package, unsupported runtime, or invalid path.
- Tests:
  - Command routing test for unknown index options.
  - Help output test for index capability.
  - Error-shape test for invalid query without an index path.
- Validation:
  - `node --check plugins/ai-agent-engine-codex/scripts/ae-index/index-commands.mjs`
  - `node scripts/ae-tools.mjs ae-index-query --query memory`
  - Expected invalid-query behavior before build: non-zero exit with a clear missing-index message.
- Rollback signals:
  - Existing command aliases such as `graph-build` stop working.
  - Error output no longer uses the existing CLI error formatting style.
- Deferred to implementation:
  - The helper module may export functions named by behavior rather than by class if that better matches the existing script style.

### U3 - Source discovery, metadata extraction, and chunking

- Goal: Convert selected docs into deterministic indexable chunks.
- Requirements covered: functional requirements 1, 2, 3, 9.
- Acceptance criteria covered: every hit can point back to source path, heading, hash, and excerpt.
- Depends on: U2.
- Files:
  - `plugins/ai-agent-engine-codex/scripts/ae-index/source-scan.mjs`
  - `plugins/ai-agent-engine-codex/scripts/ae-index/frontmatter.mjs`
  - `plugins/ai-agent-engine-codex/scripts/ae-index/chunker.mjs`
  - `tests/skill-scripts.test.mjs`
- Forbidden files:
  - `.ae/**`
  - `docs/ae/gates/*.json` fixture outputs in the real repo
- Approach:
  - Default roots:
    - `docs/08-ai-memory`
    - `docs/ae/prds`
    - `docs/ae/plans`
    - `docs/ae/experience`
    - `docs/ae/solutions`
    - `docs/00-process/archive`
  - Exclude generated/runtime-heavy paths by default:
    - `.git`
    - `node_modules`
    - `.ae`
    - `docs/ae/gates`
    - `docs/ae/reviews`
    - `docs/ae/handoffs`
  - Parse Markdown headings and frontmatter where present.
  - Treat JSON files as compact source documents only when explicitly included.
  - Chunk by heading first, then size limit. Use stable chunk ids derived from source path, heading, and chunk ordinal.
  - Store source metadata: path, size, mtimeMs, sha256, type, status, topic, tags, heading, headingLevel, chunkIndex.
- Tests:
  - Markdown frontmatter extraction.
  - Heading-based chunk boundaries.
  - Stable chunk ids across repeated scans.
  - Exclusion of `.ae`, `node_modules`, and `docs/ae/gates`.
- Validation:
  - `node --test tests/skill-scripts.test.mjs --test-name-pattern "index"`
  - `node scripts/ae-tools.mjs ae-index-build --root docs/08-ai-memory --dry-run`
- Rollback signals:
  - The scanner reads ignored runtime artifacts.
  - Reordering unrelated files changes stable chunk ids.
- Deferred to implementation:
  - The first implementation can keep Markdown parsing lightweight and line-oriented; a full Markdown AST parser is not required.

### U4 - Embedding provider abstraction with deterministic default

- Goal: Provide vector inputs without requiring network access.
- Requirements covered: functional requirements 4, 7, 8, 9, 11.
- Acceptance criteria covered: deterministic tests can build and query vector data.
- Depends on: U3.
- Files:
  - `plugins/ai-agent-engine-codex/scripts/ae-index/embeddings.mjs`
  - `tests/skill-scripts.test.mjs`
  - `README.md`
  - `README.en.md`
- Forbidden files:
  - secret files such as `.env`
  - external API clients for this phase
- Approach:
  - Define provider mode `hash-v1` as the default.
  - Use normalized token feature hashing into a fixed dimension.
  - Normalize vectors so similarity scores are stable enough for tests.
  - Add `--embedding-provider hash-v1` and `--embedding-jsonl <path>`.
  - Define JSONL rows as `{ "chunkId": "...", "embedding": [0.1, 0.2] }`.
  - Validate that JSONL vectors match indexed chunk ids and a single vector dimension.
  - Return a warning in build/query output that `hash-v1` is deterministic and local, not an LLM semantic embedding model.
- Tests:
  - Same input text produces same vector.
  - Similar keyword overlap produces a closer score than unrelated text in a small fixture.
  - JSONL fixture embeddings can rank a semantically related chunk without network access.
  - JSONL dimension mismatch returns a clear error.
  - Empty or punctuation-only content is handled without crash.
- Validation:
  - `node --test tests/skill-scripts.test.mjs --test-name-pattern "embedding"`
  - Inspect query output warnings for `hash-v1`.
- Rollback signals:
  - Vector generation becomes non-deterministic.
  - Tests require network access or a local model server.
- Deferred to implementation:
  - Real semantic providers such as Ollama or OpenAI-compatible HTTP are explicitly deferred.

### U5 - SQLite FTS5 plus sqlite-vec adapter

- Goal: Persist chunks and run hybrid retrieval through a replaceable store adapter.
- Requirements covered: functional requirements 1, 3, 4, 5, 7.
- Acceptance criteria covered: build writes SQLite index; query returns hybrid-ranked hits.
- Depends on: U4.
- Files:
  - `plugins/ai-agent-engine-codex/scripts/ae-index/vector-store.mjs`
  - `plugins/ai-agent-engine-codex/scripts/ae-index/sqlite-store.mjs`
  - `tests/skill-scripts.test.mjs`
- Forbidden files:
  - `scripts/ae-tools.mjs`
  - `docs/**` source files except test fixtures created under temporary directories
- Approach:
  - Define adapter operations:
    - open
    - reset
    - upsertDocuments
    - query
    - staleCheck
    - close
  - SQLite database layout:
    - `ae_index_meta`: schema version, backend id, embedding provider, vector dimension, generatedAt.
    - `ae_sources`: path, sha256, mtimeMs, size, type, status, topic, tags.
    - `ae_chunks`: chunkId, path, heading, chunkIndex, text, excerpt, metadata JSON.
    - FTS5 virtual table for chunk text and path/heading search.
    - `sqlite-vec` vector table for chunk vectors.
  - Use transactions for build/reset.
  - Keep schema version explicit so incompatible future schemas can be rebuilt.
  - Query plan:
    - Run FTS query and vector query independently.
    - Merge by chunk id.
    - Score with weighted rank signals.
    - Return bounded top K.
- Tests:
  - Index build creates all expected tables.
  - Query for an exact command ranks the FTS match.
  - Query for related wording ranks a vector/overlap match in fixture data.
  - Rebuild replaces stale rows for deleted documents.
- Validation:
  - `node scripts/ae-tools.mjs ae-index-build --root docs/08-ai-memory --store .ae/index/test-ae-docs.sqlite --limit 20`
  - `node scripts/ae-tools.mjs ae-index-query --store .ae/index/test-ae-docs.sqlite --query "multi agent review gates" --top-k 5`
  - `node scripts/ae-tools.mjs ae-index-stale --store .ae/index/test-ae-docs.sqlite`
- Rollback signals:
  - SQLite database remains locked after a failed command.
  - Query output does not include source hashes.
  - Build writes outside `.ae/index/` without explicit user path.
- Deferred to implementation:
  - Exact SQL statements belong in implementation and tests, but the schema names above are the required contract.

### U6 - Build command behavior

- Goal: Make `ae-index-build` safe, explicit, and repeatable.
- Requirements covered: functional requirements 1, 2, 3, 8, 9, 10.
- Acceptance criteria covered: build command writes index and reports source coverage.
- Depends on: U5.
- Files:
  - `plugins/ai-agent-engine-codex/scripts/ae-index/index-commands.mjs`
  - `tests/skill-scripts.test.mjs`
  - `plugins/ai-agent-engine-codex/skills/ae-help/references/capability-catalog.json`
- Forbidden files:
  - user source docs during build
  - files outside worktree
- Approach:
  - Options:
    - `--root <path>` repeatable or comma-separated.
    - `--store <path>` default `.ae/index/ae-docs.sqlite`.
    - `--limit <n>` for tests and controlled scans.
    - `--dry-run` to report sources/chunks without writing.
    - `--include-json` opt-in for JSON artifacts.
    - `--embedding-provider hash-v1`.
  - Validate paths with existing safe resolution style.
  - Reject output paths outside the worktree.
  - Return counts: sourceCount, chunkCount, skippedCount, vectorCount, ftsCount.
  - Return limitations and warnings.
- Tests:
  - Dry-run does not create `.ae/index`.
  - Store path outside worktree is rejected.
  - Limit controls scanned files.
  - Build output contains counts and backend metadata.
- Validation:
  - `node scripts/ae-tools.mjs ae-index-build --root docs/08-ai-memory --dry-run`
  - `node scripts/ae-tools.mjs ae-index-build --root docs/08-ai-memory --limit 5`
- Rollback signals:
  - Dry-run writes files.
  - Path traversal is possible through `--store`.
- Deferred to implementation:
  - If repeatable `--root` parsing conflicts with current option parsing, use comma-separated roots for phase one and document it.

### U7 - Query command behavior

- Goal: Return agent-consumable retrieval results with enough evidence to inspect source files.
- Requirements covered: functional requirements 4, 5, 7, 8.
- Acceptance criteria covered: query JSON includes hits, rank signals, freshness, backend, and limitations.
- Depends on: U6.
- Files:
  - `plugins/ai-agent-engine-codex/scripts/ae-index/index-commands.mjs`
  - `tests/skill-scripts.test.mjs`
  - `README.md`
  - `README.en.md`
- Forbidden files:
  - index build source docs
  - `.ae/index/*.sqlite` except read-only query access
- Approach:
  - Options:
    - `--query <text>` required.
    - `--store <path>` default `.ae/index/ae-docs.sqlite`.
    - `--top-k <n>` default 8.
    - `--kind <memory,plan,prd,experience,solution,archive>` optional filter.
    - `--path-prefix <docs/08-ai-memory>` optional filter.
    - `--fresh` to require fresh index evidence.
  - Return output:
    - `status: ok`
    - `mode: project-knowledge-query`
    - `backend: sqlite-vec-fts5`
    - `embeddingProvider`
    - `query`
    - `hits`
    - `freshness`
    - `limitations`
  - Each hit includes:
    - path
    - heading
    - chunkId
    - score
    - rankSignals with FTS and vector components
    - sha256
    - mtimeMs
    - excerpt
  - Excerpts are bounded and must not print entire large source files.
- Tests:
  - Query requires `--query`.
  - Query returns top K bounded hits.
  - Kind filter removes unrelated document types.
  - Freshness status appears in output.
- Validation:
  - `node scripts/ae-tools.mjs ae-index-query --query "review contract evidence" --top-k 3`
  - `node scripts/ae-tools.mjs ae-index-query --query "multi agent" --kind memory --fresh`
- Rollback signals:
  - Query prints full documents.
  - Query returns hits without hashes or source paths.
- Deferred to implementation:
  - Query reranking beyond hybrid merge is not part of this phase.

### U8 - Freshness and stale detection

- Goal: Prevent agents from trusting stale index evidence.
- Requirements covered: functional requirements 3, 6.
- Acceptance criteria covered: stale-check detects modified, missing, and unindexed sources.
- Depends on: U6.
- Files:
  - `plugins/ai-agent-engine-codex/scripts/ae-index/freshness.mjs`
  - `plugins/ai-agent-engine-codex/scripts/ae-index/index-commands.mjs`
  - `tests/skill-scripts.test.mjs`
- Forbidden files:
  - source docs during stale-check
  - generated evidence files unless explicitly requested in a later phase
- Approach:
  - Compare current source scan against stored `ae_sources`.
  - Report:
    - fresh
    - stale
    - missingSources
    - modifiedSources
    - newSources
    - canUseAsEvidence
  - If query uses `--fresh`, reject stale index with non-zero exit.
  - Keep stale-check read-only.
- Tests:
  - Edit fixture source after build and stale-check reports modified source.
  - Delete fixture source after build and stale-check reports missing source.
  - Add fixture source after build and stale-check reports new source.
  - Query `--fresh` fails on stale index.
- Validation:
  - `node scripts/ae-tools.mjs ae-index-stale --store .ae/index/ae-docs.sqlite`
  - Manual fixture edit inside test temp directory, then stale command.
- Rollback signals:
  - Stale-check modifies the index.
  - `canUseAsEvidence` is true while sources differ from stored hashes.
- Deferred to implementation:
  - Automatic incremental rebuild is deferred; phase one can recommend a rebuild.

### U9 - Installer, smoke tests, and documentation

- Goal: Make the feature usable after project-level installation and visible in help/docs.
- Requirements covered: functional requirements 5, 6, 8, 10.
- Acceptance criteria covered: install smoke validates copied commands; docs explain boundaries.
- Depends on: U7, U8.
- Files:
  - `scripts/check-install-smoke.mjs`
  - `tests/skill-scripts.test.mjs`
  - `README.md`
  - `README.en.md`
  - `docs/08-ai-memory/00-index.md`
  - `docs/08-ai-memory/08-phase-two-tooling.md`
  - `docs/ae/templates/ae-skill-profiles.example.yaml`
- Forbidden files:
  - `.agents/skills/**` unless metadata requires generated mirror update
  - `.ae/**` committed artifacts
- Approach:
  - Add install smoke fixture docs to target temp project.
  - Run `ae-index-build --root docs --limit 5`.
  - Run `ae-index-query --query "memory" --top-k 2`.
  - Run `ae-index-stale`.
  - Document:
    - source-of-truth warning
    - default index path
    - hash embedding limitations
    - future adapter boundary
    - Windows `npm.cmd` note
  - Add durable memory note after implementation succeeds.
- Tests:
  - Install smoke command succeeds in target project.
  - README command examples match implemented command names.
  - `.gitignore` already ignores `.ae/`; inspect and leave unchanged unless tests reveal a gap.
- Validation:
  - `node scripts/check-install-smoke.mjs`
  - `npm.cmd run check`
  - `git status --short` confirms no `.ae/index` artifact is staged.
- Rollback signals:
  - Installed target lacks helper modules.
  - `.ae/index` appears as an unignored Git artifact.
- Deferred to implementation:
  - If package install changes require lockfile updates, include them in the implementation commit with dependency rationale.

## Validation Plan

- Unit:
  - `node scripts/ae-tools.mjs ae-index-doctor`
  - `node --test tests/skill-scripts.test.mjs --test-name-pattern "index|embedding|freshness"`
  - `node --check plugins/ai-agent-engine-codex/scripts/ae-index/index-commands.mjs`
  - `node --check plugins/ai-agent-engine-codex/scripts/ae-index/source-scan.mjs`
  - `node --check plugins/ai-agent-engine-codex/scripts/ae-index/chunker.mjs`
  - `node --check plugins/ai-agent-engine-codex/scripts/ae-index/embeddings.mjs`
  - `node --check plugins/ai-agent-engine-codex/scripts/ae-index/sqlite-store.mjs`
- Integration:
  - `node scripts/ae-tools.mjs ae-index-doctor`
  - `node scripts/ae-tools.mjs ae-index-build --root docs/08-ai-memory --limit 20`
  - `node scripts/ae-tools.mjs ae-index-query --query "multi agent review gates" --top-k 5`
  - `node scripts/ae-tools.mjs ae-index-stale`
- User flow:
  - Agent starts task, runs query for topic, reads returned source paths, then proceeds with PRD/plan/review.
  - Query output must be sufficient to decide which files to open without scanning all docs.
- Data / operations:
  - Delete `.ae/index/ae-docs.sqlite`, rebuild, and confirm query still works.
  - Modify a fixture source and confirm stale-check blocks `--fresh`.
  - Confirm `.ae/index` stays ignored by Git.
- Observability:
  - Every command returns `backend`, `generatedAt`, `freshness`, `warnings`, and `limitations`.
  - Errors identify whether the failure is missing runtime, missing index, invalid path, stale index, or malformed query.

## Rollback / Recovery

- Remove the new index command switch cases and helper modules if dependency loading destabilizes unrelated AE commands.
- Remove `sqlite-vec` dependency if native package behavior blocks supported installs.
- Delete `.ae/index/` to recover from a corrupt local index.
- Keep source docs untouched; rollback never requires restoring Markdown content from the database.
- If stale detection cannot be made reliable, disable `--fresh` query mode and keep build/query marked as advisory until fixed.

## Plan Self-Review

- Placeholder scan: no placeholder sections or unresolved implementation verbs remain.
- Consistency check: all units route through plugin script modules and keep root wrapper thin.
- Scope check: first phase only implements SQLite FTS5 plus `sqlite-vec`; other adapters are deferred.
- Acceptance coverage:
  - Backend doctor and dependency distribution: U0.
  - Build command: U6.
  - Query command: U7.
  - Stale-check: U8.
  - Adapter boundary: U5.
  - Deterministic tests: U4 through U9.
  - Install behavior: U9.
- Validation gaps:
  - Real semantic embedding provider quality is not validated in this phase because it is out of scope.
  - Cross-platform native package installation must be verified during implementation on available local platforms.
  - Target-project zero-step backend enablement is intentionally not guaranteed; `ae-index-doctor` must report opt-in setup requirements.
- Alternatives and ADR check: alternatives are recorded and the chosen approach follows the user's sqlite-vec plus FTS5 direction.
- High-risk pre-mortem check: source-of-truth, platform loading, and stale-index failure scenarios are covered.

## Handoff

Archived for later at `docs/00-process/archive/2026-06/sqlite-vec-knowledge-index/README.md`.

When this work is resumed, run `ae-review domain:document mode:report-only` again if dependencies or Node SQLite behavior have changed. Implementation must start with U0 and stop if the sqlite-vec probe or target-project dependency diagnostic fails.
