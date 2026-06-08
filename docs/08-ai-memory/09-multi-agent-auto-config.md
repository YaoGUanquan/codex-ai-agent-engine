<!-- ae-codex:init managed -->
# Multi-Agent Auto Config

## Stable Policy

- `multi_agent.enabled` accepts `auto`, `true`, and `false`.
- Default is `auto`.
- `enabled: auto` means analysis and recommendations only. It lets `task-analyze` report `execution_strategy`, `parallel_eligibility`, and `parallel_waves`.
- `enabled: false` is a hard off switch and forces serial execution.
- Write-agent auto parallelism is not authorized by `enabled: auto` alone.

## Safe Baseline

Use this default in target projects unless the user explicitly opts into write-agent auto parallelism:

```yaml
multi_agent:
  enabled: auto
  mode: suggest
  max_workers: 3
  min_parallel_units: 2
  require_clean_git: true
  require_plan_dependencies: true
  require_disjoint_files: true
  allow_write_agents: false
  review_lanes_parallel: true
```

## Write-Agent Opt-In

Write-agent auto parallelism requires all of these:

- `enabled` is `auto` or `true`,
- `mode: auto`,
- `allow_write_agents: true`,
- plan mode with dependency declarations,
- disjoint file ownership,
- clean Git state before delegation when `require_clean_git: true`.

## Other Project Update Path

After this feature is merged to `main`, update installed target projects with:

```bash
node scripts/update-ae-codex.mjs --repo https://github.com/YaoGUanquan/codex-ai-agent-engine.git --branch main
```

The update copies `docs/ae/templates/ae-skill-profiles.example.yaml` but does not overwrite `.codex/ae-skill-profiles.yaml`. Create or edit that local file explicitly:

```bash
mkdir -p .codex
cp docs/ae/templates/ae-skill-profiles.example.yaml .codex/ae-skill-profiles.yaml
```

Then validate with a real plan:

```bash
node scripts/ae-tools.mjs task-analyze --mode plan --plan docs/ae/plans/<your-plan>.md
```

## Known Risk

The repository validates policy loading and strategy output. Real Codex sub-agent spawning is still an orchestrator decision outside `ae-tools.mjs`, so final delegation must read the `task-analyze` output and respect blockers.
