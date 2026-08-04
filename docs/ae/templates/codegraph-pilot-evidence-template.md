# CodeGraph Pilot Evidence

## Authorization

- User-approved repository:
- User-approved representative tasks:
- Permission to create an approved project-local `.codegraph/` directory:
- Permission to acquire the exact binary/package:
- Explicit prohibitions confirmed: no `codegraph install`, no MCP registration, no user-home configuration writes.

## Pre-Index Verification

- Date and operating-system context:
- Repository commit and dirty-worktree status:
- CodeGraph version and current upstream ref:
- License evidence path:
- CLI/source evidence for the telemetry and update-control mechanism:
- CLI/source evidence for the project-local cleanup lifecycle:
- Preflight result: pass | failed | blocked.

## Baseline Tasks

| Task ID | Exact task wording | Baseline command/read flow | Correctness oracle | Baseline duration | Baseline result |
| --- | --- | --- | --- | --- | --- |
| P1 |  | `rg` and focused file reads | source/tests/manual inspection |  |  |
| P2 |  | `rg` and focused file reads | source/tests/manual inspection |  |  |
| P3 |  | `rg` and focused file reads | source/tests/manual inspection |  |  |

## CodeGraph Tasks

| Task ID | Exact command or interaction | Index time/size | Duration | Correctness result | False or omitted relations |
| --- | --- | --- | --- | --- | --- |
| P1 |  |  |  |  |  |
| P2 |  |  |  |  |  |
| P3 |  |  |  |  |  |

## Boundary Checks

- Before/after approved-repository filesystem comparison:
- Before/after user-home Codex configuration comparison:
- Telemetry/update control observation:
- Source upload/network observation, if applicable:
- Any write outside the authorized directory:

## Cleanup

- Verified cleanup command or operation:
- Remaining project-local derived files:
- Global configuration unchanged: yes | no.
- Cleanup result: pass | failed | blocked.

## Decision

- Measured net benefit versus baseline:
- Reproducibility limitations:
- Decision: reject | retain as optional pilot | propose separate optional-adapter PRD.
- Evidence boundary: this result applies only to the named version, repository, commit, operating system, and tasks.
