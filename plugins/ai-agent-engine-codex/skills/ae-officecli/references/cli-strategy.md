# CLI Strategy

Use OfficeCLI with this preference order:

1. Discover commands with `--help`.
2. Prefer `--json` when the command supports it.
3. Use format-specific workflows rather than a one-size-fits-all command plan.
4. Use render or view steps to verify output instead of assuming the file is correct.
5. Keep OfficeCLI execution scoped to the requested file and path.

When routing:

- Use `ae-docx` for Word-style document work.
- Use `ae-xlsx` for spreadsheet work.
- Use `ae-pptx` for presentation work.
