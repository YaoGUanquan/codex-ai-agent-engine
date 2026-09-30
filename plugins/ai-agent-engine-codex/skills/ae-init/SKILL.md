---
name: ae-init
description: Use when the user requests AE init, /ae-init, or explicit initialization of AE project guidance and documentation scaffolding.
---

# AE Init

Initialize only AE-managed project files, not unrelated documentation.

1. Confirm the target working directory and inspect existing instructions,
   README/build metadata, documentation conventions and Git status.
2. Resolve [runtime-entry](../ae-help/references/runtime-entry.md), then preview
   `node "$aeEntry" init --dry-run`. Choose profile and language from the request
   and project evidence.
3. Use `ae-core` by default, `minimal` for only `AGENTS.md`, or `full` for legacy
   numbered directories.
4. Apply only when target/profile/language are clear; inspect command JSON,
   conflicts and actual generated files.
5. Preserve user content outside managed regions. `--force` requires explicit
   regeneration intent; legacy marker-only conflicts are not overwriteable.

## Task References

Read only the row triggered by the task, not the whole table.

| Trigger | Reference |
| --- | --- |
| Choosing invocation flags, nested preview or checking initialization results | [Initialization procedure](references/init-procedure.md) |

For large/multi-service projects, use the [scale contract](../ae-help/references/scale-and-distributed-engineering.md).
For generated guidance, use the [model-adaptation contract](../ae-help/references/model-adaptation-contract.md).
Nested preview is advisory, not permission to create nested instruction files.
Verify UTF-8 bytes before treating PowerShell mojibake as corruption.
Do not run from installer temp directories or fabricate a scaffold when the
command is unavailable. Report target/profile/language, created/updated/skipped/
conflicted paths, validation and untouched files.
