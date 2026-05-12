---
name: ae-web-app
description: Use when the user asks for AE web app, /ae-web-app, web frontend, React or Next app work, admin UI, dashboard, web full-stack flow, or deployment-readiness for a web product.
---

# AE Web App

Build or extend a web application using the existing repository stack and conventions.

## Workflow

1. Read `references/web-app-workflow.md`.
2. Inspect the web stack, routing, component system, state or data layer, auth boundary, and local dev commands.
3. Determine whether the task is frontend-only, backend-assisted web work, or a small full-stack web flow.
4. Define the target route, user workflow, data dependencies, and validation surface before editing.
5. When the repository uses React-compatible tooling, read `references/react-guidance.md`.
6. Implement using the existing framework and local conventions for components, styling, routing, forms, and data fetching.
7. When the task spans backend endpoints or persistence, coordinate with `ae-backend` and `ae-sql` rather than hand-waving the server side.
8. Before final signoff, read `references/deployment-readiness.md` when the work affects runtime config, routing, build output, or release readiness.
9. Run the narrowest meaningful validation, then validate the user flow in a real browser when the app depends on a dev server or client runtime.
10. Report completed behavior, validation commands, browser evidence when applicable, and unverified edges.

## Rules

- Use `ae-frontend-design` for a focused first-version UI task that does not need a broader web-app workflow.
- Use `ae-test-browser` for browser verification; do not claim acceptance without exercising the route.
- Apply React, Next.js, Vite, shadcn, Supabase, or Stripe guidance only when the repository or request actually calls for it.
- Build the real working surface first, not a marketing page, unless the user explicitly asks for a landing page.
- Keep repository edits scoped to the routes, components, hooks, services, and config touched by the requested flow.
