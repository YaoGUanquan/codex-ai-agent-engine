---
type: review
status: active
date: 2026-08-17
topic: interface-optimization-roadmap
---

# Interface Optimization Roadmap

## Scope And Evidence Boundary

- Authorization class: user-owned source repository review.
- Target: `ai-agent-engine-codex` at Git commit `3c614ef2ff0c54b8c3b1deca70fccb568977e44f` on `main`.
- Allowed actions: static source, test, contract, graph, memory, and documentation inspection.
- Prohibited actions: no external target access, packet capture, credential use, binary execution, or production mutation.
- Tools observed: Node.js `v24.18.0`, Git, repository test and contract scripts.
- Proven checks: `npm.cmd test`, `npm.cmd run check`, and `npm.cmd run check:all` passed before this document was added.
- Repository-wide graph boundary: `ae-graph-build --root . --limit 500 --edge-limit 1000 --no-write` observed 1,263 eligible source/config/document files, returned the bounded first 500 nodes and 101 edges, and reported truncation. The deep interface review below focuses on first-party distribution scripts, command modules, and tests; `.analysis`, external samples, generated mirrors, and documentation are adjacent artifacts rather than product runtime surfaces.

The findings below are source-level observations. Passing checks prove the covered contracts and smoke paths only; they do not prove an existing consumer's files are preserved, an externally reachable server is safe, or concurrent CLI writers are serialized.

## Current Interface Map

| Surface | Entry | Core implementation | State boundary |
| --- | --- | --- | --- |
| Project installation | `scripts/install-project.mjs` | copy plugin, skills, wrappers, templates | target project filesystem |
| Global installation | `scripts/install-global.mjs` | `plugins/.../scripts/global-install.mjs` | user home, journal, backups |
| CLI commands | `scripts/ae-tools.mjs` | `plugins/.../scripts/ae-tools.mjs` and command modules | target worktree |
| Static preview | `static-server` | `ae-tools/static-server.mjs` | local HTTP listener and selected filesystem root |
| Evidence ledger | `evidence write/read` | `ae-tools/evidence.mjs` | `docs/ae/evidence/ledger.jsonl` |
| File conversion | `markitdown` | `ae-tools/markitdown.mjs` | caller-selected local file |
| Review contract | `review-contract` | `ae-tools/review.mjs` | JSON output and optional evidence artifact |

The global installer already has ownership checks, backups, journals, and rollback. The project installer predates those controls and is the largest consistency gap.

## Findings

### IO-01 [P1] Project installer replaces user content without ownership checks or recovery

- Classification: observed.
- Evidence: `scripts/install-project.mjs:51`, `:57`, `:62`, and `:82` recursively remove existing plugin or skill directories with `force: true`; replacement then continues through multiple writes. It only rejects an exact source-root target at `:42`, and does not create a backup, journal, confirmation token, or rollback path.
- Trigger: run the installer against a consumer containing a modified `plugins/ai-agent-engine-codex`, existing `ae-*` skills, or affected wrappers.
- Impact: modified consumer customizations can be irreversibly deleted. A later failure can leave plugin, skills, marketplace, wrappers, language metadata, and templates at different versions.
- Required optimization: make replacement ownership-aware and transactional. Permit exact known release copies to update; require an explicit modified-content retirement flag and preview-derived confirmation for unknown or changed copies. Back up every replaced component before mutation and recover on any post-backup failure.
- Acceptance: a modified target is rejected without changing bytes; an owned target updates atomically; an injected mid-install failure restores every prior component; `--target` without a value fails instead of defaulting to the current directory.
- Rollback: restore the per-install backup/journal, then verify stored component fingerprints.

### IO-02 [P1] Static preview can expose an unintended filesystem root or network listener

