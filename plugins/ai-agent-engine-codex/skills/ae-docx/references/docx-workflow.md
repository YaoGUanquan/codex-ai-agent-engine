# DOCX Workflow

Use this flow for `.docx` work:

1. Detect whether the file already exists.
2. Decide whether the task is create, inspect, update, query, or validate.
3. Use OfficeCLI help to discover command shape.
4. Prefer structured output and explicit target paths.
5. Validate the result through query, render, or inspect steps before claiming success.

Common task classes:

- report or memo generation
- form-like content updates
- structured document inspection
- validation or review of generated output
