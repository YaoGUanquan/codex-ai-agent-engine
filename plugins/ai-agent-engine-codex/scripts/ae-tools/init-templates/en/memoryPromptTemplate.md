<!-- ae-codex:init managed -->
# Prompt Template

Use this when asking an agent to maintain project memory:

```text
Read docs/08-ai-memory/00-index.md first, then only the relevant topic files. Complete the task with the smallest safe change. At the end, decide whether new stable project knowledge should be written back to docs/08-ai-memory. Do not record one-off logs or unconfirmed guesses.
```
