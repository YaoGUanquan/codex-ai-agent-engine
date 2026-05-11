# Scope Detection

For code review, choose exactly one scope:

- `from:<ref>`: diff against a base ref.
- `recent:<N>`: inspect recent commits.
- `full`: scan the repository.
- `full:<path>`: scan one path.
- `session`: review files changed in the current conversation.
- default: use git status/diff if the repo has Git; otherwise use full scan.

Always exclude secrets and generated output:

- `.env`, `.env.*` except examples/templates.
- `.git`, `node_modules`, `dist`, `build`, `coverage`, caches.
- `docs/ae/reviews` and `docs/ae/gates` unless explicitly requested.

For document review, use the document path supplied by the user. If absent, search recent `docs/ae/brainstorms` and `docs/ae/plans` and ask before choosing in interactive mode.
