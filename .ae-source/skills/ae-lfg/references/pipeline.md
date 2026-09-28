# Pipeline

Before running helper commands, resolve `aeEntry` using the [runtime entry contract](../../ae-help/references/runtime-entry.md).

AE LFG standard chain:

1. Classify task with task-routing.md.
2. Stop after a single handoff for S1, S2, S3, S5, or S6. These lanes must not recover artifacts or enter the full chain; S2 hands off to ae-brainstorm.
3. For S7, split the work into two stages: Stage A completes implementation, review, and validation; Stage B performs the independently authorized Git/review/deploy action only after Stage A passes. Never let Stage B bypass Stage A evidence.
4. Recover existing docs/ae artifacts from the target project root with `node "$aeEntry" recovery`; use the selected project wrapper or current-user dispatcher, not a guessed script under the `ae-lfg` skill directory.
5. Clarify requirements with ae-brainstorm when behavior is not already clear.
6. Confirm requirements readiness: outcome, acceptance criteria, non-goals, chosen approach, validation expectations, and explicit open questions.
7. Review requirements if a requirements artifact was created.
8. Create an implementation plan with ae-plan, including readiness gate, alternatives when needed, and plan self-review.
9. Review the plan before implementation.
10. Confirm the consensus gate: requirements, plan, document review, open decisions, and validation contract are all known.
11. Run the before-work gate or manually confirm equivalent readiness.
12. Execute with ae-work only after Git/worktree checks.
13. Maintain checkpoint evidence or a lightweight ledger only when the S4 task spans multiple checkpoints or turns.
14. Validate with actual commands.
15. Run `ae-review mode:report-only` on every S4 implementation scope; do not skip it merely because no narrower trigger was inferred.
16. Run browser checks when UI behavior changed and browser tools are available.
17. Run final gate and report proof path or blocked reasons.

Never skip planning for S4 work. Never modify files before Git/worktree safety checks in ae-work.
