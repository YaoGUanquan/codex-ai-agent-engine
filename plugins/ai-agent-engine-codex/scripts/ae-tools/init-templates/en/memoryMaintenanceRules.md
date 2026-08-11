<!-- ae-codex:init managed -->
# AI Memory Maintenance Rules

## Read Rules

- Read `00-index.md` first.
- Then read only topic files related to the current task.
- Avoid full memory scans unless the task is broad or ambiguous.

## Update Rules

- Write only stable, long-lived, reusable knowledge.
- Prefer updating existing topic files over creating new ones.
- Do not write one-off logs, raw command output, or unverified guesses.

## Task Close Rule

- At task close, decide whether new durable knowledge was created.
- If yes, update the smallest relevant memory file and mention it in the final response.
- If no, state that no AI memory update was needed.

## Size And Distillation Budget

- When a single memory file exceeds roughly 15KB, distill or split the topic before appending more.
- Rotate `05-decision-log.md` yearly: start a new file or archive last year's entries under `docs/99-archive/`, updating `00-index.md` and `00-registry.json`.
- Review `00-registry.json` `reviewStatus` quarterly: confirm entries that are still valid, and distill then archive stale topics.
- Move topic files for retired features into the archive instead of keeping them in the memory root.
