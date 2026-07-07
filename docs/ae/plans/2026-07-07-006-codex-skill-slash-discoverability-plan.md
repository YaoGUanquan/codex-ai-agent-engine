---
type: plan
status: drafted
date: 2026-07-07
title: codex-skill-slash-discoverability
origin: docs/ae/prds/2026-07-07-002-codex-skill-slash-discoverability-prd.md
originFingerprint: 2026-07-07-codex-skill-slash-discoverability
depth: standard
format: human-readable-plan
sharded: false
---

# Plan: codex-skill-slash-discoverability

## Source

- Source PRD: `docs/ae/prds/2026-07-07-002-codex-skill-slash-discoverability-prd.md`
- Problem frame: improve AE entrypoint discoverability in Codex through supported skill metadata and documentation, while preserving the boundary that this project does not implement OpenCode `config.command`-style slash command registration.
- Source requirements covered: R1, R2, R3, R4, R5, NFR1, NFR2, NFR3.

## AI Parse Contract

- canonicalKind: plan
- humanEquivalent: true
- stableIdsRequired: true
- noImplicitScope: true

## Scope

Implement a documentation and metadata improvement that makes core AE skills easier to find and invoke in Codex-supported skill surfaces. The plan changes skill metadata, selected skill descriptions, help/catalog/README wording, release guidance, and deterministic tests. It does not add a command registry, MCP server, global config write, hook, or deprecated prompt-shim path.

## Readiness

- Goal: Make core AE skills easier to discover through Codex skill-backed search and slash-list surfaces without claiming unsupported runtime command registration.
- Acceptance criteria:
  - Core skills `ae-prd`, `ae-plan`, `ae-brainstorm`, `ae-work`, `ae-review`, and `ae-lfg` have trigger-oriented source/mirror metadata with stable skill names or `$ae-*` prompts.
  - README/help/catalog/release notes explain skill-backed discoverability versus unsupported OpenCode dynamic slash registration.
  - Tests assert metadata drift and claim-boundary wording.
  - Local checks and install smoke pass, with manual runtime verification documented.
- Non-goals:
  - No OpenCode `config.command` port.
  - No MCP auto-loading, hook, global Codex config propagation, or always-on agent registry.
  - No primary reliance on deprecated prompt shim commands.
- Affected areas:
  - Knowledge: `plugins/ai-agent-engine-codex/skills/*`, `.agents/skills/*`, `plugins/ai-agent-engine-codex/scripts/skill-language-metadata.mjs`.
  - Guardrail: `tests/skill-scripts.test.mjs`, `scripts/check-*.mjs` validation usage.
  - Distribution: README files, release checklist, install/update metadata preservation.
  - Memory: optional long-lived note under `docs/08-ai-memory/` if implementation discovers runtime-specific evidence worth preserving.
- Validation surface:
  - `node scripts/check-skill-mirror.mjs`
  - `node scripts/check-skill-language-metadata.mjs`
  - `node scripts/check-skill-contract.mjs`
  - `node scripts/check-install-smoke.mjs`
  - `node scripts/check-ae-artifacts.mjs`
  - `npm test -- --test-name-pattern "metadata|slash|skill|install"`
  - manual fresh Codex thread check for `/` or skill-search discoverability.
- Open questions:
  - Q1 resolved in plan: update the six core workflow metadata entries first; leave non-core skills untouched unless tests show drift.
  - Q2 resolved in plan: regression tests should assert selected core skills plus general generated metadata completeness.
  - Q3 resolved in plan: manual validation should ask maintainers to open a fresh Codex thread, search `/` for `ae-plan`, and verify `$ae-plan` explicit invocation guidance remains available.

## Assumptions

- Codex skill UI/search surfaces use `SKILL.md` frontmatter and `agents/openai.yaml` metadata as discovery signals.
- The repository can validate metadata file presence and wording, but cannot deterministically prove runtime slash UI behavior without a manual Codex app check.
- Existing install/update scripts copy `agents/openai.yaml` metadata into target projects.

## Alternatives Considered

- Recommended: Improve skill-backed discoverability through metadata, descriptions, documentation, tests, and manual runtime verification.
- Alternative: Generate custom prompt shim files for `/prompts:*` commands. Rejected because this is deprecated, not project-local in the same way, and creates a second entrypoint model.
- Alternative: Attempt to mimic OpenCode `config.command` dynamic registration. Rejected because the Codex plugin boundary in this repository does not expose an equivalent stable command registry API.