- Classification: observed.
- Evidence: `plugins/ai-agent-engine-codex/scripts/ae-tools/static-server.mjs:10` uses syntactic `safeResolve`, while `:14` accepts arbitrary `--host` and `:33` listens on it. `node scripts/ae-tools.mjs static-server . --host 0.0.0.0 --dry-run` reports a public-bind URL. `safeResolve` does not resolve or reject a selected directory that is a symlink/junction to outside the worktree.
- Trigger: use `--host 0.0.0.0` or select an in-worktree reparse point that targets another directory.
- Impact: a command described as a local preview can publish workspace or external files to the network. The current handler prevents request-path traversal below its selected root, but not an unsafe selected root or non-loopback binding.
- Required optimization: canonicalize and containment-check the selected target with `lstat`/`realpath`; default to loopback only; reject non-loopback hosts unless a separate explicit network-exposure flag is supplied and documented.
- Acceptance: symlink/junction escapes fail before `listen`; `127.0.0.1` and `::1` work; `0.0.0.0` requires explicit elevated intent; traversal and encoded-path probes remain 404.
- Rollback: retain the current loopback-only default and remove the new opt-in flag if the host policy conflicts with a supported use case.

### IO-03 [P2] Evidence ledger append is not safe for concurrent CLI writers

- Classification: observed.
- Evidence: `plugins/ai-agent-engine-codex/scripts/ae-tools/evidence.mjs:98-102` reads the entire JSONL ledger and overwrites it with the appended event. There is no lock, compare-and-swap, temporary-file rename, or retry.
- Trigger: two `evidence write` or `review-contract --write-evidence` processes overlap.
- Impact: one event can be lost, or a partial write can invalidate the hash chain. This defeats a ledger intended to provide later verification evidence.
- Required optimization: use an exclusive lock file with bounded retry, write the new ledger to a same-directory temporary file, fsync and rename it atomically, then verify the final chain before returning success.
- Acceptance: parallel writers preserve both ordered events; forced write interruption leaves either the prior valid ledger or a recoverable temporary record; chain validation identifies any intentional corruption.
- Rollback: keep the prior ledger byte-for-byte and delete only a verified temporary file.

### IO-04 [P2] CSV/TSV conversion does not preserve quoted field semantics

- Classification: observed.
- Evidence: `plugins/ai-agent-engine-codex/scripts/ae-tools/markitdown.mjs:66-68` splits each line directly on the delimiter. It cannot represent RFC 4180 quoted commas, escaped quotes, embedded line breaks, or delimiter-bearing headers.
- Trigger: convert a normal CSV such as `name,note` followed by `Ada,"one, two"`.
- Impact: generated Markdown shifts columns and can silently misrepresent structured data during review or documentation work.
- Required optimization: replace the split implementation with a bounded streaming state machine for CSV/TSV quoting rules, preserving the existing 5,000-row and output-shaping limits. Do not add a general parser dependency unless it provides a material capability beyond this narrow contract.
- Acceptance: quoted delimiter, escaped quote, CRLF, empty cell, and multiline-field fixtures render stable tables; malformed quote input fails with a line/column diagnostic.
- Rollback: retain the current output limits and fall back to fenced source text only for unsupported malformed input.

### IO-05 [P3] Contract commands accept invalid enums as successful output

- Classification: observed.
- Evidence: `plugins/ai-agent-engine-codex/scripts/ae-tools/review.mjs:219-223` reads `kind` and `mode`, but does not validate either before returning `status: "ok"`. Unknown values route through the document default and can produce a misleading contract.
- Trigger: a typo such as `review-contract --kind cod --mode report-onyl`.
- Impact: automation can treat a malformed review configuration as accepted and apply the wrong review lenses or gate wording.
- Required optimization: define and validate supported `kind`, `mode`, and target values in one contract table shared by help and tests; reject unknown options where the command surface is intentionally closed.
- Acceptance: each documented enum succeeds; every invalid enum and missing value fails with a stable diagnostic; help output and tests derive from the same allowed-value table.
- Rollback: no data migration; return to the prior permissive behavior only if a documented compatibility consumer is identified.

