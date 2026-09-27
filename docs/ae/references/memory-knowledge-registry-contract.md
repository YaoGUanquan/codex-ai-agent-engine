# Memory Knowledge Registry Contract

## Purpose

`docs/08-ai-memory/00-registry.json` is curated metadata for canonical Markdown memory. It is not a second memory store, a generated index, or a source graph. Query and map output is ephemeral and read-only.

## Schema Version 1

The top-level object contains `schemaVersion: 1`, a `documents` array, and a `relations` array.

Each document has these fields:

- `id`: unique lowercase stable identifier.
- `path`: canonical Markdown path below `docs/08-ai-memory/`.
- `kind`: `memory` or `maintenance`.
- `role`: short description of the document's durable purpose.
- `topics`: non-empty, unique topic strings.
- `reviewStatus`: `current`, `reviewed`, or `historical`.

Each relation has these fields:

- `from`: an existing document `id`.
- `to`: a regular Markdown file below `docs/ae/` or the repository `AGENTS.md`.
- `type`: `governs`, `documents`, `implements`, `records`, `references`, `supports`, or `supersedes`.
- `evidence`: an object with a source `path` and a non-empty `note` describing the inspected evidence.

Relations are directional: `from` is the canonical memory record and `to` is the supported AE artifact or governance file. Consumers must not infer an inverse relation type; `ae-knowledge-query --direction both` merely includes the declared edge when either endpoint matches.

## Path And Read Safety

- All paths use repository-relative POSIX separators and may not contain an absolute path, `..`, a hidden segment, or a secret-like filename.
- Document targets must stay below `docs/08-ai-memory/`; relation targets must stay below `docs/ae/` or equal `AGENTS.md`.
- Evidence paths must be the source document, relation target, another canonical memory document, an allowed AE artifact, or `AGENTS.md`.
- Before the validator or a query reads a registry, target, or evidence file, it checks every path component below the worktree with `lstat`, rejects links/reparse points and non-regular targets, then verifies realpath containment.
- The registry and source excerpt byte limits are enforced before parsing or returning text. No command writes a cache, graph, database, temporary file, or registry update.

## Command Contract

- `ae-memory-query` requires one or more of `--topic`, `--path`, and `--relation`; supplied filters use AND semantics.
- `ae-knowledge-map` applies its record limit to declared edges and returns only the selected edges plus their endpoint nodes.
- `ae-knowledge-query` requires `--path`, accepts `--relation`, and accepts `--direction incoming|outgoing|both` with `both` as the default.

For a valid registry, commands return JSON with `status: "ok"`. A valid query with no declared match returns an empty result list and exactly the diagnostic `no declared match`. Invalid options, malformed registry data, unsafe paths, or unreadable targets return a JSON envelope with `status: "invalid"`, diagnostics, and a non-zero process exit status.

## Freshness And Limits

Results identify the registry schema version and filesystem metadata observed during the command. This proves only that the named local files were read during that invocation; it does not prove semantic completeness, symbol resolution, or absence of an undeclared relationship. Results use deterministic path/id ordering and include the selected record limit plus a truncation flag.

## Bounded Navigation

The separate `ae-memory-index` and `ae-memory-search` commands do not change this
schema or the declared-only query contract. The index command audits a 4096-byte,
80-line router and 15KiB topics, with `--check` for a nonzero budget gate.
`--compact` previews byte-preserving adjacent history pages; applying requires
`--apply --expect-sha256 <preview-hash>`. No automatic semantic distillation occurs.

Text search returns at most five 240-character snippets by default, with path
and line evidence. It scans top-level memory Markdown and follows managed topic
pages, or a named `--path`,
up to 128 files/8MiB with a 512KiB per-file cap. Old-index pages require
`--history`. An incomplete scan explicitly reports truncation; it is not proof
of absence. These two commands accept an explicit `--docs-root` after the caller
has verified the external project/branch context; they never merge roots.

The distributable read/write and recovery rules live in
`plugins/ai-agent-engine-codex/skills/ae-save-experience/references/memory-navigation.md`.

`ae-docs-maintain`, `ae-docs-append` and `ae-docs-search` extend this bounded
lifecycle to development history, nested memory topics and rolling logs.
They do not rewrite registry declarations or formal/archived evidence.
Paged sources keep their original paths; a registry excerpt can therefore be a
router, followed via the separate text-search command. Original recovery is
SHA-256 verified; appended-page verification reports presence/size separately.
The `ae-doc-pages:v1` router templates are a serialized format, not freely
editable display copy; changing it requires a versioned reader/migration.

External batch maintenance requires a fresh `--report` path before any rewrite.
It reserves an in-progress JSON report and an adjacent `.journal.jsonl`, syncing
each apply intent, result and verification before continuing. The final report
replaces the initial summary atomically. On reporting failure, `applied`,
`pending` and `reporting` remain in the non-success response; reconcile them
with the journal and original page hashes before retrying. This is per-file
recovery evidence, not a multi-file rollback transaction or a Git backup.
