# Local AE Issues

Issues track status, priority, dependencies, and links. They do not replace PRDs, plans, tasks, reviews, gates, or evidence; those artifacts remain canonical for intent, execution design, and proof.

Use the project wrapper:

```text
node scripts/ae-tools.mjs issue create --title "..."
node scripts/ae-tools.mjs issue list
node scripts/ae-tools.mjs issue update --id AEI-YYYYMMDD-NNN --priority P1
node scripts/ae-tools.mjs issue transition --id AEI-YYYYMMDD-NNN --status in-progress
node scripts/ae-tools.mjs issue link --id AEI-YYYYMMDD-NNN --path docs/ae/plans/example.md
node scripts/ae-tools.mjs issue depend --id AEI-YYYYMMDD-NNN --on AEI-YYYYMMDD-MMM
node scripts/ae-tools.mjs issue close --id AEI-YYYYMMDD-NNN --reason "verified"
```

Issue records are Markdown under this directory. Each mutation appends a structured `HistoryJSON` event so state changes remain inspectable in Git and command output. Records must not contain credentials, raw request/response payloads, or private headers.
