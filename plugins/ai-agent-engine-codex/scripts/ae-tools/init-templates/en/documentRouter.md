# {{title}}

Bounded entry: {{pages}} immutable pages. [First page]({{firstPage}}) / [Last page]({{lastPage}}).

- Search: `ae-docs-search --path "{{path}}" --query "<text>" --limit 5`; continue with the returned path/page/line.
- Current memory: `ae-memory-search --query "<text>" --limit 5`. Preserved index history does not establish current authority.
- Original: concatenate the first {{originalPages}} pages in numeric order, {{originalBytes}} bytes, SHA-256 `{{sha256}}`. Verify with `ae-docs-maintain --path "{{path}}" --verify`.
- Do not append to this entry or edit existing pages. Topics/history/logs use `ae-docs-append --path "{{path}}" --entry "<record.md>"`, preview then apply with both hashes; navigation indexes cannot accept appends.
- After updates: `ae-docs-maintain --check`. Add external `--docs-root` only after resolving project/context. Pagination preserves bytes, not semantic currency.
- Ordinary relative file links retain their base. Cross-page anchors and reference definitions are not rewritten. Do not load all pages into context.
