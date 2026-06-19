# Claude Delegate Prompt: claude-code-best-practice audit

You are a read-only reviewer. Do not edit files.

Context:
- Current project root: `D:\codes\ph-AI-Agent-Engine`
- External repo clone: `C:\Users\yaogu\AppData\Local\Temp\claude-code-best-practice-audit`
- Current project is `ai-agent-engine-codex`, a GPL-2.0-only Codex-native AE workflow plugin with mirrored skills under `plugins/ai-agent-engine-codex/skills` and `.agents/skills`.
- External source: `https://github.com/shanraisshan/claude-code-best-practice`, MIT license.

Task:
Audit the external repository as reference input only. Decide what can optimize the current AE project without copying Claude-specific runtime behavior or source text.

Read these current-project files first:
- `AGENTS.md`
- `package.json`
- `docs/08-ai-memory/03-key-workflows.md`
- `docs/08-ai-memory/09-multi-agent-auto-config.md`
- `docs/08-ai-memory/10-minimality-review.md`
- `docs/08-ai-memory/11-ocr-review-guidance.md`
- `plugins/ai-agent-engine-codex/skills/ae-skill-audit/SKILL.md`
- `plugins/ai-agent-engine-codex/skills/ae-claude-code/SKILL.md`
- `plugins/ai-agent-engine-codex/skills/ae-plan/SKILL.md`
- `plugins/ai-agent-engine-codex/skills/ae-agent-creator/SKILL.md`
- `plugins/ai-agent-engine-codex/skills/ae-skill-creator/SKILL.md`
- `plugins/ai-agent-engine-codex/skills/ae-help/references/capability-catalog.json`

Read these external files first:
- `README.md`
- `LICENSE`
- `CLAUDE.md`
- `best-practice/claude-subagents.md`
- `best-practice/claude-skills.md`
- `best-practice/claude-commands.md`
- `best-practice/claude-memory.md`
- `best-practice/claude-settings.md`
- `reports/claude-agent-command-skill.md`
- `reports/claude-skills-for-larger-mono-repos.md`
- `development-workflows/cross-model-workflow/cross-model-workflow.md`
- `.codex/hooks.json`
- `.codex/config.toml`
- `.claude/settings.json`
- `orchestration-workflow/orchestration-workflow.md`

Output format:
1. Summary of the external repository's capability model.
2. Top 8 portable patterns for AE, each with target existing AE skill or proposed new narrow skill.
3. Deterministic engineering mechanisms worth adapting.
4. Patterns to reject/defer due to Claude-specific runtime or maintenance risk.
5. License compatibility notes.
6. Concrete implementation impact: files to change, tests/validation commands.
7. Recommended sequencing for a future implementation plan.

Constraints:
- Prefer improving existing AE skills before proposing new skills.
- Do not recommend vendoring `.claude` hooks, sound assets, or command catalogs.
- Do not report external claims as facts unless you saw them in the files.
- Keep recommendations Codex-native and compatible with the current project's approval and mirror model.
