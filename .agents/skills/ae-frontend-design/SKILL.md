---
name: ae-frontend-design
description: Use when the user asks for AE frontend design, /ae-frontend-design, first frontend version, UI implementation, page or app prototype, dashboard, form flow, or frontend UX build with validation.
---

# AE Frontend Design

Build the first usable frontend version.

## Workflow

1. Read `references/web-ui-quality.md`.
2. Inspect the existing frontend stack, routing, design system, component library, assets, and local conventions.
3. Identify the route, user workflow, data dependencies, and adjacent screens the first usable version must support.
4. Implement the UI using existing components, icons, and patterns when available.
5. Cover expected states: empty, loading, success, error, disabled, validation errors, and destructive confirmation when relevant.
6. When the project uses React, Next.js, or Vite, follow local framework and build patterns instead of inventing a new structure.
7. When the project uses shadcn or an equivalent local component system, extend it consistently instead of bypassing it.
8. Run the project validation and browser checks when the app needs a dev server.

## Design Rules

- Build the actual usable experience, not a marketing landing page, unless requested.
- Keep operational tools dense, calm, and scannable.
- Ensure text fits containers on desktop and mobile.
- Use real assets or generated bitmap assets when the interface needs visual content.
- Preserve the existing design system and information density before adding visual novelty.
- Route broader web-app implementation work to `ae-web-app` when the task spans UI plus app wiring or deployment concerns.
