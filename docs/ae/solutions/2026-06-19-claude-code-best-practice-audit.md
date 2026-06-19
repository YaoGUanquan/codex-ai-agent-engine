<!-- ae-codex:solution -->
# Claude Code Best Practice Audit

## Source

- Repository: `https://github.com/shanraisshan/claude-code-best-practice`
- Date: 2026-06-19
- License: MIT
- Supported harnesses: Claude Code primary; includes Claude `.claude` examples and Codex `.codex` hook/config examples.
- Primary purpose: best-practice reference, capability catalog, and demonstration repository for Claude Code agents, commands, skills, hooks, settings, memory, and cross-model workflows.

## Repository Summary

The external repository is not a library to install into AE. It is a reference corpus. Its strongest material is the taxonomy around agents, commands, skills, memory, settings, hooks, and cross-model workflows. It also includes concrete `.claude` and `.codex` configuration examples, but those are runtime-specific and should not be copied into this GPL-2.0-only Codex plugin.

The useful boundary is process design: how to decide whether a workflow should be a skill, an agent, a command-like entrypoint, a helper script, a memory rule, or a hook. The unsafe boundary is runtime behavior: Claude slash commands, hook execution, agent teams, scheduled tasks, automatic MCP loading, sound assets, permission settings, and dynamic workflows.

## Adaptable Patterns

1. Improve `ae-skill-creator` and `ae-agent-creator` with a Codex-native routing matrix.
   - External pattern: agent vs command vs skill selection.
   - AE adaptation: choose between AE skill, helper script, agent prompt, reference file, process artifact, or rejected runtime behavior.

2. Improve skill metadata guidance and validation.
   - External pattern: frontmatter catalogs for skills, commands, and agents.
   - AE adaptation: add a stable AE metadata checklist for `name`, `description`, trigger clarity, argument expectations, artifact outputs, forbidden behavior, validation, and mirror sync.

3. Improve `ae-claude-code` delegation diagnostics.
   - External pattern: cross-tool and cross-model workflows.
   - AE adaptation: document read-only `--add-dir`/tool constraints for Claude CLI audits and add empty-output or timeout diagnostics before treating delegation as useful.

4. Improve `ae-plan`, `ae-review`, and `ae-work` with an optional cross-model lane.
   - External pattern: plan with one model, review with another, implement, then verify.
   - AE adaptation: keep Codex as orchestrator; use Claude only for bounded advice or patch proposals, then require Codex review and validation.

5. Improve memory guidance under `ae-init`, `ae-save-experience`, and `ae-agent-creator`.
   - External pattern: root memory plus scoped/lazy memory.
   - AE adaptation: clarify which facts belong in `AGENTS.md`, `docs/08-ai-memory`, skill references, process notes, experience docs, and handoffs.

6. Add hook boundary documentation only.
   - External pattern: rich hook event catalogs.
   - AE adaptation: record event taxonomy and safety boundaries in docs/templates; do not enable hook execution by default.

7. Improve monorepo and large-skill-set guidance.
   - External pattern: skills for larger repositories and listing budget concerns.
   - AE adaptation: recommend path-scoped references, shorter descriptions, and narrower trigger phrases for AE skills.

8. Add audit freshness and source tracking.
   - External pattern: changelogs and updated capability references.
   - AE adaptation: external audits should record source URL, license, observed date, inspected files, and rejected runtime assumptions.

## Deterministic Engineering Patterns

- Routing matrix: every imported idea must classify as existing skill improvement, new skill, reference/template, defer, or reject.
- Metadata checklist: every AE skill should declare trigger, scope, output artifact, validation, and forbidden behavior in human-checkable terms.
- Delegation evidence: every Claude delegate run should record command, mode, result, timeout, and whether output was usable.
- Mirror integrity: plugin source and `.agents/skills` mirror must remain synchronized.
- License gate: copied text, templates, scripts, and assets require explicit compatibility notes and attribution.
- Runtime boundary filter: hook, MCP, slash-command, scheduler, and permission-system features require separate Codex-native support before adoption.

## Existing AE Skills To Improve

