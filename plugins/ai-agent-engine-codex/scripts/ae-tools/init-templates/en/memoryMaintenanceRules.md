<!-- ae-codex:init managed -->
# AI Memory Maintenance Rules

## Read Rules

- Read `00-index.md` first.
- Then read only topic files related to the current task.
- Avoid full memory scans unless the task is broad or ambiguous.

## Update Rules

- Write only stable, long-lived, reusable knowledge.
- Prefer updating existing topic files over creating new ones.
- Do not write one-off logs, raw command output, or unverified guesses.

## Task Close Rule

- At task close, decide whether new durable knowledge was created.
- If yes, update the smallest relevant memory file and mention it in the final response.
- If no, state that no AI memory update was needed.
