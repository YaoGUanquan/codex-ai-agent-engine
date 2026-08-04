---
type: plan
status: drafted
date: 2026-08-04
title: memory-knowledge-graph-optimization
origin: docs/ae/prds/2026-08-04-memory-knowledge-graph-optimization-prd.md
originFingerprint: 2026-08-04-memory-knowledge-graph-optimization
depth: deep
format: human-readable-plan
sharded: false
---

# Plan: Memory And Knowledge Graph Optimization

## Source

- Requirements: `docs/ae/prds/2026-08-04-memory-knowledge-graph-optimization-prd.md`.
- Existing memory: `docs/08-ai-memory/00-index.md`, `docs/08-ai-memory/06-agent-maintenance-rules.md`, and `docs/08-ai-memory/08-phase-two-tooling.md`.
- Existing graph: `plugins/ai-agent-engine-codex/scripts/ae-tools.mjs` and `tests/skill-scripts.test.mjs`.
- Archived alternative: `docs/ae/prds/2026-06-22-001-project-knowledge-vector-index-prd.md`.
- External research input, not implementation authority: CodeGraph upstream ref `49c11fc2e0c02170742be8411e66a31af611f4b7`, MIT.

## AI Parse Contract

- canonicalKind: plan
- humanEquivalent: true
- stableIdsRequired: true
- noImplicitScope: true

## Scope

Deliver a dependency-free, read-only memory registry and documentation relationship query layered on top of canonical Markdown. Retain the shallow source graph as a distinct tool and make its bounded scan transparent. Define, but do not automatically execute, an isolated CodeGraph pilot. No persistent database, vector backend, external service, background watcher, global configuration, or MCP installation is included.

## Readiness

- Goal: agents retrieve authoritative memory and evidence-linked AE artifacts with a bounded local command instead of broad document scans.
- Acceptance criteria: R1-R7 and NFR1-NFR3 from the source PRD.
- Non-goals: vector retrieval, source-symbol graph replacement, full semantic code graph, CodeGraph shipping, and any write operation outside approved documentation/implementation files.
- Affected areas: Memory, Knowledge, Guardrail, and Distribution layers; the CodeGraph pilot is an external operational evaluation only.
- Validation surface: fixture unit tests, existing package/mirror/artifact/install checks, UTF-8 inspection, and a separately authorized local pilot.
- Open questions: Q1 blocks U5 only; U1-U4 have no unresolved product or technical decision.

## Validation Evidence

| Acceptance criterion | Applicable tier | Expected signal and bounded claim | Preconditions / owner | Status | Recovery or rollback signal |
| --- | --- | --- | --- | --- | --- |
| R1-R4, NFR1-NFR2 | Static inspection and focused automated test | Fixture registry/query/map returns only valid paths, declared relations, bounded excerpts, and explicit limitations. | Maintainer; local Node runtime. | unverified | Remove new commands and registry references; canonical Markdown remains intact. |
| R5 | Focused automated test | Existing graph output remains read-only and explicitly reports truncation. | Maintainer; existing graph fixtures. | unverified | Restore prior output contract if an existing consumer breaks. |
| NFR3 | Integration or build | Mirror, artifact, package, and target-install checks pass after any distributable changes. | Maintainer; repository dependencies. | unverified | Do not release or version-bump until all distribution checks pass. |
| R6-R7 | Runtime health / operations | Pilot metrics prove only a named local repository, version, environment, and task set. | User approval, local CodeGraph binary, and pre-index verification of the upstream-supported privacy/update controls and cleanup lifecycle. | blocked | Use only the re-verified local cleanup lifecycle for the approved derived directory; do not modify global Codex files. |

## Assumptions

- The registry has a deliberately small, curated set of records; it is not a crawler for all documentation.
- Query result ranking starts with exact topic/path/relation matches and predictable tie-breaking, not semantic similarity.
- The current plugin source remains canonical and any mirrored skill/document update follows existing copy validation.

## Alternatives Considered

- Recommended: curated registry plus a read-only knowledge-map/query layer, with CodeGraph as a separate pilot.
  - Fit: meets the retrieval gap with the existing Node and Markdown stack.
  - Trade-off: relationship maintenance is deliberate human work.
  - Risk: recall is limited to curated metadata, which is exposed honestly.
