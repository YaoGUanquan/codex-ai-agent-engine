---
type: prd
status: completed
date: 2026-07-28
topic: frontend-motion-governance
format: human-readable-requirements
sharded: false
---

# Frontend Motion Governance PRD

## AI Parse Contract

- canonicalKind: requirements
- humanEquivalent: true
- stableIdsRequired: true
- noImplicitScope: true

## Problem Frame

`ae-frontend-design`, `ae-web-forge`, and `ae-test-browser` already provide a Codex-native path from UI intent to browser evidence. Their current contract does not explicitly govern when visual motion is justified, how reduced-motion behavior must work, or how reviewers see the final state. The outcome is a focused extension that makes those decisions explicit without changing a target application's design language or installing a frontend runtime into this plugin.

## Requirements

**Intentional Motion**

- R1. The frontend-design workflow shall require a task-relevant purpose or a documented static alternative before recommending motion, animation assets, or 3D rendering.
  Acceptance: The workflow guidance rejects decorative motion as the default and describes the static/default path.
- R2. The workflow shall preserve the target project's design system, components, stack, and visual baseline before applying generic design references or external examples.
  Acceptance: The guidance makes target-project conventions controlling constraints.
- R3. The workflow shall require a reduced-motion or equivalent platform-respecting alternative and a usable completion state for material motion.
  Acceptance: The design guidance and browser acceptance guidance both name the requirement.
- R4. The workflow shall distinguish proportionate implementation categories for state feedback, timeline motion, exported animation assets, and 3D/data visualization without mandating a dependency.
  Acceptance: The guidance identifies each category and labels dependencies as target-project choices.

**Acceptance And Traceability**

- R5. Browser acceptance for a UI with material motion shall exercise the relevant interaction, confirm the completion state, check the reduced-motion branch where supported, and retain existing console/network evidence.
  Acceptance: The browser reference defines required evidence and an explicit unverified-state report when it cannot be obtained.
- R6. Web Forge routing output shall expose the motion decision and the reduced-motion verification status when relevant.
  Acceptance: The report format contains fields for both pieces of evidence.
- R7. The distributed change shall be mirrored, versioned, and regression-tested without making unsupported Codex, OpenCode, or external-runtime claims.
  Acceptance: Both skill roots, the plugin version pair, focused tests, and standard validation checks agree.

## Non-Functional Requirements

- NFR1. Do not add a runtime frontend dependency, lockfile entry, external visual asset, or a new skill entrypoint.
  Acceptance: The diff contains only existing skill/test/reference/version artifacts and no dependency or new-skill changes.
- NFR2. Default behavior shall be static UI or lightweight state feedback; animation libraries, Lottie, particles, and 3D shall be conditional and purpose-bound.
  Acceptance: The guidance states this ordering and prohibits decorative particle backgrounds for ordinary app surfaces.
- NFR3. Any external material shall be rewritten as a process rule with provenance, not copied as code, tokens, prompts, or visual assets.
  Acceptance: The final diff contains no vendored external material and documents only local workflow behavior.

## Success Criteria

- The three existing skills form a consistent decision-to-evidence loop for motion-sensitive UI work.
- A future implementer can explain why motion exists, prove the final state works, and identify the reduced-motion result.
- The plugin remains installable and truthful without new runtime assumptions.

## Scope Boundary

### In Scope

- Existing frontend design, Web Forge, and browser acceptance instructions and their mirrored reference files.
- A focused test contract that protects the new instructions.
- Synchronized patch-version metadata required for distribution.

### Out Of Scope

- Any target application, page, component, library installation, or asset acquisition.
- A default Apple/HIG skin, a standalone motion skill, or platform-specific runtime automation.
- Performance targets that cannot be established across arbitrary target repositories.

### Constraints

- Plugin source and `.agents` mirrors must remain identical.
- Existing Codex-native runtime boundaries, help behavior, and browser-tool routing remain unchanged.
- Root and plugin manifest SemVer values must remain identical after a distributable content change.

## Key Decisions

- D1. Improve existing frontend skills rather than adding a new one.
  Reason: Existing routes already assign UI implementation and browser acceptance ownership.
- D2. Make static UI the default and require purpose for material motion.
  Reason: This protects dense operational experiences and limits unnecessary runtime cost.
- D3. Keep libraries out of plugin dependencies.
  Reason: They are optional target-application implementation choices, not workflow infrastructure.
- D4. Include reduced-motion and completion-state evidence in the existing acceptance loop.
  Reason: A visual effect is only acceptable when the outcome remains usable and inspectable.

## Dependencies And Assumptions

### Dependencies

- Existing skill mirrors, validation scripts, and `tests/skill-scripts.test.mjs`.
- Browser or Playwright capability in a target project for motion-sensitive acceptance.

### Assumptions

- The user-approved audit provides sufficient external-reference evidence; no external source needs vendoring or installation. The fixed source snapshots in Evidence Notes remain the provenance for the two license-bound conclusions used by this PRD.
- `0.3.3` is available as the next patch version at implementation time; execution must recheck both version files before editing.

## Open Questions

- None blocking. Target-project browser support and performance budgets must be recorded when a concrete UI uses motion.

## Evidence Notes

- Current frontend routing and acceptance contracts -> `.agents/skills/ae-frontend-design/SKILL.md`, `.agents/skills/ae-web-forge/SKILL.md`, `.agents/skills/ae-test-browser/SKILL.md`.
- Current validation and distribution rules -> `AGENTS.md`, `package.json`, `plugins/ai-agent-engine-codex/.codex-plugin/plugin.json`, and `docs/ae/constitution.md`.
- Apple-Hig-Designer reference -> `https://github.com/axiaoge2/Apple-Hig-Designer` at `ff17b91ff2903ecd52940afabf97de5a73c9cd1b`; its fixed [LICENSE](https://raw.githubusercontent.com/axiaoge2/Apple-Hig-Designer/ff17b91ff2903ecd52940afabf97de5a73c9cd1b/LICENSE) states MIT. Only rewritten process guidance is in scope.
- animate.css exclusion -> `https://github.com/animate-css/animate.css` at `3f8ab233dbbd9d2fe577528d2296382954be3d1a`; its fixed [LICENSE](https://raw.githubusercontent.com/animate-css/animate.css/3f8ab233dbbd9d2fe577528d2296382954be3d1a/LICENSE) states Hippocratic License 2.1, so it is not a direct-copy candidate for this GPL-2.0-only project.
- Version-pair evidence -> `tests/skill-scripts.test.mjs` test `root package and plugin manifest keep synchronized distribution versions` checks root/manifest parity; `scripts/check-install-smoke.mjs` compares the installed manifest to the source manifest.

## Consistency Check

- requirementsCount: 7
- nonFunctionalRequirementsCount: 3
- decisionsCount: 4
- openQuestionsCount: 0
