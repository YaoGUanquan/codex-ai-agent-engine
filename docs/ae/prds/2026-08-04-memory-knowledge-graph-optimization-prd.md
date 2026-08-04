---
type: prd
status: drafted
date: 2026-08-04
topic: memory-knowledge-graph-optimization
format: human-readable-requirements
sharded: false
---

# Memory And Knowledge Graph Optimization

## AI Parse Contract

- canonicalKind: requirements
- humanEquivalent: true
- stableIdsRequired: true
- noImplicitScope: true

## Problem Frame

The project keeps durable, curated decisions in `docs/08-ai-memory`, workflow artifacts in `docs/ae`, and a shallow read-only source dependency preview through `ae-graph-build` and `ae-graph-query`. The current memory index is human-readable but has no deterministic metadata or verified relationship query. The source graph exposes only file-level import and mention edges, has configurable result limits, and is not a semantic code graph.

The desired outcome is a small, locally inspectable knowledge layer that lets an agent locate authoritative memory and its verified relations to AE artifacts without treating generated data as source of truth. CodeGraph may be evaluated separately for source-symbol discovery, but must not become a default runtime, global Codex mutation, or a substitute for project memory.

## Requirements

**Canonical Memory And Relations**

- R1. Durable project knowledge remains authored and reviewed in `docs/08-ai-memory`; a compatibility path, generated index, query result, or third-party tool must not become the canonical memory source.
  Acceptance: The contract identifies Markdown memory files as canonical, labels every derived result as ephemeral, and states that `docs/ai-memory` remains a compatibility pointer.

- R2. Maintainers can declare a bounded registry for memory documents with stable path, role, topics, review status, and only source-verified relationships to relevant requirements, plans, reviews, experience notes, or governance documents.
  Acceptance: A malformed, missing, duplicate, outside-allowlist, symbolic-link, or dangling registry record is rejected by a deterministic local check; relationship types and their direction are documented.

- R3. An agent can issue a read-only local query by topic, path, or relation and receive ranked, bounded results containing the canonical source path, matching metadata, relationship evidence, freshness basis, and limitations.
  Acceptance: The contract fixes the command inputs, their compositional semantics, the success/no-match JSON envelope, and the invalid-registry diagnostic and exit behavior. Fixture tests prove exact topic lookup, relation traversal, deterministic ordering, bounded excerpts, empty results, and stale or invalid metadata diagnostics without network access or persistent state.

**Graph Boundary And Retrieval Quality**

- R4. The project exposes the documentation relationship map separately from the existing shallow code dependency graph, and clearly labels the confidence and provenance of every returned edge.
  Acceptance: The result distinguishes `declared` documentation relations from `inferred` source import/mention edges, and does not claim symbol resolution, dynamic dispatch, graph persistence, or automatic freshness beyond the command's observed filesystem basis.

- R5. Existing `ae-graph-build` and `ae-graph-query` remain backward compatible and read-only while their truncation and supported-edge limitations are visible to callers.
  Acceptance: Existing graph tests remain green; command output reports the requested and effective file/edge limits, returned counts, and truncation state. The legacy default remains a 500-file scan with no edge cap; an explicit edge cap is opt-in.

**Optional CodeGraph Evaluation**

- R6. CodeGraph is evaluated only through an explicit, isolated, local pilot focused on source-symbol and impact discovery.
  Acceptance: Before creating any index, the pilot re-verifies the tested version/ref, license, operating-system context, and the upstream-supported telemetry/update controls. It then records repository scope, tasks, baseline, measured outcomes, and cleanup result; no claim of broad improvement is made without the comparison evidence.

- R7. The default AE distribution and normal project installation remain free of CodeGraph installation, global Codex configuration changes, automatic MCP registration, source uploads, background services, and telemetry.
  Acceptance: Package/install smoke checks confirm that a normal install does not require `codegraph`, create `.codegraph`, or mutate user-home Codex files; documentation presents CodeGraph only as opt-in research or an explicitly approved adapter.

## Non-Functional Requirements

- NFR1. The initial implementation uses the existing Node.js ESM and test tooling with no new runtime dependency, native module, database, embedding provider, network request, or daemon.
  Acceptance: Dependency declarations remain unchanged and focused tests pass with network disabled; distributable-version synchronization updates only the existing root package metadata and plugin manifest required by repository governance.

- NFR2. The knowledge layer preserves UTF-8 source bytes, avoids secrets and raw session logs, and never follows symbolic links or reads outside the project root.
  Acceptance: Before any read, the implementation `lstat`s every target path component below the worktree and rejects symbolic links, junctions, broken links, and realpath escapes; deterministic tests cover those branches without relying on local link-creation privileges, plus UTF-8 text, excluded secret-like files, and bounded output.

- NFR3. Any distributable change preserves the plugin-source and `.agents/skills` mirror contract and follows the existing version/release-note rules.
  Acceptance: When a distributable implementation is approved, the version, mirror, release-note, artifact, and install-smoke checks required by `AGENTS.md` pass.

## Must-Haves

