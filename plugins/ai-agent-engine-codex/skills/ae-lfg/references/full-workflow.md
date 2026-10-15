# Full Workflow

Before helper commands, resolve `aeEntry` using the [runtime entry contract](../../ae-help/references/runtime-entry.md).

## First Steps

1. Read `task-routing.md` and classify the request.
2. For S1/S2/S3/S5/S6, make the single narrower handoff and stop. For S7, split the implementation/validation stage from the independently authorized Git/review/deploy stage; do not treat it as one route.
3. For S4, or the implementation stage of S7 when it is genuinely multi-step, resolve the project's documentation context. For repository docs, run `node "$aeEntry" recovery` from the project root; for registered external docs, use `node "$aeEntry" recovery --docs-root "<resolved-absolute-docs-root>"`. Inspect `pathBase`, `docsPath`, `scope` and `completeness`; root selection does not prove registry/branch identity, and an incomplete scan cannot establish the global latest artifact. Use `--type plan` (or the relevant artifact type) to narrow recovery. Navigation and immutable pages are not resumable tasks; use owner-aware memory/docs search for their content. The selected entry is the project wrapper or current-user dispatcher, not a separate script in this skill.
4. Do not modify project files before the workflow reaches ae-work and Git/worktree checks are complete; for S7, do not begin the later Git/deploy stage until implementation review and validation pass.

## Pipeline

Follow `pipeline.md`.

For complex or delegated work, apply the
[adaptive team contract](../../ae-help/references/team-execution.md). The parent
owns integration and acceptance; use the central role catalog without inventing
a second registry or scheduler. Requirements and architecture produce one
proposal for user approval before implementation; reuse an approved plan.

Default chain:

1. ae-brainstorm if requirements are unclear or durable decisions are needed. When durable data is created or materially changed, require the decisions in `../../ae-backend/references/persistence-contract.md` before implementation. When frontend component, style, form, query, mutation, or API-access work is in scope, require the reuse and ownership decisions in `../../ae-frontend-design/references/component-data-access-contract.md` before implementation.
2. Confirm requirements readiness: outcome, acceptance criteria, non-goals, chosen approach, validation expectations, and open questions.
3. Review requirements when unresolved decisions or material risk need it; reuse an applicable existing review.
4. ae-plan for S4 work, including plan readiness and self-review.
5. Check plan readiness and blocking findings; use a separate document review only when requested or required by risk or project rules.
6. Confirm the consensus gate before implementation: requirements and plan artifacts exist when needed, document review has no blocking findings, assumptions are explicit, and the user has accepted or delegated any open product decisions.
7. ae-work after Git/worktree safety checks.
8. Maintain concise checkpoint state when needed for continuation; use an authorized documentation location only when durable evidence is required.
9. Select and reuse validation using the shared validation contract linked from `pipeline.md`.
10. Review the scoped diff; use ae-review for explicitly requested or risk-required specialist review.
11. Browser verification when UI changed and browser tools are available.
12. Final gate with proof path or blocked reasons.

## Hard Rules

- Never skip planning for S4 work.
- Never start implementation while requirements or acceptance criteria are materially unclear.
- Never treat a generated plan as ready until assumptions, alternatives, acceptance coverage, validation, and rollback signals have been checked.
- Never treat "a file was generated" as consensus. The gate is only ready when the artifact content, review status, open decisions, and validation path are all known.
- Candidate waves do not release dependencies. The parent accepts actual changes
  and acceptance evidence before a unit passes; failures block affected work
  while independent ready units may continue.
- Do not repeatedly ask whether to continue between normal phases; ask only when a decision, credential, permission, or P0/P1 risk requires the user.
- Use Codex approval/escalation rules for Git writes, destructive actions, network fetches, dependency installs, database writes, and browser setup.
- If a worktree transfer is chosen, stop after writing the handoff and tell the user where to continue.

## Consensus Gate

Before ae-work starts on S4 tasks, record or confirm:

- requirements status: none needed, confirmed inline, or artifact path,
- plan status: approved inline plan or artifact path and readiness result,
- proposal approval: accepted requirements and architecture, reusing existing
  approval when still applicable,
- document review status: pass, findings accepted, or blocked,
- open decisions: none, explicitly deferred, or user decision required,
- validation contract: exact commands or checks expected before delivery.

Resolve material unknown decisions before dependent implementation. A missing optional artifact does not block work whose requirements and acceptance are already clear.

## Execution Evidence

For S4 work, keep concise evidence in `docs/00-process/active/<task>/` when the task spans multiple checkpoints or turns. Use the smallest useful artifact:

- `progress.md` for checkpoint summaries,
- `ledger.jsonl` for structured step, command, result, and evidence records,
- `handoff.md` when transferring to another branch, worktree, thread, or later session; standalone cross-session handoffs without a task directory go to `docs/ae/handoffs/` (see ae-handoff).

Do not create process artifacts for tiny one-shot fixes unless they improve handoff or auditability.

## Final Response

Use these sections: completed, verified, unverified/unable to verify, Git operations, gate result, residual risks.
