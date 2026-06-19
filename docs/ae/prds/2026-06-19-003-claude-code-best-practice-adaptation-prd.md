---
type: prd
status: drafted
date: 2026-06-19
topic: claude-code-best-practice-adaptation
---

# PRD: Claude Code Best Practice Adaptation

## Goal

Improve AE for Codex by adapting portable workflow patterns from `shanraisshan/claude-code-best-practice` without copying Claude Code runtime behavior, large catalogs, prompts, hook assets, or permission settings.

## Affected Systems

- AE skill authoring and audit workflows.
- Claude Code delegation workflow.
- Planning/review workflow guidance.
- Long-term memory and external audit documentation.
- Source and mirror skill synchronization.

## Functional Requirements

1. External agent/skill audits must classify portable guidance separately from runtime-specific behavior.
2. AE skill and agent creation guidance must include a routing matrix for choosing skill, agent prompt, helper script, reference/template, or rejection.
3. AE skill metadata guidance must make trigger clarity, scope, outputs, validation, forbidden behavior, and mirror sync explicit.
4. Claude delegation guidance must explain read-only cross-directory analysis limits and require usable-output evidence before treating Claude advice as valid.
5. Cross-model workflow guidance must keep Codex as orchestrator and reviewer, with Claude output treated as untrusted advice until reviewed.
6. Memory guidance must distinguish `AGENTS.md`, `docs/08-ai-memory`, process notes, handoff docs, experience docs, and skill references.
7. Help/catalog updates must stay concise and must not become a full Claude Code feature catalog.

## Acceptance Criteria

- A future implementation can update existing AE skills before proposing any new skill.
- Every changed skill has matching plugin source and `.agents/skills` mirror content.
- Tests fail if the new audit/routing/delegation guidance is removed from source or mirror skills.
- Documentation records license compatibility and rejected runtime assumptions.
- Validation commands include mirror, metadata, AE artifact, test, check, and diff whitespace gates.

## Non-Goals

- Do not vendor `.claude` commands, agents, hooks, settings, sound assets, or examples.
- Do not add Claude Code runtime dependencies to this project.
- Do not enable Codex hooks, MCP auto-loading, scheduled tasks, dynamic workflows, or broad permission defaults.
- Do not create a new skill unless existing skill boundaries cannot hold the guidance.

## Constraints

- Current project license is `GPL-2.0-only`.
- External repository license is MIT; copied source-derived material would need attribution and notice.
- Project-local Codex approval and mirror model must remain intact.
- `ae-plan` is planning-only and must not implement code.

## Validation Expectations

```powershell
node scripts/check-skill-mirror.mjs
node scripts/check-skill-language-metadata.mjs
node scripts/check-ae-artifacts.mjs
npm.cmd test
npm.cmd run check
git diff --check
```

## Assumptions

- The external repository is used as research input only.
- Existing AE skills can absorb the first implementation pass.
- Claude Code CLI delegation remains optional and bounded.

## Open Questions

- Should `ae-claude-code` grow CLI flags for `--add-dir` and read-only tool allowlists, or only document direct `claude -p` fallback patterns?
- Should routing guidance become a standalone template under `docs/ae/templates`, or stay embedded in skill instructions?
