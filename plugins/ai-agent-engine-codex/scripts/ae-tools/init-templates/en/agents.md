<!-- ae-codex:init managed -->
# AGENTS.md

## Project Profile

- Project: {{name}}
{{descriptionLine}}- Detected signals:
{{indicators}}
- Important paths:
{{importantPaths}}

## Project Rules

- Read existing documentation before changing behavior.
- Keep changes scoped to the requested task.
- Prefer the project's existing patterns over new abstractions.
- Do not overwrite user work or revert unrelated changes.
- Record AE workflow artifacts under `docs/ae`.
- Record active process notes under `docs/00-process/active`.
- Archive completed process notes under `docs/00-process/archive/YYYY-MM/<task-name>` or `docs/99-archive/YYYY-MM/<topic>`.
- Record durable AI memory under `docs/08-ai-memory`.

## Encoding Rules

- Read and write text files as UTF-8, preferably UTF-8 without BOM.
- When Chinese text appears garbled in PowerShell or terminal output, verify with explicit UTF-8 reads before changing content.
- Do not rewrite a file only to fix console display unless the underlying bytes are confirmed wrong.

## Validation

- Run the narrowest relevant validation before delivery.
- If validation cannot be run, state the reason and remaining risk.
