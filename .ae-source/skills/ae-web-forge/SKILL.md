---
name: ae-web-forge
description: Use when the user asks for AE web forge, /ae-web-forge, unified frontend/web routing, design-to-implementation web work, frontend workflow orchestration, browser-accepted UI delivery, or deciding between AE frontend and web app skills.
---

# AE Web Forge

Route frontend and light web-app work through the smallest Codex-native AE workflow. This skill coordinates existing skills; it is not an OpenCode agent runtime.

## Target Check

Run a target existence check before routing:

1. Extract explicit paths, routes, page names, screenshot paths, Figma/design links, or output hints from the user request.
2. Inspect matching repository files when the target appears to exist.
3. If an existing target is found but the user did not say whether to modify, replace, or create a new variant, ask one focused question before editing.

## Four-Question Routing

Answer the questions in order and record the result in the work summary:

| Question | Meaning | Codex-native route |
| --- | --- | --- |
| Q1 existing route or second-development? | Does the task modify an existing page, route, component, HTML file, or user-provided target? | Read the current implementation first and preserve structure unless replacement is requested. |
| Q2 design input? | Is there no design input, a screenshot, a Figma URL, a written visual spec, or an existing visual baseline? | Use `ae-frontend-design` for focused UI creation or visual matching. Preserve design input as a constraint. |
| Q3 backend or API interaction? | Does the task need state, forms, API calls, auth, persistence, or error handling? | Use `ae-web-app`; coordinate `ae-backend` or `ae-sql` when server or data contracts change, and hold both sides to the API contract checklist in `ae-backend`. |
| Q4 visual baseline? | For Q1=yes, should current visuals be preserved or intentionally replaced? | Preserve by default; redesign only when requested or required by the goal. |

Typical outcomes:

- New UI only: `ae-frontend-design` -> `ae-test-browser`.
- New UI plus interaction/API: `ae-web-app` -> `ae-test-browser`.
- Existing route logic change: `ae-web-app`, preserving Q4 baseline -> `ae-test-browser`.
- Visual implementation from screenshot/Figma: `ae-frontend-design` with the provided design input -> `ae-test-browser`.
- Verification only: `ae-test-browser`.

## Rework Loop

Browser acceptance is required for web UI changes when a runnable app or static preview is available. Use `ae-test-browser` for final acceptance, then route failures back to the smallest owning skill:

- visual/layout mismatch -> `ae-frontend-design`;
- interaction, state, route, API, or data issue -> `ae-web-app`, plus `ae-backend` or `ae-sql` when the failing contract is server-side;
- verification-only blocker -> stay in `ae-test-browser` and report the exact missing environment or command.

Run max 3 rework loops. One loop is fix -> browser regression check. After the limit, report remaining issues as residual risk instead of claiming acceptance.

## Report Format

Include this summary when the skill drives work:

```markdown
## Web Forge Routing

- Q1 existing route:
- Q2 design input:
- Q3 backend/API:
- Q4 visual baseline:
- Motion decision:
- Reduced-motion evidence:
- Selected skills:
- Browser acceptance:
- Rework loops:
- Modified files:
- Residual risks:
```

## Runtime Boundaries

- Do not claim OpenCode sub-agent registry, `@ui-*` agents, dynamic Chrome MCP registration, or slash command behavior.
- Do not require `ae:chrome-devtools`; route browser checks to `ae-test-browser`, Browser, Playwright, or available local tooling.
- Do not bypass existing repository stack, component system, auth boundary, or validation commands.
- Do not modify backend or database contracts without routing that portion through `ae-backend` or `ae-sql`.
