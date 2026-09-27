# Bounded Document Lifecycle

Apply when writing project memory, development history, navigation indexes or
rolling issue/remediation logs. Resolve the project/branch docs root first.
Do not replace a missing external context with repository-local copies.

## Categories

- Navigation (`00-index.md`, `index.md`): at most 4096 UTF-8 bytes / 80 lines.
  Keep domain routes and retrieval commands, not one link or paragraph per task.
- Memory topics, `01-history/**/*.md`, `03-analysis/*-issue-log.md` and
  `05-reports/*-tracker.md`: at most 15360 bytes before consolidation/pagination.
- New history: one dated, concise event with evidence pointers. Put detailed
  reports in separate task artifacts. Start a new period when useful;
  do not construct an unbounded month/year list in the root index.
- Formal designs/plans/API contracts, SQL, fixtures, structured registries,
  JSONL evidence chains and archived records are not automatically rewritten.
  Use their format-specific readers and preserve immutable execution evidence.
- Pagination preserves content, not semantic currency. Curated memory must
  still distinguish current rules from superseded decisions. Do not duplicate
  task logs into workflow, pitfall and decision topics.

## Existing Documents

Resolve `aeEntry` through the [runtime entry contract](../../ae-help/references/runtime-entry.md). Audit first:

```text
node "$aeEntry" ae-docs-maintain --docs-root "<resolved-docs-root>"
node "$aeEntry" ae-docs-maintain --docs-root "<resolved-docs-root>" --path "01-history/history.md" --compact
```

Only after write authorization, repeat the second command with
`--apply --expect-sha256 <source-hash>`. The source becomes a fixed-size router;
immutable pages remain beside it to preserve ordinary relative link bases.
Use `--verify --path <source>` to verify original-byte recovery. No source
content is deleted, and an already managed entry is not snapshotted again.
Cross-page anchors, reference definitions and incoming original anchors are
not rewritten; resolve them through bounded search or recover the original.

## Subsequent Writes

For a managed topic/history/log, place a concise record (at most 15KiB) in its
own authorized docs artifact, then preview:

```text
node "$aeEntry" ae-docs-append --docs-root "<resolved-docs-root>" --path "01-history/history.md" --entry "ae/experience/YYYY-MM-DD-topic.md"
```

Apply with `--apply --expect-sha256 <source-hash>
--expect-entry-sha256 <entry-hash>` from that preview. This automatically creates
immutable bounded pages and updates only fixed-size routing metadata. It can
also convert an existing unpaged history/topic on first append. It refuses
navigation indexes, stale hashes, modified routers, locks and conflicting pages.
Generic and legacy index compaction share the same document writer lock;
legacy compaction also retains its original lock guard.
Retries with old hashes fail; inspect prior results instead of blindly resubmitting.
An entry is paged verbatim: relative links must already use the destination
document's directory as their base, not the staging artifact's directory.

Never append free text to a managed router or edit immutable pages. For semantic
corrections, write a bounded explicit superseding record or curate a separate
current topic with provenance. After any relevant document update run
`ae-docs-maintain --check` against the resolved root; memory updates also run
`ae-memory-index --check`. Nonzero means unfinished maintenance.

## Retrieval And Limits

Use `ae-docs-search --path <docs-relative-source> --query "<literal>" --limit 5`.
Managed source pages are followed automatically. `resume.path/page/line`
continues a bounded scan without repeating earlier matches; a single-document
resume does not establish completeness for other documents. Existing
`ae-memory-search` also follows managed topics. Its `--history` scope includes
both generic paged `00-index.md` and legacy index-history pages, not the text
of an unpaged navigation index. Use the returned memory-relative path with
`--history --path <path> --page <page> --line <line>` to continue.

Default limits: 5 results, 240 code-point excerpts, 128 file reads, 8MiB total,
512KiB per unpaged file and 15KiB per managed page. Each router read counts.
When a read budget stops the scan before the requested starting page or line,
the cursor retains that position; it must not restart at the first line.
Large protected documents require a purpose-specific bounded reader rather
than loading the complete file into model context. Registry queries retain
their declared-only semantics. Check `scan.complete`; truncated is not absent.

Inventories stop at 50000 entries / depth 24; memory's legacy top-level listing
stops at 4096 entries. Directory entries are consumed incrementally, including
the budget check, rather than materializing an entire directory first.
An exhausted inventory is an explicit error; a scoped `--path` search bypasses
the broad inventory. Compaction accepts at most 8MiB of valid UTF-8 and rejects
a line larger than 15KiB. Managed documents allow at most 999999 pages;
create a new period/domain before these limits.

This is automatic pagination through the writer and an explicit validation
gate, not a filesystem watcher, scheduled job or guarantee against arbitrary
manual writes. History storage still grows; no automatic deletion is authorized.
