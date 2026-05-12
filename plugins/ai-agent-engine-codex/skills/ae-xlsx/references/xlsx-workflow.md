# XLSX Workflow

Use this flow for `.xlsx` work:

1. Detect whether the workbook already exists.
2. Inspect sheets, ranges, or metadata before editing when the structure is unknown.
3. Decide whether the task is data entry, formula update, query, validation, or generation.
4. Use OfficeCLI help to discover workbook and range command shapes.
5. Validate the result with structured queries before claiming success.

Common task classes:

- workbook generation
- formula maintenance
- spreadsheet inspection
- structured data import or export
