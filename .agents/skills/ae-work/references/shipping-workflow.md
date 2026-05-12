# Shipping Workflow

Before final response:

1. Inspect `git status --short`.
2. Summarize changed files, completed units, and any intentionally deferred work.
3. Run the narrowest meaningful validation commands, then broader validation if appropriate.
4. Record exact evidence for pass, fail, or blocked results.
5. Run review or explain why review was not run.
6. Run `node scripts/ae-tools.mjs gate --workflow work --checkpoint final ...` or perform equivalent gate checks.
7. Report completed work, validation, unverified areas, Git operations, gate status, and residual risks.

Do not claim tests passed unless commands actually ran and succeeded.
Do not claim a root cause, fix, or browser acceptance result without concrete evidence from the commands or tools you used.
