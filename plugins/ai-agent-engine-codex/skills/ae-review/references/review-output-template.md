# Review Output Template

Findings first, ordered by severity.

```markdown
## Findings

- [P0] <title> - <file>:<line>
  Evidence: <specific behavior or text>
  Impact: <what breaks or risk introduced>
  Fix: <concrete remediation>

## Task Review Contract

- specVerdict: approve | request_changes | cannot_verify_from_diff
- qualityVerdict: approve | request_changes | cannot_verify_from_diff
- cannotVerifyFromDiff:
  - <requirement or claim that needs controller-side verification>
- blockingFindings:
  - <P0/P1 or equivalent task-blocking issue reference>

## Open Questions

## Lane Verdicts

- Reviewer lane:
- Architect lane:
- Overall:

## Coverage

- Requirements covered:
- Plan units covered:
- Task IDs covered:
- Governance checks:

## Residual Risk
```

If no findings are found, state that explicitly and list residual risks or missing validation.
