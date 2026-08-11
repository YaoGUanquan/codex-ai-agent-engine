<!-- ae-codex:init managed -->
# Encoding Rules

## Required Encoding

- Use UTF-8 for Markdown, JSON, YAML, SQL, scripts, and generated text files.
- Prefer UTF-8 without BOM unless a target tool requires BOM.
- Keep Chinese content in files only after verifying the underlying bytes are UTF-8.

## Windows and PowerShell Notes

- PowerShell console rendering can make valid UTF-8 Chinese text look garbled.
- For verification, use explicit UTF-8 reads, for example:

```powershell
$OutputEncoding = [System.Text.UTF8Encoding]::new()
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new()
Get-Content -Path .\AGENTS.md -Encoding utf8 -Raw
```

- Do not trust a garbled terminal preview alone. Check file bytes, Git diff, or explicit UTF-8 output before editing.