- Alternative: revive the SQLite FTS5/sqlite-vec plan now.
  - Fit: potentially wider search recall.
  - Rejected because: it introduces native/runtime and derived-state ownership before basic metadata/relationship quality has been measured.
- Alternative: install CodeGraph as the default MCP/indexing runtime.
  - Fit: stronger code-symbol navigation.
  - Rejected because: it does not model curated memory and its current Codex installer targets user-global configuration and a persistent watcher/index lifecycle.
- Alternative: keep the status quo.
  - Fit: zero implementation cost.
  - Rejected because: agents still need broad document scans and cannot distinguish declared evidence links from syntactic file mentions.

## Decision Drivers

- Driver 1: Preserve reviewed Markdown and evidence provenance as the memory source of truth.
- Driver 2: Improve deterministic retrieval without new dependency, network, daemon, or global-install ownership.
- Driver 3: Obtain a real, bounded measurement before adopting external source-intelligence tooling.

## Decisions

### ADR-1 - Registry Is Curated Metadata, Not a Second Memory Store

- Decision: introduce `docs/08-ai-memory/00-registry.json` as a small validated metadata registry whose records point at canonical Markdown and artifact paths.
- Drivers: deterministic parsing, narrow changes to existing memory files, explicit relation provenance.
- Alternatives: edit frontmatter into every historical memory file; scrape headings dynamically; use a database.
- Why chosen: a single structured registry limits migration risk, is easy to diff, and can reject drift without rewriting curated text.
- Consequences: registry changes require an evidence path and validation; content remains in the referenced document.
- Follow-ups: revisit per-document frontmatter only if registry maintenance becomes the demonstrated bottleneck.

### ADR-2 - Fixed Query, No-Match, And Graph-Limit Contracts

- Decision: `ae-memory-query` accepts one or more of `--topic`, `--path`, and `--relation`; supplied filters compose with AND semantics. `ae-knowledge-query` accepts `--path`, optional `--relation`, and `--direction incoming|outgoing|both` (default `both`). `ae-memory-query` returns only curated matches and otherwise emits `status: "ok"`, an empty result list, and exactly `no declared match`; it never scans unregistered documents. Invalid input or registry data emits a documented JSON diagnostic envelope and exits non-zero. Existing graph responses gain an additive `limits` object with `files: { requested, effective, eligible, returned, truncated }` and `edges: { requested, effective, returned, truncated }`.
- Drivers: avoid inferred memory evidence, preserve existing graph fields, and make the existing file/edge caps observable.
- Alternatives: search all documentation on a no-match, or emit only a human-readable truncation warning.
- Why chosen: the JSON result stays deterministic, machine-readable, and backward compatible while making uncertainty explicit.
- Consequences: implementation must count eligible source files before applying the effective file limit and assert unchanged legacy fields in regression tests. The legacy default remains a 500-file scan and an uncapped edge list; `--edge-limit` is opt-in, so a caller can request bounded edge output without changing default graph contents.
- Follow-ups: a future semantic candidate-search feature requires a separate requirement and confidence model.

### ADR-3 - Two Graphs, Two Confidence Models

- Decision: add `ae-knowledge-map` and `ae-knowledge-query` for declared artifact relationships; retain `ae-graph-build` and `ae-graph-query` for inferred shallow source edges.
- Drivers: prevent a documentation evidence relation from being confused with an import or a semantic call edge.
- Alternatives: merge all edges into the existing graph JSON; create a persistent graph database.
- Why chosen: separate commands preserve backward compatibility and require callers to observe provenance.
- Consequences: documentation and help must explain when to use each command.
- Follow-ups: only design a combined view after consumers demonstrate a need and confidence labels can remain lossless.

### ADR-4 - CodeGraph Is a Controlled Pilot, Not a Distribution Dependency

- Decision: provide a pilot protocol and evidence template, but do not add CodeGraph to package dependencies, installation scripts, `.mcp.json`, or normal instructions.
- Drivers: project-local installation boundary, privacy, operational reversibility, and unknown task benefit for this repository size.
- Alternatives: default MCP registration; source vendoring; no evaluation.
- Why chosen: it permits evidence-based evaluation without affecting every Codex project or shipping an unverified runtime contract.
- Consequences: only the user can authorize the actual index creation and optional CLI use.
- Follow-ups: a successful pilot may justify a separate optional-adapter PRD with a current compatibility and license audit.

