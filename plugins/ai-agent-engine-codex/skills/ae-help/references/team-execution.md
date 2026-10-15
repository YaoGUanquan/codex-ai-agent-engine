# Adaptive Team Execution Contract

This contract applies only after explicit AE invocation or continuation of an
approved AE workflow. It is guidance for the parent Codex agent using the active
native tools, not a background scheduler, agent registry or separate sandbox.

## Scope, Approval And Ownership

- Keep micro/small tasks inline unless independent work justifies delegation.
  For complex work, requirements and architecture analysis produce one proposal
  for user approval before implementation. Reuse an approved plan; normal phase
  transitions do not require another confirmation.
- The parent acts as senior project manager and technical lead: allocate work,
  resolve contracts, integrate changes and verify acceptance. Role instances
  such as backend-1 and backend-2 share a reusable job contract, not file ownership.
- Preserve authorization, privacy, user work, business/data invariants and honest
  evidence as hard boundaries. Choose workflow depth, roles, effort, checks and
  concurrency from the actual task. A newer model does not waive hard boundaries.
- Inspect the baseline diff and ownership before dispatch. Unrelated dirty files
  do not block safe work. Overlapping user edits require inspection and safe
  coexistence; unresolved overlap blocks only the affected assignment.
- Each write assignment has exclusive owned files. Shared reads are allowed.
  Readers must not consume a file while another worker modifies it. Same-file
  writes are serial in this version, including apparently disjoint hunks.
- Architectural analysis must name shared API, state-machine, schema and config
  resource keys and their read/write access, or explicitly declare no shared
  resources after inspection. Different files alone do not prove independence.
  An overlapping resource with at least one writer cannot run concurrently.
- A material business-contract change pauses affected work for a decision.
  Independent assignments may continue. Never bypass an explicit off switch,
  read-only mode, missing authorization or the parent's platform permissions.

## Plan And Analyzer Interface

Use the existing unit headings and explicit `Depends on`, `Files` and
`Forbidden files`. Additional fields are:

```markdown
### U1 - Implement a bounded list
- Role: backend
- Depends on: none
- Files: `src/list.js`
- Read-only files: `src/list-contract.js`
- Shared resources: api:items=write, schema:items=read
- Acceptance: filtering and exact totals agree with the expected set
- Data Access Budget: bounded page and query count; preserve transaction semantics
- Forbidden files: `package-lock.json`
```

`Files` remains writable ownership. `Read-only files` grants no write access.
`Shared resources` is a comma-separated list of `key=read` or `key=write`;
use `none` for an explicitly checked independent unit. `Acceptance` and
`Data Access Budget` are concise text, not an executable success assertion.
Roles are defined in [team-roles.json](team-roles.json); legacy plans may use
the general `worker` role. Missing new fields on a legacy plan are reported as
manual checks, not proof of business independence.

The analyzer preserves existing output keys and adds role, resource, acceptance
and budget information to units and worker requests. It separates read and
write eligibility, reports local conflict edges, and returns conflict-free
candidate waves without turning one local conflict into a global serial gate.
Unknown/cyclic dependencies, ambiguous ownership, invalid paths and invalid
configuration must remain visible. Scan matches are advisory, never write grants.

`--host-slots <nonnegative-integer>` supplies observed free worker slots,
excluding the parent and already running workers. With `max_workers: auto`, use
observed free slots without subtracting running work again. Without host metadata
use `fallback_max_workers` (default 3) as a total simultaneous-worker cap and
disclose the assumption. Explicit numeric limits are total simultaneous-worker
caps too: subtract running workers before capping new assignments by observed
free slots. Zero available slots queues work.
Do not infer host capacity from a model name or assume the local fallback is a
provider limit.

Candidate waves describe possible ordering, not actual completion. An optional
`--execution-state <worktree-relative-json>` supplies a bounded object:
`{"units":{"U1":"passed","U2":"failed"}}`. Valid states are `pending`, `running`,
`passed`, `failed`, `blocked`, and `cancelled`. The parent supplies `passed` only
after inspecting changes and acceptance evidence. Running work retains its file
and resource ownership. Failed/blocked/cancelled work cannot release dependents.
Without a state file all units are pending. Readiness must distinguish runnable
units from future candidate waves; no script starts agents or verifies evidence.

## Runtime Dispatch And Model Choice

- Read the actual spawn/follow-up/wait tool schemas. If native delegation is
  unavailable, report serial execution explicitly; do not claim a team ran.
- [team-roles.json](team-roles.json) is the sole default role/model catalog.
  The first trial prefers `gpt-6.1-sol`; this is an explicit trial preference,
  not a permanent definition of latest. `multi_agent.preferred_model: inherit`
  requests the parent's model; another explicit model name changes the preference.
- Verify a requested model and reasoning effort against the current tool/model
  support before dispatch. Never silently substitute a cheaper model. Unavailable
  explicit preferences are reported before selecting an alternative.
- Architecture, requirements, complex diagnosis and review prefer supported high
  effort; ordinary implementation and testing prefer medium. Adapt to actual
  complexity and user preferences; these defaults are not a provider capability.
- Pass only the assignment, contract references, owned/read-only/forbidden paths,
  dependencies, resource access, acceptance, permitted checks and relevant data
  budget. Avoid copying the entire parent transcript into every worker.
- Keep shared project context in the approved plan, contracts and accepted
  artifacts. A specialist receives only relevant references and keeps its local
  working context; the parent routes cross-role questions and follow-ups using
  the active native messaging tools. A handoff names the sender, recipient,
  affected unit, accepted artifact/evidence and unresolved decision. A message
  never transfers write ownership or releases a dependency by itself.
- Report compact role/unit status when work meaningfully changes: assigned,
  running, queued, blocked or accepted. Reconcile stuck or failed assignments
  from observed tool results; bring the user in only for an actual decision.
  These are in-session responsibilities, not a persistent Bot roster, new
  durable role memory, autonomous notification service or scheduled routine.
- Use follow-up instructions for repairs. Workers do not recursively fan out or
  independently stage, commit, push, edit lockfiles, start services or clean up
  shared state unless the assignment and authorization explicitly allow it.
- On quota exhaustion queue ready work, reconcile live workers and resume when
  slots are available. Do not repeatedly retry unchanged quota failures.

## Integration, Failure And Evidence

Workers return changed files, checks with actual results, risks, conflicts and
unfinished work. The parent checks the actual diff against ownership and validates
acceptance; a worker's completion message alone cannot release a dependency.
Out-of-scope edits stop the affected worker for reconciliation without reverting
unrelated work. Failed checks block that unit, not unrelated ready units.

Review is read-only by default; testing uses assigned isolated fixtures. The
documentation owner serializes shared documentation updates. Reuse valid evidence
under the [validation contract](validation-contract.md). Report static tests,
installation smoke and actual model execution separately. No written contract or
helper fixture proves generated-code performance or host compliance.
