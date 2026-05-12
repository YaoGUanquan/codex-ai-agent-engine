---
name: ae-xlsx
description: Use when the user asks for AE xlsx, /ae-xlsx, Excel automation, `.xlsx` editing, workbook generation, formula updates, dashboards, or wants OfficeCLI-backed spreadsheet workflows.
---

# AE XLSX

Use OfficeCLI-oriented workflows for `.xlsx` creation, editing, querying, validation, and profile-based spreadsheet work.

## Workflow

1. Read `references/xlsx-workflow.md`.
2. Confirm the workbook path, target sheets, and whether the task is create, inspect, update, query, or validate.
3. If the task is finance-heavy, read `references/financial-model-profile.md`.
4. If the task is dashboard-like, read `references/data-dashboard-profile.md`.
5. Use OfficeCLI help and `--json` output where available instead of guessing sheet, range, or formula syntax.
6. Prefer a data or formula change followed by a query or validation step.
7. Report changed sheets, formulas, validations, and any remaining manual review areas.

## Rules

- Do not invent workbook structure when the file can be queried first.
- Treat formulas, pivots, charts, and validation as explicit proof surfaces, not assumed outcomes.
- Keep profile guidance under references instead of splitting into more top-level skills in phase one.
