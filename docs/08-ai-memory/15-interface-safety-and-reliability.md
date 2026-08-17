<!-- ae-codex:memory -->
# Interface Safety And Reliability

## Durable Boundaries

- Project installation must preserve user-owned components by default. Replacing a modified component requires explicit intent, a verified backup, and a recovery path; a successful fresh-install smoke test does not prove this property.
- A command described as local static preview must canonicalize the selected root and stay loopback-bound by default. A syntactically in-worktree symlink or junction can otherwise expose files outside the worktree.
- Evidence ledgers are integrity records, not ordinary append-only logs. Concurrent writers require serialization and atomic replacement so a hash chain cannot lose events or become partially written.
- Structured-data conversion must parse quoted delimiters and escaped quotes before producing review-facing Markdown. Naive delimiter splitting silently changes tabular meaning.
- CLI enum and option validation is part of the public contract: unknown values must fail rather than returning a plausible success response with fallback behavior.

## Related Artifact

- `docs/ae/solutions/2026-08-17-interface-optimization-roadmap.md` records observed findings, evidence limits, implementation units, validation, and rollback signals.