## Risks

- Curated metadata can drift from its source documents.
  - Mitigation: validate every path, duplicate, relation target, type, and required evidence field in CI.
- A query could imply that missing metadata means a relationship is absent.
  - Mitigation: return `limitations` and distinguish `no declared match` from `no relationship exists`.
- Adding a map command could weaken the established read-only graph boundary.
  - Mitigation: do not write graph files; assert the worktree remains unchanged after each command.
- CodeGraph pilot results could be overstated or carry external state into normal work.
  - Mitigation: compare defined tasks to a baseline, re-verify version/ref and the upstream-supported privacy controls before state creation, forbid `codegraph install`, and record cleanup.

## Pre-Mortem

- Failure scenario 1: the registry becomes a stale duplicate of the memory index.
  - Mitigation: give the registry only machine-required metadata, retain human navigation in `00-index.md`, and make the checker fail paths/relations that no longer exist.
- Failure scenario 2: automatic relation inference creates false evidence links.
  - Mitigation: accept only declared relation records in the first release; present file mentions as a separate existing graph type.
- Failure scenario 3: a convenience integration accidentally edits `~/.codex` or launches an always-on process.
  - Mitigation: keep pilot instructions out of installer paths and require a preflight check that rejects global install/MCP commands.

## Global Constraints

- No new dependency, native module, database file, vector store, network call, long-running process, or lockfile in U1-U4. After distributable feature validation passes, synchronize only the existing root `package.json` and plugin manifest versions.
- Do not alter canonical memory prose other than linking the registry and documenting its contract.
- Do not change `scripts/ae-tools.mjs`; it remains a thin wrapper around plugin-owned command behavior.
- Do not modify `~/.codex`, `config.toml`, `.mcp.json`, or any user-home file. The previously noted CodeGraph ref and environment-variable examples are research leads, not verified execution instructions.
- Preserve UTF-8 and unrelated worktree content. Treat `docs/ae/gates` and `docs/ae/reviews` as generated/ignored evidence unless explicitly requested for version control.

## Implementation Units

### U1 - Define The Registry And Relation Contract

- Goal: establish the canonical data contract before parsing or querying it.
- Requirements covered: R1, R2, R4, NFR2.
- Acceptance criteria covered: declared relationships are typed, directed, evidence-backed, source-contained, and distinguishable from source imports.
- Depends on: none.
- Files:
  - `docs/ae/references/memory-knowledge-registry-contract.md`
  - `docs/08-ai-memory/00-registry.json`
  - `docs/08-ai-memory/00-index.md`
- Forbidden files:
  - `docs/08-ai-memory/01-project-context.md`
  - `docs/08-ai-memory/02-architecture-boundaries.md`
  - `docs/08-ai-memory/03-key-workflows.md`
  - `docs/08-ai-memory/04-known-pitfalls.md`
  - `docs/08-ai-memory/05-decision-log.md`
  - `docs/08-ai-memory/06-agent-maintenance-rules.md`
  - `docs/08-ai-memory/99-prompt-template.md`
- Layer ownership: Memory and Knowledge.
- Approach: define schema version, allowed `kind` and relation `type` enums, mandatory evidence fields, ordering rules, freshness basis, and output limits. Permit canonical memory targets only below `docs/08-ai-memory`; permit relation targets only below `docs/ae` or the repository `AGENTS.md`; reject every other path class, including `docs/00-process`. Add only a concise registry link to `00-index.md` and include a complete initial registry for current memory files plus a deliberately small set of already-inspected artifact links.
- Tests: fixture records for valid, duplicate, dangling, outside-allowlist, unsupported-type, missing-evidence, symbolic-link, junction, broken-link, and realpath-escape cases.
- Validation: direct UTF-8 inspection; after U2 exists, run `node scripts/check-memory-knowledge-contract.mjs --root .` against the checked-in registry.
- Rollback signals: the contract requires fields that cannot be sourced from current documents, or its initial registry duplicates canonical prose.
- Deferred to implementation: no candidate discovery or automated backfill.

