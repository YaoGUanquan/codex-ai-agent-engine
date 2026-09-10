<!-- ae-codex:init managed -->
# AGENTS.md

## Project Profile

- Project: {{name}}
{{descriptionLine}}- Detected signals:
{{indicators}}
- Important paths:
{{importantPaths}}

## Project Commands

{{scripts}}

## Project Rules

- Read existing documentation before changing behavior.
- Keep changes scoped to the requested task.
- Prefer the project's existing patterns over new abstractions.
- Do not overwrite user work or revert unrelated changes.
{{aeWorkflowRules}}

## Engineering Execution

{{engineeringRules}}

## Encoding Rules

- Read and write text files as UTF-8, preferably UTF-8 without BOM.
- When Chinese text appears garbled in PowerShell or terminal output, verify with explicit UTF-8 reads before changing content.
- Do not rewrite a file only to fix console display unless the underlying bytes are confirmed wrong.

## Validation

{{validationRules}}
