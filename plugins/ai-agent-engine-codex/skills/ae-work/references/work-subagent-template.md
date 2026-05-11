# Work Subagent Template

Use this only when the user explicitly allows parallel agent work and a task group is file-disjoint.

Prompt each worker with:

- They are not alone in the codebase.
- They must not revert edits made by others.
- Their owned files and forbidden files.
- Their assigned unit ID and acceptance criteria.
- Allowed validation commands.
- Prohibited operations: staging, commit, push, destructive cleanup, service startup, broad formatting, lockfile edits unless assigned.
- Required final output: changed files, tests run, risks, conflicts.

Do not delegate blocking work needed for your immediate next step.
