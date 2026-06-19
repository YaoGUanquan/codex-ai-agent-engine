# Claude Delegate Prompt: summary-only review

You are a second-model reviewer. Do not read files or use tools. Use only the summary below.

Current project summary:
- `ai-agent-engine-codex` is a GPL-2.0-only Codex-native AE workflow plugin.
- It mirrors skills in `plugins/ai-agent-engine-codex/skills` and `.agents/skills`.
- It already has skills for PRD, plan, tasks, work, review, debug, skill-audit, skill-creator, agent-creator, claude-code delegation, browser testing, SQL, Swagger, handoff, and experience capture.
- Important boundaries: `/ae-*` are compatibility labels, not automatic slash commands; do not port OpenCode or Claude runtime behavior directly; preserve Codex approval model; keep plugin source and `.agents/skills` mirror synchronized; external repos are research input only.
- Existing adaptations include multi-agent auto config, minimality review guidance, OCR-style review discipline, shallow graph helpers, and Claude Code delegate support.

External repo summary:
- Source: `https://github.com/shanraisshan/claude-code-best-practice`
- License: MIT.
- It is a Claude Code best-practice/reference repo, not an application.
- It catalogs and demonstrates Claude Code agents, commands, skills, hooks, MCP, settings, memory, checkpointing, startup flags, dynamic workflows, agent teams, scheduled tasks, goal, code review, and cross-model workflows.
- It contains `.claude/agents`, `.claude/commands`, `.claude/skills`, `.claude/hooks`, `.claude/settings.json`, `.codex/config.toml`, `.codex/hooks.json`, reports, best-practice docs, and workflow demos.
- Portable ideas seen: command -> agent -> skill orchestration, explicit agent/command/skill selection criteria, skill frontmatter cataloging, agent frontmatter cataloging, memory hierarchy/lazy loading, cross-model plan/review/implement/verify split, hook event catalogs, config/schema/settings inventory, monorepo skill discovery guidance.
- Nonportable ideas: Claude-specific slash commands, Claude hook execution, settings schema, MCP auto-loading, sound assets, direct permission config, dynamic workflows, agent teams, scheduled tasks, goal/checkpoint runtime, full command/skill catalogs.

Question:
Give a concise second-opinion ranking of the top AE improvements to pursue.

Output:
1. Top 5 recommendations, each with target AE skill/file area.
2. Top 5 reject/defer items and reason.
3. One sequencing recommendation for implementation.
4. One risk that Codex may underweight.
