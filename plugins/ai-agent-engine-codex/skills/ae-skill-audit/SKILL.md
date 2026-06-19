---
name: ae-skill-audit
description: Use when the user asks to audit an external agent, skill, Claude Code, Codex, OpenCode, Cursor, or AI workflow repository and decide what can be adapted into local AE skills without copying external runtime behavior.
---

# AE Skill Audit

Audit external agent and skill repositories, then translate useful patterns into Codex-native AE improvement options.

## Operating Principles

- Treat external repositories as reference input, not implementation to copy.
- Prefer reusable workflow judgment over bulk-importing large skill catalogs.
- Separate platform-specific runtime features from portable methods.
- Keep recommendations compatible with this project's skill mirror, language metadata, help catalog, and Codex approval model.

## Workflow

1. Identify the external source, license, supported harnesses, and primary capability model.
2. Inspect the repository structure: skills, agents, hooks, commands, MCP, docs, installer scripts, manifests, deterministic engineering mechanisms, and license metadata.
3. Compare the external model with current AE boundaries: `ae-ideate`, `ae-brainstorm`, `ae-plan`, `ae-work`, `ae-review`, `ae-skill-creator`, `ae-agent-creator`, `ae-save-experience`, and `ae-help`.
4. Classify findings using `references/audit-template.md`, including deterministic engineering patterns and license compatibility before recommending reuse.
5. Recommend one of:
   - improve an existing AE skill,
   - create a new narrowly scoped AE skill,
   - add a reference/template only,
   - reject or defer because the pattern does not fit Codex or AE.
6. If the user asks to implement a recommendation, route to `ae-skill-creator` or `ae-work` and preserve the plugin source plus `.agents/skills` mirror.

## Runtime Boundary Filter

For every external repository, record the source URL, license, observed date or commit when available, and inspected files before recommending adaptation. Treat source freshness as evidence: stale examples may still contain useful process ideas, but they should not define current Codex behavior without local verification.

Classify each finding into portable method, local deterministic mechanism, or runtime-specific behavior:

- portable method: planning gates, review contracts, evidence capture, source freshness checks, routing criteria, schema validation, dry-run previews, and bounded tool access that can be rewritten as AE guidance;
- local deterministic mechanism: helper scripts or checks that can run under this repository's `scripts/` and validation model;
- runtime-specific behavior: Claude Code or OpenCode hooks, slash commands, MCP auto-loading, schedulers, permission presets, sounds, status lines, settings, or agent registries that Codex cannot enforce here.

Reject direct ports of runtime-specific behavior unless the current Codex environment has an equivalent enforcement point. If a useful idea comes from such behavior, rewrite only the process contract and note the rejected runtime assumption and license impact.

## Fit Criteria

Good candidates:

- strengthen planning, review, verification, safety, handoff, or skill governance,
- reduce repeated manual judgment across projects,
- can be expressed as Codex skill instructions or local scripts without relying on unavailable hooks,
- have clear trigger conditions and validation expectations.
- expose deterministic engineering patterns such as file selection, schema validation, routing contracts, evidence capture, reflection or filtering passes, dry-run previews, or bounded tool access that can be rewritten as AE guidance.

Poor candidates:

- require copying proprietary or license-incompatible text,
- depend on Claude Code or OpenCode hook behavior that Codex cannot enforce,
- duplicate an existing AE skill without a clear boundary improvement,
- expand the plugin into unrelated business, marketing, or personal productivity catalogs.
- require source-derived templates, prompts, scripts, or assets whose license is missing, unclear, or incompatible with this GPL-2.0-only project.

## Multi-Agent Use

Do not spawn sub-agents unless the user explicitly allows parallel agent work. When allowed, split the audit into independent lanes:

- external repository lane: structure, capabilities, license, and runtime assumptions,
- AE fit lane: current skill overlap, mirror/catalog impact, and validation,
- risk lane: licensing, platform mismatch, duplication, and maintenance cost.

Each lane is read-only unless the user separately asks for implementation.

## Output

Return a concise decision report:

- external repository summary,
- adaptable patterns,
- deterministic engineering patterns,
- existing AE skills to improve,
- new skill candidates,
- rejected patterns and reasons,
- license compatibility notes,
- implementation impact: files, metadata, validation commands,
- recommended next step.
