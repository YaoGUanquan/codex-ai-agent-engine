---
type: prd
status: completed
date: 2026-07-07
topic: codex-skill-slash-discoverability
format: human-readable-requirements
sharded: false
---

# Codex Skill Slash Discoverability

## AI Parse Contract

- canonicalKind: requirements
- humanEquivalent: true
- stableIdsRequired: true
- noImplicitScope: true

## Problem Frame

AI Agent Engine for Codex currently states that `/ae-*` names are compatibility labels and that Codex does not auto-register OpenCode-style slash commands. That boundary remains correct, but it under-describes a supported Codex behavior: enabled skills may be discoverable through Codex skill UI and slash-command search surfaces when their metadata and descriptions are clear.

The desired outcome is to improve AE workflow entrypoint discoverability in Codex without claiming unsupported OpenCode `config.command` behavior. Users should be able to find and invoke core AE skills more easily through supported Codex skill mechanisms, while documentation and validation make the runtime boundary explicit.

## Requirements

**Discoverability**
- R1. Core AE workflow skills must use trigger-oriented descriptions and UI metadata that improve Codex skill search and slash-list discoverability.  
  Acceptance: `ae-prd`, `ae-plan`, `ae-brainstorm`, `ae-work`, `ae-review`, and `ae-lfg` have source and mirror metadata whose display name, short description, and default prompt include the stable skill name or a direct `$ae-*` invocation path.
- R2. Public documentation must explain the supported distinction between Codex skill-backed discoverability and OpenCode dynamic slash command registration.  
  Acceptance: README and help/catalog text state that enabled Codex skills may appear in slash command or skill search surfaces, but that the project does not implement OpenCode `config.command`-style auto-registration.
- R3. The installation and update path must preserve the improved metadata in target projects.  
  Acceptance: install/update validation confirms `agents/openai.yaml` files are copied for source and mirror skills, and release guidance tells maintainers how to verify the installed metadata in a fresh Codex thread.

**Boundary And Evidence**
- R4. Runtime capability claims must be evidence-linked and must not promote assumptions into product claims.  
  Acceptance: any mention of slash behavior is paired with an evidence note or validation step, and wording must not claim Codex command auto-registration unless a real Codex API exists and is verified.
- R5. Validation must catch metadata drift between plugin source, `.agents/skills` mirror, and generated language metadata.  
  Acceptance: existing or updated checks cover source/mirror equality, language metadata completeness, and at least one regression assertion for slash-discoverability wording.

## Non-Functional Requirements

- NFR1. Compatibility: The change must stay compatible with current Codex plugin and skill loading behavior.  
  Acceptance: no new runtime dependency, MCP server, hook, global config write, or OpenCode-specific command registry is required.
- NFR2. Maintainability: The change must fit the existing source/mirror/metadata model.  
  Acceptance: plugin source remains canonical, `.agents/skills` remains the local mirror, and generated metadata continues to use `plugins/ai-agent-engine-codex/scripts/skill-language-metadata.mjs`.
- NFR3. Verification: The change must be verifiable with local deterministic checks plus one manual runtime observation.  
  Acceptance: planned verification includes `node scripts/check-skill-mirror.mjs`, `node scripts/check-skill-language-metadata.mjs`, `node scripts/check-skill-contract.mjs`, `node scripts/check-install-smoke.mjs`, and a manual fresh-thread `/` or skill-search check.

## Success Criteria

- Users can discover core AE entrypoints more easily in Codex by searching skill names such as `ae-plan`, `ae-prd`, or `ae-brainstorm`.
- Documentation no longer frames slash behavior only as unavailable; it precisely distinguishes supported Codex skill discoverability from unsupported OpenCode dynamic slash registration.
- Target projects installed or updated from this repository receive the same metadata and verification guidance.
- The repository keeps claim discipline: no unsupported runtime behavior is advertised as implemented.

## Scope Boundary

### In Scope

- Improve core skill `SKILL.md` descriptions when needed for trigger clarity.
- Improve `agents/openai.yaml` source data through the existing language metadata generator.
- Update README/help/catalog/release checklist wording about Codex skill-backed discoverability.
- Add or update deterministic tests for metadata and claim wording.
- Add manual verification guidance for a fresh Codex conversation.

### Out Of Scope

- Implementing OpenCode `config.command` or dynamic slash command registration.
- Adding MCP auto-loading, hooks, global Codex configuration propagation, or always-on agent registries.
- Creating deprecated Codex prompt shim files as the primary path.
- Changing unrelated AE workflow behavior.

### Constraints

- Keep all paths repository-relative in artifacts and docs.
- Preserve source and mirror skill synchronization.
- Treat official Codex slash-command behavior as an externally verified capability, not as a local implementation detail.
- Do not claim `/ae-*` exact command names are guaranteed by Codex UI unless manually verified in the active runtime.

