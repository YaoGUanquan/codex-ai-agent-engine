# Task Delegation

Load the [adaptive team contract](../../ae-help/references/team-execution.md)
before team dispatch. It owns role/model selection, approval, ownership, shared
resources, failure handling and parent acceptance. Native tools perform dispatch;
the analyzer neither starts agents nor proves a unit complete.

Before helper commands, resolve `aeEntry` using the [runtime entry contract](../../ae-help/references/runtime-entry.md).

## Task Analysis

For a plan file, run:

```powershell
node "$aeEntry" task-analyze --mode plan --plan <path>
```

For discovery only, run:

```powershell
node "$aeEntry" task-analyze --mode scan --task "<description>"
```

Small tasks stay inline. For complex work, reuse the approved requirements and
architecture proposal. Inspect the baseline diff and Pre-Edit Gate; unrelated
dirty state permits safe assignments. Unresolved overlap blocks affected files
and units. Inspect business dependencies and shared resources as well as paths.
Scan matches are advisory and never grant write ownership.

Read `execution_strategy`, `read_parallel_eligibility`,
`write_parallel_eligibility`, `parallel_waves` and worker requests together.
Use `owned_files`, `read_only_files` and `forbidden_files` without promoting
read-only evidence into writable ownership. `parallel_eligibility` is a
compatibility summary, not the sole write-worker gate. Local conflicts exclude
affected pairs; they do not serialize independent ready work.

- `multi_agent.enabled: false` is a hard off switch.
- `suggest` recommends candidates; the parent decides dispatch within platform
  permissions and authorization.
- `review_only` allows eligible parallel read-only lanes and disables write workers.
- `auto`/`true` allow task-sensitive native delegation when the corresponding lane
  is eligible. Config permission and analyzer eligibility do not replace actual
  ownership checks, business readiness, runtime tools or user authorization.
- `write_parallel_eligibility.can_spawn_write_agents_now` does not independently
  certify the Pre-Edit Gate. The parent must inspect the current worktree.
- Immutable document pages remain read-only, including with
  `--include-document-pages`; use lifecycle commands through the owning document.
- Supply observed available worker slots with `--host-slots`, excluding the
  parent. Respect `multi_agent.max_workers`; an absent observation uses the
  disclosed configured fallback, never a guessed provider limit. Zero slots queues.
- Use `--execution-state` for known unit states. Only the parent may record
  `passed` after inspecting the actual diff and acceptance evidence.
  Candidate waves are possible ordering; running ownership persists and
  failed/blocked/cancelled work cannot release dependents.

Use [work-subagent-template](work-subagent-template.md). Check current native
spawn/follow-up/wait schemas and catalog model/effort support; report unavailable
preferences, do not silently substitute. If delegation is unavailable, execute
serially and report that boundary. At quota exhaustion queue work and reconcile
live workers before retrying. Escalate ownership/contract changes only for
affected work; continue independent assignments.
