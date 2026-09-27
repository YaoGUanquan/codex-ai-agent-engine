# Bounded Project Memory

Markdown is canonical. `00-index.md` is a router, not a changelog: at most
4096 UTF-8 bytes and 80 lines. Each topic or historical page is at most 15KiB.
Daily delivery state, command logs, SQL and experience bodies belong to their
own artifacts. Update memory only when requested.

## Read

Resolve the current project/branch docs root before reading external docs.
Resolve `aeEntry` with [the runtime entry contract](../../ae-help/references/runtime-entry.md).
Run `node "$aeEntry" ae-memory-index` for an audit. Do not load an oversized
entrypoint or the whole registry into context.

Use `node "$aeEntry" ae-memory-search --query "<literal text>" --limit 5`.
Narrow with `--path <file-relative-to-08-ai-memory>`, then read only the necessary
matching lines. This searches top-level memory Markdown and managed topic pages; a nested file requires
an explicit path. Default limits are five results, 240 code-point excerpts,
128 files and 8MiB read, with a 512KiB per-file ceiling.

`--history` searches only immutable old-index pages. Historical matches require
current-code/decision verification. `scan.complete=false` or truncation means
the search is incomplete, not that other matches do not exist.

All new memory commands accept `--docs-root <absolute-resolved-docs-root>`.
This is an explicit data location, not automatic project/branch verification.
Never guess it, mix branches, or treat it as permission to write. A missing root
or bad path is an error, not a reason to retry against another installation.

The existing `ae-memory-query` and knowledge commands still use the curated
registry; their declared-only semantics are unchanged. Text search neither
validates nor silently bypasses a broken registry.

## Write And Verify

Update the owning topic. Consolidate domain routes rather than adding a root
entry per task. Run `node "$aeEntry" ae-memory-index --check` after every update;
it exits nonzero when the router or a top-level topic exceeds its budget.
Nested topic files require separate budget checks. This command is a gate,
not a filesystem hook that can prevent arbitrary manual writes.

For a legacy entry, `node "$aeEntry" ae-memory-index --compact` only previews
the replacement, source SHA-256 and immutable page list. After confirming scope
and write authorization, add `--apply --expect-sha256 <preview-hash>`.
The command verifies all page bytes before replacing the index. It rejects
stale source hashes, unsafe paths, conflicting pages, an existing writer lock,
invalid UTF-8, source inputs above 1MiB and lines above a page budget.

Pages stay beside the index to preserve relative link bases. They retain
original bytes and ordering; they are fragments, not reauthored documents.
Cross-page anchors, reference definitions and incoming index anchors need
manual review. Concatenate pages in preview order and verify the original
SHA-256 before a separately authorized restoration. Never delete recovery
pages automatically. Following an interrupted apply, inspect leftover lock/temp
files and source/page hashes before manually recovering; do not blindly retry.

The old-index command does not distill other oversized topics, update semantic
validity, rebuild a registry, install globally, or prove model token/latency savings.
For topic/history/log pagination and subsequent controlled writes, follow the
[document lifecycle contract](document-lifecycle.md). Managed index history from
that command is queried via `ae-docs-search --path 08-ai-memory/00-index.md`;
the older `--history` option remains exclusive to legacy index-history pages.
