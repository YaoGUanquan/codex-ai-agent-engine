# Task Execution

## Pre-Edit Gate

Before modifying any project file, run and inspect:

```powershell
git status --short
git branch --show-current
git log --oneline -1
```

If the directory is not a Git repository, say so and use `worktree_decision: not_applicable`.

Then choose the safe path from the actual diff and applicable project rules:

- Preserve unrelated existing changes and continue authorized reversible edits, including on a default branch or dirty worktree.
- Inspect overlapping edits and work with them. Ask only if safe coexistence is unresolved, authorization is missing, or a material product/security/data decision is required.
- Use isolation when a concrete conflict or applicable project rule requires it; do not create a branch or worktree merely because a workflow phase began.
- Git writes such as commit, reset, clean, rebase, push, or worktree add require explicit user approval and Codex escalation rules.

## Minimality Gate

Before implementing a database-backed list/query/count or write path, apply the [data-access and scale contract](../../ae-backend/references/data-access-contract.md). Reuse accepted design decisions; if scale, atomicity, totals, read-model freshness or async completion is materially unresolved, return to design before coding. Minimality does not justify N+1, per-row commits or in-memory async when the workload requires bounded set/batch or durable-job behavior.

Before editing behavior, choose the smallest correct implementation that satisfies the request and repository constraints:

- First ask whether the requested behavior needs new code at all; if configuration, documentation, deletion, or an existing path already satisfies it, use that route.
- Prefer standard library, framework, database, browser, shell, or platform-native capabilities over custom code.
- Prefer an already-installed dependency over a new dependency when it clearly fits the local stack.
- Add a new dependency, abstraction, interface, wrapper, flag, or configuration point only when the current requirement or repository pattern justifies owning it now.
- Keep the patch as small as behavior allows, but never remove trust-boundary validation, security controls, accessibility basics, data-loss prevention, explicit user requirements, or the narrow validation needed for non-trivial logic.
- When deliberately choosing a simple implementation with a known ceiling, record the ceiling and the trigger for revisiting it in the plan, final response, or a scoped code comment. Do not leave open-ended "later" notes.

## Execution Rules

- Read the plan and referenced files first.
- Before executing the first implementation unit from a plan, run one pre-flight conflict scan across the plan:
  - compare units for shared files or contradictory ownership,
  - compare unit intent against any explicit `Global Constraints`,
  - flag plan instructions that would obviously fail later review gates.
- If the plan references a constitution, checklist, or task artifact, read it before editing and treat unresolved blockers as pre-implementation blockers.
- Keep small work inline. For independent multi-unit work, follow the
  [adaptive team contract](../../ae-help/references/team-execution.md);
  the parent senior project manager/technical lead owns integration and acceptance.
- For complex implementation, obtain approval of the requirements and architecture
  proposal first. Reuse an approved plan without repeated phase confirmations.
- Dispatch only ready units with exclusive writable ownership and compatible
  shared-resource access. Shared reads are safe; readers cannot overlap a writer.
- Keep changes scoped to the assigned unit or task.
- Do not overwrite user-owned unrelated changes.
- Establish a baseline when the task is a bug fix or behavior-sensitive refactor.
- Add tests or update existing tests when behavior changes.
- Stop affected work and report blockers when the failure invalidates its
  assumptions, ownership or business contract; independent ready units may continue.
- Apply the [validation contract](../../ae-help/references/validation-contract.md); reuse valid results and run only missing or invalid checks.
- When a changed local API or UI surface has an explicit runtime smoke request, read [the local runtime smoke gate](local-runtime-smoke-gate.md) after focused validation. It defines the trigger synonyms, restart and request classification checks, safe secret-reference boundary, and evidence needed before a local call is claimed.
- Track validation commands exactly for final reporting.
- When using a task artifact, the parent marks a unit passed only after inspecting
  its actual diff and acceptance evidence. Worker messages, changed files and
  candidate waves alone do not release dependents; running ownership persists,
  and failed/blocked/cancelled units cannot release them.
- Prefer ae-debug for investigation-heavy failures and ae-tdd when the user wants or the change benefits from red-green-refactor discipline.
- Do not bundle opportunistic refactors, formatting churn, dependency upgrades, or unrelated test rewrites into the task.
- If verification cannot be run, name the exact blocker and the residual risk.
- When resuming a multi-step task after interruption or context compaction, read the active task ledger under `docs/00-process/active/<task>/ledger.jsonl` when present and reconcile it with `git log` before deciding what still needs execution.

## Cleanup Gate

Before final validation, inspect the files changed in this task for AI-generated cleanup risks:

- fallback-like code that silently swallows errors, returns fabricated defaults, or hides missing integration work,
- dead code, duplicate helpers, unused flags, speculative abstractions, single-use wrappers, or placeholder branches,
- avoidable new dependencies, hand-rolled standard-library behavior, or code replacing a native platform capability,
- broad formatting churn unrelated to the task,
- tests that assert implementation details without protecting the requested behavior,
- comments or names that describe intent inaccurately after the edit.

Fix only deterministic issues inside the current task scope. Do not expand cleanup into unrelated refactors. If a suspicious pattern may be intentional, record it as residual risk or route to ae-review instead of rewriting product behavior.
