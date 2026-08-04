<!-- ae-codex:experience -->
# CodeGraph Pilot Experience

## Scope And Authorization

This controlled pilot used `D:\codes\ph-AI-Agent-Engine` on its existing dirty `main` branch at commit `8f73ca02126b9a08ed86c4961ca6b59cfd660462`.

The user explicitly authorized this repository and branch for U5, including acquisition of a temporary CodeGraph binary and creation of the repository-local `.codegraph/` directory. The pilot did not run `codegraph install`, register MCP, modify `~/.codex`, or change any distribution file.

## Preflight

- Operating system: Windows x64, Node `v24.18.0`.
- Upstream source: `colbymchenry/codegraph` `main` at `49c11fc2e0c02170742be8411e66a31af611f4b7`; license MIT.
- Tested release: official `v1.5.0` `codegraph-win32-x64.zip`, SHA-256 `d6798622b4f44ee6757c94335f437ee27a9ff7d3537b554cb6a2b3baf11bc4a1`.
- The release was downloaded, checksum-verified, and extracted only under the external temporary directory `D:\codes\.codegraph-pilot-20260804`; it was not added to PATH or installed globally.
- Every CLI invocation set `CODEGRAPH_TELEMETRY=0`, `DO_NOT_TRACK=1`, `CODEGRAPH_NO_UPDATE_CHECK=1`, and `CODEGRAPH_NO_DAEMON=1`. `codegraph telemetry status` reported telemetry disabled by `DO_NOT_TRACK`.
- CLI help confirmed `init [path]`, `status [path]`, `query`, `explore`, and `uninit [path]`. `uninit --force .` is the documented local cleanup operation.
- Before and after checks showed unchanged hashes for the existing Codex `config.toml` and `AGENTS.md`; `C:\Users\yaogu\.codegraph` did not exist after the pilot. No CodeGraph `node.exe` or `cmd.exe` process remained after cleanup.

## Index Observation

`codegraph init .` completed in 2,778 ms and created only `.codegraph/` in the approved repository. `codegraph status . --json` reported:

- 103 indexed files, 573 nodes, and 1,595 edges.
- `node-sqlite` backend, WAL journal mode, complete state, and no pending references.
- two derived files totaling 2,687,205 bytes: `.gitignore` and `codegraph.db`.

## Baseline Comparison

| Task | Baseline `rg` flow | Baseline | CodeGraph flow | CodeGraph | Correctness result |
| --- | --- | ---: | --- | ---: | --- |
| P1 Trace `ae-memory-query` from root wrapper through dispatch and validator. | Search `ae-memory-query`, `memoryQuery`, and `memory-knowledge-contract` across root/plugin CLI and contract files. | 28 ms, 12 lines; found wrapper, plugin dispatch, and validator. | `codegraph explore --path . --max-files 8 <task>` | 434 ms | Returned only `memory-knowledge-contract.mjs`; omitted the root wrapper and plugin dispatch required by the task. |
| P2 Identify distribution impact for the memory registry checker, including installer, smoke, and checker. | Search `check-memory-knowledge-contract`, `targetMemoryKnowledgeChecker`, and `ae-memory-query` across installer, smoke, package, and tests. | 28 ms, 22 lines; found installer, root checker, install smoke, package check, and tests. | `codegraph explore --path . --max-files 8 <task>` | 458 ms | Returned contract and installer source, but omitted the root checker and install-smoke source required by the task. |
| P3 Explain file/edge limits and the no-write store contract of graph build/query, including its test. | Search `graphLimit`, `edge-limit`, `limits`, and `written: false` in CLI and tests. | 24 ms, 8 lines; found implementation and capped-graph test. | `codegraph explore --path . --max-files 8 <task>` | 411 ms | Correctly returned `graphBuild`, `graphQuery`, `graphLimit`, and `store.written: false`, but omitted the test and incorrectly reported no covering tests. |

The timings cover command execution only. They exclude the 2,778 ms initialization and the 2.69 MB local index. This repository is small enough that the tested `rg` flows were materially faster and more complete for all three tasks.

## Decision

Decision: reject CodeGraph as an optional adapter for the current AE distribution.

The pilot establishes that v1.5.0 can index this Windows repository locally with the stated controls, but it does not establish a net retrieval benefit. The tested `explore` workflow added setup/storage cost, was slower than direct local discovery, omitted required files in all three tasks, and produced a false test-coverage warning. CodeGraph remains outside normal installation, memory, graph, MCP, and background-service behavior.

## Cleanup

`codegraph uninit --force .` completed in 339 ms. `.codegraph/` no longer exists, no CodeGraph process remains, and the checked Codex home configuration hashes are unchanged. The downloaded release remains only in the named external temporary directory `D:\codes\.codegraph-pilot-20260804`; it is not an installed dependency and was not added to PATH. The terminal safety policy rejected recursive deletion of that external directory, so its removal is outside the completed project-local cleanup proof.
