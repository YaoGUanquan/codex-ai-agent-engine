# Computer Use Execution Contract

Write this contract before using Codex `Computer Use`.

```text
Computer Use execution contract

Target app:
Current stage:
Allowed actions:
Forbidden actions:
Input paths:
Expected visible state:
Max actions this stage:
Max screenshots this stage:
Failure stop conditions:
Completion check:
Old screenshot policy: discard after state summary
```

## Required Stop Conditions

- Wrong window or target app not visible.
- Login, payment, account security, privacy, or permission prompt.
- Repeated failure within the active stage.
- Screenshot budget exhausted.
- UI state cannot be explained in a compact summary.
- User goal is too broad for a single stage.

## State Summary Template

```text
Current app:
Current stage:
Visible important areas:
Confirmed result:
Open issue:
Next action:
Screenshot status: summarized and discardable
```

