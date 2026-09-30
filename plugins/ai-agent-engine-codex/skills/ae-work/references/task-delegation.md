# Task Delegation

Before helper commands, resolve `aeEntry` using the [runtime entry contract](../../ae-help/references/runtime-entry.md).

## Task Analysis

For a plan file, run:

```powershell
node "$aeEntry" task-analyze --mode plan --plan <path>
```

For a plain task, run:

```powershell
node "$aeEntry" task-analyze --mode scan --task "<description>"
```

Use the result to choose inline, serial, or parallel execution. Spawn sub-agents only when the user explicitly allowed parallel agent work and file ownership is disjoint. Use `work-subagent-template.md` for delegated prompts.

If `.codex/ae-skill-profiles.yaml` contains `multi_agent.enabled: auto` or `multi_agent.enabled: true`, treat `task-analyze` as the source of truth for `execution_strategy`, `read_parallel_eligibility`, `write_parallel_eligibility`, `parallel_waves`, and each worker request's `owned_files`, `read_only_files` and `forbidden_files`. Unit `files` may include read-only evidence and must not be copied wholesale into write ownership. `parallel_eligibility` remains a compatibility summary and must not be used as the sole write-worker gate.

- `auto` enabled state means automatically analyze whether parallel work is safe. It does not mean scripts spawn agents.
- `suggest` mode may recommend waves, but the orchestrating agent must still decide whether to spawn sub-agents.
- `review_only` mode allows `read_parallel_eligibility.can_parallelize` and parallel read-only review lanes, but keeps write workers disabled.
- `auto` mode is eligible for write workers only when `write_parallel_eligibility.config_allows_write_agents` is true, `write_parallel_eligibility.blockers` is empty, the Pre-Edit Gate confirmed a clean safe branch, plan units declare dependencies, and file ownership is disjoint.
- `write_parallel_eligibility.can_spawn_write_agents_now` is false until the orchestrating agent has independently completed the Pre-Edit Gate for the current worktree.
- `multi_agent.enabled: false` is a hard off switch and must force serial execution.
- Immutable document pages remain read-only in both scan and plan mode, including explicit `--include-document-pages`. Pass `read_only_files` and `forbidden_files` to workers; update the owning document through lifecycle commands, never old pages directly.
- Never force a minimum of three workers. Use no more than the safe units in the current wave and no more than `multi_agent.max_workers`.
- If `read_parallel_eligibility.blockers` or `write_parallel_eligibility.blockers` are non-empty for the lane you intend to use, fall back to serial execution or report the blocker instead of guessing.