## Decision Drivers

- Driver 1: Runtime claim discipline; unsupported slash registration must not be advertised.
- Driver 2: Cross-project distribution; target projects should receive improvements through existing install/update flows.
- Driver 3: Verification strength; deterministic checks should cover files, while manual runtime checks cover Codex app behavior.

## Decisions

### ADR-1 - Use Skill-Backed Discoverability

- Decision: Treat slash-list visibility as a Codex skill discoverability outcome, not as a locally implemented command registry.
- Drivers: R2, R4, NFR1.
- Alternatives: OpenCode command registry port; prompt shim files.
- Why chosen: It aligns with current repository boundaries and can be validated by metadata checks plus manual runtime observation.
- Consequences: Documentation must use precise wording such as "enabled skills may appear in skill or slash search surfaces" instead of "auto-registered slash commands."
- Follow-ups: Revisit only if Codex exposes a verified project-local command registry API.

### ADR-2 - Metadata Generator Remains Canonical

- Decision: Update `plugins/ai-agent-engine-codex/scripts/skill-language-metadata.mjs` first, then regenerate or synchronize `agents/openai.yaml` in plugin source and `.agents/skills`.
- Drivers: R1, R3, R5, NFR2.
- Alternatives: Manually edit YAML files only.
- Why chosen: The generator is the current source for language metadata; editing generated YAML alone risks drift.
- Consequences: Tests must assert generator output and source/mirror metadata remain aligned.
- Follow-ups: If metadata schema becomes richer, update the generator and checker together.

### ADR-3 - Manual Runtime Check Is Required For Slash UI Claims

- Decision: Document a fresh-thread Codex runtime observation as release guidance rather than pretending local tests prove UI behavior.
- Drivers: R3, R4, NFR3.
- Alternatives: Rely only on file checks.
- Why chosen: Slash UI behavior is owned by the active Codex app, not by this repository.
- Consequences: Release checklist gains a manual evidence item.
- Follow-ups: If a Codex CLI/app validation API appears later, replace manual observation with a deterministic check.

## Risks

- The wording could still imply exact `/ae-*` command registration; mitigate with explicit boundary language.
- Metadata text could become too long or noisy for UI search; keep short descriptions concise and tests under the existing contract limit.
- Source and mirror files could drift; require mirror and language metadata checks before delivery.

## Pre-Mortem

- Failure scenario 1: A README update says `/ae-plan` is auto-registered, causing users to expect OpenCode parity.  
  Mitigation: Add regression assertions against unsupported claim wording and review docs for claim-evidence notes.
- Failure scenario 2: Generated metadata changes are not propagated to `.agents/skills`, so target project behavior differs from local behavior.  
  Mitigation: Run `node scripts/check-skill-mirror.mjs` and `node scripts/check-skill-language-metadata.mjs`.
- Failure scenario 3: Tests pass locally but maintainers cannot find AE skills in the Codex slash UI after install.  
  Mitigation: Document a manual fresh-thread check and record the result as release evidence.

## Global Constraints

- All paths in artifacts and docs remain repository-relative.
- Do not introduce new runtime dependencies or unsupported hooks.
- Preserve GPL-2.0-only repository boundaries and existing plugin source plus `.agents/skills` mirror model.

## Implementation Units

### U1 - Strengthen Core Skill Metadata

- Goal: Improve UI metadata for core AE workflow entrypoints while keeping text concise.
- Requirements covered: R1, R3, R5, NFR2.
- Acceptance criteria covered: Core skills have source and mirror metadata whose display name, short description, and default prompt include stable skill names or direct `$ae-*` invocation paths.
- Depends on: none
- Files:
  - `plugins/ai-agent-engine-codex/scripts/skill-language-metadata.mjs`
  - `plugins/ai-agent-engine-codex/skills/ae-prd/agents/openai.yaml`
  - `plugins/ai-agent-engine-codex/skills/ae-plan/agents/openai.yaml`
  - `plugins/ai-agent-engine-codex/skills/ae-brainstorm/agents/openai.yaml`
  - `plugins/ai-agent-engine-codex/skills/ae-work/agents/openai.yaml`
  - `plugins/ai-agent-engine-codex/skills/ae-review/agents/openai.yaml`
  - `plugins/ai-agent-engine-codex/skills/ae-lfg/agents/openai.yaml`
  - `.agents/skills/ae-prd/agents/openai.yaml`
  - `.agents/skills/ae-plan/agents/openai.yaml`
  - `.agents/skills/ae-brainstorm/agents/openai.yaml`
  - `.agents/skills/ae-work/agents/openai.yaml`
  - `.agents/skills/ae-review/agents/openai.yaml`
  - `.agents/skills/ae-lfg/agents/openai.yaml`
