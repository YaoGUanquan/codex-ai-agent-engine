# Scope Detection

For code review, choose exactly one scope:

- `from:<ref>`: diff against a base ref.
- `recent:<N>`: inspect recent commits.
- `full`: scan the repository.
- `full:<path>`: scan one path.
- `session`: review files changed in the current conversation.
- default: use git status/diff if the repo has Git; otherwise use full scan.

Scope precedence and locking:

- An explicit user target (named file, path, function, behavior, or change boundary) overrides the default Git-status scope. Treat the named target set and stated constraints as a hard boundary.
- Do not turn a named-file review into a repository or branch review. Inspect adjacent files only for the minimum direct caller/callee path needed to verify the requested behavior, and keep those files read-only context.
- If the request is one behavior or at most 3 named files without a public API, persisted-data, security, or dependency boundary, classify it as S1 small and use the light review path. Do not add architecture, complexity, claim-integrity, cross-artifact, or speculative test-design work without an explicit trigger.
- Once the requested behavior has a supported verdict, stop. A related idea, checklist item, or possible future improvement is not permission to widen scope.

Always exclude secrets and generated output:

- `.env`, `.env.*` except examples/templates.
- `.git`, `node_modules`, `dist`, `build`, `coverage`, caches.
- `docs/ae/reviews` and `docs/ae/gates` unless explicitly requested.

For document review, use the document path supplied by the user. If absent, search recent `docs/ae/prds`, `docs/ae/brainstorms`, and `docs/ae/plans` and ask before choosing in interactive mode.
