<!-- ae-codex:experience -->
# GSAP Motion Guidance Adaptation

## Outcome

The repository audited `greensock/gsap-skills` at commit `aed9cfd3277740755f6bfc1155c7aa645403b760` under MIT and adapted only runtime-neutral motion review methods into `ae-frontend-design`. No GSAP dependency, installer, framework snippet, or copied external skill text was added.

## Durable Decisions

- Prefer transform and opacity for movement and visibility unless layout change is itself the product behavior.
- Coordinate related motion through one timeline or state transition rather than arbitrary delay chains.
- Treat lifecycle cleanup, debounced layout refresh, reduced-motion behavior, and lowest-supported-device verification as review requirements when a target project already uses JavaScript motion.
- Keep design direction, runtime selection, and browser acceptance owned by the target project; external skill repositories provide candidate methods, not runtime authority.

## Evidence

- Requirements: `docs/ae/prds/2026-08-31-gsap-motion-guidance-adaptation-prd.md`
- Plan: `docs/ae/plans/2026-08-31-001-gsap-motion-guidance-adaptation-plan.md`
- Audit: `docs/ae/solutions/2026-08-31-gsap-skills-audit.md`
- Source tracking: `docs/ae/references/external-skill-watchlist.json`
- Distribution edits: `plugins/ai-agent-engine-codex/skills/ae-frontend-design/references/` and `.ae-source/skills/ae-frontend-design/references/`

## Validation Boundary

`npm run check`, `npm run check:smoke`, the release-note check, and `git diff --check` prove source/mirror, metadata, artifact, and installation consistency. They do not prove browser rendering, frame rate, reduced-motion behavior, or visual quality in a real application.
