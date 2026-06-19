# Claude Delegate Prompt: short AE adaptation audit

Read-only task. Do not edit files.

Current project: `D:\codes\ph-AI-Agent-Engine`
External repo clone: `C:\Users\yaogu\AppData\Local\Temp\claude-code-best-practice-audit`

Use only these files:
- Current: `AGENTS.md`, `package.json`, `docs/08-ai-memory/03-key-workflows.md`, `docs/08-ai-memory/09-multi-agent-auto-config.md`, `plugins/ai-agent-engine-codex/skills/ae-skill-audit/SKILL.md`, `plugins/ai-agent-engine-codex/skills/ae-claude-code/SKILL.md`, `plugins/ai-agent-engine-codex/skills/ae-plan/SKILL.md`, `plugins/ai-agent-engine-codex/skills/ae-agent-creator/SKILL.md`, `plugins/ai-agent-engine-codex/skills/ae-skill-creator/SKILL.md`
- External: `README.md`, `LICENSE`, `CLAUDE.md`, `reports/claude-agent-command-skill.md`, `reports/claude-skills-for-larger-mono-repos.md`, `development-workflows/cross-model-workflow/cross-model-workflow.md`, `.codex/hooks.json`, `.codex/config.toml`, `orchestration-workflow/orchestration-workflow.md`

Output exactly these sections:
1. Top 5 adaptable patterns for AE, with target AE skill/file.
2. Top 5 reject/defer patterns and why.
3. Deterministic checks or scripts AE should add.
4. License/platform risk notes.

Constraints:
- Do not recommend copying Claude hooks, sound assets, `.claude/settings.json`, or full command catalogs.
- Prefer improving existing AE skills before new skills.
- Keep it under 1200 words.
