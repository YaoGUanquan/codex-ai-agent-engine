<!-- ae-codex:init managed -->
# AI Memory Maintenance Rules

## Read Rules

- Check `00-index.md` size first: at most 4096 UTF-8 bytes and 80 lines. Audit oversized indexes with `ae-memory-index`, without loading the whole text.
- Use `ae-memory-search --query "<text>" --limit 5` for paths, lines and short excerpts, then read necessary matches; never load all of 03/04/05 by default.
- Narrow with `--path`; `--history` searches old index pages only. Truncation or `scan.complete=false` is not a complete search or proof of absence.
- Keep `ae-memory-query` for declared topics/relations; text search is a separate contract.
- Resolve the project and branch before explicitly passing external `--docs-root`; do not merge local and external memories automatically.

## Update Rules

- Write only stable, long-lived, reusable knowledge.
- Prefer updating existing topic files over creating new ones.
- Do not write one-off logs, raw command output, or unverified guesses.
- Keep only a few domain routes and retrieval instructions in `00-index.md`. No dated logs, release status, SQL, task summaries or experience bodies. Group navigation instead of truncating history.

## Task Close Rule

- At task close, assess durable knowledge; write memory only when the user requested it.
- When authorized, update the smallest owning topic and mention it in the final response.
- If no, state that no AI memory update was needed.

## Size And Distillation Budget

- Run `ae-memory-index --check` after memory updates: nonzero on an index over 4096 bytes/80 lines or a topic over 15360 bytes.
- Distill or split a topic before it exceeds 15KiB. Keep stable rules in topics, historical evidence in experience/archive, connected by pointers.
- Preview old-index compaction with `ae-memory-index --compact`; authorized writes require `--apply --expect-sha256 <preview-hash>`. Verify adjacent bounded pages before replacing the router; ordered concatenation plus the source hash enables recovery. No automatic page deletion or topic rewriting.
- Pages are historical fragments, not independently reauthored Markdown. Review cross-page anchors and reference definitions manually; migration does not establish current semantic validity.
- Rotate `05-decision-log.md` yearly: start a new file or archive last year's entries under `docs/99-archive/`, updating `00-index.md` and `00-registry.json`.
- Review `00-registry.json` `reviewStatus` quarterly: confirm entries that are still valid, and distill then archive stale topics.
- Move topic files for retired features into the archive instead of keeping them in the memory root.

## Document Lifecycle

- Use `ae-docs-maintain --check` for memory, development history, indexes and rolling issue/remediation logs. Preview `--path <docs-relative-file> --compact`, then authorized apply with `--expect-sha256 <hash>`.
- Managed sources stay short; `ae-docs-append --path <file> --entry <record.md>` automatically adds bounded pages. Apply requires both source and entry hashes. Never edit immutable pages or append to managed routers.
- Use `ae-docs-search --path <file> --query "<text>"`; continue with the returned path/page/line. Existing memory search follows managed topics; legacy `--history` remains old-index-only.
- Pagination preserves original bytes and link bases, not cross-page anchors or semantic currency. Formal documents, SQL, test data, JSON registries and JSONL chains are not automatically rewritten.