- Forbidden files:
  - `package-lock.json`
  - `plugins/ai-agent-engine-codex/.mcp.json`
- Approach:
  - Update the six core entries in `skill-language-metadata.mjs` so descriptions mention search-relevant phrases such as requirements, PRD, plan, brainstorm, work execution, review, and full AE workflow.
  - Keep default prompts in the explicit `$ae-*` form.
  - Regenerate or manually synchronize the corresponding source and mirror `agents/openai.yaml` files using the existing renderer output.
- Tests:
  - Add or update metadata assertions in `tests/skill-scripts.test.mjs`.
- Validation:
  - `node scripts/check-skill-language-metadata.mjs`
  - `node scripts/check-skill-mirror.mjs`
- Rollback signals:
  - Metadata check reports missing or extra skills.
  - Core skill YAML no longer contains direct `$ae-*` prompts.
- Deferred to implementation:
  - Exact wording can be tuned during edit as long as it remains concise and test-covered.

### U2 - Clarify Skill Trigger Descriptions

- Goal: Make `SKILL.md` frontmatter descriptions for core workflow entrypoints easier for Codex to match without exceeding contract limits.
- Requirements covered: R1, R4, R5, NFR1.
- Acceptance criteria covered: Core skill descriptions are trigger-oriented and do not claim unsupported slash registration.
- Depends on: U1
- Files:
  - `plugins/ai-agent-engine-codex/skills/ae-prd/SKILL.md`
  - `plugins/ai-agent-engine-codex/skills/ae-plan/SKILL.md`
  - `plugins/ai-agent-engine-codex/skills/ae-brainstorm/SKILL.md`
  - `plugins/ai-agent-engine-codex/skills/ae-work/SKILL.md`
  - `plugins/ai-agent-engine-codex/skills/ae-review/SKILL.md`
  - `plugins/ai-agent-engine-codex/skills/ae-lfg/SKILL.md`
  - matching `.agents/skills/*/SKILL.md` mirror files for the same six skills
- Forbidden files:
  - unrelated skill directories
- Approach:
  - Update only frontmatter `description` lines when current trigger wording is too narrow.
  - Include explicit forms such as `/ae-plan`, `$ae-plan`, "use ae-plan", and plain-language task triggers where useful.
  - Avoid wording that says Codex registers these as commands.
- Tests:
  - Existing `check-skill-contract` description length and frontmatter checks.
  - Targeted regression assertions in `tests/skill-scripts.test.mjs` for claim-safe trigger wording.
- Validation:
  - `node scripts/check-skill-contract.mjs`
  - `node scripts/check-skill-mirror.mjs`
- Rollback signals:
  - Description exceeds 1024 characters.
  - Mirror check fails.
  - Any wording claims OpenCode-style registration.
- Deferred to implementation:
  - If a description is already strong, leave it unchanged and cover the behavior through metadata/docs.

### U3 - Update Documentation And Help Catalog Boundaries

- Goal: Replace the one-sided "no slash commands" framing with precise Codex skill-backed discoverability language.
- Requirements covered: R2, R3, R4, NFR3.
- Acceptance criteria covered: README and help/catalog text state the distinction between skill-backed discoverability and unsupported OpenCode command registration, with manual validation guidance.
- Depends on: U1
- Files:
  - `README.md`
  - `README.en.md`
  - `docs/release-checklist.md`
  - `docs/codex-port-analysis.md`
  - `plugins/ai-agent-engine-codex/skills/ae-help/SKILL.md`
  - `.agents/skills/ae-help/SKILL.md`
  - `plugins/ai-agent-engine-codex/skills/ae-help/references/capability-catalog.json`
  - `.agents/skills/ae-help/references/capability-catalog.json`
- Forbidden files:
  - `LICENSE`
  - `NOTICE.md`
- Approach:
  - Use wording: "Codex does not provide OpenCode `config.command`-style dynamic command registration; enabled Codex skills may appear in skill or slash search surfaces depending on the active Codex runtime."
  - Add manual release verification: after install/update, open a fresh Codex thread, type `/`, search `ae-plan`, and verify `$ae-plan` explicit invocation remains available.
  - Update capability catalog notes without changing capability scope.
