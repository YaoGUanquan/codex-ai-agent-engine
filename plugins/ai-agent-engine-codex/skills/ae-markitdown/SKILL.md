---
name: ae-markitdown
description: Use when the user asks to convert, read, extract, or normalize a local file as Markdown, especially HTML, CSV, TSV, JSON, YAML, XML, text, or Markdown files. Lightweight local-only conversion; no remote URLs or binary document parsing.
---

# AE Markitdown

Convert local workspace files into Markdown for review, planning, archival, or LLM input.

## Workflow

1. Confirm the source is a local file inside the current workspace. Do not fetch remote URLs.
2. For supported lightweight formats, run:

```powershell
node scripts/ae-tools.mjs markitdown <file> [--format html|csv|tsv|json|yaml|xml|text|markdown]
```

3. Use the returned `markdown` field as the normalized content. Preserve the `file`, `format`, and `fileSize` metadata when citing conversion evidence.
4. If the file is DOCX, XLSX, PDF, image, audio, video, archive, or larger than 10 MB, route to the platform document/PDF/spreadsheet tooling instead of this skill.

## Boundaries

- Local files only; paths must stay inside the workspace.
- Supported lightweight formats: HTML, CSV, TSV, JSON, YAML/YML, XML, TXT, MD.
- No OCR, binary document extraction, media transcription, or remote URL fetching.
- The converter is intentionally lightweight. For complex HTML tables or quoted CSV edge cases, state residual parsing risk.