## Implementation Order

### U1 - Harden project installation

- Files: `scripts/install-project.mjs`, `scripts/check-install-smoke.mjs`, `tests/install-scripts.test.mjs`, `tests/global-install.test.mjs` only when a shared guard is extracted.
- Work: validate every argument; add `preview`/`apply` semantics or an equivalent explicit confirmation; fingerprint owned components; stage copies; back up then replace; restore on failure; protect reparse points and source/target overlap.
- Dependencies: none. This is the release blocker because it changes destructive behavior.
- Validation: focused install tests for owned replacement, modified rejection, missing `--target` value, injected failure recovery, and pre-existing marketplace/wrapper preservation; then `npm.cmd run check:all`.

### U2 - Constrain static preview exposure

- Files: `plugins/ai-agent-engine-codex/scripts/ae-tools/static-server.mjs`, `plugins/.../skills/ae-static-server/SKILL.md`, `.ae-source/skills/ae-static-server/SKILL.md`, `tests/ae-tools.test.mjs`, help catalog if its argument reference changes.
- Work: enforce canonical root containment and loopback host policy; add deliberate non-loopback opt-in only if product requirements require it.
- Dependencies: U1 is not technically required, but both change user-facing safety contracts and should ship together.
- Validation: focused server policy tests without binding external interfaces; source/mirror checks; browser acceptance only when a real target preview flow is in scope.

### U3 - Make evidence writes crash- and concurrency-safe

- Files: `plugins/ai-agent-engine-codex/scripts/ae-tools/evidence.mjs`, `tests/ae-tools.test.mjs`.
- Work: introduce lock, atomic replacement, recovery rules, and final chain verification with a bounded lock timeout.
- Dependencies: none.
- Validation: parallel subprocess writers, injected failure between temporary write and rename, ledger chain readback, `npm.cmd test`.

### U4 - Correct structured text conversion

- Files: `plugins/ai-agent-engine-codex/scripts/ae-tools/markitdown.mjs`, `tests/ae-tools.test.mjs`, `ae-markitdown` source/mirror guidance only if error behavior changes.
- Work: implement a bounded CSV state machine and diagnostics; retain plain TSV behavior where quoting is intentionally unsupported or document its semantics.
- Dependencies: none.
- Validation: RFC-style fixtures, malformed-input tests, maximum-row behavior, `npm.cmd test`.

### U5 - Close CLI contract validation gaps

- Files: `plugins/ai-agent-engine-codex/scripts/ae-tools/review.mjs`, `plugins/ai-agent-engine-codex/scripts/ae-tools/help.mjs` or capability catalog, `tests/ae-tools.test.mjs`.
- Work: centralize allowed values and reject unknown kinds, modes, targets, and closed-surface options.
- Dependencies: U1's argument-parsing policy should be established first.
- Validation: table-driven valid/invalid CLI cases, `npm.cmd run check`.

Any implementation touching `plugins/ai-agent-engine-codex/` is a distributable change: synchronize `.ae-source/skills`, increment both SemVer manifests, add release notes, and run the repository's release-note checks.

## Memory And Graph Decision

- Added a compact durable memory record for the installer, local-preview, evidence, and structured-conversion boundaries.
- Added one declared relation to this roadmap and a compact maintainer-graph section.
- No new graph database, code snapshot, external service, or continuous monitor is justified. Existing `ae-graph-*` and registry commands remain bounded, read-only helpers.

## Residual Risks And Verification Gaps

- No modified consumer target was mutated to reproduce IO-01; the conclusion is based on direct source paths and is deliberately non-destructive.
- No network listener was started; the dry-run only proves that the CLI accepts a non-loopback host, while source inspection proves that the same host reaches `server.listen`.
- No concurrent ledger writer was launched; IO-03 is a deterministic read-modify-write race inferred from the single-writer implementation.
- No browser, authenticated API, deployment, or production acceptance claim is made by this review.