- Tests:
  - JSON parse for capability catalog through existing `npm test` coverage.
  - Add regex assertions for supported wording and against unsupported claims.
- Validation:
  - `node scripts/ae-tools.mjs help`
  - `node scripts/check-install-smoke.mjs`
- Rollback signals:
  - Help output claims exact slash command availability without qualification.
  - Capability catalog JSON fails to parse.
- Deferred to implementation:
  - If `docs/codex-port-analysis.md` is updated, append a dated note rather than rewriting historical observations.

### U4 - Add Regression Tests And Claim Checks

- Goal: Ensure future edits do not regress metadata discoverability or runtime-boundary wording.
- Requirements covered: R4, R5, NFR2, NFR3.
- Acceptance criteria covered: At least one regression assertion covers slash-discoverability wording and forbidden unsupported claims.
- Depends on: U1, U2, U3
- Files:
  - `tests/skill-scripts.test.mjs`
  - possibly `scripts/check-skill-contract.mjs` only if existing checks cannot express the needed boundary
- Forbidden files:
  - production skill behavior files outside units U1-U3
- Approach:
  - Prefer tests in `tests/skill-scripts.test.mjs` because it already covers metadata, source/mirror equality, and documentation contracts.
  - Assert that core metadata prompts include `$ae-*`.
  - Assert README/help/catalog wording distinguishes Codex skill discoverability from OpenCode dynamic slash registration.
  - Assert forbidden unsupported wording is absent or restricted to negated boundary statements.
- Tests:
  - `npm test -- --test-name-pattern "metadata|slash|skill|install"`
  - `npm run check`
- Validation:
  - `node scripts/check-ae-artifacts.mjs`
  - full `npm run check` before delivery if implementation touches shared metadata or docs.
- Rollback signals:
  - Tests become brittle by asserting long prose instead of stable boundary phrases.
  - The check blocks legitimate negated mentions of unsupported behavior.
- Deferred to implementation:
  - If regex wording becomes too fragile, assert small stable phrases and JSON fields instead.

## Consistency Check

- implementationUnitCount: 4
- sourceRequirementsCovered: R1, R2, R3, R4, R5, NFR1, NFR2, NFR3
- sourceRequirementsDeferred: none
- openQuestionsCount: 0

## Validation Plan

- Unit:
  - `node scripts/check-skill-language-metadata.mjs`
  - `node scripts/check-skill-contract.mjs`
  - targeted `npm test -- --test-name-pattern "metadata|slash|skill|install"`
- Integration:
  - `node scripts/check-skill-mirror.mjs`
  - `node scripts/check-install-smoke.mjs`
  - `node scripts/ae-tools.mjs help`
- User flow:
  - Manual fresh Codex thread: type `/`, search `ae-plan`, search `ae-prd`, and verify explicit `$ae-plan` / `$ae-prd` invocation guidance is discoverable.
- Data / operations:
  - `node scripts/check-ae-artifacts.mjs`
  - `npm run check`
- Observability:
  - Record manual runtime observation in release notes, final delivery notes, or `docs/ae/evidence/` if the implementation workflow already writes evidence.

## Rollback / Recovery

- Revert metadata wording and regenerated YAML for the six core skills if Codex search behavior worsens or tests detect misleading claims.
- Restore prior README/help/catalog boundary wording if runtime observations contradict the updated claim.
- Keep PRD and plan as historical artifacts; if the approach is rejected during implementation, supersede with a narrower PRD rather than deleting evidence.

## Plan Self-Review

- Empty-token scan: no unfinished sections or unresolved template tokens remain.
- Consistency check: implementation units map to R1-R5 and NFR1-NFR3.
- Scope check: focused on metadata, docs, tests, and validation; no unsupported runtime registry is included.
- Acceptance coverage: each source acceptance condition maps to U1-U4 and validation commands.
- Validation gaps: runtime slash UI behavior remains manual by design and is explicitly documented.
- Alternatives and ADR check: three alternatives/decisions record why the supported skill-backed route is chosen.
- High-risk pre-mortem check: included because the primary risk is an unsupported public capability claim.

## Handoff

Recommended next workflow: `ae-review domain:document docs/ae/prds/2026-07-07-002-codex-skill-slash-discoverability-prd.md docs/ae/plans/2026-07-07-006-codex-skill-slash-discoverability-plan.md`, then `ae-work docs/ae/plans/2026-07-07-006-codex-skill-slash-discoverability-plan.md` if the document review passes.
