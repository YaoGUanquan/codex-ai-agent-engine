---
name: ae-lfg
description: Use when the user explicitly asks for AE LFG, /ae-lfg, AI Agent Engine full workflow, or wants a software task taken from requirement clarification through plan, implementation, review, validation, and delivery evidence. Use for multi-step engineering work where planning before coding is required.
---

# AE LFG

Run the full AE engineering workflow in Codex. This is an orchestrator skill: it coordinates ae-brainstorm, ae-plan, ae-work, ae-review, validation, and final gate evidence.

## First Steps

1. Read `references/task-routing.md` and classify the request.
2. If the request is not S4 multi-step implementation, route to the narrower skill and explain the route briefly.
3. From the target project root, run `node scripts/ae-tools.mjs recovery` to inspect existing `docs/ae` artifacts when the repository has project files. This is a project-level wrapper command installed under `scripts/`; do not look for a separate recovery script inside the `ae-lfg` skill directory.
4. Do not modify project files before the workflow reaches ae-work and Git/worktree checks are complete.

## Pipeline

Follow `references/pipeline.md`.

Default chain:

1. ae-brainstorm if requirements are unclear or durable decisions are needed.
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
- `handoff.md` when transferring to another branch, worktree, thread, or later session.

Do not create process artifacts for tiny one-shot fixes unless they improve handoff or auditability.

## Final Response

Use these sections: completed, verified, unverified/unable to verify, Git operations, gate result, residual risks.