- `ae-skill-audit`: add external-file inspection checklist, source freshness, and runtime-boundary classification.
- `ae-skill-creator`: add metadata and trigger-quality guidance.
- `ae-agent-creator`: add decision criteria for agent prompt vs skill vs helper script.
- `ae-claude-code`: add read-only cross-directory delegation guidance and empty-output diagnostics.
- `ae-plan`: add optional cross-model review lane only when it improves risk coverage.
- `ae-review`: add evidence wording for second-model advice vs verified findings.
- `ae-save-experience`: clarify when external audit lessons become long-term memory.
- `ae-help`: surface the new boundaries without expanding into a full Claude command catalog.

## New Skill Candidates

- Defer a new `ae-extension-router` skill. The routing matrix should first live inside `ae-skill-creator` and `ae-agent-creator`. Create a separate skill only if repeated use shows the guidance is too large or crosses ownership boundaries.
- Defer a new `ae-verify` skill. Existing `ae-review`, `ae-work`, and `ae-test-browser` already cover verification paths; add a distinct skill only if project workflows need a standalone post-implementation verification entrypoint.

## Rejected Or Deferred Patterns

- Reject vendoring `.claude/settings.json`, `.claude/hooks`, sound assets, and command catalogs.
- Reject direct permission-mode defaults such as broad `Bash(*)` or danger-full-access examples.
- Defer dynamic workflows, agent teams, scheduled tasks, goal/checkpoint runtime, and remote-control behavior because Codex does not expose equivalent project-level runtime enforcement here.
- Reject automatic MCP loading. MCP use must stay explicit and tool-available in the active Codex session.
- Reject copying external prompt text or templates unless a later task performs license attribution and rewrite review.

## License Compatibility

The external repository states MIT license, which is generally compatible as reference input for this GPL-2.0-only project. Rewriting process ideas is acceptable. Copying substantial text, scripts, assets, templates, or examples would require preserving the MIT copyright and permission notice, plus a clear reason to include source-derived material. The recommended path is rewrite-only adaptation.

## Implementation Impact

- Plugin source files:
  - `plugins/ai-agent-engine-codex/skills/ae-skill-audit/SKILL.md`
  - `plugins/ai-agent-engine-codex/skills/ae-skill-creator/SKILL.md`
  - `plugins/ai-agent-engine-codex/skills/ae-agent-creator/SKILL.md`
  - `plugins/ai-agent-engine-codex/skills/ae-claude-code/SKILL.md`
  - `plugins/ai-agent-engine-codex/skills/ae-plan/SKILL.md`
  - `plugins/ai-agent-engine-codex/skills/ae-review/SKILL.md`
  - `plugins/ai-agent-engine-codex/skills/ae-save-experience/SKILL.md`
- Mirror files:
  - matching `.agents/skills/ae-*/SKILL.md` files.
- Help catalog:
  - `plugins/ai-agent-engine-codex/skills/ae-help/references/capability-catalog.json`
- Tests:
  - `tests/skill-scripts.test.mjs`
- Documentation:
  - `docs/08-ai-memory`
  - `docs/ae/solutions`
  - optional `docs/ae/templates`

## Validation Commands

```powershell
node scripts/check-skill-mirror.mjs
node scripts/check-skill-language-metadata.mjs
node scripts/check-ae-artifacts.mjs
npm.cmd test
npm.cmd run check
git diff --check
```

## Verdict

`ADAPT`: the repository contains useful workflow design and taxonomy, but the valuable material must be rewritten as Codex-native AE guidance. Runtime features should not be ported directly.

## Implementation Outcome

- Implemented in commit `3e7f01a feat: adapt Claude Code best-practice guidance`.
- Merged and pushed to `main` on 2026-06-19.
- Updated skills: `ae-skill-audit`, `ae-skill-creator`, `ae-agent-creator`, `ae-claude-code`, `ae-plan`, `ae-review`, and `ae-save-experience`.
- Added `claude-delegate` no-output diagnostics without changing write policy.
- Added focused tests in `tests/skill-scripts.test.mjs`.
- Process archive: `docs/00-process/archive/2026-06/claude-code-best-practice-audit/`.
