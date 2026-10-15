# Pipeline

Before running helper commands, resolve `aeEntry` using the [runtime entry contract](../../ae-help/references/runtime-entry.md).

AE LFG standard chain:

Use this chain only for a selected full-workflow request or a concrete risk that needs it. Reuse approved requirements, plans, reviews and passing evidence; a stage transition does not require regenerating an artifact or repeating a check. Ordinary development stays on the direct ae-work path.

1. Classify task with task-routing.md.
2. Stop after a single handoff for S1, S2, S3, S5, or S6. These lanes must not recover artifacts or enter the full chain; S2 hands off to ae-brainstorm.
3. For S7, split the work into two stages: Stage A completes implementation, review, and validation; Stage B performs the independently authorized Git/review/deploy action only after Stage A passes. Never let Stage B bypass Stage A evidence.
4. Recover existing docs/ae artifacts from the target project root with `node "$aeEntry" recovery`; use the selected project wrapper or current-user dispatcher, not a guessed script under the `ae-lfg` skill directory.
5. Clarify requirements with ae-brainstorm when behavior is not already clear.
6. Confirm requirements readiness: outcome, acceptance criteria, non-goals, chosen approach, validation expectations, and explicit open questions.
7. Review requirements for unresolved decisions or material risk; keep the result inline unless a durable artifact is needed.
8. Use an approved implementation plan, or create one with ae-plan when the selected workflow requires it.
9. Check plan readiness and resolve blocking findings; do not add a separate review round when an existing review still covers the current plan.
10. Confirm the consensus gate: requirements, plan, document review, open decisions, and validation contract are all known.
11. Run the before-work gate or manually confirm equivalent readiness.
12. Execute with ae-work only after Git/worktree checks.
13. Maintain checkpoint evidence or a lightweight ledger only when the S4 task spans multiple checkpoints or turns.
14. Apply the [validation contract](../../ae-help/references/validation-contract.md); use actual command evidence and run only missing or invalid checks.
15. Review the scoped diff for correctness and risk. Use `ae-review mode:report-only` when requested, required by project rules, or a specialist review is needed; reuse an applicable existing review.
16. Run browser checks when UI behavior changed and browser tools are available.
17. Run final gate and report proof path or blocked reasons.

Never skip planning for S4 work. Never modify files before Git/worktree safety checks in ae-work.
