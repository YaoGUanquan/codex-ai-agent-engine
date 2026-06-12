---
name: ae-claude-code
description: Use when the user asks Codex to delegate analysis, patch proposals, or bounded implementation assistance to a locally installed Claude Code CLI, or asks for Claude Code CLI integration, external CLI worker delegation, or controlled local agent handoff.
---

# AE Claude Code

Use local Claude Code CLI as a controlled external worker while Codex remains the orchestrator, reviewer, and delivery agent.

## Operating Principles

- Treat Claude output as untrusted advice or a patch proposal until Codex reviews it.
- Default to read-only analysis or patch-proposal mode. Do not let Claude write to the active worktree by default.
- Do not install Claude, log in, change Claude config, or approve Claude prompts unless the user explicitly asks and Codex approval rules allow it.
- Keep user-owned Git changes protected. Run the normal AE work Git checks before applying any output.
- Prefer isolated worktrees for any explicit write-capable delegation.

## Workflow

1. Clarify the delegation goal: analysis, review, patch proposal, or explicitly approved isolated write.
2. Run `node scripts/ae-tools.mjs claude-delegate --check` from the project root.
3. If the command reports `status: skip`, tell the user Claude Code CLI is unavailable and continue with Codex-only work.
4. Build a narrow prompt that includes task scope, forbidden files, validation expectations, and output format.
5. For advice or patch proposals, run:

```powershell
node scripts/ae-tools.mjs claude-delegate --prompt-file <repo-relative-file>
```

6. Read Claude output before using it. Reject output that ignores scope, invents facts, hides errors, touches forbidden files, or lacks test rationale.
7. If applying a proposed patch, Codex applies it manually, inspects `git diff`, and runs relevant validation.
8. Record the delegation command, result, and any rejected output in the task's AE process notes when the work is S4 or higher.

## Write Delegation Gate

Only use Claude for direct file writes when all of these are true:

- the user explicitly requests write-capable Claude delegation,
- Git/worktree checks are clean or the user accepts the risk,
- the work runs in an isolated worktree or temporary copy,
- the prompt names allowed and forbidden files,
- Codex reviews the resulting diff before merge or copy-back,
- Codex runs the validation gate before delivery.

If any gate fails, fall back to read-only or patch-proposal mode.

## Prompt Contract

Ask Claude for structured output:

- summary of reasoning,
- files it believes should change,
- proposed diff or step-by-step patch notes,
- validation commands,
- risks and assumptions.

Do not ask Claude to fabricate test results, credentials, environment state, or user decisions.

## Validation

- Availability: `node scripts/ae-tools.mjs claude-delegate --check`.
- Help discovery: `node scripts/ae-tools.mjs help claude`.
- After any applied output: run the narrowest meaningful project validation and inspect `git diff`.

## Boundaries

- Do not use Claude to bypass Codex safety policies.
- Do not send secrets, private credentials, or unrelated repository content.
- Do not report Claude's answer as verified unless Codex independently verifies it.
