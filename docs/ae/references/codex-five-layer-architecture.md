---
type: design
status: drafted
date: 2026-07-06
topic: codex-five-layer-architecture
---

# Codex Five-Layer Architecture Map

This project already implements the five-layer Codex model through existing AE paths. Use this map to place new rules without creating duplicate directories or unsupported runtime claims.

```text
User request
  -> Memory Layer: project rules and durable context
  -> Knowledge Layer: selected AE skill and references
  -> Guardrail Layer: validation, gates, templates, and evidence
  -> Delegation Layer: bounded external or subagent review when allowed
  -> Distribution Layer: plugin manifest, install scripts, and skill mirror
```

## Memory Layer

Owned paths:

- `AGENTS.md`
- `docs/08-ai-memory/`
- `docs/ai-memory/` (legacy pointer created by init before 0.3.22; kept only where it already exists)
- durable project decisions linked from `docs/ae/constitution.md`

Purpose: stable project rules, operating constraints, naming conventions, long-lived engineering decisions, and AI memory. Do not store transient command output or unfinished task notes here.

Validation:

- `node scripts/check-ae-artifacts.mjs`
- direct file review for project-rule consistency

## Knowledge Layer

Owned paths:

- `plugins/ai-agent-engine-codex/skills/*`
- `.agents/skills/*`
- skill-local `references/`
- `docs/ae/references/`

Purpose: workflow knowledge, routing rules, skill instructions, templates, schemas, and reusable context. Plugin source is canonical; `.agents/skills` is the installed mirror.

Validation:

- `node scripts/check-skill-mirror.mjs`
- `node scripts/check-skill-language-metadata.mjs`
- `node scripts/check-skill-contract.mjs`

## Guardrail Layer

Owned paths:

- `scripts/check-*.mjs`
- `scripts/ae-tools.mjs`
- `docs/ae/gates/`
- `docs/ae/templates/`
- `docs/ae/integrity/`

Purpose: deterministic validation, final gates, evidence capture, integrity corrections, and optional templates for stricter local controls.

Validation:

- `npm run check`
- `node scripts/check-ae-artifacts.mjs`
- task-specific gate commands such as `node scripts/ae-tools.mjs gate ... --write-proof`

## Delegation Layer

Owned paths:

- `plugins/ai-agent-engine-codex/skills/ae-agent-creator/`
- `plugins/ai-agent-engine-codex/skills/ae-claude-code/`
- `plugins/ai-agent-engine-codex/skills/ae-review/`
- `.codex/ae-skill-profiles.yaml` when present

Purpose: bounded agent prompts, read-only second-model review, task-analysis guidance, and controlled delegation decisions. Delegated output is advice until Codex verifies it against repository facts and validation evidence.

Validation:

- `node scripts/ae-tools.mjs task-analyze --mode plan --plan <path>`
- `node scripts/ae-tools.mjs claude-delegate --check`
- review evidence and diff inspection

## Distribution Layer

Owned paths:

- `plugins/ai-agent-engine-codex/.codex-plugin/plugin.json`
- `plugins/ai-agent-engine-codex/.mcp.json`
- `.agents/plugins/marketplace.json`
- `scripts/install-project.mjs`
- `scripts/update-ae-codex.mjs`
- `scripts/set-language.mjs`
- `scripts/set-ae-language.mjs`

Purpose: package metadata, project-level installation, update flow, language metadata, and team distribution.

Validation:

- `node scripts/check-install-smoke.mjs`
- `node scripts/ae-tools.mjs help`
- `npm run check`

## Unsupported runtime assumptions

Do not claim the current Codex environment automatically enforces these behaviors unless a concrete tool or runtime support exists in the active session:

- Claude Code slash commands or plugin marketplace behavior.
- OpenCode or Claude Code pre/post tool hooks.
- MCP auto-loading beyond the checked local `.mcp.json` state.
- Always-on subagent registries.
- Global configuration propagation outside the installed project.

When a layer idea depends on an unsupported runtime feature, rewrite it as a Codex-native process contract, validation script, or optional template.
