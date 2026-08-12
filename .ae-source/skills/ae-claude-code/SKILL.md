---
name: ae-claude-code
description: Use when the user asks Codex to delegate analysis, patch proposals, or bounded implementation assistance to a locally installed Claude Code CLI, or asks for Claude Code CLI integration, external CLI worker delegation, or controlled local agent handoff.
---

# AE Claude Code

Use local Claude Code CLI as a controlled external worker while Codex remains the orchestrator, reviewer, and delivery agent.

## Official Codex Plugin Relationship

OpenAI's `codex@openai-codex` Claude Code plugin works in the opposite direction: an interactive Claude Code session can use `/codex:review`, `/codex:rescue`, `/codex:transfer`, `/codex:status`, and related commands to call Codex. It does not allow Codex to control Claude Code.

- For work that began in Claude Code and should continue in Codex, use `/codex:transfer` in that Claude session, then continue the returned `codex resume <session-id>` task in Codex.
- For an independent second opinion from Codex, use the official plugin's `/codex:review` or `/codex:adversarial-review` in Claude Code instead of routing back through this skill.
- Never ask a `claude-delegate` child to invoke `/codex:*`. The default invocation disables slash commands so a Codex -> Claude -> Codex loop cannot spend quota, obscure ownership, or bypass this skill's review boundary.
- The official plugin may perform write-capable Codex rescue work when invoked from Claude Code. That is a separate user-facing workflow and does not relax this skill's read-only default or direct-write gate.

## Operating Principles

- Treat Claude output as untrusted advice or a patch proposal until Codex reviews it.
- Default to read-only analysis or patch-proposal mode. Do not let Claude write to the active worktree by default.
- Do not install Claude, log in, change Claude config, or approve Claude prompts unless the user explicitly asks and Codex approval rules allow it.
- Keep user-owned Git changes protected. Run the normal AE work Git checks before applying any output.
- Prefer isolated worktrees for any explicit write-capable delegation.

## Workflow

1. Clarify the delegation goal: analysis, review, patch proposal, or explicitly approved isolated write.
2. Run `node "$HOME/.agents/ai-agent-engine-codex/bin/ae.mjs" claude-delegate --check` from the project root.
3. If the command reports `status: skip`, tell the user Claude Code CLI is unavailable and continue with Codex-only work.
4. Build a narrow prompt that includes task scope, forbidden files, validation expectations, and output format.
5. For advice or patch proposals, run:

```powershell
node "$HOME/.agents/ai-agent-engine-codex/bin/ae.mjs" claude-delegate --prompt-file <repo-relative-file>
```

6. The default wrapper uses JSON output, no session persistence, `plan` permission, `Read,Grep,Glob` only, and disabled slash commands. It is a read-only analysis lane, not an interactive Claude session.
7. Read Claude output before using it. Reject output that ignores scope, invents facts, hides errors, touches forbidden files, or lacks test rationale.
8. If applying a proposed patch, Codex applies it manually, inspects `git diff`, and runs relevant validation.
9. Record the delegation command, result, and any rejected output in the task's AE process notes when the work is S4 or higher.

## Write Delegation Gate

Only use Claude for direct file writes when all of these are true:

- the user explicitly requests write-capable Claude delegation,
- Git/worktree checks are clean or the user accepts the risk,
- the work runs in an isolated worktree or temporary copy,
- the prompt names allowed and forbidden files,
- Codex reviews the resulting diff before merge or copy-back,
- Codex runs the validation gate before delivery.

If any gate fails, fall back to read-only or patch-proposal mode.

## Cross-Directory Read-Only Delegation

For simple project-root delegation, prefer:

```powershell
node "$HOME/.agents/ai-agent-engine-codex/bin/ae.mjs" claude-delegate --prompt-file <repo-relative-file>
```

Cross-directory audits may require direct Claude CLI arguments so the external repository is readable while the current worktree remains controlled. Keep the scope read-only and explicit, for example:

```powershell
claude -p --output-format json --no-session-persistence --permission-mode plan --tools "Read,Grep,Glob" --allowedTools "Read,Grep,Glob" --add-dir "<external-repo-path>"
```

`claude-delegate` supplies those read-only defaults when no `--claude-arg` is given. Supplying one or more `--claude-arg` values replaces the entire default argument list, so use it only for an explicit user-requested exception and preserve the no-write, no-recursion boundary. Do not pass `--dangerously-skip-permissions`, `--permission-mode bypassPermissions`, or `/codex:*` instructions through a delegated child.

If `claude-delegate` returns exit code `0` with empty stdout and empty stderr, treat the result as no usable advice, not as evidence. Retry with a narrower prompt, a summary-only request, or explicit `--claude-arg` values such as `--add-dir` and read-only `--tools "Read,Grep,Glob"`.

## Prompt Contract

Ask Claude for structured output:

- summary of reasoning,
- files it believes should change,
- proposed diff or step-by-step patch notes,
- validation commands,
- risks and assumptions.

Do not ask Claude to fabricate test results, credentials, environment state, or user decisions.

## Validation

- Availability: `node "$HOME/.agents/ai-agent-engine-codex/bin/ae.mjs" claude-delegate --check`.
- Help discovery: `node "$HOME/.agents/ai-agent-engine-codex/bin/ae.mjs" help claude`.
- Official-plugin availability in Claude Code: `claude plugins list --json`, then confirm `codex@openai-codex` is enabled with `scope: "user"` when the user needs it across projects.
- After any applied output: run the narrowest meaningful project validation and inspect `git diff`.

## Boundaries

- Do not use Claude to bypass Codex safety policies.
- Do not send secrets, private credentials, or unrelated repository content.
- Do not report Claude's answer as verified unless Codex independently verifies it.