### U2 - Add A Deterministic Validator And Read-Only Query

- Goal: make registry integrity and focused retrieval mechanically checkable with no derived store.
- Requirements covered: R2, R3, NFR1, NFR2.
- Acceptance criteria covered: deterministic metadata validation, exact topic/path/relation lookup, bounded excerpts, and honest empty/stale diagnostics.
- Depends on: U1.
- Files:
  - `plugins/ai-agent-engine-codex/scripts/ae-tools.mjs`
  - `plugins/ai-agent-engine-codex/scripts/memory-knowledge-contract.mjs`
  - `scripts/check-memory-knowledge-contract.mjs`
  - `tests/skill-scripts.test.mjs`
  - `package.json`
- Forbidden files:
  - `scripts/ae-tools.mjs`
  - `plugins/ai-agent-engine-codex/.mcp.json`
  - `scripts/install-project.mjs`
  - `scripts/update-project.mjs`
- Layer ownership: Knowledge and Guardrail.
- Approach: add `ae-memory-query` to the plugin CLI and put the shared parser/validator in `memory-knowledge-contract.mjs`, imported by the root checker. It accepts at least one of `--topic`, `--path`, and `--relation`; multiple filters use AND semantics. On a valid registry, return the documented JSON success envelope; a valid zero-match has `status: "ok"`, no results, and exactly `no declared match`. Malformed input or registry data returns the documented diagnostic envelope and exits non-zero. Before every read, `lstat` the worktree-relative target and every component below the worktree; reject symbolic links, junctions, broken links, and any path whose `realpath` escapes the allowed root. Limit registry bytes before parsing, target file bytes before excerpting, result records, and excerpts; preserve UTF-8 text. Set `freshness` from current observed file metadata and never scan unregistered documents.
- Tests: valid registry, malformed JSON, all invalid relation classes, omitted-filter usage error, AND-filter semantics, deterministic result order, no hit, missing target, UTF-8 preservation, registry/target byte caps, hidden/secret-like path rejection, mocked `lstat`/`realpath` link-rejection branches plus real link fixtures where available, invalid-envelope/non-zero behavior, and no file creation assertion.
- Validation:
  - `node --test --test-name-pattern "memory query|memory registry" tests/skill-scripts.test.mjs`
  - `node scripts/check-memory-knowledge-contract.mjs --root .`
  - `node scripts/ae-tools.mjs ae-memory-query --topic graph --limit 5`
  - `npm run check` after adding `node --check scripts/check-memory-knowledge-contract.mjs`, `node --check plugins/ai-agent-engine-codex/scripts/memory-knowledge-contract.mjs`, and `node scripts/check-memory-knowledge-contract.mjs --root .` to the existing check script
  - `git diff --check`
- Rollback signals: any command writes a registry, cache, database, or temporary file inside the target worktree; a query reads a target outside declared roots.
- Deferred to implementation: no semantic candidate discovery is permitted in this plan.

### U3 - Add The Declared Documentation Relationship Map And Graph Transparency

- Goal: expose a read-only declared knowledge map without changing source-graph semantics.
- Requirements covered: R3, R4, R5, NFR1.
- Acceptance criteria covered: map/query output labels provenance, current graph reports limit/truncation state, and existing graph JSON remains compatible.
- Depends on: U2.
- Files:
  - `plugins/ai-agent-engine-codex/scripts/ae-tools.mjs`
  - `tests/skill-scripts.test.mjs`
  - `plugins/ai-agent-engine-codex/skills/ae-help/references/capability-catalog.json`
  - `README.md`
  - `README.en.md`
- Forbidden files:
  - `scripts/ae-tools.mjs`
  - `docs/ae/graphs/graph.json`
  - `.ae/**`
  - `plugins/ai-agent-engine-codex/.mcp.json`
