<!-- ae-codex:init managed -->
# Archive Rules

## Archive Triggers

- The active process note status is `done`.
- Relevant validation has run or the remaining risk is explicitly documented.
- Any durable memory updates have been checked against `docs/08-ai-memory/00-index.md`.

## Archive Locations

- Process archive: `docs/00-process/archive/YYYY-MM/<task-name>/`
- Topic archive: `docs/99-archive/YYYY-MM/<topic-or-ticket>/`
- AE compatibility archive: `docs/ae/archive/` may point to the process archive when AE artifacts are involved.

## Archive Contents

- Active process note or plan.
- Related analysis, design, API, SQL, report, test data, and validation records.
- A short summary of key commands, SQL, and user-provided outputs when relevant.

## After Archive

- Update the active note with the archive path before moving it, or leave a small index if the project wants one.
- Update `docs/08-ai-memory` only with stable reusable knowledge, not raw task logs.
