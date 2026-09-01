<!-- ae-codex:experience -->
# AGENTS.md-aware Init Delivery

## Outcome

Version `0.3.39` makes `ae-init` a conservative AGENTS.md-aware initializer. It adds explicit scaffold profiles, repository-derived commands, bounded instruction diagnostics, and managed-region regeneration without adding dependencies or writing nested instruction files automatically.

## Durable Decisions

- `ae-core` is the default profile; `minimal` creates only `AGENTS.md`; `full` preserves the former complete directory set as an explicit compatibility route.
- Generic AGENTS.md format claims remain separate from Codex-specific `AGENTS.override.md` precedence and root-to-working-directory merge behavior.
- `--nested preview` and `--explain-instructions` are read-only diagnostics. Discovery is capped at depth 3 and 50 results, excludes hidden/vendor/build trees, and does not follow symbolic links.
- Generated files contain one bounded AE-managed start/end region. `--force` replaces only that region and preserves surrounding content; legacy marker-only files are returned in `conflicted_files` and left unchanged.
- Package scripts are rendered as actual runner commands and normalized to one Markdown line so script text cannot inject generated document structure.

## Evidence

- Requirements: `docs/ae/prds/2026-09-01-agents-md-aware-init-prd.md`
- Plan: `docs/ae/plans/2026-09-01-001-agents-md-aware-init-plan.md`
- Implementation: `plugins/ai-agent-engine-codex/scripts/ae-tools/init.mjs`
- Regression tests: `tests/ae-tools.test.mjs`
- Source tracking: `docs/ae/references/external-skill-watchlist.json`
- Current-user global install operation: `62805a3a-f18d-4de9-a4b9-22ba2353c50c`; Codex runtime, personal plugin, and Cursor skill copies reported `0.3.39`, with the Cursor `ae-init` copy matching the plugin source hash.

## Validation Boundary

Four focused init tests, `npm run check`, `npm run check:smoke`, the release-note check, external watch check, and `git diff --check` passed. The full suite ran 167 tests with 165 passing; two unrelated symlink fixtures returned Windows `EPERM` before product assertions. Local checks do not prove universal precedence across every AGENTS.md client or Cursor runtime discovery in an already-open chat.
