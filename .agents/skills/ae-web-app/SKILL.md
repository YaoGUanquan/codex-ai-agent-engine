---
name: ae-web-app
description: Use when the user asks for AE web app, /ae-web-app, web frontend implementation, React or Next app work, admin UI, dashboard, routed Web app implementation, light full-stack flow, or deployment-readiness for a web product.
---

# AE Web App

Build or extend a web application using the existing repository stack and conventions. This is the Web app implementation skill selected by `ae-web-forge` or by an explicit user request for app implementation; it is not the unified frontend/Web routing entrypoint.

## Workflow

1. Read `references/web-app-workflow.md`.
2. Inspect the web stack, routing, component system, state or data layer, auth boundary, and local dev commands.
3. Confirm the target route, user workflow, data dependencies, and validation surface before editing.
4. Determine whether the implementation is frontend-only app wiring, backend-assisted web work, or a small full-stack flow.
5. Read the framework guidance matching the repository stack: `references/react-guidance.md` for React-compatible tooling, `references/vue-guidance.md` for Vue, `references/svelte-guidance.md` for Svelte or SvelteKit, `references/angular-guidance.md` for Angular. For other stacks, follow the repository's existing conventions without inventing a new structure.
6. Implement using the existing framework and local conventions for components, styling, routing, forms, state, data fetching, and error handling.
7. When the task spans backend endpoints or persistence, coordinate with `ae-backend` and `ae-sql` rather than hand-waving the server side.
8. Before final signoff, read `references/deployment-readiness.md` when the work affects runtime config, routing, build output, or release readiness.
9. Run the narrowest meaningful validation, then validate the user flow in a real browser when the app depends on a dev server or client runtime.
10. Report completed behavior, validation commands, browser evidence when applicable, and unverified edges.

## Implementation Lane

Use this skill after `ae-web-forge` has selected the Web app lane, or when the user directly asks to implement Web app behavior.

This skill owns implementation details for:

- state, forms, API calls, auth, persistence, or error handling;
- route/component/hook/service changes inside an existing web stack;
- light full-stack flows that need frontend and backend coordination;
- build, runtime config, routing, or deployment-readiness checks.

Route broad frontend/Web intake, visual-baseline triage, design-input triage, and Q1-Q4 lane selection to `ae-web-forge`. Route focused visual-only UI work to `ae-frontend-design`. Route browser-only verification to `ae-test-browser`.

## Rules

- Preserve current route and visual behavior unless `ae-web-forge` routing notes or the user explicitly requests redesign.
- Use `ae-test-browser` for browser verification; do not claim acceptance without exercising the route when a runnable app or static preview is available.
- Apply React, Next.js, Vite, shadcn, Supabase, or Stripe guidance only when the repository or request actually calls for it.
- Build the real working surface first, not a marketing page, unless the user explicitly asks for a landing page.
- Keep repository edits scoped to the routes, components, hooks, services, and config touched by the requested flow.
- Do not claim OpenCode sub-agent registry, automatic `@ui-*` agents, dynamic MCP registration, or slash-command enforcement.
