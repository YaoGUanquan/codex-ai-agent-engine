<!-- ae-codex:init managed -->
# Prompt Template

Use this when asking an agent to maintain project memory:

```text
Resolve the current project/branch docs root. Check 00-index.md size; do not load it wholesale above 4096 UTF-8 bytes or 80 lines. Resolve the AE runtime entry, use ae-memory-search --query "<text>" --limit 5 and read only necessary matching excerpts. History requires --history; truncation is not proof of absence. Only update memory when requested, in the owning topic, never dated logs, SQL or summaries in the router. Keep topics within 15KiB, distill/split first, then run ae-memory-index --check. Do not record one-off logs or unconfirmed guesses.
```

Managed topics/history/logs use `ae-docs-append` with previewed source and entry hashes; never append to routers or existing pages. Use `ae-docs-search` with its page/line resume and run `ae-docs-maintain --check` after relevant writes, passing the same resolved external `--docs-root` when applicable.
