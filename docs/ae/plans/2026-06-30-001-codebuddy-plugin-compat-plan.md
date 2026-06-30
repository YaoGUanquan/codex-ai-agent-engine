---
type: plan
status: drafted
date: 2026-06-30
title: codebuddy-plugin-compat
depth: standard
format: human-readable-plan
sharded: false
---

# Plan: codebuddy-plugin-compat

## Source

- User request: create a long-lived `codebuddy` development branch and make the current AE plugin usable by CodeBuddy.
- Branch policy: CodeBuddy updates stay on `codebuddy` and are not intended to merge back into `main`.
- Official CodeBuddy docs inspected on 2026-06-30:
  - `https://www.codebuddy.ai/docs/cli/plugins-reference`
  - `https://www.codebuddy.ai/docs/cli/plugin-marketplaces`

## AI Parse Contract

- canonicalKind: plan
- humanEquivalent: true
- stableIdsRequired: true
- noImplicitScope: true

## Scope

Add the smallest CodeBuddy compatibility layer to the existing project-local AE plugin without changing existing Codex behavior.

## Readiness

- Goal: CodeBuddy can discover the AE plugin through a CodeBuddy-compatible manifest while Codex keeps using the existing Codex manifest.
- Acceptance criteria:
  - A `codebuddy` Git branch exists and contains the compatibility work.
  - `plugins/ai-agent-engine-codex/.codebuddy-plugin/plugin.json` exists and parses as CodeBuddy manifest JSON.
  - The CodeBuddy manifest points at existing `skills/` and `.mcp.json` component paths.
  - Existing install smoke checks verify the CodeBuddy manifest survives project installation.
  - Existing Codex checks and tests still pass.
- Non-goals:
  - Do not merge this branch into `main`.
  - Do not rewrite skills for CodeBuddy-specific behavior in this pass.
  - Do not add CodeBuddy hooks, commands, agents, LSP servers, or marketplace publication automation.
- Affected areas:
  - `plugins/ai-agent-engine-codex/.codebuddy-plugin/plugin.json`
  - `scripts/check-install-smoke.mjs`
  - `README.md`, `README.en.md`, `INSTALL.md`, `INSTALL.zh-CN.md`
  - `docs/ae/plans/2026-06-30-001-codebuddy-plugin-compat-plan.md`
- Validation surface:
  - `node scripts/check-install-smoke.mjs`
  - `npm test`
  - `npm run check`
  - `git diff --check`
- Open questions:
  - None blocking. Marketplace publication is deferred because the user requested branch-local compatibility, not publishing.

## Assumptions

- CodeBuddy accepts the documented `.codebuddy-plugin/plugin.json` manifest directory and component path fields.
- CodeBuddy can consume existing `skills/<name>/SKILL.md` directories without requiring Codex `.agents` mirrors.
- `.mcp.json` with an empty `mcpServers` object is valid enough for the current plugin because it does not ship MCP servers.

## Alternatives Considered

- Recommended: Add `.codebuddy-plugin/plugin.json` beside the existing `.codex-plugin/plugin.json` and verify installation copies it.
- Alternative: Fork the entire plugin directory into a CodeBuddy-specific package. Higher maintenance cost and immediate drift risk.
- Rejected because: A full fork is unnecessary while CodeBuddy and Codex both support `skills` and `mcpServers` component path fields.

## Decision Drivers

- Driver 1: Keep the compatibility branch isolated from `main`.
- Driver 2: Preserve current Codex install behavior.
- Driver 3: Minimize maintenance drift across duplicate skill content.

## Decisions

### ADR-1 - Add a CodeBuddy manifest only

- Decision: Add `.codebuddy-plugin/plugin.json` in the existing plugin root.
- Drivers: CodeBuddy docs define `.codebuddy-plugin/plugin.json`; existing plugin already has CodeBuddy-compatible component directories.
- Alternatives: Generate manifest during install; duplicate plugin source; use marketplace entry only with `strict: false`.
- Why chosen: It satisfies strict marketplace behavior and keeps the plugin self-describing.
- Consequences: Metadata will be duplicated between Codex and CodeBuddy manifests and must be kept aligned on this branch.
- Follow-ups: If publishing to a CodeBuddy marketplace becomes necessary, add a separate marketplace file and validation.

### ADR-2 - Validate compatibility through install smoke

- Decision: Extend the install smoke check to require the CodeBuddy manifest in installed targets.
- Drivers: The installer copies the plugin directory wholesale; smoke coverage proves target projects receive the manifest.
- Alternatives: Add a separate CodeBuddy-only checker.
- Why chosen: Existing install smoke already validates copied plugin shape and avoids a new script.
- Consequences: A missing or malformed CodeBuddy manifest blocks `npm run check` on the `codebuddy` branch.
- Follow-ups: Add a dedicated schema checker only if CodeBuddy requires stricter fields later.