## Key Decisions

- D1. Use Codex skill-backed discoverability rather than OpenCode-style command registration.  
  Reason: The current Codex project model exposes skills and skill metadata, while existing project evidence rejects OpenCode runtime command injection as non-portable.
- D2. Make metadata and documentation the first implementation surface.  
  Reason: Existing installation, update, mirror, language metadata, and smoke-check tooling already distribute and validate this surface across projects.
- D3. Require manual runtime observation for slash-list claims.  
  Reason: The repository can deterministically validate metadata files, but only the active Codex app can prove whether enabled skills appear in the slash UI for a given version/session.

## Dependencies And Assumptions

### Dependencies

- `plugins/ai-agent-engine-codex/scripts/skill-language-metadata.mjs`
- `scripts/check-skill-mirror.mjs`
- `scripts/check-skill-language-metadata.mjs`
- `scripts/check-skill-contract.mjs`
- `scripts/check-install-smoke.mjs`
- README and capability catalog documentation.

### Assumptions

- Codex supports explicit `$skill` invocation and may surface enabled skills in skill or slash-command search surfaces in current app versions.
- Skill search quality is affected by `SKILL.md` frontmatter descriptions and `agents/openai.yaml` UI metadata.
- Target projects consume metadata through the existing install/update scripts.

## Open Questions

### Must Resolve Before Planning

- None.

### Deferred To Planning

- Q1. [Affects R1][technical] Which exact core skill metadata strings should change while staying concise enough for UI display?
- Q2. [Affects R5][technical] Should regression coverage assert only selected core skills or all AE workflow skills for `$ae-*` prompts?
- Q3. [Affects R3][manual-validation] What exact manual runtime check should release notes ask maintainers to perform in Codex?

## Evidence Notes

- Current boundary docs -> Evidence: `README.md`, `README.en.md`, `docs/codex-port-analysis.md`, and `plugins/ai-agent-engine-codex/skills/ae-help/SKILL.md`.
- Existing metadata generator -> Evidence: `plugins/ai-agent-engine-codex/scripts/skill-language-metadata.mjs`.
- Existing metadata checks -> Evidence: `scripts/check-skill-language-metadata.mjs`, `scripts/check-skill-mirror.mjs`, and `tests/skill-scripts.test.mjs`.
- Unsupported runtime assumptions list -> Evidence: `docs/ae/references/codex-five-layer-architecture.md`.

## Consistency Check

- requirementsCount: 5
- nonFunctionalRequirementsCount: 3
- decisionsCount: 3
- openQuestionsCount: 3

## Completion Notes

- Completed on 2026-07-07 with commits `60d05c2` and `67896d0`.
- R1 was completed by strengthening the six core workflow entrypoints `ae-prd`, `ae-plan`, `ae-brainstorm`, `ae-work`, `ae-review`, and `ae-lfg` so their source and mirror metadata carry stable skill names and direct `$ae-*` prompts. Their `SKILL.md` frontmatter descriptions now also include explicit `ae-*`, `/ae-*`, `$ae-*`, and `use ae-*` trigger forms.
- R2 and R4 were completed by updating README/help/catalog wording to distinguish Codex skill-backed discoverability from unsupported OpenCode `config.command` registration.
- R3 was completed for repository distribution by preserving source/mirror `agents/openai.yaml` metadata through the existing install/update validation path.
- R5 was completed by adding regression coverage in `tests/skill-scripts.test.mjs` for core workflow trigger signals and slash-command boundary wording.
- NFR1 and NFR2 were preserved: no new runtime dependency, MCP server, hook, global config write, or command registry was added.
- NFR3 is locally verified by deterministic checks; the manual fresh Codex App `/` or skill-search observation remains external runtime evidence, not a repository guarantee.

## Completion Evidence

- PRD: `docs/ae/prds/2026-07-07-002-codex-skill-slash-discoverability-prd.md`
- Plan: `docs/ae/plans/2026-07-07-006-codex-skill-slash-discoverability-plan.md`
- Final pushed commit: `67896d0 feat: strengthen AE skill trigger metadata`
- Prior documentation commit: `60d05c2 docs: clarify Codex skill discoverability`
- Gate: `docs/ae/gates/20260707T095627Z-work-final.json`
- Validation:
  - `npm test`
  - `npm run check`
  - `git diff --check`

## Residual Runtime Evidence

- Manual Codex App verification is still required before claiming that `/` search visibly lists `ae-plan`, `ae-prd`, or other AE skills in a specific app/session.
- The stable product claim remains: AE improves Codex skill-backed discoverability through metadata and descriptions; it does not implement OpenCode-style slash command registration.
