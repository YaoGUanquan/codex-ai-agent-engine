---
name: ae-lfg
description: Use when the user explicitly asks for ae-lfg, /ae-lfg, $ae-lfg, "use ae-lfg", AE LFG, AI Agent Engine full workflow, or wants a software task taken from requirement clarification through plan, implementation, review, validation, and delivery evidence. Use for multi-step engineering work where planning before coding is required.
---

# AE LFG

For a scale-sensitive workflow, apply the [scale and distributed engineering contract](../ae-help/references/scale-and-distributed-engineering.md) across requirement, design, plan, work and acceptance. Carry workload assumptions and incomplete evidence between stages; do not restart broad scans or promote local tests to production proof.

Before running helper commands, resolve `aeEntry` using the [runtime entry contract](../ae-help/references/runtime-entry.md).

Run the full AE engineering workflow in Codex. This is an orchestrator skill: it coordinates ae-brainstorm, ae-plan, ae-work, ae-review, validation, and final gate evidence.

## Scope-First Fast Lane

Select the smallest sufficient route before loading helpers or recovering artifacts:

- S1 direct answer, S2 fuzzy idea, S3 small fix, S5 read-only review, and S6 Git-only request do not enter the LFG pipeline. Hand off once to the narrower owner (`ae-brainstorm` for S2, `ae-work` light path for S3, `ae-review` report-only for S5, and the Git entry for S6) and stop; do not run recovery, brainstorming, planning, or final-gate ceremony beyond the selected handoff.
- S7 mixed requests split into stages: complete the implementation, review, and validation stage first, then begin the independently authorized Git/review/deploy stage only after that stage passes. Do not combine the stages or let a Git/deploy action bypass implementation evidence.
- An explicit `ae-lfg` invocation does not widen a request whose acceptance boundary is narrower. Use the full pipeline only when the request is genuinely S4 or is the implementation stage of an S7 request that explicitly needs the full workflow.
- Once a route is selected, load only references required by that route. Do not repeat repository scans or re-run completed gates merely because the orchestrator has another stage available.

Apply the [model-adaptation contract](../ae-help/references/model-adaptation-contract.md). Route and scale the workflow from task class, risk, acceptance criteria, and observed tools rather than model labels or assumed reasoning settings. Reuse already-valid artifacts and gates instead of repeating ceremony.

For database-backed lists/queries or bulk/async persistence, carry the [data-access and scale contract](../ae-backend/references/data-access-contract.md) through requirements, design/plan, work, review and validation. Reuse one decision record for scale, totals, read-model ownership, atomicity and completion; do not let a direct implementation route bypass it. Static plugin tests are not target-database load or recovery evidence.

## First Steps

1. Read `references/task-routing.md` and classify the request.
2. For S1/S2/S3/S5/S6, make the single narrower handoff and stop. For S7, split the implementation/validation stage from the independently authorized Git/review/deploy stage; do not treat it as one route.
3. For S4, or the implementation stage of S7 when it is genuinely multi-step, resolve the project's documentation context. For repository docs, run `node "$aeEntry" recovery` from the project root; for registered external docs, use `node "$aeEntry" recovery --docs-root "<resolved-absolute-docs-root>"`. Inspect `pathBase`, `docsPath`, `scope` and `completeness`; root selection does not prove registry/branch identity, and an incomplete scan cannot establish the global latest artifact. Use `--type plan` (or the relevant artifact type) to narrow recovery. Navigation and immutable pages are not resumable tasks; use owner-aware memory/docs search for their content. The selected entry is the project wrapper or current-user dispatcher, not a separate script in this skill.
4. Do not modify project files before the workflow reaches ae-work and Git/worktree checks are complete; for S7, do not begin the later Git/deploy stage until implementation review and validation pass.

## Pipeline

Follow `references/pipeline.md`.

Default chain:

1. ae-brainstorm if requirements are unclear or durable decisions are needed. When durable data is created or materially changed, require the decisions in `../ae-backend/references/persistence-contract.md` before implementation. When frontend component, style, form, query, mutation, or API-access work is in scope, require the reuse and ownership decisions in `../ae-frontend-design/references/component-data-access-contract.md` before implementation.
2. Confirm requirements readiness: outcome, acceptance criteria, non-goals, chosen approach, validation expectations, and open questions.
3. ae-review domain:document for any created requirements artifact.
4. ae-plan for S4 work, including plan readiness and self-review.
5. ae-review domain:document for the plan.
6. Confirm the consensus gate before implementation: requirements and plan artifacts exist when needed, document review has no blocking findings, assumptions are explicit, and the user has accepted or delegated any open product decisions.
7. ae-work after Git/worktree safety checks.
8. Maintain execution evidence with checkpoint notes or a lightweight ledger under `docs/00-process/active/<task>/` for S4 work.
9. Run validation commands.
10. ae-review for code changes.
11. Browser verification when UI changed and browser tools are available.
12. Final gate with proof path or blocked reasons.

## Hard Rules

- Never skip planning for S4 work.
- Never start implementation while requirements or acceptance criteria are materially unclear.
- Never treat a generated plan as ready until assumptions, alternatives, acceptance coverage, validation, and rollback signals have been checked.
- Never treat "a file was generated" as consensus. The gate is only ready when the artifact content, review status, open decisions, and validation path are all known.
- Do not repeatedly ask whether to continue between normal phases; ask only when a decision, credential, permission, or P0/P1 risk requires the user.
- Use Codex approval/escalation rules for Git writes, destructive actions, network fetches, dependency installs, database writes, and browser setup.
- If a worktree transfer is chosen, stop after writing the handoff and tell the user where to continue.

## Consensus Gate

Before ae-work starts on S4 tasks, record or confirm:

- requirements status: none needed, confirmed inline, or artifact path,
- plan status: artifact path and self-review result,
- document review status: pass, findings accepted, or blocked,
- open decisions: none, explicitly deferred, or user decision required,
- validation contract: exact commands or checks expected before delivery.

If any item is blocked or unknown, pause implementation and resolve the missing decision instead of assuming it.

## Execution Evidence

For S4 work, keep concise evidence in `docs/00-process/active/<task>/` when the task spans multiple checkpoints or turns. Use the smallest useful artifact:

- `progress.md` for checkpoint summaries,
- `ledger.jsonl` for structured step, command, result, and evidence records,
- `handoff.md` when transferring to another branch, worktree, thread, or later session; standalone cross-session handoffs without a task directory go to `docs/ae/handoffs/` (see ae-handoff).

Do not create process artifacts for tiny one-shot fixes unless they improve handoff or auditability.

## Final Response

Use these sections: completed, verified, unverified/unable to verify, Git operations, gate result, residual risks.
