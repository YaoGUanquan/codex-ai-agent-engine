<!-- ae-codex:memory -->
# AGENTS.md-aware Init

## Stable Decisions

- `ae-init` profiles are `minimal`, default `ae-core`, and compatibility `full`.
- AGENTS.md is treated as client-neutral Markdown with no required fields. Codex-specific override and merge ordering must be labeled as Codex behavior rather than a universal format rule.
- Nested instruction discovery is advisory and bounded: depth 3, at most 50 results, hidden/vendor/build trees excluded, and symbolic links not followed. It never authorizes nested file creation.
- Generated files use exactly one AE-managed start/end region. Regeneration replaces only that region. Legacy marker-only files are preserved as conflicts because user-owned drift cannot be distinguished safely.
- Repository package scripts may be rendered as guidance only after newline/tab normalization; missing commands are never invented.

## Compatibility And Validation

Projects requiring the former complete default scaffold must select `--profile full`. Focused init tests plus contract, smoke, release-note, and whitespace checks prove the local CLI and distribution contract. Two Windows symlink fixtures can remain environment-limited by `EPERM`; they are unrelated to init behavior.

Delivery evidence: `docs/ae/experience/2026-09-01-agents-md-aware-init.md`.
