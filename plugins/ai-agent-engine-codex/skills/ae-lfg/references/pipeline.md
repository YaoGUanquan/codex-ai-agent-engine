# Pipeline

AE LFG standard chain:

1. Classify task with task-routing.md.
2. Recover existing docs/ae artifacts from the target project root with `node scripts/ae-tools.mjs recovery`; the command is installed as the project-level `scripts/ae-tools.mjs` wrapper, not as a file under the `ae-lfg` skill directory.
3. Clarify requirements with ae-brainstorm when behavior is not already clear.
4. Confirm requirements readiness: outcome, acceptance criteria, non-goals, chosen approach, validation expectations, and explicit open questions.
5. Review requirements if a requirements artifact was created.
6. Create an implementation plan with ae-plan, including readiness gate, alternatives when needed, and plan self-review.
7. Review the plan before implementation.
8. Confirm the consensus gate: requirements, plan, document review, open decisions, and validation contract are all known.
9. Run the before-work gate or manually confirm equivalent readiness.
10. Execute with ae-work only after Git/worktree checks.
11. Maintain checkpoint evidence or a lightweight ledger for multi-step S4 work.
12. Validate with actual commands.
13. Run ae-review on implementation scope.
14. Run browser checks when UI behavior changed and browser tools are available.
15. Run final gate and report proof path or blocked reasons.

Never skip planning for S4 work. Never modify files before Git/worktree safety checks in ae-work.
