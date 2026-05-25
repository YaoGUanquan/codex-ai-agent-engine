# Pipeline

AE LFG standard chain:

1. Classify task with task-routing.md.
2. Recover existing docs/ae artifacts with `node scripts/ae-tools.mjs recovery`.
3. Clarify requirements with ae-brainstorm when behavior is not already clear.
4. Confirm requirements readiness: outcome, acceptance criteria, non-goals, chosen approach, validation expectations, and explicit open questions.
5. Review requirements if a requirements artifact was created.
6. Create an implementation plan with ae-plan, including readiness gate, alternatives when needed, and plan self-review.
7. Review the plan before implementation.
8. Run the before-work gate or manually confirm equivalent readiness.
9. Execute with ae-work only after Git/worktree checks.
10. Validate with actual commands.
11. Run ae-review on implementation scope.
12. Run browser checks when UI behavior changed and browser tools are available.
13. Run final gate and report proof path or blocked reasons.

Never skip planning for S4 work. Never modify files before Git/worktree safety checks in ae-work.
