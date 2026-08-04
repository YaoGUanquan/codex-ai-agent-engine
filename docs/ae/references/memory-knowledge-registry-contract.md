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
