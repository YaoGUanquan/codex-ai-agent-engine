---
name: ae-frontend-design
description: Use when the user asks for AE frontend design, /ae-frontend-design, UI implementation, design input interpretation, page or app prototype, dashboard, form flow, visual baseline preservation, or frontend UX build with validation.
---

# AE Frontend Design And UI Implementation

Design and implement frontend UI surfaces using the repository's existing stack, design system, and validation path.

## Workflow

1. Read `references/web-ui-quality.md`.
2. Inspect the existing frontend stack, routing, design system, component library, assets, and local conventions.
3. Identify the route, user workflow, design input, visual baseline, data dependencies, and adjacent screens the UI must support.
4. If there is a screenshot, Figma link, existing page, or written design spec, treat it as a constraint and preserve its measurable visual baseline unless the user asks for redesign.
5. Implement the UI using existing components, icons, tokens, and patterns when available.
6. Cover expected states: empty, loading, success, error, disabled, validation errors, and destructive confirmation when relevant.
7. When the project uses React, Next.js, or Vite, follow local framework and build patterns instead of inventing a new structure.
8. When the project uses shadcn or an equivalent local component system, extend it consistently instead of bypassing it.
9. Run the project validation and browser checks when the app needs a dev server.

## Motion Decision Gate

- Before adding material motion, identify the user-relevant state, relationship, feedback signal, or task outcome it communicates. If no purpose is clear, use a static alternative.
- Default to static UI or minimal CSS state feedback. Preserve the target repository's visual baseline, component system, and existing stack before applying generic visual examples.
- Treat timeline or physics motion, exported animation assets, and 3D/data scenes as distinct, conditional choices. They are appropriate only when the target workflow needs that category of behavior or representation.
- Provide a reduced-motion or equivalent platform-respecting alternative, and keep the usable completion state available without waiting for an animation to finish.
- Do not prescribe, install, or promote a motion runtime from this workflow. Choose any dependency inside the target project only after its product need, license, performance, and existing stack have been checked.

## Design Rules

- Build the actual usable experience, not a marketing landing page, unless requested.
- Meet the accessibility baseline in `references/web-ui-quality.md`: semantic structure, labeled controls, keyboard reachability with visible focus, and readable contrast.
- Keep operational tools dense, calm, and scannable.
- Ensure text fits containers on desktop and mobile.
- Use real assets or generated bitmap assets when the interface needs visual content.
- Preserve the existing design system and information density before adding visual novelty.
- Route broader web-app implementation work to `ae-web-app` when the task spans UI plus app wiring, API interaction, second-development routing, or deployment concerns.
