# Pipeline

AE LFG standard chain:

1. Classify task with task-routing.md.
2. Recover existing docs/ae artifacts with `node scripts/ae-tools.mjs recovery`.
3. Clarify requirements with ae-brainstorm when behavior is not already clear.
4. Review requirements if a requirements artifact was created.
5. Create an implementation plan with ae-plan.
6. Review the plan before implementation.
7. Run the before-work gate or manually confirm equivalent readiness.
8. Execute with ae-work only after Git/worktree checks.
9. Validate with actual commands.
10. Run ae-review on implementation scope.
11. Run browser checks when UI behavior changed and browser tools are available.
12. Run final gate and report proof path or blocked reasons.

Never skip planning for S4 work. Never modify files before Git/worktree safety checks in ae-work.
