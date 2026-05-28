# Codex AI Agent Engine

## Purpose

Use this skill when the user wants Codex to run a disciplined software engineering workflow instead of a one-off coding answer. It turns a fuzzy request into a traceable loop of requirement clarification, implementation planning, controlled execution, review, verification, handoff, and reusable project memory.

This skill is designed for real repositories where correctness, existing project rules, user changes, and delivery evidence matter.

## When To Use

Use this skill when the user asks to:

- Build or modify a software feature from an unclear or medium-to-large requirement.
- Convert a product idea into actionable engineering work.
- Execute a full development workflow from requirement to delivery.
- Review a plan, implementation, document, or current repository changes.
- Create handoff notes for a future session.
- Save lessons learned from completed work into project memory.

Do not use this skill for tiny factual questions, single-command answers, or tasks where the user explicitly asks for only a direct explanation.

## Core Workflow

### 1. Read The Project

Before changing behavior, inspect the repository rules and existing patterns.

Priority files and directories:

- `AGENTS.md`
- `README.md`
- `docs/`
- Existing source files near the requested change
- Existing tests near the requested change

Respect local rules about encoding, documentation, validation, and archival paths.

### 2. Protect The Worktree

Check repository state before editing.

- Identify changed files.
- Do not revert user work.
- Do not overwrite unrelated changes.
- If a file already has user edits and the task also needs that file, work with the current content.
- Ask only if the existing changes make the task impossible or ambiguous.

### 3. Clarify Requirements When Needed

If the request is fuzzy, clarify the minimum necessary information:

- Goal
- User-facing behavior
- Scope boundaries
- Acceptance criteria
- Non-goals
- Risk tolerance

Prefer making reasonable assumptions for low-risk details and state them clearly.

### 4. Plan The Change

For non-trivial work, create a short implementation plan before editing.

The plan should include:

- Files or modules likely to change
- Data/API contracts affected
- Tests or verification commands
- Rollback or risk notes when relevant

Keep the plan practical. It should guide implementation, not become a separate essay.

### 5. Implement Conservatively

Follow existing project style and architecture.

- Keep edits scoped to the task.
- Prefer existing helpers and local abstractions.
- Add new abstractions only when they remove real complexity.
- Preserve public behavior unless the user requested a behavior change.
- Add comments only where they explain non-obvious decisions.

### 6. Review Before Delivery

Review the result from the perspective of bugs and regressions.

Check:

- Requirement coverage
- Edge cases
- Error handling
- Compatibility with existing patterns
- Missing tests
- Documentation drift
- Security or permission implications when relevant

### 7. Verify

Run the smallest relevant verification command available.

Examples:

- Unit tests for touched modules
- Build or compile command
- Lint/typecheck
- Browser verification for frontend work
- Targeted script for generated artifacts

If verification cannot run, explain exactly why and name the remaining risk.

### 8. Record Durable Context

For long or meaningful work, write process artifacts in the project documentation structure.

Recommended paths:

- Active process notes: `docs/00-process/active/`
- Completed archives: `docs/00-process/archive/YYYY-MM/<task-name>/`
- Long-term memory: `docs/08-ai-memory/`

Record facts, decisions, commands, and unresolved risks. Do not store secrets.

## Response Shape

When finishing a task, report:

- What changed
- Where it changed
- What was verified
- What could not be verified, if anything
- Any useful next step that directly follows from the task

Keep the final response concise and grounded in files, commands, and outcomes.

## Safety Boundaries

This skill supports legitimate software development, reverse engineering education, and security research.

It must not help with:

- Cracking commercial software
- Bypassing licenses or payments
- Credential theft
- Unauthorized access
- Malware deployment
- Destructive operations against systems the user does not own or administer

For security work, keep the workflow focused on authorized research, defensive validation, reproducible evidence, and remediation.

## Example Invocation

User:

> Use Codex AI Agent Engine to add export support to this dashboard.

Assistant behavior:

1. Reads project rules and dashboard implementation.
2. Checks Git status.
3. Clarifies export format only if not inferable.
4. Plans affected UI, API, and tests.
5. Implements the scoped change.
6. Runs targeted verification.
7. Summarizes changed files and evidence.
8. Writes handoff or memory notes if the change is large.

