---
name: ae-lfg
description: Use when the user explicitly asks for AE LFG, /ae-lfg, AI Agent Engine full workflow, or wants a software task taken from requirement clarification through plan, implementation, review, validation, and delivery evidence. Use for multi-step engineering work where planning before coding is required.
---

# AE LFG

Run the full AE engineering workflow in Codex. This is an orchestrator skill: it coordinates ae-brainstorm, ae-plan, ae-work, ae-review, validation, and final gate evidence.

## First Steps

1. Read `references/task-routing.md` and classify the request.
2. If the request is not S4 multi-step implementation, route to the narrower skill and explain the route briefly.
3. Run `node scripts/ae-tools.mjs recovery` to inspect existing `docs/ae` artifacts when the repository has project files.
4. Do not modify project files before the workflow reaches ae-work and Git/worktree checks are complete.

## Pipeline

Follow `references/pipeline.md`.

Default chain:

1. ae-brainstorm if requirements are unclear or durable decisions are needed.
2. ae-review domain:document for any created requirements artifact.
3. ae-plan for S4 work.
4. ae-review domain:document for the plan.
5. ae-work after Git/worktree safety checks.
6. Run validation commands.
7. ae-review for code changes.
8. Browser verification when UI changed and browser tools are available.
9. Final gate with proof path or blocked reasons.

## Hard Rules

- Never skip planning for S4 work.
- Never start implementation while requirements or acceptance criteria are materially unclear.
- Do not repeatedly ask whether to continue between normal phases; ask only when a decision, credential, permission, or P0/P1 risk requires the user.
- Use Codex approval/escalation rules for Git writes, destructive actions, network fetches, dependency installs, database writes, and browser setup.
- If a worktree transfer is chosen, stop after writing the handoff and tell the user where to continue.

## Final Response

Use these sections: completed, verified, unverified/unable to verify, Git operations, gate result, residual risks.