- Layer ownership: Knowledge and Guardrail.
- Approach: add `ae-knowledge-map` and `ae-knowledge-query` as read-only commands over the validated registry. `ae-knowledge-query` requires `--path`, accepts optional `--relation`, and accepts `--direction incoming|outgoing|both` (default `both`). Return node/edge provenance as `declared`, evidence path, schema version, current filesystem freshness, selected limit, truncation flag, and limitations. Extend build and query graph responses with the ADR-2 additive `limits` object without changing legacy fields or the `store` contract: the default is the existing 500-file scan with uncapped edges; an optional `--edge-limit` enables edge truncation. Document a command-selection table: memory query for curated facts, knowledge map for evidence links, graph build/query for shallow source imports/mentions.
- Tests: declared-edge traversal in both directions, invalid direction, unknown node/relation, stable sort, output cap, provenance label, unchanged filesystem, default graph output compatibility, file-limit metadata, and explicit edge-limit truncation reporting.
- Validation:
  - `node --test --test-name-pattern "knowledge (map|query)|graph.*limit" tests/skill-scripts.test.mjs`
  - `node scripts/ae-tools.mjs ae-knowledge-map --root . --limit 50`
  - `node scripts/ae-tools.mjs ae-graph-build --root . --limit 20 --no-write`
  - `node scripts/ae-tools.mjs ae-graph-query --root . --keyword graph --no-write`
- Rollback signals: old graph fields change type or disappear, a declared edge lacks evidence, or any command is described as a semantic/persistent graph.
- Deferred to implementation: no combined documentation/source graph view.

### U4 - Update Distribution, Documentation, And Delivery Gates

- Goal: make the new capability discoverable without unsupported runtime claims and prove its distribution contract.
- Requirements covered: R1-R5, R7, NFR3.
- Acceptance criteria covered: help/readme/capability metadata align with actual commands, source and mirror remain consistent, and normal installation stays CodeGraph-free.
- Depends on: U2, U3.
- Files:
  - `plugins/ai-agent-engine-codex/skills/ae-help/references/capability-catalog.json`
  - `.agents/skills/ae-help/references/capability-catalog.json`
  - `README.md`
  - `README.en.md`
  - `README.zh-CN.md`
  - `package.json`
  - `plugins/ai-agent-engine-codex/.codex-plugin/plugin.json`
  - `scripts/install-project.mjs`
  - `scripts/check-install-smoke.mjs`
  - `tests/skill-scripts.test.mjs`
  - `scripts/check-release-notes.mjs` only if the existing checker cannot validate the required release entry
- Forbidden files:
  - `scripts/update-project.mjs`
  - `plugins/ai-agent-engine-codex/.mcp.json`
  - user-home Codex configuration
- Layer ownership: Knowledge, Guardrail, and Distribution.
- Approach: update command catalog/help and bilingual documentation with source-of-truth, registry-prerequisite, read-only, and CodeGraph opt-in boundaries. Synchronize the generated mirror. Add the root checker wrapper to `install-project.mjs`; update the install smoke to assert the wrapper exists, runs against the installed target, and that `ae-memory-query` reports the documented missing-registry diagnostic without creating state. If the command is distributable, increment and synchronize the existing root `package.json` and plugin manifest SemVer plus release-note additions only after feature tests are green; do not create a lockfile or bump versions for U1 planning artifacts alone.
- Tests:
  - `node scripts/check-skill-mirror.mjs`
  - `node scripts/check-skill-language-metadata.mjs`
  - `node scripts/check-skill-contract.mjs`
  - `node scripts/check-install-smoke.mjs`
  - `node scripts/check-release-notes.mjs`
- Validation:
  - `npm test`
  - `npm run check`
  - `git diff --check`
  - a copied-target install smoke that runs `node scripts/check-memory-knowledge-contract.mjs` and `node scripts/ae-tools.mjs ae-memory-query --topic graph`, verifies the documented missing-registry diagnostic/non-zero exit, and confirms no state was created
  - `rg -n "codegraph" scripts/install-project.mjs scripts/update-project.mjs plugins/ai-agent-engine-codex/.mcp.json` must return no matches
- Rollback signals: a normal install starts requiring CodeGraph, a mirror differs, release versions diverge, or help claims MCP auto-registration/persistent indexing.
- Deferred to implementation: external runtime integration remains prohibited.

### U5 - Run The Explicit CodeGraph Pilot And Decide On A Future Adapter

