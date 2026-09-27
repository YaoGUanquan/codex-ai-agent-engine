<!-- ae-codex:init managed -->
# AI Memory Index

Routing only: at most 4096 UTF-8 bytes and 80 lines. Never append dated updates, completion logs, SQL, or experience details.

## Navigation

- `01-project-context.md`: project purpose, stack, paths, and local constraints.
- `02-architecture-boundaries.md`: module and responsibility boundaries.
- `03-key-workflows.md`: recurring workflows.
- `04-known-pitfalls.md`: known pitfalls and encoding issues.
- `05-decision-log.md`: durable decisions.
- `06-agent-maintenance-rules.md`: rules for reading and updating memory.
- `99-prompt-template.md`: reusable prompt for initializing or maintaining memory.

## Retrieval

- Check size before loading the index. Resolve the runtime entry, then use `ae-memory-index` to audit it.
- Locate relevant lines with `ae-memory-search --query "<text>" --limit 5`; narrow with `--path <memory-relative-file>`. Read only necessary matches.
- `--history` searches old index fragments only, not current contracts. `scan.complete=false` is not proof of absence.
- When `00-registry.json` exists, use `ae-memory-query` for declared topics/relations instead of loading all JSON.
- Resolve the current project/branch before passing an external `--docs-root`; never mix branches.

## Updates

Update the owning topic only when requested. Keep each topic within 15KiB; distill or split first. Group new navigation by domain, not task. Run `ae-memory-index --check` after updates. Preview old-index compaction with `--compact`; authorized writes also require `--apply --expect-sha256 <preview-hash>`. No new stable knowledge means no write.