## Risks

- CodeBuddy may tolerate unknown manifest fields differently from Codex. Mitigation: keep the manifest to documented metadata and component path fields.
- Some AE skills mention Codex explicitly. Mitigation: this pass enables discovery; wording adaptation can be a later CodeBuddy-branch update.
- Documentation may become branch-specific. Mitigation: state the branch policy clearly in docs.

## Pre-Mortem

- Failure scenario 1: Manifest is copied but points to a wrong skills path. Mitigation: smoke check parses and validates paths.
- Failure scenario 2: Codex checks regress because plugin structure changes unexpectedly. Mitigation: keep Codex manifest untouched and run existing checks.
- Failure scenario 3: Users expect marketplace publishing from this branch. Mitigation: document marketplace publishing as deferred.

## Global Constraints

- Keep CodeBuddy-specific work on the `codebuddy` branch.
- Do not modify existing skill behavior in this pass.
- Do not overwrite user-owned files or unrelated history.

## Implementation Units

### U1 - Branch and manifest baseline

- Goal: Add a CodeBuddy-compatible plugin manifest.
- Requirements covered: branch exists; CodeBuddy manifest exists; component paths are valid.
- Acceptance criteria covered: manifest file and path fields.
- Depends on: none
- Files:
  - `plugins/ai-agent-engine-codex/.codebuddy-plugin/plugin.json`
- Forbidden files:
  - `plugins/ai-agent-engine-codex/.codex-plugin/plugin.json`
  - `plugins/ai-agent-engine-codex/skills/**`
- Approach: Copy shared metadata from the Codex manifest where applicable, omit Codex-only `interface`, and keep `skills` plus `mcpServers` paths.
- Tests: Add failing smoke assertion before the manifest, then add the manifest.
- Validation: `node scripts/check-install-smoke.mjs`
- Rollback signals: CodeBuddy manifest path missing, invalid JSON, or wrong component paths.
- Deferred to implementation: marketplace publishing.

### U2 - Install smoke coverage

- Goal: Ensure target project installs preserve the CodeBuddy manifest.
- Requirements covered: installed target contains parseable CodeBuddy manifest.
- Acceptance criteria covered: install smoke verifies manifest copy and fields.
- Depends on: U1
- Files:
  - `scripts/check-install-smoke.mjs`
- Forbidden files:
  - `scripts/install-project.mjs`
- Approach: Extend existing expected paths and parse the installed manifest for `name`, `skills`, and `mcpServers`.
- Tests: `node scripts/check-install-smoke.mjs`
- Validation: `npm run check`
- Rollback signals: install smoke fails in temporary target or validates wrong path.
- Deferred to implementation: dedicated schema validator.

### U3 - Branch-specific usage docs

- Goal: Document CodeBuddy branch usage and branch policy.
- Requirements covered: future CodeBuddy updates stay on `codebuddy`.
- Acceptance criteria covered: docs mention CodeBuddy manifest and non-merge policy.
- Depends on: U1
- Files:
  - `README.md`
  - `README.en.md`
  - `INSTALL.md`
  - `INSTALL.zh-CN.md`
- Forbidden files:
  - none
- Approach: Add concise CodeBuddy notes without rewriting existing Codex installation sections.
- Tests: `git diff --check`
- Validation: `npm run check`
- Rollback signals: docs imply `main` branch support or marketplace publication.
- Deferred to implementation: full CodeBuddy walkthrough.

## Consistency Check

- implementationUnitCount: 3
- sourceRequirementsCovered: branch creation, CodeBuddy format compatibility, branch-only update policy
- sourceRequirementsDeferred: marketplace publishing, CodeBuddy-specific skill copywriting
- openQuestionsCount: 0

## Validation Plan

- Unit: `node scripts/check-install-smoke.mjs`
- Integration: `npm test`; `npm run check`
- User flow: inspect installed temporary target through smoke check
- Data / operations: no persistent data changes
- Observability: final gate JSON from `node scripts/ae-tools.mjs gate`

## Rollback / Recovery

Delete `.codebuddy-plugin/plugin.json`, revert smoke/doc changes, and switch away from the `codebuddy` branch if CodeBuddy compatibility is no longer desired.

## Plan Self-Review

- Placeholder scan: pass; no TODO/TBD placeholders.
- Consistency check: pass; all units map to acceptance criteria.
- Scope check: pass; no skill behavior rewrite or marketplace publication included.
- Acceptance coverage: pass; branch, manifest, install validation, and docs are covered.
- Validation gaps: no live CodeBuddy runtime invocation available in this workspace.
- Alternatives and ADR check: pass; fork and marketplace-only paths rejected.
- High-risk pre-mortem check: pass; risk is low and limited to packaging metadata.

## Handoff

Execute serially on `codebuddy`: U2 red check, U1 manifest, U3 docs, then validation and review.