- Goal: collect comparable evidence for CodeGraph's code-symbol/impact value without changing default AE behavior.
- Requirements covered: R6, R7.
- Acceptance criteria covered: authorized pilot records environment, source scope, privacy settings, baseline, metrics, failure conditions, and cleanup; no global config mutation occurs.
- Depends on: U1.
- Files:
  - `docs/ae/templates/codegraph-pilot-evidence-template.md`
  - `docs/ae/experience/codegraph-pilot.md`
  - `docs/00-process/active/codegraph-pilot/progress.md`
- Forbidden files:
  - `package.json`
  - `scripts/install-project.mjs`
  - `plugins/ai-agent-engine-codex/.mcp.json`
  - `~/.codex/**`
- Layer ownership: Guardrail and Delegation; no Distribution ownership.
- Approach: before the pilot, require written user authorization for repository, source-index creation, binary/package acquisition, and use of a local `.codegraph/` directory. Before creating any index, re-verify the actual CodeGraph version/ref, license, supported privacy/update controls, and local cleanup lifecycle from current upstream source or CLI help. Record the resulting control mechanism and evidence; abort the pilot if it cannot be established. Prohibit `codegraph install`, MCP registration, and home-directory writes. Compare at least three representative source-discovery/impact tasks against built-in `rg`/read flow using the same task wording. Record tool calls, wall-clock duration, source correctness checked against files/tests, false/omitted relations, index size/time, and cleanup.
- Tests: preflight script or checklist proving global Codex paths were not targeted; task-specific correctness checks selected from the pilot repository.
- Validation:
  - `codegraph --version`
  - a current license/ref inspection
  - `codegraph status` only in the explicitly approved project, and only after the command's current lifecycle is verified
  - before/after filesystem and user-home configuration comparison
  - manual review of the pilot evidence against the template
- Rollback signals: any prompt requests global install, a tool writes outside the approved project, telemetry/update opt-out cannot be proven, stale output is observed, or task correctness regresses versus the baseline.
- Deferred to implementation: optional adapter PRD only when the pilot shows reproducible net benefit and the current Codex integration path is project-scoped or can be avoided.

## Consistency Check

- implementationUnitCount: 5
- sourceRequirementsCovered: R1, R2, R3, R4, R5, R6, R7, NFR1, NFR2, NFR3
- sourceRequirementsDeferred: none
- openQuestionsCount: 1

## Validation Plan

- Unit: U2/U3 fixture tests exercise parser, relation, query, output-limit, compatibility, and no-write behavior.
- Integration: `npm test`, `npm run check`, artifact checker, mirror checker, language metadata checker, skill contract checker, install smoke, release-note checker, and `git diff --check`.
- User flow: run documentation-guided query/map commands in an isolated copied target project; inspect JSON and verify no derived state is created.
- Data / operations: no database or network applies to U1-U4. U5 is a separately authorized local operational test and does not prove general compatibility, browser behavior, or deployment readiness.
- Observability: query/map output carries schema, freshness basis, limit/truncation, provenance, and limitations; pilot evidence records preflight and cleanup observations.

## Rollback / Recovery

- U1-U4: revert only registry/contract/query/map/documentation files. Markdown memory remains valid and usable with its existing index if any new layer fails.
- U5: remove only the explicitly approved project-local `.codegraph/` derived directory through the upstream local cleanup command or a verified local operation. Do not invoke global uninstall because global installation is forbidden by this plan.
- Do not reintroduce SQLite/vector storage or default CodeGraph integration as a rollback shortcut; each requires a new approved PRD.

## Plan Self-Review

- Placeholder scan: pass; all owned files use concrete repository-relative paths.
- Consistency check: pass; every requirement and NFR maps to at least one unit.
- Scope check: pass; persistent/vector/MCP/global-install work is explicitly excluded.
- Acceptance coverage: pass; every unit names files, command-level validation, and rollback signals.
- Validation gaps: CodeGraph runtime evidence is intentionally blocked until user approval; local tests cannot prove future third-party compatibility or performance claims.
- Alternatives and ADR check: pass; status quo, vector index, and default CodeGraph integration are considered and rejected with repository-grounded reasons.
- High-risk pre-mortem check: pass; metadata drift, false relations, and global mutation each have a preventive control.

## Handoff

Review this PRD and plan using `ae-review domain:document mode:report-only` before implementation. Execute U1-U4 serially because the contract defines parser behavior and query semantics. Do not start U5 without resolving Q1 through explicit user authorization.