- Requirement ID: R1
  Must-have completion condition: Markdown memory remains the only authoritative durable source; no generated graph or CodeGraph database is presented as memory.
- Requirement ID: R7
  Must-have completion condition: No default workflow writes user-home Codex configuration or auto-registers an MCP server.

## Success Criteria

- A task can retrieve the smallest relevant memory/artifact set through documented, deterministic local commands.
- Every relationship shown to an agent can be traced to an explicit registry declaration or a separately labeled shallow source edge.
- Maintainers can decide from a bounded CodeGraph pilot whether source-symbol retrieval yields enough value for a later optional adapter.

## Scope Boundary

### In Scope

- A versioned memory registry contract, validator, read-only query, and documentation relationship map.
- Clear separation of canonical memory, declared documentation relations, and the existing inferred shallow source graph.
- Limit/freshness transparency for current graph commands.
- An opt-in CodeGraph pilot protocol and evidence template.

### Out Of Scope

- Replacing Markdown memory with SQLite, a vector store, or CodeGraph data.
- Restarting the archived SQLite FTS5/sqlite-vec plan in `docs/ae/prds/2026-06-22-001-project-knowledge-vector-index-prd.md`.
- Embedding providers, semantic-vector quality claims, cloud retrieval, a persistent graph database, graph UI, daemon, or MCP server.
- Automatic installation of CodeGraph, mutation of `~/.codex`, or modification of CodeGraph upstream code.
- Backfilling raw historical session logs into long-term memory.

### Constraints

- All source paths and links are repository-relative and must remain within the current worktree after realpath resolution.
- A registry relation is authored only after its source evidence is inspected; automatic similarity or filename matching may provide no relation.
- Existing artifacts remain valid without registry backfill until their memory relationship is explicitly curated.
- The previous research record references upstream ref `49c11fc2e0c02170742be8411e66a31af611f4b7`; network access was unavailable during this review, so any future pilot must re-verify its ref, release, license, CLI lifecycle, and privacy controls before it creates local state.

## Validation Evidence

| Requirement | Applicable tier | Expected signal and bounded claim | Status before implementation |
| --- | --- | --- | --- |
| R1-R5, NFR1-NFR2 | Static inspection and focused automated test | Parser, validator, query, output bounds, and documented contracts work on local fixtures only. | unverified |
| R5, NFR3 | Integration or build | Existing package, mirror, artifact, and install checks remain compatible. | unverified |
| R6-R7 | Runtime health / operations | A user-authorized local CodeGraph pilot proves only its recorded environment and tasks. | blocked pending explicit authorization |

## Key Decisions

- D1. Start with curated metadata and declared relationships, not a vector database.
  Reason: It improves precise retrieval while preserving canonical Markdown, deterministic behavior, install portability, and reviewability.

- D2. Keep documentation relations and source dependency edges as separate graph types.
  Reason: A declared evidence link and a syntactic import answer different questions and have different confidence levels.

- D3. Treat CodeGraph as an external, optional source-intelligence pilot.
  Reason: Its current Codex target writes global configuration and its persistent SQLite/watch lifecycle is outside the project's default installation boundary.

- D4. Retain the archived vector-index artifacts as historical research, not an active implementation source.
  Reason: Their native dependency, generated-index, freshness, and provider contracts require a separate decision after the lightweight layer has measurable limits.

- D5. A no-match memory query returns only `no declared match`; it does not scrape unregistered documentation or suggest inferred relations.
  Reason: The first release must not make a candidate filename or keyword overlap look like curated memory evidence.

## Dependencies And Assumptions

### Dependencies

- The existing `docs/08-ai-memory` curation and `docs/ae` artifact conventions.
- The Node.js ESM scripts, Node test runner, artifact checker, mirror checker, and install smoke checks already owned by this repository.

### Assumptions

- Exact topics, paths, and declared links solve the primary retrieval failures before semantic similarity is required.
- The user will explicitly authorize any CodeGraph installation or source indexing pilot after reviewing the protocol.

## Open Questions

### Must Resolve Before Pilot

- Q1. [Affects R6, R7][user decision] Which user-owned repository and representative tasks may be used for a CodeGraph pilot, and may the pilot create its local `.codegraph/` derived directory?

## Evidence Notes

- Existing source graph boundary -> Evidence: `plugins/ai-agent-engine-codex/scripts/ae-tools.mjs` graph builder and `docs/08-ai-memory/08-phase-two-tooling.md`.
- Existing memory curation boundary -> Evidence: `docs/08-ai-memory/00-index.md` and `docs/08-ai-memory/06-agent-maintenance-rules.md`.
- Archived vector proposal -> Evidence: `docs/ae/prds/2026-06-22-001-project-knowledge-vector-index-prd.md` and its linked archived process record.
- CodeGraph compatibility boundary -> Evidence: inspected upstream `src/installer/targets/codex.ts`, `src/db/schema.sql`, `src/mcp/server-instructions.ts`, and `TELEMETRY.md` at the pinned ref above.

## Consistency Check

- requirementsCount: 7
- nonFunctionalRequirementsCount: 3
- decisionsCount: 5
- openQuestionsCount: 1
