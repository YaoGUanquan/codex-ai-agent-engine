---
name: ae-web-app
description: Use when the user asks for AE web app, /ae-web-app, web frontend, React or Next app work, admin UI, dashboard, second-development web changes, design-to-implementation routing, web full-stack flow, or deployment-readiness for a web product.
---

# AE Web App

Build or extend a web application using the existing repository stack and conventions.

## Workflow

1. Read `references/web-app-workflow.md`.
2. Inspect the web stack, routing, component system, state or data layer, auth boundary, and local dev commands.
3. Run the Four-Question Web Routing check before choosing the implementation path.
4. Determine whether the task is frontend-only, backend-assisted web work, or a small full-stack web flow.
5. Define the target route, user workflow, data dependencies, and validation surface before editing.
6. When the repository uses React-compatible tooling, read `references/react-guidance.md`.
7. Implement using the existing framework and local conventions for components, styling, routing, forms, and data fetching.
8. When the task spans backend endpoints or persistence, coordinate with `ae-backend` and `ae-sql` rather than hand-waving the server side.
9. Before final signoff, read `references/deployment-readiness.md` when the work affects runtime config, routing, build output, or release readiness.
10. Run the narrowest meaningful validation, then validate the user flow in a real browser when the app depends on a dev server or client runtime.
11. Report completed behavior, validation commands, browser evidence when applicable, and unverified edges.

## Four-Question Web Routing

Answer these before editing so the work lands in the smallest correct lane:

| Question | Meaning | Routing effect |
| --- | --- | --- |
| Q1 second-development? | Is this modifying an existing page, route, component, or user-provided file? | Yes: read the existing code and preserve current structure unless redesign is requested. |
| Q2 design input? | Is there a screenshot, Figma URL, existing design, written spec, or no design input? | No input: route focused UI creation to `ae-frontend-design`; specific input: preserve or match the visual baseline. |
| Q3 interaction or API? | Does the task need state, forms, events, API calls, auth, persistence, or error handling? | Yes: keep the task in `ae-web-app` and coordinate backend or SQL skills when server contracts change. |
| Q4 visual baseline? | For Q1=yes, should existing visual behavior be preserved or intentionally replaced? | Preserve by default; only redesign when the user asks for it or the current baseline blocks the requested behavior. |

Typical outcomes:

- New UI only, no API: use `ae-frontend-design`, then `ae-test-browser` for acceptance.
- New UI plus interaction/API: implement through `ae-web-app`, then use `ae-test-browser`.
- Existing route with logic changes: read current code, preserve the visual baseline, implement the smallest app change, then use `ae-test-browser`.
- Verification only: route directly to `ae-test-browser`.

Do not claim OpenCode sub-agent registry, automatic `@ui-*` agents, dynamic MCP registration, or slash-command enforcement. In Codex, this routing is a process contract executed with available skills and tools.

## Rules

- Use `ae-frontend-design` for focused UI design or visual implementation that does not need a broader web-app workflow.
- Use `ae-test-browser` for browser verification; do not claim acceptance without exercising the route.
- Apply React, Next.js, Vite, shadcn, Supabase, or Stripe guidance only when the repository or request actually calls for it.
- Build the real working surface first, not a marketing page, unless the user explicitly asks for a landing page.
- Keep repository edits scoped to the routes, components, hooks, services, and config touched by the requested flow.
