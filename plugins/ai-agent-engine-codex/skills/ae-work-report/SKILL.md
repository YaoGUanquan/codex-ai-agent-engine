---
name: ae-work-report
description: Use when the user asks for AE work report, /ae-work-report, daily report, weekly report, work summary, summarize Git history, or summarize current uncommitted work.
---

# AE Work Report

Generate concise work reports from Git history, current changes, and existing report context.

## Operating Principles

- Base the report on evidence: `git log`, `git status`, `git diff`, relevant files, and existing reports.
- Translate technical changes into work outcomes, delivery value, risk reduction, or process progress.
- Avoid listing raw filenames, hashes, command output, or implementation details unless the user requests a technical report.
- Do not invent work when Git history and workspace evidence are empty.
- Write only the requested report artifact; do not perform Git write operations.

## Workflow

1. Determine report type: daily, weekly, or explicit time/ref range.
2. Collect read-only evidence with narrow Git commands and file reads.
3. Include uncommitted work only after inspecting enough content to understand intent.
4. Deduplicate against existing reports under `docs/ae/work-reports/` when present.
5. Write the report as Markdown under `docs/ae/work-reports/` unless the user gave a path.
6. Return the report path, report body, and any evidence limitations.

## Default Paths

- Daily report: `docs/ae/work-reports/YYYY-MM-DD-daily-report.md`
- Weekly report: `docs/ae/work-reports/YYYY-MM-DD_to_YYYY-MM-DD-weekly-report.md`
- Scoped report: `docs/ae/work-reports/YYYY-MM-DD_to_YYYY-MM-DD-work-report.md`

## Boundaries

- Do not run `git add`, `git commit`, `git push`, `git reset`, `git checkout`, `git clean`, or branch operations.
- Do not expose secrets or sensitive values found in diffs.
- Do not overwrite existing reports without explicit user direction.
