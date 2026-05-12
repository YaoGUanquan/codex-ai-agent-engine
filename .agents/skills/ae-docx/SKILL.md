---
name: ae-docx
description: Use when the user asks for AE docx, /ae-docx, Word document automation, report generation, `.docx` editing, or wants to use OfficeCLI for document creation, inspection, and validation.
---

# AE DOCX

Use OfficeCLI-oriented workflows for `.docx` creation, editing, inspection, validation, and profile-based document work.

## Workflow

1. Read `references/docx-workflow.md`.
2. Confirm the target file, desired output, and whether the task is create, inspect, update, or validate.
3. If the task is academic-paper-like, read `references/academic-paper-profile.md`.
4. Use OfficeCLI help and `--json` output where applicable instead of guessing document properties or internal XML structure.
5. Prefer a create-or-change step followed by a read, render, or validate step.
6. Report the commands used, changed document surface, and any remaining manual review areas.

## Rules

- Do not assume Word-specific properties without checking OfficeCLI help first.
- Treat render or validate output as the proof path when the CLI supports it.
- Keep academic-paper guidance as a profile, not a separate top-level workflow in phase one.
