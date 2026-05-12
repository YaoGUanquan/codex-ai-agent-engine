---
name: ae-officecli
description: Use when the user asks for AE OfficeCLI, /ae-officecli, Office document automation, Word/Excel/PowerPoint batch editing, or wants to use OfficeCLI as an external engine from Codex.
---

# AE OfficeCLI

Use OfficeCLI as an optional external Office automation engine for `.docx`, `.xlsx`, and `.pptx` work.

## Workflow

1. Read `references/install-and-detect.md`.
2. Detect whether `officecli` is available before planning command execution.
3. Read `references/cli-strategy.md`.
4. Determine whether the task is primarily a Word, Excel, or PowerPoint workflow.
5. If the binary is missing, report that clearly and provide install or validation steps instead of pretending the CLI is ready.
6. If the binary is available, prefer help-first discovery and `--json` output over guessing command names or payload shapes.
7. Route format-specific work to `ae-docx`, `ae-xlsx`, or `ae-pptx` after the execution strategy is clear.
8. Report what was detected, what can run now, and what remains blocked by missing dependencies or user approval.

## Rules

- Treat OfficeCLI as an optional external dependency, not a bundled AE runtime.
- Do not claim OfficeCLI is installed unless detection proves it.
- Prefer deterministic CLI responses over broad prose when the tool is available.
- Do not auto-download or auto-install OfficeCLI without explicit user approval.
