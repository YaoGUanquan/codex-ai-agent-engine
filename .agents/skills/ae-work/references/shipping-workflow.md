# Shipping Workflow

Before final response:

1. Inspect `git status --short`.
2. Summarize changed files and behavior.
3. Run the narrowest meaningful validation commands, then broader validation if appropriate.
4. Run review or explain why review was not run.
5. Run `node scripts/ae-tools.mjs gate --workflow work --checkpoint final ...` or perform equivalent gate checks.
6. Report completed work, validation, unverified areas, Git operations, gate status, and residual risks.

Do not claim tests passed unless commands actually ran and succeeded.
