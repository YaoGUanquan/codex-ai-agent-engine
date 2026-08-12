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

## Evidence Boundaries

- Proven tier and bounded claim: <only when a material validation claim exists>
- Blocked or unverified proof and residual risk: <only when applicable>

## Deviations (Conditional)

Use this section only when the reviewed scope intentionally varies from a must-have. Omit it when there is no material variance. A verification gap is not a deviation.

- Related requirement ID: <R1 or NFR1>
  Authority or decision source: <approved decision, owner, or artifact>
  Reason: <why the variance is necessary>
  Impact: <affected behavior, scope, risk, or acceptance>
  Recovery or explicit deferral: <how and when the must-have is restored, or why it is deferred>

## Verification Gaps (Conditional)

Use this section only when required proof is absent, blocked, or unverified. Omit it when all applicable proof is available. A gap does not pass the requirement and does not approve a deviation.

- Affected requirement ID: <R1 or NFR1>
  Required proof and missing check: <tier, command, observation, or acceptance evidence>
  Status: <blocked | unverified | failed | not-applicable>
  Owner and next action: <responsible actor and recovery step>

## Known Unrelated Failures

- <failure, evidence, and reason it does not invalidate the scoped result; or none identified>

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
